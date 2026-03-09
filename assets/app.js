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

  // aceita "25%", "25,5%", "0,255", "0.255"
  if (str.includes("%")) {
    return Number(str.replace("%", "").replace(/\./g, "").replace(",", ".")) || 0;
  }

  const n = Number(str.replace(/\./g, "").replace(",", "."));
  if (!isFinite(n)) return 0;

  // se vier como 0,255 da planilha formatada sem %
  if (n <= 1) return n * 100;

  return n;
}

function formatPercentLabel(value) {
  const rounded = Math.round(value * 10) / 10;
  return `${String(rounded).replace(".", ",")}%`;
}

function renderPie(data) {
  if (!fakePieEl) return;

  const barrados = parsePercentValue(data.pizzaBarrados);
  const enviados = parsePercentValue(data.pizzaEnviados);
  const processo = parsePercentValue(data.pizzaProcesso);
  const prejuizo = parsePercentValue(data.pizzaPrejuizo);

  const p1 = barrados;
  const p2 = p1 + enviados;
  const p3 = p2 + processo;
  const p4 = p3 + prejuizo;

  fakePieEl.style.background = `
    conic-gradient(
      var(--cyan) 0% ${p1}%,
      var(--pink) ${p1}% ${p2}%,
      var(--blue) ${p2}% ${p3}%,
      var(--lilac) ${p3}% ${Math.min(p4, 100)}%
    )
  `;

  pieLabel1El.textContent = formatPercentLabel(barrados);
  pieLabel2El.textContent = formatPercentLabel(enviados);
  pieLabel3El.textContent = formatPercentLabel(processo);
  pieLabel4El.textContent = formatPercentLabel(prejuizo);
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





