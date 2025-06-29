import { z } from "zod";
import {
  TFileType,
  TValidationErrorProps,
  CellErrorMap,
  REQUIRED_COLUMNS,
} from "@/lib/types";
import { checkMissingColumns, getCellErrorMap } from "@/lib/utils";
import { clientSchema, taskSchema, workerSchema } from "@/lib/types";

export class DataValidator {
  private rows: any[];
  private file: File | null;
  private headers: string[];
  private fileType: TFileType;
  private schema: z.ZodSchema;

  constructor(rows: any[], headers: string[], fileType: TFileType, file: File) {
    this.rows = rows;
    this.headers = headers;
    this.file = file;
    this.fileType = fileType;
    this.schema = this.getSchemaForFileType(fileType);
  }

  public runAllValidations(): {
    errors: TValidationErrorProps[];
    cellErrorMap: CellErrorMap;
  } {
    const allErrors: TValidationErrorProps[] = [];

    // 1. Core validations
    allErrors.push(
      ...checkMissingColumns(this.headers, this.fileType, this?.file)
    );
    allErrors.push(...this.validateWithZod());

    allErrors.push(...this.validateDuplicateIDs());

    // 2. Schema validations (Zod)

    // 3. Build cell error map
    const cellErrorMap = getCellErrorMap(allErrors);
    return { errors: allErrors, cellErrorMap };
  }

  private getSchemaForFileType(fileType: TFileType): z.ZodSchema<any> {
    switch (fileType) {
      case "client":
        return clientSchema;
      case "tasks":
        return taskSchema;
      case "worker":
        return workerSchema;
      default:
        throw new Error(`No schema defined for ${fileType}`);
    }
  }

  private validateDuplicateIDs(): TValidationErrorProps[] {
    const idKey =
      this.fileType === "client"
        ? "ClientID"
        : this.fileType === "tasks"
        ? "TaskID"
        : "WorkerID";

    const seen = new Set<string>();
    const errors: TValidationErrorProps[] = [];

    this.rows.forEach((row, idx) => {
      const id = row[idKey];
      if (!id) return;

      if (seen.has(id)) {
        errors.push({
          type: "DuplicateIDs",
          entity: this.fileType,
          error: `Duplicate ID '${id}' found at row ${idx + 1}`,
          affectedRows: [idx],
          affectedFields: [idKey],
        });
      } else {
        seen.add(id);
      }
    });

    return errors;
  }

  private validateWithZod(): TValidationErrorProps[] {
    const errors: TValidationErrorProps[] = [];

    this.rows.forEach((row, idx) => {
      const result = this.schema.safeParse(row);
      if (!result.success) {
        errors.push({
          type: "ZodValidationError",
          entity: this.fileType,
          error: result.error.errors.map((e) => e.message).join(", "),
          affectedRows: [idx],
          affectedFields: result.error.errors.map((e) =>
            e.path[0] ? String(e.path[0]) : ""
          ),
        });
      }
    });

    return errors;
  }
}
