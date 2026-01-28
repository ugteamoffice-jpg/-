import type { Metadata } from "next";
import { Varela_Round } from "next/font/google"; // ייבוא הפונט
import "./globals.css";
import { Toaster } from "@/components/ui/toaster"
import { cn } from "@/lib/utils"

// הגדרת הפונט
const varela = Varela_Round({ 
  subsets: ["hebrew", "latin"], 
  weight: "400",
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
      {/* תיקון: הסרתי את 'font-sans' שמחפש את הקובץ החסר.
         הוספתי את 'varela.className' שמחיל את הפונט ישירות על כל האתר.
      */}
      <body className={cn("min-h-screen bg-background antialiased", varela.className)}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
