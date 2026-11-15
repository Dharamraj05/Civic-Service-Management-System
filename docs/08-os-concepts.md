# Operating system concepts

Open `server/services/allocationService.js` while explaining this page. The admin screen **Priority queue** shows the same order.

## Process

Each complaint is one process. It is created when the citizen submits the form, it waits for a device (the resource), it runs while the crew is working, and it terminates when the job is completed or the request is cancelled.

## Process states

| State | Meaning |
| --- | --- |
| NEW | The process has just been created. History records this, then the same transaction queues it |
| WAITING | Ready. It is in the priority queue and does not hold a resource |
| ASSIGNED | The scheduler has given it a resource, and the resource is `BUSY` |
| IN_PROGRESS | Running. An administrator has started the job |
| COMPLETED | Terminated normally. The resource is `AVAILABLE` again |
| CANCELLED | Terminated early. An assigned resource is released if the job had not started |

A job that is `IN_PROGRESS` cannot be cancelled, so a crew that has already started is not dropped by a second click.

## Priority scheduling

Priority is an integer. A smaller number is more urgent:

1. Critical
2. High
3. Medium
4. Low

The scheduler sorts with `priority ASC`. In the seed data, complaint 1 is Critical at 08:05 and complaint 4 is High at 07:40. Complaint 1 is ahead even though it arrived later. That is priority over arrival time.

## FCFS

First come, first served is the tie-break. If priority is equal, the earlier `created_at` wins. If the timestamps are equal, the smaller `complaint_id` wins so the order never flickers.

Seed example: complaints 4 and 5 are both Water Supply at priority 2. Complaint 4 was filed at 07:40 and complaint 5 at 10:15, so 4 is ahead.

The same comparison is implemented twice on purpose:

- SQL `ORDER BY priority ASC, created_at ASC, complaint_id ASC` in the engine and in `priority_queue_view`
- `compareQueue` in `server/utils/scheduler.js`, checked by `npm test`

The live decision uses SQL. The JavaScript function exists so the rule can be shown without a database.

## Queue

All `WAITING` rows are the ready queue. The admin table prints the queue position. A citizen who is still waiting also sees their position overall and their position among requests that need the same resource type.

## Mutual exclusion and the critical section

A resource is a device that only one process may hold. The critical section is the allocation transaction:

```text
START TRANSACTION
  lock the waiting complaint
  lock any earlier compatible complaint (so a newer request cannot pass it)
  lock one AVAILABLE resource of the required type
  UPDATE resource SET status = 'BUSY' WHERE status = 'AVAILABLE'
  INSERT the allocation
  UPDATE complaint SET status = 'ASSIGNED' WHERE status = 'WAITING'
COMMIT
```

`SELECT ... FOR UPDATE` takes an exclusive row lock. A second transaction that wants those rows waits. If the first transaction commits the resource as `BUSY`, the second no longer sees it as `AVAILABLE`.

If the update does not change exactly one row, the service throws and `withTransaction` issues `ROLLBACK`. The complaint stays `WAITING` and the resource stays `AVAILABLE`.

The table also defines `active_resource_lock` as a unique generated column. Even if a future bug skipped a status check, InnoDB would reject a second open allocation for the same resource with a duplicate-key error, and the API turns that into HTTP 409.

## What "Allocate next" and "Run allocation pass" demonstrate

- **Allocate next** is one scheduling decision: only the head of the queue. If its device is busy, it stays at the head. This is easy to single-step in a viva.
- **Run allocation pass** walks that same order. If ambulances are exhausted, a later water-tanker request can still run because it needs a different device. A later ambulance request still cannot jump an earlier ambulance request.

Preemption is not implemented. Once a complaint is `ASSIGNED` or `IN_PROGRESS`, a newer critical request does not snatch that same vehicle. The newer request waits for the next free one. An administrator can reassign only before the job has started.
