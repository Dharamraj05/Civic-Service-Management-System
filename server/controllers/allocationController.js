const asyncHandler = require('../utils/asyncHandler');
const allocationService = require('../services/allocationService');
const allocationModel = require('../models/allocationModel');

const auto = asyncHandler(async (req, res) => {
  const complaintId = req.body.complaint_id;
  let result;

  if (complaintId) {
    result = await allocationService.allocateComplaintById(complaintId, req.user.userId, {
      enforceQueueOrder: true
    });
  } else if (req.body.mode === 'pass') {
    result = await allocationService.runAllocationPass(req.user.userId);
  } else {
    result = await allocationService.allocateNextResource(req.user.userId);
  }

  const statusCode = result.allocated ? 200 : 200;
  res.status(statusCode).json({
    success: true,
    message: result.message,
    data: result
  });
});

const manual = asyncHandler(async (req, res) => {
  const result = await allocationService.allocateManually(
    req.body.complaint_id,
    req.body.resource_id,
    req.user.userId,
    req.body.remarks
  );
  res.status(result.allocated ? 201 : 200).json({
    success: true,
    message: result.message,
    data: result
  });
});

const list = asyncHandler(async (req, res) => {
  const allocations = await allocationModel.list();
  res.json({ success: true, data: { allocations } });
});

const start = asyncHandler(async (req, res) => {
  const result = await allocationService.startAllocation(req.params.id, req.user.userId);
  res.json({ success: true, message: result.message, data: result });
});

const complete = asyncHandler(async (req, res) => {
  const result = await allocationService.completeAllocation(req.params.id, req.user.userId);
  const followUp = await allocationService.runAllocationPass(req.user.userId);
  const extra = followUp.allocated_count
    ? ` The scheduler then allocated ${followUp.allocated_count} waiting request(s).`
    : '';
  res.json({
    success: true,
    message: `${result.message}${extra}`,
    data: { ...result, follow_up: followUp }
  });
});

const reassign = asyncHandler(async (req, res) => {
  const result = await allocationService.reassign(
    req.params.id,
    req.body.resource_id,
    req.user.userId,
    req.body.remarks
  );
  res.json({ success: true, message: result.message, data: result });
});

const queue = asyncHandler(async (req, res) => {
  const queueRows = await allocationService.getPriorityQueue();
  res.json({ success: true, data: { queue: queueRows } });
});

module.exports = { auto, manual, list, start, complete, reassign, queue };
