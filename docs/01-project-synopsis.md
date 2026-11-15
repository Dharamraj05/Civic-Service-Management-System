# Project synopsis

**Title:** Civic Service Management System (CSMS)

**Type:** Web application for a B.Tech software-engineering PBL, used to demonstrate operating-system scheduling and relational database design.

## Summary

City departments receive more service requests than they have vehicles and crews. CSMS lets a citizen file a medical, water, garbage, electricity, or police request and lets an administrator see those requests as a priority queue. The server allocates one free resource of the matching type, marks it busy, and releases it when the job is completed.

The application has three parts:

- A React client for the public site, the citizen desk, and the admin desk
- An Express API that authenticates users and enforces roles
- A MySQL database that stores users, departments, categories, complaints, resources, allocations, and status history

## What an evaluator can run

1. Import `database/schema.sql`, `views.sql`, and `seed.sql`.
2. Start the API (`server`) and the React app (`client`).
3. Sign in with the demo administrator and a demo citizen from the README.
4. Show the priority queue, allocate the next request, complete it, and show that the resource is free again.
5. Open `server/services/allocationService.js` and the SQL views while explaining the OS and DBMS mapping.

## Users

- **Citizen:** files and tracks their own requests
- **Administrator:** sees every request, manages resources, and runs the scheduler
