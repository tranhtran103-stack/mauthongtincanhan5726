import ExcelJS from 'exceljs';
import { ExcelRowData } from '@/types/cccd';

/**
 * Tạo file Excel từ dữ liệu CCCD
 * @param data Mảng dữ liệu đã trích xuất
 * @returns Buffer chứa file Excel
 */
export async function generateExcelBuffer(data: ExcelRowData[]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'CCCD OCR App';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet('Dữ liệu CCCD', {
    properties: { tabColor: { argb: 'FF1E40AF' } },
  });

  // Định nghĩa các cột
  sheet.columns = [
    { header: 'STT', key: 'stt', width: 6 },
    { header: 'Họ và tên', key: 'fullName', width: 25 },
    { header: 'Ngày sinh', key: 'dateOfBirth', width: 15 },
    { header: 'Địa chỉ', key: 'address', width: 45 },
    { header: 'Ngày cấp', key: 'issueDate', width: 15 },
    { header: 'Cơ quan cấp', key: 'issuingAuthority', width: 40 },
  ];

  // Format Header (Dòng 1)
  const headerRow = sheet.getRow(1);
  headerRow.font = { name: 'Arial', bold: true, color: { argb: 'FFFFFFFF' }, size: 12 };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
  headerRow.height = 30;

  headerRow.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1E40AF' }, // Xanh blue sậm
    };
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    };
  });

  // Thêm dữ liệu
  if (data && data.length > 0) {
    data.forEach((item, index) => {
      const rowIndex = index + 2; // Bắt đầu từ dòng 2
      const row = sheet.addRow(item);

      // Định dạng Zebra striping (dòng chẵn lẻ)
      const isEven = rowIndex % 2 === 0;
      row.eachCell((cell, colNumber) => {
        // Border cho tất cả cell
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };

        // Tô màu nền xen kẽ
        if (isEven) {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF1F5F9' }, // Light slate
          };
        }

        // Căn lề
        cell.alignment = { vertical: 'middle' };
        
        // Cột STT (1), Ngày sinh (3), Ngày cấp (5) căn giữa
        if (colNumber === 1 || colNumber === 3 || colNumber === 5) {
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
        }
        
        // Cột Địa chỉ (4) và Cơ quan cấp (6) có thể wrap text
        if (colNumber === 4 || colNumber === 6) {
          cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
        }
      });
    });
  }

  // Tự động điều chỉnh độ rộng hàng cho cột có wrapText
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber > 1) { // Bỏ qua header
        // Nếu địa chỉ quá dài thì tăng chiều cao hàng
        const addressCell = row.getCell(4);
        if (addressCell.value && addressCell.value.toString().length > 45) {
           row.height = 30; // Tăng height cho hàng
        } else {
           row.height = 20;
        }
    }
  });

  // Khóa Header khi cuộn
  sheet.views = [
    { state: 'frozen', xSplit: 0, ySplit: 1 }
  ];

  // Trả về Buffer
  const buffer = await workbook.xlsx.writeBuffer();
  return buffer as unknown as Buffer;
}
