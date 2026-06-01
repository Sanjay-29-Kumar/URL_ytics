import Url from '../models/Url.js';
import Click from '../models/Click.js';

function parseUserAgent(uaString) {
  if (!uaString) return { browser: 'Direct', device: 'Desktop' };
  
  const ua = uaString.toLowerCase();
  let browser = 'Unknown';
  let device = 'Desktop';
  
  // Parse device
  if (ua.includes('ipad') || ua.includes('tablet')) {
    device = 'Tablet';
  } else if (ua.includes('mobile') || ua.includes('iphone') || ua.includes('android')) {
    device = 'Mobile';
  }
  
  // Parse browser
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

export const handleRedirect = async (req, res) => {
  const { shortCode } = req.params;

  try {
    const urlEntry = await Url.findOne({ shortCode });

    if (!urlEntry) {
      // If short URL not found, redirect to landing page with error parameter
      return res.redirect('/?error=not_found');
    }

    // Parse analytics details
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
    
    // Referrer header parsing
    let referrer = req.get('Referrer') || req.get('Referer') || 'Direct';
    if (referrer !== 'Direct') {
      try {
        const urlObj = new URL(referrer);
        referrer = urlObj.hostname; // Save domain name only
      } catch (e) {
        // ignore, use string as-is
      }
    }

    const userAgent = req.get('User-Agent');
    const { browser, device } = parseUserAgent(userAgent);

    // Logging click in the background (non-blocking)
    const logClick = async () => {
      try {
        const newClick = new Click({
          urlId: urlEntry._id,
          ip,
          referrer,
          userAgent: userAgent || 'unknown',
          device,
          browser
        });
        await newClick.save();

        urlEntry.clicksCount = (urlEntry.clicksCount || 0) + 1;
        await urlEntry.save();
      } catch (error) {
        console.error('Failed to log click analytics:', error);
      }
    };
    
    logClick();

    // Redirect client to long URL
    return res.redirect(urlEntry.longUrl);
  } catch (error) {
    console.error('Redirect controller error:', error);
    return res.redirect('/?error=server_error');
  }
};
