const AppError = require('../utils/AppError');
const logger = require('../utils/logger');

// For routes that do not exist
function notFound(req, res, next) {
    next(new AppError(404, `Route not found: ${req.method} ${req.originalUrl}`));
}

// Central error handler: every error ends up here and is returned as JSON.
// Stack traces and internal details are only logged, never sent to the client.
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
    let status = err.statusCode || 500;
    let message = err.message;
    let errors = err.errors && err instanceof AppError ? err.errors : undefined;

    if (err.type === 'entity.parse.failed') {
        // Body was not valid JSON
        status = 400;
        message = 'Malformed JSON in request body';
    } else if (err.name === 'CastError') {
        status = 400;
        message = `Invalid value for ${err.path}`;
    } else if (err.name === 'ValidationError') {
        status = 400;
        message = 'Validation failed';
        errors = Object.values(err.errors).map((e) => ({ field: e.path, message: e.message }));
    } else if (err.code === 11000) {
        // MongoDB duplicate key, e.g. username or email already taken
        status = 409;
        const field = Object.keys(err.keyValue || {})[0] || 'value';
        message = `A user with this ${field} already exists`;
    } else if (!(err instanceof AppError) && status === 500) {
        message = 'Internal server error';
    }

    if (status >= 500) {
        logger.error('Unhandled error', { method: req.method, path: req.originalUrl, error: err.message, stack: err.stack });
    }

    const body = { status: false, message };
    if (errors) body.errors = errors;
    res.status(status).json(body);
}

module.exports = { notFound, errorHandler };
