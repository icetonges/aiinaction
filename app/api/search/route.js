import { searchCatalog, searchPapers } from '@/lib/catalog';

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const catalogResults = searchCatalog({
    query: body.query || '',
    filters: body.filters || {},
    limit: body.limit || 100,
  });
  const paperResults = searchPapers({
    query: body.query || '',
    limit: body.documentLimit || 12,
  });
  return Response.json({
    count: catalogResults.length,
    documentCount: paperResults.length,
    results: catalogResults,
    paperResults,
    strategyResults: paperResults,
  });
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q') || '';
  const catalogResults = searchCatalog({ query, limit: Number(searchParams.get('limit') || 50) });
  const paperResults = searchPapers({ query, limit: Number(searchParams.get('documentLimit') || 12) });
  return Response.json({
    count: catalogResults.length,
    documentCount: paperResults.length,
    results: catalogResults,
    paperResults,
    strategyResults: paperResults,
  });
}
