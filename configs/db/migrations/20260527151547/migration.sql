/*
  Warnings:

  - Added the required column `enrollment_id` to the `transactions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `transactions` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_course_enrollments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "course_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "progress" REAL NOT NULL DEFAULT 0,
    "enrolled_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" DATETIME,
    CONSTRAINT "course_enrollments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "course_enrollments_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_course_enrollments" ("completed_at", "course_id", "enrolled_at", "id", "progress", "status", "user_id") SELECT "completed_at", "course_id", "enrolled_at", "id", "progress", "status", "user_id" FROM "course_enrollments";
DROP TABLE "course_enrollments";
ALTER TABLE "new_course_enrollments" RENAME TO "course_enrollments";
CREATE INDEX "course_enrollments_user_id_status_idx" ON "course_enrollments"("user_id", "status");
CREATE UNIQUE INDEX "course_enrollments_user_id_course_id_key" ON "course_enrollments"("user_id", "course_id");
CREATE TABLE "new_transactions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "enrollment_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "course_id" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "payment_method" TEXT NOT NULL DEFAULT 'VNPAY',
    "reference_code" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "bank_account" TEXT,
    "bank_name" TEXT,
    "account_name" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "transactions_enrollment_id_fkey" FOREIGN KEY ("enrollment_id") REFERENCES "course_enrollments" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "transactions_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "transactions_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_transactions" ("amount", "course_id", "created_at", "id", "payment_method", "reference_code", "status", "student_id") SELECT "amount", "course_id", "created_at", "id", "payment_method", "reference_code", "status", "student_id" FROM "transactions";
DROP TABLE "transactions";
ALTER TABLE "new_transactions" RENAME TO "transactions";
CREATE UNIQUE INDEX "transactions_enrollment_id_key" ON "transactions"("enrollment_id");
CREATE INDEX "transactions_student_id_status_idx" ON "transactions"("student_id", "status");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
