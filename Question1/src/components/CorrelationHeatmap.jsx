import React, { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';

// Yahoo Finance API Helper
const YAHOO_FINANCE_API = 'https://query1.finance.yahoo.com/v8/finance/chart/';

// Fetch stock data from Yahoo Finance
async function fetchYahooStockData(symbol, period = '1mo') {
  try {
    const url = `${YAHOO_FINANCE_API}${symbol}?period1=0&period2=9999999999&interval=1d&range=${period}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.chart?.result?.[0]?.indicators?.quote?.[0]?.close) {
      const prices = data.chart.result[0].indicators.quote[0].close.filter(price => price !== null);
      return prices.slice(-30); // Get last 30 days
    }
    
    throw new Error('Invalid data structure');
  } catch (error) {
    console.error(`Error fetching data for ${symbol}:`, error);
    return null;
  }
}

// Calculate correlation between two price arrays
function calculateCorrelation(prices1, prices2) {
  if (!prices1 || !prices2 || prices1.length !== prices2.length || prices1.length < 2) {
    return 0;
  }

  const n = prices1.length;
  const sum1 = prices1.reduce((a, b) => a + b, 0);
  const sum2 = prices2.reduce((a, b) => a + b, 0);
  const sum1Sq = prices1.reduce((a, b) => a + b * b, 0);
  const sum2Sq = prices2.reduce((a, b) => a + b * b, 0);
  const pSum = prices1.reduce((sum, val, i) => sum + val * prices2[i], 0);

  const num = pSum - (sum1 * sum2 / n);
  const den = Math.sqrt((sum1Sq - sum1 * sum1 / n) * (sum2Sq - sum2 * sum2 / n));

  return den === 0 ? 0 : num / den;
}

// Helper to calculate statistics
function getStats(prices) {
  if (!prices || prices.length === 0) return { avg: 0, std: 0, min: 0, max: 0 };
  const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
  const std = Math.sqrt(
    prices.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / prices.length
  );
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  return { avg, std, min, max };
}

// Heatmap Component
function StockCorrelationHeatmap({ correlationData, stockData, onStockHover }) {
  const svgRef = useRef();

  useEffect(() => {
    if (!correlationData || correlationData.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const margin = { top: 80, right: 60, bottom: 60, left: 80 };
    const width = 500 - margin.left - margin.right;
    const height = 500 - margin.top - margin.bottom;
    
    // Get unique stocks
    const stocks = Array.from(new Set(correlationData.flatMap(d => [d.stock1, d.stock2])));
    const cellSize = Math.min(width, height) / stocks.length;

    // Create matrix data
    const matrix = [];
    stocks.forEach((rowStock, i) => {
      stocks.forEach((colStock, j) => {
        let correlation = 0;
        if (rowStock === colStock) {
          correlation = 1;
        } else {
          const found = correlationData.find(
            d => (d.stock1 === rowStock && d.stock2 === colStock) ||
                 (d.stock1 === colStock && d.stock2 === rowStock)
          );
          correlation = found ? found.correlation : 0;
        }
        matrix.push({ row: i, col: j, rowStock, colStock, correlation });
      });
    });

    const g = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Color scale
    const colorScale = d3.scaleSequential(d3.interpolateRdYlBu)
      .domain([1, -1]);

    // Create cells
    g.selectAll(".cell")
      .data(matrix)
      .enter().append("rect")
      .attr("class", "cell")
      .attr("x", d => d.col * cellSize)
      .attr("y", d => d.row * cellSize)
      .attr("width", cellSize)
      .attr("height", cellSize)
      .attr("fill", d => colorScale(d.correlation))
      .attr("stroke", "#fff")
      .attr("stroke-width", 1)
      .style("cursor", "pointer")
      .on("mouseenter", function(event, d) {
        onStockHover(d.colStock);
        d3.select(this).attr("stroke-width", 2).attr("stroke", "#000");
      })
      .on("mouseleave", function() {
        onStockHover(null);
        d3.select(this).attr("stroke-width", 1).attr("stroke", "#fff");
      });

    // Add correlation values
    g.selectAll(".text")
      .data(matrix)
      .enter().append("text")
      .attr("x", d => d.col * cellSize + cellSize / 2)
      .attr("y", d => d.row * cellSize + cellSize / 2)
      .attr("dy", ".35em")
      .attr("text-anchor", "middle")
      .style("fill", d => Math.abs(d.correlation) > 0.6 ? "white" : "black")
      .style("font-size", "10px")
      .style("font-weight", "bold")
      .style("pointer-events", "none")
      .text(d => d.correlation.toFixed(2));

    // Add labels
    g.selectAll(".row-label")
      .data(stocks)
      .enter().append("text")
      .attr("x", -10)
      .attr("y", (d, i) => i * cellSize + cellSize / 2)
      .attr("dy", ".35em")
      .style("text-anchor", "end")
      .style("font-size", "12px")
      .style("font-weight", "bold")
      .text(d => d);

    g.selectAll(".col-label")
      .data(stocks)
      .enter().append("text")
      .attr("x", (d, i) => i * cellSize + cellSize / 2)
      .attr("y", -10)
      .attr("dy", ".35em")
      .style("text-anchor", "middle")
      .style("font-size", "12px")
      .style("font-weight", "bold")
      .text(d => d);

    // Title
    svg.append("text")
      .attr("x", width / 2 + margin.left)
      .attr("y", 30)
      .attr("text-anchor", "middle")
      .style("font-size", "16px")
      .style("font-weight", "bold")
      .text("Stock Correlation Heatmap (Yahoo Finance Data)");

  }, [correlationData, stockData, onStockHover]);

  return (
    <svg
      ref={svgRef}
      width={500}
      height={500}
      className="border border-gray-300 rounded-lg shadow-lg"
    />
  );
}

// Main Component
export default function YahooStockHeatmap() {
  const [stockData, setStockData] = useState({});
  const [correlationData, setCorrelationData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hoveredStock, setHoveredStock] = useState(null);
  const [symbols, setSymbols] = useState(['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'AMZN']);
  const [useDemo, setUseDemo] = useState(true);

  // Demo data
  const demoData = {
    AAPL: [150, 152, 148, 155, 153, 157, 154, 158, 156, 160, 162, 159, 165, 163, 168],
    GOOGL: [2800, 2820, 2790, 2850, 2830, 2870, 2840, 2880, 2860, 2900, 2920, 2890, 2950, 2930, 2980],
    MSFT: [300, 305, 295, 310, 307, 315, 308, 318, 312, 320, 325, 318, 330, 328, 335],
    TSLA: [800, 820, 780, 850, 830, 870, 840, 880, 860, 900, 920, 890, 950, 930, 980],
    AMZN: [3200, 3250, 3180, 3300, 3270, 3350, 3320, 3380, 3360, 3420, 3450, 3390, 3480, 3460, 3520]
  };

  const fetchRealData = async () => {
    setLoading(true);
    setError('');
    
    try {
      const promises = symbols.map(symbol => fetchYahooStockData(symbol));
      const results = await Promise.all(promises);
      
      const newStockData = {};
      const failedSymbols = [];
      
      symbols.forEach((symbol, index) => {
        if (results[index]) {
          newStockData[symbol] = results[index];
        } else {
          failedSymbols.push(symbol);
        }
      });
      
      if (failedSymbols.length > 0) {
        setError(`Failed to fetch data for: ${failedSymbols.join(', ')}`);
      }
      
      if (Object.keys(newStockData).length > 1) {
        setStockData(newStockData);
        generateCorrelations(newStockData);
      } else {
        throw new Error('Not enough valid stock data retrieved');
      }
      
    } catch (err) {
      setError(`Error fetching data: ${err.message}`);
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const generateCorrelations = (data) => {
    const correlations = [];
    const stockSymbols = Object.keys(data);
    
    for (let i = 0; i < stockSymbols.length; i++) {
      for (let j = i; j < stockSymbols.length; j++) {
        const stock1 = stockSymbols[i];
        const stock2 = stockSymbols[j];
        const correlation = stock1 === stock2 ? 1 : calculateCorrelation(data[stock1], data[stock2]);
        
        correlations.push({ stock1, stock2, correlation });
      }
    }
    
    setCorrelationData(correlations);
  };

  const loadDemoData = () => {
    setStockData(demoData);
    generateCorrelations(demoData);
    setError('');
  };

  useEffect(() => {
    if (useDemo) {
      loadDemoData();
    }
  }, [useDemo]);

  const stats = hoveredStock && stockData[hoveredStock] ? getStats(stockData[hoveredStock]) : null;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-6 text-gray-800">
          Stock Correlation Analysis
        </h1>
        
        {/* Controls */}
        <div className="bg-white p-4 rounded-lg shadow-md mb-6">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={useDemo}
                  onChange={(e) => setUseDemo(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm font-medium">Use Demo Data</span>
              </label>
              
              <input
                type="text"
                value={symbols.join(', ')}
                onChange={(e) => setSymbols(e.target.value.split(',').map(s => s.trim().toUpperCase()))}
                placeholder="Enter stock symbols (e.g., AAPL, GOOGL, MSFT)"
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                disabled={useDemo}
              />
            </div>
            
            <button
              onClick={fetchRealData}
              disabled={loading || useDemo}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm font-medium"
            >
              {loading ? 'Loading...' : 'Fetch Real Data'}
            </button>
          </div>
          
          {error && (
            <div className="mt-3 p-3 bg-red-100 border border-red-300 rounded-md text-red-700 text-sm">
              {error}
              <div className="mt-2 text-xs">
                Note: Yahoo Finance may block requests due to CORS policy. Demo data is recommended for testing.
              </div>
            </div>
          )}
        </div>

        {/* Heatmap */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          {correlationData.length > 0 ? (
            <StockCorrelationHeatmap
              correlationData={correlationData}
              stockData={stockData}
              onStockHover={setHoveredStock}
            />
          ) : (
            <div className="text-center py-8 text-gray-500">
              {loading ? 'Loading stock data...' : 'No data available'}
            </div>
          )}
        </div>

        {/* Stats Panel */}
        {stats && hoveredStock && (
          <div className="mt-6 bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-3">{hoveredStock} Statistics</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">${stats.avg.toFixed(2)}</div>
                <div className="text-sm text-gray-600">Average Price</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">${stats.std.toFixed(2)}</div>
                <div className="text-sm text-gray-600">Volatility (Std Dev)</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">${stats.min.toFixed(2)}</div>
                <div className="text-sm text-gray-600">Minimum</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">${stats.max.toFixed(2)}</div>
                <div className="text-sm text-gray-600">Maximum</div>
              </div>
            </div>
          </div>
        )}

        {/* Color Legend */}
        <div className="mt-6 bg-white p-4 rounded-lg shadow-md">
          <h4 className="font-semibold mb-3">Correlation Strength</h4>
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-700 rounded"></div>
              <span>Strong Positive (0.7+)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-300 rounded"></div>
              <span>Weak Positive (0.3-0.7)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-yellow-200 rounded"></div>
              <span>Neutral (-0.3-0.3)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-300 rounded"></div>
              <span>Weak Negative (-0.7--0.3)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-700 rounded"></div>
              <span>Strong Negative (-0.7+)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}