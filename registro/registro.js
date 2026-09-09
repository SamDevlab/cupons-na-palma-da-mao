const defaultBusinesses = [
  { id: "vivo", name: "Vivo", category: "Telefonia e internet", offer: "Plano e benefícios", short: "VIVO", icon: "VIVO" },
  { id: "snack", name: "Lanchonete", category: "Alimentação", offer: "Lanche especial", short: "🍔", icon: "🍔" },
  { id: "clinic", name: "Clínica", category: "Saúde e bem-estar", offer: "Consulta e cuidado", short: "✚", icon: "✚" },
];
const ADMIN_PASSWORD = "1234";
let businesses = loadBusinesses();
let editingId = null;

const loginForm = document.querySelector("#loginForm");
const password = document.querySelector("#password");
const loginError = document.querySelector("#loginError");
const accessCard = document.querySelector("#accessCard");
const dashboard = document.querySelector("#dashboard");
const newPartner = document.querySelector("#newPartner");
const partnerForm = document.querySelector("#partnerForm");
const partnerList = document.querySelector("#partnerList");
const formTitle = document.querySelector("#formTitle");
const saveForm = document.querySelector("#saveForm");
const partnerIconImage = document.querySelector("#partnerIconImage");
const iconUploadPreview = document.querySelector("#iconUploadPreview");
const iconPreviewImage = document.querySelector("#iconPreviewImage");
const removeIconImage = document.querySelector("#removeIconImage");
const iconImageError = document.querySelector("#iconImageError");
const MAX_ICON_IMAGE_SIZE = 2 * 1024 * 1024;
let selectedIconImage = "";

function loadBusinesses() {
  try {
    const saved = JSON.parse(localStorage.getItem("viva-partners") || "null");
    return Array.isArray(saved) && saved.length ? saved : defaultBusinesses;
  } catch {
    return defaultBusinesses;
  }
}

function saveBusinesses() {
  localStorage.setItem("viva-partners", JSON.stringify(businesses));
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;",
  }[character]));
}

function updateIconPreview() {
  iconImageError.textContent = "";
  if (!selectedIconImage) {
    iconUploadPreview.hidden = true;
    iconPreviewImage.removeAttribute("src");
    return;
  }
  iconPreviewImage.src = selectedIconImage;
  iconUploadPreview.hidden = false;
}

function readIconImage(file) {
  if (!file) return;
  iconImageError.textContent = "";
  if (!file.type.startsWith("image/")) {
    iconImageError.textContent = "Escolha um arquivo de imagem.";
    partnerIconImage.value = "";
    return;
  }
  if (file.size > MAX_ICON_IMAGE_SIZE) {
    iconImageError.textContent = "A imagem deve ter no máximo 2 MB.";
    partnerIconImage.value = "";
    return;
  }

  const reader = new FileReader();
  reader.addEventListener("load", () => {
    selectedIconImage = String(reader.result || "");
    updateIconPreview();
  });
  reader.readAsDataURL(file);
}

function renderList() {
  partnerList.innerHTML = businesses.map((business, index) => `
    <li class="partner-row">
      <div class="partner-info">
        <strong><span class="partner-icon" style="--partner-color:${escapeHtml(business.color || "#7b6eea")}">${business.iconImage ? `<img src="${escapeHtml(business.iconImage)}" alt="" />` : escapeHtml(business.icon || business.short || "+")}</span>${escapeHtml(business.name)}</strong>
        <span>${escapeHtml(business.category)} · ${escapeHtml(business.offer || "Benefício especial")}</span>
      </div>
      <div class="partner-actions">
        <button type="button" data-edit="${escapeHtml(business.id)}">Editar</button>
        <button type="button" data-move="up" data-id="${escapeHtml(business.id)}" ${index === 0 ? "disabled" : ""}>↑</button>
        <button type="button" data-move="down" data-id="${escapeHtml(business.id)}" ${index === businesses.length - 1 ? "disabled" : ""}>↓</button>
        <button class="remove" type="button" data-remove="${escapeHtml(business.id)}">Remover</button>
      </div>
    </li>
  `).join("");

  partnerList.querySelectorAll("[data-edit]").forEach((button) => button.addEventListener("click", () => editPartner(button.dataset.edit)));
  partnerList.querySelectorAll("[data-move]").forEach((button) => button.addEventListener("click", () => movePartner(button.dataset.id, button.dataset.move)));
  partnerList.querySelectorAll("[data-remove]").forEach((button) => button.addEventListener("click", () => removePartner(button.dataset.remove)));
}

