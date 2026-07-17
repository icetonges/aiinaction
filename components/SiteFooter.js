export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="shell">
        <div className="footer-col">
          <h4>Library</h4>
          <div><a href="/">Home</a></div>
          <div><a href="/browse">Browse catalog</a></div>
          <div><a href="/papers">Papers</a></div>
          <div><a href="/insights">Insights</a></div>
        </div>
        <div className="footer-col">
          <h4>Workbooks</h4>
          <div><a href="/browse?workbook=DoD%20FM%20AI%20Use%20Case%20Catalog">Recommended cases for defense audit</a></div>
          <div><a href="/browse?workbook=Federal%20%2F%20Audit%20%2F%20Finance%20Catalog">Federal / Audit / Finance Catalog</a></div>
          <div><a href="/browse?workbook=OMB%202025%20Individually%20Reported%20AI%20Use%20Cases">OMB individually reported</a></div>
          <div><a href="/browse?workbook=OMB%202025%20Consolidated%20COTS%20AI%20Use%20Cases">OMB consolidated COTS</a></div>
        </div>
        <div className="footer-col">
          <h4>Downloads</h4>
          <div><a href="/downloads/dod_fm_ai_use_case_catalog.xlsx">Defense audit workbook</a></div>
          <div><a href="/downloads/ai_use_case_catalog_federal_audit_finance.xlsx">Federal / audit / finance workbook</a></div>
          <div><a href="/downloads/omb_2025_individually_reported_ai_use_cases.xlsx">OMB individually reported workbook</a></div>
          <div><a href="/downloads/omb_2025_consolidated_cots_ai_use_cases.xlsx">OMB consolidated COTS workbook</a></div>
        </div>
        <div className="footer-col">
          <h4>Evidence note</h4>
          <div style={{ maxWidth: '260px', color: '#a9b7cc' }}>
            Opportunity and inventory catalogs derived from public sources. Not an official record of deployed systems. Verify Evidence Type and Source Basis before briefing leadership.
          </div>
        </div>
      </div>
    </footer>
  );
}
