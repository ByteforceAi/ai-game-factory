export const BALLOON_POP_HTML = `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0,user-scalable=no,maximum-scale=1.0">
<title>Balloon Pop</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:100%;height:100%;overflow:hidden;touch-action:none}
canvas{display:block}
</style>
</head>
<body>
<canvas id="c"></canvas>
<script>
'use strict';
(function(){

window.score = 0;
window.gameOver = false;

var canvas = document.getElementById('c');
var ctx = canvas.getContext('2d');
var W, H;

function resize(){
  W = canvas.width = window.innerWidth;
  H = canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

/* ═══ Audio ═══ */
var AudioCtx = window.AudioContext || window.webkitAudioContext;
var actx = null;
function ensureAudio(){ if(!actx) try{actx=new AudioCtx()}catch(e){} if(actx&&actx.state==='suspended')actx.resume() }
function sfxPop(){
  if(!actx) return;
  var t=actx.currentTime, o=actx.createOscillator(), g=actx.createGain();
  o.type='sine'; o.frequency.setValueAtTime(800+Math.random()*400,t);
  o.frequency.exponentialRampToValueAtTime(200,t+0.15);
  g.gain.setValueAtTime(0.3,t); g.gain.exponentialRampToValueAtTime(0.01,t+0.15);
  o.connect(g); g.connect(actx.destination); o.start(t); o.stop(t+0.15);
}

/* ═══ Colors ═══ */
var BALLOON_COLORS = [
  {body:'#ff6b8a',shine:'#ff99b1',string:'#cc5570'},
  {body:'#6bb5ff',shine:'#99d0ff',string:'#5590cc'},
  {body:'#ffcc44',shine:'#ffdd77',string:'#ccaa33'},
  {body:'#88dd66',shine:'#aae888',string:'#66aa44'},
  {body:'#cc77ff',shine:'#dd99ff',string:'#9955cc'},
  {body:'#ff8844',shine:'#ffaa77',string:'#cc6633'},
  {body:'#44dddd',shine:'#77eee5',string:'#33aaaa'},
];

var SPECIAL_BALLOONS = [
  {type:'star', body:'#ffd700', shine:'#ffee66', string:'#ccaa00', points:5, emoji:'⭐'},
  {type:'heart', body:'#ff3366', shine:'#ff6699', string:'#cc2255', points:3, emoji:'💖'},
  {type:'bomb', body:'#333333', shine:'#555555', string:'#222222', points:-5, emoji:'💣'},
];

/* ═══ Game State ═══ */
var balloons = [];
var particles = [];
var popTexts = [];
var score = 0;
var combo = 0;
var comboTimer = 0;
var timeLeft = 60;
var lastTime = 0;
var gameState = 'playing';
var highScore = 0;
var level = 1;
var spawnTimer = 0;
var bgHue = 200;

function spawnBalloon(){
  var isSpecial = Math.random() < 0.15;
  var color, special = null;
  if(isSpecial){
    special = SPECIAL_BALLOONS[Math.floor(Math.random()*SPECIAL_BALLOONS.length)];
    color = special;
  } else {
    color = BALLOON_COLORS[Math.floor(Math.random()*BALLOON_COLORS.length)];
  }

  var size = 25 + Math.random()*20;
  var speed = 1 + Math.random()*2 + level*0.3;
  balloons.push({
    x: 30 + Math.random()*(W-60),
    y: H + size + 20,
    size: size,
    speed: speed,
    wobble: Math.random()*Math.PI*2,
    wobbleSpeed: 0.02+Math.random()*0.03,
    wobbleAmp: 1+Math.random()*2,
    color: color,
    special: special,
    popping: false,
    popFrame: 0,
    stringLen: 30+Math.random()*20,
  });
}

function spawnPopParticles(x, y, color, count){
  for(var i=0;i<count;i++){
    var angle = Math.random()*Math.PI*2;
    var speed = 2+Math.random()*5;
    particles.push({
      x:x, y:y,
      vx: Math.cos(angle)*speed,
      vy: Math.sin(angle)*speed,
      life: 1,
      color: color,
      size: 3+Math.random()*5,
    });
  }
}

/* ═══ Input ═══ */
function handlePop(px, py){
  ensureAudio();
  var hit = false;
  for(var i=balloons.length-1; i>=0; i--){
    var b = balloons[i];
    if(b.popping) continue;
    var dx = px-b.x, dy = py-b.y;
    if(dx*dx+dy*dy < (b.size+10)*(b.size+10)){
      // Pop!
      b.popping = true;
      sfxPop();

      var pts = b.special ? b.special.points : 1;
      if(pts > 0){
        combo++;
        comboTimer = 2;
        var multiplied = pts * Math.min(combo, 5);
        score += multiplied;
        window.score = score;
        popTexts.push({ x:b.x, y:b.y, text:'+'+multiplied, life:1, color: combo>=3?'#ffd700':'#fff' });
        if(combo >= 3){
          popTexts.push({ x:b.x, y:b.y-25, text: combo+'x COMBO!', life:1.5, color:'#ff4488' });
        }
      } else {
        // Bomb
        combo = 0;
        score = Math.max(0, score + pts);
        window.score = score;
        popTexts.push({ x:b.x, y:b.y, text:pts+'', life:1, color:'#ff3333' });
        // Screen shake handled by bomb color
      }

      spawnPopParticles(b.x, b.y, b.color.body, b.special ? 20 : 10);
      hit = true;
      break; // One pop per tap
    }
  }
  if(!hit){
    combo = 0;
  }
}

canvas.addEventListener('click', function(e){ if(gameState==='gameover'){restart();return} handlePop(e.clientX, e.clientY) });
canvas.addEventListener('touchstart', function(e){
  e.preventDefault();
  if(gameState==='gameover'){restart();return}
  for(var i=0;i<e.touches.length;i++) handlePop(e.touches[i].clientX, e.touches[i].clientY);
});

function restart(){
  score=0; combo=0; comboTimer=0; timeLeft=60; level=1;
  gameState='playing'; window.gameOver=false; window.score=0;
  balloons=[]; particles=[]; popTexts=[];
}

/* ═══ Update ═══ */
function update(dt){
  if(gameState !== 'playing') return;

  // Timer
  timeLeft -= dt;
  if(timeLeft <= 0){
    timeLeft = 0;
    gameState = 'gameover';
    window.gameOver = true;
    highScore = Math.max(highScore, score);
    return;
  }

  // Level up every 15 seconds
  level = Math.floor((60-timeLeft)/15) + 1;

  // Spawn
  spawnTimer -= dt;
  if(spawnTimer <= 0){
    spawnBalloon();
    spawnTimer = Math.max(0.3, 1.2 - level*0.15);
  }

  // Combo decay
  comboTimer -= dt;
  if(comboTimer <= 0) combo = 0;

  // Background hue shift
  bgHue = (bgHue + dt*8) % 360;

  // Balloons
  for(var i=balloons.length-1; i>=0; i--){
    var b = balloons[i];
    if(b.popping){
      b.popFrame += dt * 10;
      if(b.popFrame > 3) balloons.splice(i,1);
      continue;
    }
    b.y -= b.speed;
    b.wobble += b.wobbleSpeed;
    b.x += Math.sin(b.wobble) * b.wobbleAmp;
    // Off screen top
    if(b.y < -b.size*2){
      balloons.splice(i,1);
      combo = 0; // Missed balloon
    }
  }

  // Particles
  for(var i=particles.length-1;i>=0;i--){
    var p=particles[i];
    p.x+=p.vx; p.y+=p.vy; p.vy+=0.12;
    p.life-=dt*2;
    if(p.life<=0) particles.splice(i,1);
  }

  // Pop texts
  for(var i=popTexts.length-1;i>=0;i--){
    popTexts[i].y -= 1.5;
    popTexts[i].life -= dt;
    if(popTexts[i].life<=0) popTexts.splice(i,1);
  }
}

/* ═══ Draw Balloon ═══ */
function drawBalloon(b){
  if(b.popping){
    // Pop animation — expanding ring
    ctx.strokeStyle = b.color.body;
    ctx.lineWidth = 3;
    ctx.globalAlpha = 1 - b.popFrame/3;
    ctx.beginPath(); ctx.arc(b.x, b.y, b.size + b.popFrame*15, 0, Math.PI*2); ctx.stroke();
    ctx.globalAlpha = 1;
    return;
  }

  // String
  ctx.strokeStyle = b.color.string;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(b.x, b.y+b.size);
  ctx.quadraticCurveTo(b.x+Math.sin(b.wobble)*5, b.y+b.size+b.stringLen/2, b.x, b.y+b.size+b.stringLen);
  ctx.stroke();

  // Balloon body
  ctx.fillStyle = b.color.body;
  ctx.beginPath(); ctx.ellipse(b.x, b.y, b.size*0.85, b.size, 0, 0, Math.PI*2); ctx.fill();

  // Knot
  ctx.fillStyle = b.color.string;
  ctx.beginPath();
  ctx.moveTo(b.x-4, b.y+b.size);
  ctx.lineTo(b.x, b.y+b.size+6);
  ctx.lineTo(b.x+4, b.y+b.size);
  ctx.fill();

  // Shine
  ctx.fillStyle = b.color.shine;
  ctx.globalAlpha = 0.5;
  ctx.beginPath(); ctx.ellipse(b.x-b.size*0.25, b.y-b.size*0.3, b.size*0.2, b.size*0.35, -0.3, 0, Math.PI*2); ctx.fill();
  ctx.globalAlpha = 1;

  // Special emoji
  if(b.special){
    ctx.font = (b.size*0.7)+'px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(b.special.emoji, b.x, b.y);
  }

  // Cute face on normal balloons
  if(!b.special){
    ctx.fillStyle = 'rgba(0,0,0,0.12)';
    ctx.beginPath(); ctx.arc(b.x-b.size*0.15, b.y-b.size*0.1, 2, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(b.x+b.size*0.15, b.y-b.size*0.1, 2, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(b.x, b.y+b.size*0.1, 3, 0, Math.PI); ctx.stroke();
  }
}

/* ═══ Render ═══ */
function render(){
  // Background
  var h1 = bgHue, h2 = (bgHue+40)%360;
  var grad = ctx.createLinearGradient(0,0,0,H);
  grad.addColorStop(0, 'hsl('+h1+',70%,88%)');
  grad.addColorStop(1, 'hsl('+h2+',60%,82%)');
  ctx.fillStyle = grad;
  ctx.fillRect(0,0,W,H);

  // Soft clouds
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  var t = Date.now()/3000;
  for(var i=0;i<4;i++){
    var cx = ((i*250+t*50)%(W+200))-100;
    ctx.beginPath(); ctx.ellipse(cx, 80+i*40, 60, 20, 0, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(cx+30, 70+i*40, 40, 18, 0, 0, Math.PI*2); ctx.fill();
  }

  // Balloons
  for(var i=0;i<balloons.length;i++) drawBalloon(balloons[i]);

  // Particles
  for(var i=0;i<particles.length;i++){
    var p=particles[i];
    ctx.globalAlpha=p.life;
    ctx.fillStyle=p.color;
    ctx.beginPath(); ctx.arc(p.x,p.y,p.size,0,Math.PI*2); ctx.fill();
  }
  ctx.globalAlpha=1;

  // Pop texts
  for(var i=0;i<popTexts.length;i++){
    var t2=popTexts[i];
    ctx.globalAlpha=t2.life;
    ctx.fillStyle=t2.color;
    ctx.font='bold 18px Courier New';
    ctx.textAlign='center';
    ctx.fillText(t2.text, t2.x, t2.y);
  }
  ctx.globalAlpha=1;

  // HUD
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.beginPath(); ctx.roundRect(W/2-90, 8, 180, 36, 18); ctx.fill();
  ctx.fillStyle = '#666';
  ctx.font = 'bold 14px Courier New';
  ctx.textAlign = 'center';
  ctx.fillText('🎈 '+score+'  ⏱ '+Math.ceil(timeLeft)+'s', W/2, 32);

  // Combo indicator
  if(combo >= 2){
    ctx.fillStyle = 'rgba(255,68,136,0.9)';
    ctx.font = 'bold 16px Courier New';
    ctx.textAlign = 'right';
    ctx.fillText(combo+'x', W-20, 34);
  }

  // Timer bar
  var tbw = W - 40;
  ctx.fillStyle = 'rgba(0,0,0,0.08)';
  ctx.beginPath(); ctx.roundRect(20, H-20, tbw, 8, 4); ctx.fill();
  var pct = timeLeft/60;
  ctx.fillStyle = pct > 0.3 ? '#88dd66' : pct > 0.1 ? '#ffcc44' : '#ff4444';
  ctx.beginPath(); ctx.roundRect(20, H-20, tbw*pct, 8, 4); ctx.fill();

  // Game over
  if(gameState==='gameover'){
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fillRect(0,0,W,H);

    ctx.fillStyle = 'rgba(255,255,255,0.92)';
    ctx.beginPath(); ctx.roundRect(W/2-120, H/2-80, 240, 160, 20); ctx.fill();

    ctx.textAlign = 'center';
    ctx.font = '32px serif';
    ctx.fillText('🎈', W/2, H/2-42);

    ctx.fillStyle = '#ff6699';
    ctx.font = 'bold 20px Courier New';
    ctx.fillText('Time Up!', W/2, H/2-10);

    ctx.fillStyle = '#666';
    ctx.font = '14px Courier New';
    ctx.fillText('Score: '+score, W/2, H/2+16);
    ctx.fillText('Best: '+highScore, W/2, H/2+36);

    ctx.fillStyle = '#999';
    ctx.font = '11px Courier New';
    ctx.fillText('탭하여 다시 시작', W/2, H/2+60);
  }
}

/* ═══ Loop ═══ */
function loop(time){
  var dt = Math.min(0.05, (time - lastTime)/1000);
  lastTime = time;
  update(dt);
  render();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

// ====== VIBE CODING: postMessage HANDLERS ======
window.addEventListener('message', function(e){
  if(!e.data || !e.data.type) return;
  switch(e.data.type){
    case 'SET_TIME':
      timeLeft = Math.max(1, parseInt(e.data.value)||60);
      break;
    case 'SET_COMBO':
      combo = parseInt(e.data.value)||0;
      comboTimer = 3;
      break;
    case 'SET_SPAWN_RATE':
      window._spawnMult = parseFloat(e.data.value)||1;
      break;
    case 'SET_GAME_SPEED':
      window._gameSpeedMult = parseFloat(e.data.value)||1;
      break;
  }
});

})();
</script>
</body>
</html>`;
