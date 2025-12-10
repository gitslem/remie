'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import axios from 'axios';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

interface WalletData {
  balance: number;
  availableBalance: number;
  ledgerBalance: number;
  currency: string;
  dailyLimit: number;
  monthlyLimit: number;
  isActive: boolean;
  isFrozen: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Transaction {
  id: string;
  reference: string;
  amount: number;
  type: string;
  method: string;
  status: string;
  description?: string;
  createdAt: string;
}

interface Bank {
  id: number;
  name: string;
  code: string;
}

export default function WalletPage() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [loading, setLoading] = useState(true);
  const [fundAmount, setFundAmount] = useState('');
  const [showFundModal, setShowFundModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawData, setWithdrawData] = useState({
    amount: '',
    accountNumber: '',
    bankCode: '',
    accountName: '',
    reason: '',
  });
  const [verifyingAccount, setVerifyingAccount] = useState(false);
  const [fundingWallet, setFundingWallet] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);

  useEffect(() => {
    if (user) {
      fetchWallet();
      fetchTransactions();
      fetchBanks();
    }
  }, [user]);

  // Handle Paystack callback
  useEffect(() => {
    const reference = searchParams.get('reference');
    if (reference) {
      verifyPayment(reference);
    }
  }, [searchParams]);

  const fetchWallet = async () => {
    try {
      const token = await user?.getIdToken();
      const response = await axios.get(`${API_URL}/wallet`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setWallet(response.data.data);
    } catch (error: any) {
      console.error('Error fetching wallet:', error);
      toast.error('Failed to load wallet');
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async () => {
    try {
      const token = await user?.getIdToken();
      const response = await axios.get(`${API_URL}/wallet/transactions`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { page: 1, limit: 10 },
      });
      setTransactions(response.data.data || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  };

  const fetchBanks = async () => {
    try {
      const token = await user?.getIdToken();
      const response = await axios.get(`${API_URL}/wallet/banks`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBanks(response.data.data || []);
    } catch (error) {
      console.error('Error fetching banks:', error);
    }
  };

  const handleFundWallet = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(fundAmount);

    if (isNaN(amount) || amount < 100) {
      toast.error('Minimum funding amount is ₦100');
      return;
    }

    if (amount > 1000000) {
      toast.error('Maximum funding amount is ₦1,000,000');
      return;
    }

    setFundingWallet(true);

    try {
      const token = await user?.getIdToken();
      const callbackUrl = `${window.location.origin}/dashboard/wallet`;

      const response = await axios.post(
        `${API_URL}/wallet/fund`,
        { amount, callbackUrl },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const { authorizationUrl } = response.data.data;

      // Redirect to Paystack
      window.location.href = authorizationUrl;
    } catch (error: any) {
      console.error('Error initiating payment:', error);
      toast.error(error.response?.data?.message || 'Failed to initiate payment');
      setFundingWallet(false);
    }
  };

  const verifyPayment = async (reference: string) => {
    try {
      const token = await user?.getIdToken();
      const response = await axios.get(`${API_URL}/wallet/verify/${reference}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        toast.success('Wallet funded successfully!');
        fetchWallet();
        fetchTransactions();
        // Remove reference from URL
        router.replace('/dashboard/wallet');
      } else {
        toast.error('Payment verification failed');
      }
    } catch (error: any) {
      console.error('Error verifying payment:', error);
      toast.error(error.response?.data?.message || 'Payment verification failed');
      router.replace('/dashboard/wallet');
    }
  };

  const handleVerifyAccount = async () => {
    if (!withdrawData.accountNumber || !withdrawData.bankCode) {
      toast.error('Please enter account number and select bank');
      return;
    }

    if (withdrawData.accountNumber.length !== 10) {
      toast.error('Account number must be 10 digits');
      return;
    }

    setVerifyingAccount(true);

    try {
      const token = await user?.getIdToken();
      const response = await axios.post(
        `${API_URL}/wallet/resolve-account`,
        {
          accountNumber: withdrawData.accountNumber,
          bankCode: withdrawData.bankCode,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const { account_name } = response.data.data;
      setWithdrawData({ ...withdrawData, accountName: account_name });
      toast.success(`Account verified: ${account_name}`);
    } catch (error: any) {
      console.error('Error verifying account:', error);
      toast.error(error.response?.data?.message || 'Failed to verify account');
    } finally {
      setVerifyingAccount(false);
    }
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(withdrawData.amount);

    if (isNaN(amount) || amount < 100) {
      toast.error('Minimum withdrawal amount is ₦100');
      return;
    }

    if (amount > (wallet?.availableBalance || 0)) {
      toast.error('Insufficient balance');
      return;
    }

    if (!withdrawData.accountName) {
      toast.error('Please verify the account first');
      return;
    }

    setWithdrawing(true);

    try {
      const token = await user?.getIdToken();
      await axios.post(
        `${API_URL}/wallet/withdraw`,
        {
          amount,
          bankAccount: {
            accountNumber: withdrawData.accountNumber,
            bankCode: withdrawData.bankCode,
            accountName: withdrawData.accountName,
          },
          reason: withdrawData.reason,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success('Withdrawal initiated successfully!');
      setShowWithdrawModal(false);
      setWithdrawData({
        amount: '',
        accountNumber: '',
        bankCode: '',
        accountName: '',
        reason: '',
      });
      fetchWallet();
      fetchTransactions();
    } catch (error: any) {
      console.error('Error withdrawing:', error);
      toast.error(error.response?.data?.message || 'Withdrawal failed');
    } finally {
      setWithdrawing(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'PROCESSING':
        return 'bg-blue-100 text-blue-800';
      case 'FAILED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    if (type === 'WALLET_FUNDING') return '↓';
    if (type === 'WITHDRAWAL') return '↑';
    return '•';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 px-4 sm:px-6 lg:px-8 py-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Wallet</h1>
          <p className="text-gray-600 mt-1">Manage your funds with Paystack</p>
        </div>
        <Link
          href="/dashboard/wallet/transactions"
          className="text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-2"
        >
          View All Transactions
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>

      {/* Balance Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Available Balance - Primary Card */}
        <div className="md:col-span-2 bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-700 rounded-2xl p-8 text-white shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-indigo-100 text-sm mb-1">Available Balance</p>
              <h2 className="text-5xl font-bold mb-2">
                ₦{wallet?.availableBalance?.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
              </h2>
              <p className="text-indigo-200 text-sm">
                Total Balance: ₦{wallet?.balance?.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm p-4 rounded-xl">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={() => setShowFundModal(true)}
              className="flex-1 bg-white text-indigo-700 px-6 py-3 rounded-xl font-semibold hover:bg-indigo-50 transition-all transform hover:scale-105 shadow-lg flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Fund Wallet
            </button>
            <button
              onClick={() => setShowWithdrawModal(true)}
              disabled={!wallet?.availableBalance || wallet?.availableBalance <= 0}
              className="flex-1 bg-indigo-800/50 backdrop-blur-sm text-white px-6 py-3 rounded-xl font-semibold hover:bg-indigo-800/70 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Withdraw
            </button>
          </div>
        </div>

        {/* Wallet Status Card */}
        <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Wallet Status
          </h3>
          <div className="space-y-3">
            <StatusItem
              label="Status"
              value={wallet?.isFrozen ? 'Frozen' : wallet?.isActive ? 'Active' : 'Inactive'}
              color={wallet?.isFrozen ? 'red' : wallet?.isActive ? 'green' : 'gray'}
            />
            <StatusItem
              label="Currency"
              value={wallet?.currency || 'NGN'}
              color="blue"
            />
            <div className="pt-3 border-t border-gray-200">
              <p className="text-xs text-gray-600 mb-1">Daily Limit</p>
              <p className="text-sm font-semibold text-gray-900">₦{wallet?.dailyLimit?.toLocaleString() || '0'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600 mb-1">Monthly Limit</p>
              <p className="text-sm font-semibold text-gray-900">₦{wallet?.monthlyLimit?.toLocaleString() || '0'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Recent Transactions
          </h2>
          {transactions.length > 0 && (
            <Link
              href="/dashboard/wallet/transactions"
              className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
            >
              See All
            </Link>
          )}
        </div>
        {transactions.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <svg
              className="w-16 h-16 mx-auto mb-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            <p>No transactions yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {transactions.map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-indigo-200 transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-xl shadow-sm ${
                    transaction.type === 'WALLET_FUNDING'
                      ? 'bg-green-100 text-green-600'
                      : 'bg-red-100 text-red-600'
                  }`}>
                    {getTypeIcon(transaction.type)}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
                      {transaction.type.replace(/_/g, ' ')}
                    </p>
                    <p className="text-sm text-gray-600">
                      {new Date(transaction.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p
                    className={`text-lg font-bold mb-1 ${
                      transaction.type === 'WALLET_FUNDING'
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}
                  >
                    {transaction.type === 'WALLET_FUNDING' ? '+' : '-'}₦
                    {transaction.amount.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                  <span className={`text-xs px-3 py-1 rounded-full font-medium ${getStatusColor(transaction.status)}`}>
                    {transaction.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Fund Wallet Modal */}
      {showFundModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl transform transition-all animate-slideUp">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="bg-indigo-100 p-3 rounded-xl">
                  <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900">Fund Wallet</h3>
              </div>
              <button
                onClick={() => setShowFundModal(false)}
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-lg transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mb-6 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-100">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-indigo-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <div>
                  <p className="text-sm font-semibold text-indigo-900">Secure Payment via Paystack</p>
                  <p className="text-xs text-indigo-700 mt-1">
                    You'll be securely redirected to Paystack to complete your payment with your card.
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleFundWallet} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount (₦)
                </label>
                <input
                  type="number"
                  value={fundAmount}
                  onChange={(e) => setFundAmount(e.target.value)}
                  placeholder="Enter amount"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                  min="100"
                  max="1000000"
                  step="0.01"
                />
                <p className="text-xs text-gray-500 mt-1">Min: ₦100 | Max: ₦1,000,000</p>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {[1000, 5000, 10000, 20000, 50000, 100000].map((amount) => (
                  <button
                    key={amount}
                    type="button"
                    onClick={() => setFundAmount(amount.toString())}
                    className={`py-3 px-4 border-2 rounded-xl text-sm font-semibold transition-all transform hover:scale-105 ${
                      fundAmount === amount.toString()
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                        : 'border-gray-200 text-gray-700 hover:border-indigo-300 hover:bg-indigo-50'
                    }`}
                  >
                    ₦{(amount / 1000).toFixed(0)}k
                  </button>
                ))}
              </div>

              <button
                type="submit"
                disabled={fundingWallet}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all transform hover:scale-105 disabled:opacity-50 disabled:transform-none shadow-lg flex items-center justify-center gap-2"
              >
                {fundingWallet ? (
                  <>
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Redirecting to Paystack...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                    Continue to Paystack
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Withdraw Modal */}
      {showWithdrawModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full my-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900">Withdraw Funds</h3>
              <button
                onClick={() => {
                  setShowWithdrawModal(false);
                  setWithdrawData({
                    amount: '',
                    accountNumber: '',
                    bankCode: '',
                    accountName: '',
                    reason: '',
                  });
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleWithdraw} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount (₦)
                </label>
                <input
                  type="number"
                  value={withdrawData.amount}
                  onChange={(e) => setWithdrawData({ ...withdrawData, amount: e.target.value })}
                  placeholder="Enter amount"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                  min="100"
                  max={wallet?.availableBalance || 0}
                  step="0.01"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Available: ₦{wallet?.availableBalance?.toLocaleString() || '0'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Bank</label>
                <select
                  value={withdrawData.bankCode}
                  onChange={(e) => {
                    setWithdrawData({ ...withdrawData, bankCode: e.target.value, accountName: '' });
                  }}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                >
                  <option value="">Select Bank</option>
                  {banks.map((bank) => (
                    <option key={bank.code} value={bank.code}>
                      {bank.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Account Number
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={withdrawData.accountNumber}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                      setWithdrawData({ ...withdrawData, accountNumber: value, accountName: '' });
                    }}
                    placeholder="0123456789"
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                    maxLength={10}
                  />
                  <button
                    type="button"
                    onClick={handleVerifyAccount}
                    disabled={
                      verifyingAccount ||
                      !withdrawData.accountNumber ||
                      !withdrawData.bankCode ||
                      withdrawData.accountNumber.length !== 10
                    }
                    className="px-4 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition disabled:opacity-50"
                  >
                    {verifyingAccount ? '...' : 'Verify'}
                  </button>
                </div>
                {withdrawData.accountName && (
                  <p className="text-sm text-green-600 mt-2">✓ {withdrawData.accountName}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason (Optional)
                </label>
                <input
                  type="text"
                  value={withdrawData.reason}
                  onChange={(e) => setWithdrawData({ ...withdrawData, reason: e.target.value })}
                  placeholder="Purpose of withdrawal"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <button
                type="submit"
                disabled={withdrawing || !withdrawData.accountName}
                className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition disabled:opacity-50"
              >
                {withdrawing ? 'Processing...' : 'Withdraw Funds'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-l-4 border-indigo-600 pl-4">
      <p className="text-sm text-gray-600">{label}</p>
      <p className="font-semibold text-gray-900">{value}</p>
    </div>
  );
}

function StatusItem({ label, value, color }: { label: string; value: string; color: string }) {
  const colorClasses = {
    green: 'bg-green-100 text-green-800',
    red: 'bg-red-100 text-red-800',
    blue: 'bg-blue-100 text-blue-800',
    gray: 'bg-gray-100 text-gray-800',
  }[color] || 'bg-gray-100 text-gray-800';

  return (
    <div className="flex items-center justify-between">
      <p className="text-xs text-gray-600">{label}</p>
      <span className={`text-xs px-3 py-1 rounded-full font-medium ${colorClasses}`}>
        {value}
      </span>
    </div>
  );
}
