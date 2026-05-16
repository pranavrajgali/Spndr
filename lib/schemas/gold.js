import { z } from "zod";

export const goldCreateSchema = z.object({
  type: z.enum(["buy", "sell"]),
  grams: z.coerce.number().positive().max(99999),
  price_per_gram: z.coerce.number().positive().max(999_999),
  total_paid: z.coerce.number().positive().max(999_999_999),
  date: z.string(),
  notes: z.string().max(1000).optional(),
});
