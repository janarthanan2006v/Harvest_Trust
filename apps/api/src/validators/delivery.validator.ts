import { z } from 'zod';

export const createDeliverySchema = z.object({
  memberId: z.string().uuid({ message: 'Invalid member ID.' }),
  produceTypeId: z.string().uuid({ message: 'Invalid produce type ID.' }),
  collectionPointId: z.string().uuid({ message: 'Invalid collection point ID.' }),
  collectedAt: z
    .string()
    .optional()
    .transform((val) => (val ? new Date(val) : new Date()))
    .refine((date) => date.getTime() <= Date.now() + 5 * 60 * 1000, {
      message: 'Collection date cannot be in the future.',
    }),
  quantity: z
    .number()
    .gt(0, { message: 'Quantity must be greater than zero.' })
    .max(100000, { message: 'Quantity exceeds maximum allowable limit.' }),
  ratePerUnit: z
    .number()
    .gt(0, { message: 'Rate must be greater than zero.' })
    .max(100000, { message: 'Rate exceeds maximum allowable limit.' }),
  qualityGrade: z.string().trim().max(10).optional().or(z.literal('')),
  moisturePercent: z
    .number()
    .min(0, { message: 'Moisture percentage cannot be negative.' })
    .max(100, { message: 'Moisture percentage cannot exceed 100%.' })
    .optional()
    .nullable(),
  notes: z.string().max(500, { message: 'Notes must not exceed 500 characters.' }).optional().or(z.literal('')),
});

export const updateDeliverySchema = z.object({
  notes: z.string().max(500).optional(),
  qualityGrade: z.string().max(10).optional(),
  moisturePercent: z.number().min(0).max(100).optional().nullable(),
});
