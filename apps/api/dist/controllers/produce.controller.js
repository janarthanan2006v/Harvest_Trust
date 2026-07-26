"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProduceTypes = getProduceTypes;
exports.getCollectionPoints = getCollectionPoints;
exports.getCurrentRate = getCurrentRate;
const prisma_js_1 = require("../lib/prisma.js");
async function getProduceTypes(req, res, next) {
    try {
        const produceTypes = await prisma_js_1.prisma.produceType.findMany({
            where: { isActive: true },
            orderBy: { name: 'asc' },
        });
        return res.json({
            success: true,
            data: produceTypes,
            requestId: req.requestId,
        });
    }
    catch (error) {
        next(error);
    }
}
async function getCollectionPoints(req, res, next) {
    try {
        const points = await prisma_js_1.prisma.collectionPoint.findMany({
            where: { isActive: true },
            orderBy: { name: 'asc' },
        });
        return res.json({
            success: true,
            data: points,
            requestId: req.requestId,
        });
    }
    catch (error) {
        next(error);
    }
}
async function getCurrentRate(req, res, next) {
    try {
        const { produceTypeId, collectionPointId } = req.query;
        if (!produceTypeId) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'BAD_REQUEST',
                    message: 'produceTypeId query parameter is required.',
                },
                requestId: req.requestId,
            });
        }
        // Find rate history row that is currently active (effectiveFrom <= now and (effectiveTo is null or effectiveTo >= now))
        const now = new Date();
        const rate = await prisma_js_1.prisma.rateHistory.findFirst({
            where: {
                produceTypeId: produceTypeId,
                AND: [
                    {
                        OR: [
                            { collectionPointId: null },
                            { collectionPointId: collectionPointId },
                        ],
                    },
                    {
                        OR: [
                            { effectiveTo: null },
                            { effectiveTo: { gte: now } },
                        ],
                    },
                ],
                effectiveFrom: { lte: now },
            },
            orderBy: [
                // Prefer specific collection point rates over global ones
                { collectionPointId: 'desc' },
                { effectiveFrom: 'desc' },
            ],
        });
        return res.json({
            success: true,
            data: rate || null,
            requestId: req.requestId,
        });
    }
    catch (error) {
        next(error);
    }
}
