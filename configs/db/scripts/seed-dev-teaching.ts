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
   * 3. COURSE
   * ======================= */
  const course = await models.course.upsert({
    where: { id: "dev-course-fullstack-web" },
    update: {
      title: "Fullstack Web Development",
      description: "Khoá học dùng để làm đồ án",
      price: 0,
      status: "PUBLISHED",
      adminId: teacher.id,
      level: "BEGINNER",
      language: "VI",
    },
    create: {
      id: "dev-course-fullstack-web",
      title: "Fullstack Web Development",
      description: "Khoá học dùng để làm đồ án",
      price: 0,
      status: "PUBLISHED",
      adminId: teacher.id,
      level: "BEGINNER",
      language: "VI",
      startDate: new Date("2026-06-01T00:00:00.000Z"),
    },
  });

  /* =======================
   * 3.1 SUBJECTS (Frontend + ReactJS)
   * ======================= */
  const frontendSubject = await models.subject.upsert({
    where: { id: "dev-subject-frontend-reactjs" },
    update: {
      courseId: course.id,
      name: "Frontend với ReactJS",
      description: "Môn Frontend tập trung ReactJS, Vite và TypeScript",
      sortOrder: 1,
      isSequential: true,
      allowReview: true,
    },
    create: {
      id: "dev-subject-frontend-reactjs",
      courseId: course.id,
      name: "Frontend với ReactJS",
      description: "Môn Frontend tập trung ReactJS, Vite và TypeScript",
      sortOrder: 1,
      isSequential: true,
      allowReview: true,
    },
  });

  await models.subjectTeacher.upsert({
    where: {
      subjectId_teacherId: {
        subjectId: frontendSubject.id,
        teacherId: teacher.id,
      },
    },
    update: { type: "MAIN" },
    create: {
      subjectId: frontendSubject.id,
      teacherId: teacher.id,
      type: "MAIN",
    },
  });

  /* =======================
   * 3.2 CLASS GROUP + SCHEDULE (để UI không còn "Chưa có lớp / Chưa cập nhật")
   * ======================= */
  const classGroup = await models.classGroup.upsert({
    where: { id: "dev-class-frontend-reactjs-k1" },
    update: {
      subjectId: frontendSubject.id,
      name: "Lớp Frontend ReactJS K1",
      status: "ACTIVE",
      startDate: new Date("2026-06-05T00:00:00.000Z"),
      endDate: new Date("2026-12-05T00:00:00.000Z"),
      maxStudents: 35,
      roomLink: "https://meet.google.com/frontend-reactjs-k1",
    },
    create: {
      id: "dev-class-frontend-reactjs-k1",
      subjectId: frontendSubject.id,
      name: "Lớp Frontend ReactJS K1",
      status: "ACTIVE",
      startDate: new Date("2026-06-05T00:00:00.000Z"),
      endDate: new Date("2026-12-05T00:00:00.000Z"),
      maxStudents: 35,
      roomLink: "https://meet.google.com/frontend-reactjs-k1",
    },
  });

  await models.schedule.upsert({
    where: { id: "dev-schedule-frontend-reactjs-01" },
    update: {
      classGroupId: classGroup.id,
      teacherId: teacher.id,
      title: "Buổi 1: ReactJS Fundamentals",
      description: "Giới thiệu React component, props, state",
      startAt: new Date("2026-06-05T11:30:00.000Z"),
      endAt: new Date("2026-06-05T14:00:00.000Z"),
      dayOfWeek: 5,
      roomLink: "https://meet.google.com/frontend-reactjs-k1",
    },
    create: {
      id: "dev-schedule-frontend-reactjs-01",
      classGroupId: classGroup.id,
      teacherId: teacher.id,
      title: "Buổi 1: ReactJS Fundamentals",
      description: "Giới thiệu React component, props, state",
      startAt: new Date("2026-06-05T11:30:00.000Z"),
      endAt: new Date("2026-06-05T14:00:00.000Z"),
      dayOfWeek: 5,
      roomLink: "https://meet.google.com/frontend-reactjs-k1",
    },
  });


  console.log("✅ Seed DEV Teaching OK");
  console.log({
    teacherId: teacher.id,
    courseId: course.id,
    subjectId: frontendSubject.id,
    classGroupId: classGroup.id,
  });
}

seedDevTeaching()
  .catch(console.error)
  .finally(() => models.$disconnect());