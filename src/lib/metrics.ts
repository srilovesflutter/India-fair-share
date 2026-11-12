import type { Company, Currency, MoneyFigure, Scale } from "../types";
import { dataset } from "./dataset";

const SCALE: Record<Scale, number> = {
  unit: 1,
  thousand: 1e3,
  lakh: 1e5,
  million: 1e6,
  crore: 1e7,
  billion: 1e9,
  trillion: 1e12,
};

export interface UsdAmount {
  usd: number;
  rate: number;
  rateYear: string;
  substituted: boolean;
}

export function calendarYear(figure: MoneyFigure): string {
  if (figure.fiscalYearEnd && /^\d{4}-\d{2}-\d{2}$/.test(figure.fiscalYearEnd)) {
    return figure.fiscalYearEnd.slice(0, 4);
  }
  const match = figure.fiscalYear.match(/(20\d{2})/);
  return match?.[1] ?? dataset.meta.fx.fallbackYear;
}

export function toUsd(figure: MoneyFigure): UsdAmount {
  const amount = figure.value * SCALE[figure.scale];
  if (figure.currency === "USD") {
    return { usd: amount, rate: 1, rateYear: calendarYear(figure), substituted: false };
  }
  const wanted = calendarYear(figure);
  const rates = dataset.meta.fx.rates;
  const year = rates[wanted]?.[figure.currency] ? wanted : dataset.meta.fx.fallbackYear;
  const rate = rates[year]?.[figure.currency as Currency];
  if (!rate) {
    throw new Error(`No FX rate for ${figure.currency} in ${year}`);
  }
  return {
    usd: amount / rate,
    rate,
    rateYear: year,
    substituted: year !== wanted,
  };
}

export interface RatioResult {
  status: "ok" | "insufficient" | "not-comparable";
  reason: string | null;
  ratio: number | null;
  approximate: boolean;
  employeeShare: number | null;
  revenueShare: number | null;
  indiaRevenueUsd: number | null;
  globalRevenueUsd: number | null;
  revenuePerIndiaEmployee: number | null;
}

export function evaluate(company: Company): RatioResult {
  const indiaRevenueUsd = company.indiaRevenue ? toUsd(company.indiaRevenue).usd : null;
  const globalRevenueUsd = company.globalRevenue ? toUsd(company.globalRevenue).usd : null;
  const revenuePerIndiaEmployee =
    indiaRevenueUsd != null && company.indiaEmployees && company.indiaEmployees.value > 0
      ? indiaRevenueUsd / company.indiaEmployees.value
      : null;

  const employeeShare =
    company.indiaEmployees && company.globalEmployees && company.globalEmployees.value > 0
      ? company.indiaEmployees.value / company.globalEmployees.value
      : null;
  const revenueShare =
    indiaRevenueUsd != null && globalRevenueUsd != null && globalRevenueUsd > 0
      ? indiaRevenueUsd / globalRevenueUsd
      : null;

  if (
    !company.indiaRevenue ||
    !company.globalRevenue ||
    !company.indiaEmployees ||
    !company.globalEmployees
  ) {
    return {
      status: "insufficient",
      reason: null,
      ratio: null,
      approximate: false,
      employeeShare,
      revenueShare,
      indiaRevenueUsd,
      globalRevenueUsd,
      revenuePerIndiaEmployee,
    };
  }

  if (!company.ratioEligible) {
    return {
      status: "not-comparable",
      reason: company.ratioBlockReason,
      ratio: null,
      approximate: false,
      employeeShare,
      revenueShare,
      indiaRevenueUsd,
      globalRevenueUsd,
      revenuePerIndiaEmployee,
    };
  }

  if (employeeShare == null || revenueShare == null || revenueShare === 0) {
    return {
      status: "insufficient",
      reason: null,
      ratio: null,
      approximate: false,
      employeeShare,
      revenueShare,
      indiaRevenueUsd,
      globalRevenueUsd,
      revenuePerIndiaEmployee,
    };
  }

  const approximate =
    company.indiaRevenue.approximate ||
    company.globalRevenue.approximate ||
    company.indiaEmployees.approximate ||
    company.globalEmployees.approximate ||
    company.indiaRevenue.derived ||
    company.indiaEmployees.derived;

  return {
    status: "ok",
    reason: null,
    ratio: employeeShare / revenueShare,
    approximate,
    employeeShare,
    revenueShare,
    indiaRevenueUsd,
    globalRevenueUsd,
    revenuePerIndiaEmployee,
  };
}

export function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) return sorted[mid] ?? null;
  const left = sorted[mid - 1];
  const right = sorted[mid];
  if (left == null || right == null) return null;
  return (left + right) / 2;
}
