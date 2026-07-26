import { z } from 'zod';

export const createMemberSchema = z.object({
  memberCode: z
    .string()
    .min(3, { message: 'Member code must be at least 3 characters.' })
    .max(20)
    .trim()
    .transform((val) => val.toUpperCase()),
  fullName: z.string().min(3, { message: 'Full name must be at least 3 characters.' }).trim(),
  phone: z
    .string()
    .regex(/^[6-9]\d{9}$/, { message: 'Phone must be a valid 10-digit Indian mobile number.' })
    .optional()
    .or(z.literal('')),
  village: z.string().min(2, { message: 'Village name must be at least 2 characters.' }).optional().or(z.literal('')),
});

export const updateMemberSchema = createMemberSchema.partial();
