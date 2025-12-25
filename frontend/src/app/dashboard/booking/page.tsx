'use client';

import { useState, useEffect, Suspense } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  CreditCard,
  Wallet,
  Check,
  ArrowLeft,
  Shield,
  Lock,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface Package {
  id: string;
  name: string;
  tier: string;
  description: string;
  price: number;
  duration: number;
  benefits: string[];
  color?: string;
}

function BookingPageContent() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const packageId = searchParams?.get('package');

  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'WALLET' | 'CARD'>('WALLET');
  const [autoRenew, setAutoRenew] = useState(false);
  const [agreeTerm, setAgreeTerms] = useState(false);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (packageId) {
      fetchPackage(packageId);
    } else {
      setLoading(false);
    }
  }, [packageId]);

  const fetchPackage = async (id: string) => {
    try {
      // TODO: Replace with actual API call
      // Simulated data
      const mockPackages: Package[] = [
        {
          id: '1',
          name: 'Free',
          tier: 'FREE',
          description: 'Perfect for getting started with REMIE',
          price: 0,
          duration: 365,
          benefits: [
            'Basic wallet functionality',
            'Send and receive money',
            '5 free transactions per month',
            'Access to public chat channels',
            'Email support',
          ],
          color: '#6B7280',
        },
        {
          id: '2',
          name: 'Basic',
          tier: 'BASIC',
          description: 'Great for active students with regular transactions',
          price: 1500,
          duration: 30,
          benefits: [
            'Everything in Free',
            'Unlimited P2P transfers',
            '50 transactions per month',
            'Access to student communities',
            'Priority email support',
            'Transaction analytics',
          ],
          color: '#8B5CF6',
        },
        {
          id: '3',
          name: 'Premium',
          tier: 'PREMIUM',
          description: 'Maximum features for power users',
          price: 3500,
          duration: 30,
          benefits: [
            'Everything in Basic',
            'Unlimited transactions',
            'Higher loan limits',
            'All chat channels access',
            '24/7 priority support',
            'Advanced analytics',
            'Early access to new features',
            'Custom transaction categories',
          ],
          color: '#EC4899',
        },
        {
          id: '4',
          name: 'Enterprise',
          tier: 'ENTERPRISE',
          description: 'For institutions and organizations',
          price: 0,
          duration: 365,
          benefits: [
            'Everything in Premium',
            'Custom integrations',
            'Dedicated account manager',
            'Custom branding',
            'API access',
            'Bulk payment processing',
            'Custom reporting',
            'SLA guarantee',
          ],
          color: '#F59E0B',
        },
      ];

      const pkg = mockPackages.find((p) => p.id === id);
      if (pkg) {
        setSelectedPackage(pkg);
      }
    } catch (error) {
      console.error('Error fetching package:', error);
      toast.error('Failed to load package details');
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async () => {
    if (!selectedPackage) return;

    if (!agreeTerms) {
      toast.error('Please accept the terms and conditions');
      return;
    }

    if (selectedPackage.tier === 'ENTERPRISE') {
      toast.info('Please contact sales for Enterprise package');
      return;
    }

    setProcessing(true);

    try {
      // TODO: Implement actual subscription logic with API
      await new Promise((resolve) => setTimeout(resolve, 2000)); // Simulated API call

      toast.success('Subscription successful!');
      router.push('/dashboard/packages');
    } catch (error: any) {
      console.error('Subscription error:', error);
      toast.error(error.response?.data?.message || 'Failed to process subscription');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!selectedPackage) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Package Not Found</h2>
        <p className="text-gray-600 mb-6">The selected package could not be found.</p>
        <Link
          href="/dashboard/packages"
          className="inline-flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-indigo-700 transition"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Packages
        </Link>
      </div>
    );
  }

  const isFreeTier = selectedPackage.tier === 'FREE';
  const isEnterpriseTier = selectedPackage.tier === 'ENTERPRISE';

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/packages"
          className="w-10 h-10 bg-white rounded-xl shadow-md flex items-center justify-center hover:shadow-lg transition"
        >
          <ArrowLeft className="w-5 h-5 text-gray-700" />
        </Link>
        <div>
          <h1 className="text-3xl font-black text-gray-900">Complete Your Subscription</h1>
          <p className="text-gray-600">Subscribe to {selectedPackage.name} package</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Order Summary */}
        <div className="lg:col-span-2 space-y-6">
          {/* Package Details Card */}
          <div className="bg-white rounded-3xl shadow-lg p-8">
            <h2 className="text-2xl font-black text-gray-900 mb-6">Package Details</h2>

            <div className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 rounded-2xl p-6 mb-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-2xl font-black text-gray-900">{selectedPackage.name}</h3>
                  <p className="text-gray-600 mt-1">{selectedPackage.description}</p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-black text-gray-900">
                    {isFreeTier || isEnterpriseTier
                      ? 'Free'
                      : `₦${selectedPackage.price.toLocaleString()}`}
                  </p>
                  {!isFreeTier && !isEnterpriseTier && (
                    <p className="text-sm text-gray-600">/{selectedPackage.duration} days</p>
                  )}
                </div>
              </div>

              <div className="space-y-3 mt-6">
                {selectedPackage.benefits.map((benefit, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-3.5 h-3.5 text-white" />
                    </div>
                    <span className="text-gray-700 leading-relaxed">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>

            {!isFreeTier && !isEnterpriseTier && (
              <>
                {/* Payment Method */}
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Payment Method</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => setPaymentMethod('WALLET')}
                      className={`p-4 rounded-2xl border-2 transition-all ${
                        paymentMethod === 'WALLET'
                          ? 'border-indigo-600 bg-indigo-50'
                          : 'border-gray-200 hover:border-indigo-300'
                      }`}
                    >
                      <Wallet
                        className={`w-8 h-8 mb-2 ${
                          paymentMethod === 'WALLET' ? 'text-indigo-600' : 'text-gray-400'
                        }`}
                      />
                      <p className="font-bold text-gray-900">Wallet</p>
                      <p className="text-sm text-gray-600">Pay from wallet balance</p>
                    </button>

                    <button
                      onClick={() => setPaymentMethod('CARD')}
                      className={`p-4 rounded-2xl border-2 transition-all ${
                        paymentMethod === 'CARD'
                          ? 'border-indigo-600 bg-indigo-50'
                          : 'border-gray-200 hover:border-indigo-300'
                      }`}
                    >
                      <CreditCard
                        className={`w-8 h-8 mb-2 ${
                          paymentMethod === 'CARD' ? 'text-indigo-600' : 'text-gray-400'
                        }`}
                      />
                      <p className="font-bold text-gray-900">Card</p>
                      <p className="text-sm text-gray-600">Pay with debit/credit card</p>
                    </button>
                  </div>
                </div>

                {/* Auto-Renew */}
                <div className="mb-6">
                  <label className="flex items-start gap-3 p-4 bg-gray-50 rounded-2xl cursor-pointer hover:bg-gray-100 transition">
                    <input
                      type="checkbox"
                      checked={autoRenew}
                      onChange={(e) => setAutoRenew(e.target.checked)}
                      className="mt-1 w-5 h-5 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500"
                    />
                    <div>
                      <p className="font-semibold text-gray-900">Enable Auto-Renewal</p>
                      <p className="text-sm text-gray-600">
                        Automatically renew your subscription before it expires
                      </p>
                    </div>
                  </label>
                </div>
              </>
            )}

            {/* Terms */}
            <div className="mb-6">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="mt-1 w-5 h-5 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500"
                />
                <p className="text-sm text-gray-700">
                  I agree to the{' '}
                  <Link href="#" className="text-indigo-600 hover:text-indigo-700 font-semibold">
                    Terms and Conditions
                  </Link>{' '}
                  and{' '}
                  <Link href="#" className="text-indigo-600 hover:text-indigo-700 font-semibold">
                    Privacy Policy
                  </Link>
                </p>
              </label>
            </div>

            {/* Submit Button */}
            <button
              onClick={handleSubscribe}
              disabled={processing || !agreeTerms}
              className={`w-full py-4 rounded-2xl font-bold text-lg transition-all duration-300 ${
                processing || !agreeTerms
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white hover:shadow-2xl hover:scale-105'
              }`}
            >
              {processing ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processing...
                </span>
              ) : isEnterpriseTier ? (
                'Contact Sales'
              ) : isFreeTier ? (
                'Activate Free Plan'
              ) : (
                `Subscribe for ₦${selectedPackage.price.toLocaleString()}`
              )}
            </button>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Order Summary */}
          <div className="bg-white rounded-3xl shadow-lg p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-6">Order Summary</h3>

            <div className="space-y-4 mb-6">
              <div className="flex justify-between">
                <span className="text-gray-600">Package</span>
                <span className="font-semibold text-gray-900">{selectedPackage.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Duration</span>
                <span className="font-semibold text-gray-900">{selectedPackage.duration} days</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-semibold text-gray-900">
                  {isFreeTier || isEnterpriseTier
                    ? '₦0'
                    : `₦${selectedPackage.price.toLocaleString()}`}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Processing Fee</span>
                <span className="font-semibold text-gray-900">₦0</span>
              </div>
            </div>

            <div className="pt-4 border-t-2 border-gray-200">
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold text-gray-900">Total</span>
                <span className="text-2xl font-black text-gray-900">
                  {isFreeTier || isEnterpriseTier
                    ? '₦0'
                    : `₦${selectedPackage.price.toLocaleString()}`}
                </span>
              </div>
            </div>
          </div>

          {/* Security Badge */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-200">
            <div className="flex items-center gap-3 mb-3">
              <Shield className="w-6 h-6 text-green-600" />
              <h4 className="font-bold text-gray-900">Secure Payment</h4>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed mb-3">
              Your payment information is encrypted and secure.
            </p>
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <Lock className="w-4 h-4" />
              <span>256-bit SSL encryption</span>
            </div>
          </div>

          {/* Support */}
          <div className="bg-indigo-50 rounded-2xl p-6">
            <h4 className="font-bold text-gray-900 mb-2">Need Help?</h4>
            <p className="text-sm text-gray-700 mb-4">
              Contact our support team for any questions or assistance.
            </p>
            <Link
              href="/dashboard/support"
              className="block text-center bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 transition"
            >
              Contact Support
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BookingPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    }>
      <BookingPageContent />
    </Suspense>
  );
}
