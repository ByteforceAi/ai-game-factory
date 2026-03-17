export const NEON_SHOOTER_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0,user-scalable=no,maximum-scale=1.0">
<title>Neon Space Shooter</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:100%;height:100%;overflow:hidden;background:#000;touch-action:none}
canvas{display:block}
</style>
</head>
<body>
<script src="https://cdn.jsdelivr.net/npm/phaser@3.80.1/dist/phaser.min.js"></script>
<script>
'use strict';
(function(){

/* ═══════════════════════════════════════════════
   PROCEDURAL AUDIO ENGINE (Web Audio API)
   ═══════════════════════════════════════════════ */
var AudioCtx = window.AudioContext || window.webkitAudioContext;
var actx = null;
function ensureAudio(){
  if(!actx){
    try{ actx = new AudioCtx(); } catch(e){ actx = null; }
  }
  if(actx && actx.state === 'suspended'){
    actx.resume().catch(function(){});
  }
}

function sfxLaser(){
  if(!actx) return;
  try{
    var t = actx.currentTime;
    var osc = actx.createOscillator();
    var gain = actx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(880, t);
    osc.frequency.exponentialRampToValueAtTime(220, t+0.08);
    gain.gain.setValueAtTime(0.08, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t+0.08);
    osc.connect(gain); gain.connect(actx.destination);
    osc.start(t); osc.stop(t+0.09);
  }catch(e){}
}

function sfxLaserSpread(){
  if(!actx) return;
  try{
    var t = actx.currentTime;
    var osc = actx.createOscillator();
    var osc2 = actx.createOscillator();
    var gain = actx.createGain();
    osc.type = 'sawtooth';
    osc2.type = 'square';
    osc.frequency.setValueAtTime(1200, t);
    osc.frequency.exponentialRampToValueAtTime(300, t+0.1);
    osc2.frequency.setValueAtTime(900, t);
    osc2.frequency.exponentialRampToValueAtTime(200, t+0.1);
    gain.gain.setValueAtTime(0.06, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t+0.1);
    osc.connect(gain); osc2.connect(gain); gain.connect(actx.destination);
    osc.start(t); osc.stop(t+0.11);
    osc2.start(t); osc2.stop(t+0.11);
  }catch(e){}
}

function sfxExplosion(big){
  if(!actx) return;
  try{
    var t = actx.currentTime;
    var dur = big ? 0.5 : 0.25;
    var vol = big ? 0.15 : 0.08;
    // noise burst via buffer
    var bufSize = Math.floor(actx.sampleRate * dur);
    var buf = actx.createBuffer(1, bufSize, actx.sampleRate);
    var data = buf.getChannelData(0);
    for(var i=0;i<bufSize;i++){
      data[i] = (Math.random()*2-1) * Math.pow(1 - i/bufSize, big ? 1.5 : 2.5);
    }
    var src = actx.createBufferSource();
    src.buffer = buf;
    // low-pass to make it "boomy"
    var filter = actx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(big ? 600 : 900, t);
    filter.frequency.exponentialRampToValueAtTime(80, t+dur);
    var gain = actx.createGain();
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t+dur);
    src.connect(filter); filter.connect(gain); gain.connect(actx.destination);
    src.start(t);
  }catch(e){}
}

function sfxPowerUp(){
  if(!actx) return;
  try{
    var t = actx.currentTime;
    var osc = actx.createOscillator();
    var gain = actx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, t);
    osc.frequency.exponentialRampToValueAtTime(1200, t+0.15);
    osc.frequency.exponentialRampToValueAtTime(800, t+0.3);
    gain.gain.setValueAtTime(0.1, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t+0.35);
    osc.connect(gain); gain.connect(actx.destination);
    osc.start(t); osc.stop(t+0.36);
  }catch(e){}
}

function sfxHit(){
  if(!actx) return;
  try{
    var t = actx.currentTime;
    var osc = actx.createOscillator();
    var gain = actx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(200, t);
    osc.frequency.exponentialRampToValueAtTime(60, t+0.12);
    gain.gain.setValueAtTime(0.1, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t+0.12);
    osc.connect(gain); gain.connect(actx.destination);
    osc.start(t); osc.stop(t+0.13);
  }catch(e){}
}

function sfxDamage(){
  if(!actx) return;
  try{
    var t = actx.currentTime;
    var bufSize = Math.floor(actx.sampleRate * 0.3);
    var buf = actx.createBuffer(1, bufSize, actx.sampleRate);
    var data = buf.getChannelData(0);
    for(var i=0;i<bufSize;i++){
      data[i] = (Math.random()*2-1) * Math.pow(1-i/bufSize, 1.2);
    }
    var src = actx.createBufferSource();
    src.buffer = buf;
    var filter = actx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1200, t);
    filter.frequency.exponentialRampToValueAtTime(100, t+0.3);
    var gain = actx.createGain();
    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t+0.3);
    src.connect(filter); filter.connect(gain); gain.connect(actx.destination);
    src.start(t);
  }catch(e){}
}

function sfxWaveStart(){
  if(!actx) return;
  try{
    var t = actx.currentTime;
    for(var i=0;i<3;i++){
      var osc = actx.createOscillator();
      var gain = actx.createGain();
      osc.type = 'sine';
      var st = t + i*0.08;
      osc.frequency.setValueAtTime(500 + i*200, st);
      osc.frequency.exponentialRampToValueAtTime(300 + i*200, st+0.15);
      gain.gain.setValueAtTime(0.06, st);
      gain.gain.exponentialRampToValueAtTime(0.001, st+0.15);
      osc.connect(gain); gain.connect(actx.destination);
      osc.start(st); osc.stop(st+0.16);
    }
  }catch(e){}
}

function sfxGameOver(){
  if(!actx) return;
  try{
    var t = actx.currentTime;
    var notes = [440, 370, 311, 261];
    for(var i=0;i<notes.length;i++){
      var osc = actx.createOscillator();
      var gain = actx.createGain();
      osc.type = 'sine';
      var st = t + i*0.25;
      osc.frequency.setValueAtTime(notes[i], st);
      gain.gain.setValueAtTime(0.08, st);
      gain.gain.exponentialRampToValueAtTime(0.001, st+0.3);
      osc.connect(gain); gain.connect(actx.destination);
      osc.start(st); osc.stop(st+0.31);
    }
  }catch(e){}
}

/* ───────── background beat ───────── */
var bgBeatInterval = null;
function startBgBeat(){
  if(!actx || bgBeatInterval) return;
  var bpm = 120;
  var beatIdx = 0;
  bgBeatInterval = setInterval(function(){
    if(!actx) return;
    try{
      var t = actx.currentTime;
      var osc = actx.createOscillator();
      var gain = actx.createGain();
      osc.type = 'sine';
      var freq = (beatIdx % 4 === 0 || beatIdx % 4 === 2) ? 55 : 44;
      osc.frequency.setValueAtTime(freq, t);
      osc.frequency.exponentialRampToValueAtTime(30, t+0.08);
      gain.gain.setValueAtTime(0.06, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t+0.1);
      osc.connect(gain); gain.connect(actx.destination);
      osc.start(t); osc.stop(t+0.12);
      if(beatIdx % 2 === 1){
        var bufSize = Math.floor(actx.sampleRate * 0.03);
        var buf = actx.createBuffer(1, bufSize, actx.sampleRate);
        var data = buf.getChannelData(0);
        for(var i=0;i<bufSize;i++) data[i]=(Math.random()*2-1)*Math.pow(1-i/bufSize,5);
        var src = actx.createBufferSource();
        src.buffer = buf;
        var hpf = actx.createBiquadFilter();
        hpf.type='highpass'; hpf.frequency.setValueAtTime(8000, t);
        var g2 = actx.createGain();
        g2.gain.setValueAtTime(0.03, t);
        g2.gain.exponentialRampToValueAtTime(0.001, t+0.03);
        src.connect(hpf); hpf.connect(g2); g2.connect(actx.destination);
        src.start(t);
      }
      beatIdx++;
    }catch(e){}
  }, 60000/bpm/2);
}

function stopBgBeat(){
  if(bgBeatInterval){ clearInterval(bgBeatInterval); bgBeatInterval=null; }
}

