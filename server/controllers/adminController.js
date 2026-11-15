const asyncHandler = require('../utils/asyncHandler');
const complaintModel = require('../models/complaintModel');
const allocationService = require('../services/allocationService');
const reportService = require('../services/reportService');
const conceptService = require('../services/conceptService');
const ApiError = require('../utils/ApiError');

const complaints = asyncHandler(async (req, res) => {
  const list = await complaintModel.list({
    status: req.query.status || undefined,
    categoryId: req.query.category_id || undefined,
    priority: req.query.priority || undefined
  });
  res.json({ success: true, data: { complaints: list } });
});

const dashboard = asyncHandler(async (req, res) => {
  const [stats, queue, recent] = await Promise.all([
    complaintModel.adminStats(),
    allocationService.getPriorityQueue(),
    complaintModel.list()
  ]);

  res.json({
    success: true,
    data: {
      stats,
      queue: queue.slice(0, 6),
      recent: recent.slice(0, 6)
    }
  });
});

const reports = asyncHandler(async (req, res) => {
  const report = await reportService.buildReport();
  res.json({ success: true, data: report });
});

const concepts = asyncHandler(async (req, res) => {
  try {
    const snapshot = await conceptService.getSnapshot();
    res.json({ success: true, data: snapshot });
  } catch (error) {
    if (error.code === 'ER_NO_SUCH_TABLE') {
      throw new ApiError(503, 'Run database/migrate_evidence.sql in MySQL Workbench, then refresh.');
    }
    throw error;
  }
});

module.exports = { complaints, dashboard, reports, concepts };
