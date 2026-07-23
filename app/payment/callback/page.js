'use client';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

export default function PaymentCallback() {
  const [status, setStatus] = useState('verifying');
  const [credentials, setCredentials] = useState(null);
  const [error, setError] = useState(null);
  const searchParams = useSearchParams();
  const reference = searchParams.get('reference');

  useEffect(() => {
    if (reference) {
      verifyPayment();
    }
  }, [reference]);

  const verifyPayment = async () => {
    try {
      const response = await fetch(`/api/payment/verify?reference=${reference}`);
      const data = await response.json();

      if (data.status) {
        setStatus('success');
        setCredentials(data.credentials);
      } else {
        setStatus('failed');
        setError(data.message || 'Payment verification failed');
      }
    } catch (error) {
      setStatus('error');
      setError('An error occurred while verifying payment');
    }
  };

  if (status === 'verifying') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold text-gray-800">Verifying Payment...</h2>
          <p className="text-gray-600 mt-2">Please wait while we confirm your payment</p>
        </div>
      </div>
    );
  }

  if (status === 'success' && credentials) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">✅</div>
            <h1 className="text-3xl font-bold text-green-600">Payment Successful!</h1>
            <p className="text-gray-600 mt-2">Your Pterodactyl panel has been provisioned</p>
          </div>

          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">Your Panel Credentials</h2>
            
            <div className="space-y-4">
              <div className="bg-white p-4 rounded border">
                <label className="text-sm text-gray-600 font-medium">Panel Link</label>
                <p className="text-lg font-mono text-blue-600 break-all">
                  {credentials.panel_link}
                </p>
              </div>

              <div className="bg-white p-4 rounded border">
                <label className="text-sm text-gray-600 font-medium">Username</label>
                <p className="text-lg font-mono break-all">{credentials.username}</p>
              </div>

              <div className="bg-white p-4 rounded border">
                <label className="text-sm text-gray-600 font-medium">Password</label>
                <p className="text-lg font-mono break-all">{credentials.password}</p>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <p className="text-yellow-800 font-medium">⚠️ Important</p>
            <p className="text-yellow-700 mt-1">
              Please save these credentials securely. For security reasons, 
              the password will not be displayed again.
            </p>
          </div>

          <div className="flex space-x-4">
            <button
              onClick={() => window.open(credentials.panel_link, '_blank')}
              className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition"
            >
              Go to Panel
            </button>
            <button
              onClick={() => window.location.href = '/dashboard'}
              className="flex-1 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'failed' || status === 'error') {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-3xl font-bold text-red-600 mb-4">Payment Failed</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="space-x-4">
            <button
              onClick={() => window.location.href = '/products'}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
            >
              Try Again
            </button>
            <button
              onClick={() => window.location.href = '/contact'}
              className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition"
            >
              Contact Support
            </button>
          </div>
        </div>
      </div>
    );
  }
}