/* ───────── constants ───────── */
var W = window.innerWidth;
var H = window.innerHeight;
var CYAN    = 0x00ffff;
var MAGENTA = 0xff00ff;
var YELLOW  = 0xffff00;
var GREEN   = 0x00ff88;
var WHITE   = 0xffffff;
var RED     = 0xff3333;
var ORANGE  = 0xff8844;

/* ───────── helper: create ENHANCED neon textures ───────── */
function hexColor(c){ return '#'+c.toString(16).padStart(6,'0'); }

/* Ship with gradient glow + thruster nozzle */
function makeShipTex(scene, key, w, h, color){
  var can = document.createElement('canvas');
  can.width = w*2; can.height = h*2;
  var ctx = can.getContext('2d');
  var cx = w, cy = h;
  // outer glow
  var grad = ctx.createRadialGradient(cx, cy+h*0.2, 0, cx, cy+h*0.2, h);
  grad.addColorStop(0, hexColor(color)+'44');
  grad.addColorStop(1, hexColor(color)+'00');
  ctx.fillStyle = grad;
  ctx.fillRect(0,0,w*2,h*2);
  // ship body
  ctx.beginPath();
  ctx.moveTo(cx, 4);
  ctx.lineTo(cx+w*0.45, h*1.7);
  ctx.lineTo(cx, h*1.4);
  ctx.lineTo(cx-w*0.45, h*1.7);
  ctx.closePath();
  var bodyGrad = ctx.createLinearGradient(cx, 4, cx, h*1.7);
  bodyGrad.addColorStop(0, '#ffffff');
  bodyGrad.addColorStop(0.3, hexColor(color));
  bodyGrad.addColorStop(1, hexColor(color)+'66');
  ctx.fillStyle = bodyGrad;
  ctx.fill();
  ctx.strokeStyle = hexColor(color);
  ctx.lineWidth = 1.5;
  ctx.stroke();
  // cockpit highlight
  ctx.beginPath();
  ctx.moveTo(cx, 10);
  ctx.lineTo(cx+6, h*0.6);
  ctx.lineTo(cx, h*0.5);
  ctx.lineTo(cx-6, h*0.6);
  ctx.closePath();
  ctx.fillStyle = '#ffffff88';
  ctx.fill();
  scene.textures.addCanvas(key, can);
}

/* Enemy with pulsing gradient */
function makeDiamondTex(scene, key, s, color){
  var can = document.createElement('canvas');
  can.width = s*2; can.height = s*2;
  var ctx = can.getContext('2d');
  var cx=s, cy=s;
  // glow
  var grad = ctx.createRadialGradient(cx,cy,0,cx,cy,s);
  grad.addColorStop(0, hexColor(color)+'66');
  grad.addColorStop(1, hexColor(color)+'00');
  ctx.fillStyle = grad;
  ctx.fillRect(0,0,s*2,s*2);
  // diamond
  ctx.beginPath();
  ctx.moveTo(cx,cy-s*0.7);
  ctx.lineTo(cx+s*0.6,cy);
  ctx.lineTo(cx,cy+s*0.7);
  ctx.lineTo(cx-s*0.6,cy);
  ctx.closePath();
  var bgrad = ctx.createLinearGradient(cx,cy-s*0.7,cx,cy+s*0.7);
  bgrad.addColorStop(0,'#ffffff');
  bgrad.addColorStop(0.4, hexColor(color));
  bgrad.addColorStop(1, hexColor(color)+'88');
  ctx.fillStyle = bgrad;
  ctx.fill();
  ctx.strokeStyle = hexColor(color);
  ctx.lineWidth = 1.5;
  ctx.stroke();
  scene.textures.addCanvas(key, can);
}

function makeHexTex(scene, key, r, color){
  var can = document.createElement('canvas');
  can.width = r*4; can.height = r*4;
  var ctx = can.getContext('2d');
  var cx=r*2, cy=r*2;
  // glow
  var grad = ctx.createRadialGradient(cx,cy,0,cx,cy,r*2);
  grad.addColorStop(0, hexColor(color)+'55');
  grad.addColorStop(1, hexColor(color)+'00');
  ctx.fillStyle = grad;
  ctx.fillRect(0,0,r*4,r*4);
  // hex
  ctx.beginPath();
  for(var i=0;i<6;i++){
    var a = Math.PI/3*i - Math.PI/2;
    var px = cx + Math.cos(a)*r*1.3;
    var py = cy + Math.sin(a)*r*1.3;
    if(i===0) ctx.moveTo(px,py); else ctx.lineTo(px,py);
  }
  ctx.closePath();
  var hgrad = ctx.createLinearGradient(cx-r,cy-r,cx+r,cy+r);
  hgrad.addColorStop(0,'#ffffff');
  hgrad.addColorStop(0.35, hexColor(color));
  hgrad.addColorStop(1, hexColor(color)+'88');
  ctx.fillStyle = hgrad;
  ctx.fill();
  ctx.strokeStyle = hexColor(color);
  ctx.lineWidth = 1.5;
  ctx.stroke();
  scene.textures.addCanvas(key, can);
}

function makeCircleTex(scene, key, r, color){
  var can = document.createElement('canvas');
  can.width = r*4; can.height = r*4;
  var ctx = can.getContext('2d');
  var cx=r*2, cy=r*2;
  var grad = ctx.createRadialGradient(cx,cy,0,cx,cy,r*2);
  grad.addColorStop(0, '#ffffff');
  grad.addColorStop(0.3, hexColor(color));
  grad.addColorStop(0.7, hexColor(color)+'88');
  grad.addColorStop(1, hexColor(color)+'00');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(cx,cy,r*1.8,0,Math.PI*2);
  ctx.fill();
  scene.textures.addCanvas(key, can);
}

/* Bullet with trail glow */
function makeBulletTex(scene, key, w, h, color){
  var can = document.createElement('canvas');
  can.width = w*3; can.height = h*2;
  var ctx = can.getContext('2d');
  var cx = w*1.5, cy = h;
  // glow
  var grad = ctx.createRadialGradient(cx,cy,0,cx,cy,h);
  grad.addColorStop(0, hexColor(color)+'88');
  grad.addColorStop(1, hexColor(color)+'00');
  ctx.fillStyle = grad;
  ctx.fillRect(0,0,w*3,h*2);
  // core
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(cx-w/2, cy-h*0.4, w, h*0.8);
  ctx.fillStyle = hexColor(color);
  ctx.fillRect(cx-w/2-1, cy-h*0.3, w+2, h*0.6);
  scene.textures.addCanvas(key, can);
}

function makeGlowDotTex(scene, key, r, color){
  var can = document.createElement('canvas');
  can.width = r*6; can.height = r*6;
  var ctx = can.getContext('2d');
  var cx=r*3, cy=r*3;
  var grad = ctx.createRadialGradient(cx,cy,0,cx,cy,r*3);
  grad.addColorStop(0, '#ffffff');
  grad.addColorStop(0.2, hexColor(color));
  grad.addColorStop(0.6, hexColor(color)+'66');
  grad.addColorStop(1, hexColor(color)+'00');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(cx,cy,r*3,0,Math.PI*2);
  ctx.fill();
  scene.textures.addCanvas(key, can);
}

function makeStarTex(scene, key, r){
  var can = document.createElement('canvas');
  can.width = r*4; can.height = r*4;
  var ctx = can.getContext('2d');
  var cx=r*2, cy=r*2;
  var grad = ctx.createRadialGradient(cx,cy,0,cx,cy,r*2);
  grad.addColorStop(0, '#ffffff');
  grad.addColorStop(0.5, '#aaccff88');
  grad.addColorStop(1, '#aaccff00');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(cx,cy,r*2,0,Math.PI*2);
  ctx.fill();
  scene.textures.addCanvas(key, can);
}

