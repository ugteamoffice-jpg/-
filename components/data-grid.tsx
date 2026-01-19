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
import { CalendarIcon, Eye, EyeOff, Plus, ChevronsUpDown, Trash2, Search, ChevronsLeftRight } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { toast } from "sonner"
import { he } from "date-fns/locale"
import { format, startOfDay } from "date-fns"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/AlertDialog"

// פונקציות עזר לניקוי מזהים
const extractValidId = (id: any): string | null => {
  if (typeof id !== "string") return null
  const match = id.match(/rec[a-zA-Z0-9]{10,27}/)
  return match ? match[0] : null
}

const sanitize = (id: any) => extractValidId(id)

interface DataGridProps {
  schema: TableSchema
}

export function DataGrid({ schema }: DataGridProps): ReactElement {
  const [records, setRecords] = useState<WorkScheduleRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isToolbarDatePickerOpen, setIsToolbarDatePickerOpen] = useState(false)
  const [filterDate, setFilterDate] = useState<Date>(new Date())
  const [columnOrder, setColumnOrder] = useState<string[]>([])
  const [hiddenColumns, setHiddenColumns] = useState<string[]>([])
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({})
  const [searchQuery, setSearchQuery] = useState("")
  const [newRecord, setNewRecord] = useState<Record<string, any>>({})
  const [isEditMode, setIsEditMode] = useState(false)
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null)

  // טעינת נתונים ראשונית
  const fetchRecords = useCallback(async () => {
    try {
      setIsLoading(true)
      // הגדלנו את take ל-200 כדי לוודא שכל הנסיעות הרלוונטיות נטענות
      const response = await fetch(`/api/work-schedule?take=200&t=${Date.now()}`)
      const data = await response.json()
      const cleanRecords = (data.records || [])
        .map((r: any) => {
          const cleanId = extractValidId(r.id)
          return cleanId ? { ...r, id: cleanId } : null
        })
        .filter((r: any) => r !== null)
      setRecords(cleanRecords)
    } catch (error) {
      toast.error("שגיאה בטעינת הנתונים")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchRecords()
  }, [fetchRecords])

  // הגדרת עמודות וברירת מחדל (הקוד הקיים שלך)
  useEffect(() => {
    const defaultOrder = [
      "fldjMfOvWEu7HtjSQmv", "fldoOFQdbIVJthTngkg", "fldKhk7JWpnlquyHQ4l",
      "fldqFE8SRWBvx3lhI33", "fldMONOIhazLclMi3WN", "fldiIu1Wm6gC2665QdN",
      "fldeppUjfYTJgZZi6VI", "fldGTTvqQ8lii1wfiS5", "fldwQKrYxcduWAHLOcG",
      "fldpPsdEQlpmh7UtZ0G", "fldJrzZk9KXj8bn5Rrl", "fldIzCFfqbGuNtQGVqr"
    ]
    setColumnOrder(defaultOrder)
    const visibleColumnIds = defaultOrder
    const hiddenIds = (schema.fields || []).map(f => f.id).filter(id => !visibleColumnIds.includes(id))
    setHiddenColumns(hiddenIds)
  }, [schema.fields])

  // לוגיקת הסינון המתוקנת - פה קורה הקסם
  const filteredRecords = useMemo(() => {
    const selectedDateStr = format(filterDate, "yyyy-MM-dd")
    const searchTerm = searchQuery.toLowerCase()

    console.log(`[אורבן גרופ] מסנן לפי תאריך: ${selectedDateStr}`)

    return records.filter((record) => {
      // השוואת תאריך נסיעה (שדה fldT720jVmGMXFURUKL)
      const recordDateValue = record.fields.fldT720jVmGMXFURUKL
      if (!recordDateValue) return false

      const recordDateStr = format(new Date(recordDateValue), "yyyy-MM-dd")
      const matchesDate = recordDateStr === selectedDateStr

      // סינון לפי חיפוש טקסט
      const matchesSearch = (
        String(record.fields.fldKhk7JWpnlquyHQ4l || "").toLowerCase().includes(searchTerm) ||
        String(record.fields.fldMONOIhazLclMi3WN || "").toLowerCase().includes(searchTerm) ||
        String(record.fields.fldGTTvqQ8lii1wfiS5 || "").toLowerCase().includes(searchTerm)
      )

      return matchesDate && matchesSearch
    })
  }, [records, filterDate, searchQuery])

  const handleRowClick = (record: WorkScheduleRecord) => {
    setEditingRecordId(record.id)
    setNewRecord({ ...record.fields })
    setIsEditMode(true)
    setIsDialogOpen(true)
  }

  const handleSaveRecord = async () => {
    try {
      const url = isEditMode ? `/api/work-schedule/${editingRecordId}` : "/api/work-schedule"
      const method = isEditMode ? "PATCH" : "POST"
      
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newRecord),
      })

      if (response.ok) {
        toast.success("הנסיעה נשמרה")
        fetchRecords()
        setIsDialogOpen(false)
      }
    } catch (error) {
      toast.error("שגיאה בשמירה")
    }
  }

  const getDisplayColumnName = (name: string) => {
    const names: Record<string, string> = {
      "Customer Name": "שם לקוח", "Arrival Time": "התייצבות", "Description": "תיאור",
      "Return Time": "חזור", "Vehicle Type": "סוג רכב", "Driver Name": "שם נהג",
      "Vehicle Number": "מספר רכב", "Customer Price + VAT": "מחיר לקוח+ מע״מ",
      "Driver Price + VAT": "מחיר נהג+ מע״מ", "Profit before VAT": "רווח לפני מע״מ"
    }
    return names[name] || name
  }

  const displayedColumns = columnOrder
    .map((id) => schema.fields?.find((f) => f.id === id))
    .filter((f): f is any => !!f && !hiddenColumns.includes(f.id))

  return (
    <div className="flex flex-col h-full bg-background" dir="rtl">
      <div className="border-b p-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button onClick={() => { setIsEditMode(false); setNewRecord({}); setIsDialogOpen(true); }}>
            <Plus className="h-4 w-4 ml-2" /> נסיעה חדשה
          </Button>

          <Popover open={isToolbarDatePickerOpen} onOpenChange={setIsToolbarDatePickerOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="gap-2">
                <CalendarIcon className="h-4 w-4" />
                {format(filterDate, "dd/MM/yyyy", { locale: he })}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={filterDate} onSelect={(d) => { if(d){setFilterDate(d); setIsToolbarDatePickerOpen(false)} }} locale={he} />
            </PopoverContent>
          </Popover>

          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="חיפוש..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pr-9 w-[250px]" />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]"></TableHead>
                {displayedColumns.map((field) => (
                  <TableHead key={field.id} className="text-right">{getDisplayColumnName(field.name)}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={10} className="text-center py-10">טוען נתונים...</TableCell></TableRow>
              ) : filteredRecords.map((record) => (
                <TableRow key={record.id} onClick={() => handleRowClick(record)} className="cursor-pointer hover:bg-muted/50">
                  <TableCell>•</TableCell>
                  {displayedColumns.map((field) => (
                    <TableCell key={field.id} className="text-right">
                      {field.type === "date" && record.fields[field.id] ? format(new Date(record.fields[field.id]), "dd/MM/yyyy") : record.fields[field.id]}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
              {!isLoading && filteredRecords.length === 0 && (
                <TableRow><TableCell colSpan={10} className="text-center py-10 text-muted-foreground">אין נסיעות לתאריך זה</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{isEditMode ? "עריכת נסיעה" : "נסיעה חדשה"}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>תאריך</Label>
              <Input type="date" value={newRecord.fldT720jVmGMXFURUKL || ""} onChange={(e) => setNewRecord({ ...newRecord, fldT720jVmGMXFURUKL: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label>תיאור</Label>
              <Textarea value={newRecord.fldMONOIhazLclMi3WN || ""} onChange={(e) => setNewRecord({ ...newRecord, fldMONOIhazLclMi3WN: e.target.value })} />
            </div>
          </div>
          <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setIsDialogOpen(false)}>ביטול</Button><Button onClick={handleSaveRecord}>שמור</Button></div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
