import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma.js';
import { preciseRound } from '../utils/decimal.js';

export async function getReportsSummary(req: Request, res: Response, next: NextFunction) {
  try {
    const fromDateStr = req.query.fromDate as string;
    const toDateStr = req.query.toDate as string;

    const fromDate = fromDateStr ? new Date(fromDateStr) : new Date(0);
    const toDate = toDateStr ? new Date(toDateStr) : new Date();

    // Aggregates in date range
    const deliveryAgg = await prisma.delivery.aggregate({
      where: {
        collectedAt: { gte: fromDate, lte: toDate }
      },
      _sum: {
        quantity: true,
        netAmount: true
      },
      _count: {
        id: true
      }
    });

    const paymentAgg = await prisma.payment.aggregate({
      where: {
        paidAt: { gte: fromDate, lte: toDate }
      },
      _sum: {
        amount: true
      },
      _count: {
        id: true
      }
    });

    // Produce-wise statistics in date range
    const produceStats = await prisma.produceType.findMany({
      include: {
        deliveries: {
          where: {
            collectedAt: { gte: fromDate, lte: toDate }
          },
          select: {
            quantity: true,
            netAmount: true
          }
        }
      }
    });

    const produceBreakdown = produceStats
      .map((p) => {
        const qty = p.deliveries.reduce((sum, d) => sum + d.quantity, 0);
        const val = p.deliveries.reduce((sum, d) => sum + d.netAmount, 0);
        return {
          id: p.id,
          name: p.name,
          code: p.code,
          quantity: preciseRound(qty),
          value: preciseRound(val),
          unit: p.defaultUnit
        };
      })
      .filter((p) => p.quantity > 0);

    // Collection Point statistics
    const pointStats = await prisma.collectionPoint.findMany({
      include: {
        deliveries: {
          where: {
            collectedAt: { gte: fromDate, lte: toDate }
          },
          select: {
            netAmount: true
          }
        }
      }
    });

    const pointBreakdown = pointStats.map((pt) => {
      const val = pt.deliveries.reduce((sum, d) => sum + d.netAmount, 0);
      return {
        id: pt.id,
        name: pt.name,
        code: pt.code,
        value: preciseRound(val)
      };
    });

    return res.json({
      success: true,
      data: {
        totalQuantity: preciseRound(deliveryAgg._sum.quantity || 0),
        totalValue: preciseRound(deliveryAgg._sum.netAmount || 0),
        deliveriesCount: deliveryAgg._count.id,
        totalPayments: preciseRound(paymentAgg._sum.amount || 0),
        paymentsCount: paymentAgg._count.id,
        produceBreakdown,
        pointBreakdown
      },
      requestId: req.requestId
    });

  } catch (error) {
    next(error);
  }
}

export async function getOutstandingReports(req: Request, res: Response, next: NextFunction) {
  try {
    // We want to fetch all members, compute outstanding balances, and return those with balance > 0
    const members = await prisma.member.findMany({
      where: { isActive: true },
      include: {
        deliveries: { select: { netAmount: true } },
        payments: { select: { amount: true } }
      }
    });

    const outstandingMembers = members
      .map((m) => {
        const totalDelivered = preciseRound(m.deliveries.reduce((sum, d) => sum + d.netAmount, 0));
        const totalPaid = preciseRound(m.payments.reduce((sum, p) => sum + p.amount, 0));
        const outstandingBalance = preciseRound(totalDelivered - totalPaid);

        return {
          id: m.id,
          memberCode: m.memberCode,
          fullName: m.fullName,
          village: m.village,
          phone: m.phone,
          totalDelivered,
          totalPaid,
          outstandingBalance
        };
      })
      .filter((m) => m.outstandingBalance > 0)
      .sort((a, b) => b.outstandingBalance - a.outstandingBalance); // highest debt first

    return res.json({
      success: true,
      data: outstandingMembers,
      requestId: req.requestId
    });
  } catch (error) {
    next(error);
  }
}
