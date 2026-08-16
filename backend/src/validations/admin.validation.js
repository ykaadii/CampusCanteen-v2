import { z } from "zod";

export const updateUserRoleSchema = z.object({
  role: z.enum(["STUDENT", "CANTEEN_STAFF", "ADMIN"]),
  campusId: z.string().nullable().optional(),
  canteenId: z.string().nullable().optional(),
});
