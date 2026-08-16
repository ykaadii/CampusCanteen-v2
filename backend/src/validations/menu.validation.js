import { z } from "zod";

export const menuItemSchema = z.object({
  canteenId: z.string().min(1, "Canteen ID is required"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  description: z.string().optional(),
  price: z.coerce.number().positive("Price must be greater than 0"),
  isAvailable: z.coerce.boolean().optional().default(true),
});