function editPartner(id) {
  const partner = businesses.find((item) => item.id === id);
  if (!partner) return;
  editingId = id;
  partnerForm.hidden = false;
  newPartner.hidden = true;
  formTitle.textContent = "Editar parceiro";
  saveForm.textContent = "Salvar alterações";
  document.querySelector("#partnerName").value = partner.name;
  document.querySelector("#partnerCategory").value = partner.category;
  document.querySelector("#partnerOffer").value = partner.offer || "";
  document.querySelector("#partnerColor").value = partner.color || "#7b6eea";
  document.querySelector("#partnerIcon").value = partner.icon || partner.short || "";
  selectedIconImage = partner.iconImage || "";
  partnerIconImage.value = "";
  updateIconPreview();
  document.querySelector("#partnerName").focus();
}

function movePartner(id, direction) {
  const index = businesses.findIndex((item) => item.id === id);
  const nextIndex = direction === "up" ? index - 1 : index + 1;
  if (index < 0 || nextIndex < 0 || nextIndex >= businesses.length) return;
  [businesses[index], businesses[nextIndex]] = [businesses[nextIndex], businesses[index]];
  saveBusinesses();
  renderList();
}

function removePartner(id) {
  const partner = businesses.find((item) => item.id === id);
  if (!partner || !window.confirm(`Remover ${partner.name} da lista?`)) return;
  businesses = businesses.filter((item) => item.id !== id);
  saveBusinesses();
  renderList();
}

function resetForm() {
  editingId = null;
  partnerForm.reset();
  selectedIconImage = "";
  updateIconPreview();
  partnerForm.hidden = true;
  newPartner.hidden = false;
  formTitle.textContent = "Cadastrar parceiro";
  saveForm.textContent = "Salvar parceiro";
}

loginForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (password.value !== ADMIN_PASSWORD) {
    loginError.textContent = "Senha incorreta.";
    password.select();
    return;
  }
  loginError.textContent = "";
  accessCard.hidden = true;
  dashboard.hidden = false;
  renderList();
});

newPartner.addEventListener("click", () => {
  editingId = null;
  partnerForm.reset();
  selectedIconImage = "";
  updateIconPreview();
  partnerForm.hidden = false;
  newPartner.hidden = true;
  formTitle.textContent = "Cadastrar parceiro";
  saveForm.textContent = "Salvar parceiro";
  document.querySelector("#partnerName").focus();
});

document.querySelector("#cancelForm").addEventListener("click", resetForm);
partnerIconImage.addEventListener("change", () => readIconImage(partnerIconImage.files[0]));
removeIconImage.addEventListener("click", () => {
  selectedIconImage = "";
  partnerIconImage.value = "";
  updateIconPreview();
});

partnerForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (iconImageError.textContent) return;
  const formData = new FormData(partnerForm);
  const partner = {
    name: String(formData.get("name")).trim(),
    category: String(formData.get("category")).trim(),
    offer: String(formData.get("offer")).trim(),
    color: String(formData.get("color")),
    icon: String(formData.get("icon")).trim(),
    iconImage: selectedIconImage,
  };
  partner.short = partner.icon || "+";
  if (editingId) {
    businesses = businesses.map((item) => item.id === editingId ? { ...item, ...partner } : item);
  } else {
    businesses.push({ id: `partner-${Date.now()}`, ...partner });
  }
  saveBusinesses();
  resetForm();
  renderList();
});
