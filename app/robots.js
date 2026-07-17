// Crawler policy. The /browse facet links create a combinatorial URL space
// (7 facets x ~20 values x 269 pages); every unique query-string URL is a
// dynamic SSR render that bills Fluid Active CPU. Static pages (/, /catalog/[id],
// /papers, /insights, plain /browse) stay crawlable; query-string URLs and the
// API routes do not.
export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/*?'],
      },
    ],
  };
}
