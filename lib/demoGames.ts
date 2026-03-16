export interface DemoGame {
  id: string;
  title: string;
  description: string;
  prompt: string;
  icon: string;
  accentColor: string;
  html: string;
}

const EMOJI_BURGER_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
<title>Emoji Burger Catcher</title>
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { overflow: hidden; background: #1a1a2e; }
canvas { display: block; width: 100%; height: 100%; }
</style>
</head>
<body>
<canvas id="gameCanvas"></canvas>
<script>
var score = 0;
var gameOver = false;
var keys = {};

(function() {
  var canvas = document.getElementById('gameCanvas');
  var ctx = canvas.getContext('2d');

  // Sizing
  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  // Game constants
  var FOOD_EMOJIS = ['🍔','🍟','🌭','🍕','🍩','🍦','🍪'];
  var POISON_EMOJIS = ['💀','☠️'];
  var PLAYER_EMOJI = '😋';

  // Game state
  var lives = 3;
  var highScore = 0;
  var baseSpeed = 2;
  var spawnRate = 60; // frames between spawns
  var frameCount = 0;
  var shakeTimer = 0;
  var shakeIntensity = 0;
  var gameOverSent = false;

  // Player
  var player = {
    x: 0,
    y: 0,
    targetX: 0,
    size: 0
  };

  // Items falling
  var items = [];
  // Particles
  var particles = [];
  // Score popups
  var popups = [];

  // Mouse / touch position
  var pointerX = null;

  function initGame() {
    score = 0;
    lives = 3;
    gameOver = false;
    gameOverSent = false;
    items = [];
    particles = [];
    popups = [];
    frameCount = 0;
    shakeTimer = 0;
    shakeIntensity = 0;

    player.size = Math.min(canvas.width, canvas.height) * 0.08;
    player.x = canvas.width / 2;
    player.y = canvas.height - player.size * 1.5;
    player.targetX = player.x;
    pointerX = null;
  }

  initGame();

  // Controls - Keyboard
  window.addEventListener('keydown', function(e) {
    keys[e.key] = true;
    if (e.key === ' ' && gameOver) {
      initGame();
    }
  });
  window.addEventListener('keyup', function(e) {
    keys[e.key] = false;
  });

  // Controls - Mouse
  canvas.addEventListener('mousemove', function(e) {
    if (!gameOver) {
      pointerX = e.clientX;
    }
  });
  canvas.addEventListener('click', function(e) {
    if (gameOver) {
      initGame();
    }
  });

  // Controls - Touch
  canvas.addEventListener('touchstart', function(e) {
    e.preventDefault();
    if (gameOver) {
      initGame();
      return;
    }
    pointerX = e.touches[0].clientX;
  }, { passive: false });
  canvas.addEventListener('touchmove', function(e) {
    e.preventDefault();
    if (!gameOver) {
      pointerX = e.touches[0].clientX;
    }
  }, { passive: false });
  canvas.addEventListener('touchend', function(e) {
    e.preventDefault();
  }, { passive: false });

  // Spawn an item
  function spawnItem() {
    var isPoison = Math.random() < 0.15;
    var emojiList = isPoison ? POISON_EMOJIS : FOOD_EMOJIS;
    var emoji = emojiList[Math.floor(Math.random() * emojiList.length)];
    var size = player.size * (0.7 + Math.random() * 0.4);
    var speedMultiplier = 1 + Math.floor(score / 10) * 0.15;
    var fallSpeed = (baseSpeed + Math.random() * 1.5) * speedMultiplier;
    // Scale speed to screen height so it feels consistent
    fallSpeed *= canvas.height / 800;

    items.push({
      x: size + Math.random() * (canvas.width - size * 2),
      y: -size,
      size: size,
      speed: fallSpeed,
      emoji: emoji,
      isPoison: isPoison,
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.06
    });
  }

  // Create particle burst
  function createParticles(x, y, color, count) {
    for (var i = 0; i < count; i++) {
      var angle = Math.random() * Math.PI * 2;
      var speed = 2 + Math.random() * 4;
      particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,
        life: 1,
        decay: 0.02 + Math.random() * 0.02,
        size: 3 + Math.random() * 5,
        color: color
      });
    }
  }

  // Create score popup
  function createPopup(x, y, text, color) {
    popups.push({
      x: x,
      y: y,
      text: text,
      color: color,
      life: 1,
      decay: 0.02
    });
  }

  // Lerp helper
  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  // Distance helper
  function dist(x1, y1, x2, y2) {
    var dx = x1 - x2;
    var dy = y1 - y2;
    return Math.sqrt(dx * dx + dy * dy);
  }

  // Draw gradient background
  function drawBackground() {
    var grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grad.addColorStop(0, '#1a1a2e');
    grad.addColorStop(1, '#16213e');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  // Draw HUD
  function drawHUD() {
    var fontSize = Math.max(20, Math.min(canvas.width, canvas.height) * 0.04);

    // Score - top left
    ctx.font = 'bold ' + fontSize + 'px Arial, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fillRect(10, 10, fontSize * 6, fontSize * 1.6);
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.lineWidth = 1;
    ctx.strokeRect(10, 10, fontSize * 6, fontSize * 1.6);

    ctx.fillStyle = '#FFD700';
    ctx.fillText('Score: ' + score, 20, 15 + fontSize * 0.15);

    // Lives - top right
    var heartStr = '';
    for (var i = 0; i < lives; i++) heartStr += '❤️';
    for (var i = lives; i < 3; i++) heartStr += '🖤';

    ctx.font = fontSize * 1.1 + 'px Arial, sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'top';
    ctx.fillText(heartStr, canvas.width - 15, 12);
  }

  // Draw Game Over
  function drawGameOver() {
    // Overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    var cx = canvas.width / 2;
    var cy = canvas.height / 2;
    var titleSize = Math.max(30, Math.min(canvas.width, canvas.height) * 0.08);
    var subSize = titleSize * 0.5;
    var scoreSize = titleSize * 0.7;

    // Game Over text
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.font = 'bold ' + titleSize + 'px Arial, sans-serif';
    ctx.fillStyle = '#FF4444';
    ctx.fillText('GAME OVER', cx, cy - titleSize * 1.5);

    // Big emoji
    ctx.font = titleSize * 1.5 + 'px Arial, sans-serif';
    ctx.fillText('🍔', cx, cy - titleSize * 0.1);

    // Score
    ctx.font = 'bold ' + scoreSize + 'px Arial, sans-serif';
    ctx.fillStyle = '#FFD700';
    ctx.fillText('Final Score: ' + score, cx, cy + titleSize * 1.1);

    // High score
    if (score >= highScore && score > 0) {
      ctx.font = 'bold ' + subSize + 'px Arial, sans-serif';
      ctx.fillStyle = '#FF69B4';
      ctx.fillText('NEW HIGH SCORE!', cx, cy + titleSize * 1.8);
    }

    // Restart hint
    var pulse = 0.6 + Math.sin(frameCount * 0.05) * 0.4;
    ctx.font = subSize + 'px Arial, sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, ' + pulse + ')';
    ctx.fillText('Tap or Press Space to Restart', cx, cy + titleSize * 2.6);
  }

  // Main update
  function update() {
    if (gameOver) {
      if (!gameOverSent) {
        if (score > highScore) highScore = score;
        gameOverSent = true;
        window.parent.postMessage({ type: 'gameOver', score: score }, '*');
      }
      return;
    }

    frameCount++;

    // Player movement
    var moveSpeed = canvas.width * 0.012;
    if (keys['ArrowLeft'] || keys['a'] || keys['A']) {
      player.targetX -= moveSpeed;
    }
    if (keys['ArrowRight'] || keys['d'] || keys['D']) {
      player.targetX += moveSpeed;
    }
    if (pointerX !== null) {
      player.targetX = pointerX;
    }

    // Clamp target
    var halfSize = player.size * 0.5;
    if (player.targetX < halfSize) player.targetX = halfSize;
    if (player.targetX > canvas.width - halfSize) player.targetX = canvas.width - halfSize;

    // Smooth lerp
    player.x = lerp(player.x, player.targetX, 0.15);
    player.y = canvas.height - player.size * 1.5;

    // Spawn items
    var currentSpawnRate = Math.max(15, spawnRate - Math.floor(score / 10) * 4);
    if (frameCount % currentSpawnRate === 0) {
      spawnItem();
    }

    // Update items
    for (var i = items.length - 1; i >= 0; i--) {
      var item = items[i];
      item.y += item.speed;
      item.rotation += item.rotSpeed;

      // Collision with player
      var collDist = dist(item.x, item.y, player.x, player.y);
      var collThreshold = (player.size + item.size) * 0.4;

      if (collDist < collThreshold) {
        if (item.isPoison) {
          // Hit poison
          lives--;
          shakeTimer = 15;
          shakeIntensity = 10;
          createParticles(item.x, item.y, '#FF0000', 15);
          createPopup(item.x, item.y - 30, '-1 ❤️', '#FF4444');
          if (lives <= 0) {
            gameOver = true;
          }
        } else {
          // Caught food
          score++;
          createParticles(item.x, item.y, '#FFD700', 12);
          createPopup(item.x, item.y - 30, '+1', '#44FF44');
        }
        items.splice(i, 1);
        continue;
      }

      // Off screen
      if (item.y > canvas.height + item.size) {
        items.splice(i, 1);
      }
    }

    // Update particles
    for (var i = particles.length - 1; i >= 0; i--) {
      var p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.1; // gravity
      p.life -= p.decay;
      if (p.life <= 0) {
        particles.splice(i, 1);
      }
    }

    // Update popups
    for (var i = popups.length - 1; i >= 0; i--) {
      var pop = popups[i];
      pop.y -= 1.5;
      pop.life -= pop.decay;
      if (pop.life <= 0) {
        popups.splice(i, 1);
      }
    }

    // Screen shake decay
    if (shakeTimer > 0) {
      shakeTimer--;
    }
  }

  // Main draw
  function draw() {
    ctx.save();

    // Screen shake
    if (shakeTimer > 0) {
      var sx = (Math.random() - 0.5) * shakeIntensity * (shakeTimer / 15);
      var sy = (Math.random() - 0.5) * shakeIntensity * (shakeTimer / 15);
      ctx.translate(sx, sy);
    }

    drawBackground();

    // Draw falling items
    for (var i = 0; i < items.length; i++) {
      var item = items[i];
      ctx.save();
      ctx.translate(item.x, item.y);
      ctx.rotate(item.rotation);
      ctx.font = item.size + 'px Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(item.emoji, 0, 0);
      ctx.restore();
    }

    // Draw particles
    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Draw popups
    for (var i = 0; i < popups.length; i++) {
      var pop = popups[i];
      ctx.globalAlpha = pop.life;
      ctx.font = 'bold ' + (Math.min(canvas.width, canvas.height) * 0.04) + 'px Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = pop.color;
      ctx.fillText(pop.text, pop.x, pop.y);
    }
    ctx.globalAlpha = 1;

    // Draw player
    if (!gameOver) {
      ctx.font = player.size + 'px Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(PLAYER_EMOJI, player.x, player.y);
    }

    // HUD
    drawHUD();

    ctx.restore();

    // Game over screen (outside shake transform)
    if (gameOver) {
      drawGameOver();
    }
  }

  // Game loop
  function loop() {
    // Recalculate player size on each frame in case of resize
    player.size = Math.min(canvas.width, canvas.height) * 0.08;

    update();
    draw();
    requestAnimationFrame(loop);
  }

  loop();
})();
</script>
</body>
</html>
`;

const TEMPLE_RUNNER_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0,user-scalable=no">
<title>Temple Runner</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{overflow:hidden;background:#000;font-family:Arial,sans-serif}
canvas{display:block;width:100%;height:100%}
#hud{position:absolute;top:0;left:0;width:100%;pointer-events:none;text-align:center}
#score{color:#fff;font-size:28px;margin-top:12px;text-shadow:0 0 10px rgba(255,200,0,.8),2px 2px 4px #000}
#overlay{position:absolute;top:0;left:0;width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#fff;text-shadow:0 0 20px rgba(255,150,0,.9),2px 2px 6px #000}
#overlay h1{font-size:42px;margin-bottom:10px}
#overlay p{font-size:22px;margin:6px 0}
#overlay .sub{font-size:16px;opacity:.7;margin-top:18px}
.flash{position:absolute;top:0;left:0;width:100%;height:100%;background:rgba(255,215,0,.25);pointer-events:none;opacity:0;transition:opacity .1s}
</style>
</head>
<body>
<div id="hud"><div id="score">0</div></div>
<div id="overlay"><h1>TEMPLE RUNNER</h1><p>Dodge walls, jump bars, collect coins!</p><p class="sub">Tap / Press any key to Start</p></div>
<div id="flash" class="flash"></div>
<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
<script>
var score=0,gameOver=false,keys={};
var started=false,speed=0,maxSpeed=55,baseSpeed=18,laneX=[-2.4,0,2.4],currentLane=1,targetX=0;
var jumpVel=0,isJumping=false,playerY=0,gravity=28,jumpForce=11;
var obstacles=[],coins=[],pillars=[],grounds=[];
var spawnTimer=0,spawnInterval=1.2,coinTimer=0,distTraveled=0;
var touchStartX=0,touchStartY=0,touchStartT=0;

var scene=new THREE.Scene();
scene.background=new THREE.Color(0x1a0a2e);
scene.fog=new THREE.Fog(0x1a0a2e,30,90);

var camera=new THREE.PerspectiveCamera(70,innerWidth/innerHeight,0.1,120);
camera.position.set(0,4.5,7);
camera.lookAt(0,1,-10);

var renderer=new THREE.WebGLRenderer({antialias:false});
renderer.setSize(innerWidth,innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio,2));
document.body.appendChild(renderer.domElement);

scene.add(new THREE.AmbientLight(0x8888cc,0.5));
var dirLight=new THREE.DirectionalLight(0xffddaa,0.9);
dirLight.position.set(5,15,-10);
scene.add(dirLight);

var playerGeo=new THREE.BoxGeometry(0.7,1.4,0.7);
var playerMat=new THREE.MeshPhongMaterial({color:0x00ccff,emissive:0x004466});
var player=new THREE.Mesh(playerGeo,playerMat);
player.position.set(0,0.7,0);
scene.add(player);

var groundMat1=new THREE.MeshPhongMaterial({color:0x2a1a3a});
var groundMat2=new THREE.MeshPhongMaterial({color:0x3a2a4a});
var groundGeo=new THREE.PlaneGeometry(10,40);
for(var i=0;i<5;i++){
  var g=new THREE.Mesh(groundGeo,i%2===0?groundMat1:groundMat2);
  g.rotation.x=-Math.PI/2;
  g.position.set(0,0,-i*40+20);
  scene.add(g);
  grounds.push(g);
}

var pillarGeo=new THREE.BoxGeometry(1.5,12,1.5);
var pillarMat=new THREE.MeshPhongMaterial({color:0x1a0a1e,emissive:0x0a0510});
for(var i=0;i<20;i++){
  var pL=new THREE.Mesh(pillarGeo,pillarMat);
  pL.position.set(-6.5,6,-i*10);
  scene.add(pL);pillars.push(pL);
  var pR=new THREE.Mesh(pillarGeo,pillarMat);
  pR.position.set(6.5,6,-i*10);
  scene.add(pR);pillars.push(pR);
}

var wallGeo=new THREE.BoxGeometry(2.2,2.5,0.6);
var wallMat=new THREE.MeshPhongMaterial({color:0xcc3300,emissive:0x441100});
var barGeo=new THREE.CylinderGeometry(0.15,0.15,2.2,8);
barGeo.rotateZ(Math.PI/2);
var barMat=new THREE.MeshPhongMaterial({color:0xddcc00,emissive:0x443300});
var coinGeo=new THREE.OctahedronGeometry(0.3,0);
var coinMat=new THREE.MeshPhongMaterial({color:0xffcc00,emissive:0x664400});

var particleGeo=new THREE.BufferGeometry();
var pCount=60,pPositions=new Float32Array(pCount*3);
for(var i=0;i<pCount;i++){
  pPositions[i*3]=(Math.random()-0.5)*8;
  pPositions[i*3+1]=Math.random()*3+0.5;
  pPositions[i*3+2]=-Math.random()*80;
}
particleGeo.setAttribute('position',new THREE.BufferAttribute(pPositions,3));
var particles=new THREE.Points(particleGeo,new THREE.PointsMaterial({color:0xffffff,size:0.08,transparent:true,opacity:0.4}));
scene.add(particles);

var scoreEl=document.getElementById('score');
var overlayEl=document.getElementById('overlay');
var flashEl=document.getElementById('flash');

function spawnObstacle(){
  var type=Math.random()<0.4?'bar':'wall';
  var blocked=[];
  if(type==='wall'){
    var n=Math.random()<0.35?2:1;
    var lanes=[0,1,2];
    for(var i=0;i<n;i++){var idx=Math.floor(Math.random()*lanes.length);blocked.push(lanes.splice(idx,1)[0])}
    blocked.forEach(function(l){
      var m=new THREE.Mesh(wallGeo,wallMat);
      m.position.set(laneX[l],1.25,player.position.z-100);
      m.userData={type:'wall'};
      scene.add(m);obstacles.push(m);
    });
  }else{
    var safeLane=Math.floor(Math.random()*3);
    for(var l=0;l<3;l++){
      if(l===safeLane)continue;
      var m=new THREE.Mesh(barGeo,barMat);
      m.position.set(laneX[l],0.8,player.position.z-100);
      m.userData={type:'bar'};
      scene.add(m);obstacles.push(m);
    }
  }
}

function spawnCoins(){
  var lane=Math.floor(Math.random()*3);
  for(var i=0;i<3;i++){
    var c=new THREE.Mesh(coinGeo,coinMat);
    c.position.set(laneX[lane],1.2,player.position.z-80-i*3);
    c.userData={type:'coin',collected:false};
    scene.add(c);coins.push(c);
  }
}

function doFlash(){flashEl.style.opacity='1';setTimeout(function(){flashEl.style.opacity='0'},100)}

function checkCollisions(){
  var px=player.position.x,pz=player.position.z,py=playerY;
  for(var i=obstacles.length-1;i>=0;i--){
    var o=obstacles[i];
    var dz=Math.abs(o.position.z-pz);
    var dx=Math.abs(o.position.x-px);
    if(dz<0.8&&dx<1.1){
      if(o.userData.type==='wall'&&py<2){endGame();return}
      if(o.userData.type==='bar'&&py<1.2){endGame();return}
    }
  }
  for(var i=coins.length-1;i>=0;i--){
    var c=coins[i];
    if(c.userData.collected)continue;
    var dz=Math.abs(c.position.z-pz);
    var dx=Math.abs(c.position.x-px);
    if(dz<1&&dx<1&&Math.abs(py-0.5)<1.5){
      c.userData.collected=true;scene.remove(c);coins.splice(i,1);
      score+=10;doFlash();
    }
  }
}

function endGame(){
  gameOver=true;
  overlayEl.innerHTML='<h1>GAME OVER</h1><p>Score: '+score+'</p><p class="sub">Tap / Press to Restart</p>';
  overlayEl.style.display='flex';
  window.parent.postMessage({type:'gameOver',score:score},'*');
}

function reset(){
  obstacles.forEach(function(o){scene.remove(o)});obstacles=[];
  coins.forEach(function(c){scene.remove(c)});coins=[];
  score=0;gameOver=false;started=true;speed=baseSpeed;
  currentLane=1;targetX=0;playerY=0;jumpVel=0;isJumping=false;
  player.position.set(0,0.7,0);distTraveled=0;spawnTimer=0;coinTimer=0;
  overlayEl.style.display='none';
}

function switchLane(dir){
  currentLane=Math.max(0,Math.min(2,currentLane+dir));
  targetX=laneX[currentLane];
}

function jump(){if(!isJumping){isJumping=true;jumpVel=jumpForce}}

document.addEventListener('keydown',function(e){
  keys[e.code]=true;
  if(!started||gameOver){reset();return}
  if(e.code==='ArrowLeft'||e.code==='KeyA')switchLane(-1);
  if(e.code==='ArrowRight'||e.code==='KeyD')switchLane(1);
  if(e.code==='ArrowUp'||e.code==='Space'||e.code==='KeyW')jump();
  e.preventDefault();
});
document.addEventListener('keyup',function(e){keys[e.code]=false});

document.addEventListener('touchstart',function(e){
  if(!started||gameOver){reset();return}
  touchStartX=e.touches[0].clientX;touchStartY=e.touches[0].clientY;touchStartT=Date.now();
},{passive:true});
document.addEventListener('touchend',function(e){
  var dx=e.changedTouches[0].clientX-touchStartX;
  var dy=e.changedTouches[0].clientY-touchStartY;
  var dt=Date.now()-touchStartT;
  if(dt>300)return;
  var ax=Math.abs(dx),ay=Math.abs(dy);
  if(ax<20&&ay<20)return;
  if(ax>ay){dx>0?switchLane(1):switchLane(-1)}
  else if(dy<-20){jump()}
},{passive:true});

document.addEventListener('click',function(){if(!started||gameOver)reset()});

window.addEventListener('resize',function(){
  camera.aspect=innerWidth/innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth,innerHeight);
});

var clock=new THREE.Clock();
function animate(){
  requestAnimationFrame(animate);
  var dt=Math.min(clock.getDelta(),0.05);
  if(!started||gameOver){renderer.render(scene,camera);return}

  speed=Math.min(maxSpeed,baseSpeed+distTraveled*0.008);
  var moveZ=speed*dt;
  distTraveled+=moveZ;
  player.position.z-=moveZ;
  score=Math.max(score,Math.floor(distTraveled));

  player.position.x+=(targetX-player.position.x)*10*dt;

  if(isJumping){
    jumpVel-=gravity*dt;
    playerY+=jumpVel*dt;
    if(playerY<=0){playerY=0;isJumping=false;jumpVel=0}
  }
  player.position.y=playerY+0.7;

  camera.position.set(player.position.x*0.5,playerY+4.5,player.position.z+7);
  camera.lookAt(player.position.x*0.3,playerY+1,player.position.z-10);

  spawnTimer+=dt;
  if(spawnTimer>spawnInterval){spawnTimer=0;spawnInterval=Math.max(0.6,1.2-distTraveled*0.0005);spawnObstacle()}
  coinTimer+=dt;
  if(coinTimer>2.5){coinTimer=0;spawnCoins()}

  for(var i=obstacles.length-1;i>=0;i--){
    if(obstacles[i].position.z>player.position.z+15){scene.remove(obstacles[i]);obstacles.splice(i,1)}
  }
  for(var i=coins.length-1;i>=0;i--){
    if(coins[i].position.z>player.position.z+15){scene.remove(coins[i]);coins.splice(i,1)}
    else coins[i].rotation.y+=4*dt;
  }

  grounds.forEach(function(g){
    if(g.position.z>player.position.z+60)g.position.z-=200;
  });
  for(var i=0;i<pillars.length;i++){
    if(pillars[i].position.z>player.position.z+20)pillars[i].position.z-=200;
  }

  var pPos=particleGeo.attributes.position;
  for(var i=0;i<pCount;i++){
    pPos.array[i*3+2]+=speed*dt*0.5;
    if(pPos.array[i*3+2]>player.position.z+10){
      pPos.array[i*3]=(Math.random()-0.5)*8;
      pPos.array[i*3+1]=Math.random()*3+0.5;
      pPos.array[i*3+2]=player.position.z-60-Math.random()*20;
    }
  }
  pPos.needsUpdate=true;

  checkCollisions();
  scoreEl.textContent=score;
  renderer.render(scene,camera);
}
animate();
</script>
</body>
</html>
`;

