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

const fakePieEl = document.getElementById("fakePie");
const pieLabel1El = document.getElementById("pieLabel1");
const pieLabel2El = document.getElementById("pieLabel2");
const pieLabel3El = document.getElementById("pieLabel3");
const pieLabel4El = document.getElementById("pieLabel4");

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

function renderPie(data) {
  if (!fakePieEl) return;

  const barrados = parsePercentValue(data.pizzaBarrados);
  const enviados = parsePercentValue(data.pizzaEnviados);
  const processo = parsePercentValue(data.pizzaProcesso);
  const prejuizo = parsePercentValue(data.pizzaPrejuizo);

  const total = barrados + enviados + processo + prejuizo;

  const safeBarrados = total > 0 ? (barrados / total) * 100 : 25;
  const safeEnviados = total > 0 ? (enviados / total) * 100 : 25;
  const safeProcesso = total > 0 ? (processo / total) * 100 : 25;
  const safePrejuizo = total > 0 ? (prejuizo / total) * 100 : 25;

  const p1 = safeBarrados;
  const p2 = p1 + safeEnviados;
  const p3 = p2 + safeProcesso;
  const p4 = p3 + safePrejuizo;

  fakePieEl.style.background = `
    conic-gradient(
      var(--cyan) 0% ${p1}%,
      var(--pink) ${p1}% ${p2}%,
      var(--blue) ${p2}% ${p3}%,
      var(--lilac) ${p3}% ${Math.min(p4, 100)}%
    )
  `;

  placePieLabel(pieLabel1El, 0, safeBarrados, formatPercentLabel(barrados));
  placePieLabel(pieLabel2El, p1, safeEnviados, formatPercentLabel(enviados));
  placePieLabel(pieLabel3El, p2, safeProcesso, formatPercentLabel(processo));
  placePieLabel(pieLabel4El, p3, safePrejuizo, formatPercentLabel(prejuizo));
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

  const maxProduction = Math.max(
    ...items.map(item => Number(String(item.producao).replace(/\./g, "").replace(",", ".")))
  );

  items.forEach(item => {
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
  btn.addEventListener("click", () => {
    document.querySelectorAll(".period-btn").forEach(item => item.classList.remove("active"));
    btn.classList.add("active");

    currentPeriod = btn.dataset.period;
    renderDashboard(currentPeriod);
  });
});

setInterval(updateClock, 1000);
updateClock();
initDashboard();









