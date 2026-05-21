import { ApplicationChannel } from "./application.channel";

export class ExamChannel extends ApplicationChannel {
  async subscribe() {
    if (!(await this.ensureAuthenticated())) return;

    // ✅ join room riêng 1 user
    const user = await this.getCurrentUser();
    const room = `exam_${user?.id}`;

    this.join(room);

    this.socket.on("exam:join", (data) => this.joinExam(data));
    this.socket.on("exam:cheat", (data) => this.reportCheat(data));
  }

  // ✅ TIMER REALTIME
  joinExam(data: { duration: number }) {
    const userId =
      (this.socket.request as any).session?.userId || "unknown";

    const room = `exam_${userId}`;

    let timeLeft = data.duration * 60;

    const interval = setInterval(() => {
      timeLeft--;

      this.broadcastTo(room, "timer", { timeLeft });

      if (timeLeft <= 0) {
        clearInterval(interval);
        this.broadcastTo(room, "time_up", {});
      }
    }, 1000);
  }

  // ✅ CHEAT DETECT
  reportCheat(data: { type: string }) {
    const userId =
      (this.socket.request as any).session?.userId || "unknown";

    const room = `exam_${userId}`;

    console.log("Cheat detected:", data.type);

    this.broadcastTo(room, "cheat_warning", {
      type: data.type,
    });
  }
}
``