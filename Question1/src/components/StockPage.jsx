import React, { useEffect, useState } from "react";
import { fetchWithAuth } from "../api/apiClient";

function StockPage() {
  const [stocks, setStocks] = useState([]);
  const [selectedStock, setSelectedStock] = useState("");
  const [minutes, setMinutes] = useState(30);
  const [priceData, setPriceData] = useState([]);
  const [average, setAverage] = useState(null);

  useEffect(() => {
    fetchWithAuth("http://20.244.56.144/evaluation-service/stocks")
      .then(res => {
        if (!res.ok) throw new Error("Failed to fetch stocks");
        return res.json();
      })
      .then(data => {
        if (!data.stocks) throw new Error("No stocks in response");
        const arr = Object.entries(data.stocks).map(([name, symbol]) => ({
          name,
          symbol,
        }));
        setStocks(arr);
      })
      .catch(err => {
        setStocks([]);
        alert(err.message);
      });
  }, []);

  useEffect(() => {
    if (selectedStock) {
      fetchWithAuth(
        `http://20.244.56.144/evaluation-service/stocks/${selectedStock}?minutes=${minutes}`
      )
        .then(res => {
          if (!res.ok) throw new Error("Failed to fetch price data.");
          return res.json();
        })
        .then(data => {
          setPriceData(data);
          if (data.length > 0) {
            const avg =
              data.reduce((sum, d) => sum + d.price, 0) / data.length;
            setAverage(avg);
          } else {
            setAverage(null);
          }
        })
        .catch(err => {
          setPriceData([]);
          setAverage(null);
          alert(err.message);
        });
    } else {
      setPriceData([]);
      setAverage(null);
    }
  }, [selectedStock, minutes]);

  const handleStockChange = (e) => {
    setSelectedStock(e.target.value);
  };
  const handleMinutesChange = (e) => {
    setMinutes(e.target.value);
  };
  return (
    <div className="max-w-4xl mx-auto bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Stock Price Aggregation</h2>
      <div className="mb-4">
        <label className="block mb-2">Select Stock:</label>
        <select
          value={selectedStock}
          onChange={handleStockChange}
          className="border border-gray-300 rounded p-2 w-full"
        >
          <option value="">-- Select a stock --</option>
          {stocks.map((stock) => (
            <option key={stock.symbol} value={stock.symbol}>
              {stock.name} ({stock.symbol})
            </option>
          ))}
        </select>
      </div>
      <div className="mb-4">
        <label className="block mb-2">Minutes:</label>
        <input
          type="number"
          value={minutes}
          onChange={handleMinutesChange}
          min="1"
          max="1440"
          className="border border-gray-300 rounded p-2 w-full"
        />
      </div>
      {priceData.length > 0 && (
        <>
          <h3 className="text-xl font-semibold mb-2">Price Data</h3>
          <ul className="list-disc pl-5 mb-4">
            {priceData.map((data, index) => (
              <li key={index}>
                {data.timestamp}: ${data.price.toFixed(2)}
              </li>
            ))}
          </ul>
          {average !== null && (
            <p className="font-bold">
              Average Price: ${average.toFixed(2)}
            </p>
          )}
        </>
      )}
    </div>
  );
}

export default StockPage;