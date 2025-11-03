(function () {
  const ICON_CDN_BASE = 'https://unpkg.com/@tabler/icons@2.47.0/icons';
  const ICON_MAP = {
    github: 'brand-github',
    telegram: 'brand-telegram',
    x: 'brand-x',
    instagram: 'brand-instagram',
    discord: 'brand-discord',
    vk: 'brand-vk',
    mail: 'mail',
    website: 'world'
  };

  const els = {
    name: document.getElementById('name'),
    handle: document.getElementById('handle'),
    bio: document.getElementById('bio'),
    avatar: document.getElementById('avatar'),
    links: document.getElementById('links'),
    settingsBtn: document.getElementById('settingsBtn'),
    settingsPanel: document.getElementById('settingsPanel'),
    closeSettings: document.getElementById('closeSettings'),
    swatches: () => Array.from(document.querySelectorAll('.swatch')),
    bgUrl: document.getElementById('bgUrl'),
    bgApplyUrl: document.getElementById('bgApplyUrl'),
    bgFile: document.getElementById('bgFile'),
    bgReset: document.getElementById('bgReset')
  };

  const LS = {
    theme: 'bio_theme',
    bg: 'bio_custom_bg',      // dataURL
    bgUrl: 'bio_custom_bg_url'
  };

  const cfg = window.CONFIG || {};

  // Инициализация профиля
  function initProfile() {
    els.name.textContent = cfg.name || 'Имя';
    els.handle.textContent = cfg.handle || '';
    els.bio.textContent = cfg.bio || '';
    if (cfg.avatar) els.avatar.src = cfg.avatar;
  }

  // Рендер ссылок (только иконки)
  async function renderLinks() {
    els.links.innerHTML = '';
    for (const link of (cfg.links || [])) {
      if (!link?.url || !link?.type) continue;
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.className = 'icon-link';
      a.href = link.url;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.title = link.title || link.type;
      a.setAttribute('aria-label', link.title || link.type);

      const iconName = ICON_MAP[link.type] || link.type;
      const svg = await getIconSvg(iconName);
      if (svg) {
        a.innerHTML = svg;
      } else {
        a.textContent = (link.title || link.type).slice(0,1).toUpperCase();
      }
      li.appendChild(a);
      els.links.appendChild(li);
    }
  }

  // Получить SVG иконку (из CDN или локально)
  async function getIconSvg(iconName) {
    try {
      if (cfg.iconSource === 'local') {
        // Ожидается assets/icons/{type}.svg
        const res = await fetch(`assets/icons/${iconName}.svg`);
        if (!res.ok) throw new Error('no local icon');
        let svg = await res.text();
        // Убедимся, что svg наследует currentColor
        svg = svg.replace('<svg', '<svg stroke="currentColor" fill="none"');
        return svg;
      } else {
        const res = await fetch(`${ICON_CDN_BASE}/${iconName}.svg`);
        if (!res.ok) throw new Error('no cdn icon');
        let svg = await res.text();
        // Tabler иконки уже stroke="currentColor"
        return svg;
      }
    } catch (e) {
      console.warn('Icon load error', iconName, e);
      return '';
    }
  }

  // Тема
  function applyTheme(theme) {
    const allowed = ['acid','pinkpurple','neon'];
    const t = allowed.includes(theme) ? theme : (cfg.defaultTheme || 'acid');
    document.body.classList.remove('theme-acid','theme-pinkpurple','theme-neon');
    document.body.classList.add(`theme-${t}`);
    localStorage.setItem(LS.theme, t);
    // подсветим свотч
    els.swatches().forEach(s => s.classList.toggle('active', s.dataset.theme === t));
  }

  // Кастомный фон
  function applyBackgroundFromStorage() {
    const dataUrl = localStorage.getItem(LS.bg);
    const url = localStorage.getItem(LS.bgUrl);
    if (dataUrl) {
      document.body.style.backgroundImage = `url("${dataUrl}"), var(--bg-gradient)`;
      return;
    }
    if (url) {
      document.body.style.backgroundImage = `url("${url}"), var(--bg-gradient)`;
      els.bgUrl.value = url;
      return;
    }
    // reset
    document.body.style.backgroundImage = 'var(--bg-gradient)';
  }

  function setBgFromUrl() {
    const url = els.bgUrl.value.trim();
    if (!url) return;
    localStorage.removeItem(LS.bg);
    localStorage.setItem(LS.bgUrl, url);
    applyBackgroundFromStorage();
  }

  function setBgFromFile(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      localStorage.setItem(LS.bg, dataUrl);
      localStorage.removeItem(LS.bgUrl);
      applyBackgroundFromStorage();
    };
    reader.readAsDataURL(file);
  }

  function resetBg() {
    localStorage.removeItem(LS.bg);
    localStorage.removeItem(LS.bgUrl);
    els.bgUrl.value = '';
    applyBackgroundFromStorage();
  }

  // UI события
  function bindEvents() {
    // Панель
    els.settingsBtn.addEventListener('click', () => {
      els.settingsPanel.hidden = !els.settingsPanel.hidden;
    });
    els.closeSettings.addEventListener('click', () => {
      els.settingsPanel.hidden = true;
    });
    // Тема
    els.swatches().forEach(s => {
      s.addEventListener('click', () => applyTheme(s.dataset.theme));
    });
    // Фон
    els.bgApplyUrl.addEventListener('click', setBgFromUrl);
    els.bgFile.addEventListener('change', (e) => setBgFromFile(e.target.files?.[0]));
    els.bgReset.addEventListener('click', resetBg);

    // Клик вне панели — закрывать
    document.addEventListener('click', (e) => {
      const clickInside = e.target.closest?.('.settings-panel') || e.target.closest?.('#settingsBtn');
      if (!clickInside) els.settingsPanel.hidden = true;
    });
  }

  // Старт
  initProfile();
  bindEvents();
  renderLinks();

  // Тема из localStorage или дефолт
  const savedTheme = localStorage.getItem(LS.theme) || cfg.defaultTheme || 'acid';
  applyTheme(savedTheme);

  // Фон из localStorage
  applyBackgroundFromStorage();
})();
