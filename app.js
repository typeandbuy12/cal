/* =========================================================
   CandyCalc ✨ — app.js
   Vanilla JS: calculator logic, UI, themes, sound, keyboard, PWA
   ========================================================= */

(() => {
  'use strict';

  /* ---------------------------------------------------------
     DOM REFERENCES
  --------------------------------------------------------- */
  const displayEl = document.getElementById('display');
  const displayPrevEl = document.getElementById('display-prev');
  const keysEl = document.getElementById('keys');
  const splashEl = document.getElementById('splash-screen');

  const darkToggleBtn = document.getElementById('dark-toggle');
  const darkIcon = document.getElementById('dark-icon');

  const soundToggleBtn = document.getElementById('sound-toggle');
  const soundIcon = document.getElementById('sound-icon');

  const themePanelToggleBtn = document.getElementById('theme-panel-toggle');
  const themePanel = document.getElementById('theme-panel');
  const themeOptionButtons = document.querySelectorAll('.theme-option');

  const equalKey = document.querySelector('.key-equal');

  /* ---------------------------------------------------------
     STORAGE KEYS
  --------------------------------------------------------- */
  const STORAGE = {
    darkMode: 'candycalc-dark-mode',
    theme: 'candycalc-theme',
    sound: 'candycalc-sound'
  };

  /* =========================================================
     CALCULATOR LOGIC
     ========================================================= */
  const CalcState = {
    current: '0',      // string shown / being typed
    previous: null,     // string of previous operand
    operator: null,      // '+', '−', '×', '÷'
    justCalculated: false, // true right after "="
    hasError: false
  };

  const MAX_DIGITS = 14;

  function resetCalc() {
    CalcState.current = '0';
    CalcState.previous = null;
    CalcState.operator = null;
    CalcState.justCalculated = false;
    CalcState.hasError = false;
  }

  function inputDigit(digit) {
    if (CalcState.hasError) resetCalc();

    if (CalcState.justCalculated) {
      // Start a fresh number after "="
      CalcState.current = digit === '.' ? '0.' : digit;
      CalcState.justCalculated = false;
      return;
    }

    if (digit === '.') {
      if (CalcState.current.includes('.')) return; // prevent multiple decimals
      CalcState.current += '.';
      return;
    }

    if (CalcState.current === '0') {
      CalcState.current = digit;
    } else if (CalcState.current.replace('-', '').replace('.', '').length < MAX_DIGITS) {
      CalcState.current += digit;
    }
  }

  function chooseOperator(op) {
    if (CalcState.hasError) resetCalc();

    if (CalcState.operator && !CalcState.justCalculated && CalcState.previous !== null) {
      // Chain operations: calculate first, then continue
      const result = compute();
      if (result === null) return; // error already shown
      CalcState.previous = String(result);
      CalcState.current = String(result);
    } else {
      CalcState.previous = CalcState.current;
    }

    CalcState.operator = op;
    CalcState.justCalculated = false;
    CalcState.current = '0';
  }

  function compute() {
    const a = parseFloat(CalcState.previous);
    const b = parseFloat(CalcState.current);

    if (Number.isNaN(a) || Number.isNaN(b)) {
      triggerError();
      return null;
    }

    let result;
    try {
      switch (CalcState.operator) {
        case '+': result = a + b; break;
        case '−': result = a - b; break;
        case '×': result = a * b; break;
        case '÷':
          if (b === 0) {
            triggerError();
            return null;
          }
          result = a / b;
          break;
        default:
          return null;
      }
    } catch (err) {
      triggerError();
      return null;
    }

    if (!Number.isFinite(result)) {
      triggerError();
      return null;
    }

    // Round to avoid floating point artifacts, keep reasonable precision
    result = Math.round((result + Number.EPSILON) * 1e10) / 1e10;

    if (Math.abs(result) > 999999999999) {
      triggerError();
      return null;
    }

    return result;
  }

  function equals() {
    if (CalcState.operator === null || CalcState.previous === null) return;

    const result = compute();
    if (result === null) return;

    CalcState.current = String(result);
    CalcState.previous = null;
    CalcState.operator = null;
    CalcState.justCalculated = true;
    CalcState.hasError = false;

    playSuccessAnimation();
  }

  function deleteLast() {
    if (CalcState.hasError) {
      resetCalc();
      updateDisplay();
      return;
    }
    if (CalcState.justCalculated) return; // Nothing sensible to delete right after "="

    if (CalcState.current.length <= 1 || (CalcState.current.length === 2 && CalcState.current.startsWith('-'))) {
      CalcState.current = '0';
    } else {
      CalcState.current = CalcState.current.slice(0, -1);
    }
  }

  function triggerError() {
    CalcState.hasError = true;
    CalcState.current = 'Oops! Try again ✨';
    CalcState.previous = null;
    CalcState.operator = null;
    CalcState.justCalculated = false;
  }

  /* ---------------------------------------------------------
     NUMBER FORMATTING
  --------------------------------------------------------- */
  function formatNumber(value) {
    if (typeof value !== 'string') value = String(value);
    if (CalcState.hasError) return value;

    const isNegative = value.startsWith('-');
    let [intPart, decPart] = value.replace('-', '').split('.');

    if (intPart === '') intPart = '0';
    const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');

    let result = formattedInt;
    if (decPart !== undefined) result += '.' + decPart;
    return (isNegative ? '-' : '') + result;
  }

  /* =========================================================
     UI UPDATES
     ========================================================= */
  function updateDisplay(animate = true) {
    displayEl.textContent = formatNumber(CalcState.current);

    if (CalcState.operator && CalcState.previous !== null) {
      displayPrevEl.textContent = `${formatNumber(CalcState.previous)} ${CalcState.operator}`;
    } else {
      displayPrevEl.textContent = '';
    }

    if (animate) {
      displayEl.classList.remove('updated', 'error-shake', 'success-glow');
      // Force reflow to restart animation
      void displayEl.offsetWidth;
      displayEl.classList.add(CalcState.hasError ? 'error-shake' : 'updated');
    }
  }

  function playSuccessAnimation() {
    updateDisplay(false);
    displayEl.classList.remove('updated', 'error-shake', 'success-glow');
    void displayEl.offsetWidth;
    displayEl.classList.add('success-glow');

    equalKey.classList.remove('success');
    void equalKey.offsetWidth;
    equalKey.classList.add('success');
  }

  function flashKey(el) {
    if (!el) return;
    el.classList.add('pressed');
    setTimeout(() => el.classList.remove('pressed'), 130);
  }

  /* =========================================================
     BUTTON EVENTS
     ========================================================= */
  keysEl.addEventListener('click', (e) => {
    const btn = e.target.closest('.key');
    if (!btn) return;

    handleKeyAction(btn);
    flashKey(btn);
    playClickSound();
  });

  function handleKeyAction(btn) {
    if (btn.dataset.num !== undefined) {
      inputDigit(btn.dataset.num);
    } else if (btn.dataset.op !== undefined) {
      chooseOperator(btn.dataset.op);
    } else if (btn.dataset.action === 'clear') {
      resetCalc();
    } else if (btn.dataset.action === 'delete') {
      deleteLast();
    } else if (btn.dataset.action === 'equals') {
      equals();
      updateDisplay(false);
      return;
    }
    updateDisplay();
  }

  /* =========================================================
     KEYBOARD SUPPORT
     ========================================================= */
  const KEY_TO_BUTTON = {
    '0': '[data-num="0"]', '1': '[data-num="1"]', '2': '[data-num="2"]',
    '3': '[data-num="3"]', '4': '[data-num="4"]', '5': '[data-num="5"]',
    '6': '[data-num="6"]', '7': '[data-num="7"]', '8': '[data-num="8"]',
    '9': '[data-num="9"]', '.': '[data-num="."]',
    '+': '[data-op="+"]', '-': '[data-op="−"]',
    '*': '[data-op="×"]', '/': '[data-op="÷"]',
    'Enter': '[data-action="equals"]', '=': '[data-action="equals"]',
    'Backspace': '[data-action="delete"]',
    'Escape': '[data-action="clear"]'
  };

  window.addEventListener('keydown', (e) => {
    // Avoid interfering with typing inside inputs (none exist, but safe-guard)
    const selector = KEY_TO_BUTTON[e.key];
    if (!selector) return;

    e.preventDefault();
    const btn = keysEl.querySelector(selector);
    if (!btn) return;

    handleKeyAction(btn);
    flashKey(btn);
    playClickSound();
  });

  /* =========================================================
     THEME MANAGEMENT (dark mode + color themes)
     ========================================================= */
  function applyDarkMode(isDark, persist = true) {
    document.body.classList.toggle('dark-mode', isDark);
    darkToggleBtn.setAttribute('aria-pressed', String(isDark));
    darkIcon.textContent = isDark ? '🌙' : '☀️';
    if (persist) localStorage.setItem(STORAGE.darkMode, isDark ? '1' : '0');
  }

  function applyTheme(themeName, persist = true) {
    document.body.setAttribute('data-theme', themeName);
    themeOptionButtons.forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.theme === themeName);
    });
    if (persist) localStorage.setItem(STORAGE.theme, themeName);
  }

  darkToggleBtn.addEventListener('click', () => {
    const isDark = !document.body.classList.contains('dark-mode');
    applyDarkMode(isDark);
  });

  themePanelToggleBtn.addEventListener('click', () => {
    const isOpen = !themePanel.hasAttribute('hidden');
    if (isOpen) {
      themePanel.setAttribute('hidden', '');
      themePanelToggleBtn.setAttribute('aria-expanded', 'false');
    } else {
      themePanel.removeAttribute('hidden');
      themePanelToggleBtn.setAttribute('aria-expanded', 'true');
    }
  });

  document.addEventListener('click', (e) => {
    if (
      themePanel.hasAttribute('hidden') ||
      themePanel.contains(e.target) ||
      e.target === themePanelToggleBtn ||
      themePanelToggleBtn.contains(e.target)
    ) return;
    themePanel.setAttribute('hidden', '');
    themePanelToggleBtn.setAttribute('aria-expanded', 'false');
  });

  themeOptionButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      applyTheme(btn.dataset.theme);
    });
  });

  /* =========================================================
     SOUND EFFECTS (Web Audio API — no external files needed)
     ========================================================= */
  let audioCtx = null;
  let soundEnabled = false;

  function ensureAudioContext() {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) audioCtx = new AudioContextClass();
    }
    return audioCtx;
  }

  function playClickSound() {
    if (!soundEnabled) return;
    const ctx = ensureAudioContext();
    if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume();

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(660, now);
    osc.frequency.exponentialRampToValueAtTime(520, now + 0.08);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.06, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.1);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.12);
  }

  function applySoundPref(enabled, persist = true) {
    soundEnabled = enabled;
    soundToggleBtn.setAttribute('aria-pressed', String(enabled));
    soundIcon.textContent = enabled ? '🔊' : '🔈';
    if (persist) localStorage.setItem(STORAGE.sound, enabled ? '1' : '0');
  }

  soundToggleBtn.addEventListener('click', () => {
    // First user gesture: unlock the audio context
    ensureAudioContext();
    applySoundPref(!soundEnabled);
    if (soundEnabled) playClickSound();
  });

  /* =========================================================
     RESTORE SAVED PREFERENCES
     ========================================================= */
  function restorePreferences() {
    const savedDark = localStorage.getItem(STORAGE.darkMode) === '1';
    applyDarkMode(savedDark, false);

    const savedTheme = localStorage.getItem(STORAGE.theme) || 'strawberry';
    applyTheme(savedTheme, false);

    const savedSound = localStorage.getItem(STORAGE.sound) === '1';
    applySoundPref(savedSound, false);
  }

  /* =========================================================
     SPLASH SCREEN
     ========================================================= */
  function initSplashScreen() {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const delay = reduceMotion ? 400 : 1700;

    window.addEventListener('load', () => {
      setTimeout(() => {
        splashEl.classList.add('hide');
        splashEl.addEventListener('transitionend', () => {
          splashEl.remove();
        }, { once: true });
      }, delay);
    });
  }

  /* =========================================================
     PWA: SERVICE WORKER REGISTRATION
     ========================================================= */
  function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('./service-worker.js').catch((err) => {
          console.warn('CandyCalc: service worker registration failed', err);
        });
      });
    }
  }

  /* =========================================================
     INIT
     ========================================================= */
  function init() {
    restorePreferences();
    updateDisplay(false);
    initSplashScreen();
    registerServiceWorker();
  }

  init();
})();
