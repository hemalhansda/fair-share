// Currency conversion service
const EXCHANGE_RATE_API = 'https://api.exchangerate-api.com/v4/latest/USD';

// Popular currencies with their symbols and names
export const CURRENCIES = {
  USD: { symbol: '$', name: 'US Dollar', code: 'USD' },
  EUR: { symbol: '€', name: 'Euro', code: 'EUR' },
  GBP: { symbol: '£', name: 'British Pound', code: 'GBP' },
  JPY: { symbol: '¥', name: 'Japanese Yen', code: 'JPY' },
  CNY: { symbol: '¥', name: 'Chinese Yuan', code: 'CNY' },
  INR: { symbol: '₹', name: 'Indian Rupee', code: 'INR' },
  THB: { symbol: '฿', name: 'Thai Baht', code: 'THB' },
  SGD: { symbol: 'S$', name: 'Singapore Dollar', code: 'SGD' },
  AUD: { symbol: 'A$', name: 'Australian Dollar', code: 'AUD' },
  CAD: { symbol: 'C$', name: 'Canadian Dollar', code: 'CAD' },
  CHF: { symbol: 'Fr', name: 'Swiss Franc', code: 'CHF' },
  SEK: { symbol: 'kr', name: 'Swedish Krona', code: 'SEK' },
  NOK: { symbol: 'kr', name: 'Norwegian Krone', code: 'NOK' },
  DKK: { symbol: 'kr', name: 'Danish Krone', code: 'DKK' },
  MXN: { symbol: '$', name: 'Mexican Peso', code: 'MXN' },
  BRL: { symbol: 'R$', name: 'Brazilian Real', code: 'BRL' },
  KRW: { symbol: '₩', name: 'South Korean Won', code: 'KRW' },
  HKD: { symbol: 'HK$', name: 'Hong Kong Dollar', code: 'HKD' },
  NZD: { symbol: 'NZ$', name: 'New Zealand Dollar', code: 'NZD' },
  RUB: { symbol: '₽', name: 'Russian Ruble', code: 'RUB' }
};

// Cache for exchange rates
let exchangeRatesCache = {
  rates: {},
  lastUpdated: null,
  baseCurrency: 'USD'
};

// Cache duration (1 hour)
const CACHE_DURATION = 60 * 60 * 1000;

export async function getExchangeRates(baseCurrency = 'USD') {
  // Check if we have valid cached rates
  const now = new Date().getTime();
  if (
    exchangeRatesCache.lastUpdated &&
    (now - exchangeRatesCache.lastUpdated) < CACHE_DURATION &&
    exchangeRatesCache.baseCurrency === baseCurrency
  ) {
    return { success: true, rates: exchangeRatesCache.rates };
  }

  try {
    const response = await fetch(`https://api.exchangerate-api.com/v4/latest/${baseCurrency}`);
    const data = await response.json();

    if (data && data.rates) {
      // Update cache
      exchangeRatesCache = {
        rates: data.rates,
        lastUpdated: now,
        baseCurrency: baseCurrency
      };

      return { success: true, rates: data.rates };
    } else {
      throw new Error('Invalid response format');
    }
  } catch (error) {
    console.error('Failed to fetch exchange rates:', error);
    
    // Return fallback rates if API fails
    const fallbackRates = getFallbackRates(baseCurrency);
    return { success: false, rates: fallbackRates, error: error.message };
  }
}

// Fallback rates (approximate) in case API fails
function getFallbackRates(baseCurrency) {
  const fallbackRatesFromUSD = {
    USD: 1,
    EUR: 0.85,
    GBP: 0.73,
    JPY: 110,
    CNY: 6.45,
    INR: 74.5,
    THB: 33.5,
    SGD: 1.35,
    AUD: 1.35,
    CAD: 1.25,
    CHF: 0.92,
    SEK: 8.8,
    NOK: 8.6,
    DKK: 6.3,
    MXN: 20.1,
    BRL: 5.2,
    KRW: 1180,
    HKD: 7.8,
    NZD: 1.42,
    RUB: 73.5
  };

  if (baseCurrency === 'USD') {
    return fallbackRatesFromUSD;
  }

  // Convert from USD base to requested base currency
  const baseRate = fallbackRatesFromUSD[baseCurrency];
  if (!baseRate) return fallbackRatesFromUSD;

  const convertedRates = {};
  Object.keys(fallbackRatesFromUSD).forEach(currency => {
    convertedRates[currency] = fallbackRatesFromUSD[currency] / baseRate;
  });

  return convertedRates;
}

export async function convertCurrency(amount, fromCurrency, toCurrency) {
  if (fromCurrency === toCurrency) {
    return { success: true, amount: amount, rate: 1 };
  }

  try {
    const { success, rates } = await getExchangeRates(fromCurrency);
    
    if (rates && rates[toCurrency]) {
      const convertedAmount = amount * rates[toCurrency];
      return { 
        success: true, 
        amount: convertedAmount, 
        rate: rates[toCurrency] 
      };
    } else {
      throw new Error(`Exchange rate not found for ${fromCurrency} to ${toCurrency}`);
    }
  } catch (error) {
    console.error('Currency conversion failed:', error);
    return { 
      success: false, 
      amount: amount, 
      rate: 1, 
      error: error.message 
    };
  }
}

export function formatCurrency(amount, currency = 'USD', showSymbol = true) {
  const currencyInfo = CURRENCIES[currency];
  
  if (!currencyInfo) {
    return showSymbol ? `$${amount.toFixed(2)}` : amount.toFixed(2);
  }

  // Format number with appropriate decimal places
  let decimals = 2;
  if (currency === 'JPY' || currency === 'KRW') {
    decimals = 0; // Yen and Won don't use decimals
  }

  const formattedAmount = amount.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });

  return showSymbol ? `${currencyInfo.symbol}${formattedAmount}` : formattedAmount;
}

export function getCurrencySymbol(currency) {
  return CURRENCIES[currency]?.symbol || '$';
}

export function getCurrencyName(currency) {
  return CURRENCIES[currency]?.name || 'US Dollar';
}

export function getCurrencyOptions() {
  return Object.keys(CURRENCIES).map(code => ({
    value: code,
    label: `${code} - ${CURRENCIES[code].name}`,
    symbol: CURRENCIES[code].symbol
  }));
}