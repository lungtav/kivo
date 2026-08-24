import bcrypt from "bcrypt";

const SALT_ROUNDS = 10;
export const hash = async (data: string): Promise<string> => {
  return bcrypt.hash(data, SALT_ROUNDS);
};

export const compare = async (
  password: string,
  passwordHash: string,
): Promise<boolean> => {
  return bcrypt.compare(password, passwordHash);
};
