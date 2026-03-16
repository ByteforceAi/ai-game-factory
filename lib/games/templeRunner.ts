export const TEMPLE_RUNNER_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0,user-scalable=no">
<title>Temple Runner</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{overflow:hidden;background:#000;font-family:'Courier New',monospace}
canvas{display:block;width:100%;height:100%}
#hud{position:absolute;top:0;left:0;width:100%;pointer-events:none;text-align:center;padding:12px}
#score{color:#fff;font-size:24px;text-shadow:0 0 10px rgba(255,200,0,.8),2px 2px 4px #000;letter-spacing:2px}
#coins{color:#ffcc00;font-size:14px;margin-top:4px;text-shadow:0 0 6px rgba(255,200,0,.5)}
#overlay{position:absolute;top:0;left:0;width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#fff;text-shadow:0 0 20px rgba(255,150,0,.9),2px 2px 6px #000}
#overlay h1{font-size:38px;margin-bottom:8px;letter-spacing:3px}
#overlay p{font-size:20px;margin:4px 0}
#overlay .sub{font-size:14px;opacity:.6;margin-top:16px;animation:pulse 1.5s ease-in-out infinite}
@keyframes pulse{0%,100%{opacity:.4}50%{opacity:.9}}
.flash{position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;opacity:0;transition:opacity .15s}
</style>
</head>
<body>
<div id="hud"><div id="score">0</div><div id="coins"></div></div>
<div id="overlay"><h1>TEMPLE RUNNER</h1><p>Dodge walls, jump bars, collect coins!</p><p class="sub">Tap / Press any key to Start</p></div>
<div id="flash" class="flash" style="background:rgba(255,215,0,.3)"></div>
<div id="damageFlash" class="flash" style="background:rgba(255,0,0,.4)"></div>
<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
<script>
'use strict';
(function(){

/* ═══════════ PROCEDURAL AUDIO ═══════════ */
var AudioCtx = window.AudioContext || window.webkitAudioContext;
var actx = null;
function ensureAudio(){
  if(!actx){ try{ actx = new AudioCtx(); }catch(e){ actx=null; } }
  if(actx && actx.state==='suspended') actx.resume().catch(function(){});
}

function sfxCoin(){
  if(!actx) return;
  try{
    var t = actx.currentTime;
    var osc = actx.createOscillator();
    var gain = actx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, t);
    osc.frequency.exponentialRampToValueAtTime(1600, t+0.1);
    gain.gain.setValueAtTime(0.1, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t+0.15);
    osc.connect(gain); gain.connect(actx.destination);
    osc.start(t); osc.stop(t+0.16);
    // second note
    var osc2 = actx.createOscillator();
    var gain2 = actx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1200, t+0.06);
    osc2.frequency.exponentialRampToValueAtTime(2000, t+0.16);
    gain2.gain.setValueAtTime(0.07, t+0.06);
    gain2.gain.exponentialRampToValueAtTime(0.001, t+0.2);
    osc2.connect(gain2); gain2.connect(actx.destination);
    osc2.start(t+0.06); osc2.stop(t+0.21);
  }catch(e){}
}

function sfxJump(){
  if(!actx) return;
  try{
    var t = actx.currentTime;
    var osc = actx.createOscillator();
    var gain = actx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(200, t);
    osc.frequency.exponentialRampToValueAtTime(500, t+0.12);
    gain.gain.setValueAtTime(0.08, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t+0.15);
    osc.connect(gain); gain.connect(actx.destination);
    osc.start(t); osc.stop(t+0.16);
  }catch(e){}
}

function sfxDeath(){
  if(!actx) return;
  try{
    var t = actx.currentTime;
    // crash noise
    var bufSize = Math.floor(actx.sampleRate * 0.5);
    var buf = actx.createBuffer(1, bufSize, actx.sampleRate);
    var data = buf.getChannelData(0);
    for(var i=0;i<bufSize;i++) data[i]=(Math.random()*2-1)*Math.pow(1-i/bufSize,1.5);
    var src = actx.createBufferSource(); src.buffer = buf;
    var filter = actx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, t);
    filter.frequency.exponentialRampToValueAtTime(60, t+0.5);
    var gain = actx.createGain();
    gain.gain.setValueAtTime(0.15, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t+0.5);
    src.connect(filter); filter.connect(gain); gain.connect(actx.destination);
    src.start(t);
    // descending tone
    var osc = actx.createOscillator();
    var g2 = actx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(300, t);
    osc.frequency.exponentialRampToValueAtTime(40, t+0.8);
    g2.gain.setValueAtTime(0.08, t);
    g2.gain.exponentialRampToValueAtTime(0.001, t+0.8);
    osc.connect(g2); g2.connect(actx.destination);
    osc.start(t); osc.stop(t+0.81);
  }catch(e){}
}

