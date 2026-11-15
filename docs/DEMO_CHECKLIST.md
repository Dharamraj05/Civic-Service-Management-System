# CSMS demo checklist

Use this page during the viva. Keep both terminals open.

## A. How to start the project

MySQL service `MySQL80` must already be running.

**If you already allocated complaints during practice, reset first** (Workbench, in this order):

```sql
DROP DATABASE IF EXISTS csms_db;
```

Then execute:

1. `database/schema.sql`
2. `database/views.sql`
3. `database/seed.sql`

If you **keep** the existing database (do not drop it), run this once so photo/warning tables exist:

4. `database/migrate_evidence.sql`

**Backend** (terminal 1):

```powershell
cd "E:\5th se pbl\server"
npm run dev
```

Wait for: `CSMS API running at http://localhost:5000`

**Frontend** (terminal 2):

```powershell
cd "E:\5th se pbl\client"
npm run dev
```

Open: `http://localhost:5173`

Do not start Vite until the API line has printed. If Vite is already open and you later start the API, refresh the browser.

Optional smoke check (does not allocate or delete):

```powershell
cd "E:\5th se pbl\server"
npm run smoke
```

## B. Login credentials

| Role | Email | Password |
| --- | --- | --- |
| Admin | admin@csms.gov.in | Admin@12345 |
| Citizen | ravi.kumar@example.com | Citizen@123 |

Other seeded citizens also use `Citizen@123`. Registration always creates a citizen.

## C. 5-minute demo script

Reset the database immediately before this if the Priority Queue is empty.

1. Open `http://localhost:5173`. Point at the five civic services and the three scheduling rules.
2. Click **Staff and citizen login**. Sign in as `ravi.kumar@example.com` / `Citizen@123`.
3. Show **Your requests** (totals + recent complaints). This uses `GET /api/complaints/my`.
4. Click **Submit complaint**. File a **Low / Garbage Collection** request with a short title, description, and address. Submit. Show the new complaint id and status `Waiting`.
5. Open **My complaints** → **Open** the new row. Show the timeline: Submitted → Waiting.
6. **Log out**. Sign in as `admin@csms.gov.in` / `Admin@12345`.
7. Admin **City desk**: totals, recent complaints.
8. **Priority queue**. Sort is `priority ASC`, then `created_at ASC`.
   - Complaint **#1** (Critical, 08:05, Medical / Ambulance) is **ahead of** an earlier High water request (#4 at 07:40). That is **priority scheduling**.
   - #4 is ahead of #5 (both High water). That is **FCFS**.
9. Click **Allocate next**. #1 becomes Assigned to **AMB-101**. Open **Resources**: AMB-101 is **BUSY**.
10. Open complaint #1 → **Start service** → **Mark completed**. Status history shows the full lifecycle. AMB-101 becomes AVAILABLE, then may go BUSY again if the scheduler immediately gives it to the next medical request. That is intended.
11. **Resources** and **Reports** (counts from MySQL, not hardcoded).
12. In Workbench: `SELECT * FROM priority_queue_view;` and `SELECT * FROM resource_allocations;` (unique `active_resource_lock`).

## D. OS concepts (this project)

| Concept | Where it is |
| --- | --- |
| Process | One complaint = one process (`complaints` row) |
| Process state | `status`: NEW → WAITING → ASSIGNED → IN_PROGRESS → COMPLETED (or CANCELLED) |
| Priority scheduling | Smaller `priority` number first (1 Critical … 4 Low). SQL `ORDER BY priority ASC` |
| FCFS | Equal priority: older `created_at` first, then `complaint_id` |
| Queue | All `WAITING` rows; admin **Priority queue** and `priority_queue_view` |
| Synchronization | InnoDB transaction + `SELECT … FOR UPDATE` in `server/services/allocationService.js` |
| Race condition | Two admins clicking Allocate on the last ambulance at the same time |
| Critical section | The allocation transaction: lock rows, mark BUSY, insert allocation, mark ASSIGNED, COMMIT |
| Resource allocation | Matching `AVAILABLE` resource of `required_resource_type`; unique `active_resource_lock` |

