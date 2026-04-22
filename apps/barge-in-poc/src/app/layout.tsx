import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Barge-in PoC · 豌豆思维数字人',
  description: 'W0 · 声网优雅打断验证',
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
