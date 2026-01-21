"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus } from "lucide-react"

export function NewRideDialog({ onRideCreated }: { onRideCreated: () => void }) {
  const [open, setOpen] = useState(false)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    // כאן תהיה הלוגיקה של השמירה בעתיד
    setOpen(false)
    onRideCreated()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default" className="gap-2">
          <Plus className="h-4 w-4" />
          נסיעה חדשה
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-right">יצירת נסיעה חדשה</DialogTitle>
          <DialogDescription className="text-right">
            הכנס את פרטי הנסיעה ולחץ על שמור.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-left">
              תיאור
            </Label>
            <Input id="name" className="col-span-3" required />
          </div>
          <DialogFooter>
            <Button type="submit">שמור נסיעה</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
