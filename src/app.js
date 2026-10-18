const express = require('express');
const helmet = require('helmet');
const mongoose = require('mongoose');

const config = require('./config/env');
const connectDB = require('./config/db');
const logger = require('./utils/logger');
const userRoutes = require('./routes/userRoutes');
const employeeRoutes = require('./routes/employeeRoutes');
const requestLogger = require('./middleware/requestLogger');
const { apiLimiter } = require('./middleware/rateLimiters');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();

// On Vercel, requests arrive through Vercel's proxy. Trusting it lets req.ip be the
// real client IP, so rate limits apply per client instead of to everyone at once.
if (process.env.VERCEL) app.set('trust proxy', 1);

// Security headers (Content-Security-Policy, X-Frame-Options, HSTS, nosniff, etc.)
app.use(helmet());
// Do not advertise that the server runs Express
app.disable('x-powered-by');

// Parse JSON bodies, with a size limit to reject oversized payloads
app.use(express.json({ limit: '10kb' }));

app.use(requestLogger);

// Server not configured (only possible on Vercel): answer every request with a clear error.
// Only the variable names are shown, never any values.
app.use((req, res, next) => {
    if (config.missing.length === 0) return next();
    res.status(500).json({
        status: false,
        message: `Server is not configured. Missing environment variables: ${config.missing.join(', ')}`
    });
});

// Make sure the database is connected before handling the request.
// If it cannot connect, the request continues: /health reports the database as
// disconnected and other routes fail with a 500 through the error handler.
app.use(async (req, res, next) => {
    try {
        await connectDB();
    } catch (err) {
        logger.error('Database connection failed', { error: err.message });
    }
    next();
});

// Health check: is the server up, and is the database connected?
app.get('/health', (req, res) => {
    const dbConnected = mongoose.connection.readyState === 1;
    res.status(dbConnected ? 200 : 503).json({
        status: dbConnected,
        message: dbConnected ? 'Server is healthy' : 'Server is running but the database is not connected',
        database: dbConnected ? 'connected' : 'disconnected',
        uptime_seconds: Math.round(process.uptime()),
        timestamp: new Date().toISOString()
    });
});

app.use('/api', apiLimiter);
app.use('/api/v1/user', userRoutes);
app.use('/api/v1/emp', employeeRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
