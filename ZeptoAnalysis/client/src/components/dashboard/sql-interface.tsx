import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Terminal, Play, Copy, RotateCcw, Clock, CheckCircle } from "lucide-react";
import { executeQuery, type SqlQueryResult } from "@/lib/api";

const SqlInterface = () => {
  const [query, setQuery] = useState("");
  const [queryResult, setQueryResult] = useState<SqlQueryResult | null>(null);
  const { toast } = useToast();

  const sampleQueries = [
    {
      title: "Top 10 discounted products",
      description: "Products with highest discount percentages",
      query: "SELECT name, category, mrp/100 as mrp_rupees, discount_percent, discounted_selling_price/100 as sale_price_rupees FROM zepto WHERE discount_percent > 0 ORDER BY discount_percent DESC LIMIT 10;"
    },
    {
      title: "Revenue by category",
      description: "Total revenue grouped by product category",
      query: "SELECT category, COUNT(*) as product_count, SUM(discounted_selling_price)/100 as total_revenue_rupees, AVG(discount_percent) as avg_discount FROM zepto GROUP BY category ORDER BY total_revenue_rupees DESC;"
    },
    {
      title: "Out of stock products",
      description: "All products currently out of stock",
      query: "SELECT name, category, mrp/100 as mrp_rupees, available_quantity FROM zepto WHERE out_of_stock = TRUE ORDER BY category, name;"
    },
    {
      title: "High-value low-discount products",
      description: "Expensive products with minimal discounts",
      query: "SELECT name, category, mrp/100 as mrp_rupees, discount_percent, discounted_selling_price/100 as sale_price_rupees FROM zepto WHERE mrp > 50000 AND discount_percent < 10 ORDER BY mrp DESC;"
    },
    {
      title: "Category-wise stock summary",
      description: "Stock status summary by category",
      query: "SELECT category, COUNT(*) as total_products, SUM(CASE WHEN out_of_stock = FALSE THEN 1 ELSE 0 END) as in_stock, SUM(CASE WHEN out_of_stock = TRUE THEN 1 ELSE 0 END) as out_of_stock FROM zepto GROUP BY category ORDER BY total_products DESC;"
    },
    {
      title: "Weight distribution analysis",
      description: "Products grouped by weight ranges",
      query: "SELECT CASE WHEN weight_in_gms < 100 THEN 'Under 100g' WHEN weight_in_gms < 500 THEN '100g-500g' WHEN weight_in_gms < 1000 THEN '500g-1kg' WHEN weight_in_gms < 5000 THEN '1kg-5kg' ELSE 'Over 5kg' END as weight_range, COUNT(*) as product_count, AVG(discount_percent) as avg_discount FROM zepto GROUP BY weight_range ORDER BY MIN(weight_in_gms);"
    }
  ];

  const executeQueryMutation = useMutation({
    mutationFn: (queryText: string) => executeQuery(queryText),
    onSuccess: (result) => {
      setQueryResult(result);
      toast({
        title: "Query executed successfully",
        description: `Returned ${result.rowCount} rows in ${result.executionTime}ms`,
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Query execution failed",
        description: error.message,
      });
      setQueryResult(null);
    },
  });

  const handleExecuteQuery = () => {
    if (!query.trim()) {
      toast({
        variant: "destructive",
        title: "Empty query",
        description: "Please enter a SQL query to execute",
      });
      return;
    }
    executeQueryMutation.mutate(query);
  };

  const handleSampleQueryClick = (sampleQuery: string) => {
    setQuery(sampleQuery);
  };

  const handleClearQuery = () => {
    setQuery("");
    setQueryResult(null);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: "Query has been copied to your clipboard",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <Terminal className="w-8 h-8 text-primary" />
        <div>
          <h2 className="text-2xl font-bold text-gray-900">SQL Query Interface</h2>
          <p className="text-gray-600">Execute custom SQL queries on your inventory data safely</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Query Input Section */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Terminal className="w-5 h-5" />
                <span>SQL Query</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="SELECT * FROM zepto WHERE category = 'Fruits & Vegetables' LIMIT 10;"
                className="h-32 font-mono text-sm resize-none"
                spellCheck={false}
              />
              <div className="flex space-x-3">
                <Button
                  onClick={handleExecuteQuery}
                  disabled={executeQueryMutation.isPending}
                  className="gradient-bg"
                >
                  {executeQueryMutation.isPending ? (
                    <>
                      <Clock className="w-4 h-4 mr-2 animate-spin" />
                      Executing...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      Execute Query
                    </>
                  )}
                </Button>
                <Button variant="outline" onClick={handleClearQuery}>
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Clear
                </Button>
                <Button
                  variant="outline"
                  onClick={() => copyToClipboard(query)}
                  disabled={!query.trim()}
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Sample Queries */}
          <Card>
            <CardHeader>
              <CardTitle>Sample Queries</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {sampleQueries.map((sample, index) => (
                  <button
                    key={index}
                    onClick={() => handleSampleQueryClick(sample.query)}
                    className="w-full text-left p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="text-sm font-medium text-gray-900">{sample.title}</div>
                    <div className="text-xs text-gray-500 mt-1">{sample.description}</div>
                    <div className="text-xs text-gray-400 mt-1 font-mono truncate">
                      {sample.query}
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Query Results Section */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Query Results</span>
                {queryResult && (
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <span className="flex items-center">
                      <CheckCircle className="w-4 h-4 mr-1 text-green-500" />
                      {queryResult.rowCount} rows
                    </span>
                    <span className="flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      {queryResult.executionTime}ms
                    </span>
                  </div>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {executeQueryMutation.isPending ? (
                <div className="space-y-2">
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-6 w-1/2" />
                </div>
              ) : queryResult ? (
                <div className="space-y-4">
                  {queryResult.rowCount > 0 ? (
                    <div className="overflow-auto max-h-96">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 sticky top-0">
                          <tr>
                            {queryResult.columns.map((column, index) => (
                              <th
                                key={index}
                                className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b"
                              >
                                {column}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {queryResult.rows.map((row, rowIndex) => (
                            <tr key={rowIndex} className="hover:bg-gray-50">
                              {row.map((cell, cellIndex) => (
                                <td
                                  key={cellIndex}
                                  className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 border-b"
                                >
                                  {cell !== null && cell !== undefined ? String(cell) : ''}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Terminal className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p>Query executed successfully but returned no results</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Terminal className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>Query results will appear here...</p>
                  <p className="text-sm mt-2">Select a sample query or write your own to get started</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Query Guidelines */}
          <Card className="bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle className="text-blue-800">Query Guidelines</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-blue-700 space-y-2">
              <div>• Only SELECT statements are allowed for security</div>
              <div>• Price fields (mrp, discounted_selling_price) are stored in paise</div>
              <div>• Use /100 to convert to rupees: mrp/100 as mrp_rupees</div>
              <div>• Boolean fields: out_of_stock (TRUE/FALSE)</div>
              <div>• Main table: zepto</div>
              <div>• Key columns: category, name, mrp, discount_percent, available_quantity</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SqlInterface;
