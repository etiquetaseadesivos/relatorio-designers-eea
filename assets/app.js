const API_URL = "https://script.google.com/macros/s/AKfycbxEi-616cs54p1XDjL9mQrKvlNjagGD4hLiPakv-mMiuhCgjjLvwnZm37j8kkNW5zcc/exec";
let dashboardData = {};
let currentPeriod = "semanal";

const totalProducaoEl = document.getElementById("totalProducao");
const totalProducaoValorEl = document.getElementById("totalProducaoValor");
const errosQtdEl = document.getElementById("errosQtd");
const errosPctEl = document.getElementById("errosPct");
const atrasosQtdEl = document.getElementById("atrasosQtd");
const atrasosPctEl = document.getElementById("atrasosPct");
const tempoMedioEl = document.getElementById("tempoMedio");
const performanceListEl = document.getElementById("performanceList");

const pieSvgEl = document.getElementById("pieSvg");
const pieLabel1El = document.getElementById("pieLabel1");
const pieLabel2El = document.getElementById("pieLabel2");
const pieLabel3El = document.getElementById("pieLabel3");
const pieLabel4El = document.getElementById("pieLabel4");
const dashboardLayoutEl = document.querySelector(".dashboard-layout");

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function animatePeriodChange(period) {
  if (!dashboardLayoutEl) {
    renderDashboard(period);
    return;
  }

  dashboardLayoutEl.classList.add("is-switching");
  await wait(180);

  renderDashboard(period);

  requestAnimationFrame(() => {
    dashboardLayoutEl.classList.remove("is-switching");
  });
}

function parsePercentValue(value) {
  if (value === null || value === undefined) return 0;

  const str = String(value).trim();
  if (!str) return 0;

  if (str.includes("%")) {
    return Number(str.replace("%", "").replace(/\./g, "").replace(",", ".")) || 0;
  }

  const n = Number(str.replace(/\./g, "").replace(",", "."));
  if (!isFinite(n)) return 0;

  return n <= 1 ? n * 100 : n;
}

function formatPercentLabel(value) {
  const rounded = Math.round(value * 10) / 10;
  if (rounded === 0) return "";
  return `${String(rounded).replace(".", ",")}%`;
}

function getPieFontSize(percent) {
  if (percent >= 35) return 22;
  if (percent >= 20) return 18;
  if (percent >= 10) return 16;
  if (percent >= 5) return 14;
  return 13;
}

function placePieLabel(el, startPercent, slicePercent, text) {
  if (!el) return;

  if (!slicePercent || slicePercent <= 0) {
    el.textContent = "";
    el.classList.add("is-hidden");
    return;
  }

  const wrap = el.parentElement;
  const size = wrap.offsetWidth;
  const center = size / 2;

  // ângulo central da fatia
  const midPercent = startPercent + (slicePercent / 2);
  const angleDeg = (midPercent / 100) * 360 - 90;
  const angleRad = angleDeg * Math.PI / 180;

  // distância do centro
  const radius = size * 0.32;

  const x = center + Math.cos(angleRad) * radius;
  const y = center + Math.sin(angleRad) * radius;

  el.textContent = text;
  el.style.left = `${x}px`;
  el.style.top = `${y}px`;
  el.style.fontSize = `${getPieFontSize(slicePercent)}px`;
  el.classList.remove("is-hidden");
}

function polarToCartesian(cx, cy, r, angleDeg) {
  const rad = (angleDeg - 90) * Math.PI / 180;
  return {
    x: cx + (r * Math.cos(rad)),
    y: cy + (r * Math.sin(rad))
  };
}

function describePieSlice(cx, cy, r, startAngle, endAngle) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

  return [
    `M ${cx} ${cy}`,
    `L ${start.x} ${start.y}`,
    `A ${r} ${r} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`,
    "Z"
  ].join(" ");
}

