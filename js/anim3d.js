/*
 * Anim3D — người mẫu 3D tập luyện chạy ngay trong trang (three.js, không cần file video, không quảng cáo).
 *
 * Hệ toạ độ: Y hướng lên, người mẫu nhìn về +Z, tay/chân TRÁI ở phía +X. Sàn y = 0. Đơn vị mét, góc độ.
 * Một tư thế (pose) gồm:
 *   pel [x,y,z]  tâm hông          tr [cúi, xoay, nghiêng]  thân (cúi + = đổ người về trước)
 *   bend         gập lưng trên (độ)  hd  gật đầu (độ, + = cúi cằm)
 *   aL aR        vị trí cổ chân      fL fR [xoay, nhón] bàn chân (xoay + = mũi chân về +X; nhón + = nhấc gót)
 *   kL kR        hướng đầu gối (vector gợi ý)
 *   wL wR        vị trí cổ tay       eL eR  hướng khuỷu tay (vector gợi ý)
 *   cùng các khoá riêng cho dụng cụ (ball, plat, ...).
 * Đầu gối, khuỷu tay được tính bằng IK hai đoạn → bàn chân bám sàn, tay bám đúng tay cầm.
 */
(function () {
  'use strict';
  const T = window.THREE;
  if (T && T.ColorManagement) T.ColorManagement.legacyMode = false; // màu hex hiểu là sRGB → không bị bạc
  const DEG = Math.PI / 180;
  const V = (x, y, z) => new T.Vector3(x, y, z);

  /* Kích thước cơ thể (~1,72 m) */
  const L = {
    ankleH: 0.085, shank: 0.43, thigh: 0.44, hip: 0.095, spine: 0.47,
    sh: 0.185, shDrop: 0.045, neck: 0.085, headR: 0.105, upper: 0.29, fore: 0.255
  };
  const STAND_Y = L.ankleH + L.shank + L.thigh; // 0.955

  const COLORS = {
    bg: 0x0b1630, floor: 0x10203f, grid: 0x22d3ee, skin: 0xe6c4a8, shirt: 0x1ba6c2, shorts: 0x14284d,
    shoe: 0xf2f5fa, sole: 0xff8a3d, focus: 0xff8a3d, steel: 0x5b6b85, dark: 0x1e293b, pad: 0x273449,
    plate: 0x111827, chrome: 0xcbd5e1, ball: 0xe46a1f, rim: 0xff5a1f, cable: 0xe2e8f0, mat: 0x1f6f78
  };

  /* ── tiện ích hình học ── */
  function quatTrunk(tr, ord) {
    const e = new T.Euler((tr[0] || 0) * DEG, (tr[1] || 0) * DEG, -(tr[2] || 0) * DEG, ord || 'YXZ');
    return new T.Quaternion().setFromEuler(e);
  }
  function qx(deg) { return new T.Quaternion().setFromAxisAngle(V(1, 0, 0), deg * DEG); }

  function ik(root, target, a, b, pole) {
    const d = target.clone().sub(root);
    let len = d.length();
    const end = target.clone();
    if (len > a + b - 1e-4) { len = a + b - 1e-4; d.setLength(len); end.copy(root).add(d); }
    if (len < Math.abs(a - b) + 1e-3) { len = Math.abs(a - b) + 1e-3; d.setLength(len); end.copy(root).add(d); }
    const dir = d.clone().normalize();
    const cosA = (a * a + len * len - b * b) / (2 * a * len);
    const sinA = Math.sqrt(Math.max(0, 1 - cosA * cosA));
    let p = pole.clone().sub(dir.clone().multiplyScalar(pole.dot(dir)));
    if (p.lengthSq() < 1e-8) p = V(0, 0, 1).sub(dir.clone().multiplyScalar(dir.z));
    p.normalize();
    const mid = root.clone().add(dir.multiplyScalar(a * cosA)).add(p.multiplyScalar(a * sinA));
    return { mid, end };
  }

  /* Tính toạ độ các khớp từ một tư thế */
  function solve(p) {
    const q = quatTrunk(p.tr || [0, 0, 0], p.ord);
    const qb = q.clone().multiply(qx(p.bend || 0));
    const qh = qb.clone().multiply(qx(p.hd || 0));
    const pel = V(...p.pel);
    const J = { q, qb, qh, pel };
    J.hipL = pel.clone().add(V(L.hip, 0, 0).applyQuaternion(q));
    J.hipR = pel.clone().add(V(-L.hip, 0, 0).applyQuaternion(q));
    J.mid = pel.clone().add(V(0, L.spine * 0.5, 0).applyQuaternion(q));
    J.chest = J.mid.clone().add(V(0, L.spine * 0.5, 0).applyQuaternion(qb));
    J.shL = J.chest.clone().add(V(L.sh, -L.shDrop, 0).applyQuaternion(qb));
    J.shR = J.chest.clone().add(V(-L.sh, -L.shDrop, 0).applyQuaternion(qb));
    J.neck = J.chest.clone().add(V(0, L.neck, 0).applyQuaternion(qb));
    J.head = J.neck.clone().add(V(0, L.headR * 0.95, 0.012).applyQuaternion(qh));
    for (const s of ['L', 'R']) {
      const sign = s === 'L' ? 1 : -1;
      const f = p['f' + s] || [0, 0];
      const qf = new T.Quaternion().setFromEuler(new T.Euler(f[1] * DEG, f[0] * DEG, 0, 'YXZ'));
      const fwd = V(0, 0, 1).applyQuaternion(qf), down = V(0, -1, 0).applyQuaternion(qf);
      const ank = V(...p['a' + s]);
      const kp = p['k' + s] ? V(...p['k' + s]) : fwd.clone().setY(0).normalize().add(V(0.15 * sign, 0, 0));
      const leg = ik(J['hip' + s], ank, L.thigh, L.shank, kp);
      J['knee' + s] = leg.mid; J['ank' + s] = leg.end;
      J['heel' + s] = leg.end.clone().add(fwd.clone().multiplyScalar(-0.05)).add(down.clone().multiplyScalar(0.05));
      J['toe' + s] = leg.end.clone().add(fwd.clone().multiplyScalar(0.16)).add(down.clone().multiplyScalar(0.055));
      // cổ tay: toạ độ thế giới (wL) hoặc theo thân (wLt, gốc ở điểm ngực, trục theo thân)
      const wr = p['h' + s] ? J['sh' + s].clone().add(V(0.01 * sign, -0.52, 0.03)) // tay buông thõng
        : p['w' + s + 't'] ? J.chest.clone().add(V(...p['w' + s + 't']).applyQuaternion(qb))
        : V(...(p['w' + s] || [0.22 * sign, 0.85, 0]));
      const ep = p['e' + s + 't'] ? V(...p['e' + s + 't']).applyQuaternion(qb)
        : p['e' + s] ? V(...p['e' + s]) : V(0.35 * sign, -1, -0.35);
      const arm = ik(J['sh' + s], wr, L.upper, L.fore, ep);
      J['elb' + s] = arm.mid; J['wr' + s] = arm.end;
      const fd = arm.end.clone().sub(arm.mid).normalize();
      J['hand' + s] = arm.end.clone().add(fd.clone().multiplyScalar(0.055));
      J['fdir' + s] = fd;
    }
    return J;
  }

  /* Nội suy hai tư thế */
  function lerpPose(a, b, t) {
    const out = {};
    const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
    keys.forEach(k => {
      const x = a[k] !== undefined ? a[k] : b[k], y = b[k] !== undefined ? b[k] : a[k];
      if (Array.isArray(x)) out[k] = x.map((v, i) => v + ((y[i] !== undefined ? y[i] : v) - v) * t);
      else if (typeof x === 'number') out[k] = x + (y - x) * t;
      else out[k] = t < 0.5 ? x : y;
    });
    return out;
  }
  const ease = t => 0.5 - 0.5 * Math.cos(Math.PI * t);

  /* ── thư viện giúp viết tư thế ── */
  const lib = {
    L, STAND_Y,
    /* chân đứng: nửa khoảng cách hai cổ chân w, mũi chân mở toe (độ), lùi z */
    feet(w, toe, z, y) {
      return { aL: [w, y == null ? L.ankleH : y, z || 0], aR: [-w, y == null ? L.ankleH : y, z || 0], fL: [toe || 0, 0], fR: [-(toe || 0), 0] };
    },
    P(...parts) { return Object.assign({}, ...parts); },
    /* chiều cao hông khi hai chân đứng thẳng ở độ cao cổ chân y */
    standY: STAND_Y
  };

  /* ── dựng cảnh ── */
  function mat(color, opts) { return new T.MeshStandardMaterial(Object.assign({ color, roughness: 0.62, metalness: 0.05 }, opts || {})); }

  function placeBetween(mesh, a, b) {
    const d = b.clone().sub(a);
    const len = Math.max(d.length(), 1e-4);
    mesh.position.copy(a).add(b).multiplyScalar(0.5);
    mesh.quaternion.setFromUnitVectors(V(0, 1, 0), d.divideScalar(len));
    mesh.scale.set(1, len, 1);
  }

  function makeBody(scene, focus) {
    const F = new Set(focus || []);
    const skin = mat(COLORS.skin), shirt = mat(COLORS.shirt), shorts = mat(COLORS.shorts), shoe = mat(COLORS.shoe), sole = mat(COLORS.sole);
    const hot = mat(COLORS.focus, { emissive: COLORS.focus, emissiveIntensity: 0.28 });
    const pick = (part, base) => (F.has(part) ? hot : base);
    const cyl = (rt, rb, m) => { const g = new T.CylinderGeometry(rt, rb, 1, 18); const me = new T.Mesh(g, m); me.castShadow = true; scene.add(me); return me; };
    const sph = (r, m) => { const me = new T.Mesh(new T.SphereGeometry(r, 20, 14), m); me.castShadow = true; scene.add(me); return me; };
    const B = {};
    for (const s of ['L', 'R']) {
      B['thigh' + s] = cyl(0.056, 0.078, pick('thigh', shorts));
      B['shank' + s] = cyl(0.042, 0.056, pick('calf', skin));
      B['knee' + s] = sph(0.056, pick('thigh', skin));
      B['ank' + s] = sph(0.042, skin);
      B['foot' + s] = cyl(0.04, 0.045, shoe);
      B['sole' + s] = cyl(0.043, 0.043, sole);
      B['upper' + s] = cyl(0.04, 0.05, pick('arm', skin));
      B['fore' + s] = cyl(0.032, 0.04, pick('forearm', skin));
      B['shJ' + s] = sph(0.062, pick('shoulder', shirt));
      B['elb' + s] = sph(0.04, pick('arm', skin));
      B['hand' + s] = sph(0.045, skin);
    }
    B.hips = sph(1, pick('glute', shorts)); B.hips.scale.set(0.165, 0.115, 0.12);
    B.abs = sph(1, pick('core', shirt));
    B.chest = sph(1, pick(F.has('chest') ? 'chest' : 'back', shirt));
    B.neck = cyl(0.045, 0.05, skin);
    B.head = sph(L.headR, skin);
    B.nose = sph(0.022, skin);
    B.hair = sph(L.headR * 1.02, mat(0x1b1b1f));
    return B;
  }

  function updateBody(B, J) {
    for (const s of ['L', 'R']) {
      placeBetween(B['thigh' + s], J['knee' + s], J['hip' + s]);
      placeBetween(B['shank' + s], J['ank' + s], J['knee' + s]);
      B['knee' + s].position.copy(J['knee' + s]);
      B['ank' + s].position.copy(J['ank' + s]);
      placeBetween(B['foot' + s], J['heel' + s], J['toe' + s]);
      const down = J['toe' + s].clone().sub(J['heel' + s]).normalize();
      const off = V(0, -0.03, 0);
      placeBetween(B['sole' + s], J['heel' + s].clone().add(off), J['toe' + s].clone().add(off));
      B['sole' + s].scale.x = B['sole' + s].scale.z = 1.05;
      void down;
      placeBetween(B['upper' + s], J['elb' + s], J['sh' + s]);
      placeBetween(B['fore' + s], J['wr' + s], J['elb' + s]);
      B['shJ' + s].position.copy(J['sh' + s]);
      B['elb' + s].position.copy(J['elb' + s]);
      B['hand' + s].position.copy(J['hand' + s]);
    }
    B.hips.position.copy(J.pel).add(V(0, 0.02, -0.01).applyQuaternion(J.q));
    B.hips.quaternion.copy(J.q);
    B.abs.position.copy(J.pel.clone().lerp(J.mid, 0.75));
    B.abs.quaternion.copy(J.q);
    B.abs.scale.set(0.15, 0.17, 0.11);
    B.chest.position.copy(J.mid.clone().lerp(J.chest, 0.52));
    B.chest.quaternion.copy(J.qb);
    B.chest.scale.set(0.2, 0.2, 0.125);
    placeBetween(B.neck, J.chest, J.neck);
    B.head.position.copy(J.head);
    B.hair.position.copy(J.head.clone().add(V(0, 0.012, -0.012).applyQuaternion(J.qh)));
    B.hair.quaternion.copy(J.qh);
    B.hair.scale.set(1, 0.92, 1);
    B.nose.position.copy(J.head.clone().add(V(0, -0.01, L.headR * 0.96).applyQuaternion(J.qh)));
  }

  /* ── dụng cụ ── */
  function makeProps(scene, defs) {
    const steel = mat(COLORS.steel, { metalness: 0.5, roughness: 0.4 });
    const dark = mat(COLORS.dark), pad = mat(COLORS.pad), plate = mat(COLORS.plate, { roughness: 0.5 }), chrome = mat(COLORS.chrome, { metalness: 0.8, roughness: 0.25 });
    const out = [];
    const box = (w, h, d, m) => { const me = new T.Mesh(new T.BoxGeometry(w, h, d), m); me.castShadow = true; me.receiveShadow = true; scene.add(me); return me; };
    const cylM = (r, m, seg) => { const me = new T.Mesh(new T.CylinderGeometry(r, r, 1, seg || 16), m); me.castShadow = true; scene.add(me); return me; };

    function dumbbell(len) {
      const g = new T.Group();
      const bar = new T.Mesh(new T.CylinderGeometry(0.016, 0.016, len, 12), chrome);
      g.add(bar);
      for (const s of [-1, 1]) {
        const h = new T.Mesh(new T.CylinderGeometry(0.055, 0.055, 0.075, 8), plate);
        h.position.y = s * (len / 2 - 0.02); g.add(h);
      }
      g.traverse(o => { if (o.isMesh) o.castShadow = true; });
      scene.add(g); return g;
    }
    function orient(obj, center, axis) {
      obj.position.copy(center);
      obj.quaternion.setFromUnitVectors(V(0, 1, 0), axis.clone().normalize());
    }
    function line(m, r) { return cylM(r || 0.007, m || mat(COLORS.cable, { roughness: 0.3 }), 6); }

    (defs || []).forEach(d => {
      const t = d.type;
      if (t === 'box') {
        const me = box(d.size[0], d.size[1], d.size[2], d.mat === 'steel' ? steel : d.mat === 'dark' ? dark : d.mat === 'chrome' ? chrome : pad);
        me.position.set(...d.pos);
        if (d.rot) me.rotation.set(d.rot[0] * DEG, (d.rot[1] || 0) * DEG, (d.rot[2] || 0) * DEG);
        if (d.key) out.push({ update(P) { const v = P[d.key]; if (v) me.position.set(v[0], v[1], v[2]); if (d.rotKey && P[d.rotKey] != null) me.rotation.x = P[d.rotKey] * DEG; } });
      } else if (t === 'post') { // cột đứng từ sàn
        const me = cylM(d.r || 0.03, steel); placeBetween(me, V(d.pos[0], 0, d.pos[2]), V(d.pos[0], d.h, d.pos[2]));
      } else if (t === 'rod') { // thanh tĩnh giữa 2 điểm
        const me = cylM(d.r || 0.025, d.mat === 'chrome' ? chrome : steel); placeBetween(me, V(...d.a), V(...d.b));
      } else if (t === 'dumbbell') {
        const sides = d.hand === 'both' ? ['L', 'R'] : [d.hand];
        sides.forEach(s => {
          const g = dumbbell(d.len || 0.3);
          out.push({ update(P, J) {
            const ax = P['db' + s] ? V(...P['db' + s]) : (s === 'L' ? V(1, 0, 0) : V(1, 0, 0));
            orient(g, J['hand' + s], ax);
          } });
        });
      } else if (t === 'goblet') {
        const g = dumbbell(0.3);
        out.push({ update(P, J) {
          const c = J.handL.clone().add(J.handR).multiplyScalar(0.5).add(V(0, -0.06, 0.03).applyQuaternion(J.q));
          orient(g, c, V(0, 1, 0).applyQuaternion(J.qb));
        } });
      } else if (t === 'barbell') {
        const g = new T.Group();
        const bar = new T.Mesh(new T.CylinderGeometry(0.014, 0.014, d.len || 1.6, 12), chrome); g.add(bar);
        if (d.plates !== false) for (const s of [-1, 1]) {
          const pl = new T.Mesh(new T.CylinderGeometry(d.plateR || 0.18, d.plateR || 0.18, 0.05, 28), plate);
          pl.position.y = s * ((d.len || 1.6) / 2 - 0.12); g.add(pl);
        }
        g.traverse(o => { if (o.isMesh) o.castShadow = true; });
        scene.add(g);
        out.push({ update(P, J) {
          const c = J.handL.clone().add(J.handR).multiplyScalar(0.5);
          if (d.offset) c.add(V(...d.offset));
          orient(g, c, J.handL.clone().sub(J.handR));
        } });
      } else if (t === 'trapbar') {
        const g = new T.Group();
        const pts = [];
        for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2 + Math.PI / 6; pts.push(V(Math.cos(a) * 0.36, 0, Math.sin(a) * 0.3)); }
        for (let i = 0; i < 6; i++) { const m = new T.Mesh(new T.CylinderGeometry(0.014, 0.014, 1, 8), chrome); placeBetween(m, pts[i], pts[(i + 1) % 6]); g.add(m); }
        for (const s of [-1, 1]) {
          const sleeve = new T.Mesh(new T.CylinderGeometry(0.014, 0.014, 0.5, 8), chrome); sleeve.rotation.z = Math.PI / 2; sleeve.position.x = s * 0.55; g.add(sleeve);
          const pl = new T.Mesh(new T.CylinderGeometry(0.2, 0.2, 0.05, 28), plate); pl.rotation.z = Math.PI / 2; pl.position.x = s * 0.62; g.add(pl);
        }
        g.traverse(o => { if (o.isMesh) o.castShadow = true; });
        scene.add(g);
        out.push({ update(P, J) {
          const c = J.handL.clone().add(J.handR).multiplyScalar(0.5);
          g.position.copy(c); g.rotation.set(0, (P.tr ? P.tr[1] : 0) * DEG, 0);
        } });
      } else if (t === 'cable') {
        const cab = line();
        const handle = d.handle === 'rope' ? null : cylM(0.014, chrome);
        const ropeL = d.handle === 'rope' ? [line(dark, 0.013), line(dark, 0.013)] : null;
        let stack = null;
        if (d.stack) { stack = box(0.2, 0.3, 0.12, plate); }
        let rest = null;
        out.push({ update(P, J) {
          const from = V(...d.from);
          let to;
          if (d.to === 'L' || d.to === 'R') to = J['hand' + d.to].clone();
          else to = J.handL.clone().add(J.handR).multiplyScalar(0.5);
          if (ropeL) {
            const knot = to.clone().add(from.clone().sub(to).setLength(0.12));
            placeBetween(cab, from, knot);
            placeBetween(ropeL[0], knot, J.handL); placeBetween(ropeL[1], knot, J.handR);
          } else {
            placeBetween(cab, from, to);
            if (handle) {
              if (d.handle === 'bar' || d.handle === 'v') {
                const half = d.handle === 'v' ? 0.12 : (d.barLen || 0.5) / 2;
                const ax = J.handL.clone().sub(J.handR); if (ax.lengthSq() < 1e-6) ax.set(1, 0, 0); ax.normalize();
                const c = J.handL.clone().add(J.handR).multiplyScalar(0.5);
                placeBetween(handle, c.clone().add(ax.clone().multiplyScalar(-half)), c.clone().add(ax.clone().multiplyScalar(half)));
              } else {
                placeBetween(handle, to.clone().add(V(0, -0.05, 0)), to.clone().add(V(0, 0.05, 0)));
              }
            }
          }
          if (stack) {
            const len = from.distanceTo(to);
            if (rest === null) rest = len;
            const lift = Math.max(0, Math.min(0.6, (len - rest) * (d.ratio || 1)));
            stack.position.set(d.stack[0], 0.2 + lift, d.stack[2]);
          }
        } });
      } else if (t === 'link') { // tay đòn máy: từ điểm tĩnh tới tay
        const me = cylM(d.r || 0.022, steel);
        const grip = cylM(0.02, dark);
        out.push({ update(P, J) {
          const h = J['hand' + d.hand].clone();
          placeBetween(me, V(...d.from), h);
          const ax = d.grip ? V(...d.grip) : V(0, 1, 0);
          placeBetween(grip, h.clone().add(ax.clone().multiplyScalar(-0.07)), h.clone().add(ax.clone().multiplyScalar(0.07)));
        } });
      } else if (t === 'pad') { // đệm bám theo một khớp (ví dụ đệm máy móc đùi bám cổ chân)
        const me = cylM(d.r || 0.05, pad);
        out.push({ update(P, J) {
          const c = J[d.joint].clone().add(V(...(d.off || [0, 0, 0])));
          placeBetween(me, c.clone().add(V(-(d.w || 0.35) / 2, 0, 0)), c.clone().add(V((d.w || 0.35) / 2, 0, 0)));
          if (d.arm) { if (!this.arm) this.arm = cylM(0.02, steel); placeBetween(this.arm, V(...d.arm), c); }
        } });
      } else if (t === 'platform') { // bàn đạp leg press / máy calf: theo khoá pose
        const me = box(d.size[0], d.size[1], d.size[2], steel);
        out.push({ update(P) { const v = P[d.key]; if (v) me.position.set(...v); if (d.rot) me.rotation.x = d.rot * DEG; } });
      } else if (t === 'ball') {
        const me = new T.Mesh(new T.SphereGeometry(0.12, 24, 18), mat(COLORS.ball, { roughness: 0.75 }));
        me.castShadow = true; scene.add(me);
        const seam = new T.Mesh(new T.TorusGeometry(0.121, 0.004, 6, 32), mat(0x2a1206)); scene.add(seam);
        out.push({ update(P, J) {
          let v;
          if (P.ball) v = V(...P.ball);
          else if (P.ballIn === 'L' || P.ballIn === 'R') v = J['hand' + P.ballIn].clone().add(V(0, -0.11, 0.02));
          else v = J.handL.clone().add(J.handR).multiplyScalar(0.5).add(V(0, 0.02, 0.08).applyQuaternion(J.q));
          me.position.copy(v); seam.position.copy(v); seam.rotation.set(0.6, 0.3, 0);
        } });
      } else if (t === 'hoop') {
        const pole = cylM(0.06, steel); placeBetween(pole, V(d.pos[0], 0, d.pos[2] + 0.9), V(d.pos[0], 3.4, d.pos[2] + 0.9));
        const board = box(1.8, 1.05, 0.04, mat(0xe8eef9, { transparent: true, opacity: 0.85 })); board.position.set(d.pos[0], 3.35, d.pos[2] + 0.4);
        const rim = new T.Mesh(new T.TorusGeometry(0.23, 0.012, 8, 40), mat(COLORS.rim)); rim.rotation.x = Math.PI / 2; rim.position.set(d.pos[0], 3.05, d.pos[2]); scene.add(rim);
      } else if (t === 'cone') {
        (d.list || [d.pos]).forEach(p => { const c = new T.Mesh(new T.ConeGeometry(0.1, 0.28, 18), mat(COLORS.sole)); c.position.set(p[0], 0.14, p[2]); c.castShadow = true; scene.add(c); });
      } else if (t === 'mat') {
        const me = box(d.size ? d.size[0] : 0.7, 0.012, d.size ? d.size[1] : 1.9, mat(COLORS.mat)); me.position.set(...(d.pos || [0, 0.006, 0]));
        if (d.rotY) me.rotation.y = d.rotY * DEG;
      } else if (t === 'bench') { // ghế: đệm ngồi + (tuỳ chọn) lưng dốc
        const h = d.h || 0.45;
        const seat = box(d.w || 0.3, 0.07, d.seat || 1.2, pad);
        seat.position.set(d.pos[0], h, d.pos[2]);
        if (d.rotY) seat.rotation.y = d.rotY * DEG;
        const leg1 = box(0.06, h - 0.04, 0.06, steel); leg1.position.set(d.pos[0], (h - 0.04) / 2, d.pos[2] - (d.seat || 1.2) / 2 + 0.1);
        const leg2 = box(0.06, h - 0.04, 0.06, steel); leg2.position.set(d.pos[0], (h - 0.04) / 2, d.pos[2] + (d.seat || 1.2) / 2 - 0.1);
        if (d.back) { // lưng ghế: dài back, góc incline so với phương ngang, bắt đầu từ mép sau đệm
          const bk = box(d.w || 0.3, 0.07, d.back, pad);
          const ang = d.incline * DEG;
          const z0 = d.pos[2] + (d.backAt != null ? d.backAt : -(d.seat || 1.2) / 2);
          const dirZ = d.backDir || -1;
          bk.position.set(d.pos[0], h + Math.sin(ang) * d.back / 2, z0 + dirZ * Math.cos(ang) * d.back / 2);
          bk.rotation.x = -dirZ * ang;
        }
      }
    });
    return out;
  }

  /* ── registry & player ── */
  const REG = {};
  function define(id, def) { REG[id] = def; }
  function has(id) { return !!REG[id] && !!T; }

  function webglOK() {
    try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch (e) { return false; }
  }

  const VIEWS = [['Nghiêng', 'a'], ['Bên', 's'], ['Trước', 'f']];

  function mount(root, id, opts) {
    const def = REG[id];
    if (!def || !T || !webglOK()) return null;
    opts = opts || {};
    root.innerHTML = `
      <div class="a3">
        <div class="a3-stage"></div>
        <div class="a3-cap" aria-live="polite"></div>
        <div class="a3-rep"></div>
        <div class="a3-bar">
          <button type="button" class="a3-btn a3-play" aria-label="Tạm dừng">❚❚</button>
          <button type="button" class="a3-btn a3-speed" aria-label="Tốc độ">1×</button>
          <span class="a3-views">${VIEWS.map(([lab, k]) => `<button type="button" class="a3-btn a3-view" data-v="${k}">${lab}</button>`).join('')}</span>
          <span class="a3-hint">Kéo để xoay</span>
        </div>
      </div>`;
    const stage = root.querySelector('.a3-stage');
    const capEl = root.querySelector('.a3-cap');
    const repEl = root.querySelector('.a3-rep');
    const renderer = new T.WebGLRenderer({ antialias: true, alpha: false, preserveDrawingBuffer: !!opts.preserve });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = T.PCFSoftShadowMap;
    renderer.outputEncoding = T.sRGBEncoding;
    stage.appendChild(renderer.domElement);
    const scene = new T.Scene();
    scene.background = new T.Color(COLORS.bg);
    scene.fog = new T.Fog(COLORS.bg, 7, 16);
    const cam = new T.PerspectiveCamera(32, 16 / 9, 0.05, 50);
    scene.add(new T.HemisphereLight(0xdfefff, 0x0b1630, 0.75));
    const sun = new T.DirectionalLight(0xffffff, 0.95);
    sun.position.set(2.5, 5, 3.5);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    Object.assign(sun.shadow.camera, { left: -3, right: 3, top: 3, bottom: -3, near: 0.5, far: 15 });
    scene.add(sun);
    const rim = new T.DirectionalLight(0x22d3ee, 0.35); rim.position.set(-3, 2.5, -3); scene.add(rim);
    // sàn kiểu sân bóng
    const floor = new T.Mesh(new T.CircleGeometry(7, 64), mat(COLORS.floor, { roughness: 0.9 }));
    floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);
    const grid = new T.GridHelper(14, 28, COLORS.grid, COLORS.grid);
    grid.material.transparent = true; grid.material.opacity = 0.12; grid.position.y = 0.002; scene.add(grid);

    const B = makeBody(scene, def.focus);
    const P = makeProps(scene, def.props);

    // chuỗi động tác
    const keys = def.seq.map(k => ({ p: k[0], d: k[1], cap: k[2] || '' }));
    const total = keys.reduce((s, k) => s + k.d, 0);
    let speed = 1, playing = true, t = 0, last = performance.now(), rep = 1, raf = 0, dead = false;

    // camera
    const camDef = Object.assign({ az: 40, el: 10, dist: 4.3, target: [0, 0.9, 0] }, def.cam || {});
    let az = camDef.az, el = camDef.el;
    const target = V(...camDef.target);
    function placeCam() {
      const d = camDef.dist * (cam.aspect < 1.5 ? 1.12 : 1); // khung 4:3 trên điện thoại → lùi camera chút
      cam.position.set(target.x + d * Math.cos(el * DEG) * Math.sin(az * DEG), target.y + d * Math.sin(el * DEG), target.z + d * Math.cos(el * DEG) * Math.cos(az * DEG));
      cam.lookAt(target);
    }
    placeCam();

    function poseAt(time) {
      let acc = 0;
      for (let i = 0; i < keys.length; i++) {
        const k = keys[i];
        if (time <= acc + k.d || i === keys.length - 1) {
          const prev = keys[(i - 1 + keys.length) % keys.length].p;
          const u = k.d > 0 ? Math.min(1, Math.max(0, (time - acc) / k.d)) : 1;
          return { pose: lerpPose(prev, k.p, ease(u)), cap: k.cap, idx: i };
        }
        acc += k.d;
      }
      return { pose: keys[0].p, cap: keys[0].cap, idx: 0 };
    }

    function draw() {
      const r = poseAt(t);
      const J = solve(r.pose);
      updateBody(B, J);
      P.forEach(p => p.update(r.pose, J));
      if (capEl.textContent !== r.cap) capEl.textContent = r.cap;
      repEl.textContent = def.reps === false ? '' : 'Lần ' + rep;
      renderer.render(scene, cam);
    }

    function size() {
      const w = stage.clientWidth || 320, h = Math.round(w * (w < 560 ? 0.75 : 9 / 16));
      stage.style.height = h + 'px';
      renderer.setSize(w, h, false);
      renderer.domElement.style.width = '100%'; renderer.domElement.style.height = h + 'px';
      cam.aspect = w / h; cam.updateProjectionMatrix(); placeCam();
    }
    size();
    const ro = new ResizeObserver(() => { size(); draw(); });
    ro.observe(stage);

    function frame(now) {
      if (dead) return;
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      if (playing) {
        t += dt * speed;
        if (t >= total) { t -= total; rep = rep % 9 + 1; }
      }
      draw();
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);

    // điều khiển
    const playBtn = root.querySelector('.a3-play');
    playBtn.addEventListener('click', () => {
      playing = !playing;
      playBtn.textContent = playing ? '❚❚' : '▶';
      playBtn.setAttribute('aria-label', playing ? 'Tạm dừng' : 'Phát');
    });
    const spBtn = root.querySelector('.a3-speed');
    spBtn.addEventListener('click', () => {
      speed = speed === 1 ? 0.5 : speed === 0.5 ? 1.5 : 1;
      spBtn.textContent = (speed === 0.5 ? '0,5' : speed === 1.5 ? '1,5' : '1') + '×';
    });
    const presets = { a: [camDef.az, camDef.el], s: [def.side != null ? def.side : 90, 6], f: [def.front != null ? def.front : 0, 8] };
    root.querySelectorAll('.a3-view').forEach(b => b.addEventListener('click', () => {
      [az, el] = presets[b.dataset.v]; placeCam();
      root.querySelectorAll('.a3-view').forEach(x => x.setAttribute('aria-pressed', x === b));
    }));
    let drag = null;
    stage.addEventListener('pointerdown', e => { drag = { x: e.clientX, y: e.clientY, az, el }; stage.setPointerCapture(e.pointerId); });
    stage.addEventListener('pointermove', e => {
      if (!drag) return;
      az = drag.az - (e.clientX - drag.x) * 0.4;
      el = Math.max(-5, Math.min(60, drag.el + (e.clientY - drag.y) * 0.25));
      placeCam();
    });
    const endDrag = () => { drag = null; };
    stage.addEventListener('pointerup', endDrag); stage.addEventListener('pointercancel', endDrag);
    stage.style.touchAction = 'pan-y';

    return {
      setTime(sec) { t = ((sec % total) + total) % total; draw(); },
      pause() { playing = false; },
      view(k) { [az, el] = presets[k]; placeCam(); draw(); },
      setAngle(a, e) { az = a; el = e; placeCam(); draw(); },
      total,
      destroy() {
        dead = true; cancelAnimationFrame(raf); ro.disconnect();
        scene.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => m.dispose()); });
        renderer.dispose(); renderer.forceContextLoss && renderer.forceContextLoss();
        root.innerHTML = '';
      }
    };
  }

  window.Anim3D = { define, has, mount, lib, solve, L, list: () => Object.keys(REG) };
})();
