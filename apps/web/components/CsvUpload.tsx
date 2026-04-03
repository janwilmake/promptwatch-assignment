import { useState } from "react";
import { trpc } from "../utils/trpc";
import { Button } from "./ui/button";

export const CsvUpload = () => {
  const [result, setResult] = useState<{ rowCount: number; skipped: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const upload = trpc.upload.upload.useMutation({
    onSuccess: (data) => setResult(data),
  });

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "text/csv" && !file.name.endsWith(".csv")) {
      setError("Only CSV files are allowed.");
      return;
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setError("File is too large. Maximum size is 5MB.");
      return;
    }

    setError(null);
    setResult(null);
    const content = await file.text();
    upload.mutate({ content, filename: file.name });
  };

  return (
    <div className="flex items-center gap-4 flex-wrap">
      <Button variant="outline" size="sm" asChild>
        <label className="cursor-pointer">
          {upload.isLoading ? "Uploading…" : "Upload CSV"}
          <input type="file" accept=".csv,text/csv" className="sr-only" onChange={handleChange} />
        </label>
      </Button>
      {error && <p className="text-sm text-destructive">{error}</p>}
      {upload.isError && <p className="text-sm text-destructive">{upload.error.message}</p>}
      {result && (
        <p className="text-sm text-muted-foreground">
          Imported{" "}
          <span className="font-medium text-foreground">{result.rowCount}</span> rows
          {result.skipped > 0 && (
            <span className="text-destructive"> · {result.skipped} invalid row{result.skipped !== 1 ? "s" : ""} skipped</span>
          )}
        </p>
      )}
    </div>
  );
};
