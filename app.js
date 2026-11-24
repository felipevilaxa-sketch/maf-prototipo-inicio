/* =========================================================
   MAF · Inicio — datos de prototipo + interacción
   Edita los arreglos de abajo para prototipar nuevos estados.
   ========================================================= */

const STATUS = {
  pendiente:  { label: 'Pago pendiente', icon: 'assets/chip-pendiente.svg', w: 11, h: 10.9986 },
  enProceso:  { label: 'En proceso',     icon: 'assets/chip-en-proceso.svg', w: 11, h: 11 },
  respondido: { label: 'Respondido',     icon: 'assets/chip-respondido.svg', w: 11, h: 11 },
};

const products = [
  {
    name: 'Crédito Automotriz',
    vehicle: 'Toyota Yaris 2022 · DVKL91',
    plate: 'DVKL91',
    status: 'pendiente',
    paid: 15, total: 48,
    progress: 24.18,           // % de la barra tal como está en Figma (null = calcular paid/total)
    code: '737242399',
    installment: '$245.900',               // monto de la cuota
    installmentWithInterest: '$258.300',   // monto + intereses (cuota vencida)
    plan: 'Plan Renueve · Nº3435425',          // mobile
    amount: '$8.000.000',                       // mobile
    insurance: 'Desgravamen, Vida',             // mobile
  },
  {
    name: 'Crédito Automotriz',
    vehicle: 'Mazda CX-5 2021 · KHTR52',
    plate: 'KHTR52',
    status: 'pendiente',
    paid: 9, total: 36,
    progress: null,
    code: '737242412',
    installment: '$312.450',
    installmentWithInterest: '$327.990',
    plan: 'Plan Renueve · Nº3435511',
    amount: '$12.500.000',
    insurance: 'Desgravamen, Vida',
  },
];

const requests = [
  { type: 'Certificado de deuda pagada',          ticket: '3432', requested: '5/4/2023', estimated: '15/4/2023', status: 'enProceso' },
  { type: 'Solicitud de prepago',                 ticket: '3432', requested: '5/4/2023', estimated: '15/4/2023', status: 'enProceso' },
  { type: 'Denuncia de desgravamen',              ticket: '3432', requested: '5/4/2023', estimated: '15/4/2023', status: 'respondido' },
  { type: 'Solicitud de portabilidad financiera', ticket: '3432', requested: '5/4/2023', estimated: '15/4/2023', status: 'respondido' },
];

/* =========================================================
   VENCIMIENTOS
   Estados por crédito: alDia (>5 días) · porVencer (≤5 días) · venceHoy · vencida
   El aviso se muestra siempre; "al día" también, para incentivar pagar antes.
   ========================================================= */
const TODAY = new Date(2023, 3, 3);        // "hoy" simulado = fecha del header (03 · 04 · 2023)
const HORA_LIMITE = '18:00 hrs.';
const DUE_SOON_DAYS = 5;                   // umbral "por vencer"

const SEVERITY = { alDia: 0, porVencer: 1, venceHoy: 2, vencida: 3 };

// Escenarios del switch. `states[i]` corresponde a products[i].
const DUE_SCENARIOS = {
  1: [
    { id: 'alDia',     label: 'Al día',     states: [{ state: 'alDia', days: 14 }] },
    { id: 'porVencer', label: 'Por vencer', states: [{ state: 'porVencer', days: 2 }] },
    { id: 'venceHoy',  label: 'Vence hoy',  states: [{ state: 'venceHoy' }] },
    { id: 'vencida',   label: 'Vencida',    states: [{ state: 'vencida', days: 12 }] },
  ],
  2: [
    { id: 'ambosAlDia',   label: 'Ambos al día',      states: [{ state: 'alDia', days: 14 }, { state: 'alDia', days: 32 }] },
    { id: 'unoPorVencer', label: 'Uno por vencer',    states: [{ state: 'alDia', days: 14 }, { state: 'porVencer', days: 2 }] },
    { id: 'distintos',    label: 'Estados distintos', states: [{ state: 'porVencer', days: 3 }, { state: 'venceHoy' }] },
  ],
};

