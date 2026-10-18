// Reads configuration from environment variables (loaded from .env by `npm start`,
// or from the project settings on Vercel). The app never runs with an insecure
// default when a required secret is missing.

const required = ['MONGODB_URI', 'JWT_SECRET'];
const missing = required.filter((key) => !process.env[key]);
if (missing.length > 0) {
    console.error(`Missing required environment variables: ${missing.join(', ')}. See .env.example.`);
    // Locally, stop immediately. On Vercel, keep running so every request can answer
    // with a clear 500 error naming the missing variables (see src/app.js).
    if (!process.env.VERCEL) process.exit(1);
}

module.exports = {
    missing,
    port: Number(process.env.PORT) || 3000,
    mongoUri: process.env.MONGODB_URI,
    dbName: 'comp3123_assignment1',
    jwtSecret: process.env.JWT_SECRET,
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1h'
};
