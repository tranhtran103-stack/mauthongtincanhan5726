'use client';

import React, { useCallback, useRef, useState } from 'react';
import { UploadCloud, FileImage } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';

interface DropZoneProps {
  onFilesSelected: (files: File[]) => void;
  disabled?: boolean;
}

export function DropZone({ onFilesSelected, disabled = false }: DropZoneProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const MAX_FILE_SIZE = process.env.NEXT_PUBLIC_MAX_FILE_SIZE 
    ? parseInt(process.env.NEXT_PUBLIC_MAX_FILE_SIZE, 10) 
    : 20 * 1024 * 1024; // 20MB
    
  const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

  const validateFiles = (files: File[]) => {
    const validFiles: File[] = [];
    const errors: string[] = [];

    files.forEach((file) => {
      if (!ALLOWED_TYPES.includes(file.type)) {
        errors.push(`File "${file.name}" không đúng định dạng.`);
      } else if (file.size > MAX_FILE_SIZE) {
        errors.push(`File "${file.name}" quá lớn (>20MB).`);
      } else {
        validFiles.push(file);
      }
    });

    if (errors.length > 0) {
      toast({
        title: 'Một số file không hợp lệ',
        description: errors[0] + (errors.length > 1 ? ` và ${errors.length - 1} lỗi khác.` : ''),
        variant: 'destructive',
      });
    }

    if (validFiles.length > 0) {
      onFilesSelected(validFiles);
    }
    
    // Reset input để có thể chọn lại cùng 1 file
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragActive(true);
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragActive(true);
  }, [disabled]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    
    if (disabled) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateFiles(Array.from(e.dataTransfer.files));
    }
  }, [disabled, onFilesSelected]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateFiles(Array.from(e.target.files));
    }
  };

  return (
    <div
      className={cn(
        'group relative flex min-h-[280px] w-full cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed transition-all duration-300 ease-out',
        isDragActive
          ? 'scale-[1.02] border-primary bg-primary/5 shadow-xl'
          : 'border-muted-foreground/25 bg-muted/20 hover:border-primary/50 hover:bg-muted/50',
        disabled && 'pointer-events-none cursor-not-allowed opacity-60'
      )}
      onClick={() => !disabled && fileInputRef.current?.click()}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".jpg,.jpeg,.png,.webp"
        className="hidden"
        onChange={handleFileInput}
        disabled={disabled}
      />
      
      <div className="flex flex-col items-center justify-center p-6 text-center">
        <div 
          className={cn(
            'mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-background shadow-sm transition-transform duration-300',
            isDragActive ? 'scale-110 shadow-primary/20 ring-4 ring-primary/10' : 'group-hover:scale-110'
          )}
        >
          <UploadCloud className={cn("h-10 w-10 transition-colors", isDragActive ? "text-primary" : "text-muted-foreground group-hover:text-primary")} />
        </div>
        
        <h3 className="mb-2 text-xl font-semibold tracking-tight text-foreground">
          Kéo và thả ảnh CCCD vào đây
        </h3>
        
        <p className="mb-6 text-sm text-muted-foreground">
          hoặc <span className="font-medium text-primary underline-offset-4 hover:underline">click để chọn file</span> từ máy tính
        </p>
        
        <div className="flex items-center gap-4 text-xs font-medium text-muted-foreground/80">
          <div className="flex items-center gap-1.5 rounded-md bg-background px-2.5 py-1 shadow-sm">
            <FileImage className="h-3.5 w-3.5" />
            <span>JPG, PNG, WEBP</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-md bg-background px-2.5 py-1 shadow-sm">
            <span>Tối đa 20MB/ảnh</span>
          </div>
        </div>
      </div>
      
      {/* Animated gradient border overlay effect on hover */}
      <div className="pointer-events-none absolute inset-0 -z-10 rounded-2xl bg-gradient-to-br from-primary/20 via-transparent to-blue-500/20 opacity-0 blur-xl transition-opacity duration-500 group-hover:opacity-100" />
    </div>
  );
}
