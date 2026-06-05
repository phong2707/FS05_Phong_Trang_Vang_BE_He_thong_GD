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
    await models.subjectGrade.deleteMany({});
    await models.userQuestionAnswer.deleteMany({});
    await models.submission.deleteMany({});
    await models.testQuestion.deleteMany({});
    await models.learningProgress.deleteMany({});

    // Dọn dẹp các bảng phiên làm bài/lưu nháp (do TestService sinh ra) nếu có
    if ("examSession" in models)
      await (models as any).examSession.deleteMany({});
    if ("testSession" in models)
      await (models as any).testSession.deleteMany({});
    if ("examSnapshot" in models)
      await (models as any).examSnapshot.deleteMany({});
    if ("testSnapshot" in models)
      await (models as any).testSnapshot.deleteMany({});

    await models.test.deleteMany({});
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
    await models.course.deleteMany({});
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
    // 2. TẠO ROLES & FEATURES (✅ FIX LỖI 403 - CẤP FULL QUYỀN ADMIN)
    // ==========================================
    console.log("🛡️ Đang khởi tạo RBAC...");

    const roleAdmin = await models.role.create({
      data: {
        code: "ADMIN",
        name: "Quản trị viên",
        description: "Toàn quyền quản trị hệ thống",
      },
    });
    const roleTeacher = await models.role.create({
      data: {
        code: "TEACHER",
        name: "Giáo viên",
        description: "Quản lý khóa học, chấm điểm",
      },
    });
    const roleTA = await models.role.create({
      data: {
        code: "TA",
        name: "Trợ giảng",
        description: "Hỗ trợ học tập, trả lời forum",
      },
    });
    const roleStudent = await models.role.create({
      data: {
        code: "STUDENT",
        name: "Học viên",
        description: "Người dùng học tập",
      },
    });

    // ✅ Bổ sung Feature UM (Quản lý User) và cấp Full CRUD
    const featUM = await models.feature.create({
      data: { code: "UM", name: "Quản trị Người dùng", type: "SYSTEM" },
    });
    const permsUM = await Promise.all([
      models.permission.create({
        data: { code: "UM::READ", name: "Xem User", featureId: featUM.id },
      }),
      models.permission.create({
        data: { code: "UM::CREATE", name: "Tạo User", featureId: featUM.id },
      }),
      models.permission.create({
        data: { code: "UM::UPDATE", name: "Sửa User", featureId: featUM.id },
      }),
      models.permission.create({
        data: { code: "UM::DELETE", name: "Xóa User", featureId: featUM.id },
      }),
    ]);

    // ✅ Thêm đủ quyền UPDATE, DELETE cho AM
    const featAM = await models.feature.create({
      data: { code: "AM", name: "Quản trị Hệ thống", type: "SYSTEM" },
    });
    const permsAM = await Promise.all([
      models.permission.create({
        data: { code: "AM::READ", name: "Xem hệ thống", featureId: featAM.id },
      }),
      models.permission.create({
        data: { code: "AM::CREATE", name: "Tạo dữ liệu", featureId: featAM.id },
      }),
      models.permission.create({
        data: { code: "AM::UPDATE", name: "Sửa dữ liệu", featureId: featAM.id },
      }),
      models.permission.create({
        data: { code: "AM::DELETE", name: "Xóa dữ liệu", featureId: featAM.id },
      }),
    ]);

    const featCourse = await models.feature.create({
      data: {
        code: "FEAT_COURSE",
        name: "Quản lý Khóa học",
        type: "MENU_GROUP",
      },
    });
    const permCourseView = await models.permission.create({
      data: {
        code: "COURSE_VIEW",
        name: "Xem Khóa học",
        featureId: featCourse.id,
      },
    });
    const permCourseEdit = await models.permission.create({
      data: {
        code: "COURSE_EDIT",
        name: "Sửa Khóa học",
        featureId: featCourse.id,
      },
    });

    await models.roleToPermission.createMany({
      data: [
        // Gán ALL quyền cho ADMIN
        ...permsUM.map((p) => ({ roleId: roleAdmin.id, permissionId: p.id })),
        ...permsAM.map((p) => ({ roleId: roleAdmin.id, permissionId: p.id })),
        { roleId: roleAdmin.id, permissionId: permCourseView.id },
        { roleId: roleAdmin.id, permissionId: permCourseEdit.id },

        // Gán quyền cho Teacher & Student
        { roleId: roleTeacher.id, permissionId: permCourseView.id },
        { roleId: roleTeacher.id, permissionId: permCourseEdit.id },
        { roleId: roleStudent.id, permissionId: permCourseView.id },
      ],
    });

    // ==========================================
    // 3. TẠO TÀI KHOẢN (✅ ĐÃ TĂNG LÊN 40 SINH VIÊN)
    // ==========================================
    console.log("👥 Đang tạo danh sách người dùng...");
    const hashedPassword = await bcrypt.hash("123456", 10);

    const admin = await models.user.create({
      data: {
        firstName: "Quản trị",
        lastName: "Hệ thống",
        email: "admin@iviettech.vn",
        status: UserStatus.ACTIVE,
        gender: "MALE",
        passwords: {
          create: { password: hashedPassword, type: PasswordType.PASSWORD },
        },
        roles: { create: { roleId: roleAdmin.id } },
        wallet: { create: { balance: 0 } },
      },
    });

    const teachers = await Promise.all([
      models.user.create({
        data: {
          firstName: "Trần Thế",
          lastName: "Phong",
          email: "phongnvpd10379@gmail.com",
          status: UserStatus.ACTIVE,
          gender: "MALE",
          avatarUrl: "https://i.pravatar.cc/150?u=phong",
          passwords: { create: { password: hashedPassword } },
          roles: { create: { roleId: roleTeacher.id } },
          wallet: { create: { balance: 15000000 } },
        },
      }),
      models.user.create({
        data: {
          firstName: "Lê Minh",
          lastName: "Tuấn",
          email: "tuan.le@iviettech.vn",
          status: UserStatus.ACTIVE,
          gender: "MALE",
          avatarUrl: "https://i.pravatar.cc/150?u=tuan",
          passwords: { create: { password: hashedPassword } },
          roles: { create: { roleId: roleTeacher.id } },
          wallet: { create: { balance: 25000000 } },
        },
      }),
      models.user.create({
        data: {
          firstName: "Nguyễn Thu",
          lastName: "Hương",
          email: "huong.nguyen@iviettech.vn",
          status: UserStatus.ACTIVE,
          gender: "FEMALE",
          avatarUrl: "https://i.pravatar.cc/150?u=huong",
          passwords: { create: { password: hashedPassword } },
          roles: { create: { roleId: roleTeacher.id } },
          wallet: { create: { balance: 18000000 } },
        },
      }),
    ]);

    const specificStudent = await models.user.create({
      data: {
        firstName: "Cyleish",
        lastName: "Student",
        email: "phongnguyenatx2707@gmail.com",
        status: UserStatus.ACTIVE,
        phoneNumber: "0988888888",
        passwords: {
          create: { password: hashedPassword, type: PasswordType.PASSWORD },
        },
        roles: { create: { roleId: roleStudent.id } },
        wallet: { create: { balance: 5000000 } },
      },
    });

    // ✅ Tự sinh 40 sinh viên ảo để làm đẹp Demo
    const studentNames = Array.from(
      { length: 40 },
      (_, i) => `Demo HọcVien${i + 1}`,
    );

    const students = await Promise.all(
      studentNames.map((name, i) => {
        const [l, f] = name.split(" ");
        return models.user.create({
          data: {
            firstName: f,
            lastName: l,
            email: `student${i + 1}@gmail.com`,
            status: UserStatus.ACTIVE,
            phoneNumber: `09000000${i.toString().padStart(2, "0")}`,
            passwords: { create: { password: hashedPassword } },
            roles: { create: { roleId: roleStudent.id } },
            wallet: {
              create: {
                balance: Math.floor(Math.random() * 5000000) + 1000000,
              },
            },
          },
        });
      }),
    );

    // ==========================================
    // 4. TẠO CATEGORIES (CÂY DANH MỤC)
    // ==========================================
    console.log("📂 Đang tạo Cây Danh Mục Ngành Học...");
    const catIT = await models.category.create({
      data: {
        name: "Công nghệ thông tin",
        slug: "cong-nghe-thong-tin",
        iconUrl: "💻",
      },
    });
    const catDesign = await models.category.create({
      data: { name: "Thiết kế Đồ họa", slug: "thiet-ke-do-hoa", iconUrl: "🎨" },
    });
    const catBiz = await models.category.create({
      data: {
        name: "Kinh doanh & Quản lý",
        slug: "kinh-doanh-quan-ly",
        iconUrl: "💼",
      },
    });
    const subCatWeb = await models.category.create({
      data: {
        name: "Lập trình Web",
        slug: "lap-trinh-web",
        parentId: catIT.id,
      },
    });
    const subCatMobile = await models.category.create({
      data: {
        name: "Lập trình Mobile",
        slug: "lap-trinh-mobile",
        parentId: catIT.id,
      },
    });
    const subCatQA = await models.category.create({
      data: {
        name: "Kiểm thử phần mềm",
        slug: "kiem-thu-phan-mem",
        parentId: catIT.id,
      },
    });
    const subCatUIUX = await models.category.create({
      data: {
        name: "UI/UX Design",
        slug: "ui-ux-design",
        parentId: catDesign.id,
      },
    });

    // ==========================================
    // 5. TẠO KHÓA HỌC & RULES GẮN VỚI DANH MỤC
    // ==========================================
    console.log("📚 Đang tạo Khóa học & Rules...");
    const courseWeb = await models.course.create({
      data: {
        title: "Kỹ sư Lập trình Web Fullstack (MERN Stack)",
        description:
          "Khóa học toàn diện từ con số 0 trở thành kỹ sư Fullstack.",
        price: 8500000,
        discountPrice: 6500000,
        startDate: new Date("2026-06-01"),
        durationValue: 6,
        durationUnit: "MONTH",
        daysOfWeek: "T3, T5, T7",
        level: "BEGINNER",
        maxStudents: 50,
        isFeatured: true,
        isSequential: true,
        status: "PUBLISHED",
        adminId: admin.id,
        categoryId: subCatWeb.id,
        thumbnailUrl:
          "https://placehold.co/800x400/2563eb/white?text=Fullstack+MERN",
      },
    });

    const courseQA = await models.course.create({
      data: {
        title: "Software Testing chuyên sâu",
        description: "Làm chủ Selenium, Cypress và Postman.",
        price: 5500000,
        status: "PUBLISHED",
        adminId: admin.id,
        categoryId: subCatQA.id,
        thumbnailUrl:
          "https://placehold.co/800x400/16a34a/white?text=Automation+Test",
      },
    });

    const courseUIUX = await models.course.create({
      data: {
        title: "Figma UI/UX Design Masterclass",
        description: "Thiết kế giao diện người dùng đỉnh cao.",
        price: 3200000,
        status: "PUBLISHED",
        adminId: admin.id,
        categoryId: subCatUIUX.id,
        thumbnailUrl:
          "https://placehold.co/800x400/db2777/white?text=UI+UX+Design",
      },
    });

    await models.courseRule.createMany({
      data: [
        {
          courseId: courseWeb.id,
          ruleCode: "MIN_TEST_SCORE",
          ruleValue: "75",
          description: "Điểm tổng kết trên 75/100",
        },
        {
          courseId: courseWeb.id,
          ruleCode: "MAX_ABSENCE",
          ruleValue: "4",
          description: "Nghỉ quá 4 buổi cấm thi",
        },
      ],
    });

    // ==========================================
    // 6. TẠO MÔN HỌC & CHƯƠNG HỌC
    // ==========================================
    const subFrontend = await models.subject.create({
      data: {
        courseId: courseWeb.id,
        name: "Frontend với ReactJS",
        sortOrder: 1,
        isSequential: true,
        allowReview: true,
        teachers: { create: [{ teacherId: teachers[0].id, type: "MAIN" }] },
      },
    });
    const subBackend = await models.subject.create({
      data: {
        courseId: courseWeb.id,
        name: "Backend Core",
        sortOrder: 2,
        isSequential: true,
        allowReview: false,
        teachers: { create: [{ teacherId: teachers[1].id, type: "MAIN" }] },
      },
    });
    const subDatabase = await models.subject.create({
      data: {
        courseId: courseWeb.id,
        name: "Database Design",
        sortOrder: 3,
        isSequential: false,
        allowReview: true,
        teachers: { create: [{ teacherId: teachers[1].id, type: "MAIN" }] },
      },
    });
    const subAutomation = await models.subject.create({
      data: {
        courseId: courseQA.id,
        name: "API Automation",
        sortOrder: 1,
        isSequential: false,
        allowReview: true,
        teachers: { create: [{ teacherId: teachers[2].id, type: "MAIN" }] },
      },
    });
    const subUixFoundation = await models.subject.create({
      data: {
        courseId: courseUIUX.id,
        name: "UI Foundation",
        sortOrder: 1,
        isSequential: false,
        allowReview: true,
        teachers: { create: [{ teacherId: teachers[2].id, type: "MAIN" }] },
      },
    });

    const chapFE1 = await models.chapter.create({
      data: {
        subjectId: subFrontend.id,
        title: "Chương 1: Khởi động với React",
        sortOrder: 1,
      },
    });
    const chapBE1 = await models.chapter.create({
      data: {
        subjectId: subBackend.id,
        title: "Chương 1: REST API với Express",
        sortOrder: 1,
      },
    });
    const chapDB1 = await models.chapter.create({
      data: {
        subjectId: subDatabase.id,
        title: "Chương 1: Chuẩn hóa dữ liệu",
        sortOrder: 1,
      },
    });
    const chapQA1 = await models.chapter.create({
      data: {
        subjectId: subAutomation.id,
        title: "Chương 1: Postman",
        sortOrder: 1,
      },
    });
    const chapUI1 = await models.chapter.create({
      data: {
        subjectId: subUixFoundation.id,
        title: "Chương 1: Layout",
        sortOrder: 1,
      },
    });

    // ==========================================
    // 7. BÀI GIẢNG VIDEO & BÀI TẬP (TASKMAN)
    // ==========================================
    console.log("🎥 Đang tạo Bài giảng và Bài tập...");
    const v1 = await models.video.create({
      data: {
        chapterId: chapFE1.id,
        title: "Bài 1: Tại sao lại là React?",
        videoUrl: "https://www.youtube.com/watch?v=Tn6-PIqc4UM",
        durationSeconds: 1200,
        provider: "YOUTUBE",
        sortOrder: 1,
      },
    });
    const v2 = await models.video.create({
      data: {
        chapterId: chapFE1.id,
        title: "Bài 2: Render & JSX",
        videoUrl: "https://www.youtube.com/watch?v=SqcY0GlETPk",
        durationSeconds: 2400,
        provider: "YOUTUBE",
        sortOrder: 2,
      },
    });

    const vBE1 = await models.video.create({
      data: {
        chapterId: chapBE1.id,
        title: "Bài 1: API",
        videoUrl: "https://www.youtube.com/watch?v=l8WPWK9mS5M",
        durationSeconds: 1800,
        provider: "YOUTUBE",
        sortOrder: 1,
      },
    });
    const vDB1 = await models.video.create({
      data: {
        chapterId: chapDB1.id,
        title: "Bài 1: CSDL",
        videoUrl: "https://www.youtube.com/watch?v=UrYLYV7WSHM",
        durationSeconds: 1600,
        provider: "YOUTUBE",
        sortOrder: 1,
      },
    });
    const vQA1 = await models.video.create({
      data: {
        chapterId: chapQA1.id,
        title: "Bài 1: Test",
        videoUrl: "https://www.youtube.com/watch?v=VywxIQ2ZXw4",
        durationSeconds: 1400,
        provider: "YOUTUBE",
        sortOrder: 1,
      },
    });
    const vUI1 = await models.video.create({
      data: {
        chapterId: chapUI1.id,
        title: "Bài 1: Design",
        videoUrl: "https://www.youtube.com/watch?v=c9Wg6Cb_YlU",
        durationSeconds: 1500,
        provider: "YOUTUBE",
        sortOrder: 1,
      },
    });

    console.log("📄 Đang tạo Tài liệu học tập (Taskman)...");
    await models.taskman.create({
      data: {
        chapterId: chapFE1.id,
        title: "Tài liệu ReactJS Cơ bản (PDF)",
        url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
        fileType: "PDF",
      },
    });
    await models.taskman.create({
      data: {
        chapterId: chapFE1.id,
        title: "Trang chủ tài liệu React (Link)",
        url: "https://react.dev/",
        fileType: "LINK",
      },
    });
    await models.taskman.create({
      data: {
        chapterId: chapBE1.id,
        title: "Hướng dẫn API với Express (PDF)",
        url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
        fileType: "PDF",
      },
    });
    await models.taskman.create({
      data: {
        chapterId: chapDB1.id,
        title: "Thiết kế CSDL Mẫu (WORD)",
        url: "https://file-examples.com/storage/fe2c92150a6750d513813a2/2017/02/file-sample_100kB.doc",
        fileType: "WORD",
      },
    });

    // ==========================================
    // 8. HỆ THỐNG ĐỀ THI ĐA CẤP (Gắn nguyên gốc)
    // ==========================================
    console.log("📝 Đang tạo Ngân hàng câu hỏi & Bài thi Đa cấp độ...");
    const typeSingle = await models.questionType.create({
      data: { name: "Trắc nghiệm một đáp án" },
    });
    const typeEssay = await models.questionType.create({
      data: { name: "Tự luận / Tải File" },
    });

    const q1 = await models.question.create({
      data: {
        scope: "CHAPTER",
        chapterId: chapFE1.id,
        teacherId: teachers[0].id,
        typeId: typeSingle.id,
        content: "Hook nào dùng để call API?",
        explanation: "useEffect",
        difficulty: "EASY",
        answers: {
          create: [
            { answerText: "useState", isCorrect: false, orderIndex: 1 },
            { answerText: "useEffect", isCorrect: true, orderIndex: 2 },
          ],
        },
      },
    });

    const q2 = await models.question.create({
      data: {
        scope: "SUBJECT",
        subjectId: subFrontend.id,
        teacherId: teachers[0].id,
        typeId: typeEssay.id,
        questionFormat: "ESSAY",
        content: "Hãy upload file",
        difficulty: "HARD",
      },
    });

    const testChap1 = await models.test.create({
      data: {
        scope: "CHAPTER",
        chapterId: chapFE1.id,
        title: "Quiz 1",
        testType: "QUIZ",
        durationMinutes: 15,
        testQuestions: {
          create: [{ questionId: q1.id, points: 10, sortOrder: 1 }],
        },
      },
    });
    const testSubject = await models.test.create({
      data: {
        scope: "SUBJECT",
        subjectId: subFrontend.id,
        title: "Bài thi Đồ án",
        testType: "ESSAY",
        durationMinutes: 120,
        testQuestions: {
          create: [{ questionId: q2.id, points: 10, sortOrder: 1 }],
        },
      },
    });

    // ==========================================
    // 9. LỚP HỌC & DATA HÀNG LOẠT (✅ FULL 40 STUDENTS)
    // ==========================================
    const classFS = await models.classGroup.create({
      data: {
        subjectId: subFrontend.id,
        name: "Lớp Fullstack K45 - Tối 3-5-7",
        startDate: new Date("2026-06-05"),
        endDate: new Date("2026-12-05"),
        maxStudents: 35,
        roomLink: "https://zoom.us/j/123456",
      },
    });
    const classBE = await models.classGroup.create({
      data: {
        subjectId: subBackend.id,
        name: "Lớp Backend K45 - Tối 2-4-6",
        startDate: new Date("2026-06-07"),
        endDate: new Date("2026-12-07"),
        maxStudents: 30,
        roomLink: "https://meet.google.com/backend",
      },
    });
    const classDB = await models.classGroup.create({
      data: {
        subjectId: subDatabase.id,
        name: "Lớp Database K45 - Cuối tuần",
        startDate: new Date("2026-06-08"),
        endDate: new Date("2026-12-08"),
        maxStudents: 28,
        roomLink: "https://zoom.us/j/987",
      },
    });
    const classQA = await models.classGroup.create({
      data: {
        subjectId: subAutomation.id,
        name: "Lớp QA Automation K46",
        startDate: new Date("2026-07-01"),
        endDate: new Date("2026-11-30"),
        maxStudents: 32,
        roomLink: "https://meet.google.com/qa",
      },
    });
    const classUIUX = await models.classGroup.create({
      data: {
        subjectId: subUixFoundation.id,
        name: "Lớp UIUX K20",
        startDate: new Date("2026-07-03"),
        endDate: new Date("2026-10-30"),
        maxStudents: 25,
        roomLink: "https://zoom.us/j/uiux",
      },
    });

    // Sinh viên chỉ định sẵn của bạn
    await models.classGroupUser.create({
      data: {
        userId: specificStudent.id,
        classGroupId: classFS.id,
        role: "STUDENT",
      },
    });
    await models.classGroupUser.create({
      data: {
        userId: students[0].id,
        classGroupId: classFS.id,
        role: "STUDENT",
      },
    });
    const enrollCyleish = await models.courseEnrollment.create({
      data: {
        userId: specificStudent.id,
        courseId: courseWeb.id,
        status: "ACTIVE",
        progress: 35.5,
      },
    });
    await models.transaction.create({
      data: {
        studentId: specificStudent.id,
        courseId: courseWeb.id,
        enrollmentId: enrollCyleish.id,
        amount: 6500000,
        paymentMethod: "VNPAY",
        status: "SUCCESS",
        referenceCode: `VNPAY_WEB_CYLEISH_99`,
      },
    });

    // ✅ TỰ ĐỘNG NHÉT 40 SINH VIÊN VÀO LỚP ĐỂ BIỂU ĐỒ BÙNG NỔ
    console.log(
      "🔗 Đang phân bổ 40 sinh viên vào Lớp, tạo Điểm và Lịch sử Giao dịch...",
    );
    const availableClasses = [
      { cls: classFS, subj: subFrontend, crs: courseWeb },
      { cls: classBE, subj: subBackend, crs: courseWeb },
      { cls: classDB, subj: subDatabase, crs: courseWeb },
      { cls: classQA, subj: subAutomation, crs: courseQA },
      { cls: classUIUX, subj: subUixFoundation, crs: courseUIUX },
    ];

    for (let i = 1; i < students.length; i++) {
      const student = students[i];
      const target = availableClasses[i % availableClasses.length];

      // Ghi danh & Thêm vào lớp
      const enroll = await models.courseEnrollment.create({
        data: {
          userId: student.id,
          courseId: target.crs.id,
          status: "ACTIVE",
          progress: Math.floor(Math.random() * 100),
        },
      });
      await models.classGroupUser.create({
        data: {
          userId: student.id,
          classGroupId: target.cls.id,
          role: "STUDENT",
        },
      });

      // Giao dịch (Doanh thu)
      await models.transaction.create({
        data: {
          studentId: student.id,
          courseId: target.crs.id,
          enrollmentId: enroll.id,
          amount: target.crs.price,
          paymentMethod: i % 2 === 0 ? "VNPAY" : "MANUAL",
          status: "SUCCESS",
          referenceCode: `VNPAY_DEMO_${i}`,
          createdAt: new Date(
            Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000,
          ), // Random trong 30 ngày qua
        },
      });

      // Điểm số
      await models.subjectGrade.create({
        data: {
          subjectId: target.subj.id,
          classGroupId: target.cls.id,
          studentId: student.id,
          status: "PUBLISHED",
          updatedById: teachers[0].id,
          publishedAt: new Date(),
          assignmentScore: Math.round((Math.random() * 4 + 6) * 10) / 10,
          midtermScore: Math.round((Math.random() * 4 + 6) * 10) / 10,
          finalScore: Math.round((Math.random() * 4 + 6) * 10) / 10,
          totalScore: Math.round((Math.random() * 4 + 6) * 10) / 10,
        },
      });
    }

    // ==========================================
    // 10. TƯƠNG TÁC (CHẤM ĐIỂM, FORUM, LỊCH HỌC)
    // ==========================================
    console.log("📈 Đang thiết lập Tương tác...");
    const sched1 = await models.schedule.create({
      data: {
        classGroupId: classFS.id,
        teacherId: teachers[0].id,
        title: "Buổi 1: Tổng quan ngành Web",
        startAt: new Date(),
        endAt: new Date(Date.now() + 7200000),
        dayOfWeek: 3,
      },
    });
    await models.attendance.create({
      data: {
        scheduleId: sched1.id,
        studentId: specificStudent.id,
        status: "PRESENT",
      },
    });

    const ansQ1 = await models.questionAnswer.findFirst({
      where: { questionId: q1.id, isCorrect: true },
    });
    await models.submission.create({
      data: {
        testId: testChap1.id,
        studentId: specificStudent.id,
        classGroupId: classFS.id,
        score: 10,
        status: "GRADED",
        finalScoreStatus: "AUTO_GRADED",
        userAnswers: {
          create: [{ questionId: q1.id, answerId: ansQ1?.id, isCorrect: true }],
        },
      },
    });

    const forum = await models.forum.create({
      data: { subjectId: subFrontend.id, title: "Góc hỏi đáp ReactJS K45" },
    });
    const post1 = await models.forumPost.create({
      data: {
        forumId: forum.id,
        userId: specificStudent.id,
        content: "Làm sao để deploy project lên Vercel ạ?",
      },
    });
    await models.forumPost.create({
      data: {
        forumId: forum.id,
        userId: teachers[0].id,
        parentId: post1.id,
        content: "Em xem lại video bài số 12 thầy có hướng dẫn nhé!",
      },
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
