import Url from '../models/Url.js';
import Click from '../models/Click.js';

export const getUrlAnalytics = async (req, res) => {
  const urlId = req.params.id;

  try {
    const url = await Url.findById(urlId);
    if (!url || url.userId.toString() !== req.user.id) {
      return res.status(404).json({ error: 'URL not found or unauthorized' });
    }

    const clicks = await Click.find({ urlId: url._id });

    // Group analytics
    const devices = {};
    const browsers = {};
    const referrers = {};
    const dailyClicks = {}; // Key: YYYY-MM-DD

    // Initialize the last 7 days in dailyClicks to ensure data points
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      dailyClicks[dateStr] = 0;
    }

    clicks.forEach(click => {
      // Devices
      if (click.device) {
        devices[click.device] = (devices[click.device] || 0) + 1;
      }
      
      // Browsers
      if (click.browser) {
        browsers[click.browser] = (browsers[click.browser] || 0) + 1;
      }
      
      // Referrers
      if (click.referrer) {
        referrers[click.referrer] = (referrers[click.referrer] || 0) + 1;
      }
      
      // Daily clicks (only matching last 7 days, but can count older as well)
      if (click.timestamp) {
        const clickDate = new Date(click.timestamp).toISOString().split('T')[0];
        if (dailyClicks[clickDate] !== undefined) {
          dailyClicks[clickDate] += 1;
        } else {
          dailyClicks[clickDate] = 1; // Catch-all for older dates
        }
      }
    });

    // Convert daily clicks to sorted array of objects
    const clickHistory = Object.keys(dailyClicks)
      .sort()
      .map(date => ({ date, count: dailyClicks[date] }));

    // Sort and limit recent visits to the last 20
    const recentVisits = [...clicks]
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 20);

    res.json({
      url,
      totalClicks: clicks.length,
      analytics: {
        devices,
        browsers,
        referrers,
        clickHistory,
        recentVisits
      }
    });
  } catch (error) {
    console.error('Get URL analytics error:', error);
    res.status(500).json({ error: 'Failed to retrieve analytics' });
  }
};
