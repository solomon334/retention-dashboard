import { google } from "googleapis";
import { BRANDS, CANONICAL } from "./brands";

export interface BrandData {
  id: string;
  name: string;
  platform: string;
  weeks: string[];
  weekEndDates: string[];
  metrics: Record<string, { values: (number | null)[]; isPercent: boolean }>;
}

export interface DashboardData {
  generatedAt: string;
  brandCount: number;
  brands: BrandData[];
}

function norm(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]/g, " ").replace(/\s+/g, " ").trim();
}

function isWeekHeader(cell: string) {
  return /^week\s*\d+$/i.test((cell || "").trim());
}

function parseValue(raw: string | undefined): number | null {
  if (!raw || raw.trim() === "" || raw === "#N/A" || raw === "#DIV/0!") return null;
  const cleaned = raw.replace(/[$,%]/g, "").replace(/,/g, "").trim();
  const n = parseFloat(cleaned);
  return isNaN(n) ? null : n;
}

function getAuth() {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!raw) throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON env var is missing");
  const creds = JSON.parse(raw);
  return new google.auth.GoogleAuth({
    credentials: creds,
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });
}

async function fetchSheetRange(auth: InstanceType<typeof google.auth.GoogleAuth>, sheetId: string, range: string) {
  const sheets = google.sheets({ version: "v4", auth });
  const res = await sheets.spreadsheets.values.get({ spreadsheetId: sheetId, range });
  return res.data.values || [];
}

export async function loadAllBrands(): Promise<DashboardData> {
  const auth = getAuth();
  const results: BrandData[] = [];

  await Promise.all(
    BRANDS.map(async (brand) => {
      try {
        const rows = await fetchSheetRange(auth, brand.sheetId, "Weekly Scorecard!A2:AZ55");
        const parsed = parseBrandRows(brand.id, brand.name, brand.platform, rows);
        if (parsed) results.push(parsed);
      } catch (e) {
        console.error(`[sheets] failed to load ${brand.name}:`, e);
      }
    })
  );

  // Sort back to BRANDS order
  const order = BRANDS.map((b) => b.id);
  results.sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));

  return {
    generatedAt: new Date().toISOString(),
    brandCount: results.length,
    brands: results,
  };
}

function parseBrandRows(
  id: string,
  name: string,
  platform: string,
  rows: string[][]
): BrandData | null {
  // Find the row containing week headers (Week N)
  let weekRowIdx = -1;
  let weekRow: string[] = [];
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i] || [];
    const weekCols = row.filter((c) => isWeekHeader(c));
    if (weekCols.length >= 2) {
      weekRowIdx = i;
      weekRow = row;
      break;
    }
  }
  if (weekRowIdx === -1) return null;

  // Detect where values start (first Week column index) and where label is
  const valueStart = weekRow.findIndex((c) => isWeekHeader(c));
  const labelIdx = Math.max(0, valueStart - 1);
  const weeks = weekRow.slice(valueStart).filter(isWeekHeader);
  const numWeeks = weeks.length;

  // Find end dates row (row after week headers, often contains dates)
  let weekEndDates: string[] = [];
  const nextRow = rows[weekRowIdx + 1] || [];
  const potentialDates = nextRow.slice(valueStart, valueStart + numWeeks);
  if (potentialDates.some((d) => /\d{1,2}\/\d{1,2}/.test(d || ""))) {
    weekEndDates = potentialDates.map((d) => d || "");
  }

  // Build alias lookup
  const aliasMap = new Map<string, string>(); // norm(alias) -> canonical key
  for (const c of CANONICAL) {
    for (const alias of c.aliases) {
      aliasMap.set(norm(alias), c.key);
    }
  }

  const metrics: BrandData["metrics"] = {};
  const dataStart = weekRowIdx + (weekEndDates.length ? 2 : 1);

  for (let i = dataStart; i < rows.length; i++) {
    const row = rows[i] || [];
    const labelCell = (row[labelIdx] || "").trim();
    if (!labelCell) continue;

    const canonicalKey = aliasMap.get(norm(labelCell));
    if (!canonicalKey) continue;

    const metaEntry = CANONICAL.find((c) => c.key === canonicalKey)!;
    const values = row.slice(valueStart, valueStart + numWeeks).map(parseValue);
    metrics[canonicalKey] = { values, isPercent: metaEntry.isPercent };
  }

  return { id, name, platform, weeks, weekEndDates, metrics };
}
