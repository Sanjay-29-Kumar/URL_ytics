import Url from '../models/Url.js';
import Click from '../models/Click.js';
import bcrypt from 'bcryptjs';

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
  const { longUrl, shortCode, title, expiresAt, password } = req.body;
  if (!longUrl) {
    return res.status(400).json({ error: 'longUrl is required' });
  }

  // Validate expiresAt if provided
  let expiry = null;
  if (expiresAt) {
    expiry = new Date(expiresAt);
    if (isNaN(expiry.getTime())) {
      return res.status(400).json({ error: 'Invalid expiration date format' });
    }
    if (expiry <= new Date()) {
      return res.status(400).json({ error: 'Expiration date must be in the future' });
    }
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

    // Hash password if provided
    let hashedPassword = null;
    if (password && password.trim()) {
      hashedPassword = await bcrypt.hash(password.trim(), 10);
    }

    const newUrl = new Url({
      userId: req.user.id,
      longUrl,
      shortCode: code,
      title: title || longUrl,
      clicksCount: 0,
      expiresAt: expiry,
      isActive: true,
      password: hashedPassword
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

export const updateUrl = async (req, res) => {
  const { title, longUrl, expiresAt, password, isActive } = req.body;

  try {
    const url = await Url.findOne({ _id: req.params.id, userId: req.user.id });
    if (!url) {
      return res.status(404).json({ error: 'URL not found or unauthorized' });
    }

    // Update fields if provided
    if (title !== undefined) url.title = title;
    if (longUrl !== undefined) url.longUrl = longUrl;
    if (isActive !== undefined) url.isActive = Boolean(isActive);

    // Handle expiresAt: allow null to clear expiration
    if (expiresAt !== undefined) {
      if (expiresAt === null || expiresAt === '') {
        url.expiresAt = null;
      } else {
        const expiry = new Date(expiresAt);
        if (isNaN(expiry.getTime())) {
          return res.status(400).json({ error: 'Invalid expiration date format' });
        }
        url.expiresAt = expiry;
      }
    }

    // Handle password: '' or null = remove, otherwise hash new password
    if (password !== undefined) {
      if (password === null || password === '') {
        url.password = null;
      } else {
        url.password = await bcrypt.hash(password.trim(), 10);
      }
    }

    await url.save();
    res.json(url);
  } catch (error) {
    console.error('Update URL error:', error);
    res.status(500).json({ error: 'Failed to update URL' });
  }
};
