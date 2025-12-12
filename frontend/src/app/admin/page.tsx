'use client';

import React, { useState } from 'react';
import { Card, Table, StatusBadge, Button } from '@/components';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { admin } from '@/lib/api';
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
  BarChart3,
  Ban,
  Settings,
  Check,
  X
} from 'lucide-react';
import { AreaChart, Area, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { toast } from 'react-hot-toast';

// Force dynamic rendering - don't statically generate this page
export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  kycVerified: boolean;
  status: 'ACTIVE' | 'SUSPENDED' | 'INACTIVE' | 'PENDING_VERIFICATION' | 'PENDING_APPROVAL';
  role: string;
  institution?: string;
  studentId?: string;
  createdAt: string;
  lastLoginAt?: string;
  approvedBy?: string;
  approvedAt?: string;
  wallet?: {
    balance: number;
    availableBalance: number;
    dailyLimit: number;
    monthlyLimit: number;
    dailyFundingSpent: number;
    monthlyFundingSpent: number;
    isFrozen: boolean;
  };
  _count?: {
    payments: number;
    loans: number;
  };
}

interface Activity {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  type: string;
  description: string;
  amount?: number;
  status: string;
  createdAt: string;
}

interface Stats {
  totalUsers: number;
  activeUsers: number;
  pendingApprovalUsers: number;
  suspendedUsers: number;
  totalWalletBalance: number;
  totalTransactions: number;
  completedTransactions: number;
  totalVolume: number;
  pendingLoans: number;
  activeLoans: number;
}

interface LimitModalProps {
  user: User;
  onClose: () => void;
  onUpdate: (userId: string, limits: { dailyLimit?: number; monthlyLimit?: number }) => void;
}

