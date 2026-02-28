export class ServiceError extends Error {
  public status: number;
  public code: string;

  constructor(code: string, status = 400, message?: string) {
    super(message ?? code);
    this.code = code;
    this.status = status;
  }
}
