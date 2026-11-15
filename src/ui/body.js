// Interactive human figure (inline SVG). Each body area is a focusable button.
// AI-generated code (Claude) — see README "AI tools used".

export const ORGAN_IDS = ['mood', 'brain', 'immune', 'lungs', 'heart', 'gut', 'bones'];

const SILHOUETTE = `
  <circle class="silhouette" cx="100" cy="50" r="30"/>
  <rect class="silhouette" x="90" y="76" width="20" height="18" rx="6"/>
  <path class="silhouette" d="M60 100 Q100 88 140 100 L146 150 Q140 200 132 236 L68 236 Q60 200 54 150 Z"/>
  <path class="silhouette" d="M58 102 Q40 110 36 160 L30 234 Q36 244 44 236 L52 168 L58 140 Z"/>
  <path class="silhouette" d="M142 102 Q160 110 164 160 L170 234 Q164 244 156 236 L148 168 L142 140 Z"/>
  <path class="silhouette" d="M70 232 L98 232 L96 330 L92 402 Q84 410 76 402 L74 330 Z"/>
  <path class="silhouette" d="M102 232 L130 232 L126 330 L124 402 Q116 410 108 402 L104 330 Z"/>
`;

const ORGAN_SHAPES = {
  mood:   `<ellipse class="shape" cx="100" cy="10" rx="34" ry="7"/>`,
  brain:  `<ellipse class="shape" cx="100" cy="44" rx="22" ry="16"/>`,
  immune: `<circle class="shape" cx="88" cy="88" r="5"/><circle class="shape" cx="112" cy="88" r="5"/>
           <circle class="shape" cx="64" cy="116" r="5"/><circle class="shape" cx="136" cy="116" r="5"/>
           <ellipse class="shape" cx="128" cy="178" rx="7" ry="10"/>`,
  lungs:  `<ellipse class="shape" cx="83" cy="136" rx="14" ry="25"/><ellipse class="shape" cx="117" cy="136" rx="14" ry="25"/>`,
  heart:  `<path class="shape" d="M104 162 C90 151 88 140 96 135 C101 132 104 136 104 139 C104 136 107 132 112 135 C120 140 118 151 104 162 Z"/>`,
  gut:    `<ellipse class="shape" cx="98" cy="202" rx="24" ry="22"/>`,
  bones:  `<rect class="shape" x="79" y="248" width="11" height="74" rx="5"/><rect class="shape" x="110" y="248" width="11" height="74" rx="5"/>
           <circle class="shape" cx="84" cy="332" r="7"/><circle class="shape" cx="116" cy="332" r="7"/>
           <rect class="shape" x="79" y="342" width="9" height="54" rx="4"/><rect class="shape" x="112" y="342" width="9" height="54" rx="4"/>`,
};

export function renderFigure(container, names, onSelect) {
  const groups = ORGAN_IDS.map((id) => `
    <g class="organ" data-organ="${id}" data-status="UNKNOWN" tabindex="0" role="button" aria-label="${names[id] || id}">
      <title>${names[id] || id}</title>
      ${ORGAN_SHAPES[id]}
    </g>`).join('');
  container.innerHTML = `
    <svg viewBox="0 -6 200 420" role="group" aria-label="Human body figure. Select a body area.">
      ${SILHOUETTE}
      ${groups}
    </svg>`;
  container.querySelectorAll('.organ').forEach((g) => {
    g.addEventListener('click', () => onSelect(g.dataset.organ));
    g.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(g.dataset.organ); }
    });
  });
}

export function updateFigure(container, statusByOrgan, names, selected) {
  container.querySelectorAll('.organ').forEach((g) => {
    const id = g.dataset.organ;
    const status = statusByOrgan[id] || 'UNKNOWN';
    g.dataset.status = status;
    g.classList.toggle('selected', id === selected);
    const label = `${names[id] || id}: ${status.toLowerCase()}`;
    g.setAttribute('aria-label', label);
    g.setAttribute('aria-pressed', String(id === selected));
    const t = g.querySelector('title');
    if (t) t.textContent = label;
  });
}
