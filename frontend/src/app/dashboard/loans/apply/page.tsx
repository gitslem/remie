'use client';

import React, { useState } from 'react';
import { Card, Button, Input, Select, Badge } from '@/components';
import { DollarSign, Calendar, TrendingUp, Shield, CheckCircle } from 'lucide-react';

const tenureOptions = [
  { value: '', label: 'Select loan tenure' },
  { value: '7', label: '7 days' },
  { value: '14', label: '14 days' },
  { value: '30', label: '30 days' },
  { value: '60', label: '60 days' },
  { value: '90', label: '90 days' },
];

const purposeOptions = [
  { value: '', label: 'Select purpose' },
  { value: 'School Fees', label: 'School Fees' },
  { value: 'Hostel Fees', label: 'Hostel Fees' },
  { value: 'Books & Materials', label: 'Books & Materials' },
  { value: 'Project', label: 'Project' },
  { value: 'Emergency', label: 'Emergency' },
  { value: 'Other', label: 'Other' },
];

export default function ApplyLoanPage() {
  const [formData, setFormData] = useState({
    amount: '',
    tenure: '',
    purpose: '',
  });

  const [creditScore] = useState(650); // Mock credit score

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const calculateLoan = () => {
    if (!formData.amount || !formData.tenure) return null;

    const principal = parseFloat(formData.amount);
    const tenure = parseInt(formData.tenure);
    const interestRate = 5; // 5% per annum

    const interest = (principal * interestRate * tenure) / (365 * 100);
    const totalRepayment = principal + interest;

    return {
      principal,
      interest: interest.toFixed(2),
      totalRepayment: totalRepayment.toFixed(2),
      tenure,
    };
  };

  const loan = calculateLoan();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle loan application
  };

  const getCreditScoreColor = (score: number) => {
    if (score >= 700) return 'text-green-600';
    if (score >= 600) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Apply for Student Loan</h1>
        <p className="text-gray-600 mt-1">Get quick loans for school-related expenses</p>
      </div>

      {/* Credit Score Banner */}
      <Card className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-purple-100 text-sm mb-1">Your Credit Score</p>
            <p className="text-4xl font-bold">{creditScore}</p>
            <p className="text-purple-100 text-sm mt-1">
              {creditScore >= 700 ? 'Excellent' : creditScore >= 600 ? 'Good' : 'Fair'}
            </p>
          </div>
          <div className="text-right">
            <Shield className="h-16 w-16 text-purple-200 mb-2" />
            <Badge variant="success" className="bg-white text-purple-600">
              Eligible
            </Badge>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <div className="lg:col-span-2">
          <Card title="Loan Application">
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Loan Amount"
                name="amount"
                type="number"
                value={formData.amount}
                onChange={handleChange}
                placeholder="Enter amount"
                required
                min={5000}
                max={50000}
                leftIcon={<span className="text-gray-500">₦</span>}
                helperText="Min: ₦5,000 | Max: ₦50,000"
              />

              <Select
                label="Loan Tenure"
                name="tenure"
                value={formData.tenure}
                onChange={handleChange}
                options={tenureOptions}
                required
              />

              <Select
                label="Purpose"
                name="purpose"
                value={formData.purpose}
                onChange={handleChange}
                options={purposeOptions}
                required
              />

              {loan && (
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg p-6 space-y-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Loan Summary</h3>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center pb-2 border-b border-blue-200">
                      <span className="text-sm text-gray-600">Loan Amount:</span>
                      <span className="font-semibold text-gray-900">
                        ₦{loan.principal.toLocaleString()}
                      </span>
                    </div>

                    <div className="flex justify-between items-center pb-2 border-b border-blue-200">
                      <span className="text-sm text-gray-600">Interest (5% p.a.):</span>
                      <span className="font-medium text-gray-900">
                        ₦{parseFloat(loan.interest).toLocaleString()}
                      </span>
                    </div>

                    <div className="flex justify-between items-center pb-2 border-b border-blue-200">
                      <span className="text-sm text-gray-600">Tenure:</span>
                      <span className="font-medium text-gray-900">{loan.tenure} days</span>
                    </div>

                    <div className="flex justify-between items-center pt-2">
                      <span className="text-base font-semibold text-gray-900">Total Repayment:</span>
                      <span className="text-2xl font-bold text-blue-600">
                        ₦{parseFloat(loan.totalRepayment).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg p-4 mt-4">
                    <p className="text-sm text-gray-600 mb-2">Repayment due date:</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {new Date(Date.now() + loan.tenure * 24 * 60 * 60 * 1000).toLocaleDateString('en-NG', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
              )}

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-medium text-yellow-900 mb-2">Eligibility Requirements</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-yellow-800">Credit score ≥ 400</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-yellow-800">No active loans</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-yellow-800">Verified student account</span>
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                disabled={!formData.amount || !formData.tenure || !formData.purpose}
              >
                <DollarSign className="h-5 w-5 mr-2" />
                Submit Application
              </Button>
            </form>
          </Card>
        </div>

        {/* Info Sidebar */}
        <div className="lg:col-span-1">
          <div className="sticky top-6 space-y-4">
            <Card title="Loan Features">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 text-sm">Low Interest</p>
                    <p className="text-xs text-gray-600">Only 5% per annum</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Calendar className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 text-sm">Flexible Tenure</p>
                    <p className="text-xs text-gray-600">7 to 90 days</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 text-sm">Quick Approval</p>
                    <p className="text-xs text-gray-600">Within 24 hours</p>
                  </div>
                </div>
              </div>
            </Card>

            <Card title="How It Works">
              <div className="space-y-3 text-sm text-gray-600">
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-semibold text-xs">
                    1
                  </div>
                  <p>Fill out the application form</p>
                </div>
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-semibold text-xs">
                    2
                  </div>
                  <p>Wait for approval (usually within 24 hours)</p>
                </div>
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-semibold text-xs">
                    3
                  </div>
                  <p>Funds credited to your wallet</p>
                </div>
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-semibold text-xs">
                    4
                  </div>
                  <p>Repay before due date</p>
                </div>
              </div>
            </Card>

            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200">
              <p className="text-sm font-medium text-green-900 mb-2">Build Your Credit!</p>
              <p className="text-xs text-green-700">
                Timely repayments improve your credit score and unlock higher loan amounts.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
