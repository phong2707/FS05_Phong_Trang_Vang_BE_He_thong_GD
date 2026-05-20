import models from "@models";

export async function seedTeacherAndCourse() {
  console.log("🌱 Seeding teacher & course...");

  // 1. Tạo giáo viên
  const teacher = await models.user.upsert({
    where: { email: "teacher@example.com" },
    update: {},
    create: {
      email: "teacher@example.com",
      firstName: "Nguyen",
      lastName: "Teacher",
      status: "ACTIVE",
    },
  });

  // 2. Tạo hoặc lấy khoá học
let course = await models.course.findFirst({
  where: { title: "Lập trình Web cơ bản" },
});

if (!course) {
  course = await models.course.create({
    data: {
      title: "Lập trình Web cơ bản",
      description: "Khoá học lập trình web cho sinh viên",
      price: 0,
      adminId: teacher.id, // GĐ1 dùng tạm
    },
  });
}

  // 3. Tạo môn học thuộc khoá
  const subject = await models.subject.upsert({
    where: { id: "seed-subject-web-basic-01" },
    update: {
      name: "Môn Web cơ bản",
      courseId: course.id,
      sortOrder: 1,
    },
    create: {
      id: "seed-subject-web-basic-01",
      name: "Môn Web cơ bản",
      description: "Môn học nền tảng cho khoá Lập trình Web cơ bản",
      courseId: course.id,
      sortOrder: 1,
    },
  });

  // 4. Gán giáo viên vào môn học (schema hiện tại dùng SubjectTeacher)
  await models.subjectTeacher.upsert({
    where: {
      subjectId_teacherId: {
        subjectId: subject.id,
        teacherId: teacher.id,
      },
    },
    update: {
      type: "MAIN",
    },
    create: {
      subjectId: subject.id,
      teacherId: teacher.id,
      type: "MAIN",
    },
  });

  console.log("✅ Teacher, course & subject assignment seeded");
}
