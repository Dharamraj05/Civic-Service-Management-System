const pool = require('../config/db');
const ApiError = require('../utils/ApiError');
const { withTransaction } = require('../utils/transaction');
const complaintModel = require('../models/complaintModel');

const NO_RESOURCE_MESSAGE = 'No compatible resource is currently available.';

/**
 * Allocation engine
 * -----------------
 * OS mapping used in the viva:
 *   Complaint  = process
 *   WAITING    = ready / waiting queue
 *   ASSIGNED   = process has been given the resource (CPU/device analogue)
 *   IN_PROGRESS = running
 *   COMPLETED  = terminated
 *   Resource   = a single-instance device (ambulance, tanker, truck, team, patrol)
 *
 * Scheduling rule (also implemented by utils/scheduler.js and priority_queue_view):
 *   1. Smaller priority number runs first (1 Critical ... 4 Low).  -- priority scheduling
 *   2. Equal priority: earlier created_at runs first.               -- FCFS
 *   3. complaint_id breaks any remaining tie.
 *
 * A request may receive a resource only when no earlier compatible request
 * is still WAITING. That stops a new low-priority complaint from jumping
 * the queue when the citizen submits it.
 *
 * Mutual exclusion:
 *   Two allocations must never own the same resource.
 *   Inside START TRANSACTION we lock the complaint and the chosen resource
 *   with SELECT ... FOR UPDATE. The unique columns active_resource_lock and
 *   active_complaint_lock are a second guard. If anything fails, ROLLBACK
 *   restores the previous state (atomicity).
 */

async function allocateNextResource(userId) {
  const [rows] = await pool.query(
    `SELECT complaint_id
     FROM complaints
     WHERE status = 'WAITING'
     ORDER BY priority ASC, created_at ASC, complaint_id ASC
     LIMIT 1`
  );

  if (rows.length === 0) {
    return {
      allocated: false,
      message: 'No waiting complaints in the priority queue.'
    };
  }

  return allocateComplaintById(rows[0].complaint_id, userId, { enforceQueueOrder: true });
}

async function runAllocationPass(userId) {
  const [waiting] = await pool.query(
    `SELECT complaint_id
     FROM complaints
     WHERE status = 'WAITING'
     ORDER BY priority ASC, created_at ASC, complaint_id ASC`
  );

  const results = [];
  for (const row of waiting) {
    results.push(await allocateComplaintById(row.complaint_id, userId, { enforceQueueOrder: true }));
  }

  const allocated = results.filter((item) => item.allocated);
  return {
    allocated: allocated.length > 0,
    allocated_count: allocated.length,
    attempted: results.length,
    results,
    message: allocated.length
      ? `Allocated ${allocated.length} resource(s) using priority scheduling and FCFS.`
      : waiting.length
        ? NO_RESOURCE_MESSAGE
        : 'No waiting complaints in the priority queue.'
  };
}

/**
 * Allocate one waiting complaint.
 * enforceQueueOrder true  -> automatic scheduler, cannot overtake an earlier request
 * enforceQueueOrder false -> admin manual choice of a specific free resource
 */
