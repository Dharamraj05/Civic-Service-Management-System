const asyncHandler = require('../utils/asyncHandler');
const categoryModel = require('../models/categoryModel');

const list = asyncHandler(async (req, res) => {
  const categories = await categoryModel.list();
  res.json({ success: true, data: { categories } });
});

const resourceTypes = asyncHandler(async (req, res) => {
  const resource_types = await categoryModel.listResourceTypes();
  res.json({ success: true, data: { resource_types } });
});

module.exports = { list, resourceTypes };
