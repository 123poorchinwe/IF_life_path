import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {title:"IF人生线：未开放区域",description:"用真实经历生成职业路径，在有限信息中作出更清醒、可验证的选择。"};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
