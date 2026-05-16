import { z } from "zod";

export const csvParseSchema = z.object({
  fileUrl: z.string().min(1),
  filename: z.string().max(255).optional(),
  source: z.string().max(100).optional(),
  categorize: z.boolean().optional().default(false),
});

export const csvConfirmRowSchema = z.object({
  description: z.string().min(1),
  amount: z.coerce.number().positive(),
  date: z.string(),
  category: z.string().min(1),
  type: z.enum(["income", "expense"]).default("expense"),
  skip: z.boolean().optional(),
});

export const csvConfirmSchema = z.object({
  importId: z.string().uuid(),
  rows: z.array(csvConfirmRowSchema).min(1).max(500),
});
