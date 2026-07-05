'use client';

import * as React from 'react';
import { X, AlertCircle, CheckCircle2, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Toast as ToastProps } from './use-toast';

export function Toast({ id, title, description, variant = 'default', onClose }: ToastProps & { onClose: (id: string) => void }) {
  const [isClosing, setIsClosing] = React.useState(false);

  // Xử lý animation khi đóng
  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose(id);
    }, 300); // Đợi animation slide-out chạy xong
  };

  const getIcon = () => {
    switch (variant) {
      case 'destructive': return <AlertCircle className="h-5 w-5 text-destructive" />;
      case 'success': return <CheckCircle2 className="h-5 w-5 text-success" />;
      default: return <Info className="h-5 w-5 text-primary" />;
    }
  };

  const variantStyles = {
    default: 'border-l-primary',
    destructive: 'border-l-destructive',
    success: 'border-l-success',
  };

  return (
    <div
      className={cn(
        'group pointer-events-auto relative flex w-full items-start justify-between space-x-4 overflow-hidden rounded-md border border-l-4 bg-popover p-4 pr-8 text-popover-foreground shadow-lg transition-all',
        variantStyles[variant],
        isClosing ? 'animate-out slide-out-to-right fade-out' : 'animate-in slide-in-from-right fade-in zoom-in-95'
      )}
    >
      <div className="flex gap-3">
        <div className="mt-0.5 shrink-0">{getIcon()}</div>
        <div className="grid gap-1">
          {title && <div className="text-sm font-semibold">{title}</div>}
          {description && <div className="text-sm opacity-90">{description}</div>}
        </div>
      </div>
      <button
        onClick={handleClose}
        className="absolute right-2 top-2 rounded-md p-1 text-foreground/50 opacity-0 transition-opacity hover:text-foreground focus:opacity-100 focus:outline-none focus:ring-2 group-hover:opacity-100"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
