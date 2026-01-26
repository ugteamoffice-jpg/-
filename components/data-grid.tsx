"use client"

import * as React from "react"
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { ArrowUpDown, ChevronDown, Search, Calendar as CalendarIcon, X, Trash2 } from "lucide-react"
import { format } from "date-fns"
import { he } from "date-fns/locale"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { NewRideDialog } from "@/components/new-ride-dialog"
import { RecordEditDialog } from "@/components/record-edit-dialog" 
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"

// הגדרת המבנה לפי ה-IDs שלך
export interface WorkScheduleRecord {
  id: string
  fields: {
    [key: string]: any
    fldvNsQbfzMWTc7jakp?: string // תאריך
    fldLbXMREYfC8XVIghj?: string // התייצבות
    fldA6e7ul57abYgAZDh?: string // תיאור
    fld56G8M1LyHRRROWiL?: string // חזור
    fldMv14lt0W7ZBkq1PH?: boolean // שלח
    fldDOBGATSaTi5TxyHB?: boolean // מאושר
    fldxXnfHHQWwXY8dlEV?: number // מחיר לקוח+ מע"מ
    fldT7QLSKmSrjIHarDb?: number // מחיר לקוח כולל מע"מ
    fldSNuxbM8oJfrQ3a9x?: number // מחיר נהג+ מע"מ
    fldyQIhjdUeQwtHMldD?: number // מחיר נהג כולל מע"מ
    fldT9IZTYlT4gCEnOK3?: number // רווח+ מע"מ
    fldhNoiFEkEgrkxff02?: string // הערות לנהג
    flddNPbrzOCdgS36kx5?: any // שם נהג (Link)
    fldx4hl8FwbxfkqXf0B?: any // סוג רכב (Link)
    fldVy6L2DCboXUTkjBX?: any // שם לקוח (Link)
    fldqStJV3KKIutTY9hW?: string // מספר רכב
  }
}

// פונקציית עזר להצגת שדות מקושרים
const renderLinkField = (value: any) => {
  if (!value) return <span className="text-muted-foreground">-</span>
  if (Array.isArray(value) && value.length > 0) {
    return value[0]?.title || <span className="text-muted-foreground">-</span>
  }
  if (typeof value === 'object' && value.title) {
    return value.title
  }
  return String(value)
}

