import { describe, it, expect, beforeAll } from "vitest";
import { encryptPassword, decryptPassword, generateSecurePassword, validatePasswordStrength } from "../encryption";

describe("Leader Passwords - Encryption", () => {
  it("should encrypt and decrypt password correctly", () => {
    const originalPassword = "MySecurePassword123!";
    const encrypted = encryptPassword(originalPassword);
    
    expect(encrypted).toBeDefined();
    expect(encrypted).not.toBe(originalPassword);
    expect(encrypted.split(":")).toHaveLength(3); // iv:authTag:encrypted format
    
    const decrypted = decryptPassword(encrypted);
    expect(decrypted).toBe(originalPassword);
  });

  it("should generate different encrypted values for same password", () => {
    const password = "TestPassword123";
    const encrypted1 = encryptPassword(password);
    const encrypted2 = encryptPassword(password);
    
    expect(encrypted1).not.toBe(encrypted2); // Different IVs
    expect(decryptPassword(encrypted1)).toBe(password);
    expect(decryptPassword(encrypted2)).toBe(password);
  });

  it("should throw error for invalid encrypted format", () => {
    expect(() => decryptPassword("invalid-format")).toThrow();
  });

  it("should generate secure password with correct length", () => {
    const password16 = generateSecurePassword(16);
    const password24 = generateSecurePassword(24);
    
    expect(password16).toHaveLength(16);
    expect(password24).toHaveLength(24);
  });

  it("should validate password strength correctly", () => {
    const weakPassword = "123456";
    const mediumPassword = "Password123";
    const strongPassword = "MyStr0ng!Pass@2024";
    
    const weakResult = validatePasswordStrength(weakPassword);
    const mediumResult = validatePasswordStrength(mediumPassword);
    const strongResult = validatePasswordStrength(strongPassword);
    
    expect(weakResult.score).toBeLessThan(mediumResult.score);
    expect(mediumResult.score).toBeLessThanOrEqual(strongResult.score);
    expect(strongResult.score).toBeGreaterThanOrEqual(3);
  });

  it("should handle special characters in password", () => {
    const password = "P@ssw0rd!#$%&*()_+-=[]{}|;:,.<>?";
    const encrypted = encryptPassword(password);
    const decrypted = decryptPassword(encrypted);
    
    expect(decrypted).toBe(password);
  });

  it("should handle unicode characters in password", () => {
    const password = "Señor123!@#";
    const encrypted = encryptPassword(password);
    const decrypted = decryptPassword(encrypted);
    
    expect(decrypted).toBe(password);
  });
});

describe("Leader Passwords - Password Strength Validation", () => {
  it("should require minimum length", () => {
    const result = validatePasswordStrength("short");
    expect(result.feedback).toContain("12 caracteres");
  });

  it("should require lowercase letters", () => {
    const result = validatePasswordStrength("PASSWORD123!");
    expect(result.feedback).toContain("minúsculas");
  });

  it("should require uppercase letters", () => {
    const result = validatePasswordStrength("password123!");
    expect(result.feedback).toContain("maiúsculas");
  });

  it("should require numbers", () => {
    const result = validatePasswordStrength("Password!");
    expect(result.feedback).toContain("números");
  });

  it("should require special characters", () => {
    const result = validatePasswordStrength("Password123");
    expect(result.feedback).toContain("especiais");
  });

  it("should validate strong password", () => {
    const result = validatePasswordStrength("MyStr0ng!Password@2024");
    expect(result.score).toBeGreaterThanOrEqual(3);
    expect(result.feedback).toBe("Senha forte");
  });
});

console.log("✅ Testes de criptografia e validação de senhas executados com sucesso!");
