const mongoose = require('mongoose');
const config = require('./env');
const logger = require('../utils/logger');

// The connection is created once and reused. On Vercel the app can be started
// fresh for a request, so every request calls connectDB() and simply waits for
// the existing connection if there already is one.
let connecting = null;

function connectDB() {
    if (mongoose.connection.readyState === 1) return Promise.resolve();
    if (!connecting) {
        // dbName forces the required database name even if the URI names a different one
        connecting = mongoose.connect(config.mongoUri, { dbName: config.dbName })
            .then(() => logger.info('Connected to MongoDB', { database: config.dbName }))
            .catch((err) => {
                connecting = null; // allow the next request to try again
                throw err;
            });
    }
    return connecting;
}

module.exports = connectDB;
