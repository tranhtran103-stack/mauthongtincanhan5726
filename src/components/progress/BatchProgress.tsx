'use client';

import React from 'react';
import { useOCRStore } from '@/lib/store';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { XCircle, RefreshCw, AlertTriangle } from 'lucide-react';
import { useOCR } from '@/hooks/useOCR';

export function BatchProgress() {
  const { batchState, items } = useOCRStore();
  const { cancelProcessing, processImages } = useOCR();

  if (!batchState.isProcessing && batchState.completed === 0 && batchState.failed === 0) {
    return null;
  }

  const percentage = batchState.total > 0 
    ? Math.round(((batchState.completed + batchState.failed) / batchState.total) * 100) 
    : 0;

  const handleRetryFailed = async () => {
    if (batchState.failedIds.length === 0) return;
    
    // Tìm các file bị lỗi
    const failedItems = items.filter(i => batchState.failedIds.includes(i.id));
    if (failedItems.length === 0) return;

    // Convert imageUrls back to Files
    try {
        const filesToRetry: File[] = [];
        for (const item of failedItems) {
            const res = await fetch(item.imageUrl);
            const blob = await res.blob();
            filesToRetry.push(new File([blob], item.fileName, { type: blob.type }));
        }
        
        // Remove old failed items
        // In a real app we might want to update them in place, but for simplicity we re-process
        processImages(filesToRetry);
    } catch(e) {
        console.error("Lỗi khi retry", e);
    }
  };

  return (
    <div className="mt-8 animate-fade-in overflow-hidden rounded-xl border bg-card p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium tracking-tight">
            {batchState.isProcessing ? 'Đang xử lý OCR...' : 'Hoàn tất quá trình OCR'}
          </h3>
          <p className="text-sm text-muted-foreground">
            {batchState.completed + batchState.failed} / {batchState.total} ảnh đã được xử lý
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {batchState.failed > 0 && !batchState.isProcessing && (
            <Button variant="outline" size="sm" onClick={handleRetryFailed} className="text-warning">
              <RefreshCw className="mr-2 h-4 w-4" /> Xử lý lại ảnh lỗi
            </Button>
          )}
          
          {batchState.isProcessing && (
            <Button variant="destructive" size="sm" onClick={cancelProcessing}>
              <XCircle className="mr-2 h-4 w-4" /> Hủy
            </Button>
          )}
        </div>
      </div>

      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="font-medium text-primary">{percentage}%</span>
        {batchState.failed > 0 && (
          <span className="flex items-center text-destructive">
            <AlertTriangle className="mr-1 h-3.5 w-3.5" /> 
            {batchState.failed} ảnh bị lỗi
          </span>
        )}
      </div>

      <Progress 
        value={percentage} 
        className="h-3" 
        indicatorClassName={batchState.failed > 0 && percentage === 100 ? "bg-gradient-to-r from-warning to-destructive" : ""} 
      />
    </div>
  );
}
