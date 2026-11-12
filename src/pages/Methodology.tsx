import { dataset } from "../lib/dataset";

export function MethodologyPage() {
  return (
    <article className="prose">
      <div className="kicker">About this ledger</div>
      <h1>Methodology</h1>
      <p>
        Fair Share asks a narrow question: does the share of a company’s employees who are in India match the
        share of its revenue that is associated with India? It is a comparison of two published ratios, not a
        judgment of wages, tax, or whether a particular job “should” exist.
      </p>

      <h2>The fairness ratio</h2>
      <p>
        <code>(India employees ÷ global employees) ÷ (India revenue ÷ global revenue)</code>
      </p>
      <p>
        A ratio of 1 means the two shares are equal. Below 1, India’s share of headcount is smaller than its
        share of the revenue figure in the ledger. Above 1, India’s share of headcount is larger. “Near parity”
        on this site is 0.80 to 1.25, a band wide enough that FX and a one-year mismatch do not flip the label
        on their own.
      </p>
      <p>
        The ratio is computed only when all four inputs are present and the India revenue and India headcount
        describe a compatible perimeter. If any input is missing, the cell says <strong>Insufficient data</strong>.
        If the numbers exist but describe different legal entities — a listed subsidiary’s sales next to the
        group’s entire India workforce, for example — the cell says <strong>Not comparable</strong> and the
        company page explains why. Missing numbers are stored as null. They are never filled with an estimate,
        a regional leftover, or a LinkedIn headcount range.
      </p>

      <h2>Compare like with like</h2>
      <p>Each company is tagged with one type:</p>
      <ul>
        <li>
          <strong>Sells into India.</strong> The India business is mostly customers, factories, or stores. These
          firms can score below 1 when revenue is booked locally and much of the corporate workforce sits in the
          home country.
        </li>
        <li>
          <strong>Offshore / delivery centre heavy (GCC).</strong> India is where work for clients elsewhere is
          done. Employee share is structurally high. If India revenue is only what is billed to Indian customers,
          the ratio runs well above 1. That is the delivery model, not a bonus.
        </li>
        <li>
          <strong>Mixed.</strong> A domestic franchise plus a large technology or service centre. Banks in this
          ledger are usually mixed.
        </li>
        <li>
          <strong>India-headquartered reference.</strong> Kept in a separate group. Exporters such as the large
          IT-services firms employ most of their people in India while earning most of their revenue abroad, so
          their ratios are high for a different reason than a foreign GCC.
        </li>
      </ul>
      <p>The home page opens on global companies. The Indian reference group is one filter away, not mixed into the default ranking.</p>

      <h2>What “India revenue” means here</h2>
      <p>{dataset.meta.caveat}</p>
      <p>
        Where a company publishes sales by customer location, that is the figure used. Otherwise the ledger uses
        the revenue the company, or a named Indian subsidiary, actually filed — and the company page says which.
        Common cases:
      </p>
      <ul>
        <li>A listed Indian subsidiary (Hindustan Unilever, Maruti Suzuki, ABB India, GlaxoSmithKline Pharmaceuticals, and others). This is not always the whole group in India.</li>
        <li>A statutory filing of an unlisted Indian company, as reported by The Economic Times, Mint, Business Standard, Entrackr, or Tofler’s tabulation of Ministry of Corporate Affairs financials.</li>
        <li>Delivery-location revenue. Genpact’s 10-K attributes net revenue to the country of the service centre. That is not sales to Indian customers, and the page says so.</li>
        <li>Bank “revenue” follows the label in the report: operating income, total income, or net interest income plus other income. Profit before tax is never relabelled as revenue. HSBC discloses India profit and India headcount; India revenue is left blank.</li>
      </ul>
      <p>
        Asia-Pacific, “International”, or “Emerging markets” totals are not split down to India. An 18-month
        reporting period (Siemens Limited’s latest Indian statutory period) is not annualised.
      </p>

      <h2>Headcount, jobs, and users</h2>
      <p>
        Employee figures prefer an annual report, 10-K, 20-F, or a company page that states a number. “About”,
        “over”, and “more than” are stored with the number the source used and marked approximate. The ratio is
        then shown with a tilde. Contract workers are included only when the same source states them and the
        derivation is written next to the figure. LinkedIn company-size ranges are not used as headcount.
      </p>
      <p>
        Open jobs in India are included only when a careers page, LinkedIn jobs count, or dated article states
        a number and the date checked is recorded. This edition does not scrape live job boards, so the column
        is “Not disclosed” unless a stable published count was found.
      </p>
      <p>Indian users are included only when the company published a customer, subscriber, or user count.</p>

      <h2>Currency and years</h2>
      <p>{dataset.meta.fx.method}</p>
      <p>
        Source: <a href={dataset.meta.fx.sourceUrl}>{dataset.meta.fx.sourceTitle}</a>. US-dollar figures are not
        converted. The company page shows the original amount, the rate, and the rate year next to every
        converted figure. Indian and parent fiscal years often differ — March versus December or June. Both
        years are shown. They are not restated onto a common calendar.
      </p>
      <p>
        Revenue per Indian employee is India revenue in US dollars divided by the India headcount. It is shown
        whenever both numbers exist, including when the fairness ratio is blocked as not comparable.
      </p>

      <h2>How to add or update a company</h2>
      <p>
        Edit <code>data/companies.json</code>. The shape is documented in <code>data/SCHEMA.md</code>. Give every
        non-null figure a <code>sourceUrl</code>, <code>sourceTitle</code>, <code>fiscalYear</code> or{" "}
        <code>asOf</code>, and a <code>whatItMeasures</code> sentence that a reader can check against the source.
        Use <code>null</code> when the number is not public. Set <code>ratioEligible</code> to false and explain
        <code>ratioBlockReason</code> when the India revenue and India headcount are not the same perimeter.
        Then run <code>npm test</code> and <code>npm run dev</code>.
      </p>

      <h2>What this edition does not do</h2>
      <p>
        It does not estimate untaxed or offshore-billed sales to Indian customers. It does not adjust for cost
        of living, pay, or productivity. It does not treat a high ratio as proof of fairness or a low ratio as
        proof of under-hiring. Those readings require the revenue basis and the company type, which is why both
        are on every row.
      </p>
    </article>
  );
}
