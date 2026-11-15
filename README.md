# Civic Service Management System (CSMS)

Smart resource allocation for better public services.

CSMS is a college project for a 5th-semester PBL. It is a working web application, not a static prototype. Citizens file civic and emergency requests. Administrators queue those requests and assign a limited pool of city resources. The allocation engine demonstrates **priority scheduling**, **FCFS**, a **waiting queue**, **process states**, and **mutual exclusion**. The MySQL schema demonstrates relational design, constraints, joins, views, and transactions.

## Problem statement

A city has fewer ambulances, water tankers, garbage trucks, repair teams, and patrol vehicles than open requests. If assignment is manual and unordered, a low-urgency job can take the last ambulance while a critical request waits. CSMS records every request, keeps a priority queue, and allocates a free resource of the correct type without giving the same resource to two active complaints.

## Objectives

- Let citizens register, sign in, file a request, and track its state.
- Let an administrator manage departments, resources, and allocations.
- Serve higher-priority requests first, and older requests first when priority is equal.
- Match each service category to the correct resource type.
- Protect allocation with a database transaction and row locks.
- Show the operating-system and database ideas directly in the schema, SQL, and `allocationService.js`.

## Features

- Citizen registration and login, profile update, and password change
- Complaint submission with category, priority, address, and optional coordinates
- Complaint list, status timeline, and allocated resource
- Admin dashboard with counts, queue preview, and recent complaints
- Priority queue sorted by priority, then arrival time
- Automatic allocation of the next request, or a full pass over the queue
- Manual allocation and reassignment, still protected by the same transaction
- Start and complete a job; the resource returns to `AVAILABLE`
- Department and resource management
- Reports: category, priority, status, utilization, and average response time
- Role-based access: citizens cannot open admin APIs or pages

## Operating system concepts

| Concept | Where it appears |
| --- | --- |
| Process | A complaint is treated as a process |
| Priority scheduling | `ORDER BY priority ASC` — 1 (Critical) runs before 4 (Low) |
| FCFS | Equal priority uses `created_at ASC`, then `complaint_id` |
| Queue | `WAITING` complaints are the ready queue (`priority_queue_view`) |
| Process states | `NEW → WAITING → ASSIGNED → IN_PROGRESS → COMPLETED`, plus `CANCELLED` |
| Mutual exclusion | One active allocation per resource, enforced by a transaction, `SELECT ... FOR UPDATE`, and a unique generated column |
| Critical section | The allocation transaction: pick resource, mark it `BUSY`, insert allocation, mark complaint `ASSIGNED`, then `COMMIT` |

The readable implementation is `server/services/allocationService.js`. The same ordering rule is unit-tested in `server/utils/scheduler.js`.

## DBMS concepts

- Entities in third normal form, with primary keys, foreign keys, and unique keys
- `NOT NULL` and `CHECK` constraints (priority 1–4, latitude, longitude)
- Indexes for the queue and for resource lookup
- Joins across complaints, citizens, categories, departments, and resources
- Views: `active_complaints_view`, `available_resources_view`, `allocation_report_view`, `priority_queue_view`
- InnoDB transactions with `COMMIT` and `ROLLBACK` (atomicity and consistency)
- Parameterized queries (no string-built SQL from user input)

## Technology stack

| Layer | Choice |
| --- | --- |
| Frontend | React.js, JavaScript, HTML5, CSS3, React Router, Axios |
| Backend | Node.js, Express.js |
| Database | MySQL 8.0.16+ with `mysql2` |
| Security | bcrypt, JWT, role checks, express-validator |
| Tools | Visual Studio Code, MySQL Workbench, Postman |

Firebase, Supabase, MongoDB, PostgreSQL, Next.js, and TypeScript are not used.

## Project structure

```text
database/
  schema.sql          tables, keys, indexes
  views.sql           reporting and queue views
  seed.sql            demo users, resources, complaints
  queries.sql         viva queries
server/
  config/             MySQL pool
  controllers/        HTTP layer
  middleware/         JWT, roles, validation, errors
  models/             SQL for one entity
  routes/             URL map
  services/           allocation engine and other business rules
  utils/              transactions, scheduler, errors
  app.js              Express app
  server.js           start-up and database check
client/
  src/pages           public, citizen, and admin screens
  src/components      layout, tables, badges
docs/                 synopsis, design, API, testing, diagrams
```

## Installation

Requirements:

