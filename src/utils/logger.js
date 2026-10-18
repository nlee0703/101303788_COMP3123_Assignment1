const fs = require('fs');
const path = require('path');

// Simple file logger: every entry is one JSON line in logs/app.log
// (and is also printed to the console).
const LOG_DIR = path.join(__dirname, '..', '..', 'logs');
const LOG_FILE = path.join(LOG_DIR, 'app.log');
fs.mkdirSync(LOG_DIR, { recursive: true });

// Keys whose values must never be written to a log
const SENSITIVE_KEYS = ['password', 'token', 'jwt', 'jwt_token', 'authorization', 'secret', 'mongodb_uri'];

function redact(value) {
    if (Array.isArray(value)) return value.map(redact);
    if (value && typeof value === 'object') {
        const clean = {};
        for (const [key, val] of Object.entries(value)) {
            clean[key] = SENSITIVE_KEYS.includes(key.toLowerCase()) ? '[REDACTED]' : redact(val);
        }
        return clean;
    }
    return value;
}

function write(level, message, meta = {}) {
    const entry = { timestamp: new Date().toISOString(), level, message, ...redact(meta) };
    const line = JSON.stringify(entry);
    fs.appendFile(LOG_FILE, line + '\n', () => {});
    (level === 'error' ? console.error : console.log)(line);
}

module.exports = {
    info: (message, meta) => write('info', message, meta),
    warn: (message, meta) => write('warn', message, meta),
    error: (message, meta) => write('error', message, meta)
};
