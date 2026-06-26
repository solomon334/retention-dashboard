import fs from "fs";
import path from "path";
import Dashboard from "@/components/Dashboard";

export default function Home() {
  const filePath = path.join(process.cwd(), "data", "snapshot.json");
  const raw = fs.readFileSync(filePath, "utf-8");
  const data = JSON.parse(raw);

  return <Dashboard data={data} />;
}
