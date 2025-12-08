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
exports.authenticate = void 0;
const express_1 = require("express");
const admin = __importStar(require("firebase-admin"));
const router = (0, express_1.Router)();
const db = admin.firestore();
const auth = admin.auth();
// Middleware to verify Firebase token
const authenticate = async (req, res, next) => {
    var _a;
    try {
        const token = (_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.split('Bearer ')[1];
        if (!token) {
            res.status(401).json({
                status: 'error',
                message: 'Authentication token required',
            });
            return;
        }
        const decodedToken = await auth.verifyIdToken(token);
        req.user = {
            uid: decodedToken.uid,
            email: decodedToken.email,
        };
        next();
    }
    catch (error) {
        res.status(401).json({
            status: 'error',
            message: 'Invalid or expired token',
        });
    }
};
exports.authenticate = authenticate;
// Create user profile after Firebase Auth registration
router.post('/create-profile', exports.authenticate, async (req, res) => {
    try {
        const { uid } = req.user;
        const { firstName, lastName, phoneNumber, studentId, institution } = req.body;
        // Create user document
        await db.collection('users').doc(uid).set({
            email: req.user.email,
            firstName,
            lastName,
            phoneNumber,
            studentId,
            institution,
            role: 'STUDENT',
            status: 'PENDING_VERIFICATION',
            emailVerified: false,
            phoneVerified: false,
            kycVerified: false,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        // Create wallet
        await db.collection('wallets').doc(uid).set({
            userId: uid,
            balance: 0,
            ledgerBalance: 0,
            availableBalance: 0,
            usdtBalance: 0,
            usdcBalance: 0,
            dailyLimit: 100000,
            monthlyLimit: 500000,
            isActive: true,
            isFrozen: false,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        res.status(201).json({
            status: 'success',
            message: 'Profile created successfully',
        });
    }
    catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message,
        });
    }
});
// Get user profile
router.get('/profile', exports.authenticate, async (req, res) => {
    try {
        const { uid } = req.user;
        const userDoc = await db.collection('users').doc(uid).get();
        if (!userDoc.exists) {
            res.status(404).json({
                status: 'error',
                message: 'User profile not found',
            });
            return;
        }
        res.status(200).json({
            status: 'success',
            data: userDoc.data(),
        });
    }
    catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message,
        });
    }
});
// Update user profile
router.put('/profile', exports.authenticate, async (req, res) => {
    try {
        const { uid } = req.user;
        const updates = req.body;
        // Remove sensitive fields
        delete updates.role;
        delete updates.status;
        delete updates.emailVerified;
        await db.collection('users').doc(uid).update(Object.assign(Object.assign({}, updates), { updatedAt: admin.firestore.FieldValue.serverTimestamp() }));
        res.status(200).json({
            status: 'success',
            message: 'Profile updated successfully',
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
//# sourceMappingURL=auth.js.map