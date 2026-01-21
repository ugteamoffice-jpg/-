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
import { ArrowUpDown, ChevronDown, Plus, Search, Calendar as CalendarIcon, X, Trash2 } from "lucide-react"
import { format } from "date-fns"
import { he } from "date-fns/locale"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
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

// הגדרת טיפוס הנתונים
export interface WorkScheduleRecord {
  id: string
  fields: {
    [key: string]: any
    fldT720jVmGMXFURUKL?: string // תאריך
    fldqFE8SRWBvx3lhI33?: string // התייצבות
    fldMONOIhazLclMi3WN?: string // תיאור
    fldiIu1Wm6gC2665QdN?: string // חזור
    fldjMfOvWEu7HtjSQmv?: boolean // שלח
    fldoOFQdbIVJthTngkg?: boolean // מאושר
    fldpPsdEQlpmh7UtZ0G?: number // מחיר לקוח+ מע"מ
    fldF2pbjDa4PjHtm0bP?: number // מחיר לקוח כולל מע"מ
    fldcSKtFOjZMDyWHALR?: number // מע"מ
    fldJrzZk9KXj8bn5Rrl?: number // מחיר נהג+ מע"מ
    fldhBH2HAFeNviGwRlu?: number // מחיר נהג כולל מע"מ
    fldv3s20240101?: number // רווח+ מע"מ
    fldv3s20240102?: string // הערות לנהג
    fldGTTvqQ8lii1wfiS5?: any // שם נהג (Link)
    fldeppUjfYTJgZZi6VI?: any // סוג רכב (Link)
    fldS0PNTKZseugMVhcA?: any // שם לקוח (Link)
  }
}

