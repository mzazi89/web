'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

const packages = [
  {
    id: 1,
    name: 'Starter',
    price: 5,
    specs: {
      ram: '1GB',
      cpu: '1 Core',
      storage: '20GB SSD',
      bandwidth: '1TB',
      databases: 2,
      backups: 1
    },
    color: 'from-green-400 to-green-600',
    popular: false
  },
  {
    id: 2,
    name: 'Standard',
    price: 15,
    specs: {
      ram: '4GB',
      cpu: '2 Cores',
      storage: '50GB SSD',
      bandwidth: '3TB',
      databases: 5,
      backups: 3
    },
    color: 'from-blue-400 to-blue-600',
    popular: true
  },
  {
    id: 3,
    name: 'Premium',
    price: 30,
    specs: {
      ram: '8GB',
      cpu: '4 Cores',
      storage: '100GB SSD',
      bandwidth: '10TB',
      databases: 10,
      backups: 5
    },
    color: 'from-purple-400 to-purple-600',
    popular: false
  }
];

export default function PterodactylPackages() {
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handlePurchase = async (pkg) => {
    setSelectedPackage(pkg.id);
    setLoading(true);

    try {
      // Initialize payment with Paystack
      const response = await fetch('/api/payment/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packageId: pkg.id,
          packageName: pkg.name,
          amount: pkg.price,
          type: 'pterodactyl'
        })
      });

      const data = await response.json();

      if (data.status && data.data.authorization_url) {
        // Redirect to Paystack payment page
        window.location.href = data.data.authorization_url;
      } else {
        alert('Payment initialization failed. Please try again.');
      }
    } catch (error) {
      console.error('Payment error:', error);
      alert('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="py-12 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-4">Pterodactyl Hosting Plans</h2>
        <p className="text-center text-gray-600 mb-12">
          Choose the perfect hosting plan for your game servers
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {packages.map((pkg) => (
            <div
              key={pkg.id}
              className={`relative bg-white rounded-2xl shadow-xl overflow-hidden transform transition-all hover:scale-105 ${
                pkg.popular ? 'ring-2 ring-blue-500' : ''
              }`}
            >
              {pkg.popular && (
                <div className="absolute top-4 right-4 bg-blue-500 text-white px-3 py-1 rounded-full text-sm">
                  Popular
                </div>
              )}
              
              <div className={`bg-gradient-to-r ${pkg.color} p-6 text-white`}>
                <h3 className="text-2xl font-bold">{pkg.name}</h3>
                <div className="mt-2">
                  <span className="text-4xl font-bold">${pkg.price}</span>
                  <span className="text-lg">/month</span>
                </div>
              </div>
              
              <div className="p-6">
                <ul className="space-y-3">
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                    </svg>
                    <span className="font-medium">RAM:</span>
                    <span className="ml-auto">{pkg.specs.ram}</span>
                  </li>
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                    </svg>
                    <span className="font-medium">CPU:</span>
                    <span className="ml-auto">{pkg.specs.cpu}</span>
                  </li>
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                    </svg>
                    <span className="font-medium">Storage:</span>
                    <span className="ml-auto">{pkg.specs.storage}</span>
                  </li>
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                    </svg>
                    <span className="font-medium">Bandwidth:</span>
                    <span className="ml-auto">{pkg.specs.bandwidth}</span>
                  </li>
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                    </svg>
                    <span className="font-medium">Databases:</span>
                    <span className="ml-auto">{pkg.specs.databases}</span>
                  </li>
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                    </svg>
                    <span className="font-medium">Backups:</span>
                    <span className="ml-auto">{pkg.specs.backups}</span>
                  </li>
                </ul>
                
                <button
                  onClick={() => handlePurchase(pkg)}
                  disabled={loading}
                  className={`mt-6 w-full bg-gradient-to-r ${pkg.color} text-white py-3 rounded-lg font-semibold hover:opacity-90 transition disabled:opacity-50`}
                >
                  {loading && selectedPackage === pkg.id ? 'Processing...' : `Get Started with ${pkg.name}`}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
