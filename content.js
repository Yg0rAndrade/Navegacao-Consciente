// Variáveis globais
let sites = [];
let timerDuration = 10;
let currentTheme = 'light';
let currentHostname = window.location.hostname.replace('www.', '');

// Carrega as configurações
async function loadConfig() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(['sites', 'timerDuration', 'theme'], (result) => {
      sites = result.sites || [];
      timerDuration = result.timerDuration || 10;
      currentTheme = result.theme || 'light';
      resolve();
    });
  });
}

// Verifica se o site atual está na lista
function siteNaLista() {
  return sites.some(site => currentHostname.includes(site) || site.includes(currentHostname));
}

// Verifica se já respondeu para este site na sessão
function jaRespondeu() {
  const chave = `impulso_${currentHostname}`;
  return sessionStorage.getItem(chave) === 'true';
}

// Marca que já respondeu para este site
function marcarRespondido() {
  const chave = `impulso_${currentHostname}`;
  sessionStorage.setItem(chave, 'true');
}

// Pausa todos os vídeos e áudios da página
function pausarMidia() {
  // Pausa todos os vídeos
  const videos = document.querySelectorAll('video');
  videos.forEach(video => {
    if (!video.paused) {
      video.pause();
      video.dataset.impulsoWasPlaying = 'true';
    }
  });

  // Pausa todos os áudios
  const audios = document.querySelectorAll('audio');
  audios.forEach(audio => {
    if (!audio.paused) {
      audio.pause();
      audio.dataset.impulsoWasPlaying = 'true';
    }
  });

  // Pausa iframes (como YouTube embeds)
  const iframes = document.querySelectorAll('iframe');
  iframes.forEach(iframe => {
    try {
      // Tenta pausar o vídeo dentro do iframe (YouTube API)
      if (iframe.contentWindow) {
        iframe.contentWindow.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*');
      }
    } catch (e) {
      // Ignora erros de cross-origin
    }
  });
}

// Cria e mostra o modal
function mostrarModal() {
  // Pausa mídia antes de mostrar o modal
  pausarMidia();

  document.documentElement.classList.add('impulso-bloqueado');

  const overlay = document.createElement('div');
  overlay.id = 'impulso-overlay';

  // Aplica o tema
  if (currentTheme !== 'light') {
    overlay.className = currentTheme;
  }

  overlay.innerHTML = `
    <div id="impulso-modal">
      <div class="modal-header">
        <div class="modal-icon">
          <svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round">
            <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
            <line x1="12" y1="9" x2="12" y2="13"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
        </div>
        <div class="modal-title">
          <h2>Impulso detectado</h2>
          <p>Site na sua blocklist</p>
        </div>
      </div>

      <div class="modal-site">
        <div class="modal-site-indicator"></div>
        <span class="modal-site-name">${currentHostname}</span>
      </div>

      <p class="modal-question">
        Você quer <strong>realmente</strong> acessar este site<br>
        ou foi apenas por <strong>impulso</strong>?
      </p>

      <div class="cooldown-container">
        <div class="cooldown-header">
          <span class="cooldown-label">Aguarde para decidir</span>
          <span class="cooldown-time" id="cooldown-time">${timerDuration}s</span>
        </div>
        <div class="cooldown-bar">
          <div class="cooldown-progress" id="cooldown-progress"></div>
        </div>
      </div>

      <div class="modal-actions">
        <button class="modal-btn modal-btn-exit" id="btn-exit">
          <svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"/>
            <polyline points="12 19 5 12 12 5"/>
          </svg>
          Voltar
        </button>
        <button class="modal-btn modal-btn-enter disabled" id="btn-enter" disabled>
          <svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12 6 12 12 16 14"/>
          </svg>
          Aguarde...
        </button>
      </div>

      <p class="modal-hint">
        <kbd>Esc</kbd> voltar
        <span style="opacity: 0.5">•</span>
        <kbd>Enter</kbd> quando liberado
      </p>
    </div>
  `;

  document.documentElement.appendChild(overlay);

  // Elementos
  const cooldownTime = document.getElementById('cooldown-time');
  const cooldownProgress = document.getElementById('cooldown-progress');
  const btnEnter = document.getElementById('btn-enter');
  const btnExit = document.getElementById('btn-exit');
  const indicator = overlay.querySelector('.modal-site-indicator');

  let timeLeft = timerDuration;

  // Timer
  const timerInterval = setInterval(() => {
    timeLeft--;
    cooldownTime.textContent = `${timeLeft}s`;

    const progress = ((timerDuration - timeLeft) / timerDuration) * 100;
    cooldownProgress.style.width = `${progress}%`;

    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      cooldownTime.textContent = 'pronto';
      cooldownTime.classList.add('ready');
      cooldownProgress.classList.add('complete');
      cooldownProgress.style.width = '100%';

      btnEnter.disabled = false;
      btnEnter.classList.remove('disabled');
      btnEnter.innerHTML = `
        <svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
        Entrar
      `;

      indicator.classList.add('ready');
    }
  }, 1000);

  // Exit button
  btnExit.addEventListener('click', () => {
    cleanup();
    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.close();
      window.location.href = 'about:blank';
    }
  });

  // Enter button
  btnEnter.addEventListener('click', () => {
    if (btnEnter.disabled) return;

    cleanup();
    marcarRespondido();
    overlay.style.animation = 'fadeOut 0.2s ease-out forwards';
    setTimeout(() => {
      overlay.remove();
      document.documentElement.classList.remove('impulso-bloqueado');
    }, 200);
  });

  // Keyboard shortcuts
  function handleKeyDown(e) {
    // Previne comportamento padrão apenas para as teclas que usamos
    if (e.key === 'Escape' || (e.key === 'Enter' && !btnEnter.disabled)) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (e.key === 'Escape') {
      btnExit.click();
      cleanup();
    } else if (e.key === 'Enter' && !btnEnter.disabled) {
      btnEnter.click();
      cleanup();
    }
  }

  // Observer para pausar vídeos que sejam adicionados dinamicamente
  const mediaObserver = new MutationObserver((mutations) => {
    pausarMidia();
  });

  mediaObserver.observe(document.body, {
    childList: true,
    subtree: true
  });

  // Pausa periodicamente para garantir que nada toque
  const pauseInterval = setInterval(() => {
    pausarMidia();
  }, 500);

  function cleanup() {
    document.removeEventListener('keydown', handleKeyDown);
    clearInterval(timerInterval);
    clearInterval(pauseInterval);
    mediaObserver.disconnect();
  }

  // Adiciona o listener com capture para garantir que seja capturado antes de outros handlers
  document.addEventListener('keydown', handleKeyDown, true);
}

// Função principal
async function init() {
  await loadConfig();

  if (sites.length === 0 || !siteNaLista()) {
    return;
  }

  if (jaRespondeu()) {
    return;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mostrarModal);
  } else {
    mostrarModal();
  }
}

init();
