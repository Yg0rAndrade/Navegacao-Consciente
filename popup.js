// Detecção de ambiente (extensão vs navegador)
const isExtension = typeof chrome !== 'undefined' && chrome.storage;

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
    }
  };
}

// Elementos do DOM
const siteInput = document.getElementById('site-input');
const btnAdd = document.getElementById('btn-add');
const sitesContainer = document.getElementById('sites-container');
const sitesCount = document.getElementById('sites-count');
const timerOptions = document.querySelectorAll('.timer-btn');
const alertOptions = document.querySelectorAll('.alert-btn');
const themeBtns = document.querySelectorAll('.theme-btn');
const toggleCronometro = document.getElementById('toggle-cronometro');

let sites = [];
let timerDuration = 10;
let alertInterval = 10;
let showClock = true;
let currentTheme = 'light';

// Carrega os dados salvos
async function loadData() {
  const result = await chrome.storage.sync.get(['sites', 'timerDuration', 'alertInterval', 'showClock', 'theme']);
  sites = result.sites || [];
  timerDuration = result.timerDuration || 10;
  alertInterval = result.alertInterval !== undefined ? result.alertInterval : 10;
  showClock = result.showClock !== undefined ? result.showClock : true;
  currentTheme = result.theme || 'light';

  toggleCronometro.checked = showClock;

  timerOptions.forEach(opt => {
    opt.classList.toggle('active', parseInt(opt.dataset.time) === timerDuration);
  });

  alertOptions.forEach(opt => {
    opt.classList.toggle('active', parseInt(opt.dataset.alert) === alertInterval);
  });

  applyTheme(currentTheme);
  renderSites();
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
}

// Salva o timer
async function saveTimer() {
  await chrome.storage.sync.set({ timerDuration });
}

// Salva o intervalo de alerta
async function saveAlertInterval() {
  await chrome.storage.sync.set({ alertInterval });
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

// Event Listeners
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

// Alert interval options
alertOptions.forEach(opt => {
  opt.addEventListener('click', () => {
    alertOptions.forEach(o => o.classList.remove('active'));
    opt.classList.add('active');
    alertInterval = parseInt(opt.dataset.alert);
    saveAlertInterval();
  });
});

// Toggle cronômetro
toggleCronometro.addEventListener('change', async () => {
  showClock = toggleCronometro.checked;
  await chrome.storage.sync.set({ showClock });
});

// Theme switcher
themeBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    saveTheme(btn.dataset.theme);
  });
});

// Inicialização
loadData();
