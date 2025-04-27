/**
 * Utility functions for parsing SQL queries
 */

/**
 * Splits a SQL string into individual queries based on semicolons
 * Respects string literals and comments
 *
 * @param sql The SQL string containing multiple queries
 * @returns Array of individual SQL queries
 */
export function splitSqlQueries(sql: string): string[] {
  if (!sql.trim()) return []

  const queries: string[] = []
  let currentQuery = ""
  let inSingleQuote = false
  let inDoubleQuote = false
  let inLineComment = false
  let inBlockComment = false

  for (let i = 0; i < sql.length; i++) {
    const char = sql[i]
    const nextChar = i < sql.length - 1 ? sql[i + 1] : ""

    // Handle string literals
    if (char === "'" && !inDoubleQuote && !inLineComment && !inBlockComment) {
      inSingleQuote = !inSingleQuote
    } else if (char === '"' && !inSingleQuote && !inLineComment && !inBlockComment) {
      inDoubleQuote = !inDoubleQuote
    }

    // Handle comments
    else if (char === "-" && nextChar === "-" && !inSingleQuote && !inDoubleQuote && !inBlockComment) {
      inLineComment = true
      currentQuery += char
      continue
    } else if (char === "\n" && inLineComment) {
      inLineComment = false
    } else if (char === "/" && nextChar === "*" && !inSingleQuote && !inDoubleQuote && !inLineComment) {
      inBlockComment = true
      currentQuery += char
      continue
    } else if (char === "*" && nextChar === "/" && inBlockComment) {
      inBlockComment = false
      currentQuery += char + nextChar
      i++ // Skip the next character
      continue
    }

    // Handle semicolons (query separators)
    if (char === ";" && !inSingleQuote && !inDoubleQuote && !inLineComment && !inBlockComment) {
      currentQuery += char
      const trimmedQuery = currentQuery.trim()
      if (trimmedQuery) {
        queries.push(trimmedQuery)
      }
      currentQuery = ""
    } else {
      currentQuery += char
    }
  }

  // Add the last query if there's no trailing semicolon
  const trimmedQuery = currentQuery.trim()
  if (trimmedQuery) {
    queries.push(trimmedQuery)
  }

  return queries
}

/**
 * Checks if a SQL query is a DDL (Data Definition Language) statement
 *
 * @param sql The SQL query to check
 * @returns True if the query is a DDL statement
 */
export function isDdlStatement(sql: string): boolean {
  const ddlPatterns = [
    /^\s*create\s+/i,
    /^\s*alter\s+/i,
    /^\s*drop\s+/i,
    /^\s*truncate\s+/i,
    /^\s*rename\s+/i,
    /^\s*comment\s+on\s+/i,
  ]

  return ddlPatterns.some((pattern) => pattern.test(sql))
}

/**
 * Checks if a SQL query is a DML (Data Manipulation Language) statement that modifies data
 *
 * @param sql The SQL query to check
 * @returns True if the query is a DML statement that modifies data
 */
export function isDataModifyingStatement(sql: string): boolean {
  const dmlPatterns = [/^\s*insert\s+/i, /^\s*update\s+/i, /^\s*delete\s+/i, /^\s*merge\s+/i]

  return dmlPatterns.some((pattern) => pattern.test(sql))
}

/**
 * Gets a short description of what a SQL query does
 *
 * @param sql The SQL query
 * @returns A short description of the query
 */
export function getQueryDescription(sql: string): string {
  const trimmedSql = sql.trim().toLowerCase()

  if (trimmedSql.startsWith("create table")) {
    const tableName = extractTableName(trimmedSql, "create table")
    return `Created table ${tableName}`
  } else if (trimmedSql.startsWith("create view")) {
    const viewName = extractTableName(trimmedSql, "create view")
    return `Created view ${viewName}`
  } else if (trimmedSql.startsWith("insert into")) {
    const tableName = extractTableName(trimmedSql, "insert into")
    return `Inserted data into ${tableName}`
  } else if (trimmedSql.startsWith("update")) {
    const tableName = extractTableName(trimmedSql, "update")
    return `Updated data in ${tableName}`
  } else if (trimmedSql.startsWith("delete from")) {
    const tableName = extractTableName(trimmedSql, "delete from")
    return `Deleted data from ${tableName}`
  } else if (trimmedSql.startsWith("drop table")) {
    const tableName = extractTableName(trimmedSql, "drop table")
    return `Dropped table ${tableName}`
  } else if (trimmedSql.startsWith("alter table")) {
    const tableName = extractTableName(trimmedSql, "alter table")
    return `Modified table ${tableName}`
  } else if (trimmedSql.startsWith("select")) {
    return "Query executed"
  }

  return "Statement executed"
}

/**
 * Helper function to extract table name from SQL statement
 */
function extractTableName(sql: string, prefix: string): string {
  try {
    const afterPrefix = sql.substring(prefix.length).trim()
    // Extract the first word after the prefix
    const match = afterPrefix.match(/^(\w+|"[^"]+"|'[^']+')/)
    if (match) {
      return match[0].replace(/['"]/g, "")
    }
    return "table"
  } catch (e) {
    return "table"
  }
}