function makePowerUpTex(scene, key, s, color){
  var can = document.createElement('canvas');
  can.width = s*2; can.height = s*2;
  var ctx = can.getContext('2d');
  var cx=s, cy=s;
  // outer glow
  var grad = ctx.createRadialGradient(cx,cy,0,cx,cy,s);
  grad.addColorStop(0, hexColor(color));
  grad.addColorStop(0.5, hexColor(color)+'88');
  grad.addColorStop(1, hexColor(color)+'00');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(cx,cy,s,0,Math.PI*2);
  ctx.fill();
  // inner circle
  ctx.beginPath();
  ctx.arc(cx,cy,s*0.5,0,Math.PI*2);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx,cy,s*0.35,0,Math.PI*2);
  ctx.fillStyle = hexColor(color);
  ctx.fill();
  // icon hint
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx,cy,s*0.6,0,Math.PI*2);
  ctx.stroke();
  scene.textures.addCanvas(key, can);
}

function makeShieldTex(scene, key, r, color){
  var can = document.createElement('canvas');
  can.width = r*4; can.height = r*4;
  var ctx = can.getContext('2d');
  var cx=r*2, cy=r*2;
  var grad = ctx.createRadialGradient(cx,cy,r*1.2,cx,cy,r*2);
  grad.addColorStop(0, hexColor(color)+'00');
  grad.addColorStop(0.5, hexColor(color)+'44');
  grad.addColorStop(0.8, hexColor(color)+'88');
  grad.addColorStop(1, hexColor(color)+'00');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(cx,cy,r*2,0,Math.PI*2);
  ctx.fill();
  // ring
  ctx.strokeStyle = hexColor(color)+'cc';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx,cy,r*1.6,0,Math.PI*2);
  ctx.stroke();
  scene.textures.addCanvas(key, can);
}

/* Boss texture — large menacing hex with eye */
function makeBossTex(scene, key, r, color){
  var can = document.createElement('canvas');
  can.width = r*4; can.height = r*4;
  var ctx = can.getContext('2d');
  var cx=r*2, cy=r*2;
  // outer glow
  var grad = ctx.createRadialGradient(cx,cy,0,cx,cy,r*2);
  grad.addColorStop(0, hexColor(color)+'88');
  grad.addColorStop(0.7, hexColor(color)+'33');
  grad.addColorStop(1, hexColor(color)+'00');
  ctx.fillStyle = grad;
  ctx.fillRect(0,0,r*4,r*4);
  // hex body
  ctx.beginPath();
  for(var i=0;i<6;i++){
    var a = Math.PI/3*i - Math.PI/2;
    var px = cx + Math.cos(a)*r*1.5;
    var py = cy + Math.sin(a)*r*1.5;
    if(i===0) ctx.moveTo(px,py); else ctx.lineTo(px,py);
  }
  ctx.closePath();
  var bgrad = ctx.createLinearGradient(cx-r,cy-r,cx+r,cy+r);
  bgrad.addColorStop(0, hexColor(color));
  bgrad.addColorStop(0.5, '#ffffff44');
  bgrad.addColorStop(1, hexColor(color));
  ctx.fillStyle = bgrad;
  ctx.fill();
  ctx.strokeStyle = '#ffffff88';
  ctx.lineWidth = 2;
  ctx.stroke();
  // "eye" core
  var egrad = ctx.createRadialGradient(cx,cy,0,cx,cy,r*0.5);
  egrad.addColorStop(0, '#ffffff');
  egrad.addColorStop(0.5, hexColor(color));
  egrad.addColorStop(1, '#00000088');
  ctx.fillStyle = egrad;
  ctx.beginPath();
  ctx.arc(cx,cy,r*0.5,0,Math.PI*2);
  ctx.fill();
  scene.textures.addCanvas(key, can);
}

/* ───────── BOOT scene ───────── */
var BootScene = new Phaser.Class({
  Extends: Phaser.Scene,
  initialize: function(){ Phaser.Scene.call(this, {key:'Boot'}); },
  create: function(){
    var sc = this;
    makeShipTex(sc, 'ship', 24, 32, CYAN);
    makeDiamondTex(sc, 'enemy1', 22, MAGENTA);
    makeHexTex(sc, 'enemy2', 14, 0xff44cc);
    makeCircleTex(sc, 'enemy3', 12, 0xcc00ff);
    makeBossTex(sc, 'boss', 32, 0xff0066);
    makeBulletTex(sc, 'pbullet', 4, 14, YELLOW);
    makeBulletTex(sc, 'ebullet', 4, 12, MAGENTA);
    makeGlowDotTex(sc, 'glow_cyan', 4, CYAN);
    makeGlowDotTex(sc, 'glow_mag', 4, MAGENTA);
    makeGlowDotTex(sc, 'glow_yel', 4, YELLOW);
    makeGlowDotTex(sc, 'glow_white', 3, WHITE);
    makeGlowDotTex(sc, 'glow_green', 4, GREEN);
    makeGlowDotTex(sc, 'glow_red', 4, RED);
    makeGlowDotTex(sc, 'glow_orange', 4, ORANGE);
    makeStarTex(sc, 'star1', 1);
    makeStarTex(sc, 'star2', 2);
    makePowerUpTex(sc, 'pu_spread', 18, GREEN);
    makePowerUpTex(sc, 'pu_shield', 18, 0x00ccff);
    makePowerUpTex(sc, 'pu_speed', 18, YELLOW);
    makeShieldTex(sc, 'shield_vis', 24, 0x00ccff);
    // health bar
    var hcan = document.createElement('canvas');
    hcan.width=2; hcan.height=8;
    var hctx = hcan.getContext('2d');
    hctx.fillStyle='#ff3333'; hctx.fillRect(0,0,2,8);
    sc.textures.addCanvas('hpbar', hcan);
    sc.scene.start('Game');
  }
});

/* ═══════════════════════════════════════════════
   GAME SCENE
   ═══════════════════════════════════════════════ */
