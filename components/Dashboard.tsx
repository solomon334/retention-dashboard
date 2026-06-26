"use client";

import { useState, useMemo, useCallback } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";
import type { DashboardData } from "@/lib/sheets";
import type { MetricMeta } from "@/lib/brands";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const CORE = ["active_subscriptions", "cancelled_sessions", "subscription_churn_rate", "new_subscriptions", "session_save_rate"];

type View = "indexed" | "wow";

function wowSeries(values: (number | null)[]): (number | null)[] {
  return values.map((v, i) => {
    if (i === 0) return null;
    const p = values[i - 1];
    if (v === null || p === null || p <= 0) return null;
    return ((v - p) / p) * 100;
  });
}

function indexedSeries(values: (number | null)[]): (number | null)[] {
  const base = values.find((v) => v !== null && v !== 0);
  if (base == null) return values.map(() => null);
  return values.map((v) => (v === null ? null : (v / base) * 100));
}

function fmtVal(v: number | null, isPercent: boolean) {
  if (v == null) return "n/a";
  return isPercent ? `${v.toFixed(1)}%` : v.toLocaleString();
}

function buildNoticings(brand: DashboardData["brands"][0], metricMeta: Record<string, MetricMeta>): string[] {
  const items: string[] = [];
  const sr = brand.metrics.session_save_rate?.values || [];

  let cur: number | null = null, prev: number | null = null, curIdx = -1;
  for (let i = sr.length - 1; i >= 0; i--) if (sr[i] !== null) { cur = sr[i]; curIdx = i; break; }
  for (let i = curIdx - 1; i >= 0; i--) if (sr[i] !== null) { prev = sr[i]; break; }

  if (cur != null && prev != null) {
    const pp = cur - prev;
    const dir = pp > 0.05 ? "up" : pp < -0.05 ? "down" : "flat";
    let line = dir === "flat"
      ? `Save rate held roughly flat WoW at ${cur.toFixed(1)}%.`
      : `Save rate ${dir} ${Math.abs(pp).toFixed(1)}pp WoW (${prev.toFixed(1)}% to ${cur.toFixed(1)}%).`;
    const traj: number[] = [];
    for (let i = curIdx; i > 0 && sr[i] != null && sr[i - 1] != null; i--) {
      traj.push((sr[i] as number) - (sr[i - 1] as number));
      if (traj.length >= 3) break;
    }
    if (traj.length >= 2 && traj.every((d) => d < -0.05)) line += " It's now declined several weeks running.";
    else if (traj.length >= 2 && traj.every((d) => d > 0.05)) line += " That's the trend up for several weeks running.";
    const saves = brand.metrics.saved_sessions?.values;
    const savesNow = saves ? saves[curIdx] : null;
    if (savesNow != null && savesNow < 10) line += ` Only ${savesNow} saves this week, so read the % with caution.`;
    else if (savesNow != null && savesNow < 30) line += ` Save count is low (${savesNow}), so small swings may be noise.`;
    items.push(line);
  }

  const movers: { label: string; v: number }[] = [];
  for (const key of CORE) {
    const m = brand.metrics[key];
    if (!m) continue;
    const w = wowSeries(m.values);
    const last = w[w.length - 1];
    if (last != null) movers.push({ label: metricMeta[key]?.label || key, v: last });
  }
  if (movers.length) {
    const maxAbs = Math.max(...movers.map((m) => Math.abs(m.v)));
    if (maxAbs < 3) {
      items.push("WoW is relatively flat across the tracked metrics.");
    } else {
      const big = movers.slice().sort((a, b) => Math.abs(b.v) - Math.abs(a.v))[0];
      items.push(`Biggest WoW move: ${big.label} ${big.v > 0 ? "+" : ""}${big.v.toFixed(1)}%.`);
    }
  }

  const ps = brand.metrics.pause_screen_save_rate?.values;
  if (ps) {
    let psCur: number | null = null;
    for (let i = ps.length - 1; i >= 0; i--) if (ps[i] !== null) { psCur = ps[i]; break; }
    if (psCur != null && psCur <= 2) {
      items.push(`Opportunity on the pause screen — save rate is only ${psCur.toFixed(1)}%.`);
    }
  }

  if (!items.length) items.push("Not enough recent data to surface a noticing for this brand.");
  return items;
}

