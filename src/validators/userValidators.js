const { body } = require('express-validator');
const { allowOnlyFields, validate } = require('../middleware/validate');

const signupRules = [
    allowOnlyFields(['username', 'email', 'password']),
    body('username')
        .exists({ values: 'falsy' }).withMessage('username is required').bail()
        .isString().withMessage('username must be a string').bail()
        .trim()
        .isLength({ min: 3, max: 30 }).withMessage('username must be 3 to 30 characters')
        .matches(/^[A-Za-z0-9_.-]+$/).withMessage('username may only contain letters, numbers, _ . and -'),
    body('email')
        .exists({ values: 'falsy' }).withMessage('email is required').bail()
        .isString().withMessage('email must be a string').bail()
        .trim()
        .isEmail().withMessage('email must be a valid email address')
        .normalizeEmail({ gmail_remove_dots: false }),
    body('password')
        .exists({ values: 'falsy' }).withMessage('password is required').bail()
        .isString().withMessage('password must be a string').bail()
        .isLength({ min: 8, max: 64 }).withMessage('password must be 8 to 64 characters')
        .matches(/[a-z]/).withMessage('password must contain a lowercase letter')
        .matches(/[A-Z]/).withMessage('password must contain an uppercase letter')
        .matches(/[0-9]/).withMessage('password must contain a number'),
    validate
];

// Login accepts EITHER username OR email, plus the password
const loginRules = [
    allowOnlyFields(['username', 'email', 'password']),
    body().custom((value) => {
        if (!value || (!value.username && !value.email)) {
            throw new Error('username or email is required');
        }
        return true;
    }),
    body('username').optional().isString().withMessage('username must be a string').trim(),
    body('email').optional().isString().withMessage('email must be a string').trim()
        .isEmail().withMessage('email must be a valid email address')
        .normalizeEmail({ gmail_remove_dots: false }),
    body('password')
        .exists({ values: 'falsy' }).withMessage('password is required').bail()
        .isString().withMessage('password must be a string'),
    validate
];

module.exports = { signupRules, loginRules };
