import { z } from 'zod';

export const createPaymentSchema = z.object({
  memberId: z.string().uuid({ message: 'Invalid member ID.' }),
  amount: z
    .number()
    .gt(0, { message: 'Payment amount must be greater than zero.' })
    .max(10000000, { message: 'Payment amount exceeds maximum limit.' }),
  paidAt: z
    .string()
    .optional()
    .transform((val) => (val ? new Date(val) : new Date()))
    .refine((date) => date.getTime() <= Date.now() + 5 * 60 * 1000, {
      message: 'Payment date cannot be in the future.',
    }),
  method: z.enum(['CASH', 'BANK_TRANSFER', 'UPI', 'CHEQUE', 'OTHER'], {
    errorMap: () => ({ message: 'Method must be CASH, BANK_TRANSFER, UPI, CHEQUE, or OTHER.' }),
  }),
  referenceNumber: z.string().trim().max(100).optional().or(z.literal('')),
  notes: z.string().max(500).optional().or(z.literal('')),
});
