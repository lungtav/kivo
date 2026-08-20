import { AppError } from "./AppError.js";

export class ForbiddenError extends AppError {
  constructor(message = "forbidden") {
    super(403, "FORBIDDEN", message);
  }
}
