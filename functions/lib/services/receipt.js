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
exports.generateReceipt = void 0;
const admin = __importStar(require("firebase-admin"));
const db = admin.firestore();
const generateReceipt = async (paymentId, payment) => {
    try {
        // Generate receipt number
        const receiptNumber = `RCP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        // Create receipt record
        await db.collection('receipts').doc().set({
            userId: payment.userId,
            paymentId,
            receiptNumber,
            amount: payment.amount,
            paymentType: payment.type,
            institutionName: payment.institutionName || 'N/A',
            description: payment.description,
            status: payment.status,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        // Create notification for receipt
        await db.collection('notifications').doc().set({
            userId: payment.userId,
            type: 'RECEIPT_READY',
            title: 'Receipt Generated',
            message: `Your receipt ${receiptNumber} is ready`,
            read: false,
            data: { receiptNumber, paymentId },
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        console.log(`Receipt generated: ${receiptNumber}`);
    }
    catch (error) {
        console.error('Receipt generation failed:', error);
    }
};
exports.generateReceipt = generateReceipt;
//# sourceMappingURL=receipt.js.map