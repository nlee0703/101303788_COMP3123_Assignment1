const express = require('express');
const authenticate = require('../middleware/auth');
const controller = require('../controllers/employeeController');
const {
    createEmployeeRules,
    updateEmployeeRules,
    eidParamRules,
    eidQueryRules
} = require('../validators/employeeValidators');

const router = express.Router();

// Every employee route requires a valid JWT
router.use(authenticate);

router.get('/employees', controller.listEmployees);
router.post('/employees', createEmployeeRules, controller.createEmployee);
router.get('/employees/:eid', eidParamRules, controller.getEmployee);
router.put('/employees/:eid', updateEmployeeRules, controller.updateEmployee);
router.delete('/employees', eidQueryRules, controller.deleteEmployee);

module.exports = router;