function sfxLaneChange(){
  if(!actx) return;
  try{
    var t = actx.currentTime;
    var osc = actx.createOscillator();
    var gain = actx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(300, t);
    osc.frequency.exponentialRampToValueAtTime(350, t+0.05);
    gain.gain.setValueAtTime(0.04, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t+0.06);
    osc.connect(gain); gain.connect(actx.destination);
    osc.start(t); osc.stop(t+0.07);
  }catch(e){}
}

/* ═══════════ GAME STATE ═══════════ */
var coinScore=0,distScore=0,gameOver=false;
var started=false,speed=0,maxSpeed=50,baseSpeed=16,laneX=[-2.4,0,2.4],currentLane=1,targetX=0;
var jumpVel=0,isJumping=false,playerY=0,gravity=28,jumpForce=11;
var obstacles=[],coins=[],pillars=[],grounds=[];
var spawnTimer=0,spawnInterval=1.2,coinTimer=0,distTraveled=0;
var touchStartX=0,touchStartY=0,touchStartT=0;
var deathAnim=0,deathPhase=false;
var gameOverSent=false;
var floatingTexts=[];

/* ═══════════ THREE.JS SETUP ═══════════ */
var scene=new THREE.Scene();
scene.background=new THREE.Color(0x1a0a2e);
scene.fog=new THREE.Fog(0x1a0a2e,25,80);

var camera=new THREE.PerspectiveCamera(70,innerWidth/innerHeight,0.1,120);
camera.position.set(0,4.5,7);
camera.lookAt(0,1,-10);

var renderer=new THREE.WebGLRenderer({antialias:true});
renderer.setSize(innerWidth,innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio,2));
renderer.shadowMap.enabled=false;
document.body.appendChild(renderer.domElement);

// Lighting - more dramatic
scene.add(new THREE.AmbientLight(0x6666aa,0.4));
var dirLight=new THREE.DirectionalLight(0xffddaa,1.0);
dirLight.position.set(5,15,-10);
scene.add(dirLight);
// Colored point light following player
var playerLight=new THREE.PointLight(0x00ccff,0.6,15);
playerLight.position.set(0,3,0);
scene.add(playerLight);

// Player - glowing cube with emissive
var playerGeo=new THREE.BoxGeometry(0.7,1.4,0.7);
var playerMat=new THREE.MeshPhongMaterial({color:0x00ccff,emissive:0x006688,shininess:80});
var player=new THREE.Mesh(playerGeo,playerMat);
player.position.set(0,0.7,0);
scene.add(player);

// Ground with alternating materials
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

// Pillars with glow effect
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

// Obstacle materials - distinct colors for wall vs bar
var wallGeo=new THREE.BoxGeometry(2.2,2.5,0.6);
var wallMat=new THREE.MeshPhongMaterial({color:0xff2200,emissive:0x661100,shininess:60});
var barGeo=new THREE.CylinderGeometry(0.15,0.15,2.2,8);
barGeo.rotateZ(Math.PI/2);
var barMat=new THREE.MeshPhongMaterial({color:0xddcc00,emissive:0x665500,shininess:60});
var coinGeo=new THREE.OctahedronGeometry(0.35,0);
var coinMat=new THREE.MeshPhongMaterial({color:0xffcc00,emissive:0x886600,shininess:100});
var coinMatPool=[];for(var ci=0;ci<12;ci++)coinMatPool.push(coinMat.clone());var coinMatIdx=0;

// Floating particles
var particleGeo=new THREE.BufferGeometry();
var pCount=80,pPositions=new Float32Array(pCount*3);
for(var i=0;i<pCount;i++){
  pPositions[i*3]=(Math.random()-0.5)*8;
  pPositions[i*3+1]=Math.random()*4+0.3;
  pPositions[i*3+2]=-Math.random()*80;
}
particleGeo.setAttribute('position',new THREE.BufferAttribute(pPositions,3));
var dustParticles=new THREE.Points(particleGeo,new THREE.PointsMaterial({color:0xaaccff,size:0.1,transparent:true,opacity:0.5}));
scene.add(dustParticles);

// UI elements
var scoreEl=document.getElementById('score');
var coinsEl=document.getElementById('coins');
var overlayEl=document.getElementById('overlay');
var flashEl=document.getElementById('flash');
var damageFlashEl=document.getElementById('damageFlash');

