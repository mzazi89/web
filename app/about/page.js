export default function AboutPage() {
  return (
    <div>
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold mb-4">About MZAZI TECH INC</h1>
          <p className="text-xl text-blue-100">
            Innovating Technology, Empowering Businesses
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6">Our Story</h2>
              <p className="text-gray-600 mb-4">
                Founded with a vision to democratize technology access, MZAZI TECH INC has been at the 
                forefront of providing innovative tech solutions to businesses and individuals.
              </p>
              <p className="text-gray-600 mb-4">
                We specialize in WhatsApp automation, game server hosting with Pterodactyl panel, 
                and custom automation solutions that help our clients save time and resources.
              </p>
              <p className="text-gray-600">
                Our team of experienced developers and tech enthusiasts work tirelessly to deliver 
                reliable, scalable, and affordable technology solutions.
              </p>
            </div>
            <div className="bg-gray-100 rounded-lg p-8">
              <h3 className="text-2xl font-bold mb-4">Our Mission</h3>
              <p className="text-gray-600 mb-4">
                To provide accessible, reliable, and innovative technology solutions that empower 
                businesses to thrive in the digital age.
              </p>
              <h3 className="text-2xl font-bold mb-4">Our Vision</h3>
              <p className="text-gray-600">
                To become the leading provider of automation and hosting solutions, driving digital 
                transformation across industries.
              </p>
            </div>
          </div>

          <div className="mt-16">
            <h2 className="text-3xl font-bold text-center mb-12">Why Choose Us?</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center p-6 bg-white rounded-lg shadow-lg">
                <div className="text-4xl mb-4">🔒</div>
                <h3 className="text-xl font-bold mb-2">Reliable & Secure</h3>
                <p className="text-gray-600">
                  Enterprise-grade security and 99.9% uptime guarantee on all our services.
                </p>
              </div>
              <div className="text-center p-6 bg-white rounded-lg shadow-lg">
                <div className="text-4xl mb-4">💡</div>
                <h3 className="text-xl font-bold mb-2">Innovation First</h3>
                <p className="text-gray-600">
                  Constantly updating and improving our solutions with the latest technology.
                </p>
              </div>
              <div className="text-center p-6 bg-white rounded-lg shadow-lg">
                <div className="text-4xl mb-4">🤝</div>
                <h3 className="text-xl font-bold mb-2">24/7 Support</h3>
                <p className="text-gray-600">
                  Dedicated support team available round the clock to assist you.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
