const rateLimit = require('express-rate-limit');
const logger = require('../utils/logger');

// Shared handler so every limiter answers with the same JSON 429 response
function onLimitReached(req, res, next, options) {
    logger.warn('Rate limit exceeded', { method: req.method, path: req.originalUrl, ip: req.ip });
    res.status(options.statusCode).json({ status: false, message: options.message });
}

// Strict limit for signup and login, to slow down password guessing and spam accounts
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 5,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: 'Too many attempts. Please try again in 15 minutes.',
    handler: onLimitReached
});

// Looser limit for the whole API, to stop a single client from flooding the server
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 100,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: 'Too many requests. Please try again later.',
    handler: onLimitReached
});

module.exports = { authLimiter, apiLimiter };
