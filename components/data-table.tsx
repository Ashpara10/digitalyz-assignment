"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Edit2, Save, X, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"

interface DataTableProps {
  data: any[]
  entityType: string
}

export function DataTable({ data, entityType }: DataTableProps) {
  const [editingCell, setEditingCell] = useState<{ row: number; col: string } | null>(null)
  const [editValue, setEditValue] = useState("")
  const [tableData, setTableData] = useState(data)

  if (!data.length) return null

  const columns = Object.keys(data[0])

  const hasError = (rowIndex: number, colKey: string) => {
    // Mock validation logic
    if (entityType === "clients" && colKey === "contact" && rowIndex === 1) return true
    if (entityType === "clients" && colKey === "budget" && rowIndex === 2) return true
    if (entityType === "workers" && colKey === "availability" && rowIndex === 0) return true
    return false
  }

  const startEdit = (rowIndex: number, colKey: string, currentValue: any) => {
    setEditingCell({ row: rowIndex, col: colKey })
    setEditValue(String(currentValue))
  }

  const saveEdit = () => {
    if (!editingCell) return

    const newData = [...tableData]
    newData[editingCell.row][editingCell.col] = editValue
    setTableData(newData)
    setEditingCell(null)
    setEditValue("")
  }

  const cancelEdit = () => {
    setEditingCell(null)
    setEditValue("")
  }

  return (
    <div className="border rounded-lg overflow-hidden bg-white shadow-sm">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-gray-50">
            <TableRow>
              {columns.map((column) => (
                <TableHead key={column} className="font-semibold text-gray-900 sticky top-0 bg-gray-50">
                  {column.charAt(0).toUpperCase() + column.slice(1)}
                </TableHead>
              ))}
              <TableHead className="w-20 sticky top-0 bg-gray-50">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tableData.map((row, rowIndex) => (
              <TableRow key={rowIndex} className="hover:bg-gray-50">
                {columns.map((column) => {
                  const isEditing = editingCell?.row === rowIndex && editingCell?.col === column
                  const hasValidationError = hasError(rowIndex, column)

                  return (
                    <TableCell
                      key={column}
                      className={cn("relative", hasValidationError && "border-red-300 bg-red-50")}
                    >
                      {isEditing ? (
                        <div className="flex items-center space-x-2">
                          <Input
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="h-8"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === "Enter") saveEdit()
                              if (e.key === "Escape") cancelEdit()
                            }}
                          />
                          <Button size="sm" variant="ghost" onClick={saveEdit}>
                            <Save className="w-3 h-3" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={cancelEdit}>
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <span className={cn(hasValidationError && "text-red-700")}>{String(row[column])}</span>
                          {hasValidationError && <AlertTriangle className="w-4 h-4 text-red-500" />}
                        </div>
                      )}
                    </TableCell>
                  )
                })}
                <TableCell>
                  <Button size="sm" variant="ghost" onClick={() => startEdit(rowIndex, columns[0], row[columns[0]])}>
                    <Edit2 className="w-3 h-3" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
