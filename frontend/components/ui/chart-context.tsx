"use client"

import * as React from "react"

export interface ChartConfig {
  [key: string]: {
    label: string
    color: string
  }
}

export interface ChartContextProps {
  config: ChartConfig
}

export const ChartContext = React.createContext<ChartContextProps>({
  config: {},
})