- Node.js 18 or newer (this project was checked on Node.js 24)
- MySQL Server 8.0.16 or newer, so `CHECK` constraints are enforced
- MySQL Workbench, or the `mysql` command-line client

From the project folder:

```powershell
npm run install:all
```

Or install each app yourself:

```powershell
cd server
npm install
cd ..\client
npm install
```

## MySQL setup

1. Start MySQL.
2. Open MySQL Workbench and connect.
3. Open and execute these files **in this order**:
   1. `database/schema.sql`
   2. `database/views.sql`
   3. `database/seed.sql`
4. Optional: run the statements in `database/queries.sql` during the viva.

`schema.sql` creates the database `csms_db` and replaces the tables if you run it again. Running it again wipes demo and live data. After a reset, run `views.sql` and `seed.sql` again.

Command-line equivalent, if `mysql` is on your PATH:

```powershell
mysql -u root -p < database/schema.sql
mysql -u root -p < database/views.sql
mysql -u root -p < database/seed.sql
```

On PowerShell, if redirection fails, use:

```powershell
cmd /c "mysql -u root -p < database/schema.sql"
```

## Environment variables

```powershell
cd server
copy .env.example .env
```

Edit `server/.env`:

```text
PORT=5000
NODE_ENV=development
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=csms_db
JWT_SECRET=change_this_to_a_long_random_secret
JWT_EXPIRES_IN=8h
CLIENT_ORIGIN=http://localhost:5173
```

`server/.env` is git-ignored. Do not commit a real password or a production JWT secret.

## Run the backend

```powershell
cd server
npm run dev
```

The API listens on `http://localhost:5000`. `npm start` runs it without file watching.

Open `http://localhost:5000/api/health`. A successful response says the database is connected. If MySQL is stopped or the password is wrong, the process prints the reason and exits.

## Run the frontend

In a second terminal:

```powershell
cd client
npm run dev
```

Open `http://localhost:5173`. Vite proxies `/api` to port 5000, so the browser talks to the React app and the API on one origin during development.

Production build:

```powershell
cd client
npm run build
```

## Demo accounts

Passwords are stored only as bcrypt hashes.

| Role | Email | Password |
| --- | --- | --- |
| Admin | admin@csms.gov.in | Admin@12345 |
| Citizen | ravi.kumar@example.com | Citizen@123 |
| Citizen | anita.desai@example.com | Citizen@123 |
| Citizen | mohammed.irfan@example.com | Citizen@123 |
| Citizen | priya.nair@example.com | Citizen@123 |
| Citizen | suresh.patil@example.com | Citizen@123 |
| Citizen | lakshmi.iyer@example.com | Citizen@123 |

Registration always creates a citizen. It cannot create an administrator.

### Suggested viva path

1. Log in as the administrator and open **Priority queue**.
2. Show the sort: complaint 1 (Critical, 08:05) is ahead of complaint 4 (High, 07:40) even though 4 was filed earlier. That is priority scheduling.
3. Show complaints 4 and 5, both Water Supply / priority 2. Complaint 4 is ahead because it is older. That is FCFS.
4. Click **Allocate next**. The engine should give complaint 1 the first free ambulance (`AMB-101`) and mark that ambulance `BUSY`.
5. Open the complaint and click **Start service**, then **Mark completed**. The ambulance returns to `AVAILABLE`, and the scheduler offers it to the next waiting request.
6. Log out, log in as `ravi.kumar@example.com`, and open the complaint timeline.
7. In Workbench, run `SELECT * FROM priority_queue_view;` and show `resource_allocations.active_resource_lock`.

Re-run `schema.sql`, `views.sql`, and `seed.sql` if you want the original queue back after the demo.

## API overview

