# Requirements

## Functional requirements

### Citizen

| ID | Requirement |
| --- | --- |
| FR-1 | Register with name, email, phone, and password |
| FR-2 | Log in and log out |
| FR-3 | View and update profile; change password |
| FR-4 | Submit a complaint with title, category, priority, description, and address |
| FR-5 | Optionally send latitude and longitude |
| FR-6 | See their own complaints and summary counts |
| FR-7 | Open one complaint and see status, history, queue position, and any allocated resource |
| FR-8 | Cancel a complaint that is not yet in progress |

### Administrator

| ID | Requirement |
| --- | --- |
| FR-9 | Log in to a separate admin desk |
| FR-10 | See totals for complaints and resources |
| FR-11 | List and filter complaints by status, category, and priority |
| FR-12 | See the waiting queue in priority then FCFS order |
| FR-13 | Allocate the next request, run a full pass, or allocate one row |
| FR-14 | Manually allocate or reassign a compatible available resource |
| FR-15 | Start and complete an allocation |
| FR-16 | Add, edit, and delete departments when they are unused |
| FR-17 | Add, edit, delete, or change the status of a resource when that action is safe |
| FR-18 | View allocations and summary reports |

### System

| ID | Requirement |
| --- | --- |
| FR-19 | On submit, store the complaint as `NEW` and immediately queue it as `WAITING` |
| FR-20 | Allocate only a matching `AVAILABLE` resource |
| FR-21 | Mark that resource `BUSY` in the same transaction |
| FR-22 | Keep the complaint `WAITING` with a clear message when no resource is free |
| FR-23 | Mark the resource `AVAILABLE` when the job is completed |
| FR-24 | Refuse a second active allocation of the same resource |

## Non-functional requirements

| ID | Requirement |
| --- | --- |
| NFR-1 | Passwords are hashed with bcrypt. Plain text and hashes are not returned by the API |
| NFR-2 | Admin routes require a valid JWT whose role is `ADMIN` |
| NFR-3 | A citizen can read or cancel only their own complaints |
| NFR-4 | Inputs are validated before they reach SQL |
| NFR-5 | SQL uses placeholders, not concatenated user input |
| NFR-6 | Allocation is one InnoDB transaction |
| NFR-7 | The interface works on a desktop browser and a narrow phone width |
| NFR-8 | Failed allocation does not crash the API |
| NFR-9 | Code around the scheduler is commented so a student can explain it |
