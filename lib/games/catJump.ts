export const CAT_JUMP_HTML = `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0,user-scalable=no,maximum-scale=1.0">
<title>Cat Jump</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:100%;height:100%;overflow:hidden;background:#ffeef5;touch-action:none}
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

/* ═══ Colors & Theme ═══ */
var SKY_TOP = '#ffeef5';
var SKY_BOT = '#e8d5f5';
var PLATFORM_COLORS = ['#ffb3d9','#b3d9ff','#d9b3ff','#b3ffcc','#ffd9b3','#ffb3b3'];

/* ═══ Cat ═══ */
var cat = {
  x: W/2, y: H - 200,
  vx: 0, vy: 0,
  w: 32, h: 32,
  onGround: false,
  jumpPower: -12,
  face: 1, // 1=right, -1=left
  blinkTimer: 0,
  tailAngle: 0,
  lives: 9,
};

/* ═══ Platforms ═══ */
var platforms = [];
var score = 0;
var highScore = 0;
var scrollY = 0;
var targetScrollY = 0;
var particles = [];
var hearts = [];
var gameState = 'playing'; // playing, gameover

function initPlatforms(){
  platforms = [];
  // Starting platform
  platforms.push({ x: W/2-40, y: H-100, w: 80, type: 'normal', color: PLATFORM_COLORS[0] });
  for(var i=1; i<15; i++){
    addPlatform(H - 100 - i*80);
  }
}

function addPlatform(y){
  var w = 50 + Math.random()*40;
  var x = 20 + Math.random()*(W-40-w);
  var types = ['normal','normal','normal','spring','moving','heart'];
  var type = types[Math.floor(Math.random()*types.length)];
  platforms.push({
    x: x, y: y, w: w, type: type,
    color: PLATFORM_COLORS[Math.floor(Math.random()*PLATFORM_COLORS.length)],
    moveDir: type==='moving' ? (Math.random()>0.5?1:-1) : 0,
    moveSpeed: 1 + Math.random(),
    hasHeart: type === 'heart',
  });
}

function spawnParticles(x, y, color, count){
  for(var i=0;i<count;i++){
    particles.push({
      x: x, y: y,
      vx: (Math.random()-0.5)*6,
      vy: -Math.random()*4-2,
      life: 1,
      color: color,
      size: 2+Math.random()*4,
    });
  }
}

function spawnHeart(x, y){
  hearts.push({ x:x, y:y, vy:-2, life:1, scale:1 });
}

initPlatforms();

/* ═══ Input ═══ */
var touchX = null;
var pressing = { left: false, right: false };

window.addEventListener('keydown', function(e){
  if(e.key==='ArrowLeft'||e.key==='a') pressing.left=true;
  if(e.key==='ArrowRight'||e.key==='d') pressing.right=true;
  if(gameState==='gameover' && e.key===' ') restart();
});
window.addEventListener('keyup', function(e){
  if(e.key==='ArrowLeft'||e.key==='a') pressing.left=false;
  if(e.key==='ArrowRight'||e.key==='d') pressing.right=false;
});

canvas.addEventListener('touchstart', function(e){
  e.preventDefault();
  touchX = e.touches[0].clientX;
  if(gameState==='gameover') restart();
});
canvas.addEventListener('touchmove', function(e){
  e.preventDefault();
  touchX = e.touches[0].clientX;
});
canvas.addEventListener('touchend', function(e){
  touchX = null;
});
canvas.addEventListener('click', function(){
  if(gameState==='gameover') restart();
});

function restart(){
  cat.x = W/2; cat.y = H-200; cat.vx=0; cat.vy=0; cat.lives=9;
  score=0; scrollY=0; targetScrollY=0;
  gameState='playing'; window.gameOver=false; window.score=0;
  particles=[]; hearts=[];
  initPlatforms();
}

/* ═══ Draw Cat ═══ */
function drawCat(){
  var cx = cat.x, cy = cat.y - scrollY;
  ctx.save();
  ctx.translate(cx, cy);
  if(cat.face===-1) ctx.scale(-1,1);

  // Tail
  cat.tailAngle += 0.08;
  var ta = Math.sin(cat.tailAngle)*0.4;
  ctx.strokeStyle = '#ff8844';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-14, 4);
  ctx.quadraticCurveTo(-22, -8+ta*10, -18, -16+ta*6);
  ctx.stroke();

  // Body
  ctx.fillStyle = '#ff8844';
  ctx.beginPath(); ctx.ellipse(0, 4, 14, 12, 0, 0, Math.PI*2); ctx.fill();

  // Head
  ctx.fillStyle = '#ff9944';
  ctx.beginPath(); ctx.arc(8, -8, 11, 0, Math.PI*2); ctx.fill();

  // Ears
  ctx.fillStyle = '#ff8844';
  ctx.beginPath(); ctx.moveTo(2,-16); ctx.lineTo(-2,-26); ctx.lineTo(8,-18); ctx.fill();
  ctx.beginPath(); ctx.moveTo(14,-16); ctx.lineTo(18,-26); ctx.lineTo(10,-18); ctx.fill();
  // Inner ears
  ctx.fillStyle = '#ffaaaa';
  ctx.beginPath(); ctx.moveTo(3,-17); ctx.lineTo(0,-24); ctx.lineTo(7,-18); ctx.fill();
  ctx.beginPath(); ctx.moveTo(13,-17); ctx.lineTo(16,-24); ctx.lineTo(11,-18); ctx.fill();

  // Eyes
  cat.blinkTimer++;
  var blink = cat.blinkTimer % 180 < 5;
  if(blink){
    ctx.strokeStyle = '#333'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(4,-10); ctx.lineTo(8,-10); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(10,-10); ctx.lineTo(14,-10); ctx.stroke();
  } else {
    ctx.fillStyle = '#333';
    ctx.beginPath(); ctx.arc(6,-9,2.5,0,Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(12,-9,2.5,0,Math.PI*2); ctx.fill();
    // Highlights
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(5,-10,1,0,Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(11,-10,1,0,Math.PI*2); ctx.fill();
  }

  // Nose & mouth
  ctx.fillStyle = '#ff6688'; ctx.beginPath(); ctx.arc(9,-5,1.5,0,Math.PI*2); ctx.fill();
  ctx.strokeStyle = '#cc5566'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(9,-3.5); ctx.quadraticCurveTo(7,-1,5,-2); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(9,-3.5); ctx.quadraticCurveTo(11,-1,13,-2); ctx.stroke();

  // Whiskers
  ctx.strokeStyle = 'rgba(0,0,0,0.2)'; ctx.lineWidth = 0.8;
  ctx.beginPath(); ctx.moveTo(0,-5); ctx.lineTo(-12,-7); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0,-3); ctx.lineTo(-12,-2); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(18,-5); ctx.lineTo(28,-7); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(18,-3); ctx.lineTo(28,-2); ctx.stroke();

  // Feet
  ctx.fillStyle = '#ff7722';
  ctx.beginPath(); ctx.ellipse(-6,14,5,4,0,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(6,14,5,4,0,0,Math.PI*2); ctx.fill();

  ctx.restore();
}

/* ═══ Draw Platform ═══ */
function drawPlatform(p){
  var px = p.x, py = p.y - scrollY;
  ctx.fillStyle = p.color;
  ctx.beginPath();
  ctx.roundRect(px, py, p.w, 12, 6);
  ctx.fill();

  // Cute face on platform
  ctx.fillStyle = 'rgba(0,0,0,0.15)';
  var mx = px + p.w/2;
  ctx.beginPath(); ctx.arc(mx-4, py+5, 1.5, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(mx+4, py+5, 1.5, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(mx, py+8, 2, 0, Math.PI); ctx.stroke();

  if(p.type==='spring'){
    ctx.fillStyle = '#ff4488';
    ctx.font = '12px serif';
    ctx.textAlign = 'center';
    ctx.fillText('🌸', mx, py-2);
  }
  if(p.hasHeart){
    ctx.font = '14px serif';
    ctx.textAlign = 'center';
    ctx.fillText('💖', mx, py-6);
  }
}

/* ═══ Update ═══ */
function update(){
  if(gameState !== 'playing') return;

  // Input
  var accel = 0.6;
  if(pressing.left) cat.vx -= accel;
  if(pressing.right) cat.vx += accel;
  if(touchX !== null){
    if(touchX < W/2) cat.vx -= accel;
    else cat.vx += accel;
  }

  cat.vx *= 0.88; // friction
  cat.vy += 0.45; // gravity
  cat.x += cat.vx;
  cat.y += cat.vy;

  if(cat.vx > 0.5) cat.face = 1;
  if(cat.vx < -0.5) cat.face = -1;

  // Wrap around
  if(cat.x < -20) cat.x = W+20;
  if(cat.x > W+20) cat.x = -20;

  // Platform collision (only when falling)
  if(cat.vy > 0){
    for(var i=0;i<platforms.length;i++){
      var p = platforms[i];
      if(cat.x > p.x-10 && cat.x < p.x+p.w+10 &&
         cat.y+16 > p.y && cat.y+16 < p.y+20 && cat.vy > 0){
        cat.y = p.y - 16;
        cat.vy = cat.jumpPower;
        cat.onGround = true;

        if(p.type==='spring'){
          cat.vy = cat.jumpPower * 1.6;
          spawnParticles(cat.x, p.y, '#ff88cc', 8);
        }
        if(p.hasHeart){
          cat.lives = Math.min(cat.lives+1, 9);
          p.hasHeart = false;
          spawnHeart(cat.x, p.y);
          spawnParticles(cat.x, p.y, '#ff4488', 12);
        }

        spawnParticles(cat.x, p.y, p.color, 4);
        break;
      }
    }
  }

  // Scroll camera up
  var catScreenY = cat.y - scrollY;
  if(catScreenY < H * 0.35){
    targetScrollY = cat.y - H * 0.35;
  }
  scrollY += (targetScrollY - scrollY) * 0.1;

  // Score
  var newScore = Math.max(score, Math.floor(-cat.y / 50));
  if(newScore > score){
    score = newScore;
    window.score = score;
  }

  // Generate new platforms above
  var topY = scrollY - 100;
  while(platforms.length > 0 && platforms[0].y > scrollY + H + 100){
    platforms.shift();
  }
  var highestY = platforms.length > 0 ? Math.min.apply(null, platforms.map(function(p){return p.y})) : cat.y;
  while(highestY > topY){
    highestY -= 60 - Math.random()*20;
    addPlatform(highestY);
  }

  // Moving platforms
  for(var i=0;i<platforms.length;i++){
    if(platforms[i].type==='moving'){
      platforms[i].x += platforms[i].moveDir * platforms[i].moveSpeed;
      if(platforms[i].x < 10 || platforms[i].x + platforms[i].w > W-10){
        platforms[i].moveDir *= -1;
      }
    }
  }

  // Fall death
  if(cat.y - scrollY > H + 50){
    cat.lives--;
    if(cat.lives <= 0){
      gameState = 'gameover';
      window.gameOver = true;
      highScore = Math.max(highScore, score);
    } else {
      // Respawn on highest visible platform
      var best = platforms[0];
      for(var i=1;i<platforms.length;i++){
        if(platforms[i].y < best.y) best = platforms[i];
      }
      cat.x = best.x + best.w/2;
      cat.y = best.y - 20;
      cat.vy = 0;
    }
  }

  // Particles
  for(var i=particles.length-1;i>=0;i--){
    var p = particles[i];
    p.x += p.vx; p.y += p.vy; p.vy += 0.15;
    p.life -= 0.02;
    if(p.life <= 0) particles.splice(i,1);
  }
  // Hearts
  for(var i=hearts.length-1;i>=0;i--){
    var h = hearts[i];
    h.y += h.vy; h.scale += 0.02;
    h.life -= 0.02;
    if(h.life <= 0) hearts.splice(i,1);
  }
}

/* ═══ Render ═══ */
function render(){
  // Sky gradient
  var grad = ctx.createLinearGradient(0,0,0,H);
  grad.addColorStop(0, SKY_TOP);
  grad.addColorStop(1, SKY_BOT);
  ctx.fillStyle = grad;
  ctx.fillRect(0,0,W,H);

  // Clouds (parallax)
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  for(var i=0;i<5;i++){
    var cx = ((i*200+50) + scrollY*0.05) % (W+100) - 50;
    var cy = (i*120+30) % H;
    ctx.beginPath(); ctx.ellipse(cx, cy, 40+i*8, 15+i*3, 0, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(cx+25, cy-5, 25+i*5, 12+i*2, 0, 0, Math.PI*2); ctx.fill();
  }

  // Platforms
  for(var i=0;i<platforms.length;i++){
    var py = platforms[i].y - scrollY;
    if(py > -20 && py < H+20) drawPlatform(platforms[i]);
  }

  // Particles
  for(var i=0;i<particles.length;i++){
    var p = particles[i];
    ctx.globalAlpha = p.life;
    ctx.fillStyle = p.color;
    ctx.beginPath(); ctx.arc(p.x, p.y - scrollY, p.size, 0, Math.PI*2); ctx.fill();
  }
  ctx.globalAlpha = 1;

  // Hearts
  for(var i=0;i<hearts.length;i++){
    var h = hearts[i];
    ctx.globalAlpha = h.life;
    ctx.font = (14*h.scale)+'px serif';
    ctx.textAlign = 'center';
    ctx.fillText('💖', h.x, h.y - scrollY);
  }
  ctx.globalAlpha = 1;

  drawCat();

  // HUD
  ctx.fillStyle = 'rgba(255,180,220,0.9)';
  ctx.font = 'bold 18px Courier New';
  ctx.textAlign = 'left';
  ctx.fillText('Score: ' + score, 16, 30);

  // Lives as hearts
  ctx.font = '14px serif';
  for(var i=0;i<cat.lives;i++){
    ctx.fillText('❤️', 16+i*18, 52);
  }

  // Game over
  if(gameState === 'gameover'){
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fillRect(0,0,W,H);

    ctx.textAlign = 'center';
    ctx.font = '28px serif';
    ctx.fillText('😿', W/2, H/2-40);

    ctx.fillStyle = '#ff6699';
    ctx.font = 'bold 22px Courier New';
    ctx.fillText('Game Over', W/2, H/2);

    ctx.fillStyle = '#cc5588';
    ctx.font = '14px Courier New';
    ctx.fillText('Score: '+score+'  Best: '+highScore, W/2, H/2+30);

    ctx.fillStyle = '#aa4477';
    ctx.font = '12px Courier New';
    ctx.fillText('탭하여 다시 시작', W/2, H/2+56);
  }
}

function loop(){
  update();
  render();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

})();
</script>
</body>
</html>`;
