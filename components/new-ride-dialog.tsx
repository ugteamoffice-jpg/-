"use client"

import * as React from "react"
import { Plus, Calendar as CalendarIcon, Loader2, Save, Upload, Clock } from "lucide-react"
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"

// סוג פריט לרשימות בחירה
interface ListItem {
  id: string
  title: string
}

// --- רכיב עזר: שדה השלמה אוטומטית (חיפוש בלבד) ---
function AutoComplete({ 
  options, 
  value, 
  onChange, 
  placeholder 
}: { 
  options: ListItem[], 
  value: string, 
  onChange: (val: string) => void, 
  placeholder: string 
}) {
  const [showList, setShowList] = React.useState(false)
  const [filteredOptions, setFilteredOptions] = React.useState<ListItem[]>([])
  const wrapperRef = React.useRef<HTMLDivElement>(null)

  // לוגיקת סינון: מציג רשימה רק אם יש טקסט
  React.useEffect(() => {
    if (!value || value.trim() === "") {
      setFilteredOptions([])
      setShowList(false)
    } else {
      const filtered = options.filter(opt => 
        opt.title.toLowerCase().includes(value.toLowerCase())
      )
      setFilteredOptions(filtered)
      // מציג את הרשימה רק אם מצאנו התאמות
      setShowList(filtered.length > 0)
    }
  }, [value, options])

  // סגירת הרשימה כשלוחצים בחוץ
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowList(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <div ref={wrapperRef} className="relative w-full">
      <Input 
        value={value}
        onChange={(e) => onChange(e.target.value)}
        // הורדתי את onFocus כדי שלא ייפתח סתם
        className="text-right"
        placeholder={placeholder}
        autoComplete="off"
      />
      
      {showList && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 shadow-md max-h-[200px] overflow-y-auto rounded-sm">
          {filteredOptions.map((option) => (
            <div
              key={option.id}
              className="px-3 py-2 text-right text-sm cursor-pointer hover:bg-gray-100 transition-colors border-b last:border-0 border-gray-100 text-black"
              onMouseDown={() => {
                onChange(option.title) // בחירה
                setShowList(false) // סגירה מיידית
              }}
            >
              {option.title}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// --- הרכיב הראשי ---
export function NewRideDialog({ onRideCreated }: { onRideCreated: () => void }) {
  const [open, setOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const { toast } = useToast()

  // State
  const [date, setDate] = React.useState<Date>(new Date())
  const [vatRate, setVatRate] = React.useState("18") 

  // --- דאטה דינמי מהטבלאות ---
  const [customersList, setCustomersList] = React.useState<ListItem[]>([])
  const [driversList, setDriversList] = React.useState<ListItem[]>([])
  const [vehiclesList, setVehiclesList] = React.useState<ListItem[]>([])

  // פונקציית עזר לחילוץ שם רשומה
  const getRecordName = (record: any) => {
      if (!record.fields) return record.id;
      const values = Object.values(record.fields);
      return values.length > 0 ? String(values[0]) : record.id;
  };

  // טעינת נתונים
  React.useEffect(() => {
    if (open) {
        // משיכת לקוחות
        fetch('/api/customers').then(res => res.json()).then(data => {
            if (data.records) setCustomersList(data.records.map((r: any) => ({ id: r.id, title: getRecordName(r) })));
        }).catch(console.error);

        // משיכת נהגים
        fetch('/api/drivers').then(res => res.json()).then(data => {
            if (data.records) setDriversList(data.records.map((r: any) => ({ id: r.id, title: getRecordName(r) })));
        }).catch(console.error);

        // משיכת רכבים
        fetch('/api/vehicles').then(res => res.json()).then(data => {
            if (data.records) setVehiclesList(data.records.map((r: any) => ({ id: r.id, title: getRecordName(r) })));
        }).catch(console.error);
    }
  }, [open])


  // שדות הטופס
  const [formData, setFormData] = React.useState({
    customer: "",
    description: "",
    pickupTime: "", 
    dropoffTime: "", 
    vehicleType: "",
    driver: "",
    vehicleNumber: "",
    notesDriver: "",
    
    // שדות נוספים
    orderingName: "",
    mobile: "",
    idNumber: "",
  })

  const [file, setFile] = React.useState<File | null>(null)

  // מחירים
  const [prices, setPrices] = React.useState({
    clientExcl: "",
    clientIncl: "",
    driverExcl: "",
    driverIncl: "",
  })

  // --- לוגיקת חישוב מע"מ ---
  const calculateVat = (value: string, type: 'excl' | 'incl', field: 'client' | 'driver') => {
    const numVal = parseFloat(value)
    const rate = 1 + (parseFloat(vatRate) / 100)

    if (isNaN(numVal)) {
      setPrices(prev => ({ ...prev, [`${field}Excl`]: "", [`${field}Incl`]: "" }))
      return
    }

    if (type === 'excl') {
      const incl = (numVal * rate).toFixed(2)
      setPrices(prev => ({ ...prev, [`${field}Excl`]: value, [`${field}Incl`]: incl }))
    } else {
      const excl = (numVal / rate).toFixed(2)
      setPrices(prev => ({ ...prev, [`${field}Incl`]: value, [`${field}Excl`]: excl }))
    }
  }

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'excl' | 'incl', field: 'client' | 'driver') => {
    calculateVat(e.target.value, type, field)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.description || !formData.pickupTime) {
        toast({ title: "נא למלא שדות חובה (תיאור, שעת התייצבות)", variant: "destructive" })
        return
    }

    setLoading(true)

    try {
      const payload = {
        fields: {
          fldvNsQbfzMWTc7jakp: format(date, "yyyy-MM-dd"), 
          fldA6e7ul57abYgAZDh: formData.description,
          fldLbXMREYfC8XVIghj: formData.pickupTime, 
          fld56G8M1LyHRRROWiL: formData.dropoffTime, 
          fldx4hl8FwbxfkqXf0B: formData.vehicleType, 
          flddNPbrzOCdgS36kx5: formData.driver,
          fldqStJV3KKIutTY9hW: formData.vehicleNumber, 
          fldhNoiFEkEgrkxff02: formData.notesDriver,
          fldVy6L2DCboXUTkjBX: formData.customer, 
          
          fldxXnfHHQWwXY8dlEV: Number(prices.clientExcl) || 0,
          fldT7QLSKmSrjIHarDb: Number(prices.clientIncl) || 0,
          fldSNuxbM8oJfrQ3a9x: Number(prices.driverExcl) || 0,
          fldyQIhjdUeQwtHMldD: Number(prices.driverIncl) || 0,

          fldkvTaql1bPbifVKLt: formData.orderingName,
          fld6NJPsiW8CtRIfnaY: formData.mobile,
          fldAJPcCFUcDPlSCK1a: formData.idNumber,
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
      onRideCreated()
      
      // איפוס
      setFormData({
        customer: "", description: "", pickupTime: "", dropoffTime: "", vehicleType: "",
        driver: "", vehicleNumber: "", notesDriver: "", orderingName: "", mobile: "", idNumber: ""
      })
      setPrices({ clientExcl: "", clientIncl: "", driverExcl: "", driverIncl: "" })
      setFile(null)
      setDate(new Date())

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
        <Button className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus className="h-4 w-4" />
          נסיעה חדשה
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[700px] h-[80vh] flex flex-col" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-right">יצירת נסיעה חדשה</DialogTitle>
          <DialogDescription className="text-right">
            מלא את הפרטים בשדות ולחץ על שמירה.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex-1 overflow-hidden flex flex-col">
          <Tabs defaultValue="details" className="flex-1 flex flex-col overflow-hidden">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="details">פרטי נסיעה</TabsTrigger>
              <TabsTrigger value="prices">מחירים</TabsTrigger>
              <TabsTrigger value="extra">פרטים נוספים</TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-y-auto p-4 border rounded-md mt-2">
              
              {/* === טאב 1: פרטי נסיעה === */}
              <TabsContent value="details" className="space-y-4 mt-0">
                
                {/* תאריך (חובה) */}
                <div className="space-y-2">
                  <Label className="text-right block">תאריך <span className="text-red-500">*</span></Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant={"outline"} className={cn("w-full justify-start text-right font-normal", !date && "text-muted-foreground")}>
                        <CalendarIcon className="ml-2 h-4 w-4" />
                        {date ? format(date, "PPP", { locale: he }) : <span>בחר תאריך</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="end">
                      <Calendar mode="single" selected={date} onSelect={(d) => d && setDate(d)} initialFocus locale={he} dir="rtl" />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* תיאור (חובה) */}
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-right block">תיאור <span className="text-red-500">*</span></Label>
                  <Textarea id="description" name="description" value={formData.description} onChange={handleChange} className="text-right resize-none" rows={2} />
                </div>

                {/* התייצבות (חובה) - שעון */}
                <div className="space-y-2">
                  <Label htmlFor="pickupTime" className="text-right block">שעת התייצבות <span className="text-red-500">*</span></Label>
                  <div className="relative">
                    <Input 
                        id="pickupTime" 
                        name="pickupTime" 
                        type="time" 
                        value={formData.pickupTime} 
                        onChange={handleChange} 
                        className="text-right" 
                    />
                  </div>
                </div>

                {/* חזור - שעון */}
                <div className="space-y-2">
                  <Label htmlFor="dropoffTime" className="text-right block">שעת חזור</Label>
                  <div className="relative">
                    <Input 
                        id="dropoffTime" 
                        name="dropoffTime" 
                        type="time" 
                        value={formData.dropoffTime} 
                        onChange={handleChange} 
                        className="text-right" 
                    />
                  </div>
                </div>

                {/* סוג רכב - השלמה אוטומטית */}
                <div className="space-y-2">
                  <Label className="text-right block">סוג רכב</Label>
                  <AutoComplete 
                    options={vehiclesList} 
                    value={formData.vehicleType} 
                    onChange={(val) => setFormData(prev => ({ ...prev, vehicleType: val }))} 
                    placeholder="בחר או הקלד סוג רכב..." 
                  />
                </div>

                {/* שם לקוח - השלמה אוטומטית */}
                <div className="space-y-2">
                  <Label className="text-right block">שם לקוח</Label>
                  <AutoComplete 
                    options={customersList} 
                    value={formData.customer} 
                    onChange={(val) => setFormData(prev => ({ ...prev, customer: val }))} 
                    placeholder="בחר או הקלד לקוח..." 
                  />
                </div>

                {/* שם נהג - השלמה אוטומטית */}
                <div className="space-y-2">
                  <Label className="text-right block">שם נהג</Label>
                  <AutoComplete 
                    options={driversList} 
                    value={formData.driver} 
                    onChange={(val) => setFormData(prev => ({ ...prev, driver: val }))} 
                    placeholder="בחר או הקלד נהג..." 
                  />
                </div>

                {/* מספר רכב */}
                <div className="space-y-2">
                  <Label htmlFor="vehicleNumber" className="text-right block">מספר רכב</Label>
                  <Input id="vehicleNumber" name="vehicleNumber" value={formData.vehicleNumber} onChange={handleChange} className="text-right" />
                </div>

                {/* הערות לנהג */}
                <div className="space-y-2">
                  <Label htmlFor="notesDriver" className="text-right block">הערות לנהג</Label>
                  <Textarea id="notesDriver" name="notesDriver" value={formData.notesDriver} onChange={handleChange} className="text-right resize-none" rows={2} />
                </div>

                {/* טופס הזמנה (קובץ) */}
                <div className="space-y-2">
                  <Label htmlFor="orderForm" className="text-right block">טופס הזמנה</Label>
                  <Input 
                    id="orderForm" 
                    type="file" 
                    onChange={handleFileChange}
                    className="text-right cursor-pointer" 
                  />
                </div>
              </TabsContent>

              {/* === טאב 2: מחירים === */}
              <TabsContent value="prices" className="space-y-6 mt-0">
                <div className="flex items-center gap-2 p-2 bg-secondary/30 rounded-md w-fit">
                    <Label htmlFor="vatRate">אחוז מע"מ:</Label>
                    <Input id="vatRate" value={vatRate} onChange={(e) => setVatRate(e.target.value)} className="w-16 h-8 text-center" />
                    <span className="text-sm">%</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4 p-4 border rounded-lg bg-blue-50/50">
                        <h3 className="font-bold text-blue-700 text-center border-b pb-2">מחיר לקוח</h3>
                        <div className="space-y-2">
                            <Label>לפני מע"מ</Label>
                            <Input type="number" value={prices.clientExcl} onChange={(e) => handlePriceChange(e, 'excl', 'client')} className="text-right bg-white" />
                        </div>
                        <div className="space-y-2">
                            <Label>כולל מע"מ</Label>
                            <Input type="number" value={prices.clientIncl} onChange={(e) => handlePriceChange(e, 'incl', 'client')} className="text-right font-bold bg-white" />
                        </div>
                    </div>

                    <div className="space-y-4 p-4 border rounded-lg bg-orange-50/50">
                        <h3 className="font-bold text-orange-700 text-center border-b pb-2">מחיר נהג</h3>
                        <div className="space-y-2">
                            <Label>לפני מע"מ</Label>
                            <Input type="number" value={prices.driverExcl} onChange={(e) => handlePriceChange(e, 'excl', 'driver')} className="text-right bg-white" />
                        </div>
                        <div className="space-y-2">
                            <Label>כולל מע"מ</Label>
                            <Input type="number" value={prices.driverIncl} onChange={(e) => handlePriceChange(e, 'incl', 'driver')} className="text-right font-bold bg-white" />
                        </div>
                    </div>
                </div>
              </TabsContent>

              {/* === טאב 3: פרטים נוספים === */}
              <TabsContent value="extra" className="space-y-4 mt-0">
                 <div className="space-y-2">
                    <Label htmlFor="orderingName" className="text-right block">שם מזמין</Label>
                    <Input id="orderingName" name="orderingName" value={formData.orderingName} onChange={handleChange} className="text-right" />
                 </div>
                 <div className="space-y-2">
                    <Label htmlFor="mobile" className="text-right block">טלפון נייד</Label>
                    <Input id="mobile" name="mobile" value={formData.mobile} onChange={handleChange} className="text-right" />
                 </div>
                 <div className="space-y-2">
                    <Label htmlFor="idNumber" className="text-right block">תעודת זהות</Label>
                    <Input id="idNumber" name="idNumber" value={formData.idNumber} onChange={handleChange} className="text-right" />
                 </div>
              </TabsContent>

            </div>
          </Tabs>

          <DialogFooter className="mt-4 gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>ביטול</Button>
            <Button type="submit" disabled={loading} className="bg-primary min-w-[120px]">
              {loading ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : <Save className="ml-2 h-4 w-4" />}
              שמור נסיעה
            </Button>
          </DialogFooter>

        </form>
      </DialogContent>
    </Dialog>
  )
}
