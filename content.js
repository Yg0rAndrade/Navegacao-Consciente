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
let hardBlockedSites = [];
let featYoutubeSpeed = true;
let featInstagramReels = true;
let siteFeatureObserver = null;

// Carrega as configurações
async function loadConfig() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(['sites', 'hardBlockedSites', 'timerDuration', 'alertInterval', 'showClock', 'theme', 'feat_youtube_speed', 'feat_instagram_reels'], (result) => {
      sites = result.sites || [];
      timerDuration = result.timerDuration || 10;
      alertInterval = result.alertInterval !== undefined ? result.alertInterval : 10;
      showClock = result.showClock !== undefined ? result.showClock : true;
      currentTheme = result.theme || 'light';
      hardBlockedSites = result.hardBlockedSites || [];
      featYoutubeSpeed = result.feat_youtube_speed !== false;
      featInstagramReels = result.feat_instagram_reels !== false;
      resolve();
    });
  });
}

// Verifica se o site atual está na lista
function siteNaLista() {
  if (!currentHostname) return false;
  return sites.some(site => site && (currentHostname.includes(site) || site.includes(currentHostname)));
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
    <button class="cronometro-close" id="cronometro-close" title="Fechar cronômetro">
      <svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"/>
        <line x1="6" y1="6" x2="18" y2="18"/>
      </svg>
    </button>
    <div class="cronometro-icon">
      <svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <polyline points="12 6 12 12 16 14"/>
      </svg>
    </div>
    <span class="cronometro-time" id="cronometro-display">${formatarTempo(segPassados)}</span>
  `;

  // Restaura posicao salva
  const posChave = `impulso_pos_${currentHostname}`;
  const posSalva = sessionStorage.getItem(posChave);
  if (posSalva) {
    try {
      const { x, y } = JSON.parse(posSalva);
      widget.style.top = `${y}px`;
      widget.style.left = `${x}px`;
      widget.style.right = 'auto';
    } catch (e) { /* ignora posicao invalida */ }
  }

  document.documentElement.appendChild(widget);

  // Drag and drop
  let isDragging = false;
  let dragStartX = 0;
  let dragStartY = 0;
  let widgetStartX = 0;
  let widgetStartY = 0;
  const DRAG_THRESHOLD = 4;

  function getPos(e) {
    if (e.touches && e.touches.length > 0) return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    return { x: e.clientX, y: e.clientY };
  }

  function onDragStart(e) {
    if (e.target.closest('.cronometro-close')) return;

    const pos = getPos(e);
    dragStartX = pos.x;
    dragStartY = pos.y;

    const rect = widget.getBoundingClientRect();
    widgetStartX = rect.left;
    widgetStartY = rect.top;
    isDragging = false;

    document.addEventListener('mousemove', onDragMove);
    document.addEventListener('mouseup', onDragEnd);
    document.addEventListener('touchmove', onDragMove, { passive: false });
    document.addEventListener('touchend', onDragEnd);
  }

  function onDragMove(e) {
    const pos = getPos(e);
    const dx = pos.x - dragStartX;
    const dy = pos.y - dragStartY;

    if (!isDragging && Math.abs(dx) < DRAG_THRESHOLD && Math.abs(dy) < DRAG_THRESHOLD) return;

    isDragging = true;
    e.preventDefault();
    widget.classList.add('dragging');

    const maxX = window.innerWidth - widget.offsetWidth;
    const maxY = window.innerHeight - widget.offsetHeight;
    const newX = Math.min(Math.max(0, widgetStartX + dx), maxX);
    const newY = Math.min(Math.max(0, widgetStartY + dy), maxY);

    widget.style.left = `${newX}px`;
    widget.style.top = `${newY}px`;
    widget.style.right = 'auto';
  }

  function onDragEnd() {
    document.removeEventListener('mousemove', onDragMove);
    document.removeEventListener('mouseup', onDragEnd);
    document.removeEventListener('touchmove', onDragMove);
    document.removeEventListener('touchend', onDragEnd);

    if (isDragging) {
      widget.classList.remove('dragging');
      sessionStorage.setItem(posChave, JSON.stringify({
        x: parseInt(widget.style.left),
        y: parseInt(widget.style.top)
      }));
    }
    setTimeout(() => { isDragging = false; }, 0);
  }

  widget.addEventListener('mousedown', onDragStart);
  widget.addEventListener('touchstart', onDragStart, { passive: true });

  // Botao fechar (ignora se estava arrastando)
  document.getElementById('cronometro-close').addEventListener('click', () => {
    if (isDragging) return;
    widget.style.animation = 'cronometroOut 0.3s ease-out forwards';
    setTimeout(() => widget.remove(), 300);
  });

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

// Escuta mudanças no storage para atualizar em tempo real
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'sync') {
    if (changes.hardBlockedSites !== undefined) {
      hardBlockedSites = changes.hardBlockedSites.newValue || [];
      const isHardBlocked = !!currentHostname && hardBlockedSites.some(s => s && (currentHostname.includes(s) || s.includes(currentHostname)));
      if (isHardBlocked && !document.getElementById('impulso-bloqueio')) {
        mostrarBloqueioTotal();
      } else if (!isHardBlocked) {
        document.getElementById('impulso-bloqueio')?.remove();
        document.documentElement.classList.remove('impulso-bloqueado');
      }
    }
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

// Frases para bloqueio total
const frasesBloqueio = [
  'Você bloqueou este site por uma razão. Confie em si mesmo.',
  'Cada segundo aqui é um segundo roubado do seu futuro.',
  'Sua versão mais produtiva está esperando você voltar.',
  'Este site foi bloqueado por você mesmo. Respeite sua decisão.',
  'O que você perderia se ficasse aqui por uma hora?',
  'Você programou este bloqueio quando estava com a cabeça clara.',
  'Confie no você de ontem, que decidiu bloquear isto.',
  'Cada distração tem um custo que você não vê agora.',
  'O hábito começa quando você cede pela primeira vez.',
  'Este clique pode custar muito mais do que parece.',
  'Você já sabe como essa sessão vai terminar.',
  'Sua atenção é o bem mais valioso que você tem.',
  'Voltar agora é um ato de respeito a si mesmo.',
  'O prazer desta distração dura minutos. O arrependimento, horas.',
  'Você não precisa deste site agora.',
  'Pense no que seu eu futuro diria sobre este momento.',
  'Toda grande conquista começa com uma distração recusada.',
  'Este site vai continuar existindo. Seu tempo, não.',
  'A disciplina de hoje é a liberdade de amanhã.',
  'Quantas vezes você já arrependeu de ter entrado aqui?',
  'Sair agora é a escolha mais inteligente que você pode fazer.',
  'Sua meta está esperando enquanto você hesita.',
  'Você é mais forte do que esse impulso.',
  'O que você poderia conquistar com esse tempo?',
  'Cada "só mais um pouco" custa caro no final.',
  'Você criou este bloqueio para proteger seus sonhos.',
  'Resista. Seu foco agradece.',
  'Nada neste site vale mais do que seu tempo.',
  'Voltar agora é vencer a batalha mais importante do dia.',
  'Sua produtividade está em suas mãos, literalmente.',
  'O autocontrole é o superpoder mais subestimado.',
  'Isso está te aproximando ou afastando do seu objetivo?',
  'Este momento de resistência define quem você está se tornando.',
  'Não alimente o hábito que você quer eliminar.',
  'Seu cérebro quer dopamina fácil. Não deixe ele vencer.',
  'Fechar esta página é uma vitória pequena com grande impacto.',
  'Cada vez que você resiste, fica mais fácil da próxima vez.',
  'Este site roubou horas suas antes. Não deixe roubar mais.',
  'Você merece usar seu tempo em algo que realmente importa.',
  'A versão de você que chega nos seus objetivos não entra aqui.',
  'Um passo de volta agora vale mil passos à frente depois.',
  'Sua atenção é escassa. Use-a sabiamente.',
  'Você está a uma escolha de ser a pessoa que quer ser.',
  'O impulso passa. O arrependimento fica.',
  'Você não é o seu impulso. Você é maior do que isso.',
  'Construir foco é exatamente isso: resistir quando é difícil.',
  'Volte ao que realmente importa. Agora.',
  'Sua melhor versão não está neste site.',
  'Você tem algo mais importante a fazer. E você sabe disso.',
  'Para acessar este site, remova o cadeado no popup da extensão.',
];

function fraseBloqueiAleatoria() {
  return frasesBloqueio[Math.floor(Math.random() * frasesBloqueio.length)];
}

// Mostra a tela de bloqueio total
function mostrarBloqueioTotal() {
  if (document.getElementById('impulso-bloqueio')) return;

  pausarMidia();
  document.documentElement.classList.add('impulso-bloqueado');

  const overlay = document.createElement('div');
  overlay.id = 'impulso-bloqueio';

  overlay.innerHTML = `
    <div id="impulso-bloqueio-modal">
      <div class="bloqueio-icon">
        <svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
        </svg>
      </div>
      <p class="bloqueio-label">Site bloqueado</p>
      <p class="bloqueio-site">${currentHostname}</p>
      <p class="bloqueio-frase">"${fraseBloqueiAleatoria()}"</p>
      <button class="bloqueio-btn" id="bloqueio-btn-voltar">
        <svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round">
          <line x1="19" y1="12" x2="5" y2="12"/>
          <polyline points="12 19 5 12 12 5"/>
        </svg>
        Voltar
      </button>
      <p class="bloqueio-hint">Para acessar, remova o cadeado no popup</p>
    </div>
  `;

  document.documentElement.appendChild(overlay);

  document.getElementById('bloqueio-btn-voltar').addEventListener('click', () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.replace('about:blank');
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' || e.key === 'Backspace') {
      if (window.history.length > 1) window.history.back();
      else window.location.replace('about:blank');
    }
  }, { once: true, capture: true });
}

// Função principal
async function init() {
  await loadConfig();

  if (sites.length === 0 || !siteNaLista()) return;

  const isHardBlocked = !!currentHostname && hardBlockedSites.some(s => s && (currentHostname.includes(s) || s.includes(currentHostname)));
  if (isHardBlocked) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', mostrarBloqueioTotal);
    } else {
      mostrarBloqueioTotal();
    }
    return;
  }

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

// === FUNCIONALIDADES ESPECÍFICAS POR SITE ===

function updateYoutubeSpeedItem() {
  document.querySelectorAll('.ytp-menuitem').forEach(item => {
    const label = item.querySelector('.ytp-menuitem-label');
    if (label && label.textContent.trim() === 'Velocidade da reprodução') {
      if (featYoutubeSpeed) {
        item.style.setProperty('display', 'none', 'important');
      } else {
        item.style.removeProperty('display');
      }
    }
  });
}

function removeInstagramReels() {
  document.querySelectorAll('a[href="/reels/"]').forEach(el => {
    const parent = el.closest('li') || el.parentElement;
    if (parent) parent.style.setProperty('display', 'none', 'important');
  });
}

function setupSiteFeatureObserver() {
  if (!document.body) return;

  if (currentHostname.includes('youtube.com')) {
    const ytObserver = new MutationObserver(updateYoutubeSpeedItem);
    ytObserver.observe(document.body, { childList: true, subtree: true });
  }

  if (currentHostname.includes('instagram.com')) {
    const igObserver = new MutationObserver(() => {
      if (featInstagramReels) removeInstagramReels();
    });
    igObserver.observe(document.body, { childList: true, subtree: true });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', setupSiteFeatureObserver);
} else {
  setupSiteFeatureObserver();
}

chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== 'sync') return;
  if (changes.feat_youtube_speed !== undefined) {
    featYoutubeSpeed = changes.feat_youtube_speed.newValue !== false;
    updateYoutubeSpeedItem();
  }
  if (changes.feat_instagram_reels !== undefined) {
    featInstagramReels = changes.feat_instagram_reels.newValue !== false;
    if (featInstagramReels) removeInstagramReels();
  }
});
