export type Platform = "Stay AI" | "Recharge" | "Skio";

export interface Brand {
  id: string;
  name: string;
  platform: Platform;
  sheetId: string;
}

export interface MetricMeta {
  label: string;
  isPercent: boolean;
  default: boolean;
  color: string;
}

export const BRANDS: Brand[] = [
  { id: "1906",           name: "1906",           platform: "Stay AI", sheetId: "1mJDL9iDtRZva4Mgkx3f5Eb0eSfSPdXE5RoPl2eGj72w" },
  { id: "better-wild",    name: "Better Wild",     platform: "Stay AI", sheetId: "18HXPtuutG4DYUloXlX7AtTZEE9LgIPivRv2gFM_QUys" },
  { id: "dojo",           name: "DOJO",            platform: "Stay AI", sheetId: "1HQIuh82cbWZ_oCRSlWtahzHTX2BlLSg46V9xWUaS2BE" },
  { id: "clevr",          name: "Clevr",           platform: "Stay AI", sheetId: "1nDHqPDAP7BWeXuZnpqrXR_fhx-S6i8PDQwg1L8rFUAs" },
  { id: "arey",           name: "Arey",            platform: "Stay AI", sheetId: "14bhYwnDzo-fI1W3bR-wSw9yZmMIN_PGKLMCatdgGBqA" },
  { id: "auri",           name: "Auri",            platform: "Stay AI", sheetId: "1FH7ILef31lmiWsSgncZtcizJGvU0cQwnzbznrB4AsFs" },
  { id: "graymatter",     name: "Graymatter",      platform: "Skio",    sheetId: "1XSu7oA0-fW9SIBNRpze4EwQlAScMyc-_V7whK2Zp17Q" },
  { id: "feel-goods",     name: "Feel Goods",      platform: "Stay AI", sheetId: "1P-PMMhSLi9h76_2XMrmKT55u4EPAIToa8niY8g0pMVc" },
  { id: "humantra",       name: "Humantra",        platform: "Stay AI", sheetId: "1VEe96Pu2GyV1vi1LhzWrqash9TUasOfeJ6nNGA4veOI" },
  { id: "marin",          name: "Marin Skincare",  platform: "Stay AI", sheetId: "17TpkwHMSIzakbwLffGqO72ZIsLPYBVCLaIVLrzq0aS8" },
  { id: "hyro-au",        name: "Hyro AU",         platform: "Stay AI", sheetId: "1KX3q18MRJ5u_XJWuOkxZeruGE5KswEUxgppu5SqUPrE" },
  { id: "trip",           name: "TRIP",            platform: "Recharge", sheetId: "1bUPNKJtYpFpdPBq3XqkV-KAjWVylrqBrr1YBbPDFcpM" },
  { id: "livfresh",       name: "Livfresh",        platform: "Stay AI", sheetId: "1kDbn1UZJn0GwZZxmonZt8iE_Q-JCTJlUMk5ZXnKIP3E" },
  { id: "drink-nectar",   name: "Drink Nectar",    platform: "Stay AI", sheetId: "1_DrinkNectarSheetIdPlaceholder_ReplaceMe" },
  { id: "carnivore-snax", name: "Carnivore Snax",  platform: "Recharge", sheetId: "1_CarnivoreSnaxSheetIdPlaceholder_ReplaceMe" },
];

// Canonical metric definitions with label aliases for cross-platform matching.
export const CANONICAL: Array<{
  key: string;
  label: string;
  aliases: string[];
  isPercent: boolean;
  default: boolean;
  color: string;
}> = [
  {
    key: "active_subscriptions",
    label: "Active Subscriptions",
    aliases: ["active subscriptions", "active subscriptions (end of period)", "active subscribers"],
    isPercent: false, default: true, color: "#3b82f6",
  },
  {
    key: "cancelled_sessions",
    label: "Cancelled Sessions",
    aliases: ["cancelled sessions", "cancelled subscribers", "cancellation sessions", "cancellations"],
    isPercent: false, default: true, color: "#ef4444",
  },
  {
    key: "subscription_churn_rate",
    label: "Churn Rate",
    aliases: ["subscription churn rate", "churn rate", "subscriber churn rate"],
    isPercent: true, default: true, color: "#f59e0b",
  },
  {
    key: "new_subscriptions",
    label: "New Subscriptions",
    aliases: ["new subscriptions", "new subscribers", "new subscription"],
    isPercent: false, default: true, color: "#10b981",
  },
  {
    key: "session_save_rate",
    label: "Save Rate",
    aliases: ["session save rate", "subscriber save rate", "save rate", "cancellation save rate"],
    isPercent: true, default: true, color: "#8b5cf6",
  },
  {
    key: "net_subscription_growth",
    label: "Net Subscription Growth",
    aliases: ["net subscription growth", "net subscriber growth", "net growth"],
    isPercent: false, default: false, color: "#6366f1",
  },
  {
    key: "saved_sessions",
    label: "Saved Sessions",
    aliases: ["saved sessions", "saved subscribers", "saves"],
    isPercent: false, default: false, color: "#14b8a6",
  },
  {
    key: "total_sessions",
    label: "Total Sessions",
    aliases: ["total sessions", "total subscribers", "total cancellation sessions"],
    isPercent: false, default: false, color: "#64748b",
  },
  {
    key: "pause_screen_save_rate",
    label: "Pause Screen Save Rate",
    aliases: ["pause screen save rate", "pause save rate", "pause screen"],
    isPercent: true, default: false, color: "#f97316",
  },
];

export const METRIC_META: Record<string, MetricMeta> = Object.fromEntries(
  CANONICAL.map((c) => [c.key, { label: c.label, isPercent: c.isPercent, default: c.default, color: c.color }])
);

// Platform-ordered catalog of metric keys (defines sidebar order).
export const CATALOG: Record<Platform, string[]> = {
  "Stay AI":  CANONICAL.map((c) => c.key),
  "Recharge": CANONICAL.map((c) => c.key),
  "Skio":     CANONICAL.map((c) => c.key),
};
