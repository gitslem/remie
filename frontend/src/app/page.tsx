'use client';

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className={`fixed w-full z-50 transition-all duration-500 ${
        scrolled ? 'bg-white/95 backdrop-blur-xl shadow-lg py-4' : 'bg-transparent py-6'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <Link href="/" className="flex items-center space-x-3 group">
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-2xl flex items-center justify-center transform group-hover:rotate-6 transition-transform duration-300 shadow-lg">
                  <span className="text-white font-bold text-2xl">R</span>
                </div>
                <span className="text-3xl font-extrabold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  REMIE
                </span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-10">
              <a href="#features" className="text-gray-700 hover:text-indigo-600 font-semibold transition-all duration-300 hover:scale-110">
                Features
              </a>
              <a href="#how-it-works" className="text-gray-700 hover:text-purple-600 font-semibold transition-all duration-300 hover:scale-110">
                How It Works
              </a>
              <a href="#testimonials" className="text-gray-700 hover:text-pink-600 font-semibold transition-all duration-300 hover:scale-110">
                Testimonials
              </a>
              <a href="#pricing" className="text-gray-700 hover:text-indigo-600 font-semibold transition-all duration-300 hover:scale-110">
                Pricing
              </a>
              <Link href="/auth/login" className="text-indigo-600 hover:text-indigo-700 font-bold transition-colors">
                Login
              </Link>
              <Link
                href="/auth/signup"
                className="group relative bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white px-8 py-3 rounded-xl font-bold overflow-hidden transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-2xl"
              >
                <span className="relative z-10">Get Started</span>
                <div className="absolute inset-0 bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </Link>
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden text-gray-700 hover:text-indigo-600 transition-colors p-2"
            >
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t shadow-2xl animate-slide-down">
            <div className="px-6 py-8 space-y-5">
              <a href="#features" className="block text-gray-700 hover:text-indigo-600 font-semibold text-lg">Features</a>
              <a href="#how-it-works" className="block text-gray-700 hover:text-purple-600 font-semibold text-lg">How It Works</a>
              <a href="#testimonials" className="block text-gray-700 hover:text-pink-600 font-semibold text-lg">Testimonials</a>
              <a href="#pricing" className="block text-gray-700 hover:text-indigo-600 font-semibold text-lg">Pricing</a>
              <Link href="/auth/login" className="block text-indigo-600 font-bold text-lg">Login</Link>
              <Link href="/auth/signup" className="block bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white px-8 py-4 rounded-xl text-center font-bold text-lg shadow-lg">
                Get Started
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-32 px-4 overflow-hidden bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-br from-indigo-400 to-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-pink-400 to-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="text-center lg:text-left space-y-8 animate-slide-right">
              <div className="inline-flex items-center px-5 py-2.5 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-full text-indigo-700 font-bold text-sm mb-4 animate-bounce-slow shadow-md">
                <span className="w-2.5 h-2.5 bg-green-500 rounded-full mr-3 animate-pulse"></span>
                Trusted by 10,000+ African Students
              </div>

              <h1 className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-black text-gray-900 leading-tight">
                Simplify Your
                <span className="block bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mt-3 animate-gradient bg-gradient-animated">
                  Student Payments
                </span>
              </h1>

              <p className="text-xl sm:text-2xl text-gray-600 leading-relaxed max-w-2xl mx-auto lg:mx-0 font-medium">
                The all-in-one platform for African students. Pay school fees with RRR codes, transfer money instantly, and access emergency loans—all in one place.
              </p>

              <div className="flex flex-col sm:flex-row gap-5 justify-center lg:justify-start pt-4">
                <Link
                  href="/auth/signup"
                  className="group relative bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white px-10 py-5 rounded-2xl font-bold text-lg shadow-2xl hover:shadow-indigo-500/50 transform hover:scale-105 transition-all duration-300 inline-flex items-center justify-center overflow-hidden"
                >
                  <span className="relative z-10 flex items-center">
                    Get Started Free
                    <svg className="w-6 h-6 ml-3 group-hover:translate-x-2 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </Link>

                <a
                  href="#features"
                  className="group bg-white text-gray-900 px-10 py-5 rounded-2xl font-bold text-lg border-3 border-gray-200 hover:border-indigo-300 hover:shadow-2xl transition-all duration-300 text-center inline-flex items-center justify-center"
                >
                  <span className="flex items-center">
                    Watch Demo
                    <svg className="w-6 h-6 ml-3 group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </span>
                </a>
              </div>

              <div className="flex flex-wrap items-center gap-8 justify-center lg:justify-start pt-6">
                <TrustBadge icon="🔒" text="Bank-level security" />
                <TrustBadge icon="⚡" text="Instant transfers" />
                <TrustBadge icon="💰" text="No hidden fees" />
              </div>
            </div>

            {/* Hero Visual */}
            <div className="relative lg:mt-0 mt-16 animate-slide-left">
              <div className="relative">
                {/* Main Dashboard Card */}
                <div className="bg-white rounded-3xl shadow-2xl p-8 relative z-10 border border-gray-100 hover-lift">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <p className="text-sm text-gray-500 font-semibold uppercase tracking-wide">Total Balance</p>
                      <h3 className="text-5xl font-black text-gray-900 mt-2 bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">₦125,450.00</h3>
                    </div>
                    <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-500 rounded-2xl flex items-center justify-center animate-pulse-slow shadow-lg">
                      <svg className="w-9 h-9 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-8">
                    <button className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 rounded-2xl font-bold hover:shadow-2xl hover:scale-105 transition-all duration-300">
                      Send Money
                    </button>
                    <button className="bg-gradient-to-br from-indigo-50 to-purple-50 text-indigo-700 py-4 rounded-2xl font-bold hover:shadow-lg hover:scale-105 transition-all duration-300 border-2 border-indigo-200">
                      Pay Fees
                    </button>
                  </div>

                  <div className="space-y-4">
                    <TransactionItem
                      type="School Fees Payment"
                      time="Today, 10:30 AM"
                      amount="₦45,000"
                      color="green"
                      icon="check"
                    />
                    <TransactionItem
                      type="P2P Transfer"
                      time="Yesterday, 3:15 PM"
                      amount="₦5,200"
                      color="blue"
                      icon="transfer"
                    />
                  </div>
                </div>

                {/* Floating Stats Cards */}
                <div className="absolute -bottom-8 -left-8 bg-white rounded-2xl shadow-2xl p-6 border border-gray-100 hidden sm:block animate-float z-20">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl flex items-center justify-center">
                      <svg className="w-7 h-7 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-3xl font-black text-gray-900">₦2.5M</p>
                      <p className="text-xs text-gray-500 font-semibold">Total Processed</p>
                    </div>
                  </div>
                </div>

                <div className="absolute -top-8 -right-8 bg-white rounded-2xl shadow-2xl p-6 border border-gray-100 hidden sm:block animate-float animation-delay-2000 z-20">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-indigo-100 to-blue-100 rounded-xl flex items-center justify-center">
                      <svg className="w-7 h-7 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-3xl font-black text-gray-900">10K+</p>
                      <p className="text-xs text-gray-500 font-semibold">Active Users</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trusted Institutions Section */}
      <section className="py-16 bg-white border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-4">
          <p className="text-center text-gray-500 font-semibold uppercase tracking-wider mb-10 text-sm">
            Trusted by leading institutions across Africa
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 items-center opacity-60">
            <InstitutionLogo name="University of Lagos" />
            <InstitutionLogo name="OAU" />
            <InstitutionLogo name="Covenant University" />
            <InstitutionLogo name="UNILAG" />
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <StatCard number="10K+" label="Students Served" delay="0" />
            <StatCard number="₦50M+" label="Total Transactions" delay="200" />
            <StatCard number="500+" label="Institutions" delay="400" />
            <StatCard number="99.9%" label="Uptime" delay="600" />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-28 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-20 animate-fade-in">
            <div className="inline-block px-5 py-2 bg-indigo-100 rounded-full text-indigo-700 font-bold text-sm mb-6">
              FEATURES
            </div>
            <h2 className="text-5xl md:text-6xl font-black text-gray-900 mb-6">Everything You Need</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Comprehensive payment solutions designed specifically for African students
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard
              icon={
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              }
              title="RRR Payments"
              description="Generate and pay RRR codes for school fees, acceptance fees, and government charges instantly with digital receipts."
              gradient="from-indigo-500 to-purple-600"
            />
            <FeatureCard
              icon={
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
              title="P2P Transfers"
              description="Send money to fellow students in seconds. Split bills, share costs, and settle debts easily with zero fees."
              gradient="from-purple-500 to-pink-600"
            />
            <FeatureCard
              icon={
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              }
              title="Microloans"
              description="Get instant loans for urgent school expenses. Flexible repayment terms and competitive interest rates."
              gradient="from-blue-500 to-indigo-600"
            />
            <FeatureCard
              icon={
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              }
              title="Crypto Payments"
              description="Pay with USDT or USDC on Polygon network. Low fees and fast transactions for modern students."
              gradient="from-green-500 to-teal-600"
            />
            <FeatureCard
              icon={
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              }
              title="Transaction History"
              description="Track all your payments, transfers, and loans in one unified dashboard with detailed analytics."
              gradient="from-yellow-500 to-orange-600"
            />
            <FeatureCard
              icon={
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              }
              title="Secure & Safe"
              description="Bank-level security with Firebase authentication, encrypted data storage, and 2FA protection."
              gradient="from-red-500 to-pink-600"
            />
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-20">
            <div className="inline-block px-5 py-2 bg-purple-100 rounded-full text-purple-700 font-bold text-sm mb-6">
              HOW IT WORKS
            </div>
            <h2 className="text-5xl md:text-6xl font-black text-gray-900 mb-6">Get Started in Minutes</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Simple 3-step process to start managing your student finances
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-16 relative">
            {/* Connecting lines */}
            <div className="hidden md:block absolute top-20 left-0 right-0 h-1 bg-gradient-to-r from-indigo-200 via-purple-200 to-pink-200" style={{ top: '100px', left: '20%', right: '20%' }}></div>

            <StepCard
              number="01"
              title="Create Account"
              description="Sign up with your email and verify your student status. It takes less than 2 minutes to get started."
              gradient="from-indigo-500 to-purple-600"
            />
            <StepCard
              number="02"
              title="Fund Wallet"
              description="Add money to your REMIE wallet using bank transfer, debit card, or mobile money instantly."
              gradient="from-purple-500 to-pink-600"
            />
            <StepCard
              number="03"
              title="Start Paying"
              description="Pay fees, send money, or apply for loans. All from your unified dashboard."
              gradient="from-pink-500 to-red-600"
            />
          </div>

          <div className="text-center mt-16">
            <Link
              href="/auth/signup"
              className="inline-flex items-center bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white px-12 py-5 rounded-2xl font-bold text-lg shadow-2xl hover:shadow-indigo-500/50 transform hover:scale-105 transition-all duration-300"
            >
              Create Your Account Now
              <svg className="w-6 h-6 ml-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-28 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-20">
            <div className="inline-block px-5 py-2 bg-pink-100 rounded-full text-pink-700 font-bold text-sm mb-6">
              TESTIMONIALS
            </div>
            <h2 className="text-5xl md:text-6xl font-black text-gray-900 mb-6">What Students Say</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Join thousands of satisfied students across Africa
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <TestimonialCard
              quote="REMIE made paying my school fees so easy! No more long queues at the bank. I can do everything from my phone."
              name="Chioma Adebayo"
              role="Computer Science Student"
              university="University of Lagos"
              image="CA"
            />
            <TestimonialCard
              quote="The P2P transfer feature is a lifesaver. I can send money to my friends instantly without any fees. Amazing!"
              name="Tunde Okafor"
              role="Engineering Student"
              university="Covenant University"
              image="TO"
            />
            <TestimonialCard
              quote="Got an emergency loan when I needed it most. The approval was instant and saved me during a tough time."
              name="Amina Hassan"
              role="Medical Student"
              university="Ahmadu Bello University"
              image="AH"
            />
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-20">
            <div className="inline-block px-5 py-2 bg-green-100 rounded-full text-green-700 font-bold text-sm mb-6">
              PRICING
            </div>
            <h2 className="text-5xl md:text-6xl font-black text-gray-900 mb-6">Simple, Transparent Pricing</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              No hidden fees. No monthly charges. Pay only for what you use.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <PricingCard
              title="P2P Transfers"
              price="Free"
              features={[
                'Unlimited transfers',
                'Instant settlement',
                'No transaction fees',
                'Send to any student',
                'Transaction history'
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
                'Digital receipts',
                'Payment tracking'
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
                'Flexible terms',
                'Build credit score'
              ]}
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-28 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-white rounded-full mix-blend-overlay filter blur-3xl opacity-10 animate-blob"></div>
          <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-white rounded-full mix-blend-overlay filter blur-3xl opacity-10 animate-blob animation-delay-2000"></div>
        </div>

        <div className="max-w-5xl mx-auto px-4 text-center relative z-10">
          <h2 className="text-5xl md:text-6xl font-black text-white mb-8 leading-tight">
            Ready to Simplify Your Payments?
          </h2>
          <p className="text-2xl text-indigo-100 mb-12 max-w-3xl mx-auto leading-relaxed">
            Join thousands of students who trust REMIE for their payment needs. Get started in less than 2 minutes.
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Link
              href="/auth/signup"
              className="group inline-flex items-center justify-center bg-white text-indigo-600 px-12 py-5 rounded-2xl font-black text-lg hover:bg-gray-100 transform hover:scale-105 transition-all duration-300 shadow-2xl"
            >
              Get Started for Free
              <svg className="w-6 h-6 ml-3 group-hover:translate-x-2 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>

            <a
              href="#contact"
              className="inline-flex items-center justify-center bg-transparent text-white px-12 py-5 rounded-2xl font-black text-lg border-3 border-white hover:bg-white hover:text-indigo-600 transition-all duration-300 shadow-lg"
            >
              Contact Sales
            </a>
          </div>

          <div className="flex items-center justify-center gap-8 mt-10 text-white font-semibold flex-wrap">
            <span className="flex items-center gap-2">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              No credit card required
            </span>
            <span className="flex items-center gap-2">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Free forever
            </span>
            <span className="flex items-center gap-2">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Cancel anytime
            </span>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-28 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-20">
            <div>
              <div className="inline-block px-5 py-2 bg-indigo-100 rounded-full text-indigo-700 font-bold text-sm mb-8">
                CONTACT US
              </div>
              <h2 className="text-5xl font-black text-gray-900 mb-6">Get in Touch</h2>
              <p className="text-xl text-gray-600 mb-12 leading-relaxed">
                Have questions? We're here to help. Reach out to our support team and we'll get back to you within 24 hours.
              </p>

              <div className="space-y-8">
                <ContactInfo
                  icon={
                    <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  }
                  title="Email"
                  content="support@remie.app"
                  link="mailto:support@remie.app"
                  color="indigo"
                />

                <ContactInfo
                  icon={
                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  }
                  title="Phone"
                  content="+234 800 REMIE APP"
                  link="tel:+2348000000000"
                  color="purple"
                />

                <ContactInfo
                  icon={
                    <svg className="w-6 h-6 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  }
                  title="Office"
                  content="Lagos, Nigeria"
                  color="pink"
                />
              </div>
            </div>

            <div className="bg-white rounded-3xl p-10 shadow-2xl border border-gray-100">
              <form className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-3">Full Name</label>
                  <input
                    type="text"
                    className="w-full px-5 py-4 bg-gray-50 text-gray-900 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition placeholder:text-gray-400"
                    placeholder="John Doe"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-3">Email Address</label>
                  <input
                    type="email"
                    className="w-full px-5 py-4 bg-gray-50 text-gray-900 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition placeholder:text-gray-400"
                    placeholder="john@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-3">Message</label>
                  <textarea
                    rows={5}
                    className="w-full px-5 py-4 bg-gray-50 text-gray-900 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition resize-none placeholder:text-gray-400"
                    placeholder="How can we help you?"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white py-5 rounded-xl font-bold text-lg shadow-2xl hover:shadow-indigo-500/50 transform hover:scale-105 transition-all duration-300"
                >
                  Send Message
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-5 gap-12 mb-16">
            <div className="md:col-span-2">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-2xl">R</span>
                </div>
                <span className="text-3xl font-black">REMIE</span>
              </div>
              <p className="text-gray-400 mb-8 max-w-sm leading-relaxed text-lg">
                Simplifying student payments across Africa with cutting-edge technology and unparalleled service.
              </p>
              <div className="flex gap-4">
                <SocialLink icon="twitter" />
                <SocialLink icon="github" />
                <SocialLink icon="linkedin" />
              </div>
            </div>

            <FooterLinks
              title="Product"
              links={[
                { name: 'Features', href: '#features' },
                { name: 'Pricing', href: '#pricing' },
                { name: 'Security', href: '#' },
                { name: 'API Docs', href: '#' },
              ]}
            />

            <FooterLinks
              title="Company"
              links={[
                { name: 'About Us', href: '#' },
                { name: 'Careers', href: '#' },
                { name: 'Blog', href: '#' },
                { name: 'Contact', href: '#contact' },
              ]}
            />

            <FooterLinks
              title="Legal"
              links={[
                { name: 'Privacy Policy', href: '#' },
                { name: 'Terms of Service', href: '#' },
                { name: 'Cookie Policy', href: '#' },
                { name: 'Compliance', href: '#' },
              ]}
            />
          </div>

          <div className="border-t border-gray-800 pt-10 flex flex-col md:flex-row justify-between items-center gap-6">
            <p className="text-gray-400 text-sm">
              © 2024 REMIE. All rights reserved.
            </p>
            <div className="flex items-center gap-8 text-sm text-gray-400">
              <a href="#" className="hover:text-white transition-colors font-medium">Status</a>
              <a href="#" className="hover:text-white transition-colors font-medium">Changelog</a>
              <a href="#" className="hover:text-white transition-colors font-medium">Help Center</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Component Definitions

function TrustBadge({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="flex items-center gap-3 text-gray-700">
      <span className="text-2xl">{icon}</span>
      <span className="font-semibold">{text}</span>
    </div>
  );
}

function TransactionItem({ type, time, amount, color, icon }: { type: string; time: string; amount: string; color: string; icon: string }) {
  const colorClasses = {
    green: 'bg-green-100 text-green-600',
    blue: 'bg-blue-100 text-blue-600',
  };

  return (
    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors">
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 ${colorClasses[color as keyof typeof colorClasses]} rounded-xl flex items-center justify-center`}>
          {icon === 'check' ? (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
          )}
        </div>
        <div>
          <p className="font-bold text-gray-900">{type}</p>
          <p className="text-sm text-gray-500">{time}</p>
        </div>
      </div>
      <span className="font-black text-gray-900 text-lg">{amount}</span>
    </div>
  );
}

