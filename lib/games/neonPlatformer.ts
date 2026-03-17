export const NEON_PLATFORMER_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0,maximum-scale=1.0,user-scalable=no">
<title>Neon Runner</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:100%;height:100%;overflow:hidden;background:#0a0a1a;touch-action:none;user-select:none;-webkit-user-select:none}
canvas{display:block}
#loading{position:fixed;top:0;left:0;width:100%;height:100%;background:#0a0a1a;display:flex;align-items:center;justify-content:center;z-index:999;font-family:'Courier New',monospace;color:#00ffff;font-size:24px;letter-spacing:4px}
#loading span{animation:pulse 1s ease-in-out infinite}
@keyframes pulse{0%,100%{opacity:.3}50%{opacity:1}}
</style>
</head>
<body>
<div id="loading"><span>LOADING...</span></div>
<script src="https://cdn.jsdelivr.net/npm/phaser@3.80.1/dist/phaser.min.js"><\/script>
<script>
'use strict';
(function(){

/* ═══════════════════════════════════════════════
   PROCEDURAL AUDIO ENGINE (Web Audio API)
   ═══════════════════════════════════════════════ */
var AudioCtx = window.AudioContext || window.webkitAudioContext;
var actx = null;
function ensureAudio(){
  if(!actx){ try{ actx = new AudioCtx(); }catch(e){ actx = null; } }
  if(actx && actx.state === 'suspended') actx.resume().catch(function(){});
}

function sfxJump(){
  if(!actx) return;
  try{
    var t = actx.currentTime;
    var osc = actx.createOscillator();
    var gain = actx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(280, t);
    osc.frequency.exponentialRampToValueAtTime(560, t+0.1);
    gain.gain.setValueAtTime(0.1, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t+0.12);
    osc.connect(gain); gain.connect(actx.destination);
    osc.start(t); osc.stop(t+0.13);
  }catch(e){}
}

function sfxDoubleJump(){
  if(!actx) return;
  try{
    var t = actx.currentTime;
    var osc = actx.createOscillator();
    var osc2 = actx.createOscillator();
    var gain = actx.createGain();
    osc.type = 'sine'; osc2.type = 'triangle';
    osc.frequency.setValueAtTime(400, t);
    osc.frequency.exponentialRampToValueAtTime(900, t+0.12);
    osc2.frequency.setValueAtTime(600, t);
    osc2.frequency.exponentialRampToValueAtTime(1200, t+0.12);
    gain.gain.setValueAtTime(0.08, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t+0.14);
    osc.connect(gain); osc2.connect(gain); gain.connect(actx.destination);
    osc.start(t); osc.stop(t+0.15);
    osc2.start(t); osc2.stop(t+0.15);
  }catch(e){}
}

function sfxWallJump(){
  if(!actx) return;
  try{
    var t = actx.currentTime;
    var osc = actx.createOscillator();
    var gain = actx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(200, t);
    osc.frequency.exponentialRampToValueAtTime(500, t+0.08);
    osc.frequency.exponentialRampToValueAtTime(300, t+0.12);
    gain.gain.setValueAtTime(0.07, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t+0.14);
    osc.connect(gain); gain.connect(actx.destination);
    osc.start(t); osc.stop(t+0.15);
  }catch(e){}
}

function sfxOrb(){
  if(!actx) return;
  try{
    var t = actx.currentTime;
    var osc = actx.createOscillator();
    var gain = actx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, t);
    osc.frequency.exponentialRampToValueAtTime(1400, t+0.15);
    gain.gain.setValueAtTime(0.1, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t+0.2);
    osc.connect(gain); gain.connect(actx.destination);
    osc.start(t); osc.stop(t+0.21);
    // second harmonic
    var osc2 = actx.createOscillator();
    var gain2 = actx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(900, t+0.05);
    osc2.frequency.exponentialRampToValueAtTime(1800, t+0.2);
    gain2.gain.setValueAtTime(0.06, t+0.05);
    gain2.gain.exponentialRampToValueAtTime(0.001, t+0.25);
    osc2.connect(gain2); gain2.connect(actx.destination);
    osc2.start(t+0.05); osc2.stop(t+0.26);
  }catch(e){}
}

function sfxLand(){
  if(!actx) return;
  try{
    var t = actx.currentTime;
    var bufSize = Math.floor(actx.sampleRate * 0.08);
    var buf = actx.createBuffer(1, bufSize, actx.sampleRate);
    var data = buf.getChannelData(0);
    for(var i=0;i<bufSize;i++){
      data[i] = (Math.random()*2-1) * Math.pow(1-i/bufSize, 4);
    }
    var src = actx.createBufferSource();
    src.buffer = buf;
    var filter = actx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, t);
    var gain = actx.createGain();
    gain.gain.setValueAtTime(0.06, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t+0.08);
    src.connect(filter); filter.connect(gain); gain.connect(actx.destination);
    src.start(t);
  }catch(e){}
}

function sfxDeath(){
  if(!actx) return;
  try{
    var t = actx.currentTime;
    // descending tone
    var osc = actx.createOscillator();
    var gain = actx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(400, t);
    osc.frequency.exponentialRampToValueAtTime(60, t+0.6);
    gain.gain.setValueAtTime(0.1, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t+0.6);
    osc.connect(gain); gain.connect(actx.destination);
    osc.start(t); osc.stop(t+0.61);
    // noise burst
    var bufSize = Math.floor(actx.sampleRate * 0.3);
    var buf = actx.createBuffer(1, bufSize, actx.sampleRate);
    var data = buf.getChannelData(0);
    for(var i=0;i<bufSize;i++) data[i] = (Math.random()*2-1)*Math.pow(1-i/bufSize,2);
    var src = actx.createBufferSource();
    src.buffer = buf;
    var filter = actx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(600, t);
    filter.frequency.exponentialRampToValueAtTime(80, t+0.3);
    var gain2 = actx.createGain();
    gain2.gain.setValueAtTime(0.08, t);
    gain2.gain.exponentialRampToValueAtTime(0.001, t+0.3);
    src.connect(filter); filter.connect(gain2); gain2.connect(actx.destination);
    src.start(t);
  }catch(e){}
}

