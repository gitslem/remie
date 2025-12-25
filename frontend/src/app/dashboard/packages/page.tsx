'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { Check, Crown, Zap, Star, TrendingUp, Shield, Users, MessageCircle, ArrowRight } from 'lucide-react';

interface Package {
  id: string;
  name: string;
  tier: 'FREE' | 'BASIC' | 'PREMIUM' | 'ENTERPRISE';
  description: string;
  price: number;
  duration: number;
  benefits: string[];
  features: Array<{
    name: string;
    included: boolean;
    limit?: string;
  }>;
  maxTransactions: number;
  maxLoans: number;
  maxP2PTransfers: number;
  maxCryptoPayments: number;
  chatChannels: string[];
  color?: string;
  icon?: string;
  badge?: string;
  isFeatured: boolean;
}

interface Subscription {
  id: string;
  package: Package;
  startDate: string;
  endDate: string;
  status: 'ACTIVE' | 'CANCELLED' | 'EXPIRED' | 'PENDING';
  autoRenew: boolean;
}

export default function PackagesPage() {
  const { user } = useAuth();
  const [packages, setPackages] = useState<Package[]>([]);
  const [currentSubscription, setCurrentSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPackagesAndSubscription();
  }, []);

  const fetchPackagesAndSubscription = async () => {
    try {
      // TODO: Replace with actual API calls
      // Simulated data for now
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
          features: [
            { name: 'P2P Transfers', included: true, limit: '5/month' },
            { name: 'RRR Payments', included: true, limit: '3/month' },
            { name: 'Crypto Payments', included: false },
            { name: 'Loans', included: false },
            { name: 'Premium Support', included: false },
            { name: 'Chat Channels', included: true, limit: 'Public only' },
          ],
          maxTransactions: 5,
          maxLoans: 0,
          maxP2PTransfers: 5,
          maxCryptoPayments: 0,
          chatChannels: ['general', 'announcements'],
          color: '#6B7280',
          badge: null,
          isFeatured: false,
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
          features: [
            { name: 'P2P Transfers', included: true, limit: 'Unlimited' },
            { name: 'RRR Payments', included: true, limit: '50/month' },
            { name: 'Crypto Payments', included: true, limit: '10/month' },
            { name: 'Loans', included: true, limit: 'Up to ₦50K' },
            { name: 'Premium Support', included: false },
            { name: 'Chat Channels', included: true, limit: 'Student Communities' },
          ],
          maxTransactions: 50,
          maxLoans: 1,
          maxP2PTransfers: -1,
          maxCryptoPayments: 10,
          chatChannels: ['general', 'announcements', 'students', 'tech-help'],
          color: '#8B5CF6',
          badge: 'Popular',
          isFeatured: true,
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
          features: [
            { name: 'P2P Transfers', included: true, limit: 'Unlimited' },
            { name: 'RRR Payments', included: true, limit: 'Unlimited' },
            { name: 'Crypto Payments', included: true, limit: 'Unlimited' },
            { name: 'Loans', included: true, limit: 'Up to ₦200K' },
            { name: 'Premium Support', included: true },
            { name: 'Chat Channels', included: true, limit: 'All Channels' },
          ],
          maxTransactions: -1,
          maxLoans: 3,
          maxP2PTransfers: -1,
          maxCryptoPayments: -1,
          chatChannels: ['*'],
          color: '#EC4899',
          badge: 'Best Value',
          isFeatured: true,
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
          features: [
            { name: 'P2P Transfers', included: true, limit: 'Unlimited' },
            { name: 'RRR Payments', included: true, limit: 'Unlimited' },
            { name: 'Crypto Payments', included: true, limit: 'Unlimited' },
            { name: 'Loans', included: true, limit: 'Custom' },
            { name: 'Premium Support', included: true },
            { name: 'Chat Channels', included: true, limit: 'Private Channels' },
          ],
          maxTransactions: -1,
          maxLoans: -1,
          maxP2PTransfers: -1,
          maxCryptoPayments: -1,
          chatChannels: ['*'],
          color: '#F59E0B',
          badge: 'Custom',
          isFeatured: false,
        },
      ];

      setPackages(mockPackages);

      // Simulated current subscription
      // setCurrentSubscription({
      //   id: '1',
      //   package: mockPackages[0],
      //   startDate: new Date().toISOString(),
      //   endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      //   status: 'ACTIVE',
      //   autoRenew: false,
      // });
    } catch (error) {
      console.error('Error fetching packages:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'FREE':
        return <Users className="w-6 h-6" />;
      case 'BASIC':
        return <Zap className="w-6 h-6" />;
      case 'PREMIUM':
        return <Crown className="w-6 h-6" />;
      case 'ENTERPRISE':
        return <Star className="w-6 h-6" />;
      default:
        return <Shield className="w-6 h-6" />;
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
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-3xl p-8 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="relative z-10">
          <h1 className="text-4xl font-black mb-3">Choose Your Plan</h1>
          <p className="text-xl text-indigo-100 max-w-2xl">
            Unlock more features and benefits with our premium packages designed for students
          </p>
        </div>
      </div>

      {/* Current Subscription */}
      {currentSubscription && (
        <div className="bg-white rounded-2xl shadow-md border-2 border-green-500 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center text-green-600">
                <Check className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Current Plan</h3>
                <p className="text-sm text-gray-600">Active subscription</p>
              </div>
            </div>
            <span className="px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-bold">
              {currentSubscription.status}
            </span>
          </div>
          <div className="grid md:grid-cols-3 gap-4 mt-6">
            <div>
              <p className="text-sm text-gray-600">Package</p>
              <p className="text-lg font-bold text-gray-900">{currentSubscription.package.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Expires On</p>
              <p className="text-lg font-bold text-gray-900">
                {new Date(currentSubscription.endDate).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Auto-Renew</p>
              <p className="text-lg font-bold text-gray-900">
                {currentSubscription.autoRenew ? 'Enabled' : 'Disabled'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Packages Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {packages.map((pkg) => (
          <PackageCard
            key={pkg.id}
            package={pkg}
            isCurrentPlan={currentSubscription?.package.id === pkg.id}
            getTierIcon={getTierIcon}
          />
        ))}
      </div>

      {/* Features Comparison Table */}
      <div className="bg-white rounded-3xl shadow-lg p-8">
        <h2 className="text-3xl font-black text-gray-900 mb-8">Compare Features</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="text-left py-4 px-4 font-bold text-gray-900">Feature</th>
                {packages.map((pkg) => (
                  <th key={pkg.id} className="text-center py-4 px-4 font-bold text-gray-900">
                    {pkg.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-100">
                <td className="py-4 px-4 font-semibold text-gray-700">P2P Transfers</td>
                {packages.map((pkg) => (
                  <td key={pkg.id} className="text-center py-4 px-4">
                    {pkg.maxP2PTransfers === -1 ? (
                      <span className="text-green-600 font-semibold">Unlimited</span>
                    ) : (
                      <span className="text-gray-600">{pkg.maxP2PTransfers}/month</span>
                    )}
                  </td>
                ))}
              </tr>
              <tr className="border-b border-gray-100">
                <td className="py-4 px-4 font-semibold text-gray-700">RRR Payments</td>
                {packages.map((pkg) => (
                  <td key={pkg.id} className="text-center py-4 px-4">
                    {pkg.maxTransactions === -1 ? (
                      <span className="text-green-600 font-semibold">Unlimited</span>
                    ) : (
                      <span className="text-gray-600">{pkg.maxTransactions}/month</span>
                    )}
                  </td>
                ))}
              </tr>
              <tr className="border-b border-gray-100">
                <td className="py-4 px-4 font-semibold text-gray-700">Crypto Payments</td>
                {packages.map((pkg) => (
                  <td key={pkg.id} className="text-center py-4 px-4">
                    {pkg.maxCryptoPayments === 0 ? (
                      <span className="text-gray-400">-</span>
                    ) : pkg.maxCryptoPayments === -1 ? (
                      <span className="text-green-600 font-semibold">Unlimited</span>
                    ) : (
                      <span className="text-gray-600">{pkg.maxCryptoPayments}/month</span>
                    )}
                  </td>
                ))}
              </tr>
              <tr className="border-b border-gray-100">
                <td className="py-4 px-4 font-semibold text-gray-700">Microloans</td>
                {packages.map((pkg) => (
                  <td key={pkg.id} className="text-center py-4 px-4">
                    {pkg.maxLoans === 0 ? (
                      <span className="text-gray-400">-</span>
                    ) : pkg.maxLoans === -1 ? (
                      <span className="text-green-600 font-semibold">Custom</span>
                    ) : (
                      <span className="text-gray-600">{pkg.maxLoans} active</span>
                    )}
                  </td>
                ))}
              </tr>
              <tr className="border-b border-gray-100">
                <td className="py-4 px-4 font-semibold text-gray-700">Chat Channels</td>
                {packages.map((pkg) => (
                  <td key={pkg.id} className="text-center py-4 px-4">
                    <span className="text-gray-600">
                      {pkg.chatChannels.includes('*')
                        ? 'All'
                        : `${pkg.chatChannels.length} channels`}
                    </span>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function PackageCard({
  package: pkg,
  isCurrentPlan,
  getTierIcon,
}: {
  package: Package;
  isCurrentPlan: boolean;
  getTierIcon: (tier: string) => JSX.Element;
}) {
  const borderColor = pkg.isFeatured
    ? 'border-indigo-500 border-4'
    : 'border-gray-200 border-2';

  return (
    <div
      className={`bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 p-8 relative overflow-hidden ${
        isCurrentPlan ? 'ring-4 ring-green-500' : ''
      } ${borderColor} hover-lift`}
    >
      {pkg.badge && (
        <div className="absolute top-4 right-4 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-black px-4 py-1 rounded-full shadow-lg">
          {pkg.badge}
        </div>
      )}

      {isCurrentPlan && (
        <div className="absolute top-4 left-4 bg-green-500 text-white text-xs font-black px-4 py-1 rounded-full shadow-lg">
          CURRENT
        </div>
      )}

      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 bg-gradient-to-br ${
        pkg.tier === 'FREE' ? 'from-gray-400 to-gray-600' :
        pkg.tier === 'BASIC' ? 'from-purple-500 to-indigo-600' :
        pkg.tier === 'PREMIUM' ? 'from-pink-500 to-purple-600' :
        'from-yellow-500 to-orange-600'
      } text-white shadow-lg`}>
        {getTierIcon(pkg.tier)}
      </div>

      <h3 className="text-2xl font-black text-gray-900 mb-2">{pkg.name}</h3>
      <p className="text-gray-600 mb-6 leading-relaxed">{pkg.description}</p>

      <div className="mb-6">
        {pkg.tier === 'ENTERPRISE' ? (
          <div>
            <p className="text-4xl font-black text-gray-900">Custom</p>
            <p className="text-sm text-gray-600 mt-1">Contact sales</p>
          </div>
        ) : (
          <div>
            <span className="text-5xl font-black text-gray-900">
              ₦{pkg.price.toLocaleString()}
            </span>
            <span className="text-gray-600 ml-2">/{pkg.duration} days</span>
          </div>
        )}
      </div>

      <div className="space-y-4 mb-8">
        <h4 className="font-bold text-gray-900 text-sm uppercase tracking-wide">Benefits</h4>
        {pkg.benefits.map((benefit, index) => (
          <div key={index} className="flex items-start gap-3">
            <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <Check className="w-3.5 h-3.5 text-green-600" />
            </div>
            <span className="text-gray-700 text-sm leading-relaxed">{benefit}</span>
          </div>
        ))}
      </div>

      <Link
        href={`/dashboard/booking?package=${pkg.id}`}
        className={`block text-center py-4 rounded-xl font-bold text-lg transition-all duration-300 ${
          isCurrentPlan
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : pkg.tier === 'ENTERPRISE'
            ? 'bg-gradient-to-r from-yellow-500 to-orange-600 text-white hover:shadow-2xl hover:scale-105'
            : 'bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white hover:shadow-2xl hover:scale-105'
        }`}
      >
        {isCurrentPlan ? (
          'Current Plan'
        ) : pkg.tier === 'ENTERPRISE' ? (
          <span className="flex items-center justify-center gap-2">
            Contact Sales
            <ArrowRight className="w-5 h-5" />
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            Subscribe Now
            <ArrowRight className="w-5 h-5" />
          </span>
        )}
      </Link>
    </div>
  );
}
