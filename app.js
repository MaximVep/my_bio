(async function () {
  const $ = (id) => document.getElementById(id);

  // Загружаем конфиг
  let cfg;
  try {
    const res = await fetch('data.json', { cache: 'no-store' });
    cfg = await res.json();
  } catch (e) {
    console.error('Не удалось загрузить data.json', e);
    cfg = {};
  }

  // Профиль
  if (cfg.profile?.avatar) $('avatar').src = cfg.profile.avatar;
  if (cfg.profile?.name) $('name').textContent = cfg.profile.name;
  if (cfg.profile?.username) $('username').textContent = cfg.profile.username;
  if (cfg.profile?.bio) $('bio').textContent = cfg.profile.bio;
  if (cfg.profile?.verified) $('verified').hidden = false;
  if (cfg.profile?.location) {
    const loc = $('location');
    loc.hidden = false;
    loc.textContent = '· ' + cfg.profile.location;
  }

  // Title/OG
  const title = cfg.site?.title || `${cfg.profile?.name || 'Профиль'} — ссылки`;
  document.title = title;
  setOG('og:title', title);
  setOG('og:description', cfg.site?.description || cfg.profile?.bio || 'Все мои ссылки');
  setOG('og:image', cfg.site?.ogImage || 'assets/og-banner.png');
  setOG('og:url', cfg.site?.shareUrl || location.href);

  // Фон (GIF/картинка из конфига)
  applyBackground(cfg.site);

  // Тема и акцент
  const themePref = readTheme(cfg.site?.theme || 'auto');
  applyTheme(themePref);
  if (cfg.site?.accentColor) document.documentElement.style.setProperty('--accent', cfg.site.accentColor);

  // Ссылки
  const list = $('links');
  const links = Array.isArray(cfg.links) ? cfg.links : [];
  list.innerHTML = links.map(renderLink).join('');

  // Кнопки действий
  const shareBtn = $('share');
  shareBtn.addEventListener('click', async () => {
    const url = cfg.site?.shareUrl || location.href;
    const text = cfg.profile?.bio || 'Мои ссылки';
    try {
      if (navigator.share) await navigator.share({ title, text, url });
      else {
        await copyToClipboard(url);
        feedback(shareBtn, 'Ссылка скопирована ✔');
      }
    } catch {}
  });

  const copyBtn = $('copy');
  copyBtn.addEventListener('click', async () => {
    const url = cfg.site?.shareUrl || location.href;
    await copyToClipboard(url);
    feedback(copyBtn, 'Скопировано ✔');
  });

  const themeBtn = $('theme');
  themeBtn.addEventListener('click', () => {
    const current = readTheme(localStorage.getItem('theme') || themePref);
    const next = current === 'dark' ? 'light' : current === 'light' ? 'auto' : 'dark';
    localStorage.setItem('theme', next);
    applyTheme(next);
  });

  // ——— helpers ———
  function renderLink(ln) {
    const url = ln.url || '#';
    const label = ln.label || url;
    const icon = iconMarkup(ln.icon, url);
    const rel = url.startsWith('http') ? 'noopener noreferrer' : '';
    const target = url.startsWith('http') ? '_blank' : '_self';
    return `
      <li>
        <a href="${escapeHtml(url)}" target="${target}" rel="${rel}">
          <span class="i">${icon}</span>
          <span class="l">${escapeHtml(label)}</span>
        </a>
      </li>`;
  }

  function setOG(property, content) {
    let m = document.querySelector(`meta[property="${property}"]`);
    if (!m) {
      m = document.createElement('meta');
      m.setAttribute('property', property);
      document.head.appendChild(m);
    }
    m.setAttribute('content', content);
  }

  function applyBackground(site) {
    const raw = site?.background || site?.backgroundImage; // поддержка обоих вариантов
    if (!raw) return;

    // Нормализуем в объект
    const bg = typeof raw === 'string' ? { image: raw } : raw;
    const img = bg.image || bg.url || bg.src;
    if (!img) return;

    const el = document.getElementById('bgImage');
    if (!el) return;

    document.documentElement.classList.add('has-bg-image');
    el.hidden = false;
    el.style.backgroundImage = `url('${String(img).replace(/'/g, "\\'")}')`;
    el.style.backgroundSize = (bg.fit === 'contain') ? 'contain' : 'cover';
    if (bg.position) el.style.backgroundPosition = bg.position;
    if (bg.blur != null) el.style.setProperty('--bg-blur', `${Number(bg.blur) || 0}px`);
    if (bg.overlay != null) el.style.setProperty('--overlay', String(bg.overlay));
  }

  function applyTheme(mode) {
    document.documentElement.setAttribute('data-theme', mode);
    const dark = mode === 'dark' || (mode === 'auto' && matchMedia('(prefers-color-scheme: dark)').matches);
    const themeMeta = document.querySelector('#theme-color');
    themeMeta?.setAttribute('content', dark ? '#0b0b0f' : '#ffffff');
  }

  function readTheme(x) {
    return ['auto','light','dark'].includes(x) ? x : 'auto';
  }

  async function copyToClipboard(text) {
    try { await navigator.clipboard.writeText(text); }
    catch { window.prompt('Скопируйте ссылку:', text); }
  }

  function feedback(btn, msg) {
    const orig = btn.textContent;
    btn.textContent = msg;
    setTimeout(() => btn.textContent = orig, 1200);
  }

  function iconMarkup(iconName, url='') {
    const key = (iconName || '').toLowerCase().trim();
    if (!key) return chainIcon();
    if (['mail','email','e-mail'].includes(key)) return mailIcon();
    if (['link','website','globe','site'].includes(key)) return chainIcon();
    const safe = encodeURIComponent(key);
    // Simple Icons CDN (CC0)
    return `<img class="icon" src="https://cdn.simpleicons.org/${safe}/ffffff" alt="" loading="lazy" decoding="async" />`;
  }

  function mailIcon() {
    return `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>
    </svg>`;
  }
  function chainIcon() {
    return `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true">
      <path d="M10.5 13.5 9 15a5 5 0 0 1-7-7l2-2a5 5 0 0 1 7 7"/>
      <path d="M13.5 10.5 15 9a5 5 0 1 1 7 7l-2 2a5 5 0 0 1-7-7"/>
    </svg>`;
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  }
})();
