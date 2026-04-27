import models from "@models";

async function seedDevTeaching() {
  console.log("🌱 Seed DEV Teaching data");

  /* =======================
   * 1. ROLE: TEACHER
   * ======================= */
  const roleTeacher = await models.role.upsert({
    where: { code: "TEACHER" },
    update: {},
    create: { code: "TEACHER", name: "Giáo viên" },
  });

  /* =======================
   * 2. USER: TEACHER
   * ======================= */
  const teacher = await models.user.upsert({
    where: { email: "teacher@dev.local" },
    update: {},
    create: {
      email: "teacher@dev.local",
      firstName: "Dev",
      lastName: "Teacher",
      status: "ACTIVE",
    },
  });

  await models.userToRole.upsert({
    where: {
      userId_roleId: {
        userId: teacher.id,
        roleId: roleTeacher.id,
      },
    },
    update: {},
    create: {
      userId: teacher.id,
      roleId: roleTeacher.id,
    },
  });

  /* =======================
 * 3. COURSE (RAW INSERT – FIX updated_at)
 * ======================= */
const now = new Date().toISOString();

await models.$executeRawUnsafe(`
  INSERT INTO courses (
    id,
    title,
    description,
    price,
    admin_id,
    created_at,
    updated_at
  )
  VALUES (
    lower(hex(randomblob(16))),
    'Fullstack Web Development',
    'Khoá học dùng để làm đồ án',
    0,
    '${teacher.id}',
    '${now}',
    '${now}'
  )
`);

/* Lấy lại course vừa tạo */
const course = await models.course.findFirst({
  where: { title: "Fullstack Web Development" },
});

if (!course) {
  throw new Error("❌ Course not found after raw insert");
}


  /* =======================
   * 4. ASSIGN TEACHER → COURSE
   * ======================= */
  await models.courseTeacher.upsert({
    where: {
      courseId_teacherId: {
        courseId: course.id,
        teacherId: teacher.id,
      },
    },
    update: {},
    create: {
      courseId: course.id,
      teacherId: teacher.id,
      role: "MAIN_TEACHER",
    },
  });

  console.log("✅ Seed DEV Teaching OK");
  console.log({
    teacherId: teacher.id,
    courseId: course.id,
  });
}

seedDevTeaching()
  .catch(console.error)
  .finally(() => models.$disconnect());