"use client"

import * as React from "react"
import { Plus, Calendar as CalendarIcon, Loader2, Save, Pencil } from "lucide-react"
import { format, parseISO } from "date-fns"
import { he } from "date-fns/locale"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
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

// מזהי השדות ב-Teable
const FIELDS = {
  DATE: 'fldvNsQbfzMWTc7jakp',
  CUSTOMER: 'fldVy6L2DCboXUTkjBX',
  DESCRIPTION: 'fldA6e7ul57abYgAZDh',
  PICKUP_TIME: 'fldLbXMREYfC8XVIghj',
  DROPOFF_TIME: 'fld56G8M1LyHRRROWiL',
  VEHICLE_TYPE: 'fldx4hl8FwbxfkqXf0B',
  DRIVER: 'flddNPbrzOCdgS36kx5',
  VEHICLE_NUM: 'fldqStJV3KKIutTY9hW',
  DRIVER_NOTES: 'fldhNoiFEkEgrkxff02',
  PRICE_CLIENT_EXCL: 'fldxXnfHHQWwXY8dlEV',
  PRICE_CLIENT_INCL: 'fldT7QLSKmSrjIHarDb',
  PRICE_DRIVER_EXCL: 'fldSNuxbM8oJfrQ3a9x',
  PRICE_DRIVER_INCL: 'fldyQIhjdUeQwtHMldD',
  ORDER_NAME: 'fldkvTaql1bPbifVKLt',
  MOBILE: 'fld6NJPsiW8CtRIfnaY',
  ID_NUM: 'fldAJPcCFUcDPlSCK1a'
}

