import { z } from "zod";

export const signupSchema = z.object({
  name: z.string().min(2, "Name is too short"),
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  country: z.string().optional(),
  city: z.string().optional(),
  role: z.string().min(2, "Role is required"),
});
