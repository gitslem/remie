'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import axios from 'axios';

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
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Balance Card */}
      <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-2xl p-8 text-white">
        <p className="text-indigo-200 text-sm mb-2">Available Balance</p>
        <h1 className="text-5xl font-bold mb-2">
          ₦{wallet?.availableBalance?.toLocaleString() || '0.00'}
        </h1>
        <p className="text-indigo-200 text-sm mb-6">
          Total: ₦{wallet?.balance?.toLocaleString() || '0.00'}
        </p>
        <div className="flex gap-4">
          <button
            onClick={() => setShowFundModal(true)}
            className="bg-white text-indigo-600 px-6 py-3 rounded-lg font-semibold hover:bg-indigo-50 transition"
          >
            + Fund Wallet
          </button>
          <button
            onClick={() => setShowWithdrawModal(true)}
            className="bg-indigo-700 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-800 transition"
          >
            Withdraw
          </button>
        </div>
      </div>

      {/* Wallet Info */}
      <div className="bg-white rounded-2xl shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Wallet Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InfoItem label="Currency" value={wallet?.currency || 'NGN'} />
          <InfoItem
            label="Status"
            value={wallet?.isFrozen ? 'Frozen' : wallet?.isActive ? 'Active' : 'Inactive'}
          />
          <InfoItem
            label="Daily Limit"
            value={`₦${wallet?.dailyLimit?.toLocaleString() || '0'}`}
          />
          <InfoItem
            label="Monthly Limit"
            value={`₦${wallet?.monthlyLimit?.toLocaleString() || '0'}`}
          />
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-2xl shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Transactions</h2>
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
          <div className="space-y-3">
            {transactions.map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                    {getTypeIcon(transaction.type)}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">
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
                    className={`font-bold ${
                      transaction.type === 'WALLET_FUNDING'
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}
                  >
                    {transaction.type === 'WALLET_FUNDING' ? '+' : '-'}₦
                    {transaction.amount.toLocaleString()}
                  </p>
                  <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(transaction.status)}`}>
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900">Fund Wallet</h3>
              <button
                onClick={() => setShowFundModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mb-4 p-4 bg-indigo-50 rounded-lg">
              <p className="text-sm text-indigo-900">
                <strong>💳 Secure Payment</strong>
              </p>
              <p className="text-xs text-indigo-700 mt-1">
                You'll be redirected to Paystack to complete your payment securely.
              </p>
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

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setFundAmount('1000')}
                  className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-gray-900 hover:bg-gray-50"
                >
                  ₦1,000
                </button>
                <button
                  type="button"
                  onClick={() => setFundAmount('5000')}
                  className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-gray-900 hover:bg-gray-50"
                >
                  ₦5,000
                </button>
                <button
                  type="button"
                  onClick={() => setFundAmount('10000')}
                  className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-gray-900 hover:bg-gray-50"
                >
                  ₦10,000
                </button>
              </div>

              <button
                type="submit"
                disabled={fundingWallet}
                className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition disabled:opacity-50"
              >
                {fundingWallet ? 'Redirecting to Paystack...' : 'Continue to Payment'}
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