function InstitutionLogo({ name }: { name: string }) {
  return (
    <div className="flex items-center justify-center h-20 bg-gray-100 rounded-xl px-6 font-bold text-gray-600 text-lg hover:bg-gray-200 transition-colors">
      {name}
    </div>
  );
}

function StatCard({ number, label, delay }: { number: string; label: string; delay: string }) {
  return (
    <div className={`text-center animate-scale-in animation-delay-${delay}`}>
      <div className="text-5xl md:text-6xl font-black text-white mb-3">{number}</div>
      <div className="text-indigo-100 font-semibold text-lg">{label}</div>
    </div>
  );
}

function FeatureCard({ icon, title, description, gradient }: { icon: React.ReactNode; title: string; description: string; gradient: string }) {
  return (
    <div className="group bg-white rounded-3xl p-10 shadow-lg hover:shadow-2xl transition-all duration-500 border border-gray-100 hover:border-indigo-100 hover-lift">
      <div className={`w-18 h-18 bg-gradient-to-br ${gradient} rounded-2xl flex items-center justify-center text-white mb-8 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg p-5`}>
        {icon}
      </div>
      <h3 className="text-2xl font-black text-gray-900 mb-4">{title}</h3>
      <p className="text-gray-600 leading-relaxed text-lg">{description}</p>
    </div>
  );
}

