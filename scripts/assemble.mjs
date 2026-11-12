import fs from "node:fs";
import { manual } from "./manual.mjs";

const pharma = JSON.parse(fs.readFileSync(new URL("../tmp-research/pharma-industrial.json", import.meta.url), "utf8"));

const NAMES = {
  pfizer: ["Pfizer", "Pharmaceuticals"],
  novartis: ["Novartis", "Pharmaceuticals"],
  roche: ["Roche", "Pharmaceuticals"],
  sanofi: ["Sanofi", "Pharmaceuticals"],
  gsk: ["GSK", "Pharmaceuticals"],
  astrazeneca: ["AstraZeneca", "Pharmaceuticals"],
  abbott: ["Abbott", "Pharmaceuticals"],
  bayer: ["Bayer", "Pharmaceuticals"],
  siemens: ["Siemens", "Industrials"],
  honeywell: ["Honeywell", "Industrials"],
  abb: ["ABB", "Industrials"],
  "schneider-electric": ["Schneider Electric", "Industrials"],
  ericsson: ["Ericsson", "Telecom equipment"],
  nokia: ["Nokia", "Telecom equipment"],
  shell: ["Shell", "Energy"],
  sony: ["Sony", "Consumer electronics"],
  foxconn: ["Foxconn (Hon Hai)", "Electronics manufacturing"],
  philips: ["Philips", "Health technology"],
  lenovo: ["Lenovo", "Technology"],
  "lg-electronics": ["LG Electronics", "Consumer electronics"],
  tcs: ["Tata Consultancy Services", "IT services"],
  infosys: ["Infosys", "IT services"],
  wipro: ["Wipro", "IT services"],
  hcltech: ["HCLTech", "IT services"],
  reliance: ["Reliance Industries", "Conglomerate"],
  "hdfc-bank": ["HDFC Bank", "Banking"],
  "bharti-airtel": ["Bharti Airtel", "Telecom"],
  mahindra: ["Mahindra & Mahindra", "Automobiles"],
  "sun-pharma": ["Sun Pharmaceutical", "Pharmaceuticals"],
  itc: ["ITC", "Consumer goods"],
};

const BLOCK = {
  novartis:
    "Novartis India Limited is a residual listed company proposed for renaming, not the Novartis group’s India business. Its sales and headcount are shown, and the ratio is not computed.",
  sanofi:
    "India revenue is Sanofi India Limited’s sales to customers in India. India headcount is the Sanofi group’s country workforce, which is a wider perimeter.",
};

function inferScale(text) {
  const t = text.toLowerCase();
  if (t.includes("inr crore")) return "crore";
  if (t.includes("inr million")) return "million";
  if (t.includes("inr billion")) return "billion";
  if (t.includes("inr lakh") || t.includes("lakh rupees")) return "lakh";
  if (t.includes("usd million") || t.includes("us$ million")) return "million";
  if (t.includes("eur billion") || t.includes("billion euros")) return "billion";
  if (t.includes("eur million")) return "million";
  if (t.includes("gbp million")) return "million";
  if (t.includes("chf million")) return "million";
  if (t.includes("jpy million")) return "million";
  if (t.includes("krw million") || t.includes("korean won")) return "million";
  if (t.includes("sek million")) return "million";
  if (t.includes("twd million")) return "million";
  if (t.includes("sgd million")) return "million";
  throw new Error(`No scale in: ${text.slice(0, 180)}`);
}

function money(raw) {
  if (!raw) return null;
  return {
    value: raw.value,
    currency: raw.currency,
    scale: inferScale(raw.whatItMeasures),
    fiscalYear: raw.fiscalYear,
    fiscalYearEnd: raw.fiscalYearEnd ?? null,
    sourceUrl: raw.sourceUrl,
    sourceTitle: raw.sourceTitle,
    whatItMeasures: raw.whatItMeasures,
    approximate: Boolean(raw.approximate),
    derived: false,
    derivation: null,
  };
}

