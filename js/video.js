/*
 * Trình phát video trong cửa sổ bài tập — video chạy TRỰC TIẾP trong trang, không mở link ngoài.
 *   1. clip tự làm (file mp4 trong thư mục video/) nếu có;
 *   2. YouTube nhúng (youtube-nocookie), TỰ PHÁT ngay khi mở bài:
 *        - trình duyệt cho phát có tiếng → phát luôn;
 *        - trình duyệt chặn tiếng (thường gặp trên iPhone) → tự phát không tiếng + nút "Bật tiếng";
 *        - video lỗi → tự chuyển sang video dự phòng của cùng bài, vẫn trong trang.
 *   3. Chỉ khi nơi mở web cấm nhúng YouTube (Artifact claude.ai, mở file trực tiếp) mới hiện thẻ mở YouTube.
 */
(function () {
  const inArtifact = !!(window.claude && typeof window.claude.use === 'function');
  const isFile = location.protocol === 'file:';
  let cspBlocked = false;
  let active = null;

  document.addEventListener('securitypolicyviolation', e => {
    if (/youtube/i.test(e.blockedURI || '')) {
      cspBlocked = true;
      if (active) active.fail('csp');
    }
  });

  const ICON_SOUND = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 9v6h4l5 5V4L7 9zm13.5 3A4.5 4.5 0 0 0 14 8v8a4.5 4.5 0 0 0 2.5-4zM14 3.2v2.1a7 7 0 0 1 0 13.4v2.1a9 9 0 0 0 0-17.6z"/></svg>';
  const ICON_PLAY = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>';

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }
  function watchUrl(id) { return 'https://www.youtube.com/watch?v=' + encodeURIComponent(id); }
  function canEmbed() { return !inArtifact && !cspBlocked && !isFile; }

  /* Chỉ dùng khi nơi mở web không cho nhúng YouTube (không phải đường dẫn chính). */
  function blockedCard(id, reason, pageLink) {
    const lead = reason === 'file'
      ? 'Đang mở file trực tiếp nên YouTube không phát trong trang. Bấm để mở bài này trên web Giáo án Hậu vệ — video tự phát ngay trong trang.'
      : 'Bản trên claude.ai không cho phát video trong trang. Bấm để mở đúng bài này trên web Giáo án Hậu vệ — video tự phát ngay trong trang.';
    const href = pageLink || watchUrl(id);
    return `
      <a class="vp-card" href="${esc(href)}" target="_blank" rel="noopener">
        <img src="img/yt/${esc(id)}.jpg" alt="">
        <span class="vp-card-play" aria-hidden="true">${ICON_PLAY}</span>
        <span class="vp-card-text"><b>Xem video</b><span>${esc(lead)}</span></span>
      </a>`;
  }

  function failedPanel(poster) {
    return `<div class="vp-fail">${poster ? `<img src="${esc(poster)}" alt="">` : ''}
      <p><b>Video bài này tạm thời không phát được.</b> Xem ảnh tư thế và các bước ngay bên dưới — kiểm tra lại mạng rồi mở lại bài sau.</p></div>`;
  }

  function mount(root, opts) {
    unmount();
    const me = { root, failed: false, timers: [], cleanup: null };
    active = me;
    const queue = [opts.videoId].concat(opts.fallbackIds || []).filter(Boolean);

    me.fail = reason => {
      if (active !== me) return;
      if (reason === 'csp' || reason === 'file' || reason === 'artifact') { root.innerHTML = blockedCard(queue[0], reason, opts.pageLink); return; }
      next();
    };

    if (opts.clip) {
      root.innerHTML = `<video class="vp-video" controls autoplay playsinline preload="auto" ${opts.poster ? `poster="${esc(opts.poster)}"` : ''}>
          <source src="${esc(opts.clip)}" type="video/mp4"></video>`;
      const v = root.querySelector('video');
      const onErr = () => { if (active === me && queue.length) startYoutube(queue.shift()); };
      v.addEventListener('error', onErr, true);
      root.querySelector('source').addEventListener('error', onErr);
      const p = v.play();
      if (p && p.catch) p.catch(() => { v.muted = true; v.play().catch(() => {}); });
      return;
    }
    if (!queue.length) { root.innerHTML = ''; return; }
    if (!canEmbed()) { root.innerHTML = blockedCard(queue[0], isFile ? 'file' : 'artifact', opts.pageLink); return; }
    next();

    function next() {
      clearTimers();
      if (me.cleanup) { me.cleanup(); me.cleanup = null; }
      const id = queue.shift();
      if (!id) { root.innerHTML = failedPanel(opts.poster); me.failed = true; return; }
      startYoutube(id);
    }

    function clearTimers() { me.timers.forEach(clearTimeout); me.timers = []; }

    function startYoutube(id) {
      const params = new URLSearchParams({
        autoplay: '1', rel: '0', modestbranding: '1', playsinline: '1', enablejsapi: '1', iv_load_policy: '3',
        origin: location.origin
      });
      root.innerHTML = `
        <div class="vp-frame">
          <iframe src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?${params}"
            title="${esc(opts.title || 'Video hướng dẫn')}"
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen; accelerometer; gyroscope"
            referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>
          <button type="button" class="vp-unmute" hidden>${ICON_SOUND}<span>Bật tiếng</span></button>
        </div>
        <p class="vp-note" hidden></p>`;
      const frame = root.querySelector('iframe');
      const unmuteBtn = root.querySelector('.vp-unmute');
      const note = root.querySelector('.vp-note');
      let state = null, ready = false, mutedStart = false;

      const post = (func, args) => {
        try { frame.contentWindow.postMessage(JSON.stringify({ event: 'command', func, args: args || [], id: 1, channel: 'widget' }), '*'); } catch (e) { /* bỏ qua */ }
      };

      function onMsg(ev) {
        if (ev.source !== frame.contentWindow) return;
        let d = ev.data;
        if (typeof d === 'string') { try { d = JSON.parse(d); } catch (e) { return; } }
        if (!d || typeof d !== 'object') return;
        if (d.event === 'onError') { next(); return; }
        if (d.event === 'onReady' || d.event === 'initialDelivery') ready = true;
        const info = d.info && typeof d.info === 'object' ? d.info : null;
        if (d.event === 'onStateChange' && typeof d.info === 'number') state = d.info;
        else if (info && typeof info.playerState === 'number') state = info.playerState;
        if (info && info.muted === false && mutedStart) { unmuteBtn.hidden = true; mutedStart = false; }
        if (state === 1) note.hidden = true;
      }
      window.addEventListener('message', onMsg);
      me.cleanup = () => window.removeEventListener('message', onMsg);

      unmuteBtn.addEventListener('click', () => {
        post('unMute'); post('setVolume', [100]); post('playVideo');
        unmuteBtn.hidden = true; mutedStart = false;
      });

      frame.addEventListener('load', () => {
        try { frame.contentWindow.postMessage(JSON.stringify({ event: 'listening', id: 1, channel: 'widget' }), '*'); } catch (e) { /* bỏ qua */ }
        post('addEventListener', ['onError']);
        post('addEventListener', ['onStateChange']);
        post('playVideo');
        // Trình duyệt chặn phát có tiếng → phát không tiếng + nút "Bật tiếng".
        me.timers.push(setTimeout(() => {
          if (active !== me || state === 1 || state === 3) return;
          mutedStart = true;
          post('mute'); post('playVideo');
          unmuteBtn.hidden = false;
        }, 1600));
        // Vẫn chưa chạy (máy tiết kiệm pin chặn cả phát không tiếng) → nhắc chạm vào video.
        me.timers.push(setTimeout(() => {
          if (active !== me || state === 1 || state === 3) return;
          note.hidden = false;
          note.textContent = ready ? 'Chạm vào video để phát.' : 'Video đang tải — mạng có thể đang chậm.';
        }, 4500));
      });
    }
  }

  function unmount() {
    if (!active) return;
    active.timers.forEach(clearTimeout);
    if (active.cleanup) active.cleanup();
    if (active.root) active.root.innerHTML = '';
    active = null;
  }

  window.VideoPlayer = { mount, unmount, watchUrl, canEmbed, inArtifact, isFile };
})();
