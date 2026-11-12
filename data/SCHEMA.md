# `data/companies.json`

This file is the ledger. The site imports it at build time. Edit the JSON, then run `npm test` and `npm run dev`.

## Top level

| Field | Meaning |
| --- | --- |
| `meta.updated` | Date the file was last reviewed, `YYYY-MM-DD`. |
| `meta.caveat` | Shown on the home page. Do not delete the point about offshore billing. |
| `meta.fx` | IRS yearly averages used to convert foreign currency to US dollars. Rates are foreign-currency units per 1 US dollar. |
| `meta.fx.fallbackYear` | Used when a fiscal year ends in a calendar year that has no IRS average yet. |
| `companies` | Array of company objects. One object per company. |

## Company

| Field | Required | Meaning |
| --- | --- | --- |
| `id` | yes | Stable slug, lowercase, used in the URL. |
| `name` | yes | Display name. |
| `aka` | yes | Short second name, or `null`. |
| `sector` | yes | Filter label, for example `Banking` or `IT services`. |
| `hqCountry` | yes | Legal home country. |
| `type` | yes | One of `sells into India`, `offshore/delivery centre heavy (GCC)`, `mixed`, `india-headquartered reference`. |
| `group` | yes | `global` or `india-reference`. |
| `revenueBasis` | yes | Short label for what the India revenue figure is, or `null` if there is no India revenue. |
| `ratioEligible` | yes | `false` when India revenue and India headcount exist but do not describe the same perimeter. |
| `ratioBlockReason` | yes | Plain-language reason, or `null`. |
| `indiaRevenue` | yes | A money figure, or `null`. |
| `globalRevenue` | yes | A money figure, or `null`. |
| `indiaEmployees` | yes | A count figure, or `null`. |
| `globalEmployees` | yes | A count figure, or `null`. |
| `openJobsIndia` | yes | A count figure, or `null`. |
| `indianUsers` | yes | A users figure, or `null`. |
| `notes` | yes | Caveats a reader needs. Empty string if there is nothing to add. |

The ratio is computed only when all four of `indiaRevenue`, `globalRevenue`, `indiaEmployees` and `globalEmployees` are non-null and `ratioEligible` is true.

## Money figure

```json
{
  "value": 5340,
  "currency": "INR",
  "scale": "crore",
  "fiscalYear": "FY2025",
  "fiscalYearEnd": "2025-03-31",
  "sourceUrl": "https://example.com/source",
  "sourceTitle": "Publication title",
  "whatItMeasures": "One sentence a reader can check against the source.",
  "approximate": false,
  "derived": false,
  "derivation": null
}
```

`currency` is `INR`, `USD`, `EUR`, `GBP`, `JPY`, `CHF`, `KRW`, `SGD`, `SEK`, or `TWD`.

`scale` is `unit`, `thousand`, `lakh`, `million`, `crore`, `billion`, or `trillion`. The US-dollar amount is `value × scale`, then divided by the IRS rate when the currency is not USD. One crore is 10,000,000 rupees. One lakh is 100,000 rupees.

`fiscalYearEnd` is `YYYY-MM-DD` or `null`. The FX year is the calendar year of that date. If it is `null`, the year is read from `fiscalYear`.

Set `approximate` to true only when the source itself says about, over, or more than.

Set `derived` to true only when the value is arithmetic on figures the same source states, and put the arithmetic in `derivation`.

Do not convert the number yourself into US dollars inside `value`. Leave the currency the source used.

## Count figure

Same source fields as a money figure, without `currency` and `scale`. `value` is a number of people. `asOf` is the date the count applies to, or `null`.

## Users figure

```json
{
  "value": 110000000,
  "unit": "customers across channels",
  "asOf": "2025-03-31",
  "fiscalYear": "FY2025",
  "sourceUrl": "https://example.com/source",
  "sourceTitle": "Publication title",
  "whatItMeasures": "What the company said.",
  "approximate": true
}
```

Use this only for a count the company published. A press estimate is not enough.

## Rules that keep the file honest

- `null` means not disclosed. Never write `0` for an unknown number.
- Every non-null figure needs an `http` or `https` `sourceUrl`.
- Do not allocate a regional total down to India.
- Do not relabel profit as revenue.
- If the India revenue entity and the India headcount entity differ, set `ratioEligible` to false and explain it.
- `npm test` checks that sources exist, shares are not above 100%, and amounts are positive.