/* ───────── PROCEDURAL BGM — 8bit Chiptune Arpeggio ───────── */
var bgmInterval = null;
var bgmBeatIdx = 0;
function startBgm(){
  if(!actx || bgmInterval) return;
  var bpm = 140;
  var msPerStep = 60000/bpm/4; // 16th notes
  // C major arpeggio patterns for chiptune feel
  var arpNotes = [523,659,784,1047, 784,659,523,392, 440,554,659,880, 659,554,440,330];
  var bassNotes = [131,131,131,131, 131,131,131,131, 110,110,110,110, 110,110,110,110];
  bgmInterval = setInterval(function(){
    if(!actx) return;
    try{
      var t = actx.currentTime;
      var idx = bgmBeatIdx % arpNotes.length;
      // arp lead (square wave — classic chiptune)
      var osc = actx.createOscillator();
      var gain = actx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(arpNotes[idx], t);
      gain.gain.setValueAtTime(0.035, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + msPerStep/1200);
      osc.connect(gain); gain.connect(actx.destination);
      osc.start(t); osc.stop(t + msPerStep/1100);

      // bass (triangle — warm 8bit bass)
      if(bgmBeatIdx % 4 === 0){
        var bass = actx.createOscillator();
        var bg = actx.createGain();
        bass.type = 'triangle';
        bass.frequency.setValueAtTime(bassNotes[idx], t);
        bg.gain.setValueAtTime(0.05, t);
        bg.gain.exponentialRampToValueAtTime(0.001, t+0.12);
        bass.connect(bg); bg.connect(actx.destination);
        bass.start(t); bass.stop(t+0.13);
      }

      // hi-hat on every other step
      if(bgmBeatIdx % 2 === 1){
        var bufSize = Math.floor(actx.sampleRate * 0.02);
        var buf = actx.createBuffer(1, bufSize, actx.sampleRate);
        var data = buf.getChannelData(0);
        for(var i=0;i<bufSize;i++) data[i]=(Math.random()*2-1)*Math.pow(1-i/bufSize,6);
        var src = actx.createBufferSource();
        src.buffer = buf;
        var hpf = actx.createBiquadFilter();
        hpf.type='highpass'; hpf.frequency.setValueAtTime(9000, t);
        var hg = actx.createGain();
        hg.gain.setValueAtTime(0.025, t);
        hg.gain.exponentialRampToValueAtTime(0.001, t+0.02);
        src.connect(hpf); hpf.connect(hg); hg.connect(actx.destination);
        src.start(t);
      }

      bgmBeatIdx++;
    }catch(e){}
  }, msPerStep);
}

function stopBgm(){
  if(bgmInterval){ clearInterval(bgmInterval); bgmInterval=null; bgmBeatIdx=0; }
}

/* ───────── constants ───────── */
let W = window.innerWidth;
let H = window.innerHeight;
const GRAVITY = 720;
const PLAYER_SPEED = 260;
const JUMP_VEL = -420;
const DOUBLE_JUMP_VEL = -380;
const WALL_SLIDE_VEL = 80;
const WALL_JUMP_VEL_X = 320;
const WALL_JUMP_VEL_Y = -400;
const COYOTE_TIME = 100;
const JUMP_BUFFER = 120;
const PLATFORM_SCROLL_SPEED = 150;
const ORB_SCORE = 10;

const C = {
  bg: 0x0a0a1a,
  player: 0x00ffff,
  playerTrail: 0x0088aa,
  platformStart: 0xaa00ff,
  platformEnd: 0xff0066,
  orb: 0xffff00,
  orbGlow: 0xffcc00,
  spike: 0xff2244,
  grid: 0x1a1a3a,
  particle1: 0x00ffff,
  particle2: 0xff00ff,
  particle3: 0xffff00,
  deathParticle: 0xff0044,
  speedLine: 0x00ffff,
};

function hexColor(c){ return '#'+c.toString(16).padStart(6,'0'); }

/* ───────── BOOT scene (enhanced textures) ───────── */
class BootScene extends Phaser.Scene {
  constructor(){ super('Boot'); }

