# WorkSphere Enterprise HCM

> **Production-grade Workforce Management, HR Operations, Biometric Attendance, Leave Lifecycle, Payroll Calculation Engine, Governance Approvals, and Employee Self-Service Platform.**

---

## 1. Project Overview

**WorkSphere** is an enterprise-grade Workforce Management and Human Capital Management (HCM) platform built to handle enterprise scale (10,000+ personnel). It is designed to satisfy the rigorous architectural, concurrency, transaction-safety, and auditability requirements of large-scale enterprises.

### Core Capabilities
- **Executive Operations & Mission Control:** Real-time pulse monitoring of check-in throughput across biometric turnstiles, attendance regularization queues, SLA risk monitoring, and live ledger stream.
- **Workforce Directory:** Dynamic census table with batch operations, department transfers, manager re-assignments, compact/comfortable density toggle, and filtered views.
- **Time & Attendance:** Biometric gate sync, shift roster planning (General, Mid, Night), active elapsed shift clocks, break toggling, geo-fenced remote duty logs, and attendance regularizations.
- **Leave Lifecycle:** Multi-category quotas (Annual, Sick, Casual, Unpaid, Maternity/Paternity), balance validation, overlap detection, and multi-tier approval timeline.
- **Payroll Processing Engine:** 6-phase lifecycle tracker (Lock &rarr; Variable Inputs &rarr; Gross Calc &rarr; Exception Clearing &rarr; CFO Sign-Off &rarr; Host-to-Host Disburse), strict `BigDecimal` monetary computations, negative net pay prevention, and automated statutory validations (PF, ESI, TDS Section 192).
- **AI Payroll Exception Assistant:** Advisory intelligence powered by Gemini 3.8 Flash that minimizes PII data, diagnoses root causes, and recommends step-by-step remediation order without mutating core deterministic records.
- **Enterprise Payslips:** High-fidelity, print-ready CTC and statutory tax deduction statements with digital authentication.
- **Governance & Approvals:** Immutable audit trails, cryptographic e-Sign gates, and multi-stage approval routing.

---

## 2. Technology Stack & Production Architecture

```
                    +------------------------------------+
                    |       React 19 + TypeScript        |
                    | (Vite, Tailwind CSS, TanStack)    |
                    +-----------------+------------------+
                                      |
                               REST API (JSON)
                                      |
                    +-----------------v------------------+
                    |        Spring Boot 3.x / API       |
                    |      (Spring Security, JWT, RBAC)  |
                    +--------+------------------+--------+
                             |                  |
           +-----------------+                  +-----------------+
           |                                                      |
+----------v-----------+                              +-----------v------------+
|    PostgreSQL 16     |                              |      Apache Kafka      |
| (ACID, Normalized,   |                              |  (Event-Driven PubSub: |
| Optimistic Locking)  |                              |  Payroll, Leave, Audit)|
+----------+-----------+                              +-----------+------------+
           |                                                      |
+----------v-----------+                              +-----------v------------+
|      Redis 7.2       |                              |  Gemini 3.8 Flash AI   |
| (Session Cache,      |                              |  (Server-Side Advisory |
| Turnstile Latency)   |                              |   Exception Assistant) |
+----------------------+                              +------------------------+
```

### Production Backend Target (Spring Boot Architecture)
- **Runtime:** Java 21 LTS
- **Framework:** Spring Boot 3.3.x, Spring MVC, Spring Data JPA, Spring Security 6.x
- **Database:** PostgreSQL 16 (Normalized schema, B-tree indexes, Foreign Key constraints)
- **Caching & Rate Limiting:** Redis 7.2
- **Event Messaging:** Apache Kafka 3.7 (Idempotent producers & consumers)
- **ORM & Concurrency:** Hibernate 6.x, Optimistic Locking (`@Version`), Pessimistic Locks on Treasury batches
- **Testing:** JUnit 5, Mockito, Testcontainers, Spring Boot Test
- **Build & Packaging:** Apache Maven 3.9, Multi-stage Docker

### Client Application (React SPA)
- **UI Architecture:** React 19, TypeScript, Vite
- **Styling:** Tailwind CSS (Modern Corporate Minimalist Design System)
- **State Management:** Centralized Auth & RBAC Context, TanStack Query-ready service layer
- **Icons & Typography:** Inter, JetBrains Mono, Material Symbols Outlined

---

## 3. Database ER & Schema Architecture

The relational schema strictly enforces 3NF normalization to avoid duplicate data:

