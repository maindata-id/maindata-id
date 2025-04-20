// This is a mock implementation of LLM integration
// In a real application, you would use an actual LLM API

export async function translateToSql(naturalLanguageQuery: string): Promise<{ sql: string; datasetName: string }> {
  console.log("Translating to SQL:", naturalLanguageQuery)

  // Simulate API call delay
  await new Promise((resolve) => setTimeout(resolve, 1200))

  const query = naturalLanguageQuery.toLowerCase()

  // Simple pattern matching to generate SQL
  if (query.includes("penduduk dki jakarta") || query.includes("jakarta")) {
    return {
      sql: "SELECT year, population FROM population_dki ORDER BY year ASC",
      datasetName: "Penduduk DKI Jakarta",
    }
  }

  if (query.includes("anggaran pendidikan") || query.includes("pendidikan")) {
    return {
      sql: "SELECT province, budget FROM education_budget WHERE year = 2022 ORDER BY budget DESC LIMIT 10",
      datasetName: "Anggaran Pendidikan",
    }
  }

  if (query.includes("kemiskinan") || query.includes("poverty")) {
    return {
      sql: "SELECT province, poverty_rate FROM poverty_rate WHERE year = 2022 ORDER BY poverty_rate DESC",
      datasetName: "Angka Kemiskinan",
    }
  }

  if (query.includes("ipm") || query.includes("sumatera barat")) {
    return {
      sql: "SELECT year, AVG(hdi_score) as avg_hdi FROM hdi_data WHERE province = 'Sumatera Barat' AND year >= 2010 GROUP BY year ORDER BY year",
      datasetName: "Indeks Pembangunan Manusia (IPM)",
    }
  }

  // Default fallback
  return {
    sql: "SELECT * FROM population_dki LIMIT 10",
    datasetName: "Dataset tidak ditemukan",
  }
}
