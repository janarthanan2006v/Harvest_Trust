# Database Constraint Tests Report

This report documents the database validation tests and exact errors thrown by SQLite when constraints are violated.

## 1. Duplicate Receipt Unique Constraint Violation

- **Attempted Action:** Attempting to insert a duplicate receipt number row into the `Delivery` table.
- **Expected Outcome:** Database rollback with a Unique constraint failure on `receiptNumber`.
- **Actual SQLite Database Error Thrown:**
```text

Invalid `prisma.delivery.create()` invocation in
/Users/sakithyavishwanathan/Documents/SIH_Project/apps/api/src/tests/run-tests.ts:92:31

  89 } else {
  90   // Attempt duplicate receipt insertion
  91   try {
→ 92     await prisma.delivery.create(
Unique constraint failed on the fields: (`receiptNumber`)
```

## 2. Recovery Integrity Verification

After the unique constraint violation is triggered and rolled back, a valid delivery record is successfully inserted to prove that the database transaction state is preserved and fully functional.
