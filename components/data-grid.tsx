"use client"

import React, { useState, useEffect, useCallback, useRef, useMemo } from "react"
import type { ReactElement } from "react"
import type { WorkScheduleRecord, TableSchema } from "@/types/work-schedule"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { CalendarIcon, Eye, EyeOff, Plus, Trash2, Search } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { toast } from "sonner"
import { he } from "date-fns/locale"
import { format } from "date-fns"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// עזר לניקוי מזהים פגומים
const extractValidId = (id: any) => (typeof id === "string" ? id.match(/rec[a-zA-Z0-9]{10,27}/)?.[0] : null)

interface DataGridProps { schema: TableSchema }

export function DataGrid({ schema }: DataGridProps): ReactElement {
  const [records, setRecords] = useState<WorkScheduleRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isToolbarDatePickerOpen, setIsToolbarDatePickerOpen] = useState(false)
  const [filterDate, setFilterDate] = useState<Date>(new Date())
  const [showAllDates, setShowAllDates] = useState(false) // כפתור הצג הכל
  const [searchQuery, setSearchQuery] = useState("")
  const [newRecord, setNewRecord] = useState<Record<string, any>>({})
  const [isEditMode, setIsEditMode] = useState(false)
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null)
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set())

  // טעינת 200 רשומות אחרונות למניעת חוסר בנתונים
  const fetchRecords = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/work-schedule?take=200&t=${Date.now()}`)
      const data = await response.json()
      setRecords((data.records || []).map((r: any) => ({ ...r, id: extractValidId(r.id) })).filter((r: any) => r.id))
    } catch (error) {
      toast.error("שגיאה בטעינת נתונים")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { fetchRecords() }, [fetchRecords])

  // לוגיקת הסינון המשופרת
  const filteredRecords = useMemo(() => {
    return records.filter((record) => {
      const searchTerm = searchQuery.toLowerCase()
      
      // 1. בדיקת תאריך (רק אם לא נבחר "הצג הכל")
      let matchesDate = true
      if (!showAllDates) {
        const recordDateValue = record.fields.fldT720jVmGMXFURUKL
        if (!recordDateValue) return false
        
        // השוואה לפי מחרוזת פשוטה YYYY-MM-DD
        const rDate = new Date(recordDateValue).toISOString().split('T')[0]
        const sDate = filterDate.toISOString().split('T')[0]
        matchesDate = rDate === sDate
      }

      // 2. בדיקת חיפוש טקסט
      const matchesSearch = (
        String(record.fields.fldKhk7JWpnlquyHQ4l || "").toLowerCase().includes(searchTerm) ||
        String(record.fields.fldMONOIhazLclMi3WN || "").toLowerCase().includes(searchTerm) ||
        String(record.fields.fldGTTvqQ8lii1wfiS5 || "").toLowerCase().includes(searchTerm)
      )

      return matchesDate && matchesSearch
    })
  }, [records, filterDate, searchQuery, showAllDates])

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

  const getColName = (n: string) => {
    const map: Record<string, string> = { "Customer Name": "לקוח", "Arrival Time": "התייצבות", "Description": "תיאור", "Driver Name": "נהג", "Vehicle Number": "רכב" }
    return map[n] || n
  }

  return (
    <div className="flex flex-col h-full bg-background font-sans" dir="rtl">
      {/* סרגל כלים עליון */}
      <div className="border-b p-4 flex flex-wrap items-center gap-3 bg-white">
        <Button onClick={() => { setIsEditMode(false); setNewRecord({}); setIsDialogOpen(true); }}>
          <Plus className="h-4 w-4 ml-2" /> נסיעה חדשה
        </Button>

        <div className="flex items-center gap-2 border-r pr-3 mr-1">
          <Popover open={isToolbarDatePickerOpen} onOpenChange={setIsToolbarDatePickerOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className={showAllDates ? "opacity-50" : ""}>
                <CalendarIcon className="h-4 w-4 ml-2" />
                {format(filterDate, "dd/MM/yyyy", { locale: he })}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={filterDate} onSelect={(d) => { if(d){setFilterDate(d); setShowAllDates(false); setIsToolbarDatePickerOpen(false)} }} locale={he} />
            </PopoverContent>
          </Popover>

          <div className="flex items-center gap-2 mr-2">
            <Checkbox id="showAll" checked={showAllDates} onCheckedChange={(val) => setShowAllDates(!!val)} />
            <Label htmlFor="showAll" className="cursor-pointer text-sm">הצג את כל התאריכים</Label>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="חיפוש חופשי..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pr-9 w-[200px]" />
        </div>
      </div>

      {/* טבלת נתונים */}
      <div className="flex-1 overflow-auto p-4">
        <div className="border rounded-md bg-white">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="w-[40px]"></TableHead>
                <TableHead className="text-right">לקוח</TableHead>
                <TableHead className="text-right">התייצבות</TableHead>
                <TableHead className="text-right">תיאור</TableHead>
                <TableHead className="text-right">נהג</TableHead>
                <TableHead className="text-right">רכב</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-10">טוען נתונים מהשרת...</TableCell></TableRow>
              ) : filteredRecords.map((r) => (
                <TableRow key={r.id} onClick={() => { setEditingRecordId(r.id); setNewRecord(r.fields); setIsEditMode(true); setIsDialogOpen(true); }} className="cursor-pointer hover:bg-slate-50">
                  <TableCell>•</TableCell>
                  <TableCell className="text-right font-medium">{r.fields.fldKhk7JWpnlquyHQ4l}</TableCell>
                  <TableCell className="text-right">{r.fields.fldqFE8SRWBvx3lhI33}</TableCell>
                  <TableCell className="text-right max-w-[200px] truncate">{r.fields.fldMONOIhazLclMi3WN}</TableCell>
                  <TableCell className="text-right">{r.fields.fldGTTvqQ8lii1wfiS5}</TableCell>
                  <TableCell className="text-right">{r.fields.fldwQKrYxcduWAHLOcG}</TableCell>
                </TableRow>
              ))}
              {!isLoading && filteredRecords.length === 0 && (
                <TableRow><TableCell colSpan={6} className="text-center py-20 text-muted-foreground">אין נסיעות להצגה. נסה לשנות תאריך או לסמן "הצג את כל התאריכים".</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* דיאלוג עריכה/יצירה */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader><DialogTitle>{isEditMode ? "עריכת נסיעה" : "נסיעה חדשה"}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4" dir="rtl">
            <div className="grid gap-2">
              <Label>תאריך נסיעה</Label>
              <Input type="date" value={newRecord.fldT720jVmGMXFURUKL || ""} onChange={(e) => setNewRecord({ ...newRecord, fldT720jVmGMXFURUKL: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label>תיאור המסלול</Label>
              <Textarea value={newRecord.fldMONOIhazLclMi3WN || ""} onChange={(e) => setNewRecord({ ...newRecord, fldMONOIhazLclMi3WN: e.target.value })} />
            </div>
          </div>
          <div className="flex justify-end gap-2 border-t pt-4">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>ביטול</Button>
            <Button onClick={handleSaveRecord}>שמור בסידור</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
