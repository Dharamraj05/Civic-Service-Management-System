# Objectives and scope

## Objectives

1. Provide separate citizen and administrator workflows with login.
2. Accept a service request with a category, a priority from 1 to 4, a description, and an address.
3. Keep waiting requests in an order that an evaluator can see and explain.
4. Allocate only an `AVAILABLE` resource whose type matches the category.
5. Move the complaint through `NEW`, `WAITING`, `ASSIGNED`, `IN_PROGRESS`, and `COMPLETED`, and support `CANCELLED`.
6. Return the resource to `AVAILABLE` when the job is completed or cancelled before it starts.
7. Record status changes so the citizen can see a timeline.
8. Expose the scheduling and database ideas in code, SQL, and the admin queue screen.

## In scope

- Two roles: `CITIZEN` and `ADMIN`
- Five seeded service categories, with the schema left open for more rows
- Resource states `AVAILABLE`, `BUSY`, `MAINTENANCE`, and `OFFLINE`
- Automatic scheduling and a manual override
- Dashboard counts and simple reports
- Demo data for a viva

## Out of scope

- Real GPS tracking or live maps
- Payment, SMS, or email gateways
- Multiple cities or ward-level routing
- Native mobile apps
- Replacing the city's actual emergency telephone number

CSMS is a desk for recorded requests. The home page tells users to use their local emergency number when someone is in immediate danger.

## Decisions recorded for the viva

- Registration cannot choose a role. Every new account is a citizen.
- `BUSY` is not a status an administrator types in. Only the allocation transaction sets it, and only completion or cancellation clears it.
- **Allocate next** serves one complaint: the head of the global queue. If that type has no free resource, later complaints are not skipped by that button.
- **Run allocation pass** walks the queue. A blocked type stays waiting, and a different type with a free resource can still be served.
- Submitting, completing, or cancelling a request also runs one allocation pass, so a freed vehicle is offered to the next compatible request.
- Manual allocation may override queue order. It still cannot double-book a resource or use the wrong type.
