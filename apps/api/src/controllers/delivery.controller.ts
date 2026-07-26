import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma.js';
import { createDeliverySchema, updateDeliverySchema } from '../validators/delivery.validator.js';
import { preciseRound } from '../utils/decimal.js';
import { getMLPrediction, PredictionFeatures } from '../utils/ml-client.js';

// Helper to map status to order priority
function getStatusPriority(status: string): number {
  switch (status) {
    case 'OPEN': return 1;
    case 'FOLLOW_UP': return 2;
    case 'RESOLVED': return 3;
    case 'NONE': return 4;
    default: return 5;
  }
}

export async function createDelivery(req: Request, res: Response, next: NextFunction) {
  try {
    const data = createDeliverySchema.parse(req.body);
    const operatorId = (req as any).user?.id || 'seeded-operator-id'; // Fallback if local auth bypass is used

    // 1. Verify that Member exists and is active
    const member = await prisma.member.findUnique({ where: { id: data.memberId } });
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

    // 2. Verify ProduceType exists and is active
    const produceType = await prisma.produceType.findUnique({ where: { id: data.produceTypeId } });
    if (!produceType || !produceType.isActive) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_PRODUCE_TYPE',
          message: 'Produce type does not exist or is inactive.',
          fieldErrors: { produceTypeId: 'Must select a valid produce type.' }
        },
        requestId: req.requestId
      });
    }

    // 3. Verify CollectionPoint exists and is active
    const collectionPoint = await prisma.collectionPoint.findUnique({ where: { id: data.collectionPointId } });
    if (!collectionPoint || !collectionPoint.isActive) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_COLLECTION_POINT',
          message: 'Collection point does not exist or is inactive.',
          fieldErrors: { collectionPointId: 'Must select a valid collection point.' }
        },
        requestId: req.requestId
      });
    }

    // 4. Calculate gross and net amountsauthoritative calculations on server
    const grossAmount = preciseRound(data.quantity * data.ratePerUnit);
    const netAmount = grossAmount; // deductions omitted for Easy level

    // 5. Generate unique, readable receipt/slip number (HT-YYYYMMDD-XXXX)
    const dateStr = data.collectedAt.toISOString().slice(0, 10).replace(/-/g, '');
    const todayStart = new Date(data.collectedAt);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(data.collectedAt);
    todayEnd.setHours(23, 59, 59, 999);

    const count = await prisma.delivery.count({
      where: {
        collectedAt: {
          gte: todayStart,
          lte: todayEnd
        }
      }
    });
    
    // Check duplication with retry just in case of parallel inserts
    let sequence = count + 1;
    let receiptNumber = `HT-${dateStr}-${String(sequence).padStart(4, '0')}`;
    let isDuplicate = await prisma.delivery.findUnique({ where: { receiptNumber } });
    while (isDuplicate) {
      sequence++;
      receiptNumber = `HT-${dateStr}-${String(sequence).padStart(4, '0')}`;
      isDuplicate = await prisma.delivery.findUnique({ where: { receiptNumber } });
    }

    // 6. Gather relative historical features for ML
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

    // 7. Request ML prediction
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

    // Decide attention status from prediction
    let attentionStatus = 'NONE';
    let attentionPriority = 4;
    if (prediction.predictedClass === 'ATTENTION') {
      attentionStatus = 'OPEN';
      attentionPriority = 1;
    }

    // 8. DB Transaction: save everything together
    const result = await prisma.$transaction(async (tx) => {
      // Find current rate history id if possible
      const rateHistory = await tx.rateHistory.findFirst({
        where: {
          produceTypeId: data.produceTypeId,
          AND: [
            {
              OR: [
                { collectionPointId: null },
                { collectionPointId: data.collectionPointId }
              ]
            },
            {
              OR: [
                { effectiveTo: null },
                { effectiveTo: { gte: data.collectedAt } }
              ]
            }
          ],
          effectiveFrom: { lte: data.collectedAt }
        },
        orderBy: { effectiveFrom: 'desc' }
      });

      // Create Delivery
      const delivery = await tx.delivery.create({
        data: {
          receiptNumber,
          memberId: data.memberId,
          produceTypeId: data.produceTypeId,
          collectionPointId: data.collectionPointId,
          operatorId,
          rateHistoryId: rateHistory?.id || null,
          collectedAt: data.collectedAt,
          quantity: data.quantity,
          unit: produceType.defaultUnit,
          ratePerUnit: data.ratePerUnit,
          grossAmount,
          netAmount,
          qualityGrade: data.qualityGrade || null,
          moisturePercent: data.moisturePercent || null,
          notes: data.notes || null,
          paymentStatus: 'UNPAID',
          attentionStatus,
        },
        include: {
          member: { select: { fullName: true, memberCode: true } },
          produceType: { select: { name: true, code: true } },
          collectionPoint: { select: { name: true } },
          operator: { select: { name: true } }
        }
      });

      // Save Status History if flagged
      if (attentionStatus !== 'NONE') {
        await tx.deliveryStatusHistory.create({
          data: {
            deliveryId: delivery.id,
            statusType: 'ATTENTION',
            oldValue: 'NONE',
            newValue: attentionStatus,
            note: `System-flagged for review: ${prediction.explanation}`,
            changedById: operatorId
          }
        });
      }

      // Save Prediction
      await tx.prediction.create({
        data: {
          deliveryId: delivery.id,
          targetName: 'neededAttention',
          predictedClass: prediction.predictedClass,
          probability: prediction.probability,
          confidenceThreshold: prediction.confidenceThreshold,
          modelVersion: prediction.modelVersion,
          featuresJson: JSON.stringify(mlFeatures),
          explanationJson: prediction.explanation
        }
      });

      // Create Audit Log
      await tx.auditLog.create({
        data: {
          userId: operatorId,
          entityType: 'Delivery',
          entityId: delivery.id,
          action: 'CREATE',
          afterJson: JSON.stringify(delivery)
        }
      });

      return { delivery, prediction };
    });

    return res.status(201).json({
      success: true,
      data: {
        ...result.delivery,
        prediction: result.prediction
      },
      requestId: req.requestId
    });

  } catch (error) {
    next(error);
  }
}

