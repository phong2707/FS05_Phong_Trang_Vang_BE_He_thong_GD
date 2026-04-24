-- CreateTable
CREATE TABLE "courses" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "thumbnail_url" TEXT,
    "price" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "admin_id" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "courses_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "course_teachers" (
    "course_id" TEXT NOT NULL,
    "teacher_id" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'MAIN_TEACHER',
    "assigned_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY ("course_id", "teacher_id"),
    CONSTRAINT "course_teachers_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "course_teachers_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "subjects" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "course_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "subjects_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "class_groups" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "subject_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "class_groups_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "subjects" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "class_group_users" (
    "user_id" TEXT NOT NULL,
    "class_group_id" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'STUDENT',
    "joined_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY ("user_id", "class_group_id"),
    CONSTRAINT "class_group_users_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "class_group_users_class_group_id_fkey" FOREIGN KEY ("class_group_id") REFERENCES "class_groups" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "taskmen" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "subject_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "file_type" TEXT,
    "url" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_visible" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "taskmen_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "subjects" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "videos" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "subject_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "video_url" TEXT NOT NULL,
    "duration_seconds" INTEGER NOT NULL,
    "provider" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "videos_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "subjects" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "question_types" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT
);

-- CreateTable
CREATE TABLE "questions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "subject_id" TEXT NOT NULL,
    "teacher_id" TEXT NOT NULL,
    "type_id" TEXT NOT NULL,
    "question_format" TEXT NOT NULL DEFAULT 'SINGLE_CHOICE',
    "content" TEXT NOT NULL,
    "explanation" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "questions_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "subjects" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "questions_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "questions_type_id_fkey" FOREIGN KEY ("type_id") REFERENCES "question_types" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "question_answers" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "question_id" TEXT NOT NULL,
    "answer_text" TEXT NOT NULL,
    "is_correct" BOOLEAN NOT NULL DEFAULT false,
    "order_index" INTEGER NOT NULL,
    CONSTRAINT "question_answers_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "tests" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "subject_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "test_type" TEXT NOT NULL,
    "duration_minutes" INTEGER NOT NULL,
    "max_attempts" INTEGER NOT NULL DEFAULT 1,
    "start_time" DATETIME,
    "end_time" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "tests_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "subjects" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "test_questions" (
    "test_id" TEXT NOT NULL,
    "question_id" TEXT NOT NULL,
    "points" REAL NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    PRIMARY KEY ("test_id", "question_id"),
    CONSTRAINT "test_questions_test_id_fkey" FOREIGN KEY ("test_id") REFERENCES "tests" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "test_questions_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "submissions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "test_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "class_group_id" TEXT NOT NULL,
    "grader_id" TEXT,
    "score" REAL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "final_score_status" TEXT,
    "submitted_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "submissions_test_id_fkey" FOREIGN KEY ("test_id") REFERENCES "tests" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "submissions_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "submissions_class_group_id_fkey" FOREIGN KEY ("class_group_id") REFERENCES "class_groups" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "submissions_grader_id_fkey" FOREIGN KEY ("grader_id") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "user_question_answers" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "submission_id" TEXT NOT NULL,
    "question_id" TEXT NOT NULL,
    "answer_id" TEXT,
    "essay_answer" TEXT,
    "is_correct" BOOLEAN NOT NULL,
    CONSTRAINT "user_question_answers_submission_id_fkey" FOREIGN KEY ("submission_id") REFERENCES "submissions" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "user_question_answers_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "user_question_answers_answer_id_fkey" FOREIGN KEY ("answer_id") REFERENCES "question_answers" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "learning_progress" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "student_id" TEXT NOT NULL,
    "video_id" TEXT,
    "task_id" TEXT,
    "test_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'COMPLETED',
    "completed_at" DATETIME,
    CONSTRAINT "learning_progress_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "learning_progress_video_id_fkey" FOREIGN KEY ("video_id") REFERENCES "videos" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "learning_progress_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "taskmen" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "learning_progress_test_id_fkey" FOREIGN KEY ("test_id") REFERENCES "tests" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "forums" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "subject_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "is_locked" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "forums_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "subjects" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "forum_posts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "forum_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "parent_id" TEXT,
    "content" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "forum_posts_forum_id_fkey" FOREIGN KEY ("forum_id") REFERENCES "forums" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "forum_posts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "forum_posts_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "forum_posts" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "messages" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sender_id" TEXT NOT NULL,
    "receiver_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "messages_receiver_id_fkey" FOREIGN KEY ("receiver_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "schedules" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "class_group_id" TEXT NOT NULL,
    "teacher_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "start_at" DATETIME NOT NULL,
    "end_at" DATETIME NOT NULL,
    "day_of_week" INTEGER NOT NULL,
    "room_link" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "schedules_class_group_id_fkey" FOREIGN KEY ("class_group_id") REFERENCES "class_groups" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "schedules_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "course_reviews" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "course_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "content" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "course_reviews_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "course_reviews_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "wallets" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "balance" REAL NOT NULL DEFAULT 0,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "wallets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "student_id" TEXT NOT NULL,
    "course_id" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "payment_method" TEXT NOT NULL DEFAULT 'VNPAY',
    "reference_code" TEXT,
    "status" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "transactions_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "transactions_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_passwords" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME DEFAULT CURRENT_TIMESTAMP,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "password" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'PASSWORD',
    CONSTRAINT "passwords_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_passwords" ("created_at", "deleted", "id", "password", "type", "updated_at", "user_id") SELECT "created_at", "deleted", "id", "password", "type", "updated_at", "user_id" FROM "passwords";
