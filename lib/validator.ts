import { z } from "zod";
import {
  TFileType,
  TValidationErrorProps,
  CellErrorMap,
  REQUIRED_COLUMNS,
  TClient,
} from "@/lib/types";
import { checkMissingColumns, getCellErrorMap } from "@/lib/utils";
import { clientSchema, taskSchema, workerSchema } from "@/lib/types";
import { GridApi, IRowNode } from "ag-grid-community";

export interface ValidationContext {
  client: any[];
  worker: any[];
  tasks: any[];
}

export class DataValidator {
  private context: ValidationContext;
  private rows: any[];
  private headers: string[];
  private fileType: TFileType;
  private schema: z.ZodSchema;
  private gridApi: GridApi | null;

  constructor(
    context: ValidationContext,
    rows: any[],
    headers: string[],
    fileType: TFileType
  ) {
    this.gridApi = null;
    this.context = context;
    this.rows = rows;
    this.headers = headers;
    this.fileType = fileType;
    this.schema = this.getSchemaForFileType(fileType);
    console.log({ here: "Inside Validator", rows: this.rows });
  }

  public runAllValidationsOnRow(row: IRowNode<any>) {
    const allErrors: TValidationErrorProps[] = [];

    allErrors.push(...this.validateWithZod(row));
    allErrors.push(...this.validateBrokenJSON(row, this.fileType));
    allErrors.push(...this.validateDuplicateIDs(row));
    allErrors.push(...this.validateOutOfRangeValues(row, this.fileType));
    allErrors.push(...this.validateMalformedLists(row, this.fileType));
    allErrors.push(...this.validateUnknownReferences(row));
    allErrors.push(...this.validateSkillCoverage());
    // allErrors.push(...this.validateOverloadedWorkers());
    // allErrors.push(...this.validatePhaseSlotSaturation());
    // allErrors.push(...this.validateMaxConcurrency());

    console.log({ allErrors });
    return allErrors;
  }

  public runAllValidationsOnRows(): {
    errors: TValidationErrorProps[];
    cellErrorMap: CellErrorMap;
  } {
    const allErrors: TValidationErrorProps[] = [];

    this.rows.forEach((row, index) => {
      const mockNode = {
        data: row,
        rowIndex: index,
      } as IRowNode<any>;

      allErrors.push(...this.validateWithZod(mockNode));
      allErrors.push(...this.validateBrokenJSON(mockNode, this.fileType));
      allErrors.push(...this.validateDuplicateIDs(mockNode));
      allErrors.push(...this.validateOutOfRangeValues(mockNode, this.fileType));
      allErrors.push(...this.validateMalformedLists(mockNode, this.fileType));
      allErrors.push(...this.validateUnknownReferences(mockNode));
      allErrors.push(...this.validateSkillCoverage());
    });

    console.log(`Total errors found: ${allErrors.length}`, allErrors);

    // 4. Build cell error map
    const cellErrorMap = getCellErrorMap(allErrors);
    return { errors: allErrors, cellErrorMap };
  }
  public setGridApi(gridApi: GridApi) {
    this.gridApi = gridApi;
  }

  private getSchemaForFileType(fileType: TFileType): z.ZodSchema<any> {
    switch (fileType) {
      case "client":
        return clientSchema.omit({ AttributesJSON: true });
      case "tasks":
        return taskSchema.omit({ PreferredPhases: true });
      case "worker":
        return workerSchema;
      default:
        throw new Error(`No schema defined for ${fileType}`);
    }
  }

  private validateMissingColumns(
    headers: string[],
    type: TFileType,
    file: File
  ): TValidationErrorProps[] {
    const requiredColumns = this.getRequiredColumns(type);
    const missing = requiredColumns.filter((col) => !headers.includes(col));

    if (missing.length === 0) return [];

    return [
      {
        type: "MissingColumns",
        entity: type,
        error: `Missing required columns: ${missing.join(", ")} in ${
          file.name
        }`,
        details: missing,
      },
    ];
  }

