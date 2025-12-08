'use client';

import React, { useState } from 'react';
import { Card, Button, Input, Select } from '@/components';
import { Globe, Calculator, Send, Info } from 'lucide-react';

const countries = [
  { value: '', label: 'Select country' },
  { value: 'United States', label: 'United States (USD)' },
  { value: 'United Kingdom', label: 'United Kingdom (GBP)' },
  { value: 'Canada', label: 'Canada (CAD)' },
  { value: 'Germany', label: 'Germany (EUR)' },
  { value: 'South Africa', label: 'South Africa (ZAR)' },
];

const relationships = [
  { value: '', label: 'Select relationship' },
  { value: 'Family', label: 'Family' },
  { value: 'Friend', label: 'Friend' },
  { value: 'Relative', label: 'Relative' },
  { value: 'Other', label: 'Other' },
];

const exchangeRates: Record<string, { rate: number; fee: number; symbol: string }> = {
  'United States': { rate: 0.0013, fee: 2.5, symbol: '$' },
  'United Kingdom': { rate: 0.001, fee: 2.5, symbol: '£' },
  'Canada': { rate: 0.0017, fee: 2.5, symbol: 'C$' },
  'Germany': { rate: 0.0012, fee: 2.5, symbol: '€' },
  'South Africa': { rate: 0.024, fee: 1.5, symbol: 'R' },
};

export default function SendRemittancePage() {
  const [formData, setFormData] = useState({
    recipientName: '',
    recipientEmail: '',
    recipientPhone: '',
    amount: '',
    country: '',
    relationship: '',
    purpose: '',
  });

  const [showCalculation, setShowCalculation] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if ((name === 'amount' || name === 'country') && formData.amount && formData.country) {
      setShowCalculation(true);
    }
  };

  const getCalculation = () => {
    if (!formData.amount || !formData.country) return null;

    const amount = parseFloat(formData.amount);
    const rate = exchangeRates[formData.country];
    if (!rate) return null;

    const fee = (amount * rate.fee) / 100;
    const total = amount + fee;
    const receiveAmount = amount * rate.rate;

    return { fee, total, receiveAmount, rate: rate.rate, symbol: rate.symbol };
  };

  const calculation = getCalculation();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle send remittance
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Send International Remittance</h1>
        <p className="text-gray-600 mt-1">Send money to students studying abroad</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <div className="lg:col-span-2">
          <Card title="Recipient Information">
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Recipient Name"
                name="recipientName"
                value={formData.recipientName}
                onChange={handleChange}
                placeholder="John Doe"
                required
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Email Address"
                  name="recipientEmail"
                  type="email"
                  value={formData.recipientEmail}
                  onChange={handleChange}
                  placeholder="john@example.com"
                  required
                />

                <Input
                  label="Phone Number (Optional)"
                  name="recipientPhone"
                  type="tel"
                  value={formData.recipientPhone}
                  onChange={handleChange}
                  placeholder="+1234567890"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select
                  label="Destination Country"
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  options={countries}
                  required
                />

                <Select
                  label="Relationship"
                  name="relationship"
                  value={formData.relationship}
                  onChange={handleChange}
                  options={relationships}
                  required
                />
              </div>

              <Input
                label="Amount (NGN)"
                name="amount"
                type="number"
                value={formData.amount}
                onChange={handleChange}
                placeholder="Enter amount"
                required
                min={5000}
                max={5000000}
                leftIcon={<span className="text-gray-500">₦</span>}
                helperText="Min: ₦5,000 | Max: ₦5,000,000"
              />

              <Input
                label="Purpose"
                name="purpose"
                value={formData.purpose}
                onChange={handleChange}
                placeholder="e.g., School fees, Living expenses"
                required
              />

              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-start gap-3">
                  <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-blue-900">
                    <p className="font-medium mb-1">How it works</p>
                    <ul className="list-disc list-inside space-y-1 text-blue-800">
                      <li>Recipient receives funds in their REMIE wallet</li>
                      <li>Both parties get email notifications</li>
                      <li>Instant transfer within REMIE network</li>
                      <li>Transparent fees shown before confirmation</li>
                    </ul>
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                disabled={!formData.recipientName || !formData.recipientEmail || !formData.amount || !formData.country}
              >
                <Send className="h-5 w-5 mr-2" />
                Send Remittance
              </Button>
            </form>
          </Card>
        </div>

        {/* Calculation Sidebar */}
        <div className="lg:col-span-1">
          <div className="sticky top-6 space-y-4">
            {/* Exchange Calculator */}
            <Card title="Exchange Calculator" className="bg-gradient-to-br from-purple-50 to-blue-50">
              <div className="space-y-4">
                {calculation ? (
                  <>
                    <div className="flex items-center justify-center gap-2 py-4">
                      <Globe className="h-8 w-8 text-purple-600" />
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                        <span className="text-sm text-gray-600">You send:</span>
                        <span className="font-semibold text-gray-900">
                          ₦{parseFloat(formData.amount).toLocaleString()}
                        </span>
                      </div>

                      <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                        <span className="text-sm text-gray-600">Transfer fee ({exchangeRates[formData.country]?.fee}%):</span>
                        <span className="font-medium text-gray-900">
                          ₦{calculation.fee.toLocaleString()}
                        </span>
                      </div>

                      <div className="flex justify-between items-center pb-2 border-b-2 border-gray-300">
                        <span className="text-sm font-medium text-gray-700">Total amount:</span>
                        <span className="font-bold text-gray-900">
                          ₦{calculation.total.toLocaleString()}
                        </span>
                      </div>

                      <div className="bg-white rounded-lg p-4 mt-4">
                        <div className="text-center">
                          <p className="text-sm text-gray-600 mb-1">Recipient receives</p>
                          <p className="text-3xl font-bold text-purple-600">
                            {calculation.symbol}{calculation.receiveAmount.toFixed(2)}
                          </p>
                          <p className="text-xs text-gray-500 mt-2">
                            Rate: 1 NGN = {calculation.rate} {calculation.symbol.replace(/[^A-Z]/g, '')}
                          </p>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <Calculator className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-sm text-gray-600">
                      Enter amount and country to see exchange calculation
                    </p>
                  </div>
                )}
              </div>
            </Card>

            {/* Supported Currencies */}
            <Card title="Supported Currencies">
              <div className="space-y-2">
                {Object.entries(exchangeRates).map(([country, { symbol, fee }]) => (
                  <div key={country} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                    <span className="text-sm text-gray-700">{country}</span>
                    <span className="text-xs text-gray-500">{symbol} · {fee}% fee</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
