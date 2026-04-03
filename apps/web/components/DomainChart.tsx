import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { trpc } from "../utils/trpc";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";

const Skeleton = () => (
  <div className="h-56 animate-pulse rounded-md bg-muted" />
);

export const DomainChart = () => {
  const { data, isLoading } = trpc.urls.byDomain.useQuery();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Occurrences by domain</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton />
        ) : data?.length ? (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              data={data.slice(0, 15)}
              margin={{ top: 4, right: 8, left: 0, bottom: 60 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="var(--border)"
              />
              <XAxis
                dataKey="domain"
                tick={{ fontSize: 11 }}
                angle={-40}
                textAnchor="end"
                interval={0}
              />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="py-12 text-center text-sm text-muted-foreground">
            No data yet.
          </p>
        )}
      </CardContent>
    </Card>
  );
};
