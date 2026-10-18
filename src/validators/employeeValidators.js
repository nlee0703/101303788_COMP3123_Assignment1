const { body, param, query } = require('express-validator');
const { allowOnlyFields, validate } = require('../middleware/validate');

const EMPLOYEE_FIELDS = ['first_name', 'last_name', 'email', 'position', 'salary', 'date_of_joining', 'department'];

// Builds the rules for each employee field. On create every field is required;
// on update each field is optional, but any field that is sent must still be valid.
function employeeFieldRules(isUpdate) {
    // salary uses 'null' so that 0 gets the "must be positive" message instead of "is required"
    const field = (name) => (isUpdate
        ? body(name).optional()
        : body(name).exists({ values: name === 'salary' ? 'null' : 'falsy' }).withMessage(`${name} is required`).bail());

    const text = (name, max) => field(name)
        .isString().withMessage(`${name} must be a string`).bail()
        .trim()
        .isLength({ min: 1, max }).withMessage(`${name} must be 1 to ${max} characters`);

    return [
        text('first_name', 50),
        text('last_name', 50),
        field('email')
            .isString().withMessage('email must be a string').bail()
            .trim()
            .isEmail().withMessage('email must be a valid email address')
            .normalizeEmail({ gmail_remove_dots: false }),
        text('position', 100),
        field('salary')
            .isFloat({ gt: 0 }).withMessage('salary must be a positive number')
            .toFloat(),
        field('date_of_joining')
            .isISO8601({ strict: true }).withMessage('date_of_joining must be a valid date (YYYY-MM-DD)')
            .toDate(),
        text('department', 100)
    ];
}

const createEmployeeRules = [
    allowOnlyFields(EMPLOYEE_FIELDS),
    ...employeeFieldRules(false),
    validate
];

const updateEmployeeRules = [
    param('eid').isMongoId().withMessage('eid must be a valid employee id'),
    allowOnlyFields(EMPLOYEE_FIELDS),
    body().custom((value) => {
        if (!value || Object.keys(value).length === 0) {
            throw new Error('Send at least one field to update');
        }
        return true;
    }),
    ...employeeFieldRules(true),
    validate
];

const eidParamRules = [
    param('eid').isMongoId().withMessage('eid must be a valid employee id'),
    validate
];

const eidQueryRules = [
    query('eid')
        .exists({ values: 'falsy' }).withMessage('eid query parameter is required').bail()
        .isMongoId().withMessage('eid must be a valid employee id'),
    validate
];

module.exports = { createEmployeeRules, updateEmployeeRules, eidParamRules, eidQueryRules };
