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
// Send money to another user
router.post('/send', auth_1.authenticate, async (req, res) => {
    try {
        const { uid } = req.user;
        const { receiverIdentifier, amount, description, category } = req.body;
        if (amount <= 0 || amount > 50000) {
            return res.status(400).json({
                status: 'error',
                message: 'Amount must be between 0 and 50,000',
            });
        }
        // Find receiver
        const receiverSnapshot = await db.collection('users')
            .where('email', '==', receiverIdentifier)
            .limit(1)
            .get();
        if (receiverSnapshot.empty) {
            return res.status(404).json({
                status: 'error',
                message: 'Receiver not found',
            });
        }
        const receiverDoc = receiverSnapshot.docs[0];
        const receiverId = receiverDoc.id;
        if (uid === receiverId) {
            return res.status(400).json({
                status: 'error',
                message: 'Cannot send money to yourself',
            });
        }
        // Use Firestore transaction for atomic operation
        const result = await db.runTransaction(async (transaction) => {
            var _a;
            const senderWalletRef = db.collection('wallets').doc(uid);
            const receiverWalletRef = db.collection('wallets').doc(receiverId);
            const senderWallet = await transaction.get(senderWalletRef);
            const receiverWallet = await transaction.get(receiverWalletRef);
            if (!senderWallet.exists || !receiverWallet.exists) {
                throw new Error('Wallet not found');
            }
            const senderBalance = ((_a = senderWallet.data()) === null || _a === void 0 ? void 0 : _a.availableBalance) || 0;
            if (senderBalance < amount) {
                throw new Error('Insufficient balance');
            }
            // Debit sender
            transaction.update(senderWalletRef, {
                balance: admin.firestore.FieldValue.increment(-amount),
                availableBalance: admin.firestore.FieldValue.increment(-amount),
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            // Credit receiver
            transaction.update(receiverWalletRef, {
                balance: admin.firestore.FieldValue.increment(amount),
                availableBalance: admin.firestore.FieldValue.increment(amount),
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            // Create transfer record
            const transferRef = db.collection('p2pTransfers').doc();
            const reference = `P2P-${Date.now()}`;
            transaction.set(transferRef, {
                senderId: uid,
                receiverId,
                reference,
                amount,
                fee: 0,
                totalAmount: amount,
                description,
                category,
                status: 'COMPLETED',
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                completedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            return { transferId: transferRef.id, reference };
        });
        res.status(201).json({
            status: 'success',
            message: 'Money sent successfully',
            data: result,
        });
    }
    catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message,
        });
    }
});
// Get user transfers
router.get('/transfers', auth_1.authenticate, async (req, res) => {
    try {
        const { uid } = req.user;
        const type = req.query.type || 'all';
        const limit = parseInt(req.query.limit) || 20;
        let query = db.collection('p2pTransfers').orderBy('createdAt', 'desc').limit(limit);
        if (type === 'sent') {
            query = query.where('senderId', '==', uid);
        }
        else if (type === 'received') {
            query = query.where('receiverId', '==', uid);
        }
        const snapshot = await query.get();
        const transfers = snapshot.docs.map(doc => (Object.assign({ id: doc.id }, doc.data())));
        res.status(200).json({
            status: 'success',
            data: { transfers },
        });
    }
    catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message,
        });
    }
});
// Search users
router.get('/search-users', auth_1.authenticate, async (req, res) => {
    try {
        const { uid } = req.user;
        const query = req.query.q;
        if (!query || query.length < 2) {
            return res.status(400).json({
                status: 'error',
                message: 'Search query must be at least 2 characters',
            });
        }
        const usersSnapshot = await db.collection('users')
            .where('email', '>=', query)
            .where('email', '<=', query + '\uf8ff')
            .limit(10)
            .get();
        const users = usersSnapshot.docs
            .filter(doc => doc.id !== uid)
            .map(doc => ({
            id: doc.id,
            firstName: doc.data().firstName,
            lastName: doc.data().lastName,
            email: doc.data().email,
            studentId: doc.data().studentId,
        }));
        res.status(200).json({
            status: 'success',
            data: users,
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
//# sourceMappingURL=p2p.js.map