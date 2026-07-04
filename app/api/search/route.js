import { searchCatalog, searchStrategyPaper } from '@/lib/catalog';

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const catalogResults = searchCatalog({
    query: body.query || '',
    filters: body.filters || {},
    limit: body.limit || 100,
  });
  const strategyResults = searchStrategyPaper({
    query: body.query || '',
    limit: body.documentLimit || 8,
  });
  return Response.json({
    count: catalogResults.length,
    documentCount: strategyResults.length,
    results: catalogResults,
    strategyResults,
  });
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q') || '';
  const catalogResults = searchCatalog({ query, limit: Number(searchParams.get('limit') || 50) });
  const strategyResults = searchStrategyPaper({ query, limit: Number(searchParams.get('documentLimit') || 8) });
  return Response.json({
    count: catalogResults.length,
    documentCount: strategyResults.length,
    results: catalogResults,
    strategyResults,
  });
}
