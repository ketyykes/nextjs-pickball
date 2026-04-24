import type { Metadata } from "next";
import { Noto_Sans_TC, Bebas_Neue, Outfit } from "next/font/google";
import "./globals.css";

// 主文本字型：繁體中文（需啟用 latin subset 作為 fallback）
const notoSansTc = Noto_Sans_TC({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700", "900"],
  variable: "--font-noto-sans-tc",
  display: "swap",
});

// 標題用展示字型
const bebasNeue = Bebas_Neue({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-bebas-neue",
  display: "swap",
});

// UI 標籤字型
const outfit = Outfit({
  subsets: ["latin"],
  weight: ["300", "400", "600", "700", "800", "900"],
  variable: "--font-outfit",
  display: "swap",
});

export const metadata: Metadata = {
  title: "匹克球新手完全入門：規則與球拍選購一次搞懂",
  description: "規則與球拍選購一次搞懂的匹克球新手完整指南",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="zh-Hant"
      className={`${notoSansTc.variable} ${bebasNeue.variable} ${outfit.variable} antialiased`}
    >
      <body>{children}</body>
    </html>
  );
}
