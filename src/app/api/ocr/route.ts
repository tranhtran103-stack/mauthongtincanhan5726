import { NextRequest, NextResponse } from 'next/server';
import { extractCCCDData } from '@/lib/ocr/gemini-ocr';
import { validateImage } from '@/lib/ocr/image-preprocessor';
import { OCRResult } from '@/types/cccd';

export const runtime = 'nodejs';
export const maxDuration = 60; // Tăng timeout cho xử lý ảnh nặng

const MAX_FILE_SIZE = process.env.NEXT_PUBLIC_MAX_FILE_SIZE 
  ? parseInt(process.env.NEXT_PUBLIC_MAX_FILE_SIZE, 10) 
  : 20 * 1024 * 1024; // Mặc định 20MB

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const files = formData.getAll('images') as File[];

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'Vui lòng cung cấp ít nhất một file ảnh' },
        { status: 400 }
      );
    }

    // Xử lý song song các ảnh
    const processPromises = files.map(async (file) => {
      try {
        // 1. Validate file basic
        if (!ALLOWED_MIME_TYPES.includes(file.type)) {
          throw new Error(`Định dạng file không hỗ trợ: ${file.type}. Chỉ hỗ trợ JPG, PNG, WEBP.`);
        }
        
        if (file.size > MAX_FILE_SIZE) {
          throw new Error(`Kích thước file quá lớn: ${(file.size / 1024 / 1024).toFixed(2)}MB. Tối đa 20MB.`);
        }

        const buffer = Buffer.from(await file.arrayBuffer());

        // 2. Validate ảnh sâu hơn
        const validation = await validateImage(buffer);
        if (!validation.isValid) {
          throw new Error(validation.warnings.join('. '));
        }

        // 3. Tiến hành OCR
        const result = await extractCCCDData(buffer, file.type);
        
        // Nếu có warning từ validateImage, nối thêm vào errorMessage (nếu có lỗi)
        // hoặc ghi log
        if (validation.warnings.length > 0 && result.status === 'error') {
            result.errorMessage = `${result.errorMessage}. Lưu ý: ${validation.warnings.join(', ')}`;
        }

        return result;

      } catch (error: any) {
        // Fallback error trả về đúng định dạng
        return {
          id: crypto.randomUUID(),
          data: { fullName: '', dateOfBirth: '', address: '', issueDate: '', issuingAuthority: '' },
          confidence: { fullName: 0, dateOfBirth: 0, address: 0, issueDate: 0, issuingAuthority: 0 },
          processingTime: 0,
          status: 'error',
          errorMessage: error.message || 'Lỗi không xác định khi xử lý ảnh'
        } as OCRResult;
      }
    });

    const results = await Promise.all(processPromises);

    return NextResponse.json({ results });

  } catch (error: any) {
    console.error('Lỗi ở API Route:', error);
    return NextResponse.json(
      { error: 'Lỗi máy chủ nội bộ. Vui lòng thử lại sau.' },
      { status: 500 }
    );
  }
}
