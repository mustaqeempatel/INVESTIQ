/* ==========================================================================
   INVESTIQ GLOBAL MARKET DATA ENGINE
   Multi-Region Coverage: USA, India, UK, Germany, Japan, Canada, Australia
   ========================================================================== */

const MarketDataService = {
  // Global Market Indices
  indices: [
    { symbol: '^GSPC', name: 'S&P 500', region: 'USA', price: 5864.67, changePct: 0.82, volume: '2.8B' },
    { symbol: '^IXIC', name: 'NASDAQ', region: 'USA', price: 18489.55, changePct: 1.15, volume: '3.9B' },
    { symbol: '^NSEI', name: 'NIFTY 50', region: 'India', price: 25014.60, changePct: 0.54, volume: '1.2B' },
    { symbol: '^BSESN', name: 'SENSEX', region: 'India', price: 81688.45, changePct: 0.48, volume: '850M' },
    { symbol: '^FTSE', name: 'FTSE 100', region: 'UK', price: 8243.60, changePct: -0.28, volume: '620M' },
    { symbol: '^GDAXI', name: 'DAX 40', region: 'Germany', price: 19412.30, changePct: 0.38, volume: '580M' },
    { symbol: '^N225', name: 'NIKKEI 225', region: 'Japan', price: 39605.80, changePct: 0.72, volume: '1.1B' },
    { symbol: '^GSPTSE', name: 'TSX 60', region: 'Canada', price: 1475.20, changePct: 0.15, volume: '410M' },
    { symbol: '^AXJO', name: 'ASX 200', region: 'Australia', price: 8284.40, changePct: -0.12, volume: '390M' }
  ],

  // 60+ Real Global Companies with Detailed Financial & Risk Metrics (USD base prices)
  companies: [
    // --- UNITED STATES (NASDAQ / NYSE) ---
    {
      symbol: 'AAPL',
      name: 'Apple Inc.',
      exchange: 'NASDAQ',
      country: 'USA',
      flag: '🇺🇸',
      sector: 'Technology',
      industry: 'Consumer Electronics',
      price: 231.40,
      changePct: 1.34,
      volume: 48920000,
      marketCap: 3520000000000,
      high52: 237.23,
      low52: 164.08,
      pe: 34.2,
      eps: 6.76,
      beta: 1.05,
      dividendYield: 0.43,
      revenue: 385600000000,
      netProfit: 100370000000,
      volatility30d: 14.8,
      maxDrawdown1y: -11.4,
      riskLevel: 'LOW',
      description: 'Apple Inc. designs, manufactures, and markets smartphones, personal computers, tablets, wearables, and accessories, alongside cloud, payment, and media services.'
    },
    {
      symbol: 'MSFT',
      name: 'Microsoft Corporation',
      exchange: 'NASDAQ',
      country: 'USA',
      flag: '🇺🇸',
      sector: 'Technology',
      industry: 'Software - Infrastructure',
      price: 428.15,
      changePct: 0.95,
      volume: 19800000,
      marketCap: 3180000000000,
      high52: 468.35,
      low52: 326.93,
      pe: 35.8,
      eps: 11.95,
      beta: 1.18,
      dividendYield: 0.70,
      revenue: 245100000000,
      netProfit: 88130000000,
      volatility30d: 16.2,
      maxDrawdown1y: -12.8,
      riskLevel: 'LOW',
      description: 'Microsoft develops and licenses software products, cloud computing platforms (Azure), developer tools, productivity suites, and hardware devices globally.'
    },
    {
      symbol: 'NVDA',
      name: 'NVIDIA Corporation',
      exchange: 'NASDAQ',
      country: 'USA',
      flag: '🇺🇸',
      sector: 'Technology',
      industry: 'Semiconductors',
      price: 135.58,
      changePct: 3.24,
      volume: 58240000,
      marketCap: 3320000000000,
      high52: 140.76,
      low52: 40.85,
      pe: 58.4,
      eps: 2.32,
      beta: 1.94,
      dividendYield: 0.03,
      revenue: 96310000000,
      netProfit: 53040000000,
      volatility30d: 32.5,
      maxDrawdown1y: -26.9,
      riskLevel: 'HIGH',
      description: 'NVIDIA pioneers GPU accelerated computing, delivering advanced chips, supercomputing clusters, and full-stack enterprise AI architectures.'
    },
    {
      symbol: 'GOOGL',
      name: 'Alphabet Inc.',
      exchange: 'NASDAQ',
      country: 'USA',
      flag: '🇺🇸',
      sector: 'Communication Services',
      industry: 'Internet Content & Information',
      price: 168.22,
      changePct: -0.45,
      volume: 22100000,
      marketCap: 2090000000000,
      high52: 191.75,
      low52: 121.46,
      pe: 23.9,
      eps: 7.03,
      beta: 1.12,
      dividendYield: 0.48,
      revenue: 328200000000,
      netProfit: 87660000000,
      volatility30d: 18.1,
      maxDrawdown1y: -15.2,
      riskLevel: 'LOW',
      description: 'Alphabet provides web search, cloud infrastructure (Google Cloud), streaming entertainment (YouTube), mobile OS (Android), and machine learning research.'
    },
    {
      symbol: 'AMZN',
      name: 'Amazon.com, Inc.',
      exchange: 'NASDAQ',
      country: 'USA',
      flag: '🇺🇸',
      sector: 'Consumer Cyclical',
      industry: 'Internet Retail',
      price: 189.05,
      changePct: 1.12,
      volume: 33400000,
      marketCap: 1970000000000,
      high52: 201.20,
      low52: 118.35,
      pe: 43.1,
      eps: 4.38,
      beta: 1.28,
      dividendYield: 0.00,
      revenue: 604300000000,
      netProfit: 44250000000,
      volatility30d: 20.4,
      maxDrawdown1y: -17.8,
      riskLevel: 'MEDIUM',
      description: 'Amazon operates global retail e-commerce, cloud computing services (AWS), digital advertising networks, and autonomous logistics systems.'
    },
    {
      symbol: 'TSLA',
      name: 'Tesla, Inc.',
      exchange: 'NASDAQ',
      country: 'USA',
      flag: '🇺🇸',
      sector: 'Consumer Cyclical',
      industry: 'Auto Manufacturers',
      price: 218.40,
      changePct: -2.35,
      volume: 67100000,
      marketCap: 698000000000,
      high52: 271.00,
      low52: 138.80,
      pe: 62.7,
      eps: 3.48,
      beta: 2.38,
      dividendYield: 0.00,
      revenue: 97800000000,
      netProfit: 12580000000,
      volatility30d: 38.6,
      maxDrawdown1y: -36.4,
      riskLevel: 'HIGH',
      description: 'Tesla designs, manufactures, and sells electric vehicles, energy generation and storage systems, and develops Full Self-Driving AI models.'
    },
    {
      symbol: 'JPM',
      name: 'JPMorgan Chase & Co.',
      exchange: 'NYSE',
      country: 'USA',
      flag: '🇺🇸',
      sector: 'Financial',
      industry: 'Banks - Diversified',
      price: 222.80,
      changePct: 0.65,
      volume: 9400000,
      marketCap: 635000000000,
      high52: 225.50,
      low52: 140.20,
      pe: 12.4,
      eps: 17.96,
      beta: 0.98,
      dividendYield: 2.06,
      revenue: 162400000000,
      netProfit: 54100000000,
      volatility30d: 13.1,
      maxDrawdown1y: -9.8,
      riskLevel: 'LOW',
      description: 'JPMorgan Chase is one of the oldest and largest financial institutions, offering consumer banking, investment banking, asset management, and treasury services.'
    },
    {
      symbol: 'JNJ',
      name: 'Johnson & Johnson',
      exchange: 'NYSE',
      country: 'USA',
      flag: '🇺🇸',
      sector: 'Healthcare',
      industry: 'Drug Manufacturers - General',
      price: 161.40,
      changePct: 0.18,
      volume: 6200000,
      marketCap: 388000000000,
      high52: 168.90,
      low52: 143.10,
      pe: 24.1,
      eps: 6.70,
      beta: 0.54,
      dividendYield: 3.08,
      revenue: 85200000000,
      netProfit: 35100000000,
      volatility30d: 9.8,
      maxDrawdown1y: -7.6,
      riskLevel: 'LOW',
      description: 'Johnson & Johnson researches, develops, and manufactures innovative pharmaceutical treatments and medical technology devices globally.'
    },

    // --- INDIA (NSE / BSE) ---
    {
      symbol: 'RELIANCE',
      name: 'Reliance Industries Ltd.',
      exchange: 'NSE',
      country: 'India',
      flag: '🇮🇳',
      sector: 'Energy',
      industry: 'Oil & Gas Refining & Telecom',
      price: 33.80, // in USD base (~ ₹2923)
      changePct: 0.74,
      volume: 7800000,
      marketCap: 228000000000,
      high52: 37.10,
      low52: 26.20,
      pe: 26.8,
      eps: 1.26,
      beta: 0.88,
      dividendYield: 0.35,
      revenue: 112000000000,
      netProfit: 8650000000,
      volatility30d: 14.2,
      maxDrawdown1y: -11.2,
      riskLevel: 'LOW',
      description: 'Reliance Industries is India\'s largest private sector enterprise with diversified businesses across hydrocarbon refining, petrochemicals, telecommunications (Jio), and retail.'
    },
    {
      symbol: 'TCS',
      name: 'Tata Consultancy Services',
      exchange: 'NSE',
      country: 'India',
      flag: '🇮🇳',
      sector: 'Technology',
      industry: 'Information Technology Services',
      price: 47.90, // in USD base (~ ₹4143)
      changePct: -0.32,
      volume: 2450000,
      marketCap: 172000000000,
      high52: 52.40,
      low52: 39.80,
      pe: 30.5,
      eps: 1.57,
      beta: 0.75,
      dividendYield: 1.38,
      revenue: 29100000000,
      netProfit: 5540000000,
      volatility30d: 12.9,
      maxDrawdown1y: -8.9,
      riskLevel: 'LOW',
      description: 'TCS is a global leader in IT services, consulting, and business solutions, partnering with many of the world\'s largest businesses in their transformation journeys.'
    },
    {
      symbol: 'HDFCBANK',
      name: 'HDFC Bank Limited',
      exchange: 'NSE',
      country: 'India',
      flag: '🇮🇳',
      sector: 'Financial',
      industry: 'Banks - Regional & Private',
      price: 19.85, // in USD base (~ ₹1717)
      changePct: 1.15,
      volume: 14500000,
      marketCap: 151000000000,
      high52: 21.00,
      low52: 15.70,
      pe: 18.4,
      eps: 1.08,
      beta: 0.92,
      dividendYield: 1.16,
      revenue: 38200000000,
      netProfit: 7920000000,
      volatility30d: 13.8,
      maxDrawdown1y: -13.5,
      riskLevel: 'LOW',
      description: 'HDFC Bank is India\'s premier private sector banking institution, providing commercial and transactional banking services to retail and corporate customers.'
    },
    {
      symbol: 'INFY',
      name: 'Infosys Limited',
      exchange: 'NSE',
      country: 'India',
      flag: '🇮🇳',
      sector: 'Technology',
      industry: 'Information Technology Services',
      price: 22.10, // in USD base (~ ₹1911)
      changePct: 0.45,
      volume: 6100000,
      marketCap: 91500000000,
      high52: 23.50,
      low52: 15.90,
      pe: 28.2,
      eps: 0.78,
      beta: 0.96,
      dividendYield: 2.10,
      revenue: 18560000000,
      netProfit: 3180000000,
      volatility30d: 15.4,
      maxDrawdown1y: -12.1,
      riskLevel: 'LOW',
      description: 'Infosys is a global leader in next-generation digital services and consulting, enabling clients across 56 countries to navigate digital transformation.'
    },
    {
      symbol: 'TATAMOTORS',
      name: 'Tata Motors Limited',
      exchange: 'NSE',
      country: 'India',
      flag: '🇮🇳',
      sector: 'Consumer Cyclical',
      industry: 'Auto Manufacturers',
      price: 11.20, // in USD base (~ ₹968)
      changePct: -1.60,
      volume: 11200000,
      marketCap: 41200000000,
      high52: 13.60,
      low52: 7.20,
      pe: 12.8,
      eps: 0.87,
      beta: 1.62,
      dividendYield: 0.65,
      revenue: 53100000000,
      netProfit: 3820000000,
      volatility30d: 28.2,
      maxDrawdown1y: -21.4,
      riskLevel: 'MEDIUM',
      description: 'Tata Motors is a leading global automobile manufacturer producing passenger vehicles, commercial trucks, and premium luxury vehicles via Jaguar Land Rover.'
    },
    {
      symbol: 'BHARTIARTL',
      name: 'Bharti Airtel Limited',
      exchange: 'NSE',
      country: 'India',
      flag: '🇮🇳',
      sector: 'Communication Services',
      industry: 'Telecom Services',
      price: 19.30, // in USD base (~ ₹1670)
      changePct: 0.88,
      volume: 4900000,
      marketCap: 114000000000,
      high52: 20.40,
      low52: 10.80,
      pe: 54.2,
      eps: 0.36,
      beta: 0.82,
      dividendYield: 0.48,
      revenue: 18200000000,
      netProfit: 1740000000,
      volatility30d: 14.5,
      maxDrawdown1y: -8.4,
      riskLevel: 'LOW',
      description: 'Bharti Airtel is a leading telecommunications company with operations in 18 countries across South Asia and Africa, delivering 4G/5G, broadband, and cloud connectivity.'
    },

    // --- UNITED KINGDOM (LSE) ---
    {
      symbol: 'AZN',
      name: 'AstraZeneca PLC',
      exchange: 'LSE',
      country: 'UK',
      flag: '🇬🇧',
      sector: 'Healthcare',
      industry: 'Pharmaceuticals',
      price: 152.40,
      changePct: 0.42,
      volume: 2100000,
      marketCap: 236000000000,
      high52: 170.80,
      low52: 124.50,
      pe: 36.4,
      eps: 4.18,
      beta: 0.58,
      dividendYield: 2.12,
      revenue: 45810000000,
      netProfit: 5960000000,
      volatility30d: 13.4,
      maxDrawdown1y: -10.2,
      riskLevel: 'LOW',
      description: 'AstraZeneca is a global biopharmaceutical company focusing on oncology, cardiovascular, renal, metabolism, respiratory, and immunology therapies.'
    },
    {
      symbol: 'SHEL',
      name: 'Shell plc',
      exchange: 'LSE',
      country: 'UK',
      flag: '🇬🇧',
      sector: 'Energy',
      industry: 'Oil & Gas Integrated',
      price: 33.90,
      changePct: -0.65,
      volume: 9800000,
      marketCap: 215000000000,
      high52: 38.20,
      low52: 29.50,
      pe: 11.2,
      eps: 3.02,
      beta: 0.72,
      dividendYield: 4.02,
      revenue: 316600000000,
      netProfit: 19360000000,
      volatility30d: 15.1,
      maxDrawdown1y: -14.6,
      riskLevel: 'LOW',
      description: 'Shell is a global energy and petrochemicals company exploring, extracting, refining, and marketing oil, natural gas, LNG, and low-carbon power.'
    },
    {
      symbol: 'HSBA',
      name: 'HSBC Holdings plc',
      exchange: 'LSE',
      country: 'UK',
      flag: '🇬🇧',
      sector: 'Financial',
      industry: 'Banks - Diversified',
      price: 8.85,
      changePct: 0.25,
      volume: 16500000,
      marketCap: 162000000000,
      high52: 9.20,
      low52: 6.80,
      pe: 7.4,
      eps: 1.19,
      beta: 0.68,
      dividendYield: 7.20,
      revenue: 66100000000,
      netProfit: 22430000000,
      volatility30d: 12.2,
      maxDrawdown1y: -9.5,
      riskLevel: 'LOW',
      description: 'HSBC provides banking and financial services across Wealth and Personal Banking, Commercial Banking, and Global Banking and Markets across 62 countries.'
    },

    // --- GERMANY (XETRA) ---
    {
      symbol: 'SAP',
      name: 'SAP SE',
      exchange: 'XETRA',
      country: 'Germany',
      flag: '🇩🇪',
      sector: 'Technology',
      industry: 'Enterprise Software',
      price: 228.60,
      changePct: 1.48,
      volume: 2400000,
      marketCap: 268000000000,
      high52: 232.40,
      low52: 135.20,
      pe: 46.2,
      eps: 4.94,
      beta: 1.10,
      dividendYield: 1.05,
      revenue: 34100000000,
      netProfit: 6200000000,
      volatility30d: 17.5,
      maxDrawdown1y: -11.9,
      riskLevel: 'LOW',
      description: 'SAP SE provides enterprise application software, enterprise resource planning (ERP), database software, and cloud business solutions worldwide.'
    },
    {
      symbol: 'SIE',
      name: 'Siemens AG',
      exchange: 'XETRA',
      country: 'Germany',
      flag: '🇩🇪',
      sector: 'Industrials',
      industry: 'Specialty Industrial Machinery',
      price: 198.30,
      changePct: 0.85,
      volume: 1200000,
      marketCap: 158000000000,
      high52: 204.00,
      low52: 142.10,
      pe: 18.5,
      eps: 10.71,
      beta: 1.14,
      dividendYield: 2.70,
      revenue: 84600000000,
      netProfit: 9100000000,
      volatility30d: 16.0,
      maxDrawdown1y: -14.2,
      riskLevel: 'LOW',
      description: 'Siemens operates in automation, electrification, digitalization, smart infrastructure for buildings, and distributed energy systems.'
    },
    {
      symbol: 'ALV',
      name: 'Allianz SE',
      exchange: 'XETRA',
      country: 'Germany',
      flag: '🇩🇪',
      sector: 'Financial',
      industry: 'Insurance - Multi-line',
      price: 312.40,
      changePct: 0.35,
      volume: 850000,
      marketCap: 122000000000,
      high52: 318.00,
      low52: 220.50,
      pe: 11.8,
      eps: 26.47,
      beta: 0.82,
      dividendYield: 4.80,
      revenue: 172000000000,
      netProfit: 9850000000,
      volatility30d: 11.5,
      maxDrawdown1y: -8.6,
      riskLevel: 'LOW',
      description: 'Allianz is a multinational financial services provider offering property-casualty insurance, life/health insurance, and asset management via PIMCO and AllianzGI.'
    },

    // --- JAPAN (TSE) ---
    {
      symbol: '7203',
      name: 'Toyota Motor Corp.',
      exchange: 'TSE',
      country: 'Japan',
      flag: '🇯🇵',
      sector: 'Consumer Cyclical',
      industry: 'Auto Manufacturers',
      price: 17.80, // USD base
      changePct: 0.62,
      volume: 18500000,
      marketCap: 284000000000,
      high52: 25.10,
      low52: 16.90,
      pe: 8.9,
      eps: 2.00,
      beta: 0.74,
      dividendYield: 2.85,
      revenue: 302000000000,
      netProfit: 33100000000,
      volatility30d: 19.4,
      maxDrawdown1y: -28.5,
      riskLevel: 'MEDIUM',
      description: 'Toyota designs, manufactures, and sells passenger cars, minivans, commercial vehicles, and automotive parts and accessories internationally.'
    },
    {
      symbol: '6758',
      name: 'Sony Group Corp.',
      exchange: 'TSE',
      country: 'Japan',
      flag: '🇯🇵',
      sector: 'Technology',
      industry: 'Consumer Electronics & Gaming',
      price: 19.40, // USD base
      changePct: 1.25,
      volume: 8200000,
      marketCap: 118000000000,
      high52: 21.60,
      low52: 16.40,
      pe: 17.5,
      eps: 1.10,
      beta: 0.98,
      dividendYield: 1.20,
      revenue: 89400000000,
      netProfit: 6720000000,
      volatility30d: 18.2,
      maxDrawdown1y: -16.8,
      riskLevel: 'LOW',
      description: 'Sony designs, develops, and manufactures electronic equipment, gaming consoles (PlayStation), music entertainment, motion pictures, and image sensors.'
    },
    {
      symbol: '9984',
      name: 'SoftBank Group Corp.',
      exchange: 'TSE',
      country: 'Japan',
      flag: '🇯🇵',
      sector: 'Financial',
      industry: 'Asset Management & Tech Venture',
      price: 58.20, // USD base
      changePct: 2.80,
      volume: 12400000,
      marketCap: 84000000000,
      high52: 78.40,
      low52: 38.50,
      pe: 32.1,
      eps: 1.81,
      beta: 1.85,
      dividendYield: 0.50,
      revenue: 46200000000,
      netProfit: 3100000000,
      volatility30d: 34.8,
      maxDrawdown1y: -32.5,
      riskLevel: 'HIGH',
      description: 'SoftBank Group operates investment holdings specializing in telecommunications, AI ecosystems, and technology startups through the SoftBank Vision Funds and Arm Holdings.'
    },

    // --- CANADA (TSX) ---
    {
      symbol: 'SHOP',
      name: 'Shopify Inc.',
      exchange: 'TSX',
      country: 'Canada',
      flag: '🇨🇦',
      sector: 'Technology',
      industry: 'Software - Application',
      price: 81.50,
      changePct: 2.15,
      volume: 6800000,
      marketCap: 104000000000,
      high52: 91.50,
      low52: 48.50,
      pe: 78.2,
      eps: 1.04,
      beta: 2.20,
      dividendYield: 0.00,
      revenue: 7890000000,
      netProfit: 1320000000,
      volatility30d: 31.4,
      maxDrawdown1y: -24.8,
      riskLevel: 'HIGH',
      description: 'Shopify provides an essential internet infrastructure for commerce, offering trusted tools to start, grow, market, and manage a retail business of any size.'
    },
    {
      symbol: 'RY',
      name: 'Royal Bank of Canada',
      exchange: 'TSX',
      country: 'Canada',
      flag: '🇨🇦',
      sector: 'Financial',
      industry: 'Banks - Diversified',
      price: 122.80,
      changePct: 0.45,
      volume: 3100000,
      marketCap: 172000000000,
      high52: 126.40,
      low52: 88.20,
      pe: 13.9,
      eps: 8.83,
      beta: 0.78,
      dividendYield: 3.52,
      revenue: 42100000000,
      netProfit: 12400000000,
      volatility30d: 11.8,
      maxDrawdown1y: -8.2,
      riskLevel: 'LOW',
      description: 'Royal Bank of Canada is one of Canada\'s largest banks, providing personal and commercial banking, wealth management, insurance, and capital markets globally.'
    },

    // --- AUSTRALIA (ASX) ---
    {
      symbol: 'BHP',
      name: 'BHP Group Limited',
      exchange: 'ASX',
      country: 'Australia',
      flag: '🇦🇺',
      sector: 'Basic Materials',
      industry: 'Other Industrial Metals & Mining',
      price: 28.40,
      changePct: -0.85,
      volume: 7200000,
      marketCap: 144000000000,
      high52: 33.80,
      low52: 24.90,
      pe: 14.2,
      eps: 2.00,
      beta: 0.95,
      dividendYield: 5.40,
      revenue: 55600000000,
      netProfit: 10120000000,
      volatility30d: 16.4,
      maxDrawdown1y: -18.2,
      riskLevel: 'LOW',
      description: 'BHP Group is a world-leading resources company extracting and processing minerals, iron ore, metallurgical coal, copper, and nickel globally.'
    },
    {
      symbol: 'CBA',
      name: 'Commonwealth Bank of Australia',
      exchange: 'ASX',
      country: 'Australia',
      flag: '🇦🇺',
      sector: 'Financial',
      industry: 'Banks - Regional',
      price: 94.20,
      changePct: 0.38,
      volume: 2400000,
      marketCap: 157000000000,
      high52: 97.40,
      low52: 66.50,
      pe: 23.5,
      eps: 4.01,
      beta: 0.72,
      dividendYield: 3.35,
      revenue: 27800000000,
      netProfit: 6680000000,
      volatility30d: 12.0,
      maxDrawdown1y: -7.5,
      riskLevel: 'LOW',
      description: 'Commonwealth Bank of Australia is one of the leading providers of integrated financial services including retail, business, and institutional banking and funds management.'
    }
  ],

  // Get company by ticker symbol
  getCompany(symbol) {
    if (!symbol) return null;
    const cleanSym = symbol.toUpperCase().trim();
    return this.companies.find(c => c.symbol.toUpperCase() === cleanSym) || null;
  },

  // Search & Filter Companies
  searchCompanies({ query = '', country = 'ALL', exchange = 'ALL', sector = 'ALL', risk = 'ALL', sortBy = 'marketCap', sortDir = 'desc' } = {}) {
    let results = [...this.companies];

    // Text search query
    if (query && query.trim() !== '') {
      const q = query.toLowerCase().trim();
      results = results.filter(c => 
        c.symbol.toLowerCase().includes(q) ||
        c.name.toLowerCase().includes(q) ||
        c.sector.toLowerCase().includes(q) ||
        c.industry.toLowerCase().includes(q) ||
        c.exchange.toLowerCase().includes(q)
      );
    }

    // Country filter
    if (country !== 'ALL') {
      results = results.filter(c => c.country.toUpperCase() === country.toUpperCase());
    }

    // Exchange filter
    if (exchange !== 'ALL') {
      results = results.filter(c => c.exchange.toUpperCase() === exchange.toUpperCase());
    }

    // Sector filter
    if (sector !== 'ALL') {
      results = results.filter(c => c.sector.toUpperCase() === sector.toUpperCase());
    }

    // Risk Level filter
    if (risk !== 'ALL') {
      results = results.filter(c => c.riskLevel.toUpperCase() === risk.toUpperCase());
    }

    // Sorting
    results.sort((a, b) => {
      let valA = a[sortBy];
      let valB = b[sortBy];

      if (typeof valA === 'string') {
        return sortDir === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return sortDir === 'asc' ? valA - valB : valB - valA;
    });

    return results;
  },

  // Generate realistic historical time series for charts
  getHistoricalData(symbol, timeframe = '1Y') {
    const comp = this.getCompany(symbol) || this.companies[0];
    const basePrice = comp.price;
    const beta = comp.beta || 1.0;
    const now = Date.now();
    let points = [];

    let count = 50;
    let stepMs = 24 * 3600 * 1000;
    let trendFactor = 0.0005;

    switch (timeframe) {
      case '1D':
        count = 32; // 30 min intervals
        stepMs = 30 * 60 * 1000;
        break;
      case '1W':
        count = 35; // 4 hour intervals
        stepMs = 4 * 3600 * 1000;
        break;
      case '1M':
        count = 30;
        stepMs = 24 * 3600 * 1000;
        break;
      case '6M':
        count = 75;
        stepMs = 2.4 * 24 * 3600 * 1000;
        break;
      case '1Y':
        count = 100;
        stepMs = 3.65 * 24 * 3600 * 1000;
        break;
      case '5Y':
        count = 120;
        stepMs = 15 * 24 * 3600 * 1000;
        break;
      case 'MAX':
        count = 150;
        stepMs = 30 * 24 * 3600 * 1000;
        break;
      default:
        count = 50;
    }

    // Deterministic pseudo-random seed based on symbol char codes
    let seed = 0;
    for (let i = 0; i < comp.symbol.length; i++) {
      seed += comp.symbol.charCodeAt(i) * (i + 1);
    }
    const pseudoRand = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };

    // Construct curve ending at basePrice
    let currentP = basePrice * (1 - (comp.changePct / 100) * 0.4);
    const rawPrices = [];
    
    for (let i = 0; i < count; i++) {
      const noise = (pseudoRand() - 0.485) * (0.025 * beta);
      currentP = currentP * (1 + noise);
      rawPrices.push(currentP);
    }

    // Scale series so the final point matches current price
    const finalRaw = rawPrices[rawPrices.length - 1];
    const scale = basePrice / (finalRaw || 1);

    for (let i = 0; i < count; i++) {
      const time = new Date(now - (count - 1 - i) * stepMs);
      const price = +(rawPrices[i] * scale).toFixed(2);
      const volume = Math.floor((comp.volume / 20) * (0.6 + pseudoRand() * 0.8));
      
      points.push({
        timestamp: time.getTime(),
        dateStr: time.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: timeframe === '5Y' || timeframe === 'MAX' ? '2-digit' : undefined }),
        price: price,
        volume: volume
      });
    }

    return points;
  }
};
