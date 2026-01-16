"use client";

import * as React from "react";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const chartConfig = {
  sales: {
    label: "Vendas",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig;

interface SalesChartProps {
  data: {
    date: string;
    sales: number;
  }[];
}

export function SalesChart({ data }: SalesChartProps) {
  const [timeRange, setTimeRange] = React.useState("90d");

  const filteredData = React.useMemo(() => {
    if (!data || data.length === 0) return [];

    const referenceDate = new Date();
    let daysToSubtract = 90;

    if (timeRange === "30d") {
      daysToSubtract = 30;
    } else if (timeRange === "7d") {
      daysToSubtract = 7;
    }

    const startDate = new Date(referenceDate);
    startDate.setDate(startDate.getDate() - daysToSubtract);

    return data.filter((item) => {
      const itemDate = new Date(item.date);
      return itemDate >= startDate;
    });
  }, [data, timeRange]);

  return (
    <Card className="border-0 bg-transparent shadow-none">
      <CardHeader className="mb-4 flex items-center gap-2 space-y-0 border-b border-white/10 px-0 pb-4 sm:flex-row">
        <div className="grid flex-1 gap-1">
          <CardTitle className="text-xl font-semibold text-white">
            Vendas Realizadas
          </CardTitle>
          <CardDescription className="text-neutral-400">
            Quantidade de pedidos por dia.
          </CardDescription>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger
            className="w-[160px] rounded-lg border-white/10 bg-white/5 text-white sm:ml-auto"
            aria-label="Selecione o período"
          >
            <SelectValue placeholder="Últimos 3 meses" />
          </SelectTrigger>
          <SelectContent className="rounded-xl border-white/10 bg-[#0A0A0A] text-white">
            <SelectItem
              value="90d"
              className="cursor-pointer rounded-lg hover:bg-white/10"
            >
              Últimos 3 meses
            </SelectItem>
            <SelectItem
              value="30d"
              className="cursor-pointer rounded-lg hover:bg-white/10"
            >
              Últimos 30 dias
            </SelectItem>
            <SelectItem
              value="7d"
              className="cursor-pointer rounded-lg hover:bg-white/10"
            >
              Últimos 7 dias
            </SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>

      <CardContent className="px-0 pt-2 sm:pt-4">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[350px] w-full"
        >
          <BarChart data={filteredData}>
            <CartesianGrid vertical={false} strokeOpacity={0.1} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => {
                const date = new Date(value);
                return date.toLocaleDateString("pt-BR", {
                  month: "short",
                  day: "numeric",
                });
              }}
              stroke="#666"
            />
            <ChartTooltip
              cursor={{ fill: "white", opacity: 0.05 }}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => {
                    return new Date(value).toLocaleDateString("pt-BR", {
                      weekday: "short",
                      month: "long",
                      day: "numeric",
                    });
                  }}
                  indicator="dashed"
                />
              }
            />
            <Bar dataKey="sales" fill="var(--chart-2)" radius={[4, 4, 0, 0]} />
            <ChartLegend content={<ChartLegendContent />} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
