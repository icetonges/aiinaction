import BrowseClient from '@/components/BrowseClient';
import { queryCatalog } from '@/lib/catalog';
import { cardFields, PAGE_SIZE } from '@/lib/browse/query';

// Static: prerendered once at build, then served from the CDN for /browse and
// for every /browse?<filters> URL (the CDN ignores the query string on a
// prerendered page). BrowseClient reads the query string in the browser and
// filters /browse-index.json there, so no facet combination ever reaches a
// function. Previously this page read searchParams, which made every unique
// URL a server render; crawlers walking 7 facets x ~20 values x 269 pages
// were the whole Fluid Active CPU bill.
export const dynamic = 'force-static';

export const metadata = {
  title: 'Browse the catalog',
  alternates: { canonical: '/browse' },
};

export default function BrowsePage() {
  const { items, total, facets } = queryCatalog({ limit: PAGE_SIZE, offset: 0 });
  const initial = { items: items.map(cardFields), total, facets };

  return (
    <main>
      <div className="shell">
        <div className="breadcrumb">
          <a href="/">Home</a>
          <span className="sep">/</span>
          <span className="current">Browse catalog</span>
        </div>
      </div>
      <BrowseClient initial={initial} />
    </main>
  );
}
