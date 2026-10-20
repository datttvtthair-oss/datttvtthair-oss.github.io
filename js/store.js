/*
 * Lưu tiến độ tập.
 *  - Luôn lưu vào localStorage của trình duyệt (dùng được cả khi mất mạng ở phòng tập).
 *  - Khi trang chạy dưới dạng Artifact trên claude.ai và có quyền `db`, đồng bộ thêm vào
 *    vùng dữ liệu riêng của người xem (data/users/<id>/...) → mở trên máy khác vẫn thấy.
 * Một buổi tập = một bản ghi, khoá "YYYY-MM-DD_<mã ngày>", ví dụ "2026-10-20_t2".
 */
(function () {
  const KEY = 'giaoan-gym:v1';
  const listeners = new Set();
  let localOK = true;
  let cloud = 'off';          // 'off' | 'connecting' | 'on' | 'error'
  let col = null;             // db collection của người xem
  const timers = new Map();   // docId → timeout ghi trễ
  const busy = new Set();     // docId đang ghi (mỗi doc ghi lần lượt)

  function blank() { return { v: 1, settings: {}, settingsAt: 0, sessions: {} }; }

  function readLocal() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const s = JSON.parse(raw);
        if (s && s.v === 1 && s.sessions) return s;
      }
    } catch (e) { localOK = false; }
    return blank();
  }

  let state = readLocal();

  function persist() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); localOK = true; }
    catch (e) { localOK = false; }
  }

  function emit() { listeners.forEach(fn => { try { fn(); } catch (e) { console.error(e); } }); }

  /* ── đồng bộ claude.ai (chỉ có khi chạy trong Artifact) ── */
  function docIdFor(key) { return 's_' + key; }

  function bodyFor(docId) {
    if (docId === 'settings') return { settings: state.settings, updatedAt: state.settingsAt || 0 };
    const s = state.sessions[docId.slice(2)];
    return s ? { session: s, updatedAt: s.updatedAt || 0 } : null;
  }

  function queue(docId, delay) {
    if (!col) return;
    clearTimeout(timers.get(docId));
    timers.set(docId, setTimeout(() => flush(docId), delay == null ? 1200 : delay));
  }

  async function flush(docId) {
    timers.delete(docId);
    if (busy.has(docId)) { queue(docId, 600); return; }
    busy.add(docId);
    try {
      const body = bodyFor(docId);
      if (body) await col.doc(docId).set(body);
      else await col.doc(docId).delete();
      if (cloud !== 'on') { cloud = 'on'; emit(); }
    } catch (e) {
      console.warn('Đồng bộ lỗi', e && e.code, e && e.message);
      if (e && e.code === 'unavailable') queue(docId, 4000 + Math.random() * 2000);
      else if (cloud !== 'error') { cloud = 'error'; emit(); }
    } finally {
      busy.delete(docId);
    }
  }

  async function initCloud() {
    const c = window.claude;
    if (!c || typeof c.use !== 'function') return;
    cloud = 'connecting'; emit();
    try {
      const [db, user] = await Promise.all([c.use('db'), c.use('user')]);
      const uid = user ? await user.id() : null;
      if (!db || !uid) { cloud = 'off'; emit(); return; }
      col = db.collection('data/users/' + uid);
      const snap = await col.get();
      const seen = new Set();
      snap.docs.forEach(d => {
        const b = d.data();
        if (!b) return;
        seen.add(d.id);
        const remoteAt = b.updatedAt || 0;
        if (d.id === 'settings') {
          if (remoteAt > (state.settingsAt || 0)) { state.settings = b.settings || {}; state.settingsAt = remoteAt; }
          else if ((state.settingsAt || 0) > remoteAt) queue('settings', 300);
        } else if (d.id.startsWith('s_') && b.session) {
          const k = d.id.slice(2);
          const mine = state.sessions[k];
          if (!mine || remoteAt > (mine.updatedAt || 0)) state.sessions[k] = b.session;
          else if ((mine.updatedAt || 0) > remoteAt) queue(d.id, 300);
        }
      });
      Object.keys(state.sessions).forEach(k => { if (!seen.has(docIdFor(k))) queue(docIdFor(k), 300); });
      if (!seen.has('settings') && state.settingsAt) queue('settings', 300);
      persist();
      cloud = 'on';
      emit();
    } catch (e) {
      console.warn('Không kết nối được bộ lưu claude.ai', e && e.code);
      cloud = 'error';
      emit();
    }
  }

  /* ── API dùng trong app ── */
  const Store = {
    onChange(fn) { listeners.add(fn); return () => listeners.delete(fn); },

    status() { return { localOK, cloud }; },

    settings() { return state.settings; },
    setSetting(k, v) {
      state.settings = Object.assign({}, state.settings, { [k]: v });
      state.settingsAt = Date.now();
      persist(); queue('settings'); emit();
    },

    session(key) { return state.sessions[key] || null; },
    allSessions() {
      return Object.values(state.sessions).sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
    },
    /* Sửa một buổi; tạo mới nếu chưa có. quiet = không phát sự kiện (dùng khi gõ số). */
    update(key, base, fn, quiet) {
      const rec = state.sessions[key] || Object.assign({ key, items: {}, checkin: null, note: '', completed: false }, base);
      fn(rec);
      rec.updatedAt = Date.now();
      state.sessions[key] = rec;
      persist();
      queue(docIdFor(key));
      if (!quiet) emit();
      return rec;
    },
    remove(key) {
      delete state.sessions[key];
      persist(); queue(docIdFor(key), 0); emit();
    },

    exportJSON() { return JSON.stringify({ app: 'giao-an-gym', exportedAt: new Date().toISOString(), data: state }, null, 1); },
    importJSON(text) {
      const parsed = JSON.parse(text);
      const data = parsed && parsed.data ? parsed.data : parsed;
      if (!data || data.v !== 1 || typeof data.sessions !== 'object') throw new Error('Không đúng định dạng dữ liệu của web này.');
      let n = 0;
      Object.entries(data.sessions).forEach(([k, s]) => {
        const mine = state.sessions[k];
        if (!mine || (s.updatedAt || 0) > (mine.updatedAt || 0)) { state.sessions[k] = s; queue(docIdFor(k)); n++; }
      });
      if ((data.settingsAt || 0) > (state.settingsAt || 0)) { state.settings = data.settings || {}; state.settingsAt = data.settingsAt; queue('settings'); }
      persist(); emit();
      return n;
    },
    clearAll() {
      const keys = Object.keys(state.sessions);
      state = blank();
      persist();
      keys.forEach(k => queue(docIdFor(k), 0));
      queue('settings', 0);
      emit();
    }
  };

  window.Store = Store;
  initCloud();
})();
