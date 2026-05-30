import crypto from "crypto";
import { logger } from "ts-rails";

/**
 * Dữ liệu VNPay config
 * Bạn cần thêm vào environment variables (.env.local hoặc .env)
 */
const VNPAY_CONFIG = {
  TMN_CODE: process.env.VNPAY_TMN_CODE || "UGXDL7AZ", 
  SECRET_KEY: process.env.VNPAY_SECRET_KEY || "SD9V3E9HG6EHUIFFMM5Y51ZEFFINVQCZ", 
  BASE_URL: process.env.VNPAY_BASE_URL || "https://sandbox.vnpayment.vn",
  RETURN_URL: process.env.VNPAY_RETURN_URL || "http://localhost:8000/api/v1/payments/vnpay-return",
  IPN_URL: process.env.VNPAY_IPN_URL || "http://localhost:8000/api/v1/payments/vnpay-ipn",
};

interface VNPayParams {
  vnp_Amount?: string;
  vnp_BankCode?: string;
  vnp_BankTranNo?: string;
  vnp_CardType?: string;
  vnp_OrderInfo?: string;
  vnp_PayDate?: string;
  vnp_ResponseCode?: string;
  vnp_TmnCode?: string;
  vnp_TransactionNo?: string;
  vnp_TransactionStatus?: string;
  vnp_TxnRef?: string;
  vnp_SecureHash?: string;
  [key: string]: any;
}

export class PaymentService {
  /**
   * Tạo URL thanh toán VNPay
   * @param amount - Số tiền (VND)
   * @param orderInfo - Thông tin đơn hàng
   * @param orderId - Mã đơn hàng (Transaction ID hoặc Reference code)
   * @param returnUrl - URL callback sau thanh toán (tùy chọn)
   * @returns Link VNPay để redirect
   */
  static createVNPayUrl(
    amount: number,
    orderInfo: string,
    orderId: string,
    returnUrl: string = VNPAY_CONFIG.RETURN_URL
  ): string {
    const params: VNPayParams = {
      vnp_Version: "2.1.0",
      vnp_Command: "pay",
      vnp_TmnCode: VNPAY_CONFIG.TMN_CODE,
      vnp_Locale: "vn",
      vnp_CurrCode: "VND",
      vnp_TxnRef: orderId, // Mã đơn hàng (phải unique)
      vnp_OrderInfo: orderInfo,
      vnp_OrderType: "250000", // VD: 250000 = Khóa học
      vnp_Amount: String(amount * 100), // VNPay yêu cầu nhân 100 (cent)
      vnp_ReturnUrl: returnUrl,
      vnp_IpAddr: "127.0.0.1",
      vnp_CreateDate: this.formatDateTime(new Date()),
      vnp_ExpireDate: this.formatDateTime(this.getExpireDate()),
    };

    // Sắp xếp tham số theo thứ tự bảng chữ cái
    const sortedParams = this.sortObject(params);
    const query = this.buildQueryString(sortedParams);

    // Tính checksum
    const hmac = crypto.createHmac("sha512", VNPAY_CONFIG.SECRET_KEY);
    const secureHash = hmac.update(query).digest("hex");

    return `${VNPAY_CONFIG.BASE_URL}/vpcpay?${query}&vnp_SecureHash=${secureHash}`;
  }

  /**
   * Xác thực callback từ VNPay (Return hoặc IPN)
   * @param vnpayParams - Tất cả tham số từ query string VNPay trả về
   * @returns { isValid: boolean, message: string, transactionNo?: string }
   */
  static verifyVNPayReturn(vnpayParams: VNPayParams): {
    isValid: boolean;
    message: string;
    transactionNo?: string;
    orderId?: string;
    amount?: number;
    responseCode?: string;
  } {
    try {
      const secureHash = vnpayParams.vnp_SecureHash || "";
      
      // Xóa secure hash khỏi params để kiểm tra
      const paramsCopy = { ...vnpayParams };
      delete paramsCopy.vnp_SecureHash;
      delete paramsCopy.vnp_SecureHashType;

      // Sắp xếp và tạo query string
      const sortedParams = this.sortObject(paramsCopy);
      const query = this.buildQueryString(sortedParams);

      // Tính lại checksum
      const hmac = crypto.createHmac("sha512", VNPAY_CONFIG.SECRET_KEY);
      const calculatedHash = hmac.update(query).digest("hex");

      // So sánh checksum
      if (calculatedHash !== secureHash) {
        logger.error("VNPay checksum mismatch");
        return {
          isValid: false,
          message: "Checksum không hợp lệ",
        };
      }

      // Kiểm tra response code
      const responseCode = vnpayParams.vnp_ResponseCode || "";
      if (responseCode !== "00") {
        logger.warn(`VNPay response code: ${responseCode}`);
        return {
          isValid: false,
          message: `Lỗi từ VNPay: ${responseCode}`,
          responseCode,
        };
      }

      return {
        isValid: true,
        message: "Xác thực thành công",
        transactionNo: vnpayParams.vnp_TransactionNo,
        orderId: vnpayParams.vnp_TxnRef,
        amount: vnpayParams.vnp_Amount ? Math.floor(Number(vnpayParams.vnp_Amount) / 100) : 0,
        responseCode: "00",
      };
    } catch (error) {
      logger.error("Error verifying VNPay return:", error);
      return {
        isValid: false,
        message: "Lỗi xác thực",
      };
    }
  }

  /**
   * Định dạng ngày giờ theo format YYYYMMDDHHmmss
   */
  private static formatDateTime(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");

    return `${year}${month}${day}${hours}${minutes}${seconds}`;
  }

  /**
   * Lấy thời gian hết hạn (mặc định 15 phút từ bây giờ)
   */
  private static getExpireDate(): Date {
    const date = new Date();
    date.setMinutes(date.getMinutes() + 15);
    return date;
  }

  /**
   * Sắp xếp object theo key (bảng chữ cái)
   */
  private static sortObject(obj: Record<string, any>): Record<string, any> {
    return Object.keys(obj)
      .sort()
      .reduce((result, key) => {
        result[key] = obj[key];
        return result;
      }, {} as Record<string, any>);
  }

  /**
   * Tạo query string từ object
   */
  private static buildQueryString(params: Record<string, any>): string {
    return Object.entries(params)
      .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
      .join("&");
  }

  /**
   * Hàm helper: Tạo reference code cho MANUAL payment
   * Format: MANUAL-{YYYYMMDD}-{6 random chars}
   */
  static generateManualPaymentReference(): string {
    const date = new Date();
    const dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`;
    const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `MANUAL-${dateStr}-${randomStr}`;
  }
}
