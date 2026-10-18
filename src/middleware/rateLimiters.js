const rateLimit = require('express-rate-limit');
const logger = require('../utils/logger');

const FIFTEEN_MINUTES = 15 * 60 * 1000;

// Shared handler so every limiter answers with the same JSON 429 response
function onLimitReached(req, res, next, options) {
    logger.warn('Rate limit exceeded', { method: req.method, path: req.originalUrl, ip: req.ip });
    res.status(options.statusCode).json({ status: false, message: options.message });
}

const common = {
    windowMs: FIFTEEN_MINUTES,
    standardHeaders: 'draft-7', // sends RateLimit-* headers so clients can see their remaining requests
    legacyHeaders: false,
    handler: onLimitReached
};

// Login: only FAILED attempts count, so a real user logging in is never blocked,
// but someone guessing passwords is stopped after 5 wrong tries.
const loginLimiter = rateLimit({
    ...common,
    limit: 5,
    skipSuccessfulRequests: true,
    message: 'Too many failed login attempts. Please try again in 15 minutes.'
});

// Signup: every attempt counts, to stop one client creating many accounts
const signupLimiter = rateLimit({
    ...common,
    limit: 10,
    message: 'Too many signup attempts. Please try again in 15 minutes.'
});

// Whole API: a looser limit so a single client cannot flood the server
const apiLimiter = rateLimit({
    ...common,
    limit: 300,
    message: 'Too many requests. Please try again later.'
});

module.exports = { loginLimiter, signupLimiter, apiLimiter };
