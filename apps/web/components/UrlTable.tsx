import { useState, useCallback } from "react";
import { ChevronUp, ChevronDown, ChevronsUpDown, X, Download } from "lucide-react";
import { trpc } from "../utils/trpc";
import { Card, CardContent } from "./ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "./ui/table";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "./ui/select";

type SortBy = "createdAt" | "lastUpdated" | "visibilityScore" | "citationsCount" | "mentionsCount";
type Sentiment = "positive" | "negative" | "neutral";

const sentimentVariant: Record<Sentiment, "success" | "destructive" | "secondary"> = {
  positive: "success",
  negative: "destructive",
  neutral: "secondary",
};

const columns: { label: string; sortKey?: SortBy }[] = [
  { label: "Title" },
  { label: "AI Model" },
  { label: "Sentiment" },
  { label: "Visibility", sortKey: "visibilityScore" },
  { label: "Citations", sortKey: "citationsCount" },
  { label: "Mentions", sortKey: "mentionsCount" },
  { label: "Last Updated", sortKey: "lastUpdated" },
];

const SortIcon = ({ col, sortBy, sortOrder }: { col: typeof columns[0]; sortBy: SortBy; sortOrder: "asc" | "desc" }) => {
  if (!col.sortKey) return null;
  if (col.sortKey !== sortBy) return <ChevronsUpDown className="ml-1 h-3.5 w-3.5 opacity-40" />;
  return sortOrder === "asc"
    ? <ChevronUp className="ml-1 h-3.5 w-3.5" />
    : <ChevronDown className="ml-1 h-3.5 w-3.5" />;
};

export const UrlTable = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortBy>("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [sentiment, setSentiment] = useState<"" | Sentiment>("");

  const [exportEnabled, setExportEnabled] = useState(false);

  const exportQuery = trpc.urls.export.useQuery(
    { search: debouncedSearch || undefined, sentiment: sentiment || undefined },
    {
      enabled: exportEnabled,
      onSuccess: (data) => {
        setExportEnabled(false);
        const blob = new Blob([data.csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "url-records.csv";
        a.click();
        URL.revokeObjectURL(url);
      },
    }
  );

  const handleExport = useCallback(() => setExportEnabled(true), []);

  const { data, isLoading, isFetching } = trpc.urls.list.useQuery(
    {
      page,
      pageSize: 20,
      sortBy,
      sortOrder,
      search: debouncedSearch || undefined,
      sentiment: sentiment || undefined,
    },
    { keepPreviousData: true }
  );

  const handleSearch = (value: string) => {
    setSearch(value);
    clearTimeout((window as any)._searchTimeout);
    (window as any)._searchTimeout = setTimeout(() => {
      setDebouncedSearch(value);
      setPage(1);
    }, 300);
  };

  const handleSort = (key: SortBy) => {
    if (sortBy === key) {
      setSortOrder((o) => (o === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(key);
      setSortOrder("desc");
    }
    setPage(1);
  };

  const totalPages = data ? Math.ceil(data.total / 20) : 1;

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-wrap gap-3 mb-4">
          <div className="relative max-w-64 w-full">
            <Input
              placeholder="Search URL or title..."
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              className="pr-8"
            />
            {search && (
              <button
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => { setSearch(""); setDebouncedSearch(""); setPage(1); }}
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <Select value={sentiment || "all"} onValueChange={(v) => { setSentiment(v === "all" ? "" : v as Sentiment); setPage(1); }}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All sentiments</SelectItem>
              <SelectItem value="positive">Positive</SelectItem>
              <SelectItem value="negative">Negative</SelectItem>
              <SelectItem value="neutral">Neutral</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={exportQuery.isFetching}
            className="ml-auto"
          >
            <Download className="mr-1.5 h-3.5 w-3.5" />
            {exportQuery.isFetching ? "Exporting…" : "Export CSV"}
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-2 py-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-10 animate-pulse rounded bg-muted" />
            ))}
          </div>
        ) : (
          <div className={isFetching ? "opacity-60 transition-opacity duration-150" : "transition-opacity duration-150"}>
            <Table>
              <TableHeader>
                <TableRow>
                  {columns.map((col) => (
                    <TableHead key={col.label}>
                      {col.sortKey ? (
                        <button
                          className="flex items-center hover:text-foreground transition-colors"
                          onClick={() => handleSort(col.sortKey!)}
                        >
                          {col.label}
                          <SortIcon col={col} sortBy={sortBy} sortOrder={sortOrder} />
                        </button>
                      ) : (
                        col.label
                      )}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="max-w-xs">
                      <a
                        href={row.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-600 hover:underline truncate block"
                        title={row.url}
                      >
                        {row.title}
                      </a>
                    </TableCell>
                    <TableCell>{row.aiModelMentioned}</TableCell>
                    <TableCell>
                      <Badge variant={sentimentVariant[row.sentiment as Sentiment]}>
                        {row.sentiment}
                      </Badge>
                    </TableCell>
                    <TableCell>{row.visibilityScore}</TableCell>
                    <TableCell>{row.citationsCount}</TableCell>
                    <TableCell>{row.mentionsCount}</TableCell>
                    <TableCell>{new Date(row.lastUpdated).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        <div className="flex items-center justify-between mt-4">
          <span className="text-sm text-muted-foreground">
            {data ? `${data.total} total rows` : ""}
          </span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {page} of {totalPages}
            </span>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
              Next
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