interface Props {
  data: DashboardData;
  metricMeta: Record<string, MetricMeta>;
  catalog: Record<string, string[]>;
}

export default function Dashboard({ data, metricMeta, catalog }: Props) {
  const [brandId, setBrandId] = useState(data.brands[0]?.id ?? "");
  const [view, setView] = useState<View>("indexed");
  const [window, setWindow] = useState(8);
  const [enabled, setEnabled] = useState<Set<string>>(
    () => new Set(Object.entries(metricMeta).filter(([, m]) => m.default).map(([k]) => k))
  );
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const brand = useMemo(() => data.brands.find((b) => b.id === brandId)!, [data, brandId]);
  const platformKeys: string[] = catalog[brand?.platform] || [];
  const coreKeys = CORE.filter((k) => platformKeys.includes(k));
  const restKeys = platformKeys.filter((k) => !CORE.includes(k));

  const toggleMetric = useCallback((key: string, on: boolean) => {
    setEnabled((prev) => {
      const next = new Set(prev);
      if (on) next.add(key); else next.delete(key);
      return next;
    });
  }, []);

  const chartData = useMemo(() => {
    if (!brand) return { labels: [], datasets: [] };
    const n = brand.weeks.length;
    const start = n - Math.min(window, n);
    const labels = brand.weeks.slice(start);
    const isWow = view === "wow";

    const datasets = Array.from(enabled).flatMap((key) => {
      const m = brand.metrics[key];
      if (!m) return [];
      const rawSlice = m.values.slice(start);
      const wow = wowSeries(m.values).slice(start);
      const plotData = isWow ? wow : indexedSeries(rawSlice);
      const meta = metricMeta[key];
      return [{
        label: meta?.label || key,
        data: plotData,
        borderColor: meta?.color || "#888",
        backgroundColor: meta?.color || "#888",
        borderWidth: 2,
        pointRadius: 3,
        pointHoverRadius: 5,
        tension: 0.25,
        spanGaps: false,
        _raw: rawSlice,
        _wow: wow,
        _isPercent: m.isPercent,
      }];
    });

    return { labels, datasets };
  }, [brand, view, window, enabled, metricMeta]);

  const endDates = useMemo(() => {
    if (!brand) return [];
    const n = brand.weeks.length;
    const start = n - Math.min(window, n);
    return (brand.weekEndDates || []).slice(start);
  }, [brand, window]);

  const noticings = useMemo(() => buildNoticings(brand, metricMeta), [brand, metricMeta]);

  const chartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: "nearest" as const, intersect: true },
    plugins: {
      legend: { position: "top" as const, labels: { usePointStyle: true, boxWidth: 8, font: { size: 11 } } },
      tooltip: {
        callbacks: {
          title: (items: { dataIndex: number }[]) => {
            const i = items[0].dataIndex;
            const label = chartData.labels[i] || "";
            return endDates[i] ? `${label} · wk ending ${endDates[i]}` : label;
          },
          label: (item: { dataset: { _raw: (number | null)[]; _wow: (number | null)[]; _isPercent: boolean; label: string }; dataIndex: number }) => {
            const ds = item.dataset;
            const i = item.dataIndex;
            const val = fmtVal(ds._raw[i], ds._isPercent);
            const w = ds._wow[i];
            const wow = w == null ? "WoW n/a" : `WoW ${w > 0 ? "+" : ""}${w.toFixed(1)}%`;
            return `${ds.label}: ${val} · ${wow}`;
          },
        },
      },
    },
    scales: {
      y: {
        title: {
          display: true,
          text: view === "wow" ? "WoW % change" : "Indexed (window start = 100)",
        },
        grid: {
          color: (ctx: { tick: { value: number } }) =>
            ctx.tick.value === (view === "wow" ? 0 : 100) ? "#9ca3af" : "#eef0f2",
        },
        ticks: { callback: (v: number | string) => view === "wow" ? `${v}%` : v },
      },
      x: { grid: { display: false } },
    },
  }), [view, chartData.labels, endDates]);

  const stamp = data.generatedAt
    ? `${data.brandCount} brands · data pulled ${new Date(data.generatedAt).toLocaleString()}`
    : "";

  return (
    <div style={{
      background: "#f6f7f9", minHeight: "100vh",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
      fontSize: 14, color: "#1a1d21", lineHeight: 1.5,
    }}>
      <div style={{ maxWidth: 1180, margin: "0 auto", padding: "24px 20px 60px" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap", marginBottom: 18 }}>
          <h1 style={{ fontSize: 20, margin: 0, fontWeight: 650 }}>Retention Snapshot</h1>
          <span style={{ color: "#6b7280", fontSize: 12 }}>{stamp}</span>
        </div>

        {/* Layout */}
        <div style={{
          display: "grid",
          gridTemplateColumns: sidebarOpen ? "264px 1fr" : "1fr",
          gap: 22,
          alignItems: "start",
        }}>
          {/* Sidebar */}
          {sidebarOpen && (
            <aside style={{
              background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12,
              padding: 16, position: "sticky", top: 16,
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <span style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: ".04em", color: "#6b7280" }}>Panel</span>
                <button onClick={() => setSidebarOpen(false)} style={linkBtnStyle}>Hide ‹</button>
              </div>

              <label style={capStyle} htmlFor="brand-select">Brand</label>
              <select
                id="brand-select"
                value={brandId}
                onChange={(e) => setBrandId(e.target.value)}
                style={{ font: "inherit", width: "100%", padding: "8px 10px", border: "1px solid #e5e7eb", borderRadius: 8, background: "#fff", color: "#1a1d21" }}
              >
                {data.brands.map((b) => (
                  <option key={b.id} value={b.id}>{b.name} · {b.platform}</option>
                ))}
              </select>

              {/* Default metrics */}
              <div style={{ marginTop: 16 }}>
                <div style={gheadStyle}>Default metrics</div>
                {coreKeys.map((key) => (
                  <MetricToggle key={key} metricKey={key} meta={metricMeta[key]} checked={enabled.has(key)} onChange={toggleMetric} />
                ))}
              </div>

              {/* More metrics */}
              {restKeys.length > 0 && (
                <div style={{ marginTop: 12, borderTop: "1px solid #e5e7eb", paddingTop: 12 }}>
                  <div style={gheadStyle}>More {brand?.platform} metrics</div>
                  {restKeys.map((key) => metricMeta[key] ? (
                    <MetricToggle key={key} metricKey={key} meta={metricMeta[key]} checked={enabled.has(key)} onChange={toggleMetric} />
                  ) : null)}
                </div>
              )}
            </aside>
          )}

          {/* Main */}
          <main>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "16px 24px", alignItems: "flex-end", marginBottom: 16 }}>
              {!sidebarOpen && (
                <button onClick={() => setSidebarOpen(true)} style={{ ...linkBtnStyle, marginRight: "auto" }}>Show panel ›</button>
              )}
              <SegControl
                label="View"
                options={[
                  { value: "indexed", label: "Indexed (each line vs. itself)" },
                  { value: "wow", label: "WoW % change" },
                ]}
                value={view}
                onChange={(v) => setView(v as View)}
              />
              <SegControl
                label="Window"
                options={[
                  { value: "4", label: "4 wks" },
                  { value: "8", label: "8 wks" },
                  { value: "12", label: "12 wks" },
                ]}
                value={String(window)}
                onChange={(v) => setWindow(Number(v))}
              />
            </div>

            {/* Chart card */}
            <div style={cardStyle}>
              <h2 style={{ fontSize: 16, fontWeight: 650, margin: "0 0 12px" }}>
                {brand?.name}{" "}
                <span style={{ color: "#6b7280", fontWeight: 500, fontSize: 13 }}>· {brand?.platform}</span>
              </h2>
              <div style={{ position: "relative", height: 440 }}>
                <Line data={chartData as Parameters<typeof Line>[0]["data"]} options={chartOptions as Parameters<typeof Line>[0]["options"]} />
              </div>
              <p style={{ color: "#6b7280", fontSize: 12, marginTop: 10 }}>
                {view === "wow"
                  ? "Week-over-week % change. A gap means the prior week was zero or missing. Hover for the actual weekly value."
                  : "Each line rebased to 100 at the window start so metrics on different scales share one axis. Hover any point for its actual value and WoW % change."}
              </p>
            </div>

            {/* Noticings card */}
            <div style={{ ...cardStyle, marginTop: 18 }}>
              <h2 style={{ fontSize: 13, textTransform: "uppercase", letterSpacing: ".04em", color: "#6b7280", margin: "0 0 10px" }}>Noticings</h2>
              <ul style={{ margin: 0, paddingLeft: 18 }}>
                {noticings.map((n, i) => <li key={i} style={{ marginBottom: 7 }}>{n}</li>)}
              </ul>
              <p style={{ color: "#6b7280", fontSize: 11.5, marginTop: 12, fontStyle: "italic" }}>
                Auto-generated from the scorecard in the style the data team posts weekly. Read as suggestions to confirm, not as posted notes.
              </p>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

// Sub-components

function MetricToggle({
  metricKey, meta, checked, onChange,
}: {
  metricKey: string;
  meta: MetricMeta;
  checked: boolean;
  onChange: (key: string, on: boolean) => void;
}) {
  return (
    <label style={{
      display: "flex", alignItems: "center", gap: 8, padding: "4px 6px",
      cursor: "pointer", userSelect: "none", fontSize: 13, borderRadius: 6,
      opacity: checked ? 1 : 0.55,
    }}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(metricKey, e.target.checked)}
        style={{ accentColor: "#1a1d21", margin: 0 }}
      />
      <span style={{
        width: 9, height: 9, borderRadius: "50%", display: "inline-block",
        flex: "0 0 auto", background: meta.color,
      }} />
      {meta.label}
    </label>
  );
}

