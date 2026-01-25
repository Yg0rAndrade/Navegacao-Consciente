// Detecção de ambiente (extensão vs navegador)
const isExtension = typeof chrome !== 'undefined' && chrome.storage && chrome.tabs;

// Mock das APIs do Chrome para desenvolvimento
if (!isExtension) {
  window.chrome = {
    storage: {
      sync: {
        get: (keys) => {
          const data = JSON.parse(localStorage.getItem('extension_data') || '{}');
          return Promise.resolve(data);
        },
        set: (data) => {
          const existing = JSON.parse(localStorage.getItem('extension_data') || '{}');
          Object.assign(existing, data);
          localStorage.setItem('extension_data', JSON.stringify(existing));
          return Promise.resolve();
        }
      }
    },
    tabs: {
      query: () => {
        // Retorna uma aba mockada para desenvolvimento
        return Promise.resolve([{
          url: window.location.href || 'file:///popup.html',
          active: true
        }]);
      }
    }
  };
}

// Elementos do DOM
const currentSiteName = document.getElementById('current-site-name');
const currentSiteStatus = document.getElementById('current-site-status');
const btnToggleCurrent = document.getElementById('btn-toggle-current');
const siteInput = document.getElementById('site-input');
const btnAdd = document.getElementById('btn-add');
const sitesContainer = document.getElementById('sites-container');
const sitesCount = document.getElementById('sites-count');
const timerOptions = document.querySelectorAll('.timer-btn');
const themeBtns = document.querySelectorAll('.theme-btn');

let currentHostname = '';
let sites = [];
let timerDuration = 10;
let currentTheme = 'light';

// Carrega os dados salvos
async function loadData() {
  const result = await chrome.storage.sync.get(['sites', 'timerDuration', 'theme']);
  sites = result.sites || [];
  timerDuration = result.timerDuration || 10;
  currentTheme = result.theme || 'light';

  // Atualiza a UI do timer
  timerOptions.forEach(opt => {
    opt.classList.toggle('active', parseInt(opt.dataset.time) === timerDuration);
  });

  // Aplica o tema
  applyTheme(currentTheme);

  renderSites();
  updateCurrentSiteUI();
}

// Aplica o tema
function applyTheme(theme) {
  document.body.className = theme === 'light' ? '' : theme;
  themeBtns.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.theme === theme);
  });
}

// Salva o tema
async function saveTheme(theme) {
  currentTheme = theme;
  applyTheme(theme);
  await chrome.storage.sync.set({ theme });
}

// Salva os sites
async function saveSites() {
  await chrome.storage.sync.set({ sites });
  renderSites();
  updateCurrentSiteUI();
}

// Salva o timer
async function saveTimer() {
  await chrome.storage.sync.set({ timerDuration });
}

// Obtém o site atual da aba
async function getCurrentTab() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab && tab.url) {
      try {
        const url = new URL(tab.url);
        currentHostname = url.hostname.replace('www.', '');
        currentSiteName.textContent = currentHostname;
      } catch (e) {
        currentHostname = '';
        currentSiteName.textContent = 'chrome://page';
      }
    }
  } catch (e) {
    // Modo desenvolvimento: usa um hostname mockado
    currentHostname = 'exemplo.com';
    currentSiteName.textContent = currentHostname;
  }
}

// Atualiza a UI do site atual
function updateCurrentSiteUI() {
  const isInList = sites.includes(currentHostname);

  if (currentHostname && !currentHostname.includes('chrome')) {
    if (isInList) {
      currentSiteStatus.textContent = 'bloqueado';
      currentSiteStatus.className = 'site-card-status blocked';

      btnToggleCurrent.innerHTML = `
        <svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
        Remover bloqueio
      `;
      btnToggleCurrent.className = 'btn btn-success';
    } else {
      currentSiteStatus.textContent = 'livre';
      currentSiteStatus.className = 'site-card-status allowed';

      btnToggleCurrent.innerHTML = `
        <svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <line x1="15" y1="9" x2="9" y2="15"/>
          <line x1="9" y1="9" x2="15" y2="15"/>
        </svg>
        Bloquear site
      `;
      btnToggleCurrent.className = 'btn btn-danger';
    }
    btnToggleCurrent.style.display = 'flex';
  } else {
    currentSiteStatus.textContent = 'sistema';
    currentSiteStatus.className = 'site-card-status system';
    btnToggleCurrent.style.display = 'none';
  }
}

// Renderiza a lista de sites
function renderSites() {
  sitesCount.textContent = `${sites.length} site${sites.length !== 1 ? 's' : ''}`;

  if (sites.length === 0) {
    sitesContainer.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">🎯</div>
        Nenhum site bloqueado.<br>
        Adicione para navegar com consciência.
      </div>
    `;
    return;
  }

  sitesContainer.innerHTML = sites.map((site, index) => `
    <div class="site-item" style="animation-delay: ${index * 50}ms">
      <span class="site-item-name">${site}</span>
      <button class="btn-remove" data-site="${site}" title="Remover ${site}">
        <svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"/>
          <line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    </div>
  `).join('');

  // Adiciona eventos de remover
  sitesContainer.querySelectorAll('.btn-remove').forEach(btn => {
    btn.addEventListener('click', () => removeSite(btn.dataset.site));
  });
}

// Adiciona um site
function addSite(hostname) {
  hostname = hostname.toLowerCase().trim().replace('www.', '').replace(/^https?:\/\//, '').split('/')[0];

  if (!hostname) return;

  if (!sites.includes(hostname)) {
    sites.push(hostname);
    saveSites();

    // Feedback visual no botão
    btnAdd.style.transform = 'scale(0.9)';
    setTimeout(() => {
      btnAdd.style.transform = '';
    }, 150);
  }
}

// Remove um site
function removeSite(hostname) {
  sites = sites.filter(s => s !== hostname);
  saveSites();
}

// Toggle site atual
function toggleCurrentSite() {
  if (!currentHostname) return;

  if (sites.includes(currentHostname)) {
    removeSite(currentHostname);
  } else {
    addSite(currentHostname);
  }
}

// Event Listeners
btnToggleCurrent.addEventListener('click', toggleCurrentSite);

btnAdd.addEventListener('click', () => {
  addSite(siteInput.value);
  siteInput.value = '';
  siteInput.focus();
});

siteInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    addSite(siteInput.value);
    siteInput.value = '';
  }
});

timerOptions.forEach(opt => {
  opt.addEventListener('click', () => {
    timerOptions.forEach(o => o.classList.remove('active'));
    opt.classList.add('active');
    timerDuration = parseInt(opt.dataset.time);
    saveTimer();
  });
});

// Theme switcher
themeBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    saveTheme(btn.dataset.theme);
  });
});

// Inicialização
getCurrentTab().then(loadData);