// הגדרת העמודות
export const columns: ColumnDef<WorkScheduleRecord>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
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
    accessorKey: "fields.fldjMfOvWEu7HtjSQmv",
    header: "שלח",
    cell: ({ row }) => (
      <div className="flex justify-center">
        <Checkbox 
          checked={row.original.fields.fldjMfOvWEu7HtjSQmv as boolean} 
          disabled 
        />
      </div>
    ),
  },
  {
    accessorKey: "fields.fldoOFQdbIVJthTngkg",
    header: "מאושר",
    cell: ({ row }) => (
      <div className="flex justify-center">
        <Checkbox 
          checked={row.original.fields.fldoOFQdbIVJthTngkg as boolean} 
          disabled 
        />
      </div>
    ),
  },
  {
    accessorKey: "fields.fldS0PNTKZseugMVhcA",
    header: "שם לקוח",
    cell: ({ row }) => {
      const val = row.original.fields.fldS0PNTKZseugMVhcA
      if (Array.isArray(val) && val[0]?.title) return <div className="text-right">{val[0].title}</div>
      if (val?.title) return <div className="text-right">{val.title}</div>
      return <div className="text-right text-muted-foreground">-</div>
    },
  },
  {
    accessorKey: "fields.fldqFE8SRWBvx3lhI33",
    header: "התייצבות",
    cell: ({ row }) => <div className="text-right">{row.original.fields.fldqFE8SRWBvx3lhI33 || ""}</div>,
  },
  {
    accessorKey: "fields.fldMONOIhazLclMi3WN",
    header: "תיאור",
    cell: ({ row }) => (
      <div className="text-right max-w-[200px] truncate" title={row.original.fields.fldMONOIhazLclMi3WN}>
        {row.original.fields.fldMONOIhazLclMi3WN || ""}
      </div>
    ),
  },
  {
    accessorKey: "fields.fldiIu1Wm6gC2665QdN",
    header: "חזור",
    cell: ({ row }) => <div className="text-right">{row.original.fields.fldiIu1Wm6gC2665QdN || ""}</div>,
  },
  {
    accessorKey: "fields.fldeppUjfYTJgZZi6VI",
    header: "סוג רכב",
    cell: ({ row }) => {
      const val = row.original.fields.fldeppUjfYTJgZZi6VI
      if (Array.isArray(val) && val[0]?.title) return <div className="text-right">{val[0].title}</div>
      if (val?.title) return <div className="text-right">{val.title}</div>
      return <div className="text-right text-muted-foreground">-</div>
    },
  },
  {
    accessorKey: "fields.fldGTTvqQ8lii1wfiS5",
    header: "שם נהג",
    cell: ({ row }) => {
      const val = row.original.fields.fldGTTvqQ8lii1wfiS5
      if (Array.isArray(val) && val[0]?.title) return <div className="text-right">{val[0].title}</div>
      if (val?.title) return <div className="text-right">{val.title}</div>
      return <div className="text-right text-muted-foreground">-</div>
    },
  },
  {
    accessorKey: "fields.fldpPsdEQlpmh7UtZ0G",
    header: 'מחיר לקוח+ מע"מ',
    cell: ({ row }) => <div className="text-right">{row.original.fields.fldpPsdEQlpmh7UtZ0G}</div>,
  },
  {
    accessorKey: "fields.fldJrzZk9KXj8bn5Rrl",
    header: 'מחיר נהג+ מע"מ',
    cell: ({ row }) => <div className="text-right">{row.original.fields.fldJrzZk9KXj8bn5Rrl}</div>,
  },
  {
    accessorKey: "fields.fldv3s20240101",
    header: 'רווח+ מע"מ',
    cell: ({ row }) => <div className="text-right">{row.original.fields.fldv3s20240101}</div>,
  },
  {
    accessorKey: "fields.fldv3s20240102",
    header: "הערות לנהג",
    cell: ({ row }) => <div className="text-right">{row.original.fields.fldv3s20240102 || ""}</div>,
  },
  {
    accessorKey: "fields.fldT720jVmGMXFURUKL",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          תאריך
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const date = row.original.fields.fldT720jVmGMXFURUKL
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
  const [dateFilter, setDateFilter] = React.useState<Date | undefined>(undefined)
  const { toast } = useToast()

  const fetchData = async () => {
    try {
      const response = await fetch('/api/table/tblVAQgIYOLfvCZdqgj')
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

  // מחיקת שורות מסומנות - הפיצ'ר החסר!
  const handleDeleteSelected = async () => {
    const selectedIds = Object.keys(rowSelection)
    if (selectedIds.length === 0) return

    if (!confirm("האם אתה בטוח שברצונך למחוק את הרשומות המסומנות?")) return

    // שליפת ה-IDs האמיתיים של הרשומות
    const recordsToDelete = table.getFilteredSelectedRowModel().rows.map(row => row.original.id)

    try {
      // מחיקה בלולאה (פשוט וקל)
      for (const id of recordsToDelete) {
        await fetch(`/api/work-schedule/${id}`, { method: "DELETE" })
      }
      
      toast({ title: "נמחק בהצלחה", description: `${recordsToDelete.length} רשומות נמחקו.` })
      setRowSelection({}) // איפוס בחירה
      fetchData() // רענון
    } catch (error) {
      toast({ title: "שגיאה", description: "ארעה שגיאה במחיקה.", variant: "destructive" })
    }
  }

  const filteredData = React.useMemo(() => {
    let filtered = data

    if (dateFilter) {
      const dateStr = format(dateFilter, "yyyy-MM-dd")
      filtered = filtered.filter(item => {
        const itemDate = item.fields.fldT720jVmGMXFURUKL
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
      <div className="flex items-center justify-between gap-4">
        {/* חיפוש */}
        <div className="flex items-center gap-2 flex-1 max-w-sm">
           <Search className="w-4 h-4 text-muted-foreground" />
           <Input
             placeholder="חיפוש..."
             value={globalFilter}
             onChange={(event) => setGlobalFilter(event.target.value)}
             className="max-w-sm"
           />
        </div>

        <div className="flex items-center gap-2">
          {/* פח אשפה - מופיע רק כשבוחרים שורות */}
          {Object.keys(rowSelection).length > 0 && (
            <Button variant="destructive" size="sm" onClick={handleDeleteSelected}>
              <Trash2 className="h-4 w-4 ml-2" />
              מחק ({Object.keys(rowSelection).length})
            </Button>
          )}

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-[240px] justify-start text-right font-normal",
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
                onSelect={setDateFilter}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          
          {dateFilter && (
             <Button variant="ghost" size="icon" onClick={() => setDateFilter(undefined)}>
               <X className="h-4 w-4" />
             </Button>
          )}

          <NewRideDialog onRideCreated={fetchData} />
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="ml-auto">
                עמודות <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  )
                })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id} className="text-right">
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="text-right">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  אין תוצאות.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length} מתוך{" "}
          {table.getFilteredRowModel().rows.length} שורות נבחרו.
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
    </div>
  )
}
