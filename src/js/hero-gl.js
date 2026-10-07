/* ============================================================================
   Core9 — "Vision Lens" hero
   Raw WebGL hero (v3: the grid-distortion "wiggle" was removed):
   · a small "AI lens" follows the cursor: inside it the scene is revealed in
     full colour, as if Core9 is looking at it. When the lens passes a sector, its HUD tag locks on.
   · idle / touch: the lens patrols the scene on its own.
   No dependencies. Falls back to the static <img> if WebGL is unavailable.
   ========================================================================== */
(function () {
  'use strict';

  var hero = document.getElementById('hero');
  var canvas = document.getElementById('heroGL');
  if (!hero || !canvas) return;

  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var tags = Array.prototype.slice.call(hero.querySelectorAll('.tag'));
  var imgEl = document.getElementById('heroImg');

  var IMG_W = 2048, IMG_H = 1152;      // hero.jpg
  var gl = null, prog, uni = {}, tex, dataTex;
  var W = 1, H = 1, DPR = 1;
  var visible = true, started = false;

  /* ---- state ---- */
  var mouse = { x: 0.5, y: 0.5, px: 0.5, py: 0.5, vx: 0, vy: 0, inside: false, moved: 0 };
  var lens = { x: 0.5, y: 0.5, a: 0, r: 200, tx: 0.5, ty: 0.5, ta: 1 };
  var scrollP = 0;
  var t0 = performance.now(), last = t0;
  var intro = 0;                       // 0..1 reveal of the lens on load

  /* ---- shaders ---- */
  var VS = 'attribute vec2 p;varying vec2 vUv;void main(){vUv=p*.5+.5;gl_Position=vec4(p,0.,1.);}';
  var FS = [
    'precision highp float;',
    'varying vec2 vUv;',
    'uniform sampler2D uTex;',
    'uniform vec2 uRes,uImg,uShift,uLens;',
    'uniform float uZoom,uLensR,uLensA,uTime,uDark;',
    'vec2 cover(vec2 uv){',
    '  float ca=uRes.x/uRes.y, ia=uImg.x/uImg.y;',
    '  vec2 s=ca>ia?vec2(1.,ia/ca):vec2(ca/ia,1.);',
    '  s/=uZoom;',
    '  return (uv-.5)*s+.5+uShift;',
    '}',
    'float lum(vec3 c){return dot(c,vec3(.299,.587,.114));}',
    'void main(){',
    '  vec2 uv=vUv;',
    '  vec2 buv=cover(uv);',
    '  vec3 col=texture2D(uTex,buv).rgb;',
    '  vec2 px=uv*uRes;',
    '  vec2 lp=uLens*uRes;',
    '  float d=distance(px,lp);',
    /* DriveSense v2: no lens circle — just a soft light that follows the cursor */
    '  float m=exp(-(d*d)/(2.*uLensR*uLensR))*uLensA;',
    /* graded base: dusk purple, darkened so type sits on it */
    '  float l=lum(col);',
    '  vec3 base=mix(vec3(l),col,.7)*vec3(.9,.8,1.)*uDark;',
    '  vec3 rev=col*vec3(1.16,1.1,1.2);',
    '  vec3 o=mix(base,rev,m*.55);',
    '  o+=vec3(.62,.5,.95)*m*.07;',
    /* vignette */
    '  float v=smoothstep(.98,.34,distance((uv-.5)*vec2(1.,.82),vec2(0.)));',
    '  o*=mix(.42,1.,v);',
    '  gl_FragColor=vec4(o,1.);',
    '}'
  ].join('\n');

  function compile(type, src) {
    var s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      throw new Error(gl.getShaderInfoLog(s));
    }
    return s;
  }

  function initGL() {
    gl = canvas.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'high-performance', preserveDrawingBuffer: false }) ||
         canvas.getContext('experimental-webgl');
    if (!gl) throw new Error('no webgl');
    prog = gl.createProgram();
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, VS));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FS));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
    gl.useProgram(prog);

    var vb = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vb);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    var loc = gl.getAttribLocation(prog, 'p');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    ['uTex', 'uRes', 'uImg', 'uShift', 'uLens', 'uZoom', 'uLensR', 'uLensA', 'uTime', 'uDark'].forEach(function (n) {
      uni[n] = gl.getUniformLocation(prog, n);
    });

    gl.uniform1i(uni.uTex, 0);
  }

  function loadTexture(cb) {
    var im = new Image();
    im.onload = function () {
      IMG_W = im.naturalWidth; IMG_H = im.naturalHeight;
      tex = gl.createTexture();
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, im);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      cb();
    };
    // data-URI keeps the texture same-origin so it works straight from file://
    im.src = window.C9_HERO || (imgEl && imgEl.src);
  }

  function resize() {
    var r = hero.getBoundingClientRect();
    W = Math.max(1, Math.round(r.width));
    H = Math.max(1, Math.round(r.height));
    DPR = Math.min(window.devicePixelRatio || 1, W > 1100 ? 1.5 : 2);
    canvas.width = Math.round(W * DPR);
    canvas.height = Math.round(H * DPR);
    if (gl) gl.viewport(0, 0, canvas.width, canvas.height);
    lens.r = Math.max(110, Math.min(W, H) * 0.2) * DPR;   // gaussian sigma of the glow
  }

  /* image-space → screen-space (mirrors the shader's cover() so HUD tags stay pinned) */
  var ZOOM = 1.0, ZOOM0 = 1.14, ZOOM_DUR = 6.5, zoomT0 = 0;
  function introZoom(now) {
    if (!intro) { ZOOM = ZOOM0; return; }          // hold until the page intro hands over
    if (!zoomT0) zoomT0 = now;
    var t = Math.min(1, (now - zoomT0) / 1000 / ZOOM_DUR);
    var e = 1 - Math.pow(1 - t, 3);
    ZOOM = ZOOM0 + (1 - ZOOM0) * e;
  }
  function imgToScreen(nx, ny) {
    var ca = W / H, ia = IMG_W / IMG_H;
    var s = ca > ia ? [1, ia / ca] : [ca / ia, 1];
    s = [s[0] / (ZOOM + scrollP * 0.04), s[1] / (ZOOM + scrollP * 0.04)];
    var shiftY = -scrollP * 0.05;
    // image uv (origin bottom-left) = (uv-.5)*s+.5+shift  → uv = (imguv-.5-shift)/s+.5
    var iu = nx, iv = 1 - ny;
    var u = (iu - 0.5) / s[0] + 0.5;
    var v = (iv - 0.5 - shiftY) / s[1] + 0.5;
    return [u * W, (1 - v) * H];
  }

  /* ---- input ---- */
  function onMove(e) {
    var r = hero.getBoundingClientRect();
    var cx = (e.touches ? e.touches[0].clientX : e.clientX) - r.left;
    var cy = (e.touches ? e.touches[0].clientY : e.clientY) - r.top;
    if (cy < 0 || cy > r.height) { return; }
    mouse.x = cx / r.width;
    mouse.y = 1 - cy / r.height;
    mouse.inside = true;
    mouse.moved = performance.now();
  }
  function onLeave() { mouse.inside = false; }
  hero.addEventListener('pointermove', onMove, { passive: true });
  hero.addEventListener('pointerdown', onMove, { passive: true });
  hero.addEventListener('pointerleave', onLeave);
  window.addEventListener('resize', resize);

  function onScroll() {
    var r = hero.getBoundingClientRect();
    scrollP = Math.min(1, Math.max(0, -r.top / Math.max(1, r.height)));
    visible = r.bottom > 0 && r.top < window.innerHeight;
  }
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---- simulation ---- */
  function stepLens(dt, now) {
    var active = mouse.inside && now - mouse.moved < 2600;
    if (active) {
      lens.tx = mouse.x; lens.ty = mouse.y; lens.ta = 1;
    } else {
      // patrol: a slow lissajous sweep so the hero is alive without input
      var t = (now - t0) / 1000;
      lens.tx = 0.5 + Math.sin(t * 0.21) * 0.34 + Math.sin(t * 0.47 + 1.3) * 0.06;
      lens.ty = 0.5 + Math.cos(t * 0.17 + 0.6) * 0.2 + Math.sin(t * 0.39) * 0.05;
      lens.ta = 0.6;
    }
    var f = 1 - Math.pow(active ? 0.0009 : 0.02, dt);
    lens.x += (lens.tx - lens.x) * f;
    lens.y += (lens.ty - lens.y) * f;
    lens.a += (lens.ta * intro - lens.a) * (1 - Math.pow(0.02, dt));
  }

  function updateTags() {
    var lx = lens.x * W, ly = (1 - lens.y) * H;
    var rr = lens.r / DPR;
    for (var i = 0; i < tags.length; i++) {
      var t = tags[i];
      var p = imgToScreen(parseFloat(t.dataset.x), parseFloat(t.dataset.y));
      var on = p[0] > 30 && p[0] < W - 30 && p[1] > 90 && p[1] < H - 120;
      t.style.transform = 'translate3d(' + p[0].toFixed(1) + 'px,' + p[1].toFixed(1) + 'px,0)';
      t.classList.toggle('is-on', on);
      var dist = Math.hypot(p[0] - lx, p[1] - ly);
      var lock = on && dist < rr * 0.9 && lens.a > 0.35;
      // hysteresis so tags don't flicker at the boundary
      if (lock && !t._lock) { t._lock = true; t.classList.add('is-locked'); }
      else if (!lock && t._lock && dist > rr * 1.15) { t._lock = false; t.classList.remove('is-locked'); }
      // place the label away from the headline: above for top-half anchors, below otherwise
      var lab = t.querySelector('.tag__label');
      if (lab) {
        var above = p[1] < H * 0.5, leftSide = t.dataset.side ? t.dataset.side !== 'l' : p[0] < W * 0.5;
        lab.style.top = above ? '-108px' : '58px';
        lab.style.left = leftSide ? '-22px' : 'auto';
        lab.style.right = leftSide ? 'auto' : '-22px';
      }
    }
  }

  function frame(now) {
    requestAnimationFrame(frame);
    if (!visible || document.hidden) { last = now; return; }
    var dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (intro < 1) intro = Math.min(1, intro + dt * 0.7);

    introZoom(now);
    stepLens(dt, now);

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform2f(uni.uRes, canvas.width, canvas.height);
    gl.uniform2f(uni.uImg, IMG_W, IMG_H);
    gl.uniform2f(uni.uShift, 0, -scrollP * 0.05);
    gl.uniform2f(uni.uLens, lens.x, lens.y);
    gl.uniform1f(uni.uZoom, ZOOM + scrollP * 0.04);
    gl.uniform1f(uni.uLensR, lens.r);
    gl.uniform1f(uni.uLensA, lens.a);
    gl.uniform1f(uni.uTime, (now - t0) / 1000);
    gl.uniform1f(uni.uDark, 0.9 - scrollP * 0.3);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    updateTags();
  }

  /* static fallback: still place the HUD tags over the <img> (object-fit: cover, scale 1.06) */
  function staticTags() {
    ZOOM = 1.0;
    resize();
    tags.forEach(function (t) {
      var p = imgToScreen(parseFloat(t.dataset.x), parseFloat(t.dataset.y));
      t.style.transform = 'translate3d(' + p[0] + 'px,' + p[1] + 'px,0)';
      t.classList.add('is-on');
    });
  }

  window.C9Hero = {
    start: function () { intro = Math.max(intro, 0.001); },
    /* image-space (0..1) → hero-space px, for overlays that must stay pinned to the photo */
    map: function (nx, ny) { return imgToScreen(nx, ny); },
    size: function () { return [W, H]; },
    isGL: function () { return !!(gl && tex); }
  };

  /* ---- boot ---- */
  onScroll();
  resize();
  if (reduce) { hero.classList.add('is-static'); staticTags(); window.addEventListener('resize', staticTags); return; }
  try {
    initGL();
    loadTexture(function () {
      resize();
      hero.classList.add('is-gl');
      requestAnimationFrame(frame);
    });
  } catch (err) {
    console.warn('[Core9] WebGL hero unavailable, using static image.', err);
    staticTags();
    window.addEventListener('resize', staticTags);
  }
})();
