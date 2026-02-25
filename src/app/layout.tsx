import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { DistributorProvider } from "@/lib/theme-context";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "스타트봇 - 스타트톡 자동 카카오톡 발송기",
  description: "스타트봇, 스타트톡 자동 카카오톡 발송기",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <meta name="google-site-verification" content="-HNEBwIb0Lf1XeUPhWW967b501oZRQBGnSNJf6QITTk" />
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <DistributorProvider>
          {children}
        </DistributorProvider>
      </body>
    </html>
  );
}
