const Employee = require('../models/Employee');
const AppError = require('../utils/AppError');
const logger = require('../utils/logger');

// Ownership rule: every query below filters on BOTH the employee id AND
// user: req.user.id (the id from the verified JWT). A user can therefore never
// read, change or delete another user's employee, even by changing the eid.

// Called when the owner-filtered query found nothing: tells apart
// "no such employee" (404) from "it exists but belongs to someone else" (403).
async function notFoundOrForbidden(eid, req, action) {
    const exists = await Employee.exists({ _id: eid });
    if (exists) {
        logger.warn('Authorization failed: employee belongs to another user', { action, employee_id: eid, user_id: req.user.id });
        return new AppError(403, 'You do not have permission to access this employee');
    }
    return new AppError(404, `Employee not found with id ${eid}`);
}

// GET /api/v1/emp/employees
async function listEmployees(req, res) {
    const employees = await Employee.find({ user: req.user.id }).sort({ created_at: -1 });
    res.status(200).json({ status: true, count: employees.length, employees });
}

// POST /api/v1/emp/employees
async function createEmployee(req, res) {
    // The owner comes from the token, never from the request body
    const employee = await Employee.create({ ...req.body, user: req.user.id });
    logger.info('Employee created', { employee_id: employee._id.toString(), user_id: req.user.id });

    res.status(201).json({
        status: true,
        message: 'Employee created successfully.',
        employee_id: employee._id,
        employee
    });
}

// GET /api/v1/emp/employees/:eid
async function getEmployee(req, res) {
    const { eid } = req.params;
    const employee = await Employee.findOne({ _id: eid, user: req.user.id });
    if (!employee) throw await notFoundOrForbidden(eid, req, 'read');

    res.status(200).json({ status: true, employee });
}

// PUT /api/v1/emp/employees/:eid
async function updateEmployee(req, res) {
    const { eid } = req.params;
    const employee = await Employee.findOneAndUpdate(
        { _id: eid, user: req.user.id },
        req.body,
        { new: true, runValidators: true }
    );
    if (!employee) throw await notFoundOrForbidden(eid, req, 'update');

    logger.info('Employee updated', { employee_id: eid, user_id: req.user.id, fields: Object.keys(req.body) });
    res.status(200).json({ status: true, message: 'Employee details updated successfully.', employee });
}

// DELETE /api/v1/emp/employees?eid=xxx
async function deleteEmployee(req, res) {
    const { eid } = req.query;
    const employee = await Employee.findOneAndDelete({ _id: eid, user: req.user.id });
    if (!employee) throw await notFoundOrForbidden(eid, req, 'delete');

    logger.info('Employee deleted', { employee_id: eid, user_id: req.user.id });
    // 204 No Content: success with an empty body
    res.status(204).end();
}

module.exports = { listEmployees, createEmployee, getEmployee, updateEmployee, deleteEmployee };
