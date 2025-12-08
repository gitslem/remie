'use client';

import React, { useState } from 'react';
import { Card, Table, StatusBadge, LoadingSpinner } from '@/components';
import { useQuery } from '@tanstack/react-query';
import { p2p } from '@/lib/api';
import { Send, ArrowDownLeft, ArrowUpRight, Users } from 'lucide-react';

interface P2PTransfer {
  id: string;
  reference: string;
  senderName: string;
  senderEmail: string;
  recipientName: string;
  recipientEmail: string;
  amount: number;
  category: string;
  note?: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  createdAt: string;
  type?: 'SENT' | 'RECEIVED'; // Added by frontend based on user
}

export default function P2PHistoryPage() {
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['p2p', 'transfers', page],
    queryFn: async () => {
      const response = await p2p.getTransfers(page, 20);
      return response.data;
    },
  });

  const transfers: P2PTransfer[] = data?.data || [];
  const pagination = data?.pagination;

  const columns = [
    {
      key: 'type',
      header: 'Type',
      render: (transfer: P2PTransfer) => {
        const isSent = transfer.type === 'SENT';
        return (
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${isSent ? 'bg-red-100' : 'bg-green-100'}`}>
              {isSent ? (
                <ArrowUpRight className={`h-5 w-5 text-red-600`} />
              ) : (
                <ArrowDownLeft className={`h-5 w-5 text-green-600`} />
              )}
            </div>
            <div>
              <p className={`font-medium ${isSent ? 'text-red-600' : 'text-green-600'}`}>
                {isSent ? 'Sent' : 'Received'}
              </p>
              <p className="text-xs text-gray-500">{transfer.category}</p>
            </div>
          </div>
        );
      },
    },
    {
      key: 'party',
      header: 'Sent To / Received From',
      render: (transfer: P2PTransfer) => {
        const isSent = transfer.type === 'SENT';
        const name = isSent ? transfer.recipientName : transfer.senderName;
        const email = isSent ? transfer.recipientEmail : transfer.senderEmail;
        return (
          <div>
            <p className="font-medium text-gray-900">{name}</p>
            <p className="text-xs text-gray-500">{email}</p>
          </div>
        );
      },
    },
    {
      key: 'details',
      header: 'Details',
      render: (transfer: P2PTransfer) => (
        <div>
          <p className="text-sm text-gray-900">{transfer.note || 'No note'}</p>
          <p className="text-xs text-gray-400 font-mono">{transfer.reference}</p>
        </div>
      ),
    },
    {
      key: 'amount',
      header: 'Amount',
      render: (transfer: P2PTransfer) => {
        const isSent = transfer.type === 'SENT';
        return (
          <p className={`font-semibold ${isSent ? 'text-red-600' : 'text-green-600'}`}>
            {isSent ? '-' : '+'}₦{transfer.amount.toLocaleString()}
          </p>
        );
      },
    },
    {
      key: 'date',
      header: 'Date',
      render: (transfer: P2PTransfer) => (
        <p className="text-sm text-gray-600">
          {new Date(transfer.createdAt).toLocaleString('en-NG', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (transfer: P2PTransfer) => <StatusBadge status={transfer.status} />,
    },
  ];

  const stats = {
    totalSent: transfers
      .filter(t => t.type === 'SENT' && t.status === 'COMPLETED')
      .reduce((sum, t) => sum + t.amount, 0),
    totalReceived: transfers
      .filter(t => t.type === 'RECEIVED' && t.status === 'COMPLETED')
      .reduce((sum, t) => sum + t.amount, 0),
    totalTransfers: transfers.length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">P2P Transfer History</h1>
        <p className="text-gray-600 mt-1">Track all your peer-to-peer transfers</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-red-50 to-orange-50 border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Sent</p>
              <p className="text-2xl font-bold text-red-600">
                ₦{stats.totalSent.toLocaleString()}
              </p>
            </div>
            <div className="p-3 bg-red-100 rounded-full">
              <ArrowUpRight className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Received</p>
              <p className="text-2xl font-bold text-green-600">
                ₦{stats.totalReceived.toLocaleString()}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <ArrowDownLeft className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Transfers</p>
              <p className="text-2xl font-bold text-blue-600">{stats.totalTransfers}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Transfers Table */}
      <Card>
        {isLoading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner />
          </div>
        ) : (
          <>
            <Table
              data={transfers}
              columns={columns}
              emptyMessage="No P2P transfers found"
            />

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200">
                <p className="text-sm text-gray-600">
                  Showing {((page - 1) * 20) + 1} to {Math.min(page * 20, pagination.total)} of {pagination.total} transfers
                </p>

                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>

                  <div className="flex gap-1">
                    {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                      const pageNum = i + 1;
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setPage(pageNum)}
                          className={`px-4 py-2 rounded-lg ${
                            page === pageNum
                              ? 'bg-indigo-600 text-white'
                              : 'border border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                    disabled={page === pagination.totalPages}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card title="Transfer Categories" className="bg-gradient-to-br from-purple-50 to-pink-50">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-lg">🏠</span>
              <span className="text-sm text-gray-700">Hostel & Accommodation</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg">📚</span>
              <span className="text-sm text-gray-700">Books & Materials</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg">🍕</span>
              <span className="text-sm text-gray-700">Food & Groceries</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg">🎓</span>
              <span className="text-sm text-gray-700">Project & Group Work</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg">🎉</span>
              <span className="text-sm text-gray-700">Events & Social</span>
            </div>
          </div>
        </Card>

        <Card title="Benefits" className="bg-gradient-to-br from-blue-50 to-cyan-50">
          <div className="space-y-3 text-sm text-gray-700">
            <div className="flex items-start gap-2">
              <span className="text-green-600 font-bold">✓</span>
              <span><strong>Zero Fees:</strong> No charges for P2P transfers</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-green-600 font-bold">✓</span>
              <span><strong>Instant:</strong> Money arrives immediately</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-green-600 font-bold">✓</span>
              <span><strong>Secure:</strong> Bank-level encryption</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-green-600 font-bold">✓</span>
              <span><strong>Easy:</strong> Send using email or phone</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
