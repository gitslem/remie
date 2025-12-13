'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import { Card, Table, Button } from '@/components';
import { admin, auth as apiAuth } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
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
  };
}

interface Stats {
  totalUsers: number;
  activeUsers: number;
  pendingApprovals: number;
  suspendedUsers: number;
  totalTransactions: number;
  totalVolume: number;
  growthRate: number;
  usersByStatus: { status: string; count: number }[];
  transactionTrend: { date: string; count: number; volume: number }[];
}

interface Activity {
  id: string;
  type: string;
  userId: string;
  amount?: number;
  status: string;
  createdAt: string;
  user: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

// SetLimitsModal component
const SetLimitsModal = ({
  user,
  onClose,
  onUpdate
}: {
  user: User;
  onClose: () => void;
  onUpdate: () => void;
}) => {
  const [dailyLimit, setDailyLimit] = useState(user.wallet?.dailyLimit || 0);
  const [monthlyLimit, setMonthlyLimit] = useState(user.wallet?.monthlyLimit || 0);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      await admin.updateLimits(user.id, { dailyLimit, monthlyLimit });
      toast.success('Limits updated successfully');
      onUpdate();
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update limits');
    } finally {
      setSubmitting(false);
    }
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
              disabled={submitting}
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
              disabled={submitting}
            />
            <p className="text-xs text-gray-500 mt-1">
              Current spent: ₦{user.wallet?.monthlyFundingSpent?.toLocaleString() || 0}
            </p>
          </div>
        </div>

