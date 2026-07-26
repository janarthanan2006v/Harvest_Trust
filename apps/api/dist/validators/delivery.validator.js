"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateDeliverySchema = exports.createDeliverySchema = void 0;
const zod_1 = require("zod");
exports.createDeliverySchema = zod_1.z.object({
    memberId: zod_1.z.string().uuid({ message: 'Invalid member ID.' }),
    produceTypeId: zod_1.z.string().uuid({ message: 'Invalid produce type ID.' }),
    collectionPointId: zod_1.z.string().uuid({ message: 'Invalid collection point ID.' }),
    collectedAt: zod_1.z
        .string()
        .optional()
        .transform((val) => (val ? new Date(val) : new Date()))
        .refine((date) => date.getTime() <= Date.now() + 5 * 60 * 1000, {
        message: 'Collection date cannot be in the future.',
    }),
    quantity: zod_1.z
        .number()
        .gt(0, { message: 'Quantity must be greater than zero.' })
        .max(100000, { message: 'Quantity exceeds maximum allowable limit.' }),
    ratePerUnit: zod_1.z
        .number()
        .gt(0, { message: 'Rate must be greater than zero.' })
        .max(100000, { message: 'Rate exceeds maximum allowable limit.' }),
    qualityGrade: zod_1.z.string().trim().max(10).optional().or(zod_1.z.literal('')),
    moisturePercent: zod_1.z
        .number()
        .min(0, { message: 'Moisture percentage cannot be negative.' })
        .max(100, { message: 'Moisture percentage cannot exceed 100%.' })
        .optional()
        .nullable(),
    notes: zod_1.z.string().max(500, { message: 'Notes must not exceed 500 characters.' }).optional().or(zod_1.z.literal('')),
});
exports.updateDeliverySchema = zod_1.z.object({
    notes: zod_1.z.string().max(500).optional(),
    qualityGrade: zod_1.z.string().max(10).optional(),
    moisturePercent: zod_1.z.number().min(0).max(100).optional().nullable(),
});
