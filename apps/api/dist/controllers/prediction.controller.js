"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkLivePrediction = checkLivePrediction;
const prisma_js_1 = require("../lib/prisma.js");
const delivery_validator_js_1 = require("../validators/delivery.validator.js");
const decimal_js_1 = require("../utils/decimal.js");
const ml_client_js_1 = require("../utils/ml-client.js");
async function checkLivePrediction(req, res, next) {
    try {
        // We use the same delivery schema for validation
        const data = delivery_validator_js_1.createDeliverySchema.parse(req.body);
        const member = await prisma_js_1.prisma.member.findUnique({ where: { id: data.memberId } });
        if (!member) {
            return res.status(400).json({
                success: false,
                error: { code: 'INVALID_MEMBER', message: 'Member not found.' },
                requestId: req.requestId
            });
        }
        const produceType = await prisma_js_1.prisma.produceType.findUnique({ where: { id: data.produceTypeId } });
        if (!produceType) {
            return res.status(400).json({
                success: false,
                error: { code: 'INVALID_PRODUCE_TYPE', message: 'Produce type not found.' },
                requestId: req.requestId
            });
        }
        const collectionPoint = await prisma_js_1.prisma.collectionPoint.findUnique({ where: { id: data.collectionPointId } });
        if (!collectionPoint) {
            return res.status(400).json({
                success: false,
                error: { code: 'INVALID_COLLECTION_POINT', message: 'Collection point not found.' },
                requestId: req.requestId
            });
        }
        // Calculate relative features
        const priorDeliveriesCount = await prisma_js_1.prisma.delivery.count({
            where: { memberId: data.memberId }
        });
        const priorAttentionCount = await prisma_js_1.prisma.delivery.count({
            where: {
                memberId: data.memberId,
                attentionStatus: { in: ['OPEN', 'FOLLOW_UP', 'RESOLVED'] }
            }
        });
        const qtyAgg = await prisma_js_1.prisma.delivery.aggregate({
            where: { memberId: data.memberId, produceTypeId: data.produceTypeId },
            _avg: { quantity: true }
        });
        const avgQuantity = qtyAgg._avg.quantity || data.quantity;
        const qtyDiffFromAvg = (0, decimal_js_1.preciseRound)(data.quantity - avgQuantity);
        const priorDeliveries = await prisma_js_1.prisma.delivery.findMany({
            where: { produceTypeId: data.produceTypeId },
            select: { ratePerUnit: true }
        });
        let medianRate = data.ratePerUnit;
        if (priorDeliveries.length > 0) {
            const rates = priorDeliveries.map((d) => d.ratePerUnit).sort((a, b) => a - b);
            const mid = Math.floor(rates.length / 2);
            medianRate = rates.length % 2 !== 0 ? rates[mid] : (rates[mid - 1] + rates[mid]) / 2;
        }
        const rateDiffFromMedian = (0, decimal_js_1.preciseRound)(data.ratePerUnit - medianRate);
        const grossAmount = (0, decimal_js_1.preciseRound)(data.quantity * data.ratePerUnit);
        const mlFeatures = {
            produceCode: produceType.code,
            collectionPointCode: collectionPoint.code,
            quantity: data.quantity,
            ratePerUnit: data.ratePerUnit,
            grossAmount,
            qualityGrade: data.qualityGrade || null,
            moisturePercent: data.moisturePercent || null,
            hourOfDay: data.collectedAt.getHours(),
            dayOfWeek: data.collectedAt.getDay(),
            qtyDiffFromAvg,
            rateDiffFromMedian,
            priorAttentionCount,
            priorDeliveriesCount,
            hasNotes: data.notes && data.notes.trim().length > 0 ? 1 : 0
        };
        const prediction = await (0, ml_client_js_1.getMLPrediction)(mlFeatures);
        return res.json({
            success: true,
            data: prediction,
            requestId: req.requestId
        });
    }
    catch (error) {
        next(error);
    }
}
