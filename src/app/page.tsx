'use client';

import React, { useEffect, useState } from 'react';
import { Upload, Table as TableIcon, BarChart3, FileSpreadsheet, Trash2, Play } from 'lucide-react';
import { useOCRStore } from '@/lib/store';
import { useOCR } from '@/hooks/useOCR';
import { useExcelExport } from '@/hooks/useExcelExport';

import { Header } from '@/components/layout/Header';
import { DropZone } from '@/components/upload/DropZone';
import { ImagePreview } from '@/components/upload/ImagePreview';
import { ResultsTable } from '@/components/results/ResultsTable';
import { BatchProgress } from '@/components/progress/BatchProgress';
import { Dashboard } from '@/components/dashboard/Dashboard';

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';

export default function Home() {
  const { setDarkMode, items, clearAll } = useOCRStore();
  const { processImages, isProcessing } = useOCR();
  const { exportToExcel, isExporting } = useExcelExport();
  
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  
  // Khởi tạo dark mode từ localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setDarkMode(true);
    } else {
      setDarkMode(false);
    }
  }, [setDarkMode]);

  const handleFilesSelected = (files: File[]) => {
    setSelectedFiles(prev => [...prev, ...files]);
  };

  const startOCR = () => {
    if (selectedFiles.length > 0) {
      processImages(selectedFiles);
      setSelectedFiles([]); // Clear queue sau khi đưa vào xử lý
    }
  };

  const hasSuccessItems = items.some(item => item.status === 'success');
  const pendingCount = selectedFiles.length;

  return (
    <>
      <Header />
      
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Tabs defaultValue="upload" className="w-full">
          <TabsList className="mb-8 grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              <span className="hidden sm:inline">Tải ảnh</span>
            </TabsTrigger>
            <TabsTrigger value="results" className="flex items-center gap-2">
              <TableIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Kết quả</span>
            </TabsTrigger>
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Thống kê</span>
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: UPLOAD & PROCESS */}
          <TabsContent value="upload" className="space-y-6 focus-visible:outline-none focus-visible:ring-0">
            <DropZone onFilesSelected={handleFilesSelected} disabled={isProcessing} />
            
            {/* Thanh công cụ khi có file chờ */}
            {pendingCount > 0 && (
              <div className="flex flex-col items-center justify-between gap-4 rounded-xl border bg-card p-4 shadow-sm sm:flex-row animate-fade-in">
                <div className="text-sm font-medium text-muted-foreground">
                  Đã chọn <strong className="text-foreground">{pendingCount}</strong> ảnh chờ xử lý
                </div>
                <div className="flex w-full gap-3 sm:w-auto">
                  <Button variant="outline" className="w-full sm:w-auto" onClick={() => setSelectedFiles([])} disabled={isProcessing}>
                    Hủy bỏ
                  </Button>
                  <Button className="w-full sm:w-auto" onClick={startOCR} disabled={isProcessing}>
                    <Play className="mr-2 h-4 w-4 fill-current" /> Bắt đầu OCR
                  </Button>
                </div>
              </div>
            )}

            <BatchProgress />

            {items.length > 0 && (
              <div className="mt-8 rounded-xl border bg-card p-6 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-semibold tracking-tight">Trạng thái xử lý</h2>
                  <Button variant="ghost" size="sm" onClick={clearAll} className="text-muted-foreground hover:text-destructive" disabled={isProcessing}>
                    <Trash2 className="mr-2 h-4 w-4" /> Xóa tất cả
                  </Button>
                </div>
                <ImagePreview items={items} onRemove={(id) => useOCRStore.getState().removeItem(id)} />
              </div>
            )}
          </TabsContent>

          {/* TAB 2: RESULTS */}
          <TabsContent value="results" className="space-y-6 focus-visible:outline-none focus-visible:ring-0">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">Kết quả trích xuất</h2>
                <p className="text-sm text-muted-foreground mt-1">Bạn có thể nhấp vào từng ô để chỉnh sửa dữ liệu nếu AI nhận dạng sai.</p>
              </div>
              <Button onClick={exportToExcel} disabled={!hasSuccessItems || isExporting} variant="default" className="shadow-md">
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                {isExporting ? 'Đang xuất...' : 'Xuất Excel'}
              </Button>
            </div>
            
            <ResultsTable />
          </TabsContent>

          {/* TAB 3: DASHBOARD */}
          <TabsContent value="dashboard" className="focus-visible:outline-none focus-visible:ring-0">
             <div className="mb-6">
                <h2 className="text-2xl font-bold tracking-tight">Thống kê hiệu suất</h2>
                <p className="text-sm text-muted-foreground mt-1">Theo dõi số lượng ảnh đã xử lý và độ chính xác của mô hình AI.</p>
              </div>
            <Dashboard />
          </TabsContent>
        </Tabs>
      </main>
    </>
  );
}
