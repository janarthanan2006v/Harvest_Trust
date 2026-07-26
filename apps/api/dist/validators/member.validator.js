"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateMemberSchema = exports.createMemberSchema = void 0;
const zod_1 = require("zod");
exports.createMemberSchema = zod_1.z.object({
    memberCode: zod_1.z
        .string()
        .min(3, { message: 'Member code must be at least 3 characters.' })
        .max(20)
        .trim()
        .transform((val) => val.toUpperCase()),
    fullName: zod_1.z.string().min(3, { message: 'Full name must be at least 3 characters.' }).trim(),
    phone: zod_1.z
        .string()
        .regex(/^[6-9]\d{9}$/, { message: 'Phone must be a valid 10-digit Indian mobile number.' })
        .optional()
        .or(zod_1.z.literal('')),
    village: zod_1.z.string().min(2, { message: 'Village name must be at least 2 characters.' }).optional().or(zod_1.z.literal('')),
});
exports.updateMemberSchema = exports.createMemberSchema.partial();
