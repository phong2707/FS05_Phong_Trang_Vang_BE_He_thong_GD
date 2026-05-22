-- CreateTable
CREATE TABLE "test_generation_rules" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "test_id" TEXT NOT NULL,
    "question_format" TEXT,
    "question_type_id" TEXT,
    "total_count" INTEGER NOT NULL,
    "points_per_question" REAL NOT NULL DEFAULT 1,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "test_generation_rules_test_id_fkey" FOREIGN KEY ("test_id") REFERENCES "tests" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "test_generation_rules_question_type_id_fkey" FOREIGN KEY ("question_type_id") REFERENCES "question_types" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_tests" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "scope" TEXT NOT NULL DEFAULT 'CHAPTER',
    "chapter_id" TEXT,
    "subject_id" TEXT,
    "course_id" TEXT,
    "title" TEXT NOT NULL,
    "test_type" TEXT NOT NULL,
    "duration_minutes" INTEGER NOT NULL,
    "is_auto_generated" BOOLEAN NOT NULL DEFAULT false,
    "max_attempts" INTEGER NOT NULL DEFAULT 1,
    "start_time" DATETIME,
    "end_time" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "tests_chapter_id_fkey" FOREIGN KEY ("chapter_id") REFERENCES "chapters" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "tests_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "subjects" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "tests_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_tests" ("chapter_id", "course_id", "created_at", "duration_minutes", "end_time", "id", "max_attempts", "scope", "start_time", "subject_id", "test_type", "title") SELECT "chapter_id", "course_id", "created_at", "duration_minutes", "end_time", "id", "max_attempts", "scope", "start_time", "subject_id", "test_type", "title" FROM "tests";
DROP TABLE "tests";
ALTER TABLE "new_tests" RENAME TO "tests";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