  preload(){
    // Player with gradient glow
    var pcan = document.createElement('canvas');
    pcan.width = 48; pcan.height = 64;
    var pctx = pcan.getContext('2d');
    // glow
    var pg = pctx.createRadialGradient(24,32,0,24,32,32);
    pg.addColorStop(0, '#00ffff44');
    pg.addColorStop(1, '#00ffff00');
    pctx.fillStyle = pg;
    pctx.fillRect(0,0,48,64);
    // body
    var bg = pctx.createLinearGradient(12,4,36,60);
    bg.addColorStop(0, '#ffffff');
    bg.addColorStop(0.3, '#00ffff');
    bg.addColorStop(1, '#006688');
    pctx.fillStyle = bg;
    pctx.fillRect(12,4,24,56);
    // eyes
    pctx.fillStyle = '#ffffff99';
    pctx.fillRect(16,12,6,6);
    pctx.fillRect(26,12,6,6);
    // visor line
    pctx.fillStyle = '#00dddd66';
    pctx.fillRect(14,30,20,3);
    this.textures.addCanvas('player', pcan);

    // Trail
    var tcan = document.createElement('canvas');
    tcan.width = 48; tcan.height = 64;
    var tctx = tcan.getContext('2d');
    var tg = tctx.createRadialGradient(24,32,0,24,32,28);
    tg.addColorStop(0, '#0088aa88');
    tg.addColorStop(1, '#0088aa00');
    tctx.fillStyle = tg;
    tctx.fillRect(0,0,48,64);
    this.textures.addCanvas('trail', tcan);

    // Platform tile
    var plcan = document.createElement('canvas');
    plcan.width = 64; plcan.height = 16;
    var plctx = plcan.getContext('2d');
    var plg = plctx.createLinearGradient(0,0,64,0);
    plg.addColorStop(0, '#aa00ff');
    plg.addColorStop(1, '#ff0066');
    plctx.fillStyle = plg;
    plctx.fillRect(0,0,64,16);
    plctx.fillStyle = '#ffffff33';
    plctx.fillRect(0,0,64,3);
    plctx.fillStyle = '#00000044';
    plctx.fillRect(0,13,64,3);
    // edge glow
    plctx.shadowColor = '#aa00ff';
    plctx.shadowBlur = 6;
    plctx.strokeStyle = '#aa00ff88';
    plctx.lineWidth = 1;
    plctx.strokeRect(0,0,64,16);
    this.textures.addCanvas('platform', plcan);

    // Moving platform
    var mpcan = document.createElement('canvas');
    mpcan.width = 64; mpcan.height = 16;
    var mpctx = mpcan.getContext('2d');
    var mpg = mpctx.createLinearGradient(0,0,64,0);
    mpg.addColorStop(0, '#ff00ff');
    mpg.addColorStop(1, '#ff44cc');
    mpctx.fillStyle = mpg;
    mpctx.fillRect(0,0,64,16);
    mpctx.fillStyle = '#ffffff44';
    mpctx.fillRect(0,0,64,4);
    mpctx.fillStyle = '#00000044';
    mpctx.fillRect(0,12,64,4);
    this.textures.addCanvas('movingPlatform', mpcan);

    // Orb with glow
    var ocan = document.createElement('canvas');
    ocan.width = 32; ocan.height = 32;
    var octx = ocan.getContext('2d');
    var og = octx.createRadialGradient(16,16,0,16,16,16);
    og.addColorStop(0, '#ffffff');
    og.addColorStop(0.3, '#ffff00');
    og.addColorStop(0.7, '#ffcc0066');
    og.addColorStop(1, '#ffcc0000');
    octx.fillStyle = og;
    octx.beginPath();
    octx.arc(16,16,16,0,Math.PI*2);
    octx.fill();
    this.textures.addCanvas('orb', ocan);

    // Spike with gradient
    var scan = document.createElement('canvas');
    scan.width = 32; scan.height = 32;
    var sctx = scan.getContext('2d');
    var sg = sctx.createLinearGradient(16,0,16,32);
    sg.addColorStop(0, '#ffffff');
    sg.addColorStop(0.3, '#ff2244');
    sg.addColorStop(1, '#ff224466');
    sctx.fillStyle = sg;
    sctx.beginPath();
    sctx.moveTo(16,2);
    sctx.lineTo(28,30);
    sctx.lineTo(4,30);
    sctx.closePath();
    sctx.fill();
    // glow
    sctx.shadowColor = '#ff2244';
    sctx.shadowBlur = 8;
    sctx.strokeStyle = '#ff224488';
    sctx.lineWidth = 1;
    sctx.stroke();
    this.textures.addCanvas('spike', scan);

    // Particle glow dot
    var parcan = document.createElement('canvas');
    parcan.width = 12; parcan.height = 12;
    var parctx = parcan.getContext('2d');
    var parg = parctx.createRadialGradient(6,6,0,6,6,6);
    parg.addColorStop(0, '#ffffff');
    parg.addColorStop(0.5, '#ffffff88');
    parg.addColorStop(1, '#ffffff00');
    parctx.fillStyle = parg;
    parctx.beginPath();
    parctx.arc(6,6,6,0,Math.PI*2);
    parctx.fill();
    this.textures.addCanvas('particle', parcan);

    // Small particle
    var spcan = document.createElement('canvas');
    spcan.width = 8; spcan.height = 8;
    var spctx = spcan.getContext('2d');
    var spg = spctx.createRadialGradient(4,4,0,4,4,4);
    spg.addColorStop(0, '#ffffff');
    spg.addColorStop(1, '#ffffff00');
    spctx.fillStyle = spg;
    spctx.beginPath();
    spctx.arc(4,4,4,0,Math.PI*2);
    spctx.fill();
    this.textures.addCanvas('smallParticle', spcan);
  }

  create(){
    document.getElementById('loading').style.display = 'none';
    this.scene.start('Game');
  }
}

/* ═══════════════════════════════════════════════
   GAME SCENE
   ═══════════════════════════════════════════════ */
class GameScene extends Phaser.Scene {
  constructor(){ super('Game'); }

