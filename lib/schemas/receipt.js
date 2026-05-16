import { z } from "zod";

export const ReceiptRequestSchema = z.object({
  imageUrl: z.string(), // Allow base64 data URLs
});

export const ReceiptResponseSchema = z.object({
  merchant: z.string().optional().default("Unknown Merchant"),
  amount: z.number().optional().default(0),
  date: z.string().optional().default(() => new Date().toISOString().split('T')[0]),
  category: z.string().optional().default("Other"),
});