export const columns: ColumnDef<WorkScheduleRecord>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
        className="translate-y-[2px]"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
        className="translate-y-[2px]"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "fields.fldMv14lt0W7ZBkq1PH", // שלח
    header: "שלח",
    cell: ({ row }) => (
      <div className="flex justify-center">
        <Checkbox checked={row.original.fields.fldMv14lt0W7ZBkq1PH as boolean} disabled />
      </div>
    ),
  },
  {
    accessorKey: "fields.fldDOBGATSaTi5TxyHB", // מאושר
    header: "מאושר",
    cell: ({ row }) => (
      <div className="flex justify-center">
        <Checkbox checked={row.original.fields.fldDOBGATSaTi5TxyHB as boolean} disabled />
      </div>
    ),
  },
  {
    accessorKey: "fields.fldVy6L2DCboXUTkjBX", // שם לקוח
    header: "שם לקוח",
    cell: ({ row }) => <div className="text-right">{renderLinkField(row.original.fields.fldVy6L2DCboXUTkjBX)}</div>,
  },
  {
    accessorKey: "fields.fldLbXMREYfC8XVIghj", // התייצבות
    header: "התייצבות",
    cell: ({ row }) => <div className="text-right">{row.original.fields.fldLbXMREYfC8XVIghj || ""}</div>,
  },
  {
    accessorKey: "fields.fldA6e7ul57abYgAZDh", // תיאור
    header: "תיאור",
    cell: ({ row }) => (
      <div className="text-right max-w-[200px] truncate" title={row.original.fields.fldA6e7ul57abYgAZDh}>
        {row.original.fields.fldA6e7ul57abYgAZDh || ""}
      </div>
    ),
  },
  {
    accessorKey: "fields.fld56G8M1LyHRRROWiL", // חזור
    header: "חזור",
    cell: ({ row }) => <div className="text-right">{row.original.fields.fld56G8M1LyHRRROWiL || ""}</div>,
  },
  {
    accessorKey: "fields.fldx4hl8FwbxfkqXf0B", // סוג רכב
    header: "סוג רכב",
    cell: ({ row }) => <div className="text-right">{renderLinkField(row.original.fields.fldx4hl8FwbxfkqXf0B)}</div>,
  },
  {
    accessorKey: "fields.flddNPbrzOCdgS36kx5", // שם נהג
    header: "שם נהג",
    cell: ({ row }) => <div className="text-right font-medium">{renderLinkField(row.original.fields.flddNPbrzOCdgS36kx5)}</div>,
  },
  {
    accessorKey: "fields.fldxXnfHHQWwXY8dlEV", // מחיר לקוח+ מע"מ
    header: 'מחיר לקוח+ מע"מ',
    cell: ({ row }) => <div className="text-right">{row.original.fields.fldxXnfHHQWwXY8dlEV}</div>,
  },
  {
    accessorKey: "fields.fldT7QLSKmSrjIHarDb", // מחיר לקוח כולל מע"מ
    header: 'מחיר לקוח כולל מע"מ',
    cell: ({ row }) => <div className="text-right">{row.original.fields.fldT7QLSKmSrjIHarDb}</div>,
  },
  {
    accessorKey: "fields.fldSNuxbM8oJfrQ3a9x", // מחיר נהג+ מע"מ
    header: 'מחיר נהג+ מע"מ',
    cell: ({ row }) => <div className="text-right">{row.original.fields.fldSNuxbM8oJfrQ3a9x}</div>,
  },
  {
    accessorKey: "fields.fldyQIhjdUeQwtHMldD", // מחיר נהג כולל מע"מ
    header: 'מחיר נהג כולל מע"מ',
    cell: ({ row }) => <div className="text-right">{row.original.fields.fldyQIhjdUeQwtHMldD}</div>,
  },
  {
    accessorKey: "fields.fldT9IZTYlT4gCEnOK3", // רווח+ מע"מ
    header: 'רווח+ מע"מ',
    cell: ({ row }) => <div className="text-right">{row.original.fields.fldT9IZTYlT4gCEnOK3}</div>,
  },
  {
    accessorKey: "fields.fldhNoiFEkEgrkxff02", // הערות לנהג
    header: "הערות לנהג",
    cell: ({ row }) => <div className="text-right">{row.original.fields.fldhNoiFEkEgrkxff02 || ""}</div>,
  },
  {
    accessorKey: "fields.fldvNsQbfzMWTc7jakp", // תאריך
    header: ({ column }) => {
      return (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          תאריך
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const date = row.original.fields.fldvNsQbfzMWTc7jakp
      if (!date) return <div className="text-right font-medium">-</div>
      return <div className="text-right font-medium">{format(new Date(date), "dd/MM/yyyy")}</div>
    },
  },
]

