import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { RatioBars, ScatterPanel } from "../components/Charts";
import { TypeBadge } from "../components/Chrome";
import { companies, dataset } from "../lib/dataset";
import { companyLabel, formatCount, formatMoneyPair, formatRatio, formatUsd, ratioLabel, ratioTone } from "../lib/format";
import { evaluate, median } from "../lib/metrics";
import type { Company, CompanyGroup, CompanyType } from "../types";

type SortKey = "ratio" | "name" | "indiaRevenue" | "indiaEmployees" | "revenuePerEmployee" | "hq" | "sector";

const TYPES: Array<CompanyType | "all"> = [
  "all",
  "sells into India",
  "offshore/delivery centre heavy (GCC)",
  "mixed",
  "india-headquartered reference",
];

export function HomePage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [sector, setSector] = useState("all");
  const [hq, setHq] = useState("all");
  const [type, setType] = useState<(typeof TYPES)[number]>("all");
  const [group, setGroup] = useState<CompanyGroup | "all">("global");
  const [coverage, setCoverage] = useState<"all" | "ratio" | "gap">("all");
  const [sortKey, setSortKey] = useState<SortKey>("ratio");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const sectors = useMemo(() => unique(companies.map((company) => company.sector)), []);
  const countries = useMemo(() => unique(companies.map((company) => company.hqCountry)), []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return companies.filter((company) => {
      const result = evaluate(company);
      if (group !== "all" && company.group !== group) return false;
      if (sector !== "all" && company.sector !== sector) return false;
      if (hq !== "all" && company.hqCountry !== hq) return false;
      if (type !== "all" && company.type !== type) return false;
      if (coverage === "ratio" && result.status !== "ok") return false;
      if (coverage === "gap" && result.status === "ok") return false;
      if (!q) return true;
      return `${company.name} ${company.aka ?? ""} ${company.hqCountry} ${company.sector}`.toLowerCase().includes(q);
    });
  }, [coverage, group, hq, query, sector, type]);

  const ranked = useMemo(() => {
    const rows = filtered.map((company) => ({ company, result: evaluate(company) }));
    const byRatio = [...rows].sort((a, b) => (b.result.ratio ?? -Infinity) - (a.result.ratio ?? -Infinity));
    const rankById = new Map<string, number>();
    let place = 1;
    for (const row of byRatio) {
      if (row.result.status === "ok" && row.result.ratio != null) rankById.set(row.company.id, place++);
    }
    rows.sort((a, b) => compare(a.company, b.company, a.result, b.result, sortKey, sortDir));
    return rows.map((row) => ({ ...row, rank: rankById.get(row.company.id) ?? null }));
  }, [filtered, sortDir, sortKey]);

  const globalRatios = companies
    .filter((company) => company.group === "global")
    .map(evaluate)
    .filter((result) => result.status === "ok" && result.ratio != null)
    .map((result) => result.ratio as number);
  const computable = companies.filter((company) => evaluate(company).status === "ok").length;
  const medians = (["sells into India", "mixed", "offshore/delivery centre heavy (GCC)"] as CompanyType[]).map(
    (kind) => ({
      kind,
      value: median(
        companies
          .filter((company) => company.group === "global" && company.type === kind)
          .map(evaluate)
          .filter((result) => result.status === "ok" && result.ratio != null)
          .map((result) => result.ratio as number),
      ),
      n: companies.filter(
        (company) => company.group === "global" && company.type === kind && evaluate(company).status === "ok",
      ).length,
    }),
  );

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((dir) => (dir === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "name" || key === "hq" || key === "sector" ? "asc" : "desc");
    }
  }

  return (
    <>
      <section className="hero">
        <div>
          <div className="kicker">100 companies · public filings only</div>
          <h1>Do the jobs follow the revenue?</h1>
          <p className="lede">
            Fair Share compares the share of a company’s workforce based in India with the share of its revenue
            associated with India. The fairness ratio is above 1 when India has a larger share of the jobs than of
            the revenue, and below 1 when it has a smaller share.
          </p>
        </div>
        <div className="formula">
          <p>Fairness ratio</p>
          <code>
            (India employees / global employees)
            <br />÷ (India revenue / global revenue)
          </code>
          <small>Computed only when all four inputs are public and cover a comparable perimeter.</small>
        </div>
      </section>

      <aside className="caveat">
        {dataset.meta.caveat}
      </aside>

      <section className="stats">
        <div className="stat">
          <b>{companies.length}</b>
          <span>Companies in the ledger</span>
        </div>
        <div className="stat">
          <b>{computable}</b>
          <span>With a computable ratio</span>
        </div>
        <div className="stat">
          <b>{companies.length - computable}</b>
          <span>Insufficient or not comparable</span>
        </div>
        <div className="stat">
          <b>{globalRatios.length ? formatRatio(median(globalRatios)) : "—"}</b>
          <span>Median ratio, global companies</span>
        </div>
      </section>

      <section className="medians">
        {medians.map((item) => (
          <div className="median" key={item.kind}>
            <b>{item.value == null ? "—" : formatRatio(item.value)}</b>
            <span>
              Median · {item.kind} · {item.n} ratios
            </span>
          </div>
        ))}
      </section>

      <section className="filters">
        <label>
          Search
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Company, country, sector" />
        </label>
        <label>
          Sector
          <select value={sector} onChange={(event) => setSector(event.target.value)}>
            <option value="all">All sectors</option>
            {sectors.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
        <label>
          Headquarters
          <select value={hq} onChange={(event) => setHq(event.target.value)}>
            <option value="all">All countries</option>
            {countries.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
        <label>
          Company type
          <select value={type} onChange={(event) => setType(event.target.value as (typeof TYPES)[number])}>
            {TYPES.map((item) => (
              <option key={item} value={item}>
                {item === "all" ? "All types" : item}
              </option>
            ))}
          </select>
        </label>
        <label>
          Coverage
          <select value={coverage} onChange={(event) => setCoverage(event.target.value as typeof coverage)}>
            <option value="all">All rows</option>
            <option value="ratio">Ratio available</option>
            <option value="gap">Gaps only</option>
          </select>
        </label>
      </section>

      <div className="filters" style={{ gridTemplateColumns: "1fr" }}>
        <div className="field">
          Group
          <div className="nav-links" style={{ textTransform: "none", letterSpacing: 0 }}>
            {(
              [
                ["global", "Global companies"],
                ["india-reference", "Indian reference group"],
                ["all", "Both"],
              ] as const
            ).map(([value, label]) => (
              <a
                key={value}
                href="#group"
                className={group === value ? "active" : ""}
                onClick={(event) => {
                  event.preventDefault();
                  setGroup(value);
                }}
              >
                {label}
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className="charts">
        <ScatterPanel companies={filtered} />
        <RatioBars companies={filtered} />
      </div>

      {ranked.length === 0 ? (
        <div className="empty panel">No companies match these filters. Clear search or choose a broader sector.</div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Rank</th>
                <Th label="Company" active={sortKey === "name"} onClick={() => toggleSort("name")} />
                <Th label="Sector" active={sortKey === "sector"} onClick={() => toggleSort("sector")} />
                <Th label="HQ" active={sortKey === "hq"} onClick={() => toggleSort("hq")} />
                <Th label="India revenue" active={sortKey === "indiaRevenue"} onClick={() => toggleSort("indiaRevenue")} />
                <Th label="India employees" active={sortKey === "indiaEmployees"} onClick={() => toggleSort("indiaEmployees")} />
                <Th label="Rev / India employee" active={sortKey === "revenuePerEmployee"} onClick={() => toggleSort("revenuePerEmployee")} />
                <Th label="Fairness ratio" active={sortKey === "ratio"} onClick={() => toggleSort("ratio")} />
              </tr>
            </thead>
            <tbody>
              {ranked.map(({ company, result, rank }) => {
                const tone = ratioTone(result.ratio);
                return (
                  <tr key={company.id} className="clickable" onClick={() => navigate(`/company/${company.id}`)}>
                    <td className="num" data-label="Rank">
                      {rank ?? "—"}
                    </td>
                    <td data-label="Company">
                      <div className="name-cell">
                        {companyLabel(company.name, company.aka)}
                        <small>
                          <TypeBadge type={company.type} />
                        </small>
                      </div>
                    </td>
                    <td data-label="Sector">{company.sector}</td>
                    <td data-label="HQ">{company.hqCountry}</td>
                    <td className="num" data-label="India revenue">
                      {company.indiaRevenue ? formatMoneyPair(company.indiaRevenue) : "Not disclosed"}
                    </td>
                    <td className="num" data-label="India employees">
                      {formatCount(company.indiaEmployees)}
                    </td>
                    <td className="num" data-label="Revenue per employee">
                      {result.revenuePerIndiaEmployee == null ? "Not disclosed" : formatUsd(result.revenuePerIndiaEmployee)}
                    </td>
                    <td className="num" data-label="Fairness ratio">
                      {result.status === "ok" ? (
                        <span className={`badge ${tone}`}>
                          {formatRatio(result.ratio, result.approximate)} · {ratioLabel(result.ratio)}
                        </span>
                      ) : result.status === "not-comparable" ? (
                        "Not comparable"
                      ) : (
                        "Insufficient data"
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

function Th({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <th>
      <button type="button" onClick={onClick} aria-pressed={active}>
        {label}
        {active ? " ↕" : ""}
      </button>
    </th>
  );
}

function unique(values: string[]): string[] {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b));
}

function compare(
  a: Company,
  b: Company,
  ar: ReturnType<typeof evaluate>,
  br: ReturnType<typeof evaluate>,
  key: SortKey,
  dir: "asc" | "desc",
): number {
  const sign = dir === "asc" ? 1 : -1;
  const num = (left: number | null, right: number | null) => {
    if (left == null && right == null) return a.name.localeCompare(b.name);
    if (left == null) return 1;
    if (right == null) return -1;
    return (left - right) * sign;
  };
  if (key === "name") return a.name.localeCompare(b.name) * sign;
  if (key === "sector") return a.sector.localeCompare(b.sector) * sign || a.name.localeCompare(b.name);
  if (key === "hq") return a.hqCountry.localeCompare(b.hqCountry) * sign || a.name.localeCompare(b.name);
  if (key === "ratio") return num(ar.ratio, br.ratio);
  if (key === "indiaRevenue") return num(ar.indiaRevenueUsd, br.indiaRevenueUsd);
  if (key === "indiaEmployees") return num(a.indiaEmployees?.value ?? null, b.indiaEmployees?.value ?? null);
  return num(ar.revenuePerIndiaEmployee, br.revenuePerIndiaEmployee);
}
