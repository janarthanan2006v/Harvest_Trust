"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_js_1 = require("../lib/prisma.js");
const authController = __importStar(require("../controllers/auth.controller.js"));
const dashboardController = __importStar(require("../controllers/dashboard.controller.js"));
const memberController = __importStar(require("../controllers/member.controller.js"));
const produceController = __importStar(require("../controllers/produce.controller.js"));
const deliveryController = __importStar(require("../controllers/delivery.controller.js"));
const attentionController = __importStar(require("../controllers/attention.controller.js"));
const predictionController = __importStar(require("../controllers/prediction.controller.js"));
const paymentController = __importStar(require("../controllers/payment.controller.js"));
const reportController = __importStar(require("../controllers/report.controller.js"));
const auth_middleware_js_1 = require("../middleware/auth.middleware.js");
const router = (0, express_1.Router)();
// Health Check
router.get('/health', async (req, res) => {
    try {
        // Check DB connection
        await prisma_js_1.prisma.$executeRawUnsafe('SELECT 1');
        return res.json({
            success: true,
            data: {
                status: 'UP',
                timestamp: new Date(),
                database: 'CONNECTED'
            },
            requestId: req.requestId
        });
    }
    catch (error) {
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
router.use(auth_middleware_js_1.authMiddleware);
// Dashboard
router.get('/dashboard', dashboardController.getDashboardData);
// Members
router.get('/members', memberController.getMembers);
router.post('/members', (0, auth_middleware_js_1.requireRole)(['SECRETARY', 'ADMIN']), memberController.createMember);
router.get('/members/:id', memberController.getMemberById);
router.patch('/members/:id', (0, auth_middleware_js_1.requireRole)(['SECRETARY', 'ADMIN']), memberController.updateMember);
router.get('/members/:id/statement', memberController.getMemberStatement);
// Produce Types & Collection Points & Rates
router.get('/produce-types', produceController.getProduceTypes);
router.get('/collection-points', produceController.getCollectionPoints);
router.get('/rates/current', produceController.getCurrentRate);
// Deliveries
router.get('/deliveries', deliveryController.getDeliveries);
router.post('/deliveries', (0, auth_middleware_js_1.requireRole)(['OPERATOR', 'ADMIN']), deliveryController.createDelivery);
router.get('/deliveries/:id', deliveryController.getDeliveryById);
router.patch('/deliveries/:id', (0, auth_middleware_js_1.requireRole)(['SECRETARY', 'ADMIN']), deliveryController.updateDelivery);
router.post('/deliveries/:id/attention-status', (0, auth_middleware_js_1.requireRole)(['SECRETARY', 'ADMIN']), deliveryController.updateAttentionStatus);
// Live Prediction Checks (For preview on entry screen)
router.post('/predictions/attention', predictionController.checkLivePrediction);
// Attention Cases
router.get('/attention', (0, auth_middleware_js_1.requireRole)(['SECRETARY', 'ADMIN']), attentionController.getAttentionCases);
// Payments
router.post('/payments', (0, auth_middleware_js_1.requireRole)(['SECRETARY', 'ADMIN']), paymentController.createPayment);
router.get('/payments', paymentController.getPayments);
// Reports
router.get('/reports/summary', reportController.getReportsSummary);
router.get('/reports/outstanding', reportController.getOutstandingReports);
exports.default = router;
