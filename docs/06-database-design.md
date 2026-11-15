# Database design

Database name: `csms_db`. Engine: InnoDB. Character set: `utf8mb4`.

MySQL 8.0.16 or newer is required because the schema uses `CHECK`.

## Tables

### users

| Column | Notes |
| --- | --- |
| user_id | Primary key |
| full_name | Required |
| email | Unique, required |
| phone | Unique, required |
| password_hash | bcrypt hash, required. Never selected by profile APIs |
| role | `CITIZEN` or `ADMIN` |
| created_at | Set when the row is inserted |

Email and phone are candidate keys as well as the surrogate `user_id`.

### departments

| Column | Notes |
| --- | --- |
| department_id | Primary key |
| department_name | Unique |
| description | Optional |

### service_categories

| Column | Notes |
| --- | --- |
| category_id | Primary key |
| category_name | Unique |
| department_id | Foreign key to departments. `ON DELETE RESTRICT` |
| required_resource_type | The resource type this service needs, for example `Ambulance` |
| description | Optional |

New services are new rows. Application code does not hard-code the five names, except for the home-page explanation.

### complaints

| Column | Notes |
| --- | --- |
| complaint_id | Primary key |
| citizen_id | Foreign key to users |
| category_id | Foreign key to service_categories |
| title, description, address | Required |
| latitude, longitude | Optional, checked to be real coordinates |
| priority | `CHECK (priority BETWEEN 1 AND 4)` |
| status | `NEW`, `WAITING`, `ASSIGNED`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED` |
| created_at, updated_at | Arrival time is the FCFS clock |

Index `idx_complaints_queue` is `(status, priority, created_at, complaint_id)` so the scheduler's order can use the index.

### resources

| Column | Notes |
| --- | --- |
| resource_id | Primary key |
| department_id | Foreign key |
| resource_name | Required |
| resource_type | Must match a category's `required_resource_type` |
| registration_or_identifier | Unique, for example `AMB-101` |
| status | `AVAILABLE`, `BUSY`, `MAINTENANCE`, `OFFLINE` |
| current_location | Optional |

Index `idx_resources_lookup` is `(resource_type, status)`.

### resource_allocations

| Column | Notes |
| --- | --- |
| allocation_id | Primary key |
| complaint_id, resource_id | Foreign keys |
| allocated_at, started_at, completed_at | Timeline of the assignment |
| allocation_status | `ALLOCATED`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`, `REASSIGNED` |
| allocated_by | Administrator, or null when the system scheduled it |
| active_resource_lock | Generated column. Equals `resource_id` only while the allocation is open. Unique |
| active_complaint_lock | Generated column. Equals `complaint_id` only while the allocation is open. Unique |

Completed and cancelled rows store `NULL` in those generated columns. MySQL allows many `NULL`s in a unique index, so history can repeat while only one open allocation can hold a given resource or complaint.

### complaint_status_history

One row per state change: old status, new status, who changed it, a remark, and the time. Deleting a complaint is not offered in the app. History uses `ON DELETE CASCADE` so a future maintenance delete would not leave orphan history.

## Relationships

```text
departments 1---* service_categories
departments 1---* resources
users 1---* complaints
service_categories 1---* complaints
complaints 1---* resource_allocations
resources 1---* resource_allocations
complaints 1---* complaint_status_history
users 1---* complaint_status_history (changed_by, optional)
```

## Views

- `active_complaints_view` — complaints that are not finished, with citizen and department
- `available_resources_view` — resources whose status is `AVAILABLE`
- `allocation_report_view` — allocations with response time in minutes
- `priority_queue_view` — waiting complaints in scheduler order, with a count of free compatible resources

The queue view includes `LIMIT` because MySQL otherwise may ignore `ORDER BY` inside a view. The API also repeats `ORDER BY priority, created_at, complaint_id`.
