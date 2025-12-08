'use client';

import React, { useState } from 'react';
import { Card, Button, Input, Select, Badge } from '@/components';
import { Send, Search, User, AlertCircle } from 'lucide-react';

const categories = [
  { value: '', label: 'Select category (optional)' },
  { value: 'HOSTEL', label: 'Hostel Fees' },
  { value: 'PROJECT', label: 'Project Dues' },
  { value: 'FOOD', label: 'Food' },
  { value: 'BOOKS', label: 'Books' },
  { value: 'OTHER', label: 'Other' },
];

export default function P2PSendPage() {
  const [formData, setFormData] = useState({
    recipientIdentifier: '',
    amount: '',
    category: '',
    note: '',
  });

  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedRecipient, setSelectedRecipient] = useState<any>(null);
  const [searching, setSearching] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSearch = async () => {
    if (!formData.recipientIdentifier) return;

    setSearching(true);
    // Simulate API call
    setTimeout(() => {
      setSearchResults([
        {
          id: '1',
          name: 'John Doe',
          email: 'john@example.com',
          institution: 'University of Lagos',
          studentId: 'UL/2024/001',
        },
      ]);
      setSearching(false);
    }, 1000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle P2P send
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Send Money to Student</h1>
        <p className="text-gray-600 mt-1">Transfer money to fellow students instantly with zero fees</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <div className="lg:col-span-2">
          <Card title="Transfer Details">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Search Recipient */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Find Recipient <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  <Input
                    name="recipientIdentifier"
                    value={formData.recipientIdentifier}
                    onChange={handleChange}
                    placeholder="Email, phone, or student ID"
                    required
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleSearch}
                    isLoading={searching}
                  >
                    <Search className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="border border-gray-200 rounded-lg p-4 space-y-2">
                  <p className="text-sm font-medium text-gray-700 mb-2">Search Results:</p>
                  {searchResults.map((user) => (
                    <div
                      key={user.id}
                      onClick={() => setSelectedRecipient(user)}
                      className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                        selectedRecipient?.id === user.id
                          ? 'bg-blue-50 border-2 border-blue-500'
                          : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                      }`}
                    >
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{user.name}</p>
                        <p className="text-sm text-gray-500">{user.email}</p>
                        <p className="text-xs text-gray-400">{user.institution} · {user.studentId}</p>
                      </div>
                      {selectedRecipient?.id === user.id && (
                        <Badge variant="success">Selected</Badge>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <Input
                label="Amount (NGN)"
                name="amount"
                type="number"
                value={formData.amount}
                onChange={handleChange}
                placeholder="Enter amount"
                required
                min={100}
                max={50000}
                leftIcon={<span className="text-gray-500">₦</span>}
                helperText="Max: ₦50,000 per transfer"
              />

              <Select
                label="Category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                options={categories}
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Note (Optional)
                </label>
                <textarea
                  name="note"
                  value={formData.note}
                  onChange={handleChange}
                  placeholder="Add a note to this transfer"
                  rows={3}
                  className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {formData.amount && selectedRecipient && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-green-900 font-medium">Transfer to: {selectedRecipient.name}</p>
                      <p className="text-xs text-green-700 mt-1">Amount: ₦{parseFloat(formData.amount).toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-green-900">Zero Fees!</p>
                      <p className="text-xs text-green-700">Free for students</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-blue-900">
                    <p className="font-medium mb-1">Benefits of P2P Transfer</p>
                    <ul className="list-disc list-inside space-y-1 text-blue-800">
                      <li>Zero transfer fees for students</li>
                      <li>Instant delivery to recipient's wallet</li>
                      <li>Both parties receive notifications</li>
                      <li>Complete transaction history</li>
                    </ul>
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                disabled={!selectedRecipient || !formData.amount}
              >
                <Send className="h-5 w-5 mr-2" />
                Send ₦{formData.amount ? parseFloat(formData.amount).toLocaleString() : '0'}
              </Button>
            </form>
          </Card>
        </div>

        {/* Info Sidebar */}
        <div className="lg:col-span-1">
          <div className="sticky top-6 space-y-4">
            <Card className="bg-gradient-to-br from-green-50 to-emerald-50">
              <div className="text-center space-y-3">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full">
                  <Send className="h-8 w-8 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Zero Fees!</h3>
                  <p className="text-sm text-gray-600">
                    Send money to fellow students without any charges
                  </p>
                </div>
              </div>
            </Card>

            <Card title="Quick Stats">
              <div className="space-y-3">
                <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                  <span className="text-sm text-gray-600">Max per transfer:</span>
                  <span className="font-semibold text-gray-900">₦50,000</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                  <span className="text-sm text-gray-600">Processing time:</span>
                  <span className="font-semibold text-gray-900">Instant</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Transfer fee:</span>
                  <span className="font-semibold text-green-600">Free</span>
                </div>
              </div>
            </Card>

            <Card title="Common Categories">
              <div className="flex flex-wrap gap-2">
                {['Hostel', 'Project', 'Food', 'Books', 'Transport'].map((cat) => (
                  <span
                    key={cat}
                    className="px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded-full hover:bg-gray-200 cursor-pointer transition-colors"
                    onClick={() => setFormData(prev => ({ ...prev, category: cat.toUpperCase() }))}
                  >
                    {cat}
                  </span>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
