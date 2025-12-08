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
const admin = __importStar(require("firebase-admin"));
const auth_1 = require("./auth");
const router = (0, express_1.Router)();
const db = admin.firestore();
// Generate RRR code
router.post('/generate', auth_1.authenticate, async (req, res) => {
    try {
        const { uid } = req.user;
        const { amount, institutionCode, institutionName, serviceTypeId, payerName, payerEmail, payerPhone, description, } = req.body;
        const orderId = `REMIE-${Date.now()}`;
        // Create payment record
        const paymentRef = db.collection('payments').doc();
        await paymentRef.set({
            userId: uid,
            reference: orderId,
            amount,
            currency: 'NGN',
            type: 'SCHOOL_FEE',
            method: 'RRR',
            status: 'PENDING',
            recipientName: institutionName,
            institutionName,
            description,
            totalAmount: amount,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        // For demo purposes, generate a mock RRR
        const rrr = `${Math.floor(100000000000 + Math.random() * 900000000000)}`;
        // Create RRR payment record
        const rrrRef = db.collection('rrrPayments').doc();
        await rrrRef.set({
            userId: uid,
            paymentId: paymentRef.id,
            rrr,
            orderId,
            amount,
            institutionCode,
            institutionName,
            serviceTypeId,
            payerName,
            payerEmail,
            payerPhone,
            status: 'INITIATED',
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        res.status(201).json({
            status: 'success',
            message: 'RRR generated successfully',
            data: {
                rrr,
                orderId,
                amount,
                paymentId: paymentRef.id,
            },
        });
    }
    catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message,
        });
    }
});
// Verify RRR payment
router.get('/verify/:rrr', auth_1.authenticate, async (req, res) => {
    try {
        const { rrr } = req.params;
        const rrrSnapshot = await db.collection('rrrPayments')
            .where('rrr', '==', rrr)
            .limit(1)
            .get();
        if (rrrSnapshot.empty) {
            res.status(404).json({
                status: 'error',
                message: 'RRR not found',
            });
            return;
        }
        const rrrDoc = rrrSnapshot.docs[0];
        const rrrData = rrrDoc.data();
        res.status(200).json({
            status: 'success',
            data: {
                status: rrrData.status,
                rrr: rrrData.rrr,
                amount: rrrData.amount,
            },
        });
    }
    catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message,
        });
    }
});
// Get user's RRR payments
router.get('/', auth_1.authenticate, async (req, res) => {
    try {
        const { uid } = req.user;
        const limit = parseInt(req.query.limit) || 20;
        const snapshot = await db.collection('rrrPayments')
            .where('userId', '==', uid)
            .orderBy('createdAt', 'desc')
            .limit(limit)
            .get();
        const payments = snapshot.docs.map(doc => (Object.assign({ id: doc.id }, doc.data())));
        res.status(200).json({
            status: 'success',
            data: { payments },
        });
    }
    catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message,
        });
    }
});
exports.default = router;
//# sourceMappingURL=rrr.js.map