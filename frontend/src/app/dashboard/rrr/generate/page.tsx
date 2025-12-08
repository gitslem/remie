'use client';

import React, { useState } from 'react';
import { Card, Button, Input, Select } from '@/components';
import { Receipt, Building, FileText, AlertCircle } from 'lucide-react';

const paymentTypes = [
  { value: '', label: 'Select payment type' },
  { value: 'SCHOOL_FEE', label: 'School Fees' },
  { value: 'ACCEPTANCE_FEE', label: 'Acceptance Fee' },
  { value: 'HOSTEL_FEE', label: 'Hostel Fee' },
  { value: 'EXAM_FEE', label: 'Exam Fee (JAMB/WAEC/NECO)' },
  { value: 'GOVERNMENT', label: 'Government Payment (NIN/etc)' },
];

const institutions = [
  { value: '', label: 'Select institution' },
  { value: 'UNILAG', label: 'University of Lagos' },
  { value: 'UI', label: 'University of Ibadan' },
  { value: 'OAU', label: 'Obafemi Awolowo University' },
  { value: 'UNILORIN', label: 'University of Ilorin' },
  { value: 'LASU', label: 'Lagos State University' },
  { value: 'JAMB', label: 'JAMB' },
  { value: 'WAEC', label: 'WAEC' },
  { value: 'NECO', label: 'NECO' },
  { value: 'NIN', label: 'NIN Registration' },
];

export default function GenerateRRRPage() {
  const [formData, setFormData] = useState({
    amount: '',
    paymentType: '',
    institution: '',
    institutionCode: '',
    description: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Auto-fill institution code when institution is selected
    if (name === 'institution' && value) {
      setFormData(prev => ({ ...prev, institutionCode: value }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle RRR generation
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Generate RRR Code</h1>
        <p className="text-gray-600 mt-1">Generate RRR code for institutional payments</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <div className="lg:col-span-2">
          <Card title="Payment Details">
            <form onSubmit={handleSubmit} className="space-y-4">
              <Select
                label="Payment Type"
                name="paymentType"
                value={formData.paymentType}
                onChange={handleChange}
                options={paymentTypes}
                required
              />

              <Select
                label="Institution"
                name="institution"
                value={formData.institution}
                onChange={handleChange}
                options={institutions}
                required
              />

              <Input
                label="Institution Code"
                name="institutionCode"
                value={formData.institutionCode}
                onChange={handleChange}
                placeholder="Will be auto-filled"
                required
                disabled
              />

              <Input
                label="Amount (NGN)"
                name="amount"
                type="number"
                value={formData.amount}
                onChange={handleChange}
                placeholder="Enter amount"
                required
                min={100}
                leftIcon={<span className="text-gray-500">₦</span>}
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="e.g., Tuition Fee - 2024/2025 Session"
                  rows={3}
                  required
                  className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-yellow-800">
                    <p className="font-medium mb-1">Important Information</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>RRR code expires in 7 days</li>
                      <li>Use the RRR code to complete payment at any bank</li>
                      <li>You'll receive an email with payment instructions</li>
                      <li>Receipt will be generated automatically after payment</li>
                    </ul>
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                disabled={!formData.paymentType || !formData.institution || !formData.amount || !formData.description}
              >
                <Receipt className="h-5 w-5 mr-2" />
                Generate RRR Code
              </Button>
            </form>
          </Card>
        </div>

        {/* Info Sidebar */}
        <div className="lg:col-span-1">
          <div className="sticky top-6 space-y-4">
            <Card className="bg-gradient-to-br from-orange-50 to-yellow-50">
              <div className="text-center space-y-3">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 rounded-full">
                  <FileText className="h-8 w-8 text-orange-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">What is RRR?</h3>
                  <p className="text-sm text-gray-600">
                    Remita Retrieval Reference (RRR) is a unique code for institutional payments in Nigeria.
                  </p>
                </div>
              </div>
            </Card>

            <Card title="How to Use RRR">
              <div className="space-y-3 text-sm text-gray-600">
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold text-xs">
                    1
                  </div>
                  <p>Generate your RRR code using this form</p>
                </div>
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold text-xs">
                    2
                  </div>
                  <p>Receive RRR code via email</p>
                </div>
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold text-xs">
                    3
                  </div>
                  <p>Pay at any bank or online using the RRR</p>
                </div>
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold text-xs">
                    4
                  </div>
                  <p>Get automatic receipt after payment</p>
                </div>
              </div>
            </Card>

            <Card title="Supported Institutions">
              <div className="flex flex-wrap gap-2">
                {['UNILAG', 'UI', 'OAU', 'JAMB', 'WAEC', 'NIN'].map((inst) => (
                  <span
                    key={inst}
                    className="px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                  >
                    {inst}
                  </span>
                ))}
                <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                  +More
                </span>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