export async function getDeliveries(req: Request, res: Response, next: NextFunction) {
  try {
    const page = typeof req.query.page === 'string' ? parseInt(req.query.page, 10) : 1;
    const pageSize = typeof req.query.pageSize === 'string' ? parseInt(req.query.pageSize, 10) : 10;
    const skip = (page - 1) * pageSize;

    const search = typeof req.query.search === 'string' ? req.query.search : '';
    const fromDateStr = typeof req.query.fromDate === 'string' ? req.query.fromDate : undefined;
    const toDateStr = typeof req.query.toDate === 'string' ? req.query.toDate : undefined;
    const memberId = typeof req.query.memberId === 'string' ? req.query.memberId : undefined;
    const produceTypeId = typeof req.query.produceTypeId === 'string' ? req.query.produceTypeId : undefined;
    const collectionPointId = typeof req.query.collectionPointId === 'string' ? req.query.collectionPointId : undefined;
    const paymentStatus = typeof req.query.paymentStatus === 'string' ? req.query.paymentStatus : undefined;
    const attentionStatus = typeof req.query.attentionStatus === 'string' ? req.query.attentionStatus : undefined;
    const sortBy = typeof req.query.sortBy === 'string' ? req.query.sortBy : 'collectedAt';
    const sortDirection = req.query.sortDirection === 'asc' ? 'asc' : 'desc';

    // 1. Build where conditions
    const where: any = {};

    if (search) {
      where.OR = [
        { receiptNumber: { contains: search } },
        { member: { fullName: { contains: search } } },
        { member: { memberCode: { contains: search } } },
        { produceType: { name: { contains: search } } },
      ];
    }

    if (fromDateStr || toDateStr) {
      where.collectedAt = {};
      if (fromDateStr) where.collectedAt.gte = new Date(fromDateStr);
      if (toDateStr) where.collectedAt.lte = new Date(toDateStr);
    }

    if (memberId) where.memberId = memberId;
    if (produceTypeId) where.produceTypeId = produceTypeId;
    if (collectionPointId) where.collectionPointId = collectionPointId;
    if (paymentStatus) where.paymentStatus = paymentStatus;
    if (attentionStatus) where.attentionStatus = attentionStatus;

    // We need to count total records matching filters
    const total = await prisma.delivery.count({ where });

    // Since we need to order unresolved attention status first, then by collectedAt desc (or requested field),
    // let's retrieve raw data and build custom ordering.
    // However, if we do standard Prisma, we can simulate this by fetching them.
    // Let's implement dynamic ordering where we order by case.
    // In order to make it performant and keep SQLite portable, we can query SQLite using Prisma but
    // since we can query all matching IDs and order them, or we can use custom order array:
    // Let's fetch all matched IDs, sort them in memory, paginate, and fetch full data for those IDs!
    // This is a highly robust, database-portable technique that supports pagination, complex sorting,
    // and full relation mapping without writing database-specific raw SQL. Let's do that!
    
    const matchedDeliveries = await prisma.delivery.findMany({
      where,
      select: {
        id: true,
        attentionStatus: true,
        collectedAt: true,
        grossAmount: true,
        quantity: true,
      },
    });

    // Sort matching rows in memory:
    // Unresolved (OPEN=1, FOLLOW_UP=2) first, then RESOLVED=3, then NONE=4.
    // Secondary sort: sortBy field value
    matchedDeliveries.sort((a, b) => {
      const priorityA = getStatusPriority(a.attentionStatus);
      const priorityB = getStatusPriority(b.attentionStatus);

      if (priorityA !== priorityB) {
        return priorityA - priorityB; // Unresolved cases first
      }

      // If priorities are equal, sort by date descending (newest first)
      return b.collectedAt.getTime() - a.collectedAt.getTime();
    });

    // Slice for pagination
    const paginatedIds = matchedDeliveries.slice(skip, skip + pageSize).map((d) => d.id);

    // Fetch full data for the paginated IDs
    const deliveries = await prisma.delivery.findMany({
      where: { id: { in: paginatedIds } },
      include: {
        member: { select: { fullName: true, memberCode: true, village: true } },
        produceType: { select: { name: true, code: true } },
        collectionPoint: { select: { name: true } },
        operator: { select: { name: true } },
        prediction: true
      },
    });

    // Re-apply the sorted order to the fetched deliveries
    const sortedDeliveries = paginatedIds
      .map((id) => deliveries.find((d) => d.id === id))
      .filter(Boolean);

    return res.json({
      success: true,
      data: sortedDeliveries,
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

export async function getDeliveryById(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;

    const delivery = await prisma.delivery.findUnique({
      where: { id },
      include: {
        member: true,
        produceType: true,
        collectionPoint: true,
        operator: { select: { name: true, email: true } },
        prediction: true,
        outcome: true,
        statusHistory: {
          include: {
            changedBy: { select: { name: true } }
          },
          orderBy: { changedAt: 'desc' }
        },
        allocations: {
          include: {
            payment: true
          }
        }
      }
    });

    if (!delivery) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Delivery record not found.'
        },
        requestId: req.requestId
      });
    }

    return res.json({
      success: true,
      data: delivery,
      requestId: req.requestId
    });
  } catch (error) {
    next(error);
  }
}

