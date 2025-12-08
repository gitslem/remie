'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function TransactionsPage() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchTransactions();
    }
  }, [user]);

  const fetchTransactions = async () => {
    if (!db || !user) {
      setLoading(false);
      return;
    }
    try {
      const allTransactions: any[] = [];

      // Fetch P2P transfers (sent)
      const p2pQuery = query(
        collection(db, 'p2pTransfers'),
        where('senderId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
      const p2pSnapshot = await getDocs(p2pQuery);
      p2pSnapshot.forEach(doc => {
        allTransactions.push({
          id: doc.id,
          type: 'P2P_SENT',
          ...doc.data()
        });
      });

      // Fetch RRR payments
      const rrrQuery = query(
        collection(db, 'rrrPayments'),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
      const rrrSnapshot = await getDocs(rrrQuery);
      rrrSnapshot.forEach(doc => {
        allTransactions.push({
          id: doc.id,
          type: 'RRR',
          ...doc.data()
        });
      });

      // Sort by date
      allTransactions.sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return dateB - dateA;
      });

      setTransactions(allTransactions);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTransactions = transactions.filter(t => {
    if (filter === 'all') return true;
    return t.type === filter;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Transaction History</h1>
          <p className="text-gray-600 mt-1">View all your payments and transfers</p>
        </div>

        {/* Filter */}
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filter === 'all'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('P2P_SENT')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filter === 'P2P_SENT'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            P2P
          </button>
          <button
            onClick={() => setFilter('RRR')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filter === 'RRR'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            RRR
          </button>
        </div>
      </div>

      {/* Transactions List */}
      <div className="bg-white rounded-2xl shadow-md overflow-hidden">
        {filteredTransactions.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <svg
              className="w-16 h-16 mx-auto mb-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <p>No transactions found</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredTransactions.map((transaction) => (
              <TransactionItem key={transaction.id} transaction={transaction} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function TransactionItem({ transaction }: { transaction: any }) {
  const getTypeIcon = () => {
    switch (transaction.type) {
      case 'P2P_SENT':
        return (
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
            </svg>
          </div>
        );
      case 'RRR':
        return (
          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
    }
  };

  const getTypeName = () => {
    switch (transaction.type) {
      case 'P2P_SENT':
        return 'P2P Transfer';
      case 'RRR':
        return 'RRR Payment';
      default:
        return 'Transaction';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
      case 'SUCCESS':
        return 'text-green-600 bg-green-100';
      case 'PENDING':
        return 'text-yellow-600 bg-yellow-100';
      case 'FAILED':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="p-6 hover:bg-gray-50 transition">
      <div className="flex items-center justify-between">
        <div className="flex items-center flex-1">
          {getTypeIcon()}
          <div className="ml-4 flex-1">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">{getTypeName()}</h3>
                <p className="text-sm text-gray-600 mt-1">
                  {new Date(transaction.createdAt).toLocaleString()}
                </p>
              </div>
              <div className="text-right ml-4">
                <p className={`text-lg font-bold ${
                  transaction.type === 'P2P_SENT' ? 'text-red-600' : 'text-gray-900'
                }`}>
                  {transaction.type === 'P2P_SENT' ? '-' : ''}₦{transaction.amount?.toLocaleString()}
                </p>
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(transaction.status)}`}>
                  {transaction.status}
                </span>
              </div>
            </div>
            {transaction.description && (
              <p className="text-sm text-gray-500 mt-2">{transaction.description}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
