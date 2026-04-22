import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '教研后台 · 豌豆思维数字人',
  description: '脚本编辑器 · Persona 克隆 · 策略规则',
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
