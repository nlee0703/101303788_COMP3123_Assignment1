const mongoose = require('mongoose');
const config = require('./env');
const logger = require('../utils/logger');

// dbName forces the required database name even if the URI names a different one
async function connectDB() {
    await mongoose.connect(config.mongoUri, { dbName: config.dbName });
    logger.info('Connected to MongoDB', { database: config.dbName });
}

module.exports = connectDB;
