'use client';

import React, { useState } from 'react';
import { Card, Table, StatusBadge, LoadingSpinner } from '@/components';
import { useQuery } from '@tanstack/react-query';
import { remittance } from '@/lib/api';
import { Globe, ArrowUpRight, ArrowDownLeft, Filter } from 'lucide-react';

type RemittanceType = 'SENT' | 'RECEIVED';

interface Remittance {
  id: string;
  reference: string;
  senderName: string;
  senderEmail: string;
  recipientName: string;
  recipientEmail: string;
  amount: number;
  currency: string;
  exchangeRate: number;
  receivedAmount: number;
  destinationCurrency: string;
  country: string;
  relationship: string;
  purpose: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  createdAt: string;
}

export default function RemittanceHistoryPage() {
  const [activeTab, setActiveTab] = useState<RemittanceType>('SENT');
  const [page, setPage] = useState(1);

  const { data: sentData, isLoading: isLoadingSent } = useQuery({
    queryKey: ['remittance', 'sent', page],
    queryFn: async () => {
      const response = await remittance.getSent(page, 20);
      return response.data;
    },
    enabled: activeTab === 'SENT',
  });

  const { data: receivedData, isLoading: isLoadingReceived } = useQuery({
    queryKey: ['remittance', 'received', page],
    queryFn: async () => {
      const response = await remittance.getReceived(page, 20);
      return response.data;
    },
    enabled: activeTab === 'RECEIVED',
  });

  const data = activeTab === 'SENT' ? sentData : receivedData;
  const isLoading = activeTab === 'SENT' ? isLoadingSent : isLoadingReceived;
  const remittances: Remittance[] = data?.data || [];
  const pagination = data?.pagination;

  const sentColumns = [
    {
      key: 'recipient',
      header: 'Recipient',
      render: (item: Remittance) => (
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-full">
            <Globe className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <p className="font-medium text-gray-900">{item.recipientName}</p>
            <p className="text-xs text-gray-500">{item.recipientEmail}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'details',
      header: 'Details',
      render: (item: Remittance) => (
        <div>
          <p className="text-sm text-gray-900">{item.country}</p>
          <p className="text-xs text-gray-500">{item.purpose}</p>
          <p className="text-xs text-gray-400">{item.reference}</p>
        </div>
      ),
    },
    {
      key: 'amount',
      header: 'Amount Sent',
      render: (item: Remittance) => (
        <div>
          <p className="font-semibold text-red-600">-₦{item.amount.toLocaleString()}</p>
          <p className="text-xs text-gray-500">
            Rate: {item.exchangeRate.toFixed(4)}
          </p>
        </div>
      ),
    },
    {
      key: 'received',
      header: 'They Received',
      render: (item: Remittance) => (
        <p className="font-semibold text-gray-900">
          {getCurrencySymbol(item.destinationCurrency)}{item.receivedAmount.toFixed(2)}
        </p>
      ),
    },
    {
      key: 'date',
      header: 'Date',
      render: (item: Remittance) => (
        <p className="text-sm text-gray-600">
          {new Date(item.createdAt).toLocaleDateString('en-NG', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })}
        </p>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (item: Remittance) => <StatusBadge status={item.status} />,
    },
  ];

  const receivedColumns = [
    {
      key: 'sender',
      header: 'Sender',
      render: (item: Remittance) => (
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-100 rounded-full">
            <Globe className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <p className="font-medium text-gray-900">{item.senderName}</p>
            <p className="text-xs text-gray-500">{item.senderEmail}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'details',
      header: 'Details',
      render: (item: Remittance) => (
        <div>
          <p className="text-sm text-gray-900">{item.country}</p>
          <p className="text-xs text-gray-500">{item.purpose}</p>
          <p className="text-xs text-gray-400">{item.reference}</p>
        </div>
      ),
    },
    {
      key: 'amount',
      header: 'Amount Received',
      render: (item: Remittance) => (
        <div>
          <p className="font-semibold text-green-600">+₦{item.amount.toLocaleString()}</p>
          <p className="text-xs text-gray-500">
            From: {getCurrencySymbol(item.currency)}{item.receivedAmount.toFixed(2)}
          </p>
        </div>
      ),
    },
    {
      key: 'date',
      header: 'Date',
      render: (item: Remittance) => (
        <p className="text-sm text-gray-600">
          {new Date(item.createdAt).toLocaleDateString('en-NG', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })}
        </p>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (item: Remittance) => <StatusBadge status={item.status} />,
    },
  ];

  const columns = activeTab === 'SENT' ? sentColumns : receivedColumns;

  const totalSent = remittances
    .filter(r => r.status === 'COMPLETED')
    .reduce((sum, r) => sum + r.amount, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Remittance History</h1>
        <p className="text-gray-600 mt-1">Track all your international money transfers</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-red-50 to-orange-50 border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Sent</p>
              <p className="text-2xl font-bold text-red-600">
                ₦{remittances
                  .filter(r => activeTab === 'SENT' && r.status === 'COMPLETED')
                  .reduce((sum, r) => sum + r.amount, 0)
                  .toLocaleString()}
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
                ₦{remittances
                  .filter(r => activeTab === 'RECEIVED' && r.status === 'COMPLETED')
                  .reduce((sum, r) => sum + r.amount, 0)
                  .toLocaleString()}
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
              <p className="text-2xl font-bold text-blue-600">{remittances.length}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <Globe className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <Card>
        <div className="flex gap-2 border-b border-gray-200 -mx-6 -mt-6 px-6">
          <button
            onClick={() => {
              setActiveTab('SENT');
              setPage(1);
            }}
            className={`px-6 py-3 font-medium border-b-2 transition ${
              activeTab === 'SENT'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center gap-2">
              <ArrowUpRight className="h-4 w-4" />
              <span>Sent</span>
            </div>
          </button>
          <button
            onClick={() => {
              setActiveTab('RECEIVED');
              setPage(1);
            }}
            className={`px-6 py-3 font-medium border-b-2 transition ${
              activeTab === 'RECEIVED'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center gap-2">
              <ArrowDownLeft className="h-4 w-4" />
              <span>Received</span>
            </div>
          </button>
        </div>

        <div className="mt-6">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner />
            </div>
          ) : (
            <>
              <Table
                data={remittances}
                columns={columns}
                emptyMessage={`No ${activeTab.toLowerCase()} remittances found`}
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
        </div>
      </Card>
    </div>
  );
}

function getCurrencySymbol(currency: string): string {
  const symbols: Record<string, string> = {
    USD: '$',
    GBP: '£',
    EUR: '€',
    CAD: 'C$',
    ZAR: 'R',
    NGN: '₦',
  };
  return symbols[currency] || currency;
}
