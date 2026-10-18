// Reads configuration from environment variables (loaded from .env by `npm start`).
// The app refuses to start if a required secret is missing, instead of
// silently running with an insecure default.

const required = ['MONGODB_URI', 'JWT_SECRET'];
const missing = required.filter((key) => !process.env[key]);
if (missing.length > 0) {
    console.error(`Missing required environment variables: ${missing.join(', ')}. See .env.example.`);
    process.exit(1);
}

module.exports = {
    port: Number(process.env.PORT) || 3000,
    mongoUri: process.env.MONGODB_URI,
    dbName: 'comp3123_assignment1',
    jwtSecret: process.env.JWT_SECRET,
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1h'
};
