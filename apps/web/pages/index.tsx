import { CsvUpload } from "../components/CsvUpload";
import { UrlTable } from "../components/UrlTable";
import { DomainChart } from "../components/DomainChart";
import { DateChart } from "../components/DateChart";

export default function Home() {
  return (
    <main className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">URL Visibility Dashboard</h1>
        <p className="text-gray-500 mt-1">Upload a CSV file to import URL records.</p>
      </div>

      <CsvUpload />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <DomainChart />
        <DateChart />
      </div>

      <UrlTable />
    </main>
  );
}
