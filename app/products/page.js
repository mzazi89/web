import PterodactylPackages from '../../components/PterodactylPackages';

export default function ProductsPage() {
  return (
    <div>
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold mb-4">Our Products</h1>
          <p className="text-xl text-blue-100">
            Choose from our range of technology and automation solutions
          </p>
        </div>
      </section>

      <PterodactylPackages />

      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">WhatsApp Automation Bots</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-gradient-to-br from-green-400 to-green-600 text-white p-8 rounded-2xl shadow-xl">
              <h3 className="text-2xl font-bold mb-4">Basic Bot</h3>
              <div className="text-4xl font-bold mb-4">$15<span className="text-xl">/month</span></div>
              <ul className="space-y-3 mb-8">
                <li>✓ Auto-reply messages</li>
                <li>✓ Message forwarding</li>
                <li>✓ Basic commands</li>
                <li>✓ 24/7 uptime</li>
                <li>✓ Email support</li>
              </ul>
              <button className="w-full bg-white text-green-600 py-3 rounded-lg font-semibold hover:bg-green-50 transition">
                Get Started
              </button>
            </div>
            
            <div className="bg-gradient-to-br from-purple-400 to-purple-600 text-white p-8 rounded-2xl shadow-xl transform scale-105">
              <div className="absolute top-4 right-4 bg-yellow-400 text-purple-900 px-3 py-1 rounded-full text-sm font-bold">
                POPULAR
              </div>
              <h3 className="text-2xl font-bold mb-4">Premium Bot</h3>
              <div className="text-4xl font-bold mb-4">$30<span className="text-xl">/month</span></div>
              <ul className="space-y-3 mb-8">
                <li>✓ Everything in Basic</li>
                <li>✓ AI-powered responses</li>
                <li>✓ Custom workflows</li>
                <li>✓ Analytics dashboard</li>
                <li>✓ Priority support</li>
              </ul>
              <button className="w-full bg-white text-purple-600 py-3 rounded-lg font-semibold hover:bg-purple-50 transition">
                Get Started
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
