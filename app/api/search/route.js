import { searchCatalog } from '@/lib/catalog';

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const results = searchCatalog({
    query: body.query || '',
    filters: body.filters || {},
    limit: body.limit || 100,
  });
  return Response.json({ count: results.length, results });
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const results = searchCatalog({ query: searchParams.get('q') || '', limit: Number(searchParams.get('limit') || 50) });
  return Response.json({ count: results.length, results });
}
