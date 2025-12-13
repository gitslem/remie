'use client';

import { useAuth } from '@/contexts/AuthContext';
import { getIdToken } from 'firebase/auth';
import { useState } from 'react';
import toast from 'react-hot-toast';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function RRRPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    amount: '',
    purpose: 'SCHOOL_FEES',
    description: '',
    institution: '',
  });
  const [generatedRRR, setGeneratedRRR] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = user ? await getIdToken(user) : null;
      const response = await axios.post(
        `${API_URL}/rrr/generate`,
        {
          amount: parseFloat(formData.amount),
          purpose: formData.purpose,
          description: formData.description,
          payerName: user?.displayName,
          payerEmail: user?.email,
          institution: formData.institution,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setGeneratedRRR(response.data.data);
      toast.success('RRR code generated successfully!');
    } catch (error: any) {
      console.error('Error generating RRR:', error);
      toast.error(error.response?.data?.message || 'Failed to generate RRR');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white rounded-2xl shadow-md p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Generate RRR Payment Code</h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount (₦)
              </label>
              <input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                required
                min="1"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="50000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Purpose
              </label>
              <select
                name="purpose"
                value={formData.purpose}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="SCHOOL_FEES">School Fees</option>
                <option value="ACCEPTANCE_FEE">Acceptance Fee</option>
                <option value="ACCOMMODATION">Accommodation</option>
                <option value="REGISTRATION">Registration</option>
                <option value="EXAM_FEE">Exam Fee</option>
                <option value="LIBRARY_FEE">Library Fee</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Institution Name
              </label>
              <input
                type="text"
                name="institution"
                value={formData.institution}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="University of Lagos"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Payment for 2024/2025 session tuition fees"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition disabled:opacity-50"
          >
            {loading ? 'Generating...' : 'Generate RRR Code'}
          </button>
        </form>
      </div>

      {generatedRRR && (
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-8 border-2 border-green-200">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-green-900">RRR Generated Successfully!</h3>
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <div className="bg-white rounded-xl p-6 mb-6">
            <p className="text-sm text-gray-600 mb-2">RRR Code</p>
            <p className="text-4xl font-bold text-gray-900 mb-4">{generatedRRR.rrr}</p>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Amount</p>
                <p className="font-semibold">₦{generatedRRR.amount?.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-gray-600">Purpose</p>
                <p className="font-semibold">{generatedRRR.purpose}</p>
              </div>
              <div>
                <p className="text-gray-600">Status</p>
                <p className="font-semibold text-yellow-600">{generatedRRR.status}</p>
              </div>
              <div>
                <p className="text-gray-600">Valid Until</p>
                <p className="font-semibold">
                  {new Date(generatedRRR.expiryDate).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <button className="flex-1 bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition">
              Download Receipt
            </button>
            <button className="flex-1 bg-white text-green-600 py-3 rounded-lg font-semibold hover:bg-green-50 transition border-2 border-green-600">
              Share RRR
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
