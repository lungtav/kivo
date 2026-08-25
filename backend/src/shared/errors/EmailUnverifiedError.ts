import { AppError } from "./AppError.js";

export class EmailUnverifiedError extends AppError {
  constructor() {
    super(403, "EMAIL_UNVERIFIED", "Please verify your email before logging in");
  }
}
