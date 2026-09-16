export class ArchiveRequestError extends Error {
  constructor(
    message: string,
    readonly status: number = 400,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = "ArchiveRequestError";
  }
}
