import { Link, useParams } from "react-router-dom";
import { TypeBadge } from "../components/Chrome";
import { companies } from "../lib/dataset";
import {
  companyLabel,
  formatCount,
  formatFxNote,
  formatOriginal,
  formatPercent,
  formatRatio,
  formatUsd,
  formatUsers,
  ratioLabel,
  ratioTone,
} from "../lib/format";
import { evaluate, toUsd } from "../lib/metrics";
import type { CountFigure, MoneyFigure } from "../types";

export function CompanyPage() {
  const { id } = useParams();
  const company = companies.find((item) => item.id === id);
  if (!company) {
    return (
      <div className="panel empty">
        <h2>Company not in the ledger</h2>
        <p>There is no company with id “{id}”.</p>
        <Link to="/">Back to the ledger</Link>
      </div>
    );
  }

  const result = evaluate(company);
  const tone = result.status === "ok" ? ratioTone(result.ratio) : "none";

  return (
    <article>
      <p>
        <Link to="/">← Ledger</Link>
      </p>
      <div className="detail-top">
        <div>
          <div className="kicker">{company.group === "india-reference" ? "Indian reference group" : "Global company"}</div>
          <h1>{companyLabel(company.name, company.aka)}</h1>
          <p className="lede">
            {company.sector} · Headquarters in {company.hqCountry}
          </p>
          <TypeBadge type={company.type} />
          {company.revenueBasis ? <span className="badge">{company.revenueBasis}</span> : null}
        </div>
        <div className={`ratio-hero ${tone}`}>
          <span>{result.status === "ok" ? ratioLabel(result.ratio) : result.status === "not-comparable" ? "Not comparable" : "Insufficient data"}</span>
          <b>{result.status === "ok" ? formatRatio(result.ratio, result.approximate) : "—"}</b>
          <small>
            {result.status === "ok"
              ? "Fairness ratio"
              : result.status === "not-comparable"
                ? "Figures exist, but the perimeters do not match"
                : "At least one of the four inputs is not disclosed"}
          </small>
        </div>
      </div>

      {result.reason ? <aside className="caveat">{result.reason}</aside> : null}

      {result.status === "ok" && result.employeeShare != null && result.revenueShare != null ? (
        <section className="card math" style={{ marginBottom: 12 }}>
          <h3>How the ratio is built</h3>
          <p>
            Employee share {formatCount(company.indiaEmployees)} / {formatCount(company.globalEmployees)} ={" "}
            {formatPercent(result.employeeShare)}.
          </p>
          <p>
            Revenue share {formatUsd(result.indiaRevenueUsd ?? 0)} / {formatUsd(result.globalRevenueUsd ?? 0)} ={" "}
            {formatPercent(result.revenueShare)}.
          </p>
          <p>
            Fairness ratio {formatPercent(result.employeeShare)} ÷ {formatPercent(result.revenueShare)} ={" "}
            {formatRatio(result.ratio, result.approximate)}.
          </p>
        </section>
      ) : null}

      <section className="grid-4">
        <MoneyCard title="India revenue" figure={company.indiaRevenue} />
        <MoneyCard title="Global revenue" figure={company.globalRevenue} />
        <CountCard title="India employees" figure={company.indiaEmployees} />
        <CountCard title="Global employees" figure={company.globalEmployees} />
      </section>

      <section className="grid-2">
        <div className="card">
          <h3>Revenue per Indian employee</h3>
          <div className="value">
            {result.revenuePerIndiaEmployee == null ? "Not disclosed" : formatUsd(result.revenuePerIndiaEmployee)}
          </div>
          <p className="sub">India revenue in US dollars divided by the India headcount. Shown whenever both exist, even if the ratio is not comparable.</p>
        </div>
        <div className="card">
          <h3>Open jobs in India</h3>
          <div className="value">{formatCount(company.openJobsIndia)}</div>
          {company.openJobsIndia ? <FigureMeta figure={company.openJobsIndia} /> : <p className="sub">No dated public count was checked for this company.</p>}
        </div>
        <div className="card">
          <h3>Indian users</h3>
          {company.indianUsers ? (
            <>
              <div className="value">
                {company.indianUsers.approximate ? "About " : ""}
                {formatUsers(company.indianUsers.value)}
              </div>
              <p className="sub">{company.indianUsers.unit}</p>
              <p className="sub">{company.indianUsers.whatItMeasures}</p>
              <p className="sub">
                {company.indianUsers.fiscalYear ?? company.indianUsers.asOf} ·{" "}
                <a href={company.indianUsers.sourceUrl}>{company.indianUsers.sourceTitle}</a>
              </p>
            </>
          ) : (
            <div className="value">Not disclosed</div>
          )}
        </div>
        <div className="card">
          <h3>Notes</h3>
          <p>{company.notes}</p>
        </div>
      </section>
    </article>
  );
}

function MoneyCard({ title, figure }: { title: string; figure: MoneyFigure | null }) {
  return (
    <div className="card">
      <h3>{title}</h3>
      {figure ? (
        <>
          <div className="value">{formatUsd(toUsd(figure).usd)}</div>
          <p className="sub">As reported: {formatOriginal(figure)}.</p>
          <p className="sub">{formatUsdNote(figure)}</p>
          <FigureMeta figure={figure} />
          {figure.derived && figure.derivation ? <p className="sub">Derived: {figure.derivation}</p> : null}
        </>
      ) : (
        <div className="value">Not disclosed</div>
      )}
    </div>
  );
}

function formatUsdNote(figure: MoneyFigure): string {
  const note = formatFxNote(figure);
  if (!note) return `Reported in US dollars. ${figure.fiscalYear}.`;
  return note;
}

function CountCard({ title, figure }: { title: string; figure: CountFigure | null }) {
  return (
    <div className="card">
      <h3>{title}</h3>
      <div className="value">{formatCount(figure)}</div>
      {figure ? <FigureMeta figure={figure} /> : null}
      {figure?.derived && figure.derivation ? <p className="sub">Derived: {figure.derivation}</p> : null}
    </div>
  );
}

function FigureMeta({ figure }: { figure: MoneyFigure | CountFigure }) {
  const when = figure.fiscalYear ?? ("asOf" in figure ? figure.asOf : null);
  return (
    <>
      <p className="sub">{figure.whatItMeasures}</p>
      <p className="sub">
        {when ? `${when} · ` : ""}
        {figure.approximate ? "Approximate as stated by the source. " : ""}
        <a href={figure.sourceUrl}>{figure.sourceTitle}</a>
      </p>
    </>
  );
}
