'use client'

import { Area, AreaChart, XAxis, YAxis } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig } from '@/components/ui/chart'

interface RevenueChartProps {
  data: { month: string; revenue: number }[];
}

const chartConfig = {
  revenue: {
    label: 'Receita',
    color: 'hsl(var(--chart-2))',
  },
} satisfies ChartConfig

export function RevenueChart({ data }: RevenueChartProps) {
  return (
    <ChartContainer config={chartConfig} className="h-[250px] w-full">
      <AreaChart accessibilityLayer data={data} margin={{ top: 20, right: 20, left: -10, bottom: 0 }}>
        <XAxis
          dataKey="month"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tickFormatter={(value) => value.slice(0, 3)}
        />
        <YAxis 
            tickLine={false} 
            axisLine={false} 
            tickMargin={8} 
            width={50}
            tickFormatter={(value) => `R$${value / 1000}k`}
        />
        <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" formatter={(value) => `R$ ${Number(value).toLocaleString('pt-BR')}`} />} />
        <defs>
            <linearGradient id="fillRevenue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--color-revenue)" stopOpacity={0.8} />
              <stop offset="95%" stopColor="var(--color-revenue)" stopOpacity={0.1} />
            </linearGradient>
        </defs>
        <Area dataKey="revenue" type="natural" fill="url(#fillRevenue)" stroke="var(--color-revenue)" />
      </AreaChart>
    </ChartContainer>
  )
}
