'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { wallet as walletApi } from '@/lib/api';
import Link from 'next/link';

export default function DashboardPage() {
  const { user } = useAuth();
  const [wallet, setWallet] = useState<any>(null);
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalSpent: 0,
    totalReceived: 0,
    activeLoans: 0,
    pendingPayments: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    try {
      // Fetch wallet via API
      const walletResponse = await walletApi.getBalance();
      if (walletResponse.data?.data) {
        setWallet(walletResponse.data.data);
      }

      // Fetch recent transactions via API
      const transactionsResponse = await walletApi.getTransactions(1, 5);
      if (transactionsResponse.data?.data?.transactions) {
        setRecentTransactions(transactionsResponse.data.data.transactions);
      }

      setStats({
        totalSpent: 0,
        totalReceived: 0,
        activeLoans: 0,
        pendingPayments: 0,
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
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
    <div className="space-y-6">
      {/* Welcome section */}
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 rounded-2xl p-8 text-white">
        <h1 className="text-3xl font-bold mb-2">
          Welcome back, {user?.displayName?.split(' ')[0] || 'User'}!
        </h1>
        <p className="text-indigo-100">Here's what's happening with your account today.</p>
      </div>

      {/* Balance card */}
      <div className="bg-white rounded-2xl shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Wallet Balance</h2>
          <Link
            href="/dashboard/wallet"
            className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
          >
            View details →
          </Link>
        </div>
        <div className="flex items-baseline">
          <span className="text-4xl font-bold text-gray-900">
            ₦{wallet?.balance?.toLocaleString() || '0'}
          </span>
          <span className="ml-2 text-gray-500">{wallet?.currency || 'NGN'}</span>
        </div>
        <div className="mt-6 flex gap-3">
          <Link
            href="/dashboard/wallet?action=fund"
            className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition text-center"
          >
            Fund Wallet
          </Link>
          <Link
            href="/dashboard/p2p"
            className="flex-1 bg-indigo-50 text-indigo-600 px-4 py-2 rounded-lg font-medium hover:bg-indigo-100 transition text-center"
          >
            Send Money
          </Link>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard icon="💸" title="Total Spent" value={`₦${stats.totalSpent.toLocaleString()}`} />
        <StatCard icon="💰" title="Total Received" value={`₦${stats.totalReceived.toLocaleString()}`} />
        <StatCard icon="📈" title="Active Loans" value={stats.activeLoans.toString()} />
        <StatCard icon="⏳" title="Pending Payments" value={stats.pendingPayments.toString()} />
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <ActionCard
            href="/dashboard/rrr"
            icon="💳"
            title="Generate RRR"
            description="Pay school fees and government charges"
          />
          <ActionCard
            href="/dashboard/p2p"
            icon="💸"
            title="Send Money"
            description="Transfer to other REMIE users"
          />
          <ActionCard
            href="/dashboard/loans"
            icon="📈"
            title="Apply for Loan"
            description="Get instant microloans"
          />
          <ActionCard
            href="/dashboard/crypto"
            icon="🔐"
            title="Crypto Payment"
            description="Pay with USDT/USDC"
          />
          <ActionCard
            href="/dashboard/transactions"
            icon="📝"
            title="View Transactions"
            description="See all your payment history"
          />
          <ActionCard
            href="/dashboard/wallet"
            icon="💰"
            title="Manage Wallet"
            description="Fund and manage your wallet"
          />
        </div>
      </div>

      {/* Recent transactions */}
      {recentTransactions.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Transactions</h2>
            <Link
              href="/dashboard/transactions"
              className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
            >
              View all →
            </Link>
          </div>
          <div className="bg-white rounded-2xl shadow-md overflow-hidden">
            <div className="divide-y divide-gray-200">
              {recentTransactions.map((transaction) => (
                <div key={transaction.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 mr-3">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">P2P Transfer</p>
                      <p className="text-sm text-gray-500">
                        {new Date(transaction.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-red-600">-₦{transaction.amount?.toLocaleString()}</p>
                    <p className="text-sm text-gray-500">{transaction.status}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, title, value }: { icon: string; title: string; value: string }) {
  return (
    <div className="bg-white rounded-2xl shadow-md p-6">
      <div className="flex items-center justify-between mb-2">
        <span className="text-2xl">{icon}</span>
      </div>
      <h3 className="text-sm font-medium text-gray-600 mb-1">{title}</h3>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  );
}

function ActionCard({
  href,
  icon,
  title,
  description,
}: {
  href: string;
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition group"
    >
      <div className="text-4xl mb-3">{icon}</div>
      <h3 className="text-lg font-semibold text-gray-900 mb-1 group-hover:text-indigo-600 transition">
        {title}
      </h3>
      <p className="text-sm text-gray-600">{description}</p>
    </Link>
  );
}
