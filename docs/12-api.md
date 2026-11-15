# API documentation

Base URL in development: `http://localhost:5000/api`

The React dev server proxies `/api`, so the browser calls `http://localhost:5173/api/...`.

## Response shape

Success:

```json
{ "success": true, "message": "optional", "data": {} }
```

Validation error (HTTP 400):

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [{ "field": "priority", "message": "Priority must be 1 (Critical) through 4 (Low)." }]
}
```

Other errors:

```json
{ "success": false, "message": "Human-readable reason" }
```

## Authentication

### POST /api/auth/register

```json
{
  "full_name": "Meera Shah",
  "email": "meera.shah@example.com",
  "phone": "9000000099",
  "password": "Citizen@123"
}
```

Returns HTTP 201, a token, and the user. Role is always `CITIZEN`.

### POST /api/auth/login

```json
{ "email": "admin@csms.gov.in", "password": "Admin@12345" }
```

### GET /api/auth/me

Requires the bearer token. Returns the current user.

### PUT /api/auth/profile

```json
{ "full_name": "Meera S. Shah", "phone": "9000000098" }
```

### PUT /api/auth/password

```json
{ "current_password": "Citizen@123", "new_password": "Citizen@456" }
```

## Complaints

### POST /api/complaints

Citizen only.

```json
{
  "title": "Water tanker needed",
  "description": "The society sump has been empty since morning.",
  "address": "Lane 2, Kothrud",
  "category_id": 2,
  "priority": 2,
  "latitude": 18.5074,
  "longitude": 73.8077
}
```

`data.complaint` is the saved row. `data.allocation.allocated` is true when a resource was assigned immediately. Otherwise the complaint is `WAITING` and `data.allocation.message` explains why.

### GET /api/complaints/my

Citizen only. Returns `complaints` and `summary` counts.

### GET /api/complaints/:id

Owner or administrator. Returns `complaint`, `history`, `allocations`, and `queue` when the status is `WAITING`.

### PATCH /api/complaints/:id/cancel

Owner or administrator, and only while the status is `NEW`, `WAITING`, or `ASSIGNED`.

### PATCH /api/complaints/:id/status

Administrator only.

```json
{ "status": "IN_PROGRESS" }
```

Allowed values are `IN_PROGRESS`, `COMPLETED`, and `CANCELLED`. The handler calls the allocation service so a status change cannot leave a resource busy by accident. Assignment itself is not done through this route.

## Admin reads

### GET /api/admin/dashboard

Counts, the first waiting rows, and recent complaints.

### GET /api/admin/complaints?status=WAITING&category_id=1&priority=1

All filters are optional.

### GET /api/admin/complaints/queue

Waiting complaints with `queue_position` and `available_resource_count`.

### GET /api/admin/reports

Category, priority, and status counts, resource counts, average minutes to allocation, average minutes to completion, and recent completed rows.

## Departments and categories

- `GET /api/categories` is public so the home page and the complaint form can list services.
- `GET /api/categories/resource-types` is admin-only and feeds the resource form.
- `GET /api/departments` requires login.
- `POST`, `PUT`, and `DELETE /api/departments` are admin-only.

```json
{ "department_name": "Garden Department", "description": "Parks and roadside trees." }
```

Deleting a department that still has categories or resources returns HTTP 409.

## Resources

Admin only.

`GET /api/resources?status=AVAILABLE&type=Ambulance&department_id=1`

```json
{
  "department_id": 1,
  "resource_name": "City Ambulance 4",
  "resource_type": "Ambulance",
  "registration_or_identifier": "AMB-104",
  "status": "AVAILABLE",
  "current_location": "Kothrud Depot"
}
```

`resource_type` must already exist on a service category. `status` on create and update cannot be `BUSY`.

`PATCH /api/resources/:id/status` accepts `AVAILABLE`, `MAINTENANCE`, or `OFFLINE`.

`DELETE` returns 409 when the resource is busy or has allocation history.

## Allocations

Admin only.

### POST /api/allocations/auto

```json
{ "mode": "next" }
```

```json
{ "mode": "pass" }
```

```json
{ "complaint_id": 4 }
```

A specific `complaint_id` still obeys queue order. It allocates that complaint only when nobody compatible is ahead and a resource is free.

### POST /api/allocations/manual

```json
{ "complaint_id": 4, "resource_id": 6, "remarks": "Nearest tanker" }
```

This may pass an earlier request. Wrong type or a non-available resource is rejected.

### PATCH /api/allocations/:id/start

### PATCH /api/allocations/:id/complete

Complete also runs another scheduling pass. The message says so when further complaints were allocated.

### PATCH /api/allocations/:id/reassign

```json
{ "resource_id": 2 }
```

Only while the allocation status is `ALLOCATED`.

### GET /api/allocations

Rows from `allocation_report_view`, newest first.