export async function updateDelivery(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    const data = updateDeliverySchema.parse(req.body);
    const userId = (req as any).user?.id || 'seeded-operator-id';

    const existing = await prisma.delivery.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Delivery record not found.'
        },
        requestId: req.requestId
      });
    }

    const updated = await prisma.$transaction(async (tx) => {
      const u = await tx.delivery.update({
        where: { id },
        data: {
          notes: data.notes !== undefined ? data.notes : existing.notes,
          qualityGrade: data.qualityGrade !== undefined ? data.qualityGrade : existing.qualityGrade,
          moisturePercent: data.moisturePercent !== undefined ? data.moisturePercent : existing.moisturePercent,
        }
      });

      await tx.auditLog.create({
        data: {
          userId,
          entityType: 'Delivery',
          entityId: id,
          action: 'UPDATE',
          beforeJson: JSON.stringify(existing),
          afterJson: JSON.stringify(u)
        }
      });

      return u;
    });

    return res.json({
      success: true,
      data: updated,
      requestId: req.requestId
    });
  } catch (error) {
    next(error);
  }
}

export async function updateAttentionStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    const { status, note, neededAttention, reasonCategory } = req.body;
    const userId = (req as any).user?.id || 'seeded-secretary-id';

    if (!['NONE', 'OPEN', 'FOLLOW_UP', 'RESOLVED'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_STATUS',
          message: 'Status must be one of: NONE, OPEN, FOLLOW_UP, RESOLVED.'
        },
        requestId: req.requestId
      });
    }

    const existing = await prisma.delivery.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Delivery record not found.'
        },
        requestId: req.requestId
      });
    }

    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.delivery.update({
        where: { id },
        data: {
          attentionStatus: status,
        }
      });

      // Log status changes
      await tx.deliveryStatusHistory.create({
        data: {
          deliveryId: id,
          statusType: 'ATTENTION',
          oldValue: existing.attentionStatus,
          newValue: status,
          note: note || 'Manual status change',
          changedById: userId
        }
      });

      // If resolving attention, record final outcome for future ML training
      if (status === 'RESOLVED') {
        await tx.attentionOutcome.upsert({
          where: { deliveryId: id },
          update: {
            neededAttention: !!neededAttention,
            reasonCategory: reasonCategory || 'Reviewed by Secretary',
            resolvedAt: new Date(),
            recordedById: userId
          },
          create: {
            deliveryId: id,
            neededAttention: !!neededAttention,
            reasonCategory: reasonCategory || 'Reviewed by Secretary',
            resolvedAt: new Date(),
            recordedById: userId
          }
        });
      }

      await tx.auditLog.create({
        data: {
          userId,
          entityType: 'Delivery',
          entityId: id,
          action: `ATTENTION_STATUS_${status}`,
          beforeJson: JSON.stringify(existing),
          afterJson: JSON.stringify(updated)
        }
      });

      return updated;
    });

    return res.json({
      success: true,
      data: result,
      requestId: req.requestId
    });
  } catch (error) {
    next(error);
  }
}
