/**
 * Script injected into game iframes to add:
 * 1. Mobile viewport + canvas scaling
 * 2. Virtual joystick touch controls (drag-to-move, tap-to-fire, multi-touch)
 * 3. Game over detection → postMessage to parent
 */
export function getGameExtensionsScript(): string {
  return `
(function() {
  /* ========================================
     MOBILE VIEWPORT + CANVAS FIX
     ======================================== */
  if (!document.querySelector('meta[name="viewport"]')) {
    var meta = document.createElement('meta');
    meta.name = 'viewport';
    meta.content = 'width=device-width, initial-scale=1, user-scalable=no';
    document.head.appendChild(meta);
  }

  var canvas = document.getElementById('gameCanvas');
  if (canvas) {
    canvas.style.display = 'block';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.objectFit = 'contain';
    canvas.style.touchAction = 'none';
    canvas.style.imageRendering = 'pixelated';
    canvas.style.imageRendering = 'crisp-edges';
  }
  document.body.style.margin = '0';
  document.body.style.padding = '0';
  document.body.style.overflow = 'hidden';
  document.body.style.background = '#000';
  document.body.style.touchAction = 'none';
  document.body.style.userSelect = 'none';
  document.body.style.webkitUserSelect = 'none';
  document.documentElement.style.height = '100%';
  document.body.style.height = '100%';
  document.body.style.display = 'flex';
  document.body.style.alignItems = 'center';
  document.body.style.justifyContent = 'center';

  /* ========================================
     VIRTUAL JOYSTICK + TAP-TO-FIRE
     ======================================== */
  var isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
  if (!isTouch) { /* skip touch controls on non-touch devices */ }

  // Inject joystick visual overlay (hidden until touch)
  var joystickStyle = document.createElement('style');
  joystickStyle.textContent = [
    '.vj-base{position:fixed;width:100px;height:100px;border-radius:50%;',
    'border:2px solid rgba(255,255,255,0.2);background:rgba(0,0,0,0.15);',
    'pointer-events:none;z-index:99998;display:none;transform:translate(-50%,-50%)}',
    '.vj-knob{position:fixed;width:40px;height:40px;border-radius:50%;',
    'background:rgba(255,255,255,0.35);border:1px solid rgba(255,255,255,0.4);',
    'pointer-events:none;z-index:99999;display:none;transform:translate(-50%,-50%)}',
    '.vj-hint{position:fixed;bottom:16px;left:0;right:0;text-align:center;',
    'font-size:12px;color:rgba(255,255,255,0.4);pointer-events:none;z-index:99997;',
    'font-family:system-ui,sans-serif}',
    '@media(min-width:768px)and(hover:hover){.vj-base,.vj-knob,.vj-hint{display:none!important}}'
  ].join('');
  document.head.appendChild(joystickStyle);

  var vjBase = document.createElement('div');
  vjBase.className = 'vj-base';
  document.body.appendChild(vjBase);

  var vjKnob = document.createElement('div');
  vjKnob.className = 'vj-knob';
  document.body.appendChild(vjKnob);

  var vjHint = document.createElement('div');
  vjHint.className = 'vj-hint';
  vjHint.textContent = '\\u2B05 \\uD130\\uCE58\\uB85C \\uC870\\uC791  |  \\uD0ED\\uC73C\\uB85C \\uBC1C\\uC0AC \\u27A1';
  document.body.appendChild(vjHint);

  var DEADZONE = 15;
  var moveTouch = null; // {id, startX, startY}
  var fireTouch = null; // {id, startX, startY, startTime}
  var activeKeys = {};
  var controlsEnabled = false; // Don't activate controls until game starts

  /* ── Detect start/tutorial overlays and toggle controls ── */
  function isStartOverlayVisible() {
    // Look for common overlay patterns in demo games
    var overlays = document.querySelectorAll('[id*="start"], [id*="intro"], [id*="tutorial"], [id*="menu"], [id*="overlay"], [class*="start"], [class*="intro"], [class*="tutorial"], [class*="menu"], [class*="overlay"]');
    for (var i = 0; i < overlays.length; i++) {
      var el = overlays[i];
      var style = window.getComputedStyle(el);
      if (style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0') {
        // Check if it looks like a full-screen overlay (covers significant area)
        var rect = el.getBoundingClientRect();
        if (rect.width > window.innerWidth * 0.5 && rect.height > window.innerHeight * 0.3) {
          return true;
        }
      }
    }
    return false;
  }

  function showGameControls(show) {
    vjBase.style.display = show ? '' : 'none';
    vjKnob.style.display = show ? '' : 'none';
    vjHint.style.display = show ? '' : 'none';
    controlsEnabled = show;
    if (!show) clearAllKeys();
  }

  function isInteractiveTarget(el) {
    // Walk up the DOM to check if the touch target is a button, link, input, etc.
    var node = el;
    while (node && node !== document.body) {
      var tag = (node.tagName || '').toLowerCase();
      if (tag === 'button' || tag === 'a' || tag === 'input' || tag === 'select' || tag === 'textarea') return true;
      if (node.onclick || node.getAttribute && (node.getAttribute('onclick') || node.getAttribute('role') === 'button')) return true;
      // Check for cursor:pointer as a hint
      try {
        var cs = window.getComputedStyle(node);
        if (cs.cursor === 'pointer') return true;
      } catch(e) {}
      node = node.parentElement;
    }
    return false;
  }

  // Poll for start overlay state every 500ms
  var overlayCheckInterval = setInterval(function() {
    var overlayUp = isStartOverlayVisible();
    if (overlayUp && controlsEnabled) {
      showGameControls(false);
    } else if (!overlayUp && !controlsEnabled) {
      showGameControls(true);
    }
  }, 500);

  // Initial state: check after a short delay
  setTimeout(function() {
    if (!isStartOverlayVisible()) {
      showGameControls(true);
    }
  }, 800);

  function setKey(key, down) {
    if (down && !activeKeys[key]) {
      activeKeys[key] = true;
      document.dispatchEvent(new KeyboardEvent('keydown', {key:key,bubbles:true,cancelable:true}));
      if (typeof keys !== 'undefined') keys[key] = true;
    } else if (!down && activeKeys[key]) {
      activeKeys[key] = false;
      document.dispatchEvent(new KeyboardEvent('keyup', {key:key,bubbles:true,cancelable:true}));
      if (typeof keys !== 'undefined') keys[key] = false;
    }
  }

  function clearAllKeys() {
    ['ArrowLeft','ArrowRight','ArrowUp','ArrowDown',' '].forEach(function(k){setKey(k,false)});
  }

  function updateJoystick(cx, cy) {
    if (!moveTouch) return;
    var dx = cx - moveTouch.startX;
    var dy = cy - moveTouch.startY;
    var dist = Math.sqrt(dx*dx + dy*dy);

    // Clamp knob to base radius
    var maxR = 50;
    if (dist > maxR) { dx = dx/dist*maxR; dy = dy/dist*maxR; }

    vjKnob.style.left = (moveTouch.startX + dx) + 'px';
    vjKnob.style.top = (moveTouch.startY + dy) + 'px';

    if (dist < DEADZONE) {
      setKey('ArrowLeft', false);
      setKey('ArrowRight', false);
      setKey('ArrowUp', false);
      setKey('ArrowDown', false);
      return;
    }

    var angle = Math.atan2(dy, dx);
    // 8-direction snapping
    setKey('ArrowRight', angle > -0.7854 && angle < 0.7854);
    setKey('ArrowDown', angle > 0.3927 && angle < 2.7489);
    setKey('ArrowLeft', angle > 2.3562 || angle < -2.3562);
    setKey('ArrowUp', angle > -2.7489 && angle < -0.3927);
  }

  document.addEventListener('touchstart', function(e) {
    // If touch is on an interactive element (button, link, etc.) → let it through
    if (isInteractiveTarget(e.target)) return;
    // If controls are disabled (start overlay visible) → let touches through
    if (!controlsEnabled) return;

    e.preventDefault();
    vjHint.style.display = 'none';

    for (var i = 0; i < e.changedTouches.length; i++) {
      var t = e.changedTouches[i];
      if (!moveTouch) {
        // First finger = joystick
        moveTouch = {id: t.identifier, startX: t.clientX, startY: t.clientY, startTime: Date.now()};
        vjBase.style.left = t.clientX + 'px';
        vjBase.style.top = t.clientY + 'px';
        vjBase.style.display = 'block';
        vjKnob.style.left = t.clientX + 'px';
        vjKnob.style.top = t.clientY + 'px';
        vjKnob.style.display = 'block';
      } else if (!fireTouch) {
        // Second finger = continuous fire
        fireTouch = {id: t.identifier};
        setKey(' ', true);
      }
    }
  }, {passive: false});

  document.addEventListener('touchmove', function(e) {
    if (!controlsEnabled || !moveTouch) return;
    e.preventDefault();
    for (var i = 0; i < e.changedTouches.length; i++) {
      var t = e.changedTouches[i];
      if (moveTouch && t.identifier === moveTouch.id) {
        updateJoystick(t.clientX, t.clientY);
      }
    }
  }, {passive: false});

  document.addEventListener('touchend', function(e) {
    if (!controlsEnabled && !moveTouch && !fireTouch) return;
    for (var i = 0; i < e.changedTouches.length; i++) {
      var t = e.changedTouches[i];
      if (moveTouch && t.identifier === moveTouch.id) {
        var dx = t.clientX - moveTouch.startX;
        var dy = t.clientY - moveTouch.startY;
        var dist = Math.sqrt(dx*dx + dy*dy);
        var elapsed = Date.now() - moveTouch.startTime;

        // Tap detection: short + small movement = fire/space
        if (elapsed < 250 && dist < 15) {
          // Quick tap → Space key press
          setKey(' ', true);
          setTimeout(function(){ setKey(' ', false); }, 80);
        }

        clearAllKeys();
        moveTouch = null;
        vjBase.style.display = 'none';
        vjKnob.style.display = 'none';
      }
      if (fireTouch && t.identifier === fireTouch.id) {
        setKey(' ', false);
        fireTouch = null;
      }
    }
  }, {passive: false});

  document.addEventListener('touchcancel', function(e) {
    clearAllKeys();
    moveTouch = null;
    fireTouch = null;
    vjBase.style.display = 'none';
    vjKnob.style.display = 'none';
  }, {passive: false});

  /* ========================================
     GAME OVER DETECTION → postMessage
     ======================================== */
  var gameOverSent = false;

  function checkGameOver() {
    if (gameOverSent) return;
    var isOver = false;
    var currentScore = 0;

    if (typeof gameOver !== 'undefined' && gameOver === true) {
      isOver = true;
    }
    if (typeof score !== 'undefined') {
      currentScore = score;
    }
    if (isOver && !gameOverSent) {
      gameOverSent = true;
      try {
        window.parent.postMessage({type:'gameOver',score:currentScore}, '*');
      } catch(e) {}
    }
  }

  var gameOverInterval = setInterval(checkGameOver, 300);
  window.addEventListener('beforeunload', function() {
    clearInterval(gameOverInterval);
    clearInterval(overlayCheckInterval);
  });

  window.addEventListener('message', function(e) {
    if (e.data && e.data.type === 'resetGameOver') {
      gameOverSent = false;
    }
  });

  /* ========================================
     CODE X-RAY SYSTEM
     Receives highlight requests from parent
     and draws visual overlays on game canvas
     ======================================== */
  var xrayOverlay = null;
  var xrayLabel = null;
  var xrayTimer = null;

  function createXRayOverlay() {
    if (xrayOverlay) return;
    xrayOverlay = document.createElement('div');
    xrayOverlay.id = 'xray-overlay';
    xrayOverlay.style.cssText = 'position:fixed;pointer-events:none;z-index:99990;border:2px solid rgba(99,102,241,0.8);border-radius:8px;background:rgba(99,102,241,0.08);box-shadow:0 0 20px rgba(99,102,241,0.3),inset 0 0 20px rgba(99,102,241,0.05);transition:all 0.3s cubic-bezier(0.16,1,0.3,1);opacity:0;display:none';
    document.body.appendChild(xrayOverlay);

    xrayLabel = document.createElement('div');
    xrayLabel.id = 'xray-label';
    xrayLabel.style.cssText = 'position:fixed;pointer-events:none;z-index:99991;background:rgba(99,102,241,0.95);color:#fff;font-size:11px;font-family:system-ui,sans-serif;font-weight:600;padding:4px 10px;border-radius:6px;white-space:nowrap;transition:all 0.3s;opacity:0;display:none;box-shadow:0 2px 8px rgba(0,0,0,0.3)';
    document.body.appendChild(xrayLabel);
  }

  function showXRay(target, label) {
    createXRayOverlay();
    if (xrayTimer) { clearTimeout(xrayTimer); xrayTimer = null; }

    var rect = null;
    var W = window.innerWidth;
    var H = window.innerHeight;

    // Target zone mapping — works for ALL canvas-based games
    var zones = {
      'player':     { x: W*0.4,  y: H*0.65, w: W*0.2,  h: H*0.2,  lbl: '🚀 플레이어' },
      'score':      { x: W*0.02, y: 0,       w: W*0.3,  h: H*0.08, lbl: '🏆 점수 표시' },
      'enemies':    { x: W*0.1,  y: H*0.1,   w: W*0.8,  h: H*0.35, lbl: '👾 적/장애물 영역' },
      'background': { x: 0,      y: 0,       w: W,      h: H,      lbl: '🖼️ 배경/화면 전체' },
      'speed':      { x: W*0.3,  y: H*0.4,   w: W*0.4,  h: H*0.3,  lbl: '⚡ 속도 영향 영역' },
      'gravity':    { x: W*0.35, y: H*0.3,   w: W*0.3,  h: H*0.5,  lbl: '⬇️ 중력 영향 영역' },
      'collision':  { x: W*0.2,  y: H*0.3,   w: W*0.6,  h: H*0.4,  lbl: '💥 충돌 판정 영역' },
      'input':      { x: W*0.2,  y: H*0.5,   w: W*0.6,  h: H*0.4,  lbl: '🎮 입력 처리 영역' },
      'render':     { x: 0,      y: 0,       w: W,      h: H,      lbl: '🎨 렌더링 전체' },
      'ui':         { x: W*0.01, y: 0,       w: W*0.98, h: H*0.1,  lbl: '📊 UI/HUD 영역' },
      'spawn':      { x: W*0.1,  y: 0,       w: W*0.8,  h: H*0.15, lbl: '✨ 생성 영역' },
      'timer':      { x: W*0.7,  y: 0,       w: W*0.28, h: H*0.08, lbl: '⏱️ 타이머' },
      'lives':      { x: W*0.7,  y: 0,       w: W*0.28, h: H*0.08, lbl: '❤️ 목숨/체력' },
      'grid':       { x: W*0.15, y: H*0.05,  w: W*0.7,  h: H*0.9,  lbl: '🧱 그리드 영역' },
      'particles':  { x: 0,      y: 0,       w: W,      h: H,      lbl: '✨ 파티클 효과' },
    };

    // Try to read actual game object positions
    try {
      if (target === 'player') {
        if (typeof player !== 'undefined' && player.x != null) {
          var px = player.x, py = player.y;
          var pw = player.width || player.w || 40;
          var ph = player.height || player.h || 40;
          // Scale to viewport if canvas is scaled
          var cvs = document.getElementById('gameCanvas') || document.querySelector('canvas');
          if (cvs) {
            var cr = cvs.getBoundingClientRect();
            var sx = cr.width / (cvs.width || cr.width);
            var sy = cr.height / (cvs.height || cr.height);
            px = cr.left + px * sx;
            py = cr.top + py * sy;
            pw = pw * sx;
            ph = ph * sy;
          }
          zones.player = { x: px - pw*0.5, y: py - ph*0.5, w: pw*2, h: ph*2, lbl: zones.player.lbl };
        }
      }
    } catch(e) {}

    rect = zones[target] || zones['render'];
    var displayLabel = label || rect.lbl;

    xrayOverlay.style.left = rect.x + 'px';
    xrayOverlay.style.top = rect.y + 'px';
    xrayOverlay.style.width = rect.w + 'px';
    xrayOverlay.style.height = rect.h + 'px';
    xrayOverlay.style.display = 'block';
    xrayOverlay.style.opacity = '1';

    xrayLabel.textContent = displayLabel;
    xrayLabel.style.left = (rect.x + rect.w/2 - 60) + 'px';
    xrayLabel.style.top = Math.max(4, rect.y - 28) + 'px';
    xrayLabel.style.display = 'block';
    xrayLabel.style.opacity = '1';

    // Pulse animation
    xrayOverlay.style.animation = 'none';
    void xrayOverlay.offsetWidth;
    xrayOverlay.style.animation = 'xrayPulse 1.5s ease-in-out infinite';
  }

  function hideXRay() {
    if (!xrayOverlay) return;
    xrayOverlay.style.opacity = '0';
    xrayLabel.style.opacity = '0';
    xrayTimer = setTimeout(function() {
      if (xrayOverlay) xrayOverlay.style.display = 'none';
      if (xrayLabel) xrayLabel.style.display = 'none';
    }, 300);
  }

  // Inject pulse animation
  var xrayStyle = document.createElement('style');
  xrayStyle.textContent = '@keyframes xrayPulse{0%,100%{box-shadow:0 0 20px rgba(99,102,241,0.3),inset 0 0 20px rgba(99,102,241,0.05)}50%{box-shadow:0 0 40px rgba(99,102,241,0.5),inset 0 0 30px rgba(99,102,241,0.1)}}';
  document.head.appendChild(xrayStyle);

  /* ========================================
     GET_STATE — Live Dashboard support
     Returns current game variables to parent
     ======================================== */
  function getGameState() {
    var state = {};
    // Common variable names across all games
    var vars = ['score','speed','level','lives','gold','water','coins',
                'distance','fireRate','jumpForce','gravity','enemies',
                'lines','combo','time','playerX','playerY','growSpeed'];
    for (var i = 0; i < vars.length; i++) {
      try {
        var v = vars[i];
        if (typeof window[v] !== 'undefined') {
          var val = window[v];
          if (typeof val === 'number') state[v] = val;
          else if (Array.isArray(val)) state[v] = val.length;
          else if (typeof val === 'object' && val !== null) {
            // For player objects, extract x/y
            if (v === 'playerX' || v === 'playerY') state[v] = val;
            else if (val.length != null) state[v] = val.length;
          }
        }
        // Try player.x, player.y specifically
        if (v === 'playerX' && typeof player !== 'undefined' && player.x != null) state.playerX = player.x;
        if (v === 'playerY' && typeof player !== 'undefined' && player.y != null) state.playerY = player.y;
      } catch(e) {}
    }
    return state;
  }

  /* ========================================
     WEATHER OVERLAY SYSTEM
     Rain / Snow particles over canvas
     ======================================== */
  var weatherCanvas = null;
  var weatherCtx = null;
  var weatherType = null; // 'rain' | 'snow' | null
  var weatherParticles = [];
  var weatherRAF = null;

  function initWeatherCanvas() {
    if (weatherCanvas) return;
    weatherCanvas = document.createElement('canvas');
    weatherCanvas.id = 'weather-overlay';
    weatherCanvas.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:99980';
    document.body.appendChild(weatherCanvas);
    weatherCtx = weatherCanvas.getContext('2d');
    function resize() {
      weatherCanvas.width = window.innerWidth;
      weatherCanvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);
  }

  function startWeather(type) {
    initWeatherCanvas();
    weatherType = type;
    weatherParticles = [];
    var count = type === 'rain' ? 200 : 80;
    for (var i = 0; i < count; i++) {
      weatherParticles.push({
        x: Math.random() * weatherCanvas.width,
        y: Math.random() * weatherCanvas.height,
        speed: type === 'rain' ? 4 + Math.random() * 6 : 0.5 + Math.random() * 1.5,
        size: type === 'rain' ? 1 : 2 + Math.random() * 3,
        drift: type === 'snow' ? (Math.random() - 0.5) * 0.5 : 0,
        opacity: 0.3 + Math.random() * 0.5,
      });
    }
    if (!weatherRAF) animateWeather();
  }

  function stopWeather() {
    weatherType = null;
    weatherParticles = [];
    if (weatherRAF) { cancelAnimationFrame(weatherRAF); weatherRAF = null; }
    if (weatherCtx && weatherCanvas) weatherCtx.clearRect(0, 0, weatherCanvas.width, weatherCanvas.height);
  }

  function animateWeather() {
    if (!weatherType || !weatherCtx) return;
    var W = weatherCanvas.width, H = weatherCanvas.height;
    weatherCtx.clearRect(0, 0, W, H);

    for (var i = 0; i < weatherParticles.length; i++) {
      var p = weatherParticles[i];
      p.y += p.speed;
      p.x += p.drift;
      if (p.y > H) { p.y = -10; p.x = Math.random() * W; }
      if (p.x > W) p.x = 0;
      if (p.x < 0) p.x = W;

      weatherCtx.globalAlpha = p.opacity;
      if (weatherType === 'rain') {
        weatherCtx.strokeStyle = 'rgba(150,200,255,0.6)';
        weatherCtx.lineWidth = p.size;
        weatherCtx.beginPath();
        weatherCtx.moveTo(p.x, p.y);
        weatherCtx.lineTo(p.x + 0.5, p.y + 12);
        weatherCtx.stroke();
      } else {
        weatherCtx.fillStyle = '#fff';
        weatherCtx.beginPath();
        weatherCtx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        weatherCtx.fill();
      }
    }
    weatherCtx.globalAlpha = 1;
    weatherRAF = requestAnimationFrame(animateWeather);
  }

  /* ========================================
     UNIFIED MESSAGE HANDLER
     Handles: resetGameOver, XRAY, GET_STATE,
     WEATHER overlay, + vibe commands
     ======================================== */
  window.addEventListener('message', function(e) {
    if (!e.data || !e.data.type) return;

    switch (e.data.type) {
      case 'XRAY_HIGHLIGHT':
        showXRay(e.data.target, e.data.label);
        break;
      case 'XRAY_CLEAR':
        hideXRay();
        break;
      case 'GET_STATE':
        try {
          window.parent.postMessage({ type: 'STATE_REPORT', state: getGameState() }, '*');
        } catch(ex) {}
        break;
      case 'WEATHER_START':
        startWeather(e.data.weatherType || 'rain');
        break;
      case 'WEATHER_STOP':
        stopWeather();
        break;
    }
  });

})();
`;
}
