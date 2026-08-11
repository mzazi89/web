import { neon } from '@neondatabase/serverless';
import { unstable_noStore as noStore } from 'next/cache';
import DocsApp from '@/components/api/DocsApp';

export const dynamic = 'force-dynamic';

// Registry-driven documentation — every endpoint below comes from the database
async function getEndpoints() {
  // disable request-level caching so registry changes are always reflected
  noStore();
  try {
    const sql = neon(process.env.DATABASE_URL);
    const [rows, prov] = await Promise.all([
      sql`
        SELECT path, method, category, name, description, provider, upstream, parameters, is_active
        FROM endpoints ORDER BY category ASC, path ASC
      `,
      sql`SELECT name, display_name FROM providers`,
    ]);
    const providerNames = {};
    prov.forEach(p => { providerNames[p.name] = p.display_name || p.name; });
    return rows.map(r => ({
      ...r,
      provider: providerNames[r.provider] || r.provider,
      parameters: typeof r.parameters === 'object' ? r.parameters : { required: [], optional: [] },
    }));
  } catch {
    return [];
  }
}

export default async function ApiDocs() {
  const endpoints = await getEndpoints();
  return <DocsApp endpoints={endpoints} />;
}
