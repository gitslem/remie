'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed w-full bg-white/95 backdrop-blur-sm shadow-sm z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/" className="text-2xl font-bold text-indigo-600">
                REMIE
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-700 hover:text-indigo-600 transition">Features</a>
              <a href="#how-it-works" className="text-gray-700 hover:text-indigo-600 transition">How It Works</a>
              <a href="#pricing" className="text-gray-700 hover:text-indigo-600 transition">Pricing</a>
              <a href="#contact" className="text-gray-700 hover:text-indigo-600 transition">Contact</a>
              <Link href="/auth/login" className="text-indigo-600 hover:text-indigo-700 font-medium transition">
                Login
              </Link>
              <Link
                href="/auth/signup"
                className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-indigo-700 transition"
              >
                Get Started
              </Link>
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden text-gray-700"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t">
            <div className="px-4 py-4 space-y-3">
              <a href="#features" className="block text-gray-700 hover:text-indigo-600">Features</a>
              <a href="#how-it-works" className="block text-gray-700 hover:text-indigo-600">How It Works</a>
              <a href="#pricing" className="block text-gray-700 hover:text-indigo-600">Pricing</a>
              <a href="#contact" className="block text-gray-700 hover:text-indigo-600">Contact</a>
              <Link href="/auth/login" className="block text-indigo-600 font-medium">Login</Link>
              <Link href="/auth/signup" className="block bg-indigo-600 text-white px-4 py-2 rounded-lg text-center font-semibold">
                Get Started
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                Simplify Your <span className="text-indigo-600">Student Payments</span> in Africa
              </h1>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                REMIE makes school fees, P2P transfers, and microloans seamless for African students.
                Pay with RRR codes, send money instantly, and access emergency loans when you need them.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/auth/signup"
                  className="bg-indigo-600 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-indigo-700 transition text-center shadow-lg hover:shadow-xl"
                >
                  Create Free Account
                </Link>
                <a
                  href="#features"
                  className="bg-white text-indigo-600 px-8 py-4 rounded-lg font-semibold text-lg border-2 border-indigo-600 hover:bg-indigo-50 transition text-center"
                >
                  Learn More
                </a>
              </div>
              <div className="mt-8 flex items-center gap-8 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>No hidden fees</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Instant transfers</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Secure & Safe</span>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-8 shadow-2xl">
                <div className="bg-white rounded-xl p-6 mb-4">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm text-gray-600">Wallet Balance</span>
                    <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">Active</span>
                  </div>
                  <div className="text-3xl font-bold text-gray-900 mb-4">₦125,450.00</div>
                  <div className="grid grid-cols-2 gap-3">
                    <button className="bg-indigo-600 text-white py-2 rounded-lg text-sm font-medium">
                      Send Money
                    </button>
                    <button className="bg-indigo-50 text-indigo-600 py-2 rounded-lg text-sm font-medium">
                      Pay Fees
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-white">
                    <div className="text-2xl font-bold">5,000+</div>
                    <div className="text-sm text-white/80">Active Users</div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-white">
                    <div className="text-2xl font-bold">₦2.5M</div>
                    <div className="text-sm text-white/80">Processed</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-indigo-600 mb-2">10K+</div>
              <div className="text-gray-600">Students Served</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-indigo-600 mb-2">₦50M+</div>
              <div className="text-gray-600">Total Transactions</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-indigo-600 mb-2">500+</div>
              <div className="text-gray-600">Institutions</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-indigo-600 mb-2">99.9%</div>
              <div className="text-gray-600">Uptime</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Everything You Need</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Comprehensive payment solutions designed specifically for African students
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard
              icon="💳"
              title="RRR Payments"
              description="Generate and pay RRR codes for school fees, acceptance fees, and government charges instantly."
              color="indigo"
            />
            <FeatureCard
              icon="💰"
              title="P2P Transfers"
              description="Send money to fellow students in seconds. Split bills, share costs, and settle debts easily."
              color="purple"
            />
            <FeatureCard
              icon="📈"
              title="Microloans"
              description="Get instant loans for urgent school expenses. Flexible repayment terms and low interest rates."
              color="blue"
            />
            <FeatureCard
              icon="🔐"
              title="Crypto Payments"
              description="Pay with USDT or USDC. Low fees on Polygon network for fast, affordable transactions."
              color="green"
            />
            <FeatureCard
              icon="📊"
              title="Transaction History"
              description="Track all your payments, transfers, and loans in one unified dashboard."
              color="yellow"
            />
            <FeatureCard
              icon="🔒"
              title="Secure & Safe"
              description="Bank-level security with Firebase authentication and encrypted data storage."
              color="red"
            />
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">How It Works</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Get started in minutes with our simple 3-step process
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <StepCard
              number="1"
              title="Create Account"
              description="Sign up with your email and verify your student status. It takes less than 2 minutes."
            />
            <StepCard
              number="2"
              title="Fund Wallet"
              description="Add money to your REMIE wallet using bank transfer, debit card, or mobile money."
            />
            <StepCard
              number="3"
              title="Start Paying"
              description="Pay fees, send money, or apply for loans. All from your dashboard."
            />
          </div>

          <div className="text-center mt-12">
            <Link
              href="/auth/signup"
              className="inline-block bg-indigo-600 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-indigo-700 transition shadow-lg"
            >
              Create Your Account Now →
            </Link>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Simple, Transparent Pricing</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              No hidden fees. No monthly charges. Pay only for what you use.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <PricingCard
              title="P2P Transfers"
              price="Free"
              features={[
                'Unlimited transfers',
                'Instant settlement',
                'No transaction fees',
                'Send to any student'
              ]}
            />
            <PricingCard
              title="RRR Payments"
              price="₦50"
              period="per transaction"
              features={[
                'Generate RRR codes',
                'Pay any institution',
                'Instant confirmation',
                'Digital receipts'
              ]}
              highlighted
            />
            <PricingCard
              title="Microloans"
              price="5-10%"
              period="interest rate"
              features={[
                '₦1,000 - ₦100,000',
                '30-90 days repayment',
                'Fast approval',
                'Flexible terms'
              ]}
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-indigo-600 to-purple-600">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Simplify Your Payments?
          </h2>
          <p className="text-xl text-indigo-100 mb-8">
            Join thousands of students who trust REMIE for their payment needs
          </p>
          <Link
            href="/auth/signup"
            className="inline-block bg-white text-indigo-600 px-10 py-4 rounded-lg font-bold text-lg hover:bg-gray-100 transition shadow-xl"
          >
            Get Started for Free
          </Link>
          <p className="text-indigo-200 mt-4">No credit card required • Free forever</p>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Get in Touch</h2>
              <p className="text-gray-600 mb-8">
                Have questions? We're here to help. Reach out to our support team.
              </p>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">Email</div>
                    <div className="text-gray-600">support@remie.app</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">Phone</div>
                    <div className="text-gray-600">+234 800 REMIE APP</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 rounded-2xl p-8">
              <form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="your@email.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                  <textarea
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="How can we help?"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition"
                >
                  Send Message
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="text-2xl font-bold mb-4">REMIE</h3>
              <p className="text-gray-400">
                Simplifying student payments across Africa
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#features" className="hover:text-white transition">Features</a></li>
                <li><a href="#pricing" className="hover:text-white transition">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition">Security</a></li>
                <li><a href="#" className="hover:text-white transition">API</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition">About Us</a></li>
                <li><a href="#" className="hover:text-white transition">Careers</a></li>
                <li><a href="#" className="hover:text-white transition">Blog</a></li>
                <li><a href="#contact" className="hover:text-white transition">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white transition">Cookie Policy</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">
              © 2024 REMIE. All rights reserved.
            </p>
            <div className="flex gap-6 mt-4 md:mt-0">
              <a href="#" className="text-gray-400 hover:text-white transition">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                </svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description, color }: { icon: string; title: string; description: string; color: string }) {
  const colorClasses: Record<string, string> = {
    indigo: 'from-indigo-500 to-purple-600',
    purple: 'from-purple-500 to-pink-600',
    blue: 'from-blue-500 to-indigo-600',
    green: 'from-green-500 to-teal-600',
    yellow: 'from-yellow-500 to-orange-600',
    red: 'from-red-500 to-pink-600',
  };

  return (
    <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition group">
      <div className={`w-16 h-16 bg-gradient-to-br ${colorClasses[color]} rounded-xl flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition`}>
        {icon}
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-3">{title}</h3>
      <p className="text-gray-600 leading-relaxed">{description}</p>
    </div>
  );
}

