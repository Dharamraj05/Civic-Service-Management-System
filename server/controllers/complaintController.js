const fs = require('fs');
const asyncHandler = require('../utils/asyncHandler');
const complaintService = require('../services/complaintService');
const complaintModel = require('../models/complaintModel');
const evidenceService = require('../services/evidenceService');
const flagService = require('../services/flagService');
const ApiError = require('../utils/ApiError');

const create = asyncHandler(async (req, res) => {
  const result = await complaintService.createComplaint(req.user.userId, {
    title: req.body.title,
    description: req.body.description,
    address: req.body.address,
    categoryId: req.body.category_id,
    priority: req.body.priority,
    latitude: req.body.latitude === undefined || req.body.latitude === '' || req.body.latitude === null
      ? null
      : Number(req.body.latitude),
    longitude: req.body.longitude === undefined || req.body.longitude === '' || req.body.longitude === null
      ? null
      : Number(req.body.longitude)
  });

  let evidence = null;
  if (req.file) {
    evidence = await evidenceService.saveUpload({
      complaintId: result.complaint.complaint_id,
      userId: req.user.userId,
      file: req.file
    });
  }

  const message = result.allocation.allocated
    ? 'Complaint submitted and a resource has been allocated.'
    : `Complaint submitted. ${result.allocation.message}`;

  res.status(201).json({
    success: true,
    message: evidence ? `${message} Photo evidence was saved.` : message,
    data: { ...result, evidence }
  });
});

const mine = asyncHandler(async (req, res) => {
  const [complaints, summary] = await Promise.all([
    complaintModel.list({ citizenId: req.user.userId }),
    complaintModel.summaryForCitizen(req.user.userId)
  ]);
  res.json({ success: true, data: { complaints, summary } });
});

const getOne = asyncHandler(async (req, res) => {
  const data = await complaintService.getComplaintDetails(req.params.id, req.user);
  res.json({ success: true, data });
});

const updateStatus = asyncHandler(async (req, res) => {
  const result = await complaintService.changeStatus(
    req.params.id,
    req.body.status,
    req.user,
    req.body.remarks
  );
  res.json({ success: true, message: result.message, data: result });
});

const cancel = asyncHandler(async (req, res) => {
  const complaint = await complaintService.cancelComplaint(
    req.params.id,
    req.user,
    req.body.remarks
  );
  res.json({
    success: true,
    message: 'Complaint cancelled.',
    data: { complaint }
  });
});

const addEvidence = asyncHandler(async (req, res) => {
  const details = await complaintService.getComplaintDetails(req.params.id, req.user);
  if (req.user.role !== 'CITIZEN' || details.complaint.citizen_id !== req.user.userId) {
    throw new ApiError(403, 'You can only add evidence to your own complaints.');
  }
  const evidence = await evidenceService.saveUpload({
    complaintId: details.complaint.complaint_id,
    userId: req.user.userId,
    file: req.file
  });
  res.status(201).json({
    success: true,
    message: 'Photo evidence saved.',
    data: { evidence }
  });
});

const evidenceFile = asyncHandler(async (req, res) => {
  await complaintService.getComplaintDetails(req.params.id, req.user);
  const row = await evidenceService.findOwned(req.params.evidenceId);
  if (!row || Number(row.complaint_id) !== Number(req.params.id)) {
    throw new ApiError(404, 'Evidence not found.');
  }
  const filePath = evidenceService.absolutePath(row.stored_filename);
  if (!fs.existsSync(filePath)) {
    throw new ApiError(404, 'The evidence file is missing on the server.');
  }
  res.setHeader('Content-Type', row.mime_type);
  res.setHeader('Content-Disposition', `inline; filename="${row.original_filename.replace(/"/g, '')}"`);
  res.sendFile(filePath);
});

const flag = asyncHandler(async (req, res) => {
  const result = await flagService.flagComplaint({
    complaintId: req.params.id,
    adminId: req.user.userId,
    flagType: req.body.flag_type,
    reason: req.body.reason
  });
  res.status(201).json({
    success: true,
    message: result.message,
    data: result
  });
});

module.exports = { create, mine, getOne, updateStatus, cancel, addEvidence, evidenceFile, flag };
