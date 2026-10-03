/* ==========================================================================
   INVESTIQ GLOBAL CONFIGURATION & UTILITIES
   Currencies, Personas, Formatting Helpers
   ========================================================================== */

const CONFIG = {
  APP_NAME: 'INVESTIQ',
  APP_SUBTITLE: 'Global Investment Research & Portfolio Intelligence Workspace',
  VERSION: '2.4.0-production',
  
  // API settings
  API_BASE_URL: '/api',
  USE_SERVER_API: true, // Will auto-fallback to client mock if server unreachable

  // Supported Currencies with conversion rates relative to USD (base = 1.0)
  CURRENCIES: {
    USD: { code: 'USD', symbol: '$', rate: 1.0, name: 'US Dollar', format: 'en-US' },
    INR: { code: 'INR', symbol: '₹', rate: 86.5, name: 'Indian Rupee', format: 'en-IN' },
    EUR: { code: 'EUR', symbol: '€', rate: 0.92, name: 'Euro', format: 'de-DE' },
    GBP: { code: 'GBP', symbol: '£', rate: 0.79, name: 'British Pound', format: 'en-GB' },
    JPY: { code: 'JPY', symbol: '¥', rate: 152.0, name: 'Japanese Yen', format: 'ja-JP' }
  },

  DEFAULT_CURRENCY: 'USD',

  // Pre-configured judge/demo personas for 1-click evaluation
  DEMO_PERSONAS: [
    {
      id: 'alex_morgan',
      name: 'Alex Morgan',
      email: 'alex.morgan@investiq.internal',
      role: 'Growth & Global Tech Portfolio',
      currency: 'USD',
      theme: 'dark',
      riskTolerance: 'medium',
      cashBalance: 25000,
      initialHoldings: [
        { symbol: 'AAPL', quantity: 45, avgBuyPrice: 195.20 },
        { symbol: 'NVDA', quantity: 30, avgBuyPrice: 108.50 },
        { symbol: 'MSFT', quantity: 25, avgBuyPrice: 412.00 },
        { symbol: 'RELIANCE', quantity: 120, avgBuyPrice: 28.50 },
        { symbol: 'SAP', quantity: 40, avgBuyPrice: 185.00 },
        { symbol: 'AZN', quantity: 50, avgBuyPrice: 135.00 }
      ]
    },
    {
      id: 'priya_sharma',
      name: 'Priya Sharma',
      email: 'priya.sharma@investiq.internal',
      role: 'Cross-Border Multi-Asset Strategy',
      currency: 'INR',
      theme: 'dark',
      riskTolerance: 'low',
      cashBalance: 500000,
      initialHoldings: [
        { symbol: 'TCS', quantity: 80, avgBuyPrice: 42.10 },
        { symbol: 'HDFCBANK', quantity: 150, avgBuyPrice: 18.90 },
        { symbol: 'INFY', quantity: 110, avgBuyPrice: 21.40 },
        { symbol: 'GOOGL', quantity: 35, avgBuyPrice: 165.00 },
        { symbol: '7203', quantity: 200, avgBuyPrice: 18.20 }
      ]
    },
    {
      id: 'marcus_vance',
      name: 'Marcus Vance',
      email: 'marcus.vance@investiq.internal',
      role: 'Defensive Value & Yield Architecture',
      currency: 'USD',
      theme: 'dark',
      riskTolerance: 'low',
      cashBalance: 40000,
      initialHoldings: [
        { symbol: 'JNJ', quantity: 60, avgBuyPrice: 155.00 },
        { symbol: 'JPM', quantity: 50, avgBuyPrice: 205.00 },
        { symbol: 'SHEL', quantity: 100, avgBuyPrice: 34.00 },
        { symbol: 'ALV', quantity: 45, avgBuyPrice: 270.00 }
      ]
    }
  ]
};

// Global Formatting Utilities
const Utils = {
  // Convert value from USD base to selected currency
  convertCurrency(amountUSD, targetCurrencyCode = 'USD') {
    const curr = CONFIG.CURRENCIES[targetCurrencyCode] || CONFIG.CURRENCIES.USD;
    return amountUSD * curr.rate;
  },

  // Format currency with proper symbol and locale commas
  formatCurrency(amountUSD, targetCurrencyCode = 'USD', decimals = 2) {
    if (isNaN(amountUSD) || amountUSD === null) return '—';
    const curr = CONFIG.CURRENCIES[targetCurrencyCode] || CONFIG.CURRENCIES.USD;
    const converted = amountUSD * curr.rate;

    // Use Intl.NumberFormat
    try {
      return new Intl.NumberFormat(curr.format, {
        style: 'currency',
        currency: curr.code,
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
      }).format(converted);
    } catch (e) {
      return `${curr.symbol}${converted.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;
    }
  },

  // Compact number formatting (e.g. 2.45T, 140.2B, 18.5M)
  formatCompactNumber(num, targetCurrencyCode = 'USD') {
    if (isNaN(num) || num === null) return '—';
    const curr = CONFIG.CURRENCIES[targetCurrencyCode] || CONFIG.CURRENCIES.USD;
    const val = num * curr.rate;
    
    if (Math.abs(val) >= 1e12) return `${curr.symbol}${(val / 1e12).toFixed(2)}T`;
    if (Math.abs(val) >= 1e9) return `${curr.symbol}${(val / 1e9).toFixed(2)}B`;
    if (Math.abs(val) >= 1e6) return `${curr.symbol}${(val / 1e6).toFixed(2)}M`;
    if (Math.abs(val) >= 1e3) return `${curr.symbol}${(val / 1e3).toFixed(1)}K`;
    return `${curr.symbol}${val.toFixed(2)}`;
  },

  // Format percentages with plus sign
  formatPercent(pct, showPlus = true) {
    if (isNaN(pct) || pct === null) return '0.00%';
    const sign = (pct > 0 && showPlus) ? '+' : '';
    return `${sign}${pct.toFixed(2)}%`;
  },

  // Generate unique IDs
  generateId(prefix = 'id') {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  },

  // Debounce utility
  debounce(func, wait) {
    let timeout;
    return function (...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  }
};
