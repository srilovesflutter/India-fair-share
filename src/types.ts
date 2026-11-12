export type CompanyType =
  | "sells into India"
  | "offshore/delivery centre heavy (GCC)"
  | "mixed"
  | "india-headquartered reference";

export type CompanyGroup = "global" | "india-reference";

export type Scale =
  | "unit"
  | "thousand"
  | "lakh"
  | "million"
  | "crore"
  | "billion"
  | "trillion";

export type Currency =
  | "INR"
  | "USD"
  | "EUR"
  | "GBP"
  | "JPY"
  | "CHF"
  | "KRW"
  | "SGD"
  | "SEK"
  | "TWD";

export interface MoneyFigure {
  value: number;
  currency: Currency;
  scale: Scale;
  fiscalYear: string;
  fiscalYearEnd: string | null;
  sourceUrl: string;
  sourceTitle: string;
  whatItMeasures: string;
  approximate: boolean;
  derived: boolean;
  derivation: string | null;
}

export interface CountFigure {
  value: number;
  asOf: string | null;
  fiscalYear: string | null;
  sourceUrl: string;
  sourceTitle: string;
  whatItMeasures: string;
  approximate: boolean;
  derived: boolean;
  derivation: string | null;
}

export interface UsersFigure {
  value: number;
  unit: string;
  asOf: string | null;
  fiscalYear: string | null;
  sourceUrl: string;
  sourceTitle: string;
  whatItMeasures: string;
  approximate: boolean;
}

export interface Company {
  id: string;
  name: string;
  aka: string | null;
  sector: string;
  hqCountry: string;
  type: CompanyType;
  group: CompanyGroup;
  revenueBasis: string | null;
  ratioEligible: boolean;
  ratioBlockReason: string | null;
  indiaRevenue: MoneyFigure | null;
  globalRevenue: MoneyFigure | null;
  indiaEmployees: CountFigure | null;
  globalEmployees: CountFigure | null;
  openJobsIndia: CountFigure | null;
  indianUsers: UsersFigure | null;
  notes: string;
}

export interface FxTable {
  sourceUrl: string;
  sourceTitle: string;
  method: string;
  /** Foreign-currency units per 1 US dollar, by calendar year. */
  rates: Record<string, Partial<Record<Currency, number>>>;
  fallbackYear: string;
}

export interface Dataset {
  meta: {
    updated: string;
    caveat: string;
    fx: FxTable;
  };
  companies: Company[];
}
