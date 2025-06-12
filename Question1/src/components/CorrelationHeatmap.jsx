import React, { useEffect, useState } from "react";
import { ResponsiveHeatMap } from "@nivo/heatmap";

// Helper to calculate average and standard deviation
function getStats(prices) {
  if (!prices || prices.length === 0) return { avg: 0, std: 0 };
  const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
  const std = Math.sqrt(
    prices.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / prices.length
  );
  return { avg, std };
}

const colorLegend = [
  { label: "Strong Negative", color: "#2166ac" },
  { label: "Weak Negative", color: "#67a9cf" },
  { label: "Neutral", color: "#f7f7f7" },
  { label: "Weak Positive", color: "#fdae61" },
  { label: "Strong Positive", color: "#b2182b" },
];

function CorrelationHeatmap({ data, stockPrices = {} }) {
  const [heatmapData, setHeatmapData] = useState([]);
  const [keys, setKeys] = useState([]);
  const [hoveredStock, setHoveredStock] = useState(null);
  const [stats, setStats] = useState({ avg: 0, std: 0 });

  useEffect(() => {
    if (!data || data.length === 0) {
      setHeatmapData([]);
      setKeys([]);
      return;
    }
    // Convert flat list to matrix
    const stocks = Array.from(new Set(data.flatMap(d => [d.stock1, d.stock2])));
    setKeys(stocks);
    const matrix = stocks.map(rowStock => {
      const row = { stock: rowStock };
      stocks.forEach(colStock => {
        if (rowStock === colStock) {
          row[colStock] = 1;
        } else {
          const found = data.find(
            d =>
              (d.stock1 === rowStock && d.stock2 === colStock) ||
              (d.stock1 === colStock && d.stock2 === rowStock)
          );
          row[colStock] = found ? Number(found.correlation) : 0;
        }
      });
      return row;
    });
    setHeatmapData(matrix);
  }, [data]);

  // Update stats when hovered stock changes
  useEffect(() => {
    if (hoveredStock && stockPrices[hoveredStock]) {
      setStats(getStats(stockPrices[hoveredStock]));
    } else {
      setStats({ avg: 0, std: 0 });
    }
  }, [hoveredStock, stockPrices]);

  if (!heatmapData.length || !keys.length) {
    return <div style={{ padding: 20, color: "red" }}>Invalid or insufficient data for heatmap.</div>;
  }

  return (
    <div>
      <div style={{ height: 500 }}>
        <ResponsiveHeatMap
          data={heatmapData}
          keys={keys}
          indexBy="stock"
          margin={{ top: 60, right: 60, bottom: 60, left: 60 }}
          forceSquare={true}
          axisTop={{
            tickSize: 5,
            tickPadding: 5,
            tickRotation: -45,
            legend: "Stocks",
            legendPosition: "middle",
            legendOffset: -40,
          }}
          axisRight={null}
          axisBottom={{
            tickSize: 5,
            tickPadding: 5,
            tickRotation: -45,
            legend: "Correlation",
            legendPosition: "middle",
            legendOffset: 36,
          }}
          colors={{
            type: "diverging",
            scheme: "red_yellow_blue",
            divergeAt: 0.5,
            minValue: -1,
            maxValue: 1,
          }}
          cellOpacity={1}
          cellBorderColor={{ from: "color", modifiers: [["darker", 0.1]] }}
          onMouseEnter={cell => setHoveredStock(cell.column)}
          onMouseLeave={() => setHoveredStock(null)}
        />
      </div>
      <div style={{ marginTop: 16 }}>
        <strong>Color Legend:</strong>
        <div style={{ display: "flex", gap: 16, marginTop: 8 }}>
          {colorLegend.map(l => (
            <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ width: 20, height: 20, background: l.color, display: "inline-block", border: "1px solid #ccc" }} />
              <span>{l.label}</span>
            </div>
          ))}
        </div>
      </div>
      {hoveredStock && (
        <div style={{ marginTop: 16 }}>
          <strong>{hoveredStock} (last 'm' min):</strong>
          <div>Average: {stats.avg.toFixed(2)}</div>
          <div>Std Dev: {stats.std.toFixed(2)}</div>
        </div>
      )}
    </div>
  );
}

export default CorrelationHeatmap;