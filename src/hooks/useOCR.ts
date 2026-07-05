import { useState, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useOCRStore } from '@/lib/store';
import { useToast } from '@/components/ui/use-toast';
import { CCCDData, OCRResult } from '@/types/cccd';

const BATCH_SIZE = 3; // Xử lý song song tối đa 3 ảnh cùng lúc

export function useOCR() {
  const store = useOCRStore();
  const { toast } = useToast();
  const abortControllerRef = useRef<AbortController | null>(null);

  // Hàm chuyển File thành Data URL để preview
  const fileToDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Process 1 file (thực hiện call API)
  const processSingleFile = async (file: File, id: string, signal: AbortSignal) => {
    try {
      store.updateItem(id, { status: 'processing' });

      const formData = new FormData();
      formData.append('images', file);

      const response = await fetch('/api/ocr', {
        method: 'POST',
        body: formData,
        signal,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Lỗi kết nối đến máy chủ');
      }

      const responseData = await response.json();
      
      if (responseData.results && responseData.results.length > 0) {
        const result: OCRResult = responseData.results[0];
        
        if (result.status === 'success') {
          store.updateItem(id, {
            ...result.data,
            confidence: result.confidence,
            status: 'success',
            processingTime: result.processingTime,
            errorMessage: result.errorMessage // Có thể chứa warning
          });
          return true; // Success
        } else {
          throw new Error(result.errorMessage || 'Lỗi không xác định khi OCR');
        }
      } else {
        throw new Error('Máy chủ không trả về kết quả');
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        store.updateItem(id, { status: 'pending' });
        return false;
      }
      
      store.updateItem(id, { 
        status: 'error', 
        errorMessage: error.message || 'Có lỗi xảy ra trong quá trình xử lý'
      });
      return false; // Failed
    }
  };

  // Main processing function for multiple files
  const processImages = async (files: File[]) => {
    if (files.length === 0) return;

    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    // 1. Prepare items
    const newItems: CCCDData[] = [];
    const filesMap = new Map<string, File>();

    for (const file of files) {
      const id = uuidv4();
      filesMap.set(id, file);
      
      // Tạo preview dạng blob URL để nhanh hơn, nếu cần dùng base64 thì dùng fileToDataUrl
      const imageUrl = URL.createObjectURL(file);
      
      newItems.push({
        id,
        imageUrl,
        fileName: file.name,
        fullName: '',
        dateOfBirth: '',
        address: '',
        issueDate: '',
        issuingAuthority: '',
        confidence: { fullName: 0, dateOfBirth: 0, address: 0, issueDate: 0, issuingAuthority: 0 },
        status: 'pending',
      });
    }

    // 2. Add to store
    store.addItems(newItems);
    store.setBatchState({
      total: files.length,
      completed: 0,
      failed: 0,
      isProcessing: true,
      isCancelled: false,
      failedIds: []
    });

    toast({
      title: 'Đã bắt đầu xử lý',
      description: `Đang tiến hành trích xuất thông tin ${files.length} ảnh CCCD.`,
    });

    // 3. Process in batches to limit concurrency
    let completedCount = 0;
    let failedCount = 0;
    const failedIds: string[] = [];

    // Chuyển map thành array các task
    const tasks = Array.from(filesMap.entries());
    
    // Hàm thực thi 1 batch
    const executeBatch = async (batchTasks: [string, File][]) => {
      const promises = batchTasks.map(async ([id, file]) => {
        if (signal.aborted) return;
        
        const success = await processSingleFile(file, id, signal);
        
        if (!signal.aborted) {
          if (success) {
            completedCount++;
          } else {
            failedCount++;
            failedIds.push(id);
          }
          
          store.setBatchState({
            completed: completedCount,
            failed: failedCount,
            failedIds
          });
          store.recalculateStats();
        }
      });
      
      await Promise.all(promises);
    };

    // Chạy từng batch
    try {
      for (let i = 0; i < tasks.length; i += BATCH_SIZE) {
        if (signal.aborted) break;
        const currentBatch = tasks.slice(i, i + BATCH_SIZE);
        await executeBatch(currentBatch);
      }
    } finally {
      if (signal.aborted) {
        toast({
          title: 'Đã hủy',
          description: 'Quá trình xử lý ảnh đã bị hủy.',
          variant: 'destructive'
        });
      } else {
        toast({
          title: 'Hoàn tất',
          description: `Đã xử lý xong ${files.length} ảnh. (${completedCount} thành công, ${failedCount} lỗi)`,
          variant: failedCount > 0 ? 'destructive' : 'success'
        });
      }

      store.setBatchState({ isProcessing: false });
      store.recalculateStats();
      abortControllerRef.current = null;
    }
  };

  const cancelProcessing = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      store.setBatchState({ isCancelled: true });
    }
  };

  // Retry logic cho phép retry failed items sẽ cần truy cập lại file. 
  // Vì lý do bảo mật trình duyệt, ta không thể lưu đối tượng File lâu dài sau khi input thay đổi.
  // Tuy nhiên, đối với single session, File reference vẫn có thể hoạt động nếu được pass trực tiếp.
  // Ở đây để đơn giản, ta chỉ support flow upload mới.

  return {
    processImages,
    cancelProcessing,
    isProcessing: store.batchState.isProcessing
  };
}
