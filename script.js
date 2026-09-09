const defaultBusinesses = [
  { id: "vivo", name: "Vivo", category: "Telefonia e internet", offer: "Plano e benefícios", short: "VIVO", icon: "VIVO" },
  { id: "snack", name: "Lanchonete", category: "Alimentação", offer: "Lanche especial", short: "🍔", icon: "🍔" },
  { id: "clinic", name: "Clínica", category: "Saúde e bem-estar", offer: "Consulta e cuidado", short: "✚", icon: "✚" },
];

let businesses = loadBusinesses();

const state = {
  selected: null,
  token: null,
  expiresAt: null,
  timer: null,
};

const businessList = document.querySelector("#businessList");
const couponPanel = document.querySelector("#couponPanel");
const benefitsPage = document.querySelector("#benefitsPage");
const topbar = document.querySelector("#topbar");
const homeButton = document.querySelector("#homeButton");
const toast = document.querySelector("#toast");

function loadBusinesses() {
  try {
    const saved = JSON.parse(localStorage.getItem("viva-partners") || "null");
    return Array.isArray(saved) && saved.length ? saved : defaultBusinesses;
  } catch {
    return defaultBusinesses;
  }
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;",
  }[character]));
}

function getBusiness(id) {
  return businesses.find((business) => business.id === id) || businesses[0] || defaultBusinesses[0];
}

function renderBusinessList() {
  document.querySelector("#partnerCount").textContent = String(businesses.length).padStart(2, "0");
  businessList.innerHTML = businesses.map((business) => `
    <button class="business-card ${state.selected === business.id ? "active" : ""}" data-business="${business.id}" aria-label="Abrir cupom da ${business.name}">
      <span class="business-logo ${business.id} ${business.id.startsWith("partner-") ? "custom" : ""}" style="--partner-color: ${escapeHtml(business.color || "#7b6eea")}">${business.iconImage ? `<img src="${escapeHtml(business.iconImage)}" alt="" />` : escapeHtml(business.short)}</span>
      <span class="business-copy"><strong>${escapeHtml(business.name)}</strong><span>${escapeHtml(business.category)}</span></span>
      <span class="business-arrow" aria-hidden="true">›</span>
    </button>
  `).join("");

  businessList.querySelectorAll("[data-business]").forEach((button) => {
    button.addEventListener("click", () => createCoupon(button.dataset.business));
  });
}

function createToken() {
  const random = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `CUPOM-${random}`;
}

function getCouponUrl() {
  const url = new URL(window.location.href);
  url.search = "";
  url.hash = "";
  url.searchParams.set("coupon", state.token);
  url.searchParams.set("business", state.selected);
  url.searchParams.set("expires", state.expiresAt);
  return url.toString();
}

function createQrCode() {
  const canvas = document.querySelector("#qrCanvas");
  if (!canvas || !window.QRCode) return;
  QRCode.toCanvas(canvas, getCouponUrl(), {
    width: 260,
    margin: 1,
    color: { dark: "#202727", light: "#f9faf8" },
    errorCorrectionLevel: "H",
  }, (error) => {
    if (error) showToast("Não foi possível gerar o QR code");
  });
}

function renderCoupon() {
  const business = getBusiness(state.selected);
  couponPanel.innerHTML = `
    <div class="coupon-content">
      <div class="coupon-label">cupom • ${business.name}</div>
      <h2>Seu desconto<br />está <em>pronto.</em></h2>
      <p class="coupon-subtitle">Aponte a câmera do seu celular para o QR code e apresente o cupom em ${business.name}.</p>
      <div class="timer-row"><span class="timer-icon"></span><span>disponível por <strong id="timer">30</strong> segundos</span></div>
      <div class="qr-stage">
        <div class="qr-frame" id="qrFrame">
          <canvas id="qrCanvas" aria-label="QR code do cupom"></canvas>
          <div class="qr-overlay">Cupom expirado</div>
        </div>
      </div>
      <div class="progress"><div class="progress-bar" id="progressBar"></div></div>
    </div>
  `;
  benefitsPage.classList.remove("active");
  couponPanel.classList.add("active");
  topbar.classList.remove("is-hidden");
  homeButton.classList.remove("is-hidden");
  createQrCode();
  updateTimer();
}

function updateTimer() {
  if (state.timer) clearInterval(state.timer);
  const timerEl = document.querySelector("#timer");
  const progressBar = document.querySelector("#progressBar");
  if (!timerEl || !progressBar) return;

  const tick = () => {
    const remaining = Math.max(0, Math.ceil((state.expiresAt - Date.now()) / 1000));
    timerEl.textContent = remaining;
    progressBar.style.width = `${(remaining / 30) * 100}%`;
    if (remaining <= 0) {
      clearInterval(state.timer);
      goHome();
    }
  };
  tick();
  state.timer = setInterval(tick, 250);
}

function createCoupon(businessId) {
  state.selected = businessId;
  state.token = createToken();
  state.expiresAt = Date.now() + 30_000;
  renderBusinessList();
  renderCoupon();
}

function goHome() {
  if (state.timer) clearInterval(state.timer);
  state.selected = null;
  state.token = null;
  state.expiresAt = null;
  couponPanel.innerHTML = "";
  couponPanel.classList.remove("active");
  benefitsPage.classList.add("active");
  topbar.classList.add("is-hidden");
  homeButton.classList.add("is-hidden");
  renderBusinessList();
}

function renderMobileCoupon(params) {
  const business = getBusiness(params.get("business"));
  const token = params.get("coupon") || "CUPOM-TESTE";
  const expires = Number(params.get("expires"));
  const isExpired = expires && Date.now() > expires;
  document.querySelector("#appShell").innerHTML = `
    <section class="mobile-coupon" aria-label="Cupom de desconto">
      <div class="coupon-label">cupom validado</div>
      <h2>Você tem um<br /><em>desconto.</em></h2>
      <p class="coupon-subtitle">Apresente esta tela no estabelecimento para aproveitar seu benefício em ${business.name}.</p>
      <div class="coupon-ticket">
        <span class="ticket-label">seu código</span>
        <strong class="ticket-code">${token}</strong>
        <span class="valid-note">✓ válido para ${business.name}</span>
      </div>
      ${isExpired ? "<p class=\"coupon-hint\">Este cupom já expirou. Volte ao tablet para gerar outro.</p>" : "<p class=\"coupon-hint\">Mostre esta tela para receber seu desconto.</p>"}
      <button class="back-home" id="backHome">Voltar para empresas</button>
    </section>
  `;
  document.querySelector("#backHome").addEventListener("click", () => {
    window.location.href = window.location.pathname;
  });
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2500);
}

homeButton.addEventListener("click", goHome);

const params = new URLSearchParams(window.location.search);
if (params.has("coupon")) {
  renderMobileCoupon(params);
} else {
  goHome();
}