```
+-------------+         +---------------+         +---------------------+
|    users    |<--------|  user_roles   |-------->|        roles        |
+-------------+         +---------------+         +---------------------+
       |                                                     |
       | 1:1                                                 |
+-------------+         +---------------+         +----------v----------+
|  employees  |<--------|  departments  |         |     permissions     |
+-------------+         +---------------+         +---------------------+
  |   |   |
  |   |   +-------------> attendance (employee_id, date [UNIQUE])
  |   |
  |   +-----------------> leave_requests (employee_id, dates, status)
  |                       +--> leave_balances (employee_id, leave_type)
  |
  +---------------------> payroll_employees
                              |
+---------------------+       |
|    payroll_runs     |<------+
+---------------------+       |
  |                           +--> payroll_items (earnings, deductions)
  +--> payroll_exceptions     +--> payslips
```

### Key Indices for High Throughput
- `employees(employee_code)` - Unique corporate personnel lookup
- `employees(department_id)` - Fast organizational aggregation
- `attendance(employee_id, attendance_date)` - Composite unique index preventing duplicate check-ins
- `payroll_runs(period_start, period_end)` - Enforces unique cycle execution per fiscal window
- `payroll_exceptions(payroll_run_id, severity, status)` - Sub-millisecond exception queue filtering
- `audit_logs(resource_type, resource_id, timestamp)` - Forensic query optimization

---

## 4. REST API Specification

### Authentication & RBAC
- `POST /api/v1/auth/login` - Authenticate credentials, issue stateless JWT token
- `GET /api/v1/auth/me` - Retrieve current user profile and permission list
- `POST /api/v1/auth/switch-user` - Demo persona switcher (Employee, Manager, Payroll Admin, HR Admin)

### Workforce & Employees
- `GET /api/v1/employees` - Paginated employee directory (`search`, `department`, `status`, `hub`)
- `POST /api/v1/employees` - Onboard employee with auto-generated code and salary structure
- `PUT /api/v1/employees/:id` - Full employee record modification with audit logging

### Time & Attendance
- `GET /api/v1/attendance` - Daily & monthly biometric attendance logs
- `POST /api/v1/attendance/punch-in` - Record check-in timestamp (validates no concurrent session)
- `POST /api/v1/attendance/punch-out` - Record departure (requires active duty session)
- `POST /api/v1/attendance/toggle-break` - Pause/resume active work clock
- `POST /api/v1/attendance/regularize` - File attendance correction with reason and target time
- `POST /api/v1/attendance/regularizations/:id/action` - Approve or reject regularization filing

### Leave Management
- `GET /api/v1/leave/requests` - Fetch employee leave records and remaining balance quotas
- `POST /api/v1/leave/requests` - Submit leave request (validates start &lt; end, balance limit, no overlap)

### Payroll & Exception Resolution
- `GET /api/v1/payroll/runs` - Active cycle metadata, status, step, and totals
- `POST /api/v1/payroll/runs/:id/revalidate` - Recompute compliance rules across 10,248 accounts
- `POST /api/v1/payroll/runs/:id/exceptions/:excId/resolve` - Resolve blocking exception
- `POST /api/v1/payroll/runs/:id/approve` - Cryptographic CFO approval (enforces 0 critical blockers)
- `GET /api/v1/payroll/payslips/:empCode` - Generate official CTC breakdown and net pay

### AI Advisory Feature
- `POST /api/v1/ai/payroll-assistant` - Server-side Gemini 3.8 Flash model summarizing exception clusters, risk exposure, and remediation sequence.

---

## 5. Engineering Decisions

### 1. Why a Modular Monolith Initially?
Premature microservices introduce network latency, distributed transaction failure modes (2PC/Saga complexity), and high DevOps overhead for early-stage enterprise platforms. A **Modular Monolith** with clean domain package separation (`employee`, `attendance`, `leave`, `payroll`, `approval`, `audit`) ensures zero network hops for transactional payroll runs while maintaining strict API boundaries. The modular architecture provides high development velocity and clear boundaries that can be decomposed into standalone microservices once domain boundaries and operational scale demand it.

### 2. Why PostgreSQL?
Workforce management and financial payroll demand strict ACID transaction guarantees. PostgreSQL provides battle-tested MVCC, rigorous foreign key constraints, rich decimal support (`NUMERIC`/`BigDecimal`) essential for currency calculations without floating-point errors, and native JSONB capabilities for storing immutable audit diffs and flexible rule configuration.

### 3. Why Redis?
Enterprise biometric turnstiles generate high-frequency check-in events during shift changes (e.g. 8:30 AM - 9:30 AM across 42 turnstiles). Caching employee badge RFID mappings, active shift states, and session tokens in Redis avoids hammering the primary PostgreSQL database for high-throughput reads. Redis is also utilized for distributed locking and dashboard metric caching with write-through invalidation.

### 4. Why Kafka?
Post-payroll events (e.g., `PayrollRunCompleted`, `PayslipGenerated`, `LeaveApproved`) require asynchronous, multi-consumer fanout to email/SMS notification workers, tax compliance archiving, and financial ERP integration. Kafka provides durable, partitioned, replayable event logs with strong consumer group isolation, ensuring background tasks never degrade interactive UI response times.

