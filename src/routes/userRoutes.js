const express = require('express');
const { signup, login } = require('../controllers/userController');
const { signupRules, loginRules } = require('../validators/userValidators');
const { authLimiter } = require('../middleware/rateLimiters');

const router = express.Router();

// Rate limiter runs first, so blocked clients are rejected before any validation or database work
router.post('/signup', authLimiter, signupRules, signup);
router.post('/login', authLimiter, loginRules, login);

module.exports = router;
