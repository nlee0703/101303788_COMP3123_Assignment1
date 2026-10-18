const logger = require('../utils/logger');

// Logs every request once its response has been sent: method, path, status and time taken.
// The body and headers are not logged, so passwords and tokens never reach the log.
function requestLogger(req, res, next) {
    const start = Date.now();
    res.on('finish', () => {
        logger.info('Request', {
            method: req.method,
            path: req.originalUrl,
            status: res.statusCode,
            duration_ms: Date.now() - start,
            user_id: req.user ? req.user.id : undefined
        });
    });
    next();
}

module.exports = requestLogger;
