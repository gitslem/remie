export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-50 to-white">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-6xl font-bold text-gray-900 mb-4">
            Welcome to <span className="text-indigo-600">REMIE</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Your digital payment platform for seamless student transactions
          </p>

          <div className="grid md:grid-cols-3 gap-8 mt-16">
            <FeatureCard
              icon="💳"
              title="RRR Payments"
              description="Pay school fees and government charges instantly with RRR codes"
            />
            <FeatureCard
              icon="💰"
              title="P2P Transfers"
              description="Send and receive money from fellow students easily"
            />
            <FeatureCard
              icon="📊"
              title="Payment Tracking"
              description="Track all your transactions in one unified dashboard"
            />
            <FeatureCard
              icon="💸"
              title="Microloans"
              description="Get quick loans for urgent school-related expenses"
            />
            <FeatureCard
              icon="🔐"
              title="Crypto Payments"
              description="Support for USDT/USDC cryptocurrency payments"
            />
            <FeatureCard
              icon="📱"
              title="Mobile First"
              description="Access your account anywhere, anytime on any device"
            />
          </div>

          <div className="mt-16 space-x-4">
            <a
              href="/auth/signup"
              className="inline-block bg-indigo-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition"
            >
              Get Started
            </a>
            <a
              href="/auth/login"
              className="inline-block bg-white text-indigo-600 px-8 py-3 rounded-lg font-semibold border-2 border-indigo-600 hover:bg-indigo-50 transition"
            >
              Login
            </a>
          </div>
        </div>
      </div>
    </main>
  )
}

function FeatureCard({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition">
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  )
}
