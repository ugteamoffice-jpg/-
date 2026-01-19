"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, XCircle, CheckCircle, Search, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

const TABLE_ID = "tbl4dSxUqAf6vsuGCsM"
const STATUS_FIELD_ID = "fldZR0QtVxbYvDCEaFM" // סטטוס לקוח

interface Customer {
  id: string
  fields: {
    fldS0PNTKZseugMVhcA?: string // שם לקוח
    fldxb23SnznfSCbKpeL?: number // ח.פ
    fldgRBM4pHqoTTUvo1t?: string // שם א.קשר
    fldtHySe1pfoqbVlYYg?: string | number // טלפון נייד - can be string or number from Teable
    fldDyTLxPVXQdpVLCt0?: string // אימייל
    fldmGFsQe5UJQH413Ps?: number // תשלום שוטף+
    fldpeiwjxWI7rXa3rTL?: string // אופן תשלום
    [key: string]: any
  }
}

export default function CustomersGrid() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingCustomerId, setEditingCustomerId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<"פעיל" | "לא פעיל">("פעיל")
  const [emailError, setEmailError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const [scrollTop, setScrollTop] = useState(0)
  const [containerHeight, setContainerHeight] = useState(600)
  const tableContainerRef = useRef<HTMLDivElement>(null)

  const ROW_HEIGHT = 53 // Height of each table row in pixels
  const BUFFER_SIZE = 5 // Extra rows to render above and below viewport

  useEffect(() => {
    fetchCustomers()
  }, []) // Only fetch once on mount

  const fetchCustomers = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/customers`)
      if (!response.ok) throw new Error("Failed to fetch")
      const data = await response.json()

      setCustomers(data.records || [])
    } catch (error) {
      console.error("Error fetching customers:", error)
      toast({
        title: "שגיאה",
        description: "לא ניתן לטעון לקוחות",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateCustomer = async () => {
    try {
      const filteredFields = Object.entries(newCustomer).reduce((acc, [key, value]) => {
        if (value !== "" && value !== undefined && value !== null) {
          acc[key] = value
        }
        return acc
      }, {} as any)

      filteredFields[STATUS_FIELD_ID] = "פעיל"

      const response = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fields: filteredFields }),
      })

      if (!response.ok) {
        throw new Error("Failed to create")
      }

      toast({
        title: "הצלחה",
        description: "לקוח נוצר בהצלחה",
      })

      setIsDialogOpen(false)
      resetForm()
      fetchCustomers()
    } catch (error) {
      console.error("Error creating customer:", error)
      toast({
        title: "שגיאה",
        description: "לא ניתן ליצור לקוח",
        variant: "destructive",
      })
    }
  }

  const handleUpdateCustomer = async () => {
    if (!editingCustomerId) return

    try {
      const filteredFields = Object.entries(newCustomer).reduce((acc, [key, value]) => {
        if (value !== "" && value !== undefined && value !== null) {
          acc[key] = value
        }
        return acc
      }, {} as any)

      const response = await fetch(`/api/customers/${editingCustomerId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fields: filteredFields }),
      })

      if (!response.ok) throw new Error("Failed to update")

      toast({
        title: "הצלחה",
        description: "לקוח עודכן בהצלחה",
      })

      setIsDialogOpen(false)
      setEditingCustomerId(null)
      resetForm()
      fetchCustomers()
    } catch (error) {
      console.error("Error updating customer:", error)
      toast({
        title: "שגיאה",
        description: "לא ניתן לעדכן לקוח",
        variant: "destructive",
      })
    }
  }

  const handleDeleteCustomer = async () => {
    if (!editingCustomerId) {
      return
    }

    try {
      const currentStatus = newCustomer[STATUS_FIELD_ID] || "פעיל"
      const newStatus = currentStatus === "לא פעיל" ? "פעיל" : "לא פעיל"

      const updateData = {
        fields: {
          [STATUS_FIELD_ID]: newStatus,
        },
      }

      const response = await fetch(`/api/customers/${editingCustomerId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.details || errorData.error || "Failed to update status")
      }

      setIsDialogOpen(false)
      setEditingCustomerId(null)
      resetForm()

      await fetchCustomers()

      toast({
        title: "הצלחה",
        description: `הלקוח הועבר לסטטוס ${newStatus}`,
      })
    } catch (error: any) {
      toast({
        title: "שגיאה",
        description: error.message || "לא ניתן לעדכן סטטוס הלקוח",
        variant: "destructive",
      })
    }
  }

  const handleRowClick = (customer: Customer) => {
    setEditingCustomerId(customer.id)
    setNewCustomer({ ...customer.fields } as any)
    setIsDialogOpen(true)
  }

  const resetForm = () => {
    setNewCustomer({
      fldS0PNTKZseugMVhcA: "",
      fldxb23SnznfSCbKpeL: undefined as number | undefined,
      fldgRBM4pHqoTTUvo1t: "",
      fldtHySe1pfoqbVlYYg: "",
      fldDyTLxPVXQdpVLCt0: "",
      fldmGFsQe5UJQH413Ps: undefined as number | undefined,
      fldpeiwjxWI7rXa3rTL: "",
    })
    setEmailError("")
  }

  const [newCustomer, setNewCustomer] = useState({
    fldS0PNTKZseugMVhcA: "",
    fldxb23SnznfSCbKpeL: undefined as number | undefined,
    fldgRBM4pHqoTTUvo1t: "",
    fldtHySe1pfoqbVlYYg: "",
    fldDyTLxPVXQdpVLCt0: "",
    fldmGFsQe5UJQH413Ps: undefined as number | undefined,
    fldpeiwjxWI7rXa3rTL: "",
  })

  const filteredCustomers = customers.filter((customer) => {
    const status = customer.fields[STATUS_FIELD_ID] || "פעיל"
    const matchesStatus = status === statusFilter

    if (!searchQuery) {
      return matchesStatus
    }

    const searchLower = searchQuery.toLowerCase()
    const matchesSearch = Object.values(customer.fields).some((value) =>
      String(value).toLowerCase().includes(searchLower),
    )

    return matchesSearch && matchesStatus
  })

  const isEditMode = !!editingCustomerId

  const getCustomerStatus = (customer: Customer) => {
    return customer.fields[STATUS_FIELD_ID] || "פעיל"
  }

  const validateEmail = (email: string) => {
    if (!email) {
      setEmailError("")
      return true
    }

    const hebrewRegex = /[\u0590-\u05FF]/
    if (hebrewRegex.test(email)) {
      setEmailError("האימייל חייב להכיל אותיות באנגלית בלבד")
      return false
    }

    if (!email.includes("@")) {
      setEmailError("האימייל חייב להכיל שטרודל (@)")
      return false
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
    if (!emailRegex.test(email)) {
      setEmailError("פורמט האימייל אינו תקין")
      return false
    }

    setEmailError("")
    return true
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
  const endIndex = Math.min(
    filteredCustomers.length,
    Math.ceil((scrollTop + containerHeight) / ROW_HEIGHT) + BUFFER_SIZE,
  )
  const visibleCustomers = filteredCustomers.slice(startIndex, endIndex)
  const totalHeight = filteredCustomers.length * ROW_HEIGHT
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
          לקוח חדש
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
          סה"כ {filteredCustomers.length.toLocaleString("he-IL")} לקוחות
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
                  <TableHead className="text-right pr-4">שם לקוח</TableHead>
                  <TableHead className="text-right pr-4">ח.פ</TableHead>
                  <TableHead className="text-right pr-4">איש קשר</TableHead>
                  <TableHead className="text-right pr-4">טלפון נייד</TableHead>
                  <TableHead className="text-right pr-4">אימייל</TableHead>
                  <TableHead className="text-right pr-4">תשלום שוטף+</TableHead>
                  <TableHead className="text-right pr-4">אופן תשלום</TableHead>
                  <TableHead className="text-right pr-4">סטטוס</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span className="text-muted-foreground">טוען נתונים...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredCustomers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      לא נמצאו לקוחות
                    </TableCell>
                  </TableRow>
                ) : (
                  visibleCustomers.map((customer) => (
                    <TableRow
                      key={customer.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleRowClick(customer)}
                      style={{ height: `${ROW_HEIGHT}px` }}
                    >
                      <TableCell className="text-right pr-4">{customer.fields.fldS0PNTKZseugMVhcA || "-"}</TableCell>
                      <TableCell className="text-right pr-4">
                        {customer.fields.fldxb23SnznfSCbKpeL ? Math.round(customer.fields.fldxb23SnznfSCbKpeL) : "-"}
                      </TableCell>
                      <TableCell className="text-right pr-4">{customer.fields.fldgRBM4pHqoTTUvo1t || "-"}</TableCell>
                      <TableCell className="text-right pr-4">
                        {customer.fields.fldtHySe1pfoqbVlYYg ? String(customer.fields.fldtHySe1pfoqbVlYYg) : "-"}
                      </TableCell>
                      <TableCell className="text-right pr-4">{customer.fields.fldDyTLxPVXQdpVLCt0 || "-"}</TableCell>
                      <TableCell className="text-right pr-4">
                        {customer.fields.fldmGFsQe5UJQH413Ps ? Math.round(customer.fields.fldmGFsQe5UJQH413Ps) : "-"}
                      </TableCell>
                      <TableCell className="text-right pr-4">{customer.fields.fldpeiwjxWI7rXa3rTL || "-"}</TableCell>
                      <TableCell className="text-right pr-4">{getCustomerStatus(customer)}</TableCell>
                    </TableRow>
                  ))
                )}
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
            setEditingCustomerId(null)
            resetForm()
          }
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isEditMode ? "עריכת לקוח" : "לקוח חדש"}</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                שם לקוח
                {!isEditMode && <span className="text-red-500">*</span>}
              </Label>
              <Input
                id="name"
                value={newCustomer.fldS0PNTKZseugMVhcA}
                onChange={(e) => setNewCustomer({ ...newCustomer, fldS0PNTKZseugMVhcA: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="hp">ח.פ</Label>
              <Input
                id="hp"
                type="number"
                value={newCustomer.fldxb23SnznfSCbKpeL || ""}
                onChange={(e) =>
                  setNewCustomer({
                    ...newCustomer,
                    fldxb23SnznfSCbKpeL: e.target.value ? Number(e.target.value) : undefined,
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact">שם איש קשר</Label>
              <Input
                id="contact"
                value={newCustomer.fldgRBM4pHqoTTUvo1t}
                onChange={(e) => setNewCustomer({ ...newCustomer, fldgRBM4pHqoTTUvo1t: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">טלפון נייד</Label>
              <Input
                id="phone"
                type="tel"
                pattern="[0-9]{9,10}"
                placeholder="05XXXXXXXX"
                value={newCustomer.fldtHySe1pfoqbVlYYg || ""}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9]/g, "")
                  if (value.length <= 10) {
                    setNewCustomer({
                      ...newCustomer,
                      fldtHySe1pfoqbVlYYg: value,
                    })
                  }
                }}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">אימייל</Label>
              <Input
                id="email"
                type="text"
                placeholder="example@domain.com"
                value={newCustomer.fldDyTLxPVXQdpVLCt0}
                onChange={(e) => {
                  const value = e.target.value
                  setNewCustomer({ ...newCustomer, fldDyTLxPVXQdpVLCt0: value })
                  validateEmail(value)
                }}
                onBlur={(e) => {
                  validateEmail(e.target.value)
                }}
                className={emailError ? "border-red-500" : ""}
              />
              {emailError && <p className="text-sm text-red-500">{emailError}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment">תשלום שוטף+</Label>
              <Input
                id="payment"
                type="number"
                value={newCustomer.fldmGFsQe5UJQH413Ps || ""}
                onChange={(e) =>
                  setNewCustomer({
                    ...newCustomer,
                    fldmGFsQe5UJQH413Ps: e.target.value ? Number(e.target.value) : undefined,
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="paymentMethod">אופן תשלום</Label>
              <Select
                value={newCustomer.fldpeiwjxWI7rXa3rTL}
                onValueChange={(value) => setNewCustomer({ ...newCustomer, fldpeiwjxWI7rXa3rTL: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="בחר אופן תשלום" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="מזומן">מזומן</SelectItem>
                  <SelectItem value="העברה בנקאית">העברה בנקאית</SelectItem>
                  <SelectItem value="צ'ק">צ'ק</SelectItem>
                  <SelectItem value="אפלקציה">אפלקציה</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-4">
            {isEditMode && (
              <Button
                variant={(newCustomer[STATUS_FIELD_ID] || "פעיל") === "לא פעיל" ? "default" : "destructive"}
                onClick={handleDeleteCustomer}
                className={
                  (newCustomer[STATUS_FIELD_ID] || "פעיל") === "לא פעיל"
                    ? "mr-auto bg-green-500 hover:bg-green-600"
                    : "mr-auto"
                }
              >
                {(newCustomer[STATUS_FIELD_ID] || "פעיל") === "לא פעיל" ? (
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
              onClick={isEditMode ? handleUpdateCustomer : handleCreateCustomer}
              disabled={(!isEditMode && !newCustomer.fldS0PNTKZseugMVhcA) || !!emailError}
            >
              {isEditMode ? "שמור שינויים" : "צור לקוח"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
