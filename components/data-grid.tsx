"use client"

import React from "react"
import type { ReactElement } from "react"
import { useState, useEffect, useCallback, useRef } from "react"
import type { WorkScheduleRecord, TableSchema } from "@/types/work-schedule"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { CalendarIcon, Eye, EyeOff, Plus, ChevronsUpDown, Trash2, Search, ChevronsLeftRight } from "lucide-react"
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from "@/components/ui/context-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { toast } from "sonner"
import { he } from "date-fns/locale"
import { useMemo } from "react"
import { format } from "date-fns"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command"
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
} from "@/components/ui/alert-dialog"

function isValidTeableId(id: any): boolean {
  if (typeof id !== "string") return false
  if (id.length < 10 || id.length > 30) return false
  if (!id.startsWith("rec")) return false
  if (!/^rec[a-zA-Z0-9]+$/.test(id)) return false
  return true
}

const extractValidId = (id: any): string | null => {
  if (typeof id !== "string") return null
  const match = id.match(/rec[a-zA-Z0-9]{10,27}/)
  if (match) {
    const extractedId = match[0]
    if (extractedId.startsWith("rec") && extractedId.length >= 10 && extractedId.length <= 30) {
      return extractedId
    }
  }
  return null
}

const sanitize = (id: any): string | null => {
  return extractValidId(id)
}

interface DataGridProps {
  schema: TableSchema
}

