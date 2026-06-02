import models, { PasswordType, UserStatus } from "@models";
import * as bcrypt from "bcrypt";

async function seed() {
  try {
    console.log("🚀 BẮT ĐẦU QUÁ TRÌNH SEED DỮ LIỆU...");

    // ==========================================
    // 1. DỌN DẸP DỮ LIỆU CŨ (Thứ tự rất quan trọng vì khóa ngoại)
    // ==========================================
    console.log("🧹 Đang dọn dẹp dữ liệu cũ (Cascading)...");
    
    await models.certificate.deleteMany({});
    await models.courseRule.deleteMany({});
    await models.attendance.deleteMany({});
    await models.transaction.deleteMany({});
    
    // ✅ Dọn dẹp Bảng điểm môn học (SubjectGrade - bảng mới)
    await models.subjectGrade.deleteMany({}); 

    await models.userQuestionAnswer.deleteMany({});
    await models.submission.deleteMany({});
    await models.testQuestion.deleteMany({});
    await models.test.deleteMany({});
    await models.learningProgress.deleteMany({});
    await models.video.deleteMany({});
    await models.taskman.deleteMany({});
    await models.chapter.deleteMany({});
    await models.questionAnswer.deleteMany({});
    await models.question.deleteMany({});
    await models.questionType.deleteMany({});
    await models.forumPost.deleteMany({});
    await models.forum.deleteMany({});
    await models.schedule.deleteMany({});
    await models.classGroupUser.deleteMany({});
    await models.classGroup.deleteMany({});
    await models.courseEnrollment.deleteMany({});
    await models.subjectTeacher.deleteMany({}); 
    await models.subject.deleteMany({});
    await models.courseReview.deleteMany({});
    await models.transaction.deleteMany({});
    await models.course.deleteMany({}); 
    
    // ✅ Dọn dẹp Category (bảng mới thêm)
    await models.category.deleteMany({});

    await models.message.deleteMany({});
    await models.notification.deleteMany({});
    await models.request.deleteMany({});
    await models.userToPermission.deleteMany({});
    await models.userToRole.deleteMany({});
    await models.wallet.deleteMany({});
    await models.password.deleteMany({});
    await models.roleToPermission.deleteMany({});
    await models.permission.deleteMany({});
    await models.feature.deleteMany({});
    await models.role.deleteMany({});
    await models.user.deleteMany({});

    // ==========================================
    // 2. TẠO ROLES & FEATURES
    // ==========================================
    console.log("🛡️ Đang khởi tạo RBAC...");

    const roleAdmin = await models.role.create({ data: { code: "ADMIN", name: "Quản trị viên", description: "Toàn quyền quản trị hệ thống" } });
    const roleTeacher = await models.role.create({ data: { code: "TEACHER", name: "Giáo viên", description: "Quản lý khóa học, chấm điểm" } });
    const roleTA = await models.role.create({ data: { code: "TA", name: "Trợ giảng", description: "Hỗ trợ học tập, trả lời forum" } });
    const roleStudent = await models.role.create({ data: { code: "STUDENT", name: "Học viên", description: "Người dùng học tập" } });

    const featAM = await models.feature.create({ data: { code: "AM", name: "Quản trị Hệ thống", type: "SYSTEM" } });
    const permsAM = await Promise.all([
      models.permission.create({ data: { code: "AM::READ", name: "Xem hệ thống", featureId: featAM.id } }),
      models.permission.create({ data: { code: "AM::CREATE", name: "Tạo dữ liệu", featureId: featAM.id } }),
    ]);

    const featCourse = await models.feature.create({ data: { code: "FEAT_COURSE", name: "Quản lý Khóa học", type: "MENU_GROUP" } });
    const permCourseView = await models.permission.create({ data: { code: "COURSE_VIEW", name: "Xem Khóa học", featureId: featCourse.id } });
    const permCourseEdit = await models.permission.create({ data: { code: "COURSE_EDIT", name: "Sửa Khóa học", featureId: featCourse.id } });

    await models.roleToPermission.createMany({
      data: [
        ...permsAM.map(p => ({ roleId: roleAdmin.id, permissionId: p.id })),
        { roleId: roleAdmin.id, permissionId: permCourseView.id },
        { roleId: roleAdmin.id, permissionId: permCourseEdit.id },
        { roleId: roleTeacher.id, permissionId: permCourseView.id },
        { roleId: roleTeacher.id, permissionId: permCourseEdit.id },
        { roleId: roleStudent.id, permissionId: permCourseView.id },
      ]
    });

    // ==========================================
    // 3. TẠO TÀI KHOẢN (REALISTIC DATA)
    // ==========================================
    console.log("👥 Đang tạo danh sách người dùng...");
    const hashedPassword = await bcrypt.hash("123456", 10);

    const admin = await models.user.create({
      data: {
        firstName: "Quản trị", lastName: "Hệ thống", email: "admin@iviettech.vn", status: UserStatus.ACTIVE, gender: "MALE",
        passwords: { create: { password: hashedPassword, type: PasswordType.PASSWORD } },
        roles: { create: { roleId: roleAdmin.id } }, wallet: { create: { balance: 0 } }
      }
    });

    const teachers = await Promise.all([
      models.user.create({ data: { firstName: "Trần Thế", lastName: "Phong", email: "phongnvpd10379@gmail.com", status: UserStatus.ACTIVE, gender: "MALE", avatarUrl: "https://i.pravatar.cc/150?u=phong", passwords: { create: { password: hashedPassword } }, roles: { create: { roleId: roleTeacher.id } }, wallet: { create: { balance: 15000000 } } } }),
      models.user.create({ data: { firstName: "Lê Minh", lastName: "Tuấn", email: "tuan.le@iviettech.vn", status: UserStatus.ACTIVE, gender: "MALE", avatarUrl: "https://i.pravatar.cc/150?u=tuan", passwords: { create: { password: hashedPassword } }, roles: { create: { roleId: roleTeacher.id } }, wallet: { create: { balance: 25000000 } } } }),
      models.user.create({ data: { firstName: "Nguyễn Thu", lastName: "Hương", email: "huong.nguyen@iviettech.vn", status: UserStatus.ACTIVE, gender: "FEMALE", avatarUrl: "https://i.pravatar.cc/150?u=huong", passwords: { create: { password: hashedPassword } }, roles: { create: { roleId: roleTeacher.id } }, wallet: { create: { balance: 18000000 } } } }),
    ]);

    const specificStudent = await models.user.create({
      data: {
        firstName: "Cyleish", lastName: "Student", email: "phongnguyenatx2707@gmail.com", status: UserStatus.ACTIVE, phoneNumber: "0988888888",
        passwords: { create: { password: hashedPassword, type: PasswordType.PASSWORD } }, roles: { create: { roleId: roleStudent.id } }, wallet: { create: { balance: 5000000 } }
      }
    });

    const studentNames = ["Hoàng An", "Trần Bình", "Lê Chi", "Phạm Duy", "Bùi Hải", "Vũ Linh", "Đặng Mai", "Đỗ Oanh"];
    const students = await Promise.all(studentNames.map((name, i) => {
      const [l, f] = name.split(" ");
      return models.user.create({
        data: {
          firstName: f, lastName: l, email: `student${i+1}@gmail.com`, status: UserStatus.ACTIVE, phoneNumber: `09000000${i.toString().padStart(2, '0')}`,
          passwords: { create: { password: hashedPassword } }, roles: { create: { roleId: roleStudent.id } }, wallet: { create: { balance: Math.floor(Math.random() * 5000000) + 1000000 } }
        }
      });
    }));

    // ==========================================
    // 4. TẠO CATEGORIES (CÂY DANH MỤC)
    // ==========================================
    console.log("📂 Đang tạo Cây Danh Mục Ngành Học...");

    // Cấp 1 (Root Categories)
    const catIT = await models.category.create({ data: { name: "Công nghệ thông tin", slug: "cong-nghe-thong-tin", iconUrl: "💻" } });
    const catDesign = await models.category.create({ data: { name: "Thiết kế Đồ họa", slug: "thiet-ke-do-hoa", iconUrl: "🎨" } });
    const catBiz = await models.category.create({ data: { name: "Kinh doanh & Quản lý", slug: "kinh-doanh-quan-ly", iconUrl: "💼" } });

    // Cấp 2 (Sub Categories)
    const subCatWeb = await models.category.create({ data: { name: "Lập trình Web", slug: "lap-trinh-web", parentId: catIT.id } });
    const subCatMobile = await models.category.create({ data: { name: "Lập trình Mobile", slug: "lap-trinh-mobile", parentId: catIT.id } });
    const subCatQA = await models.category.create({ data: { name: "Kiểm thử phần mềm", slug: "kiem-thu-phan-mem", parentId: catIT.id } });
    const subCatUIUX = await models.category.create({ data: { name: "UI/UX Design", slug: "ui-ux-design", parentId: catDesign.id } });

    // ==========================================
    // 5. TẠO KHÓA HỌC & RULES GẮN VỚI DANH MỤC
    // ==========================================
    console.log("📚 Đang tạo Khóa học & Rules...");

    const courseWeb = await models.course.create({
      data: {
        title: "Kỹ sư Lập trình Web Fullstack (MERN Stack)", 
        description: "Khóa học toàn diện từ con số 0 trở thành kỹ sư Fullstack. Học HTML, CSS, ReactJS, Node.js, Express và MongoDB/PostgreSQL.",
        price: 8500000, discountPrice: 6500000, startDate: new Date("2026-06-01"), durationValue: 6, durationUnit: "MONTH", daysOfWeek: "T3, T5, T7",
        level: "BEGINNER", maxStudents: 50, isFeatured: true, isSequential: true, status: "PUBLISHED", adminId: admin.id,
        categoryId: subCatWeb.id, // Gắn vào danh mục Web
        thumbnailUrl: "https://placehold.co/800x400/2563eb/white?text=Fullstack+MERN",
      }
    });

    const courseQA = await models.course.create({
      data: {
        title: "Software Testing chuyên sâu (Automation Test)", 
        description: "Làm chủ Selenium, Cypress và Postman API Testing.",
        price: 5500000, status: "PUBLISHED", adminId: admin.id, categoryId: subCatQA.id,
        thumbnailUrl: "https://placehold.co/800x400/16a34a/white?text=Automation+Test",
      }
    });

    const courseUIUX = await models.course.create({
      data: {
        title: "Figma UI/UX Design Masterclass", 
        description: "Thiết kế giao diện người dùng đỉnh cao với Figma.",
        price: 3200000, status: "PUBLISHED", adminId: admin.id, categoryId: subCatUIUX.id,
        thumbnailUrl: "https://placehold.co/800x400/db2777/white?text=UI+UX+Design",
      }
    });

    await models.courseRule.createMany({
      data: [
        { courseId: courseWeb.id, ruleCode: 'MIN_TEST_SCORE', ruleValue: '75', description: 'Điểm tổng kết trên 75/100' },
        { courseId: courseWeb.id, ruleCode: 'MAX_ABSENCE', ruleValue: '4', description: 'Nghỉ quá 4 buổi cấm thi' },
        { courseId: courseQA.id, ruleCode: 'MIN_TEST_SCORE', ruleValue: '80', description: 'Điểm đạt chứng chỉ ISTQB nội bộ' }
      ]
    });

    // ==========================================
    // 6. TẠO MÔN HỌC & CHƯƠNG HỌC
    // ==========================================
    const subFrontend = await models.subject.create({
      data: {
        courseId: courseWeb.id, name: "Frontend với ReactJS & TypeScript", sortOrder: 1,
        isSequential: true, allowReview: true, // Áp dụng schema mới
        teachers: {
          create: [
            { teacherId: teachers[0].id, type: "MAIN" },
            { teacherId: teachers[2].id, type: "TA" },
          ],
        },
      }
    });

    const subBackend = await models.subject.create({
      data: {
        courseId: courseWeb.id, name: "Backend Core với Node.js & Prisma", sortOrder: 2,
        isSequential: true, allowReview: false, // Thi xong không cho xem lại
        teachers: {
          create: [
            { teacherId: teachers[1].id, type: "MAIN" },
            { teacherId: teachers[0].id, type: "TA" },
          ],
        },
      }
    });

    const subDatabase = await models.subject.create({
      data: {
        courseId: courseWeb.id,
        name: "Database Design với PostgreSQL",
        sortOrder: 3,
        isSequential: false,
        allowReview: true,
        teachers: {
          create: [
            { teacherId: teachers[1].id, type: "MAIN" },
            { teacherId: teachers[2].id, type: "TA" },
          ],
        },
      },
    });

    const subAutomation = await models.subject.create({
      data: {
        courseId: courseQA.id,
        name: "API Automation với Postman/Newman",
        sortOrder: 1,
        isSequential: false,
        allowReview: true,
        teachers: {
          create: [
            { teacherId: teachers[2].id, type: "MAIN" },
            { teacherId: teachers[1].id, type: "TA" },
          ],
        },
      },
    });

    const subUixFoundation = await models.subject.create({
      data: {
        courseId: courseUIUX.id,
        name: "UI Foundation & Design System",
        sortOrder: 1,
        isSequential: false,
        allowReview: true,
        teachers: {
          create: [
            { teacherId: teachers[2].id, type: "MAIN" },
            { teacherId: teachers[0].id, type: "TA" },
          ],
        },
      },
    });

    const chapFE1 = await models.chapter.create({ data: { subjectId: subFrontend.id, title: "Chương 1: Khởi động với React & Vite", sortOrder: 1 } });
    const chapFE2 = await models.chapter.create({ data: { subjectId: subFrontend.id, title: "Chương 2: React Hooks & State Management", sortOrder: 2, prerequisiteId: chapFE1.id, isLocked: true } });

    const chapBE1 = await models.chapter.create({ data: { subjectId: subBackend.id, title: "Chương 1: REST API với Express", sortOrder: 1 } });
    const chapDB1 = await models.chapter.create({ data: { subjectId: subDatabase.id, title: "Chương 1: Chuẩn hóa dữ liệu & ERD", sortOrder: 1 } });
    const chapQA1 = await models.chapter.create({ data: { subjectId: subAutomation.id, title: "Chương 1: API Testing với Postman", sortOrder: 1 } });
    const chapUI1 = await models.chapter.create({ data: { subjectId: subUixFoundation.id, title: "Chương 1: Typography, Color & Layout", sortOrder: 1 } });
    
    // ==========================================
    // 7. BÀI GIẢNG VIDEO & BÀI TẬP (TASKMAN)
    // ==========================================
    console.log("🎥 Đang tạo Bài giảng và Bài tập...");

    const v1 = await models.video.create({ data: { chapterId: chapFE1.id, title: "Bài 1: Tại sao lại là React?", videoUrl: "https://www.youtube.com/watch?v=Tn6-PIqc4UM", durationSeconds: 1200, provider: "YOUTUBE", sortOrder: 1 } });
    const v2 = await models.video.create({ data: { chapterId: chapFE1.id, title: "Bài 2: Render & JSX dưới góc nhìn sâu", videoUrl: "https://www.youtube.com/watch?v=SqcY0GlETPk", durationSeconds: 2400, provider: "YOUTUBE", sortOrder: 2 } });
    const t1 = await models.taskman.create({ data: { chapterId: chapFE1.id, title: "Thực hành: Build giao diện Profile Card", fileType: "PDF", url: "https://iviettech.vn/docs/task1.pdf", sortOrder: 3 } });

    const vBE1 = await models.video.create({ data: { chapterId: chapBE1.id, title: "Bài 1: Thiết kế RESTful API chuẩn", videoUrl: "https://www.youtube.com/watch?v=l8WPWK9mS5M", durationSeconds: 1800, provider: "YOUTUBE", sortOrder: 1 } });
    const tBE1 = await models.taskman.create({ data: { chapterId: chapBE1.id, title: "Lab: Xây dựng CRUD Users bằng Express + Prisma", fileType: "PDF", url: "https://iviettech.vn/docs/backend-crud-users.pdf", sortOrder: 2 } });

    const vDB1 = await models.video.create({ data: { chapterId: chapDB1.id, title: "Bài 1: Chuẩn hóa CSDL từ 1NF đến 3NF", videoUrl: "https://www.youtube.com/watch?v=UrYLYV7WSHM", durationSeconds: 1600, provider: "YOUTUBE", sortOrder: 1 } });
    const tDB1 = await models.taskman.create({ data: { chapterId: chapDB1.id, title: "Bài tập: Thiết kế ERD cho hệ thống LMS", fileType: "PDF", url: "https://iviettech.vn/docs/db-erd-lms.pdf", sortOrder: 2 } });

    const vQA1 = await models.video.create({ data: { chapterId: chapQA1.id, title: "Bài 1: Viết test API với Postman Collection", videoUrl: "https://www.youtube.com/watch?v=VywxIQ2ZXw4", durationSeconds: 1400, provider: "YOUTUBE", sortOrder: 1 } });
    const tQA1 = await models.taskman.create({ data: { chapterId: chapQA1.id, title: "Assignment: Tạo bộ test Login/Register API", fileType: "PDF", url: "https://iviettech.vn/docs/qa-api-login-register.pdf", sortOrder: 2 } });

    const vUI1 = await models.video.create({ data: { chapterId: chapUI1.id, title: "Bài 1: Xây dựng Design System cơ bản", videoUrl: "https://www.youtube.com/watch?v=c9Wg6Cb_YlU", durationSeconds: 1500, provider: "YOUTUBE", sortOrder: 1 } });
    const tUI1 = await models.taskman.create({ data: { chapterId: chapUI1.id, title: "Thực hành: Thiết kế Landing Page trong Figma", fileType: "PDF", url: "https://iviettech.vn/docs/uiux-landing-page-figma.pdf", sortOrder: 2 } });

    // ==========================================
    // 8. HỆ THỐNG ĐỀ THI ĐA CẤP (MULTI-SCOPE TESTS)
    // ==========================================
    
console.log("📝 Đang tạo Ngân hàng câu hỏi & Bài thi Đa cấp độ...");

const typeSingle = await models.questionType.create({ data: { name: "Trắc nghiệm một đáp án" } });
const typeEssay = await models.questionType.create({ data: { name: "Tự luận / Tải File" } });

// ✅ FIX QUESTION 1 (CHAPTER SCOPE)
const q1 = await models.question.create({
  data: {
    scope: "CHAPTER", // ✅ thêm
    chapterId: chapFE1.id, // ✅ thêm

    teacherId: teachers[0].id,
    typeId: typeSingle.id,

    content: "Hook nào dùng để call API ngay khi Component vừa mount?",
    explanation: "useEffect với dependency array rỗng [] sẽ chạy 1 lần sau khi render.",

    difficulty: "EASY", // ✅ thêm

    answers: {
      create: [
        { answerText: "useState", isCorrect: false, orderIndex: 1 },
        { answerText: "useEffect", isCorrect: true, orderIndex: 2 },
        { answerText: "useContext", isCorrect: false, orderIndex: 3 },
      ]
    }
  }
});

// ✅ FIX QUESTION 2 (SUBJECT SCOPE)
const q2 = await models.question.create({
  data: {
    scope: "SUBJECT", // ✅ thêm
    subjectId: subFrontend.id, // ✅ giữ

    teacherId: teachers[0].id,
    typeId: typeEssay.id,
    questionFormat: "ESSAY",

    content: "Hãy upload file nén (ZIP) chứa mã nguồn Mini Project Frontend của bạn.",

    difficulty: "HARD" // ✅ thêm
  }
});
    // 🏆 THI CẤP CHƯƠNG (QUIZ)
    const testChap1 = await models.test.create({
      data: {
        scope: "CHAPTER", chapterId: chapFE1.id, title: "Quiz củng cố Chương 1", testType: "QUIZ", durationMinutes: 15,
        testQuestions: { create: [{ questionId: q1.id, points: 10, sortOrder: 1 }] }
      }
    });

    // 🏆 THI CẤP MÔN HỌC (FINAL SUBJECT)
    const testSubject = await models.test.create({
      data: {
        scope: "SUBJECT", subjectId: subFrontend.id, title: "Bài thi Đồ án môn học Frontend", testType: "ESSAY", durationMinutes: 120,
        testQuestions: { create: [{ questionId: q2.id, points: 10, sortOrder: 1 }] }
      }
    });

    // ==========================================
    // 9. LỚP HỌC, GHI DANH & TIẾN ĐỘ HỌC TẬP
    // ==========================================
    const classFS = await models.classGroup.create({
      data: { subjectId: subFrontend.id, name: "Lớp Fullstack K45 - Tối 3-5-7", startDate: new Date("2026-06-05"), endDate: new Date("2026-12-05"), maxStudents: 35, roomLink: "https://zoom.us/j/123456789" }
    });

    const classBE = await models.classGroup.create({
      data: { subjectId: subBackend.id, name: "Lớp Backend K45 - Tối 2-4-6", startDate: new Date("2026-06-07"), endDate: new Date("2026-12-07"), maxStudents: 30, roomLink: "https://meet.google.com/backend-k45" }
    });

    const classDB = await models.classGroup.create({
      data: { subjectId: subDatabase.id, name: "Lớp Database K45 - Cuối tuần", startDate: new Date("2026-06-08"), endDate: new Date("2026-12-08"), maxStudents: 28, roomLink: "https://zoom.us/j/987654321" }
    });

    const classQA = await models.classGroup.create({
      data: { subjectId: subAutomation.id, name: "Lớp QA Automation K46 - Tối 3-5", startDate: new Date("2026-07-01"), endDate: new Date("2026-11-30"), maxStudents: 32, roomLink: "https://meet.google.com/qa-auto-k46" }
    });

    const classUIUX = await models.classGroup.create({
      data: { subjectId: subUixFoundation.id, name: "Lớp UIUX K20 - Tối 2-4", startDate: new Date("2026-07-03"), endDate: new Date("2026-10-30"), maxStudents: 25, roomLink: "https://zoom.us/j/uiuxk20" }
    });

    await models.classGroupUser.create({ data: { userId: specificStudent.id, classGroupId: classFS.id, role: "STUDENT" } });
    await models.classGroupUser.create({ data: { userId: students[0].id, classGroupId: classFS.id, role: "STUDENT" } });
    await models.classGroupUser.create({ data: { userId: students[1].id, classGroupId: classBE.id, role: "STUDENT" } });
    await models.classGroupUser.create({ data: { userId: students[2].id, classGroupId: classDB.id, role: "STUDENT" } });
    await models.classGroupUser.create({ data: { userId: students[3].id, classGroupId: classQA.id, role: "STUDENT" } });
    await models.classGroupUser.create({ data: { userId: students[4].id, classGroupId: classUIUX.id, role: "STUDENT" } });
    await models.classGroupUser.create({ data: { userId: students[5].id, classGroupId: classBE.id, role: "STUDENT" } });
    await models.classGroupUser.create({ data: { userId: students[6].id, classGroupId: classQA.id, role: "STUDENT" } });
    await models.classGroupUser.create({ data: { userId: students[7].id, classGroupId: classUIUX.id, role: "STUDENT" } });

    // Ghi danh toàn khóa
    const enrollCyleish = await models.courseEnrollment.create({ data: { userId: specificStudent.id, courseId: courseWeb.id, status: "ACTIVE", progress: 35.5 } });
    const enrollStu0 = await models.courseEnrollment.create({ data: { userId: students[0].id, courseId: courseWeb.id, status: "ACTIVE", progress: 90.0 } });
    const enrollStu1 = await models.courseEnrollment.create({ data: { userId: students[1].id, courseId: courseWeb.id, status: "ACTIVE", progress: 42.0 } });
    const enrollStu2 = await models.courseEnrollment.create({ data: { userId: students[2].id, courseId: courseWeb.id, status: "ACTIVE", progress: 66.5 } });
    const enrollStu3QA = await models.courseEnrollment.create({ data: { userId: students[3].id, courseId: courseQA.id, status: "ACTIVE", progress: 58.0 } });
    const enrollStu6QA = await models.courseEnrollment.create({ data: { userId: students[6].id, courseId: courseQA.id, status: "ACTIVE", progress: 21.5 } });
    const enrollStu4UIUX = await models.courseEnrollment.create({ data: { userId: students[4].id, courseId: courseUIUX.id, status: "ACTIVE", progress: 73.0 } });
    const enrollStu7UIUX = await models.courseEnrollment.create({ data: { userId: students[7].id, courseId: courseUIUX.id, status: "ACTIVE", progress: 44.0 } });

    // Log tiến độ xem Video
    await models.learningProgress.createMany({
      data: [
        { enrollmentId: enrollCyleish.id, studentId: specificStudent.id, videoId: v1.id, status: "COMPLETED", watchTimeSeconds: 1200, completedAt: new Date() },
        { enrollmentId: enrollCyleish.id, studentId: specificStudent.id, videoId: v2.id, status: "IN_PROGRESS", watchTimeSeconds: 500 },
        { enrollmentId: enrollStu0.id, studentId: students[0].id, videoId: v1.id, status: "COMPLETED", watchTimeSeconds: 1200, completedAt: new Date() },
        { enrollmentId: enrollStu1.id, studentId: students[1].id, videoId: vBE1.id, status: "IN_PROGRESS", watchTimeSeconds: 780 },
        { enrollmentId: enrollStu2.id, studentId: students[2].id, videoId: vDB1.id, status: "COMPLETED", watchTimeSeconds: 1600, completedAt: new Date() },
        { enrollmentId: enrollStu3QA.id, studentId: students[3].id, videoId: vQA1.id, status: "IN_PROGRESS", watchTimeSeconds: 630 },
        { enrollmentId: enrollStu6QA.id, studentId: students[6].id, videoId: vQA1.id, status: "NOT_STARTED", watchTimeSeconds: 0 },
        { enrollmentId: enrollStu4UIUX.id, studentId: students[4].id, videoId: vUI1.id, status: "COMPLETED", watchTimeSeconds: 1500, completedAt: new Date() },
        { enrollmentId: enrollStu7UIUX.id, studentId: students[7].id, videoId: vUI1.id, status: "IN_PROGRESS", watchTimeSeconds: 540 },
      ]
    });

    // ==========================================
    // 10. LỊCH HỌC, ĐIỂM DANH, CHẤM ĐIỂM & THANH TOÁN
    // ==========================================
    console.log("📈 Đang thiết lập Tương tác & Tài chính...");

    // Lịch học & Điểm danh
    const sched1 = await models.schedule.create({ data: { classGroupId: classFS.id, teacherId: teachers[0].id, title: "Buổi 1: Tổng quan ngành Web", startAt: new Date("2026-06-05T18:30:00Z"), endAt: new Date("2026-06-05T21:00:00Z"), dayOfWeek: 3 } });
    await models.attendance.create({ data: { scheduleId: sched1.id, studentId: specificStudent.id, status: "PRESENT" } });
    await models.attendance.create({ data: { scheduleId: sched1.id, studentId: students[0].id, status: "LATE", note: "Xe hỏng" } });

    // Nộp bài và chấm điểm
    const ansQ1 = await models.questionAnswer.findFirst({ where: { questionId: q1.id, isCorrect: true } });
    await models.submission.create({
      data: {
        testId: testChap1.id, studentId: specificStudent.id, classGroupId: classFS.id, score: 10, status: "GRADED", finalScoreStatus: "AUTO_GRADED",
        userAnswers: { create: [ { questionId: q1.id, answerId: ansQ1?.id, isCorrect: true } ]}
      }
    });

    // Sinh viên submit file tự luận chờ giáo viên chấm
    await models.submission.create({
      data: {
        testId: testSubject.id, studentId: specificStudent.id, classGroupId: classFS.id, status: "PENDING", finalScoreStatus: "MANUAL_PENDING",
        studentFileUrl: "https://aws.s3.com/bucket/cyleish_final_project.zip",
        userAnswers: { create: [ { questionId: q2.id, essayAnswer: "Em nộp đồ án web bán hàng ạ.", isCorrect: false } ]}
      }
    });

    // ✅ Thêm mới: Tạo Bảng điểm Môn học (SubjectGrade) cho sinh viên
    await models.subjectGrade.create({
      data: {
        subjectId: subFrontend.id,
        classGroupId: classFS.id,
        studentId: specificStudent.id,
        assignmentScore: 8.5,
        midtermScore: 9.0,
        finalScore: 9.5,
        totalScore: 9.0,
        status: "PUBLISHED",
        updatedById: teachers[0].id,
        publishedAt: new Date(),
      }
    });

    await models.subjectGrade.createMany({
      data: [
        {
          subjectId: subFrontend.id,
          classGroupId: classFS.id,
          studentId: students[0].id,
          assignmentScore: 9.0,
          midtermScore: 8.5,
          finalScore: 9.0,
          totalScore: 8.8,
          status: "PUBLISHED",
          updatedById: teachers[0].id,
          publishedAt: new Date(),
        },
        {
          subjectId: subBackend.id,
          classGroupId: classBE.id,
          studentId: students[1].id,
          assignmentScore: 7.5,
          midtermScore: 8.0,
          finalScore: 8.0,
          totalScore: 7.8,
          status: "PUBLISHED",
          updatedById: teachers[1].id,
          publishedAt: new Date(),
        },
        {
          subjectId: subDatabase.id,
          classGroupId: classDB.id,
          studentId: students[2].id,
          assignmentScore: 8.0,
          midtermScore: 8.5,
          finalScore: 8.0,
          totalScore: 8.2,
          status: "PUBLISHED",
          updatedById: teachers[1].id,
          publishedAt: new Date(),
        },
        {
          subjectId: subAutomation.id,
          classGroupId: classQA.id,
          studentId: students[3].id,
          assignmentScore: 8.5,
          midtermScore: 7.5,
          finalScore: 8.0,
          totalScore: 8.0,
          status: "PUBLISHED",
          updatedById: teachers[2].id,
          publishedAt: new Date(),
        },
        {
          subjectId: subUixFoundation.id,
          classGroupId: classUIUX.id,
          studentId: students[4].id,
          assignmentScore: 9.0,
          midtermScore: 8.5,
          finalScore: 9.0,
          totalScore: 8.8,
          status: "PUBLISHED",
          updatedById: teachers[2].id,
          publishedAt: new Date(),
        },
      ]
    });

    // Thanh toán
    await models.transaction.create({ data: { studentId: specificStudent.id, courseId: courseWeb.id, enrollmentId: enrollCyleish.id, amount: 6500000, paymentMethod: "VNPAY", status: "SUCCESS", referenceCode: `VNPAY_WEB_CYLEISH_99` } });

    // Review khóa học
    await models.courseReview.create({ data: { courseId: courseWeb.id, studentId: students[0].id, rating: 5, content: "Khóa học rất thực chiến, mentor support nhiệt tình!" } });
    
    // Diễn đàn
    const forum = await models.forum.create({ data: { subjectId: subFrontend.id, title: "Góc hỏi đáp ReactJS K45" } });
    const post1 = await models.forumPost.create({ data: { forumId: forum.id, userId: specificStudent.id, content: "Làm sao để deploy project lên Vercel ạ?" } });
    await models.forumPost.create({ data: { forumId: forum.id, userId: teachers[0].id, parentId: post1.id, content: "Em xem lại video bài số 12 thầy có hướng dẫn nhé!" } });

    console.log("🎉 SEED DỮ LIỆU HOÀN TẤT! HỆ THỐNG ĐÃ SẴN SÀNG ĐỂ DEMO.");

  } catch (error) {
    console.error("❌ Lỗi khi seed dữ liệu:", error);
    process.exit(1);
  } finally {
    await models.$disconnect();
  }
}

seed();