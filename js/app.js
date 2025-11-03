(function () {
  const els = {
    name: document.getElementById('name'),
    bio: document.getElementById('bio'),
    avatar: document.getElementById('avatar'),
    links: document.getElementById('links'),
    swatches: document.querySelectorAll('.swatch'),
    bgUploadBtn: document.getElementById('bgUploadBtn'),
    bgUploadInput: document.getElementById('bgUploadInput'),
    bgLinkBtn: document.getElementById('bgLinkBtn'),
    bgResetBtn: document.getElementById('bgResetBtn'),
    html: document.documentElement,
    body: document.body
  };

  const ICON_MAP = {
    telegram: 'ti-brand-telegram',
    instagram: 'ti-brand-instagram',
    x: 'ti-brand-x',
    twitter: 'ti-brand-twitter',
    github: 'ti-brand-github',
    youtube: 'ti-brand-youtube',
    whatsapp: 'ti-brand-whatsapp',
    vk: 'ti-brand-vk',
    tiktok: 'ti-brand-tiktok',
    discord: 'ti-brand-discord',
    email: 'ti-mail',
    site: 'ti-world-www',
    link: 'ti-link'
  };

  const state = {
    config: null
  };

  init();

  async function init() {
    // Загружаем конфиг
    try {
      const res = await fetch('data/config.json', { cache: 'no-cache' });
      if (!res.ok) throw new Error('Config fetch failed');
      state.config = await res.json();
    } catch (e) {
      console.warn('Не удалось загрузить data/config.json. Использую дефолтный конфиг.', e);
      state.config = fallbackConfig();
    }

    // Применяем данные профиля
    applyProfile(state.config);
    // Ссылки-иконки
    renderLinks(state.config.links || []);
    // Тема: localStorage > config > pink
    const savedTheme = localStorage.getItem('theme');
    setTheme(savedTheme || state.config.theme || 'pink');
    // Фон: localStorage > config.background
    const savedBg = localStorage.getItem('bioBg');
    if (savedBg) setCustomBg(savedBg);
    else if (state.config.background) setCustomBg(state.config.background);

    // Слушатели
    els.swatches.forEach(btn => {
      btn.addEventListener('click', () => {
        const theme = btn.dataset.theme;
        setTheme(theme);
        localStorage.setItem('theme', theme);
      });
    });

    els.bgUploadBtn.addEventListener('click', () => els.bgUploadInput.click());
    els.bgUploadInput.addEventListener('change', onBgFileSelected);
    els.bgLinkBtn.addEventListener('click', onBgLink);
    els.bgResetBtn.addEventListener('click', resetBg);

    // Эффект подсветки под курсором на иконках
    els.links.addEventListener('pointermove', (e) => {
      const tile = e.target.closest('.icon-tile');
      if (!tile) return;
      const rect = tile.getBoundingClientRect();
      tile.style.setProperty('--mx', `${e.clientX - rect.left}px`);
      tile.style.setProperty('--my', `${e.clientY - rect.top}px`);
    });
  }

  function applyProfile(cfg) {
    els.name.textContent = cfg.name || 'Ваш ник';
    els.bio.textContent = cfg.bio || 'Короткое био — кто вы и чем занимаетесь';
    if (cfg.avatar) els.avatar.src = cfg.avatar;
  }

  function renderLinks(items) {
    els.links.replaceChildren();
    if (!Array.isArray(items) || items.length === 0) {
      const hint = document.createElement('p');
      hint.style.color = 'var(--muted)';
      hint.style.marginTop = '6px';
      hint.textContent = 'Добавьте ссылки в data/config.json (поле "links").';
      els.links.parentElement.appendChild(hint);
      return;
    }

    for (const entry of items) {
      const type = normalizeType(entry.type);
      const url = entry.url;
      if (!url) continue;

      const li = document.createElement('li');
      const a = document.createElement('a');
      a.className = 'icon-tile';
      a.href = url;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.title = prettifyTitle(type, url);
      a.setAttribute('aria-label', a.title);

      const i = document.createElement('i');
      i.className = `ti ${ICON_MAP[type] || ICON_MAP.link}`;
      a.appendChild(i);

      li.appendChild(a);
      els.links.appendChild(li);
    }
  }

  function setTheme(theme) {
    theme = ['acid','pink','neon'].includes(theme) ? theme : 'pink';
    els.html.classList.remove('theme-acid', 'theme-pink', 'theme-neon');
    els.html.classList.add(`theme-${theme}`);
  }

  function setCustomBg(src) {
    // Если это не dataURL, просто url(...)
    if (typeof src === 'string' && !src.startsWith('data:')) {
      els.body.style.setProperty('--bg-image', `url("${src}")`);
    } else {
      els.body.style.setProperty('--bg-image', `url("${src}")`);
    }
    els.body.classList.add('has-custom-bg');
    try { localStorage.setItem('bioBg', src); } catch {}
  }

  function resetBg() {
    els.body.style.removeProperty('--bg-image');
    els.body.classList.remove('has-custom-bg');
    try { localStorage.removeItem('bioBg'); } catch {}
  }

  function onBgFileSelected(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setCustomBg(reader.result);
      // Очистим value, чтобы можно было выбрать тот же файл повторно
      e.target.value = '';
    };
    reader.readAsDataURL(file);
  }

  function onBgLink() {
    const url = prompt('Вставьте ссылку на изображение (URL):');
    if (!url) return;
    try {
      // Базовая проверка
      const u = new URL(url, window.location.href);
      setCustomBg(u.href);
    } catch {
      alert('Невалидный URL');
    }
  }

  function normalizeType(t = '') {
    t = String(t).toLowerCase().trim();
    // Нормализация X/Twitter
    if (t === 'x' || t === 'twitter') return 'x';
    return t;
  }

  function prettifyTitle(type, url) {
    const map = {
      telegram: 'Telegram',
      instagram: 'Instagram',
      x: 'X (Twitter)',
      twitter: 'Twitter',
      github: 'GitHub',
      youtube: 'YouTube',
      whatsapp: 'WhatsApp',
      vk: 'VK',
      tiktok: 'TikTok',
      discord: 'Discord',
      email: 'Email',
      site: 'Сайт',
      link: 'Ссылка'
    };
    const label = map[type] || 'Ссылка';
    return `${label} • ${url}`;
  }

  function fallbackConfig() {
    return {
      name: 'Ваш ник',
      bio: 'Короткое био — кто вы и чем занимаетесь',
      avatar: 'assets/images/avatar.jpg',
      theme: 'pink',
      background: '',
      links: [
        { type: 'telegram', url: 'https://t.me/username' },
        { type: 'instagram', url: 'https://instagram.com/username' },
        { type: 'x', url: 'https://x.com/username' },
        { type: 'github', url: 'https://github.com/username' },
        { type: 'youtube', url: 'https://youtube.com/@username' },
        { type: 'email', url: 'mailto:you@example.com' }
      ]
    };
  }
})();
