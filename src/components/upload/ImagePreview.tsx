'use client';

import React from 'react';
import { X, Clock, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { CCCDData } from '@/types/cccd';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface ImagePreviewProps {
  items: CCCDData[];
  onRemove: (id: string) => void;
}

export function ImagePreview({ items, onRemove }: ImagePreviewProps) {
  if (!items || items.length === 0) return null;

  return (
    <div className="mt-8">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-medium tracking-tight">Danh sách ảnh đã chọn ({items.length})</h3>
      </div>
      
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {items.map((item) => (
          <div 
            key={item.id} 
            className="group relative overflow-hidden rounded-xl border bg-card shadow-sm transition-all duration-300 hover:shadow-md animate-fade-in"
          >
            {/* Thumbnail */}
            <div className="relative aspect-[3/2] w-full overflow-hidden bg-muted">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.imageUrl}
                alt={item.fileName}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              
              {/* Processing Overlay */}
              {item.status === 'processing' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/60 backdrop-blur-sm">
                  <RefreshCw className="h-6 w-6 animate-spin text-primary" />
                  <span className="mt-2 text-xs font-medium text-foreground">Đang OCR...</span>
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex flex-col gap-2 p-3">
              <p className="truncate text-xs font-medium text-foreground" title={item.fileName}>
                {item.fileName}
              </p>
              
              <div>
                {item.status === 'pending' && <Badge variant="secondary" className="text-[10px]"><Clock className="mr-1 h-3 w-3" /> Chờ xử lý</Badge>}
                {item.status === 'processing' && <Badge variant="default" className="animate-pulse text-[10px]">Đang xử lý</Badge>}
                {item.status === 'success' && <Badge variant="success" className="text-[10px]"><CheckCircle2 className="mr-1 h-3 w-3" /> Hoàn tất</Badge>}
                {item.status === 'error' && <Badge variant="destructive" className="text-[10px]"><AlertCircle className="mr-1 h-3 w-3" /> Lỗi</Badge>}
              </div>
            </div>

            {/* Delete button (hidden when processing) */}
            {item.status !== 'processing' && (
              <button
                onClick={() => onRemove(item.id)}
                className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-background/80 text-muted-foreground opacity-0 shadow-sm backdrop-blur-md transition-all hover:bg-destructive hover:text-destructive-foreground group-hover:opacity-100"
                title="Xóa ảnh"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
