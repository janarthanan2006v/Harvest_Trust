"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const morgan_1 = __importDefault(require("morgan"));
const request_id_middleware_js_1 = require("./middleware/request-id.middleware.js");
const error_middleware_js_1 = require("./middleware/error.middleware.js");
const api_router_js_1 = __importDefault(require("./routes/api.router.js"));
// Load environment variables
dotenv_1.default.config();
const app = (0, express_1.default)();
const port = process.env.PORT || 4000;
// Security and utility middleware
app.use((0, cors_1.default)({
    origin: '*', // For SIH local evaluation, allow any origin. In production, restrict to frontend URI.
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
}));
app.use(express_1.default.json());
app.use((0, morgan_1.default)('dev'));
app.use(request_id_middleware_js_1.requestIdMiddleware);
// API router mount
app.use('/api', api_router_js_1.default);
// Base landing redirect / info
app.get('/', (req, res) => {
    res.json({
        message: 'Welcome to the HarvestTrust API Service.',
        docs: '/api/health',
        student: 'JANARTHANAN V (Reg: 411723205021)',
        version: '1.0.0'
    });
});
// Centralized error handling
app.use(error_middleware_js_1.errorMiddleware);
// Start server
const server = app.listen(port, () => {
    console.log(`[Server] HarvestTrust API running on http://localhost:${port}`);
});
// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('[Server] SIGTERM received. Shutting down gracefully.');
    server.close(() => {
        console.log('[Server] Closed remaining connections.');
        process.exit(0);
    });
});
process.on('unhandledRejection', (reason, promise) => {
    console.error('[Server] Unhandled Rejection at:', promise, 'reason:', reason);
});
process.on('uncaughtException', (error) => {
    console.error('[Server] Uncaught Exception:', error);
    process.exit(1);
});
