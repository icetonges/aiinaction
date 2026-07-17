"use client";

import { usePathname } from 'next/navigation';
import ThemeToggle from './ThemeToggle';

const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/browse', label: 'Browse catalog' },
  { href: '/papers', label: 'Papers' },
  { href: '/insights', label: 'Insights' },
];

export default function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="site-header">
      <div className="site-header-inner">
        <a className="site-brand" href="/">
          <span className="site-brand-name">AI Use Case Library</span>
          <span className="site-brand-tag">Defense · Federal · Audit · Finance · OMB 2025</span>
        </a>
        <nav className="site-nav" aria-label="Primary">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              data-active={link.href === '/' ? pathname === '/' : pathname?.startsWith(link.href)}
            >
              {link.label}
            </a>
          ))}
        </nav>
        <form className="site-search-form" action="/browse" method="GET">
          <input type="text" name="q" placeholder="Search use cases…" aria-label="Search use cases" />
          <button type="submit">Search</button>
        </form>
        <ThemeToggle />
      </div>
    </header>
  );
}