export function DataGrid({ schema }: { schema: any }) {
  const [data, setData] = React.useState<WorkScheduleRecord[]>([])
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})
  const [globalFilter, setGlobalFilter] = React.useState("")
  const [dateFilter, setDateFilter] = React.useState<Date | undefined>(new Date())
  const { toast } = useToast()
  
  const [editingRecord, setEditingRecord] = React.useState<WorkScheduleRecord | null>(null)
  const [isEditOpen, setIsEditOpen] = React.useState(false)
  
  // משתנה חדש לשליטה בפתיחת הלוח שנה
  const [isCalendarOpen, setIsCalendarOpen] = React.useState(false)

  const fetchData = async () => {
    try {
      const response = await fetch('/api/work-schedule')
      const json = await response.json()
      if (json.records) {
        setData(json.records)
      }
    } catch (error) {
      console.error("Failed to fetch data:", error)
    }
  }

  React.useEffect(() => {
    fetchData()
  }, [])

  const handleDeleteSelected = async () => {
    const selectedIds = Object.keys(rowSelection)
    if (selectedIds.length === 0) return
    if (!confirm("האם אתה בטוח שברצונך למחוק את הרשומות המסומנות?")) return
    const recordsToDelete = table.getFilteredSelectedRowModel().rows.map(row => row.original.id)
    try {
      for (const id of recordsToDelete) {
        await fetch(`/api/work-schedule/${id}`, { method: "DELETE" })
      }
      toast({ title: "נמחק בהצלחה", description: `${recordsToDelete.length} רשומות נמחקו.` })
      setRowSelection({})
      fetchData()
    } catch (error) {
      toast({ title: "שגיאה", description: "ארעה שגיאה במחיקה.", variant: "destructive" })
    }
  }

  const handleRowClick = (record: WorkScheduleRecord) => {
    setEditingRecord(record)
    setIsEditOpen(true)
  }

  const handleDateSelect = (date: Date | undefined) => {
    setDateFilter(date)
    setIsCalendarOpen(false) // סוגר את הלוח מיד אחרי בחירה
  }

  const handleTodayClick = () => {
    setDateFilter(new Date())
    setIsCalendarOpen(false) // בוחר את היום וסוגר
  }

  const filteredData = React.useMemo(() => {
    let filtered = data
    if (dateFilter) {
      const dateStr = format(dateFilter, "yyyy-MM-dd")
      filtered = filtered.filter(item => {
        const itemDate = item.fields.fldvNsQbfzMWTc7jakp
        if (!itemDate) return false
        return itemDate.startsWith(dateStr)
      })
    }
    if (globalFilter) {
      const lowerFilter = globalFilter.toLowerCase()
      filtered = filtered.filter((item) => {
        return Object.values(item.fields).some((val) => {
           if (val == null) return false
           if (typeof val === 'object' && val.title) return String(val.title).toLowerCase().includes(lowerFilter)
           if (Array.isArray(val) && val[0]?.title) return String(val[0].title).toLowerCase().includes(lowerFilter)
           return String(val).toLowerCase().includes(lowerFilter)
        })
      })
    }
    return filtered
  }, [data, dateFilter, globalFilter])

  const table = useReactTable({
    data: filteredData,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  })

  return (
    <div className="w-full space-y-4 p-4" dir="rtl">
      {/* שורת הכותרת עם הפקדים */}
      <div className="flex items-center justify-between gap-4">
        
        {/* חלק ימני - כפתורים פעילים */}
        <div className="flex items-center gap-2">
          <NewRideDialog onRideCreated={fetchData} />

          <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-[200px] justify-start text-right font-normal",
                  !dateFilter && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="ml-2 h-4 w-4" />
                {dateFilter ? format(dateFilter, "PPP", { locale: he }) : <span>בחר תאריך</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="single"
                selected={dateFilter}
                onSelect={handleDateSelect}
                locale={he}
                dir="rtl"
                initialFocus
              />
              {/* כפתור "היום" בתחתית */}
              <div className="border-t p-2">
                <Button variant="ghost" className="w-full justify-center text-sm" onClick={handleTodayClick}>
                  חזור להיום
                </Button>
              </div>
            </PopoverContent>
          </Popover>
          
          {dateFilter && (
             <Button variant="ghost" size="icon" onClick={() => setDateFilter(undefined)}>
               <X className="h-4 w-4" />
             </Button>
          )}

          {Object.keys(rowSelection).length > 0 && (
            <Button variant="destructive" size="sm" onClick={handleDeleteSelected}>
              <Trash2 className="h-4 w-4 ml-2" />
              מחק ({Object.keys(rowSelection).length})
            </Button>
          )}
        </div>

        {/* חלק שמאלי - חיפוש ועמודות */}
        <div className="flex items-center gap-2 flex-1 justify-end">
           <div className="flex items-center gap-2 w-full max-w-sm">
             <Search className="w-4 h-4 text-muted-foreground" />
             <Input
               placeholder="חיפוש..."
               value={globalFilter}
               onChange={(event) => setGlobalFilter(event.target.value)}
               className="max-w-sm"
             />
           </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="ml-auto">
                עמודות <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {table.getAllColumns().filter((column) => column.getCanHide()).map((column) => (
                <DropdownMenuCheckboxItem
                  key={column.id}
                  className="capitalize"
                  checked={column.getIsVisible()}
                  onCheckedChange={(value) => column.toggleVisibility(!!value)}
                >
                  {column.id}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

      </div>
      
      {/* גוף הטבלה */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="text-right">
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleRowClick(row.original)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="text-right">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  אין תוצאות.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      
      {/* כפתורי דפדוף */}
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length} מתוך {table.getFilteredRowModel().rows.length} שורות נבחרו.
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            הקודם
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            הבא
          </Button>
        </div>
      </div>

      <RecordEditDialog
        record={editingRecord}
        schema={schema}
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        onSave={(updatedRecord) => {
          setData(data.map((r) => (r.id === updatedRecord.id ? updatedRecord : r)))
        }}
      />
    </div>
  )
}
