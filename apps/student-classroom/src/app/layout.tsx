import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '学员课堂 · 豌豆思维数字人',
  description: '豌豆思维数字人老师小班直播课堂',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
