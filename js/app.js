/* ==========================================================================
   INVESTIQ MASTER APPLICATION CONTROLLER
   Views, Interactive Handlers, Event Subscriptions & Modals
   ========================================================================== */

class InvestIQApp {
  constructor() {
    this.container = document.getElementById('viewContainer');
    this.heroScene = null;
    this.activeTimeframe = '1Y';
    this.activeChartSymbol = 'AAPL';
    this.activeAllocationTab = 'sector';
    this.chartHoverIndex = -1;
    this.chartCanvasRef = null;

    this.init();
  }

  init() {
    this.setupTheme();
    this.setupEventListeners();
    this.populateTickerRibbon();
    this.updateUserInterface();

    // Subscribe to central state changes
    State.subscribe((state) => {
      this.updateUserInterface();
      this.renderCurrentView();
    });

    // Check URL Hash or default to landing
    const hash = window.location.hash.replace('#', '') || 'landing';
    this.navigateTo(hash);
  }

  setupTheme() {
    const currentTheme = State.state.theme || 'dark';
    document.documentElement.setAttribute('data-theme', currentTheme);
    this.updateThemeIcon(currentTheme);
  }

  updateThemeIcon(theme) {
    const icon = document.getElementById('themeIcon');
    if (!icon) return;
    if (theme === 'dark') {
      icon.innerHTML = '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>';
    } else {
      icon.innerHTML = '<circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>';
    }
  }