function SegControl({
  label, options, value, onChange,
}: {
  label: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: ".04em", color: "#6b7280", marginBottom: 6 }}>{label}</div>
      <div style={{ display: "inline-flex", border: "1px solid #e5e7eb", borderRadius: 8, overflow: "hidden", background: "#fff" }}>
        {options.map((o) => (
          <button
            key={o.value}
            onClick={() => onChange(o.value)}
            style={{
              font: "inherit", border: 0,
              background: value === o.value ? "#1a1d21" : "transparent",
              color: value === o.value ? "#fff" : "#6b7280",
              padding: "7px 12px", cursor: "pointer",
            }}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// Shared style objects
const linkBtnStyle: React.CSSProperties = {
  font: "inherit", fontSize: 12, border: 0, background: "transparent",
  color: "#6b7280", cursor: "pointer", padding: "2px 4px", borderRadius: 6,
};
const cardStyle: React.CSSProperties = {
  background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: 18,
};
const capStyle: React.CSSProperties = {
  display: "block", fontSize: 11, textTransform: "uppercase",
  letterSpacing: ".04em", color: "#6b7280", margin: "0 0 6px",
};
const gheadStyle: React.CSSProperties = {
  fontSize: 11, textTransform: "uppercase", letterSpacing: ".04em",
  color: "#6b7280", marginBottom: 6,
};
