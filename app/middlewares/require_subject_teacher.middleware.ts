import { NextFunction, Request, Response } from "express";
import { ApplicationMiddleware } from "./application.middleware";
import models from "@models";

/**
 * Middleware kiểm tra xem giáo viên có được phân công dạy môn học này không.
 * 
 * Logic:
 * 1. Lấy chapterId từ req.params (nếu có) hoặc từ resourceId (taskman id)
 * 2. Từ chapterId, tìm ra subjectId
 * 3. Kiểm tra SubjectTeacher tồn tại với { subjectId, teacherId: currentUser.id }
 * 4. Nếu không có → 403 Forbidden
 * 5. Nếu có → next()
 */
export class RequireSubjectTeacherMiddleware extends ApplicationMiddleware {
  constructor() {
    super();
  }

  public async execute(req: Request, res: Response, next: NextFunction) {
    // ✅ Kiểm tra user đã login
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Vui lòng đăng nhập",
      });
    }

    const currentUserId = (req.user as any).id;
    let subjectId: string | null = null;

    try {
      // ✅ Cách 1: Lấy chapterId từ params
      const { chapterId, subjectId: querySubjectId, resourceId, id } = req.params;

      // ✅ Cách 2: Nếu có subjectId trực tiếp trong params
      if (querySubjectId) {
        subjectId = querySubjectId;
      }
      // ✅ Cách 3: Từ chapterId tìm ra subjectId
      else if (chapterId) {
        const chapter = await models.chapter.findUnique({
          where: { id: chapterId },
          select: { subjectId: true },
        });

        if (!chapter) {
          return res.status(404).json({
            success: false,
            message: "Không tìm thấy chương học",
          });
        }

        subjectId = chapter.subjectId;
      }
      // ✅ Cách 4: Từ resourceId (taskman id) tìm ra subjectId
      else if (resourceId || id) {
        const taskmanId = resourceId || id;
        const taskman = await models.taskman.findUnique({
          where: { id: taskmanId },
          select: {
            chapter: {
              select: { subjectId: true },
            },
          },
        });

        if (!taskman) {
          return res.status(404).json({
            success: false,
            message: "Không tìm thấy tài liệu",
          });
        }

        subjectId = taskman.chapter.subjectId;
      }

      // ✅ Nếu không thể xác định subjectId
      if (!subjectId) {
        return res.status(400).json({
          success: false,
          message: "Không thể xác định môn học",
        });
      }

      // ✅ Kiểm tra giáo viên có được phân công vào môn này không
      const subjectTeacher = await models.subjectTeacher.findUnique({
        where: {
          subjectId_teacherId: {
            subjectId,
            teacherId: currentUserId,
          },
        },
      });

      if (!subjectTeacher) {
        return res.status(403).json({
          success: false,
          message: "Bạn không có quyền chỉnh sửa môn học này",
        });
      }

      // ✅ Gắn subjectId vào req để controller dùng sau
      (req as any).subjectId = subjectId;

      next();
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        message: err.message || "Lỗi kiểm tra quyền",
      });
    }
  }
}
