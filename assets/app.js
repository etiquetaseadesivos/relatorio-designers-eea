const API_URL = "https://script.google.com/macros/s/AKfycbwSoIoP4t9GRB4xmSMtzJFi8V2C-3QQtqpOIZ3SFda3Y5KclFWzmwjmym1QYwC75w2K/exec";
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


