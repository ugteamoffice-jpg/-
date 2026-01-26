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
  ColumnOrderState,
  ColumnSizingState,
} from "@tanstack/react-table"
import { ArrowUpDown, Calendar as CalendarIcon, Trash2, GripVertical, Settings2, Save } from "lucide-react"
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
// השימוש ברכיב שיצרת
import { ScrollArea } from "@/components/ui/scroll-area"

// --- ממשקים ---
export interface WorkScheduleRecord {
  id: string
  fields: {
    [key: string]: any
    fldvNsQbfzMWTc7jakp?: string 
    fldLbXMREYfC8XVIghj?: string 
    fldA6e7ul57abYgAZDh?: string 
    fld56G8M1LyHRRROWiL?: string 
    fldMv14lt0W7ZBkq1PH?: boolean 
    fldDOBGATSaTi5TxyHB?: boolean 
    fldxXnfHHQWwXY8dlEV?: number 
    fldT7QLSKmSrjIHarDb?: number 
    fldSNuxbM8oJfrQ3a9x?: number 
    fldyQIhjdUeQwtHMldD?: number 
    fldT9IZTYlT4gCEnOK3?: number 
    fldhNoiFEkEgrkxff02?: string 
    flddNPbrzOCdgS36kx5?: any 
    fldx4hl8FwbxfkqXf0B?: any 
    fldVy6L2DCboXUTkjBX?: any 
    fldqStJV3KKIutTY9hW?: string 
  }
}

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