function StepCard({ number, title, description, gradient }: { number: string; title: string; description: string; gradient: string }) {
  return (
    <div className="relative text-center group">
      <div className={`w-24 h-24 bg-gradient-to-br ${gradient} rounded-3xl flex items-center justify-center text-white text-3xl font-black mb-8 mx-auto shadow-2xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-300`}>
        {number}
      </div>
      <h3 className="text-3xl font-black text-gray-900 mb-5">{title}</h3>
      <p className="text-gray-600 leading-relaxed text-lg">{description}</p>
    </div>
  );
}

function TestimonialCard({ quote, name, role, university, image }: { quote: string; name: string; role: string; university: string; image: string }) {
  return (
    <div className="bg-white rounded-3xl p-10 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 hover-lift">
      <div className="flex items-center gap-2 mb-6">
        {[...Array(5)].map((_, i) => (
          <svg key={i} className="w-6 h-6 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
      <p className="text-gray-700 leading-relaxed mb-8 text-lg italic">"{quote}"</p>
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
          {image}
        </div>
        <div>
          <p className="font-black text-gray-900 text-lg">{name}</p>
          <p className="text-sm text-gray-500 font-semibold">{role}</p>
          <p className="text-sm text-indigo-600 font-semibold">{university}</p>
        </div>
      </div>
    </div>
  );
}

function PricingCard({ title, price, period, features, highlighted }: { title: string; price: string; period?: string; features: string[]; highlighted?: boolean }) {
  return (
    <div className={`rounded-3xl p-10 transition-all duration-300 ${
      highlighted
        ? 'bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-2xl scale-105 border-4 border-indigo-400 relative'
        : 'bg-white shadow-lg hover:shadow-2xl border border-gray-100 hover-lift'
    }`}>
      {highlighted && (
        <div className="absolute -top-5 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-sm font-black px-6 py-2 rounded-full shadow-lg">
          MOST POPULAR
        </div>
      )}
      <h3 className={`text-3xl font-black mb-3 ${highlighted ? 'text-white' : 'text-gray-900'}`}>{title}</h3>
      <div className="mb-8">
        <span className={`text-6xl font-black ${highlighted ? 'text-white' : 'text-gray-900'}`}>{price}</span>
        {period && <span className={`text-sm ml-2 ${highlighted ? 'text-indigo-100' : 'text-gray-600'}`}>{period}</span>}
      </div>
      <ul className="space-y-5 mb-10">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start gap-4">
            <svg className={`w-7 h-7 flex-shrink-0 ${highlighted ? 'text-white' : 'text-green-500'}`} fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className={`text-left font-semibold text-lg ${highlighted ? 'text-white' : 'text-gray-900'}`}>{feature}</span>
          </li>
        ))}
      </ul>
      <Link
        href="/auth/signup"
        className={`block text-center py-5 rounded-2xl font-black text-lg transition-all duration-300 ${
          highlighted
            ? 'bg-white text-indigo-600 hover:bg-gray-100 hover:scale-105 shadow-2xl'
            : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:shadow-2xl hover:scale-105'
        }`}
      >
        Get Started
      </Link>
    </div>
  );
}

