import crypto from "crypto";
import { logger } from "ts-rails";

/**
 * Dữ liệu VNPay config
 * Bạn cần thêm vào environment variables (.env.local hoặc .env)
 */
const VNPAY_CONFIG = {
  TMN_CODE: process.env.VNPAY_TMN_CODE || "UGXDL7AZ", 
  HASH_SECRET: process.env.VNPAY_HASH_SECRET || "SD9V3E9HG6EHUIFFMM5Y51ZEFFINVQCZ", 
  BASE_URL: process.env.VNPAY_BASE_URL || "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html",
  RETURN_URL: process.env.VNPAY_RETURN_URL || "http://localhost:8000/api/v1/enrollments/vnpay-return",
  IPN_URL: process.env.VNPAY_IPN_URL || "http://localhost:8000/api/v1/enrollments/vnpay-ipn",
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
      vnp_TxnRef: orderId, 
      vnp_OrderInfo: orderInfo,
      vnp_OrderType: "250000", 
      vnp_Amount: String(amount * 100), 
      vnp_ReturnUrl: returnUrl,
      vnp_IpAddr: "127.0.0.1",
      vnp_CreateDate: this.formatDateTime(new Date()),
      vnp_ExpireDate: this.formatDateTime(this.getExpireDate()),
    };

    // Bước 1: Sắp xếp tham số theo chuẩn VNPay (Đã thay %20 thành +)
    const sortedParams = this.sortObject(params);
    
    // Bước 2: Tạo query string KHÔNG encode lại nữa
    const query = this.buildQueryString(sortedParams);

    // Bước 3: Tính checksum bằng SHA512
    const hmac = crypto.createHmac("sha512", VNPAY_CONFIG.HASH_SECRET);
    const secureHash = hmac.update(Buffer.from(query, 'utf-8')).digest("hex");

    return `${VNPAY_CONFIG.BASE_URL}?${query}&vnp_SecureHash=${secureHash}`;
  }

  /**
   * Xác thực callback từ VNPay (Return hoặc IPN)
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
      
      const paramsCopy = { ...vnpayParams };
      delete paramsCopy.vnp_SecureHash;
      delete paramsCopy.vnp_SecureHashType;

      // Áp dụng đúng chuẩn sắp xếp của VNPay khi nhận về
      const sortedParams = this.sortObject(paramsCopy);
      const query = this.buildQueryString(sortedParams);

      const hmac = crypto.createHmac("sha512", VNPAY_CONFIG.HASH_SECRET);
      const calculatedHash = hmac.update(Buffer.from(query, 'utf-8')).digest("hex");

      if (calculatedHash !== secureHash) {
        logger.error("VNPay checksum mismatch");
        return {
          isValid: false,
          message: "Checksum không hợp lệ",
        };
      }

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

  private static formatDateTime(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");

    return `${year}${month}${day}${hours}${minutes}${seconds}`;
  }

  private static getExpireDate(): Date {
    const date = new Date();
    date.setMinutes(date.getMinutes() + 15);
    return date;
  }

  /**
   * 💡 FIX QUAN TRỌNG: Hàm sắp xếp và Encode chuẩn của VNPay
   */
  private static sortObject(obj: Record<string, any>): Record<string, any> {
    const sorted: Record<string, any> = {};
    const str: string[] = [];
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        str.push(encodeURIComponent(key));
      }
    }
    str.sort(); // Sắp xếp key theo bảng chữ cái
    for (let i = 0; i < str.length; i++) {
      const key = str[i];
      if (obj[key] !== undefined && obj[key] !== null && obj[key] !== "") {
        // VNPay bắt buộc đổi %20 thành dấu +
        sorted[key] = encodeURIComponent(String(obj[key])).replace(/%20/g, '+');
      }
    }
    return sorted;
  }

  /**
   * 💡 FIX QUAN TRỌNG: Chỉ nối chuỗi, KHÔNG encode lại nữa
   */
  private static buildQueryString(params: Record<string, any>): string {
    return Object.entries(params)
      .map(([key, value]) => `${key}=${value}`)
      .join("&");
  }

  static generateManualPaymentReference(): string {
    const date = new Date();
    const dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`;
    const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `MANUAL-${dateStr}-${randomStr}`;
  }
}