## E. DBMS concepts (this project)

| Concept | Where it is |
| --- | --- |
| Primary key | Every table `*_id` |
| Foreign key | e.g. `complaints.citizen_id` → `users.user_id` |
| Normalization | Names and phones live on `users`, not copied onto every complaint (3NF) |
| JOIN | Complaint lists join users, categories, departments, allocations |
| Index | `idx_complaints_queue (status, priority, created_at, complaint_id)` |
| Constraint | `CHECK (priority BETWEEN 1 AND 4)`, unique email/phone |
| Transaction | `server/utils/transaction.js` BEGIN / COMMIT / ROLLBACK |
| ACID | One COMMIT writes complaint + resource + allocation together |
| View | `priority_queue_view`, `available_resources_view`, `allocation_report_view`, `active_complaints_view` |
| Referential integrity | Cannot delete a department that still has resources; FKs use RESTRICT |

Allocation FKs on `complaint_id` / `resource_id` use **ON UPDATE RESTRICT** (not CASCADE) because those columns feed stored generated lock columns. MySQL 8 Error 1215 otherwise.

## F. Top 20 viva questions

1. **What problem does CSMS solve?** Limited civic vehicles vs many requests; the system queues by urgency and assigns a free matching resource.
2. **Why two roles?** Citizens file and track their own requests. Admins run the desk. JWT `role` blocks citizens from `/api/admin/*`.
3. **How are passwords stored?** bcrypt hashes in `users.password_hash`. APIs never return that column.
4. **What is in the JWT?** `userId` and `role` only, signed with `JWT_SECRET`.
5. **How is a complaint a process?** It is created, waits for a device, runs, then terminates.
6. **Why is priority 1 higher than 4?** The scheduler sorts `priority ASC`.
7. **Give an FCFS example.** Seed #4 and #5 are both priority 2 water; #4 is older so it is first.
8. **Can a garbage truck serve a medical request?** No. The category’s `required_resource_type` must match `resources.resource_type`.
9. **What if no ambulance is free?** Complaint stays WAITING. Message: “No compatible resource is currently available.” The API does not crash.
10. **What is Allocate next vs Run allocation pass?** Next = only the head of the queue. Pass = walk the whole queue; a blocked type stays waiting while another type can still be served.
11. **How do you stop double-booking?** Transaction + row lock + unique generated `active_resource_lock`.
12. **What is ROLLBACK for?** If marking BUSY or INSERT fails, nothing is kept half-updated.
13. **Why BUSY is not set in the resource form?** Only the allocator (or cancel/complete) may change BUSY ↔ AVAILABLE.
14. **Why might a just-released ambulance look BUSY again?** Completion runs another allocation pass; the next waiting medical request takes it.
15. **What is 3NF here?** Department name is not stored on complaints; it is joined through the category.
16. **Name two views.** `priority_queue_view` and `allocation_report_view`.
17. **How is SQL injection avoided?** `mysql2` placeholders (`?`), not string concatenation of user input.
18. **What HTTP status is a wrong password?** 401, same message as unknown email.
19. **Can a citizen cancel an in-progress job?** No. Only NEW / WAITING / ASSIGNED.
20. **Why Error 1215 on CASCADE?** InnoDB forbids ON UPDATE CASCADE on columns used in stored generated expressions.

## G. Emergency troubleshooting

