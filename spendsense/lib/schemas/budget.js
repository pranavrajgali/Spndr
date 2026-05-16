import { z } from "zod";
import { EXPENSE_CATEGORIES } from "@/lib/categories";

export const budgetCreateSchema = z.object({
  category: z.string().refine((c) => EXPENSE_CATEGORIES.includes(c), {
    message: "Invalid expense category",
  }),
  limit_amount: z.coerce.number().positive().max(999_999_999),
  month: z.coerce.number().int().min(1).max(12),
  year: z.coerce.number().int().min(2020).max(2100),
  alert_at_percent: z.coerce.number().int().min(1).max(100).optional().default(80),
});

export const budgetPatchSchema = z.object({
  id: z.string().uuid(),
  limit_amount: z.coerce.number().positive().max(999_999_999).optional(),
  alert_at_percent: z.coerce.number().int().min(1).max(100).optional(),
});
