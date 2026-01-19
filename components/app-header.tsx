"use client"

import { Button } from "@/components/ui/button"
import { Database } from "lucide-react"

type PageType = "work-schedule" | "customers" | "drivers" | "vehicles"

interface AppHeaderProps {
  activePage: PageType
  onPageChange: (page: PageType) => void
}

export function AppHeader({ activePage, onPageChange }: AppHeaderProps) {
  const navItems = [
    { id: "work-schedule" as PageType, label: "סידור עבודה" },
    { id: "customers" as PageType, label: "לקוחות" },
    { id: "drivers" as PageType, label: "נהגים" },
    { id: "vehicles" as PageType, label: "רכבים" },
  ]

  return (
    <div className="border-b border-border bg-card" dir="rtl">
      {/* Top header with logo */}
      <div className="border-b border-border/50 px-6 py-4">
        <div className="flex items-center gap-3">
          <Database className="h-8 w-8 text-primary" />
          <h1 className="text-2xl font-bold">מערכת ניהול</h1>
        </div>
      </div>

      {/* Navigation menu */}
      <div className="px-6 py-2">
        <nav className="flex gap-2">
          {navItems.map((item) => (
            <Button
              key={item.id}
              variant="ghost"
              onClick={() => onPageChange(item.id)}
              className={`hover:bg-accent hover:text-accent-foreground ${
                activePage === item.id ? "bg-accent text-accent-foreground" : ""
              }`}
            >
              {item.label}
            </Button>
          ))}
        </nav>
      </div>
    </div>
  )
}