  private validateDuplicateIDs(data: IRowNode<any>): TValidationErrorProps[] {
    const idField = this.getIdField(this.fileType);
    const errors: TValidationErrorProps[] = [];

    const currentId = data?.data?.[idField];
    console.log(
      `Validating duplicate IDs for ${idField}: ${currentId} in row ${data?.rowIndex}`
    );

    if (!currentId) {
      console.log(`No ID found for row ${data?.rowIndex}`);
      return errors; // Skip if no ID found
    }

    // Check if this ID already exists in other rows in the data array
    const existingIds = new Set<string>();

    // Collect all IDs from the rows array (excluding the current row being validated)
    this.rows.forEach((row, index) => {
      if (index !== data.rowIndex) {
        // Skip the current row
        const existingId = row[idField];
        if (existingId) {
          existingIds.add(existingId);
          console.log(`Found existing ID: ${existingId} in row ${index}`);
        }
      }
    });

    console.log(`Existing IDs:`, Array.from(existingIds));
    console.log(
      `Current ID ${currentId} is duplicate:`,
      existingIds.has(currentId)
    );

    // Check if current ID is a duplicate
    if (existingIds.has(currentId)) {
      errors.push({
        type: "DuplicateIDs",
        entity: this.fileType,
        error: `Duplicate ${idField} '${currentId}' found`,
        affectedRows: [data?.rowIndex as number],
        affectedFields: [idField],
      });
      console.log(`Added duplicate error for ${currentId}`);
    }

    return errors;
  }

  private validateMalformedLists(
    data: IRowNode<any>,
    type: TFileType
  ): TValidationErrorProps[] {
    const errors: TValidationErrorProps[] = [];

    if (type === "worker") {
      // data.forEach((row, index) => {
      try {
        const slots = JSON.parse(data.data.AvailableSlots);
        if (
          !Array.isArray(slots) ||
          !slots.every((s) => typeof s === "number")
        ) {
          errors.push({
            type: "MalformedList",
            entity: type,
            error: `AvailableSlots must be a valid array of numbers`,
            affectedRows: [data.rowIndex as number],
            affectedFields: ["AvailableSlots"],
          });
        }
      } catch (error) {
        errors.push({
          type: "MalformedList",
          entity: type,
          error: `AvailableSlots must be valid JSON array`,
          affectedRows: [data.rowIndex as number],
          affectedFields: ["AvailableSlots"],
        });
      }
      // });
    }

    return errors;
  }

  private validateOutOfRangeValues(
    data: IRowNode<any>,
    type: TFileType
  ): TValidationErrorProps[] {
    const errors: TValidationErrorProps[] = [];

    if (type === "client") {
      // data.forEach((row, index) => {
      const priority = parseInt(data.data.PriorityLevel);
      if (isNaN(priority) || priority < 1 || priority > 5) {
        errors.push({
          type: "OutOfRangeValue",
          entity: type,
          error: `PriorityLevel must be between 1 and 5`,
          affectedRows: [data.rowIndex as number],
          affectedFields: ["PriorityLevel"],
        });
      }
      // });
    }

    if (type === "tasks") {
      // data.forEach((row, index) => {
      const duration = parseInt(data.data.Duration);
      if (isNaN(duration) || duration < 1) {
        errors.push({
          type: "OutOfRangeValue",
          entity: type,
          error: `Duration must be at least 1`,
          affectedRows: [data.rowIndex as number],
          affectedFields: ["Duration"],
        });
      }
      // });
    }

    return errors;
  }

