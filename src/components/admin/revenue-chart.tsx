"use client";

import * as React from "react";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";

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

// Configuração de cores para o gráfico (Laranja do tema)
const chartConfig = {
  revenue: {
    label: "Receita",
    // Usando o laranja do Tailwind (orange-600) ou uma cor CSS válida
    color: "#ea580c",
  },
} satisfies ChartConfig;

interface RevenueChartProps {
  data: {
    date: string;
    revenue: number;
  }[];
}

export function RevenueChart({ data }: RevenueChartProps) {
  const [timeRange, setTimeRange] = React.useState("90d");

  const filteredData = React.useMemo(() => {
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
      const date = new Date(item.date);
      return date >= startDate;
    });
  }, [data, timeRange]);

  return (
    <Card className="border-0 bg-transparent shadow-none">
      <CardHeader className="mb-4 flex items-center gap-2 space-y-0 border-b border-neutral-100 px-0 pb-4 sm:flex-row">
        <div className="grid flex-1 gap-1">
          <CardTitle className="text-xl font-semibold text-neutral-900">
            Receita no Período
          </CardTitle>
          <CardDescription className="text-neutral-500">
            Acompanhe o faturamento diário da sua loja.
          </CardDescription>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger
            className="w-[160px] rounded-lg border-neutral-200 bg-white text-neutral-900 shadow-sm sm:ml-auto"
            aria-label="Selecione o período"
          >
            <SelectValue placeholder="Últimos 3 meses" />
          </SelectTrigger>
          <SelectContent className="rounded-xl border-neutral-200 bg-white text-neutral-900">
            <SelectItem
              value="90d"
              className="cursor-pointer rounded-lg hover:bg-neutral-50 focus:bg-neutral-50"
            >
              Últimos 3 meses
            </SelectItem>
            <SelectItem
              value="30d"
              className="cursor-pointer rounded-lg hover:bg-neutral-50 focus:bg-neutral-50"
            >
              Últimos 30 dias
            </SelectItem>
            <SelectItem
              value="7d"
              className="cursor-pointer rounded-lg hover:bg-neutral-50 focus:bg-neutral-50"
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
          <AreaChart data={filteredData}>
            <defs>
              <linearGradient id="fillRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-revenue)" // Usa a cor definida no config
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-revenue)"
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>
            {/* Grid mais sutil para fundo claro */}
            <CartesianGrid vertical={false} stroke="#e5e5e5" />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => {
                const date = new Date(value);
                // Usando pt-BR para datas, ou en-GB se preferir dd/mm
                return date.toLocaleDateString("pt-BR", {
                  month: "short",
                  day: "numeric",
                });
              }}
              stroke="#737373" // Cor do texto do eixo (neutral-500)
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => {
                    return new Date(value).toLocaleDateString("pt-BR", {
                      weekday: "short",
                      month: "long",
                      day: "numeric",
                    });
                  }}
                  indicator="dot"
                  className="border-neutral-200 bg-white text-neutral-900 shadow-lg"
                />
              }
            />
            <Area
              dataKey="revenue"
              type="natural"
              fill="url(#fillRevenue)" // Usa o gradiente definido acima
              stroke="var(--color-revenue)" // Cor da linha (Laranja)
              stackId="a"
            />
            <ChartLegend
              content={<ChartLegendContent className="text-neutral-600" />}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
