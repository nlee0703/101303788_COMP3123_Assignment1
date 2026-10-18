const express = require('express');
const { signup, login } = require('../controllers/userController');
const { signupRules, loginRules } = require('../validators/userValidators');
const { signupLimiter, loginLimiter } = require('../middleware/rateLimiters');

const router = express.Router();

// Rate limiter runs first, so blocked clients are rejected before any validation or database work
router.post('/signup', signupLimiter, signupRules, signup);
router.post('/login', loginLimiter, loginRules, login);

module.exports = router;
