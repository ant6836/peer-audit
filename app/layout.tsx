import type { Metadata } from "next";
import { Noto_Sans_KR, Noto_Serif_KR } from "next/font/google";
import "./globals.css";

// 본문·UI — 한글 대응 산세리프 (DESIGN.md: Inter 대체)
const notoSans = Noto_Sans_KR({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-sans",
  display: "swap",
});

// 헤드라인 — 한글 대응 라이트 세리프 (DESIGN.md: Waldenburg 300 대체)
const notoSerif = Noto_Serif_KR({
  subsets: ["latin"],
  weight: ["300", "400"],
  variable: "--font-serif",
  display: "swap",
});

export const metadata: Metadata = {
  title: "동종기업 분석",
  description: "기업을 검색하고 같은 업종의 동종기업을 찾아봅니다.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={`${notoSans.variable} ${notoSerif.variable}`}>
      <body>{children}</body>
    </html>
  );
}
