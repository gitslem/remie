'use client';

import React, { useState } from 'react';
import { Card, Table, Badge, StatusBadge, LoadingSpinner } from '@/components';
import { useWallet } from '@/hooks/useWallet';
import { Download, Filter, Search } from 'lucide-react';

type TransactionType = 'FUNDING' | 'WITHDRAWAL' | 'P2P_SEND' | 'P2P_RECEIVE' | 'RRR_PAYMENT' | 'LOAN_DISBURSEMENT' | 'LOAN_REPAYMENT' | 'REMITTANCE_SEND' | 'REMITTANCE_RECEIVE';
type TransactionStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'REVERSED';

interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  status: TransactionStatus;
  reference: string;
  description: string;
  createdAt: string;
  metadata?: any;
}

export default function TransactionsPage() {
  const [page, setPage] = useState(1);
  const [filterType, setFilterType] = useState<TransactionType | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const { useTransactions } = useWallet();
  const { data, isLoading } = useTransactions(page, 20);

  const transactions: Transaction[] = data?.data || [];
  const pagination = data?.pagination;

  const getTransactionIcon = (type: TransactionType) => {
    const iconMap = {
      FUNDING: '💳',
      WITHDRAWAL: '🏦',
      P2P_SEND: '↗️',
      P2P_RECEIVE: '↙️',
      RRR_PAYMENT: '🎓',
      LOAN_DISBURSEMENT: '💰',
      LOAN_REPAYMENT: '💸',
      REMITTANCE_SEND: '🌍',
      REMITTANCE_RECEIVE: '🌎',
    };
    return iconMap[type] || '📝';
  };

  const getTransactionColor = (type: TransactionType) => {
    const colorMap = {
      FUNDING: 'text-green-600',
      WITHDRAWAL: 'text-orange-600',
      P2P_SEND: 'text-red-600',
      P2P_RECEIVE: 'text-green-600',
      RRR_PAYMENT: 'text-purple-600',
      LOAN_DISBURSEMENT: 'text-green-600',
      LOAN_REPAYMENT: 'text-red-600',
      REMITTANCE_SEND: 'text-blue-600',
      REMITTANCE_RECEIVE: 'text-green-600',
    };
    return colorMap[type] || 'text-gray-600';
  };

  const getAmountPrefix = (type: TransactionType) => {
    const debitTypes: TransactionType[] = ['WITHDRAWAL', 'P2P_SEND', 'RRR_PAYMENT', 'LOAN_REPAYMENT', 'REMITTANCE_SEND'];
    return debitTypes.includes(type) ? '-' : '+';
  };

  const formatTransactionType = (type: TransactionType) => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const filteredTransactions = transactions.filter(transaction => {
    const matchesType = filterType === 'ALL' || transaction.type === filterType;
    const matchesSearch =
      transaction.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
      transaction.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  const columns = [
    {
      key: 'type',
      header: 'Type',
      render: (transaction: Transaction) => (
        <div className="flex items-center gap-3">
          <span className="text-2xl">{getTransactionIcon(transaction.type)}</span>
          <div>
            <p className="font-medium text-gray-900">{formatTransactionType(transaction.type)}</p>
            <p className="text-xs text-gray-500">{transaction.reference}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'description',
      header: 'Description',
      render: (transaction: Transaction) => (
        <div className="max-w-xs">
          <p className="text-sm text-gray-900 truncate">{transaction.description}</p>
          <p className="text-xs text-gray-500">
            {new Date(transaction.createdAt).toLocaleString('en-NG', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        </div>
      ),
    },
    {
      key: 'amount',
      header: 'Amount',
      render: (transaction: Transaction) => {
        const prefix = getAmountPrefix(transaction.type);
        const color = getTransactionColor(transaction.type);
        return (
          <span className={`font-semibold ${color}`}>
            {prefix}₦{transaction.amount.toLocaleString()}
          </span>
        );
      },
    },
    {
      key: 'status',
      header: 'Status',
      render: (transaction: Transaction) => (
        <StatusBadge status={transaction.status} />
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Transaction History</h1>
        <p className="text-gray-600 mt-1">View all your wallet transactions</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Received</p>
              <p className="text-2xl font-bold text-green-600">
                ₦{transactions
                  .filter(t => getAmountPrefix(t.type) === '+' && t.status === 'COMPLETED')
                  .reduce((sum, t) => sum + t.amount, 0)
                  .toLocaleString()}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <span className="text-3xl">↙️</span>
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-orange-50 border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Spent</p>
              <p className="text-2xl font-bold text-red-600">
                ₦{transactions
                  .filter(t => getAmountPrefix(t.type) === '-' && t.status === 'COMPLETED')
                  .reduce((sum, t) => sum + t.amount, 0)
                  .toLocaleString()}
              </p>
            </div>
            <div className="p-3 bg-red-100 rounded-full">
              <span className="text-3xl">↗️</span>
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Transactions</p>
              <p className="text-2xl font-bold text-blue-600">{transactions.length}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <span className="text-3xl">📊</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by reference or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Filter by Type */}
          <div className="md:w-64">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as TransactionType | 'ALL')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="ALL">All Transactions</option>
              <option value="FUNDING">Funding</option>
              <option value="WITHDRAWAL">Withdrawal</option>
              <option value="P2P_SEND">P2P Send</option>
              <option value="P2P_RECEIVE">P2P Receive</option>
              <option value="RRR_PAYMENT">RRR Payment</option>
              <option value="LOAN_DISBURSEMENT">Loan Disbursement</option>
              <option value="LOAN_REPAYMENT">Loan Repayment</option>
              <option value="REMITTANCE_SEND">Remittance Send</option>
              <option value="REMITTANCE_RECEIVE">Remittance Receive</option>
            </select>
          </div>

          {/* Export Button */}
          <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition">
            <Download className="h-5 w-5" />
            <span>Export</span>
          </button>
        </div>
      </Card>

      {/* Transactions Table */}
      <Card>
        {isLoading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner />
          </div>
        ) : (
          <>
            <Table
              data={filteredTransactions}
              columns={columns}
              emptyMessage="No transactions found"
            />

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200">
                <p className="text-sm text-gray-600">
                  Showing {((page - 1) * 20) + 1} to {Math.min(page * 20, pagination.total)} of {pagination.total} transactions
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
    </div>
  );
}
