'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export default function WalletPage() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  // State
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState(0);
  const [fundAmount, setFundAmount] = useState('');
  const [processing, setProcessing] = useState(false);

  // Load wallet balance
  useEffect(() => {
    if (user) {
      loadBalance();
    }
  }, [user]);

  // Check for payment callback
  useEffect(() => {
    const ref = searchParams.get('reference');
    if (ref && user) {
      verifyPayment(ref);
    }
  }, [searchParams, user]);

  // Load balance from API
  const loadBalance = async () => {
    try {
      const token = await user?.getIdToken();
      const response = await fetch('/api/wallet', {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      console.log('✅ Balance loaded:', data);

      if (data.success) {
        setBalance(data.data.balance || 0);
      } else {
        toast.error(data.message || 'Failed to load balance');
      }
    } catch (error) {
      console.error('❌ Load balance error:', error);
      toast.error('Failed to load balance');
    } finally {
      setLoading(false);
    }
  };

  // Fund wallet via Paystack
  const handleFundWallet = async (e: React.FormEvent) => {
    e.preventDefault();

    const amount = parseFloat(fundAmount);
    if (!amount || amount < 100) {
      toast.error('Minimum amount is ₦100');
      return;
    }

    if (amount > 1000000) {
      toast.error('Maximum amount is ₦1,000,000');
      return;
    }

    setProcessing(true);

    try {
      const token = await user?.getIdToken();
      console.log('💳 Initiating payment for ₦' + amount);

      const response = await fetch('/api/wallet/fund', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount,
          callbackUrl: `${window.location.origin}/dashboard/wallet`,
        }),
      });

      const data = await response.json();
      console.log('✅ Fund response:', data);

      if (data.success && data.data.authorizationUrl) {
        console.log('🔄 Redirecting to Paystack...');
        window.location.href = data.data.authorizationUrl;
      } else {
        console.error('❌ Fund failed:', data);
        toast.error(data.message || 'Failed to initialize payment');
        setProcessing(false);
      }
    } catch (error) {
      console.error('❌ Fund error:', error);
      toast.error('Failed to fund wallet');
      setProcessing(false);
    }
  };

  // Verify payment after Paystack redirect
  const verifyPayment = async (reference: string) => {
    console.log('🔍 Verifying payment:', reference);

    try {
      const token = await user?.getIdToken();
      const response = await fetch(`/api/wallet/verify/${reference}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      console.log('✅ Verify response:', data);

      if (data.success) {
        toast.success('✅ Wallet funded successfully!');
        loadBalance();
      } else {
        toast.error(data.message || 'Payment verification failed');
      }

      // Clean URL
      router.replace('/dashboard/wallet');
    } catch (error) {
      console.error('❌ Verify error:', error);
      toast.error('Verification failed');
      router.replace('/dashboard/wallet');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading wallet...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Wallet</h1>
        <p className="text-gray-600">Powered by Paystack</p>
      </div>

      {/* Balance Card */}
      <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl p-8 text-white mb-8 shadow-xl">
        <p className="text-indigo-100 text-sm mb-2">Available Balance</p>
        <h2 className="text-5xl font-bold mb-2">
          ₦{balance.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </h2>
        <p className="text-indigo-200 text-sm">Nigerian Naira (NGN)</p>
      </div>

      {/* Fund Wallet Card */}
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-gray-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-indigo-100 p-3 rounded-lg">
            <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <h3 className="text-xl font-bold">Fund Wallet</h3>
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
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              required
              min="100"
              max="1000000"
              step="any"
              disabled={processing}
            />
            <p className="text-xs text-gray-500 mt-1">Min: ₦100 | Max: ₦1,000,000</p>
          </div>

          {/* Quick amount buttons */}
          <div className="grid grid-cols-3 gap-2">
            {[1000, 5000, 10000].map((amt) => (
              <button
                key={amt}
                type="button"
                onClick={() => setFundAmount(amt.toString())}
                className={`py-2 px-4 border-2 rounded-lg font-medium transition-all ${
                  fundAmount === amt.toString()
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                    : 'border-gray-200 text-gray-700 hover:border-indigo-300 hover:bg-indigo-50'
                }`}
                disabled={processing}
              >
                ₦{amt.toLocaleString()}
              </button>
            ))}
          </div>

          {/* Paystack info */}
          <div className="bg-indigo-50 rounded-lg p-3 border border-indigo-100">
            <div className="flex items-start gap-2">
              <svg className="w-5 h-5 text-indigo-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <div className="text-xs text-indigo-900">
                <p className="font-semibold">Secure Payment via Paystack</p>
                <p className="text-indigo-700 mt-1">You'll be redirected to Paystack's secure checkout</p>
              </div>
            </div>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={processing}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
          >
            {processing ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Redirecting to Paystack...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
                Continue to Paystack
              </span>
            )}
          </button>
        </form>
      </div>

      {/* Debug Info */}
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <p className="text-xs font-mono text-gray-600 mb-1">
          🔐 User: {user?.email || 'Not logged in'}
        </p>
        <p className="text-xs font-mono text-gray-600 mb-1">
          💰 Balance: ₦{balance.toLocaleString()}
        </p>
        <p className="text-xs font-mono text-gray-600">
          🌐 API: /api/wallet
        </p>
      </div>
    </div>
  );
}
