import { TFileType, TValidationErrorProps, CellErrorMap } from "@/lib/types";

export class ValidationErrorManager {
  private errorStore: Record<TFileType, TValidationErrorProps[]>;
  constructor() {
    this.errorStore = {
      client: [],
      tasks: [],
      worker: [],
    };
  }

  public addErrors(fileType: TFileType, newErrors: TValidationErrorProps[]) {
    console.log({ newErrors, fileType });
    this.errorStore[fileType] = [...this.errorStore[fileType], ...newErrors];
  }

  public setErrors(fileType: TFileType, errors: TValidationErrorProps[]) {
    this.errorStore[fileType] = errors;
  }

  public clearRowErrors(fileType: TFileType, rowIndex: number) {
    this.errorStore[fileType] = this.errorStore[fileType].filter(
      (err) => !err.affectedRows?.includes(rowIndex)
    );
  }

  public clearFieldError(fileType: TFileType, rowIndex: number, field: string) {
    this.errorStore[fileType] = this.errorStore[fileType].filter(
      (err) =>
        !(
          err.affectedRows?.includes(rowIndex) &&
          err.affectedFields?.includes(field)
        )
    );
  }

  public getErrors(fileType: TFileType): TValidationErrorProps[] {
    return this.errorStore[fileType];
  }
  public getErrorsForRow(fileType: TFileType, rowIndex: number) {
    return this.errorStore[fileType]?.filter((e) =>
      e.affectedRows?.includes(rowIndex)
    );
  }

  public getCellErrorMap(fileType: TFileType): CellErrorMap {
    const errors = this.errorStore[fileType];
    const map: CellErrorMap = {};

    errors.forEach((err) => {
      if (!err.affectedRows || !err.affectedFields) return;

      err.affectedFields.forEach((field) => {
        if (!map[field]) map[field] = {};
        err.affectedRows!.forEach((row) => {
          if (!map[field][row]) map[field][row] = [];
          map[field][row].push(err.error);
        });
      });
    });

    return map;
  }

  public resetAll() {
    this.errorStore = {
      client: [],
      tasks: [],
      worker: [],
    };
  }
}
