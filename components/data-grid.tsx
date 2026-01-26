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
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { ArrowUpDown, Search, Calendar as CalendarIcon, Trash2 } from "lucide-react"
import { format } from "date-fns"
import { he } from "date-fns/locale"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
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

// הגדרת המבנה
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
      <div className="pr-4"> {/* ריווח מהפינה הימנית */}
        <Checkbox
          checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
          className="translate-y-[2px]"
        />
      </div>
    ),
    cell: ({ row }) => (
      <div className="pr-4"> {/* ריווח מהפינה הימנית */}
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
          className="translate-y-[2px]"
        />
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
    size: 50, // גודל קבוע לעמודת הבחירה
  },
  {
    accessorKey: "fields.fldMv14lt0W7ZBkq1PH", // שלח
    header: "שלח",
    cell: ({ row }) => (
      <div className="flex justify-center">
        <Checkbox checked={row.original.fields.fldMv14lt0W7ZBkq1PH as boolean} disabled />
      </div>
    ),
    size: 60,
  },
  {
    accessorKey: "fields.fldDOBGATSaTi5TxyHB", // מאושר
    header: "מאושר",
    cell: ({ row }) => (
      <div className="flex justify-center">
        <Checkbox checked={row.original.fields.fldDOBGATSaTi5TxyHB as boolean} disabled />
      </div>
    ),
    size: 60,
  },
  {
    accessorKey: "fields.fldVy6L2DCboXUTkjBX", // שם לקוח
    header: "שם לקוח",
    cell: ({ row }) => <div className="text-right truncate">{renderLinkField(row.original.fields.fldVy6L2DCboXUTkjBX)}</div>,
    size: 150,
  },
  {
    accessorKey: "fields.fldLbXMREYfC8XVIghj", // התייצבות
    header: "התייצבות",
    cell: ({ row }) => <div className="text-right truncate">{row.original.fields.fldLbXMREYfC8XVIghj || ""}</div>,
    size: 100,
  },
  {
    accessorKey: "fields.fldA6e7ul57abYgAZDh", // תיאור
    header: "תיאור",
    cell: ({ row }) => (
      <div className="text-right truncate" title={row.original.fields.fldA6e7ul57abYgAZDh}>
        {row.original.fields.fldA6e7ul57abYgAZDh || ""}
      </div>
    ),
    size: 200,
  },
  {
    accessorKey: "fields.fld56G8M1LyHRRROWiL", // חזור
    header: "חזור",
    cell: ({ row }) => <div className="text-right truncate">{row.original.fields.fld56G8M1LyHRRROWiL || ""}</div>,
    size: 100,
  },
  {
    accessorKey: "fields.fldx4hl8FwbxfkqXf0B", // סוג רכב
    header: "סוג רכב",
    cell: ({ row }) => <div className="text-right truncate">{renderLinkField(row.original.fields.fldx4hl8FwbxfkqXf0B)}</div>,
    size: 120,
  },
  {
    accessorKey: "fields.flddNPbrzOCdgS36kx5", // שם נהג
    header: "שם נהג",
    cell: ({ row }) => <div className="text-right font-medium truncate">{renderLinkField(row.original.fields.flddNPbrzOCdgS36kx5)}</div>,
    size: 120,
  },
  {
    accessorKey: "fields.fldxXnfHHQWwXY8dlEV", // מחיר לקוח+ מע"מ
    header: 'מחיר לקוח+ מע"מ',
    cell: ({ row }) => <div className="text-right">{row.original.fields.fldxXnfHHQWwXY8dlEV}</div>,
    size: 130,
  },
  {
    accessorKey: "fields.fldT7QLSKmSrjIHarDb", // מחיר לקוח כולל מע"מ
    header: 'מחיר לקוח כולל מע"מ',
    cell: ({ row }) => <div className="text-right">{row.original.fields.fldT7QLSKmSrjIHarDb}</div>,
    size: 130,
  },
  {
    accessorKey: "fields.fldSNuxbM8oJfrQ3a9x", // מחיר נהג+ מע"מ
    header: 'מחיר נהג+ מע"מ',
    cell: ({ row }) => <div className="text-right">{row.original.fields.fldSNuxbM8oJfrQ3a9x}</div>,
    size: 130,
  },
  {
    accessorKey: "fields.fldyQIhjdUeQwtHMldD", // מחיר נהג כולל מע"מ
    header: 'מחיר נהג כולל מע"מ',
    cell: ({ row }) => <div className="text-right">{row.original.fields.fldyQIhjdUeQwtHMldD}</div>,
    size: 130,
  },
  {
    accessorKey: "fields.fldT9IZTYlT4gCEnOK3", // רווח+ מע"מ
    header: 'רווח+ מע"מ',
    cell: ({ row }) => <div className="text-right">{row.original.fields.fldT9IZTYlT4gCEnOK3}</div>,
    size: 100,
  },
  {
    accessorKey: "fields.fldhNoiFEkEgrkxff02", // הערות לנהג
    header: "הערות לנהג",
    cell: ({ row }) => <div className="text-right truncate">{row.original.fields.fldhNoiFEkEgrkxff02 || ""}</div>,
    size: 150,
  },
]

