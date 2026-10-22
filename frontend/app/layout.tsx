import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "tanyauangku",
  description: "Aplikasi pencatatan keuangan pribadi terintegrasi AI Agent",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`${plusJakartaSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-[#0C0C0E] text-[#F5F5F5] font-sans selection:bg-[rgba(147,197,253,0.35)] selection:text-[#F5F5F5]">
        {children}
      </body>
    </html>
  );
}
