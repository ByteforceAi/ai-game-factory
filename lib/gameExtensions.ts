/**
 * Script injected into game iframes to add:
 * 1. Mobile touch controls (D-pad + action button)
 * 2. Game over detection → postMessage to parent
 * 3. Mobile viewport + canvas scaling
 */
export function getGameExtensionsScript(): string {
  return `
(function() {
  /* ========================================
     MOBILE VIEWPORT + CANVAS FIX
     ======================================== */
  if (!document.querySelector('meta[name="viewport"]')) {
    const meta = document.createElement('meta');
    meta.name = 'viewport';
    meta.content = 'width=device-width, initial-scale=1, user-scalable=no';
    document.head.appendChild(meta);
  }

  const canvas = document.getElementById('gameCanvas');
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
     TOUCH CONTROLS
     ======================================== */
  const isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);

  // Always create controls but only show on touch-capable devices
  const controlsHTML = \`
    <style>
      #touch-overlay {
        position: fixed; bottom: 0; left: 0; right: 0;
        padding: 12px 16px 20px;
        display: flex; justify-content: space-between; align-items: flex-end;
        z-index: 99999; pointer-events: none;
      }
      .tc-btn {
        width: 52px; height: 52px;
        border-radius: 14px;
        border: 1px solid rgba(255,255,255,0.25);
        background: rgba(0,0,0,0.35);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        color: white; font-size: 20px;
        display: flex; align-items: center; justify-content: center;
        pointer-events: auto; cursor: pointer;
        user-select: none; -webkit-user-select: none;
        touch-action: manipulation;
        transition: background 0.1s, transform 0.1s;
      }
      .tc-btn:active, .tc-btn.pressed {
        background: rgba(255,255,255,0.3);
        transform: scale(0.9);
      }
      .tc-action-btn {
        width: 64px; height: 64px;
        border-radius: 50%;
        background: rgba(0,122,255,0.5);
        border: 1px solid rgba(0,122,255,0.7);
        font-size: 14px; font-weight: 700;
        letter-spacing: 0.5px;
      }
      .tc-action-btn:active, .tc-action-btn.pressed {
        background: rgba(0,122,255,0.8);
      }
      .tc-dpad { display: flex; flex-direction: column; align-items: center; gap: 4px; }
      .tc-dpad-row { display: flex; gap: 4px; }
      @media (min-width: 768px) and (hover: hover) {
        #touch-overlay { display: none !important; }
      }
    </style>
    <div id="touch-overlay">
      <div class="tc-dpad">
        <button class="tc-btn" data-key="ArrowUp">▲</button>
        <div class="tc-dpad-row">
          <button class="tc-btn" data-key="ArrowLeft">◀</button>
          <button class="tc-btn" data-key="ArrowDown">▼</button>
          <button class="tc-btn" data-key="ArrowRight">▶</button>
        </div>
      </div>
      <button class="tc-btn tc-action-btn" data-key=" ">FIRE</button>
    </div>
  \`;

  const controlsContainer = document.createElement('div');
  controlsContainer.innerHTML = controlsHTML;
  document.body.appendChild(controlsContainer);

  // Touch event handlers - dispatch real keyboard events
  document.querySelectorAll('.tc-btn').forEach(function(btn) {
    var key = btn.getAttribute('data-key');

    function sendDown(e) {
      e.preventDefault();
      e.stopPropagation();
      btn.classList.add('pressed');
      document.dispatchEvent(new KeyboardEvent('keydown', { key: key, bubbles: true, cancelable: true }));
      // Also set global keys object if it exists
      if (typeof keys !== 'undefined') keys[key] = true;
    }

    function sendUp(e) {
      e.preventDefault();
      e.stopPropagation();
      btn.classList.remove('pressed');
      document.dispatchEvent(new KeyboardEvent('keyup', { key: key, bubbles: true, cancelable: true }));
      if (typeof keys !== 'undefined') keys[key] = false;
    }

    btn.addEventListener('touchstart', sendDown, { passive: false });
    btn.addEventListener('touchend', sendUp, { passive: false });
    btn.addEventListener('touchcancel', sendUp, { passive: false });
    btn.addEventListener('mousedown', sendDown);
    btn.addEventListener('mouseup', sendUp);
    btn.addEventListener('mouseleave', sendUp);
  });

  /* ========================================
     GAME OVER DETECTION → postMessage
     ======================================== */
  var gameOverSent = false;

  function checkGameOver() {
    if (gameOverSent) return;

    // Check common game over variable patterns
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
        window.parent.postMessage({
          type: 'gameOver',
          score: currentScore
        }, '*');
      } catch(e) {}
    }
  }

  // Poll for game over state
  var gameOverInterval = setInterval(checkGameOver, 300);

  // Also listen for page unload to clean up
  window.addEventListener('beforeunload', function() {
    clearInterval(gameOverInterval);
  });

  // Reset detection when game restarts
  window.addEventListener('message', function(e) {
    if (e.data && e.data.type === 'resetGameOver') {
      gameOverSent = false;
    }
  });
})();
`;
}
