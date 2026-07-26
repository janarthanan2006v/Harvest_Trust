import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma.js';
import { createDeliverySchema } from '../validators/delivery.validator.js';
import { preciseRound } from '../utils/decimal.js';
import { getMLPrediction, PredictionFeatures } from '../utils/ml-client.js';

export async function checkLivePrediction(req: Request, res: Response, next: NextFunction) {
  try {
    // We use the same delivery schema for validation
    const data = createDeliverySchema.parse(req.body);

    const member = await prisma.member.findUnique({ where: { id: data.memberId } });
    if (!member) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_MEMBER', message: 'Member not found.' },
        requestId: req.requestId
      });
    }

    const produceType = await prisma.produceType.findUnique({ where: { id: data.produceTypeId } });
    if (!produceType) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_PRODUCE_TYPE', message: 'Produce type not found.' },
        requestId: req.requestId
      });
    }

    const collectionPoint = await prisma.collectionPoint.findUnique({ where: { id: data.collectionPointId } });
    if (!collectionPoint) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_COLLECTION_POINT', message: 'Collection point not found.' },
        requestId: req.requestId
      });
    }

    // Calculate relative features
    const priorDeliveriesCount = await prisma.delivery.count({
      where: { memberId: data.memberId }
    });

    const priorAttentionCount = await prisma.delivery.count({
      where: {
        memberId: data.memberId,
        attentionStatus: { in: ['OPEN', 'FOLLOW_UP', 'RESOLVED'] }
      }
    });

    const qtyAgg = await prisma.delivery.aggregate({
      where: { memberId: data.memberId, produceTypeId: data.produceTypeId },
      _avg: { quantity: true }
    });
    const avgQuantity = qtyAgg._avg.quantity || data.quantity;
    const qtyDiffFromAvg = preciseRound(data.quantity - avgQuantity);

    const priorDeliveries = await prisma.delivery.findMany({
      where: { produceTypeId: data.produceTypeId },
      select: { ratePerUnit: true }
    });
    let medianRate = data.ratePerUnit;
    if (priorDeliveries.length > 0) {
      const rates = priorDeliveries.map((d) => d.ratePerUnit).sort((a, b) => a - b);
      const mid = Math.floor(rates.length / 2);
      medianRate = rates.length % 2 !== 0 ? rates[mid] : (rates[mid - 1] + rates[mid]) / 2;
    }
    const rateDiffFromMedian = preciseRound(data.ratePerUnit - medianRate);
    const grossAmount = preciseRound(data.quantity * data.ratePerUnit);

    const mlFeatures: PredictionFeatures = {
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

    const prediction = await getMLPrediction(mlFeatures);

    return res.json({
      success: true,
      data: prediction,
      requestId: req.requestId
    });

  } catch (error) {
    next(error);
  }
}
