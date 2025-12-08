'use client';

import React, { useState } from 'react';
import { Card, Button, Input } from '@/components';
import { CreditCard } from 'lucide-react';

export default function FundWalletPage() {
  const [amount, setAmount] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle payment
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Fund Wallet</h1>
        <p className="text-gray-600 mt-1">Add money to your REMIE wallet</p>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            label="Amount"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Enter amount"
            required
            min={100}
            leftIcon={<span className="text-gray-500">₦</span>}
            helperText="Min: ₦100 | Max: ₦1,000,000"
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quick amounts
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[1000, 5000, 10000, 20000, 50000, 100000].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setAmount(preset.toString())}
                  className="py-2 px-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-sm font-medium"
                >
                  ₦{preset.toLocaleString()}
                </button>
              ))}
            </div>
          </div>

          {amount && parseFloat(amount) >= 100 && (
            <div className="bg-blue-50 p-4 rounded-lg space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Amount:</span>
                <span className="font-medium">₦{parseFloat(amount).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-base font-semibold pt-2 border-t border-blue-200">
                <span>Total:</span>
                <span>₦{parseFloat(amount).toLocaleString()}</span>
              </div>
            </div>
          )}

          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-start gap-3">
              <CreditCard className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-gray-900 mb-1">Secure Payment</h4>
                <p className="text-sm text-gray-600">
                  You'll be redirected to Paystack to complete your payment securely.
                </p>
              </div>
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
          >
            Continue to Payment
          </Button>
        </form>
      </Card>
    </div>
  );
}