var GameScene = new Phaser.Class({
  Extends: Phaser.Scene,
  initialize: function(){ Phaser.Scene.call(this, {key:'Game'}); },

  create: function(){
    var sc = this;
    sc.gameW = sc.scale.width;
    sc.gameH = sc.scale.height;

    /* --- init audio on first interaction --- */
    sc.audioReady = false;
    var initAudio = function(){
      if(!sc.audioReady){
        ensureAudio();
        sc.audioReady = true;
      }
    };
    sc.input.on('pointerdown', initAudio);
    sc.input.keyboard.on('keydown', initAudio);

    /* --- background nebula tint (changes per wave) --- */
    sc.bgGraphics = sc.add.graphics().setDepth(-20);
    sc.bgHue = 0.65; // starts blue-purple
    sc.drawBg = function(){
      sc.bgGraphics.clear();
      // dark radial gradient simulated with rectangles
      var steps = 8;
      for(var i=steps;i>=0;i--){
        var t = i/steps;
        var r = Math.floor(10 + t*15 * (0.5+Math.sin(sc.bgHue*Math.PI*2)*0.5));
        var g = Math.floor(5 + t*8);
        var b = Math.floor(15 + t*25 * (0.5+Math.cos(sc.bgHue*Math.PI*2)*0.5));
        sc.bgGraphics.fillStyle(Phaser.Display.Color.GetColor(r,g,b), 1);
        var margin = i * (sc.gameW*0.05);
        sc.bgGraphics.fillRect(margin, margin, sc.gameW-margin*2, sc.gameH-margin*2);
      }
    };
    sc.drawBg();

    /* --- starfield (3 parallax layers) --- */
    sc.stars = [[],[],[]];
    var speeds = [0.2, 0.5, 1.1];
    var counts = [90, 55, 35];
    var alphas = [0.25, 0.5, 0.85];
    var scales = [0.3, 0.5, 0.8];
    for(var layer=0; layer<3; layer++){
      for(var i=0; i<counts[layer]; i++){
        var s = sc.add.image(
          Phaser.Math.Between(0, sc.gameW),
          Phaser.Math.Between(0, sc.gameH),
          layer < 2 ? 'star1' : 'star2'
        );
        s.setAlpha(alphas[layer]);
        s.setScale(scales[layer]);
        s.setDepth(-10 + layer);
        s.setBlendMode(Phaser.BlendModes.ADD);
        s.speedY = speeds[layer];
        // random twinkle
        s.twinkleSpeed = Phaser.Math.FloatBetween(0.001, 0.004);
        s.twinkleOffset = Math.random() * Math.PI * 2;
        s.baseAlpha = alphas[layer];
        sc.stars[layer].push(s);
      }
    }

    /* --- physics groups (object pooling) --- */
    sc.playerBullets = sc.physics.add.group({
      classType: Phaser.Physics.Arcade.Image,
      maxSize: 120,
      runChildUpdate: false
    });
    sc.enemyBullets = sc.physics.add.group({
      classType: Phaser.Physics.Arcade.Image,
      maxSize: 80,
      runChildUpdate: false
    });
    sc.enemies = sc.physics.add.group({
      classType: Phaser.Physics.Arcade.Image,
      maxSize: 40,
      runChildUpdate: false
    });
    sc.powerUps = sc.physics.add.group({
      classType: Phaser.Physics.Arcade.Image,
      maxSize: 10,
      runChildUpdate: false
    });

    /* --- player --- */
    sc.player = sc.physics.add.image(sc.gameW/2, sc.gameH - 80, 'ship');
    sc.player.setDepth(10);
    sc.player.setCollideWorldBounds(true);
    sc.player.body.setSize(16, 24);
    sc.player.setBlendMode(Phaser.BlendModes.ADD);

    /* --- shield visual --- */
    sc.shieldSprite = sc.add.image(sc.player.x, sc.player.y, 'shield_vis');
    sc.shieldSprite.setDepth(11);
    sc.shieldSprite.setVisible(false);
    sc.shieldSprite.setScale(2.2);
    sc.shieldSprite.setBlendMode(Phaser.BlendModes.ADD);

    /* --- engine trail --- */
    sc.engineEmitter = sc.add.particles(0,0,'glow_cyan',{
      speed: {min:20, max:80},
      angle: {min:75, max:105},
      scale: {start:1.2, end:0},
      alpha: {start:0.9, end:0},
      lifespan: 350,
      frequency: 25,
      blendMode: 'ADD',
      follow: sc.player,
      followOffset: {x:0, y:16},
      tint: [0x00ffff, 0x0088ff, 0xffffff]
    });
    sc.engineEmitter.setDepth(9);

    /* --- game state --- */
    sc.score = 0;
    sc.lives = 3;
    sc.wave = 0;
    sc.waveTimer = 0;
    sc.waveDelay = 2500;
    sc.fireTimer = 0;
    sc.fireRate = 200;
    sc.spreadShot = false;
    sc.spreadTimer = 0;
    sc.shieldActive = false;
    sc.shieldTimer = 0;
    sc.speedBoost = false;
    sc.speedTimer = 0;
    sc.comboCount = 0;
    sc.comboTimer = 0;
    sc.multiplier = 1;
    sc.isGameOver = false;
    sc.invincible = false;
    sc.invTimer = 0;
    sc.bossAlive = false;
    sc.bossRef = null;
    sc.playerSpeed = 280;
    sc.enemiesKilledThisWave = 0;
    sc.totalEnemiesInWave = 0;
    sc.waveActive = false;
    sc.nextWaveCountdown = 1500;
    sc.screenFlashAlpha = 0;
    sc.shipTilt = 0; // visual tilt on movement

    /* --- flash overlay for damage/powerup --- */
    sc.flashOverlay = sc.add.rectangle(sc.gameW/2, sc.gameH/2, sc.gameW, sc.gameH, 0xffffff, 0);
    sc.flashOverlay.setDepth(150);
    sc.flashOverlay.setBlendMode(Phaser.BlendModes.ADD);

    /* --- HUD --- */
    var fontSize = Math.max(14, Math.min(22, sc.gameW * 0.038));
    sc.scoreText = sc.add.text(12, 10, 'SCORE 0', {
      fontFamily: '"Courier New", monospace', fontSize: fontSize+'px', color: '#00ffff',
      stroke: '#003333', strokeThickness: 3,
      shadow: { offsetX:0, offsetY:0, color:'#00ffff', blur:8, fill:true }
    }).setDepth(100);
    sc.livesText = sc.add.text(sc.gameW - 12, 10, '', {
      fontFamily: '"Courier New", monospace', fontSize: fontSize+'px', color: '#ff4444',
      stroke: '#330000', strokeThickness: 3
    }).setDepth(100).setOrigin(1, 0);
    sc.updateLivesDisplay = function(){
      var hearts = '';
      for(var i=0;i<sc.lives;i++) hearts += '\\u2764 ';
      sc.livesText.setText(hearts.trim());
    };
    sc.updateLivesDisplay();

    sc.waveText = sc.add.text(sc.gameW/2, 10, '', {
      fontFamily: '"Courier New", monospace', fontSize: fontSize+'px', color: '#ffff00',
      stroke: '#333300', strokeThickness: 3,
      shadow: { offsetX:0, offsetY:0, color:'#ffff00', blur:6, fill:true }
    }).setDepth(100).setOrigin(0.5, 0);
    sc.multiText = sc.add.text(12, 10+fontSize+6, '', {
      fontFamily: '"Courier New", monospace', fontSize: (fontSize*0.7)+'px', color: '#00ff88',
      shadow: { offsetX:0, offsetY:0, color:'#00ff88', blur:4, fill:true }
    }).setDepth(100);

    /* --- boss health bar --- */
    sc.bossHpBg = sc.add.rectangle(sc.gameW/2, 50, sc.gameW*0.6, 10, 0x333333).setDepth(100).setVisible(false);
    sc.bossHpBar = sc.add.rectangle(sc.gameW/2, 50, sc.gameW*0.6, 8, 0xff0044).setDepth(101).setVisible(false);
    sc.bossLabel = sc.add.text(sc.gameW/2, 36, '\\u26a0 BOSS', {
      fontFamily:'monospace', fontSize:'14px', color:'#ff0066',
      shadow: { offsetX:0, offsetY:0, color:'#ff0066', blur:8, fill:true }
    }).setOrigin(0.5,1).setDepth(100).setVisible(false);

    /* --- input --- */
    sc.cursors = sc.input.keyboard.createCursorKeys();
    sc.touchX = null;
    sc.touchStartX = null;
    sc.touchPlayerStartX = null;

    sc.input.on('pointerdown', function(p){
      sc.touchX = p.x;
      sc.touchStartX = p.x;
      sc.touchPlayerStartX = sc.player.x;
    });
    sc.input.on('pointermove', function(p){
      if(p.isDown) sc.touchX = p.x;
    });
    sc.input.on('pointerup', function(){
      sc.touchX = null;
      sc.touchStartX = null;
    });

    /* --- collisions --- */
    sc.physics.add.overlap(sc.playerBullets, sc.enemies, sc.hitEnemy, null, sc);
    sc.physics.add.overlap(sc.enemyBullets, sc.player, sc.hitPlayer, null, sc);
    sc.physics.add.overlap(sc.enemies, sc.player, sc.enemyCollide, null, sc);
    sc.physics.add.overlap(sc.powerUps, sc.player, sc.collectPowerUp, null, sc);

    /* --- "GET READY" intro --- */
    var readyText = sc.add.text(sc.gameW/2, sc.gameH/2, 'GET READY', {
      fontFamily:'"Courier New", monospace', fontSize:'28px', color:'#00ffff',
      stroke:'#000', strokeThickness:4,
      shadow: { offsetX:0, offsetY:0, color:'#00ffff', blur:12, fill:true }
    }).setOrigin(0.5).setDepth(200).setAlpha(0);
    sc.tweens.add({
      targets: readyText, alpha:1, duration:400, yoyo:true, hold:600,
      onComplete: function(){
        readyText.destroy();
        startBgBeat();
        sc.spawnWave();
      }
    });
  },

  /* ═══════════ SCREEN FLASH ═══════════ */
  flashScreen: function(color, intensity, duration){
    var sc = this;
    sc.flashOverlay.setFillStyle(color, intensity);
    sc.tweens.add({
      targets: sc.flashOverlay, alpha: {from:intensity, to:0},
      duration: duration || 200
    });
  },

  /* ═══════════ WAVE SPAWNING ═══════════ */
  spawnWave: function(){
    var sc = this;
    if(sc.isGameOver) return;
    sc.wave++;
    sc.waveText.setText('WAVE ' + sc.wave);
    sc.enemiesKilledThisWave = 0;
    sc.waveActive = true;

    // shift background hue per wave
    sc.bgHue = 0.65 + sc.wave * 0.08;
    sc.drawBg();

    sfxWaveStart();

    // wave announcement
    var announce = sc.add.text(sc.gameW/2, sc.gameH*0.35, 'WAVE ' + sc.wave, {
      fontFamily:'"Courier New", monospace', fontSize:'32px', color:'#ffff00',
      stroke:'#000', strokeThickness:4,
      shadow: { offsetX:0, offsetY:0, color:'#ffff00', blur:15, fill:true }
    }).setOrigin(0.5).setDepth(200).setAlpha(0).setScale(0.5);
    sc.tweens.add({
      targets: announce, alpha:1, scaleX:1, scaleY:1, duration:300,
      ease:'Back.easeOut',
      onComplete: function(){
        sc.tweens.add({
          targets: announce, alpha:0, y: sc.gameH*0.3, duration:500, delay:400,
          onComplete: function(){ announce.destroy(); }
        });
      }
    });

    // boss every 5 waves
    if(sc.wave % 5 === 0){
      sc.spawnBoss();
      return;
    }

    var patterns = ['v','zigzag','line','diamond','swarm'];
    var pat = patterns[(sc.wave - 1) % patterns.length];
    /* SLOWER PACING: fewer enemies early, gradual ramp */
    var count = Math.min(4 + Math.floor(sc.wave * 0.7), 16);
    sc.totalEnemiesInWave = count;
    var textures = ['enemy1','enemy2','enemy3'];

    var positions = [];
    var spacing = sc.gameW / (count + 1);

    if(pat === 'v'){
      var mid = count / 2;
      for(var i=0;i<count;i++){
        positions.push({ x: spacing*(i+1), y: -30 - Math.abs(i-mid)*30, tex: textures[i%3] });
      }
    } else if(pat === 'zigzag'){
      for(var i=0;i<count;i++){
        positions.push({ x: spacing*(i+1), y: -30 - (i%2)*40, tex: textures[i%3] });
      }
    } else if(pat === 'line'){
      for(var i=0;i<count;i++){
        positions.push({ x: spacing*(i+1), y: -30 - Math.floor(i/6)*35, tex: textures[i%3] });
      }
    } else if(pat === 'diamond'){
      var cx = sc.gameW/2;
      for(var i=0;i<count;i++){
        var angle = (Math.PI*2/count)*i;
        positions.push({ x: cx+Math.cos(angle)*100, y: -80+Math.sin(angle)*60, tex: textures[i%3] });
      }
    } else {
      for(var i=0;i<count;i++){
        positions.push({ x: Phaser.Math.Between(40, sc.gameW-40), y: -Phaser.Math.Between(30,200), tex: textures[i%3] });
      }
    }

    /* SLOWER PACING: early waves = slow speed, gentle shooting */
    var hp = 1 + Math.floor(sc.wave / 4);
    var speed = Math.max(20, 20 + Math.min(sc.wave * 3, 70));

    for(var i=0; i<positions.length; i++){
      (function(pos, idx){
        sc.time.delayedCall(idx * 100, function(){
          sc.spawnEnemy(pos.x, pos.y, pos.tex, hp, speed);
        });
      })(positions[i], i);
    }
  },

  spawnEnemy: function(x, y, tex, hp, speed){
    var sc = this;
    var e = sc.enemies.get(x, y, tex);
    if(!e) return;
    e.setActive(true).setVisible(true).setDepth(5);
    e.body.enable = true;
    e.setScale(1);
    e.setAlpha(1);
    e.setBlendMode(Phaser.BlendModes.ADD);
    e.hp = hp;
    e.maxHp = hp;
    e.speed = speed;
    /* SLOWER PACING: much longer shoot intervals for early waves */
    e.shootTimer = Phaser.Math.Between(1000, 3000);
    e.shootInterval = Math.max(900, 2800 - sc.wave * 60);
    e.movePattern = Phaser.Math.Between(0, 2);
    e.baseX = x;
    e.time = 0;
    e.body.setVelocityY(speed);
    e.body.setSize(e.width * 0.7, e.height * 0.7);
    e.isBoss = false;
    // entrance animation
    e.setScale(0.3);
    sc.tweens.add({ targets:e, scaleX:1, scaleY:1, duration:300, ease:'Back.easeOut' });
  },

  spawnBoss: function(){
    var sc = this;
    sc.totalEnemiesInWave = 1;
    sc.bossAlive = true;

    // WARNING cinematic
    var dimOverlay = sc.add.rectangle(sc.gameW/2, sc.gameH/2, sc.gameW, sc.gameH, 0x000000, 0);
    dimOverlay.setDepth(180);
    sc.tweens.add({ targets: dimOverlay, alpha: 0.4, duration: 300 });

    var warnText = sc.add.text(sc.gameW/2, sc.gameH*0.35, '\\u26a0 WARNING \\u26a0', {
      fontFamily:'"Courier New", monospace', fontSize:'40px', color:'#ff0044',
      stroke:'#000', strokeThickness:5,
      shadow:{offsetX:0,offsetY:0,color:'#ff0044',blur:25,fill:true}
    }).setOrigin(0.5).setDepth(200).setAlpha(0);

    // Flash 3 times then spawn boss
    sc.tweens.add({
      targets: warnText, alpha:1, duration:150, yoyo:true, repeat:2,
      onComplete: function(){
        warnText.destroy();
        sc.tweens.add({ targets: dimOverlay, alpha:0, duration:300, onComplete: function(){ dimOverlay.destroy(); }});

        // NOW spawn the actual boss
        var e = sc.enemies.get(sc.gameW/2, -80, 'boss');
        if(!e) return;
        e.setActive(true).setVisible(true).setDepth(5);
        e.body.enable = true;
        e.setScale(1.8);
        e.setBlendMode(Phaser.BlendModes.ADD);
        var bossHp = 15 + sc.wave * 4;
        e.hp = bossHp;
        e.maxHp = bossHp;
        e.speed = 18;
        e.shootTimer = 0;
        e.shootInterval = Math.max(350, 500 - sc.wave * 5);
        e.movePattern = 3;
        e.baseX = sc.gameW/2;
        e.time = 0;
        e.isBoss = true;
        e.body.setVelocityY(25);
        e.body.setSize(e.width*1.3, e.height*1.3);
        sc.bossRef = e;

        sc.bossHpBg.setVisible(true);
        sc.bossHpBar.setVisible(true);
        sc.bossLabel.setVisible(true);

        sc.flashScreen(0xff0044, 0.3, 400);
        sc.cameras.main.zoomTo(1.05, 200, 'Power2');
        sc.time.delayedCall(400, function(){
          sc.cameras.main.zoomTo(1, 300, 'Power2');
        });

        sc.time.delayedCall(2200, function(){
          if(e.active) e.body.setVelocityY(0);
        });
      }
    });
  },

  /* ═══════════ SHOOTING ═══════════ */
  firePlayerBullet: function(){
    var sc = this;
    if(sc.isGameOver) return;

    var angles = [0];
    if(sc.spreadShot) angles = [-12, -4, 4, 12];

    for(var i=0; i<angles.length; i++){
      var b = sc.playerBullets.get(sc.player.x, sc.player.y - 20, 'pbullet');
      if(!b) continue;
      b.setActive(true).setVisible(true).setDepth(8);
      b.body.enable = true;
      b.setScale(1);
      b.setAlpha(1);
      b.setBlendMode(Phaser.BlendModes.ADD);
      var rad = Phaser.Math.DegToRad(-90 + angles[i]);
      var spd = 480;
      b.body.setVelocity(Math.cos(rad)*spd, Math.sin(rad)*spd);
      b.body.setSize(4, 12);
    }

    if(sc.spreadShot) sfxLaserSpread(); else sfxLaser();
  },

  fireEnemyBullet: function(ex, ey){
    var sc = this;
    var b = sc.enemyBullets.get(ex, ey, 'ebullet');
    if(!b) return;
    b.setActive(true).setVisible(true).setDepth(4);
    b.body.enable = true;
    b.setScale(1);
    b.setAlpha(1);
    b.setBlendMode(Phaser.BlendModes.ADD);
    var angle = Phaser.Math.Angle.Between(ex, ey, sc.player.x, sc.player.y);
    angle += Phaser.Math.FloatBetween(-0.25, 0.25);
    /* SLOWER PACING: slower enemy bullets early on */
    var spd = 140 + Math.min(sc.wave * 5, 100);
    b.body.setVelocity(Math.cos(angle)*spd, Math.sin(angle)*spd);
    b.body.setSize(4, 10);
  },

  /* ═══════════ COLLISIONS ═══════════ */
  hitEnemy: function(bullet, enemy){
    var sc = this;
    if(!bullet.active || !enemy.active) return;
    bullet.setActive(false).setVisible(false);
    bullet.body.enable = false;

    enemy.hp--;
    sfxHit();

    // flash white + scale bump
    enemy.setTint(0xffffff);
    sc.tweens.add({
      targets: enemy, scaleX: enemy.scaleX*1.15, scaleY: enemy.scaleY*1.15,
      duration: 50, yoyo: true,
      onComplete: function(){ if(enemy.active) enemy.clearTint(); }
    });

    // hit spark
    var spark = sc.add.particles(bullet.x, bullet.y, 'glow_yel', {
      speed:{min:40,max:100}, angle:{min:0,max:360},
      scale:{start:0.6,end:0}, lifespan:150, quantity:5,
      blendMode:'ADD', emitting:false
    });
    spark.setDepth(20); spark.explode(5);
    sc.time.delayedCall(200, function(){ spark.destroy(); });

    if(enemy.hp <= 0){
      sc.destroyEnemy(enemy);
    } else if(enemy.isBoss){
      var pct = enemy.hp / enemy.maxHp;
      sc.bossHpBar.setScale(pct, 1);
    }
  },

  destroyEnemy: function(enemy){
    var sc = this;
    var ex = enemy.x, ey = enemy.y;
    var isBoss = enemy.isBoss;

    enemy.setActive(false).setVisible(false);
    enemy.body.enable = false;

    sfxExplosion(isBoss);

    // multi-layer explosion
    var colors = isBoss ? ['glow_red','glow_orange','glow_yel'] : ['glow_mag','glow_cyan','glow_white'];
    for(var c=0; c<colors.length; c++){
      var count = isBoss ? 25 : 12;
      var em = sc.add.particles(ex, ey, colors[c], {
        speed: {min: 30+c*30, max: isBoss ? 200+c*50 : 120+c*40},
        angle: {min: 0, max: 360},
        scale: {start: isBoss ? 1.2-c*0.2 : 0.8-c*0.15, end: 0},
        alpha: {start: 1, end: 0},
        lifespan: isBoss ? 700-c*100 : 400-c*80,
        quantity: count,
        blendMode: 'ADD',
        emitting: false
      });
      em.setDepth(20);
      em.explode(count);
      (function(emitter, delay){ sc.time.delayedCall(delay, function(){ emitter.destroy(); }); })(em, isBoss ? 800 : 500);
    }

    // screen effects
    sc.cameras.main.shake(isBoss ? 500 : 180, isBoss ? 0.018 : 0.008);
    sc.flashScreen(isBoss ? 0xff0044 : 0xff00ff, isBoss ? 0.25 : 0.1, isBoss ? 300 : 150);

    // combo
    sc.comboCount++;
    sc.comboTimer = 1800;
    sc.multiplier = 1 + Math.floor(sc.comboCount / 4) * 0.5;
    if(sc.multiplier > 5) sc.multiplier = 5;

    // Kill streak announcements
    var streakTexts = {3:'DOUBLE KILL!', 5:'TRIPLE KILL!', 8:'MEGA KILL!', 12:'UNSTOPPABLE!'};
    var streakColors = {3:'#ffff00', 5:'#ff8800', 8:'#ff0044', 12:'#ff00ff'};
    if(streakTexts[sc.comboCount]){
      var stColor = streakColors[sc.comboCount];
      var st = sc.add.text(sc.gameW/2, sc.gameH*0.3, streakTexts[sc.comboCount], {
        fontFamily:'"Courier New", monospace', fontSize:'36px',
        color: stColor,
        stroke:'#000', strokeThickness:5,
        shadow: { offsetX:0, offsetY:0, color: stColor, blur:20, fill:true }
      }).setOrigin(0.5).setDepth(200).setScale(0.3).setAlpha(0);
      sc.tweens.add({
        targets: st, alpha:1, scaleX:1.3, scaleY:1.3, duration:200, ease:'Back.easeOut',
        onComplete: function(){
          sc.tweens.add({
            targets: st, alpha:0, y: st.y-50, scaleX:1.5, scaleY:1.5,
            duration:600, delay:400,
            onComplete: function(){ st.destroy(); }
          });
        }
      });
      sc.cameras.main.shake(300, 0.012);
      // streak sound effect
      if(actx){
        try{
          var stt = actx.currentTime;
          var notes = [660, 880, 1100];
          for(var ni=0;ni<notes.length;ni++){
            var sosc = actx.createOscillator();
            var sgain = actx.createGain();
            sosc.type = 'sine';
            sosc.frequency.setValueAtTime(notes[ni], stt + ni*0.06);
            sgain.gain.setValueAtTime(0.08, stt + ni*0.06);
            sgain.gain.exponentialRampToValueAtTime(0.001, stt + ni*0.06 + 0.12);
            sosc.connect(sgain); sgain.connect(actx.destination);
            sosc.start(stt + ni*0.06); sosc.stop(stt + ni*0.06 + 0.13);
          }
        }catch(e){}
      }
    }

    var baseScore = isBoss ? 500 : (10 + sc.wave * 2);
    var pts = Math.floor(baseScore * sc.multiplier);
    sc.score += pts;
    sc.scoreText.setText('SCORE ' + sc.score);

    // floating score with scale animation
    var ft = sc.add.text(ex, ey, '+' + pts, {
      fontFamily:'"Courier New", monospace', fontSize: isBoss ? '22px' : '16px',
      color: isBoss ? '#ff4444' : '#ffff00',
      stroke:'#000', strokeThickness:2,
      shadow: { offsetX:0, offsetY:0, color: isBoss ? '#ff4444' : '#ffff00', blur:8, fill:true }
    }).setOrigin(0.5).setDepth(50).setScale(0.5);
    sc.tweens.add({
      targets: ft, y: ey-55, alpha: 0, scaleX:1.2, scaleY:1.2, duration:800,
      ease:'Power2',
      onComplete: function(){ ft.destroy(); }
    });

    // power-up drop
    if(Math.random() < (isBoss ? 1.0 : 0.14)){
      sc.dropPowerUp(ex, ey);
    }

    sc.enemiesKilledThisWave++;

    if(isBoss){
      sc.bossAlive = false;
      sc.bossRef = null;
      sc.bossHpBg.setVisible(false);
      sc.bossHpBar.setVisible(false);
      sc.bossLabel.setVisible(false);
      // SLOW-MO EFFECT on boss kill
      sc.time.timeScale = 0.3;
      sc.cameras.main.zoomTo(1.15, 300, 'Power2');
      sc.time.delayedCall(600, function(){
        sc.time.timeScale = 1;
        sc.cameras.main.zoomTo(1, 200, 'Power2');
      });
    }

    if(sc.enemiesKilledThisWave >= sc.totalEnemiesInWave){
      sc.waveActive = false;
      sc.nextWaveCountdown = 2200;
    }
  },

  hitPlayer: function(player, bullet){
    var sc = this;
    if(!bullet.active) return;
    bullet.setActive(false).setVisible(false);
    bullet.body.enable = false;
    sc.damagePlayer();
  },

  enemyCollide: function(player, enemy){
    var sc = this;
    if(!enemy.active) return;
    sc.destroyEnemy(enemy);
    sc.damagePlayer();
  },

  damagePlayer: function(){
    var sc = this;
    if(sc.isGameOver || sc.invincible) return;

    if(sc.shieldActive){
      sc.shieldActive = false;
      sc.shieldSprite.setVisible(false);
      sc.shieldTimer = 0;
      sfxExplosion(false);
      var em = sc.add.particles(sc.player.x, sc.player.y, 'glow_cyan', {
        speed:{min:40,max:140}, angle:{min:0,max:360},
        scale:{start:1,end:0}, lifespan:400, quantity:20,
        blendMode:'ADD', emitting:false
      });
      em.setDepth(20); em.explode(20);
      sc.time.delayedCall(500, function(){ em.destroy(); });
      sc.flashScreen(0x00ccff, 0.2, 200);
      return;
    }

    sc.lives--;
    sc.updateLivesDisplay();
    sfxDamage();

    // damage particles
    var em = sc.add.particles(sc.player.x, sc.player.y, 'glow_cyan', {
      speed:{min:80,max:220}, angle:{min:0,max:360},
      scale:{start:1.2,end:0}, alpha:{start:1,end:0},
      lifespan:600, quantity:45, blendMode:'ADD', emitting:false
    });
    em.setDepth(20); em.explode(45);
    sc.time.delayedCall(700, function(){ em.destroy(); });

    sc.cameras.main.shake(350, 0.025);
    sc.flashScreen(0xff0000, 0.35, 300);

    if(sc.lives <= 0){
      sc.gameOverSequence();
      return;
    }

    sc.invincible = true;
    sc.invTimer = 2000;
    sc.player.setAlpha(0.4);
    sc.comboCount = 0;
    sc.multiplier = 1;
  },

  gameOverSequence: function(){
    var sc = this;
    sc.isGameOver = true;
    sc.player.setVisible(false);
    sc.player.body.enable = false;
    sc.engineEmitter.stop();
    stopBgBeat();

    sfxGameOver();

    // massive explosion
    var colors = ['glow_white','glow_cyan','glow_yel'];
    for(var c=0;c<colors.length;c++){
      var em = sc.add.particles(sc.player.x, sc.player.y, colors[c], {
        speed:{min:40+c*40,max:250+c*50}, angle:{min:0,max:360},
        scale:{start:1.5-c*0.3,end:0}, lifespan:1000+c*200, quantity:25,
        blendMode:'ADD', emitting:false
      });
      em.setDepth(20); em.explode(25);
    }

    sc.cameras.main.shake(600, 0.04);
    sc.flashScreen(0xffffff, 0.5, 500);

    sc.time.delayedCall(1000, function(){
      // dim overlay
      var overlay = sc.add.rectangle(sc.gameW/2, sc.gameH/2, sc.gameW, sc.gameH, 0x000000, 0);
      overlay.setDepth(190);
      sc.tweens.add({ targets:overlay, fillAlpha:0.6, duration:500 });

      var goText = sc.add.text(sc.gameW/2, sc.gameH/2 - 50, 'GAME OVER', {
        fontFamily:'"Courier New", monospace', fontSize:'34px', color:'#ff0044',
        stroke:'#000', strokeThickness:5,
        shadow: { offsetX:0, offsetY:0, color:'#ff0044', blur:20, fill:true }
      }).setOrigin(0.5).setDepth(200).setScale(0.3).setAlpha(0);

      sc.tweens.add({
        targets: goText, alpha:1, scaleX:1, scaleY:1, duration:400, ease:'Back.easeOut'
      });

      sc.time.delayedCall(300, function(){
        sc.add.text(sc.gameW/2, sc.gameH/2 + 5, 'SCORE  ' + sc.score, {
          fontFamily:'"Courier New", monospace', fontSize:'22px', color:'#00ffff',
          stroke:'#000', strokeThickness:3,
          shadow: { offsetX:0, offsetY:0, color:'#00ffff', blur:10, fill:true }
        }).setOrigin(0.5).setDepth(200);

        sc.add.text(sc.gameW/2, sc.gameH/2 + 40, 'WAVE  ' + sc.wave, {
          fontFamily:'"Courier New", monospace', fontSize:'16px', color:'#ffff00',
          stroke:'#000', strokeThickness:2
        }).setOrigin(0.5).setDepth(200);

        var restartText = sc.add.text(sc.gameW/2, sc.gameH/2 + 80, '\\u25b6 TAP TO RESTART', {
          fontFamily:'"Courier New", monospace', fontSize:'16px', color:'#888888'
        }).setOrigin(0.5).setDepth(200);

        sc.tweens.add({
          targets: restartText, alpha:0.3, yoyo:true, repeat:-1, duration:800
        });
      });

      sc.tweens.add({
        targets: goText, scaleX:1.05, scaleY:1.05, yoyo:true,
        repeat:-1, duration:700, ease:'Sine.easeInOut'
      });

      try{
        window.parent.postMessage({ type: 'gameOver', score: sc.score }, '*');
      }catch(e){}

      sc.time.delayedCall(500, function(){
        sc.input.once('pointerdown', function(){ sc.scene.restart(); });
        sc.input.keyboard.once('keydown', function(){ sc.scene.restart(); });
      });
    });
  },

  /* ═══════════ POWER-UPS ═══════════ */
  dropPowerUp: function(x, y){
    var sc = this;
    var types = ['spread','shield','speed'];
    var texes = ['pu_spread','pu_shield','pu_speed'];
    var idx = Phaser.Math.Between(0, 2);
    var pu = sc.powerUps.get(x, y, texes[idx]);
    if(!pu) return;
    pu.setActive(true).setVisible(true).setDepth(6);
    pu.body.enable = true;
    pu.setScale(1);
    pu.setAlpha(1);
    pu.setBlendMode(Phaser.BlendModes.ADD);
    pu.body.setVelocityY(70);
    pu.puType = types[idx];

    sc.tweens.add({
      targets: pu, scaleX:1.25, scaleY:1.25, yoyo:true,
      repeat:-1, duration:450, ease:'Sine.easeInOut'
    });
  },

  collectPowerUp: function(player, pu){
    var sc = this;
    if(!pu.active) return;
    var type = pu.puType;
    pu.setActive(false).setVisible(false);
    pu.body.enable = false;
    sc.tweens.killTweensOf(pu);

    sfxPowerUp();
    sc.flashScreen(type === 'spread' ? 0x00ff88 : type === 'shield' ? 0x00ccff : 0xffff00, 0.15, 200);

    var em = sc.add.particles(pu.x, pu.y, 'glow_green', {
      speed:{min:30,max:100}, angle:{min:0,max:360},
      scale:{start:1,end:0}, lifespan:350, quantity:15,
      blendMode:'ADD', emitting:false
    });
    em.setDepth(20); em.explode(15);
    sc.time.delayedCall(400, function(){ em.destroy(); });

    if(type === 'spread'){
      sc.spreadShot = true;
      sc.spreadTimer = 8000;
    } else if(type === 'shield'){
      sc.shieldActive = true;
      sc.shieldTimer = 10000;
      sc.shieldSprite.setVisible(true);
    } else if(type === 'speed'){
      sc.speedBoost = true;
      sc.speedTimer = 6000;
      sc.playerSpeed = 440;
    }

    var label = type === 'spread' ? '\\u2728 SPREAD SHOT!' : type === 'shield' ? '\\u{1f6e1} SHIELD!' : '\\u26a1 SPEED BOOST!';
    var ft = sc.add.text(sc.gameW/2, sc.gameH/2, label, {
      fontFamily:'"Courier New", monospace', fontSize:'20px',
      color: type === 'spread' ? '#00ff88' : type === 'shield' ? '#00ccff' : '#ffff00',
      stroke:'#000', strokeThickness:3,
      shadow: { offsetX:0, offsetY:0, color: type === 'spread' ? '#00ff88' : type === 'shield' ? '#00ccff' : '#ffff00', blur:12, fill:true }
    }).setOrigin(0.5).setDepth(150).setScale(0.5);
    sc.tweens.add({
      targets:ft, scaleX:1.1, scaleY:1.1, duration:200, ease:'Back.easeOut',
      onComplete: function(){
        sc.tweens.add({
          targets:ft, y: sc.gameH/2 - 60, alpha:0, duration:800,
          onComplete: function(){ ft.destroy(); }
        });
      }
    });
  },

  /* ═══════════ UPDATE LOOP ═══════════ */
  update: function(time, delta){
    var sc = this;
    if(sc.isGameOver) return;

    /* --- starfield scroll + twinkle --- */
    var speeds = [0.2, 0.5, 1.1];
    for(var layer=0; layer<3; layer++){
      var arr = sc.stars[layer];
      for(var i=0; i<arr.length; i++){
        arr[i].y += speeds[layer] * (delta/16);
        if(arr[i].y > sc.gameH + 8){
          arr[i].y = -8;
          arr[i].x = Phaser.Math.Between(0, sc.gameW);
        }
        // twinkle effect
        arr[i].setAlpha(arr[i].baseAlpha * (0.6 + 0.4 * Math.sin(time * arr[i].twinkleSpeed + arr[i].twinkleOffset)));
      }
    }

    /* --- player movement + tilt --- */
    var moveX = 0;
    var spd = sc.playerSpeed;
    if(sc.cursors.left.isDown) moveX = -spd;
    else if(sc.cursors.right.isDown) moveX = spd;

    if(sc.touchStartX !== null && sc.touchX !== null){
      var dx = sc.touchX - sc.touchStartX;
      var targetX = sc.touchPlayerStartX + dx;
      targetX = Phaser.Math.Clamp(targetX, 20, sc.gameW - 20);
      var diff = targetX - sc.player.x;
      moveX = Phaser.Math.Clamp(diff * 8, -spd, spd);
    }

    sc.player.body.setVelocityX(moveX);

    // ship tilts in movement direction
    var targetTilt = Phaser.Math.Clamp(moveX / spd * 0.25, -0.25, 0.25);
    sc.shipTilt += (targetTilt - sc.shipTilt) * 0.15;
    sc.player.setRotation(sc.shipTilt);

    // shield follows
    if(sc.shieldActive){
      sc.shieldSprite.setPosition(sc.player.x, sc.player.y);
      sc.shieldSprite.rotation += 0.015;
      sc.shieldSprite.setAlpha(0.5 + 0.3 * Math.sin(time * 0.005));
    }

    /* --- auto-fire --- */
    sc.fireTimer -= delta;
    if(sc.fireTimer <= 0){
      sc.firePlayerBullet();
      sc.fireTimer = sc.fireRate;
    }

    /* --- recycle off-screen player bullets --- */
    sc.playerBullets.getChildren().forEach(function(b){
      if(b.active && (b.y < -20 || b.x < -20 || b.x > sc.gameW+20)){
        b.setActive(false).setVisible(false);
        b.body.enable = false;
      }
    });

    /* --- recycle off-screen enemy bullets --- */
    sc.enemyBullets.getChildren().forEach(function(b){
      if(b.active && (b.y > sc.gameH+20 || b.y < -20 || b.x < -30 || b.x > sc.gameW+30)){
        b.setActive(false).setVisible(false);
        b.body.enable = false;
      }
    });

    /* --- enemy AI --- */
    sc.enemies.getChildren().forEach(function(e){
      if(!e.active) return;
      e.time += delta;

      // movement patterns
      if(e.movePattern === 0){
        e.x = e.baseX + Math.sin(e.time * 0.0015) * 45;
      } else if(e.movePattern === 1){
        var pdx = sc.player.x - e.x;
        e.x += Math.sign(pdx) * 0.25 * (delta/16);
      } else if(e.movePattern === 3){
        e.x = sc.gameW/2 + Math.sin(e.time * 0.0008) * (sc.gameW * 0.3);
        e.baseX = e.x;
      }

      // gentle rotation for visual polish
      if(!e.isBoss){
        e.rotation = Math.sin(e.time * 0.002) * 0.15;
      } else {
        e.rotation = Math.sin(e.time * 0.001) * 0.08;
      }

      // enemy shooting
      e.shootTimer -= delta;
      if(e.shootTimer <= 0 && e.y > 0 && e.y < sc.gameH * 0.65){
        sc.fireEnemyBullet(e.x, e.y + 10);
        if(e.isBoss){
          sc.fireEnemyBullet(e.x - 25, e.y + 10);
          sc.fireEnemyBullet(e.x + 25, e.y + 10);
        }
        e.shootTimer = e.shootInterval;
      }

      // recycle off-screen
      if(e.y > sc.gameH + 40){
        e.setActive(false).setVisible(false);
        e.body.enable = false;
        sc.enemiesKilledThisWave++;
        if(sc.enemiesKilledThisWave >= sc.totalEnemiesInWave){
          sc.waveActive = false;
          sc.nextWaveCountdown = 1800;
        }
      }
    });

    /* --- recycle off-screen power-ups --- */
    sc.powerUps.getChildren().forEach(function(p){
      if(p.active && p.y > sc.gameH + 30){
        p.setActive(false).setVisible(false);
        p.body.enable = false;
        sc.tweens.killTweensOf(p);
      }
    });

    /* --- combo timer --- */
    if(sc.comboTimer > 0){
      sc.comboTimer -= delta;
      if(sc.comboTimer <= 0){
        sc.comboCount = 0;
        sc.multiplier = 1;
      }
    }
    if(sc.multiplier > 1){
      sc.multiText.setText('\\u{1f525} x' + sc.multiplier.toFixed(1) + ' COMBO');
    } else {
      sc.multiText.setText('');
    }

    /* --- power-up timers --- */
    if(sc.spreadShot){
      sc.spreadTimer -= delta;
      if(sc.spreadTimer <= 0) sc.spreadShot = false;
    }
    if(sc.shieldActive){
      sc.shieldTimer -= delta;
      if(sc.shieldTimer <= 0){
        sc.shieldActive = false;
        sc.shieldSprite.setVisible(false);
      }
    }
    if(sc.speedBoost){
      sc.speedTimer -= delta;
      if(sc.speedTimer <= 0){
        sc.speedBoost = false;
        sc.playerSpeed = 280;
      }
    }

    /* --- invincibility timer --- */
    if(sc.invincible){
      sc.invTimer -= delta;
      sc.player.setAlpha(Math.sin(time * 0.012) > 0 ? 0.8 : 0.15);
      if(sc.invTimer <= 0){
        sc.invincible = false;
        sc.player.setAlpha(1);
      }
    }

    /* --- wave progression --- */
    if(!sc.waveActive && !sc.bossAlive){
      sc.nextWaveCountdown -= delta;
      if(sc.nextWaveCountdown <= 0){
        sc.spawnWave();
      }
    }

    /* --- boss HP bar update --- */
    if(sc.bossAlive && sc.bossRef && sc.bossRef.active){
      var pct = sc.bossRef.hp / sc.bossRef.maxHp;
      sc.bossHpBar.setScale(pct, 1);
      // boss HP bar color shift
      if(pct < 0.3){
        sc.bossHpBar.setFillStyle(0xff0000);
      } else if(pct < 0.6){
        sc.bossHpBar.setFillStyle(0xff8800);
      }
    }
  }
});

