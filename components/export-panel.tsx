"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { TFileType } from "@/lib/types";
import { Download } from "lucide-react";
import * as XLSX from "xlsx";
import { capitalizeFirstLetter } from "@/lib/utils";

interface ExportPanelProps {
  clientData: any[];
  workerData: any[];
  tasksData: any[];
  businessRules: any[];
  priorities: Record<TFileType, Record<string, number>>;
  validationErrors: Record<TFileType, any[]>;
}

export function ExportPanel({
  clientData,
  workerData,
  tasksData,
  businessRules,
  priorities,
  validationErrors,
}: ExportPanelProps) {
  const [exportFormat, setExportFormat] = useState<"csv" | "json" | "xlsx">(
    "csv"
  );
  const [includeValidationErrors, setIncludeValidationErrors] = useState(true);
  const [includeBusinessRules, setIncludeBusinessRules] = useState(true);
  const [includePriorities, setIncludePriorities] = useState(true);
  const [selectedEntities, setSelectedEntities] = useState<Set<TFileType>>(
    new Set(["client", "worker", "tasks"])
  );

  const toggleEntity = (entity: TFileType) => {
    const newSelected = new Set(selectedEntities);
    if (newSelected.has(entity)) {
      newSelected.delete(entity);
    } else {
      newSelected.add(entity);
    }
    setSelectedEntities(newSelected);
  };

  const getEntityData = (entity: TFileType) => {
    switch (entity) {
      case "client":
        return clientData;
      case "worker":
        return workerData;
      case "tasks":
        return tasksData;
      default:
        return [];
    }
  };

  const getEntityName = (entity: TFileType) => {
    return entity.charAt(0).toUpperCase() + entity.slice(1);
  };

  function s2ab(s: string) {
    const buf = new ArrayBuffer(s.length);
    const view = new Uint8Array(buf);
    for (let i = 0; i !== s.length; ++i) view[i] = s.charCodeAt(i) & 0xff;
    return buf;
  }

  const exportData = async () => {
    const exportData: any = {
      metadata: {
        exportDate: new Date().toISOString(),
        format: exportFormat,
        totalRecords: {
          client: clientData.length,
          worker: workerData.length,
          tasks: tasksData.length,
        },
      },
    };

    // Add selected entity data
    selectedEntities.forEach((entity) => {
      const data = getEntityData(entity);
      if (includePriorities && priorities[entity]) {
        // Merge priorities with data
        const dataWithPriorities = data.map((item) => ({
          ...item,
          Priority:
            priorities[entity][
              item[`${entity.charAt(0).toUpperCase() + entity.slice(1)}ID`]
            ] || 1,
        }));
        exportData[entity] = dataWithPriorities;
      } else {
        exportData[entity] = data;
      }
    });

    // Add validation errors if requested
    if (includeValidationErrors) {
      exportData.validationErrors = validationErrors;
    }

    // Add business rules if requested
    if (includeBusinessRules) {
      exportData.businessRules = businessRules;
    }

    // Create and download file
    if (exportFormat === "json") {
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `data-alchemist-export-${
        new Date().toISOString().split("T")[0]
      }.json`;
      a.click();
      URL.revokeObjectURL(url);
    } else if (exportFormat === "csv") {
      // For CSV, we'll export each entity as a separate file
      selectedEntities.forEach((entity) => {
        const data = getEntityData(entity);
        if (data.length === 0) return;

        const headers = Object.keys(data[0]);
        const csvContent = [
          headers.join(","),
          ...data.map((row) =>
            headers
              .map((header) => {
                const value = row[header];
                // Escape commas and quotes in CSV
                if (
                  typeof value === "string" &&
                  (value.includes(",") || value.includes('"'))
                ) {
                  return `"${value.replace(/"/g, '""')}"`;
                }
                return value;
              })
              .join(",")
          ),
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${entity}-data-${
          new Date().toISOString().split("T")[0]
        }.csv`;
        a.click();
        URL.revokeObjectURL(url);
      });
    } else if (exportFormat === "xlsx") {
      // For Excel, we'll export each entity as a separate sheet
      selectedEntities.forEach((entity, index) => {
        const workbook = XLSX.utils.book_new();
        const data = getEntityData(entity);
        if (data.length === 0) return;
        const worksheet = XLSX.utils.json_to_sheet(data);
        XLSX.utils.book_append_sheet(
          workbook,
          worksheet,
          `${capitalizeFirstLetter(entity)} Sheet}`
        );
        const excelBuffer = XLSX.write(workbook, {
          bookType: "xlsx",
          type: "binary",
        });
        console.log({ excelBuffer });
        const blob = new Blob([s2ab(excelBuffer)], {
          type: "application/octet-stream",
        });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `data-alchemist-export-${entity}.xlsx`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      });
    }
  };

  const totalRecords = clientData.length + workerData.length + tasksData.length;
  const totalErrors = Object.values(validationErrors).reduce(
    (sum, errors) => sum + errors.length,
    0
  );

  return (
    <Card className="w-full border border-neutral-200 bg-white">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="text-lg font-semibold tracking-tight">
            Export Data
          </span>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{totalRecords} Records</Badge>
            <Badge variant="outline">{businessRules.length} Rules</Badge>
            <Badge variant="outline">{totalErrors} Errors</Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Export Format Selection */}
        <div>
          <Label className="text-base font-medium">Export Format</Label>
          <Select
            value={exportFormat}
            onValueChange={(value: "csv" | "json" | "xlsx") =>
              setExportFormat(value)
            }
          >
            <SelectTrigger className="w-48 mt-2">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-white border-neutral-200">
              <SelectItem value="csv">CSV (Multiple Files)</SelectItem>
              <SelectItem value="json">JSON (Single File)</SelectItem>
              <SelectItem value="xlsx">Excel (Coming Soon)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Entity Selection */}
        <div>
          <Label className="text-base font-medium">Select Data to Export</Label>
          <div className="grid grid-cols-3 gap-4 mt-2">
            {(["client", "worker", "tasks"] as TFileType[]).map((entity) => {
              const data = getEntityData(entity);
              const isSelected = selectedEntities.has(entity);

              return (
                <div
                  key={entity}
                  className={`py-3 px-5 border rounded-xl cursor-pointer transition-colors ${
                    isSelected
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200"
                  }`}
                  onClick={() => toggleEntity(entity)}
                >
                  <div className="flex items-start gap-2">
                    <Checkbox
                      className="border mt-1 border-neutral-200 rounded-md bg-white size-5"
                      checked={isSelected}
                      onChange={() => toggleEntity(entity)}
                    />
                    <div className="flex-1 ml-2">
                      <div className="font-medium">{getEntityName(entity)}</div>
                      <div className="text-sm text-gray-500">
                        {data.length} records
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Export Options */}
        <div>
          <Label className="text-base font-medium">Export Options</Label>
          <div className="space-y-3 mt-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="includePriorities"
                checked={includePriorities}
                onCheckedChange={(checked: boolean) =>
                  setIncludePriorities(checked)
                }
              />
              <Label htmlFor="includePriorities">Include priority levels</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="includeValidationErrors"
                checked={includeValidationErrors}
                onCheckedChange={(checked: boolean) =>
                  setIncludeValidationErrors(checked)
                }
              />
              <Label htmlFor="includeValidationErrors">
                Include validation errors
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="includeBusinessRules"
                checked={includeBusinessRules}
                onCheckedChange={(checked: boolean) =>
                  setIncludeBusinessRules(checked)
                }
              />
              <Label htmlFor="includeBusinessRules">
                Include business rules
              </Label>
            </div>
          </div>
        </div>

        {/* Export Summary */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium mb-2">Export Summary</h4>
          <div className="space-y-1 text-sm">
            <div>Format: {exportFormat.toUpperCase()}</div>
            <div>
              Entities:{" "}
              {Array.from(selectedEntities).map(getEntityName).join(", ")}
            </div>
            <div>
              Total Records:{" "}
              {Array.from(selectedEntities).reduce(
                (sum, entity) => sum + getEntityData(entity).length,
                0
              )}
            </div>
            {includeBusinessRules && (
              <div>Business Rules: {businessRules.length}</div>
            )}
            {includeValidationErrors && (
              <div>Validation Errors: {totalErrors}</div>
            )}
          </div>
        </div>

        {/* Export Button */}
        <div className="flex justify-end">
          <Button
            className="bg-indigo-500 text-white hover:bg-indigo-600 px-8"
            onClick={exportData}
            disabled={selectedEntities.size === 0}
          >
            <Download className="w-4 h-4 mr-2" />
            Export Data
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
