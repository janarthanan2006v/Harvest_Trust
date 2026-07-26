"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.preciseRound = preciseRound;
/**
 * Rounds a number to a specific precision (default 2 decimal places)
 * to avoid floating-point math errors.
 */
function preciseRound(value, decimals = 2) {
    const factor = Math.pow(10, decimals);
    return Math.round((value + Number.EPSILON) * factor) / factor;
}
