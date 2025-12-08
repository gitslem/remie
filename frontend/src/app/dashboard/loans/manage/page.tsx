'use client';

import React, { useState } from 'react';
import { Card, Table, StatusBadge, LoadingSpinner, Button, Input } from '@/components';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { loans } from '@/lib/api';
import { useToast } from '@/components';
import { TrendingUp, Calendar, DollarSign, AlertCircle, CheckCircle } from 'lucide-react';

interface Loan {
  id: string;
  amount: number;
  tenure: number;
  purpose: string;
  interestRate: number;
  interest: number;
  totalRepayment: number;
  amountPaid: number;
  status: 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'DEFAULTED' | 'REJECTED';
  dueDate: string;
  createdAt: string;
  approvedAt?: string;
}

export default function ManageLoansPage() {
  const [page, setPage] = useState(1);
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [repaymentAmount, setRepaymentAmount] = useState('');

  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const { data, isLoading } = useQuery({
    queryKey: ['loans', 'all', page],
    queryFn: async () => {
      const response = await loans.getAll(page, 20);
      return response.data;
    },
  });

  const repayLoan = useMutation({
    mutationFn: async ({ loanId, amount }: { loanId: string; amount: number }) => {
      const response = await loans.repay(loanId, amount);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loans'] });
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      showToast('success', 'Loan repayment successful');
      setSelectedLoan(null);
      setRepaymentAmount('');
    },
    onError: (error: any) => {
      showToast('error', error.response?.data?.message || 'Repayment failed');
    },
  });

  const loanList: Loan[] = data?.data || [];
  const pagination = data?.pagination;

  const handleRepayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLoan || !repaymentAmount) return;

    const amount = parseFloat(repaymentAmount);
    if (amount <= 0 || amount > (selectedLoan.totalRepayment - selectedLoan.amountPaid)) {
      showToast('error', 'Invalid repayment amount');
      return;
    }

    repayLoan.mutate({ loanId: selectedLoan.id, amount });
  };

  const columns = [
    {
      key: 'details',
      header: 'Loan Details',
      render: (loan: Loan) => (
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 rounded-full">
            <DollarSign className="h-5 w-5 text-purple-600" />
          </div>
          <div>
            <p className="font-medium text-gray-900">₦{loan.amount.toLocaleString()}</p>
            <p className="text-xs text-gray-500">{loan.purpose}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'tenure',
      header: 'Tenure',
      render: (loan: Loan) => (
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-gray-400" />
          <span className="text-sm text-gray-900">{loan.tenure} days</span>
        </div>
      ),
    },
    {
      key: 'repayment',
      header: 'Repayment',
      render: (loan: Loan) => (
        <div>
          <p className="font-semibold text-gray-900">
            ₦{loan.totalRepayment.toLocaleString()}
          </p>
          <p className="text-xs text-gray-500">
            Paid: ₦{loan.amountPaid.toLocaleString()}
          </p>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
            <div
              className="bg-green-600 h-2 rounded-full"
              style={{ width: `${(loan.amountPaid / loan.totalRepayment) * 100}%` }}
            />
          </div>
        </div>
      ),
    },
    {
      key: 'dueDate',
      header: 'Due Date',
      render: (loan: Loan) => {
        const isOverdue = new Date(loan.dueDate) < new Date() && loan.status === 'ACTIVE';
        return (
          <div>
            <p className={`text-sm ${isOverdue ? 'text-red-600 font-medium' : 'text-gray-900'}`}>
              {new Date(loan.dueDate).toLocaleDateString('en-NG', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </p>
            {isOverdue && (
              <p className="text-xs text-red-600 flex items-center gap-1 mt-1">
                <AlertCircle className="h-3 w-3" />
                Overdue
              </p>
            )}
          </div>
        );
      },
    },
    {
      key: 'status',
      header: 'Status',
      render: (loan: Loan) => <StatusBadge status={loan.status} />,
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (loan: Loan) => (
        <>
          {loan.status === 'ACTIVE' && loan.amountPaid < loan.totalRepayment && (
            <Button
              size="sm"
              variant="primary"
              onClick={() => {
                setSelectedLoan(loan);
                setRepaymentAmount((loan.totalRepayment - loan.amountPaid).toString());
              }}
            >
              Repay
            </Button>
          )}
        </>
      ),
    },
  ];

  const stats = {
    activeLoans: loanList.filter(l => l.status === 'ACTIVE').length,
    totalBorrowed: loanList
      .filter(l => l.status === 'ACTIVE' || l.status === 'COMPLETED')
      .reduce((sum, l) => sum + l.amount, 0),
    totalOwed: loanList
      .filter(l => l.status === 'ACTIVE')
      .reduce((sum, l) => sum + (l.totalRepayment - l.amountPaid), 0),
    completedLoans: loanList.filter(l => l.status === 'COMPLETED').length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Manage Loans</h1>
        <p className="text-gray-600 mt-1">Track and repay your active loans</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Active Loans</p>
              <p className="text-2xl font-bold text-purple-600">{stats.activeLoans}</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <TrendingUp className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Borrowed</p>
              <p className="text-xl font-bold text-blue-600">
                ₦{stats.totalBorrowed.toLocaleString()}
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <DollarSign className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-red-50 border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Owed</p>
              <p className="text-xl font-bold text-orange-600">
                ₦{stats.totalOwed.toLocaleString()}
              </p>
            </div>
            <div className="p-3 bg-orange-100 rounded-full">
              <AlertCircle className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Completed</p>
              <p className="text-2xl font-bold text-green-600">{stats.completedLoans}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Repayment Modal */}
      {selectedLoan && (
        <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Repay Loan</h3>
            <button
              onClick={() => {
                setSelectedLoan(null);
                setRepaymentAmount('');
              }}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="bg-white rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Loan Amount</p>
              <p className="text-xl font-bold text-gray-900">
                ₦{selectedLoan.amount.toLocaleString()}
              </p>
            </div>

            <div className="bg-white rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Total Repayment</p>
              <p className="text-xl font-bold text-purple-600">
                ₦{selectedLoan.totalRepayment.toLocaleString()}
              </p>
            </div>

            <div className="bg-white rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Amount Paid</p>
              <p className="text-xl font-bold text-green-600">
                ₦{selectedLoan.amountPaid.toLocaleString()}
              </p>
            </div>

            <div className="bg-white rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Remaining Balance</p>
              <p className="text-xl font-bold text-orange-600">
                ₦{(selectedLoan.totalRepayment - selectedLoan.amountPaid).toLocaleString()}
              </p>
            </div>
          </div>

          <form onSubmit={handleRepayment} className="space-y-4">
            <Input
              label="Repayment Amount"
              type="number"
              value={repaymentAmount}
              onChange={(e) => setRepaymentAmount(e.target.value)}
              placeholder="Enter amount"
              required
              min={1}
              max={selectedLoan.totalRepayment - selectedLoan.amountPaid}
              leftIcon={<span className="text-gray-500">₦</span>}
              helperText={`Max: ₦${(selectedLoan.totalRepayment - selectedLoan.amountPaid).toLocaleString()}`}
            />

            <div className="flex gap-2">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                isLoading={repayLoan.isPending}
                disabled={!repaymentAmount || parseFloat(repaymentAmount) <= 0}
              >
                <DollarSign className="h-5 w-5 mr-2" />
                Repay ₦{parseFloat(repaymentAmount || '0').toLocaleString()}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={() => {
                  setSelectedLoan(null);
                  setRepaymentAmount('');
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Loans Table */}
      <Card>
        {isLoading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner />
          </div>
        ) : (
          <>
            <Table
              data={loanList}
              columns={columns}
              emptyMessage="No loans found"
            />

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200">
                <p className="text-sm text-gray-600">
                  Showing {((page - 1) * 20) + 1} to {Math.min(page * 20, pagination.total)} of {pagination.total} loans
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

      {/* Tips Card */}
      <Card title="Loan Repayment Tips" className="bg-gradient-to-br from-yellow-50 to-amber-50">
        <div className="space-y-3 text-sm text-gray-700">
          <div className="flex items-start gap-2">
            <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
            <span>
              <strong>Pay on time:</strong> Timely repayments improve your credit score and unlock
              higher loan amounts.
            </span>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
            <span>
              <strong>Partial payments:</strong> You can make partial repayments anytime to reduce
              your outstanding balance.
            </span>
          </div>
          <div className="flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
            <span>
              <strong>Late fees:</strong> Overdue loans may incur additional charges. Pay before the
              due date to avoid penalties.
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
}