### 5. Why REST?
RESTful APIs provide standard HTTP semantics (GET, POST, PUT, DELETE, PATCH) with predictable status codes (`200 OK`, `201 Created`, `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `409 Conflict`, `422 Unprocessable Entity`), making the interface intuitive for enterprise web clients, mobile apps, and third-party HR integrations. REST also leverages standard HTTP caching, load balancing, and edge proxying.

### 6. Why DTOs (Data Transfer Objects)?
Directly exposing JPA/Hibernate domain entities to the web layer leaks database schemas, causes lazy-loading serialization failures (`LazyInitializationException`), and introduces mass-assignment security vulnerabilities. Separate request and response DTOs decouple internal database models from external API contracts, allowing schema refactoring without breaking frontend clients while enforcing strict input validation via Jakarta Bean Validation (`@Valid`, `@NotNull`, `@Min`).

### 7. Why JPA / Hibernate?
JPA with Hibernate provides object-relational mapping, automatic dirty checking, first-level caching, and standard repository abstractions (`JpaRepository`). For complex reports and batch payroll calculations, JPA seamlessly integrates typed Criteria API, JPQL, and native SQL queries, striking the right balance between productivity and query performance.

### 8. Why Transactions (@Transactional)?
Multi-step operations—such as approving a payroll run, generating 10,000+ payslips, updating leave balances upon approved regularization, and appending audit log entries—must execute atomically. A failure during tax deduction computation must rollback the entire transaction, leaving the database in a consistent state without orphaned records or corrupted balances.

### 9. Why Optimistic Locking?
In a collaborative HR environment, multiple administrators or managers may simultaneously edit an employee's compensation or approve leave requests. Optimistic locking via a `@Version` column detects concurrent updates without incurring expensive database row locks. If a collision occurs, the second transaction is safely aborted with an `OptimisticLockException` rather than silently overwriting the previous update.

### 10. Why Asynchronous Events?
Offloading non-critical operations (such as PDF payslip generation, sending push notifications, synchronizing external HRMS integrations, and populating analytics aggregates) to asynchronous event listeners (`@Async` and Kafka consumers) keeps API endpoints responsive, ensuring sub-50ms latency for end-user actions.

### 11. Why Append-Only Audit Logging?
Regulatory compliance standards (SOC 2, ISO 27001, SOX) mandate an immutable, tamper-evident record of all security and data modifications. The append-only audit trail captures who performed each action, when it occurred, the client IP address, and JSON diffs of previous versus updated states. Audit records cannot be modified or deleted by application users.

---

## 6. Local Setup & Docker Deployment

### Step-by-Step Clean Installation

Follow these exact steps to run WorkSphere locally from scratch:

```bash
# 1. Clone the repository
git clone https://github.com/acme/worksphere.git
cd worksphere

# 2. Configure environment variables
cp .env.example .env

# 3. Start PostgreSQL, Redis, and Kafka infrastructure via Docker Compose
docker compose up -d postgres redis kafka

# 4. (Optional) Run Spring Boot Backend with Maven & Java 21
cd backend
mvn clean install
mvn spring-boot:run
cd ..

# 5. Start the WorkSphere Enterprise Application Server (Port 3000)
npm install
npm run dev
```

### Accessing the Running Platform
Once started, open your browser:
- **Application Portal:** [http://localhost:3000](http://localhost:3000)
- **Actuator Health & Metrics:** [http://localhost:3000/actuator/health](http://localhost:3000/actuator/health)

### Running Everything with Docker Compose
To run all services including the containerized application:
```bash
docker compose up -d
docker compose ps
```

---

## 7. Role-Based Access Control (RBAC) Persona Matrix

| Demo Persona | Role | Permissions |
|---|---|---|
| `admin@worksphere.local` (Vikram Malhotra) | `SYSTEM_ADMIN` / `HR_ADMIN` | All permissions: Employee CRUD, Attendance, Leave, Payroll, Approvals, Audit |
| `payroll@worksphere.local` (Pooja Nair) | `PAYROLL_ADMIN` | `PAYROLL_READ`, `PAYROLL_PROCESS`, `PAYROLL_APPROVE`, `PAYROLL_EXCEPTION_RESOLVE` |
| `manager@worksphere.local` (Ananya Roy) | `MANAGER` | `EMPLOYEE_READ`, `ATTENDANCE_APPROVE`, `LEAVE_APPROVE`, `LEAVE_READ` |
| `employee@worksphere.local` (Rohan Sharma) | `EMPLOYEE` | `ATTENDANCE_PUNCH`, `ATTENDANCE_REGULARIZE`, `LEAVE_APPLY`, `EMPLOYEE_READ` |

---

## 8. License & Standards
WorkSphere Enterprise HCM is distributed under the Apache 2.0 License. Designed and validated for high-reliability human resources and financial operations.
