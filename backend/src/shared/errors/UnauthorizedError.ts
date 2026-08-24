import { AppError } from "./AppError.js";

export class UnauthorizedError extends AppError {
  constructor(message = "unauthorized") {
    super(401, "UNAUTHORIZED", message);
  }
}
