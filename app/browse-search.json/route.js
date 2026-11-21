import { buildBrowseSearchText } from '@/lib/browse/build-index';

// Prerendered at build and served from the CDN: no function invocation.
export const dynamic = 'force-static';

export function GET() {
  return Response.json(buildBrowseSearchText());
}
