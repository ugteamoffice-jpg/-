import type { Metadata } from "next";
import { Varela_Round } from "next/font/google"; 
import "./globals.css";
import { Toaster } from "@/components/ui/toaster"

// טעינת הפונט
const varela = Varela_Round({ 
  subsets: ["hebrew", "latin"], 
  weight: "400",
  variable: "--font-varela", // הגדרת משתנה CSS
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
      {/* אנחנו מזריקים את המשתנה לשורש האתר */}
      <body className={varela.variable}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