// הגדרת העמודות
export const columns: ColumnDef<WorkScheduleRecord>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <div className="pr-4">
        <Checkbox
          checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
          className="translate-y-[2px]"
        />
      </div>
    ),
    cell: ({ row }) => (
      <div className="pr-4">
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
    size: 50,
    minSize: 50,
    enableResizing: false,
  },
  {
    accessorKey: "fields.fldMv14lt0W7ZBkq1PH",
    id: "sent",
    header: "שלח",
    cell: ({ row }) => (
      <div className="flex justify-center">
        <Checkbox checked={row.original.fields.fldMv14lt0W7ZBkq1PH as boolean} disabled />
      </div>
    ),
    size: 60,
    minSize: 50,
  },
  {
    accessorKey: "fields.fldDOBGATSaTi5TxyHB",
    id: "approved",
    header: "מאושר",
    cell: ({ row }) => (
      <div className="flex justify-center">
        <Checkbox checked={row.original.fields.fldDOBGATSaTi5TxyHB as boolean} disabled />
      </div>
    ),
    size: 60,
    minSize: 60,
  },
  {
    accessorKey: "fields.fldVy6L2DCboXUTkjBX",
    id: "customer",
    header: "שם לקוח",
    cell: ({ row }) => <div className="text-right truncate">{renderLinkField(row.original.fields.fldVy6L2DCboXUTkjBX)}</div>,
    size: 150,
    minSize: 90,
  },
  {
    accessorKey: "fields.fldLbXMREYfC8XVIghj",
    id: "pickup",
    header: "התייצבות",
    cell: ({ row }) => <div className="text-right truncate">{row.original.fields.fldLbXMREYfC8XVIghj || ""}</div>,
    size: 100,
    minSize: 90,
  },
  {
    accessorKey: "fields.fldA6e7ul57abYgAZDh",
    id: "description",
    header: "תיאור",
    cell: ({ row }) => (
      <div className="text-right truncate" title={row.original.fields.fldA6e7ul57abYgAZDh}>
        {row.original.fields.fldA6e7ul57abYgAZDh || ""}
      </div>
    ),
    size: 200,
    minSize: 60,
  },
  {
    accessorKey: "fields.fld56G8M1LyHRRROWiL",
    id: "dropoff",
    header: "חזור",
    cell: ({ row }) => <div className="text-right truncate">{row.original.fields.fld56G8M1LyHRRROWiL || ""}</div>,
    size: 100,
    minSize: 60,
  },
  {
    accessorKey: "fields.fldx4hl8FwbxfkqXf0B",
    id: "vehicle",
    header: "סוג רכב",
    cell: ({ row }) => <div className="text-right truncate">{renderLinkField(row.original.fields.fldx4hl8FwbxfkqXf0B)}</div>,
    size: 120,
    minSize: 90,
  },
  {
    accessorKey: "fields.flddNPbrzOCdgS36kx5",
    id: "driver",
    header: "שם נהג",
    cell: ({ row }) => <div className="text-right font-medium truncate">{renderLinkField(row.original.fields.flddNPbrzOCdgS36kx5)}</div>,
    size: 120,
    minSize: 80,
  },
  {
    accessorKey: "fields.fldxXnfHHQWwXY8dlEV",
    id: "price_client_plus_vat",
    header: 'מחיר לקוח+ מע"מ',
    cell: ({ row }) => <div className="text-right">{row.original.fields.fldxXnfHHQWwXY8dlEV}</div>,
    size: 140,
    minSize: 140,
  },
  {
    accessorKey: "fields.fldT7QLSKmSrjIHarDb",
    id: "price_client_full",
    header: 'מחיר לקוח כולל מע"מ',
    cell: ({ row }) => <div className="text-right">{row.original.fields.fldT7QLSKmSrjIHarDb}</div>,
    size: 160,
    minSize: 160,
  },
  {
    accessorKey: "fields.fldSNuxbM8oJfrQ3a9x",
    id: "price_driver_plus_vat",
    header: 'מחיר נהג+ מע"מ',
    cell: ({ row }) => <div className="text-right">{row.original.fields.fldSNuxbM8oJfrQ3a9x}</div>,
    size: 130,
    minSize: 130,
  },
  {
    accessorKey: "fields.fldyQIhjdUeQwtHMldD",
    id: "price_driver_full",
    header: 'מחיר נהג כולל מע"מ',
    cell: ({ row }) => <div className="text-right">{row.original.fields.fldyQIhjdUeQwtHMldD}</div>,
    size: 150,
    minSize: 150,
  },
  {
    accessorKey: "fields.fldT9IZTYlT4gCEnOK3",
    id: "profit",
    header: 'רווח+ מע"מ',
    cell: ({ row }) => <div className="text-right">{row.original.fields.fldT9IZTYlT4gCEnOK3}</div>,
    size: 100,
    minSize: 100,
  },
  {
    accessorKey: "fields.fldhNoiFEkEgrkxff02",
    id: "notes_driver",
    header: "הערות לנהג",
    cell: ({ row }) => <div className="text-right truncate">{row.original.fields.fldhNoiFEkEgrkxff02 || ""}</div>,
    size: 150,
    minSize: 110,
  },
]

