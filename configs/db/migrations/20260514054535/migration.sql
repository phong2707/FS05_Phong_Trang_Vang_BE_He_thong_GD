/*
  Warnings:

  - You are about to drop the column `subject_id` on the `taskmen` table. All the data in the column will be lost.
  - You are about to drop the column `subject_id` on the `tests` table. All the data in the column will be lost.
  - You are about to drop the column `subject_id` on the `videos` table. All the data in the column will be lost.
  - Added the required column `chapter_id` to the `taskmen` table without a default value. This is not possible if the table is not empty.
  - Added the required column `chapter_id` to the `tests` table without a default value. This is not possible if the table is not empty.
  - Added the required column `chapter_id` to the `videos` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "class_groups" ADD COLUMN "end_date" DATETIME;
ALTER TABLE "class_groups" ADD COLUMN "max_students" INTEGER DEFAULT 30;
ALTER TABLE "class_groups" ADD COLUMN "room_link" TEXT;
ALTER TABLE "class_groups" ADD COLUMN "start_date" DATETIME;

-- AlterTable
ALTER TABLE "submissions" ADD COLUMN "feedback_file_url" TEXT;
ALTER TABLE "submissions" ADD COLUMN "student_file_url" TEXT;
ALTER TABLE "submissions" ADD COLUMN "teacher_feedback" TEXT;

-- CreateTable
CREATE TABLE "chapters" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "subject_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "chapters_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "subjects" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "attendances" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "schedule_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PRESENT',
    "note" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "attendances_schedule_id_fkey" FOREIGN KEY ("schedule_id") REFERENCES "schedules" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "attendances_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
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
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "admin_id" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "courses_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_courses" ("admin_id", "created_at", "description", "id", "price", "status", "thumbnail_url", "title", "updated_at") SELECT "admin_id", "created_at", "description", "id", "price", "status", "thumbnail_url", "title", "updated_at" FROM "courses";
DROP TABLE "courses";
ALTER TABLE "new_courses" RENAME TO "courses";
CREATE TABLE "new_schedules" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "class_group_id" TEXT NOT NULL,
    "teacher_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "start_at" DATETIME NOT NULL,
    "end_at" DATETIME NOT NULL,
    "day_of_week" INTEGER,
    "room_link" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "schedules_class_group_id_fkey" FOREIGN KEY ("class_group_id") REFERENCES "class_groups" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "schedules_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_schedules" ("class_group_id", "created_at", "day_of_week", "description", "end_at", "id", "room_link", "start_at", "teacher_id", "title") SELECT "class_group_id", "created_at", "day_of_week", "description", "end_at", "id", "room_link", "start_at", "teacher_id", "title" FROM "schedules";
DROP TABLE "schedules";
ALTER TABLE "new_schedules" RENAME TO "schedules";
CREATE TABLE "new_taskmen" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "chapter_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "file_type" TEXT,
    "url" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_visible" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "taskmen_chapter_id_fkey" FOREIGN KEY ("chapter_id") REFERENCES "chapters" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_taskmen" ("created_at", "file_type", "id", "is_visible", "sort_order", "title", "url") SELECT "created_at", "file_type", "id", "is_visible", "sort_order", "title", "url" FROM "taskmen";
DROP TABLE "taskmen";
ALTER TABLE "new_taskmen" RENAME TO "taskmen";
CREATE TABLE "new_tests" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "chapter_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "test_type" TEXT NOT NULL,
    "duration_minutes" INTEGER NOT NULL,
    "max_attempts" INTEGER NOT NULL DEFAULT 1,
    "start_time" DATETIME,
    "end_time" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "tests_chapter_id_fkey" FOREIGN KEY ("chapter_id") REFERENCES "chapters" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_tests" ("created_at", "duration_minutes", "end_time", "id", "max_attempts", "start_time", "test_type", "title") SELECT "created_at", "duration_minutes", "end_time", "id", "max_attempts", "start_time", "test_type", "title" FROM "tests";
DROP TABLE "tests";
ALTER TABLE "new_tests" RENAME TO "tests";
CREATE TABLE "new_videos" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "chapter_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "video_url" TEXT NOT NULL,
    "duration_seconds" INTEGER NOT NULL,
    "provider" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "videos_chapter_id_fkey" FOREIGN KEY ("chapter_id") REFERENCES "chapters" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_videos" ("created_at", "duration_seconds", "id", "provider", "sort_order", "title", "video_url") SELECT "created_at", "duration_seconds", "id", "provider", "sort_order", "title", "video_url" FROM "videos";
DROP TABLE "videos";
ALTER TABLE "new_videos" RENAME TO "videos";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "attendances_schedule_id_student_id_key" ON "attendances"("schedule_id", "student_id");
