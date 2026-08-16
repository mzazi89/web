// This component is now replaced by the full products page at /products
// Kept for backwards compatibility
import Link from 'next/link';

export default function PterodactylPackages() {
  return (
    <div className="py-8 text-center">
      <Link href="/products" className="btn btn-primary" style={{ textDecoration: 'none' }}>
        View all plans →
      </Link>
    </div>
  );
}
