# Architecture Overview - HarvestTrust

HarvestTrust is designed with a decoupled monorepo architecture, splitting concerns between a React TypeScript single-page application client, a Node.js Express API server, and an offline Python machine learning prediction module.

## 1. System Block Diagram

```mermaid
graph TD
    Client[React 19 Frontend - Vite] <-->|JSON REST API| Server[Node.js Express Server]
    Server <-->|Prisma Client| DB[(SQLite Database)]
    Server -->|Python Subprocess| ML[Random Forest Risk Engine]
```

- **Frontend Client (Vite + React 19 + Tailwind CSS v4):** Serves the responsive client SPA layout. It features Recharts charts, Lucide icon libraries, and custom visual transitions.
- **Backend API (Express + TypeScript + Prisma):** Serves JSON endpoints, manages database transactions, executes input validators, and maps ORM relations.
- **SQLite Database:** Local-first file storage containing separate, indexed rate and status histories.
- **Python Subprocess risk engine:** Loads the random forest pipeline, calculates relative history indicators, and writes prediction probabilities to standard output.

---

## 2. End-to-End Collection Request Flow

```mermaid
sequenceDiagram
    autonumber
    actor Op as Operator
    participant Client as React Client
    participant Server as Express API
    participant ML as ML risk engine
    participant DB as SQLite DB

    Op->>Client: Input Delivery Weight & Save
    Client->>Server: POST /api/deliveries (JSON payload)
    activate Server
    Server->>Server: Run Zod schemas validation
    Server->>DB: Query farmer profile & prior averages
    DB-->>Server: Return historical values
    Server->>ML: Spawn subprocess (Input Features JSON)
    activate ML
    ML-->>Server: Return Attention Class & Probabilities (JSON)
    deactivate ML
    Server->>Server: Calculate authoritative Net Amount
    Server->>DB: Save Delivery, Prediction & Audit logs (Prisma Transaction)
    DB-->>Server: Commit successfully
    Server-->>Client: Response envelope (Authoritative Slip Details)
    deactivate Server
    Client-->>Op: Display Checkmark Pop Success & Slip Receipt
```