function updateHUD(){
  var total=distScore+coinScore;
  scoreEl.textContent=total;
  if(coinScore>0) coinsEl.textContent='\\u2B50 '+coinScore;
}

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
    var c=new THREE.Mesh(coinGeo,coinMatPool[coinMatIdx++%coinMatPool.length]);
    c.position.set(laneX[lane],1.2,player.position.z-80-i*3);
    c.userData={type:'coin',collected:false};
    scene.add(c);coins.push(c);
  }
}

function doFlash(el,dur){
  el.style.opacity='1';
  setTimeout(function(){el.style.opacity='0'},dur||120);
}

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
      c.userData.collected=true;
      sfxCoin();
      // coin collect animation: scale up then remove
      var cRef=c;
      coinScore+=10;
      updateHUD();
      doFlash(flashEl,100);
      // animate coin
      (function(coin){
        var startScale=coin.scale.x;
        var startY=coin.position.y;
        coin.material.transparent=true;
        var anim={t:0};
        function animCoin(){
          anim.t+=0.05;
          if(anim.t>=1){
            scene.remove(coin);
            return;
          }
          coin.scale.set(startScale*(1+anim.t*2),startScale*(1+anim.t*2),startScale*(1+anim.t*2));
          coin.material.opacity=1-anim.t;
          coin.position.y=startY+anim.t*2;
          requestAnimationFrame(animCoin);
        }
        animCoin();
      })(c);
      coins.splice(i,1);
    }
  }
}

function endGame(){
  if(gameOver) return;
  gameOver=true;
  deathPhase=true;
  deathAnim=0;
  sfxDeath();
  doFlash(damageFlashEl,400);

  // player death effect - turn red and dissolve
  playerMat.emissive.set(0xff0000);
  playerMat.color.set(0xff2200);
}

function showGameOver(){
  if(gameOverSent) return;
  gameOverSent=true;
  var total=distScore+coinScore;
  overlayEl.innerHTML='<h1>GAME OVER</h1><p>Score: '+total+'</p><p style="color:#ffcc00;font-size:14px">Distance: '+Math.floor(distTraveled)+'m | Coins: '+coinScore+'</p><p class="sub">Tap / Press to Restart</p>';
  overlayEl.style.display='flex';
  try{
    window.parent.postMessage({type:'gameOver',score:total},'*');
  }catch(e){}
}

function reset(){
  obstacles.forEach(function(o){scene.remove(o)});obstacles=[];
  coins.forEach(function(c){scene.remove(c)});coins=[];
  coinScore=0;distScore=0;gameOver=false;gameOverSent=false;started=true;speed=baseSpeed;
  currentLane=1;targetX=0;playerY=0;jumpVel=0;isJumping=false;
  deathPhase=false;deathAnim=0;
  player.position.set(0,0.7,0);
  player.scale.set(1,1,1);
  player.rotation.set(0,0,0);
  playerMat.color.set(0x00ccff);
  playerMat.emissive.set(0x006688);
  playerMat.opacity=1;
  playerMat.transparent=false;
  player.visible=true;
  distTraveled=0;spawnTimer=0;coinTimer=0;
  overlayEl.style.display='none';
  updateHUD();
}

function switchLane(dir){
  var newLane=Math.max(0,Math.min(2,currentLane+dir));
  if(newLane!==currentLane){
    currentLane=newLane;
    targetX=laneX[currentLane];
    sfxLaneChange();
  }
}

function jump(){
  if(!isJumping){
    isJumping=true;
    jumpVel=jumpForce;
    sfxJump();
  }
}

// Input
document.addEventListener('keydown',function(e){
  ensureAudio();
  if(!started||gameOver){reset();return}
  if(e.code==='ArrowLeft'||e.code==='KeyA')switchLane(-1);
  if(e.code==='ArrowRight'||e.code==='KeyD')switchLane(1);
  if(e.code==='ArrowUp'||e.code==='Space'||e.code==='KeyW')jump();
  e.preventDefault();
});

document.addEventListener('touchstart',function(e){
  ensureAudio();
  if(!started||gameOver){reset();return}
  touchStartX=e.touches[0].clientX;touchStartY=e.touches[0].clientY;touchStartT=Date.now();
},{passive:true});
document.addEventListener('touchend',function(e){
  var dx=e.changedTouches[0].clientX-touchStartX;
  var dy=e.changedTouches[0].clientY-touchStartY;
  var dt=Date.now()-touchStartT;
  if(dt>300)return;
  var ax=Math.abs(dx),ay=Math.abs(dy);
  if(ax<25&&ay<25)return;
  if(ax>ay){dx>0?switchLane(1):switchLane(-1)}
  else if(dy<-25){jump()}
},{passive:true});

