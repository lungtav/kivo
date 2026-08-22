import { Resend } from "resend";
import { env } from "../../config/env.js";

export const resend = new Resend(env.resendKey);
