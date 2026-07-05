'use client';

import React, { useState } from 'react';
import { Trash2, RefreshCw, CheckCircle2, AlertCircle, Edit2, Check } from 'lucide-react';
import { useOCRStore } from '@/lib/store';
import { useOCR } from '@/hooks/useOCR';
import { CCCDData } from '@/types/cccd';
import { ConfidenceBadge } from './ConfidenceBadge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

export function ResultsTable() {
  const { items, updateField, removeItem } = useOCRStore();
  const { processImages } = useOCR();
  
  // State for inline editing: { [itemId]: { [fieldName]: boolean } }
  const [editingCells, setEditingCells] = useState<Record<string, Record<string, boolean>>>({});

  // Chỉ hiển thị các item đã OCR xong (thành công hoặc lỗi)
  const displayItems = items.filter(item => item.status === 'success' || item.status === 'error');
  const hasProcessingItems = items.some(item => item.status === 'processing');

  const toggleEdit = (id: string, field: string, isEditing: boolean) => {
    setEditingCells(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: isEditing
      }
    }));
  };

  const handleBlur = (id: string, field: string) => {
    toggleEdit(id, field, false);
  };

  const handleKeyDown = (e: React.KeyboardEvent, id: string, field: string) => {
    if (e.key === 'Enter') {
      toggleEdit(id, field, false);
    }
  };

  const handleRetry = async (item: CCCDData) => {
    try {
        // Cần convert blob url/data url thành File object
        const res = await fetch(item.imageUrl);
        const blob = await res.blob();
        const file = new File([blob], item.fileName, { type: blob.type });
        // Xóa item cũ
        removeItem(item.id);
        // Chạy lại OCR
        await processImages([file]);
    } catch(e) {
        console.error("Không thể xử lý lại", e);
    }
  };

  const EditableCell = ({ item, field, label }: { item: CCCDData, field: keyof CCCDData, label: string }) => {
    const isEditing = editingCells[item.id]?.[field as string] || false;
    const value = item[field as keyof CCCDData] as string;
    const confidence = item.confidence[field as keyof typeof item.confidence];
    
    // Đánh dấu nền vàng nếu confidence < 80%
    const isLowConfidence = confidence < 80 && item.status === 'success';

    return (
      <div 
        className={cn(
          "group relative flex flex-col gap-1.5 rounded-md p-2 transition-colors",
          isLowConfidence ? "bg-warning/10 hover:bg-warning/20" : "hover:bg-muted/50",
          isEditing && "ring-2 ring-primary ring-offset-1 bg-background"
        )}
        onClick={() => !isEditing && toggleEdit(item.id, field as string, true)}
      >
        {isEditing ? (
          <div className="flex items-center gap-1">
            <input
              autoFocus
              className="w-full rounded-sm border bg-background px-2 py-1 text-sm outline-none"
              value={value}
              onChange={(e) => updateField(item.id, field, e.target.value)}
              onBlur={() => handleBlur(item.id, field as string)}
              onKeyDown={(e) => handleKeyDown(e, item.id, field as string)}
            />
            <button className="text-success hover:text-success/80" onClick={() => handleBlur(item.id, field as string)}>
              <Check className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-medium leading-tight">
              {value || <span className="italic text-muted-foreground">Trống</span>}
            </span>
            <Edit2 className="h-3 w-3 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 cursor-pointer" />
          </div>
        )}
        
        {item.status === 'success' && (
          <div className="mt-1">
             <ConfidenceBadge value={confidence} fieldName={label} />
          </div>
        )}
      </div>
    );
  };

  if (items.length === 0) {
    return (
      <div className="flex min-h-[300px] flex-col items-center justify-center rounded-xl border border-dashed bg-muted/20 p-8 text-center">
        <div className="mb-4 rounded-full bg-muted p-4">
          <FileSpreadsheetIcon className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium">Chưa có kết quả</h3>
        <p className="mt-1 text-sm text-muted-foreground">Hãy tải ảnh CCCD lên và nhấn Bắt đầu OCR để xem kết quả tại đây.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-semibold">STT</th>
              <th className="px-4 py-3 font-semibold">Ảnh</th>
              <th className="min-w-[150px] px-4 py-3 font-semibold">Họ và tên</th>
              <th className="min-w-[120px] px-4 py-3 font-semibold">Ngày sinh</th>
              <th className="min-w-[200px] px-4 py-3 font-semibold">Địa chỉ</th>
              <th className="min-w-[120px] px-4 py-3 font-semibold">Ngày cấp</th>
              <th className="min-w-[180px] px-4 py-3 font-semibold">Cơ quan cấp</th>
              <th className="min-w-[100px] px-4 py-3 font-semibold text-center">Trạng thái</th>
              <th className="px-4 py-3 font-semibold text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {displayItems.map((item, index) => (
              <tr key={item.id} className="transition-colors hover:bg-muted/20">
                <td className="px-4 py-4 text-center font-medium text-muted-foreground">{index + 1}</td>
                <td className="px-4 py-4">
                  <div className="h-12 w-16 overflow-hidden rounded-md border bg-muted shadow-sm">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={item.imageUrl} alt="CCCD" className="h-full w-full object-cover" />
                  </div>
                </td>
                
                {item.status === 'success' ? (
                  <>
                    <td className="px-2 py-2"><EditableCell item={item} field="fullName" label="Họ và tên" /></td>
                    <td className="px-2 py-2"><EditableCell item={item} field="dateOfBirth" label="Ngày sinh" /></td>
                    <td className="px-2 py-2"><EditableCell item={item} field="address" label="Địa chỉ" /></td>
                    <td className="px-2 py-2"><EditableCell item={item} field="issueDate" label="Ngày cấp" /></td>
                    <td className="px-2 py-2"><EditableCell item={item} field="issuingAuthority" label="Cơ quan cấp" /></td>
                  </>
                ) : (
                  <td colSpan={5} className="px-4 py-4 text-center">
                    <div className="flex flex-col items-center justify-center gap-1 text-destructive">
                      <AlertCircle className="h-5 w-5" />
                      <span className="font-medium">Không thể đọc dữ liệu</span>
                      <span className="text-xs text-muted-foreground">{item.errorMessage}</span>
                    </div>
                  </td>
                )}

                <td className="px-4 py-4 text-center">
                  {item.status === 'success' ? (
                    <CheckCircle2 className="mx-auto h-5 w-5 text-success" />
                  ) : (
                    <AlertCircle className="mx-auto h-5 w-5 text-destructive" />
                  )}
                </td>
                
                <td className="px-4 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleRetry(item)} title="OCR lại">
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                    <Button variant="destructive" size="icon" className="h-8 w-8" onClick={() => removeItem(item.id)} title="Xóa dòng">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            
            {/* Loading rows for processing items */}
            {hasProcessingItems && (
              <tr>
                <td colSpan={9} className="px-4 py-8">
                  <div className="flex flex-col items-center justify-center gap-3 text-muted-foreground">
                    <RefreshCw className="h-6 w-6 animate-spin text-primary" />
                    <p className="text-sm">Đang có ảnh đang được OCR, vui lòng đợi...</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function FileSpreadsheetIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" />
      <path d="M8 13h2" />
      <path d="M8 17h2" />
      <path d="M14 13h2" />
      <path d="M14 17h2" />
    </svg>
  );
}
