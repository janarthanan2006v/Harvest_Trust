import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import * as authController from '../controllers/auth.controller.js';
import * as dashboardController from '../controllers/dashboard.controller.js';
import * as memberController from '../controllers/member.controller.js';
import * as produceController from '../controllers/produce.controller.js';
import * as deliveryController from '../controllers/delivery.controller.js';
import * as attentionController from '../controllers/attention.controller.js';
import * as predictionController from '../controllers/prediction.controller.js';
import * as paymentController from '../controllers/payment.controller.js';
import * as reportController from '../controllers/report.controller.js';
import { authMiddleware, requireRole } from '../middleware/auth.middleware.js';

const router = Router();

// Health Check
router.get('/health', async (req: Request, res: Response) => {
  try {
    // Check DB connection
    await prisma.$queryRawUnsafe('SELECT 1');
    return res.json({
      success: true,
      data: {
        status: 'UP',
        timestamp: new Date(),
        database: 'CONNECTED'
      },
      requestId: req.requestId
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: {
        code: 'HEALTH_CHECK_FAILED',
        message: `API is up but database is offline: ${error.message}`
      },
      requestId: req.requestId
    });
  }
});

// Authentication
router.post('/auth/login', authController.login);

// Protected Routes (JWT required)
router.use(authMiddleware as any);

// Dashboard
router.get('/dashboard', dashboardController.getDashboardData);

// Members
router.get('/members', memberController.getMembers);
router.post('/members', requireRole(['SECRETARY', 'ADMIN']), memberController.createMember);
router.get('/members/:id', memberController.getMemberById);
router.patch('/members/:id', requireRole(['SECRETARY', 'ADMIN']), memberController.updateMember);
router.get('/members/:id/statement', memberController.getMemberStatement);

// Produce Types & Collection Points & Rates
router.get('/produce-types', produceController.getProduceTypes);
router.get('/collection-points', produceController.getCollectionPoints);
router.get('/rates/current', produceController.getCurrentRate);

// Deliveries
router.get('/deliveries', deliveryController.getDeliveries);
router.post('/deliveries', requireRole(['OPERATOR', 'ADMIN']), deliveryController.createDelivery);
router.get('/deliveries/:id', deliveryController.getDeliveryById);
router.patch('/deliveries/:id', requireRole(['SECRETARY', 'ADMIN']), deliveryController.updateDelivery);
router.post('/deliveries/:id/attention-status', requireRole(['SECRETARY', 'ADMIN']), deliveryController.updateAttentionStatus);

// Live Prediction Checks (For preview on entry screen)
router.post('/predictions/attention', predictionController.checkLivePrediction);

// Attention Cases
router.get('/attention', requireRole(['SECRETARY', 'ADMIN']), attentionController.getAttentionCases);

// Payments
router.post('/payments', requireRole(['SECRETARY', 'ADMIN']), paymentController.createPayment);
router.get('/payments', paymentController.getPayments);

// Reports
router.get('/reports/summary', reportController.getReportsSummary);
router.get('/reports/outstanding', reportController.getOutstandingReports);

export default router;
