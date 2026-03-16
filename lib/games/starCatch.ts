export const STAR_CATCH_HTML = `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0,user-scalable=no,maximum-scale=1.0">
<title>Star Catch</title>
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

/* ═══ Player (cloud character) ═══ */
var player = {
  x: W/2, y: H - 80,
  w: 60, h: 30,
  targetX: W/2,
  speed: 0,
  bounceTimer: 0,
  face: 'happy', // happy, wow, ouch
  faceTimer: 0,
};

/* ═══ Stars & Items ═══ */
var items = [];
var particles = [];
var bgStars = [];
var score = 0;
var lives = 5;
var level = 1;
var spawnTimer = 0;
var gameState = 'playing';
var highScore = 0;
var totalCaught = 0;
var moonPhase = 0;

// Background stars
for(var i=0;i<80;i++){
  bgStars.push({
    x: Math.random()*2000,
    y: Math.random()*2000,
    size: 0.5+Math.random()*2,
    twinkle: Math.random()*Math.PI*2,
    speed: 0.01+Math.random()*0.02,
  });
}

var ITEM_TYPES = [
  { type:'star', emoji:'⭐', points:1, speed:2, chance:0.45, color:'#ffd700' },
  { type:'bigstar', emoji:'🌟', points:3, speed:1.5, chance:0.12, color:'#ffee44' },
  { type:'rainbow', emoji:'🌈', points:5, speed:1, chance:0.05, color:'#ff88cc' },
  { type:'moon', emoji:'🌙', points:2, speed:1.8, chance:0.1, color:'#aabbff' },
  { type:'comet', emoji:'☄️', points:4, speed:3.5, chance:0.08, color:'#ff6644' },
  { type:'cloud', emoji:'☁️', points:-1, speed:2.5, chance:0.15, color:'#aaaaaa' },
  { type:'thunder', emoji:'⚡', points:-2, speed:4, chance:0.05, color:'#ffcc00' },
];

function spawnItem(){
  var roll = Math.random();
  var cumulative = 0;
  var chosen = ITEM_TYPES[0];
  for(var i=0;i<ITEM_TYPES.length;i++){
    cumulative += ITEM_TYPES[i].chance;
    if(roll < cumulative){ chosen = ITEM_TYPES[i]; break; }
  }
  items.push({
    x: 30 + Math.random()*(W-60),
    y: -30,
    type: chosen,
    speed: chosen.speed + level*0.3 + Math.random()*0.5,
    wobble: Math.random()*Math.PI*2,
    rotation: 0,
    rotSpeed: (Math.random()-0.5)*0.1,
    size: chosen.type==='bigstar'||chosen.type==='rainbow' ? 28 : 22,
  });
}

function spawnCatchParticles(x, y, color, count){
  for(var i=0;i<count;i++){
    var angle = Math.random()*Math.PI*2;
    var speed = 2+Math.random()*4;
    particles.push({
      x:x, y:y,
      vx: Math.cos(angle)*speed,
      vy: Math.sin(angle)*speed - 2,
      life: 1,
      color: color,
      size: 2+Math.random()*4,
      shape: Math.random()>0.5 ? 'circle' : 'star',
    });
  }
}

/* ═══ Input ═══ */
var mouseX = W/2;
window.addEventListener('mousemove', function(e){ mouseX = e.clientX; });
window.addEventListener('touchmove', function(e){ e.preventDefault(); mouseX = e.touches[0].clientX; });
window.addEventListener('touchstart', function(e){
  e.preventDefault();
  mouseX = e.touches[0].clientX;
  if(gameState==='gameover') restart();
});
canvas.addEventListener('click', function(){ if(gameState==='gameover') restart(); });

function restart(){
  score=0; lives=5; level=1; totalCaught=0;
  gameState='playing'; window.gameOver=false; window.score=0;
  items=[]; particles=[];
  player.face='happy'; player.faceTimer=0;
}

/* ═══ Draw ═══ */
function drawStar5(cx, cy, r, r2){
  ctx.beginPath();
  for(var i=0;i<5;i++){
    var a = -Math.PI/2 + i*Math.PI*2/5;
    ctx.lineTo(cx+Math.cos(a)*r, cy+Math.sin(a)*r);
    var a2 = a + Math.PI/5;
    ctx.lineTo(cx+Math.cos(a2)*r2, cy+Math.sin(a2)*r2);
  }
  ctx.closePath();
}

function drawCloud(x, y, w, h){
  ctx.beginPath();
  ctx.ellipse(x, y, w*0.5, h*0.5, 0, 0, Math.PI*2);
  ctx.ellipse(x-w*0.3, y+h*0.1, w*0.3, h*0.4, 0, 0, Math.PI*2);
  ctx.ellipse(x+w*0.3, y+h*0.1, w*0.3, h*0.35, 0, 0, Math.PI*2);
  ctx.ellipse(x-w*0.15, y-h*0.2, w*0.25, h*0.3, 0, 0, Math.PI*2);
  ctx.ellipse(x+w*0.15, y-h*0.2, w*0.25, h*0.28, 0, 0, Math.PI*2);
  ctx.fill();
}

function drawPlayer(){
  var px = player.x, py = player.y;
  var bounce = Math.sin(player.bounceTimer)*2;

  // Cloud body
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = 'rgba(150,180,255,0.3)';
  ctx.shadowBlur = 15;
  drawCloud(px, py+bounce, player.w, player.h);
  ctx.shadowBlur = 0;

  // Face
  var face = player.face;
  ctx.fillStyle = '#556';

  if(face === 'happy'){
    ctx.beginPath(); ctx.arc(px-8, py+bounce-2, 2.5, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(px+8, py+bounce-2, 2.5, 0, Math.PI*2); ctx.fill();
    // Smile
    ctx.strokeStyle = '#556'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(px, py+bounce+3, 6, 0.1*Math.PI, 0.9*Math.PI); ctx.stroke();
    // Blush
    ctx.fillStyle = 'rgba(255,150,150,0.3)';
    ctx.beginPath(); ctx.ellipse(px-14, py+bounce+2, 5, 3, 0, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(px+14, py+bounce+2, 5, 3, 0, 0, Math.PI*2); ctx.fill();
  } else if(face === 'wow'){
    ctx.beginPath(); ctx.arc(px-8, py+bounce-2, 3.5, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(px+8, py+bounce-2, 3.5, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(px-7, py+bounce-3, 1.5, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(px+9, py+bounce-3, 1.5, 0, Math.PI*2); ctx.fill();
    // O mouth
    ctx.fillStyle = '#889';
    ctx.beginPath(); ctx.ellipse(px, py+bounce+5, 4, 5, 0, 0, Math.PI*2); ctx.fill();
  } else {
    // Ouch — X eyes
    ctx.strokeStyle = '#c44'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(px-11,py+bounce-5); ctx.lineTo(px-5,py+bounce+1); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(px-5,py+bounce-5); ctx.lineTo(px-11,py+bounce+1); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(px+5,py+bounce-5); ctx.lineTo(px+11,py+bounce+1); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(px+11,py+bounce-5); ctx.lineTo(px+5,py+bounce+1); ctx.stroke();
    // Wavy mouth
    ctx.strokeStyle = '#c44'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(px-6,py+bounce+6);
    ctx.quadraticCurveTo(px-3,py+bounce+3,px,py+bounce+6);
    ctx.quadraticCurveTo(px+3,py+bounce+9,px+6,py+bounce+6);
    ctx.stroke();
  }
}

/* ═══ Update ═══ */
function update(dt){
  if(gameState !== 'playing') return;

  player.bounceTimer += dt * 3;
  moonPhase += dt * 0.5;

  // Smooth follow mouse
  player.targetX = mouseX;
  player.x += (player.targetX - player.x) * 0.12;
  player.x = Math.max(player.w/2, Math.min(W-player.w/2, player.x));

  // Face timer
  if(player.faceTimer > 0){
    player.faceTimer -= dt;
    if(player.faceTimer <= 0) player.face = 'happy';
  }

  // Level
  level = 1 + Math.floor(totalCaught / 15);

  // Spawn
  spawnTimer -= dt;
  if(spawnTimer <= 0){
    spawnItem();
    spawnTimer = Math.max(0.3, 0.8 - level*0.05);
  }

  // Items
  for(var i=items.length-1;i>=0;i--){
    var item = items[i];
    item.y += item.speed;
    item.wobble += 0.04;
    item.x += Math.sin(item.wobble) * 0.8;
    item.rotation += item.rotSpeed;

    // Catch check
    var dx = item.x - player.x;
    var dy = item.y - player.y;
    if(Math.abs(dx) < player.w/2+item.size/2 && Math.abs(dy) < player.h/2+item.size/2){
      if(item.type.points > 0){
        score += item.type.points;
        window.score = score;
        totalCaught++;
        player.face = 'wow';
        player.faceTimer = 0.5;
        spawnCatchParticles(item.x, item.y, item.type.color, 12);
      } else {
        lives--;
        player.face = 'ouch';
        player.faceTimer = 0.8;
        spawnCatchParticles(item.x, item.y, '#ff4444', 8);
        if(lives <= 0){
          gameState = 'gameover';
          window.gameOver = true;
          highScore = Math.max(highScore, score);
        }
      }
      items.splice(i,1);
      continue;
    }

    // Off screen
    if(item.y > H+40){
      items.splice(i,1);
    }
  }

  // Particles
  for(var i=particles.length-1;i>=0;i--){
    var p=particles[i];
    p.x+=p.vx; p.y+=p.vy; p.vy+=0.1;
    p.life-=dt*2;
    if(p.life<=0) particles.splice(i,1);
  }
}

/* ═══ Render ═══ */
function render(){
  // Night sky gradient
  var grad = ctx.createLinearGradient(0,0,0,H);
  grad.addColorStop(0, '#0a0a2e');
  grad.addColorStop(0.5, '#151540');
  grad.addColorStop(1, '#1a1a4a');
  ctx.fillStyle = grad;
  ctx.fillRect(0,0,W,H);

  // Background stars
  var t = Date.now()/1000;
  for(var i=0;i<bgStars.length;i++){
    var s = bgStars[i];
    var twinkle = 0.3 + 0.7 * Math.abs(Math.sin(t*s.speed + s.twinkle));
    ctx.globalAlpha = twinkle;
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(s.x%W, s.y%H, s.size, 0, Math.PI*2); ctx.fill();
  }
  ctx.globalAlpha = 1;

  // Moon
  var mx = W*0.8, my = 60;
  ctx.fillStyle = '#ffffcc';
  ctx.shadowColor = 'rgba(255,255,200,0.4)';
  ctx.shadowBlur = 30;
  ctx.beginPath(); ctx.arc(mx, my, 30, 0, Math.PI*2); ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#0a0a2e';
  ctx.beginPath(); ctx.arc(mx+10, my-5, 25, 0, Math.PI*2); ctx.fill();

  // Items
  for(var i=0;i<items.length;i++){
    var item = items[i];
    ctx.save();
    ctx.translate(item.x, item.y);
    ctx.rotate(item.rotation);
    ctx.font = item.size+'px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(item.type.emoji, 0, 0);
    ctx.restore();

    // Glow for positive items
    if(item.type.points > 0){
      ctx.fillStyle = item.type.color;
      ctx.globalAlpha = 0.08;
      ctx.beginPath(); ctx.arc(item.x, item.y, item.size, 0, Math.PI*2); ctx.fill();
      ctx.globalAlpha = 1;
    }
  }

  // Particles
  for(var i=0;i<particles.length;i++){
    var p=particles[i];
    ctx.globalAlpha=p.life;
    ctx.fillStyle=p.color;
    if(p.shape==='star'){
      drawStar5(p.x, p.y, p.size, p.size*0.4);
      ctx.fill();
    } else {
      ctx.beginPath(); ctx.arc(p.x,p.y,p.size,0,Math.PI*2); ctx.fill();
    }
  }
  ctx.globalAlpha=1;

  // Player
  drawPlayer();

  // HUD
  ctx.fillStyle = 'rgba(20,20,60,0.7)';
  ctx.beginPath(); ctx.roundRect(W/2-100, 8, 200, 34, 17); ctx.fill();
  ctx.fillStyle = '#ffd700';
  ctx.font = 'bold 14px Courier New';
  ctx.textAlign = 'center';
  ctx.fillText('⭐ '+score+'  ', W/2-20, 30);
  // Lives
  ctx.fillStyle = '#ff6688';
  var livesStr = '';
  for(var i=0;i<lives;i++) livesStr += '♥';
  ctx.fillText(livesStr, W/2+40, 30);

  // Level
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ctx.font = '10px Courier New';
  ctx.textAlign = 'right';
  ctx.fillText('LV'+level, W-12, 20);

  // Ground glow
  var gg = ctx.createLinearGradient(0,H-30,0,H);
  gg.addColorStop(0,'rgba(100,120,255,0)');
  gg.addColorStop(1,'rgba(100,120,255,0.08)');
  ctx.fillStyle = gg;
  ctx.fillRect(0,H-30,W,30);

  // Game over
  if(gameState==='gameover'){
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(0,0,W,H);

    ctx.fillStyle = 'rgba(15,15,50,0.9)';
    ctx.beginPath(); ctx.roundRect(W/2-120, H/2-80, 240, 160, 20); ctx.fill();
    ctx.strokeStyle = 'rgba(255,215,0,0.3)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.roundRect(W/2-120, H/2-80, 240, 160, 20); ctx.stroke();

    ctx.textAlign = 'center';
    ctx.font = '32px serif';
    ctx.fillText('🌙', W/2, H/2-42);

    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 18px Courier New';
    ctx.fillText('Game Over', W/2, H/2-10);

    ctx.fillStyle = '#aabbff';
    ctx.font = '13px Courier New';
    ctx.fillText('Stars: '+score+'  Best: '+highScore, W/2, H/2+16);

    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.font = '11px Courier New';
    ctx.fillText('탭하여 다시 시작', W/2, H/2+56);
  }
}

/* ═══ Loop ═══ */
var lastTime = 0;
function loop(time){
  var dt = Math.min(0.05, (time-lastTime)/1000);
  lastTime = time;
  update(dt);
  render();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

})();
</script>
</body>
</html>`;
