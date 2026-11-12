import type { CountFigure, MoneyFigure } from "../types";
import { calendarYear, toUsd } from "./metrics";

const SYMBOL: Record<MoneyFigure["currency"], string> = {
  INR: "₹",
  USD: "US$",
  EUR: "€",
  GBP: "£",
  JPY: "¥",
  CHF: "CHF ",
  KRW: "₩",
  SGD: "S$",
  SEK: "SEK ",
  TWD: "NT$",
};

export function formatOriginal(figure: MoneyFigure): string {
  const digits = Number.isInteger(figure.value) ? 0 : figure.value >= 100 ? 1 : 2;
  const body = figure.value.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: digits,
  });
  const unit = figure.scale === "unit" ? "" : ` ${figure.scale}`;
  return `${SYMBOL[figure.currency]}${body}${unit}`;
}

export function formatUsd(usd: number): string {
  const abs = Math.abs(usd);
  if (abs >= 1e12) return `US$${(usd / 1e12).toFixed(2)} trillion`;
  if (abs >= 1e9) return `US$${(usd / 1e9).toFixed(2)} billion`;
  if (abs >= 1e6) return `US$${(usd / 1e6).toFixed(1)} million`;
  return `US$${usd.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

export function formatMoneyPair(figure: MoneyFigure | null): string {
  if (!figure) return "Not disclosed";
  const converted = toUsd(figure);
  if (figure.currency === "USD") return formatUsd(converted.usd);
  return `${formatUsd(converted.usd)} (${formatOriginal(figure)})`;
}

export function formatCount(figure: CountFigure | null): string {
  if (!figure) return "Not disclosed";
  const n = figure.value.toLocaleString("en-US");
  return figure.approximate ? `About ${n}` : n;
}

export function formatUsers(value: number): string {
  if (value >= 1e9) return `${(value / 1e9).toFixed(2)} billion`;
  if (value >= 1e6) return `${(value / 1e6).toFixed(1)} million`;
  return value.toLocaleString("en-US");
}

export function formatRatio(ratio: number | null, approximate = false): string {
  if (ratio == null || !Number.isFinite(ratio)) return "Insufficient data";
  const text = ratio >= 100 ? ratio.toFixed(0) : ratio.toFixed(2);
  return approximate ? `~${text}` : text;
}

export function formatPercent(share: number | null): string {
  if (share == null || !Number.isFinite(share)) return "—";
  return `${(share * 100).toFixed(1)}%`;
}

export function formatFxNote(figure: MoneyFigure): string | null {
  if (figure.currency === "USD") return null;
  const converted = toUsd(figure);
  const wanted = calendarYear(figure);
  const sub = converted.substituted
    ? ` The ${converted.rateYear} average is used because the ${wanted} IRS yearly average is not published yet.`
    : "";
  return `Converted at the IRS yearly average for ${converted.rateYear}: ${converted.rate.toLocaleString("en-US")} ${figure.currency} per US$.${sub}`;
}

export function companyLabel(name: string, aka: string | null): string {
  return aka ? `${name} (${aka})` : name;
}

export function ratioTone(ratio: number | null): "low" | "mid" | "high" | "none" {
  if (ratio == null) return "none";
  if (ratio < 0.8) return "low";
  if (ratio > 1.25) return "high";
  return "mid";
}

export function ratioLabel(ratio: number | null): string {
  if (ratio == null) return "No ratio";
  if (ratio < 0.8) return "Below parity";
  if (ratio > 1.25) return "Above parity";
  return "Near parity";
}
