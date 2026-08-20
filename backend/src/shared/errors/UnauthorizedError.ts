import { AppError } from "./AppError.js";

export class UnauthoriedError extends AppError {
  constructor(message = "unauthorized") {
    super(401, "UNAUTHORIZED", message);
  }
}
