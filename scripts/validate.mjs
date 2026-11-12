import fs from "node:fs";

const dataset = JSON.parse(fs.readFileSync(new URL("../data/companies.json", import.meta.url), "utf8"));
const SCALE = { unit: 1, thousand: 1e3, lakh: 1e5, million: 1e6, crore: 1e7, billion: 1e9, trillion: 1e12 };
const rates = dataset.meta.fx.rates;
const errors = [];

function yearOf(figure) {
  if (figure.fiscalYearEnd) return figure.fiscalYearEnd.slice(0, 4);
  const match = String(figure.fiscalYear).match(/20\d{2}/);
  return match ? match[0] : "2025";
}

function toUsd(figure) {
  const amount = figure.value * SCALE[figure.scale];
  if (!Number.isFinite(amount) || amount <= 0) errors.push(`bad amount ${figure.value}`);
  if (figure.currency === "USD") return amount;
  const wanted = yearOf(figure);
  const year = rates[wanted]?.[figure.currency] ? wanted : dataset.meta.fx.fallbackYear;
  const rate = rates[year][figure.currency];
  if (!rate) errors.push(`missing fx ${figure.currency} ${year}`);
  return amount / rate;
}

function checkFigure(company, key, figure) {
  if (figure == null) return;
  if (!figure.sourceUrl?.startsWith("http")) errors.push(`${company.id} ${key} missing source`);
  if (!figure.sourceTitle) errors.push(`${company.id} ${key} missing title`);
  if (!figure.whatItMeasures) errors.push(`${company.id} ${key} missing definition`);
  if (figure.value == null || figure.value <= 0) errors.push(`${company.id} ${key} non-positive`);
}

const ranked = [];
for (const company of dataset.companies) {
  for (const key of ["indiaRevenue", "globalRevenue", "indiaEmployees", "globalEmployees", "openJobsIndia"]) {
    checkFigure(company, key, company[key]);
  }
  if (company.indianUsers) checkFigure(company, "indianUsers", company.indianUsers);
  const ready = company.indiaRevenue && company.globalRevenue && company.indiaEmployees && company.globalEmployees;
  if (!ready || !company.ratioEligible) continue;
  const indiaUsd = toUsd(company.indiaRevenue);
  const globalUsd = toUsd(company.globalRevenue);
  const employeeShare = company.indiaEmployees.value / company.globalEmployees.value;
  const revenueShare = indiaUsd / globalUsd;
  const ratio = employeeShare / revenueShare;
  if (!Number.isFinite(ratio) || ratio <= 0) errors.push(`${company.id} bad ratio`);
  if (employeeShare > 1.02) errors.push(`${company.id} employee share ${employeeShare}`);
  if (revenueShare > 1.05) errors.push(`${company.id} revenue share ${revenueShare}`);
  ranked.push({
    name: company.name,
    group: company.group,
    type: company.type,
    ratio,
    employeeShare,
    revenueShare,
    indiaUsd,
    globalUsd,
    approximate: company.indiaRevenue.approximate || company.globalRevenue.approximate || company.indiaEmployees.approximate || company.globalEmployees.approximate || company.indiaRevenue.derived || company.indiaEmployees.derived,
  });
}

ranked.sort((a, b) => b.ratio - a.ratio);
const globals = ranked.filter((row) => row.group === "global");
const insufficient = dataset.companies.filter((company) => {
  const ready = company.indiaRevenue && company.globalRevenue && company.indiaEmployees && company.globalEmployees && company.ratioEligible;
  return !ready;
}).length;

console.log(JSON.stringify({
  companies: dataset.companies.length,
  computable: ranked.length,
  insufficientOrNotComparable: insufficient,
  globalComputable: globals.length,
  referenceComputable: ranked.length - globals.length,
  errors,
}, null, 2));
console.log("\nALL RATIOS");
for (const row of ranked) {
  console.log(`${row.ratio.toFixed(2).padStart(8)}  ${row.group === "global" ? "G" : "R"}  ${row.name.padEnd(28)} emp ${(row.employeeShare * 100).toFixed(1)}%  rev ${(row.revenueShare * 100).toFixed(1)}%  IN ${ (row.indiaUsd / 1e9).toFixed(2)}bn / GL ${(row.globalUsd / 1e9).toFixed(1)}bn`);
}
if (errors.length) process.exit(1);
