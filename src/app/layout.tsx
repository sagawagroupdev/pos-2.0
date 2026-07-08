import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import { GooeyToaster } from "@/components/ui/gooey-toaster";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Sagawa POS",
  description: "Sistem Point of Sale yang diperuntukan untuk outlet kemitraan Sagawa Group",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={`${inter.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        {children}
        <GooeyToaster position="top-center" />
      </body>
    </html>
  );
}
