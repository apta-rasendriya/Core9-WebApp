/* ============================================================================
   Core9 — "How it works" 3D scenes (Three.js r152, fully procedural, no assets)  ·  v3
   Four quiet engineering vignettes — graphite hardware, glass conduits, violet light,
   one gold signal — each looping a short, physically consistent story:

     connect  three edge devices push data through sealed conduits into the Core9 hub
     analyze  the stream passes through a scanner gate and comes out structured
     detect   a lens picks the anomaly out of the flow; a diverter routes it to the alert bin
     alert    the event is routed to the right owner, who receives the check-mark

   Physical rules obeyed by every scene:
     · every conduit starts at a real outlet collar and ends at a real inlet collar
     · a data packet is always the same size; it is only ever hidden by opaque housing
       (it is born inside the source module and dies inside the destination module)
     · packets move at constant speed along a C1-continuous path — no jumps, no drops
   Rendered only while on screen. Falls back to the static illustration.
   ========================================================================== */
(function () {
  'use strict';
  if (!window.THREE) return;
  var THREE = window.THREE;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  var C = {
    graphite: 0x1d1533, graphite2: 0x2b2148, steel: 0xa79bc6, violet: 0x6a45c0, violetHi: 0xa58cff,
    lilac: 0xcdb8ff, white: 0xf3edff, gold: 0xe9b24c, floor: 0x140d25, glass: 0xb9a6ff, skin: 0xbfb3df
  };

  /* -------- shared textures (plain canvases; uploaded per renderer by three) -------- */
  function radial(stops, size) {
    var c = document.createElement('canvas'); c.width = c.height = size || 128;
    var x = c.getContext('2d'), s = c.width / 2, g = x.createRadialGradient(s, s, 0, s, s, s);
    stops.forEach(function (p) { g.addColorStop(p[0], p[1]); });
    x.fillStyle = g; x.fillRect(0, 0, c.width, c.height);
    return new THREE.CanvasTexture(c);
  }
  var glowTex = radial([[0, 'rgba(255,255,255,1)'], [0.18, 'rgba(255,255,255,.55)'], [0.5, 'rgba(255,255,255,.12)'], [1, 'rgba(255,255,255,0)']]);
  var fadeTex = radial([[0, '#fff'], [0.5, '#bbb'], [1, '#000']]);
  var gridTex = (function () {
    var c = document.createElement('canvas'); c.width = c.height = 256;
    var x = c.getContext('2d');
    x.fillStyle = '#150e27'; x.fillRect(0, 0, 256, 256);
    x.strokeStyle = 'rgba(165,140,255,.22)'; x.lineWidth = 1.2;
    x.beginPath(); x.moveTo(0.5, 0); x.lineTo(0.5, 256); x.moveTo(0, 0.5); x.lineTo(256, 0.5); x.stroke();
    var t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(14, 14); t.anisotropy = 4;
    return t;
  })();

  /* -------- image-based lighting: a tiny dark studio with three soft-boxes -------- */
  function makeEnv(renderer) {
    var pm = new THREE.PMREMGenerator(renderer), s = new THREE.Scene();
    s.add(new THREE.Mesh(new THREE.SphereGeometry(30, 32, 16), new THREE.MeshBasicMaterial({ color: 0x120a24, side: THREE.BackSide })));
    function panel(w, h, p, col, k) {
      var m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(col).multiplyScalar(k), side: THREE.DoubleSide }));
      m.position.set(p[0], p[1], p[2]); m.lookAt(0, 0, 0); s.add(m);
    }
    panel(14, 5, [-7, 10, 8], 0xfff0e2, 5.5);   // warm key
    panel(9, 7, [11, 5, -7], 0x8a63ff, 4.5);    // violet rim
    panel(16, 2.5, [0, 12, -10], 0xd9c8ff, 3);  // top strip
    panel(6, 4, [8, 3, 9], 0xb7a1ff, 1.6);      // soft fill
    var rt = pm.fromScene(s, 0.035);
    pm.dispose();
    return rt.texture;
  }

  function makeMats(env) {
    var e = env;
    function phys(o) { return new THREE.MeshPhysicalMaterial(Object.assign({ envMap: e, envMapIntensity: 1 }, o)); }
    var M = {
      graphite: phys({ color: 0x191330, roughness: 0.36, metalness: 0.6, clearcoat: 0.6, clearcoatRoughness: 0.25, envMapIntensity: 1.7 }),
      graphite2: phys({ color: 0x2a2147, roughness: 0.34, metalness: 0.55, clearcoat: 0.6, clearcoatRoughness: 0.25, envMapIntensity: 1.7 }),
      steel: phys({ color: C.steel, roughness: 0.28, metalness: 0.85 }),
      violet: phys({ color: C.violet, roughness: 0.32, metalness: 0.25, clearcoat: 0.7, emissive: 0x2a1466, emissiveIntensity: 0.6 }),
      screen: phys({ color: 0x07040f, roughness: 0.22, metalness: 0.4, clearcoat: 1 }),
      glass: new THREE.MeshPhysicalMaterial({ color: C.glass, roughness: 0.06, metalness: 0, transparent: true, opacity: 0.2, envMap: e, envMapIntensity: 1.6, depthWrite: false, clearcoat: 1, clearcoatRoughness: 0.05 }),
      skin: phys({ color: C.skin, roughness: 0.46, metalness: 0.12, clearcoat: 0.5, clearcoatRoughness: 0.4 }),
      goldBody: phys({ color: C.gold, roughness: 0.3, metalness: 0.7, emissive: C.gold, emissiveIntensity: 0.25 })
    };
    return M;
  }
  function light(color, k) { var m = new THREE.MeshBasicMaterial({ color: color, toneMapped: false }); m.userData.base = new THREE.Color(color); m.color.copy(m.userData.base).multiplyScalar(k == null ? 1 : k); return m; }
  function setLight(m, k) { m.color.copy(m.userData.base).multiplyScalar(k); }
  function setLightTo(m, colorHex, k) { m.userData.base.set(colorHex); m.color.copy(m.userData.base).multiplyScalar(k); }

  function shadow(m) { m.castShadow = true; m.receiveShadow = true; return m; }
  function rbox(w, h, d, r, material) {
    r = Math.min(r, w / 2 - 0.001, h / 2 - 0.001);
    var s = new THREE.Shape(), x = -w / 2, y = -h / 2;
    s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
    s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
    s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
    var bev = Math.min(r * 0.5, d * 0.3);
    var g = new THREE.ExtrudeGeometry(s, { depth: Math.max(0.001, d - bev * 2), bevelEnabled: true, bevelSize: bev * 0.7, bevelThickness: bev, bevelSegments: 4, curveSegments: 8 });
    g.translate(0, 0, -(d - bev * 2) / 2);
    return shadow(new THREE.Mesh(g, material));
  }
  function cyl(rt, rb, h, material, seg) { return shadow(new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg || 40), material)); }
  function sph(r, material) { return shadow(new THREE.Mesh(new THREE.SphereGeometry(r, 36, 24), material)); }
  function tor(r, t, material, seg) { return shadow(new THREE.Mesh(new THREE.TorusGeometry(r, t, 20, seg || 64), material)); }
  function slab(w, h, d, material) { var m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material); return m; }
  function v3(a) { return new THREE.Vector3(a[0], a[1], a[2]); }
  function place(o, x, y, z) { o.position.set(x, y, z); return o; }

  /* -------- conduits -------- */
  var TR = 0.072;  // conduit radius
  function line(a, b) { return new THREE.LineCurve3(v3(a), v3(b)); }
  function bez(a, b, c, d) { return new THREE.CubicBezierCurve3(v3(a), v3(b), v3(c), v3(d)); }
  function cpath(curves) { var p = new THREE.CurvePath(); curves.forEach(function (c) { p.add(c); }); return p; }
  function conduit(path, M) {
    var m = new THREE.Mesh(new THREE.TubeGeometry(path, 90, TR, 16, false), M.glass);
    m.renderOrder = 2; return m;
  }
  /* metal collar hugging a conduit end; dir = unit axis it sits on */
  function collar(M, p, axis) {
    var g = new THREE.Group();
    var a = cyl(TR + 0.045, TR + 0.045, 0.1, M.steel, 28); g.add(a);
    var b = cyl(TR + 0.02, TR + 0.02, 0.16, M.graphite2, 28); g.add(b);
    if (axis === 'x') g.rotation.z = Math.PI / 2; else if (axis === 'z') g.rotation.x = Math.PI / 2;
    g.position.set(p[0], p[1], p[2]);
    return g;
  }

  /* -------- data packets: constant-size lit bead + additive glow -------- */
  function Packet(color) {
    var g = new THREE.Group();
    var core = new THREE.Mesh(new THREE.SphereGeometry(0.075, 22, 16), new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false }));
    var glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0xffffff, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0 }));
    glow.scale.setScalar(0.62); glow.renderOrder = 3;
    g.add(core); g.add(glow); g.userData = { core: core, glow: glow, k: 0 };
    g.setColor = function (c) { core.material.color.set(c).multiplyScalar(1.35); glow.material.color.set(c); };
    g.setColor(color);
    g.visible = false;
    return g;
  }
  /* place a packet at fraction u of a path. Glow ramps in/out only while the bead is still inside opaque housing. */
  function drive(pk, path, u, edge) {
    edge = edge || 0.05;
    if (u <= 0 || u >= 1) { pk.visible = false; return; }
    pk.visible = true;
    path.getPointAt(u, pk.position);
    var a = Math.min(u / edge, (1 - u) / edge, 1);
    a = a * a * (3 - 2 * a);
    pk.userData.glow.material.opacity = 0.85 * a;
    pk.userData.core.visible = a > 0.02;
  }

  /* -------- small maths -------- */
  function clamp01(x) { return x < 0 ? 0 : x > 1 ? 1 : x; }
  function seg(t, a, b) { return clamp01((t - a) / (b - a)); }
  function smooth(x) { x = clamp01(x); return x * x * (3 - 2 * x); }
  function mod(a, b) { return ((a % b) + b) % b; }
  function gauss(x, c, w) { var d = (x - c) / w; return Math.exp(-d * d); }
  function easeOut(x) { x = clamp01(x); return 1 - Math.pow(1 - x, 3); }

  /* ================================================================ SCENES */
  var scenes = {};

  /* ------------------------------------------------------------- 01 CONNECT */
  scenes.connect = function (root, K) {
    var M = K.M, HX = 2.6;
    /* hub */
    var hub = new THREE.Group(); hub.position.set(HX, 0, 0); root.add(hub);
    var body = rbox(1.5, 1.2, 1.5, 0.14, M.graphite); place(body, 0, 0.6, 0); hub.add(body);
    var cap = rbox(1.58, 0.1, 1.58, 0.05, M.graphite2); place(cap, 0, 1.25, 0); hub.add(cap);
    var capLight = light(C.violetHi, 0.55); var cl = slab(1.2, 0.012, 1.2, capLight); place(cl, 0, 1.306, 0); hub.add(cl);
    var scr = rbox(1.08, 0.74, 0.06, 0.08, M.screen); place(scr, 0, 0.62, 0.75); hub.add(scr);
    var bars = [], barMats = [];
    for (var b = 0; b < 7; b++) {
      var bm = light(C.lilac, 0.6); var bar = slab(0.08, 1, 0.02, bm); bar.position.set(-0.36 + b * 0.12, 0.38, 0.79); bar.geometry.translate(0, 0.5, 0); hub.add(bar); bars.push(bar); barMats.push(bm);
    }
    var goldDot = light(C.gold, 1); var gd = new THREE.Mesh(new THREE.CircleGeometry(0.05, 24), goldDot); gd.position.set(0.44, 0.9, 0.785); hub.add(gd);
    var IZ = [-0.42, 0, 0.42];
    IZ.forEach(function (z) { hub.add(collar(M, [-0.79, 0.5, z], 'x')); });

    /* sources */
    var SX = -2.75, SZ = [-2.0, 0, 2.0], srcs = [], strips = [];
    function plinth(z) {
      var g = new THREE.Group(); g.position.set(SX, 0, z);
      var base = rbox(1.15, 0.26, 1.0, 0.07, M.graphite2); place(base, 0, 0.13, 0); g.add(base);
      var sm = light(C.violetHi, 0.5); var st = slab(0.9, 0.012, 0.02, sm); place(st, 0, 0.267, 0.42); g.add(st);
      g.add(collar(M, [0.6, 0.15, 0], 'x'));
      root.add(g); strips.push(sm); return g;
    }
    // camera
    var g0 = plinth(SZ[0]);
    var pole = cyl(0.045, 0.055, 0.7, M.steel, 20); place(pole, -0.1, 0.61, 0); g0.add(pole);
    var cam = new THREE.Group(); place(cam, -0.1, 1.08, 0); cam.rotation.y = 0.45; g0.add(cam);
    var cb = rbox(0.64, 0.3, 0.34, 0.09, M.graphite); cam.add(cb);
    var hood = cyl(0.13, 0.13, 0.2, M.graphite2, 32); hood.rotation.x = Math.PI / 2; place(hood, 0, 0, 0.26); cam.add(hood);
    var lensM = light(C.violetHi, 0.9); var lens = new THREE.Mesh(new THREE.CircleGeometry(0.085, 32), M.screen); place(lens, 0, 0, 0.365); cam.add(lens);
    var ledM = light(C.gold, 0.8); var led = new THREE.Mesh(new THREE.CircleGeometry(0.022, 16), ledM); place(led, 0.2, 0.09, 0.172); cam.add(led);
    // vehicle
    var g1 = plinth(SZ[1]);
    var tb = rbox(0.62, 0.38, 0.42, 0.06, M.graphite); place(tb, -0.14, 0.49, 0); g1.add(tb);
    var cab = rbox(0.3, 0.3, 0.4, 0.07, M.graphite2); place(cab, 0.33, 0.45, 0); g1.add(cab);
    var ws = slab(0.02, 0.13, 0.32, M.screen); place(ws, 0.485, 0.5, 0); g1.add(ws);
    [-0.32, 0.0, 0.34].forEach(function (x) { [-0.22, 0.22].forEach(function (z) { var w = cyl(0.085, 0.085, 0.06, M.steel, 24); w.rotation.x = Math.PI / 2; place(w, x, 0.345, z); g1.add(w); }); });
    var tele = light(C.gold, 0.8); var an = slab(0.05, 0.02, 0.05, tele); place(an, -0.14, 0.7, 0); g1.add(an);
    // sensor
    var g2 = plinth(SZ[2]);
    var mast = cyl(0.04, 0.05, 0.62, M.steel, 20); place(mast, -0.1, 0.57, 0); g2.add(mast);
    var ball = sph(0.15, M.violet); place(ball, -0.1, 0.98, 0); g2.add(ball);
    var waves = [];
    for (var w = 0; w < 2; w++) {
      var wm = new THREE.MeshBasicMaterial({ color: C.lilac, transparent: true, opacity: 0.4, toneMapped: false, depthWrite: false });
      var wr = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.008, 8, 64), wm); wr.rotation.x = Math.PI / 2; place(wr, -0.1, 0.98, 0); g2.add(wr); waves.push(wr);
    }
    srcs = [g0, g1, g2];

    /* conduits + packet paths */
    var paths = [], pks = [], travel = 2.9, P = 4.4, off = [0, 1.45, 2.9];
    for (var i = 0; i < 3; i++) {
      var O = [SX + 0.66, 0.15, SZ[i]], In = [HX - 0.84, 0.5, IZ[i]];
      var vis = cpath([bez(O, [O[0] + 1.6, O[1], O[2]], [In[0] - 1.3, In[1], In[2]], In)]);
      var full = cpath([line([O[0] - 0.55, O[1], O[2]], O), bez(O, [O[0] + 1.6, O[1], O[2]], [In[0] - 1.3, In[1], In[2]], In), line(In, [In[0] + 0.6, In[1], In[2]])]);
      root.add(conduit(vis, M)); paths.push(full);
      var pk = Packet([C.lilac, C.white, C.lilac][i]); root.add(pk); pks.push(pk);
    }
    var vf = [0.12, 0.88]; // hidden fractions of the full path (housing at each end)
    var kicks = [0, 0, 0];
    return function (t) {
      for (var i = 0; i < 3; i++) {
        var local = mod(t - off[i], P), u = local / travel;
        drive(pks[i], paths[i], u < 1 ? u : 2, 0.1);
        // emission cue on the source, arrival cue on the hub
        var em = gauss(local, 0.35, 0.35);
        setLight(strips[i], 0.45 + em * 1.4);
        var arr = mod(t - off[i] - travel * 0.9, P);
        kicks[i] = Math.exp(-arr * 3.2) * (arr < 2.2 ? 1 : 0);
      }
      setLight(ledM, 0.5 + gauss(mod(t - off[0], P), 0.35, 0.3) * 1.2);
      setLight(tele, 0.5 + gauss(mod(t - off[1], P), 0.35, 0.3) * 1.2);
      waves.forEach(function (wv, k) { var q = mod(t * 0.55 + k * 0.5 + off[2] * 0.1, 1); wv.scale.setScalar(0.55 + q * 1.1); wv.material.opacity = (1 - q) * 0.42 * (0.4 + 0.6 * gauss(mod(t - off[2], P), 0.6, 1.2)); });
      var e = kicks[0] + kicks[1] + kicks[2];
      for (var b = 0; b < 7; b++) {
        var h = 0.1 + 0.05 * Math.sin(t * 1.3 + b * 1.1) + Math.min(0.55, e * (0.25 + 0.3 * Math.abs(Math.sin(b * 2.3 + 1))));
        bars[b].scale.y = h; setLight(barMats[b], 0.45 + Math.min(1, e) * 0.9);
      }
      setLight(capLight, 0.5 + Math.min(1, e) * 1.0);
      setLight(goldDot, 0.6 + Math.min(1, e) * 1.0);
    };
  };

  /* ------------------------------------------------------------- 02 ANALYZE */
  scenes.analyze = function (root, K) {
    var M = K.M, Y = 0.58, X0 = -3.0, X1 = 2.95;
    /* ingest buffer (left) */
    var src = new THREE.Group(); src.position.set(X0, 0, 0); root.add(src);
    var sb = rbox(1.1, 0.95, 1.0, 0.1, M.graphite); place(sb, 0, 0.475, 0); src.add(sb);
    var scap = rbox(1.16, 0.08, 1.06, 0.04, M.graphite2); place(scap, 0, 0.97, 0); src.add(scap);
    var frames = [];
    for (var f = 0; f < 3; f++) { var fm = light(C.lilac, 0.5); var fr = slab(0.22, 0.14, 0.02, fm); fr.position.set(-0.28 + f * 0.28, 0.62, 0.51); src.add(fr); frames.push(fm); }
    var sl = light(C.violetHi, 0.6); var sst = slab(0.86, 0.012, 0.02, sl); place(sst, 0, 0.28, 0.51); src.add(sst);
    var O = [X0 + 0.6, Y, 0];
    src.add(collar(M, [0.6, Y, 0], 'x'));
    /* sink (right) */
    var dst = new THREE.Group(); dst.position.set(X1, 0, 0); root.add(dst);
    var db = rbox(1.15, 1.0, 1.05, 0.1, M.graphite); place(db, 0, 0.5, 0); dst.add(db);
    var dcap = rbox(1.21, 0.08, 1.11, 0.04, M.graphite2); place(dcap, 0, 1.02, 0); dst.add(dcap);
    var rows = [];
    for (var r = 0; r < 3; r++) { var rm = light(C.lilac, 0.35); var rw = slab(0.8, 0.07, 0.02, rm); rw.position.set(0, 0.3 + r * 0.22, 0.535); dst.add(rw); rows.push(rm); }
    var I = [X1 - 0.66, Y, 0];
    dst.add(collar(M, [-0.6, Y, 0], 'x'));
    /* scanner gate */
    var gates = [], gx = [-0.7, 0, 0.7];
    gx.forEach(function (x) {
      var g = new THREE.Group(); g.position.set(x, 0, 0);
      var ring = tor(0.52, 0.05, M.steel, 72); ring.rotation.y = Math.PI / 2; place(ring, 0, Y, 0); g.add(ring);
      var gm = light(C.violetHi, 0.55); var inner = new THREE.Mesh(new THREE.TorusGeometry(0.47, 0.012, 8, 72), gm); inner.rotation.y = Math.PI / 2; place(inner, 0, Y, 0); g.add(inner);
      var foot = rbox(0.2, 0.09, 0.62, 0.03, M.graphite2); place(foot, 0, 0.045, 0); g.add(foot);
      root.add(g); gates.push(gm);
    });
    /* display wall behind the gate: 15 live channels */
    var wallZ = -1.45, wall = rbox(4.5, 1.55, 0.07, 0.07, M.graphite); place(wall, 0.05, 0.85, wallZ); root.add(wall);
    var face = new THREE.Mesh(new THREE.PlaneGeometry(4.28, 1.33), M.screen); place(face, 0.05, 0.85, wallZ + 0.045); root.add(face);
    var chans = [], chMats = [], NCH = 19;
    for (var c = 0; c < NCH; c++) {
      var cm = light(C.violetHi, 0.4); var ch = slab(0.09, 1, 0.02, cm); ch.geometry.translate(0, 0.5, 0);
      ch.position.set(-1.9 + c * (3.9 / (NCH - 1)) + 0.05, 0.36, wallZ + 0.06); root.add(ch); chans.push(ch); chMats.push(cm);
    }
    var sweepM = new THREE.MeshBasicMaterial({ color: C.lilac, transparent: true, opacity: 0.12, toneMapped: false, depthWrite: false, blending: THREE.AdditiveBlending });
    var sweep = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 1.2), sweepM); sweep.position.set(0, 0.85, wallZ + 0.07); root.add(sweep);

    /* conduit */
    var vis = cpath([line(O, I)]), full = cpath([line([O[0] - 0.55, O[1], O[2]], O), line(O, I), line(I, [I[0] + 0.6, I[1], I[2]])]);
    root.add(conduit(vis, M));
    var P = 4.2, travel = 3.9, pk = [Packet(C.lilac), Packet(C.lilac)]; pk.forEach(function (p) { root.add(p); });
    var xToU = function (x) { return (x - (O[0] - 0.55)) / ((I[0] + 0.6) - (O[0] - 0.55)); };
    var uG = xToU(0);
    return function (t) {
      var kick = 0, arrive = 0, gateAct = 0;
      for (var k = 0; k < 2; k++) {
        var local = mod(t - k * (P / 2), P), u = local / travel;
        drive(pk[k], full, u < 1 ? u : 2, 0.1);
        if (u > 0 && u < 1) {
          var px = pk[k].position.x;
          var s = smooth(seg(px, -0.75, 0.75));
          var col = new THREE.Color(C.lilac).lerp(new THREE.Color(C.white), s);
          pk[k].setColor(col);
          pk[k].userData.glow.scale.setScalar(0.62 + 0.18 * s);
          gateAct = Math.max(gateAct, gauss(px, 0, 1.05));
          // wall highlights the channels around the packet
          for (var c = 0; c < NCH; c++) { var cx = chans[c].position.x; var near = gauss(cx, px * 0.85, 0.5); chans[c]._near = Math.max(chans[c]._near || 0, near); }
          sweep.position.x = 0.05 + px * 0.85; sweepM.opacity = 0.14;
        }
        var arr = mod(t - k * (P / 2) - travel * 0.9, P); arrive = Math.max(arrive, Math.exp(-arr * 2.6) * (arr < 2.5 ? 1 : 0));
        var em = mod(t - k * (P / 2), P); kick = Math.max(kick, gauss(em, 0.3, 0.35));
      }
      // gate rings pulse in sequence as the bead passes their plane
      gates.forEach(function (gm, i) {
        var best = 0;
        for (var k = 0; k < 2; k++) { if (pk[k].visible) best = Math.max(best, gauss(pk[k].position.x, gx[i], 0.32)); }
        setLight(gm, 0.5 + best * 2.2);
      });
      for (var c = 0; c < NCH; c++) {
        var base = 0.12 + 0.07 * Math.sin(t * 1.4 + c * 0.9) + 0.05 * Math.sin(t * 2.3 + c * 1.7);
        var near = chans[c]._near || 0; chans[c]._near = 0;
        chans[c].scale.y = base + near * 0.5;
        setLight(chMats[c], 0.35 + near * 1.4);
      }
      if (!pk[0].visible && !pk[1].visible) sweepM.opacity = 0;
      frames.forEach(function (fm, i) { setLight(fm, 0.4 + kick * (0.9 + i * 0.1)); });
      setLight(sl, 0.45 + kick * 1.2);
      rows.forEach(function (rm, i) { setLight(rm, 0.3 + arrive * 1.5 * gauss(i, 2 - (1 - arrive) * 2.4, 0.9)); });
    };
  };

  /* -------------------------------------------------------------- 03 DETECT */
  scenes.detect = function (root, K) {
    var M = K.M, Y = 0.58, SX = -3.05, JX = 0.85, BX = 3.1, ZA = 0.6, ZB = -1.6;
    var src = new THREE.Group(); src.position.set(SX, 0, 0); root.add(src);
    var sb = rbox(1.1, 0.95, 1.0, 0.1, M.graphite); place(sb, 0, 0.475, 0); src.add(sb);
    var sc = rbox(1.16, 0.08, 1.06, 0.04, M.graphite2); place(sc, 0, 0.97, 0); src.add(sc);
    var sl = light(C.violetHi, 0.6); var sst = slab(0.86, 0.012, 0.02, sl); place(sst, 0, 0.28, 0.51); src.add(sst);
    for (var f = 0; f < 3; f++) { var fm = light(C.lilac, 0.5); var fr = slab(0.22, 0.14, 0.02, fm); fr.position.set(-0.28 + f * 0.28, 0.62, 0.51); src.add(fr); }
    src.add(collar(M, [0.6, Y, 0], 'x'));
    var O = [SX + 0.6, Y, 0];

    /* lens gate */
    var LX = -1.05, lens = new THREE.Group(); lens.position.set(LX, 0, 0); root.add(lens);
    var lr = tor(0.72, 0.065, M.steel, 80); lr.rotation.y = Math.PI / 2; place(lr, 0, Y, 0); lens.add(lr);
    var lm = light(C.violetHi, 0.55); var li = new THREE.Mesh(new THREE.TorusGeometry(0.655, 0.014, 8, 80), lm); li.rotation.y = Math.PI / 2; place(li, 0, Y, 0); lens.add(li);
    var lfoot = rbox(0.24, 0.1, 0.9, 0.04, M.graphite2); place(lfoot, 0, 0.05, 0); lens.add(lfoot);
    var discM = new THREE.MeshBasicMaterial({ color: C.violetHi, transparent: true, opacity: 0.05, toneMapped: false, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending });
    var disc = new THREE.Mesh(new THREE.CircleGeometry(0.65, 48), discM); disc.rotation.y = Math.PI / 2; place(disc, 0, Y, 0); lens.add(disc);

    /* junction, bins */
    var jn = sph(0.19, M.steel); place(jn, JX, Y, 0); root.add(jn);
    var paddle = new THREE.Group(); place(paddle, JX, Y, 0); root.add(paddle);
    var pd = rbox(0.26, 0.05, 0.03, 0.01, M.graphite2); pd.position.set(0.15, 0, 0); paddle.add(pd);
    function bin(z, accent) {
      var g = new THREE.Group(); g.position.set(BX, 0, z);
      var b = rbox(1.15, 0.95, 1.0, 0.1, M.graphite); place(b, 0, 0.475, 0); g.add(b);
      var cp = rbox(1.21, 0.08, 1.06, 0.04, M.graphite2); place(cp, 0, 0.97, 0); g.add(cp);
      var st = light(accent, 0.45); var s = slab(0.86, 0.02, 0.012, st); place(s, 0, 0.72, 0.505); g.add(s);
      var lid = light(accent, 0.4); var l = slab(0.9, 0.012, 0.9, lid); place(l, 0, 1.012, 0); g.add(l);
      g.add(collar(M, [-0.6, Y, 0], 'x'));
      root.add(g); return { st: st, lid: lid };
    }
    var binA = bin(ZA, C.violetHi), binB = bin(ZB, C.gold);
    var IA = [BX - 0.66, Y, ZA], IB = [BX - 0.66, Y, ZB], J = [JX, Y, 0];
    var S = line(O, J);
    var A = bez(J, [J[0] + 0.7, Y, 0], [IA[0] - 0.7, Y, IA[2]], IA);
    var B = bez(J, [J[0] + 0.8, Y, 0], [IB[0] - 1.0, Y, IB[2]], IB);
    root.add(conduit(cpath([S]), M)); root.add(conduit(cpath([A]), M)); root.add(conduit(cpath([B]), M));
    function fullPath(branch, end) { return cpath([line([O[0] - 0.55, Y, 0], O), S, branch, line(end, [end[0] + 0.6, end[1], end[2]])]); }
    var pathA = fullPath(A, IA), pathB = fullPath(B, IB);
    /* detection brackets (gold) — 4 corner L's, billboarded */
    var br = new THREE.Group(); br.visible = false; root.add(br);
    var bm = light(C.gold, 1.15), bs = 0.26, bt = 0.022, bl = 0.1;
    [[-1, 1], [1, 1], [-1, -1], [1, -1]].forEach(function (q) {
      var h = slab(bl, bt, bt, bm); h.position.set(q[0] * (bs - bl / 2 + bt / 2), q[1] * bs, 0); br.add(h);
      var v = slab(bt, bl, bt, bm); v.position.set(q[0] * bs, q[1] * (bs - bl / 2 + bt / 2), 0); br.add(v);
    });
    /* pool */
    var STEP = 2.2, LOOP = STEP * 3, travel = 4.6, pk = [], slots = 3;
    for (var m = 0; m < slots; m++) { var p = Packet(C.lilac); root.add(p); pk.push(p); }
    var lenS = S.getLength(), lenA = A.getLength(), lenB = B.getLength(), pre = 0.55, post = 0.6;
    var totA = pre + lenS + lenA + post, totB = pre + lenS + lenB + post;
    var uR = (pre + (LX - O[0])) / totB, uJ = (pre + lenS) / totB;
    var pad = 0, lastT = 0;
    return function (t) {
      var lensFlash = 0, anomPos = null, anomU = -1, arrA = 0, arrB = 0, uAnom = -1;
      for (var m = 0; m < slots; m++) {
        var anomaly = m === 2;
        var path = anomaly ? pathB : pathA, tot = anomaly ? totB : totA, tr = travel * tot / totB;   // same linear speed on both branches
        var local = mod(t - m * STEP, LOOP), u = local / tr;
        drive(pk[m], path, u < 1 ? u : 2, 0.06);
        var uRm = (pre + (LX - O[0])) / tot;
        if (u > 0 && u < 1) {
          var d = smooth(seg(u, uRm - 0.015, uRm + 0.05));
          if (anomaly) { pk[m].setColor(new THREE.Color(C.lilac).lerp(new THREE.Color(C.gold), d)); pk[m].userData.glow.scale.setScalar(0.62 + 0.3 * d); anomU = u; anomPos = pk[m].position; uAnom = u; }
          lensFlash = Math.max(lensFlash, gauss(u, uRm, 0.028) * (anomaly ? 1.6 : 0.8));
        } else { pk[m].setColor(C.lilac); pk[m].userData.glow.scale.setScalar(0.62); }
        var arr = mod(t - m * STEP - tr * 0.93, LOOP);
        var a = Math.exp(-arr * 2.4) * (arr < 2.5 ? 1 : 0);
        if (anomaly) arrB = Math.max(arrB, a); else arrA = Math.max(arrA, a);
      }
      // the lens reacts as beads cross it
      setLight(lm, 0.5 + lensFlash * 1.7);
      if (lensFlash > 0.9) setLightTo(lm, C.gold, 0.9 + lensFlash * 0.6); else setLightTo(lm, C.violetHi, 0.5 + lensFlash * 1.7);
      discM.opacity = 0.05 + lensFlash * 0.07;
      // brackets lock on the anomaly from the lens to the diverter
      var on = anomPos && uAnom > uR - 0.01 && uAnom < uJ + 0.02;
      if (on) {
        br.visible = true; br.position.copy(anomPos);
        br.quaternion.copy(K.cam.quaternion);
        var lock = easeOut(seg(uAnom, uR - 0.01, uR + 0.05)), fadeOut = 1 - smooth(seg(uAnom, uJ - 0.03, uJ + 0.02));
        br.scale.setScalar((1.9 - 0.9 * lock) * (0.9 + 0.1 * fadeOut)); setLight(bm, 1.15 * lock * fadeOut);
      } else br.visible = false;
      // diverter paddle swings to the branch a moment before the bead reaches the junction
      var uA = uAnom < 0 ? -1 : uAnom;
      var dt = Math.min(0.1, Math.max(0, t - lastT)); lastT = t;
      var target = (uA > uR + 0.03 && uA < uJ + 0.055) ? 1 : 0;
      pad += (target - pad) * (1 - Math.exp(-dt * 7));
      paddle.rotation.y = -0.42 * pad;
      // bins
      setLight(binA.st, 0.4 + arrA * 1.6); setLight(binA.lid, 0.35 + arrA * 1.4);
      setLight(binB.st, 0.4 + arrB * 2.1); setLight(binB.lid, 0.35 + arrB * 1.8);
    };
  };

  /* --------------------------------------------------------------- 04 ALERT */
  scenes.alert = function (root, K) {
    var M = K.M, Y = 0.58, SX = -3.05, RX = -0.55, PX = 2.75, PZ = [-1.75, 0, 1.75];
    var src = new THREE.Group(); src.position.set(SX, 0, 0); root.add(src);
    var sb = rbox(1.1, 0.95, 1.0, 0.1, M.graphite); place(sb, 0, 0.475, 0); src.add(sb);
    var sc = rbox(1.16, 0.08, 1.06, 0.04, M.graphite2); place(sc, 0, 0.97, 0); src.add(sc);
    var evM = light(C.gold, 0.7); var ev = new THREE.Mesh(new THREE.CircleGeometry(0.1, 32), evM); place(ev, 0, 0.62, 0.505); src.add(ev);
    var evr = new THREE.Mesh(new THREE.RingGeometry(0.13, 0.15, 48), light(C.gold, 0.6)); place(evr, 0, 0.62, 0.505); src.add(evr);
    var sst = light(C.violetHi, 0.5); var sstm = slab(0.86, 0.012, 0.02, sst); place(sstm, 0, 0.28, 0.51); src.add(sstm);
    src.add(collar(M, [0.6, Y, 0], 'x'));
    var O = [SX + 0.6, Y, 0];
    /* router node */
    var rt = new THREE.Group(); rt.position.set(RX, Y, 0); root.add(rt);
    var rb = sph(0.3, M.graphite); rt.add(rb);
    var rr = tor(0.34, 0.02, M.steel, 64); rr.rotation.x = Math.PI / 2; rt.add(rr);
    var rlM = light(C.gold, 0.7); var rl = new THREE.Mesh(new THREE.CircleGeometry(0.05, 20), rlM); place(rl, 0, 0.02, 0.29); rt.add(rl);
    var R = [RX, Y, 0];
    /* stations */
    var stations = [];
    function bust() {
      var g = new THREE.Group();
      var pts = [[0, 0], [0.3, 0], [0.33, 0.03], [0.335, 0.09], [0.3, 0.19], [0.21, 0.27], [0.11, 0.31], [0.08, 0.34], [0.075, 0.4]].map(function (p) { return new THREE.Vector2(p[0], p[1]); });
      var body = shadow(new THREE.Mesh(new THREE.LatheGeometry(pts, 48), M.skin)); g.add(body);
      var head = sph(0.16, M.skin); place(head, 0, 0.52, 0); g.add(head);
      return g;
    }
    function checkShape() {
      // thick polyline (mitred) extruded as ONE solid, so the two strokes can never leave a gap
      var P = [[-0.115, 0.005], [-0.035, -0.075], [0.125, 0.095]], w = 0.042;
      function nrm(a, b) { var dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy); return [-dy / l, dx / l]; }
      var n0 = nrm(P[0], P[1]), n1 = nrm(P[1], P[2]);
      var mx = n0[0] + n1[0], my = n0[1] + n1[1], ml = Math.hypot(mx, my), ux = mx / ml, uy = my / ml;
      var mk = (w / 2) / (ux * n0[0] + uy * n0[1]), mv = [ux * mk, uy * mk];
      var L = [[P[0][0] + n0[0] * w / 2, P[0][1] + n0[1] * w / 2], [P[1][0] + mv[0], P[1][1] + mv[1]], [P[2][0] + n1[0] * w / 2, P[2][1] + n1[1] * w / 2]];
      var Rr = [[P[0][0] - n0[0] * w / 2, P[0][1] - n0[1] * w / 2], [P[1][0] - mv[0], P[1][1] - mv[1]], [P[2][0] - n1[0] * w / 2, P[2][1] - n1[1] * w / 2]];
      var s = new THREE.Shape(); s.moveTo(L[0][0], L[0][1]); s.lineTo(L[1][0], L[1][1]); s.lineTo(L[2][0], L[2][1]); s.lineTo(Rr[2][0], Rr[2][1]); s.lineTo(Rr[1][0], Rr[1][1]); s.lineTo(Rr[0][0], Rr[0][1]); s.closePath();
      return { shape: s, pts: [P[0], P[2]], w: w };
    }
    var cs = checkShape();
    for (var i = 0; i < 3; i++) {
      var g = new THREE.Group(); g.position.set(PX, 0, PZ[i]); root.add(g);
      var ped = cyl(0.44, 0.48, 0.2, M.graphite2, 56); place(ped, 0, 0.1, 0); g.add(ped);
      var pm = light(C.violetHi, 0.45); var pr = new THREE.Mesh(new THREE.TorusGeometry(0.455, 0.012, 8, 72), pm); pr.rotation.x = Math.PI / 2; place(pr, 0, 0.198, 0); g.add(pr);
      var person = bust(); place(person, 0, 0.2, 0); g.add(person);
      g.add(collar(M, [-0.5, 0.1, 0], 'x'));
      // badge (billboard): ring + one-piece check
      var badge = new THREE.Group(); badge.position.set(0, 1.25, 0); g.add(badge);
      var bgM = new THREE.MeshBasicMaterial({ color: 0x0a0616, transparent: true, opacity: 0.85, depthWrite: false }); var bg = new THREE.Mesh(new THREE.CircleGeometry(0.2, 40), bgM); badge.add(bg);
      var gm = light(C.gold, 1.1); var ring = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.024, 12, 64), gm); ring.position.z = 0.005; badge.add(ring);
      var ck = new THREE.Mesh(new THREE.ExtrudeGeometry(cs.shape, { depth: 0.012, bevelEnabled: false }), gm); ck.position.z = 0.0; badge.add(ck);
      cs.pts.forEach(function (p) { var cap = new THREE.Mesh(new THREE.CircleGeometry(cs.w / 2, 20), gm); cap.position.set(p[0], p[1], 0.013); badge.add(cap); });
      // ripple on the floor
      var rp = new THREE.Mesh(new THREE.RingGeometry(0.48, 0.5, 72), new THREE.MeshBasicMaterial({ color: C.gold, transparent: true, opacity: 0, toneMapped: false, depthWrite: false, side: THREE.DoubleSide })); rp.rotation.x = -Math.PI / 2; place(rp, 0, 0.012, 0); g.add(rp);
      badge.visible = false;
      stations.push({ g: g, pm: pm, badge: badge, gm: gm, bgM: bgM, rp: rp, person: person });
    }
    var IN = PZ.map(function (z) { return [PX - 0.53, 0.1, z]; });
    var branches = IN.map(function (In) { return bez(R, [R[0] + 0.85, Y, R[2] + (In[2]) * 0.18], [In[0] - 1.0, 0.1 + 0.1, In[2]], In); });
    var S = line(O, R);
    root.add(conduit(cpath([S]), M));
    branches.forEach(function (b) { root.add(conduit(cpath([b]), M)); });
    var fulls = branches.map(function (b, i) { return cpath([line([O[0] - 0.55, Y, 0], O), S, b, line(IN[i], [IN[i][0] + 0.45, IN[i][1], IN[i][2]])]); });
    var STEP = 3.5, LOOP = STEP * 3, travel = 4.3, ORDER = [1, 2, 0], pk = [];
    for (var m = 0; m < 3; m++) { var p = Packet(C.gold); root.add(p); pk.push(p); }
    var pre = 0.55, lenS = S.getLength(), ff = fulls.map(function (f) { return f.getLength(); });
    var uRt = function (m) { return (pre + lenS) / ff[ORDER[m]]; };
    return function (t) {
      var act = [0, 0, 0], evk = 0, rtk = 0;
      for (var m = 0; m < 3; m++) {
        var local = mod(t - m * STEP, LOOP), u = local / travel, st = ORDER[m];
        drive(pk[m], fulls[st], u < 1 ? u : 2, 0.06);
        evk = Math.max(evk, gauss(local, 0.4, 0.4));
        rtk = Math.max(rtk, gauss(u, uRt(m), 0.05));
        // arrival at the chosen station → badge
        var tArr = travel * 0.93, q = local - tArr;
        act[st] = Math.max(act[st], q > 0 && q < 2.3 ? 1 : 0);
        var S_ = stations[st];
        if (q > 0 && q < 2.3) {
          var pop = easeOut(seg(q, 0, 0.55)), out = 1 - smooth(seg(q, 1.7, 2.3));
          S_.badge.visible = true; S_.badge.quaternion.copy(K.cam.quaternion);
          var sc_ = 0.55 + 0.45 * pop; S_.badge.scale.setScalar(sc_ * (0.92 + 0.08 * out));
          S_.badge.position.y = 1.2 + 0.06 * pop + Math.sin(q * 2.6) * 0.012;
          S_.bgM.opacity = 0.85 * pop * out; S_.gm.color.copy(S_.gm.userData.base).multiplyScalar(1.1 * pop * out);
          setLightTo(S_.pm, C.gold, 0.5 + 1.6 * gauss(q, 0.15, 0.5) * out);
          var rq = seg(q, 0.05, 1.6); S_.rp.material.opacity = (1 - rq) * 0.55 * (q > 0.05 ? 1 : 0); S_.rp.scale.setScalar(1 + rq * 1.5);
        } else if (!act[st]) {
          S_.badge.visible = false; S_.rp.material.opacity = 0; setLightTo(S_.pm, C.violetHi, 0.45);
        }
      }
      setLight(evM, 0.5 + evk * 1.5);
      setLight(rlM, 0.5 + rtk * 1.6);
    };
  };

  /* ---------------------------------------------------------------- host */
  function mount(el) {
    var name = el.dataset.scene, build = scenes[name];
    if (!build) return null;
    var host = el.closest('.bcard');
    var renderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas: el, antialias: true, alpha: true, powerPreference: 'default' });
    } catch (e) { return null; }
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setClearColor(0x000000, 0);

    var scene = new THREE.Scene();
    var env = makeEnv(renderer);
    scene.environment = env;
    var cam = new THREE.PerspectiveCamera(26, 1, 0.1, 60);
    cam.position.set(0.3, 4.4, 10.2); cam.lookAt(0.1, 0.8, 0);

    scene.add(new THREE.HemisphereLight(0xa997ff, 0x0d0719, 0.3));
    var key = new THREE.DirectionalLight(0xfff0e4, 2.1);
    key.position.set(-3.5, 7, 5); key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024); key.shadow.radius = 5; key.shadow.bias = -0.0005; key.shadow.normalBias = 0.02;
    var sc = key.shadow.camera; sc.left = -7; sc.right = 7; sc.top = 6; sc.bottom = -5; sc.near = 1; sc.far = 22;
    scene.add(key);
    var rim = new THREE.DirectionalLight(0x8a63ff, 1.3); rim.position.set(5, 3, -4); scene.add(rim);

    var floorMat = new THREE.MeshStandardMaterial({ color: 0x5c5478, map: gridTex, roughness: 1, metalness: 0, envMapIntensity: 0.12, alphaMap: fadeTex, transparent: true });
    var floor = new THREE.Mesh(new THREE.CircleGeometry(6.6, 72), floorMat);
    floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);

    var K = { M: makeMats(env), cam: cam };
    var root = new THREE.Group(); scene.add(root);
    var update = build(root, K);

    var w = 0, h = 0, vis = false, ptr = { x: 0, y: 0, tx: 0, ty: 0 }, time = 2.0;
    function size() {
      var r = el.getBoundingClientRect();
      var W = Math.max(2, Math.round(r.width)), H = Math.max(2, Math.round(r.height));
      if (W === w && H === h) return; w = W; h = H;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
      renderer.setSize(W, H, false);
      cam.aspect = W / H;
      var need = 8.1, fov = 26;   // world width that must stay in frame
      var hfov = 2 * Math.atan(Math.tan(fov * Math.PI / 360) * cam.aspect);
      var dist = Math.max(8.6, (need / 2) / Math.tan(hfov / 2));
      cam.position.set(0.2, 5.6 * dist / 10.2, dist);
      cam.updateProjectionMatrix(); cam.lookAt(0.1, 0.42, 0);
      cam.updateMatrixWorld(true);
    }
    var last = performance.now();
    function frame(now) {
      if (!vis) return;
      requestAnimationFrame(frame);
      var dt = Math.min(0.05, (now - last) / 1000); last = now;
      time += dt;
      ptr.x += (ptr.tx - ptr.x) * 0.06; ptr.y += (ptr.ty - ptr.y) * 0.06;
      root.rotation.y = ptr.x * 0.14; root.rotation.x = ptr.y * 0.03;
      update(time);
      renderer.render(scene, cam);
    }
    function setVis(v) { if (v && !vis) { vis = true; last = performance.now(); size(); requestAnimationFrame(frame); } else if (!v) vis = false; }
    if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { es.forEach(function (e) { setVis(e.isIntersecting); }); }, { rootMargin: '80px' }).observe(host);
    else setVis(true);
    window.addEventListener('resize', function () { size(); });
    host.addEventListener('pointermove', function (e) { var r = host.getBoundingClientRect(); ptr.tx = ((e.clientX - r.left) / r.width - 0.5) * 2; ptr.ty = ((e.clientY - r.top) / r.height - 0.5) * 2; });
    host.addEventListener('pointerleave', function () { ptr.tx = 0; ptr.ty = 0; });
    size();
    window.__c9scene = window.__c9scene || {};
    window.__c9scene[name] = { set: function (t) { time = t; update(t); renderer.render(scene, cam); } };
    if (reduce) { update(3.2); renderer.render(scene, cam); }
    return true;
  }

  function boot() {
    Array.prototype.slice.call(document.querySelectorAll('canvas[data-scene]')).forEach(function (el) {
      var ok = false;
      try { ok = mount(el); } catch (e) { console.warn('[Core9] scene failed', e); }
      if (ok) el.closest('.bcard').classList.add('has-3d');
    });
  }
  window.C9Scenes = { boot: boot };
  if (document.readyState !== 'loading') boot(); else document.addEventListener('DOMContentLoaded', boot);
})();
