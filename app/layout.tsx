import type { Metadata } from "next";
import { Varela_Round } from "next/font/google"; 
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
      <body className={cn("min-h-screen bg-background antialiased", varela.className)}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
