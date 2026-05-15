import models, { PasswordType, UserStatus } from "@models";
import * as bcrypt from "bcrypt";

async function seed() {
  try {
    console.log("🚀 BẮT ĐẦU QUÁ TRÌNH SEED DỮ LIỆU...");

    // ==========================================
    // 1. DỌN DẸP DỮ LIỆU CŨ (Thứ tự rất quan trọng vì khóa ngoại)
    // ==========================================
    console.log("🧹 Đang dọn dẹp dữ liệu cũ (Cascading)...");
    
    await models.attendance.deleteMany({}); // ✅ NEW: Xóa điểm danh
    await models.userQuestionAnswer.deleteMany({});
    await models.submission.deleteMany({});
    await models.testQuestion.deleteMany({});
    await models.test.deleteMany({});
    await models.learningProgress.deleteMany({});
    await models.video.deleteMany({});
    await models.taskman.deleteMany({});
    await models.chapter.deleteMany({}); // ✅ NEW: Xóa chương học
    await models.questionAnswer.deleteMany({});
    await models.question.deleteMany({});
    await models.questionType.deleteMany({});
    await models.forumPost.deleteMany({});
    await models.forum.deleteMany({});
    await models.schedule.deleteMany({});
    await models.classGroupUser.deleteMany({});
    await models.classGroup.deleteMany({});
    
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

    // Feature Admin Management
    const featAM = await models.feature.create({ data: { code: "AM", name: "Quản trị Hệ thống", type: "SYSTEM" } });
    const permsAM = await Promise.all([
      models.permission.create({ data: { code: "AM::READ", name: "Xem hệ thống", featureId: featAM.id } }),
      models.permission.create({ data: { code: "AM::CREATE", name: "Tạo dữ liệu hệ thống", featureId: featAM.id } }),
      models.permission.create({ data: { code: "AM::UPDATE", name: "Cập nhật hệ thống", featureId: featAM.id } }),
      models.permission.create({ data: { code: "AM::DELETE", name: "Xóa dữ liệu hệ thống", featureId: featAM.id } }),
    ]);
    
    // Feature User Management
    const featUM = await models.feature.create({ data: { code: "UM", name: "Quản lý Người dùng", type: "FEATURE", parentId: featAM.id } });
    const permsUM = await Promise.all([
      models.permission.create({ data: { code: "UM::READ", name: "Xem User", featureId: featUM.id } }),
      models.permission.create({ data: { code: "UM::CREATE", name: "Tạo User", featureId: featUM.id } }),
      models.permission.create({ data: { code: "UM::UPDATE", name: "Sửa User", featureId: featUM.id } }),
      models.permission.create({ data: { code: "UM::DELETE", name: "Xóa User", featureId: featUM.id } }),
    ]);

    // Feature Khóa học
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
    // 4. TẠO KHÓA HỌC & MÔN HỌC (Có thêm field thực tế)
    // ==========================================
    console.log("📚 Đang tạo Khóa học & Cấu trúc Chương học...");

    const courseWeb = await models.course.create({
      data: {
        title: "Fullstack Web Development (React & Node.js)", 
        description: "Trở thành lập trình viên Fullstack thực chiến với ReactJS, Next.js, Node.js, Express và Prisma ORM.",
        price: 4500000, 
        discountPrice: 3900000,         // ✅ NEW
        startDate: new Date("2026-06-01"), // ✅ NEW
        durationValue: 6,               // ✅ NEW
        durationUnit: "MONTH",          // ✅ NEW
        daysOfWeek: "T2, T4, T6",       // ✅ NEW
        level: "BEGINNER",              // ✅ NEW
        maxStudents: 100,               // ✅ NEW
        isFeatured: true,               // ✅ NEW
        status: "PUBLISHED", 
        adminId: admin.id,
        thumbnailUrl: "https://placehold.co/800x400/2563eb/white?text=Fullstack+Web",
      }
    });

    const courseQA = await models.course.create({
      data: {
        title: "Software Testing & QA (ISTQB Foundation)", 
        description: "Khóa học Tester toàn diện từ Manual đến Automation Testing (Selenium/Cypress).",
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

    const subNode = await models.subject.create({
      data: { 
        courseId: courseWeb.id, name: "Backend với Node.js & Express", sortOrder: 2,
        teachers: { create: { teacherId: ta.id, type: "TA" } } // Chú ý: Đổi ASSISTANT thành TA theo enum
      }
    });

    const subISTQB = await models.subject.create({
      data: { 
        courseId: courseQA.id, name: "Nền tảng kiểm thử (ISTQB)", sortOrder: 1,
        teachers: { create: { teacherId: teachers[1].id, type: "MAIN" } }
      }
    });

    // ✅ NEW: TẠO CHƯƠNG HỌC (CHAPTERS)
    const chapReact1 = await models.chapter.create({ data: { subjectId: subReact.id, title: "Chương 1: Nền tảng React & Component", sortOrder: 1 } });
    const chapReact2 = await models.chapter.create({ data: { subjectId: subReact.id, title: "Chương 2: Hooks & Quản lý State", sortOrder: 2 } });
    const chapNode1 = await models.chapter.create({ data: { subjectId: subNode.id, title: "Chương 1: ExpressJS Cơ bản", sortOrder: 1 } });
    const chapQA1 = await models.chapter.create({ data: { subjectId: subISTQB.id, title: "Chương 1: 7 Nguyên lý Kiểm thử", sortOrder: 1 } });

    // ==========================================
    // 5. TẠO LỚP HỌC (CLASS GROUPS) & ENROLLMENT
    // ==========================================
    const classFS1 = await models.classGroup.create({ 
      data: { 
        subjectId: subReact.id, name: "FS-K40-Online", 
        startDate: new Date("2026-06-05"), endDate: new Date("2026-12-05"), // ✅ NEW
        maxStudents: 30, roomLink: "https://meet.google.com/react-class"   // ✅ NEW
      } 
    });
    const classFS2 = await models.classGroup.create({ data: { subjectId: subNode.id, name: "FS-K40-Online", maxStudents: 30 } });
    const classQA1 = await models.classGroup.create({ data: { subjectId: subISTQB.id, name: "QA-K22-Offline", maxStudents: 20 } });

    await Promise.all(students.slice(0, 8).map((s: { id: string; }) => models.classGroupUser.createMany({ data: [
      { userId: s.id, classGroupId: classFS1.id, role: "STUDENT" },
      { userId: s.id, classGroupId: classFS2.id, role: "STUDENT" }
    ]})));
    await Promise.all(students.slice(8, 12).map((s: { id: string; }) => models.classGroupUser.create({ data: { userId: s.id, classGroupId: classQA1.id, role: "STUDENT" } })));

    // Enroll for cyleish
    await models.classGroupUser.createMany({ data: [
      { userId: specificStudent.id, classGroupId: classFS1.id, role: "STUDENT" },
      { userId: specificStudent.id, classGroupId: classFS2.id, role: "STUDENT" }
    ]});

    // ==========================================
    // 6. NỘI DUNG BÀI GIẢNG (VIDEOS & TASKS) - Liên kết với Chapter
    // ==========================================
    console.log("🎥 Đang tạo Bài giảng và Bài tập...");

    // ✅ SỬA: Đổi subjectId thành chapterId
    const v1 = await models.video.create({ data: { chapterId: chapReact1.id, title: "1. Giới thiệu React & Setup môi trường Vite", videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", durationSeconds: 1500, provider: "YOUTUBE", sortOrder: 1 } });
    const v2 = await models.video.create({ data: { chapterId: chapReact1.id, title: "2. Phân tích JSX và Components", videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", durationSeconds: 2100, provider: "YOUTUBE", sortOrder: 2 } });
    const v3 = await models.video.create({ data: { chapterId: chapReact2.id, title: "3. Quản lý State với useState & useEffect", videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", durationSeconds: 2800, provider: "YOUTUBE", sortOrder: 1 } });
    const v4 = await models.video.create({ data: { chapterId: chapQA1.id, title: "1. 7 Nguyên lý kiểm thử phần mềm", videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", durationSeconds: 1800, provider: "YOUTUBE", sortOrder: 1 } });

    const task1 = await models.taskman.create({ data: { chapterId: chapReact1.id, title: "Bài tập 1: Xây dựng Layout CV cá nhân", fileType: "PDF", url: "https://drive.google.com/...", sortOrder: 3 } });
    const task2 = await models.taskman.create({ data: { chapterId: chapNode1.id, title: "Bài tập 1: Viết API CRUD với Express", fileType: "PDF", url: "https://drive.google.com/...", sortOrder: 1 } });

    // ==========================================
    // 7. HỆ THỐNG THI CỬ (QUIZZES & EXAMS)
    // ==========================================
    console.log("📝 Đang tạo Ngân hàng câu hỏi và Đề thi...");
    const typeSingle = await models.questionType.create({ data: { name: "Single Choice" } });

    // Question vẫn nằm ở Subject (Ngân hàng câu hỏi chung cho cả môn)
    const q1 = await models.question.create({
      data: {
        subjectId: subReact.id, teacherId: teachers[0].id, typeId: typeSingle.id, content: "Virtual DOM trong React hoạt động như thế nào?", explanation: "Virtual DOM tạo ra một bản sao của DOM thật, so sánh sự thay đổi (diffing) và chỉ cập nhật những node cần thiết.",
        answers: { create: [
          { answerText: "Nó cập nhật lại toàn bộ cây DOM mỗi khi có thay đổi state", isCorrect: false, orderIndex: 1 },
          { answerText: "Nó dùng thuật toán Diffing để so sánh và chỉ cập nhật các Node bị thay đổi", isCorrect: true, orderIndex: 2 },
          { answerText: "Nó là một cơ sở dữ liệu ảo để lưu trữ state", isCorrect: false, orderIndex: 3 }
        ]}
      }
    });

    const q2 = await models.question.create({
      data: {
        subjectId: subReact.id, teacherId: teachers[0].id, typeId: typeSingle.id, content: "Hook nào dùng để gọi API (Side effects) khi component được mount?",
        answers: { create: [
          { answerText: "useState", isCorrect: false, orderIndex: 1 },
          { answerText: "useEffect", isCorrect: true, orderIndex: 2 },
          { answerText: "useReducer", isCorrect: false, orderIndex: 3 }
        ]}
      }
    });

    // ✅ SỬA: Bài Test giờ nằm ở Chapter (Thi hết chương)
    const testReact = await models.test.create({
      data: {
        chapterId: chapReact1.id, title: "Quiz 1: Kiến thức nền tảng React", testType: "QUIZ", durationMinutes: 15, maxAttempts: 3,
        testQuestions: { create: [{ questionId: q1.id, points: 5, sortOrder: 1 }, { questionId: q2.id, points: 5, sortOrder: 2 }] }
      }
    });

    // ==========================================
    // 8. TẠO BÀI NỘP, TIẾN ĐỘ & TÀI CHÍNH
    // ==========================================
    console.log("📈 Đang ghi nhận kết quả học tập & Thanh toán...");

    await models.learningProgress.createMany({
      data: [
        { studentId: students[0].id, videoId: v1.id, status: "COMPLETED", completedAt: new Date() },
        { studentId: students[0].id, videoId: v2.id, status: "COMPLETED", completedAt: new Date() },
        { studentId: specificStudent.id, videoId: v1.id, status: "COMPLETED", completedAt: new Date() }
      ]
    });

    const ansQ1 = await models.questionAnswer.findFirst({ where: { questionId: q1.id, isCorrect: true } });
    const ansQ2 = await models.questionAnswer.findFirst({ where: { questionId: q2.id, isCorrect: false } });
    
    await models.submission.create({
      data: {
        testId: testReact.id, studentId: students[0].id, classGroupId: classFS1.id, score: 5, status: "GRADED", finalScoreStatus: "AUTO_GRADED",
        teacherFeedback: "Em làm rất tốt, tuy nhiên cần ôn lại kỹ phần Component Lifecycle nhé!", // ✅ NEW
        studentFileUrl: "https://docs.google.com/document/d/...", // ✅ NEW (Minh họa nộp file)
        userAnswers: { create: [
          { questionId: q1.id, answerId: ansQ1?.id, isCorrect: true },
          { questionId: q2.id, answerId: ansQ2?.id, isCorrect: false }
        ]}
      }
    });

    // Payment transactions
    await Promise.all(students.slice(0, 5).map((s: { id: string; }, i: number) => 
      models.transaction.create({ data: { studentId: s.id, courseId: courseWeb.id, amount: 4500000, paymentMethod: "VNPAY", status: "SUCCESS", referenceCode: `VNPAY_WEB_${i}` } })
    ));
    await Promise.all(students.slice(8, 10).map((s: { id: string; }, i: number) => 
      models.transaction.create({ data: { studentId: s.id, courseId: courseQA.id, amount: 3200000, paymentMethod: "MOMO", status: "SUCCESS", referenceCode: `MOMO_QA_${i}` } })
    ));
    
    await models.transaction.create({ data: { studentId: specificStudent.id, courseId: courseWeb.id, amount: 4500000, paymentMethod: "VNPAY", status: "SUCCESS", referenceCode: `VNPAY_WEB_CYLEISH` } });

    // ==========================================
    // 9. FORUM, CHAT, LỊCH HỌC & ĐIỂM DANH
    // ==========================================
    console.log("💬 Đang tạo Lịch học, Điểm danh, Diễn đàn & Đánh giá...");

    const schedule1 = await models.schedule.create({
      data: {
        classGroupId: classFS1.id, teacherId: teachers[0].id, title: "Buổi 1: Khai giảng & Cài đặt môi trường",
        startAt: new Date("2026-05-01T19:00:00Z"), endAt: new Date("2026-05-01T21:30:00Z"), dayOfWeek: 5, roomLink: "https://meet.google.com/iviettech"
      }
    });

    // ✅ NEW: Điểm danh sinh viên cho Buổi học 1
    await models.attendance.createMany({
      data: [
        { scheduleId: schedule1.id, studentId: students[0].id, status: "PRESENT", note: "Học rất năng nổ" },
        { scheduleId: schedule1.id, studentId: students[1].id, status: "LATE", note: "Vào muộn 15p" },
        { scheduleId: schedule1.id, studentId: specificStudent.id, status: "PRESENT" },
      ]
    });

    const forum = await models.forum.create({ data: { subjectId: subReact.id, title: "Hỏi đáp Frontend - K40" } });
    const post1 = await models.forumPost.create({ data: { forumId: forum.id, userId: students[0].id, content: "Thầy ơi cho em hỏi làm sao để fix lỗi Hydration Error trong NextJS ạ?" } });
    await models.forumPost.create({ data: { forumId: forum.id, userId: teachers[0].id, parentId: post1.id, content: "Chào em, lỗi này thường do cấu trúc HTML render ở Server khác với Client. Em check lại các thẻ div lồng trong thẻ p nhé." } });

    await models.message.create({ data: { senderId: specificStudent.id, receiverId: ta.id, content: "Anh Bảo ơi, cho em xin lại tài liệu buổi 1 nhé.", isRead: false } });
    
    await models.notification.createMany({
      data: [
        { userId: students[0].id, content: "Bài kiểm tra Quiz 1 của bạn đã có điểm: 5/10", isRead: false },
        { userId: specificStudent.id, content: "Chào mừng bạn đến với khóa học Fullstack Web Development!", isRead: false }
      ]
    });

    await models.courseReview.createMany({
      data: [
        { courseId: courseWeb.id, studentId: students[0].id, rating: 5, content: "Khóa học cực kỳ thực chiến, giáo viên nhiệt tình!" },
        { courseId: courseWeb.id, studentId: specificStudent.id, rating: 5, content: "Rất phù hợp cho người mới bắt đầu!" }
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