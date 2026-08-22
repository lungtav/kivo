import bcrypt from "bcrypt";

const SALT_ROUNDS = 10;
export const hash = async (data: string): Promise<string> => {
  return bcrypt.hash(data, SALT_ROUNDS);
};