function ContactInfo({ icon, title, content, link, color }: { icon: React.ReactNode; title: string; content: string; link?: string; color: string }) {
  const colorClasses = {
    indigo: 'bg-indigo-100',
    purple: 'bg-purple-100',
    pink: 'bg-pink-100',
  };

  const Content = () => (
    <div className="flex items-start gap-5">
      <div className={`w-14 h-14 ${colorClasses[color as keyof typeof colorClasses]} rounded-2xl flex items-center justify-center flex-shrink-0`}>
        {icon}
      </div>
      <div>
        <div className="font-black text-gray-900 mb-2 text-lg">{title}</div>
        {link ? (
          <a href={link} className={`text-${color}-600 hover:text-${color}-700 font-semibold text-lg`}>{content}</a>
        ) : (
          <p className="text-gray-600 font-semibold text-lg">{content}</p>
        )}
      </div>
    </div>
  );

  return <Content />;
}

function SocialLink({ icon }: { icon: string }) {
  const icons = {
    twitter: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
      </svg>
    ),
    github: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
      </svg>
    ),
    linkedin: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
      </svg>
    ),
  };

  return (
    <a href="#" className="w-12 h-12 bg-gray-800 hover:bg-gradient-to-br hover:from-indigo-600 hover:to-purple-600 rounded-xl flex items-center justify-center transition-all duration-300 transform hover:scale-110 hover:shadow-lg">
      {icons[icon as keyof typeof icons]}
    </a>
  );
}

function FooterLinks({ title, links }: { title: string; links: { name: string; href: string }[] }) {
  return (
    <div>
      <h4 className="font-black mb-6 text-xl">{title}</h4>
      <ul className="space-y-4 text-gray-400">
        {links.map((link, index) => (
          <li key={index}>
            <a href={link.href} className="hover:text-white transition-colors font-semibold text-lg hover:translate-x-1 inline-block">{link.name}</a>
          </li>
        ))}
      </ul>
    </div>
  );
}
