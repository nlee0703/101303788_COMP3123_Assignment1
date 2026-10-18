const express = require('express');
const helmet = require('helmet');
const mongoose = require('mongoose');

const userRoutes = require('./routes/userRoutes');
const employeeRoutes = require('./routes/employeeRoutes');
const requestLogger = require('./middleware/requestLogger');
const { apiLimiter } = require('./middleware/rateLimiters');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();

// Security headers (Content-Security-Policy, X-Frame-Options, HSTS, nosniff, etc.)
app.use(helmet());
// Do not advertise that the server runs Express
app.disable('x-powered-by');

// Parse JSON bodies, with a size limit to reject oversized payloads
app.use(express.json({ limit: '10kb' }));

app.use(requestLogger);

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