| Symptom | Fix |
| --- | --- |
| `ECONNREFUSED` | Backend is not listening. `cd server` → `npm run dev`. Confirm `http://localhost:5000/api/health`. |
| `ECONNRESET` then `ECONNREFUSED` | API process died or `--watch` restarted in the middle of a request. Check the server terminal. Restart `npm run dev` in `server`. Refresh the browser. |
| MySQL connection failure | Services → MySQL80 Running. Check `server/.env` `DB_HOST`, `DB_USER`, `DB_NAME=csms_db`, password. Do not print the password in the viva. |
| Port 5000 already in use | Close the other `node` window, or in PowerShell: `Get-NetTCPConnection -LocalPort 5000`. |
| Frontend cannot reach backend | Vite proxies `/api` to `http://localhost:5000`. Both must run. Open API health directly to isolate. |
| Login failure | Use seeded emails exactly. After a reset, passwords are `Admin@12345` / `Citizen@123`. Caps Lock. |
| Empty dashboard / empty queue | Data was allocated in practice. Drop `csms_db` and re-run schema → views → seed. |
| Vite proxy failure | Same as ECONNREFUSED. Start backend first. Message in the UI: “Cannot reach the CSMS API…” |
| `Error 1215` on schema | Allocation FKs must be `ON UPDATE RESTRICT`, not CASCADE. Use the current `database/schema.sql`. |
| Missing evidence/flag tables | Run `database/migrate_evidence.sql` without dropping the rest of the database. |
| Flag says email not configured | Expected unless SMTP is set in `server/.env`. The notice is in `server/logs/email-warnings.log`. |

## OS MODULE DEMONSTRATION

Admin → **OS scheduling** (`/admin/os`). Dark navy banner: “This screen demonstrates OS”.

1. **Priority scheduling:** Live waiting queue sorted `priority ASC`. P1 is position 1 even if a P2 arrived earlier.
2. **FCFS:** Two P2 water requests — older `created_at` is higher in the list.
3. **Process states:** Click **Show process**. Timeline NEW → WAITING → ASSIGNED → IN_PROGRESS → COMPLETED.
4. **Resource allocation:** **Allocate next**. Matching AVAILABLE resource becomes BUSY; complaint becomes ASSIGNED.
5. **Synchronization:** Explain `SELECT … FOR UPDATE` plus unique `active_resource_lock` so two allocations cannot own one vehicle.

Keep **Priority queue** (`/admin/queue`) for the original demo if you prefer that screen.

## DBMS MODULE DEMONSTRATION

Admin → **DBMS implementation** (`/admin/dbms`). Teal banner: “This screen demonstrates DBMS”.

1. **Tables:** Live counts of users, complaints, departments, resources, allocations, history, evidence, flags.
2. **PK/FK:** USER → COMPLAINT → RESOURCE_ALLOCATION → RESOURCE and DEPARTMENT → RESOURCE.
3. **Relationships:** JOIN table showing real ids from MySQL.
4. **Queries:** Those JOINs and the queue query.
5. **Views:** `priority_queue_view`, `available_resources_view`, `allocation_report_view`.
6. **Transactions:** On-screen BEGIN … COMMIT / ROLLBACK matching `allocationService.js`.
7. **Referential integrity:** Allocation FKs remain ON UPDATE RESTRICT / ON DELETE RESTRICT.

## PHOTO EVIDENCE DEMONSTRATION

1. Citizen → **Submit complaint**.
2. **Add photo evidence** → **Take photo** (back/front) or **Choose from gallery**.
3. Preview the image.
4. **Retake** or **Delete** if it is the wrong photo.
5. Submit. The file is stored under `server/uploads/evidence/` and a `complaint_evidence` row is inserted.
6. Admin opens the complaint → **Photo evidence** (loaded through an authenticated API, not a public folder).

## INVALID INFORMATION WARNING

1. Admin opens a complaint.
2. **Flag complaint** → Wrong photo / Wrong information / Insufficient evidence / Other.
3. Enter a reason of at least 10 characters.
4. The system reads `users.email` for that complaint’s citizen. The admin cannot type another address.
5. If SMTP is configured, a warning email is sent. If not, the same text is written to `server/logs/email-warnings.log` and the UI says email is not configured.
6. The action is stored in `complaint_flags`.
