// Nookara Drive, the page. Everything a file or person supplies is put in with textContent / .src, never as HTML. Icons are lucide.
(function () {
  'use strict';
  var API = '/drive/api';
  var TOKEN_KEY = 'nookara_drive_token';
  var app = document.getElementById('app');

  function L(key, en, vars) {
    var i = window.veloraI18n;
    if (i && i.has('drive.' + key)) return i.t('drive.' + key, vars);
    return vars ? en.replace(/\{(\w+)\}/g, function (m, k) { return vars[k] != null ? vars[k] : m; }) : en;
  }
  function h(tag, attrs) {
    var el = document.createElement(tag);
    var a = attrs || {};
    Object.keys(a).forEach(function (k) {
      var v = a[k];
      if (v === undefined || v === null || v === false) return;
      if (k === 'class') el.className = v;
      else if (k === 'text') el.textContent = v;
      else if (k.slice(0, 2) === 'on') el.addEventListener(k.slice(2).toLowerCase(), v);
      else if (k === 'value') el.value = v;
      else el.setAttribute(k, v === true ? '' : v);
    });
    for (var i = 2; i < arguments.length; i++) add(el, arguments[i]);
    return el;
  }
  function add(el, c) {
    if (c === null || c === undefined || c === false) return;
    if (Array.isArray(c)) { c.forEach(function (x) { add(el, x); }); return; }
    el.append(c.nodeType ? c : String(c));
  }
  function fill(el) { el.replaceChildren(); for (var i = 1; i < arguments.length; i++) add(el, arguments[i]); }
  function icon(name, cls) {
    var i = document.createElement('i');
    i.setAttribute('data-lucide', name);
    if (cls) i.setAttribute('class', cls);
    return i;
  }
  function paint() { if (window.lucide) window.lucide.createIcons({ attrs: {} }); }
  function iconBtn(name, title, onClick, cls) {
    return h('button', { type: 'button', class: 'icon-btn ' + (cls || ''), title: title, 'aria-label': title, onClick: onClick }, icon(name));
  }
  function fmtBytes(b) {
    b = Number(b) || 0;
    var n = function (v, d) { return v.toLocaleString(lang(), { minimumFractionDigits: d, maximumFractionDigits: d }); };
    if (b < 1024) return n(b, 0) + ' B';
    if (b < 1048576) return n(b / 1024, 1) + ' KB';
    if (b < 1073741824) return n(b / 1048576, 1) + ' MB';
    return n(b / 1073741824, 2) + ' GB';
  }
  function lang() { var i = window.veloraI18n; return (i && i.locale) || undefined; }
  function fmtDate(iso, long) {
    if (!iso) return '';
    var d = new Date(iso);
    if (isNaN(d)) return '';
    return d.toLocaleString(lang(), long ? { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' } : { month: 'short', day: 'numeric', year: 'numeric' });
  }
  function ext(name) { var i = String(name).lastIndexOf('.'); return i > 0 ? String(name).slice(i + 1).toLowerCase() : ''; }

  var KINDS = {
    image: ['png', 'jpg', 'jpeg', 'jfif', 'gif', 'webp', 'avif', 'bmp', 'ico', 'svg', 'heic'],
    video: ['mp4', 'm4v', 'webm', 'mov', 'mkv', 'ogv', 'avi'],
    audio: ['mp3', 'ogg', 'oga', 'opus', 'wav', 'm4a', 'aac', 'flac', 'weba'],
    sheet: ['xls', 'xlsx', 'csv', 'ods'],
    archive: ['zip', 'rar', '7z', 'tar', 'gz', 'bz2', 'xz'],
    code: ['js', 'ts', 'jsx', 'tsx', 'json', 'html', 'css', 'py', 'c', 'cpp', 'h', 'cs', 'java', 'go', 'rs', 'sh', 'php', 'lua', 'gd', 'xml', 'yml', 'yaml', 'toml', 'sql'],
    doc: ['txt', 'md', 'pdf', 'doc', 'docx', 'odt', 'rtf', 'log', 'ppt', 'pptx'],
  };
  var ICONS = { image: 'image', video: 'clapperboard', audio: 'file-audio', sheet: 'file-spreadsheet', archive: 'file-archive', code: 'file-code', doc: 'file-text', file: 'file' };
  var THUMBABLE = ['png', 'jpg', 'jpeg', 'jfif', 'gif', 'webp', 'avif', 'bmp', 'tif', 'tiff', 'svg', 'heic', 'heif', 'mp4', 'm4v', 'webm', 'mov', 'mkv', 'ogv', 'avi', 'wmv', 'flv', 'mts', 'mpeg', 'mpg', 'mp3', 'm4a', 'flac', 'ogg', 'opus', 'aac', 'wma', 'pdf', 'txt', 'md', 'log', 'csv', 'js', 'ts', 'jsx', 'tsx', 'json', 'html', 'css', 'py', 'c', 'cpp', 'h', 'cs', 'java', 'go', 'rs', 'sh', 'php', 'lua', 'gd', 'xml', 'yml', 'yaml', 'toml', 'sql', 'ini', 'cfg'];
  var SHOWN_IMAGES = ['png', 'jpg', 'jpeg', 'jfif', 'gif', 'webp', 'avif', 'bmp', 'ico'];
  var SHOWN_VIDEO = ['mp4', 'm4v', 'webm', 'mov', 'ogv'];
  var SHOWN_AUDIO = ['mp3', 'ogg', 'oga', 'opus', 'wav', 'm4a', 'aac', 'flac', 'weba'];
  var SHOWN_TEXT = ['txt', 'md', 'log', 'csv', 'js', 'ts', 'jsx', 'tsx', 'json', 'html', 'css', 'py', 'c', 'cpp', 'h', 'cs', 'java', 'go', 'rs', 'sh', 'php', 'lua', 'gd', 'xml', 'yml', 'yaml', 'toml', 'sql', 'ini', 'cfg'];
  function kindOf(name) {
    var e = ext(name);
    for (var k in KINDS) if (KINDS[k].indexOf(e) >= 0) return k;
    return 'file';
  }
  function itemIcon(it, cls) {
    if (it.kind === 'folder') return icon('folder', 'ic-folder ' + (cls || ''));
    var k = kindOf(it.name);
    return icon(ICONS[k], 'ic-' + k + ' ' + (cls || ''));
  }

  function token() { try { return localStorage.getItem(TOKEN_KEY); } catch (e) { return null; } }
  function setToken(t) { try { if (t) localStorage.setItem(TOKEN_KEY, t); else localStorage.removeItem(TOKEN_KEY); } catch (e) {  } }
  var ERRORS = {
    storage_limit_exceeded: ['err_full', 'Your storage is full. Delete something or upgrade to Nookara Pro.'],
    name_taken: ['err_name_taken', 'Something with that name is already in this folder.'],
    bad_name: ['err_bad_name', "That name can't be used."],
    name_too_long: ['err_long_name', 'That name is too long.'],
    upload_suspended: ['err_suspended', 'Uploads are turned off on your account for now.'],
    cant_move_into_itself: ['err_into_itself', "A folder can't go inside itself."],
    too_deep: ['err_too_deep', 'Folders can only go so deep. Pick a higher one.'],
    too_many_items: ['err_too_many', 'You have the most files and folders one Drive can hold.'],
    insufficient_scope: ['err_scope', "You signed in with Read only, so Drive can't change anything. Sign out and back in to allow it."],
    not_found: ['err_not_found', "That isn't here any more."],
    view_only: ['err_view_only', 'You can only view this. Ask its owner for edit access.'],
    owner_only: ['err_owner_only', 'Only its owner can do that.'],
    other_drive: ['err_other_drive', "That can't move there: it stays on its owner's Drive."],
    user_not_found: ['err_user_not_found', "There's nobody with that username."],
    thats_you: ['err_thats_you', "That's you. You already have it."],
    too_many_shares: ['err_too_many_shares', "That's the most people one thing can be shared with. A link works for more."],
    rate_limited: ['err_rate_limited', "You've shared a lot in the last hour. Try again later."],
  };
  function errorText(code) {
    var e = ERRORS[code];
    return e ? L(e[0], e[1]) : L('err_generic', 'Something went wrong ({code}).', { code: code || 'network' });
  }
  function call(method, path, body, opts) {
    var headers = token() ? { Authorization: 'Bearer ' + token() } : {};
    var init = { method: method, headers: headers };
    if (body !== undefined && !(opts && opts.raw)) { headers['Content-Type'] = 'application/json'; init.body = JSON.stringify(body); }
    if (opts && opts.raw) { headers['Content-Type'] = 'application/octet-stream'; init.body = body; }
    if (opts && opts.signal) init.signal = opts.signal;
    return fetch(API + path, init).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (j) {
        if (r.ok) return j;
        if ((r.status === 401 || j.error === 'drive_token_required' || j.error === 'origin_not_authorized') && !S.link) { signedOut(); }
        var e = new Error(j.error || 'http_' + r.status);
        e.code = j.error;
        throw e;
      });
    });
  }

  var S = {
    me: null, view: 'home', folder: null, path: [], items: [], media: [], appFiles: [],
    sel: {}, last: null, loading: false, sort: pref('sort', 'modified'), dir: pref('dir', 'desc'), layout: pref('layout', 'grid'),
    q: '', type: '', modified: '', location: '', suggestedOpen: true, binDays: 30, navOpen: false,
    uploads: [], trayOpen: true, thumbs: {}, folderRole: 'owner', mediaApp: null, link: null,
  };
  function pref(k, d) { try { return localStorage.getItem('nookara_drive_' + k) || d; } catch (e) { return d; } }
  function setPref(k, v) { try { localStorage.setItem('nookara_drive_' + k, v); } catch (e) {  } }
  var canWrite = function () { return !!(S.me && S.me.can_write); };
  function canEdit(it) { return canWrite() && it.role !== 'view'; }
  function isMine(it) { return !it.role || it.role === 'owner'; }
  function canAddHere() { return canWrite() && S.view !== 'with-me' && !(S.view === 'drive' && S.folderRole === 'view'); }
  function fileUrl(it, tail) { return (S.link ? '/s/' + S.link.token : '') + '/items/' + it.id + '/' + tail; }

  var signingIn = false;
  function signIn(setBusy) {
    if (signingIn) return;
    var w = window.open('about:blank', 'nookara_drive_login', 'width=900,height=800');
    signingIn = true;
    setBusy(true);
    function done(err) { signingIn = false; setBusy(false, err); }
    fetch(API + '/config').then(function (r) { return r.json(); }).then(function (cfg) {
      return fetch('/auth/ext-code', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ app_id: cfg.app_id }) })
        .then(function (r) { return r.json(); })
        .then(function (j) {
          if (!j.code) throw new Error(j.error || 'no_code');
          if (!w) throw new Error('popup_blocked');
          w.location.href = cfg.site + '/login?' + new URLSearchParams({ code: j.code });
          var finished = false;
          var beat = setInterval(function () {
            if (finished) return;
            if (w.closed) { finish(); done(); }
          }, 700);
          function finish() { finished = true; clearInterval(beat); window.removeEventListener('message', onMessage); }
          function onMessage(ev) {
            if (ev.origin !== cfg.site || !ev.data || ev.data.type !== 'nookara_app_grant' || ev.data.code !== j.code) return;
            finish();
            fetch('/auth/ext-code/exchange', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code: j.code, grant: ev.data.grant }) })
              .then(function (r) { return r.json(); })
              .then(function (x) {
                if (!x.token) throw new Error(x.error || 'no_token');
                setToken(x.token);
                signingIn = false;
                boot();
              })
              .catch(function (e) { done(e.message); });
          }
          window.addEventListener('message', onMessage);
        });
    }).catch(function (e) { if (w) try { w.close(); } catch (x) {  } done(e.message); });
  }
  function signedOut() { setToken(null); S.me = null; renderGate(); }
  function signOut() {
    closeOverlays();
    setToken(null);
    S.me = null;
    renderGate();
  }
  function renderGate() {
    var btn, msg;
    function setBusy(on, err) {
      btn.disabled = !!on;
      msg.textContent = err === 'popup_blocked' ? L('gate.popup', 'Your browser blocked the sign-in window. Allow pop-ups for this site and try again.') : err ? L('gate.failed', "That didn't work. Try again.") : '';
    }
    btn = h('button', { type: 'button', class: 'btn primary', onClick: function () { signIn(setBusy); } }, icon('log-in'), h('span', { text: L('gate.button', 'Sign in with Nookara') }));
    msg = h('div', { class: 'dialog-err' });
    var tiles = ['folder', 'image', 'file-text', 'clapperboard', 'folder', 'file-audio'].map(function (n) {
      return h('div', { class: 'gate-tile' }, icon(n, n === 'folder' ? 'ic-folder' : 'ic-file'));
    });
    app.replaceChildren(h('div', { class: 'gate' },
      h('div', { class: 'gate-art' },
        h('div', { class: 'gate-tiles' }, tiles),
        h('h2', { text: L('gate.pitch_title', 'Your files, on your Nookara account.') }),
        h('p', { text: L('gate.pitch', 'Upload anything, keep it in folders and get to it from any browser. Your files have no public links.') })),
      h('div', { class: 'gate-main' },
        h('div', { class: 'gate-box' },
          h('div', { class: 'brand' }, h('img', { src: '/assets/apps/drive.svg', alt: '' }), h('span', { text: 'Nookara Drive' })),
          h('p', { text: L('gate.lead', 'Drive has its own sign-in. Your Nookara account stays signed in where it is.') }),
          btn, msg,
          h('div', { class: 'gate-fine', text: L('gate.fine', 'You choose what Drive may do on the next screen.') })))));
    paint();
  }

  function parseRoute() {
    var r = location.hash.replace(/^#\/?/, '').split('?')[0].split('/');
    if (r[0] === 'drive') return { view: 'drive', folder: r[1] || null };
    if (r[0] === 's') return { view: 's', token: r[1], item: r[2] || null };
    if (r[0] === 'media') return { view: 'media', app: r[1] || null };
    if (['recent', 'shared', 'with-me', 'apps', 'bin', 'search'].indexOf(r[0]) >= 0) return { view: r[0] };
    return { view: 'home' };
  }
  function go(hash) { if (location.hash === hash) { load(); } else { location.hash = hash; } }
  window.addEventListener('hashchange', function () {
    closeOverlays();
    if (parseRoute().view === 's') { showLink(); return; }
    S.link = null;
    if (S.me) { S.navOpen = false; load(); } else boot();
  });

  function load() {
    var r = parseRoute();
    S.view = r.view; S.folder = r.folder || null; S.sel = {}; S.last = null; S.mediaApp = r.app || null; S.folderRole = 'owner'; S.path = [];
    S.loading = true;
    renderFrame();
    var p;
    if (r.view === 'home') p = call('GET', '/recent?limit=24').then(function (j) { S.items = j.items; });
    else if (r.view === 'drive') p = call('GET', '/items?' + new URLSearchParams({ parent: r.folder || 'root', sort: S.sort, dir: S.dir })).then(function (j) { S.items = j.items; S.path = j.path; S.folderRole = j.role; });
    else if (r.view === 'shared') p = call('GET', '/shared').then(function (j) { S.items = j.items; });
    else if (r.view === 'with-me') p = call('GET', '/shared-with-me').then(function (j) { S.items = j.items; });
    else if (r.view === 'recent') p = call('GET', '/recent?limit=100').then(function (j) { S.items = j.items; });
    else if (r.view === 'bin') p = call('GET', '/bin').then(function (j) { S.items = j.items; S.binDays = j.days; });
    else if (r.view === 'media') p = call('GET', '/media').then(function (j) { S.media = j.items; S.items = []; });
    else if (r.view === 'apps') p = call('GET', '/app-files').then(function (j) { S.appFiles = j.folders; S.items = []; });
    else if (r.view === 'search') p = runSearch();
    p.catch(function (e) {
      S.items = [];
      if (e.code === 'folder_not_found') { location.hash = '#/drive'; return; }
      toast(errorText(e.code), true);
    }).then(function () { S.loading = false; renderContent(); });
  }
  function runSearch() {
    var q = { q: S.q, type: S.type, modified: S.modified, location: S.location };
    Object.keys(q).forEach(function (k) { if (!q[k]) delete q[k]; });
    return call('GET', '/search?' + new URLSearchParams(q)).then(function (j) { S.items = j.items; });
  }
  function refreshMe() {
    return call('GET', '/me').then(function (m) { S.me = m; applyAccent(m.color); renderMeter(); });
  }
  function applyAccent(c) {
    var hex = /^#?[0-9a-f]{6}$/i.test(c || '') ? (c.charAt(0) === '#' ? c : '#' + c) : null;
    if (!hex) return;
    var n = parseInt(hex.slice(1), 16);
    var st = document.documentElement.style;
    st.setProperty('--accent', hex);
    st.setProperty('--accent-dim', 'rgba(' + (n >> 16) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',.12)');
    var lum = (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255));
    st.setProperty('--on-accent', lum > 110 ? '#16141c' : '#ffffff');
  }

  var NAV = [
    { v: 'home', hash: '#/', ic: 'house', en: 'Home' },
    { v: 'drive', hash: '#/drive', ic: 'hard-drive', en: 'My Drive' },
    { v: 'recent', hash: '#/recent', ic: 'clock', en: 'Recent' },
    { v: 'shared', hash: '#/shared', ic: 'link', en: 'Shared' },
    { v: 'with-me', hash: '#/with-me', ic: 'users', en: 'Shared with me' },
    { v: 'media', hash: '#/media', ic: 'images', en: 'Media' },
    { v: 'apps', hash: '#/apps', ic: 'package', en: 'App files' },
    { v: 'bin', hash: '#/bin', ic: 'trash-2', en: 'Bin' },
  ];
  var els = {};
  function renderFrame() {
    if (!els.frame || !els.frame.isConnected) {
      els.side = h('aside', { class: 'side' });
      els.top = h('header', { class: 'topbar' });
      els.content = h('div', { class: 'content' });
      els.main = h('main', { class: 'main' }, els.top, els.content);
      els.frame = h('div', { class: 'frame' }, els.side, els.main);
      els.main.addEventListener('dragenter', dragIn);
      els.main.addEventListener('dragover', dragOverMain);
      els.main.addEventListener('dragleave', dragOut);
      els.main.addEventListener('drop', dropOnMain);
      app.replaceChildren(els.frame);
      els.tray = h('div', { class: 'tray hidden' });
      app.append(els.tray);
    }
    renderSide(); renderTop(); renderContent();
  }
  function renderSide() {
    els.side.className = 'side' + (S.navOpen ? ' open' : '');
    els.meter = h('div', { class: 'meter' });
    els.side.replaceChildren(
      h('div', { class: 'brand' }, h('img', { src: '/assets/apps/drive.svg', alt: '' }), h('span', { text: 'Nookara Drive' })),
      h('div', { class: 'new-wrap' }, h('button', { type: 'button', class: 'btn-new', disabled: !canWrite(), onClick: function (e) { openNewMenu(e.currentTarget); } }, icon('plus'), h('span', { text: L('new', 'New') }))),
      h('nav', { class: 'nav' }, NAV.map(function (n) {
        var attrs = { type: 'button', class: 'nav-item' + (S.view === n.v || (n.v === 'home' && S.view === 'search') ? ' active' : ''), onClick: function () { go(n.hash); } };
        var b = h('button', attrs, icon(n.ic), h('span', { text: L('nav.' + n.v.replace('-', '_'), n.en) }));
        if (n.v === 'drive') dropTarget(b, null);
        return b;
      })),
      els.meter);
    renderMeter();
    paint();
  }
  function renderMeter() {
    if (!els.meter || !S.me) return;
    var pct = S.me.limit > 0 ? Math.min(100, S.me.usage / S.me.limit * 100) : 0;
    var low = pct > 0 && pct < 1;
    var pro = !!S.me.pro;
    fill(els.meter,
      h('div', { class: 'meter-title' }, icon('cloud'), h('span', { text: low ? L('storage_low', 'Storage (under 1% full)') : L('storage_pct', 'Storage ({pct}% full)', { pct: Math.round(pct) }) })),
      h('div', { class: 'meter-bar' }, h('div', { class: 'meter-fill' + (pct >= 95 ? ' full' : pct >= 80 ? ' warn' : ''), style: 'width:' + Math.max(pct, S.me.usage ? 1 : 0) + '%' })),
      h('div', { class: 'meter-sub', text: L('storage_of', '{used} of {limit} used', { used: fmtBytes(S.me.usage), limit: fmtBytes(S.me.limit) }) }),
      !pro && h('a', { class: 'meter-more', href: siteLink('/upgrade'), target: '_blank', rel: 'noopener', text: L('more_storage', 'Get more storage') }));
    paint();
  }
  var siteOrigin = '';
  function siteLink(p) { return siteOrigin + p; }
  function renderTop() {
    var input = h('input', { type: 'search', placeholder: L('search', 'Search files and folders'), 'aria-label': L('search', 'Search files and folders'), value: S.q, onKeydown: onSearchKey, onInput: onSearchInput });
    var pfp = S.me && S.me.pfp;
    var avatar = pfp ? h('img', { class: 'avatar', src: pfp, alt: '' }) : h('span', { class: 'avatar', text: S.me ? S.me.username.charAt(0).toUpperCase() : '' });
    els.top.replaceChildren(
      iconBtn('menu', L('menu', 'Menu'), function () { S.navOpen = !S.navOpen; els.side.className = 'side' + (S.navOpen ? ' open' : ''); }, 'menu-btn'),
      S.view === 'home' ? h('div', { class: 'spacer' }) : h('label', { class: 'search' }, icon('search'), input),
      h('div', { class: 'spacer' }),
      h('button', { type: 'button', class: 'me-btn', 'aria-label': L('account', 'Account'), onClick: function (e) { openMeMenu(e.currentTarget); } },
        h('span', { class: 'me-name', text: S.me ? S.me.username : '' }), avatar));
    paint();
  }
  var searchTimer = null;
  function onSearchInput(e) {
    S.q = e.target.value;
    clearTimeout(searchTimer);
    searchTimer = setTimeout(function () {
      if (S.q.trim() || S.type || S.modified) showSearch(); else if (S.view === 'search') go('#/');
    }, 250);
  }
  function onSearchKey(e) { if (e.key === 'Enter') { clearTimeout(searchTimer); showSearch(); } }
  function showSearch() {
    if (S.view !== 'search') { location.hash = '#/search'; return; }
    runSearch().then(renderContent).catch(function (e) { toast(errorText(e.code), true); });
  }

  function renderContent() {
    closeMenus();
    if (S.loading) { els.content.replaceChildren(h('div', { class: 'loading' }, h('div', { class: 'spin' }))); return; }
    var v = S.view;
    var nodes = v === 'home' ? homeView() : v === 'drive' ? driveView() : v === 'recent' ? recentView() : v === 'shared' ? sharedView() : v === 'with-me' ? withMeView() : v === 'bin' ? binView() : v === 'media' ? mediaView() : v === 'apps' ? appsView() : searchView();
    els.content.className = 'content' + (selCount() ? ' selecting' : '');
    els.content.replaceChildren.apply(els.content, nodes.filter(Boolean));
    fillThumbs();
    paint();
  }
  function layoutToggle() {
    return h('div', { class: 'seg' },
      iconBtn('list', L('layout_list', 'List'), function () { setLayout('list'); }, S.layout === 'list' ? 'on' : ''),
      iconBtn('layout-grid', L('layout_grid', 'Grid'), function () { setLayout('grid'); }, S.layout === 'grid' ? 'on' : ''));
  }
  function setLayout(l) { S.layout = l; setPref('layout', l); renderContent(); }
  function chips() {
    var typeNames = { '': L('f.type', 'Type'), folder: L('f.folders', 'Folders'), image: L('f.images', 'Pictures'), video: L('f.video', 'Videos'), audio: L('f.audio', 'Audio'), document: L('f.docs', 'Documents'), archive: L('f.archives', 'Archives') };
    var modNames = { '': L('f.modified', 'Modified'), day: L('f.day', 'Today'), week: L('f.week', 'Last 7 days'), month: L('f.month', 'Last 30 days'), year: L('f.year', 'This year') };
    var locName = S.location ? (S.location === 'root' ? L('nav.drive', 'My Drive') : (locFolderName || L('f.folder', 'A folder'))) : L('f.location', 'Location');
    function chip(label, on, open) { return h('button', { type: 'button', class: 'chip' + (on ? ' on' : ''), onClick: function (e) { open(e.currentTarget); } }, h('span', { text: label }), icon('chevron-down')); }
    return h('div', { class: 'chips' },
      chip(typeNames[S.type], !!S.type, function (a) { pickMenu(a, typeNames, S.type, function (v) { S.type = v; filtersChanged(); }); }),
      chip(modNames[S.modified], !!S.modified, function (a) { pickMenu(a, modNames, S.modified, function (v) { S.modified = v; filtersChanged(); }); }),
      chip(locName, !!S.location, openLocationMenu));
  }
  var locFolderName = '';
  function openLocationMenu(anchor) {
    call('GET', '/folders').then(function (j) {
      var opts = { '': L('f.anywhere', 'Anywhere'), root: L('nav.drive', 'My Drive') };
      j.folders.slice(0, 60).forEach(function (f) { opts[f.id] = f.name; });
      pickMenu(anchor, opts, S.location, function (v) { S.location = v; locFolderName = opts[v] || ''; filtersChanged(); });
    }).catch(function (e) { toast(errorText(e.code), true); });
  }
  function filtersChanged() {
    if (S.q.trim() || S.type || S.modified || S.location) showSearch(); else go('#/');
    if (S.view === 'search') renderContent();
  }
  function pickMenu(anchor, opts, cur, onPick) {
    var m = h('div', { class: 'menu' }, Object.keys(opts).map(function (k) {
      return h('button', { type: 'button', class: cur === k ? 'on' : '', onClick: function () { closeMenus(); onPick(k); } }, h('span', { text: opts[k] }));
    }));
    showMenu(m, anchor);
  }
  function selBar() {
    var ids = Object.keys(S.sel);
    if (!ids.length) return null;
    var picked = S.items.filter(function (i) { return S.sel[i.id]; });
    var one = picked.length === 1 ? picked[0] : null;
    var hasFolder = picked.some(function (i) { return i.kind === 'folder'; });
    var edit = picked.every(canEdit), mine = picked.every(isMine);
    return h('div', { class: 'selbar' },
      iconBtn('x', L('sel.clear', 'Clear selection'), clearSel),
      h('span', { class: 'selbar-count', text: L('sel.count', '{n} selected', { n: ids.length }) }),
      !hasFolder && iconBtn('download', L('act.download', 'Download'), function () { downloadMany(ids); }),
      one && mine && canWrite() && iconBtn('user-plus', L('act.share', 'Share'), function () { shareDialog(one); }),
      edit && mine && iconBtn('folder-input', L('act.move', 'Move'), function () { moveDialog(ids); }),
      one && edit && iconBtn('pencil', L('act.rename', 'Rename'), function () { renameDialog(one); }),
      edit && iconBtn('trash-2', L('act.delete', 'Move to bin'), function () { trashMany(ids); }, 'danger'));
  }
  function homeView() {
    var input = h('input', { type: 'search', placeholder: L('search', 'Search files and folders'), 'aria-label': L('search', 'Search files and folders'), value: S.q, onKeydown: onSearchKey, onInput: onSearchInput });
    return [
      h('div', { class: 'hero' }, h('h1', { text: L('home.title', 'Welcome back, {name}.', { name: S.me ? S.me.username : '' }) }), h('label', { class: 'search' }, icon('search'), input), chips()),
      readOnlyNote(),
      h('div', { class: 'bar' },
        h('button', { type: 'button', class: 'section-toggle' + (S.suggestedOpen ? '' : ' closed'), onClick: function () { S.suggestedOpen = !S.suggestedOpen; renderContent(); } }, icon('chevron-down'), h('span', { text: L('home.suggested', 'Recently changed') })),
        h('div', { class: 'spacer' }), selBar() || layoutToggle()),
      S.suggestedOpen && (S.items.length ? itemsNode(S.items, 'cards') : emptyHome()),
    ];
  }
  function emptyHome() {
    return h('div', { class: 'empty' }, icon('cloud-upload'), h('b', { text: L('home.empty', 'Nothing here yet') }), h('span', { text: L('home.empty_hint', 'Press New, or drop files anywhere on this page.') }));
  }
  function readOnlyNote() { return S.me && !S.me.can_write ? h('div', { class: 'note', text: L('read_only', 'You signed in with Read only, so you can look and download but not change anything. Sign out and back in to change that.') }) : null; }
  function driveView() {
    var theirs = S.folderRole !== 'owner';
    var crumbs = [h('button', { type: 'button', class: 'crumb', text: theirs ? L('nav.with_me', 'Shared with me') : L('nav.drive', 'My Drive'), onClick: function () { go(theirs ? '#/with-me' : '#/drive'); } })];
    if (!theirs) dropTarget(crumbs[0], null);
    S.path.forEach(function (p) {
      crumbs.push(icon('chevron-right'));
      var c = h('button', { type: 'button', class: 'crumb', title: p.name, text: p.name, onClick: function () { go('#/drive/' + p.id); } });
      dropTarget(c, p.id);
      crumbs.push(c);
    });
    var sortNames = { modified: L('sort.modified', 'Modified'), name: L('sort.name', 'Name'), size: L('sort.size', 'Size'), created: L('sort.created', 'Added') };
    var all = S.items.length && selCount() === S.items.length;
    return [
      h('div', { class: 'bar lined' }, h('div', { class: 'crumbs' }, crumbs), h('div', { class: 'spacer' }),
        canAddHere() && iconBtn('folder-plus', L('new_folder', 'New folder'), newFolderDialog),
        canAddHere() && iconBtn('file-up', L('upload_files', 'Upload files'), pickFiles),
        canAddHere() && iconBtn('folder-up', L('upload_folder', 'Upload a folder'), pickFolder),
        canAddHere() && h('span', { class: 'bar-sep' }), layoutToggle()),
      readOnlyNote(),
      S.folderRole === 'view' && h('div', { class: 'note', text: L('shared.view_note', 'This was shared with you to view. Only people with edit access can change it.') }),
      S.folderRole === 'edit' && h('div', { class: 'note', text: L('shared.edit_note', "This was shared with you to edit. What you add here belongs to its owner and uses their storage.") }),
      h('div', { class: 'bar lined' },
        S.items.length ? h('span', { class: 'check' + (all ? ' on' : ''), role: 'checkbox', 'aria-checked': all ? 'true' : 'false', 'aria-label': L('sel.all', 'Select all'), tabindex: 0, onClick: toggleAll }, icon('check')) : null,
        h('button', { type: 'button', class: 'sort-btn', onClick: function (e) { pickMenu(e.currentTarget, sortNames, S.sort, function (v) { S.sort = v; S.dir = v === 'name' ? 'asc' : 'desc'; savedSort(); }); } }, h('span', { text: sortNames[S.sort] })),
        iconBtn(S.dir === 'desc' ? 'arrow-down' : 'arrow-up', L('sort.flip', 'Flip the order'), function () { S.dir = S.dir === 'desc' ? 'asc' : 'desc'; savedSort(); }),
        h('div', { class: 'spacer' }), selBar()),
      S.items.length ? itemsNode(S.items) : h('div', { class: 'empty' }, icon('folder-open'), h('b', { text: L('folder.empty', 'This folder is empty') }), h('span', { text: L('home.empty_hint', 'Press New, or drop files anywhere on this page.') })),
    ];
  }
  function savedSort() { setPref('sort', S.sort); setPref('dir', S.dir); load(); }
  function recentView() {
    return [
      h('div', { class: 'bar lined' }, h('div', { class: 'crumbs' }, h('span', { class: 'crumb', text: L('nav.recent', 'Recent') })), h('div', { class: 'spacer' }), selBar() || layoutToggle()),
      S.items.length ? itemsNode(S.items) : h('div', { class: 'empty' }, icon('clock'), h('b', { text: L('recent.empty', 'Nothing yet') })),
    ];
  }
  function searchView() {
    var input = h('input', { type: 'search', placeholder: L('search', 'Search files and folders'), value: S.q, onKeydown: onSearchKey, onInput: onSearchInput });
    return [
      h('div', { class: 'hero', style: 'padding-top:24px' }, h('label', { class: 'search' }, icon('search'), input), chips()),
      h('div', { class: 'bar' }, h('span', { class: 'section-toggle', text: L('found.results', '{n} found', { n: S.items.length }) }), h('div', { class: 'spacer' }), selBar() || layoutToggle()),
      S.items.length ? itemsNode(S.items) : h('div', { class: 'empty' }, icon('search-x'), h('b', { text: L('found.none', 'Nothing matches that') })),
    ];
  }
  function sharedView() {
    return [
      h('div', { class: 'bar lined' }, h('div', { class: 'crumbs' }, h('span', { class: 'crumb', text: L('nav.shared', 'Shared') })), h('div', { class: 'spacer' }), selBar() || layoutToggle()),
      S.items.length ? itemsNode(S.items) : h('div', { class: 'empty' }, icon('link'), h('b', { text: L('shared.none', "You haven't shared anything") }), h('span', { text: L('shared.none_hint', 'Everything is private until you share it. Right-click a file or folder and choose Share.') })),
    ];
  }
  function withMeView() {
    return [
      h('div', { class: 'bar lined' }, h('div', { class: 'crumbs' }, h('span', { class: 'crumb', text: L('nav.with_me', 'Shared with me') })), h('div', { class: 'spacer' }), selBar() || layoutToggle()),
      S.items.length ? h('div', { class: 'rows' }, S.items.map(function (it) {
        return wire(h('div', { class: 'row' + (S.sel[it.id] ? ' sel' : '') }, selBox(it), itemIcon(it),
          h('span', { class: 'row-name', title: it.name, text: it.name }),
          h('span', { class: 'row-sub', text: L('shared.from', 'From {name}', { name: it.owner }) }),
          h('span', { class: 'row-sub', text: it.role === 'edit' ? L('role.edit', 'Can edit') : L('role.view', 'Can view') }),
          moreBtn(it)), it, S.items);
      })) : h('div', { class: 'empty' }, icon('users'), h('b', { text: L('shared.with_me_none', 'Nothing has been shared with you yet') })),
    ];
  }
  function savedCount(n) { return n === 1 ? L('apps.key_one', '1 saved value') : L('apps.keys', '{n} saved values', { n: n }); }
  function lockMark() {
    var text = L('apps.locked', 'Belongs to an app');
    return h('span', { class: 'lock-mark', 'data-tip': text, 'aria-label': text, role: 'img' }, icon('lock'));
  }
  function appFilePreview(f) {
    closeOverlays();
    var name = f.name + '.json';
    var stage = h('div', { class: 'pv-stage' }, h('div', { class: 'spin' }));
    function close() { pv.remove(); document.removeEventListener('keydown', onKey); }
    function onKey(e) { if (e.key === 'Escape') close(); }
    document.addEventListener('keydown', onKey);
    var pv = h('div', { class: 'pv', role: 'dialog', 'aria-modal': 'true', 'aria-label': name },
      h('div', { class: 'pv-top' },
        iconBtn('x', L('close', 'Close'), close),
        icon('file-json', 'ic-code'),
        h('div', { class: 'pv-title' }, h('b', { title: f.id, text: (f.app ? f.app + ' / ' : '') + name }), h('span', { text: savedCount(f.keys) + ' · ' + fmtBytes(f.size) })),
        lockMark()),
      stage);
    document.body.append(pv);
    paint();
    call('GET', '/app-file?' + new URLSearchParams({ id: f.id })).then(function (j) {
      stage.replaceChildren(h('pre', { class: 'pv-text', text: JSON.stringify(j.data, null, 2) + (j.truncated ? '\n\n' + L('apps.truncated', '(This is too big to show all of it, so only the start is here.)') : '') }));
    }).catch(function (e) { stage.replaceChildren(h('div', { class: 'pv-none', text: errorText(e.code) })); });
  }
  function binView() {
    return [
      h('div', { class: 'bar lined' }, h('div', { class: 'crumbs' }, h('span', { class: 'crumb', text: L('nav.bin', 'Bin') })), h('div', { class: 'spacer' }),
        canWrite() && S.items.length ? h('button', { type: 'button', class: 'btn', onClick: emptyBinDialog }, icon('trash-2'), h('span', { text: L('bin.empty_btn', 'Empty bin') })) : null),
      h('div', { class: 'note', text: L('bin.note', 'Files in the bin still count toward your storage, and are deleted for good after {days} days.', { days: S.binDays }) }),
      S.items.length ? h('div', { class: 'rows' }, S.items.map(function (it) {
        return h('div', { class: 'row plain' }, itemIcon(it),
          h('span', { class: 'row-name', title: it.name, text: it.name }),
          h('span', { class: 'row-sub', text: L('bin.when', 'Binned {date}', { date: fmtDate(it.trashed_at) }) }),
          h('span', { class: 'row-sub', text: it.kind === 'file' ? fmtBytes(it.size) : '' }),
          iconBtn('more-vertical', L('act.more', 'More'), function (e) { binMenu(it, e.currentTarget); }, 'more'));
      })) : h('div', { class: 'empty' }, icon('trash-2'), h('b', { text: L('bin.none', 'The bin is empty') })),
    ];
  }
  function appName(m) { return m.app_name || L('media.deleted_app', 'Deleted app'); }
  function mediaView() {
    var inApp = S.mediaApp;
    var list = S.media.filter(function (m) { return inApp ? m.app_id === inApp : !m.app_id; });
    var apps = [], seen = {};
    if (!inApp) S.media.forEach(function (m) {
      if (!m.app_id) return;
      if (!seen[m.app_id]) { seen[m.app_id] = { id: m.app_id, name: appName(m), n: 0, size: 0 }; apps.push(seen[m.app_id]); }
      seen[m.app_id].n++; seen[m.app_id].size += m.size;
    });
    var title = inApp && S.media.filter(function (m) { return m.app_id === inApp; })[0];
    return [
      h('div', { class: 'bar lined' }, h('div', { class: 'crumbs' },
        h('button', { type: 'button', class: 'crumb', text: L('nav.media', 'Media'), onClick: function () { go('#/media'); } }),
        inApp && icon('chevron-right'), inApp && h('span', { class: 'crumb', text: title ? appName(title) : '' }))),
      h('div', { class: 'note', text: inApp ? L('media.app_note', 'What this app uploaded. Anyone with the link to one of these can open it.') : L('media.note', 'Pictures, video and audio you uploaded through Ember and other apps. These have public links, so anyone with the link can open them. Your Drive files do not.') }),
      apps.length ? h('div', { class: 'grid' }, apps.map(function (a) {
        return h('div', { class: 'tile', tabindex: 0, onClick: function () { go('#/media/' + a.id); } },
          h('div', { class: 'tile-art' }, icon('folder', 'ic-folder')),
          h('div', { class: 'tile-name', title: a.name, text: a.name }));
      })) : null,
      list.length ? h('div', { class: 'cards', style: 'padding-top:14px' }, list.map(function (m) {
        var art = thumbArt(icon(m.type === 'image' ? 'image' : m.type === 'video' ? 'clapperboard' : m.type === 'audio' ? 'file-audio' : 'file', 'ic-' + (m.type === 'image' ? 'image' : m.type === 'video' ? 'video' : m.type === 'audio' ? 'audio' : 'file')), '/media/' + m.id + '/thumb', m.name);
        return h('div', { class: 'card', onClick: function () { window.open(m.url, '_blank', 'noopener'); } },
          h('div', { class: 'card-head' }, h('span', { title: m.name, text: m.name })),
          canWrite() && iconBtn('trash-2', L('media.delete', 'Delete'), function (e) { e.stopPropagation(); deleteMedia(m); }, 'more danger'),
          h('div', { class: 'card-art' }, art),
          h('div', { class: 'card-date', text: fmtBytes(m.size) + ' · ' + fmtDate(m.created_at) }));
      })) : apps.length ? null : h('div', { class: 'empty' }, icon('images'), h('b', { text: L('media.none', 'No media uploaded') })),
    ];
  }
  function appsView() {
    return [
      h('div', { class: 'bar lined' }, h('div', { class: 'crumbs' }, h('span', { class: 'crumb', text: L('nav.apps', 'App files') }))),
      h('div', { class: 'note', text: L('apps.note', 'What games and apps saved to your account. You can look, but only the app that saved it can change it. To clear something, use My Account > Storage.') }),
      S.appFiles.length ? h('div', { class: 'rows' }, S.appFiles.map(function (f) {
        return h('div', { class: 'row plain opens', tabindex: 0, role: 'button', onClick: function () { appFilePreview(f); }, onKeydown: function (e) { if (e.key === 'Enter') appFilePreview(f); } }, icon('file-json', 'ic-code'),
          h('span', { class: 'row-name', title: f.id }, f.app ? h('b', { text: f.app + '  ' }) : null, f.name + '.json'),
          h('span', { class: 'row-sub', text: savedCount(f.keys) }),
          h('span', { class: 'row-sub', text: fmtBytes(f.size) }), lockMark());
      })) : h('div', { class: 'empty' }, icon('package'), h('b', { text: L('apps.none', 'No app has saved anything yet') })),
    ];
  }

  function itemsNode(items, forced) {
    var layout = S.layout === 'list' ? 'list' : forced || 'tiles';
    if (layout === 'list') return h('div', { class: 'rows' }, items.map(function (it) { return rowOf(it, items); }));
    if (layout === 'cards') return h('div', { class: 'cards' }, items.map(function (it) { return cardOf(it, items); }));
    return h('div', { class: 'grid' }, items.map(function (it) { return tileOf(it, items); }));
  }
  function selBox(it) {
    return h('span', { class: 'check' + (S.sel[it.id] ? ' on' : ''), role: 'checkbox', 'aria-checked': S.sel[it.id] ? 'true' : 'false', 'aria-label': L('sel.one', 'Select {name}', { name: it.name }), onClick: function (e) { e.stopPropagation(); toggleSel(it, e); } }, icon('check'));
  }
  function wire(el, it, list) {
    el.tabIndex = 0;
    el.addEventListener('click', function (e) {
      if (e.ctrlKey || e.metaKey || e.shiftKey || selCount()) { toggleSel(it, e); return; }
      openItem(it, list);
    });
    el.addEventListener('keydown', function (e) { if (e.key === 'Enter' && e.target === el) openItem(it, list); });
    el.addEventListener('contextmenu', function (e) { e.preventDefault(); itemMenu(it, null, e.clientX, e.clientY); });
    if (canEdit(it)) {
      el.draggable = true;
      el.addEventListener('dragstart', function (e) {
        var ids = S.sel[it.id] ? Object.keys(S.sel) : [it.id];
        dragging = ids;
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', it.name);
      });
      el.addEventListener('dragend', function () { dragging = null; });
      if (it.kind === 'folder') dropTarget(el, it.id);
    }
    return el;
  }
  function moreBtn(it) { return iconBtn('more-vertical', L('act.more', 'More'), function (e) { e.stopPropagation(); itemMenu(it, e.currentTarget); }, 'more'); }
  function thumbArt(iconEl, path, name) {
    var kind = kindOf(name);
    return h('div', { class: 'thumb', 'data-thumb': path }, iconEl, h('img', { alt: '', hidden: true }),
      kind === 'video' && h('span', { class: 'thumb-play', hidden: true }, icon('play')));
  }
  function artFor(it) {
    if (it.kind === 'file' && THUMBABLE.indexOf(ext(it.name)) >= 0) return thumbArt(itemIcon(it), fileUrl(it, 'thumb'), it.name);
    return itemIcon(it);
  }
  function sharedMark(it) { return it.shared ? h('span', { class: 'shared-mark', title: L('shared.mark', 'Shared') }, icon('users')) : null; }
  function tileOf(it, list) {
    return wire(h('div', { class: 'tile' + (S.sel[it.id] ? ' sel' : '') }, selBox(it), moreBtn(it), sharedMark(it), h('div', { class: 'tile-art' }, artFor(it)), h('div', { class: 'tile-name', title: it.name, text: it.name })), it, list);
  }
  function cardOf(it, list) {
    return wire(h('div', { class: 'card' + (S.sel[it.id] ? ' sel' : '') }, selBox(it), moreBtn(it), sharedMark(it),
      h('div', { class: 'card-head' }, itemIcon(it), h('span', { title: it.name, text: it.name })),
      h('div', { class: 'card-art' }, artFor(it)),
      h('div', { class: 'card-date', text: L('modified_on', 'Modified {date}', { date: fmtDate(it.modified_at) }) })), it, list);
  }
  function rowOf(it, list) {
    return wire(h('div', { class: 'row' + (S.sel[it.id] ? ' sel' : '') }, selBox(it), itemIcon(it),
      h('span', { class: 'row-name', title: it.name, text: it.name }),
      h('span', { class: 'row-sub', text: fmtDate(it.modified_at) }),
      h('span', { class: 'row-sub', text: it.kind === 'file' ? fmtBytes(it.size) : '' }),
      moreBtn(it)), it, list);
  }
  var thumbWaiting = [], thumbBusy = 0;
  var thumbSeen = 'IntersectionObserver' in window ? new IntersectionObserver(function (entries) {
    entries.forEach(function (e) { if (e.isIntersecting) { thumbSeen.unobserve(e.target); wantThumb(e.target); } });
  }, { rootMargin: '200px' }) : null;
  function showThumb(el, url) {
    var img = el.querySelector('img');
    img.onload = function () {
      img.hidden = false;
      el.classList.add('has-pic');
      var play = el.querySelector('.thumb-play');
      if (play) play.hidden = false;
    };
    img.src = url;
  }
  function wantThumb(el) {
    var path = el.getAttribute('data-thumb');
    var hit = S.thumbs[path];
    if (hit && hit.none) return;
    if (hit && hit.until > Date.now()) { showThumb(el, hit.url); return; }
    thumbWaiting.push({ el: el, path: path, tries: 0 });
    nextThumb();
  }
  function nextThumb() {
    while (thumbBusy < 4 && thumbWaiting.length) askThumb(thumbWaiting.shift());
  }
  function askThumb(job) {
    if (!job.el.isConnected) return;
    thumbBusy++;
    call('POST', job.path, {}).then(function (j) {
      if (j.url) { S.thumbs[job.path] = { url: j.url, until: Date.now() + 45 * 60 * 1000 }; if (job.el.isConnected) showThumb(job.el, j.url); }
      else if (j.none) S.thumbs[job.path] = { none: true };
      else if (j.pending && job.tries < 5) { job.tries++; setTimeout(function () { thumbWaiting.push(job); nextThumb(); }, 5000); }
    }).catch(function () {  }).then(function () { thumbBusy--; nextThumb(); });
  }
  function fillThumbs() {
    els.content.querySelectorAll('[data-thumb]').forEach(function (el) {
      if (thumbSeen) thumbSeen.observe(el); else wantThumb(el);
    });
  }
  function selCount() { return Object.keys(S.sel).length; }
  function clearSel() { S.sel = {}; S.last = null; renderContent(); }
  function toggleSel(it, e) {
    if (e && e.shiftKey && S.last) {
      var ids = S.items.map(function (i) { return i.id; });
      var a = ids.indexOf(S.last), b = ids.indexOf(it.id);
      if (a >= 0 && b >= 0) { for (var i = Math.min(a, b); i <= Math.max(a, b); i++) S.sel[ids[i]] = true; renderContent(); return; }
    }
    if (S.sel[it.id]) delete S.sel[it.id]; else S.sel[it.id] = true;
    S.last = it.id;
    renderContent();
  }
  function toggleAll() {
    if (selCount() === S.items.length) S.sel = {};
    else S.items.forEach(function (i) { S.sel[i.id] = true; });
    renderContent();
  }
  function openItem(it, list) {
    if (it.kind === 'folder') { go('#/drive/' + it.id); return; }
    preview(it, (list || S.items).filter(function (x) { return x.kind === 'file'; }));
  }

  function closeMenus() { document.querySelectorAll('.menu').forEach(function (m) { m.remove(); }); }
  function closeOverlays() { closeMenus(); document.querySelectorAll('.veil, .pv').forEach(function (m) { m.remove(); }); }
  function showMenu(m, anchor, x, y) {
    closeMenus();
    document.body.append(m);
    paint();
    var r = anchor ? anchor.getBoundingClientRect() : { left: x, bottom: y, right: x };
    var w = m.offsetWidth, ht = m.offsetHeight;
    m.style.left = Math.max(8, Math.min(r.left, innerWidth - w - 8)) + 'px';
    m.style.top = Math.max(8, Math.min(r.bottom + 4, innerHeight - ht - 8)) + 'px';
  }
  document.addEventListener('mousedown', function (e) { if (!e.target.closest('.menu')) closeMenus(); });
  function mi(ic, text, fn, cls) { return h('button', { type: 'button', class: cls || '', onClick: function () { closeMenus(); fn(); } }, icon(ic), h('span', { text: text })); }
  function openNewMenu(anchor) {
    showMenu(h('div', { class: 'menu' },
      mi('folder-plus', L('new_folder', 'New folder'), newFolderDialog),
      h('hr'),
      mi('file-up', L('upload_files', 'Upload files'), pickFiles),
      mi('folder-up', L('upload_folder', 'Upload a folder'), pickFolder)), anchor);
  }
  function openMeMenu(anchor) {
    showMenu(h('div', { class: 'menu' },
      h('div', { class: 'menu-who', text: S.me.username }),
      h('a', { href: siteLink('/me'), target: '_blank', rel: 'noopener' }, icon('user'), h('span', { text: L('my_account', 'My Account') })),
      h('hr'),
      mi('log-out', L('sign_out', 'Sign out of Drive'), signOut)), anchor);
  }
  function itemMenu(it, anchor, x, y) {
    var acts = [];
    if (it.kind === 'folder') acts.push(mi('folder-open', L('act.open', 'Open'), function () { openItem(it); }));
    else {
      acts.push(mi('eye', L('act.preview', 'Preview'), function () { openItem(it); }));
      acts.push(mi('download', L('act.download', 'Download'), function () { download(it); }));
    }
    if (isMine(it) && canWrite()) acts.push(mi('user-plus', L('act.share', 'Share'), function () { shareDialog(it); }));
    if (canEdit(it)) acts.push(mi('pencil', L('act.rename', 'Rename'), function () { renameDialog(it); }));
    if (isMine(it) && canWrite()) {
      acts.push(mi('folder-input', L('act.move', 'Move'), function () { moveDialog([it.id]); }));
      acts.push(h('hr'));
      acts.push(mi('trash-2', L('act.delete', 'Move to bin'), function () { trashMany([it.id]); }, 'danger'));
    } else if (S.view === 'with-me') {
      acts.push(h('hr'));
      acts.push(mi('user-minus', L('shared.leave', 'Remove from Shared with me'), function () { act(call('DELETE', '/items/' + it.id + '/share')); }, 'danger'));
    } else if (canEdit(it)) {
      acts.push(h('hr'));
      acts.push(mi('trash-2', L('act.delete', 'Move to bin'), function () { trashMany([it.id]); }, 'danger'));
    }
    showMenu(h('div', { class: 'menu' }, acts), anchor, x, y);
  }
  function binMenu(it, anchor) {
    if (!canWrite()) return;
    showMenu(h('div', { class: 'menu' },
      mi('undo-2', L('bin.restore', 'Restore'), function () { act(call('POST', '/items/' + it.id + '/restore', {})); }),
      h('hr'),
      mi('trash-2', L('bin.forever', 'Delete for good'), function () {
        confirmDialog(L('bin.forever_title', 'Delete "{name}" for good?', { name: it.name }), L('bin.forever_body', "This can't be undone."), L('bin.forever', 'Delete for good'), function () { return call('DELETE', '/items/' + it.id).then(afterChange); });
      }, 'danger')), anchor);
  }
  function act(p) { return p.then(afterChange).catch(function (e) { toast(errorText(e.code), true); }); }
  function afterChange() { load(); return refreshMe(); }

  function dialog(title, body, foot) {
    var v = h('div', { class: 'veil', onMousedown: function (e) { if (e.target === v) v.remove(); } }, h('div', { class: 'dialog', role: 'dialog', 'aria-modal': 'true' }, h('h2', { text: title }), h('div', { class: 'dialog-body' }, body), h('div', { class: 'dialog-foot' }, foot)));
    document.body.append(v);
    paint();
    return v;
  }
  function nameDialog(title, start, okText, submit) {
    var err = h('div', { class: 'dialog-err' });
    var input = h('input', { type: 'text', value: start, maxlength: 200, 'aria-label': title });
    var ok = h('button', { type: 'button', class: 'btn primary', text: okText, onClick: go_ });
    var v = dialog(title, [input, err], [h('button', { type: 'button', class: 'btn', text: L('cancel', 'Cancel'), onClick: function () { v.remove(); } }), ok]);
    input.addEventListener('keydown', function (e) { if (e.key === 'Enter') go_(); if (e.key === 'Escape') v.remove(); });
    function go_() {
      ok.disabled = true; err.textContent = '';
      submit(input.value).then(function () { v.remove(); }).catch(function (e) { ok.disabled = false; err.textContent = errorText(e.code); });
    }
    input.focus();
    var dot = start.lastIndexOf('.');
    input.setSelectionRange(0, dot > 0 ? dot : start.length);
  }
  function newFolderDialog() {
    nameDialog(L('new_folder', 'New folder'), L('new_folder_name', 'New folder'), L('create', 'Create'), function (name) {
      return call('POST', '/folders', { name: name, parent: S.view === 'drive' ? S.folder : null }).then(function (j) {
        if (S.view === 'drive') load(); else go('#/drive' + (j.item.parent ? '/' + j.item.parent : ''));
      });
    });
  }
  function renameDialog(it) {
    nameDialog(L('act.rename', 'Rename'), it.name, L('save', 'Save'), function (name) {
      return call('PATCH', '/items/' + it.id, { name: name }).then(function () { load(); });
    });
  }
  function confirmDialog(title, body, okText, run) {
    var err = h('div', { class: 'dialog-err' });
    var ok = h('button', { type: 'button', class: 'btn danger', text: okText, onClick: function () {
      ok.disabled = true;
      run().then(function () { v.remove(); }).catch(function (e) { ok.disabled = false; err.textContent = errorText(e.code); });
    } });
    var v = dialog(title, [h('div', { text: body }), err], [h('button', { type: 'button', class: 'btn', text: L('cancel', 'Cancel'), onClick: function () { v.remove(); } }), ok]);
  }
  function emptyBinDialog() {
    confirmDialog(L('bin.empty_title', 'Empty the bin?'), L('bin.empty_body', "Everything in it is deleted for good. This can't be undone."), L('bin.empty_btn', 'Empty bin'), function () { return call('POST', '/bin/empty', {}).then(afterChange); });
  }
  function deleteMedia(m) {
    confirmDialog(L('media.delete_title', 'Delete "{name}"?', { name: m.name }), L('media.delete_body', "Its link stops working, including anywhere you've posted it. This can't be undone."), L('media.delete', 'Delete'), function () { return call('DELETE', '/media/' + m.id).then(afterChange); });
  }
  function roleSelect(cur, onChange, withOff) {
    var opts = (withOff ? [['off', L('link.off', 'Off')]] : []).concat([['view', L('role.view', 'Can view')], ['edit', L('role.edit', 'Can edit')]]);
    var sel = h('select', { class: 'role-sel', 'aria-label': L('share.access', 'Access'), onChange: function () { onChange(sel.value); } }, opts.map(function (o) { return h('option', { value: o[0], text: o[1] }); }));
    sel.value = cur;
    return sel;
  }
  function shareDialog(it) {
    var err = h('div', { class: 'dialog-err' });
    var people = h('div', { class: 'share-list' });
    var linkBox = h('div', { class: 'share-link' });
    var name = h('input', { type: 'text', placeholder: L('share.username', 'Username'), 'aria-label': L('share.username', 'Username'), maxlength: 60, onKeydown: function (e) { if (e.key === 'Enter') addPerson(); } });
    var newRole = 'view';
    var roleBox = roleSelect('view', function (v) { newRole = v; });
    var addBtn = h('button', { type: 'button', class: 'btn primary', text: L('share.add', 'Share'), onClick: addPerson });
    function done(j) { err.textContent = ''; draw(j); }
    function fail(e) { err.textContent = errorText(e.code); }
    function addPerson() {
      if (!name.value.trim()) return;
      call('POST', '/items/' + it.id + '/shares', { username: name.value, role: newRole }).then(function (j) { name.value = ''; done(j); }).catch(fail);
    }
    function draw(j) {
      people.replaceChildren();
      if (!j.people.length) people.append(h('div', { class: 'share-none', text: L('share.private', 'Only you can open this.') }));
      j.people.forEach(function (p) {
        people.append(h('div', { class: 'share-person' },
          p.pfp ? h('img', { class: 'avatar small', src: p.pfp, alt: '' }) : h('span', { class: 'avatar small', text: p.username.charAt(0).toUpperCase() }),
          h('span', { class: 'share-name', title: p.username }, p.username, p.via_link ? h('small', { text: L('share.via_link', 'through the link') }) : null),
          !p.via_link && roleSelect(p.role, function (v) { call('POST', '/items/' + it.id + '/shares', { username: p.username, role: v }).then(done).catch(fail); }),
          iconBtn('x', L('share.remove', 'Remove {name}', { name: p.username }), function () { call('DELETE', '/items/' + it.id + '/shares/' + encodeURIComponent(p.username)).then(done).catch(fail); })));
      });
      var url = j.link ? location.origin + '/#/s/' + j.link.token : '';
      var field = j.link ? h('input', { type: 'text', readonly: true, value: url, 'aria-label': L('share.link', 'Link') }) : null;
      fill(linkBox,
        h('div', { class: 'share-link-head' },
          h('div', {}, h('b', { text: L('share.link_title', 'Anyone with the link') }),
            h('div', { class: 'share-sub', text: !j.link ? L('share.link_off', 'Off: nobody can open this with a link.') : j.link.role === 'edit' ? L('share.link_edit', 'Anyone can view it. Signing in to Nookara lets them edit it.') : L('share.link_view', 'Anyone can view it, no account needed.') })),
          roleSelect(j.link ? j.link.role : 'off', function (v) { call('PUT', '/items/' + it.id + '/share-link', { role: v }).then(done).catch(fail); }, true)),
        j.link && h('div', { class: 'share-copy' }, field, h('button', { type: 'button', class: 'btn', onClick: function (e) { copyText(url, field, e.currentTarget); } }, icon('copy'), h('span', { text: L('share.copy', 'Copy') }))));
      S.items.forEach(function (x) { if (x.id === it.id) x.shared = !!(j.people.length || j.link); });
      paint();
    }
    var v = dialog(L('share.title', 'Share "{name}"', { name: it.name }), [
      h('div', { class: 'share-add' }, name, roleBox, addBtn), err, people, linkBox,
    ], [h('button', { type: 'button', class: 'btn', text: L('done', 'Done'), onClick: function () { v.remove(); renderContent(); } })]);
    v.querySelector('.dialog').classList.add('wide');
    call('GET', '/items/' + it.id + '/shares').then(draw).catch(fail);
    name.focus();
  }
  function copyText(text, field, btn) {
    function ok() { var s = btn.querySelector('span'); s.textContent = L('share.copied', 'Copied'); setTimeout(function () { s.textContent = L('share.copy', 'Copy'); }, 1600); }
    function old() { field.select(); try { if (document.execCommand('copy')) ok(); } catch (e) {  } }
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(ok, old); else old();
  }
  function moveDialog(ids) {
    var moving = {}; ids.forEach(function (i) { moving[i] = true; });
    call('GET', '/folders').then(function (j) {
      var kids = {};
      j.folders.forEach(function (f) { (kids[f.parent || ''] = kids[f.parent || ''] || []).push(f); });
      var pick = null;
      var tree = h('div', { class: 'tree' });
      function line(id, name, depth) {
        var b = h('button', { type: 'button', class: pick === id ? 'on' : '', style: 'padding-left:' + (10 + depth * 16) + 'px', onClick: function () { pick = id; draw(); } }, icon('folder', 'ic-folder'), h('span', { text: name }));
        tree.append(b);
        (kids[id || ''] || []).forEach(function (f) { if (!moving[f.id]) line(f.id, f.name, depth + 1); });
      }
      function draw() { tree.replaceChildren(); line(null, L('nav.drive', 'My Drive'), 0); paint(); }
      var err = h('div', { class: 'dialog-err' });
      var ok = h('button', { type: 'button', class: 'btn primary', text: L('act.move_here', 'Move here'), onClick: function () {
        ok.disabled = true;
        moveTo(ids, pick).then(function () { v.remove(); }).catch(function (e) { ok.disabled = false; err.textContent = errorText(e.code); });
      } });
      var v = dialog(L('sel.move_title', 'Move {n} to...', { n: ids.length === 1 ? L('sel.one_item', '1 item') : L('sel.n_items', '{n} items', { n: ids.length }) }), [tree, err], [h('button', { type: 'button', class: 'btn', text: L('cancel', 'Cancel'), onClick: function () { v.remove(); } }), ok]);
      draw();
    }).catch(function (e) { toast(errorText(e.code), true); });
  }
  function moveTo(ids, parent) {
    return ids.reduce(function (p, id) { return p.then(function () { return call('PATCH', '/items/' + id, { parent: parent || 'root' }); }); }, Promise.resolve()).then(function () { load(); });
  }
  function trashMany(ids) {
    ids.reduce(function (p, id) { return p.then(function () { return call('POST', '/items/' + id + '/trash', {}); }); }, Promise.resolve())
      .then(function () { toast(L('sel.binned', 'Moved to the bin')); afterChange(); })
      .catch(function (e) { toast(errorText(e.code), true); load(); });
  }
  var toastTimer = null;
  function toast(text, bad) {
    document.querySelectorAll('.toast').forEach(function (t) { t.remove(); });
    var t = h('div', { class: 'toast' + (bad ? ' bad' : ''), role: 'status', text: text });
    document.body.append(t);
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.remove(); }, 4500);
  }

  function download(it) {
    return call('POST', fileUrl(it, 'link'), { inline: false }).then(function (j) {
      var a = h('a', { href: j.url, download: it.name, rel: 'noopener', style: 'display:none' });
      document.body.append(a); a.click(); a.remove();
    }).catch(function (e) { toast(errorText(e.code), true); });
  }
  function downloadMany(ids) {
    var list = S.items.filter(function (i) { return ids.indexOf(i.id) >= 0 && i.kind === 'file'; });
    list.reduce(function (p, it) { return p.then(function () { return download(it); }).then(function () { return new Promise(function (r) { setTimeout(r, 300); }); }); }, Promise.resolve());
  }
  function preview(it, list) {
    closeOverlays();
    var idx = list.findIndex(function (x) { return x.id === it.id; });
    var stage = h('div', { class: 'pv-stage' });
    function step(d) { var n = list[idx + d]; if (n) preview(n, list); }
    function close() { pv.remove(); document.removeEventListener('keydown', onKey); }
    function onKey(e) {
      if (!document.body.contains(pv)) { document.removeEventListener('keydown', onKey); return; }
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') { document.removeEventListener('keydown', onKey); step(-1); }
      if (e.key === 'ArrowRight') { document.removeEventListener('keydown', onKey); step(1); }
    }
    document.addEventListener('keydown', onKey);
    var dl = h('button', { type: 'button', class: 'btn', onClick: function () { download(it); } }, icon('download'), h('span', { text: L('act.download', 'Download') }));
    var pv = h('div', { class: 'pv', role: 'dialog', 'aria-modal': 'true', 'aria-label': it.name },
      h('div', { class: 'pv-top' },
        iconBtn('x', L('close', 'Close'), close),
        itemIcon(it),
        h('div', { class: 'pv-title' }, h('b', { title: it.name, text: it.name }), h('span', { text: fmtBytes(it.size) + ' · ' + L('modified_on', 'Modified {date}', { date: fmtDate(it.modified_at, true) }) })),
        dl),
      stage);
    if (list.length > 1) {
      var prev = h('button', { type: 'button', class: 'pv-arrow prev', 'aria-label': L('prev', 'Previous'), disabled: idx <= 0, onClick: function () { document.removeEventListener('keydown', onKey); step(-1); } }, icon('chevron-left'));
      var next = h('button', { type: 'button', class: 'pv-arrow next', 'aria-label': L('next', 'Next'), disabled: idx >= list.length - 1, onClick: function () { document.removeEventListener('keydown', onKey); step(1); } }, icon('chevron-right'));
      stage.append(prev, next);
    }
    document.body.append(pv);
    function noPreview() {
      add(stage, h('div', { class: 'pv-none' },
        h('div', { class: 'box' }, icon('file')),
        h('div', { text: L('pv.none', "There's no preview for this kind of file.") }, h('br'), L('pv.none2', 'Download it to open it on your device.')),
        h('button', { type: 'button', class: 'btn primary', onClick: function () { download(it); } }, icon('download'), h('span', { text: L('act.download', 'Download') }))));
      paint();
    }
    var e = ext(it.name);
    var media = SHOWN_IMAGES.indexOf(e) >= 0 ? 'img' : SHOWN_VIDEO.indexOf(e) >= 0 ? 'video' : SHOWN_AUDIO.indexOf(e) >= 0 ? 'audio' : null;
    if (media) {
      call('POST', fileUrl(it, 'link'), { inline: true }).then(function (j) {
        if (!j.inline) return noPreview();
        var el = media === 'img' ? h('img', { src: j.url, alt: it.name }) : h(media, { src: j.url, controls: true, autoplay: media === 'video' });
        el.addEventListener('error', function () { el.remove(); noPreview(); });
        stage.prepend(el);
      }).catch(noPreview);
    } else if (SHOWN_TEXT.indexOf(e) >= 0) {
      call('GET', fileUrl(it, 'text')).then(function (j) {
        stage.prepend(h('pre', { class: 'pv-text', text: j.text + (j.truncated ? '\n\n' + L('pv.truncated', '(Only the start of this file is shown. Download it to see the rest.)') : '') }));
      }).catch(noPreview);
    } else noPreview();
    paint();
  }

  var dragging = null, dragDepth = 0;
  function hasFiles(e) { return e.dataTransfer && Array.prototype.indexOf.call(e.dataTransfer.types || [], 'Files') >= 0; }
  function dragIn(e) {
    if (!hasFiles(e) || !canAddHere() || dragging) return;
    e.preventDefault();
    dragDepth++;
    if (!els.veilDrop) {
      els.veilDrop = h('div', { class: 'dropveil' }, icon('cloud-upload'), h('span', { text: L('drop', 'Drop to upload') }));
      els.main.append(els.veilDrop);
      paint();
    }
  }
  function dragOverMain(e) { if (hasFiles(e) && canAddHere() && !dragging) { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; } }
  function dragOut(e) {
    if (!hasFiles(e) || dragging) return;
    dragDepth = Math.max(0, dragDepth - 1);
    if (!dragDepth) dropVeilOff();
  }
  function dropVeilOff() { dragDepth = 0; if (els.veilDrop) { els.veilDrop.remove(); els.veilDrop = null; } }
  function dropOnMain(e) {
    if (!hasFiles(e) || !canAddHere() || dragging) return;
    e.preventDefault();
    dropVeilOff();
    uploadEntries(e.dataTransfer);
  }
  function dropTarget(el, folderId) {
    el.addEventListener('dragover', function (e) { if (dragging && dragging.indexOf(folderId) < 0) { e.preventDefault(); e.stopPropagation(); e.dataTransfer.dropEffect = 'move'; el.classList.add('drop'); } });
    el.addEventListener('dragleave', function () { el.classList.remove('drop'); });
    el.addEventListener('drop', function (e) {
      el.classList.remove('drop');
      if (!dragging || dragging.indexOf(folderId) >= 0) return;
      e.preventDefault(); e.stopPropagation();
      var ids = dragging; dragging = null;
      moveTo(ids, folderId).catch(function (x) { toast(errorText(x.code), true); load(); });
    });
  }

  var MAX_AT_ONCE = 2, PARTS_AT_ONCE = 3;
  function here() { return S.view === 'drive' ? S.folder : null; }
  function pickFiles() {
    var i = h('input', { type: 'file', multiple: true, onChange: function () { queueFiles(Array.prototype.slice.call(i.files), here()); } });
    i.click();
  }
  function pickFolder() {
    var i = h('input', { type: 'file', webkitdirectory: true, onChange: function () {
      uploadTree(Array.prototype.slice.call(i.files).map(function (f) { return { file: f, path: f.webkitRelativePath || f.name }; }), here());
    } });
    i.click();
  }
  function readEntry(entry, prefix, out) {
    if (entry.isFile) return new Promise(function (res) { entry.file(function (f) { out.push({ file: f, path: prefix + f.name }); res(); }, function () { res(); }); });
    if (!entry.isDirectory) return Promise.resolve();
    out.emptyDirs = out.emptyDirs || [];
    var reader = entry.createReader();
    var all = [];
    return new Promise(function (res) {
      (function next() {
        reader.readEntries(function (batch) {
          if (!batch.length) {
            if (!all.length) out.emptyDirs.push(prefix + entry.name);
            all.reduce(function (p, c) { return p.then(function () { return readEntry(c, prefix + entry.name + '/', out); }); }, Promise.resolve()).then(res);
            return;
          }
          all = all.concat(Array.prototype.slice.call(batch));
          next();
        }, function () { res(); });
      })();
    });
  }
  function uploadEntries(dt) {
    var parent = here();
    var entries = Array.prototype.slice.call(dt.items || []).map(function (i) { return i.webkitGetAsEntry && i.webkitGetAsEntry(); }).filter(Boolean);
    if (!entries.length) { queueFiles(Array.prototype.slice.call(dt.files), parent); return; }
    var out = [];
    Promise.all(entries.map(function (en) { return readEntry(en, '', out); })).then(function () { uploadTree(out, parent, out.emptyDirs); });
  }
  function uploadTree(files, parent, emptyDirs) {
    var made = {};
    function folderFor(path) {
      if (!path) return Promise.resolve(parent);
      if (made[path]) return made[path];
      var cut = path.lastIndexOf('/');
      var name = cut >= 0 ? path.slice(cut + 1) : path;
      made[path] = folderFor(cut >= 0 ? path.slice(0, cut) : '').then(function (p) { return call('POST', '/folders', { name: name, parent: p }).then(function (j) { return j.item.id; }); });
      return made[path];
    }
    var chain = Promise.resolve();
    (emptyDirs || []).forEach(function (d) { chain = chain.then(function () { return folderFor(d); }); });
    files.forEach(function (f) {
      var cut = f.path.lastIndexOf('/');
      var dir = cut >= 0 ? f.path.slice(0, cut) : '';
      chain = chain.then(function () { return folderFor(dir); }).then(function (p) { queueFile(f.file, p); });
    });
    chain.then(pump).then(function () { if (S.view === 'drive') load(); }).catch(function (e) { toast(errorText(e.code), true); });
  }
  function queueFiles(files, parent) { files.forEach(function (f) { queueFile(f, parent); }); pump(); }
  function queueFile(file, parent) { S.uploads.push({ file: file, parent: parent, sent: 0, state: 'waiting', ctl: new AbortController() }); S.trayOpen = true; }
  function pump() {
    renderTray();
    var running = S.uploads.filter(function (u) { return u.state === 'sending'; }).length;
    S.uploads.filter(function (u) { return u.state === 'waiting'; }).slice(0, Math.max(0, MAX_AT_ONCE - running)).forEach(function (u) { sendFile(u); });
  }
  function sendFile(u) {
    u.state = 'sending';
    renderTray();
    call('POST', '/uploads', { name: u.file.name, size: u.file.size, parent: u.parent }).then(function (s) {
      u.id = s.id;
      var next = 1;
      var done = {};
      function one() {
        if (next > s.parts) return Promise.resolve();
        var n = next++;
        var from = (n - 1) * s.chunk_size;
        var blob = u.file.slice(from, from + s.chunk_size);
        return putPart(u, n, blob, 0).then(function () { done[n] = blob.size; u.sent = Object.keys(done).reduce(function (a, k) { return a + done[k]; }, 0); renderTray(); return one(); });
      }
      var runners = [];
      for (var i = 0; i < Math.min(PARTS_AT_ONCE, s.parts); i++) runners.push(one());
      return Promise.all(runners).then(function () { return call('POST', '/uploads/' + s.id + '/finish', {}); });
    }).then(function () {
      u.state = 'done';
      renderTray();
      if (S.view === 'drive' && (S.folder || null) === (u.parent || null)) softReload();
      else if (S.view === 'home' || S.view === 'recent') softReload();
      refreshMe();
    }).catch(function (e) {
      if (u.state === 'cancelled') return;
      u.state = 'failed'; u.error = errorText(e.code);
      if (u.id) call('DELETE', '/uploads/' + u.id).catch(function () {  });
      renderTray();
    }).then(pump);
  }
  function putPart(u, n, blob, tries) {
    return call('PUT', '/uploads/' + u.id + '/' + n, blob, { raw: true, signal: u.ctl.signal }).catch(function (e) {
      if (u.ctl.signal.aborted || e.code || tries >= 3) throw e;
      return new Promise(function (r) { setTimeout(r, 1000 * (tries + 1)); }).then(function () { return putPart(u, n, blob, tries + 1); });
    });
  }
  var softTimer = null;
  function softReload() {
    clearTimeout(softTimer);
    softTimer = setTimeout(function () {
      var r = parseRoute();
      var p = r.view === 'drive' ? call('GET', '/items?' + new URLSearchParams({ parent: r.folder || 'root', sort: S.sort, dir: S.dir })) : r.view === 'home' ? call('GET', '/recent?limit=24') : r.view === 'recent' ? call('GET', '/recent?limit=100') : null;
      if (p) p.then(function (j) { S.items = j.items; renderContent(); }).catch(function () {  });
    }, 300);
  }
  function cancelUpload(u) {
    if (u.state === 'sending' || u.state === 'waiting') {
      var wasSending = u.state === 'sending';
      u.state = 'cancelled';
      u.ctl.abort();
      if (wasSending && u.id) call('DELETE', '/uploads/' + u.id).catch(function () {  });
    }
    S.uploads = S.uploads.filter(function (x) { return x !== u; });
    pump();
  }
  function renderTray() {
    if (!els.tray) return;
    if (!S.uploads.length) { els.tray.classList.add('hidden'); return; }
    els.tray.classList.remove('hidden');
    var active = S.uploads.filter(function (u) { return u.state === 'sending' || u.state === 'waiting'; }).length;
    fill(els.tray,
      h('div', { class: 'tray-head' },
        h('span', { text: active ? L('up.active', 'Uploading {n}', { n: active }) : L('up.done', 'Uploads finished') }),
        h('div', { class: 'spacer' }),
        iconBtn(S.trayOpen ? 'chevron-down' : 'chevron-up', L('up.toggle', 'Show or hide'), function () { S.trayOpen = !S.trayOpen; renderTray(); }),
        !active && iconBtn('x', L('close', 'Close'), function () { S.uploads = []; renderTray(); })),
      S.trayOpen && h('div', { class: 'tray-list' }, S.uploads.map(function (u) {
        var pct = u.file.size ? Math.round(u.sent / u.file.size * 100) : (u.state === 'done' ? 100 : 0);
        var state = u.state === 'done' ? L('up.ok', 'Done') : u.state === 'failed' ? u.error : u.state === 'waiting' ? L('up.waiting', 'Waiting') : pct + '%';
        return h('div', { class: 'tray-row' },
          h('div', { class: 'tray-line' },
            h('span', { class: 'name', title: u.file.name, text: u.file.name }),
            h('span', { class: 'state' + (u.state === 'failed' ? ' bad' : ''), title: state, text: u.state === 'failed' ? L('up.failed', 'Failed') : state }),
            iconBtn(u.state === 'done' || u.state === 'failed' ? 'x' : 'circle-x', L('up.cancel', 'Cancel'), function () { cancelUpload(u); })),
          u.state === 'failed' ? h('div', { class: 'dialog-err', text: u.error }) : u.state === 'sending' ? h('div', { class: 'tray-bar' }, h('div', { style: 'width:' + pct + '%' })) : null);
      })));
    paint();
  }
  window.addEventListener('beforeunload', function (e) {
    if (S.uploads.some(function (u) { return u.state === 'sending' || u.state === 'waiting'; })) { e.preventDefault(); e.returnValue = ''; }
  });

  function showLink() {
    var r = parseRoute();
    S.link = { token: r.token };
    S.sel = {};
    fetch(API + '/config').then(function (x) { return x.json(); }).then(function (c) { siteOrigin = c.site; var a = document.querySelector('.link-report'); if (a) a.href = siteLink('/support'); }).catch(function () {  });
    var who = token() && !S.me ? call('GET', '/me').then(function (m) { S.me = m; applyAccent(m.color); }).catch(function () {  }) : Promise.resolve();
    who.then(function () { return call('GET', '/s/' + r.token + (r.item ? '?item=' + r.item : '')); }).then(function (j) {
      S.link.data = j;
      S.items = j.items;
      if (j.role === 'edit' && canWrite()) return call('POST', '/s/' + r.token + '/join', {}).then(function (x) { S.link = null; location.hash = x.item.kind === 'folder' ? '#/drive/' + x.item.id : '#/with-me'; });
      renderLinkPage();
    }).catch(function () {
      S.link = null;
      app.replaceChildren(h('div', { class: 'gate-main full' }, h('div', { class: 'empty' }, icon('link-2-off'), h('b', { text: L('link.gone', "This link doesn't work any more") }), h('span', { text: L('link.gone_hint', 'Its owner may have turned it off or deleted the file.') }), h('a', { class: 'btn', href: '#/', text: 'Nookara Drive' }))));
      paint();
    });
  }
  function renderLinkPage() {
    var d = S.link.data, it = d.item, token_ = S.link.token;
    var msg = h('span', { class: 'dialog-err' });
    function setBusy(on, err) { signBtn.disabled = !!on; msg.textContent = err ? L('gate.failed', "That didn't work. Try again.") : ''; }
    var signBtn = h('button', { type: 'button', class: 'btn', onClick: function () { signIn(setBusy); } }, icon('log-in'), h('span', { text: d.role === 'edit' ? L('link.sign_in_edit', 'Sign in to edit') : L('gate.button', 'Sign in with Nookara') }));
    var joinBtn = h('button', { type: 'button', class: 'btn', onClick: function () {
      call('POST', '/s/' + token_ + '/join', {}).then(function () { S.link = null; location.hash = '#/with-me'; }).catch(function (e) { toast(errorText(e.code), true); });
    } }, icon('user-plus'), h('span', { text: L('link.add', 'Add to Shared with me') }));
    var crumbs = [];
    d.path.forEach(function (p, i) {
      if (i) crumbs.push(icon('chevron-right'));
      crumbs.push(h('button', { type: 'button', class: 'crumb', title: p.name, text: p.name, onClick: function () { location.hash = '#/s/' + token_ + (i ? '/' + p.id : ''); } }));
    });
    var body;
    if (it.kind === 'folder') {
      body = S.items.length ? h('div', { class: 'grid' }, S.items.map(function (x) {
        return h('div', { class: 'tile', tabindex: 0, onClick: function () { if (x.kind === 'folder') location.hash = '#/s/' + token_ + '/' + x.id; else preview(x, S.items.filter(function (f) { return f.kind === 'file'; })); } },
          h('div', { class: 'tile-art' }, artFor(x)), h('div', { class: 'tile-name', title: x.name, text: x.name }));
      })) : h('div', { class: 'empty' }, icon('folder-open'), h('b', { text: L('folder.empty', 'This folder is empty') }));
    } else {
      body = h('div', { class: 'empty' }, itemIcon(it), h('b', { text: it.name }), h('span', { text: fmtBytes(it.size) + ' · ' + L('modified_on', 'Modified {date}', { date: fmtDate(it.modified_at) }) }),
        h('div', { class: 'link-acts' },
          h('button', { type: 'button', class: 'btn', onClick: function () { preview(it, [it]); } }, icon('eye'), h('span', { text: L('act.preview', 'Preview') })),
          h('button', { type: 'button', class: 'btn primary', onClick: function () { download(it); } }, icon('download'), h('span', { text: L('act.download', 'Download') }))));
    }
    els.content = h('div', { class: 'content' }, body);
    app.replaceChildren(h('div', { class: 'linkpage' },
      h('header', { class: 'topbar' },
        h('a', { class: 'brand', href: '#/' }, h('img', { src: '/assets/apps/drive.svg', alt: '' }), h('span', { text: 'Nookara Drive' })),
        h('div', { class: 'spacer' }), msg, S.me ? (S.me.can_read ? joinBtn : null) : signBtn),
      h('div', { class: 'bar lined' }, h('div', { class: 'crumbs' }, crumbs), h('div', { class: 'spacer' }),
        h('span', { class: 'share-sub', text: L('link.shared_by', 'Shared by {name}', { name: d.owner }) }),
        h('a', { class: 'share-sub link-report', href: siteLink('/support'), target: '_blank', rel: 'noopener', text: L('link.report', 'Report this') })),
      d.role === 'edit' && !canWrite() ? h('div', { class: 'note', text: S.me ? L('link.read_only', 'You signed in with Read only, so you can only view this. Sign out and back in to edit it.') : L('link.edit_note', "You can look without an account. Sign in to Nookara to edit it.") }) : null,
      els.content));
    els.frame = null;
    fillThumbs();
    paint();
  }

  function boot() {
    if (parseRoute().view === 's') { showLink(); return; }
    if (!token()) { renderGate(); return; }
    fetch(API + '/config').then(function (r) { return r.json(); }).then(function (c) { siteOrigin = c.site; if (els.side) renderSide(); }).catch(function () {  });
    call('GET', '/me').then(function (m) {
      S.me = m;
      applyAccent(m.color);
      if (window.veloraI18n) { window.veloraI18n.fromAccount(m.lang); window.veloraI18n.onChange(function () { if (S.me) renderFrame(); }); }
      load();
    }).catch(function (e) {
      if (S.me) return;
      if (token()) {
        app.replaceChildren(h('div', { class: 'empty' }, icon('cloud-off'), h('b', { text: L('offline', "Can't reach Nookara right now") }), h('button', { type: 'button', class: 'btn', text: L('retry', 'Try again'), onClick: boot })));
        paint();
      }
    });
  }
  if (window.withI18n) window.withI18n(boot); else boot();
})();