interface ListItem {
  id: string
  title: string
}

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

  React.useEffect(() => {
    if (!value || value.trim() === "") {
      setFilteredOptions(options)
    } else {
      const filtered = options.filter(opt => 
        opt.title.toLowerCase().includes(value.toLowerCase())
      )
      setFilteredOptions(filtered)
    }
  }, [value, options])

  return (
    <div ref={wrapperRef} className="relative w-full">
      <Input 
        value={value}
        onChange={(e) => {
           onChange(e.target.value)
           setShowList(true)
        }}
        onFocus={() => setShowList(true)}
        onBlur={() => setTimeout(() => setShowList(false), 200)}
        className="text-right"
        placeholder={placeholder}
        autoComplete="off"
      />
      
      {showList && filteredOptions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 shadow-md max-h-[200px] overflow-y-auto rounded-sm">
          {filteredOptions.map((option) => (
            <div
              key={option.id}
              className="px-3 py-2 text-right text-sm cursor-pointer hover:bg-gray-100 transition-colors border-b last:border-0 border-gray-100 text-black"
              onMouseDown={(e) => {
                e.preventDefault()
                onChange(option.title)
                setShowList(false)
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

export function RideDialog({ 
  onRideSaved, 
  initialData = null,
  triggerChild
}: { 
  onRideSaved: () => void, 
  initialData?: any,
  triggerChild?: React.ReactNode 
}) {
  const [open, setOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const { toast } = useToast()
  const isEditMode = !!initialData; 

  const [date, setDate] = React.useState<Date>(new Date())
  const [vatRate, setVatRate] = React.useState("17") 

  const [customersList, setCustomersList] = React.useState<ListItem[]>([])
  const [driversList, setDriversList] = React.useState<ListItem[]>([])
  const [vehiclesList, setVehiclesList] = React.useState<ListItem[]>([])

  const [formData, setFormData] = React.useState({
    customer: "", description: "", pickupTime: "", dropoffTime: "", vehicleType: "",
    driver: "", vehicleNumber: "", notesDriver: "", orderingName: "", mobile: "", idNumber: "",
  })

  const [prices, setPrices] = React.useState({
    clientExcl: "", clientIncl: "", driverExcl: "", driverIncl: "",
  })

  React.useEffect(() => {
    if (open) {
        const getList = async (url: string) => {
            try {
                const res = await fetch(url);
                const data = await res.json();
                return data.records ? data.records.map((r: any) => ({ 
                    id: r.id, 
                    title: r.fields && Object.values(r.fields)[0] ? String(Object.values(r.fields)[0]) : r.id 
                })) : [];
            } catch (e) { return [] }
        }
        
        Promise.all([
            getList('/api/customers'),
            getList('/api/drivers'),
            getList('/api/vehicles')
        ]).then(([customers, drivers, vehicles]) => {
            setCustomersList(customers);
            setDriversList(drivers);
            setVehiclesList(vehicles);
        });
    }
  }, [open]);

  React.useEffect(() => {
    if (open && initialData) {
        const f = initialData.fields;
        if (f[FIELDS.DATE]) setDate(parseISO(f[FIELDS.DATE]));

        const getVal = (val: any) => {
            if (Array.isArray(val) && val[0]?.title) return val[0].title;
            return val || "";
        }

        setFormData({
            customer: getVal(f[FIELDS.CUSTOMER]),
            description: f[FIELDS.DESCRIPTION] || "",
            pickupTime: f[FIELDS.PICKUP_TIME] || "",
            dropoffTime: f[FIELDS.DROPOFF_TIME] || "",
            vehicleType: getVal(f[FIELDS.VEHICLE_TYPE]),
            driver: getVal(f[FIELDS.DRIVER]),
            vehicleNumber: f[FIELDS.VEHICLE_NUM] || "",
            notesDriver: f[FIELDS.DRIVER_NOTES] || "",
            orderingName: f[FIELDS.ORDER_NAME] || "",
            mobile: f[FIELDS.MOBILE] || "",
            idNumber: f[FIELDS.ID_NUM] || "",
        });

        setPrices({
            clientExcl: f[FIELDS.PRICE_CLIENT_EXCL] || "",
            clientIncl: f[FIELDS.PRICE_CLIENT_INCL] || "",
            driverExcl: f[FIELDS.PRICE_DRIVER_EXCL] || "",
            driverIncl: f[FIELDS.PRICE_DRIVER_INCL] || "",
        });
    } else if (open && !initialData) {
        setFormData({
            customer: "", description: "", pickupTime: "", dropoffTime: "", vehicleType: "",
            driver: "", vehicleNumber: "", notesDriver: "", orderingName: "", mobile: "", idNumber: ""
        });
        setPrices({ clientExcl: "", clientIncl: "", driverExcl: "", driverIncl: "" });
        setDate(new Date());
    }
  }, [open, initialData]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const getLinkID = (value: string, list: ListItem[]) => {
        const item = list.find(i => i.title === value);
        return item ? [item.id] : undefined; 
    }

    try {
      const fieldsToSend: any = {
          [FIELDS.DATE]: format(date, "yyyy-MM-dd"), 
          [FIELDS.DESCRIPTION]: formData.description,
          [FIELDS.PICKUP_TIME]: formData.pickupTime,
          [FIELDS.DROPOFF_TIME]: formData.dropoffTime,
          [FIELDS.VEHICLE_NUM]: formData.vehicleNumber,
          [FIELDS.DRIVER_NOTES]: formData.notesDriver,
          [FIELDS.ORDER_NAME]: formData.orderingName,
          [FIELDS.MOBILE]: formData.mobile,
          [FIELDS.ID_NUM]: formData.idNumber,
          [FIELDS.PRICE_CLIENT_EXCL]: Number(prices.clientExcl) || 0,
          [FIELDS.PRICE_CLIENT_INCL]: Number(prices.clientIncl) || 0,
          [FIELDS.PRICE_DRIVER_EXCL]: Number(prices.driverExcl) || 0,
          [FIELDS.PRICE_DRIVER_INCL]: Number(prices.driverIncl) || 0,
      };

      const vehicleLink = getLinkID(formData.vehicleType, vehiclesList);
      if (vehicleLink) fieldsToSend[FIELDS.VEHICLE_TYPE] = vehicleLink;

      const driverLink = getLinkID(formData.driver, driversList);
      if (driverLink) fieldsToSend[FIELDS.DRIVER] = driverLink;

      const customerLink = getLinkID(formData.customer, customersList);
      if (customerLink) fieldsToSend[FIELDS.CUSTOMER] = customerLink;

      const method = isEditMode ? "PATCH" : "POST";
      const payload = isEditMode ? { recordId: initialData.id, fields: fieldsToSend } : { fields: fieldsToSend };

      const response = await fetch("/api/work-schedule", {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("Failed to save");

      toast({ title: isEditMode ? "עודכן בהצלחה!" : "נוצר בהצלחה!" });
      setOpen(false);
      onRideSaved();

    } catch (error) {
      toast({ title: "שגיאה בשמירה", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {triggerChild ? triggerChild : (
            <Button className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
            <Plus className="h-4 w-4" />
            צור נסיעה
            </Button>
        )}
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[700px] h-[80vh] flex flex-col" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-right">
            {isEditMode ? "עריכת נסיעה" : "יצירת נסיעה חדשה"}
          </DialogTitle>
          <DialogDescription className="text-right">
            {isEditMode ? "עדכן את הפרטים ולחץ על שמירה." : "מלא את הפרטים בשדות ולחץ על צור נסיעה."}
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
                <TabsContent value="details" className="space-y-4 mt-0">
                    <div className="space-y-2">
                        <Label className="text-right block">תאריך</Label>
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

                    <div className="space-y-2">
                        <Label>שם לקוח</Label>
                        <AutoComplete options={customersList} value={formData.customer} onChange={(v) => setFormData(p => ({...p, customer: v}))} placeholder="בחר לקוח..." />
                    </div>

                    <div className="space-y-2">
                        <Label>תיאור</Label>
                        <Textarea value={formData.description} onChange={(e) => setFormData(p => ({...p, description: e.target.value}))} className="text-right" />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>התייצבות</Label>
                            <Input type="time" value={formData.pickupTime} onChange={(e) => setFormData(p => ({...p, pickupTime: e.target.value}))} className="text-right" />
                        </div>
                        <div className="space-y-2">
                            <Label>חזור</Label>
                            <Input type="time" value={formData.dropoffTime} onChange={(e) => setFormData(p => ({...p, dropoffTime: e.target.value}))} className="text-right" />
                        </div>
                    </div>

                     <div className="space-y-2">
                        <Label>שם נהג</Label>
                        <AutoComplete options={driversList} value={formData.driver} onChange={(v) => setFormData(p => ({...p, driver: v}))} placeholder="בחר נהג..." />
                    </div>
                     <div className="space-y-2">
                        <Label>סוג רכב</Label>
                        <AutoComplete options={vehiclesList} value={formData.vehicleType} onChange={(v) => setFormData(p => ({...p, vehicleType: v}))} placeholder="בחר רכב..." />
                    </div>
                     <div className="space-y-2">
                        <Label>מספר רכב</Label>
                        <Input value={formData.vehicleNumber} onChange={(e) => setFormData(p => ({...p, vehicleNumber: e.target.value}))} className="text-right" />
                    </div>
                     <div className="space-y-2">
                        <Label>הערות לנהג</Label>
                        <Textarea value={formData.notesDriver} onChange={(e) => setFormData(p => ({...p, notesDriver: e.target.value}))} className="text-right" rows={2} />
                    </div>
                </TabsContent>

                <TabsContent value="prices" className="space-y-6 mt-0">
                    <div className="flex items-center gap-2 p-2 bg-secondary/30 rounded-md w-fit">
                        <Label>מע"מ %:</Label>
                        <Input value={vatRate} onChange={(e) => setVatRate(e.target.value)} className="w-16 h-8 text-center" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4 p-4 border rounded-lg bg-blue-50/50">
                            <h3 className="font-bold text-blue-700 text-center border-b pb-2">מחיר לקוח</h3>
                            <div className="space-y-2">
                                <Label>לפני מע"מ</Label>
                                <Input type="number" value={prices.clientExcl} onChange={(e) => calculateVat(e.target.value, 'excl', 'client')} className="text-right bg-white" />
                            </div>
                            <div className="space-y-2">
                                <Label>כולל מע"מ</Label>
                                <Input type="number" value={prices.clientIncl} onChange={(e) => calculateVat(e.target.value, 'incl', 'client')} className="text-right font-bold bg-white" />
                            </div>
                        </div>
                        <div className="space-y-4 p-4 border rounded-lg bg-orange-50/50">
                            <h3 className="font-bold text-orange-700 text-center border-b pb-2">מחיר נהג</h3>
                            <div className="space-y-2">
                                <Label>לפני מע"מ</Label>
                                <Input type="number" value={prices.driverExcl} onChange={(e) => calculateVat(e.target.value, 'excl', 'driver')} className="text-right bg-white" />
                            </div>
                            <div className="space-y-2">
                                <Label>כולל מע"מ</Label>
                                <Input type="number" value={prices.driverIncl} onChange={(e) => calculateVat(e.target.value, 'incl', 'driver')} className="text-right font-bold bg-white" />
                            </div>
                        </div>
                    </div>
                </TabsContent>

                 <TabsContent value="extra" className="space-y-4 mt-0">
                     <div className="space-y-2">
                        <Label>שם מזמין</Label>
                        <Input value={formData.orderingName} onChange={(e) => setFormData(p => ({...p, orderingName: e.target.value}))} className="text-right" />
                     </div>
                     <div className="space-y-2">
                        <Label>נייד</Label>
                        <Input value={formData.mobile} onChange={(e) => setFormData(p => ({...p, mobile: e.target.value}))} className="text-right" />
                     </div>
                     <div className="space-y-2">
                        <Label>ת.ז.</Label>
                        <Input value={formData.idNumber} onChange={(e) => setFormData(p => ({...p, idNumber: e.target.value}))} className="text-right" />
                     </div>
                </TabsContent>
            </div>
          </Tabs>

          <DialogFooter className="mt-4 gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>ביטול</Button>
            <Button type="submit" disabled={loading} className="bg-primary min-w-[120px]">
              {loading ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : (isEditMode ? <Pencil className="ml-2 h-4 w-4" /> : <Save className="ml-2 h-4 w-4" />)}
              {isEditMode ? "שמור שינויים" : "צור נסיעה"}
            </Button>
          </DialogFooter>

        </form>
      </DialogContent>
    </Dialog>
  )
}
