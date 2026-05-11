/*
  Warnings:

  - You are about to drop the column `teacher_id` on the `subjects` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "subject_teachers" (
    "subject_id" TEXT NOT NULL,
    "teacher_id" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'MAIN',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY ("subject_id", "teacher_id"),
    CONSTRAINT "subject_teachers_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "subjects" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "subject_teachers_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

INSERT INTO "subject_teachers" ("subject_id", "teacher_id", "type", "created_at")
SELECT "id", "teacher_id", 'MAIN', CURRENT_TIMESTAMP
FROM "subjects"
WHERE "teacher_id" IS NOT NULL;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_subjects" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "course_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "subjects_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_subjects" ("course_id", "created_at", "description", "id", "name", "sort_order") SELECT "course_id", "created_at", "description", "id", "name", "sort_order" FROM "subjects";
DROP TABLE "subjects";
ALTER TABLE "new_subjects" RENAME TO "subjects";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
