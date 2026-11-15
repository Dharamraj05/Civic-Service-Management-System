# Problem statement

Municipal services depend on a small fleet:

- Ambulances for medical emergencies
- Water tankers when supply fails
- Garbage trucks for missed collection and debris
- Electricity repair teams for faults and outages
- Police patrol vehicles for public-safety incidents

Requests arrive throughout the day with different urgency. A paper register or a single shared spreadsheet does not keep a fair order, does not stop two clerks from assigning the same vehicle, and does not tell the citizen what happened after they called.

Without a scheduling rule:

- A low-urgency request can take the last ambulance.
- Two equal emergencies are served in whatever order a clerk happens to see them, not in arrival order.
- A vehicle can be marked free in one place and busy in another.

CSMS treats each complaint as a process. Critical processes run first. Among processes of equal priority, the older one runs first. A resource is a single-use device: it is either available or held by one active complaint. The database transaction is the critical section that makes that rule hold even if two administrators click Allocate at the same time.
