import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Seedable pseudo-random number generator for deterministic seeds
class SeededRandom {
  private seed: number;
  constructor(seed: number) {
    this.seed = seed;
  }
  next(): number {
    const x = Math.sin(this.seed++) * 10000;
    return x - Math.floor(x);
  }
  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min)) + min;
  }
  nextElement<T>(arr: T[]): T {
    return arr[this.nextInt(0, arr.length)];
  }
}

async function main() {
  console.log('Seeding database...');
  const rng = new SeededRandom(42);

  // Clear database
  await prisma.auditLog.deleteMany();
  await prisma.attentionOutcome.deleteMany();
  await prisma.prediction.deleteMany();
  await prisma.paymentAllocation.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.deliveryStatusHistory.deleteMany();
  await prisma.delivery.deleteMany();
  await prisma.rateHistory.deleteMany();
  await prisma.collectionPoint.deleteMany();
  await prisma.produceType.deleteMany();
  await prisma.member.deleteMany();
  await prisma.user.deleteMany();

  // 1. Seed Users
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('password123', salt);

  const admin = await prisma.user.create({
    data: {
      name: 'JANARTHANAN V (Admin)',
      email: 'admin@harvesttrust.com',
      passwordHash,
      role: 'ADMIN',
      isActive: true,
    },
  });

  const secretary = await prisma.user.create({
    data: {
      name: 'Suresh Kumar (Secretary)',
      email: 'secretary@harvesttrust.com',
      passwordHash,
      role: 'SECRETARY',
      isActive: true,
    },
  });

  const operator = await prisma.user.create({
    data: {
      name: 'Ramesh Patel (Operator)',
      email: 'operator@harvesttrust.com',
      passwordHash,
      role: 'OPERATOR',
      isActive: true,
    },
  });

  console.log('Users seeded.');

  // 2. Seed Produce Types
  const produceData = [
    { code: 'PDY', name: 'Paddy', defaultUnit: 'kg' },
    { code: 'GNT', name: 'Groundnut', defaultUnit: 'kg' },
    { code: 'MZE', name: 'Maize', defaultUnit: 'kg' },
    { code: 'TOM', name: 'Tomato', defaultUnit: 'crate' },
    { code: 'BNN', name: 'Banana', defaultUnit: 'quintal' },
    { code: 'CTN', name: 'Cotton', defaultUnit: 'quintal' },
    { code: 'MLK', name: 'Milk', defaultUnit: 'litre' },
    { code: 'PLS', name: 'Pulses', defaultUnit: 'kg' },
  ];

  const produceTypes = [];
  for (const p of produceData) {
    const pt = await prisma.produceType.create({ data: p });
    produceTypes.push(pt);
  }
  console.log('Produce types seeded.');

  // 3. Seed Collection Points
  const pointData = [
    { code: 'CPE', name: 'Collection Point East', location: 'East Chittoor Block' },
    { code: 'CPW', name: 'Collection Point West', location: 'West Kuppam Block' },
    { code: 'CPN', name: 'Collection Point North', location: 'North Arcot Hub' },
  ];

  const collectionPoints = [];
  for (const pt of pointData) {
    const cp = await prisma.collectionPoint.create({ data: pt });
    collectionPoints.push(cp);
  }
  console.log('Collection points seeded.');

  // 4. Seed Rates History
  // Let's create current rates and older rates
  const rates = [
    { code: 'PDY', rate: 22.50, oldRate: 20.00 },
    { code: 'GNT', rate: 68.00, oldRate: 65.00 },
    { code: 'MZE', rate: 21.00, oldRate: 19.50 },
    { code: 'TOM', rate: 15.00, oldRate: 12.00 },
    { code: 'BNN', rate: 2500.00, oldRate: 2300.00 }, // per quintal
    { code: 'CTN', rate: 7200.00, oldRate: 7000.00 }, // per quintal
    { code: 'MLK', rate: 35.00, oldRate: 32.00 },
    { code: 'PLS', rate: 85.00, oldRate: 80.00 },
  ];

  const rateHistories = [];
  for (const r of rates) {
    const pt = produceTypes.find((p) => p.code === r.code)!;
    // Old rate (effective from 6 months ago to 1 month ago)
    await prisma.rateHistory.create({
      data: {
        produceTypeId: pt.id,
        ratePerUnit: r.oldRate,
        unit: pt.defaultUnit,
        effectiveFrom: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000),
        effectiveTo: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        createdById: admin.id,
        reason: 'Seasonal adjustments',
      },
    });

    // Current rate (effective from 30 days ago)
    const currentRate = await prisma.rateHistory.create({
      data: {
        produceTypeId: pt.id,
        ratePerUnit: r.rate,
        unit: pt.defaultUnit,
        effectiveFrom: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        effectiveTo: null,
        createdById: admin.id,
        reason: 'Market price revision',
      },
    });
    rateHistories.push(currentRate);
  }
  console.log('Rate histories seeded.');

  // 5. Seed Members
  const villages = ['Melpuram', 'Alangulam', 'Chittur', 'Vepanapalli', 'Kallakurichi'];
  const firstNames = ['Arun', 'Babu', 'Chandra', 'Durai', 'Elango', 'Ganesh', 'Hari', 'Ilayaraja', 'Jeeva', 'Karthik', 'Loganathan', 'Mani', 'Natarajan', 'Palani', 'Raja', 'Senthil', 'Thangaraj', 'Velu', 'Yuvraj', 'Ramesh', 'Suresh', 'Vikram', 'Anand', 'Krishnan', 'Murugan', 'Prabhu', 'Ravi', 'Selvam', 'Vijay', 'Balaji'];
  const lastNames = ['K', 'S', 'P', 'R', 'M', 'A', 'N', 'V', 'T', 'G', 'D', 'Kumar', 'Rajan', 'Devi', 'Pillai', 'Naidu', 'Gowda', 'Reddy'];

  const members = [];
  for (let i = 1; i <= 30; i++) {
    const memberCode = `MEM${String(i).padStart(3, '0')}`;
    const fullName = `${rng.nextElement(firstNames)} ${rng.nextElement(lastNames)}`;
    const phone = `9${String(rng.nextInt(100000000, 999999999))}`;
    const village = rng.nextElement(villages);
    const joinedOn = new Date(Date.now() - rng.nextInt(30, 365) * 24 * 60 * 60 * 1000);

    const member = await prisma.member.create({
      data: {
        memberCode,
        fullName,
        phone,
        village,
        joinedOn,
        isActive: true,
      },
    });
    members.push(member);
  }
  console.log('Members seeded.');

  // 6. Seed Deliveries (At least 100 deliveries)
  const deliveries = [];
  const now = new Date();
  
  for (let i = 1; i <= 110; i++) {
    const member = rng.nextElement(members);
    const produceType = rng.nextElement(produceTypes);
    const collectionPoint = rng.nextElement(collectionPoints);
    const rateHistory = rateHistories.find((r) => r.produceTypeId === produceType.id)!;
    
    // Delivery date between 29 days ago and today
    const daysAgo = rng.nextInt(0, 30);
    const hoursAgo = rng.nextInt(1, 24);
    const collectedAt = new Date(now.getTime() - (daysAgo * 24 + hoursAgo) * 60 * 60 * 1000);

    // Quantity details
    let quantity = rng.nextInt(10, 500);
    if (produceType.code === 'MLK') {
      quantity = rng.nextInt(5, 50); // litres
    } else if (produceType.code === 'TOM') {
      quantity = rng.nextInt(2, 20); // crates
    }
    
    // Quality & Moisture
    const qualityGrade = rng.nextElement(['A', 'B', 'C']);
    const moisturePercent = produceType.code === 'PDY' || produceType.code === 'MZE' ? rng.nextInt(10, 25) : null;

    // Rates based on grade
    let rateModifier = 1.0;
    if (qualityGrade === 'B') rateModifier = 0.9;
    if (qualityGrade === 'C') rateModifier = 0.8;
    
    const ratePerUnit = Math.round(rateHistory.ratePerUnit * rateModifier * 100) / 100;
    const grossAmount = Math.round(quantity * ratePerUnit * 100) / 100;
    const netAmount = grossAmount; // No deductions

    // Receipt number format: HT-YYYYMMDD-XXXX
    const dateStr = collectedAt.toISOString().slice(0, 10).replace(/-/g, '');
    const receiptNumber = `HT-${dateStr}-${String(i).padStart(4, '0')}`;

    // Random attention status
    let attentionStatus = 'NONE';
    let predictedClass: string | null = 'NORMAL';
    let probability = rng.nextInt(70, 95) / 100;
    
    // Anomalous rules for seeding attention cases
    const isAnomalous = 
      (moisturePercent !== null && moisturePercent > 18) || 
      (quantity > 400 && rng.next() > 0.5) ||
      (qualityGrade === 'C' && rng.next() > 0.7) ||
      (collectedAt.getHours() < 7 || collectedAt.getHours() > 19);

    if (isAnomalous) {
      const randVal = rng.next();
      if (randVal < 0.4) {
        attentionStatus = 'OPEN';
        predictedClass = 'ATTENTION';
      } else if (randVal < 0.7) {
        attentionStatus = 'RESOLVED';
        predictedClass = 'ATTENTION';
      } else {
        attentionStatus = 'FOLLOW_UP';
        predictedClass = 'ATTENTION';
      }
      probability = rng.nextInt(66, 92) / 100;
    }

    // Payment status: older ones are paid, newer ones are unpaid
    let paymentStatus = 'UNPAID';
    if (daysAgo > 15) {
      paymentStatus = rng.next() > 0.2 ? 'PAID' : 'PARTIALLY_PAID';
    } else if (daysAgo > 5) {
      paymentStatus = rng.next() > 0.5 ? 'PAID' : (rng.next() > 0.5 ? 'PARTIALLY_PAID' : 'UNPAID');
    }

    const delivery = await prisma.delivery.create({
      data: {
        receiptNumber,
        memberId: member.id,
        produceTypeId: produceType.id,
        collectionPointId: collectionPoint.id,
        operatorId: operator.id,
        rateHistoryId: rateHistory.id,
        collectedAt,
        quantity,
        unit: produceType.defaultUnit,
        ratePerUnit,
        grossAmount,
        netAmount,
        qualityGrade,
        moisturePercent,
        notes: isAnomalous ? 'Seed data anomaly flagged for review' : 'Regular collection',
        paymentStatus,
        attentionStatus,
      },
    });

    deliveries.push(delivery);

    // Save Prediction
    await prisma.prediction.create({
      data: {
        deliveryId: delivery.id,
        targetName: 'neededAttention',
        predictedClass,
        probability,
        confidenceThreshold: 0.65,
        modelVersion: 'v1.0.0',
        featuresJson: JSON.stringify({
          quantity,
          ratePerUnit,
          grossAmount,
          moisturePercent,
          hour: collectedAt.getHours(),
          dayOfWeek: collectedAt.getDay(),
        }),
        explanationJson: isAnomalous ? 'Flagged due to unusual delivery parameters.' : 'Standard metrics within normal bounds.',
      },
    });

    // Create delivery status history
    await prisma.deliveryStatusHistory.create({
      data: {
        deliveryId: delivery.id,
        statusType: 'ATTENTION',
        oldValue: null,
        newValue: attentionStatus,
        note: 'Initial seeding status',
        changedById: secretary.id,
      },
    });

    // Add outcome if resolved
    if (attentionStatus === 'RESOLVED') {
      await prisma.attentionOutcome.create({
        data: {
          deliveryId: delivery.id,
          neededAttention: true,
          reasonCategory: 'Quality verification',
          resolvedAt: new Date(collectedAt.getTime() + 24 * 60 * 60 * 1000),
          recordedById: secretary.id,
        },
      });
    }
  }
  console.log('Deliveries and predictions seeded.');

  // 7. Seed Payments (At least 30 payment records)
  // Let's create payments for members and allocate them
  let paymentCounter = 1;
  for (const m of members) {
    // Find all unpaid or partially paid deliveries for this member
    const memberDeliveries = deliveries.filter(
      (d) => d.memberId === m.id && (d.paymentStatus === 'PAID' || d.paymentStatus === 'PARTIALLY_PAID')
    );

    if (memberDeliveries.length === 0) continue;

    // Calculate sum of delivered value to pay
    const totalToPay = memberDeliveries.reduce((sum, d) => sum + d.netAmount, 0);
    // Make a couple of payments
    const payAmount = Math.round(totalToPay * 0.9 * 100) / 100;

    if (payAmount <= 0) continue;

    const paymentNumber = `PAY-${now.getFullYear()}-${String(paymentCounter++).padStart(4, '0')}`;
    const payment = await prisma.payment.create({
      data: {
        paymentNumber,
        memberId: m.id,
        amount: payAmount,
        paidAt: new Date(now.getTime() - rng.nextInt(1, 10) * 24 * 60 * 60 * 1000),
        method: rng.nextElement(['BANK_TRANSFER', 'UPI', 'CASH']),
        referenceNumber: `TXN${rng.nextInt(100000, 999999)}`,
        notes: 'Bulk payment for member deliveries',
        recordedById: secretary.id,
      },
    });

    // Allocate payment
    let remainingPayment = payAmount;
    for (const d of memberDeliveries) {
      if (remainingPayment <= 0) break;
      const allocated = Math.min(d.netAmount, remainingPayment);
      await prisma.paymentAllocation.create({
        data: {
          paymentId: payment.id,
          deliveryId: d.id,
          allocatedAmount: allocated,
        },
      });
      remainingPayment = Math.round((remainingPayment - allocated) * 100) / 100;
    }
  }

  console.log('Payments seeded.');
  console.log('Database seeding finished successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
