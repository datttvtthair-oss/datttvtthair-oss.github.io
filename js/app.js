/* Giao diện giáo án. Đọc dữ liệu từ PLAN / EXERCISES / VIDEOS / CLIPS, lưu qua Store. */
(function () {
  'use strict';
  const P = window.PLAN, EX = window.EXERCISES, VID = window.VIDEOS || {}, CLIPS = window.CLIPS || {};
  const app = document.getElementById('app');
  const modalRoot = document.getElementById('modal');
  const timerRoot = document.getElementById('timer');
  const SITE = 'https://datttvtthair-oss.github.io/'; // bản trên mạng, nơi video phát ngay trong trang

  /* ───────── tiện ích ───────── */
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const pad = n => String(n).padStart(2, '0');
  const iso = d => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  const parse = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
  const today = () => iso(new Date());
  const addDays = (s, n) => { const d = parse(s); d.setDate(d.getDate() + n); return iso(d); };
  const diff = (a, b) => Math.round((parse(a) - parse(b)) / 86400000);
  const mondayOf = s => addDays(s, -((parse(s).getDay() + 6) % 7));
  const DOW = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
  const fmtDM = s => { const d = parse(s); return pad(d.getDate()) + '/' + pad(d.getMonth() + 1); };
  const fmtDay = s => DOW[parse(s).getDay()] + ' ' + fmtDM(s);
  const fmtRest = sec => Math.floor(sec / 60) + ':' + pad(sec % 60);
  const validDate = s => /^\d{4}-\d{2}-\d{2}$/.test(s || '');

  const ICON = {
    play: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>',
    check: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9.5 16.2 5.3 12l-1.4 1.4 5.6 5.6L20.1 8.4 18.7 7z"/></svg>',
    clock: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16zm.5-13H11v6l5.2 3.2.8-1.3-4.5-2.7z"/></svg>',
    close: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 6.4 17.6 5 12 10.6 6.4 5 5 6.4 10.6 12 5 17.6 6.4 19 12 13.4 17.6 19 19 17.6 13.4 12z"/></svg>',
    ext: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 3v2h3.6l-9.8 9.8 1.4 1.4L19 6.4V10h2V3zM19 19H5V5h7V3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7h-2z"/></svg>'
  };
  const ART = {
    court: '<svg viewBox="0 0 160 100" aria-hidden="true"><rect width="160" height="100" fill="#0d1d3a"/><g fill="none" stroke="#22d3ee" stroke-opacity=".55" stroke-width="1.6"><rect x="8" y="8" width="144" height="84"/><line x1="80" y1="8" x2="80" y2="92"/><circle cx="80" cy="50" r="14"/><path d="M8 26h26v48H8M152 26h-26v48h26"/><path d="M8 14a52 36 0 0 1 0 72M152 14a52 36 0 0 0 0 72"/></g><circle cx="80" cy="50" r="8" fill="#ff8a3d"/><path d="M72 50h16M80 42v16" stroke="#0d1d3a" stroke-width="1.2"/></svg>',
    moon: '<svg viewBox="0 0 160 100" aria-hidden="true"><rect width="160" height="100" fill="#0d1d3a"/><g fill="#e8eef9"><circle cx="30" cy="22" r="1.2"/><circle cx="120" cy="18" r="1"/><circle cx="138" cy="60" r="1.3"/><circle cx="46" cy="76" r="1"/><circle cx="96" cy="84" r="1.1"/></g><path d="M92 26a26 26 0 1 0 22 40 22 22 0 1 1-22-40z" fill="#2dd4bf"/><text x="112" y="40" font-family="Barlow Condensed, sans-serif" font-size="14" fill="#22d3ee">z z</text></svg>'
  };

  /* ───────── kế hoạch & ngữ cảnh ───────── */
  const DAY = Object.fromEntries(P.days.map(d => [d.id, d]));
  const dayByDow = dow => P.days.find(d => d.dow === dow);
  const keyOf = (date, dayId) => date + '_' + dayId;

  function cfg() {
    const s = Store.settings();
    return {
      start: validDate(s.programStart) ? s.programStart : P.defaults.programStart,
      tournament: validDate(s.tournament) ? s.tournament : P.defaults.tournament,
      games: Array.isArray(s.games) ? s.games.filter(validDate).sort() : [],
      autoRest: s.autoRest !== false
    };
  }

  function phaseFor(date) {
    const c = cfg();
    const toT = diff(c.tournament, date);
    if (toT >= 0 && toT <= 9) return { id: 'giam-tai', daysTo: toT };
    if (toT < 0 && toT >= -7) return { id: 'sau-giai', daysTo: toT };
    const week = Math.floor(diff(date, c.start) / 7) + 1;
    if (week <= 2) return { id: 'lam-quen', week: Math.max(1, week), daysTo: toT };
    return { id: 'tang-tien', week, daysTo: toT };
  }

  function nextGame(date) {
    const c = cfg();
    const all = [c.tournament].concat(c.games).filter(g => g >= date).sort();
    return all.length ? { date: all[0], days: diff(all[0], date), main: all[0] === c.tournament } : null;
  }

  function ctxFor(day, date) {
    const rec = Store.session(keyOf(date, day.id));
    const ctx = { phase: phaseFor(date), checkin: rec && rec.checkin || null, light: false, gameDay: false, banners: [], date };
    const g = nextGame(date);
    if (g && day.kind !== 'rest') {
      if (g.days === 0) {
        ctx.gameDay = true;
        ctx.banners.push({ tone: 'hot', title: 'Hôm nay thi đấu', text: 'Không tập gym. Khởi động kỹ 15–20 phút trước trận, uống nước đều, ăn món quen.' });
      } else if (g.days === 1) {
        ctx.light = true;
        ctx.banners.push({ tone: 'hot', title: 'Ngày mai thi đấu (' + fmtDay(g.date) + ')', text: 'Tốt nhất là nghỉ, hoặc chỉ khởi động + ném nhẹ 20–30 phút. Nếu vẫn tập, buổi này đã chuyển sang bản nhẹ.' });
      } else if (g.days <= 3 && day.legs) {
        ctx.light = true;
        ctx.banners.push({ tone: 'warn', title: 'Còn ' + g.days + ' ngày tới trận (' + fmtDay(g.date) + ')', text: 'Không tập chân nặng sát trận: buổi này đã chuyển sang bản nhẹ — chỉ bài chính, tối đa 2 hiệp, còn dư 3–4 lần.' });
      }
    }
    if (ctx.phase.id === 'giam-tai') ctx.banners.push({ tone: 'info', title: 'Giảm tải trước giải · còn ' + ctx.phase.daysTo + ' ngày', text: P.phases['giam-tai'].rule });
    if (ctx.phase.id === 'sau-giai') ctx.banners.push({ tone: 'info', title: 'Tuần hồi phục sau giải', text: P.phases['sau-giai'].rule });
    return ctx;
  }

  /* Thông số hôm nay của một bài sau khi áp giai đoạn, check-in, lịch thi đấu. */
  function rx(item, ctx) {
    const out = { skip: false, reason: '', sets: item.sets || 0, rir: item.rir || '', changed: false };
    if (item.role) return out;
    if (ctx.gameDay && item.kind === 'gym') return Object.assign(out, { skip: true, reason: 'Ngày thi đấu — không tập gym' });
    const tired = ctx.checkin === 'rat-met';
    if (item.sets) {
      const ph = P.phases[ctx.phase.id];
      let s = item.sets, rir = item.rir;
      const numeric = /\d/.test(rir || '');
      if (ph.setDelta) s = Math.max(ph.minSets || 1, s + ph.setDelta);
      if (ph.setFactor) s = Math.max(1, Math.ceil(s * ph.setFactor));
      if (ph.rir && numeric) rir = ph.rir;
      if (ctx.light) {
        if (item.tier === 'acc') return Object.assign(out, { skip: true, reason: 'Bỏ — sát ngày thi đấu' });
        s = Math.min(s, 2); if (numeric) rir = '3–4';
      }
      if (ctx.checkin === 'hoi-met') s = Math.max(1, s - 1);
      if (tired) {
        if (item.tier === 'acc') return Object.assign(out, { skip: true, reason: 'Bỏ hôm nay — rất mệt' });
        s = Math.min(s, 2);
      }
      out.sets = s; out.rir = rir; out.changed = s !== item.sets;
    } else if ((ctx.light || tired) && item.tier === 'acc') {
      return Object.assign(out, { skip: true, reason: ctx.light ? 'Bỏ — sát ngày thi đấu' : 'Bỏ hôm nay — rất mệt' });
    }
    return out;
  }

  /* Danh sách theo thứ tự tập: khởi động → các bài → thả lỏng. */
  function dayOrder(day) {
    const list = [];
    if (day.warmup) list.push({ ex: day.warmup, dose: '8–10 phút', role: 'warmup', kind: 'warm' });
    day.blocks.forEach(b => b.items.forEach(it => list.push(Object.assign({ kind: b.kind }, it))));
    if (day.cooldown) list.push({ ex: day.cooldown, dose: '5–10 phút', role: 'cooldown', kind: 'warm' });
    return list;
  }
  const mainItems = day => dayOrder(day).filter(i => !i.role);

  function estimate(day, ctx) {
    let sec = (day.warmup ? 600 : 0) + (day.cooldown ? 300 : 0);
    mainItems(day).forEach(it => {
      const r = rx(it, ctx);
      if (r.skip) return;
      sec += it.sets ? r.sets * ((it.work || 45) + it.rest) + 60 : (it.min || 0) * 60;
    });
    return Math.max(5, Math.round(sec / 300) * 5);
  }

  function defaultDate(day) {
    const t = today();
    if (parse(t).getDay() === day.dow) return t;
    return addDays(mondayOf(t), (day.dow + 6) % 7);
  }
  const ui = { dates: {}, openHistory: null, exHist: null, confirm: null };
  const logDate = day => ui.dates[day.id] || defaultDate(day);

  function progressOf(day, date) {
    const ctx = ctxFor(day, date);
    const rec = Store.session(keyOf(date, day.id));
    const items = mainItems(day).filter(i => !rx(i, ctx).skip);
    const done = items.filter(i => rec && rec.items[i.ex] && rec.items[i.ex].done).length;
    return { done, total: items.length, completed: !!(rec && rec.completed), started: !!(rec && (done || rec.checkin)) };
  }

  function lastLog(exId, currentKey, date) {
    for (const s of Store.allSessions()) {
      if (s.key === currentKey || s.date > date) continue;
      const it = s.items && s.items[exId];
      if (it && it.sets && it.sets.some(x => x && (x.w || x.r))) return { date: s.date, sets: it.sets.filter(x => x && (x.w || x.r)) };
    }
    return null;
  }

  function fmtSet(x, item) {
    const unit = item && item.unit === 'sec' ? ' giây' : '';
    if (x.w && x.r) return x.w + 'kg×' + x.r + unit;
    if (x.r) return x.r + (unit || ' lần');
    return x.w + 'kg';
  }

  function weekStats(mon) {
    const end = addDays(mon, 6);
    const res = { gym: 0, court: 0, days: {} };
    Store.allSessions().forEach(s => {
      if (s.date < mon || s.date > end) return;
      const d = DAY[s.dayId];
      if (!d) return;
      const anyDone = Object.values(s.items || {}).some(i => i.done);
      const st = s.completed ? 'done' : anyDone ? 'partial' : null;
      if (s.completed) { res.gym += d.counts.gym || 0; res.court += d.counts.court || 0; }
      if (st && res.days[d.id] !== 'done') res.days[d.id] = st;
    });
    return res;
  }

  /* ───────── mẩu giao diện dùng chung ───────── */
  function media(id, cls) {
    const e = EX[id];
    if (!e) return '';
    if (e.photos) {
      return `<span class="ph ${cls || ''}">` +
        `<img class="ph-a" src="img/ex/${id}-0.jpg" alt="${esc(e.vi)} — tư thế bắt đầu" loading="lazy">` +
        `<img class="ph-b" src="img/ex/${id}-1.jpg" alt="" aria-hidden="true" loading="lazy"></span>`;
    }
    if (e.video) return `<span class="ph ph-yt ${cls || ''}"><img src="img/yt/${e.video}.jpg" alt="${esc(e.vi)}" loading="lazy"></span>`;
    return `<span class="ph ph-art ${cls || ''}">${ART[e.art] || ART.court}</span>`;
  }

  function hasVideo(id) { const e = EX[id]; return !!(e && (e.video || CLIPS[id])); }

  function banner(b) {
    return `<div class="banner tone-${b.tone}" role="status"><b>${esc(b.title)}</b><span>${esc(b.text)}</span></div>`;
  }

  function weekDots(mon, stats) {
    const t = today();
    return `<ol class="wdots" aria-label="Các buổi trong tuần">` + P.days.map(d => {
      const date = addDays(mon, (d.dow + 6) % 7);
      const st = stats.days[d.id];
      const lab = d.short + (st === 'done' ? ': đã xong' : st === 'partial' ? ': đang dở' : '');
      return `<li class="wd ${st ? 'is-' + st : ''} ${date === t ? 'is-today' : ''} kind-${d.kind}" title="${esc(lab)}"><span>${d.short}</span></li>`;
    }).join('') + `</ol>`;
  }

  /* ───────── trang: lịch tuần ───────── */
  function viewWeek() {
    const t = today(), mon = mondayOf(t), c = cfg();
    const ph = phaseFor(t), phase = P.phases[ph.id];
    const stats = weekStats(mon);
    const td = dayByDow(parse(t).getDay());
    const tctx = ctxFor(td, t);
    const tp = progressOf(td, t);
    const daysToT = diff(c.tournament, t);
    const a = P.athlete;

    const dayCards = P.days.map(d => {
      const date = addDays(mon, (d.dow + 6) % 7);
      const ctx = ctxFor(d, date);
      const p = progressOf(d, date);
      const thumbs = mainItems(d).slice(0, 4).map(i => media(i.ex, 'thumb')).join('');
      const status = p.completed ? `<span class="st st-done">${ICON.check}Đã xong</span>`
        : p.done ? `<span class="st st-part">${p.done}/${p.total} bài</span>` : '';
      const tag = d.kind === 'gym' ? (d.court ? 'Gym + Sân' : 'Gym') : d.kind === 'court' ? 'Sân' : 'Phục hồi';
      return `<a class="daycard kind-${d.kind} ${date === t ? 'is-today' : ''}" href="#${d.id}">
        <div class="dc-top"><span class="dc-short">${d.short}</span><span class="dc-tag">${tag}</span>${date === t ? '<span class="dc-today">Hôm nay</span>' : ''}</div>
        <h3>${esc(d.title)}</h3>
        <p class="dc-sub">${esc(d.sub)}</p>
        <div class="dc-thumbs">${thumbs}</div>
        <div class="dc-meta"><span>~${estimate(d, ctx)} phút</span><span>${mainItems(d).length} mục</span>${status}</div>
      </a>`;
    }).join('');

    app.innerHTML = `
      <section class="hero">
        <div class="hero-inner">
          <p class="eyebrow">Giáo án cá nhân · gym + bóng rổ</p>
          <h1 class="hero-title">Giáo án <em>Hậu vệ</em></h1>
          <p class="hero-goal">Mục tiêu: thi đấu tốt cuối tháng 11 — mạnh hơn, bền hơn, nhanh hơn, bật cao hơn, đổi hướng tốt hơn. ${esc(a.look)}.</p>
          <ul class="chips athlete" aria-label="Thông tin người tập">
            ${[a.height, a.weight, a.role, a.level, a.schedule].filter(Boolean).map(x => `<li>${esc(x)}</li>`).join('')}
          </ul>
          <div class="hero-stats">
            <div class="hs hs-phase"><span class="hs-k">Giai đoạn</span><b>${esc(phase.name)}</b><span class="hs-s">${ph.week ? 'Tuần ' + ph.week + ' · ' : ''}${esc(phase.rule)}</span></div>
            <div class="hs hs-count"><span class="hs-k">Tới giải</span><b class="num">${daysToT >= 0 ? daysToT : 0}<small> ngày</small></b><span class="hs-s">${fmtDay(c.tournament)} · <a href="#tien-do">đổi ngày</a></span></div>
            <div class="hs hs-week"><span class="hs-k">Tuần này</span><b class="num">${stats.gym}<small>/5 gym</small> · ${stats.court}<small>/2 sân</small></b>${weekDots(mon, stats)}</div>
          </div>
        </div>
      </section>

      <section class="today-cta kind-${td.kind}">
        <div class="tc-media">${media(mainItems(td)[0].ex)}</div>
        <div class="tc-body">
          <p class="eyebrow">Hôm nay · ${fmtDay(t)}</p>
          <h2>${esc(td.name)} — ${esc(td.title)}</h2>
          <p>${esc(td.sub)} · ~${estimate(td, tctx)} phút${tp.done ? ' · đã xong ' + tp.done + '/' + tp.total : ''}</p>
          ${tctx.banners.slice(0, 1).map(banner).join('')}
          <a class="btn btn-primary" href="#${td.id}">${tp.completed ? 'Xem lại buổi hôm nay' : tp.done ? 'Tiếp tục buổi tập' : 'Mở buổi hôm nay'}</a>
        </div>
      </section>

      <section class="section">
        <div class="section-head"><h2>Lịch 7 ngày</h2><p>Bấm một ngày để xem giáo án và video từng bài.</p></div>
        <div class="daygrid">${dayCards}</div>
      </section>

      <section class="section">
        <div class="section-head"><h2>Trước khi tập</h2></div>
        <div class="basics">
          ${[['rir', 'Chọn tạ', 'Còn dư 2–3 lần là đúng mức'], ['warmup', 'Khởi động', '8–10 phút trước mỗi buổi'], ['recovery', 'Phục hồi', 'Ngủ 7,5–9 giờ, Chủ nhật đi bộ'], ['nutrition', 'Dinh dưỡng', 'Đủ đạm, đủ tinh bột ngày chơi bóng'], ['safety', 'An toàn', 'Đau cơ khác đau khớp thế nào'], ['taper', 'Trước giải', 'Giảm tải 9 ngày cuối']]
          .map(([id, t1, t2]) => `<a class="basic" href="#huong-dan--${id}"><b>${t1}</b><span>${t2}</span></a>`).join('')}
        </div>
      </section>`;
  }

  /* ───────── trang: một ngày ───────── */
  function dayStrip(cur) {
    const t = today(), mon = mondayOf(t), stats = weekStats(mon);
    return `<nav class="daystrip" aria-label="Chọn ngày">` + P.days.map(d => {
      const date = addDays(mon, (d.dow + 6) % 7);
      const st = stats.days[d.id];
      return `<a href="#${d.id}" class="ds kind-${d.kind} ${d.id === cur ? 'is-cur' : ''} ${date === t ? 'is-today' : ''}" ${d.id === cur ? 'aria-current="page"' : ''}>
        <span class="ds-d">${d.short}</span><span class="ds-t">${esc(d.title)}</span>${st === 'done' ? `<span class="ds-ok">${ICON.check}</span>` : ''}</a>`;
    }).join('') + `</nav>`;
  }

  function loggerHTML(day, date, item, r, where) {
    const k = keyOf(date, day.id);
    const rec = Store.session(k);
    const st = rec && rec.items[item.ex] || {};
    const sets = st.sets || [];
    const n = Math.max(r.sets, sets.length);
    const last = lastLog(item.ex, k, date);
    const unit = item.unit === 'sec' ? 'giây' : 'lần';
    let rows = '';
    for (let i = 0; i < n; i++) {
      const s = sets[i] || {};
      const prev = last ? last.sets[Math.min(i, last.sets.length - 1)] || {} : {};
      const attrs = `data-k="${k}" data-day="${day.id}" data-date="${date}" data-ex="${item.ex}" data-i="${i}"`;
      rows += `<div class="set ${s.done ? 'is-done' : ''} ${i >= r.sets ? 'is-extra' : ''}">
        <span class="set-n">${i + 1}</span>
        ${item.bw ? '<span class="set-bw">Không tạ</span>' : `<label class="set-f"><input type="number" inputmode="decimal" step="0.5" min="0" data-f="w" ${attrs} id="w-${where}-${item.ex}-${i}" value="${esc(s.w || '')}" placeholder="${esc(prev.w || '')}" aria-label="Hiệp ${i + 1}: mức tạ (kg)"><span>kg</span></label>`}
        <label class="set-f"><input type="number" inputmode="numeric" min="0" data-f="r" ${attrs} id="r-${where}-${item.ex}-${i}" value="${esc(s.r || '')}" placeholder="${esc(prev.r || '')}" aria-label="Hiệp ${i + 1}: số ${unit}"><span>${unit}</span></label>
        <button type="button" class="set-ok" data-act="set-done" ${attrs} aria-pressed="${s.done ? 'true' : 'false'}" aria-label="Xong hiệp ${i + 1}">${ICON.check}</button>
      </div>`;
    }
    return `<div class="logger">
      ${rows}
      <div class="logger-foot">
        <button type="button" class="link" data-act="add-set" data-k="${k}" data-day="${day.id}" data-date="${date}" data-ex="${item.ex}">+ Thêm hiệp</button>
        <span class="last">${last ? 'Lần trước ' + fmtDM(last.date) + ': ' + last.sets.map(x => fmtSet(x, item)).join(' · ') : 'Chưa có lần trước — ghi lại để lần sau so sánh.'}</span>
      </div>
    </div>`;
  }

  function rxChips(item, r) {
    if (item.sets) {
      return `<ul class="rx">
        <li><b>${r.sets}</b> hiệp × <b>${esc(item.reps)}</b></li>
        <li>Nghỉ <b>${fmtRest(item.rest)}</b></li>
        ${r.rir && r.rir !== '—' ? `<li>${/\d/.test(r.rir) ? 'Còn dư <b>' + esc(r.rir) + '</b> lần' : esc(r.rir)}</li>` : ''}
      </ul>`;
    }
    return `<ul class="rx"><li><b>${esc(item.dose || '')}</b></li></ul>`;
  }

  function exCard(day, date, item, idx, ctx) {
    const e = EX[item.ex];
    const r = rx(item, ctx);
    const rec = Store.session(keyOf(date, day.id));
    const done = !!(rec && rec.items[item.ex] && rec.items[item.ex].done);
    const vid = hasVideo(item.ex);
    const attrs = `data-day="${day.id}" data-ex="${item.ex}"`;
    return `<article class="ex kind-${item.kind} ${r.skip ? 'is-skip' : ''} ${done ? 'is-done' : ''}" id="ex-${item.ex}">
      <button type="button" class="ex-media" data-act="open" ${attrs} aria-label="${vid ? 'Xem video' : 'Xem hướng dẫn'}: ${esc(e.vi)}">
        ${media(item.ex)}
        <span class="ex-num">${idx}</span>
        ${vid ? `<span class="ex-play">${ICON.play}<span>Video</span></span>` : `<span class="ex-play is-info"><span>Hướng dẫn</span></span>`}
        ${done ? `<span class="ex-donebadge">${ICON.check}Xong</span>` : ''}
      </button>
      <div class="ex-body">
        <h3><button type="button" class="ex-name" data-act="open" ${attrs}>${esc(e.vi)}</button></h3>
        <p class="ex-en">${esc(e.en)}${item.tier === 'acc' ? ' · <span class="tier">bài phụ</span>' : ''}</p>
        ${rxChips(item, r)}
        ${r.changed ? `<p class="rx-note">Điều chỉnh hôm nay: ${r.sets} hiệp (giáo án gốc ${item.sets})</p>` : ''}
        ${item.cond ? `<p class="rx-note">${esc(item.cond)}</p>` : ''}
        <p class="cue">${esc(e.cue)}</p>
        ${r.skip ? `<p class="skipnote">${esc(r.reason)}</p>` : item.sets ? loggerHTML(day, date, item, r, 'card') : ''}
        <div class="ex-actions">
          <button type="button" class="btn btn-ghost" data-act="open" ${attrs}>${vid ? ICON.play + 'Xem video' : 'Xem hướng dẫn'}</button>
          ${item.rest && !r.skip ? `<button type="button" class="btn btn-ghost" data-act="rest" data-sec="${item.rest}">${ICON.clock}Nghỉ ${fmtRest(item.rest)}</button>` : ''}
          ${r.skip ? '' : `<button type="button" class="btn ${done ? 'btn-done' : 'btn-line'}" data-act="ex-done" ${attrs} data-date="${date}" aria-pressed="${done}">${ICON.check}${done ? 'Đã xong' : 'Xong bài'}</button>`}
        </div>
      </div>
    </article>`;
  }

  function stripCard(day, item, label) {
    const e = EX[item.ex];
    return `<button type="button" class="strip" data-act="open" data-day="${day.id}" data-ex="${item.ex}">
      ${media(item.ex, 'mini')}
      <span class="strip-t"><span class="eyebrow">${label}</span><b>${esc(e.vi)}</b><span>${esc(item.dose)} · ${esc(e.cue)}</span></span>
      <span class="strip-go">${ICON.play}Video</span>
    </button>`;
  }

  function viewDay(id) {
    const day = DAY[id];
    const date = logDate(day);
    const ctx = ctxFor(day, date);
    const k = keyOf(date, day.id);
    const rec = Store.session(k);
    const p = progressOf(day, date);
    const ph = P.phases[ctx.phase.id];
    let idx = 0;

    const blocks = day.blocks.map(b => `
      <section class="block kind-${b.kind}">
        <h2 class="block-title">${esc(b.title)}</h2>
        <div class="exlist">${b.items.map(it => exCard(day, date, Object.assign({ kind: b.kind }, it), ++idx, ctx)).join('')}</div>
      </section>`).join('');

    const checkin = day.kind === 'rest' ? '' : `
      <section class="checkin" aria-labelledby="ck-h">
        <h2 id="ck-h">Hôm nay bạn thấy thế nào?</h2>
        <div class="ck-opts" role="radiogroup" aria-label="Mức độ mệt hôm nay">
          ${P.checkins.map(c => `<button type="button" role="radio" class="ck ck-${c.id}" aria-checked="${ctx.checkin === c.id}" data-act="checkin" data-v="${c.id}" data-k="${k}" data-day="${day.id}" data-date="${date}"><b>${esc(c.label)}</b><span>${esc(c.hint)}</span></button>`).join('')}
        </div>
      </section>
      ${ctx.checkin === 'dau' ? `<div class="stop" role="alert"><b>Dừng phần gây đau.</b>
        <p>Đau nhói, đau khớp, sưng, tê bì hoặc đau tăng dần không phải đau cơ bình thường. Bỏ các bài làm đau chỗ đó; có thể chỉ tập phần cơ thể không đau, hoặc nghỉ hôm nay. Không đỡ sau 2–3 ngày hoặc đau nặng → đi khám bác sĩ hay chuyên viên vật lý trị liệu. Đau ngực, khó thở, chóng mặt → dừng tập và tìm trợ giúp y tế ngay.</p>
        <a class="btn btn-line" href="#huong-dan--safety">Đọc mục An toàn</a></div>` : ''}`;

    app.innerHTML = `
      ${dayStrip(id)}
      <header class="dayhead kind-${day.kind}">
        <div class="dh-main">
          <p class="eyebrow">${esc(day.name)} · ${day.kind === 'gym' ? (day.court ? 'Gym + bóng rổ' : 'Gym') : day.kind === 'court' ? 'Bóng rổ' : 'Phục hồi'}</p>
          <h1>${esc(day.title)}</h1>
          <p class="sub">${esc(day.sub)}</p>
          <ul class="chips">
            <li>~${estimate(day, ctx)} phút</li><li>${mainItems(day).length} mục</li>
            <li class="chip-phase">${esc(ph.name)}${ctx.phase.week ? ' · tuần ' + ctx.phase.week : ''}</li>
          </ul>
        </div>
        <div class="dh-side">
          <label class="logdate" for="logdate">Ghi kết quả cho ngày
            <input type="date" id="logdate" value="${date}" data-day="${day.id}">
          </label>
          <div class="dh-prog" aria-label="Tiến độ buổi tập">
            <div class="bar"><span style="width:${p.total ? Math.round(p.done / p.total * 100) : 0}%"></span></div>
            <span>${p.completed ? 'Đã hoàn thành buổi' : 'Xong ' + p.done + '/' + p.total + ' mục'}</span>
          </div>
        </div>
      </header>
      ${ctx.banners.map(banner).join('')}
      ${ctx.phase.id === 'lam-quen' && day.kind !== 'rest' ? banner({ tone: 'info', title: 'Giai đoạn làm quen', text: P.phases['lam-quen'].rule }) : ''}
      ${checkin}
      ${day.warmup ? stripCard(day, { ex: day.warmup, dose: '8–10 phút' }, 'Khởi động trước') : ''}
      ${blocks}
      ${day.cooldown ? stripCard(day, { ex: day.cooldown, dose: '5–10 phút' }, 'Thả lỏng sau buổi') : ''}
      <p class="daynote">${esc(day.note)}</p>
      <section class="endcard" aria-labelledby="end-h">
        <h2 id="end-h">Kết thúc buổi</h2>
        <div class="rpe" role="radiogroup" aria-label="Buổi này mệt cỡ nào, thang 1 đến 10">
          <span class="rpe-l">Mệt cỡ nào? (1 nhẹ – 10 kiệt sức)</span>
          <div class="rpe-row">${[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(v => `<button type="button" role="radio" aria-checked="${rec && rec.rpe === v}" data-act="rpe" data-v="${v}" data-k="${k}" data-day="${day.id}" data-date="${date}">${v}</button>`).join('')}</div>
        </div>
        <label class="toggle"><input type="checkbox" id="pain-${day.id}" data-act="pain" data-k="${k}" data-day="${day.id}" data-date="${date}" ${rec && rec.pain ? 'checked' : ''}> Có đau bất thường (khớp, đau nhói, tê…)</label>
        <label class="note-l" for="note-${day.id}">Ghi chú (chỗ đau, cảm giác, máy bận…)</label>
        <textarea id="note-${day.id}" rows="2" data-f="note" data-k="${k}" data-day="${day.id}" data-date="${date}" placeholder="Ví dụ: gối phải hơi khó chịu ở bài Leg Press">${esc(rec && rec.note || '')}</textarea>
        <button type="button" class="btn ${p.completed ? 'btn-done' : 'btn-primary'} btn-wide" data-act="complete" data-k="${k}" data-day="${day.id}" data-date="${date}">${ICON.check}${p.completed ? 'Đã hoàn thành — bấm để bỏ đánh dấu' : 'Hoàn thành buổi tập'}</button>
      </section>`;
  }

  /* ───────── cửa sổ bài tập + video ───────── */
  let modalState = null; // { day, ex, alt, pushed, opener }

  function openModal(dayId, exId, altId, opener) {
    const day = DAY[dayId];
    if (!day || !EX[exId] || (altId && !EX[altId])) return;
    modalState = { day, ex: exId, alt: altId || null, opener: opener || modalState && modalState.opener || null, tab: 'main' };
    renderModal();
  }

  function renderModal() {
    const { day, ex, alt } = modalState;
    const order = dayOrder(day);
    const pos = order.findIndex(i => i.ex === ex);
    const item = order[pos] || { ex, kind: 'gym' };
    const showId = alt || ex;
    const e = EX[showId];
    const date = logDate(day);
    const ctx = ctxFor(day, date);
    const r = rx(item, ctx);
    const prev = order[pos - 1], next = order[pos + 1];
    const clip = CLIPS[showId];
    const tabs = [];
    if (clip) tabs.push({ id: 'clip', label: 'Clip tự làm' });
    if (e.video) tabs.push({ id: 'main', label: VID[e.video] && VID[e.video].lang === 'vi' ? 'Video (tiếng Việt)' : 'Video hướng dẫn' });
    if (e.videoVi) tabs.push({ id: 'vi', label: 'Bản tiếng Việt' });
    if (!tabs.some(t => t.id === modalState.tab)) modalState.tab = tabs.length ? tabs[0].id : null;
    const tab = modalState.tab;
    const vId = tab === 'vi' ? e.videoVi : e.video;
    const v = VID[vId];
    const role = item.role === 'warmup' ? 'Khởi động' : item.role === 'cooldown' ? 'Thả lỏng' : 'Bài ' + order.filter(i => !i.role).indexOf(item) + 1;
    const label = item.role ? role : 'Bài ' + (order.filter(i => !i.role).indexOf(item) + 1) + '/' + order.filter(i => !i.role).length;

    const list = (arr, cls) => arr && arr.length ? `<ul class="${cls || ''}">${arr.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : '<p class="muted">—</p>';
    const alts = (e.alts || []).map(a => a.id && EX[a.id]
      ? `<button type="button" class="altchip" data-act="alt" data-day="${day.id}" data-ex="${ex}" data-alt="${a.id}">${media(a.id, 'mini')}<span><b>${esc(EX[a.id].vi)}</b>${a.why ? '<span>' + esc(a.why) + '</span>' : ''}</span></button>`
      : `<div class="altchip is-text"><span><b>${esc(a.text)}</b></span></div>`).join('');

    modalRoot.innerHTML = `
      <div class="scrim" data-act="close"></div>
      <div class="sheet" role="dialog" aria-modal="true" aria-labelledby="sheet-title">
        <div class="sheet-bar">
          <div class="sheet-ttl">
            <p class="eyebrow">${esc(label)} · ${esc(day.name)} — ${esc(day.title)}</p>
            <h2 id="sheet-title">${esc(e.vi)}</h2>
            <p class="en">${esc(e.en)}</p>
          </div>
          <button type="button" class="iconbtn" data-act="close" aria-label="Đóng, quay lại giáo án">${ICON.close}</button>
        </div>
        <div class="sheet-scroll" id="sheet-scroll">
          ${alt ? `<div class="banner tone-info"><b>Bài thay thế cho “${esc(EX[ex].vi)}”</b><span>Làm cùng số hiệp, số lần như bài gốc. <button type="button" class="link" data-act="alt" data-day="${day.id}" data-ex="${ex}" data-alt="">← Quay lại bài gốc</button></span></div>` : ''}
          ${tabs.length > 1 ? `<div class="vtabs" role="tablist">${tabs.map(t => `<button type="button" role="tab" aria-selected="${t.id === tab}" data-act="vtab" data-v="${t.id}">${esc(t.label)}</button>`).join('')}</div>` : ''}
          ${tabs.length ? `<div class="vp" id="vp"></div>
            ${tab !== 'clip' && v ? `<p class="vsrc">Video: <b>${esc(v.title)}</b> — ${esc(v.ch)}${v.dur ? ' · ' + v.dur : ''}</p>` : ''}
            ${tab === 'vi' && e.videoViNote ? `<p class="vsrc">${esc(e.videoViNote)}</p>` : ''}
            ${tab === 'main' && v && v.lang === 'en' ? '<p class="vsrc muted">Video tiếng Anh — xem hình là đủ; các bước bằng tiếng Việt ở bên dưới.</p>' : ''}`
          : `<div class="novideo">${media(showId)}<p>Hoạt động này không cần video — làm theo các bước bên dưới.</p></div>`}

          <div class="rxbox">
            <h3>Hôm nay</h3>
            ${r.skip ? `<p class="skipnote">${esc(r.reason)}</p>` : rxChips(item, r)}
            ${e.load ? `<p class="load"><b>Mức tạ khởi điểm:</b> ${esc(e.load)}</p>` : ''}
          </div>

          ${item.sets && !alt && !r.skip ? `<section class="msec"><h3>Ghi hiệp</h3>${loggerHTML(day, date, item, r, 'modal')}
            <div class="ex-actions">${item.rest ? `<button type="button" class="btn btn-ghost" data-act="rest" data-sec="${item.rest}">${ICON.clock}Nghỉ ${fmtRest(item.rest)}</button>` : ''}</div></section>` : ''}

          ${e.photos ? `<div class="poses"><figure><img src="img/ex/${showId}-0.jpg" alt="${esc(e.vi)} — tư thế bắt đầu" loading="lazy"><figcaption>Tư thế bắt đầu</figcaption></figure><figure><img src="img/ex/${showId}-1.jpg" alt="${esc(e.vi)} — tư thế kết thúc" loading="lazy"><figcaption>Tư thế kết thúc</figcaption></figure></div>` : ''}

          <section class="msec"><h3>Các bước thực hiện</h3><ol class="steps">${(e.steps || []).map(s => `<li>${esc(s)}</li>`).join('')}</ol></section>
          ${e.breath && e.breath !== '—' ? `<section class="msec"><h3>Cách thở</h3><p>${esc(e.breath)}</p></section>` : ''}
          <section class="msec"><h3>Lỗi người mới hay mắc</h3>${list(e.mistakes, 'dots')}</section>
          ${e.stop && e.stop.length ? `<section class="msec msec-warn"><h3>Giảm tạ hoặc dừng khi</h3>${list(e.stop, 'dots')}</section>` : ''}
          ${alts ? `<section class="msec"><h3>Bài thay thế (máy bận / chưa đủ kỹ thuật)</h3><div class="alts">${alts}</div></section>` : ''}
          <dl class="facts"><div><dt>Nhóm cơ chính</dt><dd>${esc(e.muscles)}</dd></div><div><dt>Dụng cụ</dt><dd>${esc(e.equip)}</dd></div></dl>
        </div>
        <div class="sheet-foot">
          ${prev ? `<button type="button" class="btn btn-ghost fbtn" data-act="nav" data-day="${day.id}" data-ex="${prev.ex}" aria-label="Bài trước: ${esc(EX[prev.ex].vi)}"><span class="fb-k">← Trước</span><span class="fb-n">${esc(EX[prev.ex].vi)}</span></button>` : '<span></span>'}
          ${next ? `<button type="button" class="btn btn-primary fbtn" data-act="nav" data-day="${day.id}" data-ex="${next.ex}" aria-label="Bài tiếp theo: ${esc(EX[next.ex].vi)}"><span class="fb-k">Bài tiếp →</span><span class="fb-n">${esc(EX[next.ex].vi)}</span></button>`
            : `<button type="button" class="btn btn-primary fbtn" data-act="close"><span class="fb-k">Hết bài</span><span class="fb-n">Quay lại giáo án</span></button>`}
        </div>
      </div>`;
    document.documentElement.classList.add('modal-open');
    const vp = document.getElementById('vp');
    if (vp) {
      const others = [e.video, e.videoVi].filter(x => x && x !== vId);
      VideoPlayer.mount(vp, {
        videoId: tab === 'clip' ? (e.video || e.videoVi || null) : vId,
        fallbackIds: tab === 'clip' ? [e.videoVi].filter(x => x && x !== e.video) : others,
        clip: tab === 'clip' ? clip : null, title: e.vi,
        pageLink: SITE + '#' + day.id + '--' + showId,
        poster: e.photos ? 'img/ex/' + showId + '-0.jpg' : e.video ? 'img/yt/' + e.video + '.jpg' : null
      });
    }
    const closeBtn = modalRoot.querySelector('.sheet-bar .iconbtn');
    if (closeBtn) closeBtn.focus({ preventScroll: true });
  }

  function closeModalUI() {
    if (!modalState) return;
    const opener = modalState.opener;
    VideoPlayer.unmount();
    modalRoot.innerHTML = '';
    document.documentElement.classList.remove('modal-open');
    modalState = null;
    render();
    if (opener) {
      const el = document.getElementById(opener);
      if (el) { el.scrollIntoView({ block: 'center' }); const b = el.querySelector('.ex-media, .strip'); (b || el).focus({ preventScroll: true }); }
    }
  }

  /* ───────── trang: tiến độ ───────── */
  function viewProgress() {
    const t = today(), mon = mondayOf(t), c = cfg(), st = Store.status();
    const stats = weekStats(mon);
    const sessions = Store.allSessions();
    const weeks = [];
    for (let i = 1; i <= 5; i++) { const m = addDays(mon, -7 * i); const w = weekStats(m); if (w.gym || w.court || Object.keys(w.days).length) weeks.push({ m, w }); }

    // dòng thời gian giai đoạn
    const span = Math.max(1, diff(c.tournament, c.start));
    const pct = d => Math.min(100, Math.max(0, diff(d, c.start) / span * 100));
    const tl = `<div class="timeline" aria-label="Các giai đoạn tới giải">
      <div class="tl-bar">
        <span class="tl-seg seg-lq" style="left:0;width:${pct(addDays(c.start, 14))}%">Làm quen</span>
        <span class="tl-seg seg-tt" style="left:${pct(addDays(c.start, 14))}%;width:${pct(addDays(c.tournament, -9)) - pct(addDays(c.start, 14))}%">Tăng tiến</span>
        <span class="tl-seg seg-gt" style="left:${pct(addDays(c.tournament, -9))}%;width:${100 - pct(addDays(c.tournament, -9))}%">Giảm tải</span>
        <span class="tl-now ${pct(t) < 12 ? 'is-start' : pct(t) > 88 ? 'is-end' : ''}" style="left:${pct(t)}%"><span>Hôm nay</span></span>
      </div>
      <div class="tl-ends"><span>${fmtDay(c.start)}</span><span>Giải ${fmtDay(c.tournament)}</span></div>
    </div>`;

    const exIds = [...new Set(sessions.flatMap(s => Object.keys(s.items || {}).filter(id => (s.items[id].sets || []).some(x => x && (x.w || x.r)))))];
    if (!ui.exHist || !exIds.includes(ui.exHist)) ui.exHist = exIds[0] || null;
    const exRows = ui.exHist ? sessions.filter(s => s.items && s.items[ui.exHist] && (s.items[ui.exHist].sets || []).some(x => x && (x.w || x.r)))
      .map(s => {
        const sets = s.items[ui.exHist].sets.filter(x => x && (x.w || x.r));
        const best = sets.reduce((m, x) => Math.max(m, parseFloat(x.w) || 0), 0);
        return `<tr><td>${fmtDay(s.date)}</td><td>${sets.map(x => fmtSet(x)).join(' · ')}</td><td class="num">${best ? best + ' kg' : '—'}</td></tr>`;
      }).join('') : '';

    const hist = sessions.length ? sessions.map(s => {
      const d = DAY[s.dayId];
      if (!d) return '';
      const items = Object.entries(s.items || {});
      const doneN = items.filter(([, v]) => v.done).length;
      const ck = P.checkins.find(x => x.id === s.checkin);
      const confirmDel = ui.confirm === 'del:' + s.key;
      return `<details class="hist" ${ui.openHistory === s.key ? 'open' : ''} data-key="${s.key}">
        <summary><span class="h-date">${fmtDay(s.date)}</span><span class="h-t">${esc(d.short)} · ${esc(d.title)}</span>
          <span class="h-tags">${s.completed ? `<span class="tag tag-ok">Hoàn thành</span>` : `<span class="tag">Xong ${doneN} mục</span>`}${ck ? `<span class="tag ck-${ck.id}">${esc(ck.label)}</span>` : ''}${s.rpe ? `<span class="tag">Mệt ${s.rpe}/10</span>` : ''}${s.pain ? '<span class="tag tag-warn">Có đau</span>' : ''}</span></summary>
        <div class="h-body">
          ${items.length ? `<ul>${items.map(([id, v]) => `<li><b>${esc(EX[id] ? EX[id].vi : id)}</b>${v.done ? ' ✓' : ''}${(v.sets || []).filter(x => x && (x.w || x.r)).length ? ': ' + v.sets.filter(x => x && (x.w || x.r)).map(x => fmtSet(x)).join(' · ') : ''}</li>`).join('')}</ul>` : '<p class="muted">Chưa ghi bài nào.</p>'}
          ${s.note ? `<p><b>Ghi chú:</b> ${esc(s.note)}</p>` : ''}
          <div class="h-act"><a class="btn btn-ghost" href="#${d.id}" data-act="goto-session" data-day="${d.id}" data-date="${s.date}">Mở buổi này</a>
          <button type="button" class="btn ${confirmDel ? 'btn-danger' : 'btn-ghost'}" data-act="del-session" data-k="${s.key}">${confirmDel ? 'Bấm lần nữa để xoá' : 'Xoá buổi'}</button></div>
        </div></details>`;
    }).join('') : `<div class="empty"><b>Chưa có buổi nào được ghi.</b><p>Mở một ngày tập, chọn cảm giác hôm nay, ghi tạ từng hiệp và bấm “Hoàn thành buổi tập”. Kết quả sẽ hiện ở đây.</p><a class="btn btn-primary" href="#hom-nay">Mở buổi hôm nay</a></div>`;

    const statusText = st.cloud === 'on' ? 'Đang lưu trên máy này và đồng bộ vào tài khoản Claude của bạn — mở link này trên máy khác (đã đăng nhập) vẫn thấy.'
      : st.cloud === 'connecting' ? 'Đang kết nối bộ lưu của claude.ai…'
      : st.cloud === 'error' ? 'Chưa đồng bộ được với claude.ai; dữ liệu vẫn lưu trên máy này.'
      : 'Dữ liệu chỉ lưu trong trình duyệt của máy này. Đổi điện thoại, dùng tab ẩn danh hoặc xoá dữ liệu trình duyệt sẽ mất — hãy “Sao lưu” định kỳ.';

    app.innerHTML = `
      <header class="pagehead"><p class="eyebrow">Theo dõi</p><h1>Tiến độ</h1></header>
      <section class="card">
        <div class="card-head"><h2>Tuần này</h2><span class="muted">${fmtDM(mon)} – ${fmtDM(addDays(mon, 6))}</span></div>
        <div class="weekbig">
          <div class="wb"><b class="num">${stats.gym}<small>/5</small></b><span>buổi gym</span><div class="bar"><span style="width:${Math.min(100, stats.gym / 5 * 100)}%"></span></div></div>
          <div class="wb"><b class="num">${stats.court}<small>/2</small></b><span>buổi bóng rổ</span><div class="bar bar-orange"><span style="width:${Math.min(100, stats.court / 2 * 100)}%"></span></div></div>
        </div>
        ${weekDots(mon, stats)}
        ${weeks.length ? `<h3 class="sm">Các tuần trước</h3><ul class="weeks">${weeks.map(x => `<li><span>Tuần ${fmtDM(x.m)}</span><span class="num">${x.w.gym}/5 gym · ${x.w.court}/2 sân</span></li>`).join('')}</ul>` : ''}
      </section>
      <section class="card"><div class="card-head"><h2>Lộ trình tới giải</h2><span class="muted">Giai đoạn hiện tại: ${esc(P.phases[phaseFor(t).id].name)}</span></div>${tl}</section>
      <section class="card"><div class="card-head"><h2>Lịch sử buổi tập</h2><span class="muted">${sessions.length} buổi</span></div>${hist}</section>
      <section class="card">
        <div class="card-head"><h2>Mức tạ theo bài</h2></div>
        ${exIds.length ? `<label class="field" for="exhist">Chọn bài
          <select id="exhist">${exIds.map(id => `<option value="${id}" ${id === ui.exHist ? 'selected' : ''}>${esc(EX[id] ? EX[id].vi : id)}</option>`).join('')}</select></label>
          <div class="tablewrap"><table><thead><tr><th>Ngày</th><th>Các hiệp</th><th>Nặng nhất</th></tr></thead><tbody>${exRows}</tbody></table></div>`
          : '<p class="muted">Ghi tạ ở ít nhất một bài để xem lịch sử ở đây.</p>'}
      </section>
      <section class="card" id="caidat">
        <div class="card-head"><h2>Cài đặt lịch</h2></div>
        <div class="form">
          <label class="field" for="set-start">Ngày bắt đầu giáo án (Thứ 2 tuần đầu)<input type="date" id="set-start" value="${c.start}"></label>
          <label class="field" for="set-tour">Ngày thi đấu giải chính<input type="date" id="set-tour" value="${c.tournament}"><span class="hint">Mặc định 28/11/2026 cho “cuối tháng 11” — đổi thành ngày thật.</span></label>
          <div class="field"><span>Các trận khác (giao hữu, vòng sau…)</span>
            <ul class="games">${c.games.map(g => `<li><span>${fmtDay(g)} · ${g.slice(0, 4)}</span><button type="button" class="link" data-act="del-game" data-v="${g}">Xoá</button></li>`).join('') || '<li class="muted">Chưa có.</li>'}</ul>
            <div class="row"><input type="date" id="new-game" aria-label="Ngày trận mới"><button type="button" class="btn btn-line" data-act="add-game">Thêm trận</button></div>
            <span class="hint">Buổi chân trong 3 ngày trước trận và mọi buổi trước trận 1 ngày sẽ tự chuyển sang bản nhẹ.</span>
          </div>
          <label class="toggle"><input type="checkbox" id="set-autorest" ${c.autoRest ? 'checked' : ''}> Tự bật đồng hồ nghỉ khi đánh dấu xong một hiệp</label>
        </div>
      </section>
      <section class="card">
        <div class="card-head"><h2>Dữ liệu</h2></div>
        <p class="status ${st.cloud === 'on' ? 'is-ok' : ''}">${esc(statusText)}</p>
        ${st.localOK ? '' : '<p class="status is-warn">Trình duyệt đang chặn lưu dữ liệu (có thể là tab ẩn danh). Kết quả sẽ mất khi đóng trang.</p>'}
        <div class="row wrap">
          <button type="button" class="btn btn-line" data-act="export">Sao lưu (sao chép dữ liệu)</button>
          <button type="button" class="btn btn-ghost" data-act="show-import">Khôi phục từ bản sao lưu</button>
          <button type="button" class="btn ${ui.confirm === 'clear' ? 'btn-danger' : 'btn-ghost'}" data-act="clear">${ui.confirm === 'clear' ? 'Bấm lần nữa để xoá hết' : 'Xoá toàn bộ dữ liệu'}</button>
        </div>
        <div id="io" class="io" hidden>
          <label class="field" for="io-text"><span id="io-label">Dữ liệu</span><textarea id="io-text" rows="5" spellcheck="false"></textarea></label>
          <div class="row"><button type="button" class="btn btn-primary" data-act="do-import" id="io-go" hidden>Khôi phục</button><span id="io-msg" class="muted" role="status"></span></div>
        </div>
      </section>`;
  }

  /* ───────── trang: hướng dẫn ───────── */
  function viewGuide() {
    const howto = {
      id: 'cach-dung', title: 'Cách dùng ở phòng tập',
      body: [
        'Mở web → chọn ngày (hoặc “Hôm nay”) → bấm vào ảnh bài tập → xem video, các bước, lỗi hay gặp → đóng cửa sổ hoặc bấm “Bài tiếp” để sang bài sau.',
        'Đầu buổi chọn “Hôm nay bạn thấy thế nào?” — số hiệp tự điều chỉnh theo cảm giác.',
        'Mỗi hiệp: nhập kg và số lần, bấm ✓. Đồng hồ nghỉ tự chạy (tắt được trong Tiến độ → Cài đặt). Bỏ trống mà bấm ✓ thì web điền lại số của lần trước.',
        'Cuối buổi: chấm mức mệt 1–10, đánh dấu nếu có đau, bấm “Hoàn thành buổi tập”.',
        VideoPlayer.inArtifact
          ? 'Bản trên claude.ai không cho phát video trong trang (giới hạn của claude.ai): bấm thẻ video sẽ mở đúng bài đó trên https://datttvtthair-oss.github.io — nơi video tự phát ngay trong trang. Nên dùng thẳng link đó ở phòng tập.'
          : 'Bấm ảnh bài tập là video tự phát ngay trong trang, không chuyển sang YouTube. Điện thoại chặn tiếng thì video vẫn phát không tiếng — bấm “Bật tiếng”. Video nào lỗi, web tự chuyển sang video dự phòng của bài đó.',
        'Ảnh động tác: Free Exercise DB (public domain). Video: các kênh hướng dẫn trên YouTube, ghi rõ nguồn dưới mỗi video.'
      ]
    };
    const sections = [howto].concat(P.guide);
    app.innerHTML = `
      <header class="pagehead"><p class="eyebrow">Đọc một lần, dùng cả mùa</p><h1>Hướng dẫn</h1></header>
      <nav class="toc" aria-label="Mục lục">${sections.map(s => `<a href="#huong-dan--${s.id}">${esc(s.title)}</a>`).join('')}</nav>
      ${sections.map(s => `<section class="card guide ${s.id === 'safety' ? 'guide-safety' : ''}" id="g-${s.id}"><h2>${esc(s.title)}</h2>${s.body.map(p => `<p>${esc(p)}</p>`).join('')}</section>`).join('')}`;
  }

  /* ───────── đồng hồ nghỉ ───────── */
  const Timer = {
    end: 0, total: 0, tick: null, lock: null, audio: null, doneShow: null,
    start(sec) {
      this.total = sec; this.end = Date.now() + sec * 1000;
      clearTimeout(this.doneShow);
      try { if (!this.audio) this.audio = new (window.AudioContext || window.webkitAudioContext)(); if (this.audio.state === 'suspended') this.audio.resume(); } catch (e) { this.audio = null; }
      if (navigator.wakeLock && !this.lock) navigator.wakeLock.request('screen').then(l => { this.lock = l; }).catch(() => {});
      clearInterval(this.tick);
      this.tick = setInterval(() => this.draw(), 250);
      this.draw();
    },
    add(d) { if (!this.tick) return; this.end += d * 1000; this.total = Math.max(this.total + d, 1); this.draw(); },
    stop() {
      clearInterval(this.tick); this.tick = null;
      if (this.lock) { this.lock.release().catch(() => {}); this.lock = null; }
      timerRoot.hidden = true; timerRoot.innerHTML = '';
    },
    beep() {
      if (!this.audio) return;
      try {
        const a = this.audio, now = a.currentTime;
        [0, 0.28].forEach(off => {
          const o = a.createOscillator(), g = a.createGain();
          o.frequency.value = 880; o.connect(g); g.connect(a.destination);
          g.gain.setValueAtTime(0.0001, now + off); g.gain.exponentialRampToValueAtTime(0.3, now + off + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, now + off + 0.22);
          o.start(now + off); o.stop(now + off + 0.24);
        });
      } catch (e) { /* bỏ qua */ }
    },
    draw() {
      const left = Math.max(0, Math.ceil((this.end - Date.now()) / 1000));
      timerRoot.hidden = false;
      if (left <= 0) {
        clearInterval(this.tick); this.tick = null;
        this.beep();
        try { if (navigator.vibrate) navigator.vibrate([200, 100, 200]); } catch (e) { /* bỏ qua */ }
        timerRoot.innerHTML = `<div class="tm is-done" role="alert"><b>Hết giờ nghỉ — vào hiệp tiếp!</b><button type="button" class="btn btn-ghost" data-act="timer-stop">Đóng</button></div>`;
        this.doneShow = setTimeout(() => this.stop(), 6000);
        return;
      }
      const pct = 100 - left / this.total * 100;
      timerRoot.innerHTML = `<div class="tm" role="timer" aria-live="off">
        <span class="tm-k">Nghỉ</span><b class="tm-t num">${fmtRest(left)}</b>
        <div class="tm-bar"><span style="width:${pct}%"></span></div>
        <button type="button" class="btn btn-ghost" data-act="timer-add" data-v="-15">−15s</button>
        <button type="button" class="btn btn-ghost" data-act="timer-add" data-v="15">+15s</button>
        <button type="button" class="btn btn-line" data-act="timer-stop">Bỏ qua</button></div>`;
    }
  };

  /* ───────── định tuyến ───────── */
  function route() {
    const h = decodeURIComponent((location.hash || '').slice(1));
    if (h === 'hom-nay') return { view: 'day', day: dayByDow(new Date().getDay()).id, redirect: true };
    if (h === 'tien-do') return { view: 'progress' };
    if (h.startsWith('huong-dan')) return { view: 'guide', sec: h.split('--')[1] || null };
    const parts = h.split('--');
    if (DAY[parts[0]]) return { view: 'day', day: parts[0], ex: parts[1] || null, alt: parts[2] || null };
    return { view: 'week' };
  }

  let current = null;
  function render() {
    const r = route();
    current = r;
    document.querySelectorAll('.nav a').forEach(a => {
      const v = a.dataset.view;
      const on = v === r.view || (v === 'today' && r.view === 'day' && r.day === dayByDow(new Date().getDay()).id);
      if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
    if (r.view === 'day') viewDay(r.day);
    else if (r.view === 'progress') viewProgress();
    else if (r.view === 'guide') viewGuide();
    else viewWeek();
  }

  function onHash() {
    const r = route();
    if (r.redirect) { location.replace('#' + r.day); return; }
    const wasModal = !!modalState;
    if (r.view === 'day' && r.ex) {
      if (!wasModal || modalState.day.id !== r.day) { render(); window.scrollTo(0, 0); }
      openModal(r.day, r.ex, r.alt, wasModal ? null : 'ex-' + r.ex);
      return;
    }
    if (wasModal) { pushedModal = false; closeModalUI(); return; }
    render();
    if (r.view === 'guide' && r.sec) {
      const el = document.getElementById('g-' + r.sec);
      if (el) el.scrollIntoView({ block: 'start' });
    } else {
      window.scrollTo(0, 0);
    }
  }

  let pushedModal = false; // cửa sổ mở bằng cách thêm 1 mục lịch sử → đóng bằng history.back()
  function goModal(dayId, exId, altId) {
    const h = '#' + dayId + '--' + exId + (altId ? '--' + altId : '');
    if (modalState) location.replace(h);
    else { pushedModal = true; location.hash = h; }
  }

  function requestClose() {
    if (!modalState) return;
    const dayId = modalState.day.id;
    if (pushedModal) {
      pushedModal = false;
      history.back();
      setTimeout(() => { if (modalState) location.replace('#' + dayId); }, 400);
    } else {
      location.replace('#' + dayId);
    }
  }

  /* ───────── cập nhật dữ liệu ───────── */
  function baseFor(el) { return { date: el.dataset.date, dayId: el.dataset.day }; }

  function setField(el) {
    const k = el.dataset.k, ex = el.dataset.ex, i = +el.dataset.i, f = el.dataset.f;
    Store.update(k, baseFor(el), rec => {
      if (f === 'note') { rec.note = el.value; return; }
      const it = rec.items[ex] || (rec.items[ex] = { sets: [], done: false });
      while (it.sets.length <= i) it.sets.push({});
      it.sets[i] = Object.assign({}, it.sets[i], { [f]: el.value.trim() });
    }, true);
    // đồng bộ ô cùng hiệp ở thẻ và cửa sổ
    document.querySelectorAll(`[data-f="${f}"][data-ex="${ex}"][data-i="${i}"]`).forEach(o => { if (o !== el) o.value = el.value; });
  }

  function refreshAfterChange(exId) {
    if (modalState) {
      const keep = document.getElementById('sheet-scroll');
      const top = keep ? keep.scrollTop : 0;
      const lg = modalRoot.querySelector('.msec .logger');
      if (lg && current && current.view === 'day') {
        const day = modalState.day, date = logDate(day);
        const item = dayOrder(day).find(i => i.ex === modalState.ex);
        if (item && item.sets) lg.outerHTML = loggerHTML(day, date, item, rx(item, ctxFor(day, date)), 'modal');
      }
      if (keep) keep.scrollTop = top;
      return; // thẻ phía sau sẽ vẽ lại khi đóng cửa sổ
    }
    const y = window.scrollY;
    render();
    window.scrollTo(0, y);
    if (exId) { /* giữ vị trí */ }
  }

  /* ───────── sự kiện ───────── */
  document.addEventListener('click', ev => {
    const el = ev.target.closest('[data-act]');
    if (!el) return;
    const act = el.dataset.act;
    switch (act) {
      case 'open': goModal(el.dataset.day, el.dataset.ex); break;
      case 'nav': goModal(el.dataset.day, el.dataset.ex); document.getElementById('sheet-scroll') && (document.getElementById('sheet-scroll').scrollTop = 0); break;
      case 'alt': goModal(el.dataset.day, el.dataset.ex, el.dataset.alt || null); break;
      case 'close': requestClose(); break;
      case 'vtab': modalState.tab = el.dataset.v; renderModal(); break;
      case 'checkin': {
        const v = el.dataset.v;
        Store.update(el.dataset.k, baseFor(el), rec => { rec.checkin = rec.checkin === v ? null : v; });
        refreshAfterChange(); break;
      }
      case 'set-done': {
        const k = el.dataset.k, ex = el.dataset.ex, i = +el.dataset.i;
        const day = DAY[el.dataset.day], date = el.dataset.date;
        const item = dayOrder(day).find(x => x.ex === ex);
        const r = rx(item, ctxFor(day, date));
        let nowDone = false, allDone = false;
        Store.update(k, baseFor(el), rec => {
          const it = rec.items[ex] || (rec.items[ex] = { sets: [], done: false });
          while (it.sets.length <= i) it.sets.push({});
          const s = Object.assign({}, it.sets[i]);
          s.done = !s.done; nowDone = s.done;
          if (s.done) { // ô trống → lấy số lần trước (đang hiện mờ)
            const row = el.closest('.set');
            row.querySelectorAll('input[data-f]').forEach(inp => { if (!inp.value && inp.placeholder) s[inp.dataset.f] = inp.placeholder; });
          }
          it.sets[i] = s;
          allDone = it.sets.slice(0, r.sets).filter(x => x && x.done).length >= r.sets;
          if (allDone) it.done = true;
          else if (!s.done) it.done = false;
        });
        if (nowDone && cfg().autoRest && item.rest && !allDone) Timer.start(item.rest);
        refreshAfterChange(ex); break;
      }
      case 'add-set': {
        const ex = el.dataset.ex;
        Store.update(el.dataset.k, baseFor(el), rec => {
          const it = rec.items[ex] || (rec.items[ex] = { sets: [], done: false });
          const day = DAY[el.dataset.day], item = dayOrder(day).find(x => x.ex === ex);
          const n = Math.max(it.sets.length, rx(item, ctxFor(day, el.dataset.date)).sets);
          while (it.sets.length <= n) it.sets.push({});
        });
        refreshAfterChange(ex); break;
      }
      case 'ex-done': {
        const ex = el.dataset.ex;
        Store.update(keyOf(el.dataset.date, el.dataset.day), baseFor(el), rec => {
          const it = rec.items[ex] || (rec.items[ex] = { sets: [], done: false });
          it.done = !it.done;
        });
        refreshAfterChange(ex); break;
      }
      case 'rpe': {
        const v = +el.dataset.v;
        Store.update(el.dataset.k, baseFor(el), rec => { rec.rpe = rec.rpe === v ? null : v; });
        refreshAfterChange(); break;
      }
      case 'complete': {
        let nowDone = false;
        Store.update(el.dataset.k, baseFor(el), rec => { rec.completed = !rec.completed; rec.completedAt = rec.completed ? Date.now() : null; nowDone = rec.completed; });
        refreshAfterChange();
        if (nowDone) toast('Đã lưu buổi tập. Xem lại ở tab Tiến độ.');
        break;
      }
      case 'rest': Timer.start(+el.dataset.sec); break;
      case 'timer-add': Timer.add(+el.dataset.v); break;
      case 'timer-stop': Timer.stop(); break;
      case 'goto-session': { ui.dates[el.dataset.day] = el.dataset.date; break; }
      case 'del-session': {
        const k = el.dataset.k;
        if (ui.confirm === 'del:' + k) { ui.confirm = null; Store.remove(k); toast('Đã xoá buổi tập.'); }
        else { ui.confirm = 'del:' + k; ui.openHistory = k; }
        render(); break;
      }
      case 'add-game': {
        const v = document.getElementById('new-game').value;
        if (!validDate(v)) { toast('Chọn ngày trận trước khi bấm Thêm.'); break; }
        const g = cfg().games; if (!g.includes(v)) Store.setSetting('games', g.concat(v).sort());
        render(); break;
      }
      case 'del-game': Store.setSetting('games', cfg().games.filter(g => g !== el.dataset.v)); render(); break;
      case 'export': {
        const io = document.getElementById('io'), ta = document.getElementById('io-text');
        io.hidden = false; document.getElementById('io-label').textContent = 'Bản sao lưu (đã chọn sẵn — dán vào ghi chú/Zalo để giữ)';
        document.getElementById('io-go').hidden = true;
        ta.value = Store.exportJSON(); ta.focus(); ta.select();
        const msg = document.getElementById('io-msg');
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(ta.value).then(() => { msg.textContent = 'Đã sao chép vào bộ nhớ tạm.'; }, () => { msg.textContent = 'Hãy giữ ngón tay lên ô để sao chép.'; });
        } else msg.textContent = 'Hãy sao chép nội dung trong ô.';
        break;
      }
      case 'show-import': {
        const io = document.getElementById('io');
        io.hidden = false; document.getElementById('io-label').textContent = 'Dán bản sao lưu vào đây';
        document.getElementById('io-text').value = ''; document.getElementById('io-go').hidden = false;
        document.getElementById('io-msg').textContent = ''; document.getElementById('io-text').focus();
        break;
      }
      case 'do-import': {
        const msg = document.getElementById('io-msg');
        try { const n = Store.importJSON(document.getElementById('io-text').value); toast('Đã khôi phục ' + n + ' buổi tập.'); render(); }
        catch (e) { msg.textContent = 'Không đọc được: ' + (e.message || 'dữ liệu sai định dạng') + '. Hãy dán đúng toàn bộ bản sao lưu.'; }
        break;
      }
      case 'clear': {
        if (ui.confirm === 'clear') { ui.confirm = null; Store.clearAll(); toast('Đã xoá toàn bộ dữ liệu.'); }
        else ui.confirm = 'clear';
        render(); break;
      }
    }
  });

  document.addEventListener('input', ev => {
    const el = ev.target;
    if (el.matches('[data-f][data-k]')) setField(el);
  });

  document.addEventListener('change', ev => {
    const el = ev.target;
    if (el.id === 'logdate' && validDate(el.value)) { ui.dates[el.dataset.day] = el.value; render(); }
    else if (el.id === 'set-start' && validDate(el.value)) { Store.setSetting('programStart', el.value); render(); }
    else if (el.id === 'set-tour' && validDate(el.value)) { Store.setSetting('tournament', el.value); render(); }
    else if (el.id === 'set-autorest') Store.setSetting('autoRest', el.checked);
    else if (el.id === 'exhist') { ui.exHist = el.value; render(); }
    else if (el.dataset.act === 'pain') { Store.update(el.dataset.k, baseFor(el), rec => { rec.pain = el.checked; }); }
  });

  document.addEventListener('toggle', ev => {
    const d = ev.target;
    if (d.classList && d.classList.contains('hist')) ui.openHistory = d.open ? d.dataset.key : (ui.openHistory === d.dataset.key ? null : ui.openHistory);
  }, true);

  document.addEventListener('keydown', ev => { if (ev.key === 'Escape' && modalState) requestClose(); });

  let toastT = null;
  function toast(msg) {
    const t = document.getElementById('toast');
    t.textContent = msg; t.hidden = false;
    clearTimeout(toastT); toastT = setTimeout(() => { t.hidden = true; }, 3200);
  }

  // dữ liệu từ claude.ai về → vẽ lại nếu người dùng không đang gõ
  Store.onChange(() => {
    const a = document.activeElement;
    if (a && (a.tagName === 'INPUT' || a.tagName === 'TEXTAREA')) return;
    if (!modalState) { const y = window.scrollY; render(); window.scrollTo(0, y); }
    const s = document.getElementById('sync');
    if (s) { const st = Store.status(); s.dataset.state = st.cloud; s.textContent = st.cloud === 'on' ? 'Đã đồng bộ' : st.cloud === 'connecting' ? 'Đang kết nối…' : 'Lưu trên máy này'; }
  });

  window.addEventListener('hashchange', onHash);
  onHash();
})();
