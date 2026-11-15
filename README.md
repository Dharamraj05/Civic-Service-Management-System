# 🏙️ Civic Service Management System (CSMS)

### Smart Resource Allocation for Better Public Services

CSMS is a full-stack web application developed as a 5th-semester Project-Based Learning (PBL) project.

It helps citizens submit civic complaints and emergency service requests while allowing administrators to manage departments, resources, and complaint allocations efficiently.

The system demonstrates real-world applications of **Operating System (OS)** and **Database Management System (DBMS)** concepts.

---

##  Problem Statement

Cities have limited resources such as ambulances, water tankers, garbage trucks, repair teams, and patrol vehicles.

When multiple service requests arrive, manual allocation can lead to delays and inefficient resource utilization.

CSMS solves this problem by maintaining a priority-based complaint queue and allocating available resources according to service requirements and priority.

---

##  Objectives

- Allow citizens to register and submit service requests.
- Provide administrators with centralized complaint management.
- Implement priority-based scheduling and FCFS.
- Allocate resources according to service categories.
- Prevent simultaneous allocation of the same resource.
- Demonstrate OS and DBMS concepts through a practical application.

---

##  Key Features

###  Citizen Module
- Citizen registration and login.
- Profile management and password change.
- Submit civic complaints.
- Select complaint category and priority.
- Track complaint status and allocation history.

###  Admin Module
- Admin dashboard with complaint statistics.
- Manage departments and resources.
- View and manage complaints.
- Priority-based complaint queue.
- Automatic and manual resource allocation.
- Start and complete service requests.
- Generate reports and monitor resource utilization.

###  Resource Management
- Automatic resource allocation.
- Resource availability tracking.
- Resource reassignment.
- Prevention of duplicate active allocations.

---

##  Operating System Concepts

| Concept | Implementation |
|---|---|
| Process | Each complaint represents a process |
| Priority Scheduling | Critical complaints are served before lower-priority complaints |
| FCFS | Older complaints are served first when priorities are equal |
| Queue | Waiting complaints form the ready queue |
| Process States | NEW → WAITING → ASSIGNED → IN_PROGRESS → COMPLETED |
| Mutual Exclusion | Prevents multiple complaints from using the same resource |
| Critical Section | Resource allocation transaction |

---

##  DBMS Concepts

- Relational database design.
- Primary keys and foreign keys.
- Database normalization (1NF, 2NF, 3NF).
- NOT NULL and CHECK constraints.
- SQL joins and indexes.
- Database views.
- Transactions using COMMIT and ROLLBACK.
- Data integrity and consistency.
- Parameterized SQL queries.

---

##  Technology Stack

| Layer | Technologies |
|---|---|
| Frontend | React.js, JavaScript, HTML5, CSS3 |
| Backend | Node.js, Express.js |
| Database | MySQL |
| Authentication | JWT, bcrypt |
| API Communication | Axios |
| Development Tools | VS Code, MySQL Workbench, Postman |
| Version Control | Git and GitHub |

---

##  Project Structure

```text
Civic-Service-Management-System/
│
├── client/
│   └── src/
│       ├── components/
│       ├── pages/
│       ├── styles/
│       └── utils/
│
├── server/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── utils/
│   ├── app.js
│   └── server.js
│
├── database/
│   ├── schema.sql
│   ├── views.sql
│   ├── seed.sql
│   └── queries.sql
│
├── docs/
│
├── package.json
├── package-lock.json
├── README.md
└── .gitignore
```

---

##  Installation and Setup

### Prerequisites

Make sure you have installed:

- Node.js 18 or newer.
- MySQL Server 8.0.16 or newer.
- MySQL Workbench.
- Visual Studio Code.

### 1. Clone the Repository

```bash
git clone https://github.com/Dharamraj05/Civic-Service-Management-System.git
```

Navigate to the project directory:

```bash
cd Civic-Service-Management-System
```

### 2. Install Dependencies

```bash
npm run install:all
```

### 3. Configure MySQL Database

1. Start MySQL Server.
2. Open MySQL Workbench.
3. Execute the following SQL files in order:

```text
database/schema.sql
database/views.sql
database/seed.sql
```

This creates the database, tables, views, and sample data.

**Note:** Running `schema.sql` again resets the existing tables and data.

### 4. Configure Environment Variables

Navigate to the server folder:

```bash
cd server
```

Create your environment file:

```powershell
copy .env.example .env
```

Configure `server/.env`:

```env
PORT=5000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=csms_db

JWT_SECRET=your_long_random_secret
JWT_EXPIRES_IN=8h

CLIENT_ORIGIN=http://localhost:5173
```

Replace the database credentials with your own MySQL configuration.

**Important:** Never upload your actual `.env` file or secret credentials to GitHub.

### 5. Start the Backend

From the server directory:

```bash
npm run dev
```

Backend URL:

```text
http://localhost:5000
```

Health check:

```text
http://localhost:5000/api/health
```

### 6. Start the Frontend

Open a second terminal:

```bash
cd client
npm run dev
```

Open your browser:

```text
http://localhost:5173
```

* The application should now be running locally.

---

##  Resource Allocation Algorithm

The application uses priority scheduling combined with FCFS.

```text
New Complaint
      |
      v
Complaint enters WAITING queue
      |
      v
Sort by Priority and Arrival Time
      |
      v
Find an available compatible resource
      |
      v
Is resource available?
      |
   Yes / No
    /     \
   v       v
Allocate  Keep in
Resource  WAITING
   |
   v
Update Complaint Status
   |
   v
Complete Service
   |
   v
Resource becomes AVAILABLE
```

The allocation process uses database transactions and row-level locking to prevent duplicate resource allocation.

Implementation:

`server/services/allocationService.js`

---

## 🧪 Testing

Run the backend tests:

```bash
cd server
npm test
```

The project also includes test files for scheduling, file signatures, and allocation-related functionality.

---


##  Future Improvements

- Location-based resource allocation.
- SMS and email notifications.
- Interactive city map for administrators.
- Resource maintenance scheduling.
- Multi-city and multi-zone support.
- Detailed administrative audit logs.

---

##  Documentation

Detailed project documentation is available in the `docs/` directory.

It includes:

- Project Synopsis
- Problem Statement
- System Architecture
- Database Design
- Normalization
- OS and DBMS Concepts
- Allocation Algorithm
- Security
- API Documentation
- Testing Documentation
- Future Scope

---

##  Developer

**Dharam Raj**

B.Tech Computer Science and Engineering

GitHub: [@Dharamraj05](https://github.com/Dharamraj05)

---

* If you find this project interesting, consider giving this repository a star!