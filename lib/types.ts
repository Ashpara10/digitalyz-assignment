import { z } from "zod";
export type TFileType = "client" | "tasks" | "worker";

// Custom validation for non-empty strings
const nonEmptyString = z.string().refine((val) => val.trim().length > 0, {
  message: "This field is required and cannot be empty",
});

const commaSeparatedStringArray = z.string().transform((val) =>
  val
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
);

export type ValidationErrorType =
  | "Quotes"
  | "Delimiter"
  | "FieldMismatch"
  | "ZodValidationError"
  // Structural / Parsing Errors
  | "MissingColumns"
  | "InvalidColumnFormat"
  | "DuplicateIDs"
  | "MalformedList"
  | "InvalidJSON"
  | "OutOfRangeValue"

  // Cross-Reference Errors
  | "UnknownTaskReference"
  | "SkillMismatch"
  | "BrokenReference"

  // Business Logic Errors
  | "OverloadedWorker"
  | "PhaseSlotSaturation"
  | "MaxConcurrencyExceeded"
  | "CircularCoRun"
  | "ConflictingPhaseWindow"
  | "InvalidPreferredPhases"

  // AI-Aided Enhancements (Bonus)
  | "AISuggestedFix"
  | "NaturalLanguageMismatch"

  // Catch-all
  | "Unknown";

export const REQUIRED_CLIENT_COLUMNS = [
  "ClientID",
  "ClientName",
  "PriorityLevel",
  "RequestedTaskIDs",
  "GroupTag",
  "AttributesJSON",
];
export const REQUIRED_TASKS_COLUMNS = [
  "TaskID",
  "TaskName",
  "Category",
  "Duration",
  "RequiredSkills",
  "PreferredPhases",
  "MaxConcurrent",
];
export const REQUIRED_WORKER_COLUMNS = [
  "WorkerID",
  "WorkerName",
  "Skills",
  "AvailableSlots",
  "MaxLoadPerPhase",
  "WorkerGroup",
  "QualificationLevel",
];
export const REQUIRED_COLUMNS: Record<TFileType, string[]> = {
  client: REQUIRED_CLIENT_COLUMNS,
  tasks: REQUIRED_TASKS_COLUMNS,
  worker: REQUIRED_WORKER_COLUMNS,
};

export const clientSchema = z.object({
  ClientID: nonEmptyString,
  ClientName: nonEmptyString,
  PriorityLevel: z.coerce.number().int(),
  RequestedTaskIDs: commaSeparatedStringArray,
  GroupTag: nonEmptyString,
  AttributesJSON: z.union([
    z.record(z.any()),
    z
      .string()
      .refine(
        (val) => {
          try {
            JSON.parse(val);
            return true;
          } catch {
            return false;
          }
        },
        { message: "Invalid JSON" }
      )
      .transform((arg) => JSON.parse(arg)),
  ]),
});
export type TClient = z.infer<typeof clientSchema>;

export const workerSchema = z.object({
  WorkerID: nonEmptyString,
  WorkerName: nonEmptyString,
  Skills: commaSeparatedStringArray,
  AvailableSlots: z
    .string()
    .transform((val) => JSON.parse(val))
    .pipe(z.array(z.number().int().positive())),
  MaxLoadPerPhase: z.coerce.number().int().nonnegative(),
  WorkerGroup: nonEmptyString,
  QualificationLevel: nonEmptyString,
});

const parsePreferredPhases = z.string().transform((val) => {
  if (val.startsWith("[")) {
    return JSON.parse(val);
  } else if (val.includes("-")) {
    const [start, end] = val.split("-").map(Number);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }
  throw new Error("Invalid PreferredPhases format");
});

export const taskSchema = z.object({
  TaskID: nonEmptyString,
  TaskName: nonEmptyString,
  Category: nonEmptyString,
  Duration: z.coerce.number().int(),
  RequiredSkills: commaSeparatedStringArray,
  PreferredPhases: parsePreferredPhases.pipe(
    z.array(z.number().int().positive())
  ),
  MaxConcurrent: z.coerce.number().int().nonnegative(),
});

export type TValidationErrorProps = {
  type: ValidationErrorType;
  entity: TFileType;
  error: string;
  affectedRows?: number[];
  affectedFields?: string[]; // Optional: row indexes for highlighting
  details?: any;
};

export type CellErrorMap = Record<string, Record<number, string[]>>;
