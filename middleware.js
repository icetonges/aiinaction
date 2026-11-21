import { NextResponse } from 'next/server';

// robots.txt takes days to propagate and some crawlers ignore it. This runs on
// Edge Middleware (billed as cheap edge invocations, not Fluid Active CPU) and
// refuses to hand crawlers a full SSR render for every facet-combination URL.
// Real browsers are unaffected: the check only fires on bot-like or missing
// user agents, and only for the API routes.
const BOT_RE = /bot|crawl|spider|slurp|scrapy|python-requests|python-httpx|go-http-client|curl|wget|petalbot|bytespider|semrush|ahrefs|mj12|dataforseo|serpapi/i;

export function middleware(request) {
  const ua = request.headers.get('user-agent') || '';
  const isBot = !ua || BOT_RE.test(ua);
  if (!isBot) return NextResponse.next();

  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/api/')) {
    return new NextResponse('Not available to crawlers.', {
      status: 403,
      headers: { 'x-robots-tag': 'noindex' },
    });
  }

  return NextResponse.next();
}

export const config = {
  // /browse is no longer matched: it is a static CDN page for every query
  // string now, and running middleware on it would cost an invocation.
  matcher: ['/api/:path*'],
};
