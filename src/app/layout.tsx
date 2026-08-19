import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { PrinterProvider } from "@/app/pos/printer-context";
import "./globals.css";

const SITE_URL =
  process.env.BETTER_AUTH_URL ?? "http://localhost:3000";

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
  metadataBase: new URL(SITE_URL),
  openGraph: {
    title: "Sagawa POS",
    description: "Sistem Point of Sale yang diperuntukan untuk outlet kemitraan Sagawa Group",
    type: "website",
    locale: "id_ID",
    images: ["/og-image.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Sagawa POS",
    description: "Sistem Point of Sale yang diperuntukan untuk outlet kemitraan Sagawa Group",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={`${inter.variable} ${geistMono.variable} h-full antialiased scrollbar-accent`}
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <PrinterProvider>{children}</PrinterProvider>
        <Toaster />
      </body>
    </html>
  );
}