  private validateBrokenJSON(
    row: IRowNode<any>,
    type: TFileType
  ): TValidationErrorProps[] {
    const errors: TValidationErrorProps[] = [];

    if (type === "client") {
      // data.forEach((row, index) => {
      try {
        if (typeof row?.data.AttributesJSON === "string") {
          JSON.parse(row?.data.AttributesJSON);
        }
      } catch {
        errors.push({
          type: "InvalidJSON",
          entity: type,
          error: `AttributesJSON must be valid JSON`,
          affectedRows: [row?.rowIndex as number],
          affectedFields: ["AttributesJSON"],
        });
      }
      // });
    }

    return errors;
  }

  private validateWithZod(row: IRowNode<any>): TValidationErrorProps[] {
    const errors: TValidationErrorProps[] = [];

    console.log(`Validating row ${row.rowIndex} with data:`, row.data);
    const results = this.schema.safeParse(row.data);
    console.log(`Zod validation results for row ${row.rowIndex}:`, results);

    if (!results.success) {
      console.log(
        `Zod validation failed for row ${row.rowIndex}:`,
        results.error.errors
      );
      errors.push({
        type: "ZodValidationError",
        entity: this.fileType,
        error: results?.error?.errors.map((err: any) => err.message).join(", "),
        affectedRows: [row?.rowIndex as number],
        affectedFields: results?.error?.errors.map((err: any) =>
          String(err.path[0])
        ),
      });
    }

    return errors;
  }

  private getRequiredColumns(type: TFileType): string[] {
    const requiredColumns = {
      client: [
        "ClientID",
        "ClientName",
        "PriorityLevel",
        "RequestedTaskIDs",
        "GroupTag",
        "AttributesJSON",
      ],
      worker: [
        "WorkerID",
        "WorkerName",
        "Skills",
        "AvailableSlots",
        "MaxLoadPerPhase",
        "WorkerGroup",
        "QualificationLevel",
      ],
      tasks: [
        "TaskID",
        "TaskName",
        "Category",
        "Duration",
        "RequiredSkills",
        "PreferredPhases",
        "MaxConcurrent",
      ],
    };
    return requiredColumns[type];
  }

  private getIdField(type: TFileType): string {
    const idFields = {
      client: "ClientID",
      worker: "WorkerID",
      tasks: "TaskID",
    };
    return idFields[type];
  }

  private validateUnknownReferences(
    node: IRowNode<any>
  ): TValidationErrorProps[] {
    const errors: TValidationErrorProps[] = [];

    if (this.context.tasks.length === 0 || this.context.client.length === 0) {
      return errors;
    }

    const taskIds = new Set(this.context.tasks.map((t) => t.TaskID));
    console.log({ taskIds });

    // this.context.client.forEach((client, index) => {
    //   const requestedTasks =
    //     client.RequestedTaskIDs?.split(",").map((t: string) => t.trim()) || [];

    const requestedTasks = this.context?.client?.map((client, index) => {
      return (
        client.RequestedTaskIDs?.split(",").map((t: string) => t.trim()) || []
      );
    });
    console.log({ requestedTasks, flat: requestedTasks.flat() });
    const unknownTasks = requestedTasks
      .flat()
      .filter((taskId: string) => !taskIds.has(taskId));
    console.log({ unknownTasks });

    if (unknownTasks.length > 0) {
      errors.push({
        type: "UnknownTaskReference",
        entity: "client",
        error: `Unknown task IDs: ${unknownTasks.join(", ")}`,
        affectedRows: [node?.rowIndex as number],
        affectedFields: ["RequestedTaskIDs"],
      });
    }

    return errors;
  }

  private validateSkillCoverage(): TValidationErrorProps[] {
    const errors: TValidationErrorProps[] = [];
    const workerSkills = new Set<string>();

    if (this.context.worker.length === 0) {
      return errors;
    }

    this.context.worker.forEach((worker) => {
      const skills =
        worker.Skills?.split(",").map((s: string) => s.trim()) || [];
      skills.forEach((skill: string) => workerSkills.add(skill));
    });

    this.context.tasks.forEach((task, index) => {
      const requiredSkills =
        task.RequiredSkills?.split(",").map((s: string) => s.trim()) || [];
      const missingSkills = requiredSkills.filter(
        (skill: string) => !workerSkills.has(skill)
      );

      if (missingSkills.length > 0) {
        errors.push({
          type: "SkillMismatch",
          entity: "tasks",
          error: `No workers available for skills: ${missingSkills.join(", ")}`,
          affectedRows: [index],
          affectedFields: ["RequiredSkills"],
        });
      }
    });

    return errors;
  }

