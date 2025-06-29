"use client";

import { CustomCellRenderer } from "@/app/page";
import { CellErrorMap, TFileType, TValidationErrorProps } from "@/lib/types";
import { capitalizeFirstLetter, getCellErrorMap } from "@/lib/utils";
import { DataValidator } from "@/lib/validator";
import { CellValueChangedEvent, ColDef, GridApi } from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { ValidationPanel } from "./validation-panel";

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
          cellRenderer: memo(CustomCellRenderer),
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
    console.log({ cellErrorMap });
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
      <ValidationPanel cellErrorMap={cellErrorMap} />

      <div className="max-w-5xl mx-auto w-full">
        <div className="mb-4">
          <h3 className="text-lg font-semibold mb-2">
            {capitalizeFirstLetter(entityType)} Data Table
          </h3>
        </div>

        <div style={{ height: 500, width: "100%" }}>
          <AgGridReact
            rowData={rows}
            columnDefs={dynamicColumns}
            onGridReady={(params) => {
              setGridApi(params.api);
              validator.setGridApi(params?.api);
            }}
            onCellValueChanged={onCellValueChanged}
            rowSelection="multiple"
            enableBrowserTooltips={true}
            getRowId={(params) =>
              (params.data.ClientID ||
                params.data.TaskID ||
                params.data.WorkerID) as string
            }
          />
        </div>
      </div>
    </div>
  );
}
