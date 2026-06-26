import { loadAllBrands } from "@/lib/sheets";
import { METRIC_META, CATALOG } from "@/lib/brands";
import Dashboard from "@/components/Dashboard";

export const revalidate = 3600; // re-fetch from Sheets at most once per hour

export default async function Home() {
  let data;
  try {
    data = await loadAllBrands();
  } catch (e) {
    return (
      <div style={{
        minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: "system-ui, sans-serif", padding: 40, textAlign: "center",
      }}>
        <div>
          <h2 style={{ marginBottom: 12 }}>Could not load data</h2>
          <p style={{ color: "#6b7280", fontSize: 14 }}>
            Check that GOOGLE_SERVICE_ACCOUNT_JSON is set correctly in your environment variables.
          </p>
          <pre style={{ fontSize: 12, color: "#ef4444", marginTop: 16, textAlign: "left" }}>
            {String(e)}
          </pre>
        </div>
      </div>
    );
  }

  return <Dashboard data={data} metricMeta={METRIC_META} catalog={CATALOG} />;
}
