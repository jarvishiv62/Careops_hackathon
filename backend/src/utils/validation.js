// backend/src/utils/validation.js
import { z } from "zod";

// Auth validation schemas
export const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  businessName: z.string().min(2, "Business name is required"),
  contactEmail: z.string().email("Invalid contact email"),
  address: z.string().optional(),
  timezone: z.string().default("UTC"),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

// User validation schemas
export const inviteUserSchema = z.object({
  email: z.string().email("Invalid email address"),
  name: z.string().min(2, "Name is required"),
  role: z.enum(["STAFF", "OWNER"]).default("STAFF"),
});

export const acceptInviteSchema = z.object({
  token: z.string(),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

// Workspace validation schemas
export const createWorkspaceSchema = z.object({
  name: z.string().min(2, "Business name is required"),
  address: z.string().optional(),
  timezone: z.string().default("UTC"),
  contactEmail: z.string().email("Invalid email address"),
});

export const updateWorkspaceSchema = z.object({
  name: z.string().min(2).optional(),
  address: z.string().optional(),
  timezone: z.string().optional(),
  contactEmail: z.string().email().optional(),
});

// Booking Type validation schemas
export const createBookingTypeSchema = z.object({
  name: z.string().min(2, "Service name is required"),
  description: z.string().optional(),
  duration: z.number().min(15, "Duration must be at least 15 minutes"),
  location: z.string().optional(),
});

export const createAvailabilityRuleSchema = z.object({
  dayOfWeek: z.number().min(0).max(6),
  startTime: z
    .string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:MM)"),
  endTime: z
    .string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:MM)"),
});

// Integration validation schemas
export const createIntegrationSchema = z.object({
  type: z.enum(["EMAIL", "SMS", "CALENDAR", "WEBHOOK"]),
  provider: z.string().min(1, "Provider is required"),
  config: z.object({
    apiKey: z.string().optional(),
    fromEmail: z.string().email().optional(),
    fromPhone: z.string().optional(),
  }),
});

// Helper to validate request body
export const validate = (schema) => {
  return (req, res, next) => {
    try {
      req.validatedData = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: "Validation failed",
          details: error.errors.map((e) => ({
            field: e.path.join("."),
            message: e.message,
          })),
        });
      }
      next(error);
    }
  };
};
