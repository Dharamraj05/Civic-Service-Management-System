# Security

## Passwords

`bcrypt` hashes passwords with 10 salt rounds before insert. Login uses `bcrypt.compare`. The hash column is selected only inside the auth service for that comparison. `GET /api/auth/me` and the login payload return name, email, phone, role, and id. They do not return `password_hash`.

Seed data in `database/seed.sql` stores hashes, not the demo passwords. The passwords are written in the README because this is a classroom demo.

An unknown email and a wrong password return the same message: "Invalid email or password."

## JWT and roles

Login returns a signed token. The payload is only `userId` and `role`, plus the standard expiry. It is not a place to hide extra personal data.

`authenticateToken` requires `Authorization: Bearer <token>`. `authorizeRole('ADMIN')` rejects every other role with HTTP 403. Citizen routes that take an id also compare `citizen_id` with the token's user id.

The client stores the token in `localStorage` and sends it with Axios. That is the usual teaching setup. A stolen token can be replayed until it expires (`JWT_EXPIRES_IN`, default 8 hours). The production follow-up would be a shorter lifetime and care against XSS. This project does not render HTML from complaint text; React escapes it.

Registration ignores any role field a client might send. The insert is hard-coded to `CITIZEN`.

## Validation

`express-validator` checks length, email, phone digits, priority range, and ids before the controller runs. Invalid JSON is HTTP 400. Unknown routes are HTTP 404.

## SQL injection

Queries use `mysql2` placeholders. Filters for status, category, and priority are validated against an allow-list and then bound as parameters.

## Unsafe resource changes

An administrator cannot set a resource to `BUSY` by typing a status. They cannot edit or delete a busy resource, and they cannot delete a resource that already has allocation history. Those rules keep the allocation table and the resource status from drifting apart.

## Errors

HTTP statuses used on purpose: 200, 201, 400, 401, 403, 404, 409, 503. Unexpected server errors are logged on the server. In `NODE_ENV=production` the client receives a generic message instead of an internal exception.

Database connection failures return 503 with a short instruction to check MySQL and `server/.env`.

## Secrets

`server/.env` is git-ignored. `server/.env.example` has placeholders. The checked-in demo JWT secret is for a local classroom database only. Change it before any shared deployment.