/* ───────── Phaser config & launch ───────── */
var config = {
  type: Phaser.AUTO,
  width: W,
  height: H,
  backgroundColor: '#000008',
  parent: document.body,
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: false
    }
  },
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  scene: [BootScene, GameScene],
  input: {
    activePointers: 2
  }
};

var game = new Phaser.Game(config);

window.addEventListener('resize', function(){
  game.scale.resize(window.innerWidth, window.innerHeight);
});

// ====== VIBE CODING: postMessage HANDLERS ======
window.addEventListener('message', function(e){
  if(!e.data || !e.data.type) return;
  var sc = game.scene.scenes[1]; // GameScene
  if(!sc) return;
  switch(e.data.type){
    case 'SET_FIRE_RATE':
      sc.fireRate = Math.max(50, 1000/parseFloat(e.data.value));
      break;
    case 'SET_PLAYER_SPEED':
      sc.playerSpeed = 280 * parseFloat(e.data.value);
      break;
    case 'SET_ENEMY_COUNT':
      sc.totalEnemiesInWave = parseInt(e.data.value)||5;
      break;
    case 'SET_INVINCIBLE':
      sc.invincible = !!e.data.value;
      sc.invTimer = e.data.value ? 999999 : 0;
      if(sc.shieldGfx) sc.shieldGfx.setVisible(!!e.data.value);
      break;
    case 'SPAWN_BOSS':
      if(!sc.bossAlive && sc.spawnBoss) sc.spawnBoss();
      break;
    case 'SET_GAME_SPEED':
      game.loop.targetFps = 60 * (parseFloat(e.data.value)||1);
      break;
  }
});

})();
</script>
</body>
</html>`;
