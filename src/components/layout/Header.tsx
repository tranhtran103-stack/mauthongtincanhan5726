'use client';

import * as React from 'react';
import { ScanLine, Moon, Sun } from 'lucide-react';
import { useOCRStore } from '@/lib/store';
import { Switch } from '@/components/ui/switch';

export function Header() {
  const { isDarkMode, toggleDarkMode } = useOCRStore();

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur-md glass">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <ScanLine className="h-6 w-6" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-xl font-bold tracking-tight gradient-text hidden sm:block">CCCD Scanner</h1>
            <h1 className="text-xl font-bold tracking-tight gradient-text sm:hidden">CCCD</h1>
            <p className="text-xs text-muted-foreground hidden sm:block">Trích xuất thông tin Căn cước công dân thông minh</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 rounded-full border bg-muted/50 px-3 py-1.5">
            <Sun className="h-4 w-4 text-muted-foreground" />
            <Switch
              checked={isDarkMode}
              onCheckedChange={toggleDarkMode}
              aria-label="Toggle dark mode"
            />
            <Moon className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>
      </div>
    </header>
  );
}
