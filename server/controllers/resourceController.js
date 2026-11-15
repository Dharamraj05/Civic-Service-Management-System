const asyncHandler = require('../utils/asyncHandler');
const resourceModel = require('../models/resourceModel');
const departmentModel = require('../models/departmentModel');
const categoryModel = require('../models/categoryModel');
const ApiError = require('../utils/ApiError');

async function assertResourceShape({ departmentId, resourceType, status, currentStatus }) {
  const department = await departmentModel.findById(departmentId);
  if (!department) {
    throw new ApiError(400, 'Selected department does not exist.');
  }

  const types = await categoryModel.listResourceTypes();
  if (!types.includes(resourceType)) {
    throw new ApiError(400, 'Unknown resource type. It must match a service category.');
  }

  if (status === 'BUSY' || currentStatus === 'BUSY') {
    throw new ApiError(400, 'BUSY is controlled by the allocation engine. Complete or cancel the active complaint first.');
  }
}

const list = asyncHandler(async (req, res) => {
  const resources = await resourceModel.list({
    status: req.query.status || undefined,
    resourceType: req.query.type || undefined,
    departmentId: req.query.department_id ? Number(req.query.department_id) : undefined
  });
  res.json({ success: true, data: { resources } });
});

const create = asyncHandler(async (req, res) => {
  const status = req.body.status || 'AVAILABLE';
  await assertResourceShape({
    departmentId: req.body.department_id,
    resourceType: req.body.resource_type,
    status
  });

  const resource = await resourceModel.create({
    departmentId: req.body.department_id,
    resourceName: req.body.resource_name,
    resourceType: req.body.resource_type,
    registrationOrIdentifier: req.body.registration_or_identifier,
    status,
    currentLocation: req.body.current_location || null
  });

  res.status(201).json({
    success: true,
    message: 'Resource added.',
    data: { resource }
  });
});

const update = asyncHandler(async (req, res) => {
  const existing = await resourceModel.findById(req.params.id);
  if (!existing) {
    throw new ApiError(404, 'Resource not found.');
  }

  const nextStatus = req.body.status || existing.status;
  if (existing.status === 'BUSY' || nextStatus === 'BUSY') {
    throw new ApiError(400, 'A busy resource can only be released by completing or cancelling its allocation.');
  }

  await assertResourceShape({
    departmentId: req.body.department_id,
    resourceType: req.body.resource_type,
    status: nextStatus,
    currentStatus: existing.status
  });

  const resource = await resourceModel.update(req.params.id, {
    departmentId: req.body.department_id,
    resourceName: req.body.resource_name,
    resourceType: req.body.resource_type,
    registrationOrIdentifier: req.body.registration_or_identifier,
    status: nextStatus,
    currentLocation: req.body.current_location || null
  });

  res.json({ success: true, message: 'Resource updated.', data: { resource } });
});

const updateStatus = asyncHandler(async (req, res) => {
  const existing = await resourceModel.findById(req.params.id);
  if (!existing) {
    throw new ApiError(404, 'Resource not found.');
  }
  if (existing.status === 'BUSY') {
    throw new ApiError(400, 'Complete or cancel the active allocation before changing this resource.');
  }

  const resource = await resourceModel.updateStatus(req.params.id, req.body.status);
  res.json({ success: true, message: 'Resource status updated.', data: { resource } });
});

const remove = asyncHandler(async (req, res) => {
  const existing = await resourceModel.findById(req.params.id);
  if (!existing) {
    throw new ApiError(404, 'Resource not found.');
  }
  if (existing.status === 'BUSY') {
    throw new ApiError(409, 'A busy resource cannot be deleted.');
  }
  const allocations = await resourceModel.countAllocations(req.params.id);
  if (allocations > 0) {
    throw new ApiError(409, 'This resource has allocation history and cannot be deleted. Set it OFFLINE instead.');
  }
  await resourceModel.remove(req.params.id);
  res.json({ success: true, message: 'Resource deleted.' });
});

module.exports = { list, create, update, updateStatus, remove };
