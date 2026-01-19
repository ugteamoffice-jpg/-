"use client"

import React from "react"

// Removed redundant import of React
// import React from "react"

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
import { Textarea } from "@/components/ui/textarea" // Fixed import path from text_area to textarea
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
} from "@/components/ui/alert-dialog" // Fixed import path from alert_dialog to alert-dialog

function isValidTeableId(id: any): boolean {
  if (typeof id !== "string") return false
  if (id.length < 10 || id.length > 30) return false
  if (!id.startsWith("rec")) return false
  // Only allow alphanumeric characters after 'rec'
  if (!/^rec[a-zA-Z0-9]+$/.test(id)) return false
  return true
}

const extractValidId = (id: any): string | null => {
  if (typeof id !== "string") return null

  const match = id.match(/rec[a-zA-Z0-9]{10,27}/)
  if (match) {
    const extractedId = match[0]
    // Validate it's a proper ID
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
  const [isToolbarDatePickerOpen, setIsToolbarDatePickerOpen] = useState(false) // Add state for toolbar datepicker popover
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; fieldId: string } | null>(null)
  const [draggedColumn, setDraggedColumn] = useState<string | null>(null)
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null)
  const [openDriverPopover, setOpenDriverPopover] = useState<string | null>(null)
  const [filterDate, setFilterDate] = useState<Date>(new Date()) // Setting filterDate default to today's date
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
  const [isCreating, setIsCreating] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [editingRecordId, _setEditingRecordId] = useState<string | null>(null)

  const setEditingRecordId = _setEditingRecordId
  const [openCustomerPopover, setOpenCustomerPopover] = useState(false)
  const [openNewDriverPopover, setOpenNewDriverPopover] = useState(false)
  const [openVehiclePopover, setOpenVehiclePopover] = useState(false)

  const [searchQuery, setSearchQuery] = useState("")

  const [isUploadingFile, setIsUploadingFile] = useState(false)
  const uploadedFileRef = useRef<File | null>(null)

  // const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  // const [defaultVatRate, setDefaultVatRate] = useState(() => {
  //   if (typeof window !== "undefined") {
  //     const saved = localStorage.getItem("defaultVatRate")
  //     console.log("[v0] Loading VAT rate from localStorage:", saved)
  //     return saved ? Number.parseFloat(saved) : 18
  //   }
  //   return 18
  // })

  const [defaultVatRate] = useState(18)

  const [customerVatRate, setCustomerVatRate] = React.useState<number>(defaultVatRate)
  const [driverVatRate, setDriverVatRate] = React.useState<number>(defaultVatRate)

  React.useEffect(() => {
    if (isDialogOpen) {
      setCustomerVatRate(defaultVatRate)
      setDriverVatRate(defaultVatRate)
    }
  }, [isDialogOpen, defaultVatRate])

  // Removed VAT_RATE constant
  // const VAT_RATE = 1.17 // This seems to be a fixed VAT rate within the component, potentially overridden by defaultVatRate in settings.

  // const handleSaveVatRate = (rate: number) => {
  //   console.log("[v0] Saving VAT rate to localStorage:", rate)
  //   setDefaultVatRate(rate)
  //   localStorage.setItem("defaultVatRate", rate.toString())
  //   setIsSettingsOpen(false)
  // }

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
        "fldKhk7JWpnlquyHQ4l", // שם לקוח
        "fldqFE8SRWBvx3lhI33", // התייצבות
        "fldMONOIhazLclMi3WN", // תיאור
        "fldiIu1Wm6gC2665QdN", // חזור
        "fldeppUjfYTJgZZi6VI", // סוג רכב
        "fldGTTvqQ8lii1wfiS5", // שם נהג
        "fldwQKrYxcduWAHLOcG", // מספר רכב
        "fldpPsdEQlpmh7UtZ0G", // מחיר לקוח+ מע"מ
        "fldJrzZk9KXj8bn5Rrl", // מחיר נהג+ מע"מ
        "fldIzCFfqbGuNtQGVqr", // רווח לפני מע"מ
        "fldWeK6U7xPnkEFCOgx", // הערות לנהג
        "fldjMfOvWEu7HtjSQmv", // שלח
        "fldoOFQdbIVJthTngkg", // מאושר
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
      "fldjMfOvWEu7HtjSQmv", // שלח - ראשון (הכי ימני)
      "fldoOFQdbIVJthTngkg", // מאושר - שני
      "fldKhk7JWpnlquyHQ4l", // שם לקוח
      "fldqFE8SRWBvx3lhI33", // התייצבות
      "fldMONOIhazLclMi3WN", // תיאור
      "fldiIu1Wm6gC2665QdN", // חזור
      "fldeppUjfYTJgZZi6VI", // סוג רכב
      "fldGTTvqQ8lii1wfiS5", // שם נהג
      "fldwQKrYxcduWAHLOcG", // מספר רכב
      "fldpPsdEQlpmh7UtZ0G", // מחיר לקוח+ מע"מ
      "fldJrzZk9KXj8bn5Rrl", // מחיר נהג+ מע"מ
      "fldIzCFfqbGuNtQGVqr", // רווח לפני מע"מ
      "fldWeK6U7xPnkEFCOgx", // הערות לנהג
    ]
    
    const savedOrder = localStorage.getItem("columnOrder")
    if (savedOrder) {
      try {
        const parsedOrder = JSON.parse(savedOrder)
        // Merge: keep saved order but add any new fields that don't exist
        const mergedOrder = [...parsedOrder]
        for (const fieldId of defaultOrder) {
          if (!mergedOrder.includes(fieldId)) {
            // Insert new field after its predecessor in defaultOrder
            const defaultIndex = defaultOrder.indexOf(fieldId)
            const previousFieldId = defaultOrder[defaultIndex - 1]
            const insertIndex = previousFieldId ? mergedOrder.indexOf(previousFieldId) + 1 : 0
            mergedOrder.splice(insertIndex, 0, fieldId)
          }
        }
        setColumnOrder(mergedOrder)
      } catch (error) {
        console.error("[v0] Error loading column order:", error)
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

      const params = new URLSearchParams({
        skip: "0",
        take: "50",
      })

      const response = await fetch(`/api/work-schedule?${params}&t=${Date.now()}`)
      const data = await response.json()

      const cleanRecords = (data.records || [])
        .map((r: any) => {
          const cleanId = extractValidId(r.id)
          if (!cleanId) {
            return null
          }
          return { ...r, id: cleanId }
        })
        .filter((r: any) => r !== null)

      setRecords(cleanRecords)
    } catch (error) {
      console.error("[v0] Error fetching records:", error)
      toast.error("שגיאה בטעינת הנתונים")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchRecords()
    fetch("/api/customers")
      .then((res) => res.json())
      .then((data) => {
        const customersWithTitle = (data.records || []).map((record: any) => ({
          ...record,
          title: record.fields?.fldS0PNTKZseugMVhcA || "ללא שם",
        }))
        setCustomers(customersWithTitle)
      })
      .catch((err) => console.error("[v0] Error loading customers:", err))

    fetch("/api/drivers")
      .then((res) => res.json())
      .then((data) => {
        const driversWithTitle = (data.records || []).map((record: any) => ({
          ...record,
          title: record.fields?.fld1t6uHDVHJT7mL6Hv || "ללא שם",
        }))
        setDrivers(driversWithTitle)
      })
      .catch((err) => console.error("[v0] Error loading drivers:", err))

    fetch("/api/vehicle-types")
      .then((res) => res.json())
      .then((data) => {
        const vehiclesWithTitle = (data.records || []).map((record: any) => ({
          ...record,
          title: record.fields?.fldUBeIPRhJ9JuUHXBL || "ללא שם",
        }))
        setVehicleTypes(vehiclesWithTitle)
      })
      .catch((err) => console.error("[v0] Error loading vehicle types:", err))
  }, [fetchRecords])

  const handleRowClick = (record: WorkScheduleRecord) => {
    setSelectedRecord(record)

    if (!isValidTeableId(record.id)) {
      console.error("[v0] Blocked corrupted ID from entering editingRecordId state:", record.id)
      toast.error("שגיאה קריטית: מזהה רשומה פגום. אנא רענן את הדף.")
      setTimeout(() => window.location.reload(), 2000)
      return
    }

    const cleanId = sanitize(record.id)
    if (!cleanId) {
      console.error("[v0] Sanitizer blocked corrupted ID:", record.id)
      toast.error("שגיאה קריטית: מזהה רשומה פגום. אנא רענן את הדף.")
      setTimeout(() => window.location.reload(), 2000)
      return
    }
    setEditingRecordId(cleanId)

    const fieldsToEdit = { ...record.fields }

    setNewRecord(fieldsToEdit)
    setIsDialogOpen(true)
    setIsEditMode(true)
  }

  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set())
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  const handleDeleteSelected = async () => {
    if (selectedRows.size === 0) return
    setIsDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    try {
      const deletePromises = Array.from(selectedRows).map((id) =>
        fetch(`/api/work-schedule/${id}`, {
          method: "DELETE",
        }),
      )

      const results = await Promise.all(deletePromises)
      const allSuccessful = results.every((r) => r.ok)

      if (allSuccessful) {
        toast.success(`${selectedRows.size} רשומות נמחקו בהצלחה`)
        setSelectedRows(new Set())
        await fetchRecords()
      } else {
        toast.error("אירעה שגיאה במחיקת חלק מהרשומות")
      }
    } catch (error) {
      toast.error("אירעה שגיאה במחיקת הרשומות")
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
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedRows(newSelected)
  }

  const handleDialogOpenChange = (open: boolean) => {
    setIsDialogOpen(open)
    if (!open) {
      // Reset all state when closing
      setIsEditMode(false)
      setEditingRecordId(null)
      setNewRecord({})
      setSelectedRecord(null)
      setSelectedRows(new Set()) // Reset selection when closing dialog
      uploadedFileRef.current = null
    }
  }

  const handleSaveRecord = async () => {
    if (isEditMode && editingRecordId) {
      // Using sanitize wrapper for editingRecordId
      const cleanId = sanitize(editingRecordId)
      if (!cleanId) {
        console.error("[v0] CRITICAL: handleSaveRecord - editingRecordId is invalid after sanitize:", editingRecordId)
        toast.error("שגיאה קריטית: מזהה רשומה פגום. אנא רענן את הדף.")
        return
      }
      // Update existing record
      try {
        const priceFields = [
          "fldpPsdEQlpmh7UtZ0G", // מחיר לקוח+ מע"מ
          "fldF2pbjDa4PjHtm0bP", // מחיר לקוח כולל מע"מ
          "fldJrzZk9KXj8bn5Rrl", // מחיר נהג+ מע"מ
          "fldhBH2HAFeNviGwRlu", // מחיר נהג כולל מע"מ
        ]

        const filteredFields = Object.entries(newRecord).filter(
          ([_, value]) => value !== "" && value !== null && value !== undefined,
        )

        const fieldsToSend = Object.fromEntries(filteredFields)

        priceFields.forEach((fieldId) => {
          if (!(fieldId in fieldsToSend)) {
            fieldsToSend[fieldId] = 0
          }
        })

        const response = await fetch(`/api/work-schedule/${cleanId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(fieldsToSend),
        })

        if (!response.ok) {
          const error = await response.json()
          toast({
            title: "שגיאה בעדכון",
            description: error.details || "לא ניתן לעדכן את הנסיעה",
            variant: "destructive",
          })
          return
        }

        toast({
          title: "הנסיעה עודכנה בהצלחה",
          description: "השינויים נשמרו בטבלה",
        })

        fetchRecords()
        setIsDialogOpen(false)
        setNewRecord({})
        setIsEditMode(false)
        setEditingRecordId(null)
      } catch (error) {
        toast({
          title: "שגיאה",
          description: "אירעה שגיאה בעדכון הנסיעה",
          variant: "destructive",
        })
      }
    } else {
      try {
        const priceFields = ["fldpPsdEQlpmh7UtZ0G", "fldF2pbjDa4PjHtm0bP", "fldJrzZk9KXj8bn5Rrl", "fldhBH2HAFeNviGwRlu"]

        const filteredFields = Object.entries(newRecord).filter(([key, value]) => {
          // Skip file field for now
          if (key === "fldf2FIOvHqALxULqrs") {
            return false
          }
          return value !== "" && value !== null && value !== undefined
        })

        const fieldsToSend = Object.fromEntries(filteredFields)

        priceFields.forEach((fieldId) => {
          if (!(fieldId in fieldsToSend)) {
            fieldsToSend[fieldId] = 0
          }
        })

        const response = await fetch("/api/work-schedule", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(fieldsToSend),
        })

        if (!response.ok) {
          const error = await response.json()
          toast({
            title: "שגיאה ביצירת נסיעה",
            description: error.details || "לא ניתן ליצור את הנסיעה",
            variant: "destructive",
          })
          return
        }

        const createdRecord = await response.json()

        let recordId = null

        // Try multiple paths to get the ID
        if (createdRecord.records?.[0]?.id) {
          recordId = createdRecord.records[0].id
        } else if (createdRecord.id) {
          recordId = createdRecord.id
        }

        const cleanRecordId = sanitize(recordId)
        if (!cleanRecordId) {
          console.error("[v0] Invalid record ID received after sanitize:", recordId, "Full response:", createdRecord)
          toast({
            title: "שגיאה קריטית",
            description: "הרשומה נוצרה אך לא התקבל מזהה תקין. נסה לרענן את הדף.",
            variant: "destructive",
          })
          fetchRecords()
          setIsDialogOpen(false)
          setNewRecord({})
          return
        }

        // </CHANGE> Removed debug log for performance

        if (uploadedFileRef.current) {
          const fileFormData = new FormData()
          fileFormData.append("file", uploadedFileRef.current)
          fileFormData.append("tableId", "tblVAQgIYOLfvCZdqgj")
          fileFormData.append("recordId", cleanRecordId)
          fileFormData.append("fieldId", "fldf2FIOvHqALxULqrs")

          const uploadResponse = await fetch("/api/simple-upload", {
            method: "POST",
            body: fileFormData,
          })

          if (uploadResponse.ok) {
            toast({
              title: "נסיעה נוצרה",
              description: "הנסיעה והקובץ נוצרו בהצלחה",
            })
          } else {
            const uploadError = await response.json()
            console.error("File upload failed:", uploadError)
            toast({
              title: "נסיעה נוצרה",
              description: "הנסיעה נוצרה אך הקובץ לא הועלה. אנא ערוך את הנסיעה והעלה את הקובץ שוב.",
            })
          }
        } else {
          toast({
            title: "נסיעה נוצרה",
            description: "הנסיעה נוצרה בהצלחה",
          })
        }

        fetchRecords()
        setIsDialogOpen(false)
        setNewRecord({})
        uploadedFileRef.current = null
      } catch (error) {
        console.error("Error creating record:", error)
        toast({
          title: "שגיאה",
          description: "אירעה שגיאה ביצירת הנסיעה",
          variant: "destructive",
        })
      }
    }
  }

  const isFormValid = () => {
    const valid =
      !!newRecord.fldT720jVmGMXFURUKL && // תאריך
      !!newRecord.fldKhk7JWpnlquyHQ4l?.length && // שם לקוח
      !!newRecord.fldqFE8SRWBvx3lhI33 && // התייצבות
      !!newRecord.fldMONOIhazLclMi3WN // תיאור
    // </CHANGE> removed debug console.log statements
    return valid
  }

  const calculatedProfit = useMemo(() => {
    const customerPriceTotal = newRecord.fldF2pbjDa4PjHtm0bP || 0
    const driverPriceTotal = newRecord.fldhBH2HAFeNviGwRlu || 0

    if (customerPriceTotal > 0 || driverPriceTotal > 0) {
      return customerPriceTotal - driverPriceTotal
    }
    return null
  }, [newRecord.fldF2pbjDa4PjHtm0bP, newRecord.fldhBH2HAFeNviGwRlu])

  const handleFileUpload = async (file: File) => {
    // Just store the file for later upload
    uploadedFileRef.current = file
    toast.success(`קובץ ${file.name} מוכן להעלאה`)
  }

  const availableColumns = schema.fields || []

  const displayedColumns = columnOrder
    .map((fieldId) => availableColumns.find((f) => f.id === fieldId))
    .filter((field): field is typeof field => field !== undefined && !hiddenColumns.includes(field.id))
  
  // Debug: Check if vehicle number field is included
  React.useEffect(() => {
    const vehicleNumberInOrder = columnOrder.includes("fldwQKrYxcduWAHLOcG")
    const vehicleNumberHidden = hiddenColumns.includes("fldwQKrYxcduWAHLOcG")
    const vehicleNumberDisplayed = displayedColumns.some(f => f.id === "fldwQKrYxcduWAHLOcG")
    console.log("[v0] מספר רכב - InOrder:", vehicleNumberInOrder, "Hidden:", vehicleNumberHidden, "Displayed:", vehicleNumberDisplayed)
    console.log("[v0] columnOrder:", columnOrder)
    console.log("[v0] hiddenColumns:", hiddenColumns)
  }, [columnOrder, hiddenColumns, displayedColumns])

  const filteredRecords = records.filter((record) => {
    const searchTerm = searchQuery.toLowerCase()
    return (
      String(record.fields.fldKhk7JWpnlquyHQ4l || "")
        .toLowerCase()
        .includes(searchTerm) ||
      String(record.fields.fldMONOIhazLclMi3WN || "")
        .toLowerCase()
        .includes(searchTerm) ||
      String(record.fields.fldGTTvqQ8lii1wfiS5 || "")
        .toLowerCase()
        .includes(searchTerm) ||
      String(record.fields.fldwQKrYxcduWAHLOcG || "")
        .toLowerCase()
        .includes(searchTerm) ||
      String(record.fields.fldeppUjfYTJgZZi6VI || "")
        .toLowerCase()
        .includes(searchTerm)
    )
  })

  const getColumnWidth = (fieldId: string) => {
    return columnWidths[fieldId] ? `${columnWidths[fieldId]}px` : undefined
  }

  const getDisplayColumnName = (name: string) => {
    // Hebrew names or fallback to English
    const hebrewNames: Record<string, string> = {
      "Customer Name": "שם לקוח",
      "Arrival Time": "התייצבות",
      Description: "תיאור",
      "Return Time": "חזור",
      "Vehicle Type": "סוג רכב",
      "Driver Name": "שם נהג",
      "Vehicle Number": "מספר רכב", // Added Hebrew name for Vehicle Number
      "Customer Price + VAT": "מחיר לקוח+ מע״מ",
      "Customer Price Total": "מחיר לקוח כולל מע״מ",
      "Driver Price + VAT": "מחיר נהג+ מע״מ",
      "Driver Price Total": "מחיר נהג כולל מע״מ",
      "Profit before VAT": "רווח לפני מע״מ",
      "Driver Notes": "הערות לנהג",
      Send: "שלח",
      Approved: "מאושר",
      "Order Form": "טופס הזמנה",
      "Orderer Name": "שם מזמין",
      "Mobile Phone": "טלפון נייד",
      "ID Number": 'ת"ז',
    }
    return hebrewNames[name] || name
  }

  const hideColumn = (fieldId: string) => {
    setHiddenColumns((prev) => [...prev, fieldId])
  }

  const showColumn = (fieldId: string) => {
    setHiddenColumns((prev) => prev.filter((id) => id !== fieldId))
  }

  const openResizeDialog = (e: React.MouseEvent, fieldId: string) => {
    e.stopPropagation()
    setResizeDialogColumn(fieldId)
    setResizeInputValue(String(columnWidths[fieldId] || 150)) // Default to 150 if not set
    setResizeDialogOpen(true)
  }

  const handleResizeColumn = () => {
    if (resizeDialogColumn && resizeInputValue) {
      const width = Number.parseInt(resizeInputValue, 10)
      if (!isNaN(width) && width > 0) {
        setColumnWidths((prev) => ({ ...prev, [resizeDialogColumn]: width }))
        setResizeDialogOpen(false)
        setResizeDialogColumn(null)
        setResizeInputValue("")
      }
    }
  }

  const handleColumnDragStart = (e: React.DragEvent<HTMLDivElement>, fieldId: string) => {
    e.dataTransfer.setData("text/plain", fieldId)
    setDraggedColumn(fieldId)
  }

  const handleColumnDragOver = (e: React.DragEvent<HTMLDivElement>, fieldId: string) => {
    e.preventDefault()
    if (draggedColumn && draggedColumn !== fieldId) {
      setDragOverColumn(fieldId)
    }
  }

  const handleColumnDrop = (e: React.DragEvent<HTMLDivElement>, fieldId: string) => {
    e.preventDefault()
    const sourceFieldId = e.dataTransfer.getData("text/plain")
    if (sourceFieldId && sourceFieldId !== fieldId) {
      setColumnOrder((prevOrder) => {
        const newOrder = [...prevOrder]
        const sourceIndex = newOrder.indexOf(sourceFieldId)
        const targetIndex = newOrder.indexOf(fieldId)

        if (sourceIndex > -1 && targetIndex > -1) {
          // Remove source and insert at target position
          newOrder.splice(sourceIndex, 1)
          newOrder.splice(targetIndex, 0, sourceFieldId)
          return newOrder
        }
        return prevOrder
      })
    }
    setDraggedColumn(null)
    setDragOverColumn(null)
  }

  const handleColumnDragEnd = () => {
    setDraggedColumn(null)
    setDragOverColumn(null)
  }

  const renderCell = (record: WorkScheduleRecord, field: any) => {
    // Using sanitize wrapper for record.id
    const cleanRecordId = sanitize(record.id)
    if (!cleanRecordId) {
      console.error("[v0] CRITICAL: renderCell detected invalid record ID:", record.id, "Field:", field.id)
      toast.error(`שגיאה קריטית: רשומה עם מזהה פגום בשדה ${field.name || field.id}`)
      return <span className="text-red-500">מזהה פגום</span>
    }

    const value = record.fields[field.id]

    if (field.type === "checkbox") {
      return (
        <div className="flex items-center justify-center">
          <Checkbox checked={!!value} disabled />
        </div>
      )
    }

    if (field.type === "date") {
      return value ? format(new Date(value), "P") : ""
    }

    if (field.type === "link") {
      // Assuming linked records have a 'title' or similar field
      if (Array.isArray(value)) {
        return value.map((item: any) => item.title || item.id).join(", ")
      }
      return value?.title || value?.id || ""
    }

    if (field.type === "multicheckbox") {
      return (
        <div className="flex items-center justify-center">
          <Checkbox checked={!!value} disabled />
        </div>
      )
    }

    if (field.id === "fldf2FIOvHqALxULqrs" && value && Array.isArray(value) && value.length > 0) {
      const fileData = value[0]
      const uploadDate = fileData?.createdTime ? new Date(fileData.createdTime) : null
      const formattedDate = uploadDate ? format(uploadDate, "dd/MM/yyyy HH:mm", { locale: he }) : ""

      return (
        <div className="flex flex-col gap-1 text-sm">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={async () => {
                try {
                  const fileData = newRecord.fldf2FIOvHqALxULqrs?.[0]
                  const attachmentToken = fileData?.token || fileData?.id

                  if (!attachmentToken) {
                    toast.error("לא נמצא קובץ")
                    return
                  }

                  // Fetch the file through the proxy
                  const response = await fetch(`/api/view-file?token=${attachmentToken}`)

                  if (!response.ok) {
                    toast.error("שגיאה בטעינת הקובץ")
                    return
                  }

                  // Convert to Blob
                  const blob = await response.blob()

                  // Create a local Blob URL
                  const blobUrl = URL.createObjectURL(blob)

                  // Open in new tab
                  window.open(blobUrl, "_blank")

                  // Clean up after 10 seconds
                  setTimeout(() => {
                    URL.revokeObjectURL(blobUrl)
                  }, 10000)
                } catch (error) {
                  console.error("Error opening file:", error)
                  toast.error("שגיאה בפתיחת הקובץ")
                }
              }}
            >
              פתח קובץ
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={async () => {
                try {
                  const fileData = newRecord.fldf2FIOvHqALxULqrs?.[0]
                  const attachmentToken = fileData?.token || fileData?.id || fileData?.presignedUrl

                  if (!attachmentToken) {
                    toast.error("לא נמצא קובץ")
                    return
                  }

                  let fileUrl: string | null = null

                  // Prefer presignedUrl if available
                  if (fileData?.presignedUrl) {
                    fileUrl = fileData.presignedUrl
                  } else {
                    const response = await fetch(`/api/attachment-url?token=${attachmentToken}`)
                    if (!response.ok) {
                      toast.error("שגיאה בקבלת כתובת הקובץ")
                      return
                    }
                    const data = await response.json()
                    if (data.url) {
                      fileUrl = data.url
                    } else {
                      toast.error("לא התקבלה כתובת לקובץ")
                    }
                  }

                  if (fileUrl) {
                    const link = document.createElement("a")
                    link.href = fileUrl
                    link.download = fileData?.name || "file"
                    link.click()
                  }
                } catch (error) {
                  console.error("[v0] Error downloading file:", error)
                  toast.error("שגיאה בהורדת הקובץ")
                }
              }}
            >
              הורד
            </Button>
          </div>
          {formattedDate && <span className="text-xs text-muted-foreground">הועלה: {formattedDate}</span>}
        </div>
      )
    }

    // Handle calculated profit
    if (field.id === "fldIzCFfqbGuNtQGVqr") {
      const customerPriceTotal = record.fields.fldF2pbjDa4PjHtm0bP || 0
      const driverPriceTotal = record.fields.fldhBH2HAFeNviGwRlu || 0
      const profit = customerPriceTotal - driverPriceTotal
      return profit > 0 ? profit.toFixed(2) : ""
    }

    return (
      <span className="truncate" title={value}>
        {value}
      </span>
    )
  }

  // Placeholder for fields and editingRecord variables, they are not defined in the provided snippet.
  // They would typically be defined based on the current context, like editingRecordId.
  const fields = schema.fields || []
  const editingRecord = records.find((r) => sanitize(r.id) === editingRecordId) || null
  // Ensure setIsEditModalOpen is defined if used in the update
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  const currentAttachment = newRecord.fldf2FIOvHqALxULqrs?.[0] // Assuming this is how attachment data is accessed

  return (
    <div className="flex flex-col h-full bg-background" dir="rtl">
      <div className="border-b p-4">
        {/* <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">סידור עבודה</h1>
        </div> */}

        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {/* UPDATED Button to open dialog in create mode */}
            <Button
              onClick={() => {
                setIsEditMode(false)
                setEditingRecordId(null)
                setNewRecord({})
                setIsDialogOpen(true)
              }}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              נסיעה חדשה
            </Button>

            <Popover open={isToolbarDatePickerOpen} onOpenChange={setIsToolbarDatePickerOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="gap-2 bg-transparent">
                  <CalendarIcon className="h-4 w-4" />
                  {filterDate ? format(filterDate, "PPP", { locale: he }) : "בחר תאריך"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={filterDate}
                  onSelect={(date) => {
                    if (date) {
                      setFilterDate(date)
                      setIsToolbarDatePickerOpen(false)
                    }
                  }}
                  locale={he}
                />
                <div className="p-3 border-t">
                  <Button
                    variant="outline"
                    className="w-full bg-transparent"
                    onClick={() => {
                      setFilterDate(new Date())
                      setIsToolbarDatePickerOpen(false)
                    }}
                  >
                    היום
                  </Button>
                </div>
              </PopoverContent>
            </Popover>

            {/* REPLACED REFRESH BUTTON */}

            <Button
              onClick={handleDeleteSelected}
              disabled={selectedRows.size === 0}
              variant="outline"
              className="gap-2 bg-transparent"
            >
              <Trash2 className="h-4 w-4" />
              מחק ({selectedRows.size})
            </Button>

            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="חיפוש לפי לקוח, נהג, תיאור או רכב..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-9 w-[300px]"
              />
            </div>
          </div>

          {hiddenColumns.length > 0 && (
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="icon">
                  <EyeOff className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64" align="end">
                <div className="flex flex-col max-h-96">
                  <div className="font-semibold text-sm mb-3 px-2 pt-2">עמודות מוסתרות</div>
                  <div className="overflow-y-auto space-y-2 px-2 pb-2">
                    {hiddenColumns
                      .filter((fieldId) => {
                        // Hide these fields from the menu
                        const excludedFields = [
                          "fldT720jVmGMXFURUKL", // תאריך
                          "fldcSKtFOjZMDyWHALR", // מע"מ
                          "fldIzCFfqbGuNtQGVqr", // רווח+ מע"מ (formula)
                          "fld1D8vLMOAfE6YDkJw", // פורמולה מחיר לקוח כולל מע"מ
                          "fldNiPjXmxzjmO3hmes", // פורמולה מחיר לקוח לפני מע"מ
                          "fldYKvr7bgWRXeubcE0", // פורמולה מחיר נהג כולל מע"מ
                          "fldR9T08H44CGicgMqM", // פורמולה מחיר נהג לפני מע"מ
                        ]
                        return !excludedFields.includes(fieldId)
                      })
                      .map((fieldId) => {
                        const field = availableColumns.find((f) => f.id === fieldId)
                        if (!field) return null
                        return (
                          <div key={fieldId} className="flex items-center justify-between p-2 hover:bg-accent rounded">
                            <span className="text-sm">{getDisplayColumnName(field.name)}</span>
                            <Button variant="ghost" size="sm" onClick={() => showColumn(fieldId)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        )
                      })}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="border rounded-lg overflow-x-auto">
          <Table ref={tableRef}>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">
                  <div className="flex items-center justify-center">
                    <Checkbox
                      checked={selectedRows.size === filteredRecords.length && filteredRecords.length > 0}
                      onCheckedChange={toggleSelectAll}
                    />
                  </div>
                </TableHead>

                {displayedColumns.map((field: any) => (
                  <ContextMenu key={field.id}>
                    <ContextMenuTrigger asChild>
                      <TableHead
                        className="px-3 relative group"
                        style={{ width: getColumnWidth(field.id) }}
                        onMouseEnter={() => setHoveredColumn(field.id)}
                        onMouseLeave={() => setHoveredColumn(null)}
                      >
                        {hoveredColumn === field.id && (
                          <button
                            className="absolute left-2 top-1/2 -translate-y-1/2 p-1 hover:bg-accent rounded z-20"
                            onClick={(e) => openResizeDialog(e, field.id)}
                          >
                            <ChevronsLeftRight className="h-4 w-4 text-muted-foreground" />
                          </button>
                        )}
                        <div
                          className={`cursor-move truncate ${draggedColumn === field.id ? "opacity-50" : ""} ${
                            dragOverColumn === field.id ? "bg-accent" : ""
                          } ${field.type === "checkbox" ? "text-center" : ""}`}
                          draggable
                          onDragStart={(e) => handleColumnDragStart(e, field.id)}
                          onDragOver={(e) => handleColumnDragOver(e, field.id)}
                          onDrop={(e) => handleColumnDrop(e, field.id)}
                          onDragEnd={handleColumnDragEnd}
                        >
                          {getDisplayColumnName(field.name)}
                        </div>
                      </TableHead>
                    </ContextMenuTrigger>
                    <ContextMenuContent>
                      <ContextMenuItem onClick={() => hideColumn(field.id)}>
                        <EyeOff className="h-4 w-4 ml-2" />
                        הסתר עמודה
                      </ContextMenuItem>
                    </ContextMenuContent>
                  </ContextMenu>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRecords.map((record) => (
                <TableRow
                  key={record.id}
                  onClick={() => handleRowClick(record)}
                  className="cursor-pointer hover:bg-muted/50"
                >
                  <TableCell className="w-[50px]" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-center">
                      <Checkbox
                        checked={selectedRows.has(record.id)}
                        onCheckedChange={() => toggleSelectRow(record.id)}
                      />
                    </div>
                  </TableCell>

                  {displayedColumns.map((field: any) => {
                    const value = record.fields[field.id]

                    return (
                      <TableCell key={field.id} className="px-3" style={{ width: getColumnWidth(field.id) }}>
                        {renderCell(record, field)}
                      </TableCell>
                    )
                  })}
                </TableRow>
              ))}
              {filteredRecords.length === 0 && (
                <TableRow>
                  <TableCell colSpan={displayedColumns.length + 1} className="text-center py-8 text-muted-foreground">
                    אין נתונים להצגה
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={handleDialogOpenChange}>
        <DialogContent className="max-w-5xl h-[700px] flex flex-col">
          <DialogHeader>
            <DialogTitle>{isEditMode ? "עריכת נסיעה" : "נסיעה חדשה"}</DialogTitle>
            <DialogDescription>
              {isEditMode ? "ערוך את פרטי הנסיעה" : "מלא את הפרטים ליצירת נסיעה חדשה"}
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="details" className="w-full flex-1 flex flex-col overflow-hidden" dir="rtl">
            <TabsList className="grid w-full grid-cols-3 flex-shrink-0">
              <TabsTrigger value="details">פרטי נסיעה</TabsTrigger>
              <TabsTrigger value="pricing">מחירים</TabsTrigger>
              <TabsTrigger value="customer">פרטי לקוח</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-4 mt-4 flex-1 overflow-y-auto">
              {/* תאריך */}
              <div className="grid gap-2">
                <Label htmlFor="date" className="text-right block">
                  תאריך {!editingRecordId && <span className="text-red-500">*</span>}
                </Label>
                <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-right font-normal bg-transparent">
                      <CalendarIcon className="ml-2 h-4 w-4" />
                      {newRecord.fldT720jVmGMXFURUKL
                        ? format(new Date(newRecord.fldT720jVmGMXFURUKL), "PPP", { locale: he })
                        : "בחר תאריך"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={newRecord.fldT720jVmGMXFURUKL ? new Date(newRecord.fldT720jVmGMXFURUKL) : undefined}
                      onSelect={(date) => {
                        if (date) {
                          setNewRecord({ ...newRecord, fldT720jVmGMXFURUKL: format(date, "yyyy-MM-dd") })
                          setIsDatePickerOpen(false)
                        }
                      }}
                      locale={he}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* שם לקוח */}
              <div className="space-y-2">
                <Label>שם לקוח {!editingRecordId && <span className="text-red-500">*</span>}</Label>
                <Popover open={openCustomerPopover} onOpenChange={setOpenCustomerPopover}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      className="w-full justify-between text-right bg-transparent"
                    >
                      {(() => {
                        const customerField = newRecord.fldKhk7JWpnlquyHQ4l
                        let customerName = "בחר לקוח"

                        if (customerField) {
                          if (Array.isArray(customerField)) {
                            // Format 1: Array of objects with id and title
                            if (customerField[0]?.title) {
                              customerName = customerField[0].title
                            }
                            // Format 2: Array of strings (just IDs)
                            else if (typeof customerField[0] === "string" && customers.length > 0) {
                              const customer = customers.find((c) => c.id === customerField[0])
                              if (customer) {
                                customerName = customer.title || "בחר לקוח"
                              }
                            }
                            // Format 3: Array with objects containing id
                            else if (customerField[0]?.id && customers.length > 0) {
                              const customer = customers.find((c) => c.id === customerField[0].id)
                              if (customer) {
                                customerName = customer.title || "בחר לקוח"
                              }
                            }
                          } else if (typeof customerField === "object" && customerField.title) {
                            // Format 4: Single object with title
                            customerName = customerField.title
                          } else if (typeof customerField === "string" && customers.length > 0) {
                            // Format 5: Just the ID string
                            const customer = customers.find((c) => c.id === customerField)
                            if (customer) {
                              customerName = customer.title || "בחר לקוח"
                            }
                          }
                        }

                        return customerName
                      })()}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0" align="start">
                    <Command>
                      <CommandInput placeholder="חפש לקוח..." className="text-right" />
                      <CommandList>
                        <CommandEmpty>לא נמצאו לקוחות</CommandEmpty>
                        <CommandGroup>
                          {customers.map((customer) => (
                            <CommandItem
                              key={customer.id}
                              value={customer.title}
                              onSelect={() => {
                                setNewRecord({
                                  ...newRecord,
                                  fldKhk7JWpnlquyHQ4l: [customer.id],
                                })
                                setOpenCustomerPopover(false)
                              }}
                              className="text-right"
                            >
                              {customer.title}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              {/* תיאור */}
              <div className="grid gap-2">
                <Label htmlFor="description">תיאור {!editingRecordId && <span className="text-red-500">*</span>}</Label>
                <Textarea
                  id="description"
                  value={newRecord.fldMONOIhazLclMi3WN || ""}
                  onChange={(e) => setNewRecord({ ...newRecord, fldMONOIhazLclMi3WN: e.target.value })}
                  rows={3}
                  className="text-right"
                />
              </div>

              {/* התייצבות */}
              <div className="grid gap-2">
                <Label htmlFor="arrival" className="text-right block">
                  התייצבות {!editingRecordId && <span className="text-red-500">*</span>}
                </Label>
                <Input
                  id="arrival"
                  type="time"
                  value={newRecord.fldqFE8SRWBvx3lhI33 || ""}
                  onChange={(e) => setNewRecord({ ...newRecord, fldqFE8SRWBvx3lhI33: e.target.value })}
                  className="text-right"
                />
              </div>

              {/* חזור */}
              <div className="grid gap-2">
                <Label htmlFor="return">חזור</Label>
                <Input
                  id="return"
                  type="time"
                  value={newRecord.fldiIu1Wm6gC2665QdN || ""}
                  onChange={(e) => setNewRecord({ ...newRecord, fldiIu1Wm6gC2665QdN: e.target.value })}
                  className="text-right"
                />
              </div>

              {/* סוג רכב */}
              <div className="grid gap-2">
                <Label htmlFor="vehicle">סוג רכב</Label>
                <Popover open={openVehiclePopover} onOpenChange={setOpenVehiclePopover}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-between text-right font-normal bg-transparent">
                      {(() => {
                        const vehicleField = newRecord.fldeppUjfYTJgZZi6VI
                        if (!vehicleField || (Array.isArray(vehicleField) && vehicleField.length === 0)) {
                          return "בחר סוג רכב"
                        }

                        // If it's an array with objects that have title
                        if (Array.isArray(vehicleField) && vehicleField[0]?.title) {
                          return vehicleField[0].title
                        }

                        // If it's an array with IDs or objects with id property
                        if (Array.isArray(vehicleField)) {
                          const vehicleId = typeof vehicleField[0] === "string" ? vehicleField[0] : vehicleField[0]?.id
                          const foundVehicle = vehicleTypes.find((v) => v.id === vehicleId)
                          return foundVehicle?.title || "בחר סוג רכב"
                        }

                        // If it's a single object with title
                        if (typeof vehicleField === "object" && vehicleField.title) {
                          return vehicleField.title
                        }

                        // If it's just an ID string
                        if (typeof vehicleField === "string") {
                          const foundVehicle = vehicleTypes.find((v) => v.id === vehicleField)
                          return foundVehicle?.title || "בחר סוג רכב"
                        }

                        return "בחר סוג רכב"
                      })()}
                      <ChevronsUpDown className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0" align="start">
                    <Command>
                      <CommandInput placeholder="חפש סוג רכב..." />
                      <CommandList>
                        <CommandEmpty>לא נמצא סוג רכב</CommandEmpty>
                        <CommandGroup>
                          {vehicleTypes.map((vehicle) => (
                            <CommandItem
                              key={vehicle.id}
                              value={vehicle.title}
                              onSelect={() => {
                                setNewRecord({ ...newRecord, fldeppUjfYTJgZZi6VI: [vehicle.id] })
                                setOpenVehiclePopover(false)
                              }}
                              className="cursor-pointer"
                            >
                              {vehicle.title}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              {/* שם נהג */}
              <div className="grid gap-2">
                <Label htmlFor="driver">שם נהג</Label>
                <Popover open={openNewDriverPopover} onOpenChange={setOpenNewDriverPopover}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-between text-right font-normal bg-transparent">
                      {(() => {
                        const driverField = newRecord.fldGTTvqQ8lii1wfiS5
                        if (!driverField || (Array.isArray(driverField) && driverField.length === 0)) {
                          return "בחר נהג"
                        }

                        // If it's an array with objects that have title
                        if (Array.isArray(driverField) && driverField[0]?.title) {
                          return driverField[0].title
                        }

                        // If it's an array with IDs or objects with id property
                        if (Array.isArray(driverField)) {
                          const driverId = typeof driverField[0] === "string" ? driverField[0] : driverField[0]?.id
                          const foundDriver = drivers.find((d) => d.id === driverId)
                          return foundDriver?.title || "בחר נהג"
                        }

                        // If it's a single object with title
                        if (typeof driverField === "object" && driverField.title) {
                          return driverField.title
                        }

                        // If it's just an ID string
                        if (typeof driverField === "string") {
                          const foundDriver = drivers.find((d) => d.id === driverField)
                          return foundDriver?.title || "בחר נהג"
                        }

                        return "בחר נהג"
                      })()}
                      <ChevronsUpDown className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0" align="start">
                    <Command>
                      <CommandInput placeholder="חפש נהג..." />
                      <CommandList>
                        <CommandEmpty>לא נמצא נהג</CommandEmpty>
                        <CommandGroup>
                          {drivers.map((driver) => (
                            <CommandItem
                              key={driver.id}
                              value={driver.title}
                              onSelect={() => {
                                setNewRecord({ ...newRecord, fldGTTvqQ8lii1wfiS5: [driver.id] })
                                setOpenNewDriverPopover(false)
                              }}
                              className="cursor-pointer"
                            >
                              {driver.title}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              {/* מספר רכב */}
              <div className="grid gap-2">
                <Label htmlFor="vehicle-number">מספר רכב</Label>
                <Input
                  id="vehicle-number"
                  value={newRecord.fldwQKrYxcduWAHLOcG || ""}
                  onChange={(e) => setNewRecord({ ...newRecord, fldwQKrYxcduWAHLOcG: e.target.value })}
                  className="text-right"
                />
              </div>

              {/* הערות לנהג */}
              <div className="grid gap-2">
                <Label htmlFor="driver-notes">הערות לנהג</Label>
                <Textarea
                  id="driver-notes"
                  value={newRecord.fldWeK6U7xPnkEFCOgx || ""}
                  onChange={(e) => setNewRecord({ ...newRecord, fldWeK6U7xPnkEFCOgx: e.target.value })}
                  rows={2}
                  className="text-right"
                />
              </div>

              {/* הערות מנהל */}
              <div className="grid gap-2">
                <Label htmlFor="admin-notes">הערות מנהל</Label>
                <Textarea
                  id="admin-notes"
                  value={newRecord.fldjh2IDuPaJMXIpbpg || ""}
                  onChange={(e) => setNewRecord({ ...newRecord, fldjh2IDuPaJMXIpbpg: e.target.value })}
                  rows={3}
                  className="text-right"
                />
              </div>

              {/* טופס הזמנה */}
              <div className="grid gap-2">
                <Label htmlFor="order-form">טופס הזמנה</Label>
                {(!newRecord.fldf2FIOvHqALxULqrs || newRecord.fldf2FIOvHqALxULqrs.length === 0) && (
                  <Input
                    type="file"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                    onChange={async (e) => {
                      const file = e.target.files?.[0]
                      if (!file) return

                      // </CHANGE> Removed debug logs for performance

                      if (editingRecordId) {
                        // </CHANGE> Removed debug log for performance

                        setIsUploadingFile(true)
                        const formData = new FormData()
                        formData.append("file", file)
                        formData.append("recordId", editingRecordId)

                        // </CHANGE> Removed debug log for performance

                        try {
                          const response = await fetch("/api/replace-file", {
                            method: "POST",
                            body: formData,
                          })

                          // </CHANGE> Removed debug log for performance

                          if (!response.ok) {
                            const error = await response.json()
                            toast.error(`שגיאה בהעלאת הקובץ: ${error.error || "Unknown error"}`)
                            // </CHANGE> Removed debug log for performance
                            return
                          }

                          const result = await response.json()
                          // </CHANGE> Removed debug log for performance

                          setNewRecord({
                            ...newRecord,
                            fldf2FIOvHqALxULqrs: result.file ? [result.file] : [],
                          })

                          toast.success("הקובץ הוחלף בהצלחה")
                          await fetchRecords()
                        } catch (error) {
                          toast.error("שגיאה בהעלאת הקובץ")
                          // </CHANGE> Removed debug log for performance
                        } finally {
                          setIsUploadingFile(false)
                        }
                      } else {
                        // </CHANGE> Removed debug log for performance
                        uploadedFileRef.current = file
                        setNewRecord({
                          ...newRecord,
                          fldf2FIOvHqALxULqrs: [{ name: file.name, size: file.size }],
                        })
                      }
                    }}
                    className="text-right"
                    disabled={isUploadingFile}
                  />
                )}
                {newRecord.fldf2FIOvHqALxULqrs && newRecord.fldf2FIOvHqALxULqrs.length > 0 && (
                  <div className="space-y-2">
                    {(() => {
                      const fileData = newRecord.fldf2FIOvHqALxULqrs[0]
                      const uploadTimestamp = newRecord.fldaYObzsPsH5wKsplF
                      return (
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center justify-between gap-4">
                            {/* </CHANGE> Removed debug logs for performance */}
                            <p className="text-sm text-right">{fileData?.name}</p>
                            <div className="flex gap-2">
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                onClick={async () => {
                                  try {
                                    const response = await fetch("/api/simple-delete", {
                                      method: "POST",
                                      headers: { "Content-Type": "application/json" },
                                      body: JSON.stringify({ recordId: editingRecordId }),
                                    })

                                    if (!response.ok) {
                                      throw new Error("Failed to delete")
                                    }

                                    toast.success("הקובץ נמחק בהצלחה")
                                    setNewRecord({ ...newRecord, fldf2FIOvHqALxULqrs: [] })
                                    await fetchRecords()
                                  } catch (error) {
                                    toast.error("שגיאה במחיקת הקובץ")
                                  }
                                }}
                              >
                                מחק קובץ
                              </Button>

                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={async () => {
                                  try {
                                    const fileData = newRecord.fldf2FIOvHqALxULqrs?.[0]
                                    const attachmentToken = fileData?.token || fileData?.id || fileData?.presignedUrl

                                    if (!attachmentToken) {
                                      toast.error("לא נמצא קובץ")
                                      return
                                    }

                                    let fileUrl: string | null = null

                                    if (fileData?.presignedUrl) {
                                      fileUrl = fileData.presignedUrl
                                    } else {
                                      const response = await fetch(`/api/attachment-url?token=${attachmentToken}`)
                                      if (!response.ok) {
                                        toast.error("שגיאה בקבלת כתובת הקובץ")
                                        return
                                      }
                                      const data = await response.json()
                                      if (data.url) {
                                        fileUrl = data.url
                                      } else {
                                        toast.error("לא התקבלה כתובת לקובץ")
                                      }
                                    }

                                    if (fileUrl) {
                                      const link = document.createElement("a")
                                      link.href = fileUrl
                                      link.download = fileData?.name || "file"
                                      link.click()
                                    }
                                  } catch (error) {
                                    toast.error("שגיאה בהורדת הקובץ")
                                  }
                                }}
                              >
                                הורד קובץ
                              </Button>
                            </div>
                          </div>
                          {uploadTimestamp && (
                            <p className="text-xs text-muted-foreground text-right">
                              הועלה ב:{" "}
                              {new Date(uploadTimestamp).toLocaleString("he-IL", {
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          )}
                        </div>
                      )
                    })()}
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="pricing" className="space-y-4 mt-4 flex-1 overflow-y-auto">
              {/* מחירי לקוח */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-right">מחירי לקוח</h3>
                <div className="grid grid-cols-3 gap-4 items-end">
                  <div className="grid gap-2">
                    <Label htmlFor="customer-price">מחיר לקוח+ מע״מ</Label>
                    <Input
                      id="customer-price"
                      type="number"
                      step="0.01"
                      value={newRecord.fldpPsdEQlpmh7UtZ0G || ""}
                      onChange={(e) => {
                        const value = e.target.value
                        if (value === "") {
                          setNewRecord({
                            ...newRecord,
                            fldpPsdEQlpmh7UtZ0G: "",
                            fldF2pbjDa4PjHtm0bP: "",
                          })
                        } else {
                          const priceBeforeVat = Number.parseFloat(value)
                          const priceWithVat = Number((priceBeforeVat * (customerVatRate / 100 + 1)).toFixed(2))
                          setNewRecord({
                            ...newRecord,
                            fldpPsdEQlpmh7UtZ0G: value,
                            fldF2pbjDa4PjHtm0bP: priceWithVat,
                          })
                        }
                      }}
                      disabled={!!newRecord.fldF2pbjDa4PjHtm0bP && newRecord.fldpPsdEQlpmh7UtZ0G === ""}
                      className="text-right disabled:opacity-70 disabled:cursor-not-allowed"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="customer-price-total">מחיר לקוח כולל מע״מ</Label>
                    <Input
                      id="customer-price-total"
                      type="number"
                      step="0.01"
                      value={newRecord.fldF2pbjDa4PjHtm0bP || ""}
                      onChange={(e) => {
                        const value = e.target.value
                        if (value === "") {
                          setNewRecord({
                            ...newRecord,
                            fldF2pbjDa4PjHtm0bP: "",
                            fldpPsdEQlpmh7UtZ0G: "",
                          })
                        } else {
                          const priceWithVat = Number.parseFloat(value)
                          const priceBeforeVat = Number((priceWithVat / (customerVatRate / 100 + 1)).toFixed(2))
                          setNewRecord({
                            ...newRecord,
                            fldF2pbjDa4PjHtm0bP: value,
                            fldpPsdEQlpmh7UtZ0G: priceBeforeVat,
                          })
                        }
                      }}
                      disabled={!!newRecord.fldpPsdEQlpmh7UtZ0G && newRecord.fldF2pbjDa4PjHtm0bP === ""}
                      className="text-right disabled:opacity-70 disabled:cursor-not-allowed"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="customer-vat">אחוז מע״מ (%)</Label>
                    <Input
                      id="customer-vat"
                      type="number"
                      step="1"
                      min="0"
                      max="100"
                      value={customerVatRate}
                      onChange={(e) => {
                        const newRate = Number.parseFloat(e.target.value) || 17
                        setCustomerVatRate(newRate)
                        if (newRecord.fldpPsdEQlpmh7UtZ0G) {
                          const priceWithVat = Number((newRecord.fldpPsdEQlpmh7UtZ0G * (newRate / 100 + 1)).toFixed(2))
                          setNewRecord({ ...newRecord, fldF2pbjDa4PjHtm0bP: priceWithVat })
                        } else if (newRecord.fldF2pbjDa4PjHtm0bP) {
                          const priceBeforeVat = Number(
                            (newRecord.fldF2pbjDa4PjHtm0bP / (newRate / 100 + 1)).toFixed(2),
                          )
                          setNewRecord({ ...newRecord, fldpPsdEQlpmh7UtZ0G: priceBeforeVat })
                        }
                      }}
                      className="text-right"
                    />
                  </div>
                </div>
              </div>

              {/* מחירי נהג */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-right">מחירי נהג</h3>
                <div className="grid grid-cols-3 gap-4 items-end">
                  <div className="grid gap-2">
                    <Label htmlFor="driver-price">מחיר נהג+ מע״מ</Label>
                    <Input
                      id="driver-price"
                      type="number"
                      step="0.01"
                      value={newRecord.fldJrzZk9KXj8bn5Rrl || ""}
                      onChange={(e) => {
                        const value = e.target.value
                        if (value === "") {
                          setNewRecord({
                            ...newRecord,
                            fldJrzZk9KXj8bn5Rrl: "",
                            fldhBH2HAFeNviGwRlu: "",
                          })
                        } else {
                          const priceBeforeVat = Number.parseFloat(value)
                          const priceWithVat = Number((priceBeforeVat * (driverVatRate / 100 + 1)).toFixed(2))
                          setNewRecord({
                            ...newRecord,
                            fldJrzZk9KXj8bn5Rrl: value,
                            fldhBH2HAFeNviGwRlu: priceWithVat,
                          })
                        }
                      }}
                      disabled={!!newRecord.fldhBH2HAFeNviGwRlu && newRecord.fldJrzZk9KXj8bn5Rrl === ""}
                      className="text-right disabled:opacity-70 disabled:cursor-not-allowed"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="driver-price-total">מחיר נהג כולל מע״מ</Label>
                    <Input
                      id="driver-price-total"
                      type="number"
                      step="0.01"
                      value={newRecord.fldhBH2HAFeNviGwRlu || ""}
                      onChange={(e) => {
                        const value = e.target.value
                        if (value === "") {
                          setNewRecord({
                            ...newRecord,
                            fldhBH2HAFeNviGwRlu: "",
                            fldJrzZk9KXj8bn5Rrl: "",
                          })
                        } else {
                          const priceWithVat = Number.parseFloat(value)
                          const priceBeforeVat = Number((priceWithVat / (driverVatRate / 100 + 1)).toFixed(2))
                          setNewRecord({
                            ...newRecord,
                            fldhBH2HAFeNviGwRlu: value,
                            fldJrzZk9KXj8bn5Rrl: priceBeforeVat,
                          })
                        }
                      }}
                      disabled={!!newRecord.fldJrzZk9KXj8bn5Rrl && newRecord.fldhBH2HAFeNviGwRlu === ""}
                      className="text-right disabled:opacity-70 disabled:cursor-not-allowed"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="driver-vat">אחוז מע״מ (%)</Label>
                    <Input
                      id="driver-vat"
                      type="number"
                      step="1"
                      min="0"
                      max="100"
                      value={driverVatRate}
                      onChange={(e) => {
                        const newRate = Number.parseFloat(e.target.value) || 17
                        setDriverVatRate(newRate)
                        if (newRecord.fldJrzZk9KXj8bn5Rrl) {
                          const priceWithVat = Number((newRecord.fldJrzZk9KXj8bn5Rrl * (newRate / 100 + 1)).toFixed(2))
                          setNewRecord({ ...newRecord, fldhBH2HAFeNviGwRlu: priceWithVat })
                        } else if (newRecord.fldhBH2HAFeNviGwRlu) {
                          const priceBeforeVat = Number(
                            (newRecord.fldhBH2HAFeNviGwRlu / (newRate / 100 + 1)).toFixed(2),
                          )
                          setNewRecord({ ...newRecord, fldJrzZk9KXj8bn5Rrl: priceBeforeVat })
                        }
                      }}
                      className="text-right"
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="customer" className="space-y-4 mt-4 flex-1 overflow-y-auto">
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="customerName">שם מזמין</Label>
                  <Input
                    id="customerName"
                    value={newRecord.fldwiQrnnM5roYUmSOd || ""}
                    onChange={(e) =>
                      setNewRecord({
                        ...newRecord,
                        fldwiQrnnM5roYUmSOd: e.target.value,
                      })
                    }
                    className="text-right"
                    dir="rtl"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mobilePhone">טלפון נייד</Label>
                  <Input
                    id="mobilePhone"
                    type="tel"
                    value={newRecord.fldBvclPS0jDWOMtSed || ""}
                    onChange={(e) =>
                      setNewRecord({
                        ...newRecord,
                        fldBvclPS0jDWOMtSed: e.target.value ? Number(e.target.value) : undefined,
                      })
                    }
                    className="text-right"
                    dir="rtl"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="idNumber">ת"ז</Label>
                  <Input
                    id="idNumber"
                    type="text"
                    value={newRecord.fldBgekMAmJGCJ74xTH || ""}
                    onChange={(e) =>
                      setNewRecord({
                        ...newRecord,
                        fldBgekMAmJGCJ74xTH: e.target.value ? Number(e.target.value) : undefined,
                      })
                    }
                    className="text-right"
                    dir="rtl"
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-2 pt-4 border-t flex-shrink-0">
            <Button
              variant="outline"
              onClick={() => {
                setNewRecord({})
                setIsDialogOpen(false)
                setIsEditMode(false)
                setEditingRecordId(null)
              }}
            >
              ביטול
            </Button>
            <Button onClick={handleSaveRecord} disabled={!isEditMode && !isFormValid()}>
              {isEditMode ? "שמור שינויים" : "צור נסיעה"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Removed settings dialog */}

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>האם אתה בטוח?</AlertDialogTitle>
            <AlertDialogDescription>
              פעולה זו תמחק {selectedRows.size} רשומות לצמיתות. לא ניתן לבטל פעולה זו.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ביטול</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              מחק
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
