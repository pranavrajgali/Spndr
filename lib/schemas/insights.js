import { z } from "zod";

export const InsightsRequestSchema = z.object({
  month: z.number().int().min(1).max(12).optional(),
  year: z.number().int().min(2020).max(2100).optional(),
  regenerate: z.boolean().optional().default(false),
});

export const InsightsResponseSchema = z.object({
  summary_text: z.string().default("No insights available for this period."),
  month: z.number(),
  year: z.number(),
});
