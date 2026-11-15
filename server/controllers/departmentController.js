const asyncHandler = require('../utils/asyncHandler');
const departmentModel = require('../models/departmentModel');
const ApiError = require('../utils/ApiError');

const list = asyncHandler(async (req, res) => {
  const departments = await departmentModel.list();
  res.json({ success: true, data: { departments } });
});

const create = asyncHandler(async (req, res) => {
  const department = await departmentModel.create({
    departmentName: req.body.department_name,
    description: req.body.description || null
  });
  res.status(201).json({
    success: true,
    message: 'Department created.',
    data: { department }
  });
});

const update = asyncHandler(async (req, res) => {
  const existing = await departmentModel.findById(req.params.id);
  if (!existing) {
    throw new ApiError(404, 'Department not found.');
  }
  const department = await departmentModel.update(req.params.id, {
    departmentName: req.body.department_name,
    description: req.body.description || null
  });
  res.json({ success: true, message: 'Department updated.', data: { department } });
});

const remove = asyncHandler(async (req, res) => {
  const existing = await departmentModel.findById(req.params.id);
  if (!existing) {
    throw new ApiError(404, 'Department not found.');
  }
  await departmentModel.remove(req.params.id);
  res.json({ success: true, message: 'Department deleted.' });
});

module.exports = { list, create, update, remove };
