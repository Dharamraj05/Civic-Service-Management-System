# Future scope

The current system is enough to demonstrate scheduling and a normalised MySQL design. These additions would matter in a real civic desk and are deliberately not half-built:

- **Distance.** Choose the available resource whose `current_location` is closest to the complaint, after priority and FCFS have chosen which complaint runs.
- **Zones.** A resource parked in one ward should not be the default for every request in the city.
- **Notifications.** Tell the citizen when the state becomes `ASSIGNED` or `COMPLETED`.
- **Preemption policy.** Decide, as an explicit rule, whether a new Critical request may take a vehicle that is only `ASSIGNED` and not yet `IN_PROGRESS`. Today it cannot; an administrator must reassign.
- **Shifts and maintenance windows.** `MAINTENANCE` is a status, not a calendar.
- **Pagination and search.** The lists are capped for a lab dataset. A city-scale table needs pages.
- **Stronger session handling.** Shorter JWT lifetime, rotation, and a review of token storage.
- **Audit of overrides.** Manual allocation already stores a remark. A separate audit table could record every override next to the automatic decision it replaced.
- **More categories.** The schema already allows a new department, category, and resource type without a code change. The home page text would then be edited to mention the new service.
