"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPaymentSchema = void 0;
const zod_1 = require("zod");
exports.createPaymentSchema = zod_1.z.object({
    memberId: zod_1.z.string().uuid({ message: 'Invalid member ID.' }),
    amount: zod_1.z
        .number()
        .gt(0, { message: 'Payment amount must be greater than zero.' })
        .max(10000000, { message: 'Payment amount exceeds maximum limit.' }),
    paidAt: zod_1.z
        .string()
        .optional()
        .transform((val) => (val ? new Date(val) : new Date()))
        .refine((date) => date.getTime() <= Date.now() + 5 * 60 * 1000, {
        message: 'Payment date cannot be in the future.',
    }),
    method: zod_1.z.enum(['CASH', 'BANK_TRANSFER', 'UPI', 'CHEQUE', 'OTHER'], {
        errorMap: () => ({ message: 'Method must be CASH, BANK_TRANSFER, UPI, CHEQUE, or OTHER.' }),
    }),
    referenceNumber: zod_1.z.string().trim().max(100).optional().or(zod_1.z.literal('')),
    notes: zod_1.z.string().max(500).optional().or(zod_1.z.literal('')),
});