  create(){
    this.cameras.main.setBackgroundColor(C.bg);

    // Audio init on first interaction
    this.audioReady = false;
    var self = this;
    var initAudio = function(){
      if(!self.audioReady){ ensureAudio(); self.audioReady = true; }
    };
    this.input.on('pointerdown', initAudio);
    this.input.keyboard.on('keydown', initAudio);

    // State
    this.score = 0;
    this.distance = 0;
    this.orbsCollected = 0;
    this.alive = true;
    this.gameStarted = false;
    this.scrollSpeed = PLATFORM_SCROLL_SPEED;
    this.difficultyMult = 1;
    this.lastPlatformX = W;
    this.lastPlatformY = H * 0.65;
    this.coyoteTimer = 0;
    this.jumpBufferTimer = 0;
    this.isDoubleJumpAvailable = true;
    this.isOnWall = false;
    this.wallSide = 0;
    this.jumpHeld = false;
    this.jumpCount = 0;
    this.touchLeft = false;
    this.touchRight = false;
    this.touchJump = false;
    this.trailPositions = [];
    this.deathTriggered = false;

    // Flash overlay
    this.flashOverlay = this.add.rectangle(W/2, H/2, W, H, 0xffffff, 0)
      .setScrollFactor(0).setDepth(150).setBlendMode(Phaser.BlendModes.ADD);

    // Grid background
    this.gridGraphics = this.add.graphics();
    this.gridOffset = 0;

    // Groups
    this.platforms = this.physics.add.staticGroup();
    this.movingPlatforms = this.physics.add.group({ allowGravity: false, immovable: true });
    this.orbs = this.physics.add.group({ allowGravity: false });
    this.spikes = this.physics.add.group({ allowGravity: false });

    // Trail (using Graphics instead of creating/destroying images)
    this.trailGfx = this.add.graphics().setDepth(8);

    // Player
    this.player = this.physics.add.sprite(W * 0.25, H * 0.5, 'player');
    this.player.setCollideWorldBounds(false);
    this.player.body.setGravityY(GRAVITY);
    this.player.body.setMaxVelocityY(600);
    this.player.body.setSize(20, 30);
    this.player.body.setOffset(14, 16);
    this.player.setDepth(10);
    this.player.setBlendMode(Phaser.BlendModes.ADD);

    // Jump particles
    this.jumpEmitter = this.add.particles(0, 0, 'particle', {
      speed: { min: 80, max: 200 },
      angle: { min: 60, max: 120 },
      scale: { start: 1, end: 0 },
      lifespan: 400,
      tint: [C.particle1, C.particle2],
      blendMode: 'ADD',
      emitting: false,
      quantity: 10,
    });
    this.jumpEmitter.setDepth(9);

    // Landing particles
    this.landEmitter = this.add.particles(0, 0, 'smallParticle', {
      speed: { min: 40, max: 120 },
      angle: { min: -150, max: -30 },
      scale: { start: 1, end: 0 },
      lifespan: 300,
      tint: [C.particle1, 0xffffff],
      blendMode: 'ADD',
      emitting: false,
      quantity: 8,
    });
    this.landEmitter.setDepth(9);

    // Orb collect particles
    this.orbEmitter = this.add.particles(0, 0, 'particle', {
      speed: { min: 50, max: 150 },
      angle: { min: 0, max: 360 },
      scale: { start: 1.2, end: 0 },
      lifespan: 400,
      tint: [C.orb, C.orbGlow, 0xffffff],
      blendMode: 'ADD',
      emitting: false,
      quantity: 12,
    });
    this.orbEmitter.setDepth(15);

    // Death particles
    this.deathEmitter = this.add.particles(0, 0, 'particle', {
      speed: { min: 100, max: 400 },
      angle: { min: 0, max: 360 },
      scale: { start: 1.5, end: 0 },
      lifespan: 800,
      tint: [C.deathParticle, C.particle2, C.player, 0xffffff],
      blendMode: 'ADD',
      emitting: false,
      quantity: 35,
    });
    this.deathEmitter.setDepth(20);

    // Speed lines
    this.speedLinesGfx = this.add.graphics().setDepth(5);

    // Initial platforms
    this.createStartPlatforms();

    // Colliders
    this.physics.add.collider(this.player, this.platforms, this.onLand, null, this);
    this.physics.add.collider(this.player, this.movingPlatforms, this.onLand, null, this);
    this.physics.add.overlap(this.player, this.orbs, this.collectOrb, null, this);
    this.physics.add.overlap(this.player, this.spikes, this.hitSpike, null, this);

    // HUD
    var fontSize = Math.max(16, Math.min(22, W * 0.04));
    this.scoreText = this.add.text(16, 16, 'SCORE: 0', {
      fontFamily: '"Courier New", monospace',
      fontSize: fontSize+'px',
      color: '#00ffff',
      stroke: '#003344',
      strokeThickness: 3,
      shadow: { offsetX:0, offsetY:0, color:'#00ffff', blur:6, fill:true }
    }).setScrollFactor(0).setDepth(100);

    this.distText = this.add.text(16, 16+fontSize+4, '0m', {
      fontFamily: '"Courier New", monospace',
      fontSize: (fontSize*0.65)+'px',
      color: '#8888aa',
    }).setScrollFactor(0).setDepth(100);

    // Combo/streak display
    this.streakCount = 0;
    this.streakTimer = 0;
    this.streakText = this.add.text(W-16, 16, '', {
      fontFamily: '"Courier New", monospace',
      fontSize: (fontSize*0.7)+'px',
      color: '#ff00ff',
      shadow: { offsetX:0, offsetY:0, color:'#ff00ff', blur:6, fill:true }
    }).setScrollFactor(0).setDepth(100).setOrigin(1, 0);

    // Start prompt
    this.startText = this.add.text(W/2, H * 0.35, 'TAP TO START', {
      fontFamily: '"Courier New", monospace',
      fontSize: '28px',
      color: '#00ffff',
      stroke: '#001122',
      strokeThickness: 4,
      shadow: { offsetX:0, offsetY:0, color:'#00ffff', blur:12, fill:true }
    }).setOrigin(0.5).setScrollFactor(0).setDepth(100);

    this.tweens.add({
      targets: this.startText,
      alpha: { from: 1, to: 0.3 },
      duration: 800, yoyo: true, repeat: -1,
    });

    this.controlsText = this.add.text(W/2, H * 0.45, 'ARROWS/WASD or TOUCH\nDOUBLE JUMP + WALL JUMP', {
      fontFamily: '"Courier New", monospace',
      fontSize: '12px',
      color: '#666688',
      align: 'center',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(100);

    // Keyboard
    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = this.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
      space: Phaser.Input.Keyboard.KeyCodes.SPACE,
    });

    // Touch
    this.input.on('pointerdown', (pointer) => {
      if (!this.gameStarted){ this.startGame(); return; }
      if (!this.alive) return;
      if (pointer.x < W * 0.5) this.touchLeft = true;
      else this.touchRight = true;
      this.touchJump = true;
      this.jumpBufferTimer = JUMP_BUFFER;
    });

    this.input.on('pointerup', (pointer) => {
      const pointers = this.input.manager.pointers;
      let anyLeft = false, anyRight = false;
      for (let i = 0; i < pointers.length; i++) {
        if (pointers[i].isDown) {
          if (pointers[i].x < W * 0.5) anyLeft = true;
          else anyRight = true;
        }
      }
      this.touchLeft = anyLeft;
      this.touchRight = anyRight;
      this.touchJump = false;
      this.jumpHeld = false;
    });

    this.input.on('pointermove', (pointer) => {
      if (!pointer.isDown) return;
      if (pointer.x < W * 0.5) { this.touchLeft = true; this.touchRight = false; }
      else { this.touchRight = true; this.touchLeft = false; }
    });

    this.input.keyboard.on('keyup-UP', () => { this.jumpHeld = false; });
    this.input.keyboard.on('keyup-W', () => { this.jumpHeld = false; });
    this.input.keyboard.on('keyup-SPACE', () => { this.jumpHeld = false; });

    this.wasOnGround = false;

    // Camera
    this.cameras.main.startFollow(this.player, false, 0, 0.08, 0, H * 0.15);
    this.cameras.main.setFollowOffset(-(W * 0.25 - W/2), 0);
  }

