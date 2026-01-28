import type { Metadata } from "next";
import { Varela_Round } from "next/font/google"; // ייבוא הפונט ורלה מעוגל
import "./globals.css";
import { Toaster } from "@/components/ui/toaster"

// הגדרת הפונט ורלה מעוגל
const varela = Varela_Round({ 
  weight: "400", 
  subsets: ["hebrew", "latin"] 
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
      <body className={varela.className}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