function count(raw) {
  if (!raw) return null;
  return {
    value: raw.value,
    asOf: raw.asOf ?? raw.fiscalYearEnd ?? null,
    fiscalYear: raw.fiscalYear ?? null,
    sourceUrl: raw.sourceUrl,
    sourceTitle: raw.sourceTitle,
    whatItMeasures: raw.whatItMeasures,
    approximate: Boolean(raw.approximate),
    derived: false,
    derivation: null,
  };
}

const USER_UNIT = {
  reliance: "RJIL connectivity customers",
  "bharti-airtel": "India customers",
};

function users(id, raw) {
  if (!raw) return null;
  return {
    value: raw.value,
    unit: USER_UNIT[id] ?? "customers",
    asOf: raw.fiscalYearEnd ?? null,
    fiscalYear: raw.fiscalYear ?? null,
    sourceUrl: raw.sourceUrl,
    sourceTitle: raw.sourceTitle,
    whatItMeasures: raw.whatItMeasures,
    approximate: Boolean(raw.approximate),
  };
}

function basisFor(company) {
  const text = `${company.indiaRevenue?.whatItMeasures ?? ""} ${company.notes}`.toLowerCase();
  if (!company.indiaRevenue) return null;
  if (text.includes("delivery")) return "Delivery-location revenue";
  if (text.includes("customer")) return "Customer location";
  if (text.includes("listed")) return "Listed Indian subsidiary";
  if (text.includes("branch")) return "Branch income only";
  return "Statutory subsidiary or country disclosure";
}

const fromPharma = pharma.map((raw) => {
  const [name, sector] = NAMES[raw.id];
  const company = {
    id: raw.id,
    name,
    aka: raw.id === "tcs" ? "TCS" : raw.id === "foxconn" ? "Hon Hai" : null,
    sector,
    hqCountry: raw.hqCountry,
    type: raw.type,
    group: raw.group,
    revenueBasis: null,
    ratioEligible: !BLOCK[raw.id],
    ratioBlockReason: BLOCK[raw.id] ?? null,
    indiaRevenue: money(raw.indiaRevenue),
    globalRevenue: money(raw.globalRevenue),
    indiaEmployees: count(raw.indiaEmployees),
    globalEmployees: count(raw.globalEmployees),
    openJobsIndia: null,
    indianUsers: users(raw.id, raw.indianUsers),
    notes: raw.notes,
  };
  company.revenueBasis = basisFor(company);
  return company;
});

const byId = Object.fromEntries(fromPharma.map((company) => [company.id, company]));

const wipro = byId.wipro;
wipro.globalEmployees = {
  value: 228147,
  asOf: "2026-03-31",
  fiscalYear: "FY2026",
  sourceUrl: wipro.indiaEmployees.sourceUrl,
  sourceTitle: wipro.indiaEmployees.sourceTitle,
  whatItMeasures:
    "Total headcount of the same regional workforce table that reports 190,064 people in India (83.31% of that table). A wider GRI total of 238,061 is not the denominator.",
  approximate: false,
  derived: false,
  derivation: null,
};
wipro.revenueBasis = "Customer location";
wipro.notes +=
  " The employee denominator is the 228,147-person regional table, not the 238,061 GRI total, so the India share matches the table the India count comes from.";

const tcs = byId.tcs;
tcs.indiaRevenue = {
  value: Number((267021 * 0.059).toFixed(3)),
  currency: "INR",
  scale: "crore",
  fiscalYear: "FY2026",
  fiscalYearEnd: "2026-03-31",
  sourceUrl:
    "https://www.tcs.com/content/dam/tcs/investor-relations/financial-statements/2025-26/q4/Presentations/Q4%202025-26%20Fact%20Sheet.pdf",
  sourceTitle: "TCS Q4 and full-year FY2026 fact sheet",
  whatItMeasures:
    "Consolidated revenue allocated to the India geography. The fact sheet states the FY2026 India mix as 5.9% of revenue. Standalone India customer revenue was ₹15,101 crore and is not this figure.",
  approximate: false,
  derived: true,
  derivation: "5.9% × consolidated revenue of ₹267,021 crore = ₹15,754.239 crore.",
};
tcs.revenueBasis = "Customer location";
tcs.notes +=
  " India revenue is the disclosed 5.9% geography mix applied to consolidated revenue. No India location headcount was published, so the ratio is not computed.";

