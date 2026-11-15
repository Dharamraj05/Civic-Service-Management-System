/**
 * Priority scheduling + FCFS comparator.
 *
 * This is the same rule enforced by SQL in the allocation engine:
 *   ORDER BY priority ASC, created_at ASC, complaint_id ASC
 *
 * Smaller priority number = more urgent (1 Critical ... 4 Low).
 * Equal priority: the earlier request wins (first come, first served).
 * A final complaint_id tie-break keeps the order stable.
 */
function compareQueue(a, b) {
  if (a.priority !== b.priority) {
    return a.priority - b.priority;
  }

  const timeDiff = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
  if (timeDiff !== 0) {
    return timeDiff;
  }

  return a.complaint_id - b.complaint_id;
}

function sortQueue(complaints) {
  return [...complaints].sort(compareQueue);
}

module.exports = { compareQueue, sortQueue };
