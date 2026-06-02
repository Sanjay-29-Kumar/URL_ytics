/**
 * In-memory rate limiter middleware.
 * Tracks requests per IP in a Map that auto-clears every window period.
 */

const createRateLimiter = ({ windowMs, max, message }) => {
  const ipMap = new Map(); // ip -> { count, resetAt }

  // Periodically clear expired entries to avoid memory leaks
  setInterval(() => {
    const now = Date.now();
    for (const [ip, data] of ipMap.entries()) {
      if (now > data.resetAt) ipMap.delete(ip);
    }
  }, windowMs);

  return (req, res, next) => {
    const ip =
      (req.headers['x-forwarded-for'] || '').split(',')[0].trim() ||
      req.socket.remoteAddress ||
      'unknown';

    const now = Date.now();
    const entry = ipMap.get(ip);

    if (!entry || now > entry.resetAt) {
      // First request in this window
      ipMap.set(ip, { count: 1, resetAt: now + windowMs });
      return next();
    }

    entry.count += 1;

    if (entry.count > max) {
      const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
      res.set('Retry-After', retryAfter);
      return res.status(429).json({
        error: message || 'Too many requests. Please slow down.',
        retryAfter
      });
    }

    next();
  };
};

// 30 requests per minute for short-URL redirects
export const redirectRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 30,
  message: 'Too many redirect requests. Please try again in a minute.'
});

// 100 requests per minute for API routes
export const apiRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 100,
  message: 'Too many API requests. Please slow down.'
});