function placePieLabelByAngle(el, midAngle, slicePercent, text) {
  if (!el || !slicePercent || slicePercent <= 0 || !text) {
    if (el) {
      el.textContent = "";
      el.classList.add("is-hidden");
    }
    return;
  }

  const wrap = el.parentElement;
  const size = wrap.offsetWidth;
  const center = size / 2;
  const radius = size * 0.32;
  const rad = (midAngle - 90) * Math.PI / 180;

  const x = center + Math.cos(rad) * radius;
  const y = center + Math.sin(rad) * radius;

  el.textContent = text;
  el.style.left = `${x}px`;
  el.style.top = `${y}px`;
  el.style.fontSize = `${getPieFontSize(slicePercent)}px`;
  el.classList.remove("is-hidden");
}

function renderPie(data) {
  if (!pieSvgEl) return;

  const barrados = parsePercentValue(data.pizzaBarrados);
  const enviados = parsePercentValue(data.pizzaEnviados);
  const processo = parsePercentValue(data.pizzaProcesso);
  const prejuizo = parsePercentValue(data.pizzaPrejuizo);

  const total = barrados + enviados + processo + prejuizo;

  const safeBarrados = total > 0 ? (barrados / total) * 100 : 25;
  const safeEnviados = total > 0 ? (enviados / total) * 100 : 25;
  const safeProcesso = total > 0 ? (processo / total) * 100 : 25;
  const safePrejuizo = total > 0 ? (prejuizo / total) * 100 : 25;

  const slices = [
    { percent: safeBarrados, color: "var(--cyan)", labelEl: pieLabel1El, raw: barrados },
    { percent: safeEnviados, color: "var(--pink)", labelEl: pieLabel2El, raw: enviados },
    { percent: safeProcesso, color: "var(--blue)", labelEl: pieLabel3El, raw: processo },
    { percent: safePrejuizo, color: "var(--lilac)", labelEl: pieLabel4El, raw: prejuizo }
  ];

  pieSvgEl.innerHTML = "";

  const cx = 100;
  const cy = 100;
  const r = 100;

  let startAngle = 0;

  slices.forEach(slice => {
    if (slice.percent <= 0) {
      slice.labelEl.textContent = "";
      slice.labelEl.classList.add("is-hidden");
      return;
    }

    const angle = (slice.percent / 100) * 360;
    const endAngle = startAngle + angle;
    const midAngle = startAngle + (angle / 2);

    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", describePieSlice(cx, cy, r, startAngle, endAngle));
    path.setAttribute("fill", slice.color);
    path.setAttribute("class", "pie-slice");
    path.setAttribute("stroke", slice.color);
    path.setAttribute("stroke-width", "1.5");

    pieSvgEl.appendChild(path);

    placePieLabelByAngle(
      slice.labelEl,
      midAngle,
      slice.percent,
      formatPercentLabel(slice.raw)
    );

    startAngle = endAngle;
  });
}





async function fetchDashboardData() {
  console.log("Buscando API:", API_URL);

  const response = await fetch(API_URL, { cache: "no-store" });
  console.log("Status HTTP:", response.status);

  const text = await response.text();
  console.log("Resposta bruta da API:", text);

  const result = JSON.parse(text);
  console.log("JSON da API:", result);

  if (!result.success) {
    throw new Error(result.error || "Erro ao carregar dados");
  }

  dashboardData = result.data;
  console.log("dashboardData final:", dashboardData);
}

function getProductionWidth(value, maxValue) {
  const number = Number(String(value).replace(/\./g, "").replace(",", "."));
  const max = maxValue || 1;
  return `${Math.max(20, (number / max) * 100)}%`;
}

function updateClock() {
  const hourHand = document.getElementById("hourHand");
  const minuteHand = document.getElementById("minuteHand");

  if (!hourHand || !minuteHand) return;

  const now = new Date();
  const hours = now.getHours() % 12;
  const minutes = now.getMinutes();

  const hourDeg = (hours * 30) + (minutes * 0.5);
  const minuteDeg = minutes * 6;

  hourHand.style.transform = `rotate(${hourDeg}deg)`;
  minuteHand.style.transform = `rotate(${minuteDeg}deg)`;
}

