import Url from '../models/Url.js';
import Click from '../models/Click.js';

export const listUrls = async (req, res) => {
  try {
    const urls = await Url.find({ userId: req.user.id });
    res.json(urls);
  } catch (error) {
    console.error('List URLs error:', error);
    res.status(500).json({ error: 'Failed to list URLs' });
  }
};

export const createUrl = async (req, res) => {
  const { longUrl, shortCode, title } = req.body;
  if (!longUrl) {
    return res.status(400).json({ error: 'longUrl is required' });
  }

  try {
    let code = shortCode;
    if (code) {
      // Sanitize shortCode
      code = code.trim().replace(/[^a-zA-Z0-9_-]/g, '');
      if (code.length < 3) {
        return res.status(400).json({ error: 'Custom short code must be at least 3 characters long' });
      }

      // Check uniqueness
      const existing = await Url.findOne({ shortCode: code });
      if (existing) {
        return res.status(400).json({ error: 'This short code is already in use' });
      }
    } else {
      // Generate a random short code
      let tries = 0;
      let isUnique = false;
      while (tries < 10 && !isUnique) {
        code = Math.random().toString(36).substring(2, 8); // 6 chars
        const existing = await Url.findOne({ shortCode: code });
        if (!existing) {
          isUnique = true;
        }
        tries++;
      }
      if (!isUnique) {
        return res.status(500).json({ error: 'Failed to generate a unique short code' });
      }
    }

    const newUrl = new Url({
      userId: req.user.id,
      longUrl,
      shortCode: code,
      title: title || longUrl,
      clicksCount: 0
    });
    
    await newUrl.save();
    res.status(201).json(newUrl);
  } catch (error) {
    console.error('Create URL error:', error);
    res.status(500).json({ error: 'Failed to create URL' });
  }
};

export const deleteUrl = async (req, res) => {
  try {
    const url = await Url.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!url) {
      return res.status(404).json({ error: 'URL not found or unauthorized' });
    }

    // Delete associated clicks
    await Click.deleteMany({ urlId: url._id });

    res.json({ message: 'URL deleted successfully' });
  } catch (error) {
    console.error('Delete URL error:', error);
    res.status(500).json({ error: 'Failed to delete URL' });
  }
};
