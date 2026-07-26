"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDashboardData = getDashboardData;
const prisma_js_1 = require("../lib/prisma.js");
const decimal_js_1 = require("../utils/decimal.js");
async function getDashboardData(req, res, next) {
    try {
        const now = new Date();
        // Start of today (local time boundary)
        const todayStart = new Date(now);
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date(now);
        todayEnd.setHours(23, 59, 59, 999);
        // 1. Today's collections aggregates
        const todayAgg = await prisma_js_1.prisma.delivery.aggregate({
            where: {
                collectedAt: {
                    gte: todayStart,
                    lte: todayEnd,
                },
            },
            _sum: {
                quantity: true,
                netAmount: true,
            },
        });
        const todayQuantity = (0, decimal_js_1.preciseRound)(todayAgg._sum.quantity || 0);
        const todayValue = (0, decimal_js_1.preciseRound)(todayAgg._sum.netAmount || 0);
        // 2. Pending Payment Amount (Sum of netAmount - Sum of payments)
        const deliveriesSum = await prisma_js_1.prisma.delivery.aggregate({
            _sum: { netAmount: true },
        });
        const paymentsSum = await prisma_js_1.prisma.payment.aggregate({
            _sum: { amount: true },
        });
        const totalDelivered = deliveriesSum._sum.netAmount || 0;
        const totalPaid = paymentsSum._sum.amount || 0;
        const pendingPaymentAmount = (0, decimal_js_1.preciseRound)(Math.max(0, totalDelivered - totalPaid));
        // 3. Attention counts and active members
        const recordsAttentionCount = await prisma_js_1.prisma.delivery.count({
            where: {
                attentionStatus: { in: ['OPEN', 'FOLLOW_UP'] },
            },
        });
        const activeMembersCount = await prisma_js_1.prisma.member.count({
            where: { isActive: true },
        });
        // 4. Seven-day Trend (Last 7 days)
        const trendDays = [];
        for (let i = 6; i >= 0; i--) {
            const dStart = new Date(now);
            dStart.setDate(now.getDate() - i);
            dStart.setHours(0, 0, 0, 0);
            const dEnd = new Date(dStart);
            dEnd.setHours(23, 59, 59, 999);
            const dayAgg = await prisma_js_1.prisma.delivery.aggregate({
                where: {
                    collectedAt: {
                        gte: dStart,
                        lte: dEnd,
                    },
                },
                _sum: {
                    quantity: true,
                    netAmount: true,
                },
            });
            // Format date like "24 Jul"
            const label = dStart.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
            trendDays.push({
                date: label,
                quantity: (0, decimal_js_1.preciseRound)(dayAgg._sum.quantity || 0),
                value: (0, decimal_js_1.preciseRound)(dayAgg._sum.netAmount || 0),
            });
        }
        // 5. Produce wise Distribution
        const produceStats = await prisma_js_1.prisma.produceType.findMany({
            include: {
                deliveries: {
                    select: {
                        quantity: true,
                        netAmount: true,
                    },
                },
            },
        });
        const produceDistribution = produceStats
            .map((p) => {
            const qty = p.deliveries.reduce((sum, d) => sum + d.quantity, 0);
            const val = p.deliveries.reduce((sum, d) => sum + d.netAmount, 0);
            return {
                name: p.name,
                code: p.code,
                quantity: (0, decimal_js_1.preciseRound)(qty),
                value: (0, decimal_js_1.preciseRound)(val),
            };
        })
            .filter((p) => p.quantity > 0);
        // 6. Recent deliveries
        const recentCollections = await prisma_js_1.prisma.delivery.findMany({
            take: 5,
            orderBy: { collectedAt: 'desc' },
            include: {
                member: { select: { fullName: true, memberCode: true } },
                produceType: { select: { name: true } },
                collectionPoint: { select: { name: true } },
            },
        });
        // 7. Attention queue (highest risk/newest unresolved cases)
        const attentionQueue = await prisma_js_1.prisma.delivery.findMany({
            where: {
                attentionStatus: { in: ['OPEN', 'FOLLOW_UP'] },
            },
            take: 5,
            orderBy: [
                { attentionStatus: 'asc' }, // OPEN first, then FOLLOW_UP
                { collectedAt: 'desc' },
            ],
            include: {
                member: { select: { fullName: true, memberCode: true } },
                produceType: { select: { name: true } },
                prediction: { select: { probability: true, explanationJson: true } },
            },
        });
        return res.json({
            success: true,
            data: {
                metrics: {
                    todayQuantity,
                    todayValue,
                    pendingPaymentAmount,
                    recordsAttentionCount,
                    activeMembersCount,
                },
                sevenDayTrend: trendDays,
                produceDistribution,
                recentCollections,
                attentionQueue: attentionQueue.map((item) => ({
                    id: item.id,
                    receiptNumber: item.receiptNumber,
                    collectedAt: item.collectedAt,
                    member: item.member,
                    produceType: item.produceType,
                    quantity: item.quantity,
                    unit: item.unit,
                    grossAmount: item.grossAmount,
                    attentionStatus: item.attentionStatus,
                    riskProbability: item.prediction?.probability || 0,
                    riskExplanation: item.prediction?.explanationJson || 'No explanation available',
                })),
            },
            requestId: req.requestId,
        });
    }
    catch (error) {
        next(error);
    }
}
