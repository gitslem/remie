'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import toast from 'react-hot-toast';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function P2PPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [wallet, setWallet] = useState<any>(null);
  const [formData, setFormData] = useState({
    receiverEmail: '',
    amount: '',
    description: '',
  });

  useEffect(() => {
    if (user) {
      fetchWallet();
    }
  }, [user]);

  const fetchWallet = async () => {
    if (!db || !user) return;
    const walletDoc = await getDoc(doc(db, 'wallets', user.uid));
    if (walletDoc.exists()) {
      setWallet(walletDoc.data());
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = await user?.getIdToken();
      const response = await axios.post(
        `${API_URL}/p2p/send`,
        {
          receiverEmail: formData.receiverEmail,
          amount: parseFloat(formData.amount),
          description: formData.description,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      toast.success('Money sent successfully!');
      setFormData({ receiverEmail: '', amount: '', description: '' });
      fetchWallet();
    } catch (error: any) {
      console.error('Error sending money:', error);
      toast.error(error.response?.data?.message || 'Failed to send money');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Balance Display */}
      <div className="bg-indigo-600 rounded-2xl p-6 text-white">
        <p className="text-indigo-200 text-sm mb-1">Available Balance</p>
        <p className="text-3xl font-bold">₦{wallet?.balance?.toLocaleString() || '0'}</p>
      </div>

      {/* Transfer Form */}
      <div className="bg-white rounded-2xl shadow-md p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Send Money</h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Recipient Email
            </label>
            <input
              type="email"
              value={formData.receiverEmail}
              onChange={(e) => setFormData({ ...formData, receiverEmail: e.target.value })}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="recipient@example.com"
            />
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
              max={wallet?.balance || 0}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="5000"
            />
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
            disabled={loading || !wallet || wallet.balance === 0}
            className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition disabled:opacity-50"
          >
            {loading ? 'Sending...' : 'Send Money'}
          </button>
        </form>
      </div>

      {/* Recent Transfers */}
      <div className="bg-white rounded-2xl shadow-md p-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Transfers</h2>
        <div className="text-center py-8 text-gray-500">
          <p>No recent transfers</p>
        </div>
      </div>
    </div>
  );
}
