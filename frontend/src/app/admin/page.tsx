'use client';

import React, { useState } from 'react';
import { Card, Table, StatusBadge, LoadingSpinner, Button } from '@/components';
import { useQuery } from '@tanstack/react-query';
import {
  Users,
  Activity,
  DollarSign,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  UserCheck,
  UserX,
  BarChart3
} from 'lucide-react';
import { AreaChart, Area, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  isVerified: boolean;
  status: 'ACTIVE' | 'SUSPENDED' | 'BLOCKED';
  createdAt: string;
  walletBalance: number;
  totalTransactions: number;
}

interface Activity {
  id: string;
  userId: string;
  userName: string;
  type: string;
  description: string;
  amount?: number;
  status: string;
  createdAt: string;
}

interface Stats {
  totalUsers: number;
  activeUsers: number;
  totalTransactions: number;
  totalVolume: number;
  pendingLoans: number;
  activeLoans: number;
  systemRevenue: number;
}

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'activities' | 'loans'>('overview');
  const [userPage, setUserPage] = useState(1);
  const [activityPage, setActivityPage] = useState(1);

  // Mock data - Replace with actual API calls
  const stats: Stats = {
    totalUsers: 1250,
    activeUsers: 892,
    totalTransactions: 8456,
    totalVolume: 125_450_000,
    pendingLoans: 24,
    activeLoans: 156,
    systemRevenue: 3_250_000,
  };

  const mockUsers: User[] = [
    {
      id: '1',
      email: 'john.doe@example.com',
      firstName: 'John',
      lastName: 'Doe',
      phoneNumber: '+2348012345678',
      isVerified: true,
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      walletBalance: 50000,
      totalTransactions: 45,
    },
    // Add more mock users...
  ];

  const mockActivities: Activity[] = [
    {
      id: '1',
      userId: '1',
      userName: 'John Doe',
      type: 'WALLET_FUNDING',
      description: 'Funded wallet',
      amount: 10000,
      status: 'COMPLETED',
      createdAt: new Date().toISOString(),
    },
    // Add more mock activities...
  ];

  // Chart data
  const transactionVolumeData = [
    { month: 'Jan', volume: 12_000_000, transactions: 1200 },
    { month: 'Feb', volume: 18_500_000, transactions: 1650 },
    { month: 'Mar', volume: 22_300_000, transactions: 2100 },
    { month: 'Apr', volume: 28_700_000, transactions: 2450 },
    { month: 'May', volume: 35_200_000, transactions: 2800 },
    { month: 'Jun', volume: 42_150_000, transactions: 3200 },
  ];

  const transactionTypeData = [
    { name: 'Wallet Funding', value: 35, color: '#10B981' },
    { name: 'P2P Transfers', value: 25, color: '#3B82F6' },
    { name: 'RRR Payments', value: 20, color: '#8B5CF6' },
    { name: 'Remittance', value: 12, color: '#F59E0B' },
    { name: 'Loan Payments', value: 8, color: '#EF4444' },
  ];

  const userColumns = [
    {
      key: 'user',
      header: 'User',
      render: (user: User) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
            <span className="text-indigo-600 font-semibold">
              {user.firstName[0]}{user.lastName[0]}
            </span>
          </div>
          <div>
            <p className="font-medium text-gray-900">{user.firstName} {user.lastName}</p>
            <p className="text-xs text-gray-500">{user.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'verification',
      header: 'Status',
      render: (user: User) => (
        <div className="space-y-1">
          <StatusBadge status={user.status} />
          {user.isVerified && (
            <div className="flex items-center gap-1 text-green-600 text-xs">
              <CheckCircle className="h-3 w-3" />
              <span>Verified</span>
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'balance',
      header: 'Wallet Balance',
      render: (user: User) => (
        <p className="font-semibold text-gray-900">₦{user.walletBalance.toLocaleString()}</p>
      ),
    },
    {
      key: 'transactions',
      header: 'Transactions',
      render: (user: User) => (
        <p className="text-sm text-gray-600">{user.totalTransactions}</p>
      ),
    },
    {
      key: 'joined',
      header: 'Joined',
      render: (user: User) => (
        <p className="text-sm text-gray-600">
          {new Date(user.createdAt).toLocaleDateString('en-NG', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })}
        </p>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (user: User) => (
        <div className="flex gap-2">
          <Button size="sm" variant="outline">
            <Eye className="h-4 w-4" />
          </Button>
          {user.status === 'ACTIVE' ? (
            <Button size="sm" variant="danger">
              <UserX className="h-4 w-4" />
            </Button>
          ) : (
            <Button size="sm" variant="success">
              <UserCheck className="h-4 w-4" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  const activityColumns = [
    {
      key: 'user',
      header: 'User',
      render: (activity: Activity) => (
        <p className="font-medium text-gray-900">{activity.userName}</p>
      ),
    },
    {
      key: 'type',
      header: 'Activity Type',
      render: (activity: Activity) => (
        <div>
          <p className="text-sm text-gray-900">{activity.type.replace(/_/g, ' ')}</p>
          <p className="text-xs text-gray-500">{activity.description}</p>
        </div>
      ),
    },
    {
      key: 'amount',
      header: 'Amount',
      render: (activity: Activity) => (
        activity.amount ? (
          <p className="font-semibold text-gray-900">₦{activity.amount.toLocaleString()}</p>
        ) : (
          <p className="text-sm text-gray-400">-</p>
        )
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (activity: Activity) => <StatusBadge status={activity.status} />,
    },
    {
      key: 'time',
      header: 'Time',
      render: (activity: Activity) => (
        <p className="text-sm text-gray-600">
          {new Date(activity.createdAt).toLocaleString('en-NG', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600 mt-1">Manage users, monitor activities, and view system analytics</p>
      </div>

      {/* Navigation Tabs */}
      <Card>
        <div className="flex gap-2 border-b border-gray-200 -mx-6 -mt-6 px-6">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-6 py-3 font-medium border-b-2 transition ${
              activeTab === 'overview'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              <span>Overview</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-6 py-3 font-medium border-b-2 transition ${
              activeTab === 'users'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span>Users</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('activities')}
            className={`px-6 py-3 font-medium border-b-2 transition ${
              activeTab === 'activities'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              <span>Activities</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('loans')}
            className={`px-6 py-3 font-medium border-b-2 transition ${
              activeTab === 'loans'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              <span>Loans</span>
            </div>
          </button>
        </div>
      </Card>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Users</p>
                  <p className="text-3xl font-bold text-blue-600">{stats.totalUsers.toLocaleString()}</p>
                  <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    {stats.activeUsers} active
                  </p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <Users className="h-8 w-8 text-blue-600" />
                </div>
              </div>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Transaction Volume</p>
                  <p className="text-2xl font-bold text-green-600">
                    ₦{(stats.totalVolume / 1_000_000).toFixed(1)}M
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {stats.totalTransactions.toLocaleString()} transactions
                  </p>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <DollarSign className="h-8 w-8 text-green-600" />
                </div>
              </div>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Active Loans</p>
                  <p className="text-3xl font-bold text-purple-600">{stats.activeLoans}</p>
                  <p className="text-xs text-orange-600 mt-1">
                    {stats.pendingLoans} pending approval
                  </p>
                </div>
                <div className="p-3 bg-purple-100 rounded-full">
                  <TrendingUp className="h-8 w-8 text-purple-600" />
                </div>
              </div>
            </Card>

            <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">System Revenue</p>
                  <p className="text-2xl font-bold text-orange-600">
                    ₦{(stats.systemRevenue / 1_000_000).toFixed(2)}M
                  </p>
                  <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    12% from last month
                  </p>
                </div>
                <div className="p-3 bg-orange-100 rounded-full">
                  <BarChart3 className="h-8 w-8 text-orange-600" />
                </div>
              </div>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card title="Transaction Volume Trend" className="lg:col-span-2">
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={transactionVolumeData}>
                  <defs>
                    <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="month" stroke="#6B7280" />
                  <YAxis stroke="#6B7280" />
                  <Tooltip />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="volume"
                    stroke="#3B82F6"
                    fillOpacity={1}
                    fill="url(#colorVolume)"
                    name="Volume (₦)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </Card>

            <Card title="Transactions by Type">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={transactionTypeData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {transactionTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          </div>

          {/* Recent Activities */}
          <Card title="Recent System Activities">
            <Table
              data={mockActivities.slice(0, 10)}
              columns={activityColumns}
              emptyMessage="No activities found"
            />
          </Card>
        </>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <input
              type="text"
              placeholder="Search users by name or email..."
              className="flex-1 max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            <div className="flex gap-2">
              <select className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
                <option value="ALL">All Status</option>
                <option value="ACTIVE">Active</option>
                <option value="SUSPENDED">Suspended</option>
                <option value="BLOCKED">Blocked</option>
              </select>
            </div>
          </div>

          <Table
            data={mockUsers}
            columns={userColumns}
            emptyMessage="No users found"
          />
        </Card>
      )}

      {/* Activities Tab */}
      {activeTab === 'activities' && (
        <Card>
          <div className="mb-4 flex items-center gap-2">
            <select className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
              <option value="ALL">All Activities</option>
              <option value="WALLET_FUNDING">Wallet Funding</option>
              <option value="P2P_TRANSFER">P2P Transfer</option>
              <option value="RRR_PAYMENT">RRR Payment</option>
              <option value="LOAN_APPLICATION">Loan Application</option>
            </select>
            <input
              type="date"
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <Table
            data={mockActivities}
            columns={activityColumns}
            emptyMessage="No activities found"
          />
        </Card>
      )}

      {/* Loans Tab */}
      {activeTab === 'loans' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-gradient-to-br from-orange-50 to-yellow-50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Pending Approval</p>
                  <p className="text-3xl font-bold text-orange-600">{stats.pendingLoans}</p>
                </div>
                <Clock className="h-8 w-8 text-orange-600" />
              </div>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-emerald-50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Active Loans</p>
                  <p className="text-3xl font-bold text-green-600">{stats.activeLoans}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </Card>

            <Card className="bg-gradient-to-br from-red-50 to-pink-50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Defaulted</p>
                  <p className="text-3xl font-bold text-red-600">8</p>
                </div>
                <XCircle className="h-8 w-8 text-red-600" />
              </div>
            </Card>
          </div>

          <Card title="Pending Loan Applications">
            <p className="text-gray-600 py-8 text-center">Loan approval interface coming soon...</p>
          </Card>
        </div>
      )}
    </div>
  );
}
