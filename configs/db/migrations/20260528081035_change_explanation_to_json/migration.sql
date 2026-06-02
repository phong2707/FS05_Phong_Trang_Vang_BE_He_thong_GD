/*
  Warnings:

  - You are about to alter the column `explanation` on the `questions` table. The data in that column could be lost. The data in that column will be cast from `String` to `Json`.

*/
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
    "explanation" JSONB,
    "difficulty" TEXT DEFAULT 'MEDIUM',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "questions_chapter_id_fkey" FOREIGN KEY ("chapter_id") REFERENCES "chapters" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "questions_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "subjects" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "questions_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "questions_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "questions_type_id_fkey" FOREIGN KEY ("type_id") REFERENCES "question_types" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_questions" ("chapter_id", "content", "course_id", "created_at", "difficulty", "explanation", "id", "question_format", "scope", "subject_id", "teacher_id", "type_id") SELECT "chapter_id", "content", "course_id", "created_at", "difficulty", "explanation", "id", "question_format", "scope", "subject_id", "teacher_id", "type_id" FROM "questions";
DROP TABLE "questions";
ALTER TABLE "new_questions" RENAME TO "questions";
CREATE INDEX "questions_chapter_id_idx" ON "questions"("chapter_id");
CREATE INDEX "questions_subject_id_idx" ON "questions"("subject_id");
CREATE INDEX "questions_course_id_idx" ON "questions"("course_id");
CREATE INDEX "questions_scope_idx" ON "questions"("scope");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
