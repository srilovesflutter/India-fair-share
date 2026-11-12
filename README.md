# Fair Share

Fair Share is a static site that asks whether global companies employ people in India in proportion to the revenue associated with India.

The fairness ratio is:

```text
(India employees / global employees) / (India revenue / global revenue)
```

Below 1, India’s share of the workforce is smaller than its share of the revenue figure on the row. Above 1, the workforce share is larger. The ratio is left blank unless all four inputs are public and describe a comparable perimeter. Unknown numbers stay blank and read as “Not disclosed”. Nothing in the ledger is estimated.

The default ranking is global companies. Ten Indian-headquartered firms sit in a separate reference group, because exporters such as Infosys employ most of their people in India while selling mostly abroad.

## Run locally

```bash
npm install
npm test
npm run dev
```

The dev server listens on port 4179. Open [http://127.0.0.1:4179](http://127.0.0.1:4179).

`npm run build` writes a static `dist/` folder. `npm run preview` serves that folder.

## Pages

- **Ledger** — search, filters for sector, headquarters and company type, a scatter plot of revenue share against employee share with a parity line, a bar chart of ratios, and a sortable table.
- **Company** — every figure, the fiscal year, the US-dollar conversion, and the source link.
- **Methodology** — the formula, the company types, and the limits of subsidiary revenue.

## Methodology, in short

Indian subsidiary revenue can understate what a company earns from Indian customers, because sales are often billed from Singapore, Ireland, or the United States. A ratio below 1 is not, by itself, a finding that a company employs too few people.

Company type matters. An offshore delivery firm or a global capability centre will often score well above 1, because the jobs are in India and the clients are not. Compare those firms with each other, not with a consumer-goods company that manufactures and sells in India.

Currency is converted with the IRS yearly average of foreign-currency units per US dollar, for the calendar year in which the fiscal year ends. Fiscal years ending in 2026 use the 2025 average, because the 2026 IRS average was not published on 12 November 2026. The company page shows the rate. The table is documented in `data/companies.json` under `meta.fx`, and the source is the [IRS yearly average exchange rates](https://www.irs.gov/individuals/international-taxpayers/yearly-average-currency-exchange-rates).

Parent and Indian fiscal years often differ. Both years are shown. They are not forced onto one calendar.

The longer explanation is the Methodology page in the app, and the field-by-field rules are in [data/SCHEMA.md](data/SCHEMA.md).

## Add or update a company

1. Edit `data/companies.json`.
2. Give every number a `sourceUrl`, a `sourceTitle`, a fiscal year, and a `whatItMeasures` sentence.
3. Use `null` when a figure is not in a filing, a company release, or a news report of a filing. Do not guess.
4. If India revenue and India headcount cover different legal entities, set `ratioEligible` to `false` and write `ratioBlockReason`.
5. Run `npm test`, then `npm run dev`, and open the company page.

`scripts/assemble.mjs` and `scripts/manual.mjs` are the notes from the original build. The site does not read them. After you edit the JSON, you do not need to run the assembler. Running it again overwrites `data/companies.json`.

## Live site

Live site: [https://srilovesflutter.github.io/India-fair-share/](https://srilovesflutter.github.io/India-fair-share/). Repository: [https://github.com/srilovesflutter/India-fair-share](https://github.com/srilovesflutter/India-fair-share).

Production builds set Vite `base` to `/India-fair-share/` (the path is case-sensitive). `npm run dev` still serves the app at `/` on port 4179.

## Deploy to GitHub Pages

`.github/workflows/pages.yml` builds the site and deploys it with GitHub Actions on every push to `main`.

Pages has to use Actions as the source, or that workflow has nowhere to publish:

1. Open the repository on GitHub.
2. Go to **Settings → Pages**.
3. Under **Build and deployment**, set **Source** to **GitHub Actions**.

Then run **Actions → Deploy to GitHub Pages** if it has not already started. The live URL is `https://srilovesflutter.github.io/India-fair-share/`.

To build the same files locally:

```bash
npm run build
```

The `dist/` folder expects to be served from `/India-fair-share/`. No server, database, or API key is required.

## Data

One hundred companies are in `data/companies.json`. Many rows are partial on purpose. A missing India revenue or India headcount is a disclosure gap, not a zero.
