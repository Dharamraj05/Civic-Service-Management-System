# Normalization

The schema is in third normal form. Each non-key column depends on the key, the whole key, and nothing but the key.

## First normal form

Every column holds one value. Priority is a number, not a list. Status history is not packed into one text column on the complaint; each change is its own row. A complaint does not store several resource names in one field.

## Second normal form

The primary keys are single columns, so a non-key column cannot depend on only part of the key. In `resource_allocations`, `allocated_at` and `allocation_status` describe that allocation row, not "just the complaint" or "just the resource".

## Third normal form

There is no transitive dependency of the kind "non-key A determines non-key B, and both are stored beside the key".

Examples of data that is **not** copied:

- A complaint stores `citizen_id`, not the citizen's name, email, and phone.
- A complaint stores `category_id`, not the department name. The department is reached through the category.
- An allocation stores `resource_id`, not the vehicle name and registration. Those stay on `resources`.
- A category stores `department_id`, not a second copy of the department description.

`required_resource_type` belongs to the category: it is how that service is served. `resource_type` belongs to the resource. They are equal when a match is made, but neither table stores the other table's name.

The generated lock columns are derived from `allocation_status` and the foreign key. They do not add a new fact; they enforce one.

## Why a separate history table

If the only status lived on `complaints`, the timeline would be lost every time the status changed. Moving the repeating group (old status, new status, time, actor) into `complaint_status_history` removes that repeating group and keeps the complaint row about the complaint itself.

## Anomalies avoided

- **Update anomaly:** renaming a department changes one row. Complaints do not all need a new department string.
- **Insert anomaly:** a department can exist before any complaint is filed.
- **Delete anomaly:** completing a complaint does not delete the resource or the citizen.
