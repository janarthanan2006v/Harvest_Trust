"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAttentionCases = getAttentionCases;
const prisma_js_1 = require("../lib/prisma.js");
async function getAttentionCases(req, res, next) {
    try {
        const cases = await prisma_js_1.prisma.delivery.findMany({
            where: {
                attentionStatus: { in: ['OPEN', 'FOLLOW_UP'] }
            },
            orderBy: [
                { attentionStatus: 'asc' }, // OPEN first, then FOLLOW_UP
                { collectedAt: 'desc' }
            ],
            include: {
                member: { select: { fullName: true, memberCode: true, village: true } },
                produceType: { select: { name: true, code: true } },
                collectionPoint: { select: { name: true } },
                prediction: true
            }
        });
        return res.json({
            success: true,
            data: cases,
            requestId: req.requestId
        });
    }
    catch (error) {
        next(error);
    }
}
