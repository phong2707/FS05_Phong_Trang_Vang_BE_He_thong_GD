import { AdminController } from "./admin.controller";
import { adminDashboardService } from "@services/admin/dashboard.service";

export class AdminDashboardController extends AdminController {
  async summary() {
    try {
      const payload = await adminDashboardService.getDashboardSummary();
      return this.res.json(payload);
    } catch (error: any) {
      return this.res.status(500).json({ success: false, message: error.message });
    }
  }
}

export default AdminDashboardController;
