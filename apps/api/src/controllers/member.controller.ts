import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma.js';
import { createMemberSchema, updateMemberSchema } from '../validators/member.validator.js';
import { preciseRound } from '../utils/decimal.js';

export async function getMembers(req: Request, res: Response, next: NextFunction) {
  try {
    const search = typeof req.query.search === 'string' ? req.query.search : '';
    const isActive = req.query.isActive === 'false' ? false : true;
    const page = typeof req.query.page === 'string' ? parseInt(req.query.page, 10) : 1;
    const pageSize = typeof req.query.pageSize === 'string' ? parseInt(req.query.pageSize, 10) : 10;
    const skip = (page - 1) * pageSize;

    // Build filter query
    const where: any = {
      isActive,
      OR: [
        { fullName: { contains: search } },
        { memberCode: { contains: search } },
        { village: { contains: search } },
      ],
    };

    const [total, rawMembers] = await prisma.$transaction([
      prisma.member.count({ where }),
      prisma.member.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { memberCode: 'asc' },
        include: {
          deliveries: {
            select: { netAmount: true },
          },
          payments: {
            select: { amount: true },
          },
        },
      }),
    ]);

    // Calculate aggregated balances for each member
    const members = rawMembers.map((m) => {
      const totalDelivered = preciseRound(m.deliveries.reduce((sum, d) => sum + d.netAmount, 0));
      const totalPaid = preciseRound(m.payments.reduce((sum, p) => sum + p.amount, 0));
      const outstandingBalance = preciseRound(totalDelivered - totalPaid);

      return {
        id: m.id,
        memberCode: m.memberCode,
        fullName: m.fullName,
        phone: m.phone,
        village: m.village,
        joinedOn: m.joinedOn,
        isActive: m.isActive,
        totalDelivered,
        totalPaid,
        outstandingBalance,
      };
    });

    return res.json({
      success: true,
      data: members,
      meta: {
        total,
        page,
        pageSize,
        pageCount: Math.ceil(total / pageSize),
      },
      requestId: req.requestId,
    });
  } catch (error) {
    next(error);
  }
}

export async function createMember(req: Request, res: Response, next: NextFunction) {
  try {
    const data = createMemberSchema.parse(req.body);

    // Check for duplicate member code
    const existing = await prisma.member.findUnique({
      where: { memberCode: data.memberCode },
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'DUPLICATE_MEMBER_CODE',
          message: `A member with code '${data.memberCode}' already exists.`,
          fieldErrors: {
            memberCode: 'Member code must be unique.',
          },
        },
        requestId: req.requestId,
      });
    }

    const member = await prisma.member.create({
      data,
    });

    // Create Audit Log
    await prisma.auditLog.create({
      data: {
        userId: (req as any).user?.id,
        entityType: 'Member',
        entityId: member.id,
        action: 'CREATE',
        afterJson: JSON.stringify(member),
      },
    });

    return res.status(201).json({
      success: true,
      data: member,
      requestId: req.requestId,
    });
  } catch (error) {
    next(error);
  }
}

export async function getMemberById(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;

    const member = await prisma.member.findUnique({
      where: { id },
      include: {
        deliveries: {
          orderBy: { collectedAt: 'desc' },
          take: 5,
        },
        payments: {
          orderBy: { paidAt: 'desc' },
          take: 5,
        },
      },
    });

    if (!member) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Member not found.',
        },
        requestId: req.requestId,
      });
    }

    // Calculate aggregated balances
    const allDeliveries = await prisma.delivery.findMany({
      where: { memberId: id },
      select: { netAmount: true },
    });
    const allPayments = await prisma.payment.findMany({
      where: { memberId: id },
      select: { amount: true },
    });

    const totalDelivered = preciseRound(allDeliveries.reduce((sum, d) => sum + d.netAmount, 0));
    const totalPaid = preciseRound(allPayments.reduce((sum, p) => sum + p.amount, 0));
    const outstandingBalance = preciseRound(totalDelivered - totalPaid);

    return res.json({
      success: true,
      data: {
        ...member,
        totalDelivered,
        totalPaid,
        outstandingBalance,
      },
      requestId: req.requestId,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateMember(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    const data = updateMemberSchema.parse(req.body);

    const existing = await prisma.member.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Member not found.',
        },
        requestId: req.requestId,
      });
    }

    if (data.memberCode && data.memberCode !== existing.memberCode) {
      const codeConflict = await prisma.member.findUnique({
        where: { memberCode: data.memberCode },
      });
      if (codeConflict) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'DUPLICATE_MEMBER_CODE',
            message: `A member with code '${data.memberCode}' already exists.`,
            fieldErrors: {
              memberCode: 'Member code must be unique.',
            },
          },
          requestId: req.requestId,
        });
      }
    }

    const updatedMember = await prisma.member.update({
      where: { id },
      data,
    });

    await prisma.auditLog.create({
      data: {
        userId: (req as any).user?.id,
        entityType: 'Member',
        entityId: id,
        action: 'UPDATE',
        beforeJson: JSON.stringify(existing),
        afterJson: JSON.stringify(updatedMember),
      },
    });

    return res.json({
      success: true,
      data: updatedMember,
      requestId: req.requestId,
    });
  } catch (error) {
    next(error);
  }
}

