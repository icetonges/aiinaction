// Workbook labels and descriptions. Kept free of any data import so client
// components (UseCaseCard inside BrowseClient) can use it without pulling the
// 13 MB usecases.json into the browser bundle. lib/catalog.js re-exports these.

export const WORKBOOK_ORDER = [
  'DoD FM AI Use Case Catalog',
  'Federal / Audit / Finance Catalog',
  'OMB 2025 Individually Reported AI Use Cases',
  'OMB 2025 Consolidated COTS AI Use Cases',
];

export const WORKBOOK_META = {
  'DoD FM AI Use Case Catalog': {
    slug: 'dod-fm',
    shortLabel: 'Defense Audit',
    label: 'Recommended Cases for Defense Audit',
    description: 'Defense audit AI opportunities scored against FY27/FY28 audit priorities, material line items, and portfolio tiers.',
  },
  'Federal / Audit / Finance Catalog': {
    slug: 'federal-audit-finance',
    shortLabel: 'Federal / Audit / Finance',
    label: 'Federal, Audit & Finance Catalog',
    description: 'Cross-sector use cases spanning federal agencies, audit and accounting firms, and financial services.',
  },
  'OMB 2025 Individually Reported AI Use Cases': {
    slug: 'omb-individual',
    shortLabel: 'OMB Individually Reported',
    label: 'OMB 2025 Individually Reported AI Use Cases',
    description: 'Every individually reported AI use case from the 2025 government-wide OMB AI inventory, across 41 agencies.',
  },
  'OMB 2025 Consolidated COTS AI Use Cases': {
    slug: 'omb-cots',
    shortLabel: 'OMB Consolidated COTS',
    label: 'OMB 2025 Consolidated COTS AI Use Cases',
    description: 'Agency-by-agency adoption of common commercial/COTS AI patterns, from the 2025 OMB inventory.',
  },
};

export function workbookMeta(workbook) {
  return WORKBOOK_META[workbook] || { slug: 'catalog', shortLabel: workbook, label: workbook, description: '' };
}

export function slugForWorkbook(workbook) {
  return workbookMeta(workbook).slug;
}