const schneider = byId["schneider-electric"];
schneider.indiaRevenue = {
  value: 2891,
  currency: "INR",
  scale: "crore",
  fiscalYear: "FY2026",
  fiscalYearEnd: "2026-03-31",
  sourceUrl: "https://download.se.com/files?amp%3Bp_enDocType=Institutional+Document&p_Doc_Ref=annual-report-25-26",
  sourceTitle: "Schneider Electric India annual report 2025-26",
  whatItMeasures:
    "Sales of listed Schneider Electric India Limited. Not every Schneider group sale in India. The report says sales rose 9.6% to ₹2,891 crore from ₹2,637 crore.",
  approximate: false,
  derived: false,
  derivation: null,
};
schneider.indiaEmployees = {
  value: 2255,
  asOf: "2026-03-31",
  fiscalYear: "FY2026",
  sourceUrl: "https://download.se.com/files?amp%3Bp_enDocType=Institutional+Document&p_Doc_Ref=annual-report-25-26",
  sourceTitle: "Schneider Electric India annual report 2025-26",
  whatItMeasures:
    "BRSR total employees plus total workers of Schneider Electric India Limited. Employees were 1,168 and workers were 1,087.",
  approximate: false,
  derived: true,
  derivation: "1,168 employees (permanent 990 and other 178) + 1,087 workers (permanent 457 and other 630).",
};
schneider.revenueBasis = "Listed Indian subsidiary";
schneider.ratioEligible = true;
schneider.notes +=
  " India sales and headcount are the listed Indian company. Group revenue and group headcount are Schneider Electric’s 2025 consolidated figures, a different year-end.";

const siemens = byId.siemens;
siemens.notes +=
  " Siemens Limited in India reported revenue from operations of ₹261,074 million for the 18 months from 1 October 2024 to 31 March 2026 (annual report filed with NSE). That period is not annualised and is not used as India revenue.";

const companies = [...manual, ...fromPharma].sort((a, b) => a.name.localeCompare(b.name));

const dataset = {
  meta: {
    updated: "2026-11-12",
    caveat:
      "Indian subsidiary revenue can understate what a company earns from Indian customers, because sales are often billed from Singapore, Ireland, the United States, or another group company. A ratio below 1 is not, by itself, evidence that a company employs too few people in India. Offshore and global-delivery firms score high because India is where the work is done for clients elsewhere. Read each row with its company type and the revenue basis on the company page.",
    fx: {
      sourceUrl: "https://www.irs.gov/individuals/international-taxpayers/yearly-average-currency-exchange-rates",
      sourceTitle: "IRS yearly average currency exchange rates",
      method:
        "Amounts are converted to US dollars with the IRS yearly average of foreign-currency units per 1 US dollar, using the calendar year in which the figure’s fiscal year ends. The IRS table for 2024 prints the euro rate as 0,924; that is stored as 0.924, consistent with the 2023 rate and with secondary copies of the same table. The 2026 yearly average was not published as of 12 November 2026, so a fiscal year ending in 2026 uses the 2025 average and the company page says so. US-dollar disclosures are not reconverted. One crore is 10 million rupees.",
      fallbackYear: "2025",
      rates: {
        "2023": { INR: 82.572, EUR: 0.924, GBP: 0.804, JPY: 140.511, CHF: 0.899, KRW: 1306.686, SGD: 1.343, SEK: 10.613, TWD: 31.16 },
        "2024": { INR: 83.677, EUR: 0.924, GBP: 0.783, JPY: 151.353, CHF: 0.881, KRW: 1364.153, SGD: 1.336, SEK: 10.577, TWD: 32.117 },
        "2025": { INR: 87.133, EUR: 0.886, GBP: 0.759, JPY: 149.632, CHF: 0.831, KRW: 1421.779, SGD: 1.307, SEK: 9.813, TWD: 31.167 },
      },
    },
  },
  companies,
};

fs.mkdirSync(new URL("../data", import.meta.url), { recursive: true });
fs.writeFileSync(new URL("../data/companies.json", import.meta.url), JSON.stringify(dataset, null, 2));
console.log(`Wrote ${companies.length} companies`);