// --- קומפוננטת דיאלוג לסידור עמודות ---
function ColumnReorderDialog({ 
  open, 
  onOpenChange, 
  columnOrder, 
  onSave 
}: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void;
  columnOrder: string[];
  onSave: (newOrder: string[]) => void;
}) {
  const [internalOrder, setInternalOrder] = React.useState<string[]>([])
  const [draggedItem, setDraggedItem] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (open) {
      setInternalOrder(columnOrder)
    }
  }, [open, columnOrder])

  const getColumnName = (id: string) => {
    if (id === 'select') return 'בחירה'
    const col = columns.find(c => c.id === id)
    return col ? (col.header as string) : id
  }

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedItem(id)
    e.dataTransfer.effectAllowed = "move"
    // יצירת אלמנט גרירה "רוח רפאים"
    const ghost = document.createElement('div')
    ghost.style.opacity = '0'
    document.body.appendChild(ghost)
    e.dataTransfer.setDragImage(ghost, 0, 0)
    setTimeout(() => document.body.removeChild(ghost), 0)
  }

  const handleDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault()
    if (!draggedItem || draggedItem === targetId) return

    const currentOrder = [...internalOrder]
    const draggedIdx = currentOrder.indexOf(draggedItem)
    const targetIdx = currentOrder.indexOf(targetId)

    if (draggedIdx !== -1 && targetIdx !== -1) {
      currentOrder.splice(draggedIdx, 1)
      currentOrder.splice(targetIdx, 0, draggedItem)
      setInternalOrder(currentOrder)
    }
  }

  const handleSave = () => {
    onSave(internalOrder)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]" dir="rtl">
        <DialogHeader>
          <DialogTitle>סידור עמודות</DialogTitle>
          <DialogDescription>
            גרור את העמודות כדי לשנות את הסדר שלהן בטבלה.
          </DialogDescription>
        </DialogHeader>
        
        {/* שימוש ב-ScrollArea שיצרת */}
        <ScrollArea className="h-[400px] pr-4 border rounded-md p-2">
          <div className="space-y-2">
            {internalOrder.map((colId) => {
              if (colId === 'select') return null;
              
              return (
                <div
                  key={colId}
                  draggable
                  onDragStart={(e) => handleDragStart(e, colId)}
                  onDragOver={(e) => handleDragOver(e, colId)}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-md border bg-card cursor-grab active:cursor-grabbing transition-colors",
                    draggedItem === colId ? "bg-accent border-primary" : "hover:bg-accent/50"
                  )}
                >
                  <GripVertical className="h-4 w-4 text-muted-foreground" />
                  <span className="flex-1 font-medium text-sm">
                    {getColumnName(colId)}
                  </span>
                </div>
              )
            })}
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>ביטול</Button>
          <Button onClick={handleSave}>
            <Save className="ml-2 h-4 w-4" />
            שמור שינויים
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// --- הקומפוננטה הראשית ---
export function DataGrid({ schema }: { schema: any }) {
  const [data, setData] = React.useState<WorkScheduleRecord[]>([])
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})
  const [globalFilter, setGlobalFilter] = React.useState("")
  const [dateFilter, setDateFilter] = React.useState<Date>(new Date())
  
  // ניהול סדר עמודות וגדלים
  const [columnOrder, setColumnOrder] = React.useState<ColumnOrderState>([])
  const [columnSizing, setColumnSizing] = React.useState<ColumnSizingState>({})
  
  // ניהול דיאלוג סידור עמודות
  const [isReorderOpen, setIsReorderOpen] = React.useState(false)

  const { toast } = useToast()
  
  const [editingRecord, setEditingRecord] = React.useState<WorkScheduleRecord | null>(null)
  const [isEditOpen, setIsEditOpen] = React.useState(false)
  const [isCalendarOpen, setIsCalendarOpen] = React.useState(false)
  const [isResizing, setIsResizing] = React.useState(false)

  const fetchData = async () => {
    try {
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

  // טעינת הגדרות שמורות
  React.useEffect(() => {
    const savedSettings = localStorage.getItem("workScheduleGridSettings")
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings)
        if (parsed.columnOrder && parsed.columnOrder.length > 0) setColumnOrder(parsed.columnOrder)
        else setColumnOrder(columns.map(c => c.id as string))
        
        if (parsed.columnSizing) setColumnSizing(parsed.columnSizing)
      } catch (e) {
        setColumnOrder(columns.map(c => c.id as string))
      }
    } else {
      setColumnOrder(columns.map(c => c.id as string))
    }
  }, [])

  // שמירת הגדרות (רק גודל עמודות כאן, הסדר נשמר ידנית)
  React.useEffect(() => {
    if (columnOrder.length > 0) {
      const settingsToSave = {
        columnOrder,
        columnSizing
      }
      localStorage.setItem("workScheduleGridSettings", JSON.stringify(settingsToSave))
    }
  }, [columnOrder, columnSizing])

  // פונקציית שמירה מהדיאלוג
  const handleOrderSave = (newOrder: string[]) => {
    const finalOrder = ['select', ...newOrder.filter(id => id !== 'select')]
    setColumnOrder(finalOrder)
    
    localStorage.setItem("workScheduleGridSettings", JSON.stringify({
      columnOrder: finalOrder,
      columnSizing
    }))
    
    toast({ title: "סדר העמודות עודכן בהצלחה" })
  }

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
    columnResizeMode: "onChange",
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onColumnOrderChange: setColumnOrder,
    onColumnSizingChange: setColumnSizing,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      columnOrder,
      columnSizing,
    },
  })

  return (
    <div className="w-full h-full flex flex-col space-y-4 p-4" dir="rtl">
      {/* שורת הכותרת */}
      <div className="flex items-center justify-between gap-4">
        
        {/* צד ימין */}
        <div className="flex items-center gap-2">
          
          <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
            <PopoverTrigger asChild>
              <Button variant={"outline"} className={cn("w-[200px] justify-start text-right font-normal")}>
                <CalendarIcon className="ml-2 h-4 w-4" />
                {format(dateFilter, "PPP", { locale: he })}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="single"
                selected={dateFilter}
                onSelect={handleDateSelect}
                required
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

          <NewRideDialog onRideCreated={fetchData} />

          {/* כפתור סדר עמודות עם טקסט */}
          <Button variant="outline" onClick={() => setIsReorderOpen(true)}>
            <Settings2 className="h-4 w-4 ml-2" />
            סדר עמודות
          </Button>

          <div className="flex items-center w-full max-w-sm">
             <Input
               placeholder="חיפוש..."
               value={globalFilter}
               onChange={(event) => setGlobalFilter(event.target.value)}
               className="max-w-xs"
             />
           </div>

          {Object.keys(rowSelection).length > 0 && (
            <Button variant="destructive" size="sm" onClick={handleDeleteSelected}>
              <Trash2 className="h-4 w-4 ml-2" />
              מחק ({Object.keys(rowSelection).length})
            </Button>
          )}
        </div>
      </div>
      
      {/* גוף הטבלה */}
      <div className="rounded-md border flex-1 overflow-auto max-h-[calc(100vh-200px)] relative">
        <Table className="relative w-full" style={{ tableLayout: 'fixed' }}>
          <TableHeader className="sticky top-0 bg-background z-10 shadow-sm">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead 
                    key={header.id} 
                    colSpan={header.colSpan}
                    className="text-right relative border-l select-none group hover:bg-muted/30"
                    style={{ width: header.getSize() }}
                  >
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    
                    {/* ידית שינוי גודל */}
                    {header.column.getCanResize() && (
                      <div
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          setIsResizing(true);
                          const startX = e.clientX;
                          const startWidth = header.getSize();
                          
                          const onMouseMove = (moveEvent: MouseEvent) => {
                            const currentX = moveEvent.clientX;
                            const delta = startX - currentX; // RTL
                            const minSize = header.column.columnDef.minSize || 50;
                            const newWidth = Math.max(minSize, startWidth + delta); 
                            
                            setColumnSizing(old => ({ ...old, [header.id]: newWidth }))
                          };

                          const onMouseUp = () => {
                            setIsResizing(false);
                            document.removeEventListener('mousemove', onMouseMove);
                            document.removeEventListener('mouseup', onMouseUp);
                          };
                          document.addEventListener('mousemove', onMouseMove);
                          document.addEventListener('mouseup', onMouseUp);
                        }}
                        className="absolute left-0 top-0 h-full w-1 cursor-col-resize touch-none select-none z-20 hover:bg-primary transition-colors duration-200"
                      />
                    )}
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

      <RecordEditDialog
        record={editingRecord}
        schema={schema}
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        onSave={(updatedRecord) => {
          setData(data.map((r) => (r.id === updatedRecord.id ? updatedRecord : r)))
        }}
      />

      {/* הדיאלוג החדש */}
      <ColumnReorderDialog 
        open={isReorderOpen} 
        onOpenChange={setIsReorderOpen}
        columnOrder={columnOrder}
        onSave={handleOrderSave}
      />
    </div>
  )
}
