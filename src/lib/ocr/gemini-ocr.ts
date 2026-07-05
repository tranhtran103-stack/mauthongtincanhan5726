import { GoogleGenAI } from '@google/genai';
import { v4 as uuidv4 } from 'uuid';
import { OCRResult, ConfidenceScores } from '@/types/cccd';
import { preprocessImage } from './image-preprocessor';
import { normalizeOCRData } from './data-normalizer';

// Khởi tạo Gemini API client
const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

const CCCD_EXTRACTION_PROMPT = `Bạn là chuyên gia phân tích Căn cước công dân (CCCD) Việt Nam.
Hãy phân tích hình ảnh CCCD và trích xuất chính xác các thông tin sau:
1. Họ và tên (fullName)
2. Ngày tháng năm sinh (dateOfBirth) - định dạng DD/MM/YYYY
3. Địa chỉ thường trú (address)
4. Ngày cấp CCCD (issueDate) - định dạng DD/MM/YYYY
5. Cơ quan cấp (issuingAuthority)

Với mỗi trường, hãy đánh giá mức độ tin cậy từ 0 đến 100.
Nếu không đọc được trường nào, trả về chuỗi rỗng và confidence = 0.
Nếu ảnh không phải CCCD, trả về tất cả rỗng và confidence = 0.`;

/**
 * Hàm delay cho cơ chế retry
 */
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Trích xuất dữ liệu CCCD từ ảnh sử dụng Gemini Vision API
 * @param imageBuffer Raw image buffer
 * @param mimeType Mime type của ảnh ban đầu
 * @returns Promise<OCRResult>
 */
export async function extractCCCDData(imageBuffer: Buffer, mimeType: string): Promise<OCRResult> {
  const startTime = Date.now();
  const id = uuidv4();

  try {
    // 1. Tiền xử lý ảnh (chuyển sang JPEG, xoay, tăng nét)
    const processedBuffer = await preprocessImage(imageBuffer);
    const base64Image = processedBuffer.toString('base64');
    const processedMimeType = 'image/jpeg'; // Sau khi qua sharp

    // 2. Retry logic config
    const maxRetries = 3;
    const baseDelay = 1000;
    let attempt = 0;
    let lastError: any = null;

    while (attempt < maxRetries) {
      try {
        // 3. Gọi Gemini API
        const response = await genAI.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: [
            {
              role: 'user',
              parts: [
                { text: CCCD_EXTRACTION_PROMPT },
                { inlineData: { mimeType: processedMimeType, data: base64Image } }
              ]
            }
          ],
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: 'OBJECT' as any,
              properties: {
                fullName: { type: 'STRING' as any },
                dateOfBirth: { type: 'STRING' as any },
                address: { type: 'STRING' as any },
                issueDate: { type: 'STRING' as any },
                issuingAuthority: { type: 'STRING' as any },
                confidence_fullName: { type: 'NUMBER' as any },
                confidence_dateOfBirth: { type: 'NUMBER' as any },
                confidence_address: { type: 'NUMBER' as any },
                confidence_issueDate: { type: 'NUMBER' as any },
                confidence_issuingAuthority: { type: 'NUMBER' as any },
              },
              required: [
                'fullName', 'dateOfBirth', 'address', 'issueDate', 'issuingAuthority',
                'confidence_fullName', 'confidence_dateOfBirth', 'confidence_address',
                'confidence_issueDate', 'confidence_issuingAuthority'
              ],
            }
          }
        });

        // 4. Parse JSON
        const textResponse = response.text;
        if (!textResponse) {
          throw new Error('Gemini API trả về kết quả rỗng');
        }

        const rawData = JSON.parse(textResponse);

        // Kiểm tra xem có nhận diện được không (nếu tất cả đều rỗng hoặc confidence = 0 thì không phải CCCD)
        if (!rawData.fullName && !rawData.dateOfBirth && rawData.confidence_fullName === 0) {
          throw new Error('Không nhận diện được thông tin CCCD trong ảnh này.');
        }

        // 5. Chuẩn hóa dữ liệu
        const normalizedData = normalizeOCRData({
          fullName: rawData.fullName || '',
          dateOfBirth: rawData.dateOfBirth || '',
          address: rawData.address || '',
          issueDate: rawData.issueDate || '',
          issuingAuthority: rawData.issuingAuthority || ''
        });

        const confidence: ConfidenceScores = {
          fullName: rawData.confidence_fullName || 0,
          dateOfBirth: rawData.confidence_dateOfBirth || 0,
          address: rawData.confidence_address || 0,
          issueDate: rawData.confidence_issueDate || 0,
          issuingAuthority: rawData.confidence_issuingAuthority || 0,
        };

        const processingTime = Date.now() - startTime;

        return {
          id,
          data: normalizedData,
          confidence,
          processingTime,
          status: 'success'
        };

      } catch (error) {
        lastError = error;
        attempt++;
        if (attempt < maxRetries) {
          console.warn(`Lần thử thứ ${attempt} thất bại. Đang thử lại sau ${baseDelay * attempt}ms...`);
          await delay(baseDelay * attempt); // Exponential backoff
        }
      }
    }

    // Nếu chạy hết vòng lặp mà vẫn lỗi
    throw lastError;

  } catch (error: any) {
    console.error('Lỗi nghiêm trọng trong extractCCCDData:', error);
    return {
      id,
      data: {
        fullName: '',
        dateOfBirth: '',
        address: '',
        issueDate: '',
        issuingAuthority: ''
      },
      confidence: {
        fullName: 0,
        dateOfBirth: 0,
        address: 0,
        issueDate: 0,
        issuingAuthority: 0
      },
      processingTime: Date.now() - startTime,
      status: 'error',
      errorMessage: error.message || 'Lỗi khi kết nối với AI nhận dạng'
    };
  }
}
