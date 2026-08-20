import { AppError } from "./AppError.js";

export class ConflictError extends AppError {
  constructor(message = "conflict with existing resource") {
    super(409, "CONFLICT", message);
  }
}
