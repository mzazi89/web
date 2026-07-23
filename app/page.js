import Link from 'next/link';

export default function Home() {
  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 via-blue-700 to-purple-800 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            MZAZI TECH INC
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-blue-100">
            Your Gateway to Advanced Technology & Automation Solutions
          </p>
          <p className="text-lg mb-10 text-blue-200 max-w-3xl mx-auto">
            Empowering businesses with cutting-edge WhatsApp bots, reliable Pterodactyl panel hosting, 
            and comprehensive automation tools. Transform your digital operations today.
          </p>
          <div className="space-x-4">
            <Link
              href="/products"
              className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition inline-block"
            >
              View Products
            </Link>
            <Link
              href="/signup"
              className="bg-green-500 text-white px-8 py-3 rounded-lg font-semibold hover:bg-green-600 transition inline-block"
            >
              Get Started
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Our Services</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-lg shadow-lg text-center">
              <div className="text-5xl mb-4">🤖</div>
              <h3 className="text-xl font-bold mb-4">WhatsApp Bots</h3>
              <p className="text-gray-600">
                Automate your WhatsApp business with intelligent bots. Handle customer inquiries, 
                send notifications, and manage conversations 24/7.
              </p>
            </div>
            
            <div className="bg-white p-8 rounded-lg shadow-lg text-center">
              <div className="text-5xl mb-4">🖥️</div>
              <h3 className="text-xl font-bold mb-4">Pterodactyl Panel</h3>
              <p className="text-gray-600">
                Professional game server hosting with Pterodactyl panel. Easy management, 
                high performance, and reliable infrastructure.
              </p>
            </div>
            
            <div className="bg-white p-8 rounded-lg shadow-lg text-center">
              <div className="text-5xl mb-4">⚡</div>
              <h3 className="text-xl font-bold mb-4">Automation Solutions</h3>
              <p className="text-gray-600">
                Custom automation tools to streamline your business processes. 
                Save time and increase efficiency with our solutions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-blue-600 text-white">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-xl mb-8">
            Join hundreds of satisfied customers using MZAZI TECH INC solutions
          </p>
          <Link
            href="/products"
            className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition inline-block text-lg"
          >
            Explore Our Products
          </Link>
        </div>
      </section>
    </div>
  );
}
