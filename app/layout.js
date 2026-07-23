import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import TechBackground from '../components/TechBackground';
import './globals.css';

export const metadata = {
  title: 'MZAZI TECH INC - Technology & Automation Solutions',
  description: 'Your trusted partner for WhatsApp bots, Pterodactyl panel hosting, and automation solutions in Kenya.',
  keywords: 'pterodactyl hosting, whatsapp bot, automation, kenya, game server',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body className="flex flex-col min-h-screen" style={{ backgroundColor: '#0a0a0f', color: '#f0f4ff' }}>
        {/* Fixed tech background — sits behind everything */}
        <TechBackground />

        <Navbar />
        <main className="flex-grow" style={{ position: 'relative', zIndex: 1 }}>
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
