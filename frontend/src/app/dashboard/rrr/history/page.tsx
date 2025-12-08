'use client';

import React, { useState } from 'react';
import { Card, Table, StatusBadge, LoadingSpinner, Button } from '@/components';
import { useQuery } from '@tanstack/react-query';
import { rrr } from '@/lib/api';
import { FileText, Download, Copy, CheckCircle } from 'lucide-react';

interface RRRPayment {
  id: string;
  rrrCode: string;
  amount: number;
  paymentType: string;
  institution: string;
  institutionCode: string;
  description: string;
  status: 'PENDING' | 'PAID' | 'EXPIRED' | 'FAILED';
  expiryDate: string;
  paidAt?: string;
  receiptNumber?: string;
  createdAt: string;
}

export default function RRRHistoryPage() {
  const [page, setPage] = useState(1);
  const [copiedRRR, setCopiedRRR] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['rrr', 'history', page],
    queryFn: async () => {
      const response = await rrr.getAll(page, 20);
      return response.data;
    },
  });

  const payments: RRRPayment[] = data?.data || [];
  const pagination = data?.pagination;

  const handleCopyRRR = (rrrCode: string) => {
    navigator.clipboard.writeText(rrrCode);
    setCopiedRRR(rrrCode);
    setTimeout(() => setCopiedRRR(''), 2000);
  };

  const columns = [
    {
      key: 'rrr',
      header: 'RRR Code',
      render: (payment: RRRPayment) => (
        <div className="flex items-center gap-2">
          <div className="p-2 bg-purple-100 rounded-full">
            <FileText className="h-5 w-5 text-purple-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="font-mono font-semibold text-gray-900">{payment.rrrCode}</p>
              <button
                onClick={() => handleCopyRRR(payment.rrrCode)}
                className="p-1 hover:bg-gray-100 rounded transition"
                title="Copy RRR"
              >
                {copiedRRR === payment.rrrCode ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4 text-gray-400" />
                )}
              </button>
            </div>
            <p className="text-xs text-gray-500">{payment.paymentType}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'institution',
      header: 'Institution',
      render: (payment: RRRPayment) => (
        <div>
          <p className="font-medium text-gray-900">{payment.institution}</p>
          <p className="text-xs text-gray-500">{payment.description}</p>
        </div>
      ),
    },
    {
      key: 'amount',
      header: 'Amount',
      render: (payment: RRRPayment) => (
        <p className="font-semibold text-gray-900">₦{payment.amount.toLocaleString()}</p>
      ),
    },
    {
      key: 'dates',
      header: 'Dates',
      render: (payment: RRRPayment) => (
        <div className="text-sm">
          <p className="text-gray-900">
            Created: {new Date(payment.createdAt).toLocaleDateString('en-NG', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </p>
          {payment.paidAt ? (
            <p className="text-green-600">
              Paid: {new Date(payment.paidAt).toLocaleDateString('en-NG', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </p>
          ) : (
            <p className="text-orange-600">
              Expires: {new Date(payment.expiryDate).toLocaleDateString('en-NG', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </p>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (payment: RRRPayment) => <StatusBadge status={payment.status} />,
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (payment: RRRPayment) => (
        <div className="flex gap-2">
          {payment.status === 'PAID' && payment.receiptNumber && (
            <button
              className="p-2 text-indigo-600 hover:bg-indigo-50 rounded transition"
              title="Download Receipt"
            >
              <Download className="h-4 w-4" />
            </button>
          )}
        </div>
      ),
    },
  ];

  const stats = {
    total: payments.length,
    paid: payments.filter(p => p.status === 'PAID').length,
    pending: payments.filter(p => p.status === 'PENDING').length,
    totalAmount: payments.filter(p => p.status === 'PAID').reduce((sum, p) => sum + p.amount, 0),
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">RRR Payment History</h1>
        <p className="text-gray-600 mt-1">Track all your RRR-based payments</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Payments</p>
              <p className="text-2xl font-bold text-purple-600">{stats.total}</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <FileText className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Paid</p>
              <p className="text-2xl font-bold text-green-600">{stats.paid}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-yellow-50 border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Pending</p>
              <p className="text-2xl font-bold text-orange-600">{stats.pending}</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-full">
              <span className="text-2xl">⏳</span>
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Paid</p>
              <p className="text-xl font-bold text-blue-600">
                ₦{stats.totalAmount.toLocaleString()}
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <span className="text-2xl">💰</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Payments Table */}
      <Card>
        {isLoading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner />
          </div>
        ) : (
          <>
            <Table
              data={payments}
              columns={columns}
              emptyMessage="No RRR payments found"
            />

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200">
                <p className="text-sm text-gray-600">
                  Showing {((page - 1) * 20) + 1} to {Math.min(page * 20, pagination.total)} of {pagination.total} payments
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

      {/* Info Card */}
      <Card title="About RRR Payments" className="bg-gradient-to-br from-purple-50 to-blue-50">
        <div className="space-y-3 text-sm text-gray-700">
          <p>
            <strong>What is RRR?</strong> RRR (Remita Retrieval Reference) is a unique payment reference
            used for institutional payments in Nigeria.
          </p>
          <p>
            <strong>Payment Types:</strong> School fees, JAMB, WAEC, NIN, Government services, and more.
          </p>
          <p>
            <strong>Validity:</strong> RRR codes are valid for 7 days from generation. After expiry, you'll
            need to generate a new RRR.
          </p>
          <p>
            <strong>Receipts:</strong> Once paid, you'll receive an official receipt via email automatically.
          </p>
        </div>
      </Card>
    </div>
  );
}