document.addEventListener('click',function(){
  ensureAudio();
  if(!started||gameOver)reset();
});

window.addEventListener('resize',function(){
  camera.aspect=innerWidth/innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth,innerHeight);
});

/* ═══════════ ANIMATION LOOP ═══════════ */
var clock=new THREE.Clock();
function animate(){
  requestAnimationFrame(animate);
  var dt=Math.min(clock.getDelta(),0.05);

  if(!started||gameOver){
    // Death animation
    if(deathPhase){
      deathAnim+=dt;
      // Camera tumble
      camera.position.y=playerY+4.5+Math.sin(deathAnim*8)*deathAnim*0.5;
      camera.position.z=player.position.z+7+deathAnim*3;
      camera.rotation.z=Math.sin(deathAnim*5)*deathAnim*0.1;
      // Player dissolve
      player.rotation.x+=dt*3;
      player.rotation.z+=dt*2;
      player.scale.multiplyScalar(0.97);
      playerMat.transparent=true;
      playerMat.opacity=Math.max(0,1-deathAnim*1.5);

      if(deathAnim>1.2){
        deathPhase=false;
        player.visible=false;
        showGameOver();
      }
    }
    renderer.render(scene,camera);
    return;
  }

  // Speed ramp (gentler start)
  speed=Math.min(maxSpeed,baseSpeed+distTraveled*0.006);
  var moveZ=speed*dt;
  distTraveled+=moveZ;
  distScore=Math.floor(distTraveled);
  player.position.z-=moveZ;

  // Player lane movement (smooth lerp)
  player.position.x+=(targetX-player.position.x)*8*dt;
  // Player lean into turns
  var leanTarget=(targetX-player.position.x)*0.3;
  player.rotation.z+=(leanTarget*-0.5-player.rotation.z)*5*dt;

  // Jump physics
  if(isJumping){
    jumpVel-=gravity*dt;
    playerY+=jumpVel*dt;
    if(playerY<=0){playerY=0;isJumping=false;jumpVel=0}
  }
  player.position.y=playerY+0.7;

  // Player light follows
  playerLight.position.set(player.position.x,player.position.y+2,player.position.z);
  // Pulse player emissive with speed
  var speedPct=speed/maxSpeed;
  playerMat.emissive.setHex(speedPct>0.7?0x008888:0x006688);

  // Camera follow
  camera.position.set(player.position.x*0.5,playerY+4.5,player.position.z+7);
  camera.lookAt(player.position.x*0.3,playerY+1,player.position.z-10);
  camera.rotation.z=0;

  // Spawn obstacles
  spawnTimer+=dt;
  var curInterval=Math.max(0.55,spawnInterval-distTraveled*0.0004);
  if(spawnTimer>curInterval){spawnTimer=0;spawnObstacle()}
  coinTimer+=dt;
  if(coinTimer>2.5){coinTimer=0;spawnCoins()}

  // Clean up distant objects
  for(var i=obstacles.length-1;i>=0;i--){
    if(obstacles[i].position.z>player.position.z+15){
      scene.remove(obstacles[i]);obstacles.splice(i,1);
    }
  }
  for(var i=coins.length-1;i>=0;i--){
    if(coins[i].position.z>player.position.z+15){
      scene.remove(coins[i]);coins.splice(i,1);
    } else {
      coins[i].rotation.y+=4*dt;
      // bob
      coins[i].position.y=1.2+Math.sin(Date.now()*0.003+i)*0.15;
    }
  }

  // Ground recycling
  grounds.forEach(function(g){
    if(g.position.z>player.position.z+60)g.position.z-=200;
  });
  for(var i=0;i<pillars.length;i++){
    if(pillars[i].position.z>player.position.z+20)pillars[i].position.z-=200;
  }

  // Dust particles
  var pPos=particleGeo.attributes.position;
  for(var i=0;i<pCount;i++){
    pPos.array[i*3+2]+=speed*dt*0.5;
    if(pPos.array[i*3+2]>player.position.z+10){
      pPos.array[i*3]=(Math.random()-0.5)*8;
      pPos.array[i*3+1]=Math.random()*4+0.3;
      pPos.array[i*3+2]=player.position.z-60-Math.random()*20;
    }
  }
  pPos.needsUpdate=true;

  checkCollisions();
  updateHUD();
  renderer.render(scene,camera);
}
animate();

})();
</script>
</body>
</html>`;
