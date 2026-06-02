import Url from '../models/Url.js';
import Click from '../models/Click.js';
import bcrypt from 'bcryptjs';

function parseUserAgent(uaString) {
  if (!uaString) return { browser: 'Direct', device: 'Desktop' };
  
  const ua = uaString.toLowerCase();
  let browser = 'Unknown';
  let device = 'Desktop';
  
  if (ua.includes('ipad') || ua.includes('tablet')) {
    device = 'Tablet';
  } else if (ua.includes('mobile') || ua.includes('iphone') || ua.includes('android')) {
    device = 'Mobile';
  }
  
  if (ua.includes('edg/')) {
    browser = 'Edge';
  } else if (ua.includes('chrome') && !ua.includes('chromium')) {
    browser = 'Chrome';
  } else if (ua.includes('safari') && !ua.includes('chrome')) {
    browser = 'Safari';
  } else if (ua.includes('firefox')) {
    browser = 'Firefox';
  } else if (ua.includes('opera') || ua.includes('opr/')) {
    browser = 'Opera';
  } else if (ua.includes('msie') || ua.includes('trident/')) {
    browser = 'IE';
  }
  
  return { browser, device };
}

// Resolve geo-location from IP using ip-api.com (free, no key needed)
async function resolveGeo(ip) {
  try {
    // Skip for localhost/private IPs
    if (!ip || ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168') || ip.startsWith('10.')) {
      return { country: 'Local', city: 'Local' };
    }
    const response = await fetch(`http://ip-api.com/json/${ip}?fields=country,city,status`, {
      signal: AbortSignal.timeout(3000) // 3s timeout
    });
    const data = await response.json();
    if (data.status === 'success') {
      return { country: data.country || 'Unknown', city: data.city || 'Unknown' };
    }
  } catch {
    // Silently fail — geo is non-critical
  }
  return { country: 'Unknown', city: 'Unknown' };
}

export const handleRedirect = async (req, res) => {
  const { shortCode } = req.params;

  try {
    const urlEntry = await Url.findOne({ shortCode });

    if (!urlEntry) {
      return res.redirect('/?error=not_found');
    }

    // Check if link is disabled (isActive: false explicitly — undefined/null treated as active)
    if (urlEntry.isActive === false) {
      return res.redirect('/?error=link_disabled');
    }

    // Check if link has expired
    if (urlEntry.expiresAt && new Date() > urlEntry.expiresAt) {
      return res.redirect('/?error=link_expired');
    }

    // Check if link is password-protected
    if (urlEntry.password) {
      return res.redirect(`/?unlock=${shortCode}`);
    }

    // Log click and redirect
    await logAndRedirect(req, res, urlEntry);
  } catch (error) {
    console.error('Redirect controller error:', error);
    return res.redirect('/?error=server_error');
  }
};

// POST /r/:shortCode/unlock — verify password and redirect
export const handlePasswordUnlock = async (req, res) => {
  const { shortCode } = req.params;
  const { password } = req.body;

  try {
    const urlEntry = await Url.findOne({ shortCode });

    if (!urlEntry) {
      return res.status(404).json({ error: 'Link not found' });
    }

    if (!urlEntry.isActive) {
      return res.status(403).json({ error: 'This link is disabled' });
    }

    if (urlEntry.expiresAt && new Date() > urlEntry.expiresAt) {
      return res.status(403).json({ error: 'This link has expired' });
    }

    if (!urlEntry.password) {
      // No password needed — just return the URL
      return res.json({ longUrl: urlEntry.longUrl });
    }

    const isMatch = await bcrypt.compare(password || '', urlEntry.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Incorrect password' });
    }

    // Log the click in background after successful unlock
    const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.socket.remoteAddress || '127.0.0.1';
    const { country, city } = await resolveGeo(ip);
    let referrer = req.get('Referrer') || req.get('Referer') || 'Direct';
    if (referrer !== 'Direct') {
      try { referrer = new URL(referrer).hostname; } catch { /* ignore */ }
    }
    const { browser, device } = parseUserAgent(req.get('User-Agent'));

    (async () => {
      try {
        await new Click({ urlId: urlEntry._id, ip, referrer, userAgent: req.get('User-Agent') || 'unknown', device, browser, country, city }).save();
        urlEntry.clicksCount = (urlEntry.clicksCount || 0) + 1;
        await urlEntry.save();
      } catch (err) { console.error('Failed to log click:', err); }
    })();

    return res.json({ longUrl: urlEntry.longUrl });
  } catch (error) {
    console.error('Password unlock error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
};

async function logAndRedirect(req, res, urlEntry) {
  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.socket.remoteAddress || '127.0.0.1';

  let referrer = req.get('Referrer') || req.get('Referer') || 'Direct';
  if (referrer !== 'Direct') {
    try {
      referrer = new URL(referrer).hostname;
    } catch { /* ignore */ }
  }

  const userAgent = req.get('User-Agent');
  const { browser, device } = parseUserAgent(userAgent);

  // Non-blocking: log click + geo in background
  (async () => {
    try {
      const { country, city } = await resolveGeo(ip);
      await new Click({
        urlId: urlEntry._id,
        ip,
        referrer,
        userAgent: userAgent || 'unknown',
        device,
        browser,
        country,
        city
      }).save();
      urlEntry.clicksCount = (urlEntry.clicksCount || 0) + 1;
      await urlEntry.save();
    } catch (error) {
      console.error('Failed to log click analytics:', error);
    }
  })();

  return res.redirect(urlEntry.longUrl);
}
