"use client"

import * as React from "react"
import { Plus, Calendar as CalendarIcon, Loader2 } from "lucide-react"
import { format } from "date-fns"
import { he } from "date-fns/locale"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"

export function NewRideDialog({ onRideCreated }: { onRideCreated: () => void }) {
  const [open, setOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const { toast } = useToast()

  // State לכל השדות בטופס
  const [formData, setFormData] = React.useState({
    date: new Date(),
    customer: "",
    vehicleType: "",
    driver: "",
    vehicleNumber: "",
    pickup: "",
    dropoff: "",
    description: "",
    priceClientPlusVat: "",
    priceClientFull: "",
    priceDriverPlusVat: "",
    priceDriverFull: "",
  })

  // טיפול בשינוי שדות טקסט
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  // טיפול בשינוי תאריך
  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setFormData((prev) => ({ ...prev, date: date }))
    }
  }

  // שליחת הטופס
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // כאן אנחנו ממירים את השדות למבנה שה-API מצפה לו (לפי ה-ID של הטבלה)
      const payload = {
        fields: {
          fldvNsQbfzMWTc7jakp: format(formData.date, "yyyy-MM-dd"), // תאריך
          fldVy6L2DCboXUTkjBX: formData.customer, // לקוח (כרגע כטקסט, בהמשך נהפוך לקישור)
          fldx4hl8FwbxfkqXf0B: formData.vehicleType, // סוג רכב
          flddNPbrzOCdgS36kx5: formData.driver, // נהג
          fldqStJV3KKIutTY9hW: formData.vehicleNumber, // מספר רכב
          fldLbXMREYfC8XVIghj: formData.pickup, // התייצבות
          fld56G8M1LyHRRROWiL: formData.dropoff, // חזור/יעד
          fldA6e7ul57abYgAZDh: formData.description, // תיאור
          
          // מספרים - המרה ל-Number או 0 אם ריק
          fldxXnfHHQWwXY8dlEV: Number(formData.priceClientPlusVat) || 0,
          fldT7QLSKmSrjIHarDb: Number(formData.priceClientFull) || 0,
          fldSNuxbM8oJfrQ3a9x: Number(formData.priceDriverPlusVat) || 0,
          fldyQIhjdUeQwtHMldD: Number(formData.priceDriverFull) || 0,
        }
      }

      const response = await fetch("/api/work-schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!response.ok) throw new Error("Failed to create record")

      toast({ title: "הנסיעה נוצרה בהצלחה!" })
      setOpen(false)
      onRideCreated() // רענון הטבלה הראשית
      
      // איפוס הטופס
      setFormData({
        date: new Date(),
        customer: "",
        vehicleType: "",
        driver: "",
        vehicleNumber: "",
        pickup: "",
        dropoff: "",
        description: "",
        priceClientPlusVat: "",
        priceClientFull: "",
        priceDriverPlusVat: "",
        priceDriverFull: "",
      })

    } catch (error) {
      console.error(error)
      toast({ title: "שגיאה ביצירת נסיעה", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-black hover:bg-gray-800 text-white gap-2">
          <Plus className="h-4 w-4" />
          נסיעה חדשה
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">יצירת נסיעה חדשה</DialogTitle>
          <DialogDescription>
            מלא את פרטי הנסיעה ולחץ על שמור.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          
          {/* --- חלק 1: פרטים כלליים --- */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-muted-foreground border-b pb-1">פרטים כלליים</h3>
            <div className="grid grid-cols-2 gap-4">
              
              {/* תאריך */}
              <div className="space-y-2 flex flex-col">
                <Label>תאריך</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-right font-normal",
                        !formData.date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="ml-2 h-4 w-4" />
                      {formData.date ? format(formData.date, "PPP", { locale: he }) : <span>בחר תאריך</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="end">
                    <Calendar
                      mode="single"
                      selected={formData.date}
                      onSelect={handleDateSelect}
                      initialFocus
                      locale={he}
                      dir="rtl"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* לקוח */}
              <div className="space-y-2">
                <Label htmlFor="customer">שם לקוח</Label>
                <Input id="customer" name="customer" value={formData.customer} onChange={handleChange} placeholder="הכנס שם לקוח" />
              </div>

              {/* נהג */}
              <div className="space-y-2">
                <Label htmlFor="driver">שם נהג</Label>
                <Input id="driver" name="driver" value={formData.driver} onChange={handleChange} placeholder="בחר נהג" />
              </div>

              {/* סוג רכב */}
              <div className="space-y-2">
                <Label htmlFor="vehicleType">סוג רכב</Label>
                <Input id="vehicleType" name="vehicleType" value={formData.vehicleType} onChange={handleChange} placeholder="לדוגמה: אוטובוס" />
              </div>

               {/* מספר רכב */}
               <div className="space-y-2">
                <Label htmlFor="vehicleNumber">מספר רכב</Label>
                <Input id="vehicleNumber" name="vehicleNumber" value={formData.vehicleNumber} onChange={handleChange} placeholder="12-345-67" />
              </div>
            </div>
          </div>

          {/* --- חלק 2: מסלול --- */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-muted-foreground border-b pb-1">מסלול</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pickup">מקום התייצבות</Label>
                <Input id="pickup" name="pickup" value={formData.pickup} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dropoff">יעד / חזור</Label>
                <Input id="dropoff" name="dropoff" value={formData.dropoff} onChange={handleChange} />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">תיאור נסיעה</Label>
              <Textarea 
                id="description" 
                name="description" 
                value={formData.description} 
                onChange={handleChange} 
                className="resize-none"
                rows={3}
              />
            </div>
          </div>

          {/* --- חלק 3: כספים --- */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-muted-foreground border-b pb-1">כספים</h3>
            <div className="grid grid-cols-2 gap-6">
              
              {/* צד לקוח */}
              <div className="space-y-2 p-3 bg-muted/20 rounded-md border">
                <div className="space-y-2">
                  <Label htmlFor="priceClientPlusVat">מחיר לקוח + מע"מ</Label>
                  <Input type="number" id="priceClientPlusVat" name="priceClientPlusVat" value={formData.priceClientPlusVat} onChange={handleChange} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="priceClientFull">מחיר לקוח כולל מע"מ</Label>
                  <Input type="number" id="priceClientFull" name="priceClientFull" value={formData.priceClientFull} onChange={handleChange} />
                </div>
              </div>

              {/* צד נהג */}
              <div className="space-y-2 p-3 bg-muted/20 rounded-md border">
                <div className="space-y-2">
                  <Label htmlFor="priceDriverPlusVat">מחיר נהג + מע"מ</Label>
                  <Input type="number" id="priceDriverPlusVat" name="priceDriverPlusVat" value={formData.priceDriverPlusVat} onChange={handleChange} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="priceDriverFull">מחיר נהג כולל מע"מ</Label>
                  <Input type="number" id="priceDriverFull" name="priceDriverFull" value={formData.priceDriverFull} onChange={handleChange} />
                </div>
              </div>

            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>ביטול</Button>
            <Button type="submit" disabled={loading} className="bg-primary">
              {loading && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
              שמור נסיעה
            </Button>
          </DialogFooter>

        </form>
      </DialogContent>
    </Dialog>
  )
}