export function DataGrid({ schema }: DataGridProps): ReactElement {
  const [records, setRecords] = useState<WorkScheduleRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedRecord, setSelectedRecord] = useState<WorkScheduleRecord | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false)
  const [isToolbarDatePickerOpen, setIsToolbarDatePickerOpen] = useState(false)
  const [draggedColumn, setDraggedColumn] = useState<string | null>(null)
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null)
  const [filterDate, setFilterDate] = useState<Date>(new Date())
  const [columnOrder, setColumnOrder] = useState<string[]>([])
  const [hiddenColumns, setHiddenColumns] = useState<string[]>([])
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({})
  const [hoveredColumn, setHoveredColumn] = useState<string | null>(null)
  const [resizeDialogOpen, setResizeDialogOpen] = useState(false)
  const [resizeDialogColumn, setResizeDialogColumn] = useState<string | null>(null)
  const [resizeInputValue, setResizeInputValue] = useState<string>("")
  const tableRef = useRef<HTMLTableElement>(null)

  const [drivers, setDrivers] = useState<any[]>([])
  const [vehicleTypes, setVehicleTypes] = useState<any[]>([])
  const [customers, setCustomers] = useState<any[]>([])

  const [newRecord, setNewRecord] = useState<Record<string, any>>({})
  const [isEditMode, setIsEditMode] = useState(false)
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null)

  const [openCustomerPopover, setOpenCustomerPopover] = useState(false)
  const [openNewDriverPopover, setOpenNewDriverPopover] = useState(false)
  const [openVehiclePopover, setOpenVehiclePopover] = useState(false)

  const [searchQuery, setSearchQuery] = useState("")
  const [isUploadingFile, setIsUploadingFile] = useState(false)
  const uploadedFileRef = useRef<File | null>(null)

  const [defaultVatRate] = useState(18)
  const [customerVatRate, setCustomerVatRate] = useState<number>(defaultVatRate)
  const [driverVatRate, setDriverVatRate] = useState<number>(defaultVatRate)

  useEffect(() => {
    if (isDialogOpen) {
      setCustomerVatRate(defaultVatRate)
      setDriverVatRate(defaultVatRate)
    }
  }, [isDialogOpen, defaultVatRate])

  useEffect(() => {
    if (!schema.fields || schema.fields.length === 0) return
    const savedHidden = localStorage.getItem("hiddenColumns")
    if (savedHidden) {
      try {
        setHiddenColumns(JSON.parse(savedHidden))
      } catch (error) {
        console.error("[v0] Error loading hidden columns:", error)
      }
    } else {
      const visibleColumnIds = [
        "fldKhk7JWpnlquyHQ4l", "fldqFE8SRWBvx3lhI33", "fldMONOIhazLclMi3WN",
        "fldiIu1Wm6gC2665QdN", "fldeppUjfYTJgZZi6VI", "fldGTTvqQ8lii1wfiS5",
        "fldwQKrYxcduWAHLOcG", "fldpPsdEQlpmh7UtZ0G", "fldJrzZk9KXj8bn5Rrl",
        "fldIzCFfqbGuNtQGVqr", "fldWeK6U7xPnkEFCOgx", "fldjMfOvWEu7HtjSQmv",
        "fldoOFQdbIVJthTngkg",
      ]
      const allColumnIds = schema.fields.map((f) => f.id)
      const hiddenIds = allColumnIds.filter((id) => !visibleColumnIds.includes(id))
      setHiddenColumns(hiddenIds)
    }
  }, [schema.fields])

  useEffect(() => {
    localStorage.setItem("hiddenColumns", JSON.stringify(hiddenColumns))
  }, [hiddenColumns])

  useEffect(() => {
    const defaultOrder = [
      "fldjMfOvWEu7HtjSQmv", "fldoOFQdbIVJthTngkg", "fldKhk7JWpnlquyHQ4l",
      "fldqFE8SRWBvx3lhI33", "fldMONOIhazLclMi3WN", "fldiIu1Wm6gC2665QdN",
      "fldeppUjfYTJgZZi6VI", "fldGTTvqQ8lii1wfiS5", "fldwQKrYxcduWAHLOcG",
      "fldpPsdEQlpmh7UtZ0G", "fldJrzZk9KXj8bn5Rrl", "fldIzCFfqbGuNtQGVqr",
      "fldWeK6U7xPnkEFCOgx",
    ]
    const savedOrder = localStorage.getItem("columnOrder")
    if (savedOrder) {
      try {
        const parsedOrder = JSON.parse(savedOrder)
        const mergedOrder = [...parsedOrder]
        for (const fieldId of defaultOrder) {
          if (!mergedOrder.includes(fieldId)) {
            const defaultIndex = defaultOrder.indexOf(fieldId)
            const previousFieldId = defaultOrder[defaultIndex - 1]
            const insertIndex = previousFieldId ? mergedOrder.indexOf(previousFieldId) + 1 : 0
            mergedOrder.splice(insertIndex, 0, fieldId)
          }
        }
        setColumnOrder(mergedOrder)
      } catch (error) {
        setColumnOrder(defaultOrder)
      }
    } else {
      setColumnOrder(defaultOrder)
    }
  }, [schema.fields])

  useEffect(() => {
    if (columnOrder.length > 0) {
      localStorage.setItem("columnOrder", JSON.stringify(columnOrder))
    }
  }, [columnOrder])

  useEffect(() => {
    const savedWidths = localStorage.getItem("columnWidths")
    if (savedWidths) {
      try {
        setColumnWidths(JSON.parse(savedWidths))
      } catch (error) {
        console.error("[v0] Error loading column widths:", error)
      }
    }
  }, [])

  useEffect(() => {
    if (Object.keys(columnWidths).length > 0) {
      localStorage.setItem("columnWidths", JSON.stringify(columnWidths))
    }
  }, [columnWidths])

  const fetchRecords = useCallback(async () => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams({ skip: "0", take: "50" })
      const response = await fetch(`/api/work-schedule?${params}&t=${Date.now()}`)
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
    fetch("/api/customers").then(res => res.json()).then(data => {
      setCustomers((data.records || []).map((r: any) => ({ ...r, title: r.fields?.fldS0PNTKZseugMVhcA || "ללא שם" })))
    })
    fetch("/api/drivers").then(res => res.json()).then(data => {
      setDrivers((data.records || []).map((r: any) => ({ ...r, title: r.fields?.fld1t6uHDVHJT7mL6Hv || "ללא שם" })))
    })
    fetch("/api/vehicle-types").then(res => res.json()).then(data => {
      setVehicleTypes((data.records || []).map((r: any) => ({ ...r, title: r.fields?.fldUBeIPRhJ9JuUHXBL || "ללא שם" })))
    })
  }, [fetchRecords])

  const handleRowClick = (record: WorkScheduleRecord) => {
    const cleanId = sanitize(record.id)
    if (!cleanId) {
      toast.error("שגיאה קריטית: מזהה רשומה פגום.")
      return
    }
    setSelectedRecord(record)
    setEditingRecordId(cleanId)
    setNewRecord({ ...record.fields })
    setIsDialogOpen(true)
    setIsEditMode(true)
  }

  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set())
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  const handleDeleteSelected = () => {
    if (selectedRows.size > 0) setIsDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    try {
      const deletePromises = Array.from(selectedRows).map((id) =>
        fetch(`/api/work-schedule/${id}`, { method: "DELETE" })
      )
      const results = await Promise.all(deletePromises)
      if (results.every((r) => r.ok)) {
        toast.success("נמחק בהצלחה")
        setSelectedRows(new Set())
        await fetchRecords()
      } else {
        toast.error("שגיאה בחלק מהמחיקות")
      }
    } catch (error) {
      toast.error("שגיאה במחיקה")
    } finally {
      setIsDeleteDialogOpen(false)
    }
  }

  const toggleSelectAll = () => {
    if (selectedRows.size === filteredRecords.length) {
      setSelectedRows(new Set())
    } else {
      setSelectedRows(new Set(filteredRecords.map((r) => r.id)))
    }
  }

  const toggleSelectRow = (id: string) => {
    const newSelected = new Set(selectedRows)
    newSelected.has(id) ? newSelected.delete(id) : newSelected.add(id)
    setSelectedRows(newSelected)
  }

  const handleDialogOpenChange = (open: boolean) => {
    setIsDialogOpen(open)
    if (!open) {
      setIsEditMode(false)
      setEditingRecordId(null)
      setNewRecord({})
      setSelectedRecord(null)
      setSelectedRows(new Set())
      uploadedFileRef.current = null
    }
  }

  const handleSaveRecord = async () => {
    const priceFields = ["fldpPsdEQlpmh7UtZ0G", "fldF2pbjDa4PjHtm0bP", "fldJrzZk9KXj8bn5Rrl", "fldhBH2HAFeNviGwRlu"]
    const filteredFields = Object.entries(newRecord).filter(([k, v]) => k !== "fldf2FIOvHqALxULqrs" && v !== "" && v != null)
    const fieldsToSend = Object.fromEntries(filteredFields)
    priceFields.forEach(f => { if (!(f in fieldsToSend)) fieldsToSend[f] = 0 })

    try {
      if (isEditMode && editingRecordId) {
        const response = await fetch(`/api/work-schedule/${sanitize(editingRecordId)}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(fieldsToSend),
        })
        if (response.ok) toast.success("עודכן בהצלחה")
      } else {
        const response = await fetch("/api/work-schedule", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(fieldsToSend),
        })
        if (response.ok) toast.success("נוצר בהצלחה")
      }
      fetchRecords()
      setIsDialogOpen(false)
    } catch (error) {
      toast.error("שגיאה בשמירה")
    }
  }

  const isFormValid = () => !!newRecord.fldT720jVmGMXFURUKL && !!newRecord.fldKhk7JWpnlquyHQ4l && !!newRecord.fldqFE8SRWBvx3lhI33 && !!newRecord.fldMONOIhazLclMi3WN

  // --- תיקון הסינון לפי תאריך ---
  const filteredRecords = records.filter((record) => {
    // 1. סינון לפי תאריך
    const recordDateValue = record.fields.fldT720jVmGMXFURUKL 
    if (!recordDateValue) return false

    const recordDateStr = format(new Date(recordDateValue), "yyyy-MM-dd")
    const selectedDateStr = format(filterDate, "yyyy-MM-dd")
    const matchesDate = recordDateStr === selectedDateStr

    // 2. סינון לפי חיפוש טקסט
    const searchTerm = searchQuery.toLowerCase()
    const matchesSearch = (
      String(record.fields.fldKhk7JWpnlquyHQ4l || "").toLowerCase().includes(searchTerm) ||
      String(record.fields.fldMONOIhazLclMi3WN || "").toLowerCase().includes(searchTerm) ||
      String(record.fields.fldGTTvqQ8lii1wfiS5 || "").toLowerCase().includes(searchTerm) ||
      String(record.fields.fldwQKrYxcduWAHLOcG || "").toLowerCase().includes(searchTerm) ||
      String(record.fields.fldeppUjfYTJgZZi6VI || "").toLowerCase().includes(searchTerm)
    )

    return matchesDate && matchesSearch
  })
  // --- סוף תיקון ---

  const getDisplayColumnName = (name: string) => {
    const hebrewNames: Record<string, string> = {
      "Customer Name": "שם לקוח", "Arrival Time": "התייצבות", "Description": "תיאור",
      "Return Time": "חזור", "Vehicle Type": "סוג רכב", "Driver Name": "שם נהג",
      "Vehicle Number": "מספר רכב", "Customer Price + VAT": "מחיר לקוח+ מע״מ",
      "Driver Price + VAT": "מחיר נהג+ מע״מ", "Profit before VAT": "רווח לפני מע״מ",
      "Driver Notes": "הערות לנהג", "Send": "שלח", "Approved": "מאושר"
    }
    return hebrewNames[name] || name
  }

  const renderCell = (record: WorkScheduleRecord, field: any) => {
    const value = record.fields[field.id]
    if (field.type === "checkbox") return <div className="flex justify-center"><Checkbox checked={!!value} disabled /></div>
    if (field.type === "date") return value ? format(new Date(value), "dd/MM/yyyy") : ""
    if (field.id === "fldIzCFfqbGuNtQGVqr") {
      const profit = (record.fields.fldF2pbjDa4PjHtm0bP || 0) - (record.fields.fldhBH2HAFeNviGwRlu || 0)
      return profit.toFixed(2)
    }
    return <span className="truncate">{value}</span>
  }

  const displayedColumns = columnOrder
    .map((id) => schema.fields?.find((f) => f.id === id))
    .filter((f): f is any => !!f && !hiddenColumns.includes(f.id))

  return (
    <div className="flex flex-col h-full bg-background" dir="rtl">
      <div className="border-b p-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button onClick={() => { setIsEditMode(false); setEditingRecordId(null); setNewRecord({}); setIsDialogOpen(true); }}>
            <Plus className="h-4 w-4 ml-2" /> נסיעה חדשה
          </Button>

          <Popover open={isToolbarDatePickerOpen} onOpenChange={setIsToolbarDatePickerOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="gap-2 bg-transparent">
                <CalendarIcon className="h-4 w-4" />
                {filterDate ? format(filterDate, "PPP", { locale: he }) : "בחר תאריך"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={filterDate} onSelect={(d) => { if(d){setFilterDate(d); setIsToolbarDatePickerOpen(false)} }} locale={he} />
            </PopoverContent>
          </Popover>

          <Button onClick={handleDeleteSelected} disabled={selectedRows.size === 0} variant="outline"><Trash2 className="h-4 w-4" /></Button>

          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="חיפוש..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pr-9 w-[300px]" />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="border rounded-lg overflow-x-auto">
          <Table ref={tableRef}>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]"><Checkbox checked={selectedRows.size === filteredRecords.length && filteredRecords.length > 0} onCheckedChange={toggleSelectAll} /></TableHead>
                {displayedColumns.map((field) => (
                  <TableHead key={field.id} className="px-3" style={{ width: columnWidths[field.id] }}>{getDisplayColumnName(field.name)}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRecords.map((record) => (
                <TableRow key={record.id} onClick={() => handleRowClick(record)} className="cursor-pointer">
                  <TableCell onClick={(e) => e.stopPropagation()}><Checkbox checked={selectedRows.has(record.id)} onCheckedChange={() => toggleSelectRow(record.id)} /></TableCell>
                  {displayedColumns.map((field) => <TableCell key={field.id} className="px-3">{renderCell(record, field)}</TableCell>)}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={handleDialogOpenChange}>
        <DialogContent className="max-w-5xl h-[700px] flex flex-col">
          <DialogHeader><DialogTitle>{isEditMode ? "עריכת נסיעה" : "נסיעה חדשה"}</DialogTitle></DialogHeader>
          <Tabs defaultValue="details" className="flex-1 flex flex-col overflow-hidden">
            <TabsList className="grid w-full grid-cols-3"><TabsTrigger value="details">פרטי נסיעה</TabsTrigger><TabsTrigger value="pricing">מחירים</TabsTrigger><TabsTrigger value="customer">פרטי לקוח</TabsTrigger></TabsList>
            <TabsContent value="details" className="space-y-4 mt-4 overflow-y-auto p-1">
              <div className="grid gap-2">
                <Label>תאריך</Label>
                <Input type="date" value={newRecord.fldT720jVmGMXFURUKL || ""} onChange={(e) => setNewRecord({ ...newRecord, fldT720jVmGMXFURUKL: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label>תיאור</Label>
                <Textarea value={newRecord.fldMONOIhazLclMi3WN || ""} onChange={(e) => setNewRecord({ ...newRecord, fldMONOIhazLclMi3WN: e.target.value })} />
              </div>
            </TabsContent>
          </Tabs>
          <div className="flex justify-end gap-2 pt-4 border-t"><Button variant="outline" onClick={() => setIsDialogOpen(false)}>ביטול</Button><Button onClick={handleSaveRecord} disabled={!isFormValid()}>שמור</Button></div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
