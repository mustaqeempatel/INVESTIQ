/* ==========================================================================
   INVESTIQ REACTIVE STATE MANAGEMENT
   Central Store for Portfolio, Simulation, Watchlist, Alerts & Settings
   With LocalStorage Persistence & Event Broadcasting
   ========================================================================== */

class AppStateManager {
  constructor() {
    this.listeners = [];
    this.loadInitialState();
  }

  loadInitialState() {
    const saved = localStorage.getItem('investiq_state');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        this.state = parsed;
        return;
      } catch (e) {
        console.error('Failed to parse saved state, initializing default', e);
      }
    }

    // Default Demo State (Alex Morgan Persona)
    const defaultPersona = CONFIG.DEMO_PERSONAS[0];
    this.state = {
      isLoggedIn: true,
      currentUser: {
        id: defaultPersona.id,
        name: defaultPersona.name,
        email: defaultPersona.email,
        role: defaultPersona.role
      },
      currency: defaultPersona.currency,
      theme: defaultPersona.theme,
      riskTolerance: defaultPersona.riskTolerance,
      activeView: 'landing', // Starts at landing, can enter workspace
      activeResearchSymbol: 'AAPL',
      compareBasket: ['AAPL', 'MSFT', 'NVDA'],
      cashBalance: defaultPersona.cashBalance,
      holdings: [...defaultPersona.initialHoldings],
      transactions: [
        { id: 'tx_init_1', symbol: 'AAPL', type: 'BUY', quantity: 45, price: 195.20, totalValue: 8784.00, date: '2024-05-14', notes: 'Initial core position' },
        { id: 'tx_init_2', symbol: 'NVDA', type: 'BUY', quantity: 30, price: 108.50, totalValue: 3255.00, date: '2024-06-20', notes: 'AI compute allocation' },
        { id: 'tx_init_3', symbol: 'MSFT', type: 'BUY', quantity: 25, price: 412.00, totalValue: 10300.00, date: '2024-07-02', notes: 'Cloud enterprise resilience' },
        { id: 'tx_init_4', symbol: 'RELIANCE', type: 'BUY', quantity: 120, price: 28.50, totalValue: 3420.00, date: '2024-08-11', notes: 'India telecom & energy' },
        { id: 'tx_init_5', symbol: 'SAP', type: 'BUY', quantity: 40, price: 185.00, totalValue: 7400.00, date: '2024-09-01', notes: 'European enterprise ERP' },
        { id: 'tx_init_6', symbol: 'AZN', type: 'BUY', quantity: 50, price: 135.00, totalValue: 6750.00, date: '2024-09-18', notes: 'Healthcare defensive anchor' }
      ],
      watchlist: ['AAPL', 'NVDA', 'RELIANCE', 'TCS', 'SAP', '7203', 'SHOP', 'BHP'],
      alerts: [
        { id: 'alt_1', symbol: 'NVDA', type: 'PRICE_ABOVE', threshold: 140.00, isTriggered: false, createdAt: '2024-09-20' },
        { id: 'alt_2', symbol: 'TSLA', type: 'VOLATILITY_EXPANSION', threshold: 35.0, isTriggered: true, createdAt: '2024-10-01' },
        { id: 'alt_3', symbol: 'RELIANCE', type: 'PERCENT_MOVE', threshold: 3.0, isTriggered: false, createdAt: '2024-10-02' }
      ],
      notifications: [
        {
          id: 'notif_1',
          title: 'Volatility Expansion Alert',
          message: 'TSLA historical 30-day volatility has crossed the 35% threshold.',
          severity: 'warning',
          isRead: false,
          linkTarget: 'TSLA',
          timestamp: '10m ago'
        },
        {
          id: 'notif_2',
          title: 'Portfolio Sector Threshold',
          message: 'Technology sector weight is currently 42.8% of portfolio equity.',
          severity: 'info',
          isRead: false,
          linkTarget: 'portfolio',
          timestamp: '1h ago'
        },
        {
          id: 'notif_3',
          title: 'Simulated Order Settled',
          message: 'Simulated Buy order for 50 AZN @ $135.00 completed successfully.',
          severity: 'success',
          isRead: true,
          linkTarget: 'transactions',
          timestamp: '2d ago'
        }
      ]
    };
    this.saveState();
  }

  saveState() {
    try {
      localStorage.setItem('investiq_state', JSON.stringify(this.state));
    } catch (e) {
      console.warn('Unable to persist state to localStorage', e);
    }
    this.notify();
  }

  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  notify() {
    this.listeners.forEach(fn => {
      try { fn(this.state); } catch (e) { console.error('State subscriber error', e); }
    });
  }

  // Calculate comprehensive live portfolio summary
  getPortfolioSummary() {
    let totalInvested = 0;
    let currentEquity = 0;
    let dailyChangeVal = 0;

    const enrichedHoldings = (this.state.holdings || []).map(h => {
      const comp = MarketDataService.getCompany(h.symbol) || {
        symbol: h.symbol,
        name: h.symbol,
        price: h.avgBuyPrice,
        changePct: 0,
        sector: 'Diversified',
        country: 'Global'
      };

      const costBasis = h.quantity * h.avgBuyPrice;
      const currentValue = h.quantity * comp.price;
      const pnl = currentValue - costBasis;
      const returnPct = costBasis > 0 ? (pnl / costBasis) * 100 : 0;
      const dayChange = (comp.price * (comp.changePct / 100)) * h.quantity;

      totalInvested += costBasis;
      currentEquity += currentValue;
      dailyChangeVal += dayChange;

      return {
        ...h,
        company: comp,
        costBasis,
        currentValue,
        pnl,
        returnPct,
        dayChange
      };
    });

    const cash = this.state.cashBalance || 0;
    const totalValue = currentEquity + cash;
    const totalPnl = currentEquity - totalInvested;
    const totalReturnPct = totalInvested > 0 ? (totalPnl / totalInvested) * 100 : 0;
    const dailyChangePct = (totalValue - dailyChangeVal) > 0 ? (dailyChangeVal / (totalValue - dailyChangeVal)) * 100 : 0;

    // Calculate portfolio weights
    enrichedHoldings.forEach(item => {
      item.weight = totalValue > 0 ? (item.currentValue / totalValue) * 100 : 0;
    });

    // Calculate dynamic risk
    const riskProfile = RiskEngine.calculatePortfolioRisk(this.state.holdings, cash);
    const insights = InsightsEngine.generateInsights(
      { holdings: enrichedHoldings, cashBalance: cash, totalEquity: currentEquity, totalValue },
      riskProfile,
      this.state.watchlist
    );

    return {
      totalValue,
      currentEquity,
      cashBalance: cash,
      totalInvested,
      totalPnl,
      totalReturnPct,
      dailyChangeVal,
      dailyChangePct,
      holdings: enrichedHoldings,
      riskProfile,
      insights
    };
  }

  // --- ACTIONS ---

  setView(viewName) {
    this.state.activeView = viewName;
    this.saveState();
  }

  setCurrency(currCode) {
    if (CONFIG.CURRENCIES[currCode]) {
      this.state.currency = currCode;
      this.saveState();
    }
  }

  setTheme(theme) {
    this.state.theme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    this.saveState();
  }

  switchPersona(personaId) {
    const persona = CONFIG.DEMO_PERSONAS.find(p => p.id === personaId);
    if (!persona) return;

    this.state.currentUser = {
      id: persona.id,
      name: persona.name,
      email: persona.email,
      role: persona.role
    };
    this.state.currency = persona.currency;
    this.state.theme = persona.theme;
    this.state.riskTolerance = persona.riskTolerance;
    this.state.cashBalance = persona.cashBalance;
    this.state.holdings = [...persona.initialHoldings];
    this.state.isLoggedIn = true;

    // Reset initial transaction log for persona
    this.state.transactions = persona.initialHoldings.map((h, i) => ({
      id: `tx_${persona.id}_${i}`,
      symbol: h.symbol,
      type: 'BUY',
      quantity: h.quantity,
      price: h.avgBuyPrice,
      totalValue: h.quantity * h.avgBuyPrice,
      date: '2024-08-01',
      notes: 'Initial persona holding'
    }));

    this.saveState();
  }

  setResearchSymbol(symbol) {
    const comp = MarketDataService.getCompany(symbol);
    if (comp) {
      this.state.activeResearchSymbol = comp.symbol;
      this.state.activeView = 'research';
      this.saveState();
    }
  }

  toggleWatchlist(symbol) {
    const sym = symbol.toUpperCase().trim();
    const idx = this.state.watchlist.indexOf(sym);
    if (idx > -1) {
      this.state.watchlist.splice(idx, 1);
    } else {
      this.state.watchlist.push(sym);
    }
    this.saveState();
  }

  isInWatchlist(symbol) {
    return this.state.watchlist.includes(symbol.toUpperCase().trim());
  }

  addCompareSymbol(symbol) {
    const sym = symbol.toUpperCase().trim();
    if (!this.state.compareBasket.includes(sym) && this.state.compareBasket.length < 5) {
      this.state.compareBasket.push(sym);
      this.saveState();
    }
  }

  removeCompareSymbol(symbol) {
    const sym = symbol.toUpperCase().trim();
    this.state.compareBasket = this.state.compareBasket.filter(s => s !== sym);
    this.saveState();
  }

  // Execute Simulated Buy
  executeSimulatedBuy(symbol, quantity, price, date = null, notes = '') {
    const sym = symbol.toUpperCase().trim();
    const qty = parseInt(quantity, 10);
    const p = parseFloat(price);

    if (!sym || isNaN(qty) || qty <= 0 || isNaN(p) || p <= 0) {
      throw new Error('Invalid symbol, quantity or execution price.');
    }

    const totalCost = qty * p;
    const txDate = date || new Date().toISOString().split('T')[0];

    // Deduct cash balance (or allow negative simulation cash with warning)
    this.state.cashBalance = Math.max(0, (this.state.cashBalance || 0) - totalCost);

    // Update holdings
    const existingIndex = this.state.holdings.findIndex(h => h.symbol === sym);
    if (existingIndex > -1) {
      const existing = this.state.holdings[existingIndex];
      const newQty = existing.quantity + qty;
      const newAvgPrice = ((existing.quantity * existing.avgBuyPrice) + totalCost) / newQty;
      this.state.holdings[existingIndex] = {
        ...existing,
        quantity: newQty,
        avgBuyPrice: +newAvgPrice.toFixed(2)
      };
    } else {
      this.state.holdings.push({
        symbol: sym,
        quantity: qty,
        avgBuyPrice: +p.toFixed(2)
      });
    }

    // Append to Transactions
    const tx = {
      id: Utils.generateId('tx'),
      symbol: sym,
      type: 'BUY',
      quantity: qty,
      price: p,
      totalValue: +totalCost.toFixed(2),
      date: txDate,
      notes: notes || 'Simulated Buy Order'
    };
    this.state.transactions.unshift(tx);

    // Add in-app notification
    this.addNotification({
      title: 'Simulated Buy Order Completed',
      message: `Purchased ${qty} shares of ${sym} @ $${p.toFixed(2)}. Portfolio updated.`,
      severity: 'success',
      linkTarget: 'portfolio'
    });

    this.saveState();
    return tx;
  }

  // Execute Simulated Sell
  executeSimulatedSell(symbol, quantity, price, date = null, notes = '') {
    const sym = symbol.toUpperCase().trim();
    const qty = parseInt(quantity, 10);
    const p = parseFloat(price);

    const existingIndex = this.state.holdings.findIndex(h => h.symbol === sym);
    if (existingIndex === -1) {
      throw new Error(`Holding ${sym} does not exist in your portfolio.`);
    }

    const holding = this.state.holdings[existingIndex];
    if (qty > holding.quantity) {
      throw new Error(`Cannot sell ${qty} shares; only ${holding.quantity} currently held.`);
    }

    const proceeds = qty * p;
    const txDate = date || new Date().toISOString().split('T')[0];

    // Add proceeds to cash balance
    this.state.cashBalance = (this.state.cashBalance || 0) + proceeds;

    // Update holding
    if (qty === holding.quantity) {
      this.state.holdings.splice(existingIndex, 1);
    } else {
      holding.quantity -= qty;
    }

    // Append to transactions
    const tx = {
      id: Utils.generateId('tx'),
      symbol: sym,
      type: 'SELL',
      quantity: qty,
      price: p,
      totalValue: +proceeds.toFixed(2),
      date: txDate,
      notes: notes || 'Simulated Sell Order'
    };
    this.state.transactions.unshift(tx);

    // Notification
    this.addNotification({
      title: 'Simulated Sell Order Completed',
      message: `Liquidated ${qty} shares of ${sym} @ $${p.toFixed(2)}. Cash credited.`,
      severity: 'info',
      linkTarget: 'transactions'
    });

    this.saveState();
    return tx;
  }

  // Create Custom Alert
  createAlert({ symbol, type, threshold }) {
    const sym = symbol.toUpperCase().trim();
    const alert = {
      id: Utils.generateId('alt'),
      symbol: sym,
      type,
      threshold: parseFloat(threshold),
      isTriggered: false,
      createdAt: new Date().toISOString().split('T')[0]
    };
    this.state.alerts.unshift(alert);

    this.addNotification({
      title: 'Alert Configured',
      message: `Monitoring active for ${sym} (${type.replace('_', ' ')} ${threshold}).`,
      severity: 'info',
      linkTarget: 'alerts'
    });

    this.saveState();
    return alert;
  }

  deleteAlert(alertId) {
    this.state.alerts = this.state.alerts.filter(a => a.id !== alertId);
    this.saveState();
  }

  addNotification({ title, message, severity = 'info', linkTarget = 'dashboard' }) {
    const notif = {
      id: Utils.generateId('notif'),
      title,
      message,
      severity,
      isRead: false,
      linkTarget,
      timestamp: 'Just now'
    };
    this.state.notifications.unshift(notif);
    this.saveState();
  }

  markNotificationRead(id) {
    const n = this.state.notifications.find(item => item.id === id);
    if (n) {
      n.isRead = true;
      this.saveState();
    }
  }

  markAllNotificationsRead() {
    this.state.notifications.forEach(n => n.isRead = true);
    this.saveState();
  }

  resetDemoData() {
    localStorage.removeItem('investiq_state');
    this.loadInitialState();
    this.notify();
  }
}

// Global State Instance
const State = new AppStateManager();
