'use client';

import React, { useState } from 'react';
import { Card, Button, Input, Select } from '@/components';
import { useWallet } from '@/hooks/useWallet';
import { Wallet, ArrowDown, AlertCircle, CheckCircle } from 'lucide-react';

export default function WithdrawPage() {
  const { balance, banks, resolveAccount, withdraw } = useWallet();

  const [formData, setFormData] = useState({
    amount: '',
    bankCode: '',
    accountNumber: '',
    reason: '',
  });

  const [accountName, setAccountName] = useState('');
  const [isResolving, setIsResolving] = useState(false);
  const [resolveError, setResolveError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Reset account name when account number or bank changes
    if (name === 'accountNumber' || name === 'bankCode') {
      setAccountName('');
      setResolveError('');
    }
  };

  const handleResolveAccount = async () => {
    if (!formData.accountNumber || !formData.bankCode) return;

    setIsResolving(true);
    setResolveError('');

    try {
      const result = await resolveAccount.mutateAsync({
        accountNumber: formData.accountNumber,
        bankCode: formData.bankCode,
      });

      setAccountName(result.accountName);
    } catch (error: any) {
      setResolveError(error.response?.data?.message || 'Failed to resolve account');
    } finally {
      setIsResolving(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!accountName) {
      setResolveError('Please verify account details first');
      return;
    }

    try {
      await withdraw.mutateAsync({
        amount: parseFloat(formData.amount),
        bankAccount: {
          accountNumber: formData.accountNumber,
          bankCode: formData.bankCode,
          accountName,
        },
        reason: formData.reason || undefined,
      });

      // Reset form
      setFormData({ amount: '', bankCode: '', accountNumber: '', reason: '' });
      setAccountName('');
    } catch (error) {
      // Error handled by hook
    }
  };

  const bankOptions = [
    { value: '', label: 'Select bank' },
    ...(banks || []).map((bank: any) => ({
      value: bank.code,
      label: bank.name,
    })),
  ];

  const availableBalance = balance?.balance || 0;
  const withdrawalFee = 50; // ₦50 withdrawal fee
  const amount = parseFloat(formData.amount) || 0;
  const totalDeduction = amount + withdrawalFee;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Withdraw Funds</h1>
        <p className="text-gray-600 mt-1">Transfer money from your wallet to your bank account</p>
      </div>

      {/* Balance Card */}
      <Card className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-indigo-100 text-sm mb-1">Available Balance</p>
            <p className="text-4xl font-bold">₦{availableBalance.toLocaleString()}</p>
          </div>
          <div className="p-4 bg-white bg-opacity-20 rounded-full">
            <Wallet className="h-12 w-12" />
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Withdrawal Form */}
        <div className="lg:col-span-2">
          <Card title="Bank Account Details">
            <form onSubmit={handleSubmit} className="space-y-4">
              <Select
                label="Select Bank"
                name="bankCode"
                value={formData.bankCode}
                onChange={handleChange}
                options={bankOptions}
                required
              />

              <div>
                <Input
                  label="Account Number"
                  name="accountNumber"
                  value={formData.accountNumber}
                  onChange={handleChange}
                  placeholder="1234567890"
                  required
                  maxLength={10}
                  pattern="[0-9]{10}"
                />

                {formData.accountNumber.length === 10 && formData.bankCode && !accountName && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleResolveAccount}
                    isLoading={isResolving}
                    className="mt-2"
                  >
                    Verify Account
                  </Button>
                )}

                {accountName && (
                  <div className="mt-2 flex items-center gap-2 text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-sm font-medium">{accountName}</span>
                  </div>
                )}

                {resolveError && (
                  <div className="mt-2 flex items-center gap-2 text-red-600">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm">{resolveError}</span>
                  </div>
                )}
              </div>

              <Input
                label="Withdrawal Amount"
                name="amount"
                type="number"
                value={formData.amount}
                onChange={handleChange}
                placeholder="Enter amount"
                required
                min={500}
                max={availableBalance}
                leftIcon={<span className="text-gray-500">₦</span>}
                helperText={`Min: ₦500 | Max: ₦${availableBalance.toLocaleString()}`}
              />

              <Input
                label="Reason (Optional)"
                name="reason"
                value={formData.reason}
                onChange={handleChange}
                placeholder="e.g., Personal use, Emergency"
              />

              {amount > 0 && (
                <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 space-y-2">
                  <h3 className="font-semibold text-gray-900 mb-3">Withdrawal Summary</h3>

                  <div className="flex justify-between items-center pb-2 border-b border-blue-200">
                    <span className="text-sm text-gray-600">Withdrawal Amount:</span>
                    <span className="font-semibold text-gray-900">
                      ₦{amount.toLocaleString()}
                    </span>
                  </div>

                  <div className="flex justify-between items-center pb-2 border-b border-blue-200">
                    <span className="text-sm text-gray-600">Processing Fee:</span>
                    <span className="font-medium text-gray-900">
                      ₦{withdrawalFee.toLocaleString()}
                    </span>
                  </div>

                  <div className="flex justify-between items-center pt-2">
                    <span className="text-base font-semibold text-gray-900">Total Deduction:</span>
                    <span className="text-2xl font-bold text-indigo-600">
                      ₦{totalDeduction.toLocaleString()}
                    </span>
                  </div>

                  <div className="bg-white rounded-lg p-3 mt-3">
                    <p className="text-sm text-gray-600">You will receive</p>
                    <p className="text-xl font-bold text-green-600">₦{amount.toLocaleString()}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Estimated arrival: 5-10 minutes
                    </p>
                  </div>
                </div>
              )}

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-medium text-yellow-900 mb-2 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Important Information
                </h4>
                <ul className="text-sm text-yellow-800 space-y-1 list-disc list-inside">
                  <li>Minimum withdrawal: ₦500</li>
                  <li>Processing fee: ₦50 per transaction</li>
                  <li>Funds typically arrive within 5-10 minutes</li>
                  <li>Ensure your account details are correct</li>
                </ul>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                disabled={
                  !formData.amount ||
                  !formData.bankCode ||
                  !formData.accountNumber ||
                  !accountName ||
                  totalDeduction > availableBalance
                }
                isLoading={withdraw.isPending}
              >
                <ArrowDown className="h-5 w-5 mr-2" />
                Withdraw ₦{amount.toLocaleString()}
              </Button>
            </form>
          </Card>
        </div>

        {/* Info Sidebar */}
        <div className="lg:col-span-1">
          <div className="sticky top-6 space-y-4">
            <Card title="How It Works">
              <div className="space-y-3 text-sm text-gray-600">
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-semibold text-xs">
                    1
                  </div>
                  <p>Select your bank and enter account number</p>
                </div>
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-semibold text-xs">
                    2
                  </div>
                  <p>Verify your account details</p>
                </div>
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-semibold text-xs">
                    3
                  </div>
                  <p>Enter withdrawal amount</p>
                </div>
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-semibold text-xs">
                    4
                  </div>
                  <p>Confirm and receive money in minutes</p>
                </div>
              </div>
            </Card>

            <Card title="Withdrawal Limits">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Minimum:</span>
                  <span className="font-semibold text-gray-900">₦500</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Maximum per transaction:</span>
                  <span className="font-semibold text-gray-900">₦1,000,000</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Daily limit:</span>
                  <span className="font-semibold text-gray-900">₦5,000,000</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Processing fee:</span>
                  <span className="font-semibold text-gray-900">₦50</span>
                </div>
              </div>
            </Card>

            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200">
              <p className="text-sm font-medium text-green-900 mb-2">Fast & Secure</p>
              <p className="text-xs text-green-700">
                All withdrawals are processed securely through Paystack with bank-level encryption.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
