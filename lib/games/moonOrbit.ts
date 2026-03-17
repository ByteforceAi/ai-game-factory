export const MOON_ORBIT_HTML = `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0,user-scalable=no">
<title>달의 공전 — 인터랙티브 3D 시뮬레이션</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600&family=Noto+Sans+KR:wght@300;400;600&display=swap');
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:100%;height:100%;overflow:hidden;background:#040810;font-family:'Noto Sans KR',sans-serif;color:#E8ECF4;touch-action:none}
canvas{display:block}
.panel{position:absolute;background:rgba(8,14,28,0.75);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);border:1px solid rgba(255,255,255,0.08);border-radius:14px;padding:14px 18px;pointer-events:auto}
.panel h3{font-family:'JetBrains Mono',monospace;font-size:9px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:#4A7FBF;margin-bottom:8px}
.data-row{display:flex;justify-content:space-between;align-items:baseline;margin:4px 0;font-size:11px}
.data-row .label{color:#8A96B0;font-size:10px}
.data-row .value{font-family:'JetBrains Mono',monospace;color:#6BA3E8;font-weight:600;font-size:11px}
.data-row .unit{color:#4A5672;font-size:9px;margin-left:2px}
#title-hud{position:absolute;top:16px;left:20px}
#title-hud h1{font-size:18px;font-weight:300;letter-spacing:0.04em;color:#E8ECF4}
#title-hud h1 span{color:#D4A843}
#title-hud .sub{font-size:10px;color:#4A7FBF;letter-spacing:0.1em;margin-top:2px;font-family:'JetBrains Mono',monospace}
#orbit-panel{top:16px;right:16px;min-width:200px}
#phase-panel{bottom:80px;left:16px;display:flex;align-items:center;gap:12px;padding:10px 16px}
#phase-panel .moon-icon{font-size:28px;filter:drop-shadow(0 0 8px rgba(200,210,255,0.3))}
#phase-panel .phase-text .ko{font-size:13px;font-weight:600}
#phase-panel .phase-text .en{font-size:9px;color:#8A96B0;letter-spacing:0.06em}
#controls{position:absolute;bottom:16px;left:50%;transform:translateX(-50%);display:flex;align-items:center;gap:10px;padding:10px 20px}
#controls button{background:rgba(74,127,191,0.15);border:1px solid rgba(74,127,191,0.3);color:#6BA3E8;width:36px;height:36px;border-radius:10px;cursor:pointer;font-size:14px;display:flex;align-items:center;justify-content:center;transition:all 0.2s}
#controls button:hover{background:rgba(74,127,191,0.3)}
#controls button.active{background:rgba(74,127,191,0.4);border-color:#6BA3E8}
#speed-slider{-webkit-appearance:none;width:120px;height:4px;border-radius:2px;background:rgba(74,127,191,0.2);outline:none}
#speed-slider::-webkit-slider-thumb{-webkit-appearance:none;width:16px;height:16px;border-radius:50%;background:#4A7FBF;cursor:pointer;box-shadow:0 0 8px rgba(74,127,191,0.5)}
#speed-label{font-family:'JetBrains Mono',monospace;font-size:10px;color:#6BA3E8;min-width:36px;text-align:center}
#toggle-bar{position:absolute;bottom:16px;right:16px;display:flex;gap:6px}
#toggle-bar button{background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);color:#8A96B0;padding:6px 10px;border-radius:8px;cursor:pointer;font-size:9px;font-family:'JetBrains Mono',monospace;letter-spacing:0.06em;transition:all 0.2s}
#toggle-bar button.on{background:rgba(74,127,191,0.15);border-color:rgba(74,127,191,0.4);color:#6BA3E8}
</style>
</head>
<body>
<canvas id="c"></canvas>

<div id="title-hud">
  <h1><span>달</span>의 공전</h1>
  <div class="sub">LUNAR ORBIT SIMULATION</div>
</div>

<div class="panel" id="orbit-panel">
  <h3>Orbit Data</h3>
  <div class="data-row"><span class="label">공전주기</span><span class="value">27.322<span class="unit">일</span></span></div>
  <div class="data-row"><span class="label">평균거리</span><span class="value">384,400<span class="unit">km</span></span></div>
  <div class="data-row"><span class="label">이심률</span><span class="value">0.0549</span></div>
  <div class="data-row"><span class="label">궤도경사</span><span class="value">5.145<span class="unit">°</span></span></div>
  <div style="border-top:1px solid rgba(255,255,255,0.06);margin:8px 0"></div>
  <h3>Real-time</h3>
  <div class="data-row"><span class="label">경과일</span><span class="value" id="rt-day">0.0</span></div>
  <div class="data-row"><span class="label">각도</span><span class="value" id="rt-angle">0.0<span class="unit">°</span></span></div>
  <div class="data-row"><span class="label">현재거리</span><span class="value" id="rt-dist">384,400<span class="unit">km</span></span></div>
  <div class="data-row"><span class="label">속도</span><span class="value" id="rt-speed">1.022<span class="unit">km/s</span></span></div>
</div>

<div class="panel" id="phase-panel">
  <div class="moon-icon" id="phase-icon">🌑</div>
  <div class="phase-text">
    <div class="ko" id="phase-ko">삭 (新月)</div>
    <div class="en" id="phase-en">New Moon · DAY 0</div>
  </div>
</div>

<div class="panel" id="controls">
  <button id="btn-play" class="active" title="재생/정지">▶</button>
  <button id="btn-reset" title="초기화">↻</button>
  <input type="range" id="speed-slider" min="1" max="200" value="50">
  <span id="speed-label">×1.0</span>
</div>

<div id="toggle-bar">
  <button id="tog-trail" class="on">궤적</button>
  <button id="tog-label">라벨</button>
  <button id="tog-incl">경사</button>
</div>

<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
<script>
'use strict';
(function(){

window.score = 0;
window.gameOver = false;

var W = window.innerWidth, H = window.innerHeight;
var canvas = document.getElementById('c');

// ═══ Three.js Setup ═══
var renderer = new THREE.WebGLRenderer({canvas:canvas, antialias:true, alpha:false});
renderer.setSize(W, H);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;

var scene = new THREE.Scene();
scene.background = new THREE.Color(0x040810);

// Camera
var camDist = 25, camTheta = 0.3, camPhi = 0.8;
var camera = new THREE.PerspectiveCamera(50, W/H, 0.1, 1000);
function updateCamera(){
  camera.position.set(
    camDist * Math.sin(camPhi) * Math.cos(camTheta),
    camDist * Math.cos(camPhi),
    camDist * Math.sin(camPhi) * Math.sin(camTheta)
  );
  camera.lookAt(0, 0, 0);
}
updateCamera();

// ═══ Stars ═══
var starGeo = new THREE.BufferGeometry();
var starPositions = new Float32Array(4000 * 3);
var starSizes = new Float32Array(4000);
for(var i=0;i<4000;i++){
  var r=200+Math.random()*300, t=Math.random()*Math.PI*2, p=Math.acos(2*Math.random()-1);
  starPositions[i*3]=r*Math.sin(p)*Math.cos(t);
  starPositions[i*3+1]=r*Math.sin(p)*Math.sin(t);
  starPositions[i*3+2]=r*Math.cos(p);
  starSizes[i]=0.3+Math.random()*1.5;
}
starGeo.setAttribute('position',new THREE.BufferAttribute(starPositions,3));
starGeo.setAttribute('size',new THREE.BufferAttribute(starSizes,1));
var starMat = new THREE.PointsMaterial({color:0xffffff,size:0.8,sizeAttenuation:true,transparent:true,opacity:0.8,blending:THREE.AdditiveBlending});
scene.add(new THREE.Points(starGeo,starMat));

// ═══ Sun Light ═══
var sunLight = new THREE.DirectionalLight(0xfff5e0, 1.8);
sunLight.position.set(50, 10, 30);
sunLight.castShadow = true;
sunLight.shadow.mapSize.set(1024,1024);
scene.add(sunLight);
scene.add(new THREE.AmbientLight(0x1a2040, 0.4));

// Rim light
var rimLight = new THREE.DirectionalLight(0x4488cc, 0.3);
rimLight.position.set(-20, 5, -20);
scene.add(rimLight);

// ═══ Earth ═══
var earthGeo = new THREE.SphereGeometry(3, 64, 64);
// Procedural earth-like colors
var earthMat = new THREE.MeshPhongMaterial({
  color: 0x2244aa,
  emissive: 0x001133,
  emissiveIntensity: 0.1,
  specular: 0x333344,
  shininess: 25,
});
var earth = new THREE.Mesh(earthGeo, earthMat);
earth.rotation.z = 23.44 * Math.PI / 180; // axial tilt
earth.castShadow = true;
earth.receiveShadow = true;
scene.add(earth);

// Earth continent patches (simplified)
var continentMat = new THREE.MeshPhongMaterial({color:0x2d8a4e,transparent:true,opacity:0.7});
for(var ci=0;ci<12;ci++){
  var cg = new THREE.SphereGeometry(0.3+Math.random()*0.5, 8, 8,
    Math.random()*Math.PI*2, Math.random()*0.8+0.3,
    Math.random()*Math.PI*0.5+0.3, Math.random()*0.6+0.2);
  var cm = new THREE.Mesh(cg, continentMat);
  var cr=3.02, ct=Math.random()*Math.PI*2, cp=Math.acos(2*Math.random()-1);
  cm.position.set(cr*Math.sin(cp)*Math.cos(ct),cr*Math.sin(cp)*Math.sin(ct),cr*Math.cos(cp));
  cm.lookAt(0,0,0);
  earth.add(cm);
}

// Atmosphere glow
var atmosGeo = new THREE.SphereGeometry(3.3, 32, 32);
var atmosMat = new THREE.MeshBasicMaterial({
  color: 0x4488ff,
  transparent: true,
  opacity: 0.08,
  side: THREE.BackSide,
});
earth.add(new THREE.Mesh(atmosGeo, atmosMat));

// Cloud layer
var cloudGeo = new THREE.SphereGeometry(3.08, 32, 32);
var cloudMat = new THREE.MeshPhongMaterial({
  color: 0xffffff,
  transparent: true,
  opacity: 0.15,
  depthWrite: false,
});
var clouds = new THREE.Mesh(cloudGeo, cloudMat);
earth.add(clouds);

// ═══ Moon ═══
var moonGeo = new THREE.SphereGeometry(0.8, 32, 32);
var moonMat = new THREE.MeshPhongMaterial({
  color: 0xbbbbbb,
  emissive: 0x111111,
  specular: 0x222222,
  shininess: 5,
});
var moon = new THREE.Mesh(moonGeo, moonMat);
moon.castShadow = true;
moon.receiveShadow = true;
scene.add(moon);

// Craters
var craterMat = new THREE.MeshPhongMaterial({color:0x888888});
for(var ci=0;ci<8;ci++){
  var cg = new THREE.CircleGeometry(0.08+Math.random()*0.12, 8);
  var cm = new THREE.Mesh(cg, craterMat);
  var cr=0.81, ct=Math.random()*Math.PI*2, cp=Math.acos(2*Math.random()-1);
  cm.position.set(cr*Math.sin(cp)*Math.cos(ct),cr*Math.sin(cp)*Math.sin(ct),cr*Math.cos(cp));
  cm.lookAt(0,0,0);
  moon.add(cm);
}

// ═══ Orbit Line ═══
var ORBIT_A = 12; // semi-major (scaled)
var ORBIT_E = 0.0549;
var ORBIT_INCL = 5.145 * Math.PI / 180;
var showIncl = false;

function orbitR(theta){
  return ORBIT_A * (1 - ORBIT_E*ORBIT_E) / (1 + ORBIT_E * Math.cos(theta));
}

var orbitPts = [];
for(var i=0;i<=128;i++){
  var t = (i/128)*Math.PI*2;
  var r = orbitR(t);
  var x = r*Math.cos(t), z = r*Math.sin(t);
  var y = showIncl ? z*Math.sin(ORBIT_INCL) : 0;
  orbitPts.push(new THREE.Vector3(x,y,z));
}
var orbitGeo = new THREE.BufferGeometry().setFromPoints(orbitPts);
var orbitMat = new THREE.LineBasicMaterial({color:0x4A7FBF,transparent:true,opacity:0.3});
var orbitLine = new THREE.Line(orbitGeo, orbitMat);
scene.add(orbitLine);

function updateOrbitLine(){
  var pts = [];
  for(var i=0;i<=128;i++){
    var t=(i/128)*Math.PI*2, r=orbitR(t);
    var x=r*Math.cos(t), z=r*Math.sin(t);
    var y=showIncl?z*Math.sin(ORBIT_INCL):0;
    pts.push(x,y,z);
  }
  orbitLine.geometry.setAttribute('position',new THREE.Float32BufferAttribute(pts,3));
  orbitLine.geometry.attributes.position.needsUpdate=true;
}

// ═══ Trail ═══
var TRAIL_MAX = 300;
var trailPts = [];
var trailGeo = new THREE.BufferGeometry();
var trailMat = new THREE.LineBasicMaterial({color:0xD4A843,transparent:true,opacity:0.5});
var trailLine = new THREE.Line(trailGeo, trailMat);
scene.add(trailLine);
var showTrail = true;

// ═══ Labels ═══
var showLabels = false;
function makeLabel(text, parent, yOff){
  var c = document.createElement('canvas');
  c.width=128; c.height=32;
  var ctx=c.getContext('2d');
  ctx.font='bold 14px JetBrains Mono, monospace';
  ctx.fillStyle='#6BA3E8';
  ctx.textAlign='center';
  ctx.fillText(text,64,20);
  var tex = new THREE.CanvasTexture(c);
  var spMat = new THREE.SpriteMaterial({map:tex,transparent:true,depthTest:false});
  var sp = new THREE.Sprite(spMat);
  sp.scale.set(3,0.75,1);
  sp.position.y = yOff || 4;
  sp.visible = showLabels;
  parent.add(sp);
  return sp;
}
var earthLabel = makeLabel('Earth 지구', earth, 4.5);
var moonLabel = makeLabel('Moon 달', moon, 1.5);

// ═══ Simulation State ═══
var playing = true;
var simTime = 0; // days
var speedMult = 1.0;
var angle = 0; // radians

var SIDEREAL_PERIOD = 27.322; // days
var ANGULAR_SPEED = (Math.PI * 2) / SIDEREAL_PERIOD; // rad/day
var REAL_DIST = 384400; // km
var REAL_SPEED = 1.022; // km/s

// ═══ Phase Logic ═══
var PHASES = [
  {min:0,max:45,ko:'삭 (新月)',en:'New Moon',icon:'🌑'},
  {min:45,max:90,ko:'초승달',en:'Waxing Crescent',icon:'🌒'},
  {min:90,max:135,ko:'상현달',en:'First Quarter',icon:'🌓'},
  {min:135,max:180,ko:'차오르는 달',en:'Waxing Gibbous',icon:'🌔'},
  {min:180,max:225,ko:'보름달 (滿月)',en:'Full Moon',icon:'🌕'},
  {min:225,max:270,ko:'이지러지는 달',en:'Waning Gibbous',icon:'🌖'},
  {min:270,max:315,ko:'하현달',en:'Last Quarter',icon:'🌗'},
  {min:315,max:360,ko:'그믐달',en:'Waning Crescent',icon:'🌘'},
];

function getPhase(deg){
  var d = ((deg%360)+360)%360;
  for(var i=0;i<PHASES.length;i++){
    if(d>=PHASES[i].min && d<PHASES[i].max) return PHASES[i];
  }
  return PHASES[0];
}

// ═══ Controls ═══
var btnPlay = document.getElementById('btn-play');
var btnReset = document.getElementById('btn-reset');
var speedSlider = document.getElementById('speed-slider');
var speedLabel = document.getElementById('speed-label');

btnPlay.onclick = function(){
  playing = !playing;
  btnPlay.textContent = playing ? '❚❚' : '▶';
  btnPlay.classList.toggle('active', playing);
};
btnReset.onclick = function(){
  simTime = 0; angle = 0; trailPts = [];
};
speedSlider.oninput = function(){
  var v = parseInt(this.value);
  if(v <= 100) speedMult = v / 50; // 0.02 ~ 2.0
  else speedMult = 2 + (v - 100) * 0.18; // 2.0 ~ 20.0
  speedLabel.textContent = '×' + speedMult.toFixed(1);
};

// Toggles
var togTrail = document.getElementById('tog-trail');
var togLabel = document.getElementById('tog-label');
var togIncl = document.getElementById('tog-incl');
togTrail.onclick = function(){ showTrail=!showTrail; this.classList.toggle('on',showTrail); trailLine.visible=showTrail; };
togLabel.onclick = function(){ showLabels=!showLabels; this.classList.toggle('on',showLabels); earthLabel.visible=showLabels; moonLabel.visible=showLabels; };
togIncl.onclick = function(){ showIncl=!showIncl; this.classList.toggle('on',showIncl); updateOrbitLine(); };

// ═══ Mouse / Touch Camera ═══
var dragging = false, lastMX=0, lastMY=0;
canvas.addEventListener('mousedown', function(e){ dragging=true; lastMX=e.clientX; lastMY=e.clientY; });
window.addEventListener('mouseup', function(){ dragging=false; });
window.addEventListener('mousemove', function(e){
  if(!dragging) return;
  var dx=e.clientX-lastMX, dy=e.clientY-lastMY;
  camTheta -= dx*0.005;
  camPhi = Math.max(0.1, Math.min(Math.PI-0.1, camPhi - dy*0.005));
  lastMX=e.clientX; lastMY=e.clientY;
  updateCamera();
});
canvas.addEventListener('wheel', function(e){
  camDist = Math.max(8, Math.min(50, camDist + e.deltaY*0.02));
  updateCamera();
}, {passive:true});

// Touch
var touchId = null;
canvas.addEventListener('touchstart', function(e){
  if(e.touches.length===1){ touchId=e.touches[0].identifier; lastMX=e.touches[0].clientX; lastMY=e.touches[0].clientY; dragging=true; }
});
canvas.addEventListener('touchmove', function(e){
  e.preventDefault();
  for(var i=0;i<e.changedTouches.length;i++){
    if(e.changedTouches[i].identifier===touchId){
      var dx=e.changedTouches[i].clientX-lastMX, dy=e.changedTouches[i].clientY-lastMY;
      camTheta-=dx*0.005; camPhi=Math.max(0.1,Math.min(Math.PI-0.1,camPhi-dy*0.005));
      lastMX=e.changedTouches[i].clientX; lastMY=e.changedTouches[i].clientY;
      updateCamera();
    }
  }
});
canvas.addEventListener('touchend', function(){ dragging=false; touchId=null; });

// Resize
window.addEventListener('resize', function(){
  W=window.innerWidth; H=window.innerHeight;
  renderer.setSize(W,H);
  camera.aspect=W/H;
  camera.updateProjectionMatrix();
});

// ═══ HUD Updates ═══
var elDay = document.getElementById('rt-day');
var elAngle = document.getElementById('rt-angle');
var elDist = document.getElementById('rt-dist');
var elSpeed = document.getElementById('rt-speed');
var elPhaseIcon = document.getElementById('phase-icon');
var elPhaseKo = document.getElementById('phase-ko');
var elPhaseEn = document.getElementById('phase-en');

function updateHUD(){
  var deg = ((angle * 180 / Math.PI) % 360 + 360) % 360;
  var r = orbitR(angle);
  var realDist = Math.round(REAL_DIST * r / ORBIT_A);
  var phase = getPhase(deg);

  elDay.textContent = simTime.toFixed(1);
  elAngle.innerHTML = deg.toFixed(1) + '<span class="unit">°</span>';
  elDist.innerHTML = realDist.toLocaleString() + '<span class="unit">km</span>';
  elSpeed.innerHTML = (REAL_SPEED * (ORBIT_A/r)).toFixed(3) + '<span class="unit">km/s</span>';

  elPhaseIcon.textContent = phase.icon;
  elPhaseKo.textContent = phase.ko;
  elPhaseEn.textContent = phase.en + ' · DAY ' + Math.floor(simTime);
}

// ═══ Animation Loop ═══
var lastTime = 0;
function animate(time){
  requestAnimationFrame(animate);
  var dt = Math.min(0.05, (time - lastTime) / 1000);
  lastTime = time;

  if(playing){
    var dayDelta = dt * speedMult;
    simTime += dayDelta;
    angle += ANGULAR_SPEED * dayDelta;
  }

  // Moon position (elliptical)
  var r = orbitR(angle);
  var mx = r * Math.cos(angle);
  var mz = r * Math.sin(angle);
  var my = showIncl ? mz * Math.sin(ORBIT_INCL) : 0;
  moon.position.set(mx, my, mz);
  moon.lookAt(0, 0, 0); // tidal lock

  // Trail
  if(playing && showTrail){
    trailPts.push(mx, my, mz);
    if(trailPts.length > TRAIL_MAX * 3) trailPts.splice(0, 3);
    trailLine.geometry.setAttribute('position', new THREE.Float32BufferAttribute(trailPts, 3));
    trailLine.geometry.attributes.position.needsUpdate = true;
  }

  // Earth rotation
  earth.rotation.y += dt * 0.5;
  clouds.rotation.y += dt * 0.08;

  // Update HUD (throttled)
  if(Math.floor(time/100) !== Math.floor((time-16)/100)){
    updateHUD();
    window.score = Math.floor(simTime);
  }

  renderer.render(scene, camera);
}
requestAnimationFrame(animate);

})();
</script>
</body>
</html>`;
