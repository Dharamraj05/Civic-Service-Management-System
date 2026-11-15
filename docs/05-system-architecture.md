# System architecture

CSMS is a three-tier web application.

```text
Browser (React)
    |  HTTPS in a real deployment; HTTP on localhost
    |  Axios calls /api
    v
Express API
    routes -> controllers -> services -> models
    |                         |
    |                         allocationService
    |                         (transaction + row lock)
    v
MySQL (InnoDB, database csms_db)
```

## Request path

1. React Router chooses a public page, the citizen desk, or the admin desk.
2. `ProtectedRoute` checks the signed-in user and role before rendering a desk.
3. Axios adds `Authorization: Bearer <jwt>` from `localStorage`.
4. Express validation runs before the controller.
5. `authenticateToken` verifies the JWT. `authorizeRole` checks `CITIZEN` or `ADMIN`.
6. Controllers call a service. Services call models or, for allocation, run SQL inside `withTransaction`.
7. The JSON body is `{ success, message, data }`. Errors use the matching HTTP status and do not include the password hash.

## Why the folders are split

- `routes` only attach URLs, middleware, and a controller.
- `controllers` read the request and send the response.
- `services` hold rules such as "a new complaint enters the queue" and "a resource can be allocated only if nothing compatible is ahead".
- `models` hold the reusable `SELECT` / `INSERT` statements.
- The allocation transaction stays in `allocationService.js` so the critical section can be read in one file during a viva.

## Process states

The complaint status is the process state:

```text
NEW -> WAITING -> ASSIGNED -> IN_PROGRESS -> COMPLETED
                    |              |
                    +--> CANCELLED <--+   (not allowed once IN_PROGRESS)
```

`NEW` is recorded in history at insert time and the same transaction moves the row to `WAITING`, so the queue does not contain half-created requests.

Diagrams for this architecture are in `docs/diagrams.md`.