  private validateOverloadedWorkers(): TValidationErrorProps[] {
    const errors: TValidationErrorProps[] = [];

    this.context.worker.forEach((worker, index) => {
      try {
        const availableSlots = JSON.parse(worker.AvailableSlots);
        const maxLoad = parseInt(worker.MaxLoadPerPhase);

        if (availableSlots.length < maxLoad) {
          errors.push({
            type: "OverloadedWorker",
            entity: "worker",
            error: `Worker has ${availableSlots.length} available slots but max load is ${maxLoad}`,
            affectedRows: [index],
            affectedFields: ["AvailableSlots", "MaxLoadPerPhase"],
          });
        }
      } catch {
        // Already handled by malformed list validation
      }
    });

    return errors;
  }

  private validatePhaseSlotSaturation(): TValidationErrorProps[] {
    const errors: TValidationErrorProps[] = [];

    // Group tasks by phase and calculate total duration
    const phaseLoad: Record<number, number> = {};

    this.context.tasks.forEach((task) => {
      try {
        const preferredPhases = JSON.parse(task.PreferredPhases);
        const duration = parseInt(task.Duration);

        preferredPhases.forEach((phase: number) => {
          phaseLoad[phase] = (phaseLoad[phase] || 0) + duration;
        });
      } catch {
        // Already handled by other validations
      }
    });

    // Calculate total available slots per phase
    const phaseSlots: Record<number, number> = {};
    this.context.worker.forEach((worker) => {
      try {
        const availableSlots = JSON.parse(worker.AvailableSlots);
        const maxLoad = parseInt(worker.MaxLoadPerPhase);

        availableSlots.forEach((phase: number) => {
          phaseSlots[phase] = (phaseSlots[phase] || 0) + maxLoad;
        });
      } catch {
        // Already handled by other validations
      }
    });

    // Check for saturation
    Object.entries(phaseLoad).forEach(([phase, load]) => {
      const available = phaseSlots[parseInt(phase)] || 0;
      if (load > available) {
        errors.push({
          type: "PhaseSlotSaturation",
          entity: "tasks",
          error: `Phase ${phase} is overloaded: ${load} units needed, ${available} available`,
          details: { phase: parseInt(phase), load, available },
        });
      }
    });

    return errors;
  }

  private validateMaxConcurrency(): TValidationErrorProps[] {
    const errors: TValidationErrorProps[] = [];

    this.context.tasks.forEach((task, index) => {
      const maxConcurrent = parseInt(task.MaxConcurrent);
      const requiredSkills =
        task.RequiredSkills?.split(",").map((s: string) => s.trim()) || [];

      // Count qualified workers
      let qualifiedWorkers = 0;
      this.context.worker.forEach((worker) => {
        const workerSkills =
          worker.Skills?.split(",").map((s: string) => s.trim()) || [];
        const hasRequiredSkills = requiredSkills.every((skill: string) =>
          workerSkills.includes(skill)
        );
        if (hasRequiredSkills) qualifiedWorkers++;
      });

      if (maxConcurrent > qualifiedWorkers) {
        errors.push({
          type: "MaxConcurrencyExceeded",
          entity: "tasks",
          error: `MaxConcurrent (${maxConcurrent}) exceeds qualified workers (${qualifiedWorkers})`,
          affectedRows: [index],
          affectedFields: ["MaxConcurrent"],
        });
      }
    });

    return errors;
  }
}
