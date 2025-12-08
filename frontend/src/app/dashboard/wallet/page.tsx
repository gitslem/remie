'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { doc, getDoc, updateDoc, increment } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import toast from 'react-hot-toast';

export default function WalletPage() {
  const { user } = useAuth();
  const [wallet, setWallet] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [fundAmount, setFundAmount] = useState('');
  const [showFundModal, setShowFundModal] = useState(false);

  useEffect(() => {
    if (user) {
      fetchWallet();
    }
  }, [user]);

  const fetchWallet = async () => {
    try {
      const walletDoc = await getDoc(doc(db, 'wallets', user!.uid));
      if (walletDoc.exists()) {
        setWallet({ id: walletDoc.id, ...walletDoc.data() });
      }
    } catch (error) {
      console.error('Error fetching wallet:', error);
      toast.error('Failed to load wallet');
    } finally {
      setLoading(false);
    }
  };

  const handleFundWallet = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(fundAmount);

    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    try {
      // In production, this would integrate with a payment gateway
      // For now, we'll simulate adding funds
      const walletRef = doc(db, 'wallets', user!.uid);
      await updateDoc(walletRef, {
        balance: increment(amount),
        updatedAt: new Date().toISOString(),
      });

      toast.success(`₦${amount.toLocaleString()} added to wallet`);
      setFundAmount('');
      setShowFundModal(false);
      fetchWallet();
    } catch (error) {
      console.error('Error funding wallet:', error);
      toast.error('Failed to fund wallet');
    }
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
        <p className="text-indigo-200 text-sm mb-2">Total Balance</p>
        <h1 className="text-5xl font-bold mb-6">
          ₦{wallet?.balance?.toLocaleString() || '0.00'}
        </h1>
        <div className="flex gap-4">
          <button
            onClick={() => setShowFundModal(true)}
            className="bg-white text-indigo-600 px-6 py-3 rounded-lg font-semibold hover:bg-indigo-50 transition"
          >
            + Fund Wallet
          </button>
          <button className="bg-indigo-700 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-800 transition">
            Withdraw
          </button>
        </div>
      </div>

      {/* Wallet Info */}
      <div className="bg-white rounded-2xl shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Wallet Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InfoItem label="Wallet ID" value={wallet?.id || 'N/A'} />
          <InfoItem label="Currency" value={wallet?.currency || 'NGN'} />
          <InfoItem
            label="Created"
            value={wallet?.createdAt ? new Date(wallet.createdAt).toLocaleDateString() : 'N/A'}
          />
          <InfoItem
            label="Last Updated"
            value={wallet?.updatedAt ? new Date(wallet.updatedAt).toLocaleDateString() : 'N/A'}
          />
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-2xl shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Activity</h2>
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
          <p>No recent activity</p>
        </div>
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                  min="1"
                  step="0.01"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setFundAmount('1000')}
                  className="flex-1 py-2 px-4 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  ₦1,000
                </button>
                <button
                  type="button"
                  onClick={() => setFundAmount('5000')}
                  className="flex-1 py-2 px-4 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  ₦5,000
                </button>
                <button
                  type="button"
                  onClick={() => setFundAmount('10000')}
                  className="flex-1 py-2 px-4 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  ₦10,000
                </button>
              </div>

              <button
                type="submit"
                className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition"
              >
                Continue to Payment
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
