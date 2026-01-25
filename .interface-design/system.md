# Design System - Navegação Consciente v2.0

## Direção e Sentimento

**Conceito:** Glassmorphism Vibrante — Design moderno e minimalista com efeitos de vidro translúcido, cores vivas e interfaces que incentivam o uso consciente.

**Público:** Usuários que valorizam estética moderna, interfaces intuitivas e experiências premium.

**Sentimento:** Sofisticado, acolhedor, futurista. Como uma interface de ficção científica com toque humano.

**Assinatura:** Cards de vidro translúcido + gradientes vibrantes + efeitos de glow + animações fluidas.

---

## Paleta de Cores

### Glassmorphism Core
```css
--glass-bg: rgba(255, 255, 255, 0.08);
--glass-bg-strong: rgba(255, 255, 255, 0.12);
--glass-border: rgba(255, 255, 255, 0.18);
--glass-border-light: rgba(255, 255, 255, 0.25);
--glass-shadow: rgba(0, 0, 0, 0.25);
--glass-blur: 20px;
```

### Cores Vibrantes (Accent)
```css
--accent-primary: #00D4FF;      /* Cyan vibrante - interativo */
--accent-secondary: #FF6B9D;    /* Rosa coral - destaque */
--accent-success: #00F5A0;      /* Verde neon - sucesso */
--accent-warning: #FFD93D;      /* Amarelo dourado - atenção */
--accent-danger: #FF6B6B;       /* Vermelho coral - perigo/bloqueio */
```

### Glows (Brilhos)
```css
--accent-primary-glow: rgba(0, 212, 255, 0.4);
--accent-secondary-glow: rgba(255, 107, 157, 0.4);
--accent-success-glow: rgba(0, 245, 160, 0.4);
--accent-warning-glow: rgba(255, 217, 61, 0.4);
--accent-danger-glow: rgba(255, 107, 107, 0.4);
```

### Backgrounds
```css
--bg-gradient: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f0f23 100%);
--bg-mesh:
  radial-gradient(at 20% 30%, rgba(0, 212, 255, 0.15) 0%, transparent 50%),
  radial-gradient(at 80% 70%, rgba(255, 107, 157, 0.12) 0%, transparent 50%),
  radial-gradient(at 50% 50%, rgba(0, 245, 160, 0.08) 0%, transparent 50%);
```

### Texto
```css
--text-primary: #FFFFFF;
--text-secondary: rgba(255, 255, 255, 0.7);
--text-muted: rgba(255, 255, 255, 0.45);
```

---

## Tipografia

**Font Family:** DM Sans (Google Fonts)
- Weights: 400, 500, 600, 700
- Características: moderna, clean, amigável, boa legibilidade

```css
--font-main: 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif;
```

### Escala Tipográfica
| Uso | Tamanho | Peso | Extras |
|-----|---------|------|--------|
| Títulos | 18-22px | 700 | letter-spacing: -0.3px |
| Labels | 11px | 600 | uppercase, letter-spacing: 1px |
| Body | 13-14px | 500 | line-height: 1.5 |
| Tags/Badges | 10-11px | 600 | - |

---

## Espaçamento

```css
--space-xs: 4px;
--space-sm: 8px;
--space-md: 12px;
--space-lg: 16px;
--space-xl: 24px;
```

---

## Border Radius

```css
--radius-sm: 8px;    /* inputs internos, tags */
--radius-md: 12px;   /* botões, inputs, cards pequenos */
--radius-lg: 16px;   /* cards principais */
--radius-xl: 20px;   /* modais */
--radius-full: 100px; /* pills, badges */
```

---

## Transições

```css
--transition-fast: 150ms cubic-bezier(0.4, 0, 0.2, 1);
--transition-smooth: 300ms cubic-bezier(0.4, 0, 0.2, 1);
--transition-bounce: 400ms cubic-bezier(0.34, 1.56, 0.64, 1);
```

---

## Componentes

### Glass Card
O componente base para containers.
```css
.glass-card {
  background: var(--glass-bg);
  backdrop-filter: blur(var(--glass-blur)) saturate(180%);
  -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(180%);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-lg);
  box-shadow:
    0 8px 32px var(--glass-shadow),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
}
```

