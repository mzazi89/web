import { neon } from '@neondatabase/serverless';
import DocsApp from '@/components/api/DocsApp';

export const dynamic = 'force-dynamic';

// Registry-driven documentation — every endpoint below comes from the database
async function getEndpoints() {
  try {
    const sql = neon(process.env.DATABASE_URL);
    const rows = await sql`
      SELECT path, method, category, name, description, provider, upstream, parameters, is_active
      FROM endpoints ORDER BY category ASC, path ASC
    `;
    return rows.map(r => ({
      ...r,
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