export function DataGrid({ schema }: { schema: any }) {
  const [data, setData] = React.useState<WorkScheduleRecord[]>([])
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})
  const [globalFilter, setGlobalFilter] = React.useState("")
  // ברירת מחדל: היום
  const [dateFilter, setDateFilter] = React.useState<Date>(new Date())
  const { toast } = useToast()
  
  const [editingRecord, setEditingRecord] = React.useState<WorkScheduleRecord | null>(null)
  const [isEditOpen, setIsEditOpen] = React.useState(false)
  const [isCalendarOpen, setIsCalendarOpen] = React.useState(false)

  const fetchData = async () => {
    try {
      // כאן אנחנו מושכים את כל הרשומות (או כמות גדולה מאוד) כדי לאפשר גלילה
      const response = await fetch('/api/work-schedule?take=1000') 
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

  // טיפול בבחירת תאריך - מונע ביטול בחירה
  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setDateFilter(date)
      setIsCalendarOpen(false)
    }
  }

  const handleTodayClick = () => {
    setDateFilter(new Date())
    setIsCalendarOpen(false)
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
    columnResizeMode: "onChange", // מאפשר שינוי גודל עמודות
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    // getPaginationRowModel: getPaginationRowModel(), // מחקנו את זה כדי לאפשר גלילה
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
    <div className="w-full h-full flex flex-col space-y-4 p-4" dir="rtl">
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
                  "w-[200px] justify-start text-right font-normal"
                )}
              >
                <CalendarIcon className="ml-2 h-4 w-4" />
                {format(dateFilter, "PPP", { locale: he })}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="single"
                selected={dateFilter}
                onSelect={handleDateSelect}
                required // מחייב בחירה
                locale={he}
                dir="rtl"
                initialFocus
              />
              <div className="border-t p-2">
                <Button variant="ghost" className="w-full justify-center text-sm" onClick={handleTodayClick}>
                  חזור להיום
                </Button>
              </div>
            </PopoverContent>
          </Popover>
          
          {/* כפתור ה-X למחיקת תאריך הוסר */}

          {Object.keys(rowSelection).length > 0 && (
            <Button variant="destructive" size="sm" onClick={handleDeleteSelected}>
              <Trash2 className="h-4 w-4 ml-2" />
              מחק ({Object.keys(rowSelection).length})
            </Button>
          )}
        </div>

        {/* חלק שמאלי - חיפוש בלבד (ללא כפתור עמודות) */}
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
           {/* כפתור עמודות הוסר */}
        </div>

      </div>
      
      {/* גוף הטבלה - גלילה */}
      <div className="rounded-md border flex-1 overflow-auto max-h-[calc(100vh-200px)] relative">
        <Table className="relative w-full" style={{ tableLayout: 'fixed' }}>
          <TableHeader className="sticky top-0 bg-background z-10 shadow-sm">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead 
                    key={header.id} 
                    className="text-right relative border-l" 
                    style={{ width: header.getSize() }}
                  >
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    
                    {/* ידית גרירה לשינוי גודל */}
                    <div
                      onMouseDown={header.getResizeHandler()}
                      onTouchStart={header.getResizeHandler()}
                      className={cn(
                        "absolute left-0 top-0 h-full w-1 cursor-col-resize hover:bg-primary/50 touch-none select-none",
                        header.column.getIsResizing() && "bg-primary w-1"
                      )}
                    />
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
                    <TableCell key={cell.id} className="text-right truncate border-l">
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
      
      {/* פקדי דפדוף הוסרו */}

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
