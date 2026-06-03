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

export const bulkCreateUrls = async (req, res) => {
  const { urls } = req.body;
  if (!urls || !Array.isArray(urls)) {
    return res.status(400).json({ error: 'urls must be an array' });
  }

  const results = [];
  const processedCodes = new Set();

  for (let i = 0; i < urls.length; i++) {
    const row = urls[i];
    const { destinationUrl, title, customAlias, expiresAt, password } = row;
    const rowIndex = i + 1; // 1-based index for rows

    const longUrl = destinationUrl ? destinationUrl.trim() : null;

    if (!longUrl) {
      results.push({ row: rowIndex, success: false, error: 'destinationUrl is required' });
      continue;
    }

    // Basic URL validation
    try {
      new URL(longUrl);
    } catch (err) {
      results.push({ row: rowIndex, success: false, error: 'destinationUrl is not a valid URL format' });
      continue;
    }

    // Validate expiresAt if provided
    let expiry = null;
    if (expiresAt) {
      expiry = new Date(expiresAt);
      if (isNaN(expiry.getTime())) {
        results.push({ row: rowIndex, success: false, error: 'Invalid expiration date format' });
        continue;
      }
      if (expiry <= new Date()) {
        results.push({ row: rowIndex, success: false, error: 'Expiration date must be in the future' });
        continue;
      }
    }

    try {
      let code = customAlias;
      if (code) {
        // Sanitize shortCode
        code = code.trim().replace(/[^a-zA-Z0-9_-]/g, '');
        if (code.length < 3) {
          results.push({ row: rowIndex, success: false, error: 'Custom alias must be at least 3 characters long' });
          continue;
        }

        // Check uniqueness in batch
        if (processedCodes.has(code)) {
          results.push({ row: rowIndex, success: false, error: `Custom alias "${code}" is duplicated in this batch` });
          continue;
        }

        // Check uniqueness in database
        const existing = await Url.findOne({ shortCode: code });
        if (existing) {
          results.push({ row: rowIndex, success: false, error: `Custom alias "${code}" is already in use` });
          continue;
        }
      } else {
        // Generate a random short code
        let tries = 0;
        let isUnique = false;
        while (tries < 10 && !isUnique) {
          code = Math.random().toString(36).substring(2, 8); // 6 chars
          if (!processedCodes.has(code)) {
            const existing = await Url.findOne({ shortCode: code });
            if (!existing) {
              isUnique = true;
            }
          }
          tries++;
        }
        if (!isUnique) {
          results.push({ row: rowIndex, success: false, error: 'Failed to generate a unique short code' });
          continue;
        }
      }

      processedCodes.add(code);

      // Hash password if provided
      let hashedPassword = null;
      if (password && password.toString().trim()) {
        hashedPassword = await bcrypt.hash(password.toString().trim(), 10);
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
      results.push({ row: rowIndex, success: true, url: newUrl });
    } catch (error) {
      console.error(`Bulk create URL error on row ${rowIndex}:`, error);
      results.push({ row: rowIndex, success: false, error: error.message || 'Failed to save URL' });
    }
  }

  const successList = results.filter(r => r.success).map(r => r.url);
  const failureList = results.filter(r => !r.success).map(r => ({ row: r.row, error: r.error }));

  res.status(201).json({
    successCount: successList.length,
    failedCount: failureList.length,
    urls: successList,
    errors: failureList
  });
};
