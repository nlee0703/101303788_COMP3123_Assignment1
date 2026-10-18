const config = require('./src/config/env');
const connectDB = require('./src/config/db');
const app = require('./src/app');
const logger = require('./src/utils/logger');

// On Vercel the platform runs the exported app itself, so no port is opened here
if (process.env.VERCEL) {
    module.exports = app;
} else {
    start();
}

async function start() {
    try {
        await connectDB();
        app.listen(config.port, () => {
            logger.info('Server started', { port: config.port, url: `http://localhost:${config.port}` });
        });
    } catch (err) {
        // Only the error message is logged: the connection string (with its password) is never printed
        logger.error('Failed to start server', { error: err.message });
        process.exit(1);
    }
}