| Method | Path | Who |
| --- | --- | --- |
| POST | `/api/auth/register` | Public |
| POST | `/api/auth/login` | Public |
| GET | `/api/auth/me` | Signed in |
| PUT | `/api/auth/profile` | Signed in |
| PUT | `/api/auth/password` | Signed in |
| GET | `/api/categories` | Public |
| POST | `/api/complaints` | Citizen |
| GET | `/api/complaints/my` | Citizen |
| GET | `/api/complaints/:id` | Owner or admin |
| PATCH | `/api/complaints/:id/cancel` | Owner or admin |
| PATCH | `/api/complaints/:id/status` | Admin |
| GET | `/api/admin/dashboard` | Admin |
| GET | `/api/admin/complaints` | Admin |
| GET | `/api/admin/complaints/queue` | Admin |
| GET | `/api/admin/reports` | Admin |
| GET/POST | `/api/departments` | GET: signed in, POST: admin |
| PUT/DELETE | `/api/departments/:id` | Admin |
| GET/POST | `/api/resources` | Admin |
| PUT | `/api/resources/:id` | Admin |
| PATCH | `/api/resources/:id/status` | Admin |
| DELETE | `/api/resources/:id` | Admin |
| GET | `/api/allocations` | Admin |
| POST | `/api/allocations/auto` | Admin |
| POST | `/api/allocations/manual` | Admin |
| PATCH | `/api/allocations/:id/start` | Admin |
| PATCH | `/api/allocations/:id/complete` | Admin |
| PATCH | `/api/allocations/:id/reassign` | Admin |

Send the JWT as `Authorization: Bearer <token>`.

`POST /api/allocations/auto` accepts:

```json
{ "mode": "next" }
```

```json
{ "mode": "pass" }
```

```json
{ "complaint_id": 1 }
```

`mode: "next"` serves only the single highest waiting complaint. If that service has no free resource, the complaint stays `WAITING` and the engine does not skip it. `mode: "pass"` walks the whole queue in the same order. A blocked resource type stays waiting, while another service that still has a free vehicle can be served. Details are in `docs/10-allocation-algorithm.md`.

## Allocation algorithm

```text
New complaint is saved as NEW, then WAITING
        |
        v
Wake the scheduler (also available from the admin queue)
        |
        v
Read WAITING complaints
ORDER BY priority ASC, created_at ASC, complaint_id ASC
        |
        v
For a candidate complaint, stop if an earlier compatible request is still waiting
        |
        v
SELECT one AVAILABLE resource of the required type
FOR UPDATE
        |
        +--> none: leave the complaint WAITING
        |         "No compatible resource is currently available."
        |
        v
Mark resource BUSY
Insert allocation
Mark complaint ASSIGNED
Write status history
COMMIT
```

If any step fails, the transaction rolls back. A unique generated column, `active_resource_lock`, is a second guard so two open allocations cannot own the same resource.

A citizen submission also runs one allocation pass. A new low-priority request cannot take a resource while an earlier compatible request is still waiting. Completing or cancelling a job frees the resource and runs the scheduler again.

Manual assignment is an administrator override of queue order. It still refuses the wrong resource type and any resource that is not `AVAILABLE`, and it still uses the transaction.

## Scheduler test without MySQL

```powershell
cd server
npm test
```

This checks the priority-then-FCFS ordering used by the SQL `ORDER BY`. It does not replace a database test of the transaction.

## Screenshots

Add these after you run the app. Suggested captures:

- Home page with the five services
- Citizen registration and login
- Submit complaint confirmation
- Complaint timeline
- Admin dashboard
- Priority queue, before and after **Allocate next**
- Resource table showing `AVAILABLE` and `BUSY`
- Reports page

Put the image files in `docs/screenshots/` and link them here.

## Future improvements

- More than one city zone, with resources chosen by distance
- SMS or email when a resource is assigned
- A dispatcher map
- Shift calendars and maintenance schedules
- Audit log of administrator overrides
- Pagination for very large complaint tables

## Documentation map

| File | Contents |
| --- | --- |
| `docs/01-project-synopsis.md` | Synopsis |
| `docs/02-problem-statement.md` | Problem |
| `docs/03-objectives-and-scope.md` | Objectives and scope |
| `docs/04-requirements.md` | Functional and non-functional requirements |
| `docs/05-system-architecture.md` | Architecture |
| `docs/06-database-design.md` | Tables and keys |
| `docs/07-normalization.md` | 1NF, 2NF, 3NF |
| `docs/08-os-concepts.md` | Scheduling, queue, states, mutual exclusion |
| `docs/09-dbms-concepts.md` | Constraints, views, transactions, ACID |
| `docs/10-allocation-algorithm.md` | Step-by-step allocator |
| `docs/11-security.md` | Passwords, JWT, RBAC, SQL injection |
| `docs/12-api.md` | Request and response notes |
| `docs/13-testing.md` | Postman and viva scenarios |
| `docs/14-future-scope.md` | Later work |
| `docs/diagrams.md` | Mermaid diagrams |
| `docs/CSMS.postman_collection.json` | Postman collection |
