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

  // Применяем профиль
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
  if (cfg.site?.ogImage) setOG('og:image', cfg.site.ogImage);

  // Тема и акцент
  const themePref = readTheme(cfg.site?.theme || 'auto');
  applyTheme(themePref);
  if (cfg.site?.accentColor) document.documentElement.style.setProperty('--accent', cfg.site.accentColor);

  // Ссылки
  const list = $('links');
  const links = Array.isArray(cfg.links) ? cfg.links : [];
  list.innerHTML = links.map(renderLink).join('');
  // Применяем брендовые цвета (JS встраивает альфа-градиент)
  Array.from(list.querySelectorAll('a[data-brand]')).forEach(a => {
    const hex = a.dataset.brand;
    const rgba = hexToRgba(hex, 0.16);
    a.style.setProperty('--tint', rgba);
  });

  // Кнопки действий
  const shareBtn = $('share');
  shareBtn.addEventListener('click', async () => {
    const url = cfg.site?.shareUrl || location.href;
    const text = cfg.profile?.bio || 'Мои ссылки';
    if (navigator.share) {
      try { await navigator.share({ title, text, url }); } catch {}
    } else {
      await copyToClipboard(url);
      feedback(shareBtn, 'Ссылка скопирована ✔');
    }
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
    const brand = ln.color || guessBrandColor(ln.icon, url);
    const rel = url.startsWith('http') ? 'noopener noreferrer' : '';
    const target = url.startsWith('http') ? '_blank' : '_self';
    const brandAttr = brand ? ` data-brand="${escapeHtml(brand)}"` : '';
    return `
      <li>
        <a href="${escapeHtml(url)}" target="${target}" rel="${rel}"${brandAttr} style="${brand ? `--brand:${brand}` : ''}">
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

  function hexToRgba(hex, a=0.16) {
    const m = (hex || '').replace('#','');
    if (![3,6].includes(m.length)) return 'rgba(124,58,237,.14)';
    const n = m.length === 3 ? m.split('').map(s=>s+s).join('') : m;
    const r = parseInt(n.slice(0,2),16);
    const g = parseInt(n.slice(2,4),16);
    const b = parseInt(n.slice(4,6),16);
    return `rgba(${r}, ${g}, ${b}, ${a})`;
  }

  function guessBrandColor(iconName='', url='') {
    const map = {
      telegram:'#26A5E4',
      instagram:'#E4405F',
      vk:'#0077FF',
      github:'#24292F',
      youtube:'#FF0000',
      tiktok:'#000000',
      discord:'#5865F2',
      x:'#000000',
      twitter:'#1D9BF0',
      reddit:'#FF4500',
      spotify:'#1DB954',
      facebook:'#1877F2',
      whatsapp:'#25D366',
      twitch:'#9146FF',
      steam:'#1B2838',
      pinterest:'#E60023',
      snapchat:'#FFFC00',
      soundcloud:'#FF5500',
      dribbble:'#EA4C89',
      behance:'#1769FF',
      medium:'#12100E',
      notion:'#000000',
      link:'#7c3aed',
      email:'#7c3aed'
    };
    const key = (iconName || domainToKey(url) || '').toLowerCase();
    return map[key] || '';
  }

  function domainToKey(url) {
    try { return new URL(url).hostname.split('.').slice(-2,-1)[0]; }
    catch { return ''; }
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  }
})();
