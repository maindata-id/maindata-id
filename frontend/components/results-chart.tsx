"use client"

import { useState, useMemo } from "react"
import { Bar, BarChart, Line, LineChart, XAxis, YAxis, CartesianGrid } from "recharts"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

interface ResultsChartProps {
  data: any[]
}

export default function ResultsChart({ data }: ResultsChartProps) {
  const [chartType, setChartType] = useState<"bar" | "line">("bar")
  const [xAxis, setXAxis] = useState<string>("")
  const [yAxis, setYAxis] = useState<string>("")

  const columns = useMemo(() => {
    if (!data.length) return []
    return Object.keys(data[0])
  }, [data])

  // Auto-select first string column for X and first numeric column for Y
  useMemo(() => {
    if (!columns.length) return

    const firstRow = data[0]

    // Find first string-like column for X axis
    const stringColumn = columns.find(
      (col) =>
        typeof firstRow[col] === "string" || (typeof firstRow[col] === "number" && Number.isInteger(firstRow[col])),
    )

    // Find first numeric column for Y axis
    const numericColumn = columns.find((col) => typeof firstRow[col] === "number" && col !== stringColumn)

    if (stringColumn && !xAxis) setXAxis(stringColumn)
    if (numericColumn && !yAxis) setYAxis(numericColumn)
  }, [columns, data, xAxis, yAxis])

  if (!data.length) return <p>No data available for visualization</p>

  if (!xAxis || !yAxis)
    return (
      <div className="p-4 text-center">
        <p>Please select columns to visualize</p>
      </div>
    )

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4">
        <div className="w-full sm:w-auto">
          <label className="block mb-2 text-sm font-medium">Chart Type</label>
          <Select value={chartType} onValueChange={(value: "bar" | "line") => setChartType(value)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select chart type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="bar">Bar Chart</SelectItem>
              <SelectItem value="line">Line Chart</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="w-full sm:w-auto">
          <label className="block mb-2 text-sm font-medium">X Axis</label>
          <Select value={xAxis} onValueChange={setXAxis}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select X axis" />
            </SelectTrigger>
            <SelectContent>
              {columns.map((column) => (
                <SelectItem key={column} value={column}>
                  {column}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="w-full sm:w-auto">
          <label className="block mb-2 text-sm font-medium">Y Axis</label>
          <Select value={yAxis} onValueChange={setYAxis}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select Y axis" />
            </SelectTrigger>
            <SelectContent>
              {columns.map((column) => (
                <SelectItem key={column} value={column}>
                  {column}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="h-[400px]">
            <ChartContainer
              config={{
                [yAxis]: {
                  label: yAxis,
                  color: "hsl(var(--chart-1))",
                },
              }}
            >
              {chartType === "bar" ? (
                <BarChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey={xAxis} tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey={yAxis} fill="var(--color-primary)" radius={4} />
                </BarChart>
              ) : (
                <LineChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey={xAxis} tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line
                    type="monotone"
                    dataKey={yAxis}
                    stroke="var(--color-primary)"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              )}
            </ChartContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
