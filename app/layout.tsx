import type { Metadata } from "next";
import { Varela_Round } from "next/font/google"; // 1. ייבוא הפונט
import "./globals.css";
import { Toaster } from "@/components/ui/toaster"
import { cn } from "@/lib/utils"

// 2. הגדרת הפונט עם תמיכה בעברית
const varela = Varela_Round({ 
  subsets: ["hebrew", "latin"], 
  weight: "400",
  variable: "--font-varela", // הגדרת שם משתנה לשימוש ב-Tailwind
});

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
      {/* 3. שימוש במשתנה הפונט ובמחלקה font-sans שמחילה אותו על הכל */}
      <body className={cn("min-h-screen bg-background font-sans antialiased", varela.variable)}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
