import axios, { AxiosInstance, AxiosError } from 'axios';
import { getIdToken } from 'firebase/auth';
import { auth as firebaseAuth } from './firebase';

// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Request interceptor to add Firebase ID token
api.interceptors.request.use(
  async (config) => {
    try {
      // Get current Firebase user and ID token
      const user = firebaseAuth?.currentUser;
      if (user) {
        const token = await getIdToken(user);
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
    } catch (error) {
      console.error('Failed to get Firebase ID token:', error);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Redirect to login if unauthorized
      window.location.href = '/auth/login';
    }
    return Promise.reject(error);
  }
);

// API Endpoints

// Auth
export const auth = {
  register: (data: any) => api.post('/auth/register', data),
  login: (data: any) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
};

// Wallet
export const wallet = {
  getBalance: () => api.get('/wallet'),
  fund: (amount: number, callbackUrl?: string) =>
    api.post('/wallet/fund', { amount, callbackUrl }),
  verifyFunding: (reference: string) => api.get(`/wallet/verify/${reference}`),
  withdraw: (data: {
    amount: number;
    bankAccount: {
      accountNumber: string;
      bankCode: string;
      accountName?: string;
    };
    reason?: string;
  }) => api.post('/wallet/withdraw', data),
  getTransactions: (page = 1, limit = 20) =>
    api.get('/wallet/transactions', { params: { page, limit } }),
  getBanks: () => api.get('/wallet/banks'),
  resolveAccount: (accountNumber: string, bankCode: string) =>
    api.post('/wallet/resolve-account', { accountNumber, bankCode }),
};

// Remittance
export const remittance = {
  getRates: () => api.get('/remittance/rates'),
  calculate: (amount: number, fromCurrency: string, toCurrency: string) =>
    api.post('/remittance/calculate', { amount, fromCurrency, toCurrency }),
  send: (data: {
    recipientEmail: string;
    recipientName: string;
    recipientPhone?: string;
    amount: number;
    country: string;
    relationship: string;
    purpose: string;
  }) => api.post('/remittance/send', data),
  getSent: (page = 1, limit = 20) =>
    api.get('/remittance/sent', { params: { page, limit } }),
  getReceived: (page = 1, limit = 20) =>
    api.get('/remittance/received', { params: { page, limit } }),
};

// RRR Payments
export const rrr = {
  generate: (data: {
    amount: number;
    paymentType: string;
    institution: string;
    institutionCode: string;
    description: string;
  }) => api.post('/rrr/generate', data),
  verify: (rrrCode: string) => api.get(`/rrr/verify/${rrrCode}`),
  getDetails: (rrrCode: string) => api.get(`/rrr/${rrrCode}`),
  getAll: (page = 1, limit = 20) => api.get('/rrr', { params: { page, limit } }),
};

// P2P Transfers
export const p2p = {
  send: (data: {
    recipientIdentifier: string;
    amount: number;
    category?: string;
    note?: string;
  }) => api.post('/p2p/send', data),
  getTransfers: (page = 1, limit = 20) =>
    api.get('/p2p/transfers', { params: { page, limit } }),
  getTransfer: (reference: string) => api.get(`/p2p/transfers/${reference}`),
  searchUsers: (query: string) => api.get('/p2p/search-users', { params: { query } }),
};

// Loans
export const loans = {
  apply: (data: { amount: number; tenure: number; purpose: string }) =>
    api.post('/loans/apply', data),
  repay: (loanId: string, amount: number) =>
    api.post(`/loans/${loanId}/repay`, { amount }),
  getAll: (page = 1, limit = 20) => api.get('/loans', { params: { page, limit } }),
  getOne: (loanId: string) => api.get(`/loans/${loanId}`),
};

// Receipts
export const receipts = {
  getAll: (page = 1, limit = 20) => api.get('/receipts', { params: { page, limit } }),
  getOne: (receiptNumber: string) => api.get(`/receipts/${receiptNumber}`),
  download: (receiptNumber: string) =>
    api.get(`/receipts/${receiptNumber}/download`, { responseType: 'blob' }),
};

// Admin
export const admin = {
  // Dashboard stats
  getStats: () => api.get('/admin/stats'),
  getActivities: (limit = 50) => api.get('/admin/activities', { params: { limit } }),

  // User management
  getUsers: (params?: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
  }) => api.get('/admin/users', { params }),
  getPendingApprovals: () => api.get('/admin/users/pending-approval'),
  getUserDetails: (userId: string) => api.get(`/admin/users/${userId}`),

  // User approval
  approveUser: (userId: string) => api.post(`/admin/users/${userId}/approve`),
  rejectUser: (userId: string) => api.post(`/admin/users/${userId}/reject`),

  // User status management
  suspendUser: (userId: string) => api.post(`/admin/users/${userId}/suspend`),
  activateUser: (userId: string) => api.post(`/admin/users/${userId}/activate`),
  deactivateUser: (userId: string) => api.post(`/admin/users/${userId}/deactivate`),

  // Wallet limits management
  updateLimits: (userId: string, data: {
    dailyLimit?: number;
    monthlyLimit?: number;
  }) => api.put(`/admin/users/${userId}/limits`, data),
};

export default api;
