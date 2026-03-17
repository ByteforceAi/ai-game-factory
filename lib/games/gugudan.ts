export const GUGUDAN_HTML = `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<title>구구단</title>
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;700&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{overflow:hidden;background:#F5F3EE;font-family:'Noto Sans KR',system-ui,sans-serif;color:#1D1D1F;touch-action:none;-webkit-tap-highlight-color:transparent}
canvas{display:block;position:fixed;top:0;left:0;z-index:0}
#ui{position:fixed;top:0;left:0;right:0;bottom:0;z-index:10;pointer-events:none;display:flex;flex-direction:column}
.top{
  pointer-events:auto;display:flex;align-items:center;justify-content:center;
  padding:max(12px,env(safe-area-inset-top,12px)) 16px 10px;gap:4px;
  background:rgba(245,243,238,0.7);backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);
}
.dp{
  width:38px;height:38px;border-radius:50%;border:none;
  font-size:15px;font-weight:500;color:#AEAEB2;background:transparent;
  cursor:pointer;transition:all 0.35s cubic-bezier(.25,.46,.45,.94);
  display:flex;align-items:center;justify-content:center;
}
.dp.on{color:#1D1D1F;font-weight:700;background:rgba(0,0,0,0.05)}
.dp.ok{color:#34C759}
.mid{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:flex-start;padding-top:8vh}
.eq{
  text-align:center;pointer-events:none;
  opacity:0;transform:translateY(10px);
  transition:all 0.5s cubic-bezier(.25,.46,.45,.94);
}
.eq.v{opacity:1;transform:translateY(0)}
.eq-num{font-size:clamp(42px,11vw,72px);font-weight:700;letter-spacing:-2px;transition:all 0.35s}
.eq-dim{color:#AEAEB2;font-weight:400}
.eq-ans{color:#007AFF}
.eq-hint{font-size:clamp(13px,3.2vw,15px);color:#AEAEB2;font-weight:400;margin-top:2px}
.counter{
  position:fixed;right:max(20px,4vw);top:50%;transform:translateY(-50%);
  text-align:right;pointer-events:none;
  opacity:0;transition:all 0.5s cubic-bezier(.25,.46,.45,.94);
}
.counter.v{opacity:1}
.c-big{font-size:clamp(56px,14vw,96px);font-weight:700;color:#1D1D1F;line-height:1}
.c-lbl{font-size:12px;color:#AEAEB2;margin-top:2px}
.bot{
  pointer-events:auto;
  background:rgba(245,243,238,0.7);backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);
  border-top:0.5px solid rgba(0,0,0,0.05);
  padding:14px 20px max(14px,calc(10px + env(safe-area-inset-bottom,0px)));
}
.dots{display:flex;gap:6px;justify-content:center;margin-bottom:12px}
.dot{height:3px;border-radius:2px;background:#D1D1D6;width:18px;transition:all 0.4s cubic-bezier(.25,.46,.45,.94)}
.dot.on{background:#1D1D1F;width:28px}
.dot.ok{background:#34C759}
.btn{
  width:100%;padding:15px;border-radius:14px;font-size:16px;font-weight:600;
  border:none;cursor:pointer;font-family:inherit;letter-spacing:-0.3px;
  transition:all 0.2s cubic-bezier(.25,.46,.45,.94);
}
.btn:active{transform:scale(0.97)}
.btn-p{background:#1D1D1F;color:#fff}
.btn-s{background:rgba(0,0,0,0.04);color:#1D1D1F}
.btn-g{background:#34C759;color:#fff}
.brow{display:flex;gap:8px}
.brow .btn{flex:1}
.cgrid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px}
.cb{
  padding:18px 12px;border-radius:14px;font-size:clamp(22px,5.5vw,30px);font-weight:700;
  background:#fff;border:2px solid rgba(0,0,0,0.05);color:#1D1D1F;
  cursor:pointer;font-family:inherit;transition:all 0.2s;
}
.cb:active{transform:scale(0.94)}
.cb.y{border-color:#34C759;background:rgba(52,199,89,0.06);color:#248A3D}
.cb.n{border-color:#FF3B30;background:rgba(255,59,48,0.05);color:#D70015}
.plist{display:flex;flex-wrap:wrap;gap:5px;justify-content:center;margin-bottom:10px}
.pi{
  padding:6px 11px;border-radius:9px;background:#fff;
  border:1.5px solid rgba(0,0,0,0.04);font-size:13px;font-weight:600;
  text-align:center;min-width:62px;
}
.pi b{display:block;font-size:17px;margin-top:1px;color:#1D1D1F}
.pi span{color:#AEAEB2}
.ov{
  position:fixed;inset:0;z-index:20;
  display:flex;flex-direction:column;align-items:center;justify-content:center;
  background:rgba(245,243,238,0.94);backdrop-filter:blur(30px);-webkit-backdrop-filter:blur(30px);
  text-align:center;padding:24px;
  opacity:0;pointer-events:none;transition:opacity 0.5s cubic-bezier(.25,.46,.45,.94);
}
.ov.v{opacity:1;pointer-events:auto}
.ov h1{font-size:clamp(30px,8vw,44px);font-weight:700;letter-spacing:-1px;margin-bottom:4px}
.ov p{font-size:15px;color:#AEAEB2;line-height:1.7;margin-bottom:36px}
.pill{
  background:#1D1D1F;color:#fff;border:none;
  padding:15px 44px;border-radius:980px;
  font-size:16px;font-weight:600;font-family:inherit;cursor:pointer;
  transition:all 0.2s;
}
.pill:active{transform:scale(0.96)}
.ov .sub{font-size:11px;color:#C7C7CC;position:fixed;bottom:max(16px,env(safe-area-inset-bottom,16px))}
.stars{font-size:44px;letter-spacing:10px;margin-bottom:12px}
.rstat{display:flex;gap:28px;margin:20px 0 28px}
.rs{text-align:center}
.rs-n{font-size:32px;font-weight:700}
.rs-l{font-size:11px;color:#AEAEB2;margin-top:2px}
.flash{
  position:fixed;top:35%;left:50%;transform:translate(-50%,-50%);
  font-size:clamp(32px,8vw,52px);font-weight:700;
  pointer-events:none;z-index:15;opacity:0;
}
.flash.go{animation:flashIn 0.7s cubic-bezier(.25,.46,.45,.94) forwards}
@keyframes flashIn{0%{opacity:0;transform:translate(-50%,-50%) scale(0.7)}25%{opacity:1;transform:translate(-50%,-50%) scale(1.05)}100%{opacity:0;transform:translate(-50%,-60%) scale(1)}}
</style>
</head>
<body>
<div class="ov v" id="start">
  <h1>구구단</h1>
  <p>만지고, 세고, 이해하기</p>
  <button class="pill" onclick="go()">시작</button>
  <div class="sub">AI Game Factory</div>
</div>
<div id="ui" style="display:none">
  <div class="top" id="top"></div>
  <div class="mid"><div class="eq" id="eq"><div class="eq-num" id="eq-n"></div><div class="eq-hint" id="eq-h"></div></div></div>
  <div class="counter" id="ctr"><div class="c-big" id="c-n">0</div><div class="c-lbl" id="c-l"></div></div>
  <div class="bot" id="bot"><div class="dots" id="dots"></div><div id="bc"></div></div>
</div>
<div class="ov" id="result">
  <div class="stars" id="r-stars"></div>
  <h1 id="r-title"></h1>
  <p id="r-sub"></p>
  <div class="rstat" id="r-stat"></div>
  <button class="pill" id="r-btn" onclick="afterResult()">다음</button>
</div>
<div class="flash" id="flash"></div>
<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
<script>
// ===== AUDIO =====
var AudioCtx = window.AudioContext || window.webkitAudioContext;
var actx = null;
function initAudio(){if(!actx)actx=new AudioCtx();}
function playTone(freq,dur,type,vol){
  if(!actx)return;
  var o=actx.createOscillator(),g=actx.createGain();
  o.type=type||'sine';o.frequency.value=freq;
  g.gain.setValueAtTime(vol||0.08,actx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001,actx.currentTime+dur);
  o.connect(g);g.connect(actx.destination);
  o.start();o.stop(actx.currentTime+dur);
}
function sfxCorrect(){playTone(880,0.1,'sine',0.1);setTimeout(function(){playTone(1100,0.15,'sine',0.08)},60);}
function sfxWrong(){playTone(200,0.3,'sawtooth',0.06);}
function sfxClick(){playTone(600,0.05,'sine',0.06);}
function sfxComplete(){playTone(523,0.12,'sine',0.1);setTimeout(function(){playTone(659,0.12,'sine',0.08)},100);setTimeout(function(){playTone(784,0.12,'sine',0.08)},200);setTimeout(function(){playTone(1047,0.2,'sine',0.1)},300);}
document.addEventListener('touchstart', function(){initAudio();},{once:true});
document.addEventListener('click', function(){initAudio();},{once:true});

// ===== THREE.JS =====
var scene = new THREE.Scene();
scene.background = new THREE.Color(0xF5F3EE);
scene.fog = new THREE.Fog(0xF5F3EE, 20, 50);
var camera = new THREE.PerspectiveCamera(40, innerWidth/innerHeight, 0.1, 200);
var renderer = new THREE.WebGLRenderer({antialias:true});
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.4;
document.body.prepend(renderer.domElement);
scene.add(new THREE.AmbientLight(0xFFF5EB, 0.5));
var sun = new THREE.DirectionalLight(0xFFF8F0, 1.1);
sun.position.set(5, 10, 7);
sun.castShadow = true;
sun.shadow.mapSize.set(1024,1024);
sun.shadow.camera.left=-12;sun.shadow.camera.right=12;sun.shadow.camera.top=12;sun.shadow.camera.bottom=-12;
sun.shadow.radius = 3;
scene.add(sun);
var fillLight = new THREE.DirectionalLight(0xDDE8FF, 0.25);
fillLight.position.set(-3,5,-2);
scene.add(fillLight);
var gnd = new THREE.Mesh(new THREE.PlaneGeometry(80,80), new THREE.MeshLambertMaterial({color:0xECE9E3}));
gnd.rotation.x=-Math.PI/2;gnd.receiveShadow=true;scene.add(gnd);

var PALETTES = {
  2:[0x5AC8FA,0x34AADC], 3:[0xFF9500,0xE08600], 4:[0xFF2D55,0xD6204A],
  5:[0x5856D6,0x4240B0], 6:[0x34C759,0x28A745], 7:[0xAF52DE,0x9340B8],
  8:[0xFF6B6B,0xE05050], 9:[0x00C7BE,0x00A89F],
};
function groupColor(dan, groupIdx) {
  var base = PALETTES[dan] || [0x007AFF, 0x0055CC];
  var c = new THREE.Color(base[0]);
  c.offsetHSL(0, 0, -groupIdx * 0.04);
  return c;
}

// ===== SPHERE MANAGEMENT =====
var groups3D = [];
var particlesList = [];
var SPHERE_R = 0.28;
var sphereShape = 'sphere'; // sphere, cube, cylinder

function clearAll() {
  groups3D.forEach(function(g){scene.remove(g.group)});
  groups3D = [];
}
function createShape(mat) {
  if(sphereShape === 'cube') return new THREE.Mesh(new THREE.BoxGeometry(SPHERE_R*1.6,SPHERE_R*1.6,SPHERE_R*1.6,1,1,1), mat);
  if(sphereShape === 'cylinder') return new THREE.Mesh(new THREE.CylinderGeometry(SPHERE_R,SPHERE_R,SPHERE_R*1.8,12), mat);
  return new THREE.Mesh(new THREE.SphereGeometry(SPHERE_R, 20, 14), mat);
}
function addOneGroup(dan, groupIdx, totalGroups) {
  var g = new THREE.Group();
  var color = groupColor(dan, groupIdx);
  var mat = new THREE.MeshStandardMaterial({color:color, roughness:0.18, metalness:0.05});
  var cols = Math.ceil(Math.sqrt(dan));
  var rows = Math.ceil(dan / cols);
  var spacing = SPHERE_R * 2.6;
  for (var i = 0; i < dan; i++) {
    var r = Math.floor(i / cols);
    var c = i % cols;
    var s = createShape(mat.clone());
    s.castShadow = true;
    s.position.set((c - (cols-1)/2) * spacing, SPHERE_R + r * spacing, 0);
    s.scale.set(0,0,0);
    s.userData = {targetY: s.position.y, delay: i * 0.03, t:0, entering:true};
    s.position.y = -1;
    g.add(s);
  }
  var plat = new THREE.Mesh(
    new THREE.CylinderGeometry(cols * spacing * 0.55, cols * spacing * 0.6, 0.06, 20),
    new THREE.MeshLambertMaterial({color: color.clone().offsetHSL(0,-0.1,0.25)})
  );
  plat.position.y = 0.03;
  plat.receiveShadow = true;
  g.add(plat);
  var pos = getGroupPosition(groupIdx, totalGroups);
  g.position.set(pos.x, 0, pos.z);
  g.userData = {entering:true, delay:0.05, targetX:pos.x, targetZ:pos.z};
  g.position.y = -2;
  scene.add(g);
  groups3D.push({group:g, spheres:g.children.filter(function(ch){return ch.geometry && (ch.geometry.type==='SphereGeometry'||ch.geometry.type==='BoxGeometry'||ch.geometry.type==='CylinderGeometry')})});
}
function getGroupPosition(idx, total) {
  if (total <= 3) { return {x: (idx - (total-1)/2) * 3, z: 0}; }
  if (total <= 6) {
    var row = idx < Math.ceil(total/2) ? 0 : 1;
    var inRow = row === 0 ? Math.ceil(total/2) : Math.floor(total/2);
    var idxInRow = row === 0 ? idx : idx - Math.ceil(total/2);
    return {x: (idxInRow - (inRow-1)/2) * 2.8, z: row * 3};
  }
  var angle = (idx / (total-1)) * Math.PI * 0.8 - Math.PI * 0.4;
  var radius = 5 + total * 0.3;
  return {x: Math.sin(angle) * radius, z: Math.cos(angle) * radius - radius + 2};
}
function repositionAllGroups(total) {
  groups3D.forEach(function(g, i) {
    var pos = getGroupPosition(i, total);
    g.group.userData.targetX = pos.x;
    g.group.userData.targetZ = pos.z;
  });
}
function dimGroups(litCount) {
  groups3D.forEach(function(g, i) {
    var lit = i < litCount;
    g.spheres.forEach(function(s) {
      s.material.opacity = lit ? 1.0 : 0.25;
      s.material.transparent = !lit;
      s.material.emissive = lit ? s.material.color.clone().multiplyScalar(0.1) : new THREE.Color(0);
    });
  });
}
function getCameraForGroups(total) {
  if (total <= 2) return {x:0, y:4, z:9, ly:0.8};
  if (total <= 4) return {x:0, y:5, z:12, ly:0.8};
  if (total <= 6) return {x:0, y:6, z:14, ly:1};
  return {x:0, y:7.5, z:16, ly:1};
}
var cam = {x:0,y:4,z:9,ly:0.8};
function setCam(c){cam=c;}
function spawnParticles(n){
  n=n||15;
  var cols=[0x007AFF,0xFF9500,0x34C759,0xFF2D55,0x5856D6,0xFFD60A];
  for(var i=0;i<n;i++){
    var geo=new THREE.SphereGeometry(0.04+Math.random()*0.04,4,4);
    var mat=new THREE.MeshBasicMaterial({color:cols[Math.floor(Math.random()*cols.length)],transparent:true});
    var p=new THREE.Mesh(geo,mat);
    p.position.set((Math.random()-0.5)*5,1+Math.random()*2,(Math.random()-0.5)*3);
    p.userData={vel:new THREE.Vector3((Math.random()-0.5)*4,3+Math.random()*4,(Math.random()-0.5)*3),life:1.2+Math.random()*0.6};
    scene.add(p);particlesList.push(p);
  }
}

var t=0;
var score = 0;
var gameOver = false;
function animate(){
  requestAnimationFrame(animate);
  t+=0.016;
  camera.position.x+=(cam.x-camera.position.x)*2.5*0.016;
  camera.position.y+=(cam.y-camera.position.y)*2.5*0.016;
  camera.position.z+=(cam.z-camera.position.z)*2.5*0.016;
  camera.lookAt(0, cam.ly||0.8, 0);
  groups3D.forEach(function(g,gi){
    var grp=g.group;
    if(grp.userData.entering){
      grp.position.y+=(0-grp.position.y)*5*0.016;
      if(Math.abs(grp.position.y)<0.02){grp.userData.entering=false;grp.position.y=0;}
    }
    grp.position.x+=(grp.userData.targetX-grp.position.x)*3*0.016;
    grp.position.z+=((grp.userData.targetZ||0)-grp.position.z)*3*0.016;
    g.spheres.forEach(function(s){
      if(s.userData.entering){
        s.userData.delay-=0.016;
        if(s.userData.delay<=0){
          s.userData.t=Math.min(1,s.userData.t+0.016*4);
          var e=1+2.5*Math.pow(s.userData.t-1,3)+1.5*Math.pow(s.userData.t-1,2);
          var sc=Math.min(1.0,e);
          s.scale.set(sc,sc,sc);
          s.position.y=-1+(s.userData.targetY+1)*Math.min(1,e);
          if(s.userData.t>=1)s.userData.entering=false;
        }
      }
      if(!s.userData.entering){
        s.position.y=s.userData.targetY+Math.sin(t*1.1+gi*0.8+s.position.x*2)*0.02;
      }
    });
  });
  for(var i=particlesList.length-1;i>=0;i--){
    var p=particlesList[i];
    p.userData.vel.y-=9.8*0.016;
    p.position.add(p.userData.vel.clone().multiplyScalar(0.016));
    p.userData.life-=0.016;
    p.material.opacity=Math.max(0,p.userData.life);
    if(p.userData.life<=0){scene.remove(p);particlesList.splice(i,1);}
  }
  renderer.render(scene,camera);
}
animate();
addEventListener('resize',function(){camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);});

// ===== STATE =====
var D=2, P=0;
var expN=1, cntN=0;
var qIdx=0, qOk=0, qList=[];
var done={};
var totalCorrect=0, totalAttempts=0;

var $=function(id){return document.getElementById(id)};
function flash(txt,color){
  var el=$('flash');
  el.textContent=txt;el.style.color=color;
  el.classList.remove('go');void el.offsetWidth;el.classList.add('go');
}
function renderTop(){
  var h='';
  for(var d=2;d<=9;d++){
    var cls=d===D?'on':(done[d]?'ok':'');
    h+='<button class="dp '+cls+'" onclick="pickDan('+d+')">'+d+'</button>';
  }
  $('top').innerHTML=h;
}
function renderDots(){
  $('dots').innerHTML=[0,1,2,3].map(function(i){return '<div class="dot '+(i===P?'on':(i<P?'ok':''))+'"></div>'}).join('');
}
function render(){
  renderTop();renderDots();
  switch(P){
    case 0:rExplore();break;
    case 1:rCount();break;
    case 2:rPattern();break;
    case 3:rQuiz();break;
  }
}
// ===== PHASE 0: EXPLORE =====
function rExplore(){
  clearAll();
  for(var i=0;i<expN;i++) addOneGroup(D, i, expN);
  setCam(getCameraForGroups(expN));
  $('eq').classList.add('v');
  $('eq-n').innerHTML=D+' <span class="eq-dim">&times;</span> '+expN+' <span class="eq-dim">=</span> <span class="eq-ans">'+(D*expN)+'</span>';
  $('eq-h').textContent=D+'개씩 '+expN+'묶음';
  $('ctr').classList.remove('v');
  $('bc').innerHTML='<div class="brow" style="margin-bottom:8px"><button class="btn btn-s" onclick="chgExp(-1)" '+(expN<=1?'disabled':'')+'>−  묶음</button><button class="btn btn-s" onclick="chgExp(1)" '+(expN>=9?'disabled':'')+'>+  묶음</button></div><button class="btn btn-p" onclick="P=1;cntN=0;render()">다음</button>';
}
window.chgExp=function(d){
  sfxClick();
  expN=Math.max(1,Math.min(9,expN+d));
  if(d>0){
    addOneGroup(D, groups3D.length, expN);
    repositionAllGroups(expN);
  } else {
    var last=groups3D.pop();
    if(last)scene.remove(last.group);
    repositionAllGroups(expN);
  }
  setCam(getCameraForGroups(expN));
  $('eq-n').innerHTML=D+' <span class="eq-dim">&times;</span> '+expN+' <span class="eq-dim">=</span> <span class="eq-ans">'+(D*expN)+'</span>';
  $('eq-h').textContent=D+'개씩 '+expN+'묶음';
  $('bc').innerHTML='<div class="brow" style="margin-bottom:8px"><button class="btn btn-s" onclick="chgExp(-1)" '+(expN<=1?'disabled':'')+'>−  묶음</button><button class="btn btn-s" onclick="chgExp(1)" '+(expN>=9?'disabled':'')+'>+  묶음</button></div><button class="btn btn-p" onclick="P=1;cntN=0;render()">다음</button>';
};
// ===== PHASE 1: COUNT =====
function rCount(){
  clearAll();
  for(var i=0;i<9;i++) addOneGroup(D, i, 9);
  dimGroups(0);
  setCam(getCameraForGroups(9));
  $('eq').classList.add('v');
  $('eq-n').textContent='?';
  $('eq-h').textContent='하나씩 세어보세요';
  $('ctr').classList.add('v');
  $('c-n').textContent='0';
  $('c-l').textContent='';
  $('bc').innerHTML='<div class="brow" style="margin-bottom:8px"><button class="btn btn-s" onclick="cntStep(-1)">← 하나 빼기</button><button class="btn btn-p" onclick="cntStep(1)">하나 더 →</button></div><button class="btn btn-s" style="margin-top:6px" onclick="P=2;render()">건너뛰기</button>';
}
window.cntStep=function(d){
  sfxClick();
  cntN=Math.max(0,Math.min(9,cntN+d));
  dimGroups(cntN);
  var total=D*cntN;
  $('c-n').textContent=total;
  $('c-l').textContent=cntN>0?D+' × '+cntN:'';
  if(cntN>0){
    $('eq-n').innerHTML=D+' <span class="eq-dim">&times;</span> '+cntN+' <span class="eq-dim">=</span> <span class="eq-ans">'+total+'</span>';
    $('eq-h').textContent=D+'개씩 '+cntN+'묶음 = '+total+'개';
  }else{
    $('eq-n').textContent='?';
    $('eq-h').textContent='하나씩 세어보세요';
  }
  if(cntN===9){
    spawnParticles(18);
    sfxComplete();
    setTimeout(function(){P=2;render();},1000);
  }
};
// ===== PHASE 2: PATTERN =====
function rPattern(){
  clearAll();
  for(var i=0;i<5;i++) addOneGroup(D,i,5);
  setCam({x:0,y:6,z:14,ly:1});
  $('eq').classList.add('v');
  $('eq-n').textContent=D+'단';
  $('eq-h').textContent=patternHint(D);
  $('ctr').classList.remove('v');
  var h='<div class="plist">';
  for(var i=1;i<=9;i++) h+='<div class="pi"><span>'+D+'×'+i+'</span><b>'+(D*i)+'</b></div>';
  h+='</div>';
  h+='<button class="btn btn-p" onclick="startQuiz()">확인하기</button>';
  $('bc').innerHTML=h;
}
function patternHint(d){
  var hints={2:"짝수만! 끝자리 2→4→6→8→0",3:"자릿수 합 = 3의 배수",4:"2단의 두 배",5:"끝이 항상 5 또는 0",6:"짝수 + 3의 배수",7:"끝자리 7→4→1→8→5→2→9→6→3",8:"2단의 네 배",9:"십의자리+일의자리 = 9"};
  return hints[d]||'';
}
// ===== PHASE 3: QUIZ =====
function startQuiz(){
  qIdx=0;qOk=0;qList=[];
  for(var i=1;i<=9;i++) qList.push({a:D,b:i,ans:D*i});
  for(var i=qList.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1));var tmp=qList[i];qList[i]=qList[j];qList[j]=tmp;}
  P=3;render();
}
function rQuiz(){
  if(qIdx>=qList.length){showResult();return;}
  var q=qList[qIdx];
  clearAll();
  for(var i=0;i<q.b;i++) addOneGroup(q.a,i,q.b);
  setCam(getCameraForGroups(q.b));
  $('eq').classList.add('v');
  $('eq-n').innerHTML=q.a+' <span class="eq-dim">&times;</span> '+q.b+' <span class="eq-dim">=</span> <span class="eq-ans">?</span>';
  $('eq-h').textContent=(qIdx+1)+' / '+qList.length;
  $('ctr').classList.remove('v');
  var choices=mkChoices(q.ans);
  $('bc').innerHTML='<div class="cgrid">'+choices.map(function(c){return '<button class="cb" onclick="qAns('+c+','+q.ans+',this)">'+c+'</button>'}).join('')+'</div>';
}
function mkChoices(ans){
  var s={};s[ans]=true;
  var offs=[-D,D,-1,1,D+1,-(D-1),2,-2];
  var count=1;
  while(count<4){
    var o=offs[Math.floor(Math.random()*offs.length)];
    var w=ans+o;
    if(w>0&&!s[w]){s[w]=true;count++;}
  }
  var a=Object.keys(s).map(Number);
  for(var i=a.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1));var tmp=a[i];a[i]=a[j];a[j]=tmp;}
  return a;
}
window.qAns=function(v,ans,btn){
  var buttons=document.querySelectorAll('.cb');
  for(var i=0;i<buttons.length;i++) buttons[i].style.pointerEvents='none';
  totalAttempts++;
  if(v===ans){
    btn.classList.add('y');qOk++;totalCorrect++;
    spawnParticles(10);
    sfxCorrect();
    flash('정답!','#34C759');
    $('eq-n').innerHTML=qList[qIdx].a+' <span class="eq-dim">&times;</span> '+qList[qIdx].b+' <span class="eq-dim">=</span> <span class="eq-ans">'+ans+'</span>';
  }else{
    btn.classList.add('n');
    sfxWrong();
    flash(String(ans),'#FF3B30');
    for(var i=0;i<buttons.length;i++){if(parseInt(buttons[i].textContent)===ans)buttons[i].classList.add('y');}
  }
  score = totalCorrect * 10;
  qIdx++;
  setTimeout(function(){rQuiz()}, v===ans?650:1300);
};
// ===== RESULT =====
function showResult(){
  clearAll();
  spawnParticles(35);
  sfxComplete();
  var pct=Math.round(qOk/qList.length*100);
  if(pct>=90) done[D]=true;
  score = totalCorrect * 10 + (pct >= 90 ? 50 : 0);
  $('r-stars').textContent=pct>=90?'★ ★ ★':pct>=70?'★ ★ ☆':'★ ☆ ☆';
  $('r-title').textContent=pct>=90?D+'단 완성!':pct>=70?'거의 다 왔어요':'다시 해볼까요?';
  $('r-sub').textContent=pct>=90?'다음 단에 도전해보세요':'';
  $('r-stat').innerHTML='<div class="rs"><div class="rs-n" style="color:#007AFF">'+qOk+'</div><div class="rs-l">정답</div></div><div class="rs"><div class="rs-n">'+pct+'%</div><div class="rs-l">정답률</div></div>';
  $('r-btn').textContent=pct>=90&&D<9?(D+1)+'단 도전':'다시 하기';
  $('result').classList.add('v');
  // Check if all dans complete
  var allDone = true;
  for(var d=2;d<=9;d++){if(!done[d])allDone=false;}
  if(allDone){
    gameOver = true;
    score = totalCorrect * 10 + 500;
  }
  try{window.parent.postMessage({type:'GAME_SCORE',score:score},'*');}catch(e){}
}
window.afterResult=function(){
  var pct=Math.round(qOk/qList.length*100);
  $('result').classList.remove('v');
  if(pct>=90&&D<9)D++;
  P=0;expN=1;render();
};
window.pickDan=function(d){sfxClick();D=d;P=0;expN=1;render();};
function go(){
  $('start').classList.remove('v');
  $('ui').style.display='flex';
  render();
}
window.go=go;

// ====== VIBE CODING: postMessage HANDLERS ======
window.addEventListener('message', function(e){
  if(!e.data || !e.data.type) return;
  var d = e.data;
  switch(d.type){
    case 'SET_DAN':
      var newD = parseInt(d.value);
      if(newD>=2 && newD<=9){ D=newD; P=0; expN=1; render(); }
      break;
    case 'SET_PHASE':
      var newP = parseInt(d.value);
      if(newP>=0 && newP<=3){ P=newP; render(); }
      break;
    case 'SET_SHAPE':
      if(['sphere','cube','cylinder'].indexOf(d.value)>=0){
        sphereShape = d.value;
        render(); // re-render with new shape
      }
      break;
    case 'SKIP_TO_QUIZ':
      P=3; startQuiz();
      break;
    case 'COMPLETE_ALL':
      for(var dd=2;dd<=9;dd++) done[dd]=true;
      totalCorrect=72; score=totalCorrect*10+500;
      renderTop();
      flash('전부 완성!','#34C759');
      sfxComplete();
      break;
    case 'SET_SPHERE_COLOR':
      var colorVal = parseInt(d.value, 16);
      if(!isNaN(colorVal)){
        PALETTES[D] = [colorVal, colorVal];
        render();
      }
      break;
    case 'SET_GAME_SPEED':
      // Animation speed is fixed at 60fps, not easily changeable
      break;
  }
});
</script>
</body>
</html>`;
