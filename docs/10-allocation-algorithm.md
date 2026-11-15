# Allocation algorithm

File: `server/services/allocationService.js`

## When the scheduler runs

- A citizen submits a complaint
- An administrator clicks **Allocate next**, **Run allocation pass**, or **Allocate** on one row
- An administrator completes a job (the freed resource should be offered onward)
- A complaint is cancelled and an assigned resource is released

## Order

```sql
ORDER BY priority ASC, created_at ASC, complaint_id ASC
```

Only rows with `status = 'WAITING'` are candidates.

## One complaint

`allocateComplaintById` does the following inside a transaction.

1. Lock the complaint if it is still `WAITING`. If it is not, return "Complaint is not waiting for a resource."
2. If this is an automatic decision, lock any waiting complaint of the same resource type that is ahead (better priority, or same priority and earlier time). If one exists, leave this complaint waiting. A new request must not jump the queue.
3. Lock a resource.
   - Automatic: the lowest `resource_id` that is `AVAILABLE` and has the required type.
   - Manual: the resource the administrator chose. Reject it if the type differs or the status is not `AVAILABLE`.
4. If no automatic resource exists, commit the read-only transaction and return exactly: **No compatible resource is currently available.** The complaint stays `WAITING`. The API does not throw.
5. Otherwise update the resource to `BUSY` only if it is still `AVAILABLE` (`affectedRows` must be 1).
6. Insert `resource_allocations` with status `ALLOCATED`.
7. Update the complaint to `ASSIGNED` only if it is still `WAITING`.
8. Insert a history row.
9. `COMMIT`.

## Allocate next

Read the first waiting id in scheduler order, then run the steps above for that id only. If that complaint's resource type is exhausted, the function stops and says no compatible resource is available. It does not quietly serve a later complaint. Use this button to single-step the head of the queue.

## Allocation pass

Read all waiting ids in order. Run the one-complaint steps for each. Because earlier complaints are attempted first, a free ambulance goes to the most urgent medical request, not to a medical request filed later. A water request later in the list can still receive a tanker if ambulances are finished.

## Start and complete

- **Start:** `ALLOCATED` / `ASSIGNED` becomes `IN_PROGRESS`. `started_at` is set. The resource stays `BUSY`.
- **Complete:** allowed only from `IN_PROGRESS`. The allocation becomes `COMPLETED`, the complaint becomes `COMPLETED`, and the resource becomes `AVAILABLE`. Then a new pass runs.

## Reassign

Allowed only before start. Both resource rows are locked in ascending id order so two reassignments cannot deadlock by locking opposite rows first. The new resource must be `AVAILABLE` and the right type. The old allocation becomes `REASSIGNED`, the old resource becomes `AVAILABLE`, and a new `ALLOCATED` row is inserted before `COMMIT`.

## Cancel

Allowed from `NEW`, `WAITING`, or `ASSIGNED`. If an open allocation exists and it is not yet in progress, it becomes `CANCELLED` and the resource becomes `AVAILABLE`. Then a pass runs.

## Failure behaviour

| Situation | Result |
| --- | --- |
| No free resource of that type | Complaint stays `WAITING`. Message explains it. HTTP 200 |
| Someone compatible is ahead | Complaint stays `WAITING`. Message says an earlier request is waiting |
| Two admins take the same vehicle | One commits. The other gets HTTP 409 or finds the resource no longer available |
| Any thrown error inside the transaction | `ROLLBACK` |

The duplicate active-lock unique index is the backup if two inserts race past the status check.
