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
const MIN_LOAN_AMOUNT = 5000;
const MAX_LOAN_AMOUNT = 50000;
const INTEREST_RATE = 5; // 5% annual
const MAX_TENURE_DAYS = 90;
// Apply for loan
router.post('/apply', auth_1.authenticate, async (req, res) => {
    try {
        const { uid } = req.user;
        const { amount, purpose, purposeType, tenure } = req.body;
        if (amount < MIN_LOAN_AMOUNT || amount > MAX_LOAN_AMOUNT) {
            res.status(400).json({
                status: 'error',
                message: `Loan amount must be between ₦${MIN_LOAN_AMOUNT} and ₦${MAX_LOAN_AMOUNT}`,
            });
            return;
        }
        if (tenure < 7 || tenure > MAX_TENURE_DAYS) {
            res.status(400).json({
                status: 'error',
                message: `Loan tenure must be between 7 and ${MAX_TENURE_DAYS} days`,
            });
            return;
        }
        // Check for active loans
        const activeLoansSnapshot = await db.collection('loans')
            .where('userId', '==', uid)
            .where('status', 'in', ['ACTIVE', 'DISBURSED', 'APPROVED'])
            .limit(1)
            .get();
        if (!activeLoansSnapshot.empty) {
            res.status(400).json({
                status: 'error',
                message: 'You already have an active loan',
            });
            return;
        }
        // Calculate repayable amount
        const interestAmount = (amount * INTEREST_RATE * tenure) / (365 * 100);
        const totalRepayable = amount + interestAmount;
        const loanNumber = `LOAN-${Date.now()}`;
        const dueDate = new Date(Date.now() + tenure * 24 * 60 * 60 * 1000);
        // Create loan (auto-approved for demo)
        const loanRef = db.collection('loans').doc();
        await loanRef.set({
            userId: uid,
            loanNumber,
            amount,
            interestRate: INTEREST_RATE,
            tenure,
            purpose,
            purposeType,
            totalRepayable,
            amountPaid: 0,
            amountOutstanding: totalRepayable,
            dueDate,
            status: 'DISBURSED',
            approvedBy: 'SYSTEM',
            approvedAt: admin.firestore.FieldValue.serverTimestamp(),
            disbursedAt: admin.firestore.FieldValue.serverTimestamp(),
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        // Credit wallet
        await db.collection('wallets').doc(uid).update({
            balance: admin.firestore.FieldValue.increment(amount),
            availableBalance: admin.firestore.FieldValue.increment(amount),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        res.status(201).json({
            status: 'success',
            message: 'Loan approved and disbursed',
            data: {
                loanId: loanRef.id,
                loanNumber,
                amount,
                totalRepayable,
                dueDate,
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
// Repay loan
router.post('/:loanId/repay', auth_1.authenticate, async (req, res) => {
    try {
        const { uid } = req.user;
        const { loanId } = req.params;
        const { amount } = req.body;
        const loanDoc = await db.collection('loans').doc(loanId).get();
        if (!loanDoc.exists) {
            res.status(404).json({
                status: 'error',
                message: 'Loan not found',
            });
            return;
        }
        const loan = loanDoc.data();
        if (!loan || loan.userId !== uid) {
            res.status(403).json({
                status: 'error',
                message: 'Unauthorized',
            });
            return;
        }
        if (amount <= 0 || amount > loan.amountOutstanding) {
            res.status(400).json({
                status: 'error',
                message: 'Invalid repayment amount',
            });
            return;
        }
        // Process repayment
        await db.runTransaction(async (transaction) => {
            var _a;
            const walletRef = db.collection('wallets').doc(uid);
            const wallet = await transaction.get(walletRef);
            if (!wallet.exists || (((_a = wallet.data()) === null || _a === void 0 ? void 0 : _a.availableBalance) || 0) < amount) {
                throw new Error('Insufficient wallet balance');
            }
            // Debit wallet
            transaction.update(walletRef, {
                balance: admin.firestore.FieldValue.increment(-amount),
                availableBalance: admin.firestore.FieldValue.increment(-amount),
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            // Update loan
            const newOutstanding = (loan.amountOutstanding || 0) - amount;
            transaction.update(loanDoc.ref, {
                amountPaid: admin.firestore.FieldValue.increment(amount),
                amountOutstanding: newOutstanding,
                lastPaymentDate: admin.firestore.FieldValue.serverTimestamp(),
                status: newOutstanding === 0 ? 'COMPLETED' : 'ACTIVE',
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            // Create repayment record
            const repaymentRef = db.collection('loanRepayments').doc();
            transaction.set(repaymentRef, {
                loanId,
                amount,
                reference: `REPAY-${Date.now()}`,
                paymentMethod: 'WALLET',
                status: 'COMPLETED',
                paidAt: admin.firestore.FieldValue.serverTimestamp(),
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
            });
        });
        res.status(200).json({
            status: 'success',
            message: 'Loan repayment successful',
        });
    }
    catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message,
        });
    }
});
// Get user loans
router.get('/', auth_1.authenticate, async (req, res) => {
    try {
        const { uid } = req.user;
        const limit = parseInt(req.query.limit) || 20;
        const loansSnapshot = await db.collection('loans')
            .where('userId', '==', uid)
            .orderBy('createdAt', 'desc')
            .limit(limit)
            .get();
        const loans = loansSnapshot.docs.map(doc => (Object.assign({ id: doc.id }, doc.data())));
        res.status(200).json({
            status: 'success',
            data: { loans },
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
//# sourceMappingURL=loan.js.map