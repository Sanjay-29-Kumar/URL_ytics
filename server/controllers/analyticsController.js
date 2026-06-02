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

    const devices = {};
    const browsers = {};
    const referrers = {};
    const countries = {};
    const dailyClicks = {};

    // Initialize last 15 days
    for (let i = 14; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      dailyClicks[d.toISOString().split('T')[0]] = 0;
    }

    clicks.forEach(click => {
      if (click.device) devices[click.device] = (devices[click.device] || 0) + 1;
      if (click.browser) browsers[click.browser] = (browsers[click.browser] || 0) + 1;
      if (click.referrer) referrers[click.referrer] = (referrers[click.referrer] || 0) + 1;
      if (click.country) countries[click.country] = (countries[click.country] || 0) + 1;

      if (click.timestamp) {
        const clickDate = new Date(click.timestamp).toISOString().split('T')[0];
        dailyClicks[clickDate] = (dailyClicks[clickDate] || 0) + 1;
      }
    });

    const clickHistory = Object.keys(dailyClicks)
      .sort()
      .map(date => ({ date, count: dailyClicks[date] }));

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
        countries,
        clickHistory,
        recentVisits
      }
    });
  } catch (error) {
    console.error('Get URL analytics error:', error);
    res.status(500).json({ error: 'Failed to retrieve analytics' });
  }
};

// GET /api/urls/:id/analytics/export?format=csv
export const exportAnalytics = async (req, res) => {
  const urlId = req.params.id;

  try {
    const url = await Url.findById(urlId);
    if (!url || url.userId.toString() !== req.user.id) {
      return res.status(404).json({ error: 'URL not found or unauthorized' });
    }

    const clicks = await Click.find({ urlId: url._id }).sort({ timestamp: -1 });

    // Build CSV
    const headers = ['Timestamp', 'Referrer', 'Device', 'Browser', 'Country', 'City', 'IP'];
    const rows = clicks.map(c => [
      new Date(c.timestamp).toISOString(),
      c.referrer || 'Direct',
      c.device || 'Unknown',
      c.browser || 'Unknown',
      c.country || 'Unknown',
      c.city || 'Unknown',
      c.ip || 'Unknown'
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const filename = `urlytics-${url.shortCode}-analytics.csv`;
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.send(csvContent);
  } catch (error) {
    console.error('Export analytics error:', error);
    res.status(500).json({ error: 'Failed to export analytics' });
  }
};
