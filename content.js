// Frases motivacionais exibidas aleatoriamente no modal
const frases = [
  'Você realmente precisa abrir isso agora?',
  'Isso é prioridade ou apenas distração?',
  'Daqui a 10 minutos você vai agradecer por não clicar.',
  'Seu foco vale mais do que este clique.',
  'Isso te aproxima ou te afasta do seu objetivo?',
  'Cuidado: esse site costuma roubar seu tempo.',
  'Você abriu por necessidade ou por hábito?',
  'Esse clique tem propósito?',
  'Pare um segundo. Ainda quer entrar?',
  'Seu futuro agradeceria se você não abrisse.',
  'Só mais um scroll… ou mais uma hora perdida?',
  'Você controla a internet ou ela controla você?',
  'Respire. Pense. Depois decida.',
  'Esse site vai te ajudar ou te distrair?',
  'Você veio trabalhar ou se distrair?',
  'Talvez seja melhor voltar ao que realmente importa.',
  'Esse clique vale seu tempo agora?',
  'Impulso ou decisão consciente?',
  'Você abriu isso automaticamente, não foi?',
  'Um clique pode custar sua produtividade.',
  'Lembre-se do que você estava fazendo antes.',
  'Esse site é um atalho… ou um desvio?',
  'Seu objetivo ainda é o mesmo?',
  'O foco que você perde agora custa caro depois.',
  'Só porque você pode abrir, não significa que deve.',
  'Isso vai agregar algo ou apenas ocupar tempo?',
  'Pare. Pense. Escolha com consciência.',
  'Você está no controle. Não o hábito.',
  'Vale a pena quebrar seu foco por isso?',
  'Voltar ao trabalho agora pode mudar seu dia.',
];

function fraseAleatoria() {
  return frases[Math.floor(Math.random() * frases.length)];
}

// Variáveis globais
let sites = [];
let timerDuration = 10;
let alertInterval = 10;
let showClock = true;
let currentTheme = 'light';
let currentHostname = window.location.hostname.replace('www.', '');
let alertaAtivo = false;

// Carrega as configurações
async function loadConfig() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(['sites', 'timerDuration', 'alertInterval', 'showClock', 'theme'], (result) => {
      sites = result.sites || [];
      timerDuration = result.timerDuration || 10;
      alertInterval = result.alertInterval !== undefined ? result.alertInterval : 10;
      showClock = result.showClock !== undefined ? result.showClock : true;
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

// Salva o timestamp de início da sessão
function salvarInicioSessao() {
  const chave = `impulso_timer_${currentHostname}`;
  if (!sessionStorage.getItem(chave)) {
    sessionStorage.setItem(chave, Date.now().toString());
  }
}

// Retorna o timestamp de início salvo, ou cria um novo
function getInicioSessao() {
  const chave = `impulso_timer_${currentHostname}`;
  let inicio = sessionStorage.getItem(chave);
  if (!inicio) {
    inicio = Date.now().toString();
    sessionStorage.setItem(chave, inicio);
  }
  return parseInt(inicio, 10);
}

// Formata segundos em MM:SS ou HH:MM:SS
function formatarTempo(totalSegundos) {
  const h = Math.floor(totalSegundos / 3600);
  const m = Math.floor((totalSegundos % 3600) / 60);
  const s = totalSegundos % 60;
  const pad = (n) => String(n).padStart(2, '0');

  if (h > 0) {
    return `${pad(h)}<span class="cronometro-separator">:</span>${pad(m)}<span class="cronometro-separator">:</span>${pad(s)}`;
  }
  return `${pad(m)}<span class="cronometro-separator">:</span>${pad(s)}`;
}

// Formata segundos em texto legível (ex: "5 minutos", "1 hora e 23 minutos")
function formatarTempoLegivel(totalSegundos) {
  const h = Math.floor(totalSegundos / 3600);
  const m = Math.floor((totalSegundos % 3600) / 60);
  const s = totalSegundos % 60;

  const partes = [];
  if (h > 0) partes.push(`${h} hora${h > 1 ? 's' : ''}`);
  if (m > 0) partes.push(`${m} minuto${m > 1 ? 's' : ''}`);
  if (partes.length === 0) partes.push(`${s} segundo${s > 1 ? 's' : ''}`);

  return partes.join(' e ');
}

// Frases de alerta para o modal de tempo perdido
const frasesAlerta = [
  'Esse tempo não volta mais.',
  'Você poderia ter feito algo incrível com esse tempo.',
  'Cada minuto aqui é um minuto a menos para seus sonhos.',
  'O tempo é o recurso mais precioso que você tem.',
  'Sua vida está passando enquanto você scrolla.',
  'Será que vale a pena continuar?',
  'Pense no que poderia estar fazendo agora.',
  'Esse hábito está te custando mais do que você imagina.',
];

function fraseAlertaAleatoria() {
  return frasesAlerta[Math.floor(Math.random() * frasesAlerta.length)];
}

// Mostra o modal de alerta de tempo perdido
function mostrarAlertaTempo(tempoSegundos) {
  if (alertaAtivo || document.getElementById('impulso-alerta-overlay')) return;
  alertaAtivo = true;

  pausarMidia();
  document.documentElement.classList.add('impulso-bloqueado');

  const overlay = document.createElement('div');
  overlay.id = 'impulso-alerta-overlay';

  if (currentTheme !== 'light') {
    overlay.className = currentTheme;
  }

  const tempoLegivel = formatarTempoLegivel(tempoSegundos);

  overlay.innerHTML = `
    <div id="impulso-alerta-modal">
      <div class="alerta-icon">
        <svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round">
          <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
          <line x1="12" y1="9" x2="12" y2="13"/>
          <line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
      </div>
      <div class="alerta-tempo-perdido">${tempoLegivel}</div>
      <div class="alerta-titulo">de vida perdidos em ${currentHostname}</div>
      <p class="alerta-descricao">
        Você já gastou <strong>${tempoLegivel}</strong> neste site.<br>
        ${fraseAlertaAleatoria()}
      </p>
      <div class="alerta-actions">
        <button class="alerta-btn alerta-btn-sair" id="alerta-btn-sair">
          <svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"/>
            <polyline points="12 19 5 12 12 5"/>
          </svg>
          Sair agora
        </button>
        <button class="alerta-btn alerta-btn-continuar" id="alerta-btn-continuar">
          <svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
          Continuar
        </button>
      </div>
    </div>
  `;

  document.documentElement.appendChild(overlay);

  const btnSair = document.getElementById('alerta-btn-sair');
  const btnContinuar = document.getElementById('alerta-btn-continuar');

  function fecharAlerta() {
    alertaAtivo = false;
    overlay.style.animation = 'alertOverlayOut 0.2s ease-out forwards';
    setTimeout(() => {
      overlay.remove();
      if (!document.getElementById('impulso-overlay')) {
        document.documentElement.classList.remove('impulso-bloqueado');
      }
    }, 200);
    document.removeEventListener('keydown', handleAlertKeyDown, true);
  }

  btnSair.addEventListener('click', () => {
    fecharAlerta();
    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.close();
      window.location.href = 'about:blank';
    }
  });

  btnContinuar.addEventListener('click', fecharAlerta);

  function handleAlertKeyDown(e) {
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      btnSair.click();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      fecharAlerta();
    }
  }

  document.addEventListener('keydown', handleAlertKeyDown, true);
}

