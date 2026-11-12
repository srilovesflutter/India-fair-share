import raw from "../../data/companies.json";
import type { Dataset } from "../types";

export const dataset = raw as Dataset;
export const companies = dataset.companies;