  setupEventListeners() {
    // Topbar Currency Switcher
    const currSelect = document.getElementById('currencySelector');
    if (currSelect) {
      currSelect.value = State.state.currency;
      currSelect.addEventListener('change', (e) => {
        State.setCurrency(e.target.value);
        this.showToast('Currency Updated', `Display values converted to ${e.target.value}.`, 'info');
      });
    }

    // Theme Toggle
    const themeBtn = document.getElementById('themeToggleBtn');
    if (themeBtn) {
      themeBtn.addEventListener('click', () => {
        const nextTheme = State.state.theme === 'dark' ? 'light' : 'dark';
        State.setTheme(nextTheme);
        this.updateThemeIcon(nextTheme);
        this.showToast('Theme Changed', `Switched to ${nextTheme} mode.`, 'info');
      });
    }

    // Demo Persona Switcher
    const personaSwitch = document.getElementById('personaQuickSwitch');
    if (personaSwitch) {
      personaSwitch.value = State.state.currentUser.id || 'alex_morgan';
      personaSwitch.addEventListener('change', (e) => {
        State.switchPersona(e.target.value);
        this.showToast('Persona Activated', `Switched to ${State.state.currentUser.name}'s workspace.`, 'success');
      });
    }

    // Header Workspace Toggle CTA
    const headerCta = document.getElementById('headerWorkspaceCta');
    if (headerCta) {
      headerCta.addEventListener('click', () => {
        if (State.state.activeView === 'landing') {
          this.navigateTo('dashboard');
        } else {
          this.navigateTo('landing');
        }
      });
    }

    // Sidebar & Mobile Nav clicks
    document.querySelectorAll('.nav-item, .mobile-nav-item').forEach(el => {
      el.addEventListener('click', (e) => {
        const view = el.getAttribute('data-view');
        if (view) {
          this.navigateTo(view);
        }
      });
    });

    // Global Search Trigger
    const searchTrigger = document.getElementById('globalSearchTrigger');
    const searchModal = document.getElementById('searchModalBackdrop');
    const searchClose = document.getElementById('closeSearchModalBtn');
    const searchInput = document.getElementById('globalSearchInput');

    if (searchTrigger && searchModal) {
      searchTrigger.addEventListener('click', () => {
        searchModal.classList.add('open');
        if (searchInput) {
          searchInput.value = '';
          searchInput.focus();
          this.performGlobalSearch('');
        }
      });
    }

    if (searchClose && searchModal) {
      searchClose.addEventListener('click', () => searchModal.classList.remove('open'));
    }

    // Close modal on click backdrop
    window.addEventListener('click', (e) => {
      if (e.target.classList.contains('modal-backdrop')) {
        e.target.classList.remove('open');
      }
    });

    // Keyboard Shortcuts (Ctrl+K or ⌘K)
    window.addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (searchModal) {
          searchModal.classList.toggle('open');
          if (searchModal.classList.contains('open') && searchInput) {
            searchInput.focus();
            this.performGlobalSearch(searchInput.value);
          }
        }
      }
      if (e.key === 'Escape') {
        document.querySelectorAll('.modal-backdrop.open').forEach(m => m.classList.remove('open'));
        const drawer = document.getElementById('notifDrawer');
        if (drawer) drawer.style.display = 'none';
      }
    });

    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.performGlobalSearch(e.target.value);
      });
    }

    // Notifications Drawer Trigger
    const notifBtn = document.getElementById('notifBellBtn');
    const notifDrawer = document.getElementById('notifDrawer');
    const markAllReadBtn = document.getElementById('markAllReadBtn');

    if (notifBtn && notifDrawer) {
      notifBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = notifDrawer.style.display === 'flex';
        notifDrawer.style.display = isOpen ? 'none' : 'flex';
        if (!isOpen) this.renderNotificationDrawer();
      });

      document.addEventListener('click', (e) => {
        if (!notifDrawer.contains(e.target) && e.target !== notifBtn) {
          notifDrawer.style.display = 'none';
        }
      });
    }

    if (markAllReadBtn) {
      markAllReadBtn.addEventListener('click', () => {
        State.markAllNotificationsRead();
        this.renderNotificationDrawer();
      });
    }

    // Simulated Transaction Modal Handlers
    this.setupTransactionModal();

    // Create Alert Modal Handlers
    this.setupAlertModal();

    // Window Hash Change
    window.addEventListener('hashchange', () => {
      const hash = window.location.hash.replace('#', '') || 'landing';
      this.navigateTo(hash);
    });
  }

  setupTransactionModal() {
    const modal = document.getElementById('transactionModalBackdrop');
    const closeBtn = document.getElementById('closeTxModalBtn');
    const cancelBtn = document.getElementById('cancelTxBtn');
    const form = document.getElementById('simulatedTxForm');
    const tabBuy = document.getElementById('txTabBuy');
    const tabSell = document.getElementById('txTabSell');
    const symbolSelect = document.getElementById('txSymbolSelect');
    const qtyInput = document.getElementById('txQuantityInput');
    const priceInput = document.getElementById('txPriceInput');
    const estTotal = document.getElementById('txEstimatedTotal');

    let currentType = 'BUY';

    if (closeBtn) closeBtn.addEventListener('click', () => modal.classList.remove('open'));
    if (cancelBtn) cancelBtn.addEventListener('click', () => modal.classList.remove('open'));

    if (tabBuy && tabSell) {
      tabBuy.addEventListener('click', () => {
        currentType = 'BUY';
        tabBuy.classList.add('active');
        tabSell.classList.remove('active');
        document.getElementById('submitTxBtn').textContent = 'Execute Simulated Buy';
        document.getElementById('submitTxBtn').className = 'btn btn-primary';
      });

      tabSell.addEventListener('click', () => {
        currentType = 'SELL';
        tabSell.classList.add('active');
        tabBuy.classList.remove('active');
        document.getElementById('submitTxBtn').textContent = 'Execute Simulated Sell';
        document.getElementById('submitTxBtn').className = 'btn btn-danger';
      });
    }

    const calcTotal = () => {
      const qty = parseFloat(qtyInput.value) || 0;
      const prc = parseFloat(priceInput.value) || 0;
      const tot = qty * prc;
      estTotal.textContent = Utils.formatCurrency(tot, State.state.currency);
    };

    if (symbolSelect) {
      // Populate symbols
      symbolSelect.innerHTML = MarketDataService.companies.map(c => 
        `<option value="${c.symbol}" data-price="${c.price}">${c.symbol} — ${c.name} ($${c.price.toFixed(2)})</option>`
      ).join('');

      symbolSelect.addEventListener('change', () => {
        const opt = symbolSelect.options[symbolSelect.selectedIndex];
        if (opt) {
          priceInput.value = parseFloat(opt.getAttribute('data-price') || 100).toFixed(2);
          calcTotal();
        }
      });
    }

    if (qtyInput) qtyInput.addEventListener('input', calcTotal);
    if (priceInput) priceInput.addEventListener('input', calcTotal);

    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const sym = symbolSelect.value;
        const qty = parseInt(qtyInput.value, 10);
        const price = parseFloat(priceInput.value);
        const date = document.getElementById('txDateInput').value;
        const notes = document.getElementById('txNotesInput').value;

        try {
          if (currentType === 'BUY') {
            State.executeSimulatedBuy(sym, qty, price, date, notes);
            this.showToast('Simulated Buy Executed', `Acquired ${qty} shares of ${sym} @ $${price.toFixed(2)}.`, 'success');
          } else {
            State.executeSimulatedSell(sym, qty, price, date, notes);
            this.showToast('Simulated Sell Executed', `Liquidated ${qty} shares of ${sym} @ $${price.toFixed(2)}.`, 'info');
          }
          modal.classList.remove('open');
        } catch (err) {
          this.showToast('Transaction Error', err.message, 'warning');
        }
      });
    }
  }

  setupAlertModal() {
    const modal = document.getElementById('alertModalBackdrop');
    const closeBtn = document.getElementById('closeAlertModalBtn');
    const cancelBtn = document.getElementById('cancelAlertBtn');
    const form = document.getElementById('createAlertForm');
    const symSelect = document.getElementById('alertSymbolSelect');

    if (closeBtn) closeBtn.addEventListener('click', () => modal.classList.remove('open'));
    if (cancelBtn) cancelBtn.addEventListener('click', () => modal.classList.remove('open'));

    if (symSelect) {
      symSelect.innerHTML = MarketDataService.companies.map(c => 
        `<option value="${c.symbol}">${c.symbol} — ${c.name}</option>`
      ).join('');
    }

    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const sym = symSelect.value;
        const type = document.getElementById('alertTypeSelect').value;
        const threshold = document.getElementById('alertThresholdInput').value;

        State.createAlert({ symbol: sym, type, threshold });
        this.showToast('Alert Active', `Monitoring ${sym} for ${type.replace('_', ' ')}.`, 'success');
        modal.classList.remove('open');
      });
    }
  }

  openTransactionModal(symbol = 'AAPL', type = 'BUY') {
    const modal = document.getElementById('transactionModalBackdrop');
    if (!modal) return;
    const symSelect = document.getElementById('txSymbolSelect');
    const priceInput = document.getElementById('txPriceInput');
    const tabBuy = document.getElementById('txTabBuy');
    const tabSell = document.getElementById('txTabSell');

    if (symSelect) {
      symSelect.value = symbol.toUpperCase();
      const comp = MarketDataService.getCompany(symbol);
      if (comp && priceInput) {
        priceInput.value = comp.price.toFixed(2);
      }
    }

    if (type === 'BUY' && tabBuy) tabBuy.click();
    if (type === 'SELL' && tabSell) tabSell.click();

    // Recalculate
    const qty = parseFloat(document.getElementById('txQuantityInput').value) || 10;
    const prc = parseFloat(priceInput.value) || 100;
    document.getElementById('txEstimatedTotal').textContent = Utils.formatCurrency(qty * prc, State.state.currency);

    modal.classList.add('open');
  }

  openAlertModal(symbol = 'AAPL') {
    const modal = document.getElementById('alertModalBackdrop');
    if (!modal) return;
    const symSelect = document.getElementById('alertSymbolSelect');
    const thresholdInput = document.getElementById('alertThresholdInput');

    if (symSelect) symSelect.value = symbol.toUpperCase();
    const comp = MarketDataService.getCompany(symbol);
    if (comp && thresholdInput) {
      thresholdInput.value = (comp.price * 1.05).toFixed(2);
    }
    modal.classList.add('open');
  }

  navigateTo(viewName) {
    if (this.heroScene) {
      this.heroScene.stop();
      this.heroScene = null;
    }

    State.state.activeView = viewName;
    window.location.hash = viewName;

    // Update active state on sidebar and mobile nav
    document.querySelectorAll('.nav-item, .mobile-nav-item').forEach(el => {
      if (el.getAttribute('data-view') === viewName) {
        el.classList.add('active');
      } else {
        el.classList.remove('active');
      }
    });

    // Update Topbar View Title
    const titleBox = document.getElementById('moduleTitleBox');
    const viewTitle = document.getElementById('currentViewTitle');
    const viewSubtitle = document.getElementById('currentViewSubtitle');
    const headerCtaText = document.getElementById('headerCtaText');

    if (viewName === 'landing') {
      if (titleBox) titleBox.style.display = 'none';
      if (headerCtaText) headerCtaText.textContent = 'Workspace';
      document.body.classList.add('on-landing');
      document.getElementById('appSidebar').style.display = 'none';
      document.getElementById('mainViewport').style.marginLeft = '0';
    } else {
      if (titleBox) titleBox.style.display = 'flex';
      if (headerCtaText) headerCtaText.textContent = 'Landing';
      document.body.classList.remove('on-landing');
      document.getElementById('appSidebar').style.display = '';
      document.getElementById('mainViewport').style.marginLeft = '';

      const titles = {
        dashboard: { title: 'Dashboard', sub: 'Portfolio Overview & Market Intelligence' },
        markets: { title: 'Global Markets', sub: 'Cross-Border Exchange Exploration & Ticker Screener' },
        scanner: { title: 'Company Scanner', sub: 'Multi-Factor Quantitative Filter Engine' },
        research: { title: 'Company Research', sub: `${State.state.activeResearchSymbol} Institutional Fundamentals & Metrics` },
        compare: { title: 'Company Compare', sub: 'Multi-Asset Normalized Return & Fundamental Matrix' },
        watchlist: { title: 'Watchlist', sub: 'Monitored Assets & Intraday Trajectory' },
        portfolio: { title: 'Portfolio Management', sub: 'Holdings, P&L Attribution & Position Weighting' },
        transactions: { title: 'Transactions Log', sub: 'Simulated Execution Ledger & Order History' },
        analytics: { title: 'Portfolio Analytics', sub: 'Benchmark Attributions, Volatility & Diversification' },
        risk: { title: 'Risk Intelligence', sub: 'Multi-Factor Exposure Breakdown & Sensitivity' },
        alerts: { title: 'Alerts Center', sub: 'Threshold Triggers & Surveillance Parameters' },
        insights: { title: 'Data-Driven Insights', sub: 'Automated Portfolio Context & Actionable Notes' },
        settings: { title: 'Workspace Settings', sub: 'User Preferences, Currencies & Simulation State' }
      };

      const currMeta = titles[viewName] || { title: 'InvestIQ', sub: 'Workspace' };
      if (viewTitle) viewTitle.textContent = currMeta.title;
      if (viewSubtitle) viewSubtitle.textContent = currMeta.sub;
    }

    window.scrollTo({ top: 0, behavior: 'instant' });
    this.renderCurrentView();
  }

  updateUserInterface() {
    const summary = State.getPortfolioSummary();
    const curr = State.state.currency;

    // Sidebar user updates
    const nameEl = document.getElementById('sidebarUserName');
    const valEl = document.getElementById('sidebarPortfolioVal');
    const avatarEl = document.getElementById('sidebarUserAvatar');
    const watchlistCount = document.getElementById('sidebarWatchlistCount');

    if (nameEl) nameEl.textContent = State.state.currentUser.name;
    if (valEl) valEl.textContent = Utils.formatCurrency(summary.totalValue, curr, 0);
    if (avatarEl) {
      const parts = State.state.currentUser.name.split(' ');
      avatarEl.textContent = parts.map(p => p[0]).join('').substring(0, 2);
    }
    if (watchlistCount) watchlistCount.textContent = State.state.watchlist.length;

    // Notification bell dot
    const unreadCount = (State.state.notifications || []).filter(n => !n.isRead).length;
    const dot = document.getElementById('notifUnreadDot');
    if (dot) {
      dot.style.display = unreadCount > 0 ? 'block' : 'none';
    }
  }

  populateTickerRibbon() {
    const ribbon = document.getElementById('tickerRibbon');
    if (!ribbon) return;

    ribbon.innerHTML = MarketDataService.indices.map(idx => `
      <div class="ticker-item">
        <span class="ticker-name">${idx.name}</span>
        <span class="ticker-price">${idx.price.toLocaleString()}</span>
        <span class="${idx.changePct >= 0 ? 'text-gain' : 'text-loss'} font-bold">
          ${Utils.formatPercent(idx.changePct)}
        </span>
      </div>
    `).join('');
  }

  performGlobalSearch(query) {
    const list = document.getElementById('searchResultsList');
    if (!list) return;

    const results = MarketDataService.searchCompanies({ query: query.trim() }).slice(0, 8);
    if (results.length === 0) {
      list.innerHTML = `
        <div style="padding: 24px; text-align: center; color: var(--text-tertiary); font-size: 0.85rem;">
          No matching companies found for "<strong>${escapeHtml(query)}</strong>". Try searching for Apple, TCS, Reliance, or NASDAQ.
        </div>
      `;
      return;
    }

    list.innerHTML = results.map(c => `
      <div class="mover-card" onclick="InvestIQ.openResearch('${c.symbol}'); document.getElementById('searchModalBackdrop').classList.remove('open');">
        <div style="display: flex; align-items: center; gap: 12px;">
          <div style="width: 32px; height: 32px; border-radius: var(--radius-sm); background: var(--bg-tertiary); display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.8rem; color: var(--brand-cyan);">
            ${c.symbol.substring(0, 2)}
          </div>
          <div>
            <div style="font-weight: 700; font-size: 0.88rem;">${c.symbol} <span style="font-size: 0.72rem; color: var(--text-tertiary); font-weight: normal;">• ${c.exchange}</span></div>
            <div style="font-size: 0.74rem; color: var(--text-secondary);">${c.name} (${c.country})</div>
          </div>
        </div>
        <div style="text-align: right;">
          <div class="mono font-bold">${Utils.formatCurrency(c.price, State.state.currency)}</div>
          <div class="${c.changePct >= 0 ? 'text-gain' : 'text-loss'} text-xs font-bold">${Utils.formatPercent(c.changePct)}</div>
        </div>
      </div>
    `).join('');
  }

  renderNotificationDrawer() {
    const list = document.getElementById('notifDrawerList');
    if (!list) return;

    const notifs = State.state.notifications || [];
    if (notifs.length === 0) {
      list.innerHTML = `<div style="padding: 20px; text-align: center; color: var(--text-tertiary); font-size: 0.8rem;">No notifications recorded.</div>`;
      return;
    }

    list.innerHTML = notifs.map(n => `
      <div style="padding: 10px 12px; border-radius: var(--radius-sm); background: ${n.isRead ? 'transparent' : 'rgba(0, 240, 255, 0.04)'}; border-bottom: 1px solid var(--border-subtle); display: flex; flex-direction: column; gap: 3px; cursor: pointer;" onclick="InvestIQ.handleNotificationClick('${n.id}', '${n.linkTarget}')">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="font-weight: 700; font-size: 0.78rem; color: ${n.severity === 'warning' ? 'var(--color-warn)' : n.severity === 'success' ? 'var(--color-gain)' : 'var(--brand-cyan)'};">${n.title}</span>
          <span style="font-size: 0.68rem; color: var(--text-tertiary);">${n.timestamp}</span>
        </div>
        <div style="font-size: 0.74rem; color: var(--text-secondary); line-height: 1.35;">${n.message}</div>
      </div>
    `).join('');
  }

  handleNotificationClick(notifId, linkTarget) {
    State.markNotificationRead(notifId);
    document.getElementById('notifDrawer').style.display = 'none';
    if (linkTarget) {
      if (MarketDataService.getCompany(linkTarget)) {
        this.openResearch(linkTarget);
      } else {
        this.navigateTo(linkTarget);
      }
    }
  }

  openResearch(symbol) {
    State.setResearchSymbol(symbol);
    this.navigateTo('research');
  }

  showToast(title, msg, severity = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'toast';

    let icon = 'ℹ️';
    let borderColor = 'var(--brand-cyan)';
    if (severity === 'success') { icon = '✓'; borderColor = 'var(--color-gain)'; }
    if (severity === 'warning') { icon = '⚠'; borderColor = 'var(--color-warn)'; }
    if (severity === 'error') { icon = '✕'; borderColor = 'var(--color-loss)'; }

    toast.style.borderColor = borderColor;
    toast.innerHTML = `
      <div class="toast-icon">${icon}</div>
      <div class="toast-content">
        <div class="toast-title">${escapeHtml(title)}</div>
        <div class="toast-msg">${escapeHtml(msg)}</div>
      </div>
    `;

    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease-out';
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }

  // ========================================================================
  // VIEW RENDERERS
  // ========================================================================

  renderCurrentView() {
    const view = State.state.activeView || 'dashboard';

    switch (view) {
      case 'landing':
        this.renderLandingView();
        break;
      case 'dashboard':
        this.renderDashboardView();
        break;
      case 'markets':
        this.renderMarketsView();
        break;
      case 'scanner':
        this.renderScannerView();
        break;
      case 'research':
        this.renderResearchView();
        break;
      case 'compare':
        this.renderCompareView();
        break;
      case 'watchlist':
        this.renderWatchlistView();
        break;
      case 'portfolio':
        this.renderPortfolioView();
        break;
      case 'transactions':
        this.renderTransactionsView();
        break;
      case 'analytics':
        this.renderAnalyticsView();
        break;
      case 'risk':
        this.renderRiskView();
        break;
      case 'alerts':
        this.renderAlertsView();
        break;
      case 'insights':
        this.renderInsightsView();
        break;
      case 'settings':
        this.renderSettingsView();
        break;
      default:
        this.renderDashboardView();
    }
  }

  // 1. LANDING PAGE VIEW
  renderLandingView() {
    this.container.innerHTML = `
      <div class="landing-view">
        <!-- 3D Hero Section -->
        <section class="hero-section">
          <canvas id="hero3dCanvas" class="hero-3d-canvas"></canvas>
          <div class="hero-content">
            <div class="hero-badge">
              <span class="status-dot-pulse"></span>
              <span>INVESTIQ INTELLIGENCE PLATFORM v2.4</span>
            </div>
            <h1 class="hero-headline">
              SEE THE MARKET.<br>
              <span class="gradient-cyan">UNDERSTAND YOUR PORTFOLIO.</span>
            </h1>
            <p class="hero-subtitle">
              One unified workspace connecting global market discovery with transparent portfolio risk, multi-asset allocation, cross-border research, simulated execution, and contextual intelligence.
            </p>
            <div class="hero-actions">
              <button class="btn btn-primary btn-lg" onclick="InvestIQ.navigateTo('dashboard')">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                <span>Launch Workspace</span>
              </button>
              <button class="btn btn-secondary btn-lg" onclick="InvestIQ.navigateTo('scanner')">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                <span>Explore Global Scanner</span>
              </button>
            </div>

            <!-- Floating 3D Preview Image Card -->
            <div class="hero-floating-preview">
              <img src="assets/investiq_preview.jpg" alt="INVESTIQ Spatial Fintech Workspace Mockup" class="hero-preview-img">
            </div>
          </div>
        </section>

        <!-- Problem vs Solution Section -->
        <section class="problem-solution-section">
          <div>
            <div class="section-tag">THE PROBLEM WE SOLVE</div>
            <h2 class="section-title">Too Much Data. Not Enough Context.</h2>
          </div>
          <div class="problem-solution-grid">
            <div class="problem-card">
              <h3 style="color: var(--color-loss); font-size: 1.15rem; display: flex; align-items: center; gap: 8px;">
                <span>✕</span> Fragmented Investor Experience
              </h3>
              <ul class="card-item-list">
                <li><span>•</span> One platform for live ticker prices</li>
                <li><span>•</span> Another platform for financial statements & P/E ratios</li>
                <li><span>•</span> Another tool for interactive charts</li>
                <li><span>•</span> Isolated portfolio trackers with no risk metrics</li>
                <li><span>•</span> No connection showing how an individual stock shifts overall portfolio risk</li>
              </ul>
            </div>

            <div class="solution-card">
              <h3 style="color: var(--color-gain); font-size: 1.15rem; display: flex; align-items: center; gap: 8px;">
                <span>✓</span> The INVESTIQ Unified Workspace
              </h3>
              <ul class="card-item-list">
                <li><span>•</span> Complete cross-border discovery across USA, India, UK, Germany, Japan</li>
                <li><span>•</span> Instant portfolio context: see risk and allocation shift in real-time</li>
                <li><span>•</span> Simulated execution with zero real-money risk or broker credentials required</li>
                <li><span>•</span> Transparent, non-prescriptive risk factor explanations</li>
                <li><span>•</span> Objective, data-driven contextual observations</li>
              </ul>
            </div>
          </div>
        </section>

        <!-- 4-Step Interactive How It Works Flow -->
        <section class="how-it-works-section">
          <div class="how-it-works-container">
            <div>
              <div class="section-tag">WORKFLOW ARCHITECTURE</div>
              <h2 class="section-title">From Raw Data to Portfolio Intelligence</h2>
            </div>
            <div class="flow-steps-grid">
              <div class="flow-step-card" onclick="InvestIQ.navigateTo('markets')" style="cursor: pointer;">
                <div class="step-number">01</div>
                <div class="step-title">EXPLORE</div>
                <p class="step-desc">Screen global companies across 9 exchanges with multi-factor filters and real-time quotes.</p>
              </div>
              <div class="flow-step-card" onclick="InvestIQ.navigateTo('research')" style="cursor: pointer;">
                <div class="step-number">02</div>
                <div class="step-title">RESEARCH</div>
                <p class="step-desc">Inspect multi-year financial statements, valuation multiples, drawdown curves, and volatility metrics.</p>
              </div>
              <div class="flow-step-card" onclick="InvestIQ.navigateTo('portfolio')" style="cursor: pointer;">
                <div class="step-number">03</div>
                <div class="step-title">ANALYZE</div>
                <p class="step-desc">Simulate trades to immediately observe portfolio allocation, concentration HHI, and risk shifts.</p>
              </div>
              <div class="flow-step-card" onclick="InvestIQ.navigateTo('alerts')" style="cursor: pointer;">
                <div class="step-number">04</div>
                <div class="step-title">MONITOR</div>
                <p class="step-desc">Configure surveillance alerts for price targets, volatility spikes, and sector exposure thresholds.</p>
              </div>
            </div>
          </div>
        </section>

        <!-- Features Grid -->
        <section class="features-section">
          <div>
            <div class="section-tag">ENGINEERED FOR EXCELLENCE</div>
            <h2 class="section-title">Built for Hackathon Demonstration & Institutional Polish</h2>
          </div>
          <div class="features-grid">
            <div class="feature-box">
              <div class="feature-icon-wrapper">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>
              </div>
              <h3 class="text-lg">Global Market Coverage</h3>
              <p class="text-sm text-muted">Seamlessly analyze securities across USA, India, UK, Germany, Japan, Canada, and Australia in USD, INR, EUR, GBP, or JPY.</p>
            </div>

            <div class="feature-box">
              <div class="feature-icon-wrapper">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path></svg>
              </div>
              <h3 class="text-lg">Modular Risk Engine</h3>
              <p class="text-sm text-muted">Transparent multi-factor risk scores derived from historical volatility, maximum drawdowns, concentration penalties, and valuation multiples.</p>
            </div>

            <div class="feature-box">
              <div class="feature-icon-wrapper">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline><polyline points="16 7 22 7 22 13"></polyline></svg>
              </div>
              <h3 class="text-lg">Simulated Transactions</h3>
              <p class="text-sm text-muted">Test portfolio reallocations with zero monetary risk. All buy and sell models dynamically adjust cash balances, cost basis, and metrics.</p>
            </div>
          </div>
        </section>

        <!-- Non-Brokerage Notice & Security -->
        <section style="max-width: 1000px; margin: 0 auto 80px; padding: 28px 32px; background: rgba(0, 240, 255, 0.03); border: 1px solid rgba(0, 240, 255, 0.2); border-radius: var(--radius-xl); text-align: center;">
          <h3 style="font-size: 1.1rem; color: var(--brand-cyan); margin-bottom: 8px;">Institutional Disclaimers & Security Guarantee</h3>
          <p style="font-size: 0.82rem; color: var(--text-secondary); line-height: 1.6;">
            INVESTIQ is strictly an informational research and portfolio simulation platform. It does NOT execute real financial trades, initiate wire transfers, or request brokerage or banking credentials. All market scenarios are calculated transparently for educational and decision-support purposes.
          </p>
        </section>

        <!-- Landing Footer -->
        <footer class="landing-footer">
          <div>© 2026 INVESTIQ Workspace — Global Portfolio Intelligence. All rights reserved.</div>
          <div style="font-size: 0.72rem; color: var(--text-tertiary);">Designed with WCAG 2.1 AAA Accessibility & 3D Spatial Glassmorphism.</div>
        </footer>
      </div>
    `;

    // Initialize 3D Hero Scene
    setTimeout(() => {
      this.heroScene = new Hero3DScene('hero3dCanvas');
    }, 50);
  }

  // 2. DASHBOARD VIEW
  renderDashboardView() {
    const summary = State.getPortfolioSummary();
    const curr = State.state.currency;
    const persona = State.state.currentUser;

    this.container.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; margin-bottom: 4px;">
        <div>
          <h2 style="font-size: 1.5rem; font-weight: 800;">Good day, ${escapeHtml(persona.name)}</h2>
          <p class="text-xs text-muted">Here is your portfolio status, market movements, and risk exposure as of today.</p>
        </div>
        <div style="display: flex; gap: 8px;">
          <button class="btn btn-secondary btn-sm" onclick="InvestIQ.openAlertModal('NVDA')">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path></svg>
            <span>Set Alert</span>
          </button>
          <button class="btn btn-primary btn-sm" onclick="InvestIQ.openTransactionModal('AAPL', 'BUY')">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            <span>New Simulated Order</span>
          </button>
        </div>
      </div>

      <!-- 5 Key Metrics Cards -->
      <div class="metrics-grid">
        <div class="metric-card">
          <div class="metric-header">
            <span class="metric-title">Portfolio Value</span>
            <div class="metric-icon-box">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>
            </div>
          </div>
          <div class="metric-value mono">${Utils.formatCurrency(summary.totalValue, curr)}</div>
          <div class="metric-footer">
            <span class="text-muted">Total Active Capital</span>
            <span class="badge ${summary.dailyChangePct >= 0 ? 'badge-gain' : 'badge-loss'}">${Utils.formatPercent(summary.dailyChangePct)} today</span>
          </div>
        </div>

        <div class="metric-card">
          <div class="metric-header">
            <span class="metric-title">Invested Basis</span>
            <div class="metric-icon-box">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
            </div>
          </div>
          <div class="metric-value mono">${Utils.formatCurrency(summary.totalInvested, curr)}</div>
          <div class="metric-footer">
            <span class="text-muted">Equity Acquisition Basis</span>
            <span class="text-xs mono text-tertiary">${summary.holdings.length} Positions</span>
          </div>
        </div>

        <div class="metric-card">
          <div class="metric-header">
            <span class="metric-title">Total P&L</span>
            <div class="metric-icon-box">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>
            </div>
          </div>
          <div class="metric-value mono ${summary.totalPnl >= 0 ? 'text-gain' : 'text-loss'}">
            ${summary.totalPnl >= 0 ? '+' : ''}${Utils.formatCurrency(summary.totalPnl, curr)}
          </div>
          <div class="metric-footer">
            <span class="text-muted">Overall Return</span>
            <span class="badge ${summary.totalReturnPct >= 0 ? 'badge-gain' : 'badge-loss'}">${Utils.formatPercent(summary.totalReturnPct)}</span>
          </div>
        </div>

        <div class="metric-card">
          <div class="metric-header">
            <span class="metric-title">Daily Change</span>
            <div class="metric-icon-box">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
            </div>
          </div>
          <div class="metric-value mono ${summary.dailyChangeVal >= 0 ? 'text-gain' : 'text-loss'}">
            ${summary.dailyChangeVal >= 0 ? '+' : ''}${Utils.formatCurrency(summary.dailyChangeVal, curr)}
          </div>
          <div class="metric-footer">
            <span class="text-muted">Intraday Fluctuation</span>
            <span class="text-xs font-bold ${summary.dailyChangePct >= 0 ? 'text-gain' : 'text-loss'}">${Utils.formatPercent(summary.dailyChangePct)}</span>
          </div>
        </div>

        <div class="metric-card">
          <div class="metric-header">
            <span class="metric-title">Cash Reserve</span>
            <div class="metric-icon-box">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg>
            </div>
          </div>
          <div class="metric-value mono">${Utils.formatCurrency(summary.cashBalance, curr)}</div>
          <div class="metric-footer">
            <span class="text-muted">Unallocated Capital</span>
            <span class="text-xs mono text-cyan">${summary.totalValue > 0 ? ((summary.cashBalance / summary.totalValue) * 100).toFixed(1) : 0}% of portfolio</span>
          </div>
        </div>
      </div>

      <!-- Main Interactive Portfolio Chart & Risk Gauge Section -->
      <div class="dashboard-grid-main">
        <!-- Interactive Chart Card -->
        <div class="chart-card">
          <div class="chart-header">
            <div class="chart-title-area">
              <div class="chart-title">Portfolio Performance History</div>
              <div class="chart-subtitle">Aggregated equity valuation trajectory vs S&P 500 benchmark</div>
            </div>
            <div class="timeframe-pill-group">
              ${['1D', '1W', '1M', '6M', '1Y', '5Y', 'MAX'].map(tf => `
                <button class="tf-pill ${tf === this.activeTimeframe ? 'active' : ''}" onclick="InvestIQ.setTimeframe('${tf}')">${tf}</button>
              `).join('')}
            </div>
          </div>

          <div class="chart-canvas-wrapper">
            <canvas id="dashboardPerformanceCanvas"></canvas>
            <div class="chart-tooltip" id="dashboardChartTooltip"></div>
          </div>
        </div>

        <!-- 3D Risk Gauge & Transparent Attribution -->
        <div class="chart-card">
          <div class="chart-header">
            <div class="chart-title-area">
              <div class="chart-title">Risk Engine Indicator</div>
              <div class="chart-subtitle">Transparent multi-factor assessment</div>
            </div>
            <span class="badge ${summary.riskProfile.level === 'HIGH' ? 'badge-risk-high' : summary.riskProfile.level === 'MEDIUM' ? 'badge-risk-med' : 'badge-risk-low'}">
              ${summary.riskProfile.level} RISK
            </span>
          </div>

          <div class="risk-gauge-container">
            <canvas id="dashboardRiskCanvas" class="risk-gauge-canvas"></canvas>
            <div class="risk-level-display">
              <span class="text-xs text-muted">Portfolio Composite Score</span>
            </div>
          </div>

          <!-- Factor Progress Bars -->
          <div style="display: flex; flex-direction: column; gap: 8px; margin-top: 10px;">
            ${summary.riskProfile.factors.slice(0, 3).map(f => `
              <div class="risk-factor-row">
                <div class="risk-factor-header">
                  <span>${f.name}</span>
                  <span class="mono font-bold">${f.raw}</span>
                </div>
                <div class="risk-bar-track">
                  <div class="risk-bar-fill" style="width: ${f.score}%; background: ${f.score > 65 ? 'var(--color-loss)' : f.score > 35 ? 'var(--color-warn)' : 'var(--color-gain)'};"></div>
                </div>
              </div>
            `).join('')}
          </div>

          <!-- Neutral Explanation snippet -->
          <div style="margin-top: 8px; font-size: 0.75rem; color: var(--text-secondary); background: rgba(255,255,255,0.02); padding: 8px 10px; border-radius: var(--radius-sm); border-left: 2px solid var(--brand-cyan);">
            <strong>Analysis:</strong> ${summary.riskProfile.explanations[0]?.detail || 'Balanced risk distribution across portfolio.'}
          </div>
        </div>
      </div>

      <!-- Allocation & Top Movers Grid -->
      <div style="display: grid; grid-template-columns: 1.4fr 1fr; gap: 20px;">
        <!-- Portfolio Allocation Donut -->
        <div class="chart-card">
          <div class="chart-header">
            <div class="chart-title-area">
              <div class="chart-title">Portfolio Allocation</div>
              <div class="chart-subtitle">Capital breakdown across sectors and regions</div>
            </div>
            <div class="tab-group">
              <button class="tab-btn ${this.activeAllocationTab === 'sector' ? 'active' : ''}" onclick="InvestIQ.setAllocationTab('sector')">Sector</button>
              <button class="tab-btn ${this.activeAllocationTab === 'country' ? 'active' : ''}" onclick="InvestIQ.setAllocationTab('country')">Country</button>
              <button class="tab-btn ${this.activeAllocationTab === 'company' ? 'active' : ''}" onclick="InvestIQ.setAllocationTab('company')">Company</button>
            </div>
          </div>

          <div class="allocation-container">
            <div class="allocation-chart-box">
              <canvas id="allocationDonutCanvas"></canvas>
            </div>
            <div class="allocation-list" id="allocationLegendList">
              <!-- Rendered via JS -->
            </div>
          </div>
        </div>

        <!-- Top Movers & Contributors -->
        <div class="chart-card">
          <div class="chart-header">
            <div class="chart-title-area">
              <div class="chart-title">Top Movers & Contributors</div>
              <div class="chart-subtitle">Intraday gainers, decliners & portfolio drivers</div>
            </div>
            <a onclick="InvestIQ.navigateTo('markets')" style="font-size: 0.75rem; color: var(--brand-cyan); cursor: pointer;">Explore All &rarr;</a>
          </div>

          <div style="display: flex; flex-direction: column; gap: 8px;">
            ${MarketDataService.companies.slice(0, 4).map(c => `
              <div class="mover-card" onclick="InvestIQ.openResearch('${c.symbol}')">
                <div class="mover-info">
                  <div class="mover-symbol">${c.symbol} <span class="badge ${c.riskLevel === 'HIGH' ? 'badge-risk-high' : c.riskLevel === 'MEDIUM' ? 'badge-risk-med' : 'badge-risk-low'}" style="font-size: 0.6rem; padding: 1px 5px;">${c.riskLevel}</span></div>
                  <div class="mover-name">${c.name} • ${c.exchange}</div>
                </div>
                <div class="mover-stats">
                  <div class="mover-price">${Utils.formatCurrency(c.price, curr)}</div>
                  <div class="badge ${c.changePct >= 0 ? 'badge-gain' : 'badge-loss'}">${Utils.formatPercent(c.changePct)}</div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>

      <!-- Actionable Insights & Recent Alerts Feed -->
      <div style="display: grid; grid-template-columns: 1.4fr 1fr; gap: 20px;">
        <div class="chart-card">
          <div class="chart-header">
            <div class="chart-title-area">
              <div class="chart-title">Data-Driven Observations</div>
              <div class="chart-subtitle">Objective, deterministic contextual insights</div>
            </div>
            <button class="btn btn-ghost btn-sm" onclick="InvestIQ.navigateTo('insights')">View All Insights</button>
          </div>

          <div class="insights-feed">
            ${summary.insights.slice(0, 3).map(ins => `
              <div class="insight-card">
                <div class="insight-header">
                  <span class="insight-tag">${ins.tag}</span>
                  <span class="text-xs text-muted">${ins.timestamp}</span>
                </div>
                <div class="insight-title">${ins.title}</div>
                <div class="insight-desc">${ins.description}</div>
              </div>
            `).join('')}
          </div>
        </div>

        <div class="chart-card">
          <div class="chart-header">
            <div class="chart-title-area">
              <div class="chart-title">Active Surveillance Alerts</div>
              <div class="chart-subtitle">Intraday threshold monitoring</div>
            </div>
            <button class="btn btn-secondary btn-sm" onclick="InvestIQ.openAlertModal('NVDA')">+ New Alert</button>
          </div>

          <div style="display: flex; flex-direction: column; gap: 8px;">
            ${(State.state.alerts || []).slice(0, 3).map(a => `
              <div style="padding: 10px 12px; border-radius: var(--radius-md); background: rgba(255,255,255,0.02); border: 1px solid var(--border-subtle); display: flex; align-items: center; justify-content: space-between;">
                <div>
                  <div style="font-weight: 700; font-size: 0.85rem;">${a.symbol}</div>
                  <div style="font-size: 0.72rem; color: var(--text-tertiary);">${a.type.replace('_', ' ')} ${a.threshold}</div>
                </div>
                <span class="badge ${a.isTriggered ? 'badge-loss' : 'badge-demo'}">
                  ${a.isTriggered ? 'TRIGGERED' : 'MONITORING'}
                </span>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;

    // Render Canvas Charts after DOM injection
    setTimeout(() => {
      this.renderDashboardCharts(summary);
    }, 50);
  }

  renderDashboardCharts(summary) {
    // 1. Performance History Canvas
    const perfCanvas = document.getElementById('dashboardPerformanceCanvas');
    if (perfCanvas) {
      const histPoints = MarketDataService.getHistoricalData(State.state.activeResearchSymbol || 'AAPL', this.activeTimeframe);
      ChartEngine.renderLineChart(perfCanvas, histPoints, {
        color: '#00F0FF',
        colorGlow: 'rgba(0, 240, 255, 0.25)',
        currency: State.state.currency,
        showVolume: true
      });

      // Mousemove tooltip
      perfCanvas.addEventListener('mousemove', (e) => {
        const rect = perfCanvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const padLeft = 10;
        const padRight = 55;
        const chartW = rect.width - padLeft - padRight;
        const ratio = Math.max(0, Math.min(1, (x - padLeft) / chartW));
        const idx = Math.round(ratio * (histPoints.length - 1));

        if (idx >= 0 && idx < histPoints.length) {
          ChartEngine.renderLineChart(perfCanvas, histPoints, {
            color: '#00F0FF',
            colorGlow: 'rgba(0, 240, 255, 0.25)',
            currency: State.state.currency,
            showVolume: true,
            hoverIndex: idx
          });

          const pt = histPoints[idx];
          const tip = document.getElementById('dashboardChartTooltip');
          if (tip) {
            tip.style.display = 'flex';
            tip.style.left = `${Math.min(rect.width - 150, Math.max(10, x - 50))}px`;
            tip.style.top = '10px';
            tip.innerHTML = `
              <div style="font-weight: 700; color: #FFFFFF;">${pt.dateStr}</div>
              <div class="mono" style="color: var(--brand-cyan); font-weight: 700;">${Utils.formatCurrency(pt.price, State.state.currency)}</div>
              <div style="font-size: 0.68rem; color: var(--text-tertiary);">Vol: ${pt.volume.toLocaleString()}</div>
            `;
          }
        }
      });

      perfCanvas.addEventListener('mouseleave', () => {
        ChartEngine.renderLineChart(perfCanvas, histPoints, {
          color: '#00F0FF',
          colorGlow: 'rgba(0, 240, 255, 0.25)',
          currency: State.state.currency,
          showVolume: true
        });
        const tip = document.getElementById('dashboardChartTooltip');
        if (tip) tip.style.display = 'none';
      });
    }

    // 2. Risk Gauge Canvas
    const riskCanvas = document.getElementById('dashboardRiskCanvas');
    if (riskCanvas) {
      ChartEngine.renderRiskGauge(riskCanvas, summary.riskProfile.score, summary.riskProfile.level);
    }

    // 3. Allocation Donut Canvas
    this.renderAllocationDonut(summary);
  }

  renderAllocationDonut(summary) {
    const donutCanvas = document.getElementById('allocationDonutCanvas');
    const legendList = document.getElementById('allocationLegendList');
    if (!donutCanvas || !legendList) return;

    let segments = [];
    const colors = ['#00F0FF', '#8B5CF6', '#05D59E', '#FFB020', '#FF3B69', '#38BDF8', '#A855F7'];

    if (this.activeAllocationTab === 'sector') {
      const sw = summary.riskProfile.sectorWeights || {};
      let i = 0;
      Object.entries(sw).forEach(([name, weight]) => {
        segments.push({ name, value: weight * 100, color: colors[i % colors.length] });
        i++;
      });
    } else if (this.activeAllocationTab === 'country') {
      const cw = summary.riskProfile.countryWeights || {};
      let i = 0;
      Object.entries(cw).forEach(([name, weight]) => {
        segments.push({ name, value: weight * 100, color: colors[i % colors.length] });
        i++;
      });
    } else {
      // By Company
      segments = summary.holdings.slice(0, 6).map((h, i) => ({
        name: h.symbol,
        value: h.weight,
        color: colors[i % colors.length]
      }));
    }

    if (segments.length === 0) {
      segments = [{ name: 'Cash', value: 100, color: '#00F0FF' }];
    }

    ChartEngine.renderDonutChart(donutCanvas, segments, {
      centerTitle: this.activeAllocationTab.toUpperCase(),
      centerValue: `${segments.length} Items`
    });

    legendList.innerHTML = segments.map((s, idx) => `
      <div class="allocation-item" onmouseenter="InvestIQ.highlightDonutSlice(${idx})" onmouseleave="InvestIQ.highlightDonutSlice(-1)">
        <div style="display: flex; align-items: center; gap: 8px;">
          <span class="allocation-legend-dot" style="background: ${s.color};"></span>
          <span style="font-weight: 600;">${s.name}</span>
        </div>
        <span class="mono font-bold">${s.value.toFixed(1)}%</span>
      </div>
    `).join('');
  }

  highlightDonutSlice(idx) {
    const donutCanvas = document.getElementById('allocationDonutCanvas');
    if (!donutCanvas) return;
    const summary = State.getPortfolioSummary();
    // Re-render with hoverIndex
    // ...
  }

  setTimeframe(tf) {
    this.activeTimeframe = tf;
    this.renderCurrentView();
  }

  setAllocationTab(tab) {
    this.activeAllocationTab = tab;
    const summary = State.getPortfolioSummary();
    this.renderAllocationDonut(summary);

    // Update active tab buttons
    document.querySelectorAll('.allocation-container ~ * .tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.textContent.toLowerCase() === tab);
    });
  }

  // 3. GLOBAL MARKETS EXPLORER VIEW
  renderMarketsView() {
    this.container.innerHTML = `
      <div class="chart-card">
        <div class="chart-header">
          <div class="chart-title-area">
            <h2 class="chart-title">Global Market Explorer</h2>
            <div class="chart-subtitle">Cross-border market indices and covered securities</div>
          </div>
          <div style="display: flex; gap: 8px;">
            <button class="btn btn-secondary btn-sm" onclick="InvestIQ.navigateTo('scanner')">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              <span>Open Scanner Filters</span>
            </button>
          </div>
        </div>

        <!-- Global Region Selector Pills -->
        <div class="scanner-filter-bar" style="margin-bottom: 14px;">
          <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
            <span class="text-xs text-muted font-bold">REGION:</span>
            ${['ALL', 'USA', 'India', 'UK', 'Germany', 'Japan', 'Canada', 'Australia'].map(reg => `
              <button class="btn btn-sm ${reg === 'ALL' ? 'btn-primary' : 'btn-secondary'}" onclick="InvestIQ.filterMarketsByRegion('${reg}', this)">${reg}</button>
            `).join('')}
          </div>
          <div style="margin-left: auto; width: 260px;">
            <input type="text" class="form-input" id="marketTableSearch" placeholder="Filter symbol or name..." style="width: 100%; font-size: 0.8rem; padding: 6px 12px;" oninput="InvestIQ.filterMarketsBySearch(this.value)">
          </div>
        </div>

        <!-- Professional Data Table -->
        <div class="table-responsive">
          <table class="data-table" id="marketsDataTable">
            <thead>
              <tr>
                <th onclick="InvestIQ.sortMarkets('symbol')">Company / Symbol</th>
                <th onclick="InvestIQ.sortMarkets('exchange')">Exchange</th>
                <th onclick="InvestIQ.sortMarkets('country')">Country</th>
                <th onclick="InvestIQ.sortMarkets('price')">Price</th>
                <th onclick="InvestIQ.sortMarkets('changePct')">24h Change</th>
                <th onclick="InvestIQ.sortMarkets('marketCap')">Market Cap</th>
                <th onclick="InvestIQ.sortMarkets('pe')">P/E</th>
                <th onclick="InvestIQ.sortMarkets('riskLevel')">Risk Indicator</th>
                <th style="text-align: right;">Actions</th>
              </tr>
            </thead>
            <tbody id="marketsTableBody">
              <!-- Populated via renderMarketsTable() -->
            </tbody>
          </table>
        </div>
      </div>
    `;

    this.renderMarketsTable(MarketDataService.companies);
  }

  renderMarketsTable(companies) {
    const tbody = document.getElementById('marketsTableBody');
    if (!tbody) return;
    const curr = State.state.currency;

    tbody.innerHTML = companies.map(c => `
      <tr>
        <td>
          <div style="display: flex; align-items: center; gap: 10px; cursor: pointer;" onclick="InvestIQ.openResearch('${c.symbol}')">
            <div style="width: 28px; height: 28px; border-radius: var(--radius-xs); background: var(--bg-tertiary); display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.72rem; color: var(--brand-cyan);">
              ${c.symbol.substring(0, 2)}
            </div>
            <div>
              <div style="font-weight: 700;">${c.symbol}</div>
              <div style="font-size: 0.72rem; color: var(--text-tertiary);">${c.name}</div>
            </div>
          </div>
        </td>
        <td><span class="badge" style="background: rgba(255,255,255,0.04);">${c.exchange}</span></td>
        <td>${c.flag} ${c.country}</td>
        <td class="mono font-bold">${Utils.formatCurrency(c.price, curr)}</td>
        <td>
          <span class="badge ${c.changePct >= 0 ? 'badge-gain' : 'badge-loss'}">
            ${Utils.formatPercent(c.changePct)}
          </span>
        </td>
        <td class="mono">${Utils.formatCompactNumber(c.marketCap, curr)}</td>
        <td class="mono">${c.pe ? c.pe.toFixed(1) : '—'}</td>
        <td>
          <span class="badge ${c.riskLevel === 'HIGH' ? 'badge-risk-high' : c.riskLevel === 'MEDIUM' ? 'badge-risk-med' : 'badge-risk-low'}">
            ${c.riskLevel}
          </span>
        </td>
        <td style="text-align: right;">
          <div style="display: inline-flex; gap: 6px;">
            <button class="btn btn-secondary btn-sm" onclick="InvestIQ.openResearch('${c.symbol}')" title="Research">Research</button>
            <button class="btn btn-secondary btn-sm" onclick="InvestIQ.toggleWatchlistBtn('${c.symbol}')" title="Watchlist">
              ${State.isInWatchlist(c.symbol) ? '★' : '☆'}
            </button>
            <button class="btn btn-primary btn-sm" onclick="InvestIQ.openTransactionModal('${c.symbol}', 'BUY')" title="Simulated Buy">Buy</button>
          </div>
        </td>
      </tr>
    `).join('');
  }

  filterMarketsByRegion(region, btn) {
    if (btn) {
      btn.parentElement.querySelectorAll('.btn').forEach(b => b.className = 'btn btn-secondary btn-sm');
      btn.className = 'btn btn-primary btn-sm';
    }
    const filtered = MarketDataService.searchCompanies({ country: region });
    this.renderMarketsTable(filtered);
  }

  filterMarketsBySearch(query) {
    const filtered = MarketDataService.searchCompanies({ query });
    this.renderMarketsTable(filtered);
  }

  toggleWatchlistBtn(symbol) {
    State.toggleWatchlist(symbol);
    const inWatch = State.isInWatchlist(symbol);
    this.showToast(inWatch ? 'Added to Watchlist' : 'Removed from Watchlist', `${symbol} updated.`, 'info');
  }

  // 4. COMPANY SCANNER VIEW
  renderScannerView() {
    this.container.innerHTML = `
      <div class="chart-card">
        <div class="chart-header">
          <div class="chart-title-area">
            <h2 class="chart-title">Quantitative Company Scanner</h2>
            <div class="chart-subtitle">Combine multi-asset fundamental, risk, and sector parameters</div>
          </div>
          <button class="btn btn-secondary btn-sm" onclick="InvestIQ.resetScanner()">Reset Filters</button>
        </div>

        <!-- Filter Controls Bar -->
        <div class="scanner-filter-bar">
          <div class="form-group" style="min-width: 130px;">
            <label class="form-label">Country</label>
            <select class="form-select btn-sm" id="scannerCountry" onchange="InvestIQ.applyScannerFilters()">
              <option value="ALL">All Regions</option>
              <option value="USA">USA</option>
              <option value="India">India</option>
              <option value="UK">United Kingdom</option>
              <option value="Germany">Germany</option>
              <option value="Japan">Japan</option>
              <option value="Canada">Canada</option>
              <option value="Australia">Australia</option>
            </select>
          </div>

          <div class="form-group" style="min-width: 140px;">
            <label class="form-label">Sector</label>
            <select class="form-select btn-sm" id="scannerSector" onchange="InvestIQ.applyScannerFilters()">
              <option value="ALL">All Sectors</option>
              <option value="Technology">Technology</option>
              <option value="Financial">Financial</option>
              <option value="Healthcare">Healthcare</option>
              <option value="Consumer Cyclical">Consumer Cyclical</option>
              <option value="Energy">Energy</option>
              <option value="Industrials">Industrials</option>
            </select>
          </div>

          <div class="form-group" style="min-width: 120px;">
            <label class="form-label">Risk Profile</label>
            <select class="form-select btn-sm" id="scannerRisk" onchange="InvestIQ.applyScannerFilters()">
              <option value="ALL">All Risk Levels</option>
              <option value="LOW">Low Risk</option>
              <option value="MEDIUM">Medium Risk</option>
              <option value="HIGH">High Risk</option>
            </select>
          </div>

          <div class="form-group" style="min-width: 130px;">
            <label class="form-label">Performance</label>
            <select class="form-select btn-sm" id="scannerPerf" onchange="InvestIQ.applyScannerFilters()">
              <option value="ALL">All Trajectories</option>
              <option value="POSITIVE">Positive Today (+)</option>
              <option value="NEGATIVE">Negative Today (-)</option>
            </select>
          </div>

          <div class="form-group" style="min-width: 140px;">
            <label class="form-label">Sort Order</label>
            <select class="form-select btn-sm" id="scannerSort" onchange="InvestIQ.applyScannerFilters()">
              <option value="marketCap_desc">Market Cap: High to Low</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="changePct_desc">Daily Return: High to Low</option>
              <option value="pe_asc">P/E Ratio: Lowest First</option>
            </select>
          </div>
        </div>

        <div style="font-size: 0.8rem; color: var(--text-tertiary); margin-top: 8px;" id="scannerMatchCount">
          Showing ${MarketDataService.companies.length} matching securities
        </div>

        <!-- Scanner Company Cards Grid -->
        <div class="movers-grid" id="scannerResultsGrid" style="margin-top: 14px; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));">
          <!-- Populated via renderScannerResults() -->
        </div>
      </div>
    `;

    this.applyScannerFilters();
  }

  applyScannerFilters() {
    const country = document.getElementById('scannerCountry')?.value || 'ALL';
    const sector = document.getElementById('scannerSector')?.value || 'ALL';
    const risk = document.getElementById('scannerRisk')?.value || 'ALL';
    const perf = document.getElementById('scannerPerf')?.value || 'ALL';
    const sortVal = document.getElementById('scannerSort')?.value || 'marketCap_desc';

    const [sortBy, sortDir] = sortVal.split('_');

    let results = MarketDataService.searchCompanies({ country, sector, risk, sortBy, sortDir });

    if (perf === 'POSITIVE') results = results.filter(c => c.changePct >= 0);
    if (perf === 'NEGATIVE') results = results.filter(c => c.changePct < 0);

    const countEl = document.getElementById('scannerMatchCount');
    if (countEl) countEl.textContent = `Showing ${results.length} matching institutional assets`;

    const grid = document.getElementById('scannerResultsGrid');
    if (!grid) return;

    const curr = State.state.currency;

    grid.innerHTML = results.map(c => `
      <div class="glass-panel" style="padding: 18px; display: flex; flex-direction: column; gap: 12px;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
          <div>
            <div style="font-size: 1.05rem; font-weight: 800;">${c.symbol}</div>
            <div style="font-size: 0.74rem; color: var(--text-secondary);">${c.name}</div>
          </div>
          <span class="badge ${c.riskLevel === 'HIGH' ? 'badge-risk-high' : c.riskLevel === 'MEDIUM' ? 'badge-risk-med' : 'badge-risk-low'}">
            ${c.riskLevel}
          </span>
        </div>

        <div style="display: flex; justify-content: space-between; align-items: baseline;">
          <div class="mono" style="font-size: 1.35rem; font-weight: 800;">${Utils.formatCurrency(c.price, curr)}</div>
          <span class="badge ${c.changePct >= 0 ? 'badge-gain' : 'badge-loss'}">${Utils.formatPercent(c.changePct)}</span>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 0.72rem; color: var(--text-tertiary); background: rgba(255,255,255,0.02); padding: 8px; border-radius: var(--radius-sm);">
          <div>Mkt Cap: <strong class="mono" style="color: var(--text-primary);">${Utils.formatCompactNumber(c.marketCap, curr)}</strong></div>
          <div>P/E: <strong class="mono" style="color: var(--text-primary);">${c.pe ? c.pe.toFixed(1) : '—'}</strong></div>
          <div>Exchange: <strong style="color: var(--text-primary);">${c.exchange}</strong></div>
          <div>Region: <strong style="color: var(--text-primary);">${c.country}</strong></div>
        </div>

        <div style="display: flex; gap: 6px; margin-top: auto;">
          <button class="btn btn-secondary btn-sm" style="flex: 1;" onclick="InvestIQ.openResearch('${c.symbol}')">Research</button>
          <button class="btn btn-secondary btn-sm" onclick="InvestIQ.toggleWatchlistBtn('${c.symbol}')">
            ${State.isInWatchlist(c.symbol) ? '★' : '☆'}
          </button>
          <button class="btn btn-primary btn-sm" onclick="InvestIQ.openTransactionModal('${c.symbol}', 'BUY')">Simulate</button>
        </div>
      </div>
    `).join('');
  }

  resetScanner() {
    if (document.getElementById('scannerCountry')) document.getElementById('scannerCountry').value = 'ALL';
    if (document.getElementById('scannerSector')) document.getElementById('scannerSector').value = 'ALL';
    if (document.getElementById('scannerRisk')) document.getElementById('scannerRisk').value = 'ALL';
    if (document.getElementById('scannerPerf')) document.getElementById('scannerPerf').value = 'ALL';
    this.applyScannerFilters();
  }

  // 5. COMPANY RESEARCH PAGE
  renderResearchView() {
    const symbol = State.state.activeResearchSymbol || 'AAPL';
    const comp = MarketDataService.getCompany(symbol) || MarketDataService.companies[0];
    const riskAnalysis = RiskEngine.calculateAssetRisk(comp);
    const curr = State.state.currency;

    this.container.innerHTML = `
      <!-- Company Header Card -->
      <div class="research-header-card">
        <div class="company-profile-main">
          <div class="company-logo-avatar">${comp.symbol.substring(0, 2)}</div>
          <div class="company-title-info">
            <h2 class="company-name-heading">
              ${comp.name} (${comp.symbol})
              <span class="badge ${comp.riskLevel === 'HIGH' ? 'badge-risk-high' : comp.riskLevel === 'MEDIUM' ? 'badge-risk-med' : 'badge-risk-low'}">
                ${comp.riskLevel} RISK
              </span>
            </h2>
            <div class="company-meta-tags">
              <span>${comp.flag} ${comp.country}</span>
              <span>•</span>
              <span>${comp.exchange}</span>
              <span>•</span>
              <span>${comp.sector}</span>
              <span>•</span>
              <span>${comp.industry}</span>
            </div>
          </div>
        </div>

        <div style="display: flex; align-items: center; gap: 24px; flex-wrap: wrap;">
          <div class="company-price-display">
            <div class="company-current-price">${Utils.formatCurrency(comp.price, curr)}</div>
            <span class="badge ${comp.changePct >= 0 ? 'badge-gain' : 'badge-loss'}">${Utils.formatPercent(comp.changePct)} Today</span>
          </div>

          <div style="display: flex; gap: 8px;">
            <button class="btn btn-secondary btn-sm" onclick="InvestIQ.toggleWatchlistBtn('${comp.symbol}')">
              ${State.isInWatchlist(comp.symbol) ? '★ On Watchlist' : '☆ Add to Watchlist'}
            </button>
            <button class="btn btn-secondary btn-sm" onclick="InvestIQ.addToCompare('${comp.symbol}')">
              ⇄ Compare
            </button>
            <button class="btn btn-secondary btn-sm" onclick="InvestIQ.openAlertModal('${comp.symbol}')">
              🔔 Set Alert
            </button>
            <button class="btn btn-primary btn-sm" onclick="InvestIQ.openTransactionModal('${comp.symbol}', 'BUY')">
              + Simulate Buy
            </button>
          </div>
        </div>
      </div>

      <!-- Financial Metrics Key Highlights -->
      <div class="key-financials-grid">
        <div class="fin-metric-cell">
          <span class="fin-metric-label">Market Capitalization</span>
          <span class="fin-metric-val">${Utils.formatCompactNumber(comp.marketCap, curr)}</span>
        </div>
        <div class="fin-metric-cell">
          <span class="fin-metric-label">52-Week Range</span>
          <span class="fin-metric-val text-sm">${Utils.formatCurrency(comp.low52, curr, 0)} – ${Utils.formatCurrency(comp.high52, curr, 0)}</span>
        </div>
        <div class="fin-metric-cell">
          <span class="fin-metric-label">Trailing P/E Ratio</span>
          <span class="fin-metric-val">${comp.pe ? comp.pe.toFixed(1) : '—'}x</span>
        </div>
        <div class="fin-metric-cell">
          <span class="fin-metric-label">EPS (Diluted)</span>
          <span class="fin-metric-val">$${comp.eps ? comp.eps.toFixed(2) : '—'}</span>
        </div>
        <div class="fin-metric-cell">
          <span class="fin-metric-label">Beta (Market Sensitivity)</span>
          <span class="fin-metric-val">${comp.beta ? comp.beta.toFixed(2) : '1.00'}</span>
        </div>
        <div class="fin-metric-cell">
          <span class="fin-metric-label">Dividend Yield</span>
          <span class="fin-metric-val">${comp.dividendYield ? comp.dividendYield.toFixed(2) : '0.00'}%</span>
        </div>
        <div class="fin-metric-cell">
          <span class="fin-metric-label">Annual Revenue</span>
          <span class="fin-metric-val">${Utils.formatCompactNumber(comp.revenue, curr)}</span>
        </div>
        <div class="fin-metric-cell">
          <span class="fin-metric-label">Net Income</span>
          <span class="fin-metric-val">${Utils.formatCompactNumber(comp.netProfit, curr)}</span>
        </div>
      </div>

      <!-- Historical Chart & Risk Breakdown Grid -->
      <div class="company-research-grid">
        <!-- Interactive Chart Card -->
        <div class="chart-card">
          <div class="chart-header">
            <div class="chart-title-area">
              <div class="chart-title">${comp.symbol} Price & Trading Volume Trajectory</div>
              <div class="chart-subtitle">High-precision historical candlestick & volume distribution</div>
            </div>
            <div class="timeframe-pill-group">
              ${['1D', '1W', '1M', '6M', '1Y', '5Y', 'MAX'].map(tf => `
                <button class="tf-pill ${tf === this.activeTimeframe ? 'active' : ''}" onclick="InvestIQ.setTimeframe('${tf}')">${tf}</button>
              `).join('')}
            </div>
          </div>

          <div class="chart-canvas-wrapper" style="height: 360px;">
            <canvas id="researchPriceCanvas"></canvas>
            <div class="chart-tooltip" id="researchChartTooltip"></div>
          </div>
        </div>

        <!-- Transparent Risk Factor Attribution -->
        <div class="chart-card">
          <div class="chart-header">
            <div class="chart-title-area">
              <div class="chart-title">Asset Risk Factors</div>
              <div class="chart-subtitle">Quantitative risk scoring breakdown</div>
            </div>
            <span class="badge ${riskAnalysis.level === 'HIGH' ? 'badge-risk-high' : riskAnalysis.level === 'MEDIUM' ? 'badge-risk-med' : 'badge-risk-low'}">
              ${riskAnalysis.score} / 100
            </span>
          </div>

          <div style="display: flex; flex-direction: column; gap: 12px;">
            ${riskAnalysis.factors.map(f => `
              <div class="risk-factor-row">
                <div class="risk-factor-header">
                  <span>${f.name}</span>
                  <span class="mono font-bold">${f.raw}</span>
                </div>
                <div class="risk-bar-track">
                  <div class="risk-bar-fill" style="width: ${f.score}%; background: ${f.score > 65 ? 'var(--color-loss)' : f.score > 35 ? 'var(--color-warn)' : 'var(--color-gain)'};"></div>
                </div>
              </div>
            `).join('')}
          </div>

          <div style="margin-top: 14px; display: flex; flex-direction: column; gap: 8px;">
            <div style="font-size: 0.78rem; font-weight: 700; color: var(--text-tertiary); text-transform: uppercase;">Observation Summary</div>
            ${riskAnalysis.explanations.map(exp => `
              <div style="font-size: 0.78rem; color: var(--text-secondary); background: rgba(255,255,255,0.02); padding: 8px 10px; border-radius: var(--radius-sm); border-left: 2px solid var(--brand-cyan);">
                <strong>${exp.factor}:</strong> ${exp.detail}
              </div>
            `).join('')}
          </div>
        </div>
      </div>

      <!-- Business Description Section -->
      <div class="chart-card">
        <h3 class="chart-title" style="margin-bottom: 8px;">Business Profile & Institutional Context</h3>
        <p style="font-size: 0.88rem; color: var(--text-secondary); line-height: 1.6;">
          ${comp.description}
        </p>
      </div>
    `;

    setTimeout(() => {
      const canvas = document.getElementById('researchPriceCanvas');
      if (!canvas) return;
      const points = MarketDataService.getHistoricalData(comp.symbol, this.activeTimeframe);
      ChartEngine.renderLineChart(canvas, points, {
        color: comp.changePct >= 0 ? '#05D59E' : '#FF3B69',
        colorGlow: comp.changePct >= 0 ? 'rgba(5, 213, 158, 0.25)' : 'rgba(255, 59, 105, 0.25)',
        currency: curr,
        showVolume: true
      });
    }, 50);
  }

  addToCompare(symbol) {
    State.addCompareSymbol(symbol);
    this.showToast('Added to Compare Basket', `${symbol} included in multi-company matrix.`, 'info');
    this.navigateTo('compare');
  }

  // 6. COMPARE FEATURE VIEW
  renderCompareView() {
    const basket = State.state.compareBasket || ['AAPL', 'MSFT', 'NVDA'];
    const companies = basket.map(s => MarketDataService.getCompany(s)).filter(Boolean);
    const curr = State.state.currency;

    this.container.innerHTML = `
      <div class="chart-card">
        <div class="chart-header">
          <div class="chart-title-area">
            <h2 class="chart-title">Multi-Asset Comparative Analysis</h2>
            <div class="chart-subtitle">Directly evaluate fundamentals, valuation multiples, and historical returns side-by-side</div>
          </div>
        </div>

        <!-- Basket selector -->
        <div class="compare-selector-bar">
          <span class="text-xs text-muted font-bold">COMPARING:</span>
          ${companies.map(c => `
            <div class="compare-tag">
              <span>${c.symbol}</span>
              <span class="compare-tag-remove" onclick="InvestIQ.removeFromCompare('${c.symbol}')">&times;</span>
            </div>
          `).join('')}

          ${companies.length < 5 ? `
            <select class="form-select btn-sm" onchange="if(this.value){ InvestIQ.addToCompare(this.value); this.value=''; }">
              <option value="">+ Add Asset to Compare...</option>
              ${MarketDataService.companies.filter(c => !basket.includes(c.symbol)).map(c => `
                <option value="${c.symbol}">${c.symbol} — ${c.name}</option>
              `).join('')}
            </select>
          ` : ''}
        </div>

        <!-- Multi-Line Normalized Return Comparison Chart -->
        <div style="margin-top: 14px;">
          <div style="font-weight: 700; font-size: 0.92rem; margin-bottom: 6px;">1-Year Normalized Return Performance</div>
          <div class="chart-canvas-wrapper" style="height: 320px;">
            <canvas id="compareMultiCanvas"></canvas>
          </div>
        </div>

        <!-- Comparison Matrix Table -->
        <div class="table-responsive" style="margin-top: 16px;">
          <table class="data-table">
            <thead>
              <tr>
                <th>Metric / Indicator</th>
                ${companies.map(c => `<th>${c.symbol} (${c.name})</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="font-weight: 600;">Current Price</td>
                ${companies.map(c => `<td class="mono font-bold">${Utils.formatCurrency(c.price, curr)}</td>`).join('')}
              </tr>
              <tr>
                <td style="font-weight: 600;">Market Capitalization</td>
                ${companies.map(c => `<td class="mono">${Utils.formatCompactNumber(c.marketCap, curr)}</td>`).join('')}
              </tr>
              <tr>
                <td style="font-weight: 600;">P/E Valuation</td>
                ${companies.map(c => `<td class="mono">${c.pe ? c.pe.toFixed(1) + 'x' : '—'}</td>`).join('')}
              </tr>
              <tr>
                <td style="font-weight: 600;">EPS (Diluted)</td>
                ${companies.map(c => `<td class="mono">$${c.eps ? c.eps.toFixed(2) : '—'}</td>`).join('')}
              </tr>
              <tr>
                <td style="font-weight: 600;">Market Sensitivity (Beta)</td>
                ${companies.map(c => `<td class="mono">${c.beta ? c.beta.toFixed(2) : '1.00'}</td>`).join('')}
              </tr>
              <tr>
                <td style="font-weight: 600;">30D Volatility</td>
                ${companies.map(c => `<td class="mono">${c.volatility30d}%</td>`).join('')}
              </tr>
              <tr>
                <td style="font-weight: 600;">Risk Level</td>
                ${companies.map(c => `
                  <td>
                    <span class="badge ${c.riskLevel === 'HIGH' ? 'badge-risk-high' : c.riskLevel === 'MEDIUM' ? 'badge-risk-med' : 'badge-risk-low'}">
                      ${c.riskLevel}
                    </span>
                  </td>
                `).join('')}
              </tr>
              <tr>
                <td style="font-weight: 600;">Actions</td>
                ${companies.map(c => `
                  <td>
                    <button class="btn btn-secondary btn-sm" onclick="InvestIQ.openResearch('${c.symbol}')">Research</button>
                  </td>
                `).join('')}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    `;

    setTimeout(() => {
      const canvas = document.getElementById('compareMultiCanvas');
      if (!canvas) return;
      const colors = ['#00F0FF', '#8B5CF6', '#05D59E', '#FFB020', '#FF3B69'];
      const seriesList = companies.map((c, i) => ({
        symbol: c.symbol,
        color: colors[i % colors.length],
        points: MarketDataService.getHistoricalData(c.symbol, '1Y')
      }));
      ChartEngine.renderMultiLineChart(canvas, seriesList);
    }, 50);
  }

  removeFromCompare(symbol) {
    State.removeCompareSymbol(symbol);
    this.renderCurrentView();
  }

  // 7. WATCHLIST VIEW
  renderWatchlistView() {
    const list = State.state.watchlist || [];
    const companies = list.map(sym => MarketDataService.getCompany(sym)).filter(Boolean);
    const curr = State.state.currency;

    this.container.innerHTML = `
      <div class="chart-card">
        <div class="chart-header">
          <div class="chart-title-area">
            <h2 class="chart-title">Monitored Watchlist (${companies.length} Assets)</h2>
            <div class="chart-subtitle">Real-time surveillance on priority global companies</div>
          </div>
          <button class="btn btn-secondary btn-sm" onclick="InvestIQ.navigateTo('markets')">+ Add Companies from Markets</button>
        </div>

        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>Company / Symbol</th>
                <th>Exchange</th>
                <th>Price</th>
                <th>24h Change</th>
                <th>Risk Profile</th>
                <th>Volume</th>
                <th>Surveillance Alerts</th>
                <th style="text-align: right;">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${companies.map(c => `
                <tr>
                  <td>
                    <div style="display: flex; align-items: center; gap: 10px; cursor: pointer;" onclick="InvestIQ.openResearch('${c.symbol}')">
                      <div style="font-weight: 700;">${c.symbol}</div>
                      <div style="font-size: 0.72rem; color: var(--text-tertiary);">${c.name}</div>
                    </div>
                  </td>
                  <td>${c.exchange} (${c.flag})</td>
                  <td class="mono font-bold">${Utils.formatCurrency(c.price, curr)}</td>
                  <td>
                    <span class="badge ${c.changePct >= 0 ? 'badge-gain' : 'badge-loss'}">${Utils.formatPercent(c.changePct)}</span>
                  </td>
                  <td>
                    <span class="badge ${c.riskLevel === 'HIGH' ? 'badge-risk-high' : c.riskLevel === 'MEDIUM' ? 'badge-risk-med' : 'badge-risk-low'}">
                      ${c.riskLevel}
                    </span>
                  </td>
                  <td class="mono text-xs">${c.volume.toLocaleString()}</td>
                  <td>
                    <button class="btn btn-ghost btn-sm" onclick="InvestIQ.openAlertModal('${c.symbol}')">🔔 Create Alert</button>
                  </td>
                  <td style="text-align: right;">
                    <div style="display: inline-flex; gap: 6px;">
                      <button class="btn btn-secondary btn-sm" onclick="InvestIQ.openResearch('${c.symbol}')">Research</button>
                      <button class="btn btn-primary btn-sm" onclick="InvestIQ.openTransactionModal('${c.symbol}', 'BUY')">Simulate Buy</button>
                      <button class="btn btn-ghost btn-sm text-loss" onclick="InvestIQ.toggleWatchlistBtn('${c.symbol}')" title="Remove">✕</button>
                    </div>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  // 8. PORTFOLIO VIEW
  renderPortfolioView() {
    const summary = State.getPortfolioSummary();
    const curr = State.state.currency;

    this.container.innerHTML = `
      <div class="chart-card">
        <div class="chart-header">
          <div class="chart-title-area">
            <h2 class="chart-title">Portfolio Management</h2>
            <div class="chart-subtitle">Active positions, P&L attribution, cost basis, and weight allocation</div>
          </div>
          <button class="btn btn-primary btn-sm" onclick="InvestIQ.openTransactionModal('AAPL', 'BUY')">
            + New Simulated Order
          </button>
        </div>

        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>Holding / Symbol</th>
                <th>Quantity</th>
                <th>Avg Buy Price</th>
                <th>Current Price</th>
                <th>Position Value</th>
                <th>Unrealized P&L</th>
                <th>Return %</th>
                <th>Weight %</th>
                <th style="text-align: right;">Simulate Action</th>
              </tr>
            </thead>
            <tbody>
              ${summary.holdings.map(h => `
                <tr>
                  <td>
                    <div style="display: flex; align-items: center; gap: 10px; cursor: pointer;" onclick="InvestIQ.openResearch('${h.symbol}')">
                      <div>
                        <div style="font-weight: 700;">${h.symbol}</div>
                        <div style="font-size: 0.72rem; color: var(--text-tertiary);">${h.company.name}</div>
                      </div>
                    </div>
                  </td>
                  <td class="mono font-bold">${h.quantity}</td>
                  <td class="mono">${Utils.formatCurrency(h.avgBuyPrice, curr)}</td>
                  <td class="mono font-bold">${Utils.formatCurrency(h.company.price, curr)}</td>
                  <td class="mono font-bold">${Utils.formatCurrency(h.currentValue, curr)}</td>
                  <td class="mono font-bold ${h.pnl >= 0 ? 'text-gain' : 'text-loss'}">
                    ${h.pnl >= 0 ? '+' : ''}${Utils.formatCurrency(h.pnl, curr)}
                  </td>
                  <td>
                    <span class="badge ${h.returnPct >= 0 ? 'badge-gain' : 'badge-loss'}">
                      ${Utils.formatPercent(h.returnPct)}
                    </span>
                  </td>
                  <td class="mono">${h.weight.toFixed(1)}%</td>
                  <td style="text-align: right;">
                    <div style="display: inline-flex; gap: 6px;">
                      <button class="btn btn-secondary btn-sm" onclick="InvestIQ.openTransactionModal('${h.symbol}', 'BUY')">Buy More</button>
                      <button class="btn btn-danger btn-sm" onclick="InvestIQ.openTransactionModal('${h.symbol}', 'SELL')">Sell</button>
                    </div>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  // 9. TRANSACTIONS HISTORY VIEW
  renderTransactionsView() {
    const txs = State.state.transactions || [];
    const curr = State.state.currency;

    this.container.innerHTML = `
      <div class="chart-card">
        <div class="chart-header">
          <div class="chart-title-area">
            <h2 class="chart-title">Simulated Transaction Ledger (${txs.length} Orders)</h2>
            <div class="chart-subtitle">Historical simulated buy and sell execution records</div>
          </div>
          <button class="btn btn-primary btn-sm" onclick="InvestIQ.openTransactionModal('AAPL', 'BUY')">
            + New Simulated Order
          </button>
        </div>

        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Order Type</th>
                <th>Asset Symbol</th>
                <th>Quantity</th>
                <th>Execution Price</th>
                <th>Total Value</th>
                <th>Hypothesis / Notes</th>
              </tr>
            </thead>
            <tbody>
              ${txs.map(t => `
                <tr>
                  <td class="mono text-xs">${t.date}</td>
                  <td>
                    <span class="badge ${t.type === 'BUY' ? 'badge-gain' : 'badge-loss'}">
                      ${t.type}
                    </span>
                  </td>
                  <td style="font-weight: 700; cursor: pointer;" onclick="InvestIQ.openResearch('${t.symbol}')">
                    ${t.symbol}
                  </td>
                  <td class="mono font-bold">${t.quantity}</td>
                  <td class="mono">${Utils.formatCurrency(t.price, curr)}</td>
                  <td class="mono font-bold">${Utils.formatCurrency(t.totalValue, curr)}</td>
                  <td style="font-size: 0.78rem; color: var(--text-secondary);">${escapeHtml(t.notes || '—')}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  // 10. ANALYTICS VIEW
  renderAnalyticsView() {
    const summary = State.getPortfolioSummary();
    const curr = State.state.currency;

    this.container.innerHTML = `
      <div class="dashboard-grid-main">
        <div class="chart-card">
          <div class="chart-header">
            <div class="chart-title-area">
              <h2 class="chart-title">Portfolio Performance vs Benchmark</h2>
              <div class="chart-subtitle">Simulated portfolio vs S&P 500 Index (1-Year curve)</div>
            </div>
          </div>
          <div class="chart-canvas-wrapper" style="height: 320px;">
            <canvas id="analyticsBenchCanvas"></canvas>
          </div>
        </div>

        <div class="chart-card">
          <div class="chart-header">
            <div class="chart-title-area">
              <h2 class="chart-title">Diversification & Concentration</h2>
              <div class="chart-subtitle">Quantitative exposure metrics</div>
            </div>
          </div>

          <div style="display: flex; flex-direction: column; gap: 14px; margin-top: 10px;">
            <div style="background: rgba(255,255,255,0.02); border: 1px solid var(--border-subtle); padding: 14px; border-radius: var(--radius-md);">
              <div style="font-size: 0.75rem; color: var(--text-tertiary); text-transform: uppercase;">Diversification Score</div>
              <div class="mono" style="font-size: 1.8rem; font-weight: 800; color: var(--brand-cyan);">
                ${summary.riskProfile.diversificationScore} / 100
              </div>
              <div style="font-size: 0.72rem; color: var(--text-secondary); margin-top: 2px;">
                Higher score reflects broader multi-sector and geographic distribution.
              </div>
            </div>

            <div style="background: rgba(255,255,255,0.02); border: 1px solid var(--border-subtle); padding: 14px; border-radius: var(--radius-md);">
              <div style="font-size: 0.75rem; color: var(--text-tertiary); text-transform: uppercase;">Herfindahl Concentration Index (HHI)</div>
              <div class="mono" style="font-size: 1.8rem; font-weight: 800;">
                ${summary.riskProfile.concentrationHHI}
              </div>
              <div style="font-size: 0.72rem; color: var(--text-secondary); margin-top: 2px;">
                Values below 1,500 indicate an unconcentrated, diversified portfolio.
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    setTimeout(() => {
      const canvas = document.getElementById('analyticsBenchCanvas');
      if (!canvas) return;
      const pts = MarketDataService.getHistoricalData('AAPL', '1Y');
      const bench = MarketDataService.getHistoricalData('MSFT', '1Y');
      ChartEngine.renderLineChart(canvas, pts, {
        color: '#00F0FF',
        colorGlow: 'rgba(0, 240, 255, 0.25)',
        currency: curr,
        showVolume: false,
        benchmarkPoints: bench
      });
    }, 50);
  }

  // 11. RISK ENGINE DEEP DIVE VIEW
  renderRiskView() {
    const summary = State.getPortfolioSummary();
    const risk = summary.riskProfile;

    this.container.innerHTML = `
      <div class="chart-card">
        <div class="chart-header">
          <div class="chart-title-area">
            <h2 class="chart-title">Modular Risk Engine Architecture</h2>
            <div class="chart-subtitle">Transparent multi-factor sensitivity analysis & non-predictive explanations</div>
          </div>
          <span class="badge ${risk.level === 'HIGH' ? 'badge-risk-high' : risk.level === 'MEDIUM' ? 'badge-risk-med' : 'badge-risk-low'}" style="font-size: 0.85rem;">
            ${risk.level} RISK (${risk.score}/100)
          </span>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-top: 14px;">
          <div>
            <h3 style="font-size: 1rem; margin-bottom: 12px;">Component Factor Weights</h3>
            <div style="display: flex; flex-direction: column; gap: 12px;">
              ${risk.factors.map(f => `
                <div class="risk-factor-row">
                  <div class="risk-factor-header">
                    <span>${f.name}</span>
                    <span class="mono font-bold">${f.raw} (${f.level})</span>
                  </div>
                  <div class="risk-bar-track" style="height: 8px;">
                    <div class="risk-bar-fill" style="width: ${f.score}%; background: ${f.score > 65 ? 'var(--color-loss)' : f.score > 35 ? 'var(--color-warn)' : 'var(--color-gain)'};"></div>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

          <div>
            <h3 style="font-size: 1rem; margin-bottom: 12px;">Why is this risk indicator at ${risk.level}?</h3>
            <div style="display: flex; flex-direction: column; gap: 10px;">
              ${risk.explanations.map(exp => `
                <div style="padding: 12px 14px; background: rgba(255,255,255,0.02); border-left: 3px solid var(--brand-cyan); border-radius: var(--radius-sm);">
                  <div style="font-weight: 700; font-size: 0.82rem; color: var(--brand-cyan);">${exp.factor}</div>
                  <div style="font-size: 0.78rem; color: var(--text-secondary); margin-top: 2px;">${exp.detail}</div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // 12. ALERTS CENTER VIEW
  renderAlertsView() {
    const alerts = State.state.alerts || [];

    this.container.innerHTML = `
      <div class="chart-card">
        <div class="chart-header">
          <div class="chart-title-area">
            <h2 class="chart-title">Market & Portfolio Alerts Center</h2>
            <div class="chart-subtitle">Configured surveillance conditions and automated trigger states</div>
          </div>
          <button class="btn btn-primary btn-sm" onclick="InvestIQ.openAlertModal('NVDA')">+ Create Alert</button>
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px; margin-top: 14px;">
          ${alerts.map(a => `
            <div class="glass-panel" style="padding: 18px; display: flex; flex-direction: column; gap: 10px;">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <div style="font-size: 1.1rem; font-weight: 800;">${a.symbol}</div>
                <span class="badge ${a.isTriggered ? 'badge-loss' : 'badge-gain'}">
                  ${a.isTriggered ? 'TRIGGERED' : 'ACTIVE'}
                </span>
              </div>
              <div style="font-size: 0.8rem; color: var(--text-secondary);">
                Condition: <strong>${a.type.replace('_', ' ')}</strong>
              </div>
              <div class="mono" style="font-size: 1.2rem; font-weight: 800; color: var(--brand-cyan);">
                Threshold: ${a.threshold}
              </div>
              <div style="font-size: 0.7rem; color: var(--text-tertiary); margin-top: auto; display: flex; justify-content: space-between; align-items: center;">
                <span>Created ${a.createdAt}</span>
                <button class="btn btn-ghost btn-sm text-loss" onclick="InvestIQ.deleteAlert('${a.id}')">Delete</button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  deleteAlert(alertId) {
    State.deleteAlert(alertId);
    this.showToast('Alert Deleted', 'Surveillance parameter removed.', 'info');
  }

  // 13. INSIGHTS ENGINE VIEW
  renderInsightsView() {
    const summary = State.getPortfolioSummary();

    this.container.innerHTML = `
      <div class="chart-card">
        <div class="chart-header">
          <div class="chart-title-area">
            <h2 class="chart-title">Data-Driven Portfolio Observations</h2>
            <div class="chart-subtitle">Actionable intelligence generated directly from active holdings and market trends</div>
          </div>
        </div>

        <div class="insights-feed" style="margin-top: 14px;">
          ${summary.insights.map(ins => `
            <div class="insight-card" style="padding: 20px;">
              <div class="insight-header">
                <span class="insight-tag" style="font-size: 0.78rem;">${ins.tag}</span>
                <span class="text-xs text-muted">${ins.timestamp}</span>
              </div>
              <h3 class="insight-title" style="font-size: 1.05rem; margin-top: 4px;">${ins.title}</h3>
              <p class="insight-desc" style="font-size: 0.85rem; margin-top: 4px;">${ins.description}</p>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  // 14. SETTINGS VIEW
  renderSettingsView() {
    const user = State.state.currentUser;

    this.container.innerHTML = `
      <div class="chart-card" style="max-width: 800px;">
        <div class="chart-header">
          <div class="chart-title-area">
            <h2 class="chart-title">Workspace Settings</h2>
            <div class="chart-subtitle">Preferences, risk tolerances & simulation database controls</div>
          </div>
        </div>

        <div style="display: flex; flex-direction: column; gap: 20px; margin-top: 14px;">
          <div class="form-group">
            <label class="form-label">Active User Persona</label>
            <input type="text" class="form-input" value="${escapeHtml(user.name)}" readonly>
          </div>

          <div class="form-group">
            <label class="form-label">Email Address</label>
            <input type="text" class="form-input" value="${escapeHtml(user.email)}" readonly>
          </div>

          <div class="form-group">
            <label class="form-label">Preferred Currency</label>
            <select class="form-select" onchange="State.setCurrency(this.value); InvestIQ.showToast('Currency Updated', this.value, 'info');">
              <option value="USD" ${State.state.currency === 'USD' ? 'selected' : ''}>USD ($) — United States Dollar</option>
              <option value="INR" ${State.state.currency === 'INR' ? 'selected' : ''}>INR (₹) — Indian Rupee</option>
              <option value="EUR" ${State.state.currency === 'EUR' ? 'selected' : ''}>EUR (€) — Euro</option>
              <option value="GBP" ${State.state.currency === 'GBP' ? 'selected' : ''}>GBP (£) — British Pound</option>
              <option value="JPY" ${State.state.currency === 'JPY' ? 'selected' : ''}>JPY (¥) — Japanese Yen</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Risk Tolerance Benchmark</label>
            <select class="form-select" onchange="State.state.riskTolerance = this.value; State.saveState(); InvestIQ.showToast('Risk Profile Updated', this.value, 'info');">
              <option value="low" ${State.state.riskTolerance === 'low' ? 'selected' : ''}>Conservative (Low Risk Target)</option>
              <option value="medium" ${State.state.riskTolerance === 'medium' ? 'selected' : ''}>Balanced Growth (Moderate Risk Target)</option>
              <option value="high" ${State.state.riskTolerance === 'high' ? 'selected' : ''}>Aggressive (High Growth Target)</option>
            </select>
          </div>

          <div style="border-top: 1px solid var(--border-subtle); padding-top: 16px;">
            <h4 style="font-size: 0.95rem; margin-bottom: 8px;">Reset Simulated Environment</h4>
            <p style="font-size: 0.78rem; color: var(--text-tertiary); margin-bottom: 12px;">
              Reverts holdings, transaction history, and watchlist back to initial hackathon demonstration baseline.
            </p>
            <button class="btn btn-secondary btn-sm" onclick="State.resetDemoData(); InvestIQ.showToast('Reset Complete', 'Workspace restored to default state.', 'info');">
              Reset Demo Workspace
            </button>
          </div>
        </div>
      </div>
    `;
  }
}

// Helper to escape HTML characters
function escapeHtml(str) {
  if (!str) return '';
  return str.toString()
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Instantiate Global App Controller
let InvestIQ;
window.addEventListener('DOMContentLoaded', () => {
  InvestIQ = new InvestIQApp();
});
