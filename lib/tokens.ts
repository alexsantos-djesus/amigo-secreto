// lib/tokens.ts
import { randomUUID } from "crypto";
import CryptoJS from "crypto-js";

export function generateToken(prefix = ""): string {
  const uuid = randomUUID();
  const hash = CryptoJS.SHA256(uuid).toString(CryptoJS.enc.Hex);
  return prefix + hash.slice(0, 32);
}

export function shortToken(): string {
  return randomUUID().split("-")[0];
}
