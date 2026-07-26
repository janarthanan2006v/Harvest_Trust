import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma.js';

export async function getProduceTypes(req: Request, res: Response, next: NextFunction) {
  try {
    const produceTypes = await prisma.produceType.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });

    return res.json({
      success: true,
      data: produceTypes,
      requestId: req.requestId,
    });
  } catch (error) {
    next(error);
  }
}

export async function getCollectionPoints(req: Request, res: Response, next: NextFunction) {
  try {
    const points = await prisma.collectionPoint.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });

    return res.json({
      success: true,
      data: points,
      requestId: req.requestId,
    });
  } catch (error) {
    next(error);
  }
}

export async function getCurrentRate(req: Request, res: Response, next: NextFunction) {
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
    const rate = await prisma.rateHistory.findFirst({
      where: {
        produceTypeId: produceTypeId as string,
        AND: [
          {
            OR: [
              { collectionPointId: null },
              { collectionPointId: collectionPointId as string },
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
  } catch (error) {
    next(error);
  }
}
