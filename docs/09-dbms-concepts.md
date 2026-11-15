# DBMS concepts

## Keys and constraints

- **Primary keys** identify every row (`user_id`, `complaint_id`, and the other `*_id` columns).
- **Candidate / unique keys** include `users.email`, `users.phone`, `departments.department_name`, `service_categories.category_name`, and `resources.registration_or_identifier`.
- **Foreign keys** stop a complaint from pointing at a missing citizen or category. Deleting a department that still has categories or resources is rejected (`ON DELETE RESTRICT`).
- **NOT NULL** marks the columns the application cannot invent later, such as title, priority, and password hash.
- **CHECK** limits priority to 1–4 and coordinates to real latitude and longitude ranges.
- **ENUM** limits role, complaint status, resource status, and allocation status to the values the scheduler understands.

The unique generated columns on `resource_allocations` are the schema-level form of "one active holder".

## Referential integrity

A resource allocation cannot be inserted for a complaint or resource that does not exist. `allocated_by` and history `changed_by` use `ON DELETE SET NULL` so a user reference is optional if that account were removed later. The application does not delete users.

## Joins

List and detail queries join complaints to users, categories, and departments. The active or most recent allocation is joined to resources. Reports group complaints by category with a `LEFT JOIN` so a category with zero complaints still appears.

`database/queries.sql` has the viva versions of these joins.

## Indexes

- Queue index on `(status, priority, created_at, complaint_id)`
- Lookup index on resources `(resource_type, status)`
- Foreign-key indexes on citizen, category, complaint, and resource

Unique keys are indexes as well.

## Views

Views are saved `SELECT`s. They do not copy the rows. `priority_queue_view` is the scheduler's reading of waiting work. `allocation_report_view` adds `TIMESTAMPDIFF` so response time is computed, not stored (that stored copy would be redundant and would go stale).

## Transactions, COMMIT, and ROLLBACK

`server/utils/transaction.js` is the helper:

```text
get a connection from the pool
BEGIN
  run the work
COMMIT
on any throw: ROLLBACK
always release the connection
```

Complaint creation uses one transaction so the `NEW` history row and the move to `WAITING` are both stored or neither is. Allocation, start, complete, cancel, and reassign each have their own transaction. A pass over the queue uses one transaction per complaint, so a complaint that has no free resource does not undo an earlier successful assignment.

## ACID

| Property | How CSMS shows it |
| --- | --- |
| Atomicity | Resource status, allocation row, and complaint status commit together. A failure rolls all of them back |
| Consistency | Checks, foreign keys, and the unique active-lock columns reject states the rules do not allow |
| Isolation | `SELECT ... FOR UPDATE` stops two transactions from allocating the same available row |
| Durability | After `COMMIT`, InnoDB keeps the result. Restarting the API does not forget that a resource is `BUSY` |

## SQL injection

User values are passed as `?` parameters. The only SQL fragments built in code are fixed `ORDER BY` strings chosen inside the model, not text from the query string. An attacker cannot end the statement early by typing into the address or description.

## What is intentionally not duplicated

Response minutes are calculated in the allocation view. Citizen names are joined, not copied onto complaints. That is the same 3NF argument as in `docs/07-normalization.md`.
