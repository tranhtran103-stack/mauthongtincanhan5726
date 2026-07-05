'use client';

import React from 'react';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ConfidenceBadgeProps {
  value: number;
  fieldName?: string;
}

export function ConfidenceBadge({ value, fieldName }: ConfidenceBadgeProps) {
  // Lấy giá trị nguyên
  const percentage = Math.round(value);
  
  if (percentage >= 90) {
    return (
      <Badge variant="success" className="h-5 px-1.5 text-[10px] opacity-80 hover:opacity-100">
        <CheckCircle2 className="mr-1 h-3 w-3" />
        {percentage}%
      </Badge>
    );
  }

  if (percentage >= 80) {
    return (
      <Badge variant="warning" className="h-5 px-1.5 text-[10px] opacity-90 hover:opacity-100">
        {percentage}%
      </Badge>
    );
  }

  // < 80%
  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="destructive" className="h-5 cursor-help px-1.5 text-[10px]">
            <AlertTriangle className="mr-1 h-3 w-3" />
            {percentage}%
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-[200px]">
          <p>
            Độ chính xác của trường <strong>{fieldName || 'này'}</strong> khá thấp ({percentage}%).
            Bạn nên kiểm tra lại và chỉnh sửa thủ công nếu cần.
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
