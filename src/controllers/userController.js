const jwt = require('jsonwebtoken');
const config = require('../config/env');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const logger = require('../utils/logger');

// POST /api/v1/user/signup
async function signup(req, res) {
    const { username, email, password } = req.body;

    // Check first so the client gets a clear 409; the unique index still
    // catches the rare case of two signups racing each other.
    const existing = await User.findOne({ $or: [{ username }, { email }] });
    if (existing) {
        const field = existing.username === username ? 'username' : 'email';
        logger.warn('Signup rejected: duplicate', { field });
        throw new AppError(409, `A user with this ${field} already exists`);
    }

    const user = await User.create({ username, email, password });
    logger.info('User signed up', { user_id: user._id.toString(), username });

    res.status(201).json({
        status: true,
        message: 'User created successfully.',
        user_id: user._id,
        user: { username: user.username, email: user.email, created_at: user.created_at }
    });
}

// POST /api/v1/user/login  (username + password OR email + password)
async function login(req, res) {
    const { username, email, password } = req.body;
    const filter = username ? { username } : { email };

    // password has select:false on the schema, so it must be requested explicitly here
    const user = await User.findOne(filter).select('+password');
    const valid = user && (await user.comparePassword(password));

    if (!valid) {
        // Same message whether the user exists or not, so attackers cannot discover usernames
        logger.warn('Login failed', { login_with: username ? 'username' : 'email', username, email });
        throw new AppError(401, 'Invalid username/email or password');
    }

    const token = jwt.sign({ sub: user._id.toString(), username: user.username }, config.jwtSecret, {
        expiresIn: config.jwtExpiresIn
    });
    logger.info('Login successful', { user_id: user._id.toString(), username: user.username });

    res.status(200).json({
        status: true,
        message: 'Login successful.',
        jwt_token: token,
        token_type: 'Bearer',
        expires_in: config.jwtExpiresIn
    });
}

module.exports = { signup, login };
