import express from 'express';
import fetch from 'node-fetch';

const app = express();
app.use(express.json());

// Helper to get numbers from 3rd party APIs
async function fetchNumbers(type, url, numbers) {
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ numbers })
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.numbers || [];
  } catch {
    return [];
  }
}

// Helper to get random numbers (GET)
async function fetchRandom(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    return data.numbers || [];
  } catch {
    return [];
  }
}

// In-memory window
let windowNumbers = [];
const WINDOW_SIZE = 10;

app.get('/numbers/:type', async (req, res) => {
  const { type } = req.params;
  let apiUrl = '';
  let nums = [];
  let from3rdParty = false;

  if (type === 'primes') {
    apiUrl = 'http://20.244.56.144/evaluation-service/primes';
    from3rdParty = true;
  } else if (type === 'fibo') {
    apiUrl = 'http://20.244.56.144/evaluation-service/fibo';
    from3rdParty = true;
  } else if (type === 'even') {
    apiUrl = 'http://20.244.56.144/evaluation-service/even';
    from3rdParty = true;
  } else if (type === 'rand') {
    apiUrl = 'http://20.244.56.144/evaluation-service/rand';
    from3rdParty = true;
  } else {
    return res.status(400).json({ error: 'Invalid type' });
  }

  try {
    if (type === 'rand') {
      nums = await fetchRandom(apiUrl);
    } else {
      // For primes, fibo, even: get numbers from window
      nums = await fetchNumbers(type, apiUrl, windowNumbers);
    }
  } catch {
    nums = [];
  }

  // Merge, deduplicate, keep only last WINDOW_SIZE
  const newSet = new Set([...windowNumbers, ...nums]);
  windowNumbers = Array.from(newSet).slice(-WINDOW_SIZE);

  // Calculate average
  const avg = windowNumbers.length
    ? windowNumbers.reduce((a, b) => a + b, 0) / windowNumbers.length
    : 0;

  res.json({
    windowPrevState: windowNumbers.slice(0, -nums.length),
    windowCurrState: windowNumbers,
    numbers: nums,
    avg: Number(avg.toFixed(2)),
  });
});

const PORT = 9876;
app.listen(PORT, () => {
  console.log(`Average Calculator Microservice running on port ${PORT}`);
});
