# Average Calculator HTTP Microservice

## How to run

1. Install dependencies:
   ```sh
   npm install
   ```
2. Start the server:
   ```sh
   npm start
   ```

The service will run on [http://localhost:9876](http://localhost:9876).

## API Usage

### GET /numbers/:type
- `type` can be `primes`, `fibo`, `even`, or `rand`.
- Returns the average of the last 10 unique numbers received from the 3rd party server, and the current window.

#### Example Response
```
{
  "windowPrevState": [1,2,3],
  "windowCurrState": [1,2,3,5,7],
  "numbers": [5,7],
  "avg": 3.6
}
```

## Notes
- The window always contains the last 10 unique numbers (no duplicates).
- For `rand`, numbers are fetched from the random API (GET). For others, numbers are fetched by POSTing the current window to the respective API.
- The average is calculated over the current window.
