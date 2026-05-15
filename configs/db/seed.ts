import models, { PasswordType, UserStatus } from "@models";
import * as bcrypt from "bcrypt";

async function seed() {
  try {
    console.log("🚀 BẮT ĐẦU QUÁ TRÌNH SEED DỮ LIỆU...");

    // ==========================================
    // 1. DỌN DẸP DỮ LIỆU CŨ (Thứ tự rất quan trọng vì khóa ngoại)
    // ==========================================
    console.log("🧹 Đang dọn dẹp dữ liệu cũ (Cascading)...");
    
    await models.certificate.deleteMany({});      // ✅ NEW
    await models.courseRule.deleteMany({});       // ✅ NEW
    await models.attendance.deleteMany({});
    await models.userQuestionAnswer.deleteMany({});
    await models.submission.deleteMany({});
    await models.testQuestion.deleteMany({});
    await models.test.deleteMany({});
    await models.learningProgress.deleteMany({}); // Đã cập nhật Schema
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
    await models.courseEnrollment.deleteMany({}); // ✅ NEW
    
    await models.subjectTeacher.deleteMany({}); 
    await models.subject.deleteMany({});
    
    await models.courseReview.deleteMany({});
    await models.transaction.deleteMany({});
    await models.course.deleteMany({}); 
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
      models.permission.create({ data: { code: "AM::CREATE", name: "Tạo dữ liệu hệ thống", featureId: featAM.id } }),
      models.permission.create({ data: { code: "AM::UPDATE", name: "Cập nhật hệ thống", featureId: featAM.id } }),
      models.permission.create({ data: { code: "AM::DELETE", name: "Xóa dữ liệu hệ thống", featureId: featAM.id } }),
    ]);
    
    const featUM = await models.feature.create({ data: { code: "UM", name: "Quản lý Người dùng", type: "FEATURE", parentId: featAM.id } });
    const permsUM = await Promise.all([
      models.permission.create({ data: { code: "UM::READ", name: "Xem User", featureId: featUM.id } }),
      models.permission.create({ data: { code: "UM::CREATE", name: "Tạo User", featureId: featUM.id } }),
      models.permission.create({ data: { code: "UM::UPDATE", name: "Sửa User", featureId: featUM.id } }),
      models.permission.create({ data: { code: "UM::DELETE", name: "Xóa User", featureId: featUM.id } }),
    ]);

    const featCourse = await models.feature.create({ data: { code: "FEAT_COURSE", name: "Quản lý Khóa học", type: "MENU_GROUP" } });
    const permCourseView = await models.permission.create({ data: { code: "COURSE_VIEW", name: "Xem Khóa học", featureId: featCourse.id } });
    const permCourseEdit = await models.permission.create({ data: { code: "COURSE_EDIT", name: "Thêm/Sửa/Xóa Khóa học", featureId: featCourse.id } });

    await models.roleToPermission.createMany({
      data: [
        ...permsAM.map(p => ({ roleId: roleAdmin.id, permissionId: p.id })),
        ...permsUM.map(p => ({ roleId: roleAdmin.id, permissionId: p.id })),
        { roleId: roleAdmin.id, permissionId: permCourseView.id },
        { roleId: roleAdmin.id, permissionId: permCourseEdit.id },
        { roleId: roleTeacher.id, permissionId: permCourseView.id },
        { roleId: roleTeacher.id, permissionId: permCourseEdit.id },
        { roleId: roleStudent.id, permissionId: permCourseView.id },
      ]
    });

    // ==========================================
    // 3. TẠO TÀI KHOẢN
    // ==========================================
    console.log("👥 Đang tạo tài khoản...");
    const hashedPassword = await bcrypt.hash("123456", 10);

    const admin = await models.user.create({
      data: {
        firstName: "Phong", lastName: "Nguyễn", email: "admin@iviettech.vn", status: UserStatus.ACTIVE, gender: "MALE",
        passwords: { create: { password: hashedPassword, type: PasswordType.PASSWORD } },
        roles: { create: { roleId: roleAdmin.id } }, wallet: { create: { balance: 0 } }
      }
    });
    
    const userPhong = await models.user.create({
      data: {
        firstName: "Phong", lastName: "Nguyễn", email: "phongnvpd10379@gmail.com", status: UserStatus.ACTIVE, gender: "MALE", phoneNumber: "0909999999",
        passwords: { create: { password: hashedPassword, type: PasswordType.PASSWORD } },
        roles: { create: { roleId: roleTeacher.id } }, wallet: { create: { balance: 1000000 } }
      }
    });

    const teachers = await Promise.all([
      models.user.create({ data: { firstName: "Tuấn", lastName: "Lê", email: "tuan.le@iviettech.vn", status: UserStatus.ACTIVE, gender: "MALE", passwords: { create: { password: hashedPassword, type: PasswordType.PASSWORD } }, roles: { create: { roleId: roleTeacher.id } }, wallet: { create: { balance: 15000000 } } } }),
      models.user.create({ data: { firstName: "Hương", lastName: "Trần", email: "huong.tran@iviettech.vn", status: UserStatus.ACTIVE, gender: "FEMALE", passwords: { create: { password: hashedPassword, type: PasswordType.PASSWORD } }, roles: { create: { roleId: roleTeacher.id } }, wallet: { create: { balance: 12000000 } } } }),
    ]);

    const ta = await models.user.create({ data: { firstName: "Bảo", lastName: "Phạm", email: "bao.pham@iviettech.vn", status: UserStatus.ACTIVE, gender: "MALE", passwords: { create: { password: hashedPassword, type: PasswordType.PASSWORD } }, roles: { create: { roleId: roleTA.id } } } });

    const specificStudent = await models.user.create({
      data: {
        firstName: "Cyleish", lastName: "Student", email: "phongnguyenatx2707@gmail.com", status: UserStatus.ACTIVE, phoneNumber: "0988888888",
        passwords: { create: { password: hashedPassword, type: PasswordType.PASSWORD } }, 
        roles: { create: { roleId: roleStudent.id } }, 
        wallet: { create: { balance: 5000000 } }
      }
    });

    const studentNames = [
      { f: "An", l: "Nguyễn" }, { f: "Bình", l: "Trần" }, { f: "Chi", l: "Lê" }, { f: "Duy", l: "Phạm" }, 
      { f: "Hải", l: "Hoàng" }, { f: "Linh", l: "Vũ" }, { f: "Mai", l: "Đặng" }, { f: "Nam", l: "Bùi" },
      { f: "Oanh", l: "Đỗ" }, { f: "Phúc", l: "Hồ" }, { f: "Quân", l: "Trịnh" }, { f: "Sang", l: "Đoàn" }
    ];

    const students = await Promise.all(studentNames.map((n, i) => 
      models.user.create({
        data: {
          firstName: n.f, lastName: n.l, email: `student${i+1}@gmail.com`, status: UserStatus.ACTIVE, phoneNumber: `09000000${i.toString().padStart(2, '0')}`,
          passwords: { create: { password: hashedPassword, type: PasswordType.PASSWORD } }, roles: { create: { roleId: roleStudent.id } }, wallet: { create: { balance: 5000000 } }
        }
      })
    ));

    // ==========================================
    // 4. TẠO KHÓA HỌC, MÔN HỌC & RULES
    // ==========================================
    console.log("📚 Đang tạo Khóa học, Rules & Chương học...");

    const courseWeb = await models.course.create({
      data: {
        title: "Fullstack Web Development (React & Node.js)", 
        description: "Trở thành lập trình viên Fullstack thực chiến với ReactJS, Next.js, Node.js, Express và Prisma ORM.",
        price: 4500000, discountPrice: 3900000, startDate: new Date("2026-06-01"), durationValue: 6, durationUnit: "MONTH", daysOfWeek: "T2, T4, T6",
        level: "BEGINNER", maxStudents: 100, isFeatured: true, isSequential: true, status: "PUBLISHED", adminId: admin.id, // ✅ NEW isSequential
        thumbnailUrl: "https://placehold.co/800x400/2563eb/white?text=Fullstack+Web",
      }
    });

    // ✅ NEW: Course Rules (Luật khóa học)
    await models.courseRule.createMany({
      data: [
        { courseId: courseWeb.id, ruleCode: 'MIN_TEST_SCORE', ruleValue: '80', description: 'Điểm số bài thi tối thiểu để qua môn' },
        { courseId: courseWeb.id, ruleCode: 'MAX_ABSENCE', ruleValue: '3', description: 'Số buổi vắng tối đa cho phép' }
      ]
    });

    const courseQA = await models.course.create({
      data: {
        title: "Software Testing & QA (ISTQB Foundation)", 
        description: "Khóa học Tester toàn diện từ Manual đến Automation Testing.",
        price: 3200000, status: "PUBLISHED", adminId: admin.id,
        thumbnailUrl: "https://placehold.co/800x400/16a34a/white?text=Software+Testing",
      }
    });

    const subReact = await models.subject.create({
      data: { 
        courseId: courseWeb.id, name: "Frontend với ReactJS & TypeScript", sortOrder: 1,
        teachers: { create: { teacherId: teachers[0].id, type: "MAIN" } }
      }
    });

    // ✅ NEW: TẠO CHƯƠNG HỌC (CHAPTERS) CÓ TÍNH TUẦN TỰ
    const chapReact1 = await models.chapter.create({ 
      data: { subjectId: subReact.id, title: "Chương 1: Nền tảng React & Component", sortOrder: 1 } 
    });
    
    const chapReact2 = await models.chapter.create({ 
      data: { 
        subjectId: subReact.id, title: "Chương 2: Hooks & Quản lý State", sortOrder: 2,
        prerequisiteId: chapReact1.id, isLocked: true // ✅ NEW: Khóa chương 2, phải học xong chương 1
      } 
    });

    // ==========================================
    // 5. TẠO LỚP HỌC & ENROLLMENT (COURSE ENROLLMENT)
    // ==========================================
    const classFS1 = await models.classGroup.create({ 
      data: { 
        subjectId: subReact.id, name: "FS-K40-Online", startDate: new Date("2026-06-05"), endDate: new Date("2026-12-05"),
        maxStudents: 30, roomLink: "https://meet.google.com/react-class"
      } 
    });

    // Enroll vào Class (Dành cho học Live)
    await models.classGroupUser.createMany({ data: [
      { userId: students[0].id, classGroupId: classFS1.id, role: "STUDENT" },
      { userId: specificStudent.id, classGroupId: classFS1.id, role: "STUDENT" }
    ]});

    // ✅ NEW: ENROLL VÀO COURSE TỔNG (Dành cho track Learning Progress)
    const enrollment0 = await models.courseEnrollment.create({
      data: { userId: students[0].id, courseId: courseWeb.id, status: "ACTIVE", progress: 50.0 }
    });
    
    const enrollmentCyleish = await models.courseEnrollment.create({
      data: { userId: specificStudent.id, courseId: courseWeb.id, status: "ACTIVE", progress: 15.5 }
    });

    // ==========================================
    // 6. NỘI DUNG BÀI GIẢNG (VIDEOS & TASKS)
    // ==========================================
    console.log("🎥 Đang tạo Bài giảng và Bài tập...");

    const v1 = await models.video.create({ data: { chapterId: chapReact1.id, title: "1. Giới thiệu React & Setup môi trường Vite", videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", durationSeconds: 1500, provider: "YOUTUBE", sortOrder: 1 } });
    const v2 = await models.video.create({ data: { chapterId: chapReact1.id, title: "2. Phân tích JSX và Components", videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", durationSeconds: 2100, provider: "YOUTUBE", sortOrder: 2 } });
    const v3 = await models.video.create({ data: { chapterId: chapReact2.id, title: "3. Quản lý State với useState & useEffect", videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", durationSeconds: 2800, provider: "YOUTUBE", sortOrder: 1 } });

    // ==========================================
    // 7. HỆ THỐNG THI CỬ (QUIZZES & EXAMS)
    // ==========================================
    console.log("📝 Đang tạo Ngân hàng câu hỏi và Đề thi...");
    const typeSingle = await models.questionType.create({ data: { name: "Single Choice" } });

    const q1 = await models.question.create({
      data: {
        subjectId: subReact.id, teacherId: teachers[0].id, typeId: typeSingle.id, content: "Virtual DOM trong React hoạt động như thế nào?", explanation: "Virtual DOM tạo ra một bản sao của DOM thật...",
        answers: { create: [
          { answerText: "Nó cập nhật lại toàn bộ cây DOM mỗi khi có thay đổi state", isCorrect: false, orderIndex: 1 },
          { answerText: "Nó dùng thuật toán Diffing để so sánh...", isCorrect: true, orderIndex: 2 }
        ]}
      }
    });

    const testReact = await models.test.create({
      data: {
        chapterId: chapReact1.id, title: "Quiz 1: Kiến thức nền tảng React", testType: "QUIZ", durationMinutes: 15,
        testQuestions: { create: [{ questionId: q1.id, points: 10, sortOrder: 1 }] }
      }
    });

    // ==========================================
    // 8. TẠO BÀI NỘP, TIẾN ĐỘ, TÀI CHÍNH & CHỨNG CHỈ
    // ==========================================
    console.log("📈 Đang ghi nhận kết quả học tập & Thanh toán...");

    // ✅ CẬP NHẬT: Learning Progress giờ có enrollmentId và lưu được trạng thái xem dở
    await models.learningProgress.createMany({
      data: [
        // Student 0 đã xem xong V1 và V2
        { enrollmentId: enrollment0.id, studentId: students[0].id, videoId: v1.id, status: "COMPLETED", watchTimeSeconds: 1500, completedAt: new Date() },
        { enrollmentId: enrollment0.id, studentId: students[0].id, videoId: v2.id, status: "COMPLETED", watchTimeSeconds: 2100, completedAt: new Date() },
        // Cyleish đang xem dở V1 ở giây thứ 600
        { enrollmentId: enrollmentCyleish.id, studentId: specificStudent.id, videoId: v1.id, status: "IN_PROGRESS", watchTimeSeconds: 600, lastAccessedAt: new Date() }
      ]
    });
    
    // ✅ NEW: Cấp 1 chứng chỉ demo cho Student 0 (Giả sử hoàn thành khóa QA)
    await models.certificate.create({
      data: {
        userId: students[0].id,
        courseId: courseQA.id,
        certificateUrl: "https://iviettech.vn/certs/QA-2026-STU01.pdf",
        referenceCode: "CERT-QA-2026-STU01"
      }
    });

    const ansQ1 = await models.questionAnswer.findFirst({ where: { questionId: q1.id, isCorrect: true } });
    await models.submission.create({
      data: {
        testId: testReact.id, studentId: students[0].id, classGroupId: classFS1.id, score: 10, status: "GRADED", finalScoreStatus: "AUTO_GRADED",
        userAnswers: { create: [ { questionId: q1.id, answerId: ansQ1?.id, isCorrect: true } ]}
      }
    });

    // Giao dịch cho cyleish2108
    await models.transaction.create({ data: { studentId: specificStudent.id, courseId: courseWeb.id, amount: 3900000, paymentMethod: "VNPAY", status: "SUCCESS", referenceCode: `VNPAY_WEB_CYLEISH` } });

    // ==========================================
    // 9. FORUM, LỊCH HỌC & ĐIỂM DANH
    // ==========================================
    console.log("💬 Đang tạo Lịch học, Điểm danh & Diễn đàn...");

    const schedule1 = await models.schedule.create({
      data: { classGroupId: classFS1.id, teacherId: teachers[0].id, title: "Buổi 1: Khai giảng", startAt: new Date("2026-05-01T19:00:00Z"), endAt: new Date("2026-05-01T21:30:00Z"), dayOfWeek: 5, roomLink: "https://meet.google.com/iviettech" }
    });

    await models.attendance.createMany({
      data: [
        { scheduleId: schedule1.id, studentId: students[0].id, status: "PRESENT", note: "Học rất năng nổ" },
        { scheduleId: schedule1.id, studentId: specificStudent.id, status: "PRESENT" },
      ]
    });

    const forum = await models.forum.create({ data: { subjectId: subReact.id, title: "Hỏi đáp Frontend - K40" } });
    await models.forumPost.create({ data: { forumId: forum.id, userId: students[0].id, content: "Thầy ơi cho em hỏi làm sao để fix lỗi Hydration Error trong NextJS ạ?" } });

    await models.notification.createMany({
      data: [
        { userId: students[0].id, content: "Bài kiểm tra Quiz 1 của bạn đã có điểm: 10/10", isRead: false },
        { userId: specificStudent.id, content: "Chào mừng bạn đến với khóa học Fullstack Web Development!", isRead: false }
      ]
    });
    
    console.log("🎉 SEED DỮ LIỆU HOÀN TẤT! HỆ THỐNG ĐÃ SẴN SÀNG ĐỂ DEMO.");

  } catch (error) {
    console.error("❌ Lỗi khi seed dữ liệu:", error);
    process.exit(1);
  } finally {
    await models.$disconnect();
  }
}

seed();