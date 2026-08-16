import { z } from "zod";

export const campusSchema = z.object({
  name: z.string().min(2, "Campus name must be at least 2 characters"),
  city: z.string().min(2, "City must be at least 2 characters"),
});
