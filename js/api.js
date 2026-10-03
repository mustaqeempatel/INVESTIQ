/* ==========================================================================
   INVESTIQ API CLIENT
   Hybrid Server-Client Bridge with Graceful Fallback
   ========================================================================== */

const API = {
  serverAvailable: null, // null = unchecked, true = live, false = offline fallback

  async checkServer() {
    if (this.serverAvailable !== null) return this.serverAvailable;
    try {
      const res = await fetch('/api/auth/me', { method: 'GET', headers: { 'Accept': 'application/json' } });
      this.serverAvailable = res.status < 500;
    } catch (e) {
      this.serverAvailable = false;
    }
    return this.serverAvailable;
  },

  async request(endpoint, options = {}) {
    const isLive = await this.checkServer();
    if (!isLive) {
      return this.clientFallback(endpoint, options);
    }

    try {
      const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(options.headers || {})
      };

      const token = localStorage.getItem('investiq_token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(`/api${endpoint}`, {
        ...options,
        headers
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `HTTP error ${res.status}`);
      }

      return await res.json();
    } catch (err) {
      console.warn(`Server request failed for ${endpoint}, using client state:`, err.message);
      return this.clientFallback(endpoint, options);
    }
  },

  // Fallback to in-memory / local storage State
  clientFallback(endpoint, options) {
    const method = (options.method || 'GET').toUpperCase();

    if (endpoint === '/auth/me') {
      return { user: State.state.currentUser };
    }

    if (endpoint === '/portfolio') {
      return {
        cashBalance: State.state.cashBalance,
        holdings: State.state.holdings
      };
    }

    if (endpoint === '/transactions') {
      return { transactions: State.state.transactions };
    }

    if (endpoint === '/watchlist') {
      return { watchlist: State.state.watchlist };
    }

    if (endpoint === '/alerts') {
      return { alerts: State.state.alerts };
    }

    if (endpoint === '/notifications') {
      return { notifications: State.state.notifications };
    }

    if (endpoint === '/portfolio/transactions' && method === 'POST') {
      const body = JSON.parse(options.body || '{}');
      if (body.type === 'BUY') {
        const tx = State.executeSimulatedBuy(body.symbol, body.quantity, body.price, body.date, body.notes);
        return { success: true, transactionId: tx.id };
      } else {
        const tx = State.executeSimulatedSell(body.symbol, body.quantity, body.price, body.date, body.notes);
        return { success: true, transactionId: tx.id };
      }
    }

    if (endpoint === '/watchlist' && method === 'POST') {
      const body = JSON.parse(options.body || '{}');
      State.toggleWatchlist(body.symbol);
      return { success: true };
    }

    if (endpoint === '/alerts' && method === 'POST') {
      const body = JSON.parse(options.body || '{}');
      const alt = State.createAlert(body);
      return { success: true, alertId: alt.id };
    }

    return { success: true };
  }
};
