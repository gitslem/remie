'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

export default function LoansPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [loans, setLoans] = useState<any[]>([]);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [formData, setFormData] = useState({
    amount: '',
    purpose: 'SCHOOL_FEES',
    duration: '30',
  });

  useEffect(() => {
    if (user) {
      fetchLoans();
    }
  }, [user]);

  const fetchLoans = async () => {
    if (!user) return;
    try {
      const token = await user.getIdToken();
      const response = await axios.get(`${API_URL}/loans`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data) {
        setLoans(response.data.data || response.data);
      }
    } catch (error) {
      console.error('Error fetching loans:', error);
      toast.error('Failed to load loans');
    }
  };

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = await user?.getIdToken();
      await axios.post(
        `${API_URL}/loans/apply`,
        {
          amount: parseFloat(formData.amount),
          purpose: formData.purpose,
          duration: parseInt(formData.duration),
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      toast.success('Loan application submitted successfully!');
      setShowApplyModal(false);
      setFormData({ amount: '', purpose: 'SCHOOL_FEES', duration: '30' });
      fetchLoans();
    } catch (error: any) {
      console.error('Error applying for loan:', error);
      toast.error(error.response?.data?.message || 'Failed to apply for loan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Microloans</h1>
          <p className="text-gray-600 mt-1">Quick loans for urgent school expenses</p>
        </div>
        <button
          onClick={() => setShowApplyModal(true)}
          className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition"
        >
          + Apply for Loan
        </button>
      </div>

      {/* Loan Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-md p-6">
          <p className="text-sm text-gray-600 mb-1">Active Loans</p>
          <p className="text-3xl font-bold text-gray-900">
            {loans.filter(l => l.status === 'ACTIVE').length}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6">
          <p className="text-sm text-gray-600 mb-1">Total Borrowed</p>
          <p className="text-3xl font-bold text-gray-900">
            ₦{loans.reduce((sum, l) => sum + (l.amount || 0), 0).toLocaleString()}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6">
          <p className="text-sm text-gray-600 mb-1">Outstanding</p>
          <p className="text-3xl font-bold text-orange-600">
            ₦{loans.filter(l => l.status === 'ACTIVE').reduce((sum, l) => sum + (l.amountOutstanding || 0), 0).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Active Loans */}
      <div className="bg-white rounded-2xl shadow-md p-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Loans</h2>
        {loans.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p>No loans yet</p>
            <button
              onClick={() => setShowApplyModal(true)}
              className="mt-4 text-indigo-600 font-medium hover:text-indigo-700"
            >
              Apply for your first loan
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {loans.map((loan) => (
              <div key={loan.id} className="border border-gray-200 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-gray-900">₦{loan.amount?.toLocaleString()}</h3>
                    <p className="text-sm text-gray-600">{loan.purpose}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    loan.status === 'ACTIVE' ? 'bg-yellow-100 text-yellow-800' :
                    loan.status === 'PAID' ? 'bg-green-100 text-green-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {loan.status}
                  </span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Outstanding</p>
                    <p className="font-semibold">₦{loan.amountOutstanding?.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Interest</p>
                    <p className="font-semibold">{loan.interestRate}%</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Due Date</p>
                    <p className="font-semibold">{new Date(loan.dueDate).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Duration</p>
                    <p className="font-semibold">{loan.duration} days</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Apply Modal */}
      {showApplyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900">Apply for Loan</h3>
              <button
                onClick={() => setShowApplyModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleApply} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Amount (₦)</label>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  required
                  min="1000"
                  max="100000"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Purpose</label>
                <select
                  value={formData.purpose}
                  onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="SCHOOL_FEES">School Fees</option>
                  <option value="TEXTBOOKS">Textbooks</option>
                  <option value="ACCOMMODATION">Accommodation</option>
                  <option value="EMERGENCY">Emergency</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Duration (days)</label>
                <select
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="30">30 days (5% interest)</option>
                  <option value="60">60 days (8% interest)</option>
                  <option value="90">90 days (10% interest)</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition disabled:opacity-50"
              >
                {loading ? 'Submitting...' : 'Submit Application'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
