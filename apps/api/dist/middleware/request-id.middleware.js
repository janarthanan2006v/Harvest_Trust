"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestIdMiddleware = requestIdMiddleware;
const uuid_1 = require("uuid");
function requestIdMiddleware(req, res, next) {
    req.requestId = (0, uuid_1.v4)();
    res.setHeader('X-Request-Id', req.requestId);
    next();
}
