const { validationResult } = require('express-validator');
const AppError = require('../utils/AppError');
const logger = require('../utils/logger');

// Runs after the express-validator rules for a route.
// Sends 400 with a list of field errors if any rule failed.
function validate(req, res, next) {
    const result = validationResult(req);
    if (result.isEmpty()) return next();

    const errors = result.array().map((e) => ({ field: e.path, message: e.msg }));
    logger.warn('Validation failed', { method: req.method, path: req.originalUrl, errors });
    throw new AppError(400, 'Validation failed', errors);
}

// Rejects any body field that is not in the allowed list,
// e.g. a client trying to set "user" (the owner) or "_id" themselves.
function allowOnlyFields(allowed) {
    return (req, res, next) => {
        const body = req.body || {};
        const unexpected = Object.keys(body).filter((key) => !allowed.includes(key));
        if (unexpected.length > 0) {
            logger.warn('Validation failed: unexpected fields', { method: req.method, path: req.originalUrl, unexpected });
            throw new AppError(400, 'Validation failed', unexpected.map((field) => ({ field, message: `${field} is not an allowed field` })));
        }
        next();
    };
}

module.exports = { validate, allowOnlyFields };
