import sharp from 'sharp';

/**
 * Tiền xử lý ảnh trước khi gửi cho OCR
 * @param buffer Raw image buffer
 * @returns Processed image buffer (JPEG)
 */
export async function preprocessImage(buffer: Buffer): Promise<Buffer> {
  try {
    return await sharp(buffer)
      .rotate() // Tự động xoay dựa trên EXIF
      .resize({
        width: 2048,
        height: 2048,
        fit: 'inside',
        withoutEnlargement: true,
      })
      .sharpen({ sigma: 1.0 }) // Tăng độ nét
      .normalize() // Cân bằng độ sáng/độ tương phản
      .jpeg({ quality: 90 }) // Chuyển sang JPEG với chất lượng cao
      .toBuffer();
  } catch (error) {
    console.error('Lỗi khi tiền xử lý ảnh:', error);
    throw new Error('Không thể xử lý định dạng ảnh này. Vui lòng thử lại với ảnh JPG hoặc PNG.');
  }
}

/**
 * Kiểm tra chất lượng ảnh đầu vào
 * @param buffer Raw image buffer
 * @returns Object chứa trạng thái hợp lệ và danh sách cảnh báo
 */
export async function validateImage(buffer: Buffer): Promise<{ isValid: boolean; warnings: string[] }> {
  try {
    const metadata = await sharp(buffer).metadata();
    const stats = await sharp(buffer).stats();
    const warnings: string[] = [];
    
    // Kiểm tra kích thước tối thiểu
    if (!metadata.width || !metadata.height || metadata.width < 200 || metadata.height < 200) {
      warnings.push('Ảnh quá nhỏ, có thể OCR sẽ không chính xác.');
    }

    // Lấy giá trị mean của các kênh màu (brightness trung bình)
    let meanBrightness = 0;
    if (stats.channels.length > 0) {
      meanBrightness = stats.channels.reduce((sum, channel) => sum + channel.mean, 0) / stats.channels.length;
    }

    // Kiểm tra độ sáng
    if (meanBrightness < 40) {
      warnings.push('Ảnh có vẻ quá tối.');
    } else if (meanBrightness > 220) {
      warnings.push('Ảnh có vẻ quá sáng (bị chói).');
    }

    return {
      isValid: true, // Vẫn cho phép tiếp tục dù có warning
      warnings,
    };
  } catch (error) {
    console.error('Lỗi khi validate ảnh:', error);
    // Nếu lỗi sharp read, ảnh không hợp lệ
    return {
      isValid: false,
      warnings: ['Định dạng ảnh không hợp lệ hoặc bị hỏng.'],
    };
  }
}
