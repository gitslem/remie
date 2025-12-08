'use client';

import React from 'react';
import { Card, StatCard, Button, Table, StatusBadge, LoadingSpinner, EmptyState } from '@/components';
import {
  Wallet,
  TrendingUp,
  ArrowUpRight,
  ArrowDownLeft,
  Send,
  Receipt,
  CreditCard,
  Globe,
  DollarSign,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Mock data - replace with real API calls
const mockBalance = {
  balance: 125000,
  availableBalance: 120000,
  ledgerBalance: 125000,
};

const mockTransactions = [
  { id: '1', reference: 'REMIE_123456', type: 'WALLET_FUNDING', amount: 50000, status: 'COMPLETED' as const, createdAt: '2025-01-08T10:30:00Z' },
  { id: '2', reference: 'REMIE_123457', type: 'WITHDRAWAL', amount: 25000, status: 'COMPLETED' as const, createdAt: '2025-01-07T14:20:00Z' },
  { id: '3', reference: 'REMIE_123458', type: 'P2P_TRANSFER', amount: 5000, status: 'COMPLETED' as const, createdAt: '2025-01-06T09:15:00Z' },
];

const chartData = [
  { name: 'Mon', income: 40000, expense: 24000 },
  { name: 'Tue', income: 30000, expense: 13980 },
  { name: 'Wed', income: 20000, expense: 9800 },
  { name: 'Thu', income: 27800, expense: 39080 },
  { name: 'Fri', income: 18900, expense: 48000 },
  { name: 'Sat', income: 23900, expense: 38000 },
  { name: 'Sun', income: 34900, expense: 43000 },
];

const pieData = [
  { name: 'School Fees', value: 400, color: '#3b82f6' },
  { name: 'P2P Transfers', value: 300, color: '#10b981' },
  { name: 'Withdrawals', value: 200, color: '#f59e0b' },
  { name: 'Others', value: 100, color: '#6366f1' },
];

export default function EnhancedDashboard() {
  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 rounded-2xl p-6 sm:p-8 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-40 h-40 bg-white opacity-10 rounded-full"></div>
        <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-32 h-32 bg-white opacity-10 rounded-full"></div>
        <div className="relative">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">Welcome back, Student! 👋</h1>
          <p className="text-blue-100">Here's what's happening with your account today.</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard
          title="Total Balance"
          value={`₦${mockBalance.balance.toLocaleString()}`}
          icon={<Wallet className="h-6 w-6" />}
          color="blue"
          trend={{ value: 12.5, isPositive: true }}
        />
        <StatCard
          title="Available Balance"
          value={`₦${mockBalance.availableBalance.toLocaleString()}`}
          icon={<CreditCard className="h-6 w-6" />}
          color="green"
        />
        <StatCard
          title="This Month"
          value="₦85,420"
          icon={<TrendingUp className="h-6 w-6" />}
          color="purple"
          trend={{ value: 8.2, isPositive: true }}
        />
        <StatCard
          title="Transactions"
          value="42"
          icon={<Receipt className="h-6 w-6" />}
          color="yellow"
          trend={{ value: 3.1, isPositive: false }}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Income vs Expense Chart */}
        <Card title="Income vs Expense" subtitle="Last 7 days">
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                formatter={(value: number) => `₦${value.toLocaleString()}`}
              />
              <Legend />
              <Area type="monotone" dataKey="income" stroke="#10b981" fillOpacity={1} fill="url(#colorIncome)" name="Income" />
              <Area type="monotone" dataKey="expense" stroke="#ef4444" fillOpacity={1} fill="url(#colorExpense)" name="Expense" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        {/* Spending by Category */}
        <Card title="Spending by Category" subtitle="This month">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => `₦${value.toLocaleString()}`} />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-4 grid grid-cols-2 gap-3">
            {pieData.map((item) => (
              <div key={item.name} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                <span className="text-sm text-gray-600">{item.name}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card title="Quick Actions" subtitle="Perform common tasks quickly">
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-4">
          <Link href="/dashboard/wallet/fund" className="group">
            <div className="flex flex-col items-center justify-center p-6 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 hover:shadow-md transition-all cursor-pointer">
              <div className="p-3 bg-blue-100 rounded-full group-hover:bg-blue-500 group-hover:scale-110 transition-all mb-3">
                <ArrowDownLeft className="h-6 w-6 text-blue-600 group-hover:text-white transition-colors" />
              </div>
              <span className="font-semibold text-gray-900 text-center">Fund Wallet</span>
              <span className="text-sm text-gray-500 mt-1">Add money</span>
            </div>
          </Link>

          <Link href="/dashboard/p2p" className="group">
            <div className="flex flex-col items-center justify-center p-6 border-2 border-gray-200 rounded-xl hover:border-green-500 hover:bg-green-50 hover:shadow-md transition-all cursor-pointer">
              <div className="p-3 bg-green-100 rounded-full group-hover:bg-green-500 group-hover:scale-110 transition-all mb-3">
                <Send className="h-6 w-6 text-green-600 group-hover:text-white transition-colors" />
              </div>
              <span className="font-semibold text-gray-900 text-center">Send Money</span>
              <span className="text-sm text-gray-500 mt-1">P2P Transfer</span>
            </div>
          </Link>

          <Link href="/dashboard/remittance" className="group">
            <div className="flex flex-col items-center justify-center p-6 border-2 border-gray-200 rounded-xl hover:border-purple-500 hover:bg-purple-50 hover:shadow-md transition-all cursor-pointer">
              <div className="p-3 bg-purple-100 rounded-full group-hover:bg-purple-500 group-hover:scale-110 transition-all mb-3">
                <Globe className="h-6 w-6 text-purple-600 group-hover:text-white transition-colors" />
              </div>
              <span className="font-semibold text-gray-900 text-center">Remittance</span>
              <span className="text-sm text-gray-500 mt-1">Send abroad</span>
            </div>
          </Link>

          <Link href="/dashboard/rrr" className="group">
            <div className="flex flex-col items-center justify-center p-6 border-2 border-gray-200 rounded-xl hover:border-orange-500 hover:bg-orange-50 hover:shadow-md transition-all cursor-pointer">
              <div className="p-3 bg-orange-100 rounded-full group-hover:bg-orange-500 group-hover:scale-110 transition-all mb-3">
                <Receipt className="h-6 w-6 text-orange-600 group-hover:text-white transition-colors" />
              </div>
              <span className="font-semibold text-gray-900 text-center">Pay RRR</span>
              <span className="text-sm text-gray-500 mt-1">School fees</span>
            </div>
          </Link>
        </div>
      </Card>

      {/* Recent Transactions */}
      <Card title="Recent Transactions" subtitle="Your latest payment activities">
        <div className="overflow-hidden">
          <Table
            data={mockTransactions}
            columns={[
              {
                key: 'reference',
                header: 'Reference',
                render: (tx: any) => (
                  <div>
                    <p className="font-medium text-gray-900">{tx.reference}</p>
                    <p className="text-sm text-gray-500">{tx.type.replace(/_/g, ' ')}</p>
                  </div>
                ),
              },
              {
                key: 'amount',
                header: 'Amount',
                render: (tx: any) => {
                  const isDebit = ['WITHDRAWAL', 'P2P_TRANSFER'].includes(tx.type);
                  return (
                    <span className={`font-semibold ${isDebit ? 'text-red-600' : 'text-green-600'}`}>
                      {isDebit ? '-' : '+'}₦{tx.amount.toLocaleString()}
                    </span>
                  );
                },
                align: 'right',
              },
              {
                key: 'status',
                header: 'Status',
                render: (tx: any) => <StatusBadge status={tx.status} />,
                align: 'center',
              },
              {
                key: 'createdAt',
                header: 'Date',
                render: (tx: any) => {
                  const date = new Date(tx.createdAt);
                  return (
                    <div>
                      <p className="text-gray-900">{date.toLocaleDateString()}</p>
                      <p className="text-sm text-gray-500">{date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                  );
                },
              },
            ]}
          />
        </div>
        <div className="mt-4 text-center">
          <Link href="/dashboard/transactions">
            <Button variant="outline">View All Transactions</Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
