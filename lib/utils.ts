import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import {
  CellErrorMap,
  REQUIRED_COLUMNS,
  TFileType,
  TValidationErrorProps,
} from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const capitalizeFirstLetter = (str: string) => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

export const getMissingColumns = (headers: string[], type: TFileType) => {
  const missingColumns = REQUIRED_COLUMNS[type].filter(
    (col) => !headers.includes(col)
  );
  return missingColumns;
};

function findDuplicates<T>(arr: T[]): T[] {
  const seen = new Set<T>();
  const duplicates = new Set<T>();
  for (const val of arr) {
    if (seen.has(val)) {
      duplicates.add(val);
    } else {
      seen.add(val);
    }
  }
  return Array.from(duplicates);
}

export const checkDuplicateIDs = (rows: any[], fileType: TFileType) => {
  const idKey =
    fileType === "client"
      ? "ClientID"
      : fileType === "tasks"
      ? "TaskID"
      : "WorkerID";

  const seen = new Set<string>();
  const errors: TValidationErrorProps[] = [];

  rows.forEach((row, idx) => {
    const id = row[idKey];
    if (!id) return;

    if (seen.has(id)) {
      errors.push({
        type: "DuplicateIDs",
        entity: fileType,
        error: `Duplicate ID '${id}' found at row ${idx + 1}`,
        affectedRows: [idx],
        affectedFields: [idKey],
      });
    } else {
      seen.add(id);
    }
  });

  return errors;
};

export const checkMissingColumns = (
  headers: string[],
  type: TFileType,
  file: File | null
): TValidationErrorProps[] => {
  const errors: TValidationErrorProps[] = [];
  const missingColumns = getMissingColumns(headers, type);

  if (missingColumns.length > 0) {
    const moreThanOne = missingColumns.length > 1;
    const msg = `Missing Column ${moreThanOne && "(s)"}: ${missingColumns.join(
      ", "
    )} in ${file?.name}`;

    errors.push({
      entity: type,
      type: "MissingColumns",
      error: msg,
      details: [...missingColumns],
    });
  }

  return errors;
};

type CoreValidatorProps = {
  // headers: string[];
  data: any[];
  // file: File;
  type: TFileType;
};

export const runCoreValidations = ({ data, type }: CoreValidatorProps) => {
  const duplicateErrors = checkDuplicateIDs(data, type);

  return [...duplicateErrors];
};

export function getCellErrorMap(errors: TValidationErrorProps[]): CellErrorMap {
  const map: CellErrorMap = {};
  for (const err of errors) {
    if (err.affectedRows && err.affectedFields) {
      for (const field of err.affectedFields) {
        map[field] = map[field] || {};
        for (const row of err.affectedRows) {
          map[field][row] = map[field][row] || [];
          map[field][row].push(err.error);
        }
      }
    }
  }
  return map;
}
