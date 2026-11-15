const ApiError = require('../utils/ApiError');
const { withTransaction } = require('../utils/transaction');
const complaintModel = require('../models/complaintModel');
const categoryModel = require('../models/categoryModel');
const allocationService = require('./allocationService');
const evidenceService = require('./evidenceService');
const flagService = require('./flagService');

const CANCELLABLE = ['NEW', 'WAITING', 'ASSIGNED'];

async function createComplaint(citizenId, input) {
  const category = await categoryModel.findById(input.categoryId);
  if (!category) {
    throw new ApiError(400, 'Selected service category does not exist.');
  }

  const complaintId = await withTransaction(async (connection) => {
    const [result] = await connection.query(
      `INSERT INTO complaints
        (citizen_id, category_id, title, description, address, latitude, longitude, priority, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'NEW')`,
      [
        citizenId,
        input.categoryId,
        input.title,
        input.description,
        input.address,
        input.latitude,
        input.longitude,
        input.priority
      ]
    );
    const id = result.insertId;

    // Process is created (NEW) and immediately enters the ready queue (WAITING).
    await complaintModel.insertHistory(connection, {
      complaintId: id,
      oldStatus: null,
      newStatus: 'NEW',
      changedBy: citizenId,
      remarks: 'Complaint submitted'
    });
    await connection.query(
      `UPDATE complaints SET status = 'WAITING' WHERE complaint_id = ?`,
      [id]
    );
    await complaintModel.insertHistory(connection, {
      complaintId: id,
      oldStatus: 'NEW',
      newStatus: 'WAITING',
      changedBy: citizenId,
      remarks: 'Entered the priority queue'
    });
    return id;
  });

  // A new request wakes the scheduler. Higher-priority and older compatible
  // requests are considered first, so this complaint cannot jump the queue.
  const pass = await allocationService.runAllocationPass(null);
  const allocation = pass.results.find((item) => item.complaint_id === complaintId) || {
    allocated: false,
    complaint_id: complaintId,
    message: 'Complaint is waiting in the priority queue.'
  };

  const complaint = await complaintModel.findById(complaintId);
  return { complaint, allocation };
}

async function cancelComplaint(complaintId, user, remarks) {
  const existing = await complaintModel.findById(complaintId);
  if (!existing) {
    throw new ApiError(404, 'Complaint not found.');
  }
  if (user.role !== 'ADMIN' && existing.citizen_id !== user.userId) {
    throw new ApiError(403, 'You can only cancel your own complaints.');
  }
  if (!CANCELLABLE.includes(existing.status)) {
    throw new ApiError(400, 'This complaint can no longer be cancelled.');
  }

  await withTransaction(async (connection) => {
    const [rows] = await connection.query(
      `SELECT complaint_id, citizen_id, status
       FROM complaints
       WHERE complaint_id = ?
       FOR UPDATE`,
      [complaintId]
    );
    const complaint = rows[0];
    if (!complaint || !CANCELLABLE.includes(complaint.status)) {
      throw new ApiError(400, 'This complaint can no longer be cancelled.');
    }
    await allocationService.releaseForCancelledComplaint(
      connection,
      complaint,
      user.userId,
      remarks || 'Complaint cancelled'
    );
  });

  // If a resource was released, offer it to the next waiting request.
  await allocationService.runAllocationPass(user.userId);
  return complaintModel.findById(complaintId);
}

async function changeStatus(complaintId, nextStatus, user, remarks) {
  if (nextStatus === 'CANCELLED') {
    const complaint = await cancelComplaint(complaintId, user, remarks);
    return { message: 'Complaint cancelled.', complaint };
  }

  const complaint = await complaintModel.findById(complaintId);
  if (!complaint) {
    throw new ApiError(404, 'Complaint not found.');
  }
  if (!complaint.allocation_id) {
    throw new ApiError(400, 'This complaint has no active resource allocation.');
  }

  if (nextStatus === 'IN_PROGRESS') {
    const result = await allocationService.startAllocation(complaint.allocation_id, user.userId);
    return { ...result, complaint: await complaintModel.findById(complaintId) };
  }

  if (nextStatus === 'COMPLETED') {
    const result = await allocationService.completeAllocation(complaint.allocation_id, user.userId);
    return { ...result, complaint: await complaintModel.findById(complaintId) };
  }

  throw new ApiError(400, 'Unsupported status change.');
}

async function getComplaintDetails(complaintId, user) {
  const complaint = await complaintModel.findById(complaintId);
  if (!complaint) {
    throw new ApiError(404, 'Complaint not found.');
  }
  if (user.role !== 'ADMIN' && complaint.citizen_id !== user.userId) {
    throw new ApiError(403, 'You can only view your own complaints.');
  }

  const [history, allocations, evidence, flags] = await Promise.all([
    complaintModel.getHistory(complaintId),
    complaintModel.getAllocations(complaintId),
    evidenceService.listByComplaint(complaintId).catch(missingTable),
    flagService.listByComplaint(complaintId).catch(missingTable)
  ]);

  let queue = null;
  if (complaint.status === 'WAITING') {
    queue = await complaintModel.queuePosition(complaint);
  }

  return { complaint, history, allocations, queue, evidence, flags };
}

function missingTable(error) {
  if (error.code === 'ER_NO_SUCH_TABLE') {
    return [];
  }
  throw error;
}

module.exports = {
  createComplaint,
  cancelComplaint,
  changeStatus,
  getComplaintDetails
};
