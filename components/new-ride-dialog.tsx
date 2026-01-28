"use client"

import * as React from "react"
import { Plus, Loader2, Save, Pencil } from "lucide-react"
import { format } from "date-fns"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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

interface ListItem { id: string; title: string }

// --- AutoComplete (עם התיקון נגד קריסות) ---
function AutoComplete({ options, value, onChange, placeholder }: any) {
  const [show, setShow] = React.useState(false)
  
  // התיקון: מבטיח שזה תמיד טקסט לפני שבודקים
  const safeValue = String(value || "").toLowerCase();
  
  const filtered = options.filter((o: any) => {
      const title = String(o.title || "").toLowerCase();
      return title.includes(safeValue);
  })

  return (
    <div className="relative w-full">
      <Input 
        value={value} 
        onChange={e => { onChange(e.target.value); setShow(true) }} 
        onBlur={() => setTimeout(() => setShow(false), 200)} 
        onFocus={() => setShow(true)} 
        className="text-right" 
        placeholder={placeholder} 
      />
      {show && filtered.length > 0 && (
        <div className="absolute z-50 w-full bg-white border shadow-md max-h-40 overflow-auto">
          {filtered.map((o: any) => (
            <div key={o.id} className="p-2 hover:bg-gray-100 cursor-pointer text-right" onMouseDown={() => onChange(o.title)}>{o.title}</div>
          ))}
        </div>
      )}
    </div>
  )
}

