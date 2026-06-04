import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const snPro = localFont({
  src: [
    {
      path: "./fonts/SNPro-Variable.ttf",
      style: "normal",
      weight: "200 900",
    },
    {
      path: "./fonts/SNPro-Italic-Variable.ttf",
      style: "italic",
      weight: "200 900",
    },
  ],
  variable: "--font-sn-pro",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Colton Almeida | Portfolio",
  description:
    "Colton Almeida is a Computer Engineering student at the University of Toronto, building projects across software, hardware, and AI.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${snPro.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
