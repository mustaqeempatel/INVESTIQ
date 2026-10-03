/* ==========================================================================
   INVESTIQ MODULAR RISK ENGINE
   Transparent, Multi-Factor Portfolio & Asset Risk Analysis
   Strictly Informational & Non-Prescriptive
   ========================================================================== */

const RiskEngine = {
  // Configurable Factor Weights for Portfolio Risk Score
  weights: {
    volatility: 0.25,     // Historical price fluctuation
    concentration: 0.25,  // Herfindahl-Hirschman single-asset weight penalty
    sectorTilt: 0.20,     // Single sector dominating > 35%
    drawdown: 0.15,       // 1-year historical peak-to-trough decline
    valuation: 0.15       // Weighted portfolio P/E vs market baseline
  },

  // Calculate Asset Level Risk Factors
  calculateAssetRisk(company) {
    if (!company) return null;

    // 1. Volatility Score (0-100): <15% is low, 15-28% medium, >28% high
    const vol = company.volatility30d || 15;
    const volScore = Math.min(100, Math.max(10, Math.round((vol / 35) * 100)));

    // 2. Drawdown Score (0-100): absolute drawdown
    const dd = Math.abs(company.maxDrawdown1y || 12);
    const ddScore = Math.min(100, Math.max(10, Math.round((dd / 35) * 100)));

    // 3. Valuation Score (0-100): P/E relative to baseline of 25
    const pe = company.pe || 20;
    const valScore = Math.min(100, Math.max(15, Math.round((pe / 60) * 100)));

    // 4. Beta Score (0-100): Beta relative to market 1.0
    const beta = company.beta || 1.0;
    const betaScore = Math.min(100, Math.max(10, Math.round((beta / 2.0) * 100)));

    // Composite Asset Risk
    const compositeScore = Math.round(
      volScore * 0.35 +
      ddScore * 0.25 +
      valScore * 0.20 +
      betaScore * 0.20
    );

    let level = 'LOW';
    if (compositeScore >= 66) level = 'HIGH';
    else if (compositeScore >= 36) level = 'MEDIUM';

    // Transparent factor explanations (Neutral language)
    const explanations = [];
    if (volScore >= 65) explanations.push({ factor: 'Historical Volatility', detail: `30-Day annualized volatility is elevated at ${vol.toFixed(1)}%.` });
    if (ddScore >= 65) explanations.push({ factor: 'Drawdown History', detail: `Asset has experienced a maximum historical drawdown of -${dd.toFixed(1)}% in the past year.` });
    if (valScore >= 70) explanations.push({ factor: 'Valuation Multiple', detail: `Trailing P/E ratio (${pe.toFixed(1)}x) trades at a premium relative to broader market averages.` });
    if (betaScore >= 65) explanations.push({ factor: 'Market Sensitivity', detail: `Beta of ${beta.toFixed(2)} indicates higher sensitivity to broad index swings.` });
    
    if (explanations.length === 0) {
      explanations.push({ factor: 'Balanced Profile', detail: 'Volatility, valuation multiples, and historical drawdowns are within normal historical ranges.' });
    }

    return {
      score: compositeScore,
      level,
      factors: [
        { name: 'Historical Volatility', score: volScore, raw: `${vol.toFixed(1)}%`, level: volScore > 65 ? 'Elevated' : volScore > 35 ? 'Moderate' : 'Low' },
        { name: 'Historical Drawdown', score: ddScore, raw: `-${dd.toFixed(1)}%`, level: ddScore > 65 ? 'Elevated' : ddScore > 35 ? 'Moderate' : 'Low' },
        { name: 'Valuation Multiple', score: valScore, raw: `${pe.toFixed(1)}x P/E`, level: valScore > 65 ? 'Elevated' : valScore > 35 ? 'Moderate' : 'Low' },
        { name: 'Market Sensitivity', score: betaScore, raw: `${beta.toFixed(2)} Beta`, level: betaScore > 65 ? 'Elevated' : betaScore > 35 ? 'Moderate' : 'Low' }
      ],
      explanations
    };
  },

  // Calculate Complete Portfolio Risk Profile
  calculatePortfolioRisk(holdings = [], cashBalance = 0) {
    if (!holdings || holdings.length === 0) {
      return {
        score: 10,
        level: 'LOW',
        volatility: 0,
        concentrationHHI: 0,
        maxAssetWeight: 0,
        maxSectorWeight: 0,
        topSector: 'Cash / None',
        diversificationScore: 100,
        factors: [],
        explanations: [
          { factor: 'Cash Preservation', detail: 'No active equity holdings detected; portfolio is 100% liquid capital.' }
        ]
      };
    }

    // 1. Calculate values and total portfolio equity
    let totalEquityVal = 0;
    const enriched = holdings.map(h => {
      const company = MarketDataService.getCompany(h.symbol) || {
        price: h.avgBuyPrice,
        volatility30d: 18,
        maxDrawdown1y: -15,
        pe: 22,
        sector: 'Diversified',
        country: 'Global'
      };
      const value = h.quantity * company.price;
      totalEquityVal += value;
      return { ...h, company, value };
    });

    const totalPortfolioVal = totalEquityVal + (cashBalance || 0);

    // 2. Weights & Herfindahl-Hirschman Concentration Index (HHI)
    let hhi = 0;
    let maxAssetWeight = 0;
    let maxAsset = null;
    let weightedVol = 0;
    let weightedDrawdown = 0;
    let weightedPE = 0;

    const sectorWeights = {};
    const countryWeights = {};

    enriched.forEach(item => {
      const weight = totalPortfolioVal > 0 ? (item.value / totalPortfolioVal) : 0;
      hhi += Math.pow(weight * 100, 2);

      if (weight > maxAssetWeight) {
        maxAssetWeight = weight;
        maxAsset = item.company.name || item.symbol;
      }

      weightedVol += (item.company.volatility30d || 15) * weight;
      weightedDrawdown += Math.abs(item.company.maxDrawdown1y || 12) * weight;
      weightedPE += (item.company.pe || 22) * weight;

      // Sector aggregation
      const sec = item.company.sector || 'Other';
      sectorWeights[sec] = (sectorWeights[sec] || 0) + weight;

      // Country aggregation
      const cty = item.company.country || 'Global';
      countryWeights[cty] = (countryWeights[cty] || 0) + weight;
    });

    // Find top sector
    let topSector = 'None';
    let maxSectorWeight = 0;
    Object.entries(sectorWeights).forEach(([sec, w]) => {
      if (w > maxSectorWeight) {
        maxSectorWeight = w;
        topSector = sec;
      }
    });

    // 3. Normalized Component Scores (0 to 100)
    // Concentration: HHI of 10,000 is 1 stock (high risk). HHI < 1,500 is diversified.
    const concentrationScore = Math.min(100, Math.max(10, Math.round((hhi / 3500) * 100)));

    // Volatility Score
    const volScore = Math.min(100, Math.max(10, Math.round((weightedVol / 30) * 100)));

    // Sector Tilt: Sector > 30% begins to increase risk score
    const sectorTiltScore = Math.min(100, Math.max(10, Math.round((maxSectorWeight / 0.5) * 100)));

    // Drawdown Score
    const ddScore = Math.min(100, Math.max(10, Math.round((weightedDrawdown / 25) * 100)));

    // Valuation Score
    const valScore = Math.min(100, Math.max(15, Math.round((weightedPE / 45) * 100)));

    // Overall Composite Score (0 - 100)
    const overallScore = Math.round(
      volScore * this.weights.volatility +
      concentrationScore * this.weights.concentration +
      sectorTiltScore * this.weights.sectorTilt +
      ddScore * this.weights.drawdown +
      valScore * this.weights.valuation
    );

    let level = 'LOW';
    if (overallScore >= 66) level = 'HIGH';
    else if (overallScore >= 36) level = 'MEDIUM';

    // Diversification Score (Inverse of concentration)
    const diversificationScore = Math.max(15, Math.min(98, Math.round(100 - (concentrationScore * 0.7 + sectorTiltScore * 0.3))));

    // Informational & Neutral Explanations
    const explanations = [];
    if (maxAssetWeight > 0.25) {
      explanations.push({
        factor: 'Asset Concentration',
        detail: `Single asset ${maxAsset} constitutes ${(maxAssetWeight * 100).toFixed(1)}% of total portfolio value.`
      });
    }
    if (maxSectorWeight > 0.35) {
      explanations.push({
        factor: 'Sector Exposure',
        detail: `${topSector} exposure represents ${(maxSectorWeight * 100).toFixed(1)}% of equity holdings.`
      });
    }
    if (weightedVol > 20) {
      explanations.push({
        factor: 'Elevated Volatility',
        detail: `Asset-weighted portfolio volatility is currently ${weightedVol.toFixed(1)}% annualized.`
      });
    }
    if (weightedPE > 35) {
      explanations.push({
        factor: 'Valuation Premium',
        detail: `Weighted trailing P/E of ${weightedPE.toFixed(1)}x reflects higher growth expectations across holdings.`
      });
    }
    if (explanations.length === 0) {
      explanations.push({
        factor: 'Balanced Allocation',
        detail: 'Portfolio displays healthy cross-sector diversification and managed single-stock exposure.'
      });
    }

    return {
      score: overallScore,
      level,
      volatility: +weightedVol.toFixed(1),
      maxAssetWeight: +(maxAssetWeight * 100).toFixed(1),
      maxSectorWeight: +(maxSectorWeight * 100).toFixed(1),
      topSector,
      concentrationHHI: Math.round(hhi),
      diversificationScore,
      sectorWeights,
      countryWeights,
      factors: [
        { name: 'Portfolio Volatility', score: volScore, raw: `${weightedVol.toFixed(1)}%`, level: volScore > 65 ? 'Elevated' : volScore > 35 ? 'Moderate' : 'Low' },
        { name: 'Asset Concentration', score: concentrationScore, raw: `${(maxAssetWeight * 100).toFixed(1)}% max`, level: concentrationScore > 65 ? 'Elevated' : concentrationScore > 35 ? 'Moderate' : 'Low' },
        { name: 'Sector Exposure', score: sectorTiltScore, raw: `${(maxSectorWeight * 100).toFixed(1)}% ${topSector}`, level: sectorTiltScore > 65 ? 'Elevated' : sectorTiltScore > 35 ? 'Moderate' : 'Low' },
        { name: 'Weighted Drawdown', score: ddScore, raw: `-${weightedDrawdown.toFixed(1)}%`, level: ddScore > 65 ? 'Elevated' : ddScore > 35 ? 'Moderate' : 'Low' },
        { name: 'Valuation Multiple', score: valScore, raw: `${weightedPE.toFixed(1)}x P/E`, level: valScore > 65 ? 'Elevated' : valScore > 35 ? 'Moderate' : 'Low' }
      ],
      explanations
    };
  }
};
