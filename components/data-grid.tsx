"use client"

import React, { useState, useEffect, useCallback, useMemo } from "react"
import type { ReactElement } from "react"
import type { WorkScheduleRecord, TableSchema } from "@/types/work-schedule"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { CalendarIcon, Plus, Search, Trash2 } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { toast } from "sonner"
import { he } from "date-fns/locale"
import { format } from "date-fns"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// פונקציית עזר לניקוי מזהים מה-API
const extractValidId = (id: any) => (typeof id === "string" ? id.match(/rec[a-zA-Z0-9]{10,27}/)?.[0] : null)

interface DataGridProps { schema: TableSchema }

export function DataGrid({ schema }: DataGridProps): ReactElement {
  const [records, setRecords] = useState<WorkScheduleRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isToolbarDatePickerOpen, setIsToolbarDatePickerOpen] = useState(false)
  const [filterDate, setFilterDate] = useState<Date>(new Date()) // תאריך ברירת מחדל: היום
  const [searchQuery, setSearchQuery] = useState("")
  const [newRecord, setNewRecord] = useState<Record<string, any>>({})
  const [isEditMode, setIsEditMode] = useState(false)
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null)

  // טעינת נתונים - מושך 200 נסיעות כדי לוודא שהיום הנוכחי כלול
  const fetchRecords = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/work-schedule?take=200&t=${Date.now()}`)
      const data = await response.json()
      const cleanRecords = (data.records || [])
        .map((r: any) => ({ ...r, id: extractValidId(r.id) }))
        .filter((r: any) => r.id)
      setRecords(cleanRecords)
    } catch (error) {
      toast.error("שגיאה בטעינת נתונים")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { fetchRecords() }, [fetchRecords])

  // --- הלוגיקה שביקשת: סינון קשיח לפי התאריך שנבחר בדייטפיקר ---
  const filteredRecords = useMemo(() => {
    // הופך את התאריך הנבחר לטקסט בפורמט 2026-01-19
    const selectedDateStr = format(filterDate, "yyyy-MM-dd")
    const searchTerm = searchQuery.toLowerCase()

    return records.filter((record) => {
      const recordDateValue = record.fields.fldT720jVmGMXFURUKL // שדה התאריך ב-Teable
      if (!recordDateValue) return false

      // השוואת תאריכים נקייה (בלי שעות ובלי אזורי זמן)
      const recordDateStr = format(new Date(recordDateValue), "yyyy-MM-dd")
      const matchesDate = recordDateStr === selectedDateStr

      // סינון נוסף לפי חיפוש חופשי (לקוח/נהג)
      const matchesSearch = (
        String(record.fields.fldKhk7JWpnlquyHQ4l || "").toLowerCase().includes(searchTerm) ||
        String(record.fields.fldGTTvqQ8lii1wfiS5 || "").toLowerCase().includes(searchTerm)
      )

      return matchesDate && matchesSearch
    })
  }, [records, filterDate, searchQuery])

  const handleSaveRecord = async () => {
    try {
      const method = isEditMode ? "PATCH" : "POST"
      const url = isEditMode ? `/api/work-schedule/${editingRecordId}` : "/api/work-schedule"
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newRecord),
      })
      if (res.ok) {
        toast.success("נשמר בהצלחה")
        fetchRecords()
        setIsDialogOpen(false)
      }
    } catch (error) { toast.error("שגיאה בשמירה") }
  }

  return (
    <div className="flex flex-col h-full bg-slate-50" dir="rtl">
      {/* סרגל כלים עליון */}
      <div className="border-b p-4 flex items-center gap-4 bg-white shadow-sm">
        <Button onClick={() => { setIsEditMode(false); setNewRecord({}); setIsDialogOpen(true); }}>
          <Plus className="h-4 w-4 ml-2" /> נסיעה חדשה
        </Button>

        <div className="flex items-center gap-2 border-r pr-4">
          <Label className="text-sm font-bold">בחר תאריך לסידור:</Label>
          <Popover open={isToolbarDatePickerOpen} onOpenChange={setIsToolbarDatePickerOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="min-w-[150px] justify-start text-right">
                <CalendarIcon className="h-4 w-4 ml-2" />
                {format(filterDate, "dd/MM/yyyy", { locale: he })}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar 
                mode="single" 
                selected={filterDate} 
                onSelect={(d) => { if(d){setFilterDate(d); setIsToolbarDatePickerOpen(false)} }} 
                locale={he} 
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="relative mr-auto">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="חיפוש מהיר..." 
            value={searchQuery} 
            onChange={(e) => setSearchQuery(e.target.value)} 
            className="pr-9 w-[200px]" 
          />
        </div>
      </div>

      {/* טבלת סידור העבודה */}
      <div className="flex-1 overflow-auto p-4">
        <div className="border rounded-lg bg-white shadow-sm">
          <Table>
            <TableHeader className="bg-slate-100">
              <TableRow>
                <TableHead className="text-right">לקוח</TableHead>
                <TableHead className="text-right">התייצבות</TableHead>
                <TableHead className="text-right">מסלול/תיאור</TableHead>
                <TableHead className="text-right">נהג</TableHead>
                <TableHead className="text-right">מספר רכב</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-10">טוען נסיעות מה-Teable...</TableCell></TableRow>
              ) : filteredRecords.length > 0 ? (
                filteredRecords.map((r) => (
                  <TableRow 
                    key={r.id} 
                    onClick={() => { setEditingRecordId(r.id); setNewRecord(r.fields); setIsEditMode(true); setIsDialogOpen(true); }} 
                    className="cursor-pointer hover:bg-blue-50 transition-colors"
                  >
                    <TableCell className="font-bold">{r.fields.fldKhk7JWpnlquyHQ4l}</TableCell>
                    <TableCell>{r.fields.fldqFE8SRWBvx3lhI33}</TableCell>
                    <TableCell className="max-w-md truncate">{r.fields.fldMONOIhazLclMi3WN}</TableCell>
                    <TableCell>{r.fields.fldGTTvqQ8lii1wfiS5}</TableCell>
                    <TableCell>{r.fields.fldwQKrYxcduWAHLOcG}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-20 text-muted-foreground">
                    אין נסיעות רשומות לתאריך {format(filterDate, "dd/MM/yyyy")}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* חלון הוספה/עריכה */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{isEditMode ? "עריכת נסיעה" : "הוספת נסיעה לסידור"}</DialogTitle></DialogHeader>
          <div className="grid gap-6 py-4" dir="rtl">
            <div className="grid gap-2">
              <Label>תאריך</Label>
              <Input type="date" value={newRecord.fldT720jVmGMXFURUKL || ""} onChange={(e) => setNewRecord({ ...newRecord, fldT720jVmGMXFURUKL: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label>תיאור הנסיעה</Label>
              <Textarea rows={4} value={newRecord.fldMONOIhazLclMi3WN || ""} onChange={(e) => setNewRecord({ ...newRecord, fldMONOIhazLclMi3WN: e.target.value })} />
            </div>
          </div>
          <div className="flex justify-end gap-2 border-t pt-4">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>סגור</Button>
            <Button onClick={handleSaveRecord} className="bg-blue-600 hover:bg-blue-700">שמור ב-Teable</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
