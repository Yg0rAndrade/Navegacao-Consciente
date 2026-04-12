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
const featYoutubeSpeed = document.getElementById('feat-youtube-speed');
const featInstagramReels = document.getElementById('feat-instagram-reels');

let sites = [];
let hardBlockedSites = [];
let timerDuration = 10;
let alertInterval = 10;
let showClock = true;
let currentTheme = 'light';

// Carrega os dados salvos
async function loadData() {
  const result = await chrome.storage.sync.get(['sites', 'hardBlockedSites', 'timerDuration', 'alertInterval', 'showClock', 'theme', 'feat_youtube_speed', 'feat_instagram_reels']);
  sites = result.sites || [];
  hardBlockedSites = result.hardBlockedSites || [];
  timerDuration = result.timerDuration || 10;
  alertInterval = result.alertInterval !== undefined ? result.alertInterval : 10;
  showClock = result.showClock !== undefined ? result.showClock : true;
  currentTheme = result.theme || 'light';

  toggleCronometro.checked = showClock;
  featYoutubeSpeed.checked = result.feat_youtube_speed !== false;
  featInstagramReels.checked = result.feat_instagram_reels !== false;

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
  await chrome.storage.sync.set({ sites, hardBlockedSites });
  renderSites();
}

// Alterna bloqueio total por site
function toggleHardBlockSite(site) {
  if (hardBlockedSites.includes(site)) {
    hardBlockedSites = hardBlockedSites.filter(s => s !== site);
  } else {
    hardBlockedSites.push(site);
  }
  saveSites();
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

  sitesContainer.innerHTML = sites.map((site, index) => {
    const isBlocked = hardBlockedSites.includes(site);
    return `
      <div class="site-item${isBlocked ? ' hard-blocked' : ''}" style="animation-delay: ${index * 50}ms">
        <span class="site-item-name">${site}</span>
        <div style="display:flex;align-items:center;gap:2px">
          <button class="btn-lock${isBlocked ? ' active' : ''}" data-site="${site}" title="${isBlocked ? 'Desbloquear' : 'Bloqueio total'}">
            <svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round">
              ${isBlocked
                ? '<rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>'
                : '<rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/>'}
            </svg>
          </button>
          <button class="btn-remove" data-site="${site}" title="Remover ${site}">
            <svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      </div>
    `;
  }).join('');

  sitesContainer.querySelectorAll('.btn-remove').forEach(btn => {
    btn.addEventListener('click', () => removeSite(btn.dataset.site));
  });

  sitesContainer.querySelectorAll('.btn-lock').forEach(btn => {
    btn.addEventListener('click', () => toggleHardBlockSite(btn.dataset.site));
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

// Site tabs
document.querySelectorAll('.site-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.site-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.site-panel').forEach(p => p.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById(`panel-${tab.dataset.site}`).classList.add('active');
  });
});

// Feature toggles
featYoutubeSpeed.addEventListener('change', async () => {
  await chrome.storage.sync.set({ feat_youtube_speed: featYoutubeSpeed.checked });
});

featInstagramReels.addEventListener('change', async () => {
  await chrome.storage.sync.set({ feat_instagram_reels: featInstagramReels.checked });
});

// Theme switcher
themeBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    saveTheme(btn.dataset.theme);
  });
});

// Inicialização
loadData();
