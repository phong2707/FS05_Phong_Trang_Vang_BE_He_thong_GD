import models from "@models";
import { getIo } from "../socket";

export interface NotificationPayload {
  id: string;
  userId: string;
  content: string;
  isRead: boolean;
  createdAt: Date;
}

export class NotificationService {
  /**
   * Tạo notification trong DB + emit realtime tới đúng room userId.
   */
  static async notify(userId: string, content: string): Promise<NotificationPayload> {
    const notification = await models.notification.create({
      data: {
        userId,
        content,
        isRead: false,
      },
    });

    getIo().to(userId).emit("new_notification", notification);

    return notification as NotificationPayload;
  }
}
