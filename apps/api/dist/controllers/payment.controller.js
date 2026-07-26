"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPayment = createPayment;
exports.getPayments = getPayments;
const prisma_js_1 = require("../lib/prisma.js");
const payment_validator_js_1 = require("../validators/payment.validator.js");
const decimal_js_1 = require("../utils/decimal.js");
async function createPayment(req, res, next) {
    try {
        const data = payment_validator_js_1.createPaymentSchema.parse(req.body);
        const secretaryId = req.user?.id || 'seeded-secretary-id';
        // 1. Verify member exists
        const member = await prisma_js_1.prisma.member.findUnique({ where: { id: data.memberId } });
        if (!member || !member.isActive) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'INVALID_MEMBER',
                    message: 'Member does not exist or is inactive.',
                    fieldErrors: { memberId: 'Must select an active member.' }
                },
                requestId: req.requestId
            });
        }
        // 2. Fetch all deliveries and payments to compute outstanding balance
        const deliveriesSum = await prisma_js_1.prisma.delivery.aggregate({
            where: { memberId: data.memberId },
            _sum: { netAmount: true }
        });
        const paymentsSum = await prisma_js_1.prisma.payment.aggregate({
            where: { memberId: data.memberId },
            _sum: { amount: true }
        });
        const totalDelivered = (0, decimal_js_1.preciseRound)(deliveriesSum._sum.netAmount || 0);
        const totalPaid = (0, decimal_js_1.preciseRound)(paymentsSum._sum.amount || 0);
        const outstandingBefore = (0, decimal_js_1.preciseRound)(totalDelivered - totalPaid);
        // Prevent overpayment
        if (data.amount > outstandingBefore) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'OVERPAYMENT_NOT_ALLOWED',
                    message: `Payment of ₹${data.amount.toFixed(2)} exceeds member's total outstanding balance of ₹${outstandingBefore.toFixed(2)}.`,
                    fieldErrors: {
                        amount: `Cannot exceed outstanding balance of ₹${outstandingBefore.toFixed(2)}.`
                    }
                },
                requestId: req.requestId
            });
        }
        // Generate unique payment number
        const now = new Date();
        const count = await prisma_js_1.prisma.payment.count();
        const paymentNumber = `PAY-${now.getFullYear()}-${String(count + 1).padStart(4, '0')}`;
        // 3. Save payment and allocations transactionally
        const result = await prisma_js_1.prisma.$transaction(async (tx) => {
            // Create payment
            const payment = await tx.payment.create({
                data: {
                    paymentNumber,
                    memberId: data.memberId,
                    amount: data.amount,
                    paidAt: data.paidAt,
                    method: data.method,
                    referenceNumber: data.referenceNumber || null,
                    notes: data.notes || null,
                    recordedById: secretaryId
                },
                include: {
                    member: { select: { fullName: true, memberCode: true } }
                }
            });
            // Find all unpaid or partially paid deliveries, sorted by date asc (oldest first)
            const openDeliveries = await tx.delivery.findMany({
                where: {
                    memberId: data.memberId,
                    paymentStatus: { in: ['UNPAID', 'PARTIALLY_PAID'] }
                },
                include: {
                    allocations: true
                },
                orderBy: { collectedAt: 'asc' }
            });
            let remainingPayment = data.amount;
            const allocationsCreated = [];
            for (const d of openDeliveries) {
                if (remainingPayment <= 0)
                    break;
                const alreadyAllocated = d.allocations.reduce((sum, a) => sum + a.allocatedAmount, 0);
                const amountDue = (0, decimal_js_1.preciseRound)(d.netAmount - alreadyAllocated);
                if (amountDue <= 0)
                    continue;
                const allocateAmount = (0, decimal_js_1.preciseRound)(Math.min(remainingPayment, amountDue));
                remainingPayment = (0, decimal_js_1.preciseRound)(remainingPayment - allocateAmount);
                // Save Allocation
                const alloc = await tx.paymentAllocation.create({
                    data: {
                        paymentId: payment.id,
                        deliveryId: d.id,
                        allocatedAmount: allocateAmount
                    }
                });
                allocationsCreated.push(alloc);
                // Update Delivery status
                const isFullyPaid = (0, decimal_js_1.preciseRound)(alreadyAllocated + allocateAmount) >= d.netAmount;
                const newPaymentStatus = isFullyPaid ? 'PAID' : 'PARTIALLY_PAID';
                await tx.delivery.update({
                    where: { id: d.id },
                    data: { paymentStatus: newPaymentStatus }
                });
                // Add history timeline entry
                await tx.deliveryStatusHistory.create({
                    data: {
                        deliveryId: d.id,
                        statusType: 'PAYMENT',
                        oldValue: d.paymentStatus,
                        newValue: newPaymentStatus,
                        note: `Payment allocation of ₹${allocateAmount.toFixed(2)} from payment ${paymentNumber}`,
                        changedById: secretaryId
                    }
                });
            }
            const outstandingAfter = (0, decimal_js_1.preciseRound)(outstandingBefore - data.amount);
            // Audit Log
            await tx.auditLog.create({
                data: {
                    userId: secretaryId,
                    entityType: 'Payment',
                    entityId: payment.id,
                    action: 'CREATE',
                    afterJson: JSON.stringify(payment)
                }
            });
            return { payment, allocations: allocationsCreated, outstandingAfter };
        });
        return res.status(201).json({
            success: true,
            data: {
                payment: result.payment,
                allocations: result.allocations,
                outstandingBefore,
                outstandingAfter: result.outstandingAfter
            },
            requestId: req.requestId
        });
    }
    catch (error) {
        next(error);
    }
}
async function getPayments(req, res, next) {
    try {
        const search = req.query.search || '';
        const memberId = req.query.memberId;
        const page = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.pageSize) || 10;
        const skip = (page - 1) * pageSize;
        const where = {};
        if (memberId) {
            where.memberId = memberId;
        }
        if (search) {
            where.OR = [
                { paymentNumber: { contains: search } },
                { referenceNumber: { contains: search } },
                { member: { fullName: { contains: search } } },
                { member: { memberCode: { contains: search } } }
            ];
        }
        const [total, payments] = await prisma_js_1.prisma.$transaction([
            prisma_js_1.prisma.payment.count({ where }),
            prisma_js_1.prisma.payment.findMany({
                where,
                skip,
                take: pageSize,
                orderBy: { paidAt: 'desc' },
                include: {
                    member: { select: { fullName: true, memberCode: true } },
                    recordedBy: { select: { name: true } }
                }
            })
        ]);
        return res.json({
            success: true,
            data: payments,
            meta: {
                total,
                page,
                pageSize,
                pageCount: Math.ceil(total / pageSize)
            },
            requestId: req.requestId
        });
    }
    catch (error) {
        next(error);
    }
}
