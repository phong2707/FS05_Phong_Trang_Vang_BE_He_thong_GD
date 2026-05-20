-- CreateTable
CREATE TABLE "subject_grades" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "subject_id" TEXT NOT NULL,
    "class_group_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "assignment_score" REAL,
    "midterm_score" REAL,
    "final_score" REAL,
    "total_score" REAL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "updated_by_id" TEXT,
    "published_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "subject_grades_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "subjects" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "subject_grades_class_group_id_fkey" FOREIGN KEY ("class_group_id") REFERENCES "class_groups" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "subject_grades_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "subject_grades_updated_by_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "subject_grades_subject_id_student_id_key" ON "subject_grades"("subject_id", "student_id");
