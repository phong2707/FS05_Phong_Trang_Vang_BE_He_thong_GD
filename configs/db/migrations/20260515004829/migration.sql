/*
  Warnings:

  - Added the required column `enrollment_id` to the `learning_progress` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "course_enrollments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "course_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "progress" REAL NOT NULL DEFAULT 0,
    "enrolled_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" DATETIME,
    CONSTRAINT "course_enrollments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "course_enrollments_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "course_rules" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "course_id" TEXT NOT NULL,
    "rule_code" TEXT NOT NULL,
    "rule_value" TEXT NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "course_rules_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "certificates" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "course_id" TEXT NOT NULL,
    "certificate_url" TEXT NOT NULL,
    "reference_code" TEXT NOT NULL,
    "issued_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "certificates_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "certificates_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_chapters" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "subject_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_locked" BOOLEAN NOT NULL DEFAULT false,
    "prerequisite_id" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "chapters_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "subjects" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "chapters_prerequisite_id_fkey" FOREIGN KEY ("prerequisite_id") REFERENCES "chapters" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_chapters" ("created_at", "id", "sort_order", "subject_id", "title") SELECT "created_at", "id", "sort_order", "subject_id", "title" FROM "chapters";
DROP TABLE "chapters";
ALTER TABLE "new_chapters" RENAME TO "chapters";
CREATE TABLE "new_courses" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "thumbnail_url" TEXT,
    "price" REAL NOT NULL,
    "start_date" DATETIME,
    "end_date" DATETIME,
    "duration_value" INTEGER,
    "duration_unit" TEXT DEFAULT 'MONTH',
    "days_of_week" TEXT,
    "level" TEXT DEFAULT 'BEGINNER',
    "max_students" INTEGER,
    "language" TEXT DEFAULT 'VI',
    "is_featured" BOOLEAN NOT NULL DEFAULT false,
    "discount_price" REAL,
    "is_sequential" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "admin_id" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "courses_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_courses" ("admin_id", "created_at", "days_of_week", "description", "discount_price", "duration_unit", "duration_value", "end_date", "id", "is_featured", "language", "level", "max_students", "price", "start_date", "status", "thumbnail_url", "title", "updated_at") SELECT "admin_id", "created_at", "days_of_week", "description", "discount_price", "duration_unit", "duration_value", "end_date", "id", "is_featured", "language", "level", "max_students", "price", "start_date", "status", "thumbnail_url", "title", "updated_at" FROM "courses";
DROP TABLE "courses";
ALTER TABLE "new_courses" RENAME TO "courses";
CREATE TABLE "new_learning_progress" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "enrollment_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "video_id" TEXT,
    "task_id" TEXT,
    "test_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'IN_PROGRESS',
    "watch_time_seconds" INTEGER NOT NULL DEFAULT 0,
    "last_accessed_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" DATETIME,
    CONSTRAINT "learning_progress_enrollment_id_fkey" FOREIGN KEY ("enrollment_id") REFERENCES "course_enrollments" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "learning_progress_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "learning_progress_video_id_fkey" FOREIGN KEY ("video_id") REFERENCES "videos" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "learning_progress_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "taskmen" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "learning_progress_test_id_fkey" FOREIGN KEY ("test_id") REFERENCES "tests" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_learning_progress" ("completed_at", "id", "status", "student_id", "task_id", "test_id", "video_id") SELECT "completed_at", "id", "status", "student_id", "task_id", "test_id", "video_id" FROM "learning_progress";
DROP TABLE "learning_progress";
ALTER TABLE "new_learning_progress" RENAME TO "learning_progress";
CREATE INDEX "learning_progress_enrollment_id_idx" ON "learning_progress"("enrollment_id");
CREATE INDEX "learning_progress_student_id_status_idx" ON "learning_progress"("student_id", "status");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "course_enrollments_user_id_status_idx" ON "course_enrollments"("user_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "course_enrollments_user_id_course_id_key" ON "course_enrollments"("user_id", "course_id");

-- CreateIndex
CREATE UNIQUE INDEX "course_rules_course_id_rule_code_key" ON "course_rules"("course_id", "rule_code");

-- CreateIndex
CREATE UNIQUE INDEX "certificates_reference_code_key" ON "certificates"("reference_code");

-- CreateIndex
CREATE UNIQUE INDEX "certificates_user_id_course_id_key" ON "certificates"("user_id", "course_id");
