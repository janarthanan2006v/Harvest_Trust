import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma.js';

export async function getAttentionCases(req: Request, res: Response, next: NextFunction) {
  try {
    const cases = await prisma.delivery.findMany({
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
  } catch (error) {
    next(error);
  }
}
