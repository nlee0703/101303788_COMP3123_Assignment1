const jwt = require('jsonwebtoken');
const config = require('../config/env');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const logger = require('../utils/logger');

// Protects a route: requires "Authorization: Bearer <token>".
// On success, req.user holds the logged-in user's id and username, taken from
// the verified token. Routes use req.user.id as the owner, never a client-sent id.
async function authenticate(req, res, next) {
    const header = req.headers.authorization || '';
    const [scheme, token] = header.split(' ');

    if (scheme !== 'Bearer' || !token) {
        logger.warn('Auth failed: missing token', { method: req.method, path: req.originalUrl, ip: req.ip });
        throw new AppError(401, 'Authentication required. Send a token in the Authorization header as "Bearer <token>".');
    }

    let payload;
    try {
        payload = jwt.verify(token, config.jwtSecret);
    } catch (err) {
        const expired = err.name === 'TokenExpiredError';
        logger.warn(`Auth failed: ${expired ? 'expired' : 'invalid'} token`, { method: req.method, path: req.originalUrl, ip: req.ip });
        throw new AppError(401, expired ? 'Token has expired. Please log in again.' : 'Invalid token.');
    }

    // Make sure the account still exists (e.g. it was not deleted after the token was issued)
    const user = await User.findById(payload.sub);
    if (!user) {
        logger.warn('Auth failed: user in token no longer exists', { path: req.originalUrl });
        throw new AppError(401, 'Invalid token.');
    }

    req.user = { id: user._id.toString(), username: user.username };
    next();
}

module.exports = authenticate;