// Mostra o cronômetro flutuante na página
function mostrarCronometro() {
  if (document.getElementById('impulso-cronometro')) return;

  salvarInicioSessao();

  const widget = document.createElement('div');
  widget.id = 'impulso-cronometro';

  if (currentTheme !== 'light') {
    widget.className = currentTheme;
  }

  const inicioSessao = getInicioSessao();
  const segPassados = Math.floor((Date.now() - inicioSessao) / 1000);

  widget.innerHTML = `
    <div class="cronometro-icon">
      <svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <polyline points="12 6 12 12 16 14"/>
      </svg>
    </div>
    <span class="cronometro-time" id="cronometro-display">${formatarTempo(segPassados)}</span>
  `;

  document.documentElement.appendChild(widget);

  const display = document.getElementById('cronometro-display');
  let ultimoAlerta = 0;
  let lastAlertInterval = alertInterval;

  if (alertInterval > 0 && segPassados >= alertInterval * 60) {
    ultimoAlerta = Math.floor(segPassados / (alertInterval * 60)) * (alertInterval * 60);
    widget.classList.add('alerta');
  }

  setInterval(() => {
    const elapsed = Math.floor((Date.now() - inicioSessao) / 1000);
    display.innerHTML = formatarTempo(elapsed);

    if (elapsed > 0 && elapsed % 60 === 0) {
      widget.classList.remove('minute-pulse');
      void widget.offsetWidth;
      widget.classList.add('minute-pulse');
      setTimeout(() => widget.classList.remove('minute-pulse'), 1500);
    }

    if (alertInterval <= 0) {
      widget.classList.remove('alerta');
      lastAlertInterval = alertInterval;
      return;
    }

    const alertIntervalSec = alertInterval * 60;

    if (lastAlertInterval !== alertInterval) {
      lastAlertInterval = alertInterval;
      ultimoAlerta = Math.floor(elapsed / alertIntervalSec) * alertIntervalSec;
    }

    if (elapsed >= alertIntervalSec) {
      widget.classList.add('alerta');
    } else {
      widget.classList.remove('alerta');
    }

    const proximoAlerta = ultimoAlerta + alertIntervalSec;
    if (elapsed >= proximoAlerta) {
      ultimoAlerta = Math.floor(elapsed / alertIntervalSec) * alertIntervalSec;
      mostrarAlertaTempo(elapsed);
    }
  }, 1000);
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

      <p class="modal-question">${fraseAleatoria()}</p>

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
    salvarInicioSessao();
    overlay.style.animation = 'fadeOut 0.2s ease-out forwards';
    setTimeout(() => {
      overlay.remove();
      document.documentElement.classList.remove('impulso-bloqueado');
      if (showClock) mostrarCronometro();
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

// Escuta mudanças de tema no storage para atualizar o cronômetro em tempo real
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'sync') {
    if (changes.theme) {
      currentTheme = changes.theme.newValue || 'light';
      const widget = document.getElementById('impulso-cronometro');
      if (widget) {
        const classes = [currentTheme === 'light' ? '' : currentTheme];
        if (widget.classList.contains('alerta')) classes.push('alerta');
        widget.className = classes.filter(Boolean).join(' ');
      }
    }
    if (changes.alertInterval !== undefined) {
      alertInterval = changes.alertInterval.newValue !== undefined ? changes.alertInterval.newValue : 10;
    }
    if (changes.showClock !== undefined) {
      showClock = changes.showClock.newValue !== undefined ? changes.showClock.newValue : true;
      const widget = document.getElementById('impulso-cronometro');
      if (showClock && !widget && jaRespondeu()) {
        mostrarCronometro();
      } else if (!showClock && widget) {
        widget.remove();
      }
    }
  }
});

// Função principal
async function init() {
  await loadConfig();

  if (sites.length === 0 || !siteNaLista()) return;

  if (jaRespondeu()) {
    if (showClock) mostrarCronometro();
    return;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mostrarModal);
  } else {
    mostrarModal();
  }
}

init();
