import { z } from "zod";

export const canteenSchema = z.object({
  name: z.string().min(2, "Canteen name must be at least 2 characters"),
  campusId: z.string().min(1, "Campus is required"),
  isOpen: z.boolean().optional().default(true),
});

export const assignStaffSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
});
