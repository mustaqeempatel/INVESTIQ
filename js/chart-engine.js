/* ==========================================================================
   INVESTIQ PRECISION CANVAS CHART ENGINE
   High-DPI, Hardware-Accelerated 2D/3D Financial Visualizations
   No Heavy External Dependencies — Blazing Fast & Fluid
   ========================================================================== */

const ChartEngine = {
  // Helper to setup retina/high-DPI canvas
  setupCanvas(canvas) {
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    
    // Set actual pixel dimensions
    canvas.width = Math.max(300, Math.round(rect.width * dpr));
    canvas.height = Math.max(160, Math.round(rect.height * dpr));
    
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    return { ctx, width: rect.width, height: rect.height, dpr };
  },

  // 1. High-Performance Financial Line / Area Chart with Volume Bars
  renderLineChart(canvas, points, options = {}) {
    const setup = this.setupCanvas(canvas);
    if (!setup || !points || points.length === 0) return;
    const { ctx, width, height } = setup;

    const {
      color = '#00F0FF',
      colorGlow = 'rgba(0, 240, 255, 0.25)',
      isGain = true,
      showVolume = true,
      currency = 'USD',
      benchmarkPoints = null,
      hoverIndex = -1
    } = options;

    ctx.clearRect(0, 0, width, height);

    // Padding
    const padTop = 15;
    const padBottom = showVolume ? 45 : 25;
    const padLeft = 10;
    const padRight = 55;

    const chartW = width - padLeft - padRight;
    const chartH = height - padTop - padBottom;
    const volH = showVolume ? 35 : 0;

    // Price Bounds
    const prices = points.map(p => p.price);
    const minP = Math.min(...prices) * 0.995;
    const maxP = Math.max(...prices) * 1.005;
    const rangeP = maxP - minP || 1;

    // Volume Bounds
    const volumes = points.map(p => p.volume || 1);
    const maxV = Math.max(...volumes) || 1;

    // Coordinates mapping
    const getX = (idx) => padLeft + (idx / (points.length - 1)) * chartW;
    const getY = (val) => padTop + (1 - (val - minP) / rangeP) * chartH;

    // Draw Subtle Grid Lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = padTop + (i / 4) * chartH;
      ctx.beginPath();
      ctx.moveTo(padLeft, y);
      ctx.lineTo(width - padRight, y);
      ctx.stroke();

      // Price Axis Labels
      const pVal = maxP - (i / 4) * rangeP;
      ctx.fillStyle = 'rgba(148, 163, 184, 0.6)';
      ctx.font = '10px JetBrains Mono, monospace';
      ctx.textAlign = 'left';
      ctx.fillText(Utils.formatCurrency(pVal, currency, 0), width - padRight + 6, y + 3);
    }

    // Draw Volume Bars if enabled
    if (showVolume) {
      const barW = Math.max(2, (chartW / points.length) * 0.65);
      points.forEach((p, idx) => {
        const x = getX(idx) - barW / 2;
        const barH = (p.volume / maxV) * volH;
        const y = height - barH - 5;
        
        ctx.fillStyle = (idx > 0 && points[idx].price >= points[idx - 1].price)
          ? 'rgba(5, 213, 158, 0.22)'
          : 'rgba(255, 59, 105, 0.22)';
        ctx.fillRect(x, y, barW, barH);
      });
    }

    // Draw Benchmark Overlay line if available
    if (benchmarkPoints && benchmarkPoints.length === points.length) {
      ctx.save();
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      benchmarkPoints.forEach((bp, idx) => {
        const x = getX(idx);
        const y = getY(bp.price);
        if (idx === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
      ctx.restore();
    }

    // Draw Area Gradient Fill
    const gradient = ctx.createLinearGradient(0, padTop, 0, padTop + chartH);
    gradient.addColorStop(0, colorGlow);
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.beginPath();
    ctx.moveTo(getX(0), getY(points[0].price));
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(getX(i), getY(points[i].price));
    }
    ctx.lineTo(getX(points.length - 1), padTop + chartH);
    ctx.lineTo(getX(0), padTop + chartH);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    // Draw Smooth Primary Price Line
    ctx.beginPath();
    ctx.moveTo(getX(0), getY(points[0].price));
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(getX(i), getY(points[i].price));
    }
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.shadowColor = color;
    ctx.shadowBlur = 10;
    ctx.stroke();
    ctx.shadowBlur = 0; // reset

    // Draw Hover Marker if active
    if (hoverIndex >= 0 && hoverIndex < points.length) {
      const hp = points[hoverIndex];
      const hx = getX(hoverIndex);
      const hy = getY(hp.price);

      // Crosshair
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);

      ctx.beginPath();
      ctx.moveTo(hx, padTop);
      ctx.lineTo(hx, height - 5);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(padLeft, hy);
      ctx.lineTo(width - padRight, hy);
      ctx.stroke();
      ctx.setLineDash([]);

      // Glowing Point
      ctx.beginPath();
      ctx.arc(hx, hy, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#FFFFFF';
      ctx.shadowColor = color;
      ctx.shadowBlur = 12;
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  },

  // 2. Dimensional Allocation Donut / Ring Chart
  renderDonutChart(canvas, segments, options = {}) {
    const setup = this.setupCanvas(canvas);
    if (!setup || !segments || segments.length === 0) return;
    const { ctx, width, height } = setup;

    const {
      hoverIndex = -1,
      centerTitle = 'TOTAL',
      centerValue = '100%',
      donutThickness = 32
    } = options;

    ctx.clearRect(0, 0, width, height);

    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(centerX, centerY) - 15;
    const innerRadius = radius - donutThickness;

    const total = segments.reduce((sum, s) => sum + s.value, 0) || 1;
    let startAngle = -Math.PI / 2;

    segments.forEach((seg, idx) => {
      const sliceAngle = (seg.value / total) * Math.PI * 2;
      const endAngle = startAngle + sliceAngle;
      const isHover = (hoverIndex === idx);

      const rOuter = isHover ? radius + 5 : radius;
      const rInner = isHover ? innerRadius - 2 : innerRadius;

      ctx.beginPath();
      ctx.arc(centerX, centerY, rOuter, startAngle, endAngle, false);
      ctx.arc(centerX, centerY, rInner, endAngle, startAngle, true);
      ctx.closePath();

      ctx.fillStyle = seg.color || '#00F0FF';
      if (isHover) {
        ctx.shadowColor = seg.color;
        ctx.shadowBlur = 15;
      }
      ctx.fill();
      ctx.shadowBlur = 0;

      // Slice separator border
      ctx.strokeStyle = 'var(--bg-card, #0E1420)';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      startAngle = endAngle;
    });

    // Center Text
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(148, 163, 184, 0.7)';
    ctx.font = '600 11px Inter, sans-serif';
    ctx.fillText(centerTitle, centerX, centerY - 8);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '700 17px Outfit, sans-serif';
    ctx.fillText(centerValue, centerX, centerY + 14);
  },

  // 3. 3D Layered Risk Gauge Arc
  renderRiskGauge(canvas, score = 45, level = 'MEDIUM') {
    const setup = this.setupCanvas(canvas);
    if (!setup) return;
    const { ctx, width, height } = setup;

    ctx.clearRect(0, 0, width, height);

    const centerX = width / 2;
    const centerY = height * 0.78;
    const radius = Math.min(width * 0.42, height * 0.72);
    const arcW = 14;

    const startAngle = Math.PI * 0.82;
    const endAngle = Math.PI * 2.18;
    const totalAngle = endAngle - startAngle;

    // Background track
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, startAngle, endAngle);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = arcW;
    ctx.lineCap = 'round';
    ctx.stroke();

    // Color gradient stops
    const grad = ctx.createLinearGradient(centerX - radius, centerY, centerX + radius, centerY);
    grad.addColorStop(0.1, '#05D59E'); // LOW
    grad.addColorStop(0.5, '#FFB020'); // MEDIUM
    grad.addColorStop(0.9, '#FF3B69'); // HIGH

    // Active progress arc
    const progress = Math.min(1, Math.max(0, score / 100));
    const currentAngle = startAngle + totalAngle * progress;

    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, startAngle, currentAngle);
    ctx.strokeStyle = grad;
    ctx.lineWidth = arcW;
    ctx.lineCap = 'round';
    ctx.shadowColor = level === 'HIGH' ? '#FF3B69' : level === 'MEDIUM' ? '#FFB020' : '#05D59E';
    ctx.shadowBlur = 14;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Needle marker
    const markerX = centerX + Math.cos(currentAngle) * radius;
    const markerY = centerY + Math.sin(currentAngle) * radius;

    ctx.beginPath();
    ctx.arc(markerX, markerY, 8, 0, Math.PI * 2);
    ctx.fillStyle = '#FFFFFF';
    ctx.shadowColor = ctx.shadowColor;
    ctx.shadowBlur = 10;
    ctx.fill();
    ctx.shadowBlur = 0;

    // Center numerical readout
    ctx.textAlign = 'center';
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '800 28px Outfit, sans-serif';
    ctx.fillText(`${score}`, centerX, centerY - 14);

    ctx.font = '600 11px Inter, sans-serif';
    ctx.fillStyle = level === 'HIGH' ? '#FF3B69' : level === 'MEDIUM' ? '#FFB020' : '#05D59E';
    ctx.fillText(`${level} RISK`, centerX, centerY + 6);
  },

  // 4. Comparison Multi-Line Chart (Normalized % Returns)
  renderMultiLineChart(canvas, seriesList, options = {}) {
    const setup = this.setupCanvas(canvas);
    if (!setup || !seriesList || seriesList.length === 0) return;
    const { ctx, width, height } = setup;

    ctx.clearRect(0, 0, width, height);

    const padTop = 20;
    const padBottom = 30;
    const padLeft = 10;
    const padRight = 55;

    const chartW = width - padLeft - padRight;
    const chartH = height - padTop - padBottom;

    // Calculate normalized % returns starting from 0%
    const normalizedSeries = seriesList.map(s => {
      const base = s.points[0]?.price || 1;
      const pts = s.points.map(p => ({
        ...p,
        pctReturn: ((p.price - base) / base) * 100
      }));
      return { ...s, pts };
    });

    // Min and Max return %
    let allReturns = [];
    normalizedSeries.forEach(s => s.pts.forEach(p => allReturns.push(p.pctReturn)));
    const minR = Math.min(...allReturns) - 2;
    const maxR = Math.max(...allReturns) + 2;
    const rangeR = maxR - minR || 1;

    const getX = (idx, totalPts) => padLeft + (idx / (totalPts - 1)) * chartW;
    const getY = (val) => padTop + (1 - (val - minR) / rangeR) * chartH;

    // Baseline 0% line
    const zeroY = getY(0);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(padLeft, zeroY);
    ctx.lineTo(width - padRight, zeroY);
    ctx.stroke();
    ctx.setLineDash([]);

    // 0% label
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.font = '10px JetBrains Mono, monospace';
    ctx.textAlign = 'left';
    ctx.fillText('0.0%', width - padRight + 5, zeroY + 3);

    // Draw each company line
    normalizedSeries.forEach(series => {
      const pts = series.pts;
      if (pts.length < 2) return;

      ctx.beginPath();
      ctx.moveTo(getX(0, pts.length), getY(pts[0].pctReturn));
      for (let i = 1; i < pts.length; i++) {
        ctx.lineTo(getX(i, pts.length), getY(pts[i].pctReturn));
      }
      ctx.strokeStyle = series.color || '#00F0FF';
      ctx.lineWidth = 2.2;
      ctx.lineCap = 'round';
      ctx.shadowColor = series.color;
      ctx.shadowBlur = 8;
      ctx.stroke();
      ctx.shadowBlur = 0;

      // End label
      const lastPt = pts[pts.length - 1];
      const lastY = getY(lastPt.pctReturn);
      ctx.fillStyle = series.color;
      ctx.font = '600 10px JetBrains Mono, monospace';
      ctx.fillText(`${lastPt.pctReturn > 0 ? '+' : ''}${lastPt.pctReturn.toFixed(1)}%`, width - padRight + 5, lastY + 3);
    });
  }
};
