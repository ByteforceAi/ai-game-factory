export const DOT_RPG_HTML = `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0,user-scalable=no,maximum-scale=1.0">
<title>Dot RPG — 잊혀진 마을</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:100%;height:100%;overflow:hidden;background:#1a0e2e;touch-action:none}
canvas{display:block}
</style>
</head>
<body>
<script src="https://cdn.jsdelivr.net/npm/phaser@3.80.1/dist/phaser.min.js"></script>
<script>
'use strict';
(function(){

/* ═══════════════════════════════════════════════
   GLOBAL STATE (for gameExtensions bridge)
   ═══════════════════════════════════════════════ */
window.score = 0;
window.gameOver = false;

/* ═══════════════════════════════════════════════
   PROCEDURAL AUDIO ENGINE
   ═══════════════════════════════════════════════ */
var AudioCtx = window.AudioContext || window.webkitAudioContext;
var actx = null;
function ensureAudio(){
  if(!actx){ try{ actx = new AudioCtx(); }catch(e){ actx=null; } }
  if(actx && actx.state==='suspended') actx.resume().catch(function(){});
}

function sfxStep(){
  if(!actx) return;
  try{
    var t = actx.currentTime;
    var osc = actx.createOscillator();
    var gain = actx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(180 + Math.random()*40, t);
    osc.frequency.exponentialRampToValueAtTime(100, t+0.06);
    gain.gain.setValueAtTime(0.06, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t+0.06);
    osc.connect(gain); gain.connect(actx.destination);
    osc.start(t); osc.stop(t+0.07);
  }catch(e){}
}

function sfxAttack(){
  if(!actx) return;
  try{
    var t = actx.currentTime;
    var osc = actx.createOscillator();
    var osc2 = actx.createOscillator();
    var gain = actx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(600, t);
    osc.frequency.exponentialRampToValueAtTime(150, t+0.12);
    osc2.type = 'square';
    osc2.frequency.setValueAtTime(400, t);
    osc2.frequency.exponentialRampToValueAtTime(80, t+0.12);
    gain.gain.setValueAtTime(0.1, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t+0.15);
    osc.connect(gain); osc2.connect(gain); gain.connect(actx.destination);
    osc.start(t); osc.stop(t+0.16);
    osc2.start(t); osc2.stop(t+0.16);
  }catch(e){}
}

function sfxHit(){
  if(!actx) return;
  try{
    var t = actx.currentTime;
    var bufSize = Math.floor(actx.sampleRate * 0.1);
    var buf = actx.createBuffer(1, bufSize, actx.sampleRate);
    var d = buf.getChannelData(0);
    for(var i=0;i<bufSize;i++) d[i] = (Math.random()*2-1) * Math.pow(1-i/bufSize, 3);
    var src = actx.createBufferSource();
    src.buffer = buf;
    var gain = actx.createGain();
    gain.gain.setValueAtTime(0.08, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t+0.1);
    var filt = actx.createBiquadFilter();
    filt.type = 'lowpass';
    filt.frequency.setValueAtTime(800, t);
    src.connect(filt); filt.connect(gain); gain.connect(actx.destination);
    src.start(t);
  }catch(e){}
}

function sfxTalk(){
  if(!actx) return;
  try{
    var t = actx.currentTime;
    for(var i=0;i<3;i++){
      var osc = actx.createOscillator();
      var gain = actx.createGain();
      osc.type = 'square';
      var freq = 280 + Math.random()*120;
      osc.frequency.setValueAtTime(freq, t+i*0.07);
      osc.frequency.setValueAtTime(freq * 0.8, t+i*0.07+0.04);
      gain.gain.setValueAtTime(0.05, t+i*0.07);
      gain.gain.exponentialRampToValueAtTime(0.001, t+i*0.07+0.06);
      osc.connect(gain); gain.connect(actx.destination);
      osc.start(t+i*0.07); osc.stop(t+i*0.07+0.07);
    }
  }catch(e){}
}

function sfxKill(){
  if(!actx) return;
  try{
    var t = actx.currentTime;
    var notes = [523, 659, 784];
    for(var i=0;i<3;i++){
      var osc = actx.createOscillator();
      var gain = actx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(notes[i], t+i*0.08);
      gain.gain.setValueAtTime(0.08, t+i*0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, t+i*0.08+0.15);
      osc.connect(gain); gain.connect(actx.destination);
      osc.start(t+i*0.08); osc.stop(t+i*0.08+0.16);
    }
  }catch(e){}
}

function sfxDeath(){
  if(!actx) return;
  try{
    var t = actx.currentTime;
    var osc = actx.createOscillator();
    var gain = actx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(400, t);
    osc.frequency.exponentialRampToValueAtTime(60, t+0.6);
    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t+0.6);
    osc.connect(gain); gain.connect(actx.destination);
    osc.start(t); osc.stop(t+0.65);
  }catch(e){}
}

function sfxLevelUp(){
  if(!actx) return;
  try{
    var t = actx.currentTime;
    var notes = [523, 659, 784, 1047];
    for(var i=0;i<4;i++){
      var osc = actx.createOscillator();
      var gain = actx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(notes[i], t+i*0.1);
      gain.gain.setValueAtTime(0.1, t+i*0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, t+i*0.1+0.2);
      osc.connect(gain); gain.connect(actx.destination);
      osc.start(t+i*0.1); osc.stop(t+i*0.1+0.22);
    }
  }catch(e){}
}

/* ═══════════════════════════════════════════════
   PROCEDURAL PIXEL ART — Canvas2D Textures
   ═══════════════════════════════════════════════ */
var T = 32; // tile size

function makeCanvas(w, h){
  var c = document.createElement('canvas');
  c.width = w; c.height = h;
  return c;
}

// ── Grass tile (with variation) ──
function drawGrassTile(variant){
  var c = makeCanvas(T, T);
  var ctx = c.getContext('2d');
  // base
  var g = ctx.createLinearGradient(0,0,0,T);
  g.addColorStop(0, '#2d5a1e');
  g.addColorStop(1, '#1a3d12');
  ctx.fillStyle = g;
  ctx.fillRect(0,0,T,T);
  // grass blades
  ctx.fillStyle = '#3d7a2e';
  var seed = variant * 7;
  for(var i=0;i<6;i++){
    var x = ((seed + i*13)%29) + 1;
    var y = ((seed + i*17)%25) + 3;
    ctx.fillRect(x, y, 1, 3);
  }
  ctx.fillStyle = '#4a8a3a';
  for(var i=0;i<4;i++){
    var x = ((seed + i*19)%27) + 2;
    var y = ((seed + i*23)%22) + 5;
    ctx.fillRect(x, y, 1, 2);
  }
  return c;
}

// ── Dirt path tile ──
function drawDirtTile(){
  var c = makeCanvas(T, T);
  var ctx = c.getContext('2d');
  var g = ctx.createLinearGradient(0,0,T,T);
  g.addColorStop(0, '#8b6914');
  g.addColorStop(0.5, '#7a5c12');
  g.addColorStop(1, '#6b4e10');
  ctx.fillStyle = g;
  ctx.fillRect(0,0,T,T);
  // pebbles
  ctx.fillStyle = '#9a7a24';
  ctx.fillRect(5, 8, 2, 2);
  ctx.fillRect(18, 20, 2, 1);
  ctx.fillRect(25, 6, 1, 2);
  return c;
}

// ── Water tile ──
function drawWaterTile(){
  var c = makeCanvas(T, T);
  var ctx = c.getContext('2d');
  var g = ctx.createRadialGradient(T/2,T/2,2, T/2,T/2,T*0.7);
  g.addColorStop(0, '#1a5fa8');
  g.addColorStop(1, '#0e3a6a');
  ctx.fillStyle = g;
  ctx.fillRect(0,0,T,T);
  // wave highlights
  ctx.fillStyle = 'rgba(100,180,255,0.3)';
  ctx.fillRect(4,10,8,1);
  ctx.fillRect(16,18,7,1);
  ctx.fillRect(8,26,6,1);
  return c;
}

// ── Tree ──
function drawTree(){
  var c = makeCanvas(T, T*2);
  var ctx = c.getContext('2d');
  // trunk
  ctx.fillStyle = '#5a3a1a';
  ctx.fillRect(13, T+4, 6, T-4);
  // canopy layers
  var colors = ['#1a5a20','#2a7a30','#1e6a25'];
  for(var i=0;i<3;i++){
    ctx.fillStyle = colors[i];
    var y = T - 8 + i*8;
    var w = 24 - i*4;
    var x = (T-w)/2;
    ctx.fillRect(x, y-8, w, 12);
  }
  // highlights
  ctx.fillStyle = '#3a9a40';
  ctx.fillRect(10, T-6, 3, 2);
  ctx.fillRect(18, T+2, 4, 2);
  return c;
}

// ── House ──
function drawHouse(){
  var c = makeCanvas(T*2, T*2);
  var ctx = c.getContext('2d');
  // wall
  var g = ctx.createLinearGradient(0,T*0.5,0,T*2);
  g.addColorStop(0, '#c8a868');
  g.addColorStop(1, '#a88848');
  ctx.fillStyle = g;
  ctx.fillRect(8, T*0.7, T*2-16, T*1.3);
  // roof
  ctx.fillStyle = '#8b2020';
  ctx.beginPath();
  ctx.moveTo(4, T*0.7);
  ctx.lineTo(T, 4);
  ctx.lineTo(T*2-4, T*0.7);
  ctx.closePath();
  ctx.fill();
  // roof highlight
  ctx.fillStyle = '#a83030';
  ctx.beginPath();
  ctx.moveTo(8, T*0.7);
  ctx.lineTo(T, 8);
  ctx.lineTo(T+8, T*0.5);
  ctx.lineTo(8, T*0.7);
  ctx.closePath();
  ctx.fill();
  // door
  ctx.fillStyle = '#5a3a1a';
  ctx.fillRect(T-5, T*1.3, 10, T*0.7);
  // window
  ctx.fillStyle = '#6ac0e8';
  ctx.fillRect(16, T, 8, 8);
  ctx.fillRect(T+8, T, 8, 8);
  // window cross
  ctx.fillStyle = '#5a3a1a';
  ctx.fillRect(19, T, 2, 8);
  ctx.fillRect(16, T+3, 8, 2);
  ctx.fillRect(T+11, T, 2, 8);
  ctx.fillRect(T+8, T+3, 8, 2);
  return c;
}

// ── Stone wall (collision) ──
function drawStoneWall(){
  var c = makeCanvas(T, T);
  var ctx = c.getContext('2d');
  var g = ctx.createLinearGradient(0,0,0,T);
  g.addColorStop(0, '#7a7a7a');
  g.addColorStop(1, '#4a4a4a');
  ctx.fillStyle = g;
  ctx.fillRect(0,0,T,T);
  // brick lines
  ctx.strokeStyle = '#3a3a3a';
  ctx.lineWidth = 1;
  ctx.strokeRect(0, 0, T/2, T/2);
  ctx.strokeRect(T/2, 0, T/2, T/2);
  ctx.strokeRect(T/4, T/2, T/2, T/2);
  return c;
}

// ── Player sprite (4 directions × 2 frames) ──
function drawPlayer(dir, frame){
  var c = makeCanvas(T, T);
  var ctx = c.getContext('2d');
  // body color (일랜시아 감성 — 파란 옷)
  var bodyG = ctx.createLinearGradient(8,8,24,28);
  bodyG.addColorStop(0, '#4488cc');
  bodyG.addColorStop(1, '#2266aa');
  // hair
  ctx.fillStyle = '#3a2a1a';
  ctx.fillRect(11, 3, 10, 6);
  // skin
  ctx.fillStyle = '#f0c8a0';
  // face
  ctx.fillRect(12, 7, 8, 7);
  // body
  ctx.fillStyle = bodyG;
  ctx.fillRect(10, 14, 12, 10);
  // belt
  ctx.fillStyle = '#8b6914';
  ctx.fillRect(10, 21, 12, 2);
  // legs
  var legOff = frame === 1 ? 2 : 0;
  ctx.fillStyle = '#2a4a6a';
  ctx.fillRect(11 + legOff, 24, 4, 5);
  ctx.fillRect(17 - legOff, 24, 4, 5);
  // boots
  ctx.fillStyle = '#5a3a1a';
  ctx.fillRect(11 + legOff, 28, 4, 3);
  ctx.fillRect(17 - legOff, 28, 4, 3);
  // eyes based on direction
  ctx.fillStyle = '#1a1a1a';
  if(dir === 0){ // down
    ctx.fillRect(14, 10, 2, 2);
    ctx.fillRect(18, 10, 2, 2);
  } else if(dir === 1){ // left
    ctx.fillRect(12, 10, 2, 2);
    ctx.fillRect(16, 10, 2, 2);
  } else if(dir === 2){ // right
    ctx.fillRect(16, 10, 2, 2);
    ctx.fillRect(20, 10, 2, 2);
  } else { // up
    // no eyes visible from behind
    ctx.fillStyle = '#3a2a1a';
    ctx.fillRect(12, 7, 8, 8); // hair covers face
  }
  // arms
  ctx.fillStyle = '#f0c8a0';
  var armOff = frame === 1 ? 1 : 0;
  ctx.fillRect(8, 15 + armOff, 2, 6);
  ctx.fillRect(22, 15 - armOff, 2, 6);
  return c;
}

// ── NPC sprite ──
function drawNPC(){
  var c = makeCanvas(T, T);
  var ctx = c.getContext('2d');
  // hat
  ctx.fillStyle = '#cc4444';
  ctx.fillRect(9, 1, 14, 4);
  ctx.fillRect(7, 4, 18, 3);
  // hair
  ctx.fillStyle = '#e0c040';
  ctx.fillRect(11, 5, 10, 4);
  // face
  ctx.fillStyle = '#f0c8a0';
  ctx.fillRect(12, 7, 8, 7);
  // eyes
  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(14, 10, 2, 2);
  ctx.fillRect(18, 10, 2, 2);
  // mouth (smile)
  ctx.fillStyle = '#cc6060';
  ctx.fillRect(15, 12, 4, 1);
  // robe (바람의나라 NPC 감성 — 빨간 로브)
  var robeG = ctx.createLinearGradient(8,14,24,30);
  robeG.addColorStop(0, '#cc3333');
  robeG.addColorStop(1, '#881818');
  ctx.fillStyle = robeG;
  ctx.fillRect(10, 14, 12, 12);
  // robe detail
  ctx.fillStyle = '#e8c040';
  ctx.fillRect(15, 14, 2, 12);
  // feet
  ctx.fillStyle = '#5a3a1a';
  ctx.fillRect(11, 26, 4, 3);
  ctx.fillRect(17, 26, 4, 3);
  return c;
}

// ── Monster sprites ──
function drawSlime(color1, color2, eyeColor){
  var c = makeCanvas(T, T);
  var ctx = c.getContext('2d');
  var g = ctx.createRadialGradient(T/2, T/2+4, 2, T/2, T/2, T*0.45);
  g.addColorStop(0, color1);
  g.addColorStop(1, color2);
  ctx.fillStyle = g;
  // blob shape
  ctx.beginPath();
  ctx.ellipse(T/2, T/2+4, 12, 10, 0, 0, Math.PI*2);
  ctx.fill();
  // bottom bumps
  ctx.beginPath();
  ctx.ellipse(T/2-5, T/2+12, 5, 4, 0, 0, Math.PI);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(T/2+5, T/2+12, 5, 4, 0, 0, Math.PI);
  ctx.fill();
  // eyes
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(12, T/2, 4, 4);
  ctx.fillRect(19, T/2, 4, 4);
  ctx.fillStyle = eyeColor || '#1a1a1a';
  ctx.fillRect(14, T/2+1, 2, 3);
  ctx.fillRect(21, T/2+1, 2, 3);
  // shine
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.fillRect(12, T/2-4, 3, 2);
  return c;
}

function drawSkeleton(){
  var c = makeCanvas(T, T);
  var ctx = c.getContext('2d');
  // skull
  ctx.fillStyle = '#e8e0d0';
  ctx.fillRect(11, 2, 10, 9);
  ctx.fillRect(12, 1, 8, 1);
  // eye sockets
  ctx.fillStyle = '#1a0a2e';
  ctx.fillRect(13, 5, 3, 3);
  ctx.fillRect(18, 5, 3, 3);
  // eye glow
  ctx.fillStyle = '#ff4444';
  ctx.fillRect(14, 6, 1, 1);
  ctx.fillRect(19, 6, 1, 1);
  // teeth
  ctx.fillStyle = '#e8e0d0';
  ctx.fillRect(14, 9, 2, 2);
  ctx.fillRect(17, 9, 2, 2);
  // spine
  ctx.fillStyle = '#d0c8b8';
  ctx.fillRect(15, 11, 2, 3);
  // ribcage
  ctx.fillStyle = '#d0c8b8';
  ctx.fillRect(10, 14, 12, 2);
  ctx.fillRect(11, 16, 10, 1);
  ctx.fillRect(10, 17, 12, 2);
  // arms (bone)
  ctx.fillStyle = '#d0c8b8';
  ctx.fillRect(7, 14, 3, 2);
  ctx.fillRect(5, 16, 3, 6);
  ctx.fillRect(22, 14, 3, 2);
  ctx.fillRect(24, 16, 3, 6);
  // pelvis + legs
  ctx.fillStyle = '#d0c8b8';
  ctx.fillRect(12, 19, 8, 2);
  ctx.fillRect(12, 21, 3, 6);
  ctx.fillRect(17, 21, 3, 6);
  // feet
  ctx.fillRect(11, 27, 5, 2);
  ctx.fillRect(16, 27, 5, 2);
  return c;
}

// ── Sword slash effect ──
function drawSlash(){
  var c = makeCanvas(T*2, T*2);
  var ctx = c.getContext('2d');
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 3;
  ctx.shadowColor = '#ffcc44';
  ctx.shadowBlur = 8;
  ctx.beginPath();
  ctx.arc(T, T, T*0.6, -Math.PI*0.3, Math.PI*0.3);
  ctx.stroke();
  ctx.strokeStyle = '#ffcc44';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(T, T, T*0.5, -Math.PI*0.2, Math.PI*0.2);
  ctx.stroke();
  return c;
}

// ── Heart icon ──
function drawHeart(full){
  var c = makeCanvas(12, 12);
  var ctx = c.getContext('2d');
  ctx.fillStyle = full ? '#ff3344' : '#4a2a2a';
  // pixel heart
  var h = [
    '  **  **  ',
    ' ******** ',
    '**********',
    '**********',
    ' ******** ',
    '  ******  ',
    '   ****   ',
    '    **    ',
  ];
  for(var y=0;y<h.length;y++){
    for(var x=0;x<h[y].length;x++){
      if(h[y][x]==='*') ctx.fillRect(x+1, y+1, 1, 1);
    }
  }
  if(full){
    ctx.fillStyle = 'rgba(255,200,200,0.5)';
    ctx.fillRect(3, 2, 2, 2);
  }
  return c;
}

/* ═══════════════════════════════════════════════
   TILE MAP — 20×15 grid (640×480 logical)
   ═══════════════════════════════════════════════ */
var MAP_W = 20;
var MAP_H = 15;
// 0=grass, 1=dirt, 2=water, 3=wall, 4=tree, 5=house(anchor), 6=npc_spot
var TILEMAP = [
  [3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3],
  [3,0,0,0,0,4,0,0,0,1,1,0,0,0,4,0,0,0,0,3],
  [3,0,0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0,0,3],
  [3,0,4,0,0,0,0,1,1,5,0,1,1,0,0,0,4,0,0,3],
  [3,0,0,0,0,0,0,1,0,0,0,0,1,0,0,0,0,0,0,3],
  [3,0,0,0,0,0,1,1,0,6,0,0,1,1,0,0,0,0,0,3],
  [3,0,4,0,0,1,1,0,0,0,0,0,0,1,1,0,0,4,0,3],
  [3,0,0,0,1,1,0,0,0,0,0,0,0,0,1,1,0,0,0,3],
  [3,0,0,1,1,0,0,0,0,0,0,0,0,0,0,1,0,0,0,3],
  [3,2,2,1,0,0,0,4,0,0,0,4,0,0,0,1,0,0,0,3],
  [3,2,2,2,0,0,0,0,0,0,0,0,0,0,1,1,0,4,0,3],
  [3,0,2,2,2,0,0,0,0,0,0,0,0,1,1,0,0,0,0,3],
  [3,0,0,2,0,0,4,0,0,0,0,4,0,0,0,0,0,0,0,3],
  [3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3],
  [3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3],
];

function isBlocked(tx, ty){
  if(tx<0||ty<0||tx>=MAP_W||ty>=MAP_H) return true;
  var t = TILEMAP[ty][tx];
  return t===2||t===3||t===4||t===5;
}

/* ═══════════════════════════════════════════════
   PHASER GAME
   ═══════════════════════════════════════════════ */
var GW = MAP_W * T; // 640
var GH = MAP_H * T; // 480

var config = {
  type: Phaser.AUTO,
  width: GW,
  height: GH,
  parent: document.body,
  backgroundColor: '#1a0e2e',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: { preload: preload, create: create, update: update },
};

var game = new Phaser.Game(config);

// ── State ──
var player, cursors, wasd;
var playerDir = 0; // 0=down,1=left,2=right,3=up
var playerFrame = 0;
var stepTimer = 0;
var moving = false;

var playerHP = 10;
var playerMaxHP = 10;
var playerATK = 3;
var playerLv = 1;
var playerEXP = 0;
var playerKills = 0;

var npcSprite, npcDialog = null;
var dialogText = '';
var dialogTimer = 0;
var dialogLines = [
  '용사여, 잘 왔도다.\\n이 마을에 몬스터가 나타났다!',
  '마을 주변의 슬라임과 스켈레톤을\\n물리쳐주겠는가?',
  '조심해라, 스켈레톤은 강하다.\\n체력이 떨어지면 돌아오거라.',
  '그대의 무운을 빈다!',
];
var dialogIndex = 0;
var dialogActive = false;

var monsters = [];
var battleActive = false;
var battleMonster = null;
var battleAnim = 0;
var battlePlayerTurn = true;
var battleMsg = '';
var battleMsgTimer = 0;

var damageNumbers = [];
var screenFlash = 0;

// cached textures
var texGrass = [], texDirt, texWater, texWall, texTree, texHouse;
var texPlayer = []; // [dir][frame]
var texNPC, texSlash;
var texMonsters = {};
var texHeartFull, texHeartEmpty;

function preload(){}

function create(){
  var scene = this;
  ensureAudio();

  // Build textures
  for(var i=0;i<4;i++) texGrass.push(scene.textures.addCanvas('grass'+i, drawGrassTile(i)).getSourceImage());
  texDirt = scene.textures.addCanvas('dirt', drawDirtTile()).getSourceImage();
  texWater = scene.textures.addCanvas('water', drawWaterTile()).getSourceImage();
  texWall = scene.textures.addCanvas('wall', drawStoneWall()).getSourceImage();
  texTree = scene.textures.addCanvas('tree', drawTree()).getSourceImage();
  texHouse = scene.textures.addCanvas('house', drawHouse()).getSourceImage();

  // Player textures
  for(var d=0;d<4;d++){
    texPlayer[d] = [];
    for(var f=0;f<2;f++){
      texPlayer[d][f] = scene.textures.addCanvas('p'+d+'_'+f, drawPlayer(d, f)).getSourceImage();
    }
  }

  texNPC = scene.textures.addCanvas('npc', drawNPC()).getSourceImage();
  texSlash = scene.textures.addCanvas('slash', drawSlash()).getSourceImage();

  // Monster textures
  texMonsters.greenSlime = scene.textures.addCanvas('greenSlime', drawSlime('#44cc44','#228822')).getSourceImage();
  texMonsters.blueSlime = scene.textures.addCanvas('blueSlime', drawSlime('#4488ee','#2255aa','#ff4444')).getSourceImage();
  texMonsters.skeleton = scene.textures.addCanvas('skeleton', drawSkeleton()).getSourceImage();

  texHeartFull = scene.textures.addCanvas('hFull', drawHeart(true)).getSourceImage();
  texHeartEmpty = scene.textures.addCanvas('hEmpty', drawHeart(false)).getSourceImage();

  // input
  cursors = scene.input.keyboard.createCursorKeys();
  wasd = scene.input.keyboard.addKeys('W,A,S,D');

  // spawn player at center dirt path
  player = { tx: 9, ty: 7, x: 9*T, y: 7*T, targetX: 9*T, targetY: 7*T, speed: 120 };

  // NPC position (from map marker)
  npcSprite = { tx: 9, ty: 5, x: 9*T, y: 5*T };

  // Spawn monsters
  spawnMonsters();

  // touch controls (handled by gameExtensions but also native)
  scene.input.on('pointerdown', function(ptr){
    ensureAudio();
    if(window.gameOver){
      restartGame();
      return;
    }
    if(battleActive){
      handleBattleInput();
      return;
    }
    if(dialogActive){
      advanceDialog();
      return;
    }
    // touch-to-move: determine direction
    var dx = ptr.x - (player.x + T/2);
    var dy = ptr.y - (player.y + T/2);
    if(Math.abs(dx) > Math.abs(dy)){
      if(dx > 0) tryMove(1, 0);
      else tryMove(-1, 0);
    } else {
      if(dy > 0) tryMove(0, 1);
      else tryMove(0, -1);
    }
  });

  // space / enter for interact
  scene.input.keyboard.on('keydown-SPACE', function(){
    ensureAudio();
    if(battleActive) handleBattleInput();
    else if(dialogActive) advanceDialog();
    else tryInteract();
  });
}

function spawnMonsters(){
  monsters = [];
  // Green slime
  monsters.push({ type:'greenSlime', name:'초록 슬라임', tx:3, ty:8, hp:5, maxHp:5, atk:1, exp:3, alive:true });
  // Blue slime
  monsters.push({ type:'blueSlime', name:'파랑 슬라임', tx:16, ty:4, hp:8, maxHp:8, atk:2, exp:5, alive:true });
  // Skeleton
  monsters.push({ type:'skeleton', name:'스켈레톤', tx:14, ty:10, hp:15, maxHp:15, atk:4, exp:10, alive:true });
  // set pixel positions
  for(var i=0;i<monsters.length;i++){
    monsters[i].x = monsters[i].tx * T;
    monsters[i].y = monsters[i].ty * T;
    monsters[i].bobTimer = Math.random() * Math.PI * 2;
  }
}

function tryMove(dx, dy){
  if(battleActive || dialogActive || window.gameOver) return;
  // set direction
  if(dx < 0) playerDir = 1;
  else if(dx > 0) playerDir = 2;
  else if(dy < 0) playerDir = 3;
  else playerDir = 0;

  var ntx = player.tx + dx;
  var nty = player.ty + dy;

  // check NPC collision
  if(ntx === npcSprite.tx && nty === npcSprite.ty){
    startDialog();
    return;
  }

  // check monster collision
  for(var i=0;i<monsters.length;i++){
    if(monsters[i].alive && ntx === monsters[i].tx && nty === monsters[i].ty){
      startBattle(monsters[i]);
      return;
    }
  }

  if(!isBlocked(ntx, nty)){
    player.tx = ntx;
    player.ty = nty;
    player.targetX = ntx * T;
    player.targetY = nty * T;
    moving = true;
    playerFrame = playerFrame === 0 ? 1 : 0;
    sfxStep();
  }
}

function tryInteract(){
  // check if facing NPC
  var dx = [0,-1,1,0][playerDir];
  var dy = [1,0,0,-1][playerDir];
  var fx = player.tx + dx;
  var fy = player.ty + dy;
  if(fx === npcSprite.tx && fy === npcSprite.ty){
    startDialog();
    return;
  }
  // check if facing monster
  for(var i=0;i<monsters.length;i++){
    if(monsters[i].alive && fx === monsters[i].tx && fy === monsters[i].ty){
      startBattle(monsters[i]);
      return;
    }
  }
}

// ── Dialog System ──
function startDialog(){
  if(dialogActive) return;
  dialogActive = true;
  dialogIndex = 0;

  // check if all monsters dead → victory dialog
  var allDead = true;
  for(var i=0;i<monsters.length;i++) if(monsters[i].alive) allDead = false;
  if(allDead){
    dialogLines = [
      '대단하구나, 용사여!\\n모든 몬스터를 물리쳤다!',
      'Lv.' + playerLv + ' — ' + playerKills + '마리 처치!\\n마을에 평화가 찾아왔도다.',
      '다시 도전하고 싶다면\\n아무 곳이나 터치하여라.',
    ];
  } else if(playerHP < playerMaxHP){
    dialogLines = [
      '용사여, 상처를 입었구나.\\n내가 치료해주마.',
      '...... 치유의 빛이여!',
    ];
    playerHP = playerMaxHP;
  } else {
    dialogLines = [
      '용사여, 잘 왔도다.\\n이 마을에 몬스터가 나타났다!',
      '마을 주변의 슬라임과 스켈레톤을\\n물리쳐주겠는가?',
      '조심해라, 스켈레톤은 강하다.\\n체력이 떨어지면 돌아오거라.',
      '그대의 무운을 빈다!',
    ];
  }

  dialogText = dialogLines[0];
  sfxTalk();
}

function advanceDialog(){
  dialogIndex++;
  if(dialogIndex >= dialogLines.length){
    dialogActive = false;
    dialogText = '';
    return;
  }
  dialogText = dialogLines[dialogIndex];
  sfxTalk();
}

// ── Battle System ──
function startBattle(mon){
  battleActive = true;
  battleMonster = mon;
  battlePlayerTurn = true;
  battleAnim = 0;
  battleMsg = mon.name + '이(가) 나타났다!';
  battleMsgTimer = 60;
  sfxAttack();
}

function handleBattleInput(){
  if(!battleActive || !battlePlayerTurn || battleMsgTimer > 0) return;

  // Player attacks
  var dmg = playerATK + Math.floor(Math.random() * 2);
  battleMonster.hp -= dmg;
  battleMsg = playerATK + ' + ' + (dmg - playerATK) + ' = ' + dmg + ' 데미지!';
  battleMsgTimer = 40;
  battleAnim = 10;
  sfxAttack();

  // damage number
  damageNumbers.push({
    x: battleMonster.x + T/2, y: battleMonster.y - 8,
    text: '-' + dmg, color: '#ffcc44', life: 40
  });

  if(battleMonster.hp <= 0){
    battleMonster.hp = 0;
    battleMonster.alive = false;
    battleMsg = battleMonster.name + ' 처치! +' + battleMonster.exp + ' EXP';
    battleMsgTimer = 60;
    playerEXP += battleMonster.exp;
    playerKills++;
    window.score = playerKills;
    sfxKill();

    // level up check
    var needed = playerLv * 8;
    if(playerEXP >= needed){
      playerLv++;
      playerEXP -= needed;
      playerMaxHP += 3;
      playerHP = playerMaxHP;
      playerATK += 1;
      battleMsg += '\\nLEVEL UP! Lv.' + playerLv;
      sfxLevelUp();
    }

    // check all dead
    var allDead = true;
    for(var i=0;i<monsters.length;i++) if(monsters[i].alive) allDead = false;
    if(allDead){
      battleMsg += '\\n모든 몬스터를 처치했다!';
    }

    setTimeout(function(){ battleActive = false; battleMonster = null; }, 1200);
    return;
  }

  // Monster turn after delay
  battlePlayerTurn = false;
  setTimeout(function(){
    if(!battleActive) return;
    var monDmg = battleMonster.atk + Math.floor(Math.random() * 2);
    playerHP -= monDmg;
    battleMsg = battleMonster.name + '의 공격! ' + monDmg + ' 데미지!';
    battleMsgTimer = 40;
    screenFlash = 8;
    sfxHit();

    damageNumbers.push({
      x: player.x + T/2, y: player.y - 8,
      text: '-' + monDmg, color: '#ff4444', life: 40
    });

    if(playerHP <= 0){
      playerHP = 0;
      window.gameOver = true;
      window.score = playerKills;
      battleMsg = '용사가 쓰러졌다...';
      battleMsgTimer = 120;
      sfxDeath();

      try{
        window.parent.postMessage({ type: 'gameOver', score: playerKills }, '*');
      }catch(e){}

      setTimeout(function(){ battleActive = false; }, 2000);
      return;
    }
    battlePlayerTurn = true;
  }, 800);
}

function restartGame(){
  window.gameOver = false;
  window.score = 0;
  playerHP = 10;
  playerMaxHP = 10;
  playerATK = 3;
  playerLv = 1;
  playerEXP = 0;
  playerKills = 0;
  player.tx = 9; player.ty = 7;
  player.x = 9*T; player.y = 7*T;
  player.targetX = 9*T; player.targetY = 7*T;
  playerDir = 0;
  dialogActive = false;
  battleActive = false;
  battleMonster = null;
  spawnMonsters();
}

function update(time, dt){
  if(!dt) dt = 16;
  var dtSec = dt / 1000;

  // smooth movement
  var spd = player.speed * dtSec * T / 8;
  if(Math.abs(player.x - player.targetX) > 1){
    player.x += (player.targetX - player.x > 0 ? 1 : -1) * Math.min(spd, Math.abs(player.targetX - player.x));
  } else {
    player.x = player.targetX;
  }
  if(Math.abs(player.y - player.targetY) > 1){
    player.y += (player.targetY - player.y > 0 ? 1 : -1) * Math.min(spd, Math.abs(player.targetY - player.y));
  } else {
    player.y = player.targetY;
  }

  // keyboard movement
  if(!battleActive && !dialogActive && !window.gameOver){
    stepTimer -= dt;
    if(stepTimer <= 0){
      var moved = false;
      if(cursors.left.isDown || wasd.A.isDown){ tryMove(-1, 0); moved = true; }
      else if(cursors.right.isDown || wasd.D.isDown){ tryMove(1, 0); moved = true; }
      else if(cursors.up.isDown || wasd.W.isDown){ tryMove(0, -1); moved = true; }
      else if(cursors.down.isDown || wasd.S.isDown){ tryMove(0, 1); moved = true; }
      if(moved) stepTimer = 150; // movement repeat delay
    }
  }

  // monster bob
  for(var i=0;i<monsters.length;i++){
    if(monsters[i].alive) monsters[i].bobTimer += dtSec * 2.5;
  }

  // battle anim
  if(battleAnim > 0) battleAnim--;
  if(battleMsgTimer > 0) battleMsgTimer--;
  if(screenFlash > 0) screenFlash--;

  // damage numbers
  for(var i=damageNumbers.length-1;i>=0;i--){
    damageNumbers[i].y -= dtSec * 30;
    damageNumbers[i].life--;
    if(damageNumbers[i].life <= 0) damageNumbers.splice(i, 1);
  }

  // ── RENDER ──
  var canvas = this.sys.game.canvas;
  var ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  // screen flash
  if(screenFlash > 0){
    ctx.fillStyle = 'rgba(255,50,50,' + (screenFlash/8*0.3) + ')';
    ctx.fillRect(0, 0, GW, GH);
  }

  // draw tilemap
  for(var ty=0;ty<MAP_H;ty++){
    for(var tx=0;tx<MAP_W;tx++){
      var tile = TILEMAP[ty][tx];
      var px = tx * T;
      var py = ty * T;
      // base grass under everything
      ctx.drawImage(texGrass[(tx+ty*3)%4], px, py, T, T);

      if(tile===1) ctx.drawImage(texDirt, px, py, T, T);
      else if(tile===2) ctx.drawImage(texWater, px, py, T, T);
      else if(tile===3) ctx.drawImage(texWall, px, py, T, T);
      else if(tile===4) ctx.drawImage(texTree, px, py - T, T, T*2);
      else if(tile===5) ctx.drawImage(texHouse, px - T/2, py - T, T*2, T*2);
    }
  }

  // NPC
  ctx.drawImage(texNPC, npcSprite.x, npcSprite.y, T, T);
  // NPC indicator (!)
  if(!dialogActive){
    var bounce = Math.sin(Date.now()/300) * 3;
    ctx.fillStyle = '#ffcc00';
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('!', npcSprite.x + T/2, npcSprite.y - 6 + bounce);
  }

  // Monsters
  for(var i=0;i<monsters.length;i++){
    var m = monsters[i];
    if(!m.alive) continue;
    var bob = Math.sin(m.bobTimer) * 2;
    var tex = texMonsters[m.type];
    ctx.drawImage(tex, m.x, m.y + bob, T, T);

    // HP bar above monster
    var hpRatio = m.hp / m.maxHp;
    ctx.fillStyle = '#333333';
    ctx.fillRect(m.x + 4, m.y - 6, T-8, 4);
    ctx.fillStyle = hpRatio > 0.5 ? '#44cc44' : hpRatio > 0.25 ? '#cccc44' : '#cc4444';
    ctx.fillRect(m.x + 4, m.y - 6, (T-8)*hpRatio, 4);
  }

  // Player
  ctx.drawImage(texPlayer[playerDir][playerFrame], player.x, player.y, T, T);

  // Battle slash animation
  if(battleAnim > 0 && battleMonster){
    ctx.globalAlpha = battleAnim / 10;
    ctx.drawImage(texSlash, battleMonster.x - T/2, battleMonster.y - T/2, T*2, T*2);
    ctx.globalAlpha = 1;
  }

  // Damage numbers
  for(var i=0;i<damageNumbers.length;i++){
    var dn = damageNumbers[i];
    ctx.globalAlpha = Math.min(1, dn.life / 15);
    ctx.fillStyle = dn.color;
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(dn.text, dn.x, dn.y);
    ctx.globalAlpha = 1;
  }

  // ── HUD ──
  // HP hearts
  for(var i=0;i<playerMaxHP;i++){
    var hx = 8 + i * 14;
    var hy = 8;
    if(i < playerHP) ctx.drawImage(texHeartFull, hx, hy, 12, 12);
    else ctx.drawImage(texHeartEmpty, hx, hy, 12, 12);
  }

  // Level / Kills
  ctx.fillStyle = '#ffffff';
  ctx.font = '12px monospace';
  ctx.textAlign = 'left';
  ctx.fillText('Lv.' + playerLv + '  ATK:' + playerATK + '  EXP:' + playerEXP + '/' + (playerLv*8), 8, 34);
  ctx.fillText('KILLS: ' + playerKills, 8, 48);

  // ── Dialog Box ──
  if(dialogActive && dialogText){
    // semi-transparent box
    ctx.fillStyle = 'rgba(10,5,30,0.92)';
    var boxY = GH - 110;
    var boxH = 100;
    ctx.fillRect(16, boxY, GW-32, boxH);
    // border
    ctx.strokeStyle = '#8b6914';
    ctx.lineWidth = 2;
    ctx.strokeRect(16, boxY, GW-32, boxH);
    // inner border
    ctx.strokeStyle = '#c8a040';
    ctx.lineWidth = 1;
    ctx.strokeRect(20, boxY+4, GW-40, boxH-8);
    // NPC name
    ctx.fillStyle = '#ffcc44';
    ctx.font = 'bold 13px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('마을 장로', 32, boxY + 20);
    // dialog text
    ctx.fillStyle = '#e8e0d0';
    ctx.font = '12px monospace';
    var lines = dialogText.split('\\\\n');
    for(var i=0;i<lines.length;i++){
      ctx.fillText(lines[i], 32, boxY + 40 + i*18);
    }
    // continue indicator
    var blink = Math.sin(Date.now()/300) > 0;
    if(blink){
      ctx.fillStyle = '#ffcc44';
      ctx.fillText('▼', GW - 48, boxY + boxH - 14);
    }
  }

  // ── Battle UI ──
  if(battleActive && battleMonster){
    // darken edges
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(0, 0, GW, GH);

    // battle message
    if(battleMsg){
      ctx.fillStyle = 'rgba(10,5,30,0.9)';
      ctx.fillRect(GW/2-160, GH/2-30, 320, 60);
      ctx.strokeStyle = '#cc4444';
      ctx.lineWidth = 2;
      ctx.strokeRect(GW/2-160, GH/2-30, 320, 60);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 13px monospace';
      ctx.textAlign = 'center';
      var bLines = battleMsg.split('\\\\n');
      for(var i=0;i<bLines.length;i++){
        ctx.fillText(bLines[i], GW/2, GH/2 - 5 + i*18);
      }
    }

    // monster HP
    if(battleMonster.alive){
      ctx.fillStyle = '#ffffff';
      ctx.font = '11px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(battleMonster.name + ' HP: ' + battleMonster.hp + '/' + battleMonster.maxHp, GW/2, GH/2 - 45);
    }

    // "tap to attack" prompt
    if(battlePlayerTurn && battleMsgTimer <= 0 && battleMonster.alive){
      var blink2 = Math.sin(Date.now()/200) > 0;
      if(blink2){
        ctx.fillStyle = '#ffcc44';
        ctx.font = 'bold 12px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('[ 터치하여 공격 ]', GW/2, GH/2 + 50);
      }
    }
  }

  // ── GAME OVER ──
  if(window.gameOver){
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0,0,GW,GH);

    ctx.fillStyle = '#ff4444';
    ctx.font = 'bold 28px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', GW/2, GH/2 - 30);

    ctx.fillStyle = '#ffffff';
    ctx.font = '16px monospace';
    ctx.fillText('Lv.' + playerLv + '  처치: ' + playerKills + '마리', GW/2, GH/2 + 10);

    ctx.fillStyle = '#aaaaaa';
    ctx.font = '13px monospace';
    ctx.fillText('터치하여 재시작', GW/2, GH/2 + 40);
  }

  // ── Mini instruction (first few seconds) ──
  if(!window.gameOver && !battleActive && !dialogActive && playerKills === 0){
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.font = '11px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('방향키/WASD: 이동 | NPC/몬스터에게 다가가기', GW/2, GH - 12);
  }
}

})();
</script>
</body>
</html>`;
