import { z } from "zod";

export const createOrderSchema = z.object({
  canteenId: z.string().min(1, "Canteen is required"),
  paymentMethod: z.enum(["CASH", "RAZORPAY"]).default("CASH"),
  orderType: z.enum(["DINE_IN", "TAKEAWAY"]).default("DINE_IN"),
  pickupDelayMinutes: z.number().min(0).max(60).optional().default(0),
  items: z
    .array(
      z.object({
        menuItemId: z.string().min(1, "Menu item ID is required"),
        quantity: z.number().int().positive("Quantity must be at least 1"),
      })
    )
    .min(1, "Order must contain at least one item"),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum([
    "PENDING",
    "ACCEPTED",
    "PREPARING",
    "READY",
    "DELIVERED",
    "CANCELLED",
  ]),
});
