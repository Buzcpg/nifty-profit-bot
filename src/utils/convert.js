const PRICE_API_URL =
  'https://api.coingecko.com/api/v3/simple/price?ids=ethereum,solana&vs_currencies=usd';
const CACHE_TTL_MS = 5 * 60 * 1000;

let cachedRates = null;
let cacheExpiresAt = 0;

async function fetchRates() {
  if (cachedRates && Date.now() < cacheExpiresAt) {
    return cachedRates;
  }

  const response = await fetch(PRICE_API_URL);
  if (!response.ok) {
    throw new Error(`Failed to fetch token prices: ${response.status}`);
  }

  const data = await response.json();
  const ethPrice = Number(data?.ethereum?.usd);
  const solPrice = Number(data?.solana?.usd);

  if (!Number.isFinite(ethPrice) || !Number.isFinite(solPrice)) {
    throw new Error('Invalid token price data returned by CoinGecko');
  }

  cachedRates = {
    USD: 1,
    ETH: ethPrice,
    SOL: solPrice,
  };
  cacheExpiresAt = Date.now() + CACHE_TTL_MS;

  return cachedRates;
}

async function convertToUSD(amount, currency) {
  const normalizedCurrency = String(currency || '').toUpperCase();
  const numericAmount = Number(amount);

  if (!Number.isFinite(numericAmount)) {
    throw new Error('Amount must be a finite number');
  }

  if (normalizedCurrency === 'USD') {
    return numericAmount;
  }

  const rates = await fetchRates();
  const rate = rates[normalizedCurrency];

  if (!rate) {
    throw new Error(`Unsupported currency: ${currency}`);
  }

  return numericAmount * rate;
}

module.exports = {
  convertToUSD,
};
