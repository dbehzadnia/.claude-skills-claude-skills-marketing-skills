import bcrypt from "bcrypt";
import { z } from "zod";

const ROUNDS = 12;

export const passwordSchema = z
  .string()
  .min(8, "رمز عبور باید حداقل ۸ کاراکتر باشد.")
  .max(128, "رمز عبور خیلی طولانی است.");

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, ROUNDS);
}

export function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}
