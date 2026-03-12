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
    e.preventDefault();
    for (var i = 0; i < e.changedTouches.length; i++) {
      var t = e.changedTouches[i];
      if (moveTouch && t.identifier === moveTouch.id) {
        updateJoystick(t.clientX, t.clientY);
      }
    }
  }, {passive: false});

  document.addEventListener('touchend', function(e) {
    e.preventDefault();
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
  });

  window.addEventListener('message', function(e) {
    if (e.data && e.data.type === 'resetGameOver') {
      gameOverSent = false;
    }
  });
})();
`;
}
