'use client';

import { useAuth } from '@/contexts/AuthContext';
import { getIdToken } from 'firebase/auth';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

interface WalletBalance {
  balance: number;
  availableBalance: number;
}

interface Transfer {
  id: string;
  reference: string;
  amount: number;
  receiverEmail: string;
  receiverName: string;
  description?: string;
  status: string;
  createdAt: string;
}

export default function P2PPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [wallet, setWallet] = useState<WalletBalance | null>(null);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [formData, setFormData] = useState({
    receiverEmail: '',
    amount: '',
    description: '',
  });

  useEffect(() => {
    if (user) {
      fetchWallet();
      fetchTransfers();
    }
  }, [user]);

  const fetchWallet = async () => {
    try {
      const token = user ? await getIdToken(user) : null;
      const response = await axios.get(`${API_URL}/wallet`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      // Handle both data.data and direct data response
      const walletData = response.data.data || response.data;
      setWallet({
        balance: walletData.balance || 0,
        availableBalance: walletData.availableBalance || 0
      });
    } catch (error) {
      console.error('Error fetching wallet:', error);
      setWallet({ balance: 0, availableBalance: 0 });
    }
  };

  const fetchTransfers = async () => {
    try {
      const token = user ? await getIdToken(user) : null;
      const response = await axios.get(`${API_URL}/p2p/transfers`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { page: 1, limit: 10 },
      });
      setTransfers(response.data.data?.transfers || []);
    } catch (error) {
      console.error('Error fetching transfers:', error);
      setTransfers([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const amount = parseFloat(formData.amount);

    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid amount');
      setLoading(false);
      return;
    }

    if (amount > (wallet?.availableBalance || 0)) {
      toast.error('Insufficient balance');
      setLoading(false);
      return;
    }

    try {
      const token = user ? await getIdToken(user) : null;
      await axios.post(
        `${API_URL}/p2p/send`,
        {
          recipientIdentifier: formData.receiverEmail,
          amount,
          note: formData.description,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      toast.success('Money sent successfully!');
      setFormData({ receiverEmail: '', amount: '', description: '' });
      fetchWallet();
      fetchTransfers();
    } catch (error: any) {
      console.error('Error sending money:', error);
      toast.error(error.response?.data?.message || 'Failed to send money');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'FAILED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Info Banner */}
      <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-6">
        <div className="flex items-start">
          <span className="text-2xl mr-3">💸</span>
          <div>
            <h3 className="font-semibold text-indigo-900 mb-1">Peer-to-Peer Transfers</h3>
            <p className="text-sm text-indigo-700">
              Send money instantly to other REMIE users using their email address or nickname. Transfers are instant and free!
            </p>
          </div>
        </div>
      </div>

      {/* Balance Display */}
      <div className="bg-indigo-600 rounded-2xl p-6 text-white">
        <p className="text-indigo-200 text-sm mb-1">Available Balance</p>
        <p className="text-3xl font-bold">₦{wallet?.availableBalance?.toLocaleString() || '0'}</p>
      </div>

      {/* Transfer Form */}
      <div className="bg-white rounded-2xl shadow-md p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Send Money</h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Recipient Email or Nickname
            </label>
            <input
              type="text"
              value={formData.receiverEmail}
              onChange={(e) => setFormData({ ...formData, receiverEmail: e.target.value })}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="recipient@example.com or @nickname"
            />
            <p className="text-xs text-gray-500 mt-1">
              Enter recipient's email address or nickname (e.g., @john)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Amount (₦)
            </label>
            <input
              type="number"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              required
              min="1"
              max={wallet?.availableBalance || 0}
              step="0.01"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="5000"
            />
            <p className="text-xs text-gray-500 mt-1">
              Available: ₦{wallet?.availableBalance?.toLocaleString() || '0'}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description (Optional)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="What's this payment for?"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !wallet || wallet.availableBalance === 0}
            className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition disabled:opacity-50"
          >
            {loading ? 'Sending...' : 'Send Money'}
          </button>
        </form>
      </div>

      {/* Recent Transfers */}
      <div className="bg-white rounded-2xl shadow-md p-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Transfers</h2>
        {transfers.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
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
                d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
              />
            </svg>
            <p>No recent transfers</p>
          </div>
        ) : (
          <div className="space-y-3">
            {transfers.map((transfer) => (
              <div
                key={transfer.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
              >
                <div>
                  <p className="font-semibold text-gray-900">
                    {transfer.receiverName || transfer.receiverEmail}
                  </p>
                  <p className="text-sm text-gray-600">
                    {new Date(transfer.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                  {transfer.description && (
                    <p className="text-sm text-gray-500 mt-1">{transfer.description}</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="font-bold text-red-600">
                    -₦{transfer.amount.toLocaleString()}
                  </p>
                  <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(transfer.status)}`}>
                    {transfer.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
