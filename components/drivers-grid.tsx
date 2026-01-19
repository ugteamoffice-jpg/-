"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Search, XCircle, CheckCircle, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

const TABLE_ID = "tblsMGUyHILuKGGASix"
const STATUS_FIELD_ID = "fld0ZYmxzJtUq0oJWhq"

interface Driver {
  id: string
  fields: {
    fld1t6uHDVHJT7mL6Hv?: string
    fldLastName?: string
    fldNMqdJgpcSkEOhgdO?: string | number // Allow phone to be string or number from Table
    [key: string]: any
  }
}

export default function DriversGrid() {
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingDriverId, setEditingDriverId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<"פעיל" | "לא פעיל">("פעיל")
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const [scrollTop, setScrollTop] = useState(0)
  const [containerHeight, setContainerHeight] = useState(600)
  const tableContainerRef = useRef<HTMLDivElement>(null)

  const ROW_HEIGHT = 53 // Height of each table row in pixels
  const BUFFER_SIZE = 5 // Extra rows to render above and below viewport

  useEffect(() => {
    fetchDrivers()
  }, []) // Removed pagination state and updated to fetch once on mount

  const fetchDrivers = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/drivers`)
      if (!response.ok) throw new Error("Failed to fetch")
      const data = await response.json()

      setDrivers(data.records || [])
    } catch (error) {
      console.error("Error fetching drivers:", error)
      toast({
        title: "שגיאה",
        description: "לא ניתן לטעון נהגים",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateDriver = async () => {
    try {
      const filteredFields = Object.entries(newDriver).reduce((acc, [key, value]) => {
        if (value !== "" && value !== undefined && value !== null) {
          acc[key] = value
        }
        return acc
      }, {} as any)

      filteredFields[STATUS_FIELD_ID] = "פעיל"

      const response = await fetch("/api/drivers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fields: filteredFields }),
      })

      if (!response.ok) {
        throw new Error("Failed to create")
      }

      toast({
        title: "הצלחה",
        description: "נהג נוצר בהצלחה",
      })

      setIsDialogOpen(false)
      resetForm()
      fetchDrivers()
    } catch (error) {
      console.error("Error creating driver:", error)
      toast({
        title: "שגיאה",
        description: "לא ניתן ליצור נהג",
        variant: "destructive",
      })
    }
  }

  const handleUpdateDriver = async () => {
    if (!editingDriverId) return

    try {
      const filteredFields = Object.entries(newDriver).reduce((acc, [key, value]) => {
        if (value !== "" && value !== undefined && value !== null) {
          acc[key] = value
        }
        return acc
      }, {} as any)

      const response = await fetch(`/api/drivers/${editingDriverId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fields: filteredFields }),
      })

      if (!response.ok) throw new Error("Failed to update")

      toast({
        title: "הצלחה",
        description: "נהג עודכן בהצלחה",
      })

      setIsDialogOpen(false)
      setEditingDriverId(null)
      resetForm()
      fetchDrivers()
    } catch (error) {
      console.error("Error updating driver:", error)
      toast({
        title: "שגיאה",
        description: "לא ניתן לעדכן נהג",
        variant: "destructive",
      })
    }
  }

  const handleToggleDriverStatus = async () => {
    if (!editingDriverId) {
      return
    }

    try {
      const currentStatus = newDriver[STATUS_FIELD_ID] || "פעיל"
      const newStatus = currentStatus === "לא פעיל" ? "פעיל" : "לא פעיל"

      const updateData = {
        fields: {
          [STATUS_FIELD_ID]: newStatus,
        },
      }

      const response = await fetch(`/api/drivers/${editingDriverId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.details || errorData.error || "Failed to update status")
      }

      setIsDialogOpen(false)
      setEditingDriverId(null)
      resetForm()

      await fetchDrivers()

      toast({
        title: "הצלחה",
        description: `הנהג הועבר לסטטוס ${newStatus}`,
      })
    } catch (error: any) {
      toast({
        title: "שגיאה",
        description: error.message || "לא ניתן לעדכן סטטוס הנהג",
        variant: "destructive",
      })
    }
  }

  const handleRowClick = (driver: Driver) => {
    setEditingDriverId(driver.id)
    setNewDriver({ ...driver.fields } as any)
    setIsDialogOpen(true)
  }

  const resetForm = () => {
    setNewDriver({
      fld1t6uHDVHJT7mL6Hv: "",
      fldLastName: "",
      fldNMqdJgpcSkEOhgdO: "",
    })
  }

  const [newDriver, setNewDriver] = useState({
    fld1t6uHDVHJT7mL6Hv: "",
    fldLastName: "",
    fldNMqdJgpcSkEOhgdO: "" as string | number,
  })

  const filteredDrivers = drivers.filter((driver) => {
    const status = driver.fields[STATUS_FIELD_ID] || "פעיל"
    const matchesStatus = status === statusFilter

    if (!searchQuery) {
      return matchesStatus
    }

    const searchLower = searchQuery.toLowerCase()
    const matchesSearch = Object.values(driver.fields).some((value) =>
      String(value).toLowerCase().includes(searchLower),
    )

    return matchesSearch && matchesStatus
  })

  const isEditMode = !!editingDriverId

  const getDriverStatus = (driver: Driver) => {
    return driver.fields[STATUS_FIELD_ID] || "פעיל"
  }

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop)
  }

  useEffect(() => {
    if (tableContainerRef.current) {
      setContainerHeight(tableContainerRef.current.clientHeight)
    }
  }, [])

  const startIndex = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - BUFFER_SIZE)
  const endIndex = Math.min(filteredDrivers.length, Math.ceil((scrollTop + containerHeight) / ROW_HEIGHT) + BUFFER_SIZE)
  const visibleDrivers = filteredDrivers.slice(startIndex, endIndex)
  const totalHeight = filteredDrivers.length * ROW_HEIGHT
  const offsetY = startIndex * ROW_HEIGHT

  return (
    <div className="w-full p-6 space-y-4">
      <div className="flex items-center gap-4">
        <Select value={statusFilter} onValueChange={(value: "פעיל" | "לא פעיל") => setStatusFilter(value)}>
          <SelectTrigger className="w-[150px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="פעיל">פעיל</SelectItem>
            <SelectItem value="לא פעיל">לא פעיל</SelectItem>
          </SelectContent>
        </Select>

        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="h-4 w-4 ml-2" />
          נהג חדש
        </Button>

        <div className="relative w-[300px]">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="חיפוש..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="mr-auto text-sm text-muted-foreground whitespace-nowrap">
          סה"כ {filteredDrivers.length.toLocaleString("he-IL")} נהגים
        </div>
      </div>

      <div
        ref={tableContainerRef}
        className="border rounded-lg overflow-auto"
        style={{ height: "600px" }}
        onScroll={handleScroll}
      >
        <div style={{ height: `${totalHeight}px`, position: "relative" }}>
          <div style={{ transform: `translateY(${offsetY}px)` }}>
            <Table>
              <TableHeader className="sticky top-0 bg-background z-10">
                <TableRow>
                  <TableHead className="text-right pr-4">שם פרטי</TableHead>
                  <TableHead className="text-right pr-4">שם משפחה</TableHead>
                  <TableHead className="text-right pr-4">טלפון נייד</TableHead>
                  <TableHead className="text-right pr-4">סטטוס</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span className="text-muted-foreground">טוען נתונים...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
                {!isLoading && filteredDrivers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      {searchQuery ? "לא נמצאו תוצאות חיפוש" : "אין נהגים להצגה"}
                    </TableCell>
                  </TableRow>
                )}
                {!isLoading &&
                  visibleDrivers.map((driver) => (
                    <TableRow
                      key={driver.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleRowClick(driver)}
                      style={{ height: `${ROW_HEIGHT}px` }}
                    >
                      <TableCell className="text-right pr-4">{driver.fields.fld1t6uHDVHJT7mL6Hv || "-"}</TableCell>
                      <TableCell className="text-right pr-4">{driver.fields.fldLastName || "-"}</TableCell>
                      <TableCell className="text-right pr-4">
                        {driver.fields.fldNMqdJgpcSkEOhgdO ? String(driver.fields.fldNMqdJgpcSkEOhgdO) : "-"}
                      </TableCell>
                      <TableCell className="text-right pr-4">{getDriverStatus(driver)}</TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      <Dialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          setIsDialogOpen(open)
          if (!open) {
            setEditingDriverId(null)
            resetForm()
          }
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isEditMode ? "עריכת נהג" : "נהג חדש"}</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                שם פרטי <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                value={newDriver.fld1t6uHDVHJT7mL6Hv}
                onChange={(e) => setNewDriver({ ...newDriver, fld1t6uHDVHJT7mL6Hv: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName">שם משפחה</Label>
              <Input
                id="lastName"
                value={newDriver.fldLastName}
                onChange={(e) => setNewDriver({ ...newDriver, fldLastName: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">טלפון נייד</Label>
              <Input
                id="phone"
                type="tel"
                pattern="[0-9]{9,10}"
                placeholder="05XXXXXXXX"
                value={newDriver.fldNMqdJgpcSkEOhgdO || ""}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9]/g, "")
                  if (value.length <= 10) {
                    setNewDriver({
                      ...newDriver,
                      fldNMqdJgpcSkEOhgdO: value,
                    })
                  }
                }}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-4">
            {isEditMode && (
              <Button
                variant={(newDriver[STATUS_FIELD_ID] || "פעיל") === "לא פעיל" ? "default" : "destructive"}
                onClick={handleToggleDriverStatus}
                className={
                  (newDriver[STATUS_FIELD_ID] || "פעיל") === "לא פעיל"
                    ? "mr-auto bg-green-500 hover:bg-green-600"
                    : "mr-auto"
                }
              >
                {(newDriver[STATUS_FIELD_ID] || "פעיל") === "לא פעיל" ? (
                  <>
                    <CheckCircle className="h-4 w-4 ml-2" />
                    הפוך לפעיל
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4 ml-2" />
                    הפוך ללא פעיל
                  </>
                )}
              </Button>
            )}
            <Button
              onClick={isEditMode ? handleUpdateDriver : handleCreateDriver}
              disabled={!newDriver.fld1t6uHDVHJT7mL6Hv || newDriver.fld1t6uHDVHJT7mL6Hv.trim() === ""}
            >
              {isEditMode ? "שמור שינויים" : "צור נהג"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
