'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';
import toast from 'react-hot-toast';

export default function SupportPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    subject: '',
    category: 'general',
    message: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Simulate API call (you can replace with actual endpoint)
      await new Promise(resolve => setTimeout(resolve, 1500));

      toast.success('Support ticket submitted successfully! We\'ll get back to you soon.');
      setFormData({ subject: '', category: 'general', message: '' });
    } catch (error) {
      toast.error('Failed to submit support ticket');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Support Center</h1>
        <p className="text-gray-600 mt-2">We're here to help! Get in touch with our support team</p>
      </div>

      {/* Quick Help Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-6 hover:shadow-md transition">
          <div className="bg-indigo-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="font-semibold text-gray-900 mb-2">FAQ</h3>
          <p className="text-sm text-gray-600">Find answers to common questions</p>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-xl p-6 hover:shadow-md transition">
          <div className="bg-green-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="font-semibold text-gray-900 mb-2">Documentation</h3>
          <p className="text-sm text-gray-600">Learn how to use REMIE effectively</p>
        </div>

        <div className="bg-purple-50 border border-purple-200 rounded-xl p-6 hover:shadow-md transition">
          <div className="bg-purple-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
            </svg>
          </div>
          <h3 className="font-semibold text-gray-900 mb-2">Live Chat</h3>
          <p className="text-sm text-gray-600">Chat with our support team</p>
        </div>
      </div>

      {/* Contact Form */}
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-indigo-100 p-3 rounded-lg">
            <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Contact Support</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email (Pre-filled) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Email
            </label>
            <input
              type="email"
              value={user?.email || ''}
              disabled
              className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="general">General Inquiry</option>
              <option value="technical">Technical Issue</option>
              <option value="billing">Billing & Payments</option>
              <option value="account">Account Management</option>
              <option value="security">Security Concern</option>
              <option value="feature">Feature Request</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Subject */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Subject
            </label>
            <input
              type="text"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Brief description of your issue"
            />
          </div>

          {/* Message */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Message
            </label>
            <textarea
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              required
              rows={6}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Please provide detailed information about your issue..."
            />
            <p className="text-xs text-gray-500 mt-1">
              Include as much detail as possible to help us assist you better
            </p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
          >
            {loading ? 'Submitting...' : 'Submit Support Ticket'}
          </button>
        </form>
      </div>

      {/* Contact Information */}
      <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl shadow-lg p-8 text-white">
        <h2 className="text-2xl font-bold mb-6">Other Ways to Reach Us</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-start gap-4">
            <div className="bg-white/20 p-3 rounded-lg">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold mb-1">Email</h3>
              <p className="text-indigo-100">support@remiepay.com</p>
              <p className="text-sm text-indigo-200 mt-1">Response within 24 hours</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="bg-white/20 p-3 rounded-lg">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold mb-1">Phone</h3>
              <p className="text-indigo-100">+234 800 REMIE</p>
              <p className="text-sm text-indigo-200 mt-1">Mon-Fri, 9AM-5PM WAT</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="bg-white/20 p-3 rounded-lg">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold mb-1">Twitter</h3>
              <p className="text-indigo-100">@RemiePay</p>
              <p className="text-sm text-indigo-200 mt-1">DM us for quick support</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="bg-white/20 p-3 rounded-lg">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold mb-1">Office</h3>
              <p className="text-indigo-100">Lagos, Nigeria</p>
              <p className="text-sm text-indigo-200 mt-1">Visit us by appointment</p>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Frequently Asked Questions</h2>
        <div className="space-y-4">
          <details className="group">
            <summary className="flex justify-between items-center cursor-pointer list-none p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
              <span className="font-semibold text-gray-900">How do I fund my wallet?</span>
              <span className="transition group-open:rotate-180">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </span>
            </summary>
            <p className="px-4 pt-4 pb-2 text-gray-600">
              Go to the Wallet page, enter the amount you want to fund, and click "Continue to Paystack". You'll be redirected to complete the payment securely.
            </p>
          </details>

          <details className="group">
            <summary className="flex justify-between items-center cursor-pointer list-none p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
              <span className="font-semibold text-gray-900">How do P2P transfers work?</span>
              <span className="transition group-open:rotate-180">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </span>
            </summary>
            <p className="px-4 pt-4 pb-2 text-gray-600">
              You can send money to other REMIE users instantly using their email address or nickname (e.g., @john). Just go to the P2P page, enter the recipient details, amount, and confirm.
            </p>
          </details>

          <details className="group">
            <summary className="flex justify-between items-center cursor-pointer list-none p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
              <span className="font-semibold text-gray-900">Can I withdraw to my bank account?</span>
              <span className="transition group-open:rotate-180">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </span>
            </summary>
            <p className="px-4 pt-4 pb-2 text-gray-600">
              Yes! We use Paystack for secure bank transfers. You can withdraw funds to any Nigerian bank account. Minimum withdrawal is ₦100.
            </p>
          </details>

          <details className="group">
            <summary className="flex justify-between items-center cursor-pointer list-none p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
              <span className="font-semibold text-gray-900">What is a nickname and how do I set one?</span>
              <span className="transition group-open:rotate-180">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </span>
            </summary>
            <p className="px-4 pt-4 pb-2 text-gray-600">
              A nickname is a unique username (like @john) that makes it easier for others to send you money. Set it in your Settings page under Profile Information.
            </p>
          </details>

          <details className="group">
            <summary className="flex justify-between items-center cursor-pointer list-none p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
              <span className="font-semibold text-gray-900">Is my money safe with REMIE?</span>
              <span className="transition group-open:rotate-180">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </span>
            </summary>
            <p className="px-4 pt-4 pb-2 text-gray-600">
              Yes! We use industry-standard security measures and Paystack (a licensed payment processor) for all transactions. Your wallet is protected with Firebase security.
            </p>
          </details>
        </div>
      </div>
    </div>
  );
}