const LimitModal: React.FC<LimitModalProps> = ({ user, onClose, onUpdate }) => {
  const [dailyLimit, setDailyLimit] = useState(user.wallet?.dailyLimit || 100000);
  const [monthlyLimit, setMonthlyLimit] = useState(user.wallet?.monthlyLimit || 500000);

  const handleSubmit = () => {
    onUpdate(user.id, { dailyLimit, monthlyLimit });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-semibold mb-4">Update Spending Limits</h3>
        <p className="text-sm text-gray-600 mb-4">
          Set daily and monthly funding limits for {user.firstName} {user.lastName}
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Daily Funding Limit (₦)
            </label>
            <input
              type="number"
              value={dailyLimit}
              onChange={(e) => setDailyLimit(parseFloat(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              min="0"
            />
            <p className="text-xs text-gray-500 mt-1">
              Current spent: ₦{user.wallet?.dailyFundingSpent?.toLocaleString() || 0}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Monthly Funding Limit (₦)
            </label>
            <input
              type="number"
              value={monthlyLimit}
              onChange={(e) => setMonthlyLimit(parseFloat(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              min="0"
            />
            <p className="text-xs text-gray-500 mt-1">
              Current spent: ₦{user.wallet?.monthlyFundingSpent?.toLocaleString() || 0}
            </p>
          </div>
        </div>

        <div className="flex gap-2 mt-6">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button onClick={handleSubmit} className="flex-1">
            Update Limits
          </Button>
        </div>
      </div>
    </div>
  );
};

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'pending' | 'activities'>('overview');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const queryClient = useQueryClient();

  // Fetch dashboard stats
  const { data: stats, isLoading: statsLoading } = useQuery<Stats>({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const response = await admin.getStats();
      return response.data.data;
    },
  });

  // Fetch users
  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['admin-users', searchQuery, statusFilter],
    queryFn: async () => {
      const response = await admin.getUsers({
        search: searchQuery || undefined,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
      });
      return response.data.data;
    },
    enabled: activeTab === 'users',
  });

  // Fetch pending approvals
  const { data: pendingUsers, isLoading: pendingLoading } = useQuery<User[]>({
    queryKey: ['admin-pending-approvals'],
    queryFn: async () => {
      const response = await admin.getPendingApprovals();
      return response.data.data;
    },
    enabled: activeTab === 'pending',
  });

  // Fetch activities
  const { data: activities, isLoading: activitiesLoading } = useQuery<Activity[]>({
    queryKey: ['admin-activities'],
    queryFn: async () => {
      const response = await admin.getActivities(50);
      return response.data.data;
    },
    enabled: activeTab === 'activities',
  });

  // Mutations
  const approveMutation = useMutation({
    mutationFn: (userId: string) => admin.approveUser(userId),
    onSuccess: () => {
      toast.success('User approved successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-pending-approvals'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to approve user');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (userId: string) => admin.rejectUser(userId),
    onSuccess: () => {
      toast.success('User rejected successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-pending-approvals'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to reject user');
    },
  });

  const suspendMutation = useMutation({
    mutationFn: (userId: string) => admin.suspendUser(userId),
    onSuccess: () => {
      toast.success('User suspended successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to suspend user');
    },
  });

  const activateMutation = useMutation({
    mutationFn: (userId: string) => admin.activateUser(userId),
    onSuccess: () => {
      toast.success('User activated successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to activate user');
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: (userId: string) => admin.deactivateUser(userId),
    onSuccess: () => {
      toast.success('User deactivated successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to deactivate user');
    },
  });

  const updateLimitsMutation = useMutation({
    mutationFn: ({ userId, limits }: { userId: string; limits: { dailyLimit?: number; monthlyLimit?: number } }) =>
      admin.updateLimits(userId, limits),
    onSuccess: () => {
      toast.success('Limits updated successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setSelectedUser(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update limits');
    },
  });

  const pendingColumns = [
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
      key: 'institution',
      header: 'Institution',
      render: (user: User) => (
        <div>
          <p className="text-sm text-gray-900">{user.institution || 'N/A'}</p>
          <p className="text-xs text-gray-500">{user.studentId || 'No ID'}</p>
        </div>
      ),
    },
    {
      key: 'verification',
      header: 'Verification',
      render: (user: User) => (
        <div className="space-y-1">
          {user.emailVerified && (
            <div className="flex items-center gap-1 text-green-600 text-xs">
              <CheckCircle className="h-3 w-3" />
              <span>Email</span>
            </div>
          )}
          {user.phoneVerified && (
            <div className="flex items-center gap-1 text-green-600 text-xs">
              <CheckCircle className="h-3 w-3" />
              <span>Phone</span>
            </div>
          )}
          {user.kycVerified && (
            <div className="flex items-center gap-1 text-green-600 text-xs">
              <CheckCircle className="h-3 w-3" />
              <span>KYC</span>
            </div>
          )}
        </div>
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
          <Button
            size="sm"
            variant="success"
            onClick={() => approveMutation.mutate(user.id)}
            disabled={approveMutation.isPending}
          >
            <Check className="h-4 w-4 mr-1" />
            Approve
          </Button>
          <Button
            size="sm"
            variant="danger"
            onClick={() => rejectMutation.mutate(user.id)}
            disabled={rejectMutation.isPending}
          >
            <X className="h-4 w-4 mr-1" />
            Reject
          </Button>
        </div>
      ),
    },
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
      key: 'status',
      header: 'Status',
      render: (user: User) => {
        const statusColors: Record<string, string> = {
          ACTIVE: 'bg-green-100 text-green-800',
          PENDING_APPROVAL: 'bg-orange-100 text-orange-800',
          PENDING_VERIFICATION: 'bg-yellow-100 text-yellow-800',
          SUSPENDED: 'bg-red-100 text-red-800',
          INACTIVE: 'bg-gray-100 text-gray-800',
        };
        return (
          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusColors[user.status] || 'bg-gray-100 text-gray-800'}`}>
            {user.status.replace(/_/g, ' ')}
          </span>
        );
      },
    },
    {
      key: 'balance',
      header: 'Wallet',
      render: (user: User) => (
        <div>
          <p className="font-semibold text-gray-900">₦{user.wallet?.balance?.toLocaleString() || 0}</p>
          <p className="text-xs text-gray-500">
            Limit: ₦{user.wallet?.dailyLimit?.toLocaleString() || 0}/day
          </p>
        </div>
      ),
    },
    {
      key: 'transactions',
      header: 'Activity',
      render: (user: User) => (
        <p className="text-sm text-gray-600">{user._count?.payments || 0} payments</p>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (user: User) => (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setSelectedUser(user)}
            title="Set Limits"
          >
            <Settings className="h-4 w-4" />
          </Button>
          {user.status === 'ACTIVE' ? (
            <Button
              size="sm"
              variant="danger"
              onClick={() => suspendMutation.mutate(user.id)}
              disabled={suspendMutation.isPending}
              title="Suspend User"
            >
              <Ban className="h-4 w-4" />
            </Button>
          ) : user.status === 'SUSPENDED' ? (
            <Button
              size="sm"
              variant="success"
              onClick={() => activateMutation.mutate(user.id)}
              disabled={activateMutation.isPending}
              title="Activate User"
            >
              <UserCheck className="h-4 w-4" />
            </Button>
          ) : null}
          {user.status !== 'INACTIVE' && (
            <Button
              size="sm"
              variant="danger"
              onClick={() => deactivateMutation.mutate(user.id)}
              disabled={deactivateMutation.isPending}
              title="Remove User"
            >
              <UserX className="h-4 w-4" />
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
        <div>
          <p className="font-medium text-gray-900">{activity.userName}</p>
          <p className="text-xs text-gray-500">{activity.userEmail}</p>
        </div>
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
      render: (activity: Activity) => {
        const statusColors: Record<string, string> = {
          COMPLETED: 'bg-green-100 text-green-800',
          PENDING: 'bg-yellow-100 text-yellow-800',
          PROCESSING: 'bg-blue-100 text-blue-800',
          FAILED: 'bg-red-100 text-red-800',
          CANCELLED: 'bg-gray-100 text-gray-800',
        };
        return (
          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusColors[activity.status] || 'bg-gray-100 text-gray-800'}`}>
            {activity.status}
          </span>
        );
      },
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
        <p className="text-gray-600 mt-1">Manage users, monitor activities, and control platform settings</p>
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
            onClick={() => setActiveTab('pending')}
            className={`px-6 py-3 font-medium border-b-2 transition ${
              activeTab === 'pending'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>Pending Approvals</span>
              {stats && stats.pendingApprovalUsers > 0 && (
                <span className="ml-1 px-2 py-0.5 bg-orange-100 text-orange-600 text-xs font-semibold rounded-full">
                  {stats.pendingApprovalUsers}
                </span>
              )}
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
              <span>All Users</span>
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
                  <p className="text-3xl font-bold text-blue-600">{stats?.totalUsers?.toLocaleString() || 0}</p>
                  <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    {stats?.activeUsers || 0} active
                  </p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <Users className="h-8 w-8 text-blue-600" />
                </div>
              </div>
            </Card>

            <Card className="bg-gradient-to-br from-orange-50 to-yellow-50 border-orange-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Pending Approval</p>
                  <p className="text-3xl font-bold text-orange-600">{stats?.pendingApprovalUsers || 0}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Awaiting admin action
                  </p>
                </div>
                <div className="p-3 bg-orange-100 rounded-full">
                  <Clock className="h-8 w-8 text-orange-600" />
                </div>
              </div>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Transaction Volume</p>
                  <p className="text-2xl font-bold text-green-600">
                    ₦{((stats?.totalVolume || 0) / 1_000_000).toFixed(1)}M
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {stats?.completedTransactions?.toLocaleString() || 0} completed
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
                  <p className="text-sm text-gray-600 mb-1">Total Wallet Balance</p>
                  <p className="text-2xl font-bold text-purple-600">
                    ₦{((stats?.totalWalletBalance || 0) / 1_000_000).toFixed(2)}M
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Platform liquidity
                  </p>
                </div>
                <div className="p-3 bg-purple-100 rounded-full">
                  <TrendingUp className="h-8 w-8 text-purple-600" />
                </div>
              </div>
            </Card>
          </div>

          {/* Recent Activities */}
          <Card title="Recent System Activities">
            {activitiesLoading ? (
              <div className="py-8 text-center text-gray-500">Loading...</div>
            ) : activities && activities.length > 0 ? (
              <Table
                data={activities.slice(0, 10)}
                columns={activityColumns}
                emptyMessage="No activities found"
              />
            ) : (
              <div className="py-8 text-center text-gray-500">No activities found</div>
            )}
          </Card>
        </>
      )}

      {/* Pending Approvals Tab */}
      {activeTab === 'pending' && (
        <Card>
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Users Pending Approval</h3>
            <p className="text-sm text-gray-600">Review and approve new user registrations</p>
          </div>

          {pendingLoading ? (
            <div className="py-8 text-center text-gray-500">Loading...</div>
          ) : pendingUsers && pendingUsers.length > 0 ? (
            <Table
              data={pendingUsers}
              columns={pendingColumns}
              emptyMessage="No pending approvals"
            />
          ) : (
            <div className="py-8 text-center text-gray-500">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
              <p>All users have been reviewed!</p>
            </div>
          )}
        </Card>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <Card>
          <div className="mb-4 flex items-center gap-4">
            <input
              type="text"
              placeholder="Search users by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="PENDING_APPROVAL">Pending Approval</option>
              <option value="SUSPENDED">Suspended</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>

          {usersLoading ? (
            <div className="py-8 text-center text-gray-500">Loading...</div>
          ) : usersData?.users && usersData.users.length > 0 ? (
            <Table
              data={usersData.users}
              columns={userColumns}
              emptyMessage="No users found"
            />
          ) : (
            <div className="py-8 text-center text-gray-500">No users found</div>
          )}
        </Card>
      )}

      {/* Activities Tab */}
      {activeTab === 'activities' && (
        <Card>
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900">System Activities</h3>
            <p className="text-sm text-gray-600">Monitor all platform transactions and activities</p>
          </div>

          {activitiesLoading ? (
            <div className="py-8 text-center text-gray-500">Loading...</div>
          ) : activities && activities.length > 0 ? (
            <Table
              data={activities}
              columns={activityColumns}
              emptyMessage="No activities found"
            />
          ) : (
            <div className="py-8 text-center text-gray-500">No activities found</div>
          )}
        </Card>
      )}

      {/* Limit Modal */}
      {selectedUser && (
        <LimitModal
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
          onUpdate={(userId, limits) => updateLimitsMutation.mutate({ userId, limits })}
        />
      )}
    </div>
  );
}
