import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster"

export const metadata: Metadata = {
  title: "מערכת ניהול",
  description: "מערכת לניהול סידור עבודה",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl">
      {/* הורדתי את כל הפונטים החיצוניים. עכשיו זה ישתמש בפונט ברירת המחדל של המחשב */}
      <body className="antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