        <div className="flex gap-2 mt-6">
          <Button variant="outline" onClick={onClose} className="flex-1" disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} className="flex-1" disabled={submitting}>
            {submitting ? 'Updating...' : 'Update Limits'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default function AdminDashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);

  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'pending' | 'activities'>('overview');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Data state
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [pendingUsers, setPendingUsers] = useState<User[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);

  // Loading state
  const [statsLoading, setStatsLoading] = useState(false);
  const [usersLoading, setUsersLoading] = useState(false);
  const [pendingLoading, setPendingLoading] = useState(false);
  const [activitiesLoading, setActivitiesLoading] = useState(false);

  // Check admin authorization
  useEffect(() => {
    const checkAdminAccess = async () => {
      try {
        if (authLoading) return;

        if (!user) {
          toast.error('Please login to access admin dashboard');
          router.push('/auth/login');
          return;
        }

        // Fetch user profile to check role
        const response = await apiAuth.getMe();
        const userProfile = response.data.data;

        if (userProfile.role !== 'ADMIN') {
          toast.error('Access denied. Admin privileges required.');
          router.push('/dashboard');
          return;
        }

        setIsAuthorized(true);
      } catch (error: any) {
        console.error('Authorization error:', error);
        toast.error('Failed to verify admin access');
        router.push('/dashboard');
      } finally {
        setAuthChecking(false);
      }
    };

    checkAdminAccess();
  }, [user, authLoading, router]);

  // Fetch dashboard stats
  const fetchStats = async () => {
    try {
      setStatsLoading(true);
      const response = await admin.getStats();
      setStats(response.data.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
      toast.error('Failed to load dashboard stats');
    } finally {
      setStatsLoading(false);
    }
  };

  // Fetch users
  const fetchUsers = async () => {
    try {
      setUsersLoading(true);
      const response = await admin.getUsers({
        search: searchQuery || undefined,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
      });
      setUsers(response.data.data);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    } finally {
      setUsersLoading(false);
    }
  };

  // Fetch pending approvals
  const fetchPendingUsers = async () => {
    try {
      setPendingLoading(true);
      const response = await admin.getPendingApprovals();
      setPendingUsers(response.data.data);
    } catch (error) {
      console.error('Error fetching pending users:', error);
      toast.error('Failed to load pending approvals');
    } finally {
      setPendingLoading(false);
    }
  };

  // Fetch activities
  const fetchActivities = async () => {
    try {
      setActivitiesLoading(true);
      const response = await admin.getActivities(50);
      setActivities(response.data.data);
    } catch (error) {
      console.error('Error fetching activities:', error);
      toast.error('Failed to load activities');
    } finally {
      setActivitiesLoading(false);
    }
  };

  // Load data based on active tab
  useEffect(() => {
    if (activeTab === 'overview') {
      fetchStats();
    } else if (activeTab === 'users') {
      fetchUsers();
    } else if (activeTab === 'pending') {
      fetchPendingUsers();
    } else if (activeTab === 'activities') {
      fetchActivities();
    }
  }, [activeTab]);

  // Reload users when search or filter changes
  useEffect(() => {
    if (activeTab === 'users') {
      const timer = setTimeout(() => {
        fetchUsers();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [searchQuery, statusFilter]);

  // Action handlers
  const handleApprove = async (userId: string) => {
    try {
      await admin.approveUser(userId);
      toast.success('User approved successfully');
      fetchPendingUsers();
      fetchStats();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to approve user');
    }
  };

  const handleReject = async (userId: string) => {
    try {
      await admin.rejectUser(userId);
      toast.success('User rejected successfully');
      fetchPendingUsers();
      fetchStats();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to reject user');
    }
  };

  const handleSuspend = async (userId: string) => {
    try {
      await admin.suspendUser(userId);
      toast.success('User suspended successfully');
      fetchUsers();
      fetchStats();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to suspend user');
    }
  };

  const handleActivate = async (userId: string) => {
    try {
      await admin.activateUser(userId);
      toast.success('User activated successfully');
      fetchUsers();
      fetchStats();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to activate user');
    }
  };

  const handleDeactivate = async (userId: string) => {
    try {
      await admin.deactivateUser(userId);
      toast.success('User deactivated successfully');
      fetchUsers();
      fetchStats();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to deactivate user');
    }
  };

  const handleUpdateLimits = () => {
    fetchUsers();
    setSelectedUser(null);
  };

  // Table columns
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
          <button
            onClick={() => handleApprove(user.id)}
            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
            title="Approve"
          >
            <Check className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleReject(user.id)}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Reject"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  const statusColors: Record<string, string> = {
    ACTIVE: 'bg-green-100 text-green-800',
    PENDING_APPROVAL: 'bg-orange-100 text-orange-800',
    PENDING_VERIFICATION: 'bg-yellow-100 text-yellow-800',
    SUSPENDED: 'bg-red-100 text-red-800',
    INACTIVE: 'bg-gray-100 text-gray-800',
  };

  const usersColumns = [
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
      render: (user: User) => (
        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusColors[user.status] || 'bg-gray-100 text-gray-800'}`}>
          {user.status.replace(/_/g, ' ')}
        </span>
      ),
    },
    {
      key: 'wallet',
      header: 'Wallet',
      render: (user: User) => (
        <div>
          <p className="text-sm font-medium text-gray-900">
            ₦{user.wallet?.balance?.toLocaleString() || '0'}
          </p>
          <p className="text-xs text-gray-500">
            Limits: ₦{user.wallet?.dailyLimit?.toLocaleString() || '0'}/day
          </p>
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
          <button
            onClick={() => setSelectedUser(user)}
            className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
            title="Set Limits"
          >
            <Settings className="h-4 w-4" />
          </button>
          {user.status === 'ACTIVE' && (
            <button
              onClick={() => handleSuspend(user.id)}
              className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
              title="Suspend"
            >
              <Ban className="h-4 w-4" />
            </button>
          )}
          {user.status === 'SUSPENDED' && (
            <button
              onClick={() => handleActivate(user.id)}
              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
              title="Activate"
            >
              <UserCheck className="h-4 w-4" />
            </button>
          )}
          {user.status === 'ACTIVE' && (
            <button
              onClick={() => handleDeactivate(user.id)}
              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Deactivate"
            >
              <UserX className="h-4 w-4" />
            </button>
          )}
        </div>
      ),
    },
  ];

  const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];

  // Show loading while checking authorization
  if (authChecking || authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent"></div>
          <p className="mt-4 text-gray-600">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  // Don't render if not authorized
  if (!isAuthorized) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-1">Manage users, approvals, and platform activities</p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'overview'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  <span>Overview</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('pending')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'pending'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>Pending Approvals</span>
                  {stats && stats.pendingApprovals > 0 && (
                    <span className="ml-2 px-2 py-0.5 text-xs font-semibold text-white bg-orange-500 rounded-full">
                      {stats.pendingApprovals}
                    </span>
                  )}
                </div>
              </button>
              <button
                onClick={() => setActiveTab('users')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'users'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span>All Users</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('activities')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'activities'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  <span>Recent Activities</span>
                </div>
              </button>
            </nav>
          </div>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {statsLoading ? (
              <div className="text-center py-12">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent"></div>
                <p className="mt-2 text-gray-600">Loading stats...</p>
              </div>
            ) : stats ? (
              <>
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <Card className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Total Users</p>
                        <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalUsers}</p>
                      </div>
                      <div className="p-3 bg-indigo-100 rounded-lg">
                        <Users className="h-6 w-6 text-indigo-600" />
                      </div>
                    </div>
                  </Card>

                  <Card className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Active Users</p>
                        <p className="text-3xl font-bold text-gray-900 mt-2">{stats.activeUsers}</p>
                      </div>
                      <div className="p-3 bg-green-100 rounded-lg">
                        <UserCheck className="h-6 w-6 text-green-600" />
                      </div>
                    </div>
                  </Card>

                  <Card className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Pending Approvals</p>
                        <p className="text-3xl font-bold text-gray-900 mt-2">{stats.pendingApprovals}</p>
                      </div>
                      <div className="p-3 bg-orange-100 rounded-lg">
                        <Clock className="h-6 w-6 text-orange-600" />
                      </div>
                    </div>
                  </Card>

                  <Card className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Total Volume</p>
                        <p className="text-3xl font-bold text-gray-900 mt-2">
                          ₦{(stats.totalVolume / 1000).toFixed(1)}k
                        </p>
                      </div>
                      <div className="p-3 bg-purple-100 rounded-lg">
                        <DollarSign className="h-6 w-6 text-purple-600" />
                      </div>
                    </div>
                  </Card>
                </div>

                {/* Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Users by Status</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={stats.usersByStatus}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ status, count }) => `${status}: ${count}`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="count"
                        >
                          {stats.usersByStatus.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </Card>

                  <Card className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Transaction Trend</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={stats.transactionTrend}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Area type="monotone" dataKey="count" stroke="#6366f1" fill="#6366f1" fillOpacity={0.6} name="Count" />
                        <Area type="monotone" dataKey="volume" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.6} name="Volume (₦)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </Card>
                </div>
              </>
            ) : (
              <div className="text-center py-12 text-gray-500">No stats available</div>
            )}
          </div>
        )}

        {/* Pending Approvals Tab */}
        {activeTab === 'pending' && (
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Pending User Approvals</h2>
              <span className="text-sm text-gray-500">{pendingUsers.length} pending</span>
            </div>
            {pendingLoading ? (
              <div className="text-center py-12">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent"></div>
                <p className="mt-2 text-gray-600">Loading pending approvals...</p>
              </div>
            ) : pendingUsers.length > 0 ? (
              <Table columns={pendingColumns} data={pendingUsers} />
            ) : (
              <div className="text-center py-12">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
                <p className="text-gray-500">No pending approvals</p>
              </div>
            )}
          </Card>
        )}

        {/* All Users Tab */}
        {activeTab === 'users' && (
          <Card className="p-6">
            <div className="mb-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">All Users</h2>
              </div>
              <div className="flex gap-4">
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="ACTIVE">Active</option>
                  <option value="PENDING_APPROVAL">Pending Approval</option>
                  <option value="PENDING_VERIFICATION">Pending Verification</option>
                  <option value="SUSPENDED">Suspended</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
              </div>
            </div>
            {usersLoading ? (
              <div className="text-center py-12">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent"></div>
                <p className="mt-2 text-gray-600">Loading users...</p>
              </div>
            ) : users.length > 0 ? (
              <Table columns={usersColumns} data={users} />
            ) : (
              <div className="text-center py-12 text-gray-500">No users found</div>
            )}
          </Card>
        )}

        {/* Recent Activities Tab */}
        {activeTab === 'activities' && (
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Recent Activities</h2>
            {activitiesLoading ? (
              <div className="text-center py-12">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent"></div>
                <p className="mt-2 text-gray-600">Loading activities...</p>
              </div>
            ) : activities.length > 0 ? (
              <div className="space-y-4">
                {activities.map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between py-4 border-b border-gray-200 last:border-b-0">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                        <Activity className="h-5 w-5 text-indigo-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {activity.user.firstName} {activity.user.lastName}
                        </p>
                        <p className="text-sm text-gray-500">
                          {activity.type} • {new Date(activity.createdAt).toLocaleString('en-NG')}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      {activity.amount && (
                        <p className="font-medium text-gray-900">₦{activity.amount.toLocaleString()}</p>
                      )}
                      <p className={`text-sm ${
                        activity.status === 'COMPLETED' ? 'text-green-600' :
                        activity.status === 'FAILED' ? 'text-red-600' :
                        'text-orange-600'
                      }`}>
                        {activity.status}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">No activities found</div>
            )}
          </Card>
        )}

        {/* Set Limits Modal */}
        {selectedUser && (
          <SetLimitsModal
            user={selectedUser}
            onClose={() => setSelectedUser(null)}
            onUpdate={handleUpdateLimits}
          />
        )}
      </div>
    </div>
  );
}
