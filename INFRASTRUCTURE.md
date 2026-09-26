# WorkSphere Enterprise HCM — Infrastructure & Persistence Architecture

This document outlines the local backend infrastructure, container orchestration, and persistence foundation established for the WorkSphere platform.

---

## 1. Local Infrastructure Services (`docker-compose.yml`)

The root `docker-compose.yml` provides containerized infrastructure with persistent named volumes and development ports:

| Service | Image | Host Port | Internal Port | Persistent Volume | Health Check |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **PostgreSQL 16** | `postgres:16-alpine` | `5432` | `5432` | `worksphere_postgres_data` | `pg_isready -U worksphere -d worksphere` |
| **Redis 7** | `redis:7.2-alpine` | `6379` | `6379` | `worksphere_redis_data` | `redis-cli ping` |
| **Apache Kafka** | `confluentinc/cp-kafka:7.5.0` | `9092` | `9092` | `worksphere_kafka_data` | Kafka Broker connectivity |
| **ZooKeeper** | `confluentinc/cp-zookeeper:7.5.0` | *internal* | `2181` | `worksphere_zookeeper_data` | Internal daemon |

*Note: ZooKeeper internal port `2181` is deliberately not bound to the host network to adhere to minimal port exposure standards.*

---

## 2. Environment Configuration (`.env.example`)

The environment file defines local development connection endpoints and credentials.

```env
# PostgreSQL Database Configuration
DATABASE_URL=jdbc:postgresql://localhost:5432/worksphere
DATABASE_USERNAME=worksphere
DATABASE_PASSWORD=worksphere_dev_password

# Spring Security & JWT Token Signing
JWT_SECRET=CHANGE_ME_TO_A_LONG_RANDOM_SECRET
JWT_EXPIRATION_MS=86400000

# Redis Cache & Session Store
REDIS_URL=redis://localhost:6379

# Kafka Event Streaming
KAFKA_BOOTSTRAP_SERVERS=localhost:9092
```

> **SECURITY WARNING:**
> The credentials `worksphere` / `worksphere_dev_password` are strictly for **LOCAL DEVELOPMENT**. Production deployments must supply secure, randomly generated secrets via environment variables or secret managers (e.g., Vault, AWS Secrets Manager, GCP Secret Manager).

---

## 3. Database Schema & Flyway Evolution

Flyway is configured as the **sole authority** for schema evolution (`spring.jpa.hibernate.ddl-auto=validate`). Hibernate only validates entity-to-schema alignment, preventing accidental runtime DDL modifications.

### Applied Migrations (`backend/src/main/resources/db/migration/`)
- **`V1__init_schema.sql`**: Full 3NF schema establishing tables:
  - `roles`, `permissions`, `role_permissions`, `users`, `user_roles`
  - `departments`, `locations`, `employees`
  - `shifts`, `attendance_records`, `attendance_regularizations`
  - `leave_types`, `leave_balances`, `leave_requests`
  - `payroll_runs`, `payroll_exceptions`, `payslips`
  - `approval_items`, `approval_steps`
  - `audit_logs`, `notifications`
- **`V2__seed_data.sql`**: Idempotent foundational seed data for roles, permissions, administrative personas, and employee records.
- **`V3__employee_management_indexes.sql`**: Performance indexes for server-side workforce filtering and sorting, standard departments, standard locations, and permission assignments.
- **`V4__infrastructure_indexes_and_constraints.sql`**: Indexes for append-only audit trail queries (`timestamp DESC`, `user_email`, `resource_type`, `action`) and user lookup optimization.

---

## 4. Foundational JPA Entities & Repositories

The core persistence layer implements bidirectional isolation using standard DTO patterns:

- **Identity & RBAC**:
  - `User`, `Role`, `Permission`
  - `UserRepository`, `RoleRepository`, `PermissionRepository`
- **Workforce**:
  - `Employee`, `Department`, `Location`
  - `EmployeeRepository`, `DepartmentRepository`, `LocationRepository`
- **Governance & Audit**:
  - `AuditLog`
  - `AuditLogRepository`

---

## 5. Connection Pooling & Actuator Health Checks

- **HikariCP Pool Configuration**:
  - Maximum Pool Size: 20
  - Minimum Idle: 5
  - Idle Timeout: 300,000 ms (5 min)
  - Connection Timeout: 30,000 ms
  - Max Lifetime: 1,800,000 ms (30 min)
- **Spring Boot Actuator (`/actuator/health`)**:
  - Evaluates PostgreSQL database health (`db`)
  - Evaluates Redis connectivity (`redis`)
  - Custom `KafkaHealthIndicator` (`kafka`) evaluating cluster responsiveness without exposing topology or credentials
  - Publicly accessible health check permitted via `SecurityConfig` without exposing sensitive server properties

---

## 6. Local Developer Quick Start

### Step 1: Launch Infrastructure Containers
```bash
docker compose up -d
```

Verify services are healthy:
```bash
docker compose ps
```

### Step 2: Start Spring Boot Backend
On Linux / macOS:
```bash
cd backend
./mvnw spring-boot:run
```

On Windows (Command Prompt / PowerShell):
```cmd
cd backend
mvnw.cmd spring-boot:run
```

### Step 3: Start Frontend Dev Server
In the root directory:
```bash
npm run dev
```

---

## 7. Testing & Verification

- **Testcontainers Integration Test**:
  - Located in `backend/src/test/java/com/worksphere/hcm/infrastructure/DatabasePersistenceIntegrationTest.java`
  - Spins up a clean `postgres:16-alpine` container, executes all Flyway migrations from scratch, and verifies table constraints, foreign keys, and repository operations.
- **Infrastructure Verification Test**:
  - Located in `backend/src/test/java/com/worksphere/hcm/infrastructure/InfrastructureConnectionVerificationTest.java`
  - Verifies that Redis and Kafka bean factories and health indicators instantiate correctly.
- **Payroll & Employee Unit Tests**:
  - `EmployeeServiceTest` (Mockito unit tests)
  - `PayrollCalculationServiceTest` (Statutory deductions, HRA, PF, PT, banker's rounding)