export async function getMemberStatement(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    const fromDateStr = typeof req.query.fromDate === 'string' ? req.query.fromDate : undefined;
    const toDateStr = typeof req.query.toDate === 'string' ? req.query.toDate : undefined;

    const member = await prisma.member.findUnique({ where: { id } });
    if (!member) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Member not found.',
        },
        requestId: req.requestId,
      });
    }

    const fromDate = fromDateStr ? new Date(fromDateStr) : new Date(0);
    const toDate = toDateStr ? new Date(toDateStr) : new Date();

    // 1. Calculate opening balance (all deliveries before fromDate - all payments before fromDate)
    const priorDeliveries = await prisma.delivery.aggregate({
      where: {
        memberId: id,
        collectedAt: { lt: fromDate },
      },
      _sum: { netAmount: true },
    });

    const priorPayments = await prisma.payment.aggregate({
      where: {
        memberId: id,
        paidAt: { lt: fromDate },
      },
      _sum: { amount: true },
    });

    const openingBalance = preciseRound(
      (priorDeliveries._sum?.netAmount || 0) - (priorPayments._sum?.amount || 0)
    );

    // 2. Fetch deliveries within date range
    const deliveries = await prisma.delivery.findMany({
      where: {
        memberId: id,
        collectedAt: { gte: fromDate, lte: toDate },
      },
      include: {
        produceType: { select: { name: true, code: true } },
      },
      orderBy: { collectedAt: 'asc' },
    });

    // 3. Fetch payments within date range
    const payments = await prisma.payment.findMany({
      where: {
        memberId: id,
        paidAt: { gte: fromDate, lte: toDate },
      },
      orderBy: { paidAt: 'asc' },
    });

    // 4. Combine and sort chronologically
    const ledgerItems: any[] = [];

    deliveries.forEach((d) => {
      ledgerItems.push({
        type: 'DELIVERY',
        id: d.id,
        date: d.collectedAt,
        reference: d.receiptNumber,
        details: `${d.produceType.name} - ${d.quantity} ${d.unit} @ ₹${d.ratePerUnit.toFixed(2)}`,
        increase: d.netAmount,
        decrease: 0,
      });
    });

    payments.forEach((p) => {
      ledgerItems.push({
        type: 'PAYMENT',
        id: p.id,
        date: p.paidAt,
        reference: p.paymentNumber,
        details: `Payment via ${p.method} ${p.referenceNumber ? `(Ref: ${p.referenceNumber})` : ''}`,
        increase: 0,
        decrease: p.amount,
      });
    });

    // Sort chronologically
    ledgerItems.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Compute running balance
    let runningBalance = openingBalance;
    const transactions = ledgerItems.map((item) => {
      runningBalance = preciseRound(runningBalance + item.increase - item.decrease);
      return {
        ...item,
        balance: runningBalance,
      };
    });

    const closingBalance = runningBalance;

    return res.json({
      success: true,
      data: {
        member: {
          id: member.id,
          memberCode: member.memberCode,
          fullName: member.fullName,
          village: member.village,
          phone: member.phone,
        },
        openingBalance,
        transactions,
        closingBalance,
        fromDate: fromDateStr ? fromDate.toISOString() : null,
        toDate: toDateStr ? toDate.toISOString() : null,
      },
      requestId: req.requestId,
    });
  } catch (error) {
    next(error);
  }
}
