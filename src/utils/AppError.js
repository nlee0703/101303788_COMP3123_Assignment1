// An error with an HTTP status code. Thrown from controllers/middleware and
// turned into a JSON response by the central error handler.
class AppError extends Error {
    constructor(statusCode, message, errors) {
        super(message);
        this.statusCode = statusCode;
        if (errors) this.errors = errors;
    }
}

module.exports = AppError;
