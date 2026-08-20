import { AppError } from "./AppError.js";

export class NotFoundError extends AppError {
  constructor(message = "resource not found") {
    super(404, "NOT_FOUND", message);
  }
}
