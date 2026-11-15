// Trend charts (Chart.js, loaded from cdnjs as a global). One small chart per
// indicator — small multiples, single series each, so no legend is needed.
// AI-generated code (Claude) — see README "AI tools used".

const charts = new Map();
const css = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
const STATUS_TEXT = { NORMAL: 'Normal', WATCH: 'Watch', ALERT: 'Alert', UNKNOWN: 'No data' };

export { parseRange } from './logic.js';

function statusColor(s) {
  return { NORMAL: css('--ok'), WATCH: css('--watch'), ALERT: css('--alert') }[s] || css('--unknown');
}

export function renderCharts(container, series) {
  if (typeof window.Chart === 'undefined') {
    container.innerHTML = '<p class="muted">Charts unavailable offline. Use the history table below.</p>';
    return;
  }
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const Chart = window.Chart;
  Chart.defaults.color = css('--muted');
  Chart.defaults.font.family = css('--font') || 'system-ui';
  Chart.defaults.animation = reduce ? false : { duration: 700, easing: 'easeOutCubic' };

  series.forEach((s) => {
    let card = container.querySelector(`[data-chart="${s.id}"]`);
    if (!card) {
      card = document.createElement('div');
      card.className = 'chart-card';
      card.dataset.chart = s.id;
      card.innerHTML = `<h3></h3><div class="chart-box"><canvas role="img"></canvas></div><div class="chart-empty" hidden>No readings yet</div>`;
      container.appendChild(card);
    }
    card.querySelector('h3').innerHTML = '';
    const h = card.querySelector('h3');
    h.append(document.createTextNode(s.label));
    const unit = document.createElement('span');
    unit.textContent = s.unit;
    h.append(unit);

    const points = s.points.filter((p) => p.value !== null);
    const box = card.querySelector('.chart-box');
    const empty = card.querySelector('.chart-empty');
    box.hidden = points.length === 0;
    empty.hidden = points.length !== 0;
    const canvas = card.querySelector('canvas');
    const last = points[points.length - 1];
    canvas.setAttribute('aria-label', `${s.label} trend, ${points.length} readings${last ? `, latest ${last.value} ${s.unit}, ${STATUS_TEXT[last.status]}` : ''}`);
    if (!points.length) return;

    const labels = s.points.map((p) => p.label);
    const values = s.points.map((p) => p.value);
    const colors = s.points.map((p) => statusColor(p.status));
    const band = s.range;
    const datasets = [
      {
        label: s.label,
        data: values,
        borderColor: css('--accent'),
        borderWidth: 2,
        tension: 0.3,
        spanGaps: true,
        pointRadius: 4.5,
        pointHoverRadius: 7,
        pointBackgroundColor: colors,
        pointBorderColor: css('--surface-2'),
        pointBorderWidth: 2,
        order: 1,
      },
    ];
    if (band) {
      datasets.push(
        { label: 'Normal low', data: labels.map(() => band[0]), borderWidth: 0, pointRadius: 0, pointHoverRadius: 0, fill: false, order: 3 },
        { label: 'Normal high', data: labels.map(() => band[1]), borderWidth: 0, pointRadius: 0, pointHoverRadius: 0, fill: '-1', backgroundColor: 'rgba(62, 207, 142, 0.10)', order: 2 },
      );
    }

    const existing = charts.get(s.id);
    if (existing && existing.canvas === canvas) {
      existing.data.labels = labels;
      existing.data.datasets = datasets;
      existing.update();
      return;
    }
    if (existing) existing.destroy();
    charts.set(s.id, new Chart(canvas, {
      type: 'line',
      data: { labels, datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { display: false },
          tooltip: {
            filter: (item) => item.datasetIndex === 0,
            backgroundColor: css('--bg'),
            borderColor: css('--border'),
            borderWidth: 1,
            titleColor: css('--text'),
            bodyColor: css('--text-2'),
            displayColors: false,
            callbacks: {
              label: (ctx) => {
                const p = s.points[ctx.dataIndex];
                return `${ctx.parsed.y} ${s.unit} · ${STATUS_TEXT[p.status] || p.status}`;
              },
            },
          },
        },
        scales: {
          x: { grid: { display: false }, ticks: { maxRotation: 0, autoSkip: true, maxTicksLimit: 6 } },
          y: {
            grid: { color: 'rgba(139, 150, 181, 0.12)' },
            border: { display: false },
            ticks: { maxTicksLimit: 4 },
            suggestedMin: band ? band[0] - (band[1] - band[0]) * 0.3 : undefined,
            suggestedMax: band ? band[1] + (band[1] - band[0]) * 0.3 : undefined,
          },
        },
      },
    }));
  });
}
