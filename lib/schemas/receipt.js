import { z } from "zod";

export const ReceiptRequestSchema = z.object({
  imageUrl: z.string().url("Invalid image URL"),
});

export const ReceiptResponseSchema = z.object({
  merchant: z.string().nullable().default("Unknown Merchant"),
  amount: z.number().nullable().default(0),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().default(() => new Date().toISOString().split('T')[0]),
});
