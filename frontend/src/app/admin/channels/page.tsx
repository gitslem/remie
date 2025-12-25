'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import {
  MessageCircle,
  Plus,
  Edit,
  Trash2,
  Users,
  Lock,
  Globe,
  Crown,
  Shield,
  Search,
  Save,
  X,
  Check,
  ArrowLeft,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import Link from 'next/link';

interface ChatChannel {
  id: string;
  name: string;
  slug: string;
  description: string;
  type: 'PUBLIC' | 'PRIVATE' | 'PREMIUM' | 'TIER_BASED';
  requiredTier?: 'FREE' | 'BASIC' | 'PREMIUM' | 'ENTERPRISE';
  allowedUsers?: string[];
  icon?: string;
  color?: string;
  order: number;
  isActive: boolean;
  isArchived: boolean;
  createdAt: string;
}

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

export default function ChatChannelsAdminPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [channels, setChannels] = useState<ChatChannel[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingChannel, setEditingChannel] = useState<ChatChannel | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'PUBLIC' as ChatChannel['type'],
    requiredTier: undefined as ChatChannel['requiredTier'] | undefined,
    color: '#6366F1',
    icon: '💬',
    order: 0,
  });

  useEffect(() => {
    fetchChannels();
    fetchUsers();
  }, []);

  const fetchChannels = async () => {
    try {
      // TODO: Replace with actual API call
      // Simulated data
      const mockChannels: ChatChannel[] = [
        {
          id: '1',
          name: 'General',
          slug: 'general',
          description: 'General discussion for all users',
          type: 'PUBLIC',
          icon: '💬',
          color: '#6366F1',
          order: 1,
          isActive: true,
          isArchived: false,
          createdAt: new Date().toISOString(),
        },
        {
          id: '2',
          name: 'Announcements',
          slug: 'announcements',
          description: 'Official announcements and updates',
          type: 'PUBLIC',
          icon: '📢',
          color: '#8B5CF6',
          order: 2,
          isActive: true,
          isArchived: false,
          createdAt: new Date().toISOString(),
        },
        {
          id: '3',
          name: 'Student Communities',
          slug: 'students',
          description: 'For verified students',
          type: 'TIER_BASED',
          requiredTier: 'BASIC',
          icon: '🎓',
          color: '#EC4899',
          order: 3,
          isActive: true,
          isArchived: false,
          createdAt: new Date().toISOString(),
        },
        {
          id: '4',
          name: 'Premium Support',
          slug: 'premium-support',
          description: 'Exclusive support for premium members',
          type: 'TIER_BASED',
          requiredTier: 'PREMIUM',
          icon: '👑',
          color: '#F59E0B',
          order: 4,
          isActive: true,
          isArchived: false,
          createdAt: new Date().toISOString(),
        },
        {
          id: '5',
          name: 'VIP Lounge',
          slug: 'vip',
          description: 'Private channel for select members',
          type: 'PRIVATE',
          allowedUsers: ['user1', 'user2'],
          icon: '⭐',
          color: '#10B981',
          order: 5,
          isActive: true,
          isArchived: false,
          createdAt: new Date().toISOString(),
        },
      ];

      setChannels(mockChannels);
    } catch (error) {
      console.error('Error fetching channels:', error);
      toast.error('Failed to load channels');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      // TODO: Replace with actual API call
      // Simulated data
      const mockUsers: User[] = [
        { id: 'user1', email: 'john@example.com', firstName: 'John', lastName: 'Doe' },
        { id: 'user2', email: 'jane@example.com', firstName: 'Jane', lastName: 'Smith' },
        { id: 'user3', email: 'bob@example.com', firstName: 'Bob', lastName: 'Johnson' },
      ];

      setUsers(mockUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleCreateChannel = () => {
    setEditingChannel(null);
    setFormData({
      name: '',
      description: '',
      type: 'PUBLIC',
      requiredTier: undefined,
      color: '#6366F1',
      icon: '💬',
      order: channels.length + 1,
    });
    setShowModal(true);
  };

  const handleEditChannel = (channel: ChatChannel) => {
    setEditingChannel(channel);
    setFormData({
      name: channel.name,
      description: channel.description,
      type: channel.type,
      requiredTier: channel.requiredTier,
      color: channel.color || '#6366F1',
      icon: channel.icon || '💬',
      order: channel.order,
    });
    setShowModal(true);
  };

  const handleSaveChannel = async () => {
    try {
      // TODO: Implement actual API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      toast.success(editingChannel ? 'Channel updated successfully' : 'Channel created successfully');
      setShowModal(false);
      fetchChannels();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save channel');
    }
  };

  const handleDeleteChannel = async (channelId: string) => {
    if (!confirm('Are you sure you want to delete this channel?')) return;

    try {
      // TODO: Implement actual API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      toast.success('Channel deleted successfully');
      fetchChannels();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete channel');
    }
  };

  const handleManageUsers = (channelId: string) => {
    setSelectedChannelId(channelId);
    setShowUserModal(true);
  };

  const handleToggleUserAccess = async (userId: string) => {
    try {
      // TODO: Implement actual API call
      await new Promise((resolve) => setTimeout(resolve, 500));

      toast.success('User access updated');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update user access');
    }
  };

  const getTypeIcon = (type: ChatChannel['type']) => {
    switch (type) {
      case 'PUBLIC':
        return <Globe className="w-5 h-5" />;
      case 'PRIVATE':
        return <Lock className="w-5 h-5" />;
      case 'PREMIUM':
        return <Crown className="w-5 h-5" />;
      case 'TIER_BASED':
        return <Shield className="w-5 h-5" />;
      default:
        return <MessageCircle className="w-5 h-5" />;
    }
  };

  const getTypeColor = (type: ChatChannel['type']) => {
    switch (type) {
      case 'PUBLIC':
        return 'bg-green-100 text-green-800';
      case 'PRIVATE':
        return 'bg-red-100 text-red-800';
      case 'PREMIUM':
        return 'bg-yellow-100 text-yellow-800';
      case 'TIER_BASED':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
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
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link
              href="/admin"
              className="w-10 h-10 bg-white rounded-xl shadow-md flex items-center justify-center hover:shadow-lg transition"
            >
              <ArrowLeft className="w-5 h-5 text-gray-700" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Chat Channels Management</h1>
              <p className="text-gray-600 mt-1">Control chat channel access and permissions</p>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <div className="flex gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search channels..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </div>

            <button
              onClick={handleCreateChannel}
              className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition"
            >
              <Plus className="w-5 h-5" />
              Create Channel
            </button>
          </div>
        </div>

        {/* Channels Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {channels
            .filter((channel) =>
              channel.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              channel.description.toLowerCase().includes(searchQuery.toLowerCase())
            )
            .map((channel) => (
              <div
                key={channel.id}
                className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all border border-gray-100"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                      style={{ backgroundColor: channel.color + '20' }}
                    >
                      {channel.icon}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">{channel.name}</h3>
                      <p className="text-sm text-gray-500">/{channel.slug}</p>
                    </div>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${getTypeColor(
                      channel.type
                    )}`}
                  >
                    {getTypeIcon(channel.type)}
                    {channel.type}
                  </span>
                </div>

                <p className="text-gray-600 text-sm mb-4 leading-relaxed">{channel.description}</p>

                {channel.requiredTier && (
                  <div className="mb-4 p-3 bg-purple-50 rounded-xl">
                    <p className="text-sm font-semibold text-purple-900">
                      Required Tier: {channel.requiredTier}
                    </p>
                  </div>
                )}

                {channel.type === 'PRIVATE' && (
                  <div className="mb-4 p-3 bg-blue-50 rounded-xl flex items-center justify-between">
                    <p className="text-sm font-semibold text-blue-900">
                      {channel.allowedUsers?.length || 0} users
                    </p>
                    <button
                      onClick={() => handleManageUsers(channel.id)}
                      className="text-sm text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1"
                    >
                      <Users className="w-4 h-4" />
                      Manage
                    </button>
                  </div>
                )}

                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => handleEditChannel(channel)}
                    className="flex-1 bg-indigo-50 text-indigo-600 py-2 rounded-xl font-semibold hover:bg-indigo-100 transition flex items-center justify-center gap-2"
                  >
                    <Edit className="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteChannel(channel.id)}
                    className="flex-1 bg-red-50 text-red-600 py-2 rounded-xl font-semibold hover:bg-red-100 transition flex items-center justify-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              </div>
            ))}
        </div>

        {/* Channel Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  {editingChannel ? 'Edit Channel' : 'Create Channel'}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center hover:bg-gray-200 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Channel Name
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="e.g., General Chat"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Channel Type
                    </label>
                    <select
                      value={formData.type}
                      onChange={(e) =>
                        setFormData({ ...formData, type: e.target.value as ChatChannel['type'] })
                      }
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                      <option value="PUBLIC">Public</option>
                      <option value="PRIVATE">Private</option>
                      <option value="PREMIUM">Premium</option>
                      <option value="TIER_BASED">Tier Based</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                    placeholder="Describe the purpose of this channel..."
                  />
                </div>

                {formData.type === 'TIER_BASED' && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Required Tier
                    </label>
                    <select
                      value={formData.requiredTier || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          requiredTier: e.target.value as ChatChannel['requiredTier'],
                        })
                      }
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                      <option value="">Select tier</option>
                      <option value="FREE">Free</option>
                      <option value="BASIC">Basic</option>
                      <option value="PREMIUM">Premium</option>
                      <option value="ENTERPRISE">Enterprise</option>
                    </select>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Icon</label>
                    <input
                      type="text"
                      value={formData.icon}
                      onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="💬"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Color</label>
                    <input
                      type="color"
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      className="w-full h-12 border-2 border-gray-200 rounded-xl cursor-pointer"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setShowModal(false)}
                    className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-200 transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveChannel}
                    className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition flex items-center justify-center gap-2"
                  >
                    <Save className="w-5 h-5" />
                    Save Channel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* User Access Modal */}
        {showUserModal && selectedChannelId && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Manage User Access</h2>
                <button
                  onClick={() => setShowUserModal(false)}
                  className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center hover:bg-gray-200 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3">
                {users.map((user) => {
                  const channel = channels.find((c) => c.id === selectedChannelId);
                  const hasAccess = channel?.allowedUsers?.includes(user.id) || false;

                  return (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                          <span className="text-indigo-600 font-semibold">
                            {user.firstName[0]}
                            {user.lastName[0]}
                          </span>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">
                            {user.firstName} {user.lastName}
                          </p>
                          <p className="text-sm text-gray-500">{user.email}</p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleToggleUserAccess(user.id)}
                        className={`px-4 py-2 rounded-xl font-semibold transition flex items-center gap-2 ${
                          hasAccess
                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        {hasAccess ? (
                          <>
                            <Check className="w-4 h-4" />
                            Granted
                          </>
                        ) : (
                          <>
                            <X className="w-4 h-4" />
                            Denied
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
