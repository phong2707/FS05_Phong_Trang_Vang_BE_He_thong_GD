import type { Server as HttpServer } from "http";
import { Server as SocketIOServer } from "socket.io";

let io: SocketIOServer | null = null;

/**
 * Khởi tạo Socket.io và bám vào HTTP server.
 */
export function initSocket(httpServer: HttpServer): SocketIOServer {
  if (io) return io;

  io = new SocketIOServer(httpServer, {
    cors: {
      origin: ["http://localhost:5173"],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    socket.on("join_user_room", (userId: string) => {
      if (!userId) return;
      socket.join(userId);
    });
  });

  return io;
}

/**
 * Lấy instance Socket.io để emit từ service.
 */
export function getIo(): SocketIOServer {
  if (!io) {
    throw new Error("Socket.io chưa được khởi tạo. Hãy gọi initSocket(httpServer) trước.");
  }
  return io;
}
