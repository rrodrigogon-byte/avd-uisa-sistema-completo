import crypto from "crypto";

/**
 * Módulo de criptografia para senhas de líderes
 * Usa AES-256-GCM para criptografia simétrica
 */

// Chave de criptografia derivada do JWT_SECRET
const ENCRYPTION_KEY = crypto
  .createHash("sha256")
  .update(process.env.JWT_SECRET || "default-secret-key")
  .digest();

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

/**
 * Criptografa uma senha
 * @param password Senha em texto plano
 * @returns Senha criptografada em formato base64 com IV e auth tag
 */
export function encryptPassword(password: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);

  let encrypted = cipher.update(password, "utf8", "base64");
  encrypted += cipher.final("base64");

  const authTag = cipher.getAuthTag();

  // Formato: iv:authTag:encrypted
  return `${iv.toString("base64")}:${authTag.toString("base64")}:${encrypted}`;
}

/**
 * Descriptografa uma senha
 * @param encryptedPassword Senha criptografada em formato base64
 * @returns Senha em texto plano
 */
export function decryptPassword(encryptedPassword: string): string {
  try {
    const parts = encryptedPassword.split(":");
    if (parts.length !== 3) {
      throw new Error("Formato de senha criptografada inválido");
    }

    const [ivBase64, authTagBase64, encrypted] = parts;
    const iv = Buffer.from(ivBase64, "base64");
    const authTag = Buffer.from(authTagBase64, "base64");

    const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, "base64", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch (error) {
    console.error("[Encryption] Failed to decrypt password:", error);
    throw new Error("Falha ao descriptografar senha");
  }
}

/**
 * Gera uma senha aleatória segura
 * @param length Comprimento da senha (padrão: 16)
 * @returns Senha aleatória
 */
export function generateSecurePassword(length: number = 16): string {
  const charset =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?";
  let password = "";

  const randomBytes = crypto.randomBytes(length);
  for (let i = 0; i < length; i++) {
    password += charset[randomBytes[i] % charset.length];
  }

  return password;
}

/**
 * Valida a força de uma senha
 * @param password Senha a ser validada
 * @returns Objeto com score (0-4) e feedback
 */
export function validatePasswordStrength(password: string): {
  score: number;
  feedback: string;
} {
  let score = 0;
  const feedback: string[] = [];

  // Comprimento
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  else feedback.push("Use pelo menos 12 caracteres");

  // Letras minúsculas
  if (/[a-z]/.test(password)) score++;
  else feedback.push("Adicione letras minúsculas");

  // Letras maiúsculas
  if (/[A-Z]/.test(password)) score++;
  else feedback.push("Adicione letras maiúsculas");

  // Números
  if (/[0-9]/.test(password)) score++;
  else feedback.push("Adicione números");

  // Caracteres especiais
  if (/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password)) score++;
  else feedback.push("Adicione caracteres especiais");

  // Normalizar score para 0-4
  const normalizedScore = Math.min(Math.floor(score / 1.5), 4);

  return {
    score: normalizedScore,
    feedback: feedback.join(", ") || "Senha forte",
  };
}