function StepCard({ number, title, description }: { number: string; title: string; description: string }) {
  return (
    <div className="relative">
      <div className="bg-indigo-600 text-white w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold mb-4">
        {number}
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-3">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}

function PricingCard({ title, price, period, features, highlighted }: { title: string; price: string; period?: string; features: string[]; highlighted?: boolean }) {
  return (
    <div className={`rounded-2xl p-8 ${highlighted ? 'bg-indigo-600 text-white shadow-2xl scale-105' : 'bg-white shadow-lg'}`}>
      <h3 className={`text-2xl font-bold mb-2 ${highlighted ? 'text-white' : 'text-gray-900'}`}>{title}</h3>
      <div className="mb-6">
        <span className="text-4xl font-bold">{price}</span>
        {period && <span className={`text-sm ${highlighted ? 'text-indigo-100' : 'text-gray-600'}`}> {period}</span>}
      </div>
      <ul className="space-y-3 mb-8">
        {features.map((feature, index) => (
          <li key={index} className="flex items-center gap-3">
            <svg className={`w-5 h-5 ${highlighted ? 'text-white' : 'text-green-500'}`} fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>{feature}</span>
          </li>
        ))}
      </ul>
      <Link
        href="/auth/signup"
        className={`block text-center py-3 rounded-lg font-semibold transition ${
          highlighted
            ? 'bg-white text-indigo-600 hover:bg-gray-100'
            : 'bg-indigo-600 text-white hover:bg-indigo-700'
        }`}
      >
        Get Started
      </Link>
    </div>
  );
}
