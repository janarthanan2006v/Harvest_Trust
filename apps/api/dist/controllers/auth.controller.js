"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = login;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_js_1 = require("../lib/prisma.js");
const auth_validator_js_1 = require("../validators/auth.validator.js");
const JWT_SECRET = process.env.JWT_SECRET || 'harvesttrust_secret_token_sih_2026';
async function login(req, res, next) {
    try {
        const { email, password } = auth_validator_js_1.loginSchema.parse(req.body);
        const user = await prisma_js_1.prisma.user.findUnique({
            where: { email },
        });
        if (!user || !user.isActive) {
            return res.status(401).json({
                success: false,
                error: {
                    code: 'UNAUTHORIZED',
                    message: 'Invalid credentials or inactive user.',
                },
                requestId: req.requestId,
            });
        }
        const isMatch = await bcryptjs_1.default.compare(password, user.passwordHash);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                error: {
                    code: 'UNAUTHORIZED',
                    message: 'Invalid credentials.',
                },
                requestId: req.requestId,
            });
        }
        const token = jsonwebtoken_1.default.sign({
            id: user.id,
            email: user.email,
            role: user.role,
            name: user.name,
        }, JWT_SECRET, { expiresIn: '1d' });
        // Save login audit log
        await prisma_js_1.prisma.auditLog.create({
            data: {
                userId: user.id,
                entityType: 'User',
                entityId: user.id,
                action: 'LOGIN',
            },
        });
        return res.json({
            success: true,
            data: {
                token,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                },
            },
            requestId: req.requestId,
        });
    }
    catch (error) {
        next(error);
    }
}
