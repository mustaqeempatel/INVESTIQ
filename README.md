# INVESTIQ — Global Investment Research & Portfolio Intelligence Workspace

> **Version:** 2.4.0 Production  
> **Platform Classification:** Informational Research & Simulated Portfolio Workspace  
> **Compliance:** Non-Brokerage, Non-Advisory, Zero Real-World Financial Execution  
> **Design Standard:** 3D Spatial Fintech Glassmorphism + WCAG 2.1 AAA High-Contrast Accessible  

---

## 1. Executive Summary & Problem Solved

Investors are constantly forced to switch across disconnected financial tools:
- One site for stock prices
- Another for financial balance sheets and ratios
- Another for charts
- Another for portfolio trackers without risk visibility
- Another for news, watchlists, and alerts

**The Core Problem:**
> *There is too much data, but not enough context.*

**The INVESTIQ Solution:**
INVESTIQ transforms raw financial data into clear context:
$$\text{Raw Market Data} \longrightarrow \text{Understanding} \longrightarrow \text{Portfolio Context} \longrightarrow \text{Risk Visibility} \longrightarrow \text{Actionable Insights}$$

---

## 2. Complete Module Map

| Module | Features & Capabilities |
| :--- | :--- |
| **3D Spatial Hero / Landing** | Interactive 3D particle constellation, problem/solution architecture, 4-step workflow, feature matrix, live preview card. |
| **Executive Dashboard** | 5 animated metric cards (Portfolio Value, Invested Basis, Total P&L, Daily Return, Cash Buffer), Interactive Chart with 7 timeframes, 3D Risk Gauge, Allocation Donut, Top Movers, Recent Alerts, and Insights feed. |
| **Global Market Explorer** | Cross-border coverage across **USA, India, UK, Germany, Japan, Canada, Australia** and 9 major exchanges (NASDAQ, NYSE, NSE, BSE, LSE, XETRA, TSE, TSX, ASX) with live quotes in USD, INR, EUR, GBP, or JPY. |
| **Quantitative Company Scanner** | Multi-factor filtering by Region, Exchange, Sector, Market Cap tier, Risk Score, and Daily Trajectory. |
| **Institutional Company Research** | Full balance sheet metrics, trailing P/E, EPS, Beta, 52W High/Low, Dividend Yield, Volume, 1D–MAX chart with volume bars, and 4 transparent risk factor progress bars. |
| **Multi-Asset Compare Matrix** | Side-by-side fundamental comparison for 2 to 5 assets with normalized 1-year percentage return curves. |
| **Watchlist Surveillance** | Real-time monitoring of selected assets with risk badges, alert shortcuts, and simulated buy shortcuts. |
| **Portfolio Management** | Granular position weights, cost basis, unrealized P&L, return percentages, and cash reserve tracking. |
| **Simulated Transaction Engine** | Buy and Sell simulated order entry with immediate automated recalculation of cost basis, weights, risk scores, and insights. |
| **Transaction Ledger** | Chronological audit trail of simulated executions with notes and filtering. |
| **Portfolio Analytics** | S&P 500 benchmark performance curve, Diversification Score (0–100), and Herfindahl-Hirschman Concentration Index (HHI). |
| **Modular Risk Engine** | Transparent risk decomposition: Historical Volatility (30D), Maximum Drawdowns, Valuation Multiples, and Concentration penalties. |
| **Data-Driven Insights Engine** | Objective, deterministic observations based on active portfolio weights and volatility without prescriptive buy/sell recommendations. |
| **Alerts & Notification Center** | Intraday surveillance on price targets, percentage swings, and volatility expansion. |
| **Workspace Settings** | Real-time currency conversions, Dark/Light theme switching, and demo persona switching (Alex Morgan, Priya Sharma, Marcus Vance). |

---

## 3. Technology Architecture & Security

```
[ User Browser ]
       │
       ▼  (HTTPS / REST / WebSocket Simulation)
[ INVESTIQ Server / Python HTTP Engine ] ◄──► [ SQLite Database ]
       │                                     • Users & Sessions
       ▼                                     • Portfolios & Holdings
[ Modular Risk Engine & Insights Layer ]     • Transactions & Alerts
       │                                     • Watchlist & Settings
       ▼
[ Global Market Data Service ] (USA, India, UK, Germany, Japan, Canada, Australia)
```

- **Server-Side API Security:** Isolated SQLite tables per authenticated user.
- **Client Fallback:** If running offline or via file://, the application transparently leverages client-side `localStorage` state management.
- **Strict Non-Brokerage Guarantee:** No banking credentials, trading PINs, UPI, or real broker API keys are ever requested or stored.

---

## 4. Quick Start & Execution

The application is hosted locally on:
```
http://localhost:8000/
```

To run or restart the server manually:
```bash
python server.py
```

### Pre-Configured Judge Demo Personas
To evaluate different portfolio architectures instantly, use the persona dropdown in the top bar:
1. **Alex Morgan** (Balanced Global Tech Portfolio, USD base, 6 holdings)
2. **Priya Sharma** (Cross-Border Multi-Asset India & US, INR base, 5 holdings)
3. **Marcus Vance** (Defensive Value & Yield Strategy, USD base, 4 holdings)
