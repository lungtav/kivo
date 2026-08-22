import dotenv from "dotenv";

dotenv.config();
const port = Number(process.env.PORT) ?? 5000;

if (isNaN(port)) {
  throw new Error(`Invalid PORT value: ${port}`);
}

const validateURL = (key: string) => {
  const value = process.env[key];

  if (!value) {
    throw new Error(`Missing value in ${key}`);
  }

  return value;
};

export const env = {
  port,
  databaseUrl: validateURL("DATABASE_URL"),
  databaseUrlDirect: validateURL("DATABASE_URL_DIRECT"),
  NODE_ENV: process.env.NODE_ENV ?? "development",
  isProduction: (process.env.NODE_ENV ?? "development") === "production",
  logLevel:
    (process.env.NODE_ENV ?? "development") === "development"
      ? "debug"
      : "info",
  JWT_SECRET_KEY: validateURL("JWT_SECRET_KEY"),
  redisUrl: validateURL("REDIS_URL"),
  resendKey: validateURL("RESEND_KEY"),
  APP_URL: validateURL("APP_URL")
};
