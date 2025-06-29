"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Edit2, Save, X, AlertTriangle } from "lucide-react";
import { capitalizeFirstLetter, cn, getCellErrorMap } from "@/lib/utils";
import { AgGridReact } from "ag-grid-react";
import { CellValueChangedEvent, ColDef, GridApi } from "ag-grid-community";
import { DataValidator } from "@/lib/validator";
import { CellErrorMap, TFileType, TValidationErrorProps } from "@/lib/types";
import { CustomCellRenderer } from "@/app/page";

interface DataTableProps {
  rows: any[];
  entityType: TFileType;
  columns: string[];
  validationErrors: TValidationErrorProps[];
  onValidationErrorsChange: (
    entityType: TFileType,
    errors: TValidationErrorProps[]
  ) => void;
  dataSet: {
    client: any[];
    worker: any[];
    tasks: any[];
  };
}

export function DataTable({
  rows,
  columns,
  dataSet,
  entityType,
  validationErrors,
  onValidationErrorsChange,
}: DataTableProps) {
  const [gridApi, setGridApi] = useState<GridApi | null>(null);

  const [cellErrorMap, setCellErrorMap] = useState<CellErrorMap>({});
  const validator = useMemo(
    () => new DataValidator(dataSet, rows, columns, entityType),
    [dataSet, rows, columns, entityType]
  );

  const dynamicColumns = useMemo(() => {
    return columns.map(
      (key) =>
        ({
          headerName: key,
          field: key,
          sortable: true,
          filter: true,
          editable: true,
          cellRenderer: CustomCellRenderer,
          cellClassRules: {
            "ag-cell-error": (params) => {
              const rowIndex = params.node.rowIndex as number;
              return !!cellErrorMap[key]?.[rowIndex];
            },
          },
          tooltipValueGetter: (params) =>
            cellErrorMap[key]?.[params.node!.rowIndex as number]?.join(", ") ||
            "",
        } as ColDef)
    );
  }, [columns, cellErrorMap]);

  useEffect(() => {
    if (!gridApi) return;

    const { errors, cellErrorMap } = validator.runAllValidationsOnRows();
    setCellErrorMap(cellErrorMap);
    onValidationErrorsChange(entityType, errors);

    gridApi.refreshCells({
      force: true,
    });
  }, [gridApi, rows, columns]);
  console.log({ cellErrorMap, validationErrors });

  const onCellValueChanged = useCallback((params: CellValueChangedEvent) => {
    console.log("Cell value changed:", params);
    let errors: TValidationErrorProps[] = [];
    params.api.forEachNode((node) => {
      errors = [...errors, ...validator.runAllValidationsOnRow(node)];
    });
    const newCellErrorMap = getCellErrorMap([...errors]);
    setCellErrorMap(newCellErrorMap);
    onValidationErrorsChange(entityType, errors);
    params?.api.refreshCells({ force: true });
  }, []);

  return (
    <div className="">
      <div className="mb-2 px-4 py-2">
        <h2 className="text-xl font-semibold tracking-tight">
          {capitalizeFirstLetter(entityType)}
        </h2>
      </div>

      {Object.entries(cellErrorMap)?.length > 0 && (
        <div className="max-w-5xl mb-8 mx-auto w-full px-6 py-6 bg-red-100 rounded-2xl space-y-4">
          {Object.entries(cellErrorMap)?.map(([k, v], i) => {
            const errors = Object.values(v);
            if (errors.length === 0) return null;
            return (
              <div key={i}>
                <h3 className="text-red-600 font-semibold">
                  {k} ({Object.keys(v).length}) Errors:
                </h3>
                <ul className="list-disc pl-5">
                  {/* {errors && */}
                  {errors?.slice(0, 10)?.map((error, index) => (
                    <li key={index} className="text-red-500">
                      {error}
                    </li>
                  ))}
                  {/* ))} */}
                </ul>
              </div>
            );
          })}
        </div>
      )}

      <div
        className="border-neutral-200 bg-neutral-100 border p-3 rounded-2xl"
        style={{
          height: 600,
          overflowY: "auto",
          width: "100%",
          maxWidth: "100%",
        }}
      >
        <AgGridReact
          autoSizeStrategy={{
            type: "fitCellContents",
          }}
          rowClass={"ag-row"}
          rowSelection={"multiple"}
          columnDefs={dynamicColumns}
          enableBrowserTooltips={true}
          rowData={rows}
          getRowId={(params) =>
            (params.data.ClientID ||
              params.data.TaskID ||
              params.data.WorkerID) as string
          }
          onGridReady={(params) => {
            setGridApi(params.api);
            validator.setGridApi(params.api);
          }}
          onCellValueChanged={onCellValueChanged}
        />
      </div>
    </div>
  );
}
