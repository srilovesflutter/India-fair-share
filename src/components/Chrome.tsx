import type { ReactNode } from "react";
import { NavLink } from "react-router-dom";

export function Chrome({ children }: { children: ReactNode }) {
  return (
    <div className="shell">
      <header className="nav">
        <NavLink to="/" className="brand">
          <strong>Fair Share</strong>
          <span>India jobs measured against India revenue</span>
        </NavLink>
        <nav className="nav-links">
          <NavLink to="/" end>
            Ledger
          </NavLink>
          <NavLink to="/methodology">Methodology</NavLink>
        </nav>
      </header>
      {children}
      <footer>
        Figures are public disclosures only. A blank is an undisclosed number, not a zero. Ledger reviewed 12 November 2026.
      </footer>
    </div>
  );
}

export function TypeBadge({ type }: { type: string }) {
  const cls =
    type.startsWith("offshore") ? "gcc" : type.startsWith("sells") ? "sells" : type.startsWith("india") ? "ref" : "mixed";
  return <span className={`badge ${cls}`}>{type}</span>;
}