  startGame(){
    this.gameStarted = true;
    if (this.startText) this.startText.destroy();
    if (this.controlsText) this.controlsText.destroy();
    startBgm();
  }

  flashScreen(color, intensity, duration){
    this.flashOverlay.setFillStyle(color, intensity);
    this.tweens.add({
      targets: this.flashOverlay, alpha: {from:intensity, to:0},
      duration: duration || 200
    });
  }

  createStartPlatforms(){
    const groundY = H * 0.75;
    for (let x = -64; x < W + 128; x += 64) {
      this.spawnPlatform(x, groundY, false);
    }
    this.lastPlatformX = W + 64;
    this.lastPlatformY = groundY;
    for (let i = 0; i < 5; i++) {
      this.generateNextPlatform();
    }
  }

  spawnPlatform(x, y, isMoving){
    if (isMoving) {
      const p = this.movingPlatforms.create(x, y, 'movingPlatform');
      p.setOrigin(0, 0);
      p.body.setSize(64, 16);
      p.body.setAllowGravity(false);
      p.body.setImmovable(true);
      p.originY = y;
      p.moveAmplitude = 30 + Math.random() * 40;
      p.moveSpeed = 1.5 + Math.random() * 1.5;
      p.movePhase = Math.random() * Math.PI * 2;
      p.body.checkCollision.down = false;
      p.body.checkCollision.left = false;
      p.body.checkCollision.right = false;
      return p;
    } else {
      const p = this.platforms.create(x, y, 'platform');
      p.setOrigin(0, 0);
      p.refreshBody();
      p.body.checkCollision.down = false;
      p.body.checkCollision.left = false;
      p.body.checkCollision.right = false;
      return p;
    }
  }

  generateNextPlatform(){
    const minGap = Math.max(80, 140 - this.difficultyMult * 8);
    const maxGap = Math.min(280, 160 + this.difficultyMult * 15);
    const gap = Phaser.Math.Between(minGap, maxGap);
    const platWidth = Phaser.Math.Between(2, Math.max(2, 5 - Math.floor(this.difficultyMult * 0.3))) * 64;
    const yDelta = Phaser.Math.Between(-80, 60);
    let newY = Phaser.Math.Clamp(this.lastPlatformY + yDelta, H * 0.2, H * 0.85);
    const newX = this.lastPlatformX + gap;

    const isMoving = Math.random() < Math.min(0.3, 0.05 + this.difficultyMult * 0.03);
    const tiles = platWidth / 64;

    for (let i = 0; i < tiles; i++) {
      this.spawnPlatform(newX + i * 64, newY, isMoving);
    }

    // Orbs
    if (Math.random() < 0.5) {
      const orbCount = Phaser.Math.Between(1, 3);
      for (let i = 0; i < orbCount; i++) {
        const ox = newX + Phaser.Math.Between(8, platWidth - 8);
        const oy = newY - Phaser.Math.Between(40, 80);
        const orb = this.orbs.create(ox, oy, 'orb');
        orb.setOrigin(0.5);
        orb.body.setAllowGravity(false);
        orb.body.setSize(12, 12);
        orb.baseY = oy;
        orb.bobPhase = Math.random() * Math.PI * 2;
        orb.setBlendMode(Phaser.BlendModes.ADD);
      }
    }

    // Spikes
    if (Math.random() < Math.min(0.35, 0.05 + this.difficultyMult * 0.04) && tiles >= 2) {
      const spikeCount = Phaser.Math.Between(1, Math.min(3, tiles - 1));
      const usedPositions = new Set();
      for (let i = 0; i < spikeCount; i++) {
        let pos;
        do { pos = Phaser.Math.Between(0, tiles - 1); } while (usedPositions.has(pos));
        usedPositions.add(pos);
        const sx = newX + pos * 64 + 24;
        const sy = newY - 14;
        const spike = this.spikes.create(sx, sy, 'spike');
        spike.setOrigin(0.5, 1);
        spike.body.setSize(12, 12);
        spike.body.setAllowGravity(false);
      }
    }

    this.lastPlatformX = newX + platWidth;
    this.lastPlatformY = newY;
  }

