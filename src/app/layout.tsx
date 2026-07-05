import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';

const inter = Inter({ subsets: ['latin', 'vietnamese'] });

export const metadata: Metadata = {
  title: 'CCCD Scanner - Trích xuất thông tin Căn cước công dân',
  description: 'Ứng dụng OCR thông minh giúp trích xuất thông tin từ Căn cước công dân (CCCD) Việt Nam. Tải ảnh lên, tự động nhận dạng và xuất Excel.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body className={`${inter.className} antialiased min-h-screen bg-muted/20`}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