const TETRIS_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1,user-scalable=no">
<title>Tetris</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{overflow:hidden;background:#0a0a0a;display:flex;justify-content:center;align-items:center;height:100vh;font-family:'Courier New',monospace;color:#fff;touch-action:none}
#wrap{display:flex;align-items:center;gap:20px}
canvas{display:block;border:2px solid #222;border-radius:4px}
#panel{display:flex;flex-direction:column;gap:12px;min-width:120px}
.stat{text-align:center}.stat span{display:block;font-size:11px;color:#888;text-transform:uppercase;letter-spacing:2px}.stat b{font-size:22px}
#nextC{border:1px solid #333;border-radius:4px;margin:0 auto}
#touch{display:none;position:fixed;bottom:10px;left:0;right:0;text-align:center}
#touch button{width:56px;height:56px;font-size:22px;border:none;border-radius:12px;background:#1a1a2e;color:#fff;margin:3px;cursor:pointer;-webkit-tap-highlight-color:transparent}
#touch button:active{background:#333}
#popup{position:fixed;pointer-events:none;font-size:24px;font-weight:bold;color:#fff;text-shadow:0 0 10px #fff;opacity:0;transition:all .5s}
#overlay{position:fixed;inset:0;display:none;justify-content:center;align-items:center;background:rgba(0,0,0,.7);flex-direction:column;gap:16px;z-index:10}
#overlay h1{font-size:36px;color:#ff0044;text-shadow:0 0 20px #ff0044}
#overlay p{font-size:18px;color:#aaa}
#overlay button{padding:12px 32px;font-size:18px;border:none;border-radius:8px;background:#0066ff;color:#fff;cursor:pointer;font-family:inherit}
@media(max-width:600px){
  #wrap{flex-direction:column;gap:8px}
  #panel{flex-direction:row;flex-wrap:wrap;justify-content:center;min-width:unset}
  .stat{margin:0 10px}
  #touch{display:block}
}
</style>
</head>
<body>
<div id="wrap">
  <canvas id="board"></canvas>
  <div id="panel">
    <div class="stat"><span>Score</span><b id="sc">0</b></div>
    <div class="stat"><span>Level</span><b id="lv">1</b></div>
    <div class="stat"><span>Lines</span><b id="ln">0</b></div>
    <div class="stat"><span>Next</span><canvas id="nextC" width="80" height="80"></canvas></div>
  </div>
</div>
<div id="touch">
  <div><button ontouchstart="mL()" onclick="mL()">&#8592;</button><button ontouchstart="rot()" onclick="rot()">&#8635;</button><button ontouchstart="mR()" onclick="mR()">&#8594;</button></div>
  <div><button ontouchstart="sD()" onclick="sD()">&#8595;</button><button ontouchstart="hD()" onclick="hD()">&#9196;</button></div>
</div>
<div id="popup"></div>
<div id="overlay"><h1>GAME OVER</h1><p id="fs"></p><button onclick="restart()">Play Again</button></div>
<script>
var score=0,gameOver=false,keys={};
var COLS=10,ROWS=20,BS,grid=[],cur,nx,lockTimer=0,LOCK_DELAY=500;
var lines=0,level=1,dropInterval=1000,lastDrop=0,softDrop=false;
var shakeX=0,shakeY=0,clearing=[],clearAnim=0;
var COLORS={I:'#00f5ff',O:'#fff700',T:'#b400ff',S:'#00ff88',Z:'#ff0044',J:'#0066ff',L:'#ff8800'};
var SHAPES={
  I:[[0,0],[1,0],[2,0],[3,0]],O:[[0,0],[1,0],[0,1],[1,1]],
  T:[[0,0],[1,0],[2,0],[1,1]],S:[[1,0],[2,0],[0,1],[1,1]],
  Z:[[0,0],[1,0],[1,1],[2,1]],J:[[0,0],[0,1],[1,1],[2,1]],
  L:[[2,0],[0,1],[1,1],[2,1]]
};
var TYPES=Object.keys(SHAPES);
var cv=document.getElementById('board'),ctx=cv.getContext('2d');
var ncv=document.getElementById('nextC'),nctx=ncv.getContext('2d');

function resize(){
  var mob=window.innerWidth<=600,maxH=mob?window.innerHeight-200:window.innerHeight-40;
  var maxW=mob?window.innerWidth-20:window.innerWidth*0.5;
  BS=Math.floor(Math.min(maxW/COLS,maxH/ROWS));
  cv.width=COLS*BS;cv.height=ROWS*BS;
}
resize();window.addEventListener('resize',resize);

function initGrid(){grid=[];for(var r=0;r<ROWS;r++){var row=[];for(var c=0;c<COLS;c++)row.push(null);grid.push(row)}}
function newPiece(t){var s=SHAPES[t].map(function(p){return[p[0],p[1]]});return{type:t,cells:s,x:Math.floor((COLS-4)/2),y:0}}
function bag(){var b=TYPES.slice();for(var i=b.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1));var t=b[i];b[i]=b[j];b[j]=t}return b}
var pBag=[];
function nextType(){if(!pBag.length)pBag=bag();return pBag.pop()}

function fits(cells,ox,oy){
  for(var i=0;i<cells.length;i++){
    var cx=cells[i][0]+ox,cy=cells[i][1]+oy;
    if(cx<0||cx>=COLS||cy>=ROWS)return false;
    if(cy>=0&&grid[cy][cx])return false;
  }return true;
}
function rotate(cells){
  var mx=0,my=0;for(var i=0;i<cells.length;i++){mx+=cells[i][0];my+=cells[i][1]}
  mx/=cells.length;my/=cells.length;
  return cells.map(function(p){var rx=Math.round(-(p[1]-my)+mx),ry=Math.round((p[0]-mx)+my);return[rx,ry]});
}
function ghostY(){var gy=cur.y;while(fits(cur.cells,cur.x,gy+1))gy++;return gy}

function lock(){
  var gy=cur.y;
  for(var i=0;i<cur.cells.length;i++){
    var cx=cur.cells[i][0]+cur.x,cy=cur.cells[i][1]+gy;
    if(cy<0){gameOver=true;return}
    grid[cy][cx]=cur.type;
  }
  checkLines();spawn();
}
function checkLines(){
  clearing=[];
  for(var r=0;r<ROWS;r++){var full=true;for(var c=0;c<COLS;c++)if(!grid[r][c]){full=false;break}if(full)clearing.push(r)}
  if(clearing.length){
    clearAnim=300;
    var pts=[0,100,300,500,800][clearing.length]||800;
    score+=pts*level;lines+=clearing.length;
    level=Math.floor(lines/10)+1;
    dropInterval=Math.max(100,1000-((level-1)*80));
    showPopup('+'+pts*level);
    document.getElementById('sc').textContent=score;
    document.getElementById('lv').textContent=level;
    document.getElementById('lv').style.color=COLORS[TYPES[(level-1)%7]];
    document.getElementById('ln').textContent=lines;
  }
}
function collapseLines(){
  for(var i=clearing.length-1;i>=0;i--){grid.splice(clearing[i],1);var row=[];for(var c=0;c<COLS;c++)row.push(null);grid.unshift(row)}
  clearing=[];
}
function spawn(){cur=nx?{type:nx.type,cells:nx.cells.map(function(p){return[p[0],p[1]]}),x:Math.floor((COLS-4)/2),y:0}:newPiece(nextType());nx=newPiece(nextType());lockTimer=0;
  if(!fits(cur.cells,cur.x,cur.y)){gameOver=true}
}

function drawBlock(c,x,y,s,alpha){
  c.globalAlpha=alpha||1;
  var col=COLORS[s];c.fillStyle=col;c.fillRect(x+1,y+1,BS-2,BS-2);
  c.fillStyle='rgba(255,255,255,0.25)';c.fillRect(x+1,y+1,BS-2,3);c.fillRect(x+1,y+1,3,BS-2);
  c.fillStyle='rgba(0,0,0,0.25)';c.fillRect(x+1,y+BS-4,BS-2,3);c.fillRect(x+BS-4,y+1,3,BS-2);
  c.globalAlpha=1;
}
function drawGrid(){
  ctx.fillStyle='#0a0a0a';ctx.fillRect(0,0,cv.width,cv.height);
  ctx.strokeStyle='#1a1a1a';ctx.lineWidth=0.5;
  for(var r=0;r<=ROWS;r++){ctx.beginPath();ctx.moveTo(0,r*BS);ctx.lineTo(cv.width,r*BS);ctx.stroke()}
  for(var c=0;c<=COLS;c++){ctx.beginPath();ctx.moveTo(c*BS,0);ctx.lineTo(c*BS,cv.height);ctx.stroke()}
}
function render(){
  ctx.save();ctx.translate(shakeX,shakeY);
  drawGrid();
  for(var r=0;r<ROWS;r++)for(var c=0;c<COLS;c++){
    if(grid[r][c]){
      if(clearing.indexOf(r)!==-1){
        var flash=clearAnim/300;ctx.globalAlpha=flash;ctx.fillStyle='#fff';ctx.fillRect(c*BS,r*BS,BS,BS);ctx.globalAlpha=1;
      }else drawBlock(ctx,c*BS,r*BS,grid[r][c]);
    }
  }
  if(cur&&!gameOver){
    var gy=ghostY();
    for(var i=0;i<cur.cells.length;i++){var gx=cur.cells[i][0]+cur.x,gcy=cur.cells[i][1]+gy;if(gcy>=0)drawBlock(ctx,gx*BS,gcy*BS,cur.type,0.2)}
    for(var i=0;i<cur.cells.length;i++){var px=cur.cells[i][0]+cur.x,py=cur.cells[i][1]+cur.y;if(py>=0)drawBlock(ctx,px*BS,py*BS,cur.type)}
  }
  ctx.restore();
  // next piece preview
  nctx.fillStyle='#0a0a0a';nctx.fillRect(0,0,80,80);
  if(nx){var ns=16;for(var i=0;i<nx.cells.length;i++){var px=nx.cells[i][0]*ns+10,py=nx.cells[i][1]*ns+20;
    nctx.fillStyle=COLORS[nx.type];nctx.fillRect(px+1,py+1,ns-2,ns-2);
    nctx.fillStyle='rgba(255,255,255,0.2)';nctx.fillRect(px+1,py+1,ns-2,2);
  }}
}

function mL(){if(cur&&fits(cur.cells,cur.x-1,cur.y)){cur.x--;lockTimer=0}}
function mR(){if(cur&&fits(cur.cells,cur.x+1,cur.y)){cur.x++;lockTimer=0}}
function rot(){
  if(!cur)return;var r=rotate(cur.cells);
  if(fits(r,cur.x,cur.y)){cur.cells=r;lockTimer=0}
  else if(fits(r,cur.x-1,cur.y)){cur.cells=r;cur.x--;lockTimer=0}
  else if(fits(r,cur.x+1,cur.y)){cur.cells=r;cur.x++;lockTimer=0}
  else if(fits(r,cur.x-2,cur.y)){cur.cells=r;cur.x-=2;lockTimer=0}
  else if(fits(r,cur.x+2,cur.y)){cur.cells=r;cur.x+=2;lockTimer=0}
}
function sD(){if(cur&&fits(cur.cells,cur.x,cur.y+1))cur.y++}
function hD(){
  if(!cur)return;while(fits(cur.cells,cur.x,cur.y+1))cur.y++;
  lock();shakeX=(Math.random()-0.5)*6;shakeY=Math.random()*4;setTimeout(function(){shakeX=0;shakeY=0},80);
}

function showPopup(txt){
  var el=document.getElementById('popup');el.textContent=txt;el.style.opacity=1;
  el.style.top='40%';el.style.left='50%';el.style.transform='translate(-50%,-50%)';
  setTimeout(function(){el.style.opacity=0;el.style.top='30%'},400);
}

var lastTime=0;
function loop(ts){
  if(!lastTime)lastTime=ts;var dt=ts-lastTime;lastTime=ts;
  if(clearAnim>0){clearAnim-=dt;if(clearAnim<=0)collapseLines();render();requestAnimationFrame(loop);return}
  if(!gameOver&&cur){
    var interval=softDrop?50:dropInterval;
    lastDrop+=dt;
    if(lastDrop>=interval){
      lastDrop=0;
      if(fits(cur.cells,cur.x,cur.y+1)){cur.y++;lockTimer=0}
      else{lockTimer+=interval;if(lockTimer>=LOCK_DELAY)lock()}
    }
    if(!fits(cur.cells,cur.x,cur.y+1))lockTimer+=dt;
  }
  if(gameOver){
    document.getElementById('overlay').style.display='flex';
    document.getElementById('fs').textContent='Score: '+score;
    window.parent.postMessage({type:'gameOver',score:score},'*');
    render();return;
  }
  if(keys['ArrowLeft']){mL();keys['ArrowLeft']=false}
  if(keys['ArrowRight']){mR();keys['ArrowRight']=false}
  render();requestAnimationFrame(loop);
}

document.addEventListener('keydown',function(e){
  if(gameOver)return;
  keys[e.key]=true;
  if(e.key==='ArrowUp'){rot();e.preventDefault()}
  if(e.key===' '){hD();e.preventDefault()}
  if(e.key==='ArrowDown'){softDrop=true;e.preventDefault()}
  if(e.key==='ArrowLeft'||e.key==='ArrowRight')e.preventDefault();
});
document.addEventListener('keyup',function(e){keys[e.key]=false;if(e.key==='ArrowDown')softDrop=false});

function restart(){
  score=0;lines=0;level=1;gameOver=false;dropInterval=1000;softDrop=false;lockTimer=0;clearing=[];clearAnim=0;lastDrop=0;lastTime=0;pBag=[];
  document.getElementById('sc').textContent='0';document.getElementById('lv').textContent='1';document.getElementById('ln').textContent='0';
  document.getElementById('lv').style.color='#fff';
  document.getElementById('overlay').style.display='none';
  initGrid();nx=null;spawn();requestAnimationFrame(loop);
}

initGrid();spawn();requestAnimationFrame(loop);
</script>
</body>
</html>
`;

const HAMBURGER_DODGE_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
<title>Hamburger Dodge</title>
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
html, body {
  width: 100%; height: 100%;
  overflow: hidden;
  background: linear-gradient(180deg, #1a1a2e 0%, #16213e 100%);
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
}
canvas {
  display: block;
  width: 100vw;
  height: 100vh;
}
</style>
</head>
<body>
<canvas id="c"></canvas>
<script>
(function() {
  "use strict";

  var baseSpeed = 3;
  var spawnRate = 45;
  var lives = 3;
  var maxLives = 3;

  var canvas = document.getElementById('c');
  var ctx = canvas.getContext('2d');

  var W, H, laneW, playerY, playerLane, score, gameOver, gameStarted;
  var obstacles, particles, powerUps, shakeX, shakeY, shakeDur;
  var frame, speedMult, spawnTimer, shieldActive, shieldTimer, slowActive, slowTimer;
  var touchStartX, touchStartY, tiltSupported, lastTilt;
  var currentLives;
  var lanes = 5;
  var playerSize, obstacleSize;
  var animPlayerX;
  var bgStars = [];

  function resize() {
    var dpr = window.devicePixelRatio || 1;
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    laneW = W / lanes;
    playerSize = Math.min(laneW * 0.7, 60);
    obstacleSize = Math.min(laneW * 0.65, 55);
    playerY = H - playerSize - 30;
    generateStars();
  }

  function generateStars() {
    bgStars = [];
    for (var i = 0; i < 80; i++) {
      bgStars.push({
        x: Math.random() * W,
        y: Math.random() * H,
        r: Math.random() * 1.5 + 0.5,
        a: Math.random() * 0.5 + 0.3,
        s: Math.random() * 0.3 + 0.1
      });
    }
  }

  function init() {
    playerLane = 2;
    animPlayerX = laneX(playerLane);
    score = 0;
    gameOver = false;
    gameStarted = false;
    obstacles = [];
    particles = [];
    powerUps = [];
    shakeX = 0; shakeY = 0; shakeDur = 0;
    frame = 0;
    speedMult = 1;
    spawnTimer = 0;
    shieldActive = false; shieldTimer = 0;
    slowActive = false; slowTimer = 0;
    currentLives = lives;
    touchStartX = null;
    touchStartY = null;
    lastTilt = 0;
  }

  function laneX(lane) {
    return lane * laneW + laneW / 2;
  }

  function spawnObstacle() {
    var lane = Math.floor(Math.random() * lanes);
    var types = ['\\u{1F697}', '\\u{1F4A3}', '\\u{1F525}', '\\u{1FAA8}'];
    var type = types[Math.floor(Math.random() * types.length)];
    obstacles.push({
      x: laneX(lane),
      y: -obstacleSize,
      type: type,
      size: obstacleSize,
      speed: (baseSpeed + Math.random() * 1.5) * speedMult,
      rot: 0,
      rotSpeed: (Math.random() - 0.5) * 0.05
    });
  }

  function spawnPowerUp() {
    var lane = Math.floor(Math.random() * lanes);
    var types = ['\\u2B50', '\\u23F3'];
    var type = types[Math.floor(Math.random() * types.length)];
    powerUps.push({
      x: laneX(lane),
      y: -obstacleSize,
      type: type,
      size: obstacleSize,
      speed: baseSpeed * 0.7 * speedMult,
      pulse: 0
    });
  }

  function emitParticles(x, y, color, count) {
    for (var i = 0; i < count; i++) {
      var angle = Math.random() * Math.PI * 2;
      var speed = Math.random() * 4 + 2;
      particles.push({
        x: x, y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        decay: Math.random() * 0.03 + 0.02,
        size: Math.random() * 6 + 3,
        color: color
      });
    }
  }

  function triggerShake(intensity, dur) {
    shakeDur = dur;
    shakeX = (Math.random() - 0.5) * intensity;
    shakeY = (Math.random() - 0.5) * intensity;
  }

  function movePlayer(dir) {
    if (gameOver) return;
    if (!gameStarted) gameStarted = true;
    var newLane = playerLane + dir;
    if (newLane >= 0 && newLane < lanes) {
      playerLane = newLane;
    }
  }

  document.addEventListener('keydown', function(e) {
    if (e.key === 'ArrowLeft' || e.key === 'a') movePlayer(-1);
    else if (e.key === 'ArrowRight' || e.key === 'd') movePlayer(1);
    else if (e.key === ' ' || e.key === 'Enter') {
      if (gameOver) { init(); gameStarted = true; }
    }
    e.preventDefault();
  });

  canvas.addEventListener('touchstart', function(e) {
    if (gameOver) { init(); gameStarted = true; return; }
    var t = e.touches[0];
    touchStartX = t.clientX;
    touchStartY = t.clientY;
    e.preventDefault();
  }, { passive: false });

  canvas.addEventListener('touchmove', function(e) {
    e.preventDefault();
  }, { passive: false });

  canvas.addEventListener('touchend', function(e) {
    if (touchStartX === null) return;
    var t = e.changedTouches[0];
    var dx = t.clientX - touchStartX;
    var dy = t.clientY - touchStartY;
    if (Math.abs(dx) > 20 && Math.abs(dx) > Math.abs(dy)) {
      movePlayer(dx > 0 ? 1 : -1);
    } else {
      if (t.clientX < W / 2) movePlayer(-1);
      else movePlayer(1);
    }
    touchStartX = null;
    e.preventDefault();
  }, { passive: false });

  canvas.addEventListener('click', function(e) {
    if (gameOver) { init(); gameStarted = true; return; }
    if (e.clientX < W / 2) movePlayer(-1);
    else movePlayer(1);
  });

  tiltSupported = false;
  if (window.DeviceOrientationEvent) {
    window.addEventListener('deviceorientation', function(e) {
      if (e.gamma === null) return;
      tiltSupported = true;
      var tilt = e.gamma;
      var threshold = 12;
      var now = Date.now();
      if (now - lastTilt < 200) return;
      if (tilt < -threshold) { movePlayer(-1); lastTilt = now; }
      else if (tilt > threshold) { movePlayer(1); lastTilt = now; }
    });
  }

  function collides(a, b, margin) {
    margin = margin || 0;
    var dx = a.x - b.x;
    var dy = a.y - b.y;
    var dist = Math.sqrt(dx * dx + dy * dy);
    return dist < (a.size / 2 + b.size / 2) - margin;
  }

  function update() {
    if (gameOver || !gameStarted) return;
    frame++;
    speedMult = 1 + frame * 0.0003;
    var targetX = laneX(playerLane);
    animPlayerX += (targetX - animPlayerX) * 0.25;
    var adjustedRate = Math.max(12, spawnRate - frame * 0.008);
    spawnTimer++;
    var timeMult = slowActive ? 0.4 : 1;
    if (spawnTimer >= adjustedRate / timeMult) {
      spawnTimer = 0;
      spawnObstacle();
      if (Math.random() < Math.min(0.4, frame * 0.0001)) spawnObstacle();
    }
    if (frame % 300 === 0 && Math.random() < 0.6) spawnPowerUp();
    if (shieldActive) { shieldTimer--; if (shieldTimer <= 0) shieldActive = false; }
    if (slowActive) { slowTimer--; if (slowTimer <= 0) slowActive = false; }
    var player = { x: animPlayerX, y: playerY, size: playerSize };
    for (var i = obstacles.length - 1; i >= 0; i--) {
      var o = obstacles[i];
      o.y += o.speed * timeMult;
      o.rot += o.rotSpeed;
      if (o.y > H + 50) { obstacles.splice(i, 1); continue; }
      if (collides(player, o, 8)) {
        obstacles.splice(i, 1);
        if (shieldActive) { emitParticles(o.x, o.y, '#FFD700', 15); continue; }
        currentLives--;
        emitParticles(animPlayerX, playerY, '#FF4444', 25);
        triggerShake(12, 15);
        if (currentLives <= 0) {
          gameOver = true;
          emitParticles(animPlayerX, playerY, '#FF8800', 40);
          window.parent.postMessage({ type: 'gameOver', score: score }, '*');
        }
      }
    }
    for (var j = powerUps.length - 1; j >= 0; j--) {
      var p = powerUps[j];
      p.y += p.speed * timeMult;
      p.pulse += 0.08;
      if (p.y > H + 50) { powerUps.splice(j, 1); continue; }
      if (collides(player, p, 5)) {
        powerUps.splice(j, 1);
        emitParticles(p.x, p.y, '#00FF88', 20);
        if (p.type === '\\u2B50') { shieldActive = true; shieldTimer = 300; }
        else if (p.type === '\\u23F3') { slowActive = true; slowTimer = 240; }
      }
    }
    for (var k = particles.length - 1; k >= 0; k--) {
      var pt = particles[k];
      pt.x += pt.vx; pt.y += pt.vy; pt.vy += 0.1;
      pt.life -= pt.decay;
      if (pt.life <= 0) particles.splice(k, 1);
    }
    if (shakeDur > 0) {
      shakeDur--;
      shakeX = (Math.random() - 0.5) * shakeDur * 0.8;
      shakeY = (Math.random() - 0.5) * shakeDur * 0.8;
    } else { shakeX = 0; shakeY = 0; }
    score = Math.floor(frame / 3);
  }

  function drawEmoji(emoji, x, y, size, rot) {
    ctx.save();
    ctx.translate(x, y);
    if (rot) ctx.rotate(rot);
    ctx.font = size + 'px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(emoji, 0, 0);
    ctx.restore();
  }

  function draw() {
    ctx.save();
    ctx.clearRect(0, 0, W, H);
    var grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, '#1a1a2e');
    grad.addColorStop(1, '#16213e');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
    for (var s = 0; s < bgStars.length; s++) {
      var st = bgStars[s];
      st.y += st.s;
      if (st.y > H) { st.y = 0; st.x = Math.random() * W; }
      ctx.globalAlpha = st.a + Math.sin(frame * 0.02 + s) * 0.15;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(st.x, st.y, st.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 1;
    for (var l = 1; l < lanes; l++) {
      var lx = l * laneW;
      ctx.beginPath();
      ctx.setLineDash([10, 20]);
      ctx.moveTo(lx, 0);
      ctx.lineTo(lx, H);
      ctx.stroke();
    }
    ctx.setLineDash([]);
    ctx.translate(shakeX, shakeY);
    for (var j = 0; j < powerUps.length; j++) {
      var pu = powerUps[j];
      var sc = 1 + Math.sin(pu.pulse) * 0.12;
      ctx.save();
      ctx.translate(pu.x, pu.y);
      ctx.scale(sc, sc);
      ctx.shadowColor = pu.type === '\\u2B50' ? '#FFD700' : '#00BFFF';
      ctx.shadowBlur = 18;
      ctx.font = pu.size + 'px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(pu.type, 0, 0);
      ctx.shadowBlur = 0;
      ctx.restore();
    }
    for (var i = 0; i < obstacles.length; i++) {
      var o = obstacles[i];
      drawEmoji(o.type, o.x, o.y, o.size, o.rot);
    }
    if (!gameOver) {
      ctx.save();
      if (shieldActive) {
        ctx.shadowColor = '#FFD700';
        ctx.shadowBlur = 25;
        ctx.strokeStyle = 'rgba(255,215,0,' + (0.4 + Math.sin(frame * 0.1) * 0.3) + ')';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(animPlayerX, playerY, playerSize * 0.55, 0, Math.PI * 2);
        ctx.stroke();
      }
      if (slowActive) { ctx.shadowColor = '#00BFFF'; ctx.shadowBlur = 20; }
      var bob = Math.sin(frame * 0.08) * 3;
      drawEmoji('\\u{1F354}', animPlayerX, playerY + bob, playerSize, 0);
      ctx.shadowBlur = 0;
      ctx.restore();
    }
    for (var k = 0; k < particles.length; k++) {
      var pt = particles[k];
      ctx.globalAlpha = pt.life;
      ctx.fillStyle = pt.color;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, pt.size * pt.life, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold ' + Math.max(18, W * 0.045) + 'px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('Score: ' + score, 15, 15);
    if (slowActive) { ctx.fillStyle = '#00BFFF'; ctx.font = Math.max(14, W * 0.032) + 'px sans-serif'; ctx.fillText('SLOW', 15, 50); }
    if (shieldActive) { ctx.fillStyle = '#FFD700'; ctx.font = Math.max(14, W * 0.032) + 'px sans-serif'; ctx.fillText('SHIELD', 15, slowActive ? 75 : 50); }
    ctx.textAlign = 'right';
    ctx.font = Math.max(20, W * 0.05) + 'px serif';
    var heartsStr = '';
    for (var h = 0; h < maxLives; h++) heartsStr += h < currentLives ? '\\u2764\\uFE0F' : '\\u{1F5A4}';
    ctx.fillText(heartsStr, W - 15, 12);
    ctx.restore();
    if (!gameStarted && !gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = 'bold ' + Math.max(28, W * 0.07) + 'px sans-serif';
      ctx.fillText('Hamburger Dodge', W / 2, H * 0.32);
      ctx.font = Math.max(16, W * 0.04) + 'px sans-serif';
      ctx.fillStyle = '#cccccc';
      ctx.fillText('Dodge the obstacles!', W / 2, H * 0.43);
      ctx.fillText('Swipe / Tap / Arrow Keys', W / 2, H * 0.51);
      ctx.font = 'bold ' + Math.max(18, W * 0.045) + 'px sans-serif';
      ctx.fillStyle = '#FFD700';
      var pulse = 0.7 + Math.sin(Date.now() * 0.004) * 0.3;
      ctx.globalAlpha = pulse;
      ctx.fillText('Tap to Start', W / 2, H * 0.63);
      ctx.globalAlpha = 1;
    }
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.65)';
      ctx.fillRect(0, 0, W, H);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#FF4444';
      ctx.font = 'bold ' + Math.max(32, W * 0.08) + 'px sans-serif';
      ctx.fillText('GAME OVER', W / 2, H * 0.35);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold ' + Math.max(24, W * 0.06) + 'px sans-serif';
      ctx.fillText('Score: ' + score, W / 2, H * 0.47);
      ctx.fillStyle = '#aaaaaa';
      ctx.font = Math.max(16, W * 0.04) + 'px sans-serif';
      ctx.fillText('Tap to Retry', W / 2, H * 0.58);
    }
  }

  function loop() { update(); draw(); requestAnimationFrame(loop); }
  window.addEventListener('resize', resize);
  resize();
  init();
  loop();
})();
</script>
</body>
</html>`;

// Import game modules
import { NEON_SHOOTER_HTML } from './games/neonShooter';
import { NEON_PLATFORMER_HTML } from './games/neonPlatformer';
import { TEMPLE_RUNNER_HTML as TEMPLE_RUNNER_V2 } from './games/templeRunner';
import { TETRIS_HTML as TETRIS_V2 } from './games/tetris';
import { DOT_RPG_HTML } from './games/dotRpg';
import { CAT_JUMP_HTML } from './games/catJump';
import { BALLOON_POP_HTML } from './games/balloonPop';
import { STAR_CATCH_HTML } from './games/starCatch';

export const DEMO_GAMES: DemoGame[] = [
  {
    id: 'neon-shooter',
    title: '네온 슈터',
    description: 'Phaser.js 물리엔진 기반 네온 우주 슈터. 보스전 + 파워업 + 파티클',
    prompt: 'Phaser 3 Arcade Physics 수직 스크롤 슈터',
    icon: '◆',
    accentColor: '#00FFFF',
    html: NEON_SHOOTER_HTML,
  },
  {
    id: 'neon-platformer',
    title: '네온 러너',
    description: 'Phaser.js 물리 플랫포머. 더블점프 + 벽타기 + 프로시저럴 맵',
    prompt: 'Phaser 3 Physics 무한 러너 플랫포머',
    icon: '◈',
    accentColor: '#FF00FF',
    html: NEON_PLATFORMER_HTML,
  },
  {
    id: 'temple-runner',
    title: '템플 러너',
    description: 'Three.js 3D 1인칭 러너. 실시간 장애물 회피 + 코인 수집',
    prompt: 'Three.js WebGL 3D 1인칭 끝없는 러너',
    icon: '▸▸',
    accentColor: '#00CCFF',
    html: TEMPLE_RUNNER_V2,
  },
  {
    id: 'tetris',
    title: '테트리스',
    description: '클래식 테트리스. 줄 완성 콤보 + 레벨업 속도 증가',
    prompt: '클래식 10x20 테트리스',
    icon: '⊞',
    accentColor: '#B400FF',
    html: TETRIS_V2,
  },
  {
    id: 'dot-rpg',
    title: '도트 RPG',
    description: '픽셀 도트 RPG. NPC 대화 + 턴제 전투 + 레벨업',
    prompt: 'Phaser 3 도트 픽셀아트 RPG 마을 탐험',
    icon: '⚔',
    accentColor: '#FFD700',
    html: DOT_RPG_HTML,
  },
  {
    id: 'cat-jump',
    title: '고양이 점프',
    description: '귀여운 고양이가 끝없이 점프! 풍선 플랫폼 + 하트 수집',
    prompt: 'Canvas 2D 고양이 점프 플랫포머',
    icon: '🐱',
    accentColor: '#ff8844',
    html: CAT_JUMP_HTML,
  },
  {
    id: 'balloon-pop',
    title: '풍선 팝',
    description: '60초 안에 풍선을 최대한 많이 터뜨려요! 콤보 + 폭탄 주의',
    prompt: 'Canvas 2D 풍선 터뜨리기 게임',
    icon: '🎈',
    accentColor: '#ff6b8a',
    html: BALLOON_POP_HTML,
  },
  {
    id: 'star-catch',
    title: '별 모으기',
    description: '밤하늘에서 떨어지는 별을 구름이 받아요! 번개 피하기',
    prompt: 'Canvas 2D 별 모으기 캐치 게임',
    icon: '⭐',
    accentColor: '#ffd700',
    html: STAR_CATCH_HTML,
  },
];