const WEEKDAYS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sept', 'oct', 'nov', 'dic'];
const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const fmtLong = (d) => `${WEEKDAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`;
const fmtShort = (d) => `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
const plural = (n, one, many) => (n === 1 ? one : many);

/** Fecha de vencimiento de la cuota según el estado. */
function dueDate({ state, days = 0 }) {
  if (state === 'vencida') return addDays(TODAY, -days);
  if (state === 'venceHoy') return TODAY;
  return addDays(TODAY, days);
}

/* ---------- helpers ---------- */
function chip(statusKey, filled = false) {
  const s = STATUS[statusKey];
  const el = document.createElement('span');
  el.className = 'chip' + (filled ? ' chip--filled' : '');
  el.innerHTML = `${s.label}<img src="${s.icon}" alt="" width="${s.w}" height="${s.h}">`;
  return el;
}

const ICON_ALERT = `<svg width="13" height="12" viewBox="0 0 13 12" fill="none" aria-hidden="true"><path d="M6.5 1 12 11H1L6.5 1Z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/><path d="M6.5 4.6v2.9" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><circle cx="6.5" cy="9.2" r=".8" fill="currentColor"/></svg>`;
const ICON_CLOSE = `<svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true"><path d="M1.5 1.5l9 9m0-9-9 9" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>`;
const ICON_CHEVRON = `<svg width="12" height="8" viewBox="0 0 12 8" fill="none" aria-hidden="true"><path d="M1.5 1.5 6 6l4.5-4.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

/* =========================================================
   ESTADO DEL PROTOTIPO (switch)
   ========================================================= */
const store = {
  get(k) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch {} },
};

let creditCount = (() => {
  const fromUrl = new URLSearchParams(location.search).get('creditos');   // ?creditos=1
  if (fromUrl === '1' || fromUrl === '2') return Number(fromUrl);
  return Number(store.get('maf-proto-creditos')) || 2;
})();
const dueScenarioId = {
  1: store.get('maf-proto-venc-1') || 'alDia',
  2: store.get('maf-proto-venc-2') || 'unoPorVencer',
};
let bannerDismissed = false;   // "Al día" y "Por vencer" se pueden cerrar (reaparece al día siguiente)
let groupOpen = false;

const currentScenario = () =>
  DUE_SCENARIOS[creditCount].find((s) => s.id === dueScenarioId[creditCount]) || DUE_SCENARIOS[creditCount][0];

/** Créditos visibles con su estado de vencimiento. */
function activeCredits() {
  const { states } = currentScenario();
  return products.slice(0, creditCount).map((p, i) => {
    const due = states[i] || { state: 'alDia', days: 30 };
    return { ...p, index: i, due, dueDate: dueDate(due) };
  });
}

function setCreditCount(n) {
  creditCount = n;
  store.set('maf-proto-creditos', String(n));
  document.querySelectorAll('.proto-switch [data-credits]').forEach((b) =>
    b.setAttribute('aria-pressed', String(Number(b.dataset.credits) === n)));
  renderDueOptions();
  resetBannerState();
  render();
}

function setDueScenario(id) {
  dueScenarioId[creditCount] = id;
  store.set(`maf-proto-venc-${creditCount}`, id);
  renderDueOptions();
  resetBannerState();
  render();
}

function resetBannerState() { bannerDismissed = false; groupOpen = false; }

function renderDueOptions() {
  const wrap = document.getElementById('due-options');
  wrap.innerHTML = '';
  DUE_SCENARIOS[creditCount].forEach((s) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = s.label;
    b.setAttribute('aria-pressed', String(s.id === currentScenario().id));
    b.addEventListener('click', () => setDueScenario(s.id));
    wrap.appendChild(b);
  });
}

function initScenarioSwitch() {
  document.querySelectorAll('.proto-switch [data-credits]').forEach((b) =>
    b.addEventListener('click', () => setCreditCount(Number(b.dataset.credits))));
}

/* =========================================================
   AVISO DE VENCIMIENTO (siempre visible)
   - 1 crédito → aviso simple con su estado
   - 2+ créditos → aviso agrupado con el peor estado; al desplegar,
     lista todos los créditos (incluidos los al día) del peor al menos grave
   ========================================================= */
const creditLabel = (c) => `${c.name} · ${c.plate}`;

function badgeHTML({ state, days }) {
  if (state === 'alDia')     return `<span class="due-badge due-badge--alDia"><strong>${days}</strong> ${plural(days, 'día', 'días')}</span>`;
  if (state === 'porVencer') return `<span class="due-badge due-badge--porVencer"><strong>${days}</strong> ${plural(days, 'día', 'días')}</span>`;
  if (state === 'venceHoy')  return `<span class="due-badge due-badge--venceHoy">VENCE HOY</span>`;
  return `<span class="due-badge due-badge--vencida">${ICON_ALERT}<strong>${days}</strong> ${plural(days, 'día', 'días')} de atraso</span>`;
}

function messageHTML(c, named) {
  const who = named ? ` del <b>${creditLabel(c)}</b>` : '';
  switch (c.due.state) {
    case 'alDia':     return `Tu próxima cuota${who} vence el <b>${fmtLong(c.dueDate)}</b> · ${c.installment}`;
    case 'porVencer': return `Tu cuota${who} vence el <b>${fmtLong(c.dueDate)}</b> · ${c.installment}`;
    case 'venceHoy':  return `Paga tu cuota${who} antes de las ${HORA_LIMITE} para no quedar en mora · <b>${c.installment}</b>`;
    case 'vencida':   return `Tu cuota${who} venció el <b>${fmtLong(c.dueDate)}</b> · Total a pagar <b>${c.installmentWithInterest}</b>`;
  }
  return '';
}

function actionHTML(c) {
  const label = c.due.state === 'vencida' ? 'Pagar ahora' : 'Pagar cuota';
  return `<a href="#" class="due-link due-pay" data-index="${c.index}">${label}</a>`;
}

const GROUP_TITLE = {
  alDia:     'Tus créditos están <b>al día</b> · adelanta el pago de tus cuotas',
  porVencer: 'Tienes al menos un crédito con la cuota <b>por vencer</b>',
  venceHoy:  'Tienes al menos un crédito que <b>vence hoy</b>',
  vencida:   'Tienes al menos un crédito con la <b>cuota vencida</b>',
};
const GROUP_BADGE = { alDia: 'AL DÍA', porVencer: 'POR VENCER', venceHoy: 'VENCE HOY', vencida: 'VENCIDA' };

function renderDueBanner() {
  const slot = document.getElementById('due-slot');
  slot.innerHTML = '';

  const credits = activeCredits();
  // Todos los créditos se muestran, ordenados del más grave al menos grave
  const affected = [...credits]
    .sort((a, b) =>
      SEVERITY[b.due.state] - SEVERITY[a.due.state] ||
      (a.due.state === 'vencida' ? b.due.days - a.due.days : a.dueDate - b.dueDate));
  if (!affected.length) return;

  const worst = affected[0].due.state;
  const closable = worst === 'alDia' || worst === 'porVencer';   // vence hoy / vencida no se pueden cerrar
  if (closable && bannerDismissed) return;

  const el = document.createElement('div');
  el.className = `due-banner due-banner--${worst}`;
  el.setAttribute('role', closable ? 'status' : 'alert');
  const closeBtn = closable ? `<button type="button" class="due-close" aria-label="Cerrar aviso">${ICON_CLOSE}</button>` : '';

  if (affected.length === 1) {
    const c = affected[0];
    el.innerHTML = `
      <div class="due-banner__main">
        ${badgeHTML(c.due)}
        <p class="due-banner__text">${messageHTML(c, credits.length > 1)}</p>
        <div class="due-banner__action">${actionHTML(c)}</div>
        ${closeBtn}
      </div>`;
  } else {
    el.classList.add('due-banner--group');
    el.classList.toggle('is-open', groupOpen);
    el.innerHTML = `
      <div class="due-banner__main">
        <span class="due-badge due-badge--${worst}">${worst === 'vencida' ? ICON_ALERT : ''}${GROUP_BADGE[worst]}</span>
        <p class="due-banner__text">${GROUP_TITLE[worst]}</p>
        <div class="due-banner__action">
          <button type="button" class="due-toggle" aria-expanded="${groupOpen}" aria-controls="due-list">
            <span>${groupOpen ? 'Ocultar' : `Ver créditos (${affected.length})`}</span>${ICON_CHEVRON}
          </button>
        </div>
        ${closeBtn}
      </div>
      <ul class="due-banner__list" id="due-list" ${groupOpen ? '' : 'hidden'}>
        ${affected.map((c) => `
          <li class="due-item due-item--${c.due.state}" data-index="${c.index}">
            ${badgeHTML(c.due)}
            <p class="due-banner__text">${messageHTML(c, true)}</p>
            <div class="due-banner__action">${actionHTML(c)}</div>
          </li>`).join('')}
      </ul>`;
  }

  const pay = (i) => onPayInstallment(credits[i], i);
  const toggleGroup = () => { groupOpen = !groupOpen; renderDueBanner(); };

  el.querySelector('.due-close')?.addEventListener('click', () => { bannerDismissed = true; renderDueBanner(); });
  el.querySelector('.due-toggle')?.addEventListener('click', toggleGroup);
  el.querySelectorAll('.due-pay').forEach((a) => a.addEventListener('click', (e) => {
    e.preventDefault();
    pay(Number(a.dataset.index));
  }));

  // Mobile: toda la tarjeta es clickeable
  //  - aviso simple → pagar · cabecera del agrupado → desplegar · cada crédito de la lista → pagar
  const isMobile = () => matchMedia('(max-width: 767px)').matches;
  const ownControl = (e) => e.target.closest('.due-close, .due-toggle, .due-pay');
  el.querySelector('.due-banner__main').addEventListener('click', (e) => {
    if (!isMobile() || ownControl(e)) return;
    if (affected.length > 1) toggleGroup();
    else pay(affected[0].index);
  });
  el.querySelectorAll('.due-item').forEach((li) => li.addEventListener('click', (e) => {
    if (!isMobile() || ownControl(e)) return;
    pay(Number(li.dataset.index));
  }));
  slot.appendChild(el);
}

/* ---------- render productos ---------- */
function renderProducts() {
  const wrap = document.getElementById('products');
  const tpl = document.getElementById('tpl-product');
  wrap.innerHTML = '';
  wrap.dataset.count = creditCount;
  activeCredits().forEach((p, i) => {
    const node = tpl.content.cloneNode(true);
    const $ = (s) => node.querySelector(s);
    const pct = p.progress ?? (p.paid / p.total) * 100;
    $('.progress__fill').style.width = pct + '%';
    $('.product__cuotas').textContent = `Cuotas pagadas: ${p.paid} de ${p.total}`;
    $('.product__name').textContent = p.name;
    $('.product__vehicle').textContent = p.vehicle;
    $('.chip').replaceWith(chip(p.status, true));
    $('.product__code').textContent = `Código: ${p.code}`;
    $('.product__due').textContent = p.due.state === 'vencida'
      ? `Venció el: ${fmtShort(p.dueDate)}`
      : `Próximo vencimiento: ${fmtShort(p.dueDate)}`;
    $('.product__plan').textContent = p.plan;
    $('.product__amount').textContent = `Monto total de Crédito: ${p.amount}`;
    $('.product__insurance').textContent = `Seguros asociados: ${p.insurance}`;
    $('.btn-fill').addEventListener('click', () => onPay(p, i));
    $('.product__detail').addEventListener('click', (e) => { e.preventDefault(); onDetail(p, i); });
    wrap.appendChild(node);
  });
}

function render() {
  renderDueBanner();
  renderProducts();
}

/* ---------- render solicitudes (tabla en desktop, tarjetas en mobile) ---------- */
function renderRequests() {
  const body = document.getElementById('requests-body');
  body.innerHTML = '';
  requests.forEach((r, i) => {
    const row = document.createElement('div');
    row.className = 'req-row';
    row.innerHTML = `
      <span class="req-row__tipo" data-label="Tipo" title="${r.type}">${r.type}</span>
      <span class="req-row__ticket" data-label="Solicitud"><span class="d-only">Ticket </span>Nº${r.ticket}</span>
      <span class="req-row__fecha">${r.requested}</span>
      <span class="req-row__fecha">${r.estimated}</span>
      <span class="req-row__estado" data-label="Estado"></span>
      <a href="#" class="req-row__detail">Ver detalle</a>`;
    row.querySelector('.req-row__estado').appendChild(chip(r.status));
    row.querySelector('.req-row__detail').addEventListener('click', (e) => { e.preventDefault(); onRequestDetail(r, i); });
    body.appendChild(row);
  });
}

/* ---------- hooks para prototipar nuevas funcionalidades ---------- */
function onPay(product, index)            { console.log('Pagar', index, product); }
function onPayInstallment(credit, index)  { console.log('Pagar cuota desde aviso', index, credit.due.state, credit); }
function onDetail(product, index)         { console.log('Ir al detalle', index, product); }
function onRequestDetail(request, index)  { console.log('Ver detalle solicitud', index, request); }

/* ---------- menú lateral ---------- */
function initSidebar() {
  const app = document.getElementById('app');

  // Solo "Inicio" es navegable; el resto del menú queda bloqueado.
  document.querySelectorAll('.nav-item').forEach((item) => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      if (item.getAttribute('aria-disabled') === 'true') return;
      app.classList.remove('is-menu-open');   // en mobile, cierra el drawer
    });
  });

  // Colapsar / expandir (desktop)
  const toggle = document.getElementById('sidebar-toggle');
  toggle.addEventListener('click', () => {
    const collapsed = app.classList.toggle('is-collapsed');
    toggle.setAttribute('aria-label', collapsed ? 'Expandir menú' : 'Contraer menú');
    toggle.setAttribute('aria-expanded', String(!collapsed));
  });

  // Drawer (mobile)
  document.getElementById('menu-open').addEventListener('click', () => app.classList.add('is-menu-open'));
  document.getElementById('backdrop').addEventListener('click', () => app.classList.remove('is-menu-open'));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') app.classList.remove('is-menu-open'); });
}

initScenarioSwitch();
setCreditCount(creditCount);
renderRequests();
initSidebar();
