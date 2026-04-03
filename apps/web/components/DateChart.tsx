import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { trpc } from "../utils/trpc";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";

const Skeleton = () => (
  <div className="h-56 animate-pulse rounded-md bg-muted" />
);

export const DateChart = () => {
  const { data, isLoading } = trpc.urls.byDate.useQuery();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Entries over time</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton />
        ) : data?.length ? (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart
              data={data}
              margin={{ top: 4, right: 8, left: 0, bottom: 60 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="var(--border)"
              />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11 }}
                angle={-40}
                textAnchor="end"
                interval={4}
              />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#6366f1"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
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
