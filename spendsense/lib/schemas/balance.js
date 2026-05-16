import { z } from "zod";

export const balanceSetSchema = z.object({
  balance: z.coerce.number().min(0).max(999_999_999),
  note: z.string().max(500).optional(),
});