### Botões

**Gradient (Primary):**
```css
.btn-gradient {
  background: linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-secondary) 100%);
  box-shadow:
    0 4px 20px var(--accent-primary-glow),
    inset 0 1px 0 rgba(255, 255, 255, 0.3);
}
```

**Danger:**
```css
.btn-danger {
  background: linear-gradient(135deg, var(--accent-danger) 0%, #ff8f8f 100%);
  box-shadow: 0 4px 20px var(--accent-danger-glow);
}
```

**Success:**
```css
.btn-success {
  background: linear-gradient(135deg, var(--accent-success) 0%, #4fffb0 100%);
  color: #0f0f23;
  box-shadow: 0 4px 20px var(--accent-success-glow);
}
```

**Ghost:**
```css
.btn-ghost {
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  backdrop-filter: blur(10px);
}
```

### Status Badges
```css
.status-blocked {
  background: rgba(255, 107, 107, 0.15);
  color: var(--accent-danger);
  border: 1px solid rgba(255, 107, 107, 0.3);
}

.status-allowed {
  background: rgba(0, 245, 160, 0.15);
  color: var(--accent-success);
  border: 1px solid rgba(0, 245, 160, 0.3);
}
```

### Inputs
```css
.input {
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-md);
  backdrop-filter: blur(10px);
}

.input:focus {
  border-color: var(--accent-primary);
  box-shadow: 0 0 0 3px var(--accent-primary-glow);
}
```

### Progress Bar (Cooldown)
```css
.progress-bar {
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-full);
}

.progress-fill {
  background: linear-gradient(90deg, var(--accent-warning) 0%, #ffe066 100%);
  box-shadow: 0 0 16px var(--accent-warning-glow);
}

.progress-fill.complete {
  background: linear-gradient(90deg, var(--accent-success) 0%, #4fffb0 100%);
  box-shadow: 0 0 16px var(--accent-success-glow);
}
```

---

## Animações

### Modal Entrada
```css
@keyframes modalIn {
  from {
    opacity: 0;
    transform: scale(0.9) translateY(20px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}
```

### Float (Elementos decorativos)
```css
@keyframes iconFloat {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-3px); }
}
```

### Pulse (Indicadores)
```css
@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(0.8); }
}
```

### Shimmer (Loading)
```css
@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}
```

### Heartbeat (Decorativo)
```css
@keyframes heartbeat {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.2); }
}
```

---

## Efeitos Especiais

### Mesh Background
Múltiplos radial-gradients com cores accent em posições diferentes para criar profundidade e dinamismo visual sem sobrecarregar.

### Glow Effects
Cada cor accent tem uma versão glow com 40% de opacidade para criar efeitos de brilho suave em botões, badges e indicadores.

### Inset Highlights
```css
inset 0 1px 0 rgba(255, 255, 255, 0.1)
```
Simula reflexo de luz no topo dos elementos, aumentando a sensação de profundidade.

### Hover States
- translateY(-2px) para elevação
- Aumento de box-shadow e glow
- Transição bounce para feedback satisfatório

---

## Ícones

Usando SVGs inline com stroke para consistência:
```css
stroke-width: 2 a 2.5
stroke-linecap: round
stroke-linejoin: round
fill: none
```

Ícones são responsivos ao contexto (currentColor para herdar cor do parent).

---

## Princípios de UX

1. **Feedback Visual Imediato** — Animações suaves em todas as interações (hover, click, focus)

2. **Hierarquia Clara** — Uso de cores vibrantes, tamanhos e profundidade para guiar o olhar

3. **Microinterações** — Botões e elementos respondem de forma orgânica (bounce, scale)

4. **Acessibilidade** — Contraste adequado entre texto e fundo, estados de foco visíveis

5. **Intuitividade** — Ícones descritivos, labels claros, ações óbvias sem necessidade de explicação

6. **Consistência** — Mesmo sistema de cores, espaçamentos e animações em toda a interface

7. **Delite** — Pequenos detalhes como o coração pulsante, glow effects e mesh background criam uma experiência premium
