# Stock Price Aggregation & Average Calculator

This repository contains solutions to two questions:

- **Question 1:** Stock Price Aggregation and Correlation Visualization (React + Vite)
- **Question 2:** Average Calculator HTTP Microservice (Node.js + Express)

---

## Question 1: Stock Price Aggregation (Frontend)

A React application to fetch, display, and analyze stock price data, including a correlation heatmap.

### Features

- Fetches stock list and price data from a remote API.
- Displays price history and computes average price for selected stocks.
- Visualizes correlation between stocks using a heatmap.

### How to Run

1. Navigate to the `Question1` directory:
   ```sh
   cd Question1
   ```
2. Install dependencies:
   ```sh
   npm install
   ```
3. Start the development server:
   ```sh
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Question 2: Average Calculator Microservice (Backend)

A Node.js Express microservice that fetches numbers from a 3rd party API and maintains a moving window average.

### Features

- Exposes a GET endpoint `/numbers/:type` where `type` can be `primes`, `fibo`, `even`, or `rand`.
- Maintains a window of the last 10 unique numbers.
- Returns the current window, previous window state, fetched numbers, and the average.

### How to Run

1. Navigate to the `Question2` directory:
   ```sh
   cd Question2
   ```
2. Install dependencies:
   ```sh
   npm install
   ```
3. Start the server:
   ```sh
   npm start
   ```
4. The service will run on [http://localhost:9876](http://localhost:9876).

#### Example API Usage

```
GET /numbers/primes
```

Response:
```json
{
  "windowPrevState": [1,2,3],
  "windowCurrState": [1,2,3,5,7],
  "numbers": [5,7],
  "avg": 3.6
}
```

---

## Notes

- All credentials and API endpoints are for evaluation purposes only.
- No personal or organization names are included in this repository.

---
