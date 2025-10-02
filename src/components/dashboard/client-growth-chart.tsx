'use client'

import { Bar, BarChart, XAxis, YAxis } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig } from '@/components/ui/chart'

interface ClientGrowthChartProps {
  data: { month: string; clients: number }[];
}

const chartConfig = {
  clients: {
    label: 'Novos Clientes',
    color: 'hsl(var(--chart-1))',
  },
} satisfies ChartConfig

export function ClientGrowthChart({ data }: ClientGrowthChartProps) {
  return (
    <ChartContainer config={chartConfig} className="h-[250px] w-full">
      <BarChart accessibilityLayer data={data} margin={{ top: 20, right: 20, left: -10, bottom: 0 }}>
        <XAxis
          dataKey="month"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tickFormatter={(value) => value.slice(0, 3)}
        />
        <YAxis tickLine={false} axisLine={false} tickMargin={8} width={30} />
        <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
        <Bar dataKey="clients" fill="var(--color-clients)" radius={4} />
      </BarChart>
    </ChartContainer>
  )
}
