-- CreateTable
CREATE TABLE "test_snapshot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "testId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "hash" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "test_snapshot_testId_fkey" FOREIGN KEY ("testId") REFERENCES "tests" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "exam_session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "testId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "cheat_log" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "studentId" TEXT NOT NULL,
    "testId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_questions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "scope" TEXT NOT NULL DEFAULT 'CHAPTER',
    "chapter_id" TEXT,
    "subject_id" TEXT,
    "course_id" TEXT,
    "teacher_id" TEXT NOT NULL,
    "type_id" TEXT NOT NULL,
    "question_format" TEXT NOT NULL DEFAULT 'SINGLE_CHOICE',
    "content" TEXT NOT NULL,
    "explanation" TEXT,
    "difficulty" TEXT DEFAULT 'MEDIUM',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "questions_chapter_id_fkey" FOREIGN KEY ("chapter_id") REFERENCES "chapters" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "questions_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "subjects" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "questions_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "questions_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "questions_type_id_fkey" FOREIGN KEY ("type_id") REFERENCES "question_types" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_questions" ("content", "created_at", "explanation", "id", "question_format", "subject_id", "teacher_id", "type_id") SELECT "content", "created_at", "explanation", "id", "question_format", "subject_id", "teacher_id", "type_id" FROM "questions";
DROP TABLE "questions";
ALTER TABLE "new_questions" RENAME TO "questions";
CREATE INDEX "questions_chapter_id_idx" ON "questions"("chapter_id");
CREATE INDEX "questions_subject_id_idx" ON "questions"("subject_id");
CREATE INDEX "questions_course_id_idx" ON "questions"("course_id");
CREATE INDEX "questions_scope_idx" ON "questions"("scope");
CREATE TABLE "new_tests" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "scope" TEXT NOT NULL DEFAULT 'CHAPTER',
    "chapter_id" TEXT,
    "subject_id" TEXT,
    "course_id" TEXT,
    "mode" TEXT NOT NULL DEFAULT 'FIXED',
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
INSERT INTO "new_tests" ("chapter_id", "course_id", "created_at", "duration_minutes", "end_time", "id", "is_auto_generated", "max_attempts", "scope", "start_time", "subject_id", "test_type", "title") SELECT "chapter_id", "course_id", "created_at", "duration_minutes", "end_time", "id", "is_auto_generated", "max_attempts", "scope", "start_time", "subject_id", "test_type", "title" FROM "tests";
DROP TABLE "tests";
ALTER TABLE "new_tests" RENAME TO "tests";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "test_snapshot_testId_studentId_key" ON "test_snapshot"("testId", "studentId");

-- CreateIndex
CREATE UNIQUE INDEX "exam_session_token_key" ON "exam_session"("token");
