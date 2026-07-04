import './styles.css';

export const metadata = {
  title: 'AI Use Case Library for DoD FM, Audit, and Finance',
  description: 'Searchable AI use-case catalog built from federal, audit, finance, and DoD FM workbooks.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
