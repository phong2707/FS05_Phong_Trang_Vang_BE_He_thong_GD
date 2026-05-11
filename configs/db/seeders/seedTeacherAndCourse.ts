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

  // 3. Gán giáo viên vào khoá học
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

  console.log("✅ Teacher & course seeded");
}