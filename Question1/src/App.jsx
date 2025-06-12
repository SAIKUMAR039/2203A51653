import React, { useState, useEffect } from "react";
import StockPage from "./components/StockPage";
import CorrelationHeatmap from "./components/CorrelationHeatmap";
import { fetchWithAuth } from "./api/apiClient";

function pearsonCorrelation(x, y) {
  const n = x.length;
  if (n === 0) return 0;
  const avgX = x.reduce((a, b) => a + b, 0) / n;
  const avgY = y.reduce((a, b) => a + b, 0) / n;
  const cov = x.reduce((sum, xi, i) => sum + (xi - avgX) * (y[i] - avgY), 0) / n;
  const stdX = Math.sqrt(x.reduce((sum, xi) => sum + (xi - avgX) ** 2, 0) / n);
  const stdY = Math.sqrt(y.reduce((sum, yi) => sum + (yi - avgY) ** 2, 0) / n);
  if (stdX === 0 || stdY === 0) return 0;
  return cov / (stdX * stdY);
}

function App() {
  const [page, setPage] = useState("stock");
  const [loading, setLoading] = useState(false);
  const [stocks, setStocks] = useState([]);
  const [minutes, setMinutes] = useState(30);
  const [priceData, setPriceData] = useState({});
  const [correlationMatrix, setCorrelationMatrix] = useState([]);

  // Fetch all stocks when app loads
  useEffect(() => {
    fetchWithAuth("http://20.244.56.144/evaluation-service/stocks")
      .then(res => res.json())
      .then(data => {
        // If API returns { stocks: { name: symbol, ... } }
        let arr = [];
        if (data.stocks) {
          arr = Object.entries(data.stocks).map(([name, symbol]) => ({
            name,
            symbol,
          }));
        } else if (Array.isArray(data)) {
          arr = data;
        }
        setStocks(arr);
      });
  }, []);

  // Fetch price data for all stocks when heatmap is selected or minutes change
  useEffect(() => {
    if (page !== "heatmap" || stocks.length === 0) return;
    setLoading(true);
    const fetchAll = async () => {
      const allPrices = {};
      for (const stock of stocks) {
        try {
          const res = await fetchWithAuth(
            `http://20.244.56.144/evaluation-service/stocks/${stock.symbol}?minutes=${minutes}`
          );
          const data = await res.json();
          // Assume data is [{price:..., time:...}, ...]
          allPrices[stock.symbol] = data.map(d => d.price);
        } catch {
          allPrices[stock.symbol] = [];
        }
      }
      setPriceData(allPrices);
      setLoading(false);
    };
    fetchAll();
  }, [page, stocks, minutes]);

  // Compute correlation matrix when priceData changes
  useEffect(() => {
    if (page !== "heatmap" || Object.keys(priceData).length === 0) {
      setCorrelationMatrix([]);
      return;
    }
    const symbols = Object.keys(priceData);
    const matrix = symbols.map(row => {
      const rowObj = { stock: row };
      symbols.forEach(col => {
        if (row === col) {
          rowObj[col] = 1;
        } else {
          // Align lengths
          const x = priceData[row];
          const y = priceData[col];
          const minLen = Math.min(x.length, y.length);
          rowObj[col] =
            minLen > 1
              ? pearsonCorrelation(x.slice(-minLen), y.slice(-minLen))
              : 0;
        }
      });
      return rowObj;
    });
    setCorrelationMatrix(matrix);
  }, [priceData, page]);

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <header className="mb-4">
        <h1 className="text-3xl font-bold text-center">Stock Price Aggregation</h1>
      </header>
      <main className="max-w-4xl mx-auto bg-white p-6 rounded-lg shadow-md">
        {page === "stock" ? (
          <StockPage />
        ) : loading ? (
          <div>Loading heatmap...</div>
        ) : (
          <>
            <div className="mb-4">
              <label>
                Minutes:{" "}
                <input
                  type="number"
                  min={1}
                  value={minutes}
                  onChange={e => setMinutes(Number(e.target.value))}
                  className="border p-1"
                />
              </label>
            </div>
            <CorrelationHeatmap data={correlationMatrix} stockPrices={priceData} />
          </>
        )}
        <div className="mt-4">
          <button
            onClick={() => setPage(page === "stock" ? "heatmap" : "stock")}
            className="bg-blue-500 text-white px-4 py-2 rounded"
          >
            {page === "stock" ? "View Correlation Heatmap" : "View Stock Page"}
          </button>
        </div>
      </main>
    </div>
  );
}

export default App;