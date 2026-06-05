import models, { PasswordType, UserStatus } from "@models";
import * as bcrypt from "bcrypt";

async function seed() {
  try {
    console.log("🚀 BẮT ĐẦU QUÁ TRÌNH SEED DỮ LIỆU KHỦNG (DEMO)...");

    // ==========================================
    // 1. DỌN DẸP DỮ LIỆU CŨ
    // ==========================================
    console.log("🧹 Đang dọn dẹp dữ liệu cũ...");
    await models.certificate.deleteMany({});
    await models.courseRule.deleteMany({});
    await models.attendance.deleteMany({});
    await models.transaction.deleteMany({});
    await models.subjectGrade.deleteMany({});
    await models.userQuestionAnswer.deleteMany({});
    await models.submission.deleteMany({});
    await models.testQuestion.deleteMany({});
    await models.learningProgress.deleteMany({});
    if ("examSession" in models) await (models as any).examSession.deleteMany({});
    if ("testSession" in models) await (models as any).testSession.deleteMany({});
    if ("examSnapshot" in models) await (models as any).examSnapshot.deleteMany({});
    if ("testSnapshot" in models) await (models as any).testSnapshot.deleteMany({});
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
    // 2. TẠO ROLES & FEATURES (RBAC)
    // ==========================================
    console.log("🛡️ Đang khởi tạo RBAC...");
    const roleAdmin = await models.role.create({ data: { code: "ADMIN", name: "Quản trị viên", description: "Toàn quyền quản trị" } });
    const roleTeacher = await models.role.create({ data: { code: "TEACHER", name: "Giáo viên", description: "Quản lý khóa học" } });
    const roleTA = await models.role.create({ data: { code: "TA", name: "Trợ giảng", description: "Hỗ trợ học tập" } });
    const roleStudent = await models.role.create({ data: { code: "STUDENT", name: "Học viên", description: "Người học" } });

    const featUM = await models.feature.create({ data: { code: "UM", name: "Quản trị Người dùng", type: "SYSTEM" } });
    const permsUM = await Promise.all([
      models.permission.create({ data: { code: "UM::READ", name: "Xem User", featureId: featUM.id } }),
      models.permission.create({ data: { code: "UM::CREATE", name: "Tạo User", featureId: featUM.id } }),
      models.permission.create({ data: { code: "UM::UPDATE", name: "Sửa User", featureId: featUM.id } }),
      models.permission.create({ data: { code: "UM::DELETE", name: "Xóa User", featureId: featUM.id } }),
    ]);

    const featAM = await models.feature.create({ data: { code: "AM", name: "Quản trị Hệ thống", type: "SYSTEM" } });
    const permsAM = await Promise.all([
      models.permission.create({ data: { code: "AM::READ", name: "Xem hệ thống", featureId: featAM.id } }),
      models.permission.create({ data: { code: "AM::CREATE", name: "Tạo dữ liệu", featureId: featAM.id } }),
      models.permission.create({ data: { code: "AM::UPDATE", name: "Sửa dữ liệu", featureId: featAM.id } }),
      models.permission.create({ data: { code: "AM::DELETE", name: "Xóa dữ liệu", featureId: featAM.id } }),
    ]);

    const featCourse = await models.feature.create({ data: { code: "FEAT_COURSE", name: "Quản lý Khóa học", type: "MENU_GROUP" } });
    const permCourseView = await models.permission.create({ data: { code: "COURSE_VIEW", name: "Xem Khóa học", featureId: featCourse.id } });
    const permCourseEdit = await models.permission.create({ data: { code: "COURSE_EDIT", name: "Sửa Khóa học", featureId: featCourse.id } });

    await models.roleToPermission.createMany({
      data: [
        ...permsUM.map((p) => ({ roleId: roleAdmin.id, permissionId: p.id })),
        ...permsAM.map((p) => ({ roleId: roleAdmin.id, permissionId: p.id })),
        { roleId: roleAdmin.id, permissionId: permCourseView.id },
        { roleId: roleAdmin.id, permissionId: permCourseEdit.id },
        { roleId: roleTeacher.id, permissionId: permCourseView.id },
        { roleId: roleTeacher.id, permissionId: permCourseEdit.id },
        { roleId: roleStudent.id, permissionId: permCourseView.id },
      ],
    });

    // ==========================================
    // 3. TẠO TÀI KHOẢN DEMO VÀ 150 SINH VIÊN ẢO
    // ==========================================
    console.log("👥 Đang tạo danh sách 150+ người dùng...");
    const hashedPassword = await bcrypt.hash("123456", 10);

    const admin = await models.user.create({
      data: {
        firstName: "Quản trị", lastName: "Hệ thống", email: "admin@iviettech.vn", status: UserStatus.ACTIVE, gender: "MALE",
        passwords: { create: { password: hashedPassword, type: PasswordType.PASSWORD } },
        roles: { create: { roleId: roleAdmin.id } },
        wallet: { create: { balance: 0 } },
      },
    });

    const teachers = await Promise.all([
      models.user.create({ // Teacher chính để Demo
        data: {
          firstName: "Trần Thế", lastName: "Phong", email: "phongnvpd10379@gmail.com", status: UserStatus.ACTIVE, gender: "MALE", avatarUrl: "https://i.pravatar.cc/150?u=phong",
          passwords: { create: { password: hashedPassword } }, roles: { create: { roleId: roleTeacher.id } }, wallet: { create: { balance: 15000000 } },
        },
      }),
      models.user.create({
        data: {
          firstName: "Lê Minh", lastName: "Tuấn", email: "tuan.le@iviettech.vn", status: UserStatus.ACTIVE, gender: "MALE", avatarUrl: "https://i.pravatar.cc/150?u=tuan",
          passwords: { create: { password: hashedPassword } }, roles: { create: { roleId: roleTeacher.id } }, wallet: { create: { balance: 25000000 } },
        },
      }),
    ]);

    const demoStudent = await models.user.create({ // Học viên chính để Demo
      data: {
        firstName: "Cyleish", lastName: "Student", email: "phongnguyenatx2707@gmail.com", status: UserStatus.ACTIVE, phoneNumber: "0988888888", avatarUrl: "https://i.pravatar.cc/150?u=cyleish",
        passwords: { create: { password: hashedPassword, type: PasswordType.PASSWORD } },
        roles: { create: { roleId: roleStudent.id } }, wallet: { create: { balance: 15000000 } },
      },
    });

    // Tạo 150 sinh viên ảo
    const numFakeStudents = 150;
    const students = [demoStudent]; // Nhét student thật vào đầu mảng
    for (let i = 1; i <= numFakeStudents; i++) {
      const student = await models.user.create({
        data: {
          firstName: "Học Viên", lastName: `Demo ${i}`, email: `student${i}@gmail.com`, status: UserStatus.ACTIVE, phoneNumber: `0900000${i.toString().padStart(3, "0")}`,
          passwords: { create: { password: hashedPassword } }, roles: { create: { roleId: roleStudent.id } },
          wallet: { create: { balance: Math.floor(Math.random() * 5000000) + 1000000 } },
        },
      });
      students.push(student);
    }

    // ==========================================
    // 4. CATEGORIES, KHÓA HỌC & RULES
    // ==========================================
    console.log("📚 Đang tạo Khóa học & Nội dung...");
    const catIT = await models.category.create({ data: { name: "Công nghệ thông tin", slug: "cong-nghe-thong-tin", iconUrl: "💻" } });
    
    const courseWeb = await models.course.create({
      data: {
        title: "Kỹ sư Lập trình Web Fullstack (MERN)", description: "Khóa học toàn diện từ con số 0.", price: 8500000, discountPrice: 6500000,
        startDate: new Date("2026-06-01"), durationValue: 6, durationUnit: "MONTH", daysOfWeek: "T3, T5, T7", level: "BEGINNER", maxStudents: 200,
        isFeatured: true, status: "PUBLISHED", adminId: admin.id, categoryId: catIT.id, thumbnailUrl: "https://placehold.co/800x400/2563eb/white?text=Fullstack+MERN",
      },
    });
    const courseQA = await models.course.create({
      data: {
        title: "Software Testing chuyên sâu", description: "Làm chủ Selenium, Cypress.", price: 5500000, status: "PUBLISHED",
        adminId: admin.id, categoryId: catIT.id, thumbnailUrl: "https://placehold.co/800x400/16a34a/white?text=Automation+Test",
      },
    });

    // Môn học (Teacher Phong dạy hết để demo cho dễ)
    const subFrontend = await models.subject.create({
      data: { courseId: courseWeb.id, name: "Frontend với ReactJS", sortOrder: 1, allowReview: true, teachers: { create: [{ teacherId: teachers[0].id, type: "MAIN" }] } },
    });
    const subBackend = await models.subject.create({
      data: { courseId: courseWeb.id, name: "Backend Core NodeJS", sortOrder: 2, allowReview: false, teachers: { create: [{ teacherId: teachers[0].id, type: "MAIN" }] } },
    });
    const subQA = await models.subject.create({
      data: { courseId: courseQA.id, name: "Kiểm thử Tự động", sortOrder: 1, allowReview: true, teachers: { create: [{ teacherId: teachers[0].id, type: "MAIN" }] } },
    });

    // Chương & Video & Taskman
    const chapFE1 = await models.chapter.create({ data: { subjectId: subFrontend.id, title: "Chương 1: Khởi động với React", sortOrder: 1 } });
    const chapFE2 = await models.chapter.create({ data: { subjectId: subFrontend.id, title: "Chương 2: React Router & State", sortOrder: 2 } });
    
    await models.video.createMany({
      data: [
        { chapterId: chapFE1.id, title: "Bài 1: Tại sao lại là React?", videoUrl: "https://www.youtube.com/watch?v=Tn6-PIqc4UM", durationSeconds: 1200, provider: "YOUTUBE", sortOrder: 1 },
        { chapterId: chapFE1.id, title: "Bài 2: Render & JSX", videoUrl: "https://www.youtube.com/watch?v=SqcY0GlETPk", durationSeconds: 2400, provider: "YOUTUBE", sortOrder: 2 },
        { chapterId: chapFE2.id, title: "Bài 3: Quản lý State", videoUrl: "https://www.youtube.com/watch?v=O6P86uwfdR0", durationSeconds: 1500, provider: "YOUTUBE", sortOrder: 1 }
      ]
    });

    await models.taskman.createMany({
      data: [
        { chapterId: chapFE1.id, title: "Tài liệu ReactJS Cơ bản (PDF)", url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf", fileType: "PDF" },
        { chapterId: chapFE2.id, title: "Bài tập State Management", url: "https://github.com/react-demo", fileType: "LINK" }
      ]
    });

    // ==========================================
    // 5. BÀI THI & CÂU HỎI
    // ==========================================
    console.log("📝 Đang tạo Ngân hàng câu hỏi & Bài thi...");
    const typeEssay = await models.questionType.create({ data: { name: "Tự luận / Upload Code" } });
    const q1 = await models.question.create({
      data: { scope: "CHAPTER", chapterId: chapFE1.id, teacherId: teachers[0].id, typeId: typeEssay.id, questionFormat: "ESSAY", content: "Hãy clone project React mẫu, fix lỗi ở file App.js và upload link Github lên đây.", difficulty: "MEDIUM" },
    });
    const testChap1 = await models.test.create({
      data: { scope: "CHAPTER", chapterId: chapFE1.id, title: "Bài tập thực hành Chương 1", testType: "ESSAY", durationMinutes: 120, testQuestions: { create: [{ questionId: q1.id, points: 10, sortOrder: 1 }] } },
    });

    // ==========================================
    // 6. LỚP HỌC VÀ PHÂN BỔ DỮ LIỆU ĐỒNG LOẠT (ĐIỂM NHẤN DEMO)
    // ==========================================
    console.log("🔗 Đang bùng nổ dữ liệu Enrollment, Giao dịch, Điểm số, Lịch học...");
    
    const classFS = await models.classGroup.create({
      data: { subjectId: subFrontend.id, name: "Lớp Fullstack K45", startDate: new Date("2025-10-01"), endDate: new Date("2026-10-01"), maxStudents: 200, roomLink: "https://zoom.us/j/123456" },
    });
    const classQA_Group = await models.classGroup.create({
      data: { subjectId: subQA.id, name: "Lớp QA Automation K46", startDate: new Date("2026-01-01"), endDate: new Date("2026-11-30"), maxStudents: 100, roomLink: "https://meet.google.com/qa" },
    });

    // Tạo lịch học cho lớp K45 (Của Teacher 0) - Tạo 20 buổi học trong quá khứ và 5 buổi tương lai
    const schedules = [];
    const today = new Date();
    for (let i = -20; i <= 5; i++) {
      const scheduleDate = new Date(today);
      scheduleDate.setDate(today.getDate() + (i * 2)); // Học cách ngày
      const sched = await models.schedule.create({
        data: { classGroupId: classFS.id, teacherId: teachers[0].id, title: `Buổi học số ${i + 21}: React Thực chiến`, startAt: scheduleDate, endAt: new Date(scheduleDate.getTime() + 7200000), dayOfWeek: scheduleDate.getDay() },
      });
      schedules.push(sched);
    }

    // Ghi danh 150 học viên vào lớp và tạo doanh thu ngẫu nhiên
    for (let i = 0; i < students.length; i++) {
      const student = students[i];
      const isDemoUser = student.id === demoStudent.id;
      
      // Ghi danh Khóa Web
      const enrollWeb = await models.courseEnrollment.create({
        data: { userId: student.id, courseId: courseWeb.id, status: "ACTIVE", progress: isDemoUser ? 65 : Math.floor(Math.random() * 100) },
      });
      await models.classGroupUser.create({ data: { userId: student.id, classGroupId: classFS.id, role: "STUDENT" } });

      // Ghi danh ngẫu nhiên khóa QA (Demo user chắc chắn được ghi danh)
      if (isDemoUser || Math.random() > 0.5) {
        const enrollQA = await models.courseEnrollment.create({
          data: { userId: student.id, courseId: courseQA.id, status: "ACTIVE", progress: isDemoUser ? 10 : Math.floor(Math.random() * 50) },
        });
        await models.classGroupUser.create({ data: { userId: student.id, classGroupId: classQA_Group.id, role: "STUDENT" } });
        
        // Transaction QA
        const randomDaysQA = Math.floor(Math.random() * 180); // Rải rác trong 6 tháng
        await models.transaction.create({
          data: { studentId: student.id, courseId: courseQA.id, enrollmentId: enrollQA.id, amount: 5500000, paymentMethod: "MANUAL", status: "SUCCESS", referenceCode: `MANUAL_QA_${i}`, createdAt: new Date(Date.now() - randomDaysQA * 24 * 60 * 60 * 1000) },
        });
      }

      // Tạo Transaction Khóa Web (Rải rác 6 tháng để biểu đồ đẹp)
      const randomDays = isDemoUser ? 10 : Math.floor(Math.random() * 180);
      await models.transaction.create({
        data: { studentId: student.id, courseId: courseWeb.id, enrollmentId: enrollWeb.id, amount: 6500000, paymentMethod: "VNPAY", status: "SUCCESS", referenceCode: `VNPAY_WEB_${i}`, createdAt: new Date(Date.now() - randomDays * 24 * 60 * 60 * 1000) },
      });

      // Điểm số ngẫu nhiên
      await models.subjectGrade.create({
        data: { subjectId: subFrontend.id, classGroupId: classFS.id, studentId: student.id, status: "PUBLISHED", updatedById: teachers[0].id, publishedAt: new Date(), assignmentScore: Math.round((Math.random() * 4 + 6) * 10) / 10, finalScore: Math.round((Math.random() * 4 + 6) * 10) / 10, totalScore: Math.round((Math.random() * 4 + 6) * 10) / 10 },
      });

      // ==========================================
      // ĐIỂM DANH & BÀI TẬP (Chỉ làm mạnh cho Cyleish và một vài bạn để Teacher 0 có bài chấm)
      // ==========================================
      if (isDemoUser || i < 15) { // 15 bạn đầu tiên nộp bài
        // Điểm danh
        for (let j = 0; j < 10; j++) { // Điểm danh 10 buổi đầu
          await models.attendance.create({
            data: { scheduleId: schedules[j].id, studentId: student.id, status: isDemoUser ? "PRESENT" : (Math.random() > 0.2 ? "PRESENT" : "ABSENT") },
          });
        }

        // Nộp bài tập
        const isGraded = isDemoUser ? true : Math.random() > 0.5; // Demo user đã chấm, các bạn khác hên xui
        await models.submission.create({
          data: { 
            testId: testChap1.id, studentId: student.id, classGroupId: classFS.id,
            status: isGraded ? "GRADED" : "SUBMITTED", finalScoreStatus: isGraded ? "GRADED_BY_TEACHER" : "PENDING",
            score: isGraded ? (Math.floor(Math.random() * 3) + 7) : null,
            studentFileUrl: "https://github.com/my-react-assignment",
            graderId: isGraded ? teachers[0].id : null, teacherFeedback: isGraded ? "Bài làm tốt, code clean!" : null,
            submittedAt: new Date(Date.now() - Math.floor(Math.random() * 5) * 24 * 60 * 60 * 1000)
          },
        });
      }
    }

    // ==========================================
    // 7. DIỄN ĐÀN SÔI NỔI
    // ==========================================
    console.log("🗣️ Đang tạo tương tác Forum...");
    const forum = await models.forum.create({ data: { subjectId: subFrontend.id, title: "Góc hỏi đáp ReactJS K45" } });
    const post1 = await models.forumPost.create({ data: { forumId: forum.id, userId: demoStudent.id, content: "Thầy ơi em bị lỗi CORS khi call API từ React sang Nodejs, làm sao fix ạ?" } });
    await models.forumPost.create({ data: { forumId: forum.id, userId: teachers[0].id, parentId: post1.id, content: "Chào Cyleish, em cài thư viện `cors` bên file server.js của Node chưa? Nhớ app.use(cors()) nhé." } });
    await models.forumPost.create({ data: { forumId: forum.id, userId: demoStudent.id, parentId: post1.id, content: "Dạ em cảm ơn thầy, em làm được rồi ạ!" } });
    
    await models.forumPost.create({ data: { forumId: forum.id, userId: students[5].id, content: "Có ai hiểu sự khác nhau giữa useMemo và useCallback không ạ giải thích giúp mình với." } });

    console.log("🎉 SEED DỮ LIỆU HOÀN TẤT! HỆ THỐNG ĐÃ SẴN SÀNG ĐỂ DEMO HOÀNH TRÁNG.");
  } catch (error) {
    console.error("❌ Lỗi khi seed dữ liệu:", error);
    process.exit(1);
  } finally {
    await models.$disconnect();
  }
}

seed();