  collectOrb(player, orb){
    if (!orb.active) return;
    var ox = orb.x, oy = orb.y;
    orb.body.enable = false;

    sfxOrb();

    // Orb collect animation: scale up + fade
    this.tweens.add({
      targets: orb,
      scaleX: 2, scaleY: 2, alpha: 0,
      duration: 250, ease: 'Power2',
      onComplete: function(){ orb.destroy(); }
    });

    // Particles
    this.orbEmitter.emitParticleAt(ox, oy, 12);

    // Score popup
    var ft = this.add.text(ox, oy, '+' + ORB_SCORE, {
      fontFamily:'"Courier New", monospace', fontSize:'18px', color:'#ffff00',
      stroke:'#000', strokeThickness:2,
      shadow: { offsetX:0, offsetY:0, color:'#ffff00', blur:8, fill:true }
    }).setOrigin(0.5).setDepth(50).setScale(0.5);
    this.tweens.add({
      targets: ft, y: oy-45, alpha:0, scaleX:1.2, scaleY:1.2,
      duration:600, ease:'Power2',
      onComplete: function(){ ft.destroy(); }
    });

    this.orbsCollected++;
    this.score += ORB_SCORE;
    this.updateScore();

    // Streak
    this.streakCount++;
    this.streakTimer = 3000;
    if (this.streakCount >= 3) {
      this.streakText.setText('\\u{1f525} ' + this.streakCount + ' STREAK');
    }

    // Flash
    this.flashScreen(0xffff00, 0.12, 150);
  }

  hitSpike(player, spike){
    if (!this.alive) return;
    this.die();
  }

  onLand(player, platform){
    if (player.body.touching.down) {
      if (!this.wasOnGround && this.alive) {
        this.landEmitter.emitParticleAt(player.x, player.y + 16, 8);
        sfxLand();
      }
      this.jumpCount = 0;
      this.isDoubleJumpAvailable = true;
      this.coyoteTimer = COYOTE_TIME;
    }
  }

  die(){
    if (this.deathTriggered) return;
    this.deathTriggered = true;
    this.alive = false;

    stopBgm();
    sfxDeath();

    // Multi-layer death explosion
    this.deathEmitter.emitParticleAt(this.player.x, this.player.y, 35);
    this.player.setVisible(false);
    this.player.body.setVelocity(0, 0);
    this.player.body.setAllowGravity(false);

    this.cameras.main.shake(400, 0.02);
    this.flashScreen(0xff0044, 0.35, 300);

    const finalScore = this.score;
    var self = this;

    this.time.delayedCall(700, () => {
      var overlay = this.add.rectangle(W/2, H/2, W, H, 0x000000, 0)
        .setScrollFactor(0).setDepth(200);
      this.tweens.add({ targets: overlay, fillAlpha: 0.7, duration: 400 });

      var goText = this.add.text(W/2, H * 0.33, 'GAME OVER', {
        fontFamily: '"Courier New", monospace',
        fontSize: '34px', color: '#ff0066',
        stroke: '#330011', strokeThickness: 4,
        shadow: { offsetX:0, offsetY:0, color:'#ff0066', blur:15, fill:true }
      }).setOrigin(0.5).setScrollFactor(0).setDepth(201).setScale(0.3).setAlpha(0);

      this.tweens.add({
        targets: goText, alpha:1, scaleX:1, scaleY:1, duration:400, ease:'Back.easeOut'
      });

      this.time.delayedCall(300, () => {
        this.add.text(W/2, H * 0.46, 'SCORE: ' + finalScore, {
          fontFamily: '"Courier New", monospace',
          fontSize: '22px', color: '#00ffff',
          stroke:'#000', strokeThickness:3,
          shadow: { offsetX:0, offsetY:0, color:'#00ffff', blur:8, fill:true }
        }).setOrigin(0.5).setScrollFactor(0).setDepth(201);

        this.add.text(W/2, H * 0.54, Math.floor(this.distance) + 'm  \\u2022  ' + this.orbsCollected + ' orbs', {
          fontFamily: '"Courier New", monospace',
          fontSize: '14px', color: '#8888aa',
        }).setOrigin(0.5).setScrollFactor(0).setDepth(201);

        var retry = this.add.text(W/2, H * 0.66, '\\u25b6 TAP TO RETRY', {
          fontFamily: '"Courier New", monospace',
          fontSize: '18px', color: '#ffff00',
        }).setOrigin(0.5).setScrollFactor(0).setDepth(201).setInteractive();

        this.tweens.add({
          targets: retry, alpha: { from: 1, to: 0.3 },
          duration: 700, yoyo: true, repeat: -1,
        });

        this.time.delayedCall(300, () => {
          retry.on('pointerdown', () => { this.scene.restart(); });
          this.input.keyboard.once('keydown-SPACE', () => { this.scene.restart(); });
          this.input.keyboard.once('keydown-ENTER', () => { this.scene.restart(); });
        });
      });

      this.tweens.add({
        targets: goText, scaleX:1.05, scaleY:1.05, yoyo:true,
        repeat:-1, duration:700, ease:'Sine.easeInOut'
      });

      try {
        window.parent.postMessage({ type: 'gameOver', score: finalScore }, '*');
      } catch(e){}
    });
  }

