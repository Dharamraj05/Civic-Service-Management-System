const assert = require('assert');
const { sortQueue, compareQueue } = require('../utils/scheduler');

const sample = [
  { complaint_id: 14, priority: 2, created_at: '2026-10-14 12:30:00', title: 'later high' },
  { complaint_id: 1, priority: 1, created_at: '2026-10-14 08:05:00', title: 'critical early' },
  { complaint_id: 4, priority: 2, created_at: '2026-10-14 07:40:00', title: 'high but earlier clock' },
  { complaint_id: 2, priority: 1, created_at: '2026-10-14 08:20:00', title: 'critical later' },
  { complaint_id: 8, priority: 4, created_at: '2026-10-12 09:00:00', title: 'low but oldest' },
  { complaint_id: 6, priority: 3, created_at: '2026-10-13 16:00:00', title: 'medium older' },
  { complaint_id: 7, priority: 3, created_at: '2026-10-14 11:00:00', title: 'medium newer' }
];

const sorted = sortQueue(sample);
const order = sorted.map((row) => row.complaint_id);

assert.deepStrictEqual(
  order,
  [1, 2, 4, 14, 6, 7, 8],
  'Priority must come before arrival time, and FCFS must order equal priorities'
);

assert.ok(compareQueue(sample[1], sample[3]) < 0, 'Earlier critical request comes first');
assert.ok(compareQueue(
  { complaint_id: 2, priority: 2, created_at: '2026-10-14 10:00:00' },
  { complaint_id: 9, priority: 2, created_at: '2026-10-14 10:00:00' }
) < 0, 'Equal time uses the smaller complaint id');

const originalFirst = sample[0].complaint_id;
sortQueue(sample);
assert.strictEqual(sample[0].complaint_id, originalFirst, 'Sorting must not mutate the input array');

console.log('Scheduler tests passed.');
console.log('Queue order:', order.join(' -> '));
