# Diagrams

These diagrams match the implemented tables, roles, and allocation transaction. Paste a block into any Mermaid preview (MySQL Workbench does not render Mermaid; VS Code and GitHub do).

## Entity-relationship diagram

```mermaid
erDiagram
  USERS ||--o{ COMPLAINTS : files
  USERS ||--o{ RESOURCE_ALLOCATIONS : allocates
  USERS ||--o{ COMPLAINT_STATUS_HISTORY : changes
  DEPARTMENTS ||--o{ SERVICE_CATEGORIES : offers
  DEPARTMENTS ||--o{ RESOURCES : owns
  SERVICE_CATEGORIES ||--o{ COMPLAINTS : classifies
  COMPLAINTS ||--o{ RESOURCE_ALLOCATIONS : receives
  COMPLAINTS ||--o{ COMPLAINT_STATUS_HISTORY : records
  RESOURCES ||--o{ RESOURCE_ALLOCATIONS : assigned

  USERS {
    int user_id PK
    string email UK
    string phone UK
    string password_hash
    string role
  }
  DEPARTMENTS {
    int department_id PK
    string department_name UK
  }
  SERVICE_CATEGORIES {
    int category_id PK
    int department_id FK
    string required_resource_type
  }
  COMPLAINTS {
    int complaint_id PK
    int citizen_id FK
    int category_id FK
    int priority
    string status
    datetime created_at
  }
  RESOURCES {
    int resource_id PK
    int department_id FK
    string resource_type
    string registration_or_identifier UK
    string status
  }
  RESOURCE_ALLOCATIONS {
    int allocation_id PK
    int complaint_id FK
    int resource_id FK
    string allocation_status
    int active_resource_lock UK
  }
  COMPLAINT_STATUS_HISTORY {
    int history_id PK
    int complaint_id FK
    string old_status
    string new_status
    datetime changed_at
  }
```

## Use-case diagram

```mermaid
flowchart LR
  citizen[Citizen]
  admin[Administrator]

  subgraph CSMS
    register[Register and log in]
    submit[Submit complaint]
    track[Track status and resource]
    cancel[Cancel own complaint]
    profile[Update profile]
    dash[View dashboard and reports]
    queue[View priority queue]
    manage[Manage departments and resources]
    allocate[Allocate, start, complete, reassign]
  end

  citizen --> register
  citizen --> submit
  citizen --> track
  citizen --> cancel
  citizen --> profile
  admin --> register
  admin --> dash
  admin --> queue
  admin --> manage
  admin --> allocate
  admin --> track
  admin --> cancel
```

## Module diagram

The server is organised as modules rather than classes. This is the dependency a viva usually means by a class diagram.

```mermaid
classDiagram
  class AuthController
  class ComplaintController
  class AllocationController
  class ResourceController
  class AuthService
  class ComplaintService
  class AllocationService
  class UserModel
  class ComplaintModel
  class ResourceModel

  AuthController --> AuthService
  AuthService --> UserModel
  ComplaintController --> ComplaintService
  ComplaintService --> ComplaintModel
  ComplaintService --> AllocationService
  AllocationController --> AllocationService
  AllocationService --> ComplaintModel
  ResourceController --> ResourceModel
```

`AllocationService` is the scheduler. It begins a transaction, locks rows, and commits or rolls back.

## Sequence: submit and allocate

```mermaid
sequenceDiagram
  actor Citizen
  participant React
  participant API
  participant DB

  Citizen->>React: Submit complaint
  React->>API: POST /api/complaints
  API->>DB: BEGIN
  API->>DB: INSERT complaint NEW
  API->>DB: UPDATE complaint WAITING
  API->>DB: INSERT history
  API->>DB: COMMIT
  API->>DB: BEGIN allocation pass
  API->>DB: Lock waiting complaints in priority, FCFS order
  alt Compatible resource is free and this request is next
    API->>DB: Lock AVAILABLE resource
    API->>DB: Resource BUSY, allocation row, complaint ASSIGNED
    API->>DB: COMMIT
  else No free resource or someone is ahead
    API->>DB: COMMIT with no change
  end
  API-->>React: Complaint id, status, allocation message
  React-->>Citizen: Show id and status
```

## System architecture

```mermaid
flowchart TB
  subgraph client [React client]
    publicPages[Home, login, register]
    citizenDesk[Citizen desk]
    adminDesk[Admin desk]
  end

  subgraph api [Express API]
    auth[JWT and role middleware]
    complaints[Complaint service]
    scheduler[Allocation service]
    catalog[Departments and resources]
  end

  subgraph data [MySQL csms_db]
    tables[Tables, constraints, indexes]
    views[Views]
  end

  publicPages --> auth
  citizenDesk --> auth
  adminDesk --> auth
  auth --> complaints
  auth --> scheduler
  auth --> catalog
  complaints --> tables
  scheduler --> tables
  catalog --> tables
  tables --> views
```

## Data-flow diagram level 0

```mermaid
flowchart LR
  citizen[Citizen]
  admin[Administrator]
  csms[CSMS]
  citizen -->|Complaint and login| csms
  csms -->|Status and allocated resource| citizen
  admin -->|Allocation and resource updates| csms
  csms -->|Queue, reports, resource state| admin
```

## Data-flow diagram level 1

```mermaid
flowchart TB
  citizen[Citizen]
  admin[Administrator]

  p1[1. Authenticate]
  p2[2. Record complaint]
  p3[3. Schedule resource]
  p4[4. Manage fleet]
  p5[5. Report]

  d1[(users)]
  d2[(complaints and history)]
  d3[(resources and allocations)]

  citizen --> p1
  admin --> p1
  p1 --> d1
  citizen --> p2
  p2 --> d2
  p2 --> p3
  admin --> p3
  p3 --> d2
  p3 --> d3
  p3 -->|Status| citizen
  admin --> p4
  p4 --> d3
  admin --> p5
  d2 --> p5
  d3 --> p5
  p5 --> admin
```
