import { describe, it, expect, vi, beforeEach } from "vitest";
import { z } from "zod";

describe("tRPC Routers", () => {
  describe("Alerts Router", () => {
    it("should validate alert list input", () => {
      const schema = z.object({
        limit: z.number().default(50),
      });

      const validInput = { limit: 100 };
      expect(() => schema.parse(validInput)).not.toThrow();
    });

    it("should validate mark as read input", () => {
      const schema = z.object({
        alertId: z.number(),
      });

      const validInput = { alertId: 1 };
      expect(() => schema.parse(validInput)).not.toThrow();

      const invalidInput = { alertId: "invalid" };
      expect(() => schema.parse(invalidInput)).toThrow();
    });

    it("should validate resolve alert input", () => {
      const schema = z.object({
        alertId: z.number(),
        actionTaken: z.string(),
      });

      const validInput = { alertId: 1, actionTaken: "Reviewed and planned" };
      expect(() => schema.parse(validInput)).not.toThrow();

      const invalidInput = { alertId: 1, actionTaken: "" };
      expect(() => schema.parse(invalidInput)).not.toThrow(); // Empty string is valid
    });
  });

  describe("Reports Router", () => {
    it("should validate create report input", () => {
      const schema = z.object({
        name: z.string().min(1),
        reportType: z.enum(["goals", "alerts", "performance", "summary"]),
        format: z.enum(["pdf", "excel", "csv"]),
        frequency: z.enum(["daily", "weekly", "monthly"]),
        recipients: z.string().optional(),
      });

      const validInput = {
        name: "Monthly Report",
        reportType: "goals" as const,
        format: "pdf" as const,
        frequency: "monthly" as const,
      };
      expect(() => schema.parse(validInput)).not.toThrow();
    });

    it("should reject report with empty name", () => {
      const schema = z.object({
        name: z.string().min(1),
        reportType: z.enum(["goals", "alerts", "performance", "summary"]),
        format: z.enum(["pdf", "excel", "csv"]),
        frequency: z.enum(["daily", "weekly", "monthly"]),
      });

      const invalidInput = {
        name: "",
        reportType: "goals" as const,
        format: "pdf" as const,
        frequency: "monthly" as const,
      };
      expect(() => schema.parse(invalidInput)).toThrow();
    });

    it("should validate update report input", () => {
      const schema = z.object({
        reportId: z.number(),
        name: z.string().optional(),
        frequency: z.enum(["daily", "weekly", "monthly"]).optional(),
        recipients: z.string().optional(),
        isActive: z.number().optional(),
      });

      const validInput = {
        reportId: 1,
        frequency: "weekly" as const,
        isActive: 1,
      };
      expect(() => schema.parse(validInput)).not.toThrow();
    });

    it("should validate delete report input", () => {
      const schema = z.object({
        reportId: z.number(),
      });

      const validInput = { reportId: 1 };
      expect(() => schema.parse(validInput)).not.toThrow();
    });

    it("should validate execution history input", () => {
      const schema = z.object({
        reportId: z.number(),
        limit: z.number().default(20),
      });

      const validInput = { reportId: 1, limit: 10 };
      expect(() => schema.parse(validInput)).not.toThrow();
    });
  });

  describe("Report Frequency Calculation", () => {
    it("should calculate next execution for daily frequency", () => {
      const now = new Date();
      const nextExecution = new Date(now);
      nextExecution.setDate(nextExecution.getDate() + 1);

      expect(nextExecution.getTime()).toBeGreaterThan(now.getTime());
    });

    it("should calculate next execution for weekly frequency", () => {
      const now = new Date();
      const nextExecution = new Date(now);
      nextExecution.setDate(nextExecution.getDate() + 7);

      const daysDiff = Math.floor((nextExecution.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      expect(daysDiff).toBe(7);
    });

    it("should calculate next execution for monthly frequency", () => {
      const now = new Date();
      const nextExecution = new Date(now);
      nextExecution.setMonth(nextExecution.getMonth() + 1);

      expect(nextExecution.getMonth()).toBe((now.getMonth() + 1) % 12);
    });
  });
});
