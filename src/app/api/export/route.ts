import { NextRequest, NextResponse } from 'next/server';
import { generateExcelBuffer } from '@/lib/excel';
import { ExcelRowData } from '@/types/cccd';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data: ExcelRowData[] = body.data;

    if (!data || !Array.isArray(data)) {
      return NextResponse.json(
        { error: 'Dữ liệu không hợp lệ. Yêu cầu một mảng dữ liệu.' },
        { status: 400 }
      );
    }

    if (data.length === 0) {
        return NextResponse.json(
            { error: 'Không có dữ liệu để xuất Excel.' },
            { status: 400 }
          );
    }

    const buffer = await generateExcelBuffer(data);

    // Format ngày giờ cho tên file
    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const filename = `cccd_data_${dateStr}.xlsx`;

    // Khởi tạo response với buffer và headers
    const response = new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });

    return response;

  } catch (error: any) {
    console.error('Lỗi ở API Route Export:', error);
    return NextResponse.json(
      { error: 'Lỗi máy chủ nội bộ khi tạo file Excel. Vui lòng thử lại sau.' },
      { status: 500 }
    );
  }
}
