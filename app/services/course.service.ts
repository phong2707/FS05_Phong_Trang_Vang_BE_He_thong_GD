import { BadRequestError, NotFoundError } from "ts-rails";
import { ApplicationService } from "./application.service";

export class StudentCourseService extends ApplicationService {
  // 1. Xem danh sách khóa học (View course list)
  async getList() {
    return await this.models.course.findMany({
      where: { status: "PUBLISHED" },
      select: {
        id: true,
        title: true,
        description: true,
        thumbnailUrl: true,
        price: true,
        teachers: {
          include: {
            teacher: {
              select: { firstName: true, lastName: true, avatarUrl: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  // 2. Xem chi tiết khóa học (View course details)
  async getDetails(courseId: string) {
    const course = await this.models.course.findUnique({
      where: { id: courseId, status: "PUBLISHED" },
      include: {
        teachers: {
          include: {
            teacher: {
              select: {
                firstName: true,
                lastName: true,
                avatarUrl: true,
                email: true,
              },
            },
          },
        },
        subjects: {
          orderBy: { sortOrder: "asc" },
          include: {
            classGroups: {
              where: { status: "ACTIVE" },
              select: { id: true, name: true }, // Chỉ lấy thông tin cơ bản của lớp học
            },
          },
        },
        courseReviews: true,
      },
    });

    if (!course) {
      throw new NotFoundError(
        "Không tìm thấy khóa học hoặc khóa học chưa được phát hành.",
      );
    }
    return course;
  }

  // 3. Đăng ký khóa học (Register for a course)
  async register(studentId: string, courseId: string) {
    const course = await this.models.course.findUnique({
      where: { id: courseId, status: "PUBLISHED" },
    });

    if (!course) throw new NotFoundError("Không tìm thấy khóa học.");

    // Kiểm tra xem sinh viên đã có giao dịch thành công/đang chờ cho khóa này chưa
    const existingTx = await this.models.transaction.findFirst({
      where: { studentId, courseId, status: { in: ["SUCCESS", "PENDING"] } },
    });
    if (existingTx) {
      throw new BadRequestError(
        "Bạn đã đăng ký hoặc đang có giao dịch chờ xử lý cho khóa học này.",
      );
    }

    // Tạo giao dịch thanh toán
    const transaction = await this.models.transaction.create({
      data: {
        studentId,
        courseId,
        amount: course.price,
        paymentMethod: "VNPAY", // Default hoặc lấy từ tham số nếu bạn phát triển thêm payment gateway
        status: course.price === 0 ? "SUCCESS" : "PENDING",
        referenceCode: `REG_${Date.now()}`,
      },
    });

    // Nếu khóa học miễn phí (price = 0), có thể tự động gán sinh viên vào các classGroups ở đây
    // (Để đơn giản, việc enroll vào lớp cụ thể có thể tách thành 1 step/Job riêng)

    return { message: "Đăng ký thành công", transaction };
  }

  // 4. Rút khỏi khóa học (Withdraw from a course)
  async withdraw(studentId: string, courseId: string) {
    // Đổi trạng thái giao dịch để không còn hiệu lực khóa học
    const updatedTx = await this.models.transaction.updateMany({
      where: { studentId, courseId, status: "SUCCESS" },
      data: { status: "CANCELLED" },
    });

    if (updatedTx.count === 0) {
      throw new BadRequestError(
        "Không tìm thấy dữ liệu đăng ký hợp lệ để rút khỏi khóa học.",
      );
    }

    // Tìm các lớp (class_groups) thuộc khóa học này mà sinh viên đang tham gia và xóa khỏi đó
    const subjects = await this.models.subject.findMany({
      where: { courseId },
      select: { id: true },
    });
    const subjectIds = subjects.map((s: { id: string }) => s.id);

    const classGroups = await this.models.classGroup.findMany({
      where: { subjectId: { in: subjectIds } },
      select: { id: true },
    });
    const classGroupIds = classGroups.map((c: { id: string }) => c.id);

    if (classGroupIds.length > 0) {
      await this.models.classGroupUser.deleteMany({
        where: {
          userId: studentId,
          classGroupId: { in: classGroupIds },
        },
      });
    }

    return { message: "Bạn đã rút khỏi khóa học thành công." };
  }
}