  updateScore(){
    this.scoreText.setText('SCORE: ' + this.score);
    this.distText.setText(Math.floor(this.distance) + 'm  \\u2022  ' + this.orbsCollected + ' orbs');
  }

  drawGrid(dt){
    const g = this.gridGraphics;
    g.clear();
    g.lineStyle(1, C.grid, 0.25);

    this.gridOffset = (this.gridOffset + this.scrollSpeed * dt * 0.001) % 60;
    const camY = this.cameras.main.scrollY;
    const startY = Math.floor(camY / 60) * 60;

    for (let x = -this.gridOffset; x < W + 60; x += 60) {
      g.lineBetween(x, camY, x, camY + H);
    }
    for (let y = startY; y < camY + H + 60; y += 60) {
      g.lineBetween(0, y, W, y);
    }
    g.setDepth(0);
    g.setScrollFactor(0);
    g.setPosition(0, 0);
  }

  drawSpeedLines(dt){
    const g = this.speedLinesGfx;
    g.clear();
    if (!this.alive || !this.gameStarted) return;

    const speed = Math.abs(this.player.body.velocity.x) + this.scrollSpeed;
    if (speed < 200) return;

    const alpha = Math.min(0.4, (speed - 200) / 600);
    g.lineStyle(1, C.speedLine, alpha);

    for (let i = 0; i < 6; i++) {
      const ly = this.player.y + Phaser.Math.Between(-80, 80);
      const lx = this.player.x + Phaser.Math.Between(-40, -10);
      const len = Phaser.Math.Between(20, 60);
      g.lineBetween(lx - len, ly, lx, ly);
    }
  }

  updateTrail(){
    // Use Graphics to draw trail instead of creating/destroying images
    this.trailGfx.clear();
    if (this.alive && this.player.visible) {
      this.trailPositions.unshift({ x: this.player.x, y: this.player.y, a: 0.6 });
    }
    if (this.trailPositions.length > 10) this.trailPositions.length = 10;

    for (let i = 1; i < this.trailPositions.length; i++) {
      const t = this.trailPositions[i];
      t.a *= 0.72;
      if (t.a < 0.04) continue;
      var r = Math.floor(0);
      var g = Math.floor(160 * t.a);
      var b = Math.floor(255 * t.a);
      this.trailGfx.fillStyle(Phaser.Display.Color.GetColor(r, g, b), t.a * 0.8);
      this.trailGfx.fillRect(t.x - 10, t.y - 14, 20, 28);
    }
  }

  tryJump(){
    const onGround = this.player.body.blocked.down || this.player.body.touching.down;
    const canCoyote = !onGround && this.coyoteTimer > 0 && this.jumpCount === 0;

    if (this.isOnWall && !onGround) {
      // Wall jump
      this.player.body.setVelocityY(WALL_JUMP_VEL_Y);
      this.player.body.setVelocityX(-this.wallSide * WALL_JUMP_VEL_X);
      this.jumpCount = 1;
      this.isDoubleJumpAvailable = true;
      this.coyoteTimer = 0;
      this.jumpHeld = true;
      this.jumpEmitter.setParticleTint([0xff00ff, 0xaa00ff]);
      this.jumpEmitter.emitParticleAt(this.player.x + this.wallSide * 12, this.player.y, 10);
      sfxWallJump();
      return true;
    }

    if (onGround || canCoyote) {
      this.player.body.setVelocityY(JUMP_VEL);
      this.jumpCount = 1;
      this.coyoteTimer = 0;
      this.jumpHeld = true;
      this.jumpEmitter.setParticleTint([C.particle1, 0xffffff]);
      this.jumpEmitter.emitParticleAt(this.player.x, this.player.y + 16, 10);
      sfxJump();
      return true;
    }

    if (this.isDoubleJumpAvailable && this.jumpCount >= 1) {
      this.player.body.setVelocityY(DOUBLE_JUMP_VEL);
      this.isDoubleJumpAvailable = false;
      this.jumpCount = 2;
      this.jumpHeld = true;
      this.jumpEmitter.setParticleTint([C.particle2, C.particle3]);
      this.jumpEmitter.emitParticleAt(this.player.x, this.player.y + 16, 14);
      sfxDoubleJump();
      return true;
    }

    return false;
  }

