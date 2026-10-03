/* ==========================================================================
   INVESTIQ INSIGHTS ENGINE
   Deterministic, Contextual & Objective Portfolio Intelligence
   Strictly Informational Observations — Never Buy/Sell Directives
   ========================================================================== */

const InsightsEngine = {
  // Generate Live Portfolio Observations
  generateInsights(portfolio, riskProfile, watchlist = []) {
    const insights = [];
    if (!portfolio || !portfolio.holdings || portfolio.holdings.length === 0) {
      return [
        {
          id: 'ins_empty',
          category: 'PORTFOLIO STATUS',
          tag: 'UNALLOCATED',
          type: 'neutral',
          title: 'Simulated Portfolio Awaiting Allocation',
          description: 'No active holdings are currently tracked in this simulation workspace. Explore Global Markets or use the Quick Buy feature to model positions.',
          timestamp: 'Just now'
        }
      ];
    }

    const { holdings, cashBalance, totalEquity, totalValue } = portfolio;

    // 1. Sector Concentration Observation
    if (riskProfile.maxSectorWeight > 35) {
      insights.push({
        id: 'ins_sector_concentration',
        category: 'ALLOCATION CONCENTRATION',
        tag: 'SECTOR TILT',
        type: 'warning',
        title: `${riskProfile.topSector} Exposure Above 35%`,
        description: `${riskProfile.topSector} currently comprises ${riskProfile.maxSectorWeight.toFixed(1)}% of total portfolio value. Sector performance will exert disproportionate influence on overall portfolio volatility.`,
        timestamp: 'Real-time observation'
      });
    }

    // 2. Single-Stock Weight Observation
    if (riskProfile.maxAssetWeight > 22) {
      insights.push({
        id: 'ins_asset_concentration',
        category: 'ASSET WEIGHT',
        tag: 'SINGLE-ASSET EXPOSURE',
        type: 'warning',
        title: 'High Single-Asset Exposure Identified',
        description: `Your largest single position accounts for ${riskProfile.maxAssetWeight.toFixed(1)}% of total equity. Standard institutional diversification models typically maintain single equity exposures below 15-20%.`,
        timestamp: 'Real-time observation'
      });
    }

    // 3. Geographic Diversification Observation
    const countries = Object.keys(riskProfile.countryWeights || {});
    if (countries.length >= 3) {
      insights.push({
        id: 'ins_geo_diversification',
        category: 'GLOBAL REACH',
        tag: 'GEOGRAPHIC SPREAD',
        type: 'positive',
        title: `Multi-Market Global Coverage Active (${countries.length} Nations)`,
        description: `Assets are distributed across ${countries.join(', ')}. This structure mitigates single-nation economic policy and currency risk factors.`,
        timestamp: 'Real-time observation'
      });
    } else if (countries.length === 1) {
      insights.push({
        id: 'ins_single_nation',
        category: 'GEOGRAPHIC REACH',
        tag: 'SINGLE MARKET',
        type: 'info',
        title: `100% Concentration in ${countries[0]} Market`,
        description: `All active portfolio holdings are domiciled within ${countries[0]}. Consider researching complementary international markets to evaluate global uncorrelated returns.`,
        timestamp: 'Real-time observation'
      });
    }

    // 4. Volatility Observation
    if (riskProfile.volatility > 24) {
      insights.push({
        id: 'ins_high_vol',
        category: 'RISK METRICS',
        tag: 'VOLATILITY EXPANSION',
        type: 'warning',
        title: 'Elevated Historical Volatility Detected',
        description: `Current weighted 30-day volatility of ${riskProfile.volatility}% exceeds standard multi-asset benchmarks (14-16%). Price swings are anticipated during market stress.`,
        timestamp: 'Updated today'
      });
    } else {
      insights.push({
        id: 'ins_moderate_vol',
        category: 'RISK METRICS',
        tag: 'VOLATILITY CONTAINMENT',
        type: 'positive',
        title: 'Controlled Volatility Profile',
        description: `Weighted portfolio volatility of ${riskProfile.volatility}% remains within stable ranges relative to major benchmark indices.`,
        timestamp: 'Updated today'
      });
    }

    // 5. Cash Buffer Observation
    const cashPct = totalValue > 0 ? (cashBalance / totalValue) * 100 : 0;
    if (cashPct > 25) {
      insights.push({
        id: 'ins_cash_high',
        category: 'LIQUIDITY',
        tag: 'CAPITAL RESERVE',
        type: 'info',
        title: `High Cash Reserve (${cashPct.toFixed(1)}% of Portfolio)`,
        description: `Significant liquid capital is available to simulate new market entries or hedge during broader market pullbacks.`,
        timestamp: 'Real-time observation'
      });
    } else if (cashPct < 5) {
      insights.push({
        id: 'ins_cash_low',
        category: 'LIQUIDITY',
        tag: 'FULLY DEPLOYED',
        type: 'info',
        title: `Portfolio Nearly Fully Invested (${cashPct.toFixed(1)}% Cash)`,
        description: `Less than 5% unallocated capital remains. Simulated reallocations may require partial divestment.`,
        timestamp: 'Real-time observation'
      });
    }

    // 6. Watchlist Movement Observation
    if (watchlist && watchlist.length > 0) {
      const volatileWatchers = watchlist
        .map(sym => MarketDataService.getCompany(sym))
        .filter(c => c && Math.abs(c.changePct) >= 2.0);

      if (volatileWatchers.length > 0) {
        const names = volatileWatchers.map(c => `${c.symbol} (${c.changePct > 0 ? '+' : ''}${c.changePct}%)`).join(', ');
        insights.push({
          id: 'ins_watchlist_movement',
          category: 'MARKET MONITORING',
          tag: 'WATCHLIST ACTIVITY',
          type: 'info',
          title: 'Notable Movements in Monitored Watchlist',
          description: `Assets on your watchlist recorded significant intraday price adjustments: ${names}.`,
          timestamp: 'Market session update'
        });
      }
    }

    return insights;
  }
};
