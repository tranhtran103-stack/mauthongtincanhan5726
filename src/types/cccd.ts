// Kiểu dữ liệu chính cho kết quả OCR từ CCCD

/** Dữ liệu trích xuất từ 1 ảnh CCCD */
export interface CCCDData {
  id: string;
  imageUrl: string; // base64 data URL hoặc blob URL
  fileName: string;
  fullName: string; // Họ và tên
  dateOfBirth: string; // Ngày sinh (DD/MM/YYYY)
  address: string; // Địa chỉ
  issueDate: string; // Ngày cấp
  issuingAuthority: string; // Cơ quan cấp
  confidence: ConfidenceScores;
  status: ProcessingStatus;
  errorMessage?: string;
  processingTime?: number; // milliseconds
}

/** Điểm tin cậy cho từng trường (0-100) */
export interface ConfidenceScores {
  fullName: number;
  dateOfBirth: number;
  address: number;
  issueDate: number;
  issuingAuthority: number;
}

/** Trạng thái xử lý */
export type ProcessingStatus = 'pending' | 'processing' | 'success' | 'error';

/** Kết quả trả về từ API OCR */
export interface OCRApiResponse {
  results: OCRResult[];
}

export interface OCRResult {
  id: string;
  data: {
    fullName: string;
    dateOfBirth: string;
    address: string;
    issueDate: string;
    issuingAuthority: string;
  };
  confidence: ConfidenceScores;
  processingTime: number;
  status: 'success' | 'error';
  errorMessage?: string;
}

/** Thống kê Dashboard */
export interface DashboardStats {
  totalProcessed: number;
  successCount: number;
  failureCount: number;
  avgProcessingTime: number;
  avgConfidence: number;
  excelExportCount: number;
}

/** Dữ liệu xuất Excel */
export interface ExcelRowData {
  stt: number;
  fullName: string;
  dateOfBirth: string;
  address: string;
  issueDate: string;
  issuingAuthority: string;
}

/** Cấu hình cho batch processing */
export interface BatchProcessingState {
  total: number;
  completed: number;
  failed: number;
  isProcessing: boolean;
  isCancelled: boolean;
  failedIds: string[];
}
