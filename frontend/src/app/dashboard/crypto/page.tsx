'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';
import toast from 'react-hot-toast';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function CryptoPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    cryptocurrency: 'USDT',
    amount: '',
    purpose: 'SCHOOL_FEES',
    description: '',
  });
  const [paymentDetails, setPaymentDetails] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = await user?.getIdToken();
      const response = await axios.post(
        `${API_URL}/crypto/pay`,
        {
          cryptocurrency: formData.cryptocurrency,
          amount: parseFloat(formData.amount),
          purpose: formData.purpose,
          description: formData.description,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setPaymentDetails(response.data.data);
      toast.success('Crypto payment initiated!');
    } catch (error: any) {
      console.error('Error initiating crypto payment:', error);
      toast.error(error.response?.data?.message || 'Failed to initiate payment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Info Banner */}
      <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-6">
        <div className="flex items-start">
          <span className="text-2xl mr-3">ℹ️</span>
          <div>
            <h3 className="font-semibold text-indigo-900 mb-1">Cryptocurrency Payments</h3>
            <p className="text-sm text-indigo-700">
              Pay your school fees with USDT or USDC. Payments are processed on the Polygon network for low fees and fast confirmations.
            </p>
          </div>
        </div>
      </div>

      {/* Payment Form */}
      <div className="bg-white rounded-2xl shadow-md p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Pay with Cryptocurrency</h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cryptocurrency
              </label>
              <select
                value={formData.cryptocurrency}
                onChange={(e) => setFormData({ ...formData, cryptocurrency: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="USDT">USDT (Tether)</option>
                <option value="USDC">USDC (USD Coin)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount (USD)
              </label>
              <input
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                required
                min="1"
                step="0.01"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="100.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Purpose
              </label>
              <select
                value={formData.purpose}
                onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="SCHOOL_FEES">School Fees</option>
                <option value="ACCOMMODATION">Accommodation</option>
                <option value="BOOKS">Books & Materials</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Payment details..."
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition disabled:opacity-50"
          >
            {loading ? 'Processing...' : 'Continue to Payment'}
          </button>
        </form>
      </div>

      {/* Payment Details */}
      {paymentDetails && (
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-8 border-2 border-purple-200">
          <h3 className="text-xl font-bold text-purple-900 mb-6">Payment Details</h3>

          <div className="bg-white rounded-xl p-6 mb-6">
            <p className="text-sm text-gray-600 mb-2">Send to this address</p>
            <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg mb-4">
              <code className="text-sm font-mono text-gray-900 break-all">{paymentDetails.recipientAddress}</code>
              <button className="ml-4 text-indigo-600 hover:text-indigo-700">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Amount</p>
                <p className="font-semibold">${paymentDetails.amount} {formData.cryptocurrency}</p>
              </div>
              <div>
                <p className="text-gray-600">Network</p>
                <p className="font-semibold">Polygon</p>
              </div>
              <div>
                <p className="text-gray-600">Status</p>
                <p className="font-semibold text-yellow-600">{paymentDetails.status}</p>
              </div>
              <div>
                <p className="text-gray-600">Transaction ID</p>
                <p className="font-semibold text-xs">{paymentDetails.id}</p>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              ⚠️ <strong>Important:</strong> Send exactly the amount specified above. The payment will be automatically confirmed once the transaction is detected on the blockchain.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