function renderPerformance(items) {
  performanceListEl.innerHTML = "";

  if (!items || !items.length) return;

  function parseNumber(value) {
    const n = Number(String(value || "0").replace(/\./g, "").replace(",", "."));
    return isFinite(n) ? n : 0;
  }

  function parseTimeToMinutes(value) {
    const str = String(value || "").trim();
    if (!str) return 0;

    const parts = str.split(":");
    if (parts.length !== 2) return 0;

    const hoursOrMinutes = Number(parts[0]);
    const minutes = Number(parts[1]);

    if (!isFinite(hoursOrMinutes) || !isFinite(minutes)) return 0;

    return (hoursOrMinutes * 60) + minutes;
  }

  const enrichedItems = items.map(item => ({
    ...item,
    _producaoNum: parseNumber(item.producao),
    _tempoMin: parseTimeToMinutes(item.tempo),
    _errosNum: parseNumber(item.erros),
    _atrasosNum: parseNumber(item.atrasos)
  }));

  const maxProduction = Math.max(...enrichedItems.map(item => item._producaoNum), 1);
  const maxTempo = Math.max(...enrichedItems.map(item => item._tempoMin), 1);
  const maxErros = Math.max(...enrichedItems.map(item => item._errosNum), 1);
  const maxAtrasos = Math.max(...enrichedItems.map(item => item._atrasosNum), 1);

  enrichedItems.forEach(item => {
    const prodScore = item._producaoNum / maxProduction;
    const tempoScore = 1 - (item._tempoMin / maxTempo);
    const errosScore = 1 - (item._errosNum / maxErros);
    const atrasosScore = 1 - (item._atrasosNum / maxAtrasos);

    item._score =
      (prodScore * 0.5) +
      (tempoScore * 0.2) +
      (errosScore * 0.15) +
      (atrasosScore * 0.15);
  });

  enrichedItems.sort((a, b) => b._score - a._score);

  enrichedItems.forEach(item => {
    const row = document.createElement("div");
    row.className = "performance-item";

    row.innerHTML = `
      <div class="person">
        <span class="person-name">${item.nome}</span>
        <span class="person-sub">${item.sub}</span>
      </div>

      <div class="bars">
        <div class="bar-row">
          <div class="bar-track production" style="width:${getProductionWidth(item.producao, maxProduction)};"></div>
          <span class="bar-value production">${item.producao}</span>
        </div>

        <div class="bar-row">
          <div class="bar-track time"></div>
          <span class="bar-value time">${item.tempo}</span>
        </div>

        <div class="bar-row">
          <div class="bar-track errors"></div>
          <span class="bar-value errors">${item.erros}</span>
        </div>

        <div class="bar-row">
          <div class="bar-track delays"></div>
          <span class="bar-value delays">${item.atrasos}</span>
        </div>
      </div>
    `;

    performanceListEl.appendChild(row);
  });
}

function renderDashboard(period) {
  console.log("Renderizando período:", period);
  console.log("Dados disponíveis:", dashboardData);

  const data = dashboardData[period];
  console.log("Data do período:", data);

  if (!data) return;

  totalProducaoEl.textContent = data.totalProducao;
  totalProducaoValorEl.textContent = data.totalProducaoValor;
  errosQtdEl.textContent = data.errosQtd;
  errosPctEl.textContent = data.errosPct;
  atrasosQtdEl.textContent = data.atrasosQtd;
  atrasosPctEl.textContent = data.atrasosPct;
  tempoMedioEl.textContent = data.tempoMedio;

  renderPerformance(data.performance || []);
  renderPie(data);
}

async function initDashboard() {
  try {
    await fetchDashboardData();
    renderDashboard(currentPeriod);
  } catch (error) {
    console.error("Erro ao carregar dashboard:", error);
  }
}

document.querySelectorAll(".period-btn").forEach(btn => {
  btn.addEventListener("click", async () => {
    if (btn.dataset.period === currentPeriod) return;

    document.querySelectorAll(".period-btn").forEach(item => item.classList.remove("active"));
    btn.classList.add("active");

    currentPeriod = btn.dataset.period;
    await animatePeriodChange(currentPeriod);
  });
});



setInterval(updateClock, 1000);
updateClock();
initDashboard();