DROP TABLE "passwords";
ALTER TABLE "new_passwords" RENAME TO "passwords";
CREATE TABLE "new_permissions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME DEFAULT CURRENT_TIMESTAMP,
    "created_by_id" TEXT,
    "updated_by_id" TEXT,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL DEFAULT 'FEATURE',
    "feature_id" TEXT NOT NULL,
    CONSTRAINT "permissions_feature_id_fkey" FOREIGN KEY ("feature_id") REFERENCES "features" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "permissions_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "permissions_updated_by_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_permissions" ("code", "created_at", "created_by_id", "deleted", "description", "feature_id", "id", "name", "type", "updated_at", "updated_by_id") SELECT "code", "created_at", "created_by_id", "deleted", "description", "feature_id", "id", "name", "type", "updated_at", "updated_by_id" FROM "permissions";
DROP TABLE "permissions";
ALTER TABLE "new_permissions" RENAME TO "permissions";
CREATE TABLE "new_role_to_permission" (
    "role_id" TEXT NOT NULL,
    "permission_id" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY ("role_id", "permission_id"),
    CONSTRAINT "role_to_permission_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "role_to_permission_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "permissions" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_role_to_permission" ("created_at", "permission_id", "role_id", "updated_at") SELECT "created_at", "permission_id", "role_id", "updated_at" FROM "role_to_permission";
DROP TABLE "role_to_permission";
ALTER TABLE "new_role_to_permission" RENAME TO "role_to_permission";
CREATE TABLE "new_user_to_permission" (
    "user_id" TEXT NOT NULL,
    "permission_id" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY ("user_id", "permission_id"),
    CONSTRAINT "user_to_permission_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "user_to_permission_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "permissions" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_user_to_permission" ("created_at", "permission_id", "updated_at", "user_id") SELECT "created_at", "permission_id", "updated_at", "user_id" FROM "user_to_permission";
DROP TABLE "user_to_permission";
ALTER TABLE "new_user_to_permission" RENAME TO "user_to_permission";
CREATE TABLE "new_user_to_role" (
    "user_id" TEXT NOT NULL,
    "role_id" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY ("user_id", "role_id"),
    CONSTRAINT "user_to_role_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "user_to_role_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_user_to_role" ("created_at", "role_id", "updated_at", "user_id") SELECT "created_at", "role_id", "updated_at", "user_id" FROM "user_to_role";
DROP TABLE "user_to_role";
ALTER TABLE "new_user_to_role" RENAME TO "user_to_role";
CREATE TABLE "new_users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME DEFAULT CURRENT_TIMESTAMP,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "middle_name" TEXT,
    "email" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "avatar_url" TEXT,
    "gender" TEXT,
    "phone_number" TEXT,
    "address" TEXT,
    "google_id" TEXT,
    "ekyc_status" TEXT NOT NULL DEFAULT 'NOT_REQUIRED',
    "last_login_at" DATETIME
);
INSERT INTO "new_users" ("address", "avatar_url", "created_at", "deleted", "email", "first_name", "gender", "google_id", "id", "last_name", "middle_name", "phone_number", "status", "updated_at") SELECT "address", "avatar_url", "created_at", "deleted", "email", "first_name", "gender", "google_id", "id", "last_name", "middle_name", "phone_number", "status", "updated_at" FROM "users";
DROP TABLE "users";
ALTER TABLE "new_users" RENAME TO "users";
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX "users_google_id_key" ON "users"("google_id");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "wallets_user_id_key" ON "wallets"("user_id");