async function allocateComplaintById(complaintId, userId, options = {}) {
  const enforceQueueOrder = options.enforceQueueOrder !== false;
  const resourceId = options.resourceId || null;
  const remarks = options.remarks || (resourceId
    ? 'Manual allocation by administrator'
    : 'Automatic priority scheduling');

  try {
    return await withTransaction(async (connection) => {
      const complaint = await lockWaitingComplaint(connection, complaintId);
      if (!complaint) {
        return {
          allocated: false,
          complaint_id: complaintId,
          message: 'Complaint is not waiting for a resource.'
        };
      }

      if (enforceQueueOrder) {
        const ahead = await findComplaintAhead(connection, complaint);
        if (ahead) {
          return {
            allocated: false,
            complaint_id: complaint.complaint_id,
            required_resource_type: complaint.required_resource_type,
            message: 'A higher-priority or earlier request for this resource type is still waiting.'
          };
        }
      }

      const resource = resourceId
        ? await lockSpecificResource(connection, resourceId, complaint.required_resource_type)
        : await lockFirstAvailableResource(connection, complaint.required_resource_type);

      if (!resource) {
        return {
          allocated: false,
          complaint_id: complaint.complaint_id,
          required_resource_type: complaint.required_resource_type,
          message: NO_RESOURCE_MESSAGE
        };
      }

      await applyAllocation(connection, {
        complaint,
        resource,
        userId,
        remarks
      });

      return {
        allocated: true,
        message: 'Resource allocated successfully.',
        complaint_id: complaint.complaint_id,
        resource: {
          resource_id: resource.resource_id,
          resource_name: resource.resource_name,
          resource_type: resource.resource_type,
          registration_or_identifier: resource.registration_or_identifier
        }
      };
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      throw new ApiError(409, 'This resource was just assigned to another complaint. Please try again.');
    }
    throw error;
  }
}

async function allocateManually(complaintId, resourceId, userId, remarks) {
  return allocateComplaintById(complaintId, userId, {
    enforceQueueOrder: false,
    resourceId,
    remarks: remarks || 'Manual allocation by administrator'
  });
}

async function reassign(allocationId, newResourceId, userId, remarks) {
  try {
    return await withTransaction(async (connection) => {
      const [allocations] = await connection.query(
        `SELECT allocation_id, complaint_id, resource_id, allocation_status
         FROM resource_allocations
         WHERE allocation_id = ?
         FOR UPDATE`,
        [allocationId]
      );
      const allocation = allocations[0];
      if (!allocation) {
        throw new ApiError(404, 'Allocation not found.');
      }
      if (allocation.allocation_status !== 'ALLOCATED') {
        throw new ApiError(400, 'Only an allocation that has not started can be reassigned.');
      }
      if (allocation.resource_id === newResourceId) {
        throw new ApiError(400, 'Choose a different resource to reassign.');
      }

      const [complaints] = await connection.query(
        `SELECT c.complaint_id, c.status, sc.required_resource_type
         FROM complaints c
         JOIN service_categories sc ON sc.category_id = c.category_id
         WHERE c.complaint_id = ?
         FOR UPDATE`,
        [allocation.complaint_id]
      );
      const complaint = complaints[0];
      if (!complaint || complaint.status !== 'ASSIGNED') {
        throw new ApiError(400, 'The complaint is not in the ASSIGNED state.');
      }

      // Lock both resource rows in id order so two reassignments cannot deadlock.
      const lockOrder = [allocation.resource_id, newResourceId].sort((a, b) => a - b);
      for (const id of lockOrder) {
        await connection.query(
          `SELECT resource_id, resource_type, status, resource_name, registration_or_identifier
           FROM resources WHERE resource_id = ? FOR UPDATE`,
          [id]
        );
      }

      const [newRows] = await connection.query(
        `SELECT resource_id, resource_name, resource_type, registration_or_identifier, status
         FROM resources WHERE resource_id = ?`,
        [newResourceId]
      );
      const newResource = newRows[0];
      if (!newResource) {
        throw new ApiError(404, 'Resource not found.');
      }
      if (newResource.resource_type !== complaint.required_resource_type) {
        throw new ApiError(400, `This complaint requires a ${complaint.required_resource_type}.`);
      }
      if (newResource.status !== 'AVAILABLE') {
        throw new ApiError(409, 'The selected resource is not available.');
      }

      const [busyUpdate] = await connection.query(
        `UPDATE resources SET status = 'BUSY' WHERE resource_id = ? AND status = 'AVAILABLE'`,
        [newResourceId]
      );
      if (busyUpdate.affectedRows !== 1) {
        throw new ApiError(409, 'The selected resource is not available.');
      }

      await connection.query(
        `UPDATE resource_allocations
         SET allocation_status = 'REASSIGNED', remarks = ?
         WHERE allocation_id = ?`,
        [remarks || 'Reassigned by administrator', allocationId]
      );
      await connection.query(
        `UPDATE resources SET status = 'AVAILABLE' WHERE resource_id = ?`,
        [allocation.resource_id]
      );

      await connection.query(
        `INSERT INTO resource_allocations
          (complaint_id, resource_id, allocation_status, allocated_by, remarks)
         VALUES (?, ?, 'ALLOCATED', ?, ?)`,
        [complaint.complaint_id, newResourceId, userId || null, remarks || 'Reassigned by administrator']
      );

      await complaintModel.insertHistory(connection, {
        complaintId: complaint.complaint_id,
        oldStatus: 'ASSIGNED',
        newStatus: 'ASSIGNED',
        changedBy: userId,
        remarks: `Reassigned to ${newResource.registration_or_identifier}`
      });

      return {
        allocated: true,
        message: 'Resource reassigned.',
        complaint_id: complaint.complaint_id,
        resource: {
          resource_id: newResource.resource_id,
          resource_name: newResource.resource_name,
          resource_type: newResource.resource_type,
          registration_or_identifier: newResource.registration_or_identifier
        }
      };
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      throw new ApiError(409, 'This resource was just assigned to another complaint. Please try again.');
    }
    throw error;
  }
}

async function startAllocation(allocationId, userId) {
  return withTransaction(async (connection) => {
    const allocation = await lockOpenAllocation(connection, allocationId);
    if (allocation.allocation_status !== 'ALLOCATED' || allocation.complaint_status !== 'ASSIGNED') {
      throw new ApiError(400, 'Start is allowed only when the complaint is ASSIGNED.');
    }

    await connection.query(
      `UPDATE resource_allocations
       SET allocation_status = 'IN_PROGRESS', started_at = NOW()
       WHERE allocation_id = ?`,
      [allocationId]
    );
    await connection.query(
      `UPDATE complaints SET status = 'IN_PROGRESS' WHERE complaint_id = ?`,
      [allocation.complaint_id]
    );
    await complaintModel.insertHistory(connection, {
      complaintId: allocation.complaint_id,
      oldStatus: 'ASSIGNED',
      newStatus: 'IN_PROGRESS',
      changedBy: userId,
      remarks: 'Service started'
    });

    return { message: 'Service marked in progress.', complaint_id: allocation.complaint_id };
  });
}

async function completeAllocation(allocationId, userId) {
  return withTransaction(async (connection) => {
    const allocation = await lockOpenAllocation(connection, allocationId);
    if (allocation.allocation_status !== 'IN_PROGRESS' || allocation.complaint_status !== 'IN_PROGRESS') {
      throw new ApiError(400, 'Start the service before marking it completed.');
    }

    await connection.query(
      `SELECT resource_id FROM resources WHERE resource_id = ? FOR UPDATE`,
      [allocation.resource_id]
    );

    await connection.query(
      `UPDATE resource_allocations
       SET allocation_status = 'COMPLETED', completed_at = NOW()
       WHERE allocation_id = ?`,
      [allocationId]
    );
    // The device is free again. The generated lock column becomes NULL.
    await connection.query(
      `UPDATE resources SET status = 'AVAILABLE' WHERE resource_id = ?`,
      [allocation.resource_id]
    );
    await connection.query(
      `UPDATE complaints SET status = 'COMPLETED' WHERE complaint_id = ?`,
      [allocation.complaint_id]
    );
    await complaintModel.insertHistory(connection, {
      complaintId: allocation.complaint_id,
      oldStatus: 'IN_PROGRESS',
      newStatus: 'COMPLETED',
      changedBy: userId,
      remarks: 'Service completed. Resource released and marked AVAILABLE.'
    });

    return {
      message: 'Service completed. The resource is available again.',
      complaint_id: allocation.complaint_id,
      resource_id: allocation.resource_id
    };
  });
}

async function releaseForCancelledComplaint(connection, complaint, userId, remarks) {
  const [allocations] = await connection.query(
    `SELECT allocation_id, resource_id, allocation_status
     FROM resource_allocations
     WHERE complaint_id = ? AND allocation_status IN ('ALLOCATED', 'IN_PROGRESS')
     FOR UPDATE`,
    [complaint.complaint_id]
  );

  if (allocations.length && allocations[0].allocation_status === 'IN_PROGRESS') {
    throw new ApiError(400, 'A service that is already in progress cannot be cancelled.');
  }

  if (allocations.length) {
    const allocation = allocations[0];
    await connection.query(
      `SELECT resource_id FROM resources WHERE resource_id = ? FOR UPDATE`,
      [allocation.resource_id]
    );
    await connection.query(
      `UPDATE resource_allocations
       SET allocation_status = 'CANCELLED', remarks = ?
       WHERE allocation_id = ?`,
      [remarks || 'Complaint cancelled', allocation.allocation_id]
    );
    await connection.query(
      `UPDATE resources SET status = 'AVAILABLE' WHERE resource_id = ?`,
      [allocation.resource_id]
    );
  }

  await connection.query(
    `UPDATE complaints SET status = 'CANCELLED' WHERE complaint_id = ?`,
    [complaint.complaint_id]
  );
  await complaintModel.insertHistory(connection, {
    complaintId: complaint.complaint_id,
    oldStatus: complaint.status,
    newStatus: 'CANCELLED',
    changedBy: userId,
    remarks: remarks || 'Complaint cancelled'
  });
}

async function lockWaitingComplaint(connection, complaintId) {
  const [rows] = await connection.query(
    `SELECT c.complaint_id, c.priority, c.created_at, c.status, c.category_id,
            sc.required_resource_type, sc.category_name
     FROM complaints c
     JOIN service_categories sc ON sc.category_id = c.category_id
     WHERE c.complaint_id = ? AND c.status = 'WAITING'
     FOR UPDATE`,
    [complaintId]
  );
  return rows[0] || null;
}

async function findComplaintAhead(connection, complaint) {
  const [rows] = await connection.query(
    `SELECT c.complaint_id
     FROM complaints c
     JOIN service_categories sc ON sc.category_id = c.category_id
     WHERE c.status = 'WAITING'
       AND sc.required_resource_type = ?
       AND c.complaint_id <> ?
       AND (
         c.priority < ?
         OR (c.priority = ? AND c.created_at < ?)
         OR (c.priority = ? AND c.created_at = ? AND c.complaint_id < ?)
       )
     ORDER BY c.priority ASC, c.created_at ASC, c.complaint_id ASC
     LIMIT 1
     FOR UPDATE`,
    [
      complaint.required_resource_type,
      complaint.complaint_id,
      complaint.priority,
      complaint.priority,
      complaint.created_at,
      complaint.priority,
      complaint.created_at,
      complaint.complaint_id
    ]
  );
  return rows[0] || null;
}

async function lockFirstAvailableResource(connection, resourceType) {
  const [rows] = await connection.query(
    `SELECT resource_id, resource_name, resource_type, registration_or_identifier, status
     FROM resources
     WHERE status = 'AVAILABLE' AND resource_type = ?
     ORDER BY resource_id ASC
     LIMIT 1
     FOR UPDATE`,
    [resourceType]
  );
  return rows[0] || null;
}

async function lockSpecificResource(connection, resourceId, requiredType) {
  const [rows] = await connection.query(
    `SELECT resource_id, resource_name, resource_type, registration_or_identifier, status
     FROM resources
     WHERE resource_id = ?
     FOR UPDATE`,
    [resourceId]
  );
  const resource = rows[0];
  if (!resource) {
    throw new ApiError(404, 'Resource not found.');
  }
  if (resource.resource_type !== requiredType) {
    throw new ApiError(400, `This complaint requires a ${requiredType}.`);
  }
  if (resource.status !== 'AVAILABLE') {
    throw new ApiError(409, 'The selected resource is not available.');
  }
  return resource;
}

async function applyAllocation(connection, { complaint, resource, userId, remarks }) {
  const [resourceUpdate] = await connection.query(
    `UPDATE resources
     SET status = 'BUSY'
     WHERE resource_id = ? AND status = 'AVAILABLE'`,
    [resource.resource_id]
  );
  if (resourceUpdate.affectedRows !== 1) {
    throw new ApiError(409, 'The selected resource is no longer available.');
  }

  await connection.query(
    `INSERT INTO resource_allocations
      (complaint_id, resource_id, allocation_status, allocated_by, remarks)
     VALUES (?, ?, 'ALLOCATED', ?, ?)`,
    [complaint.complaint_id, resource.resource_id, userId || null, remarks]
  );

  const [complaintUpdate] = await connection.query(
    `UPDATE complaints
     SET status = 'ASSIGNED'
     WHERE complaint_id = ? AND status = 'WAITING'`,
    [complaint.complaint_id]
  );
  if (complaintUpdate.affectedRows !== 1) {
    throw new ApiError(409, 'The complaint is no longer waiting.');
  }

  await complaintModel.insertHistory(connection, {
    complaintId: complaint.complaint_id,
    oldStatus: 'WAITING',
    newStatus: 'ASSIGNED',
    changedBy: userId,
    remarks: `Resource ${resource.registration_or_identifier} allocated`
  });
}

async function lockOpenAllocation(connection, allocationId) {
  const [rows] = await connection.query(
    `SELECT a.allocation_id, a.complaint_id, a.resource_id, a.allocation_status,
            c.status AS complaint_status
     FROM resource_allocations a
     JOIN complaints c ON c.complaint_id = a.complaint_id
     WHERE a.allocation_id = ?
     FOR UPDATE`,
    [allocationId]
  );
  const allocation = rows[0];
  if (!allocation) {
    throw new ApiError(404, 'Allocation not found.');
  }
  await connection.query(
    `SELECT complaint_id FROM complaints WHERE complaint_id = ? FOR UPDATE`,
    [allocation.complaint_id]
  );
  return allocation;
}

async function getPriorityQueue() {
  const [rows] = await pool.query(
    `SELECT complaint_id, title, priority, status, created_at, citizen_name,
            category_name, required_resource_type, available_resource_count
     FROM priority_queue_view
     ORDER BY priority ASC, created_at ASC, complaint_id ASC`
  );
  return rows.map((row, index) => ({
    ...row,
    queue_position: index + 1,
    available_resource_count: Number(row.available_resource_count)
  }));
}

module.exports = {
  allocateNextResource,
  runAllocationPass,
  allocateComplaintById,
  allocateManually,
  reassign,
  startAllocation,
  completeAllocation,
  releaseForCancelledComplaint,
  getPriorityQueue,
  NO_RESOURCE_MESSAGE
};