export function RideDialog({ onRideSaved, initialData, triggerChild, open: controlledOpen, onOpenChange: setControlledOpen }: any) {
  const [internalOpen, setInternalOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const { toast } = useToast()
  
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? setControlledOpen : setInternalOpen;

  const isEdit = !!initialData

  // State
  const [dateStr, setDateStr] = React.useState(format(new Date(), "yyyy-MM-dd"))
  const [vatRate, setVatRate] = React.useState("17") // מע"מ ברירת מחדל
  
  const [lists, setLists] = React.useState<{customers: ListItem[], drivers: ListItem[], vehicles: ListItem[]}>({ customers: [], drivers: [], vehicles: [] })
  
  const [form, setForm] = React.useState({
    customer: "", description: "", pickup: "", dropoff: "", vehicleType: "",
    driver: "", vehicleNum: "", notes: "", orderName: "", mobile: "", idNum: ""
  })
  
  const [prices, setPrices] = React.useState({ ce: "", ci: "", de: "", di: "" })

  // טעינת רשימות
  React.useEffect(() => {
    if (open && lists.customers.length === 0) {
      const load = async (url: string) => {
        try { 
            const r = await fetch(url); 
            const d = await r.json(); 
            return d.records ? d.records.map((x: any) => ({ 
                id: x.id, 
                title: x.fields && Object.values(x.fields)[0] ? String(Object.values(x.fields)[0]) : "" 
            })) : [] 
        } catch { return [] }
      }
      Promise.all([load('/api/customers'), load('/api/drivers'), load('/api/vehicles')])
        .then(([c, d, v]) => setLists({ customers: c, drivers: d, vehicles: v }))
    }
  }, [open])

  // מילוי טופס בעריכה
  React.useEffect(() => {
    if (open && initialData) {
      const f = initialData.fields
      setDateStr(f[FIELDS.DATE] || "")
      const getVal = (v: any) => Array.isArray(v) ? (v[0]?.title || "") : (v || "")
      
      setForm({
        customer: getVal(f[FIELDS.CUSTOMER]), description: f[FIELDS.DESCRIPTION] || "",
        pickup: f[FIELDS.PICKUP_TIME] || "", dropoff: f[FIELDS.DROPOFF_TIME] || "",
        vehicleType: getVal(f[FIELDS.VEHICLE_TYPE]), driver: getVal(f[FIELDS.DRIVER]),
        vehicleNum: f[FIELDS.VEHICLE_NUM] || "", notes: f[FIELDS.DRIVER_NOTES] || "",
        orderName: f[FIELDS.ORDER_NAME] || "", mobile: f[FIELDS.MOBILE] || "", idNum: f[FIELDS.ID_NUM] || ""
      })
      setPrices({
        ce: f[FIELDS.PRICE_CLIENT_EXCL] || "", ci: f[FIELDS.PRICE_CLIENT_INCL] || "",
        de: f[FIELDS.PRICE_DRIVER_EXCL] || "", di: f[FIELDS.PRICE_DRIVER_INCL] || ""
      })
    } else if (open && !initialData) {
        setForm({
            customer: "", description: "", pickup: "", dropoff: "", vehicleType: "",
            driver: "", vehicleNum: "", notes: "", orderName: "", mobile: "", idNum: ""
        })
        setPrices({ ce: "", ci: "", de: "", di: "" })
        setDateStr(format(new Date(), "yyyy-MM-dd"))
    }
  }, [open, initialData])

  // חישוב מע"מ
  const calculateVat = (value: string, type: 'excl' | 'incl', field: 'client' | 'driver') => {
    const numVal = parseFloat(value)
    const rate = 1 + (parseFloat(vatRate) / 100)
    
    if (isNaN(numVal)) {
      if (field === 'client') setPrices(prev => ({ ...prev, ce: "", ci: "" }))
      else setPrices(prev => ({ ...prev, de: "", di: "" }))
      return
    }

    if (type === 'excl') {
      const incl = (numVal * rate).toFixed(2)
      if (field === 'client') setPrices(prev => ({ ...prev, ce: value, ci: incl }))
      else setPrices(prev => ({ ...prev, de: value, di: incl }))
    } else {
      const excl = (numVal / rate).toFixed(2)
      if (field === 'client') setPrices(prev => ({ ...prev, ci: value, ce: excl }))
      else setPrices(prev => ({ ...prev, di: value, de: excl }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const findId = (val: string, list: ListItem[]) => { const item = list.find(x => x.title === val); return item ? [item.id] : undefined }

    const payload = {
      [FIELDS.DATE]: dateStr,
      [FIELDS.DESCRIPTION]: form.description,
      [FIELDS.PICKUP_TIME]: form.pickup,
      [FIELDS.DROPOFF_TIME]: form.dropoff,
      [FIELDS.VEHICLE_NUM]: form.vehicleNum,
      [FIELDS.DRIVER_NOTES]: form.notes,
      [FIELDS.ORDER_NAME]: form.orderName,
      [FIELDS.MOBILE]: form.mobile,
      [FIELDS.ID_NUM]: form.idNum,
      [FIELDS.PRICE_CLIENT_EXCL]: Number(prices.ce),
      [FIELDS.PRICE_CLIENT_INCL]: Number(prices.ci),
      [FIELDS.PRICE_DRIVER_EXCL]: Number(prices.de),
      [FIELDS.PRICE_DRIVER_INCL]: Number(prices.di),
      [FIELDS.CUSTOMER]: findId(form.customer, lists.customers),
      [FIELDS.DRIVER]: findId(form.driver, lists.drivers),
      [FIELDS.VEHICLE_TYPE]: findId(form.vehicleType, lists.vehicles),
    }

    try {
      await fetch("/api/work-schedule", {
        method: isEdit ? "PATCH" : "POST",
        body: JSON.stringify(isEdit ? { recordId: initialData.id, fields: payload } : { fields: payload })
      })
      toast({ title: isEdit ? "עודכן בהצלחה!" : "נשמר בהצלחה!" })
      setOpen(false)
      onRideSaved()
    } catch { toast({ title: "שגיאה", variant: "destructive" }) } finally { setLoading(false) }
  }
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      
      {!isControlled && (
          <DialogTrigger asChild>
            {triggerChild ? triggerChild : (
                <Button className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
                <Plus className="h-4 w-4" />
                צור נסיעה
                </Button>
            )}
          </DialogTrigger>
      )}

      <DialogContent className="sm:max-w-[700px] h-[80vh] flex flex-col" dir="rtl">
        <DialogHeader><DialogTitle>{isEdit ? "עריכת נסיעה" : "נסיעה חדשה"}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
          <Tabs defaultValue="details" className="flex-1 flex flex-col overflow-hidden">
            <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="details">פרטי נסיעה</TabsTrigger>
                <TabsTrigger value="prices">מחירים</TabsTrigger>
                <TabsTrigger value="extra">פרטים נוספים</TabsTrigger>
            </TabsList>
            
            <div className="flex-1 overflow-y-auto p-4 border rounded mt-2">
              <TabsContent value="details" className="space-y-4">
                <div className="space-y-1"><Label>תאריך</Label><Input type="date" value={dateStr} onChange={e => setDateStr(e.target.value)} className="text-right"/></div>
                <div className="space-y-1"><Label>לקוח</Label><AutoComplete options={lists.customers} value={form.customer} onChange={(v: string) => setForm(p => ({...p, customer: v}))} placeholder="בחר לקוח"/></div>
                <div className="space-y-1"><Label>תיאור</Label><Textarea value={form.description} onChange={e => setForm(p => ({...p, description: e.target.value}))} className="text-right"/></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1"><Label>התייצבות</Label><Input type="time" value={form.pickup} onChange={e => setForm(p => ({...p, pickup: e.target.value}))}/></div>
                  <div className="space-y-1"><Label>חזור</Label><Input type="time" value={form.dropoff} onChange={e => setForm(p => ({...p, dropoff: e.target.value}))}/></div>
                </div>
                <div className="space-y-1"><Label>נהג</Label><AutoComplete options={lists.drivers} value={form.driver} onChange={(v: string) => setForm(p => ({...p, driver: v}))} placeholder="בחר נהג"/></div>
                <div className="space-y-1"><Label>רכב</Label><AutoComplete options={lists.vehicles} value={form.vehicleType} onChange={(v: string) => setForm(p => ({...p, vehicleType: v}))} placeholder="בחר רכב"/></div>
                <div className="space-y-1"><Label>מס' רכב</Label><Input value={form.vehicleNum} onChange={e => setForm(p => ({...p, vehicleNum: e.target.value}))} className="text-right"/></div>
                <div className="space-y-1"><Label>הערות נהג</Label><Textarea value={form.notes} onChange={e => setForm(p => ({...p, notes: e.target.value}))} className="text-right"/></div>
              </TabsContent>

              {/* --- החזרתי את העיצוב המלא! --- */}
              <TabsContent value="prices" className="space-y-6">
                 <div className="flex items-center gap-2 p-2 bg-secondary/30 rounded-md w-fit">
                    <Label>מע"מ %:</Label>
                    <Input value={vatRate} onChange={(e) => setVatRate(e.target.value)} className="w-16 h-8 text-center" />
                 </div>
                 
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* צד לקוח - כחול */}
                    <div className="space-y-4 p-4 border rounded-lg bg-blue-50/50">
                        <h3 className="font-bold text-blue-700 text-center border-b pb-2">מחיר לקוח</h3>
                        <div className="space-y-2">
                            <Label>לפני מע"מ</Label>
                            <Input type="number" value={prices.ce} onChange={(e) => calculateVat(e.target.value, 'excl', 'client')} className="text-right bg-white" />
                        </div>
                        <div className="space-y-2">
                            <Label>כולל מע"מ</Label>
                            <Input type="number" value={prices.ci} onChange={(e) => calculateVat(e.target.value, 'incl', 'client')} className="text-right font-bold bg-white" />
                        </div>
                    </div>

                    {/* צד נהג - כתום */}
                    <div className="space-y-4 p-4 border rounded-lg bg-orange-50/50">
                        <h3 className="font-bold text-orange-700 text-center border-b pb-2">מחיר נהג</h3>
                        <div className="space-y-2">
                            <Label>לפני מע"מ</Label>
                            <Input type="number" value={prices.de} onChange={(e) => calculateVat(e.target.value, 'excl', 'driver')} className="text-right bg-white" />
                        </div>
                        <div className="space-y-2">
                            <Label>כולל מע"מ</Label>
                            <Input type="number" value={prices.di} onChange={(e) => calculateVat(e.target.value, 'incl', 'driver')} className="text-right font-bold bg-white" />
                        </div>
                    </div>
                 </div>
              </TabsContent>

              <TabsContent value="extra" className="space-y-4">
                <div className="space-y-1"><Label>מזמין</Label><Input value={form.orderName} onChange={e => setForm(p => ({...p, orderName: e.target.value}))} className="text-right"/></div>
                <div className="space-y-1"><Label>נייד</Label><Input value={form.mobile} onChange={e => setForm(p => ({...p, mobile: e.target.value}))} className="text-right"/></div>
                <div className="space-y-1"><Label>ת.ז</Label><Input value={form.idNum} onChange={e => setForm(p => ({...p, idNum: e.target.value}))} className="text-right"/></div>
              </TabsContent>
            </div>
          </Tabs>
          <DialogFooter className="mt-4"><Button variant="outline" onClick={() => setOpen(false)}>ביטול</Button><Button type="submit">{loading ? <Loader2 className="animate-spin"/> : (isEdit ? <Pencil className="w-4 h-4 ml-2"/> : <Save className="w-4 h-4 ml-2"/>)} {isEdit ? "עדכן" : "צור"}</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
