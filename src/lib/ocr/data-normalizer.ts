/**
 * Loại bỏ các ký tự lạ, giữ lại tiếng Việt, số, dấu câu cơ bản
 */
export function cleanText(text: string): string {
  if (!text) return '';
  // Xóa khoảng trắng thừa và ký tự không in được
  return text
    .replace(/[\x00-\x1F\x7F-\x9F]/g, '') // remove control chars
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Chuẩn hóa Họ và tên: viết hoa chữ cái đầu mỗi từ
 */
export function normalizeFullName(name: string): string {
  if (!name) return '';
  const cleaned = cleanText(name).toLowerCase();
  return cleaned
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Chuẩn hóa định dạng ngày tháng (DD/MM/YYYY)
 * Xử lý các lỗi OCR thường gặp như O -> 0, l -> 1
 */
export function normalizeDate(date: string): string {
  if (!date) return '';
  let cleaned = cleanText(date).toUpperCase();
  
  // Fix common OCR errors for numbers
  cleaned = cleaned
    .replace(/[O]/g, '0')
    .replace(/[IlL]/g, '1')
    .replace(/[S]/g, '5')
    .replace(/[B]/g, '8')
    .replace(/[Z]/g, '2');

  // Trích xuất mẫu dạng số DD/MM/YYYY hoặc có dấu phân cách
  const match = cleaned.match(/(\d{1,2})[\/\-\.\s]*(\d{1,2})[\/\-\.\s]*(\d{4})/);
  
  if (match) {
    const day = match[1].padStart(2, '0');
    const month = match[2].padStart(2, '0');
    const year = match[3];
    return `${day}/${month}/${year}`;
  }
  
  return cleaned; // Trả về nguyên bản nếu không regex match được
}

/**
 * Chuẩn hóa địa chỉ: Loại bỏ khoảng trắng thừa, chuẩn hóa chữ viết tắt
 */
export function normalizeAddress(address: string): string {
  if (!address) return '';
  let cleaned = cleanText(address);
  
  // Sửa các lỗi OCR thông thường trong địa chỉ VN
  cleaned = cleaned
    .replace(/TP\./gi, 'Thành phố')
    .replace(/T\./gi, 'Tỉnh')
    .replace(/Q\./gi, 'Quận')
    .replace(/H\./gi, 'Huyện')
    .replace(/P\./gi, 'Phường')
    .replace(/X\./gi, 'Xã');
    
  return cleaned;
}

/**
 * Chuẩn hóa cơ quan cấp
 */
export function normalizeIssuingAuthority(authority: string): string {
  if (!authority) return '';
  let cleaned = cleanText(authority);
  
  // Cơ quan cấp thường gặp nhất
  const commonAuthorities = [
    'Cục Cảnh sát Quản lý hành chính về trật tự xã hội',
    'Cục trưởng Cục Cảnh sát Quản lý hành chính về trật tự xã hội',
    'Giám đốc Công an'
  ];

  // Nếu chuỗi chứa các từ khóa chính, tự động mapping về chuỗi chuẩn
  const lowerAuth = cleaned.toLowerCase();
  if (lowerAuth.includes('quản lý hành chính') && lowerAuth.includes('cảnh sát')) {
    return 'Cục Cảnh sát Quản lý hành chính về trật tự xã hội';
  }

  return cleaned;
}

/**
 * Chuẩn hóa toàn bộ dữ liệu OCR
 */
export function normalizeOCRData(data: {
  fullName: string;
  dateOfBirth: string;
  address: string;
  issueDate: string;
  issuingAuthority: string;
}) {
  return {
    fullName: normalizeFullName(data.fullName),
    dateOfBirth: normalizeDate(data.dateOfBirth),
    address: normalizeAddress(data.address),
    issueDate: normalizeDate(data.issueDate),
    issuingAuthority: normalizeIssuingAuthority(data.issuingAuthority),
  };
}
