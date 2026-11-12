import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";
import type { Company } from "../types";
import { evaluate } from "../lib/metrics";
import { companyLabel, formatRatio } from "../lib/format";

const COLOR: Record<string, string> = {
  "sells into India": "#9a3b22",
  "offshore/delivery centre heavy (GCC)": "#0d6a62",
  mixed: "#1d3557",
  "india-headquartered reference": "#8a5a12",
};

type Point = {
  name: string;
  type: string;
  revenueShare: number;
  employeeShare: number;
  ratio: number | null;
};

function pointsFor(companies: Company[]): Point[] {
  return companies.flatMap((company) => {
    const result = evaluate(company);
    if (result.status !== "ok" || result.revenueShare == null || result.employeeShare == null || result.ratio == null) {
      return [];
    }
    return [
      {
        name: companyLabel(company.name, company.aka),
        type: company.type,
        revenueShare: Number((result.revenueShare * 100).toFixed(2)),
        employeeShare: Number((result.employeeShare * 100).toFixed(2)),
        ratio: Number(result.ratio.toFixed(2)),
      },
    ];
  });
}

export function ScatterPanel({ companies }: { companies: Company[] }) {
  const points = pointsFor(companies);
  const max = Math.max(10, ...points.flatMap((point) => [point.revenueShare, point.employeeShare]));
  const axisMax = Math.ceil(max / 10) * 10;

  return (
    <section className="panel">
      <h2>Revenue share against job share</h2>
      <p className="hint">
        The dashed line is parity. A point above it means India has a larger share of the workforce than of the
        revenue. Only companies with a computed ratio are plotted.
      </p>
      <div className="legend">
        {Object.entries(COLOR).map(([label, color]) => (
          <span key={label}>
            <i style={{ background: color }} />
            {label}
          </span>
        ))}
      </div>
      {points.length === 0 ? (
        <div className="empty">No companies in this filter have a computed ratio.</div>
      ) : (
        <ResponsiveContainer width="100%" height={420}>
          <ScatterChart margin={{ top: 12, right: 16, bottom: 24, left: 8 }}>
            <CartesianGrid stroke="#eadfcb" />
            <XAxis
              type="number"
              dataKey="revenueShare"
              domain={[0, axisMax]}
              tickFormatter={(value) => `${value}%`}
              name="India revenue share"
              label={{ value: "India revenue share", position: "bottom", offset: 4, fill: "#5e564c" }}
            />
            <YAxis
              type="number"
              dataKey="employeeShare"
              domain={[0, axisMax]}
              tickFormatter={(value) => `${value}%`}
              width={48}
              name="India employee share"
            />
            <ZAxis range={[90, 90]} />
            <Tooltip
              cursor={{ strokeDasharray: "3 3" }}
              formatter={(value, name) => {
                const numeric = typeof value === "number" ? value : Number(value);
                if (name === "ratio") return [formatRatio(numeric), "Fairness ratio"];
                if (name === "revenueShare") return [`${numeric}%`, "India revenue share"];
                return [`${numeric}%`, "India employee share"];
              }}
              labelFormatter={(_label, payload) => {
                const row = payload?.[0]?.payload as Point | undefined;
                return row ? `${row.name} · ${formatRatio(row.ratio)}` : "";
              }}
            />
            <ReferenceLine segment={[{ x: 0, y: 0 }, { x: axisMax, y: axisMax }]} stroke="#1c1712" strokeDasharray="5 4" />
            <Scatter data={points} isAnimationActive={false}>
              {points.map((point) => (
                <Cell key={point.name} fill={COLOR[point.type] ?? "#1c1712"} />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      )}
    </section>
  );
}

export function RatioBars({ companies }: { companies: Company[] }) {
  const rows = pointsFor(companies)
    .map((point) => ({
      name: point.name.split(" (")[0] ?? point.name,
      ratio: point.ratio ?? 0,
      tone: (point.ratio ?? 0) < 0.8 ? "#9a3b22" : (point.ratio ?? 0) > 1.25 ? "#0d6a62" : "#8a5a12",
    }))
    .sort((a, b) => b.ratio - a.ratio);

  const height = Math.max(280, rows.length * 32 + 36);

  return (
    <section className="panel">
      <h2>Fairness ratios</h2>
      <p className="hint">1.00 is parity. Sorted high to low inside the current filter. The dashed line marks 1.</p>
      {rows.length === 0 ? (
        <div className="empty">No computable ratios in this filter.</div>
      ) : (
        <div className="bar-scroll">
          <ResponsiveContainer width="100%" height={height}>
            <BarChart data={rows} layout="vertical" margin={{ left: 8, right: 20, top: 8, bottom: 8 }}>
              <CartesianGrid stroke="#eadfcb" horizontal={false} />
              <XAxis type="number" domain={[0, "auto"]} />
              <YAxis type="category" dataKey="name" width={118} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(value) => [formatRatio(typeof value === "number" ? value : Number(value)), "Fairness ratio"]} />
              <ReferenceLine x={1} stroke="#1c1712" strokeDasharray="4 3" />
              <Bar dataKey="ratio" isAnimationActive={false} radius={[0, 5, 5, 0]} barSize={14}>
                {rows.map((row) => (
                  <Cell key={row.name} fill={row.tone} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}
