import type { Metadata } from "next";
import "./globals.css";
import { Inter, Playfair_Display } from "next/font/google";
import AmplitudeTracker from "./components/AmplitudeTracker";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-serif" });

export const metadata: Metadata = {
    title: "오뉴 | 오피니언 뉴스레터",
    description: "진짜를 보는 단 하나의 관점. 전문가들의 인사이트를 매일 아침 배달합니다.",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="ko" className={`${inter.variable} ${playfair.variable}`}>
            <body className={inter.className}>
                {children}
                <AmplitudeTracker />
            </body>
        </html>
    );
}
