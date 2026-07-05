'use client';

import React, { useEffect } from 'react';
import { useOCRStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Image as ImageIcon, CheckCircle2, XCircle, Clock, Target, FileSpreadsheet } from 'lucide-react';

export function Dashboard() {
  const { stats, recalculateStats, items } = useOCRStore();

  // Cập nhật stats mỗi khi items thay đổi
  useEffect(() => {
    recalculateStats();
  }, [items, recalculateStats]);

  const statCards = [
    {
      title: 'Tổng ảnh xử lý',
      value: stats.totalProcessed,
      icon: <ImageIcon className="h-5 w-5" />,
      color: 'text-primary',
      bg: 'bg-primary/10',
    },
    {
      title: 'Thành công',
      value: stats.successCount,
      icon: <CheckCircle2 className="h-5 w-5" />,
      color: 'text-success',
      bg: 'bg-success/10',
    },
    {
      title: 'Thất bại',
      value: stats.failureCount,
      icon: <XCircle className="h-5 w-5" />,
      color: 'text-destructive',
      bg: 'bg-destructive/10',
    },
    {
      title: 'Thời gian TB',
      value: `${(stats.avgProcessingTime / 1000).toFixed(1)}s`,
      icon: <Clock className="h-5 w-5" />,
      color: 'text-warning',
      bg: 'bg-warning/10',
    },
    {
      title: 'Độ chính xác TB',
      value: `${stats.avgConfidence}%`,
      icon: <Target className="h-5 w-5" />,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
    },
    {
      title: 'Số lần xuất Excel',
      value: stats.excelExportCount,
      icon: <FileSpreadsheet className="h-5 w-5" />,
      color: 'text-green-600 dark:text-green-400',
      bg: 'bg-green-500/10',
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
        {statCards.map((card, i) => (
          <Card key={i} className="overflow-hidden border-none shadow-sm ring-1 ring-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{card.title}</CardTitle>
              <div className={`rounded-full p-2 ${card.bg} ${card.color}`}>
                {card.icon}
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-2xl font-bold tracking-tight text-foreground">{card.value}</div>
            </CardContent>
            
            {/* Decorative gradient blur */}
            <div className={`absolute -right-4 -top-4 h-16 w-16 rounded-full blur-2xl opacity-20 ${card.bg}`} />
          </Card>
        ))}
      </div>
      
      {/* Optional: Add charts here in the future */}
      {stats.totalProcessed === 0 && (
        <div className="flex h-40 items-center justify-center rounded-xl border border-dashed text-muted-foreground">
          Chưa có dữ liệu thống kê. Hãy xử lý vài ảnh CCCD để xem kết quả.
        </div>
      )}
    </div>
  );
}
