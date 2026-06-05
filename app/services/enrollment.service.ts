import models, { PasswordType } from "@models";
import { logger, Security } from "ts-rails";
import { PaymentService } from "./payment.service";
import { UserMailer } from "@mailers";
import crypto from "crypto";

// Sử dụng PrismaClient từ generated/prisma
type PrismaClientType = typeof models;
const prisma = models as PrismaClientType;

type PaymentMethod = "VNPAY" | "MANUAL";

interface GuestEnrollInput {
  guestEmail?: string;
  guestFirstName?: string;
  guestLastName?: string;
  guestPhoneNumber?: string;
}

export class EnrollmentService {
  /**
   * Sinh viên/khách đăng ký khóa học
   * - Nếu có userId: dùng tài khoản hiện tại
   * - Nếu không có userId: tự động tìm/tạo user theo guestEmail
   */
  static async studentEnrollCourse(
    userId: string | null,
    courseId: string,
    paymentMethod: PaymentMethod,
    guestInput?: GuestEnrollInput
  ) {
    let guestPasswordRaw: string | null = null;
    let createdGuestEmail: string | null = null;
    let createdGuestFullName: string | null = null;

    const result = await prisma.$transaction(async (tx) => {
      let resolvedUserId = userId;

      if (!resolvedUserId) {
        const guestEmail = guestInput?.guestEmail?.trim().toLowerCase();
        const guestFirstName = guestInput?.guestFirstName?.trim();
        const guestLastName = guestInput?.guestLastName?.trim();
        const guestPhoneNumber = guestInput?.guestPhoneNumber?.trim();

        if (!guestEmail || !guestFirstName || !guestLastName) {
          throw new Error("Thiếu thông tin khách đăng ký (email, họ, tên)");
        }

        let guestUser = await tx.user.findUnique({
          where: { email: guestEmail },
        });

        if (!guestUser) {
          // find STUDENT role id
          const roleRec = await tx.role.findFirst({ where: { code: "STUDENT" } });
          const roleId = roleRec?.id;

          // generate random password and hash it
          guestPasswordRaw = crypto.randomBytes(4).toString("hex");
          const hashed = await Security.hashPassword(guestPasswordRaw);

          const createData: any = {
            email: guestEmail,
            firstName: guestFirstName,
            lastName: guestLastName,
            phoneNumber: guestPhoneNumber || null,
            status: "PENDING",
            passwords: { create: { password: hashed, type: PasswordType.PASSWORD } },
            wallet: { create: { balance: 0 } },
          };

          if (roleId) {
            createData.roles = { create: { roleId } };
          }

          guestUser = await tx.user.create({ data: createData });

          createdGuestEmail = guestEmail;
          createdGuestFullName = [guestFirstName, guestLastName].filter(Boolean).join(" ");
        }

        resolvedUserId = guestUser.id;
      }

      if (!resolvedUserId) {
        throw new Error("Không thể xác định người đăng ký");
      }

      // 1. Kiểm tra đăng ký trùng
      const existing = await tx.courseEnrollment.findUnique({
        where: { userId_courseId: { userId: resolvedUserId, courseId } }
      });
      if (existing) throw new Error("Bạn đã đăng ký khóa học này rồi!");

      // 2. Lấy thông tin khóa học để tính số tiền
      const course = await tx.course.findUnique({
        where: { id: courseId }
      });
      if (!course) throw new Error("Khóa học không tồn tại");

      const amount = course.discountPrice || course.price;

      // 3. Tạo Enrollment (PENDING)
      const enrollment = await tx.courseEnrollment.create({
        data: { userId: resolvedUserId, courseId, status: "PENDING" }
      });

      // 4. Tạo Transaction (PENDING)
      const transaction = await tx.transaction.create({
        data: {
          studentId: resolvedUserId,
          courseId: courseId,
          enrollmentId: enrollment.id,
          amount: amount,
          paymentMethod: paymentMethod,
          status: "PENDING"
        }
      });

      // 5. Nếu VNPAY thì tạo link thanh toán
      let vnpayUrl: string | undefined = undefined;
      if (paymentMethod === "VNPAY") {
        try {
          vnpayUrl = PaymentService.createVNPayUrl(
            amount,
            `Thanh toan khoa hoc ${courseId}`,
            transaction.id
          );
        } catch (error: any) {
          logger.error("Error creating VNPay URL:", error);
          throw new Error("Không thể tạo link thanh toán VNPay");
        }
      }

      return {
        message: "Đăng ký khóa học thành công",
        enrollment,
        transaction,
        ...(vnpayUrl ? { vnpayUrl } : {}),
      };
    });

    // After successful transaction, send guest password email (if created)
    if (guestPasswordRaw && createdGuestEmail) {
      try {
        await UserMailer.sendGuestPassword(createdGuestEmail, guestPasswordRaw, createdGuestFullName || createdGuestEmail);
      } catch (err: any) {
        logger.error("Failed to send guest password email:", err);
      }
    }

    return result;
  }

  /**
   * Admin duyệt đăng ký (Duyệt cả Enrollment, Transaction và User)
   */
  static async adminApproveEnrollment(enrollmentId: string, adminId: string) {
    return await prisma.$transaction(async (tx) => {
      // 1. Tìm đơn đăng ký
      const enrollment = await tx.courseEnrollment.findUnique({
        where: { id: enrollmentId },
        include: { user: true }
      });

      if (!enrollment) throw new Error("Không tìm thấy đơn đăng ký!");

      // 2. Cập nhật Enrollment thành ACTIVE
      await tx.courseEnrollment.update({
        where: { id: enrollmentId },
        data: { status: "ACTIVE", completedAt: new Date() }
      });

      // 3. Update Transaction thành SUCCESS
      await tx.transaction.updateMany({
        where: { enrollmentId: enrollmentId },
        data: { status: "SUCCESS" }
      });

      // 4. Active User nếu đang ở trạng thái PENDING
      if (enrollment.user.status === "PENDING") {
        await tx.user.update({
          where: { id: enrollment.userId },
          data: { status: "ACTIVE" }
        });
      }

      logger.info(`Admin ${adminId} approved enrollment ${enrollmentId}`);
      return enrollment;
    });
  }

  /**
   * Cập nhật trạng thái enrollment
   */
  static async updateEnrollmentStatus(enrollmentId: string, status: string) {
    return await prisma.courseEnrollment.update({
      where: { id: enrollmentId },
      data: { status },
    });
  }

  /**
   * Lấy chi tiết giao dịch (dùng cho Payment Result Page)
   */
  static async getTransactionDetails(transactionId: string) {
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: {
        enrollment: {
          include: {
            course: true,
            user: true,
          },
        },
      },
    });

    if (!transaction) {
      throw new Error("Giao dịch không tồn tại");
    }

    return transaction;
  }
}