  update(time, delta){
    if (!this.alive && this.deathTriggered) return;

    const dt = Math.min(delta, 33.33);
    this.drawGrid(dt);

    if (!this.gameStarted) {
      this.player.y = H * 0.5 + Math.sin(time * 0.003) * 8;
      return;
    }

    if (!this.alive) return;

    const onGround = this.player.body.blocked.down || this.player.body.touching.down;

    // Coyote time
    if (onGround) this.coyoteTimer = COYOTE_TIME;
    else this.coyoteTimer -= dt;

    // Wall detection
    this.isOnWall = false;
    if (!onGround) {
      if (this.player.body.blocked.left) { this.isOnWall = true; this.wallSide = -1; }
      else if (this.player.body.blocked.right) { this.isOnWall = true; this.wallSide = 1; }
    }

    // Wall slide
    if (this.isOnWall && this.player.body.velocity.y > 0) {
      this.player.body.setVelocityY(WALL_SLIDE_VEL);
      if (Math.random() < 0.3) {
        this.landEmitter.emitParticleAt(
          this.player.x + this.wallSide * -12,
          this.player.y + Phaser.Math.Between(-10, 10), 1
        );
      }
    }

    // Jump buffer
    this.jumpBufferTimer -= dt;

    // Input
    const leftKey = this.cursors.left.isDown || this.wasd.left.isDown;
    const rightKey = this.cursors.right.isDown || this.wasd.right.isDown;
    const jumpKey = this.cursors.up.isDown || this.wasd.up.isDown || this.wasd.space.isDown;
    const jumpJustPressed = Phaser.Input.Keyboard.JustDown(this.cursors.up)
      || Phaser.Input.Keyboard.JustDown(this.wasd.up)
      || Phaser.Input.Keyboard.JustDown(this.wasd.space);

    let moveDir = 0;
    if (leftKey || this.touchLeft) moveDir = -1;
    if (rightKey || this.touchRight) moveDir = 1;

    const targetVx = moveDir * PLAYER_SPEED;
    const currentVx = this.player.body.velocity.x;
    const accel = onGround ? 0.2 : 0.12;
    this.player.body.setVelocityX(Phaser.Math.Linear(currentVx, targetVx, accel));

    if (jumpJustPressed || this.touchJump) {
      this.jumpBufferTimer = JUMP_BUFFER;
      this.touchJump = false;
    }

    if (this.jumpBufferTimer > 0) {
      if (this.tryJump()) this.jumpBufferTimer = 0;
    }

    // Variable jump height (cleaned up)
    if (!jumpKey && !this.touchJump && this.player.body.velocity.y < 0) {
      this.player.body.setVelocityY(this.player.body.velocity.y * 0.92);
    }

    // Scroll
    const scrollDelta = this.scrollSpeed * dt * 0.001;
    this.distance += scrollDelta * 0.1;
    this.score = Math.floor(this.distance) + this.orbsCollected * ORB_SCORE;
    this.updateScore();

    this.difficultyMult = 1 + this.distance * 0.008;
    this.scrollSpeed = PLATFORM_SCROLL_SPEED + this.distance * 0.5;

    // Move platforms
    this.platforms.children.each((p) => {
      p.x -= scrollDelta;
      p.refreshBody();
      if (p.x < -128) p.destroy();
    });

    this.movingPlatforms.children.each((p) => {
      p.x -= scrollDelta;
      p.y = p.originY + Math.sin(time * 0.001 * p.moveSpeed + p.movePhase) * p.moveAmplitude;
      p.body.updateFromGameObject();
      if (p.x < -128) p.destroy();
    });

    this.orbs.children.each((o) => {
      if (!o.active) return;
      o.x -= scrollDelta;
      o.y = o.baseY + Math.sin(time * 0.004 + o.bobPhase) * 8;
      o.setScale(0.8 + Math.sin(time * 0.006 + o.bobPhase) * 0.2);
      o.setAlpha(0.7 + Math.sin(time * 0.005) * 0.3);
      if (o.x < -32) o.destroy();
    });

    this.spikes.children.each((s) => {
      s.x -= scrollDelta;
      if (s.x < -32) s.destroy();
    });

    // Generate
    const camRight = this.cameras.main.scrollX + W + 200;
    while (this.lastPlatformX < camRight + W) {
      this.generateNextPlatform();
    }
    this.lastPlatformX -= scrollDelta;

    // Player tint
    if (this.isOnWall) {
      this.player.setTint(0xff00ff);
    } else if (!onGround && this.jumpCount >= 2) {
      this.player.setTint(0xffff00);
    } else {
      this.player.setTint(C.player);
    }

    // Trail
    this.updateTrail();

    // Speed lines
    this.drawSpeedLines(dt);

    // Streak timer
    if (this.streakTimer > 0) {
      this.streakTimer -= dt;
      if (this.streakTimer <= 0) {
        this.streakCount = 0;
        this.streakText.setText('');
      }
    }

    // Death checks
    if (this.player.y > this.cameras.main.scrollY + H + 50) this.die();
    if (this.player.x < this.cameras.main.scrollX - 50) this.die();

    this.wasOnGround = onGround;

    // Player pulse
    if (onGround) {
      this.player.setScale(1);
    } else {
      this.player.setScale(1 + Math.sin(time * 0.01) * 0.03);
    }
  }
}

const config = {
  type: Phaser.AUTO,
  width: W,
  height: H,
  parent: document.body,
  backgroundColor: '#0a0a1a',
  physics: {
    default: 'arcade',
    arcade: { gravity: { y: 0 }, debug: false },
  },
  scale: {
    mode: Phaser.Scale.NONE,
    autoCenter: Phaser.Scale.NO_CENTER,
  },
  input: { activePointers: 3 },
  scene: [BootScene, GameScene],
  render: { pixelArt: false, antialias: true },
};

const game = new Phaser.Game(config);

window.addEventListener('resize', () => {
  W = window.innerWidth;
  H = window.innerHeight;
  game.scale.resize(window.innerWidth, window.innerHeight);
});

// ====== VIBE CODING: postMessage HANDLERS ======
window.addEventListener('message', function(e){
  if(!e.data || !e.data.type) return;
  var sc = game.scene.scenes[1]; // GameScene
  if(!sc) return;
  switch(e.data.type){
    case 'SET_SCROLL_SPEED':
      sc.scrollSpeed = parseFloat(e.data.value)||2;
      break;
    case 'SET_DIFFICULTY':
      sc.difficultyMult = parseFloat(e.data.value)||1;
      break;
    case 'SET_INVINCIBLE':
      sc.alive = true;
      sc._vibeInvincible = !!e.data.value;
      break;
    case 'SET_GAME_SPEED':
      game.loop.targetFps = 60 * (parseFloat(e.data.value)||1);
      break;
  }
});

})();
<\/script>
</body>
</html>`;
