export interface SqlQueryResult {
  columns: string[];
  rows: any[][];
  rowCount: number;
  executionTime?: number;
}

export const executeQuery = async (query: string): Promise<SqlQueryResult> => {
  const response = await fetch('/api/query/execute', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query }),
  });

  if (!response.ok) {
    throw new Error(`Query execution failed: ${response.statusText}`);
  }

  return response.json();
};