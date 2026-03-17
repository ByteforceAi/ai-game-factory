export const FARM_GARDEN_HTML = `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<title>마음의 텃밭 3D</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{overflow:hidden;background:#000;font-family:'Segoe UI',sans-serif;touch-action:none}
canvas{display:block;width:100%;height:100%}
#ui{position:fixed;top:0;left:0;right:0;pointer-events:none;z-index:10;padding:12px}
.hud{display:flex;gap:8px;justify-content:center;flex-wrap:wrap}
.hud-item{
  background:rgba(0,0,0,0.55);backdrop-filter:blur(8px);
  color:#fff;padding:8px 16px;border-radius:30px;
  font-size:15px;font-weight:600;
  display:flex;align-items:center;gap:6px;
  border:1px solid rgba(255,255,255,0.15);
  transition:transform 0.2s;
}
.hud-item:hover{transform:scale(1.05)}
.hud-gold{color:#FFD54F}
.hud-lv{color:#81C784}
.hud-harvest{color:#F48FB1}
.hud-water{color:#64B5F6}
#msg{
  position:fixed;bottom:80px;left:50%;transform:translateX(-50%);
  background:rgba(0,0,0,0.7);backdrop-filter:blur(8px);
  color:#fff;padding:10px 24px;border-radius:30px;
  font-size:15px;font-weight:500;z-index:10;
  transition:opacity 0.4s,transform 0.4s;pointer-events:none;
  border:1px solid rgba(255,255,255,0.1);
  white-space:nowrap;
}
#msg.hidden{opacity:0;transform:translateX(-50%) translateY(10px)}
#msg.show{opacity:1;transform:translateX(-50%) translateY(0)}
#controls{
  position:fixed;bottom:16px;left:50%;transform:translateX(-50%);
  z-index:10;display:flex;gap:6px;pointer-events:auto;
}
.ctrl-btn{
  width:56px;height:56px;border-radius:50%;border:2px solid rgba(255,255,255,0.3);
  background:rgba(0,0,0,0.5);backdrop-filter:blur(8px);
  color:#fff;font-size:22px;display:flex;align-items:center;justify-content:center;
  cursor:pointer;user-select:none;-webkit-user-select:none;
  transition:background 0.15s,transform 0.1s;
}
.ctrl-btn:active{background:rgba(255,255,255,0.25);transform:scale(0.9)}
#joystick-zone{
  position:fixed;bottom:16px;left:16px;z-index:10;
  width:140px;height:140px;pointer-events:auto;
}
#joystick-base{
  width:120px;height:120px;border-radius:50%;
  border:2px solid rgba(255,255,255,0.2);
  background:rgba(0,0,0,0.35);backdrop-filter:blur(6px);
  position:absolute;bottom:10px;left:10px;
}
#joystick-thumb{
  width:48px;height:48px;border-radius:50%;
  background:rgba(255,255,255,0.45);
  position:absolute;
  top:50%;left:50%;transform:translate(-50%,-50%);
  pointer-events:none;transition:none;
}
#action-btns{
  position:fixed;bottom:20px;right:16px;z-index:10;
  display:flex;flex-direction:column;gap:10px;pointer-events:auto;
}
.action-circle{
  width:64px;height:64px;border-radius:50%;
  border:3px solid rgba(255,255,255,0.4);
  color:#fff;font-size:24px;font-weight:700;
  display:flex;align-items:center;justify-content:center;
  cursor:pointer;pointer-events:auto;
  transition:transform 0.1s;
}
.action-circle:active{transform:scale(0.88)}
#btn-plant{
  background:linear-gradient(135deg,#66BB6A,#43A047);
  box-shadow:0 4px 20px rgba(76,175,80,0.5);
}
#btn-water{
  background:linear-gradient(135deg,#42A5F5,#1E88E5);
  box-shadow:0 4px 20px rgba(33,150,243,0.5);
  width:52px;height:52px;font-size:20px;
}
#shop-panel{
  position:fixed;top:60px;right:12px;z-index:10;
  background:rgba(0,0,0,0.75);backdrop-filter:blur(12px);
  border-radius:16px;padding:12px;
  border:1px solid rgba(255,255,255,0.15);
  pointer-events:auto;max-width:220px;
  display:none;
}
#shop-panel.open{display:block}
.shop-item{
  display:flex;align-items:center;gap:8px;
  padding:8px;border-radius:10px;cursor:pointer;
  color:#fff;font-size:13px;margin-bottom:4px;
  transition:background 0.15s;
}
.shop-item:hover{background:rgba(255,255,255,0.1)}
.shop-item.locked{opacity:0.35;pointer-events:none}
.shop-emoji{font-size:22px}
.shop-info{flex:1}
.shop-name{font-weight:600}
.shop-cost{color:#FFD54F;font-size:12px}
#shop-toggle{
  position:fixed;top:60px;right:12px;z-index:11;
  background:rgba(0,0,0,0.6);backdrop-filter:blur(8px);
  border:1px solid rgba(255,255,255,0.2);
  color:#fff;width:44px;height:44px;border-radius:50%;
  font-size:20px;display:flex;align-items:center;justify-content:center;
  cursor:pointer;pointer-events:auto;
}
#time-indicator{
  position:fixed;top:12px;right:12px;z-index:10;pointer-events:none;
  font-size:28px;filter:drop-shadow(0 2px 8px rgba(0,0,0,0.3));
  transition:opacity 0.5s;
}
#weather-indicator{
  position:fixed;top:12px;left:12px;z-index:10;pointer-events:none;
  font-size:20px;padding:6px 14px;
  background:rgba(0,0,0,0.4);backdrop-filter:blur(8px);
  border-radius:20px;color:#fff;
  border:1px solid rgba(255,255,255,0.1);
}
#tutorial{
  position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);
  z-index:20;background:rgba(0,0,0,0.85);backdrop-filter:blur(16px);
  border-radius:20px;padding:32px;text-align:center;color:#fff;
  border:1px solid rgba(255,255,255,0.15);max-width:360px;
}
#tutorial h2{font-size:24px;margin-bottom:14px;color:#81C784}
#tutorial p{font-size:14px;line-height:1.8;margin-bottom:16px;color:rgba(255,255,255,0.8)}
#tutorial button{
  background:linear-gradient(135deg,#66BB6A,#43A047);
  color:#fff;border:none;padding:14px 36px;border-radius:30px;
  font-size:16px;font-weight:600;cursor:pointer;
  box-shadow:0 4px 16px rgba(76,175,80,0.4);
  transition:transform 0.15s;
}
#tutorial button:hover{transform:scale(1.05)}
@keyframes rainDrop{
  0%{opacity:0.7;transform:translateY(-10px)}
  100%{opacity:0;transform:translateY(100vh)}
}
.rain-drop{
  position:fixed;top:0;width:2px;height:20px;
  background:linear-gradient(transparent,rgba(150,200,255,0.5));
  pointer-events:none;z-index:5;
  animation:rainDrop 0.6s linear forwards;
}
@media(min-width:768px){
  #joystick-zone{display:none}
  #action-btns{display:none}
}
@media(max-width:767px){
  #controls{display:none}
}
</style>
</head>
<body>
<div id="ui">
  <div class="hud">
    <div class="hud-item">💰 <span class="hud-gold" id="h-gold">20</span></div>
    <div class="hud-item">⭐ <span class="hud-lv" id="h-lv">Lv.1</span></div>
    <div class="hud-item">🌾 <span class="hud-harvest" id="h-harv">0</span></div>
    <div class="hud-item">💧 <span class="hud-water" id="h-water">5</span></div>
    <div class="hud-item">🌱 <span id="h-seed">무</span></div>
  </div>
</div>
<div id="msg" class="hidden"></div>
<div id="time-indicator">🌅</div>
<div id="weather-indicator">☀️ 맑음</div>
<!-- Mobile joystick -->
<div id="joystick-zone">
  <div id="joystick-base">
    <div id="joystick-thumb"></div>
  </div>
</div>
<div id="action-btns">
  <div class="action-circle" id="btn-plant">🌾</div>
  <div class="action-circle" id="btn-water">💧</div>
</div>
<!-- Desktop controls -->
<div id="controls">
  <div class="ctrl-btn" title="WASD 이동">🕹️</div>
  <div class="ctrl-btn" title="Space 심기/수확">🌱</div>
  <div class="ctrl-btn" title="E 물주기">💧</div>
</div>
<div id="shop-toggle" onclick="toggleShop()">🏪</div>
<div id="shop-panel"></div>
<div id="tutorial">
  <h2>🏡 마음의 텃밭 3D</h2>
  <p>
    <b>PC</b>: WASD 이동 · Space 심기/수확 · E 물주기<br>
    <b>모바일</b>: 조이스틱 이동 · 🌾 심기/수확 · 💧 물주기<br><br>
    밭에서 씨앗을 심고, 물을 주면 <b>더 빨리</b> 자라요!<br>
    다 자란 작물을 수확해서 금화를 모으세요 🪙<br><br>
    🌧️ 비가 오면 자동으로 물을 줘요<br>
    🌙 밤에는 작물이 천천히 자라요
  </p>
  <button onclick="startGame()">시작하기 🌱</button>
</div>
<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
<script>
// ====== AUDIO SYSTEM ======
var AudioCtx = window.AudioContext || window.webkitAudioContext;
var actx = null;
function initAudio(){if(!actx)actx=new AudioCtx();}
function playTone(freq,dur,type,vol){
  if(!actx)return;
  var o=actx.createOscillator(),g=actx.createGain();
  o.type=type||'sine';o.frequency.value=freq;
  g.gain.setValueAtTime(vol||0.1,actx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001,actx.currentTime+dur);
  o.connect(g);g.connect(actx.destination);
  o.start();o.stop(actx.currentTime+dur);
}
function sfxPlant(){playTone(520,0.15,'sine',0.12);setTimeout(function(){playTone(660,0.12,'sine',0.1)},80);}
function sfxHarvest(){playTone(880,0.1,'sine',0.15);setTimeout(function(){playTone(1100,0.15,'sine',0.12)},60);setTimeout(function(){playTone(1320,0.2,'sine',0.1)},140);}
function sfxWater(){playTone(300,0.2,'sine',0.08);setTimeout(function(){playTone(350,0.15,'sine',0.06)},100);}
function sfxCoin(){playTone(1200,0.08,'square',0.06);setTimeout(function(){playTone(1600,0.12,'square',0.05)},50);}
function sfxLevelUp(){playTone(523,0.15,'sine',0.12);setTimeout(function(){playTone(659,0.15,'sine',0.1)},120);setTimeout(function(){playTone(784,0.15,'sine',0.1)},240);setTimeout(function(){playTone(1047,0.25,'sine',0.12)},360);}

// ====== CONFIG ======
var CROPS = [
  {id:'radish',  name:'무',     emoji:'🥕', price:0,   time:8,  reward:10,  xp:5,  color:0xFF6B35,topColor:0x4CAF50,h:0.4,unlockLv:1},
  {id:'tomato',  name:'토마토', emoji:'🍅', price:15,  time:12, reward:28,  xp:12, color:0xEF5350,topColor:0x388E3C,h:0.45,unlockLv:1},
  {id:'corn',    name:'옥수수', emoji:'🌽', price:35,  time:16, reward:55,  xp:18, color:0xFFEB3B,topColor:0x558B2F,h:0.7,unlockLv:2},
  {id:'eggplant',name:'가지',   emoji:'🍆', price:60,  time:20, reward:85,  xp:25, color:0x7B1FA2,topColor:0x33691E,h:0.5,unlockLv:3},
  {id:'pepper',  name:'고추',   emoji:'🌶️', price:100, time:24, reward:135, xp:35, color:0xD32F2F,topColor:0x2E7D32,h:0.55,unlockLv:4},
  {id:'melon',   name:'참외',   emoji:'🍈', price:160, time:30, reward:200, xp:45, color:0xFDD835,topColor:0x1B5E20,h:0.5,unlockLv:5},
  {id:'strawberry',name:'딸기', emoji:'🍓', price:240, time:35, reward:300, xp:60, color:0xE91E63,topColor:0x4CAF50,h:0.35,unlockLv:6},
  {id:'pumpkin', name:'호박',   emoji:'🎃', price:350, time:40, reward:430, xp:80, color:0xFF9800,topColor:0x33691E,h:0.55,unlockLv:7},
];
var LEVELS = [0,30,80,170,320,550,900,1400,2200,3500];
var GRID = 5;
var PLOT_SIZE = 2.2;
var PLOT_GAP = 0.3;

// ====== STATE ======
var gold = 20, xp = 0, level = 1, totalHarvest = 0, selectedCrop = 0;
var waterCount = 5, maxWater = 5;
var plots = [];
var speedBoost = 1;
var gameTime = 0; // 0-24 virtual hours
var dayPhase = 'morning'; // morning, day, evening, night
var weather = 'clear'; // clear, cloudy, rain
var weatherTimer = 0;
var waterRegenTimer = 0;
var prevLevel = 1;
var score = 0;
var gameOver = false;

// ====== THREE.JS SETUP ======
var scene = new THREE.Scene();
scene.background = new THREE.Color(0x87CEEB);
scene.fog = new THREE.FogExp2(0x87CEEB, 0.018);
var camera = new THREE.PerspectiveCamera(50, window.innerWidth/window.innerHeight, 0.1, 200);
var renderer = new THREE.WebGLRenderer({antialias:true});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;
document.body.appendChild(renderer.domElement);

// Lights
var ambLight = new THREE.AmbientLight(0xfff5e6, 0.6);
scene.add(ambLight);
var dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
dirLight.position.set(10, 15, 8);
dirLight.castShadow = true;
dirLight.shadow.mapSize.set(1024, 1024);
dirLight.shadow.camera.left = -20; dirLight.shadow.camera.right = 20;
dirLight.shadow.camera.top = 20; dirLight.shadow.camera.bottom = -20;
scene.add(dirLight);
var hemiLight = new THREE.HemisphereLight(0x87CEEB, 0x556B2F, 0.4);
scene.add(hemiLight);

// Ground
var groundGeo = new THREE.PlaneGeometry(60, 60);
var groundMat = new THREE.MeshLambertMaterial({color: 0x7CB342});
var ground = new THREE.Mesh(groundGeo, groundMat);
ground.rotation.x = -Math.PI/2;
ground.receiveShadow = true;
scene.add(ground);

// Decorative grass & flowers
for(var i=0;i<100;i++){
  var gx = (Math.random()-0.5)*50;
  var gz = (Math.random()-0.5)*50;
  if(Math.abs(gx) < 8 && Math.abs(gz) < 8) continue;
  var bladeGeo = new THREE.ConeGeometry(0.06, 0.3+Math.random()*0.3, 4);
  var bladeMat = new THREE.MeshLambertMaterial({color: new THREE.Color().setHSL(0.28+Math.random()*0.06, 0.6, 0.35+Math.random()*0.15)});
  var blade = new THREE.Mesh(bladeGeo, bladeMat);
  blade.position.set(gx, 0.15, gz);
  blade.rotation.z = (Math.random()-0.5)*0.3;
  scene.add(blade);
  // Random flowers
  if(Math.random() < 0.15){
    var flowerColors = [0xFF69B4, 0xFFD700, 0xFF6347, 0xDDA0DD, 0x87CEEB];
    var flower = new THREE.Mesh(
      new THREE.SphereGeometry(0.08, 6, 4),
      new THREE.MeshLambertMaterial({color: flowerColors[Math.floor(Math.random()*flowerColors.length)]})
    );
    flower.position.set(gx + (Math.random()-0.5)*0.3, 0.35 + Math.random()*0.1, gz + (Math.random()-0.5)*0.3);
    scene.add(flower);
  }
}

// Trees
function createTree(x,z,scale){
  var s = scale || 1;
  var g = new THREE.Group();
  var trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.15*s,0.2*s,1.2*s,6),
    new THREE.MeshLambertMaterial({color:0x795548})
  );
  trunk.position.y = 0.6*s; trunk.castShadow = true;
  g.add(trunk);
  // Multiple leaf clusters for fuller look
  for(var li=0;li<3;li++){
    var leafSize = (0.6 + Math.random()*0.4) * s;
    var leaves = new THREE.Mesh(
      new THREE.SphereGeometry(leafSize,8,6),
      new THREE.MeshLambertMaterial({color:new THREE.Color().setHSL(0.3,0.6,0.3+Math.random()*0.1)})
    );
    leaves.position.set((Math.random()-0.5)*0.3*s, (1.3+li*0.3)*s, (Math.random()-0.5)*0.3*s);
    leaves.castShadow = true;
    g.add(leaves);
  }
  g.position.set(x,0,z);
  scene.add(g);
  return g;
}
var trees = [];
[[-10,5,1.2],[-12,-3,1],[-14,8,0.8],[10,8,1.1],[11,-6,0.9],[14,4,1.3],[-8,-10,1],[9,-11,0.8],[13,3,1.1],[-11,10,0.7],[-6,12,1],[-13,-8,0.9],[8,13,1],[15,-2,0.8]].forEach(function(p){
  trees.push(createTree(p[0],p[1],p[2]));
});

// Water well decoration
var wellBase = new THREE.Mesh(
  new THREE.CylinderGeometry(0.5,0.6,0.6,8),
  new THREE.MeshLambertMaterial({color:0x8D6E63})
);
wellBase.position.set(-8, 0.3, 0);
wellBase.castShadow = true;
scene.add(wellBase);
var wellWater = new THREE.Mesh(
  new THREE.CylinderGeometry(0.4,0.4,0.1,8),
  new THREE.MeshLambertMaterial({color:0x42A5F5, transparent:true, opacity:0.6})
);
wellWater.position.set(-8, 0.55, 0);
scene.add(wellWater);
var wellRoof = new THREE.Mesh(
  new THREE.ConeGeometry(0.7,0.5,4),
  new THREE.MeshLambertMaterial({color:0xA1887F})
);
wellRoof.position.set(-8, 1.2, 0);
wellRoof.rotation.y = Math.PI/4;
scene.add(wellRoof);

// Fence
function createFence(){
  var fenceMat = new THREE.MeshLambertMaterial({color:0xA1887F});
  var span = GRID * (PLOT_SIZE + PLOT_GAP) + 1;
  var half = span/2;
  for(var side=0;side<4;side++){
    for(var fi=0;fi<8;fi++){
      var post = new THREE.Mesh(new THREE.CylinderGeometry(0.04,0.05,0.6,5), fenceMat);
      var t = -half + fi * (span/7);
      if(side===0) post.position.set(t, 0.3, -half);
      else if(side===1) post.position.set(t, 0.3, half);
      else if(side===2) post.position.set(-half, 0.3, t);
      else post.position.set(half, 0.3, t);
      post.castShadow = true;
      scene.add(post);
    }
    var rail = new THREE.Mesh(new THREE.BoxGeometry(span, 0.04, 0.04), fenceMat);
    if(side===0) rail.position.set(0, 0.35, -half);
    else if(side===1) rail.position.set(0, 0.35, half);
    else if(side===2){rail.position.set(-half, 0.35, 0); rail.rotation.y=Math.PI/2;}
    else {rail.position.set(half, 0.35, 0); rail.rotation.y=Math.PI/2;}
    scene.add(rail);
    // Second rail
    var rail2 = rail.clone();
    rail2.position.y = 0.2;
    scene.add(rail2);
  }
}
createFence();

// ====== PLOT GRID ======
var plotStart = -(GRID-1)*(PLOT_SIZE+PLOT_GAP)/2;
function getPlotPos(r,c){
  return new THREE.Vector3(
    plotStart + c*(PLOT_SIZE+PLOT_GAP),
    0,
    plotStart + r*(PLOT_SIZE+PLOT_GAP)
  );
}
for(var r=0;r<GRID;r++){
  for(var c=0;c<GRID;c++){
    var pos = getPlotPos(r,c);
    var soil = new THREE.Mesh(
      new THREE.BoxGeometry(PLOT_SIZE, 0.12, PLOT_SIZE),
      new THREE.MeshLambertMaterial({color:0x6D4C41})
    );
    soil.position.set(pos.x, 0.06, pos.z);
    soil.receiveShadow = true;
    scene.add(soil);
    // Furrows
    for(var f=-2;f<=2;f++){
      var furrow = new THREE.Mesh(
        new THREE.BoxGeometry(PLOT_SIZE*0.85, 0.04, 0.08),
        new THREE.MeshLambertMaterial({color:0x5D4037})
      );
      furrow.position.set(pos.x, 0.13, pos.z + f*0.35);
      scene.add(furrow);
    }
    plots.push({
      state:'empty', cropIdx:-1, plantTime:0,
      mesh: soil, cropMesh: null, particleTime:0,
      row:r, col:c, pos: pos,
      watered: false, waterMesh: null
    });
  }
}

// ====== PLAYER ======
var playerGroup = new THREE.Group();
var bodyMat = new THREE.MeshLambertMaterial({color:0x5C6BC0});
var body = new THREE.Mesh(new THREE.CylinderGeometry(0.22,0.28,0.7,8), bodyMat);
body.position.y = 0.75; body.castShadow = true;
playerGroup.add(body);
var headMat = new THREE.MeshLambertMaterial({color:0xFFCC80});
var head = new THREE.Mesh(new THREE.SphereGeometry(0.2,8,6), headMat);
head.position.y = 1.25; head.castShadow = true;
playerGroup.add(head);
// Eyes
var eyeMat = new THREE.MeshBasicMaterial({color:0x333333});
var leftEye = new THREE.Mesh(new THREE.SphereGeometry(0.04,4,4), eyeMat);
leftEye.position.set(-0.07, 1.28, 0.17);
playerGroup.add(leftEye);
var rightEye = new THREE.Mesh(new THREE.SphereGeometry(0.04,4,4), eyeMat);
rightEye.position.set(0.07, 1.28, 0.17);
playerGroup.add(rightEye);
// Straw hat
var hatMat = new THREE.MeshLambertMaterial({color:0xDEB887});
var hatBrim = new THREE.Mesh(new THREE.CylinderGeometry(0.35,0.35,0.04,10), hatMat);
hatBrim.position.y = 1.42;
playerGroup.add(hatBrim);
var hatTop = new THREE.Mesh(new THREE.CylinderGeometry(0.15,0.22,0.2,10), hatMat);
hatTop.position.y = 1.52;
playerGroup.add(hatTop);
var hatBand = new THREE.Mesh(new THREE.CylinderGeometry(0.225,0.225,0.04,10), new THREE.MeshLambertMaterial({color:0xE53935}));
hatBand.position.y = 1.44;
playerGroup.add(hatBand);
// Legs
var legMat = new THREE.MeshLambertMaterial({color:0x3E2723});
var leftLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.08,0.08,0.4,6), legMat);
leftLeg.position.set(-0.12, 0.2, 0);
playerGroup.add(leftLeg);
var rightLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.08,0.08,0.4,6), legMat);
rightLeg.position.set(0.12, 0.2, 0);
playerGroup.add(rightLeg);
// Watering can (held item indicator)
var canGroup = new THREE.Group();
var canBody2 = new THREE.Mesh(
  new THREE.BoxGeometry(0.15,0.12,0.1),
  new THREE.MeshLambertMaterial({color:0x42A5F5})
);
canBody2.position.set(0.35, 0.85, 0);
canGroup.add(canBody2);
var canSpout = new THREE.Mesh(
  new THREE.CylinderGeometry(0.02,0.03,0.12,5),
  new THREE.MeshLambertMaterial({color:0x42A5F5})
);
canSpout.position.set(0.42, 0.92, 0);
canSpout.rotation.z = -0.6;
canGroup.add(canSpout);
playerGroup.add(canGroup);
canGroup.visible = false;

playerGroup.position.set(0, 0, GRID*(PLOT_SIZE+PLOT_GAP)/2 + 2);
scene.add(playerGroup);
var playerAngle = 0;
var playerSpeed = 0;

// ====== CAMERA ======
var camOffset = new THREE.Vector3(0, 8, 7);
camera.position.copy(playerGroup.position).add(camOffset);
camera.lookAt(playerGroup.position);

// ====== INPUT ======
var keys = {};
window.addEventListener('keydown', function(e){ keys[e.code]=true; initAudio(); });
window.addEventListener('keyup', function(e){ keys[e.code]=false; });
document.addEventListener('touchstart', function(){ initAudio(); }, {once:true});

// Joystick
var joyVec = {x:0, y:0};
var joyActive = false;
var jBase = document.getElementById('joystick-base');
var jThumb = document.getElementById('joystick-thumb');
var jZone = document.getElementById('joystick-zone');
function handleJoy(cx, cy){
  var rect = jBase.getBoundingClientRect();
  var bx = rect.left + rect.width/2;
  var by = rect.top + rect.height/2;
  var dx = cx - bx;
  var dy = cy - by;
  var dist = Math.min(Math.sqrt(dx*dx+dy*dy), 50);
  var ang = Math.atan2(dy, dx);
  var nx = Math.cos(ang)*dist;
  var ny = Math.sin(ang)*dist;
  jThumb.style.transform = 'translate(calc(-50% + '+nx+'px), calc(-50% + '+ny+'px))';
  joyVec.x = nx/50;
  joyVec.y = ny/50;
}
jZone.addEventListener('touchstart', function(e){joyActive=true;handleJoy(e.touches[0].clientX,e.touches[0].clientY);},{passive:true});
jZone.addEventListener('touchmove', function(e){if(joyActive)handleJoy(e.touches[0].clientX,e.touches[0].clientY);},{passive:true});
jZone.addEventListener('touchend', function(){
  joyActive=false;joyVec.x=0;joyVec.y=0;
  jThumb.style.transform='translate(-50%,-50%)';
},{passive:true});

// Action buttons
document.getElementById('btn-plant').addEventListener('touchstart', function(e){
  e.preventDefault(); doAction();
},{passive:false});
document.getElementById('btn-water').addEventListener('touchstart', function(e){
  e.preventDefault(); doWater();
},{passive:false});

// Keyboard
window.addEventListener('keydown', function(e){
  if(e.code==='Space' && !e.repeat){ doAction(); }
  if(e.code==='KeyE' && !e.repeat){ doWater(); }
});

// ====== PARTICLES ======
var particles = [];
function spawnParticles(pos, color, count){
  count = count || 12;
  for(var pi=0;pi<count;pi++){
    var geo = new THREE.SphereGeometry(0.06+Math.random()*0.06, 4, 4);
    var mat = new THREE.MeshBasicMaterial({color:color});
    var p = new THREE.Mesh(geo, mat);
    p.position.copy(pos);
    p.position.y += 0.3;
    p.userData.vel = new THREE.Vector3(
      (Math.random()-0.5)*3,
      2+Math.random()*3,
      (Math.random()-0.5)*3
    );
    p.userData.life = 1;
    scene.add(p);
    particles.push(p);
  }
}
function spawnGoldParticles(pos){
  for(var gi=0;gi<8;gi++){
    var geo = new THREE.BoxGeometry(0.1,0.1,0.02);
    var mat = new THREE.MeshBasicMaterial({color:0xFFD700});
    var p = new THREE.Mesh(geo, mat);
    p.position.copy(pos);
    p.position.y += 0.5;
    p.userData.vel = new THREE.Vector3(
      (Math.random()-0.5)*2,
      3+Math.random()*2,
      (Math.random()-0.5)*2
    );
    p.userData.life = 1.2;
    scene.add(p);
    particles.push(p);
  }
}
function spawnWaterParticles(pos){
  for(var wi=0;wi<6;wi++){
    var geo = new THREE.SphereGeometry(0.04, 4, 3);
    var mat = new THREE.MeshBasicMaterial({color:0x64B5F6, transparent:true, opacity:0.7});
    var p = new THREE.Mesh(geo, mat);
    p.position.copy(pos);
    p.position.y += 0.8;
    p.userData.vel = new THREE.Vector3(
      (Math.random()-0.5)*1.5,
      -1-Math.random()*2,
      (Math.random()-0.5)*1.5
    );
    p.userData.life = 0.6;
    scene.add(p);
    particles.push(p);
  }
}

// ====== CROP MESHES ======
function createCropMesh(cropIdx, growthPct){
  var crop = CROPS[cropIdx];
  var g = new THREE.Group();
  var stemH = crop.h * growthPct;
  var stem = new THREE.Mesh(
    new THREE.CylinderGeometry(0.03, 0.05, Math.max(0.01,stemH), 5),
    new THREE.MeshLambertMaterial({color: 0x558B2F})
  );
  stem.position.y = stemH/2 + 0.12;
  g.add(stem);
  if(growthPct > 0.3){
    var fruitScale = Math.min(1, (growthPct-0.3)/0.7);
    var fruit = new THREE.Mesh(
      new THREE.SphereGeometry(0.12 * fruitScale, 6, 5),
      new THREE.MeshLambertMaterial({color: crop.color})
    );
    fruit.position.y = stemH + 0.12 + 0.05;
    fruit.castShadow = true;
    g.add(fruit);
  }
  if(growthPct > 0.15){
    var leafScale = Math.min(1, growthPct);
    for(var li=0;li<3;li++){
      var leaf = new THREE.Mesh(
        new THREE.PlaneGeometry(0.15*leafScale, 0.08*leafScale),
        new THREE.MeshLambertMaterial({color: crop.topColor, side: THREE.DoubleSide})
      );
      var angle = (li/3)*Math.PI*2;
      leaf.position.set(Math.cos(angle)*0.1, stemH*0.6+0.12, Math.sin(angle)*0.1);
      leaf.rotation.y = angle;
      leaf.rotation.z = 0.4;
      g.add(leaf);
    }
  }
  return g;
}

// ====== GAME LOGIC ======
function getLevel(xpVal){
  for(var i=LEVELS.length-1;i>=0;i--) if(xpVal>=LEVELS[i]) return i+1;
  return 1;
}
function getNearestPlot(){
  var best=null, bestDist=999;
  var pp = playerGroup.position;
  for(var pi=0;pi<plots.length;pi++){
    var p = plots[pi];
    var dx=pp.x-p.pos.x, dz=pp.z-p.pos.z;
    var d = Math.sqrt(dx*dx+dz*dz);
    if(d < bestDist && d < PLOT_SIZE*0.9){
      bestDist=d; best=p;
    }
  }
  return best;
}
function showMsg(txt){
  var el = document.getElementById('msg');
  el.textContent = txt;
  el.className = 'show';
  clearTimeout(el._t);
  el._t = setTimeout(function(){el.className='hidden';}, 2500);
}
function doAction(){
  var plot = getNearestPlot();
  if(!plot){ showMsg('밭 가까이 가서 눌러주세요!'); return; }
  if(plot.state === 'empty'){
    var crop = CROPS[selectedCrop];
    if(gold < crop.price){ showMsg('💰 금화 부족! ('+crop.price+'G 필요)'); return; }
    gold -= crop.price;
    plot.state = 'growing';
    plot.cropIdx = selectedCrop;
    plot.plantTime = performance.now()/1000;
    plot.watered = false;
    spawnParticles(plot.pos, 0x8D6E63, 6);
    sfxPlant();
    showMsg('🌱 '+crop.name+' 심었어요!');
    updateHUD();
  }
  else if(plot.state === 'ready'){
    var crop2 = CROPS[plot.cropIdx];
    var reward = crop2.reward;
    // Watered bonus
    if(plot.watered) reward = Math.floor(reward * 1.3);
    gold += reward;
    xp += crop2.xp;
    totalHarvest++;
    score = gold + totalHarvest * 10;
    prevLevel = level;
    level = getLevel(xp);
    spawnParticles(plot.pos, crop2.color, 15);
    spawnGoldParticles(plot.pos);
    sfxHarvest();
    setTimeout(sfxCoin, 200);
    if(plot.cropMesh){ scene.remove(plot.cropMesh); plot.cropMesh=null; }
    if(plot.waterMesh){ scene.remove(plot.waterMesh); plot.waterMesh=null; }
    plot.state = 'empty';
    plot.cropIdx = -1;
    plot.watered = false;
    showMsg('🎉 '+crop2.name+' 수확! +'+(plot.watered?Math.floor(crop2.reward*1.3):reward)+'G +'+crop2.xp+'XP');
    if(level > prevLevel){
      setTimeout(function(){
        sfxLevelUp();
        showMsg('🎊 레벨 업! Lv.'+level+' 달성!');
      }, 800);
    }
    updateHUD();
    // Dispatch score event
    try{window.parent.postMessage({type:'GAME_SCORE',score:score},'*');}catch(e){}
  }
  else if(plot.state === 'growing'){
    var crop3 = CROPS[plot.cropIdx];
    var elapsed = performance.now()/1000 - plot.plantTime;
    var growSpeed = getGrowSpeed(plot);
    var remaining = Math.max(0, crop3.time/growSpeed - elapsed);
    showMsg('⏳ '+crop3.name+' 자라는 중... '+Math.ceil(remaining)+'초 남음'+(plot.watered?' 💧':''));
  }
}
function doWater(){
  var plot = getNearestPlot();
  if(!plot){ showMsg('밭 가까이 가서 물을 주세요!'); return; }
  if(plot.state !== 'growing'){ showMsg('자라는 작물에만 물을 줄 수 있어요!'); return; }
  if(plot.watered){ showMsg('이미 물을 줬어요! 💧'); return; }
  if(waterCount <= 0){
    // Near well?
    var dx = playerGroup.position.x - (-8);
    var dz = playerGroup.position.z - 0;
    if(Math.sqrt(dx*dx+dz*dz) < 2){
      waterCount = maxWater;
      showMsg('🪣 우물에서 물을 채웠어요! ('+waterCount+'/'+maxWater+')');
      sfxWater();
      updateHUD();
      return;
    }
    showMsg('💧 물 부족! 우물(🪣)에서 채우세요!');
    return;
  }
  waterCount--;
  plot.watered = true;
  spawnWaterParticles(plot.pos);
  sfxWater();
  // Water visual
  if(!plot.waterMesh){
    var waterDisc = new THREE.Mesh(
      new THREE.CircleGeometry(PLOT_SIZE*0.4, 8),
      new THREE.MeshBasicMaterial({color:0x42A5F5, transparent:true, opacity:0.2})
    );
    waterDisc.rotation.x = -Math.PI/2;
    waterDisc.position.set(plot.pos.x, 0.14, plot.pos.z);
    scene.add(waterDisc);
    plot.waterMesh = waterDisc;
  }
  showMsg('💧 물 주기 완료! 성장 +50%, 수확 +30%');
  canGroup.visible = true;
  setTimeout(function(){canGroup.visible = false;}, 1500);
  updateHUD();
}
function getGrowSpeed(plot){
  var speed = speedBoost;
  if(plot.watered) speed *= 1.5;
  if(weather === 'rain') speed *= 1.3;
  if(dayPhase === 'night') speed *= 0.7;
  return speed;
}
function updateHUD(){
  document.getElementById('h-gold').textContent = gold.toLocaleString();
  document.getElementById('h-lv').textContent = 'Lv.'+level;
  document.getElementById('h-harv').textContent = totalHarvest;
  document.getElementById('h-water').textContent = waterCount+'/'+maxWater;
  document.getElementById('h-seed').textContent = CROPS[selectedCrop].name;
}
function toggleShop(){
  var panel = document.getElementById('shop-panel');
  panel.classList.toggle('open');
  renderShop();
}
function renderShop(){
  var panel = document.getElementById('shop-panel');
  panel.innerHTML = CROPS.map(function(c,i){
    var locked = level < c.unlockLv;
    var sel = i===selectedCrop;
    return '<div class="shop-item '+(locked?'locked':'')+'" style="'+(sel?'background:rgba(255,255,255,0.15)':'')+'" onclick="selectCrop('+i+')">'+
      '<div class="shop-emoji">'+(locked?'🔒':c.emoji)+'</div>'+
      '<div class="shop-info">'+
      '<div class="shop-name">'+(locked?'Lv.'+c.unlockLv+'에 해금':c.name)+'</div>'+
      '<div class="shop-cost">'+(c.price===0?'무료':c.price+'G')+' · '+c.time+'초 · +'+c.reward+'G</div>'+
      '</div></div>';
  }).join('');
}
window.selectCrop = function(i){
  if(level < CROPS[i].unlockLv) return;
  selectedCrop = i;
  updateHUD();
  renderShop();
  showMsg('🌱 '+CROPS[i].name+' 선택!');
};
window.toggleShop = toggleShop;

// ====== WEATHER SYSTEM ======
function updateWeather(dt){
  weatherTimer -= dt;
  if(weatherTimer <= 0){
    var r = Math.random();
    if(r < 0.5) weather = 'clear';
    else if(r < 0.8) weather = 'cloudy';
    else weather = 'rain';
    weatherTimer = 30 + Math.random()*40;
    var wEl = document.getElementById('weather-indicator');
    if(weather === 'clear') wEl.textContent = '☀️ 맑음';
    else if(weather === 'cloudy') wEl.textContent = '⛅ 흐림';
    else wEl.textContent = '🌧️ 비';
  }
  // Rain effect
  if(weather === 'rain' && Math.random() < 0.3){
    var drop = document.createElement('div');
    drop.className = 'rain-drop';
    drop.style.left = Math.random()*100+'%';
    drop.style.animationDuration = (0.4+Math.random()*0.3)+'s';
    document.body.appendChild(drop);
    setTimeout(function(){drop.remove();}, 700);
    // Auto-water growing plots
    if(Math.random() < 0.01){
      for(var pi=0;pi<plots.length;pi++){
        if(plots[pi].state==='growing' && !plots[pi].watered){
          plots[pi].watered = true;
          if(!plots[pi].waterMesh){
            var wd = new THREE.Mesh(
              new THREE.CircleGeometry(PLOT_SIZE*0.4, 8),
              new THREE.MeshBasicMaterial({color:0x42A5F5, transparent:true, opacity:0.15})
            );
            wd.rotation.x = -Math.PI/2;
            wd.position.set(plots[pi].pos.x, 0.14, plots[pi].pos.z);
            scene.add(wd);
            plots[pi].waterMesh = wd;
          }
        }
      }
    }
  }
}

// ====== DAY/NIGHT CYCLE ======
function updateDayNight(dt){
  gameTime += dt * 0.5; // ~2 min per full day
  if(gameTime >= 24) gameTime -= 24;
  var t = gameTime;
  var tEl = document.getElementById('time-indicator');
  if(t >= 5 && t < 8){ dayPhase='morning'; tEl.textContent='🌅'; }
  else if(t >= 8 && t < 17){ dayPhase='day'; tEl.textContent='☀️'; }
  else if(t >= 17 && t < 20){ dayPhase='evening'; tEl.textContent='🌇'; }
  else { dayPhase='night'; tEl.textContent='🌙'; }
  // Lighting
  var skyColors = {
    morning: {bg:0xFFB74D, amb:0.5, dir:0.8, fog:0xFFB74D},
    day: {bg:0x87CEEB, amb:0.6, dir:1.2, fog:0x87CEEB},
    evening: {bg:0xFF7043, amb:0.4, dir:0.7, fog:0xFF7043},
    night: {bg:0x1a237e, amb:0.2, dir:0.3, fog:0x1a237e}
  };
  var target = skyColors[dayPhase];
  var currentBg = new THREE.Color(scene.background.getHex());
  var targetBg = new THREE.Color(target.bg);
  currentBg.lerp(targetBg, dt * 0.5);
  scene.background = currentBg;
  scene.fog.color.copy(currentBg);
  ambLight.intensity += (target.amb - ambLight.intensity) * dt * 2;
  dirLight.intensity += (target.dir - dirLight.intensity) * dt * 2;
  // Water regen from well proximity
  waterRegenTimer -= dt;
  if(waterRegenTimer <= 0){
    waterRegenTimer = 15;
    var dx2 = playerGroup.position.x - (-8);
    var dz2 = playerGroup.position.z - 0;
    if(Math.sqrt(dx2*dx2+dz2*dz2) < 3 && waterCount < maxWater){
      waterCount = Math.min(maxWater, waterCount+1);
      updateHUD();
    }
  }
}

// ====== GAME LOOP ======
var prevTime = performance.now()/1000;
var MOVE_SPEED = 4.5;
function animate(){
  requestAnimationFrame(animate);
  var now = performance.now()/1000;
  var dt = Math.min(now - prevTime, 0.05);
  prevTime = now;
  // Day/night + weather
  updateDayNight(dt);
  updateWeather(dt);
  // Player movement
  var mx=0, mz=0;
  if(keys['KeyW']||keys['ArrowUp']) mz=-1;
  if(keys['KeyS']||keys['ArrowDown']) mz=1;
  if(keys['KeyA']||keys['ArrowLeft']) mx=-1;
  if(keys['KeyD']||keys['ArrowRight']) mx=1;
  if(joyActive){ mx = joyVec.x; mz = joyVec.y; }
  var len = Math.sqrt(mx*mx+mz*mz);
  if(len > 0.1){
    var nmx = mx/len, nmz = mz/len;
    playerGroup.position.x += nmx * MOVE_SPEED * dt;
    playerGroup.position.z += nmz * MOVE_SPEED * dt;
    playerGroup.position.x = Math.max(-25, Math.min(25, playerGroup.position.x));
    playerGroup.position.z = Math.max(-25, Math.min(25, playerGroup.position.z));
    var targetAngle = Math.atan2(nmx, nmz);
    playerAngle += shortAngleDist(playerAngle, targetAngle) * 8 * dt;
    playerGroup.rotation.y = playerAngle;
    var walkT = now * 8;
    leftLeg.rotation.x = Math.sin(walkT)*0.4;
    rightLeg.rotation.x = Math.sin(walkT+Math.PI)*0.4;
    body.position.y = 0.75 + Math.abs(Math.sin(walkT))*0.04;
    playerSpeed = len;
  } else {
    leftLeg.rotation.x *= 0.85;
    rightLeg.rotation.x *= 0.85;
    playerSpeed *= 0.9;
  }
  // Camera follow
  var idealCamPos = playerGroup.position.clone().add(camOffset);
  camera.position.lerp(idealCamPos, 3*dt);
  var lookTarget = playerGroup.position.clone();
  lookTarget.y += 1;
  camera.lookAt(lookTarget);
  // Tree sway
  for(var ti=0;ti<trees.length;ti++){
    trees[ti].rotation.z = Math.sin(now*0.5 + ti)*0.02;
  }
  // Update crops
  var nearest = getNearestPlot();
  for(var pi=0;pi<plots.length;pi++){
    var plot = plots[pi];
    if(plot.state === 'growing'){
      var crop = CROPS[plot.cropIdx];
      var elapsed = now - plot.plantTime;
      var growSpeed = getGrowSpeed(plot);
      var growTime = crop.time / growSpeed;
      var pct = Math.min(1, elapsed / growTime);
      if(plot.cropMesh) scene.remove(plot.cropMesh);
      plot.cropMesh = createCropMesh(plot.cropIdx, pct);
      plot.cropMesh.position.copy(plot.pos);
      scene.add(plot.cropMesh);
      if(pct >= 1){
        plot.state = 'ready';
        spawnParticles(plot.pos, 0xFFD700, 5);
      }
    }
    if(plot.state === 'ready' && plot.cropMesh){
      plot.cropMesh.position.y = Math.sin(now*3)*0.03;
      plot.cropMesh.rotation.y = Math.sin(now*1.5)*0.1;
    }
    // Highlight nearest
    if(plot === nearest){
      plot.mesh.material.emissive = plot.mesh.material.emissive || new THREE.Color();
      plot.mesh.material.emissive.set(plot.state==='ready'? 0x443300 : 0x222200);
      plot.mesh.material.emissiveIntensity = 0.5 + Math.sin(now*4)*0.3;
    } else {
      if(plot.mesh.material.emissive) plot.mesh.material.emissive.set(0x000000);
    }
  }
  // Water mesh pulse
  for(var wi=0;wi<plots.length;wi++){
    if(plots[wi].waterMesh){
      plots[wi].waterMesh.material.opacity = 0.15 + Math.sin(now*2)*0.05;
    }
  }
  // Particles
  for(var i=particles.length-1;i>=0;i--){
    var p = particles[i];
    p.userData.vel.y -= 9.8*dt;
    p.position.add(p.userData.vel.clone().multiplyScalar(dt));
    p.userData.life -= dt;
    p.material.opacity = Math.max(0, p.userData.life);
    p.material.transparent = true;
    p.scale.multiplyScalar(0.98);
    if(p.userData.life <= 0){
      scene.remove(p);
      particles.splice(i,1);
    }
  }
  renderer.render(scene, camera);
}
function shortAngleDist(from, to){
  var d = ((to-from) % (Math.PI*2) + Math.PI*3) % (Math.PI*2) - Math.PI;
  return d;
}
window.addEventListener('resize', function(){
  camera.aspect = window.innerWidth/window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
function startGame(){
  document.getElementById('tutorial').style.display='none';
  updateHUD();
  animate();
}
window.startGame = startGame;
</script>
</body>
</html>`;
