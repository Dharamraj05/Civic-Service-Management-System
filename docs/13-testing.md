# Testing

Import the database and start the API before the Postman checks. The collection `docs/CSMS.postman_collection.json` points at `http://localhost:5000/api`. After login, copy the token into the collection variable `token`, or paste it as a Bearer token.

`cd server` then `npm test` checks priority-then-FCFS ordering without MySQL. It does not open a transaction. The scenarios below do.

## Accounts

- Admin: `admin@csms.gov.in` / `Admin@12345`
- Citizen: `ravi.kumar@example.com` / `Citizen@123`

## Scenarios

### 1. Citizen registration

`POST /api/auth/register` with a new email and a 10-digit phone. Expect HTTP 201, a token, and `"role": "CITIZEN"`. Repeat the same email. Expect HTTP 409.

### 2. Correct login

`POST /api/auth/login` as the admin. Expect HTTP 200 and a token. `GET /api/auth/me` with that token returns the admin and no `password_hash`.

### 3. Incorrect login

Wrong password. Expect HTTP 401 and "Invalid email or password." The same message is used for an unknown email.

### 4. Unauthorized admin access

Call `GET /api/admin/complaints` with no token. Expect HTTP 401.

Log in as Ravi and call the same URL with his token. Expect HTTP 403. In the browser, opening `/admin` as Ravi shows the restricted page.

### 5. Complaint creation

As Ravi, `POST /api/complaints` with category 1 (Medical Emergency), priority 3, a title, a description of at least 10 characters, and an address. Expect HTTP 201. The complaint id is in `data.complaint.complaint_id`. Status is `WAITING` unless this request was the first medical request and an ambulance was free.

Omit the title. Expect HTTP 400 and a validation error.

### 6. Priority sorting

`GET /api/admin/complaints/queue` as admin, before clicking Allocate.

On a fresh seed the waiting order is:

| Position | Id | Priority | Filed | Why |
| --- | --- | --- | --- | --- |
| 1 | 1 | 1 | 14 Oct 08:05 | Critical, earliest critical |
| 2 | 2 | 1 | 14 Oct 08:20 | Critical, later than 1 |
| 3 | 3 | 1 | 14 Oct 09:10 | Critical police request |
| 4 | 4 | 2 | 14 Oct 07:40 | High, but after every critical |
| 5 | 5 | 2 | 14 Oct 10:15 | High water, after 4 |
| 6 | 14 | 2 | 14 Oct 12:30 | High garbage |
| 7 | 6 | 3 | 13 Oct 16:00 | Medium, older clock, still after priority 2 |
| 8 | 7 | 3 | 14 Oct 11:00 | Medium medical |
| 9 | 8 | 4 | 12 Oct 09:00 | Low, even though it is the oldest request |

Complaint 10 is also Critical, but it is `IN_PROGRESS`, so it is not in the waiting queue.

### 7. Equal-priority FCFS

Complaints 4 and 5 are both priority 2 and both need a water tanker. 4 is ahead of 5 because 07:40 is earlier than 10:15. Complaint 4 is not ahead of complaint 1, because 1 has a better priority.

### 8. Resource allocation

`POST /api/allocations/auto` with `{ "mode": "next" }`.

Expect complaint 1 to become `ASSIGNED` to `AMB-101` (resource id 1). `GET /api/resources` shows `AMB-101` as `BUSY`. A second active allocation for that resource should be impossible: the unique `active_resource_lock` rejects it.

### 9. No resource available

`POST /api/allocations/auto` with `{ "mode": "next" }` twice, so complaints 1 and 2 take `AMB-101` and `AMB-102`. `AMB-103` is already busy on complaint 9. No ambulance is free.

Then `POST /api/allocations/auto` with `{ "complaint_id": 7 }`. Complaint 7 is the remaining waiting medical request. Expect `"allocated": false` and the message "No compatible resource is currently available." The complaint stays `WAITING`. The API does not crash.

The head of the queue is now complaint 3 (police), which can still be served because a patrol vehicle is free. **Run allocation pass** (`{ "mode": "pass" }`) serves that police request and other types that still have a free resource. It does not give complaint 7 an ambulance.

### 10. Completion and release

Open the allocation for a complaint that is `ASSIGNED`. `PATCH /api/allocations/:id/start`, then `PATCH /api/allocations/:id/complete`.

Expect the complaint to be `COMPLETED` and that resource to be `AVAILABLE`. If another compatible complaint is waiting, the completion response says the scheduler allocated further work.

### 11. Concurrent allocation

This needs two Postman requests sent together, or two browser sessions, both calling `POST /api/allocations/manual` for the same `AVAILABLE` resource and two waiting complaints of that type.

Expect one HTTP 201 and one HTTP 409 (or a message that the resource is no longer available). Afterwards exactly one of those complaints is `ASSIGNED`, and the resource is `BUSY` once. In Workbench:

```sql
SELECT resource_id, allocation_status
FROM resource_allocations
WHERE allocation_status IN ('ALLOCATED', 'IN_PROGRESS');
```

No `resource_id` appears twice.

### 12. Invalid input

- Priority `9` on create: HTTP 400
- Latitude `200`: HTTP 400
- Manual allocation of a garbage truck to a medical complaint: HTTP 400
- `PATCH` a `BUSY` resource to `AVAILABLE`: HTTP 400, with a message to complete or cancel the complaint instead

## Browser checks

- Home, login, and register on a wide window and a narrow window
- Citizen dashboard, submit, list, and timeline
- Admin queue, resources (add, then delete an unused row), and reports
- Destructive actions ask for confirmation: delete resource, delete department, cancel complaint
