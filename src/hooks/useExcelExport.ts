import { useState } from 'react';
import { saveAs } from 'file-saver';
import { useOCRStore } from '@/lib/store';
import { useToast } from '@/components/ui/use-toast';
import { ExcelRowData } from '@/types/cccd';

export function useExcelExport() {
  const [isExporting, setIsExporting] = useState(false);
  const { items, incrementExportCount } = useOCRStore();
  const { toast } = useToast();

  const exportToExcel = async () => {
    // Chỉ lấy các item thành công
    const successfulItems = items.filter((item) => item.status === 'success');

    if (successfulItems.length === 0) {
      toast({
        title: 'Không có dữ liệu',
        description: 'Vui lòng xử lý ảnh thành công trước khi xuất Excel.',
        variant: 'destructive',
      });
      return;
    }

    setIsExporting(true);

    try {
      // Map data sang format chuẩn
      const excelData: ExcelRowData[] = successfulItems.map((item, index) => ({
        stt: index + 1,
        fullName: item.fullName,
        dateOfBirth: item.dateOfBirth,
        address: item.address,
        issueDate: item.issueDate,
        issuingAuthority: item.issuingAuthority,
      }));

      // Gọi API xuất Excel
      const response = await fetch('/api/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data: excelData }),
      });

      if (!response.ok) {
        throw new Error('Lỗi khi tạo file Excel từ máy chủ');
      }

      // Nhận blob và tải xuống
      const blob = await response.blob();
      const filename = response.headers.get('content-disposition')?.split('filename=')[1]?.replace(/"/g, '') || `cccd_data_${new Date().getTime()}.xlsx`;
      
      saveAs(blob, filename);

      incrementExportCount();
      
      toast({
        title: 'Xuất file thành công',
        description: `Đã xuất ${excelData.length} bản ghi ra file Excel.`,
        variant: 'success',
      });

    } catch (error: any) {
      console.error('Lỗi xuất Excel:', error);
      toast({
        title: 'Lỗi',
        description: error.message || 'Đã có lỗi xảy ra khi xuất Excel. Vui lòng thử lại.',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  return {
    exportToExcel,
    isExporting,
  };
}
