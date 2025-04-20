import Link from "next/link"
import { ArrowLeft, Database, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

// Mock dataset catalog
const datasets = [
  {
    id: "population_dki",
    name: "Penduduk DKI Jakarta",
    description: "Data jumlah penduduk DKI Jakarta per tahun",
    provider: "BPS",
    category: "Demografi",
    lastUpdated: "2023-12-01",
    rowCount: 15,
    columns: ["year", "population"],
  },
  {
    id: "education_budget",
    name: "Anggaran Pendidikan",
    description: "Data anggaran pendidikan per provinsi",
    provider: "Kemendikbud",
    category: "Pendidikan",
    lastUpdated: "2023-10-15",
    rowCount: 34,
    columns: ["province", "year", "budget"],
  },
  {
    id: "poverty_rate",
    name: "Angka Kemiskinan",
    description: "Data tingkat kemiskinan per provinsi",
    provider: "BPS",
    category: "Sosial",
    lastUpdated: "2023-11-20",
    rowCount: 102,
    columns: ["province", "year", "poverty_rate"],
  },
  {
    id: "hdi_data",
    name: "Indeks Pembangunan Manusia (IPM)",
    description: "Data IPM per provinsi per tahun",
    provider: "BPS",
    category: "Pembangunan",
    lastUpdated: "2023-09-30",
    rowCount: 340,
    columns: ["province", "year", "hdi_score"],
  },
]

export default function DatasetsPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="border-b">
        <div className="container flex items-center justify-between py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/">
                <ArrowLeft className="w-5 h-5" />
                <span className="sr-only">Back to home</span>
              </Link>
            </Button>
            <h1 className="text-2xl font-bold">Dataset Catalog</h1>
          </div>
        </div>
      </header>

      <main className="flex-1 py-8">
        <div className="container space-y-6">
          <div className="flex items-center gap-4">
            <Input placeholder="Search datasets..." className="max-w-md" />
            <Button>Search</Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Available Datasets</CardTitle>
              <CardDescription>Browse and explore open government datasets</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Dataset</TableHead>
                    <TableHead>Provider</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Last Updated</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {datasets.map((dataset) => (
                    <TableRow key={dataset.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{dataset.name}</span>
                          <span className="text-sm text-muted-foreground">{dataset.description}</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {dataset.columns.map((column) => (
                              <Badge key={column} variant="outline" className="text-xs">
                                {column}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{dataset.provider}</TableCell>
                      <TableCell>{dataset.category}</TableCell>
                      <TableCell>{dataset.lastUpdated}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" asChild>
                            <Link href={`/query?dataset=${dataset.id}`}>
                              <Database className="w-4 h-4 mr-1" />
                              Query
                            </Link>
                          </Button>
                          <Button size="sm" variant="outline">
                            <FileText className="w-4 h-4 mr-1" />
                            Metadata
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </main>

      <footer className="border-t">
        <div className="container py-6 text-sm text-center text-muted-foreground">
          &copy; {new Date().getFullYear()} MainData.id - Simplifying access to Indonesian government data
        </div>
      </footer>
    </div>
  )
}
