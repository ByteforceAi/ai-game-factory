export interface DemoGame {
  id: string;
  title: string;
  description: string;
  prompt: string;
  icon: string;
  accentColor: string;
  html: string;
}

const RHYTHM_GAME_HTML = `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<title>리듬 게임</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{background:#000;display:flex;justify-content:center;align-items:center;height:100vh;overflow:hidden}
canvas{border:1px solid #111;border-radius:4px}
</style>
</head>
<body>
<canvas id="gameCanvas" width="600" height="400"></canvas>
<script>
var canvas=document.getElementById('gameCanvas'),ctx=canvas.getContext('2d');
var score=0,gameOver=false,keys={};
var state='start',tick=0,combo=0,maxCombo=0,health=100;
var bpm=120,beatInterval=500,beatTimer=0,beatCount=0,beatPhase=0;
var notes=[],judgements=[],particles=[];
var audioCtx=null,masterGain=null,nextBassTime=0,nextMelodyTime=0,nextDrumTime=0;
var bassStep=0,melodyStep=0,drumStep=0;
var laneKeys=['d','f','j','k'],arrowKeys=['ArrowLeft','ArrowDown','ArrowUp','ArrowRight'];
var laneColors=['#00ffff','#ff69b4','#ffff00','#39ff14'];
var lanePressTime=[0,0,0,0],laneGlow=[0,0,0,0];
var LANE_X=[112,212,312,412],LANE_W=80,JUDGE_Y=330,NOTE_SPEED=4;
var pulseScale=1,pulseAlpha=0;
var bgHue=200;

var pentatonic=[60,62,64,67,69,72,74,76,79,81];
var bassPattern=[36,36,43,36,36,43,41,36];
var drumPattern=[1,0,0,0,1,0,1,0,1,0,0,0,1,0,0,1];

function initAudio(){
  if(audioCtx)return;
  audioCtx=new(window.AudioContext||window.webkitAudioContext)();
  masterGain=audioCtx.createGain();masterGain.gain.value=0.55;masterGain.connect(audioCtx.destination);
  nextBassTime=audioCtx.currentTime+0.05;
  nextMelodyTime=audioCtx.currentTime+0.05;
  nextDrumTime=audioCtx.currentTime+0.05;
}

function midiToHz(m){return 440*Math.pow(2,(m-69)/12)}

function scheduleAudio(){
  if(!audioCtx||state!=='playing')return;
  var now=audioCtx.currentTime,ahead=0.2;
  var beat=60/bpm;
  // Bass line (quarter notes)
  while(nextBassTime<now+ahead){
    var note=bassPattern[bassStep%bassPattern.length];
    var o=audioCtx.createOscillator(),g=audioCtx.createGain();
    o.type='square';o.frequency.value=midiToHz(note);
    g.gain.setValueAtTime(0,nextBassTime);
    g.gain.linearRampToValueAtTime(0.22,nextBassTime+0.01);
    g.gain.linearRampToValueAtTime(0.12,nextBassTime+beat*0.4);
    g.gain.linearRampToValueAtTime(0,nextBassTime+beat*0.85);
    o.connect(g);g.connect(masterGain);o.start(nextBassTime);o.stop(nextBassTime+beat);
    bassStep++;nextBassTime+=beat;
  }
  // Melody (eighth notes)
  while(nextMelodyTime<now+ahead){
    if(Math.random()<0.65){
      var note=pentatonic[Math.floor(Math.random()*pentatonic.length)]+12;
      var o=audioCtx.createOscillator(),g=audioCtx.createGain();
      o.type='triangle';o.frequency.value=midiToHz(note);
      g.gain.setValueAtTime(0,nextMelodyTime);
      g.gain.linearRampToValueAtTime(0.14,nextMelodyTime+0.01);
      g.gain.linearRampToValueAtTime(0,nextMelodyTime+beat*0.4);
      o.connect(g);g.connect(masterGain);o.start(nextMelodyTime);o.stop(nextMelodyTime+beat*0.5);
      melodyStep++;
    }
    nextMelodyTime+=beat*0.5;
  }
  // Drums
  while(nextDrumTime<now+ahead){
    var ds=drumPattern[drumStep%drumPattern.length];
    var isKick=(drumStep%8===0)||(drumStep%8===4);
    var isSnare=(drumStep%8===2)||(drumStep%8===6);
    var isHat=ds===1;
    var beat16=beat*0.25;
    if(isKick){
      var o=audioCtx.createOscillator(),g=audioCtx.createGain();
      o.type='sine';o.frequency.setValueAtTime(150,nextDrumTime);
      o.frequency.exponentialRampToValueAtTime(40,nextDrumTime+0.08);
      g.gain.setValueAtTime(0.4,nextDrumTime);g.gain.linearRampToValueAtTime(0,nextDrumTime+0.12);
      o.connect(g);g.connect(masterGain);o.start(nextDrumTime);o.stop(nextDrumTime+0.12);
    }
    if(isSnare){
      var buf=audioCtx.createBuffer(1,audioCtx.sampleRate*0.1,audioCtx.sampleRate);
      var d=buf.getChannelData(0);for(var i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/d.length,2);
      var src=audioCtx.createBufferSource(),g2=audioCtx.createGain();
      src.buffer=buf;g2.gain.setValueAtTime(0.18,nextDrumTime);g2.gain.linearRampToValueAtTime(0,nextDrumTime+0.1);
      src.connect(g2);g2.connect(masterGain);src.start(nextDrumTime);
    }
    if(isHat&&!isKick&&!isSnare){
      var buf=audioCtx.createBuffer(1,audioCtx.sampleRate*0.04,audioCtx.sampleRate);
      var d=buf.getChannelData(0);for(var i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/d.length,1.5);
      var hpf=audioCtx.createBiquadFilter();hpf.type='highpass';hpf.frequency.value=8000;
      var src=audioCtx.createBufferSource(),g2=audioCtx.createGain();
      src.buffer=buf;g2.gain.setValueAtTime(0.08,nextDrumTime);g2.gain.linearRampToValueAtTime(0,nextDrumTime+0.04);
      src.connect(hpf);hpf.connect(g2);g2.connect(masterGain);src.start(nextDrumTime);
    }
    drumStep++;nextDrumTime+=beat16;
  }
}

function playHit(quality){
  if(!audioCtx)return;
  var o=audioCtx.createOscillator(),g=audioCtx.createGain(),t=audioCtx.currentTime;
  if(quality===2){o.type='sine';o.frequency.setValueAtTime(880,t);o.frequency.linearRampToValueAtTime(1200,t+0.05);g.gain.setValueAtTime(0.18,t);g.gain.linearRampToValueAtTime(0,t+0.08)}
  else if(quality===1){o.type='triangle';o.frequency.setValueAtTime(600,t);g.gain.setValueAtTime(0.12,t);g.gain.linearRampToValueAtTime(0,t+0.07)}
  else{o.type='sawtooth';o.frequency.setValueAtTime(200,t);g.gain.setValueAtTime(0.1,t);g.gain.linearRampToValueAtTime(0,t+0.06)}
  o.connect(g);g.connect(masterGain);o.start(t);o.stop(t+0.12);
}

function spawnNote(){
  var lane=Math.floor(Math.random()*4);
  notes.push({lane:lane,y:-10,time:Date.now(),hit:false,miss:false});
  if(Math.random()<0.45){
    var lane2=(lane+1+Math.floor(Math.random()*3))%4;
    notes.push({lane:lane2,y:-10,time:Date.now(),hit:false,miss:false});
  }
}

function judge(lane){
  var best=null,bestDiff=9999;
  for(var i=0;i<notes.length;i++){
    var n=notes[i];
    if(n.lane!==lane||n.hit||n.miss)continue;
    var diff=Math.abs(n.y-JUDGE_Y);
    if(diff<bestDiff){bestDiff=diff;best=n}
  }
  var ms=bestDiff*(1000/60/NOTE_SPEED);
  if(!best||ms>150){
    addJudge(lane,'MISS',0);combo=0;health=Math.max(0,health-8);if(health===0){endGame();}return;
  }
  best.hit=true;
  var q=ms<=30?2:ms<=80?1:0;
  if(q===0){addJudge(lane,'MISS',0);combo=0;health=Math.max(0,health-5);if(health===0)endGame();}
  else{
    combo++;if(combo>maxCombo)maxCombo=combo;
    var mult=combo>=50?4:combo>=25?3:combo>=10?2:1;
    var pts=q===2?300:100;
    score+=pts*mult;
    addJudge(lane,q===2?'PERFECT':'GREAT',q);
    burst(LANE_X[lane]+LANE_W/2,JUDGE_Y,laneColors[lane],q===2?16:10);
    playHit(q);
  }
}

function addJudge(lane,text,quality){
  judgements.push({lane:lane,text:text,quality:quality,y:JUDGE_Y-20,alpha:1,timer:40});
}

function burst(x,y,color,count){
  for(var i=0;i<count;i++){
    var a=Math.random()*Math.PI*2,spd=2+Math.random()*5;
    particles.push({x:x,y:y,vx:Math.cos(a)*spd,vy:Math.sin(a)*spd-2,color:color,life:25+Math.random()*15,maxLife:40,size:2+Math.random()*3});
  }
}

function endGame(){gameOver=true;state='gameover'}

function initGame(){
  score=0;gameOver=false;combo=0;maxCombo=0;health=100;
  notes=[];judgements=[];particles=[];laneGlow=[0,0,0,0];
  bpm=120;beatInterval=500;beatTimer=0;beatCount=0;beatPhase=0;
  bassStep=0;melodyStep=0;drumStep=0;bgHue=200;pulseScale=1;
  if(audioCtx){nextBassTime=audioCtx.currentTime+0.05;nextMelodyTime=audioCtx.currentTime+0.05;nextDrumTime=audioCtx.currentTime+0.05;}
}

document.addEventListener('keydown',function(e){
  if(['ArrowLeft','ArrowDown','ArrowUp','ArrowRight','ArrowLeft',' '].indexOf(e.key)>=0||'dfjk'.indexOf(e.key)>=0)e.preventDefault();
  if(keys[e.key])return;keys[e.key]=true;
  initAudio();
  if(state==='start'){state='playing';initGame();return}
  if(state==='gameover'&&e.key===' '){state='playing';initGame();return}
  if(state!=='playing')return;
  var li=laneKeys.indexOf(e.key);
  if(li<0)li=arrowKeys.indexOf(e.key);
  if(li>=0){laneGlow[li]=1;judge(li)}
});
document.addEventListener('keyup',function(e){
  keys[e.key]=false;
  var li=laneKeys.indexOf(e.key);if(li<0)li=arrowKeys.indexOf(e.key);
  if(li>=0)laneGlow[li]=0;
});

function update(){
  tick++;
  if(state!=='playing')return;
  scheduleAudio();
  // BPM ramp every 32 beats
  beatTimer+=16.67;
  if(beatTimer>=beatInterval){
    beatTimer-=beatInterval;beatCount++;beatPhase=1;
    pulseScale=1.018;pulseAlpha=0.22;
    if(beatCount%32===0&&beatCount>0){bpm=Math.min(180,bpm+8);beatInterval=60000/bpm;}
    if(beatCount%2===0)spawnNote();
    bgHue=(bgHue+3)%360;
  }
  // Note speed scales with bpm
  NOTE_SPEED=3+((bpm-120)/60)*2.5;
  for(var i=notes.length-1;i>=0;i--){
    var n=notes[i];n.y+=NOTE_SPEED;
    if(!n.hit&&!n.miss&&n.y>JUDGE_Y+50){
      n.miss=true;combo=0;health=Math.max(0,health-6);
      addJudge(n.lane,'MISS',0);if(health===0){endGame();return}
    }
    if(n.y>450)notes.splice(i,1);
  }
  for(var i=judgements.length-1;i>=0;i--){
    var j=judgements[i];j.y-=0.7;j.timer--;j.alpha=j.timer/40;
    if(j.timer<=0)judgements.splice(i,1);
  }
  for(var i=particles.length-1;i>=0;i--){
    var p=particles[i];p.x+=p.vx;p.y+=p.vy;p.vy+=0.12;p.life--;
    if(p.life<=0)particles.splice(i,1);
  }
  for(var i=0;i<4;i++)laneGlow[i]=Math.max(0,laneGlow[i]-0.04);
  pulseScale+=(1-pulseScale)*0.12;pulseAlpha*=0.92;
}

function draw(){
  ctx.save();
  // Beat pulse: scale from center
  if(pulseScale!==1){
    ctx.translate(300,200);ctx.scale(pulseScale,pulseScale);ctx.translate(-300,-200);
  }
  // Background
  var hue=combo>50?bgHue:combo>20?(bgHue+30)%360:200;
  ctx.fillStyle='hsl('+hue+',15%,3%)';ctx.fillRect(0,0,600,400);
  // Beat flash
  if(pulseAlpha>0.01){ctx.fillStyle='rgba(255,255,255,'+pulseAlpha.toFixed(3)+')';ctx.fillRect(0,0,600,400)}
  // Lane guides
  for(var i=0;i<4;i++){
    var lx=LANE_X[i],g2=laneGlow[i];
    ctx.fillStyle='rgba(255,255,255,0.02)';ctx.fillRect(lx,0,LANE_W,400);
    if(g2>0){ctx.fillStyle='rgba('+hexToRgb(laneColors[i])+','+g2*0.18+')';ctx.fillRect(lx,0,LANE_W,400)}
    ctx.strokeStyle='rgba(255,255,255,0.06)';ctx.lineWidth=1;ctx.strokeRect(lx,0,LANE_W,400);
  }
  // Judgment line
  var jg=ctx.createLinearGradient(112,JUDGE_Y,492,JUDGE_Y);
  jg.addColorStop(0,'#00ffff');jg.addColorStop(0.33,'#ff69b4');jg.addColorStop(0.66,'#ffff00');jg.addColorStop(1,'#39ff14');
  ctx.strokeStyle=jg;ctx.lineWidth=3;ctx.shadowBlur=10;ctx.shadowColor='#fff';
  ctx.beginPath();ctx.moveTo(112,JUDGE_Y);ctx.lineTo(492,JUDGE_Y);ctx.stroke();
  ctx.shadowBlur=0;
  // Hit zones
  for(var i=0;i<4;i++){
    var lx=LANE_X[i],g2=laneGlow[i];
    ctx.strokeStyle=laneColors[i];ctx.lineWidth=2;
    ctx.globalAlpha=0.4+g2*0.6;
    ctx.strokeRect(lx+4,JUDGE_Y-14,LANE_W-8,28);
    ctx.globalAlpha=g2*0.35;ctx.fillStyle=laneColors[i];ctx.fillRect(lx+4,JUDGE_Y-14,LANE_W-8,28);
    ctx.globalAlpha=1;
    // Key label
    ctx.fillStyle='rgba(255,255,255,'+(0.3+g2*0.5)+')';
    ctx.font='bold 11px monospace';ctx.textAlign='center';
    ctx.fillText(laneKeys[i].toUpperCase(),lx+LANE_W/2,JUDGE_Y+8);
  }
  ctx.textAlign='left';
  // Notes
  for(var i=0;i<notes.length;i++){
    var n=notes[i];if(n.hit)continue;
    var lx=LANE_X[n.lane],col=laneColors[n.lane];
    // Trail
    ctx.globalAlpha=0.18;ctx.fillStyle=col;ctx.fillRect(lx+8,n.y-NOTE_SPEED*6,LANE_W-16,NOTE_SPEED*6);
    ctx.globalAlpha=1;
    // Note body
    var rg=ctx.createLinearGradient(lx,n.y-9,lx,n.y+9);
    rg.addColorStop(0,'#fff');rg.addColorStop(0.4,col);rg.addColorStop(1,shadeColor(col,0.5));
    ctx.fillStyle=rg;ctx.shadowBlur=12;ctx.shadowColor=col;
    ctx.beginPath();ctx.roundRect(lx+6,n.y-9,LANE_W-12,18,6);ctx.fill();
    ctx.shadowBlur=0;
    // Shine
    ctx.fillStyle='rgba(255,255,255,0.3)';ctx.fillRect(lx+10,n.y-7,LANE_W-22,4);
  }
  // Particles
  for(var i=0;i<particles.length;i++){
    var p=particles[i];ctx.globalAlpha=p.life/p.maxLife;ctx.fillStyle=p.color;
    ctx.fillRect(p.x-p.size/2,p.y-p.size/2,p.size,p.size);
  }ctx.globalAlpha=1;
  // Judgement texts
  for(var i=0;i<judgements.length;i++){
    var j=judgements[i];
    var jx=LANE_X[j.lane]+LANE_W/2;
    ctx.globalAlpha=j.alpha;
    if(j.quality===2){
      var grd=ctx.createLinearGradient(jx-30,0,jx+30,0);
      grd.addColorStop(0,'#ffd700');grd.addColorStop(0.5,'#fff');grd.addColorStop(1,'#ffd700');
      ctx.fillStyle=grd;ctx.font='bold 16px monospace';
    }else if(j.quality===1){ctx.fillStyle='#39ff14';ctx.font='bold 15px monospace'}
    else{ctx.fillStyle='#ff4444';ctx.font='bold 14px monospace'}
    ctx.textAlign='center';ctx.shadowBlur=8;ctx.shadowColor=j.quality===2?'#ffd700':j.quality===1?'#39ff14':'#ff0000';
    ctx.fillText(j.text,jx,j.y);ctx.shadowBlur=0;
  }
  ctx.textAlign='left';ctx.globalAlpha=1;
  // HUD: score
  ctx.fillStyle='#fff';ctx.font='bold 20px monospace';ctx.textAlign='right';ctx.fillText(score,588,28);
  ctx.font='11px monospace';ctx.fillStyle='rgba(255,255,255,0.5)';ctx.fillText('점수',588,42);
  ctx.textAlign='left';
  // Combo
  if(combo>0){
    var cf=combo>=50?'#ffd700':combo>=25?'#ff69b4':combo>=10?'#00ffff':'#fff';
    ctx.fillStyle=cf;ctx.font='bold 26px monospace';ctx.textAlign='center';
    ctx.shadowBlur=combo>=10?12:0;ctx.shadowColor=cf;
    ctx.fillText(combo+'x',300,28);ctx.shadowBlur=0;
    ctx.fillStyle='rgba(255,255,255,0.45)';ctx.font='10px monospace';ctx.fillText('COMBO',300,42);
    ctx.textAlign='left';
  }
  // BPM indicator
  ctx.fillStyle='rgba(255,255,255,0.35)';ctx.font='11px monospace';ctx.fillText('BPM '+Math.round(bpm),12,395);
  // Health bar
  var hw=160,hx=12,hy=12;
  ctx.fillStyle='rgba(0,0,0,0.5)';ctx.fillRect(hx,hy,hw,10);
  var hpct=health/100;
  var hcol=hpct>0.5?'#39ff14':hpct>0.25?'#ffff00':'#ff4444';
  ctx.fillStyle=hcol;ctx.fillRect(hx,hy,hw*hpct,10);
  ctx.strokeStyle='rgba(255,255,255,0.2)';ctx.lineWidth=1;ctx.strokeRect(hx,hy,hw,10);
  ctx.fillStyle='rgba(255,255,255,0.5)';ctx.font='10px monospace';ctx.fillText('HP',hx+hw+5,hy+9);
  ctx.restore();
  // Start screen
  if(state==='start'){
    ctx.fillStyle='rgba(0,0,0,0.75)';ctx.fillRect(0,0,600,400);
    ctx.fillStyle='#fff';ctx.font='bold 38px monospace';ctx.textAlign='center';ctx.fillText('리듬 게임',300,130);
    ctx.font='13px monospace';ctx.fillStyle='rgba(255,255,255,0.7)';
    ctx.fillText('D  F  J  K  /  ← ↓ ↑ →',300,172);
    ctx.fillStyle='rgba(255,255,255,0.4)';ctx.font='12px monospace';
    ctx.fillText('노트가 판정선에 닿을 때 키를 누르세요',300,196);
    ctx.globalAlpha=0.5+Math.sin(tick*0.06)*0.5;ctx.fillStyle='#fff';ctx.font='16px monospace';
    ctx.fillText('SPACE 를 눌러 시작',300,250);
    ctx.globalAlpha=1;ctx.textAlign='left';
  }
  // Game over
  if(state==='gameover'){
    ctx.fillStyle='rgba(0,0,0,0.8)';ctx.fillRect(0,0,600,400);
    ctx.fillStyle='#fff';ctx.font='bold 34px monospace';ctx.textAlign='center';ctx.fillText('게임 오버!',300,140);
    ctx.font='20px monospace';ctx.fillText('최종 점수: '+score,300,178);
    ctx.fillStyle='#ffd700';ctx.font='14px monospace';ctx.fillText('최고 콤보: '+maxCombo+'x',300,206);
    ctx.fillStyle='rgba(255,255,255,0.6)';ctx.fillText('최종 BPM: '+Math.round(bpm),300,228);
    ctx.globalAlpha=0.5+Math.sin(tick*0.06)*0.5;ctx.fillStyle='#fff';ctx.font='16px monospace';
    ctx.fillText('SPACE 를 눌러 재시작',300,278);
    ctx.globalAlpha=1;ctx.textAlign='left';
  }
}

function hexToRgb(hex){
  var r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16);
  return r+','+g+','+b;
}
function shadeColor(hex,factor){
  var r=Math.floor(parseInt(hex.slice(1,3),16)*factor);
  var g=Math.floor(parseInt(hex.slice(3,5),16)*factor);
  var b=Math.floor(parseInt(hex.slice(5,7),16)*factor);
  return 'rgb('+r+','+g+','+b+')';
}

function loop(){update();draw();requestAnimationFrame(loop)}
loop();
</script>
</body>
</html>`;

const DUNGEON_CRAWLER_HTML = `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<title>3D 던전 크롤러</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{background:#000;overflow:hidden;width:100vw;height:100vh;font-family:'Courier New',monospace}
#overlay{position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:10}
#hud-tl{position:absolute;top:12px;left:12px;color:#fff;text-shadow:0 0 8px #f90}
#hp-bar-bg{background:#333;border:1px solid #666;width:160px;height:14px;margin-top:4px;border-radius:3px}
#hp-bar{background:linear-gradient(90deg,#c00,#f44);height:100%;border-radius:3px;transition:width 0.2s}
#hud-tr{position:absolute;top:12px;right:12px;color:#f90;font-size:20px;text-align:right;text-shadow:0 0 10px #f90}
#msg{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);text-align:center;color:#fff;pointer-events:all}
#msg h1{font-size:32px;color:#f90;text-shadow:0 0 20px #f90,0 0 40px #f60;margin-bottom:12px}
#msg p{font-size:14px;color:#ccc;margin:4px 0}
#minimap-wrap{position:absolute;bottom:12px;right:12px}
#minimap-wrap canvas{border:1px solid #444;border-radius:3px;image-rendering:pixelated}
#minimap-label{color:#888;font-size:10px;text-align:center;margin-bottom:2px}
#item-notif{position:absolute;bottom:60px;left:50%;transform:translateX(-50%);color:#0f0;font-size:13px;text-shadow:0 0 8px #0f0;opacity:0;transition:opacity 0.3s}
</style>
</head>
<body>
<canvas id="gameCanvas" width="600" height="400" style="display:none"></canvas>
<div id="overlay">
  <div id="hud-tl">
    <div id="floor-txt" style="font-size:13px;color:#aaf">1층</div>
    <div id="hp-label" style="font-size:12px;color:#f88">HP: 5 / 5</div>
    <div id="hp-bar-bg"><div id="hp-bar" style="width:100%"></div></div>
  </div>
  <div id="hud-tr">
    <div style="font-size:11px;color:#aaa">점수</div>
    <div id="score-txt">0</div>
  </div>
  <div id="msg">
    <h1>3D 던전 크롤러</h1>
    <p>WASD / 방향키: 이동 &nbsp;|&nbsp; Space: 원거리 공격</p>
    <p style="margin-top:16px;color:#f90;font-size:16px">[ Space / 클릭으로 시작 ]</p>
  </div>
  <div id="item-notif"></div>
  <div id="minimap-wrap" style="display:none">
    <div id="minimap-label">미니맵</div>
    <canvas id="minimap" width="100" height="100"></canvas>
  </div>
</div>
<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
<script>
var score=0,gameOver=false,keys={};
var state='start',floor=1,tick=0;
var COLS=20,ROWS=20,TS=4;
var map=[],seen=[],rooms=[];
var player={x:2,y:2,hp:5,maxHp:5,dmg:1,shield:false,shieldTimer:0,moveTimer:0,facing:0,moving:false,tx:2,ty:2};
var enemies=[],items=[],projectiles=[],particles=[];
var stairX=0,stairY=0;
var audioCtx=null;

// Three.js globals
var renderer,scene,camera,camTarget;
var meshMap={},enemyMeshes=[],itemMeshes=[],projMeshes=[],partMeshes=[];
var playerMesh,playerLight,playerHead;
var ambLight,dirLight;
var floorMesh;

// Audio
function initAudio(){if(!audioCtx)audioCtx=new(window.AudioContext||window.webkitAudioContext)()}
function snd(f,d,t,v,sweep){
  if(!audioCtx)return;try{
  var o=audioCtx.createOscillator(),g=audioCtx.createGain();
  o.connect(g);g.connect(audioCtx.destination);
  var n=audioCtx.currentTime;
  o.type=t||'square';o.frequency.setValueAtTime(f,n);
  if(sweep)o.frequency.exponentialRampToValueAtTime(sweep,n+d);
  g.gain.setValueAtTime(v||0.1,n);g.gain.linearRampToValueAtTime(0,n+d);
  o.start(n);o.stop(n+d)}catch(e){}
}
function playSound(tp){
  if(tp==='hit'){snd(280,0.08,'sawtooth',0.14,120);setTimeout(function(){snd(140,0.06,'sawtooth',0.1)},60)}
  else if(tp==='shoot'){snd(900,0.05,'square',0.09,600)}
  else if(tp==='pickup'){snd(660,0.06,'triangle',0.12);setTimeout(function(){snd(990,0.08,'triangle',0.12)},60)}
  else if(tp==='stairs'){snd(440,0.08,'triangle',0.12);setTimeout(function(){snd(660,0.08,'triangle',0.12)},100);setTimeout(function(){snd(880,0.1,'triangle',0.14)},200)}
  else if(tp==='die'){snd(180,0.4,'sawtooth',0.18,60)}
  else if(tp==='step'){snd(70,0.03,'square',0.035)}
  else if(tp==='enemyhit'){snd(380,0.06,'sawtooth',0.1,200)}
}

// BSP dungeon
function isWall(x,y){return !map[y]||map[y][x]===undefined||map[y][x]===null||map[y][x]===1}
function bspSplit(x,y,w,h,depth){
  if(depth===0||w<8||h<8){
    var rx=x+1+(Math.random()*(w-5)|0),ry=y+1+(Math.random()*(h-5)|0);
    var rw=3+(Math.random()*Math.min(w-3,5)|0),rh=3+(Math.random()*Math.min(h-3,5)|0);
    rw=Math.min(rw,x+w-rx-1);rh=Math.min(rh,y+h-ry-1);
    if(rw<3||rh<3)return null;
    rooms.push({x:rx,y:ry,w:rw,h:rh});
    return {x:rx,y:ry,w:rw,h:rh};
  }
  var horiz=w<h||(w===h&&Math.random()<0.5);
  var split,a,b;
  if(horiz){split=y+4+(Math.random()*(h-8)|0);a=bspSplit(x,y,w,split-y,depth-1);b=bspSplit(x,split,w,y+h-split,depth-1)}
  else{split=x+4+(Math.random()*(w-8)|0);a=bspSplit(x,y,split-x,h,depth-1);b=bspSplit(split,y,x+w-split,h,depth-1)}
  if(a&&b){
    var ax=a.x+((a.w/2)|0),ay=a.y+((a.h/2)|0);
    var bx=b.x+((b.w/2)|0),by=b.y+((b.h/2)|0);
    var cx=Math.min(ax,bx),cy=Math.min(ay,by);
    for(var i=cx;i<=Math.max(ax,bx);i++)if(map[ay])map[ay][i]=0;
    for(var j=cy;j<=Math.max(ay,by);j++)if(map[j])map[j][bx]=0;
  }
  return a||b;
}
function genMap(){
  map=[];seen=[];rooms=[];
  for(var j=0;j<ROWS;j++){map[j]=[];seen[j]=[];for(var i=0;i<COLS;i++){map[j][i]=1;seen[j][i]=false}}
  bspSplit(0,0,COLS,ROWS,3);
  for(var r=0;r<rooms.length;r++){
    var rm=rooms[r];
    for(var j=rm.y;j<rm.y+rm.h;j++)for(var i=rm.x;i<rm.x+rm.w;i++)map[j][i]=0;
  }
  // Place player in first room
  var sr=rooms[0];
  player.x=sr.x+1;player.y=sr.y+1;player.tx=player.x;player.ty=player.y;
  // Place stairs in last room
  var lr=rooms[rooms.length-1];
  stairX=lr.x+((lr.w/2)|0);stairY=lr.y+((lr.h/2)|0);
  map[stairY][stairX]=2;
  // Enemies
  enemies=[];
  var types=['skeleton','slime','archer'];
  var count=3+floor*2;
  for(var i=0;i<count;i++){
    var rm=rooms[1+Math.random()*(rooms.length-1)|0];
    var ex=rm.x+1+(Math.random()*(rm.w-2)|0)|0;
    var ey=rm.y+1+(Math.random()*(rm.h-2)|0)|0;
    if(!isWall(ex,ey)&&!(ex===player.x&&ey===player.y)){
      var t=types[Math.random()*3|0];
      enemies.push({x:ex,y:ey,tx:ex,ty:ey,type:t,hp:t==='skeleton'?3:t==='archer'?2:2,
        maxHp:t==='skeleton'?3:2,dmgTimer:0,aiTimer:0,alive:true,moving:false,
        shootTimer:t==='archer'?60:9999,angle:0});
    }
  }
  // Items
  items=[];
  var itypes=['heart','sword','shield'];
  for(var i=0;i<4+floor;i++){
    var rm=rooms[Math.random()*rooms.length|0];
    var ix=rm.x+1+(Math.random()*(rm.w-2)|0)|0;
    var iy=rm.y+1+(Math.random()*(rm.h-2)|0)|0;
    if(!isWall(ix,iy))items.push({x:ix,y:iy,type:itypes[Math.random()*3|0],alive:true});
  }
  projectiles=[];particles=[];
}

// Three.js scene setup
function initScene(){
  renderer=new THREE.WebGLRenderer({antialias:true});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));
  renderer.setSize(window.innerWidth,window.innerHeight);
  renderer.shadowMap.enabled=true;
  renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  renderer.setClearColor(0x050508);
  document.body.insertBefore(renderer.domElement,document.body.firstChild);
  renderer.domElement.style.position='fixed';
  renderer.domElement.style.top='0';
  renderer.domElement.style.left='0';

  scene=new THREE.Scene();
  scene.background=new THREE.Color(0x1a1a2e);
  scene.fog=new THREE.FogExp2(0x1a1a2e,0.018);

  var W=window.innerWidth,H=window.innerHeight;
  camera=new THREE.PerspectiveCamera(55,W/H,0.1,200);
  camera.position.set(0,18,14);
  camera.lookAt(0,0,0);
  camTarget=new THREE.Vector3();

  ambLight=new THREE.AmbientLight(0xaabbcc,1.8);
  scene.add(ambLight);

  dirLight=new THREE.DirectionalLight(0xffeedd,1.2);
  dirLight.position.set(5,15,8);
  scene.add(dirLight);

  var hemiLight=new THREE.HemisphereLight(0x8899cc,0x443322,1.0);
  scene.add(hemiLight);
}

function worldX(gx){return gx*TS-COLS*TS/2}
function worldZ(gy){return gy*TS-ROWS*TS/2}

function buildSceneMeshes(){
  // Clear old meshes
  Object.values(meshMap).forEach(function(m){scene.remove(m)});
  meshMap={};
  enemyMeshes.forEach(function(m){scene.remove(m)});enemyMeshes=[];
  itemMeshes.forEach(function(m){scene.remove(m)});itemMeshes=[];
  projMeshes.forEach(function(m){scene.remove(m)});projMeshes=[];
  if(playerMesh){scene.remove(playerMesh);scene.remove(playerHead);scene.remove(playerLight)}

  // Floor plane (big)
  var fg=new THREE.PlaneGeometry(COLS*TS,ROWS*TS);
  var fm=new THREE.MeshPhongMaterial({color:0x1a1208,shininess:5});
  floorMesh=new THREE.Mesh(fg,fm);
  floorMesh.rotation.x=-Math.PI/2;
  floorMesh.receiveShadow=true;
  scene.add(floorMesh);

  // Walls & floors per tile
  var wallGeo=new THREE.BoxGeometry(TS,TS*1.5,TS);
  var wallMat=new THREE.MeshPhongMaterial({color:0x3a3228,shininess:10});
  var stairGeo=new THREE.BoxGeometry(TS*0.7,TS*0.3,TS*0.7);
  var stairMat=new THREE.MeshPhongMaterial({color:0xddaa00,emissive:0x885500,emissiveIntensity:0.7,shininess:40});

  for(var j=0;j<ROWS;j++){
    for(var i=0;i<COLS;i++){
      var wx=worldX(i),wz=worldZ(j);
      if(map[j][i]===1){
        var w=new THREE.Mesh(wallGeo,wallMat);
        w.position.set(wx,TS*0.75,wz);
        w.castShadow=true;w.receiveShadow=true;
        scene.add(w);meshMap[i+'_'+j]=w;
      } else if(map[j][i]===2){
        // Stair tile
        var s=new THREE.Mesh(stairGeo,stairMat);
        s.position.set(wx,TS*0.15,wz);
        scene.add(s);meshMap['s_'+i+'_'+j]=s;
        // Glow point
        var sl=new THREE.PointLight(0xffaa00,1.5,TS*3);
        sl.position.set(wx,TS*0.5,wz);
        scene.add(sl);
      }
    }
  }

  // Player mesh: cylinder body + sphere head
  var pbg=new THREE.CylinderGeometry(0.6,0.8,2.2,8);
  var pbm=new THREE.MeshPhongMaterial({color:0x2288ff,emissive:0x0033aa,shininess:60});
  playerMesh=new THREE.Mesh(pbg,pbm);
  playerMesh.castShadow=true;
  scene.add(playerMesh);

  var phg=new THREE.SphereGeometry(0.55,8,8);
  var phm=new THREE.MeshPhongMaterial({color:0xffcc88,shininess:40});
  playerHead=new THREE.Mesh(phg,phm);
  playerHead.castShadow=true;
  scene.add(playerHead);

  // Player point light (torch)
  playerLight=new THREE.PointLight(0xffcc66,3.5,TS*10);
  playerLight.castShadow=true;
  scene.add(playerLight);

  // Enemy meshes
  enemies.forEach(function(e,idx){
    var eg,em,mesh;
    if(e.type==='skeleton'){
      eg=new THREE.ConeGeometry(0.7,2.4,6);
      em=new THREE.MeshPhongMaterial({color:0xff3322,emissive:0x880000,shininess:20});
      mesh=new THREE.Mesh(eg,em);
    } else if(e.type==='slime'){
      eg=new THREE.SphereGeometry(0.8,8,6);
      em=new THREE.MeshPhongMaterial({color:0x22dd44,emissive:0x006618,shininess:60});
      mesh=new THREE.Mesh(eg,em);
      mesh.scale.y=0.5;
    } else {
      eg=new THREE.BoxGeometry(1,2,0.6);
      em=new THREE.MeshPhongMaterial({color:0x4488ff,emissive:0x001155,shininess:30});
      mesh=new THREE.Mesh(eg,em);
    }
    mesh.castShadow=true;
    scene.add(mesh);
    enemyMeshes[idx]=mesh;
  });

  // Item meshes
  items.forEach(function(it,idx){
    var ig,im,mesh;
    if(it.type==='heart'){
      ig=new THREE.SphereGeometry(0.5,8,8);
      im=new THREE.MeshPhongMaterial({color:0xff2244,emissive:0x880011,shininess:80});
    } else if(it.type==='sword'){
      ig=new THREE.BoxGeometry(0.3,1.8,0.3);
      im=new THREE.MeshPhongMaterial({color:0xccddff,emissive:0x334488,shininess:120});
    } else {
      ig=new THREE.CylinderGeometry(0.7,0.7,0.2,10);
      im=new THREE.MeshPhongMaterial({color:0x8888ff,emissive:0x222288,shininess:100});
    }
    mesh=new THREE.Mesh(ig,im);
    mesh.castShadow=true;
    scene.add(mesh);
    itemMeshes[idx]=mesh;
  });
}

function syncMeshes(){
  var px=worldX(player.x+(player.tx-player.x)*0.5);
  var pz=worldZ(player.y+(player.ty-player.y)*0.5);
  if(player.moving){
    var frac=1-(player.moveTimer/8);
    px=worldX(player.x+(player.tx-player.x)*frac);
    pz=worldZ(player.y+(player.ty-player.y)*frac);
  }
  playerMesh.position.set(px,1.1,pz);
  playerHead.position.set(px,2.5,pz);
  playerLight.position.set(px,3,pz);

  // Smooth camera follow
  var tx=px,tz=pz+TS*3.5;
  camTarget.x+=(tx-camTarget.x)*0.08;
  camTarget.z+=(tz-camTarget.z)*0.08;
  camera.position.x=camTarget.x;
  camera.position.y=18;
  camera.position.z=camTarget.z+10;
  camera.lookAt(camTarget.x,0,camTarget.z-2);

  // Enemy meshes
  enemies.forEach(function(e,idx){
    var m=enemyMeshes[idx];
    if(!m)return;
    if(!e.alive){m.visible=false;return;}
    m.visible=true;
    var ex=worldX(e.x),ez=worldZ(e.y);
    if(e.moving){
      var frac=1-(e.moveTimer/8);
      ex=worldX(e.x+(e.tx-e.x)*frac);
      ez=worldZ(e.y+(e.ty-e.y)*frac);
    }
    var yb=e.type==='slime'?0.4:e.type==='archer'?1:1.2;
    m.position.set(ex,yb,ez);
    e.angle=(e.angle||0)+0.03;
    if(e.type==='slime'){m.scale.y=0.5+Math.sin(e.angle*3)*0.1;}
    else{m.rotation.y=e.angle;}
  });

  // Item meshes
  var t=tick*0.05;
  items.forEach(function(it,idx){
    var m=itemMeshes[idx];
    if(!m)return;
    if(!it.alive){m.visible=false;return;}
    m.visible=true;
    m.position.set(worldX(it.x),1.2+Math.sin(t+idx)*0.3,worldZ(it.y));
    m.rotation.y=t+idx;
  });

  // Projectiles
  projMeshes.forEach(function(pm){scene.remove(pm)});projMeshes=[];
  projectiles.forEach(function(p){
    var pg=new THREE.SphereGeometry(0.25,6,6);
    var pmat=new THREE.MeshPhongMaterial({color:p.fromPlayer?0x00ffff:0xff8800,emissive:p.fromPlayer?0x00aaaa:0xff4400,shininess:100});
    var pm=new THREE.Mesh(pg,pmat);
    pm.position.set(worldX(p.x),1.5,worldZ(p.y));
    scene.add(pm);projMeshes.push(pm);
  });

  // Particles
  partMeshes.forEach(function(pm){scene.remove(pm)});partMeshes=[];
  particles.forEach(function(p){
    var pg=new THREE.SphereGeometry(0.15,4,4);
    var alpha=p.life/p.maxLife;
    var col=p.color||0xff4400;
    var pmat=new THREE.MeshBasicMaterial({color:col,transparent:true,opacity:alpha});
    var pm=new THREE.Mesh(pg,pmat);
    pm.position.set(worldX(p.x)+p.ox,p.oy,worldZ(p.y)+p.oz);
    scene.add(pm);partMeshes.push(pm);
  });
}

function spawnParticles(gx,gy,color,count){
  for(var i=0;i<(count||5);i++){
    var ang=Math.random()*Math.PI*2;
    var spd=0.3+Math.random()*0.7;
    particles.push({x:gx,y:gy,ox:0,oy:1+Math.random(),oz:0,
      vx:Math.cos(ang)*spd,vy:0.5+Math.random()*0.5,vz:Math.sin(ang)*spd,
      life:15,maxLife:15,color:color||0xff4400});
  }
}

function updateFogOfWar(){
  var LR=5; // light radius in tiles
  for(var j=Math.max(0,player.y-LR);j<=Math.min(ROWS-1,player.y+LR);j++){
    for(var i=Math.max(0,player.x-LR);i<=Math.min(COLS-1,player.x+LR);i++){
      var dx=i-player.x,dz=j-player.y;
      if(dx*dx+dz*dz<=LR*LR)seen[j][i]=true;
    }
  }
  // Hide/show wall meshes based on seen
  for(var j=0;j<ROWS;j++){
    for(var i=0;i<COLS;i++){
      var m=meshMap[i+'_'+j];
      if(m){
        var dx=i-player.x,dz=j-player.y;
        var dist=dx*dx+dz*dz;
        var vis=seen[j][i];
        m.visible=vis;
        if(vis){
          // Dim walls far from player
          var brightness=Math.max(0,1-dist/(LR*LR));
          m.material.emissive=new THREE.Color(0.05*brightness,0.04*brightness,0.03*brightness);
        }
      }
    }
  }
}

function updateMinimap(){
  var mc=document.getElementById('minimap');
  if(!mc)return;
  var ctx2=mc.getContext('2d');
  var cw=mc.width,ch=mc.height;
  var tw=cw/COLS,th=ch/ROWS;
  ctx2.fillStyle='#000';ctx2.fillRect(0,0,cw,ch);
  for(var j=0;j<ROWS;j++){
    for(var i=0;i<COLS;i++){
      if(!seen[j][i])continue;
      if(map[j][i]===1)ctx2.fillStyle='#443322';
      else if(map[j][i]===2)ctx2.fillStyle='#ffaa00';
      else ctx2.fillStyle='#776655';
      ctx2.fillRect(i*tw,j*th,tw,th);
    }
  }
  // Enemies on minimap
  enemies.forEach(function(e){
    if(!e.alive||!seen[e.y]||!seen[e.y][e.x])return;
    ctx2.fillStyle='#ff3322';
    ctx2.fillRect(e.x*tw+tw*0.25,e.y*th+th*0.25,tw*0.5,th*0.5);
  });
  // Player dot
  ctx2.fillStyle='#00aaff';
  ctx2.beginPath();ctx2.arc((player.x+0.5)*tw,(player.y+0.5)*th,tw*0.7,0,Math.PI*2);ctx2.fill();
}

function showNotif(txt){
  var n=document.getElementById('item-notif');
  n.textContent=txt;n.style.opacity='1';
  setTimeout(function(){n.style.opacity='0'},1500);
}
function updateHUD(){
  document.getElementById('floor-txt').textContent=floor+'층';
  document.getElementById('hp-label').textContent='HP: '+player.hp+' / '+player.maxHp;
  document.getElementById('hp-bar').style.width=(player.hp/player.maxHp*100)+'%';
  document.getElementById('score-txt').textContent=score;
}

// Movement & combat
function tryMove(dx,dy){
  if(player.moving||player.moveTimer>0)return;
  var nx=player.x+dx,ny=player.y+dy;
  if(nx<0||nx>=COLS||ny<0||ny>=ROWS)return;
  // Check enemy collision = melee attack
  for(var i=0;i<enemies.length;i++){
    var e=enemies[i];
    if(!e.alive)continue;
    if(e.x===nx&&e.y===ny){
      attackEnemy(e);return;
    }
  }
  if(isWall(nx,ny))return;
  player.x=nx;player.y=ny;
  player.tx=nx;player.ty=ny;
  player.moveTimer=8;player.moving=true;
  player.facing=Math.atan2(dy,dx);
  playSound('step');
}

function attackEnemy(e){
  e.hp-=player.dmg;
  spawnParticles(e.x,e.y,0xff2200,6);
  playSound('hit');
  if(e.hp<=0){
    e.alive=false;
    score+=10*floor;
    spawnParticles(e.x,e.y,0xff8800,10);
    playSound('die');
  }
}

function shootProjectile(){
  if(!audioCtx)return;
  var ang=player.facing||0;
  var dx=Math.round(Math.cos(ang)),dy=Math.round(Math.sin(ang));
  if(dx===0&&dy===0)dx=1;
  projectiles.push({x:player.x+dx,y:player.y+dy,vx:dx,vy:dy,fromPlayer:true,timer:0,life:12});
  playSound('shoot');
}

function enemyAI(e){
  if(!e.alive)return;
  e.aiTimer--;
  if(e.moving){e.moveTimer--;if(e.moveTimer<=0)e.moving=false;return;}

  var dx=player.x-e.x,dy=player.y-e.y;
  var dist=Math.sqrt(dx*dx+dy*dy);

  if(e.type==='skeleton'){
    if(dist<7){
      // Chase
      var mx=dx!==0?Math.sign(dx):0,my=dy!==0?Math.sign(dy):0;
      var tx=e.x+mx,ty=e.y+my;
      if(!isWall(tx,ty)&&e.aiTimer<=0){
        e.x=tx;e.y=ty;e.tx=tx;e.ty=ty;e.moving=true;e.moveTimer=10;e.aiTimer=3;
      }
    }
  } else if(e.type==='slime'){
    if(e.aiTimer<=0){
      var dirs=[[-1,0],[1,0],[0,-1],[0,1]];
      var d=dirs[Math.random()*4|0];
      var tx=e.x+d[0],ty=e.y+d[1];
      if(!isWall(tx,ty)){e.x=tx;e.y=ty;e.tx=tx;e.ty=ty;e.moving=true;e.moveTimer=12;e.aiTimer=8+Math.random()*8|0}
    }
  } else if(e.type==='archer'){
    // Shoot if in range
    e.shootTimer--;
    if(e.shootTimer<=0&&dist<9){
      var ang=Math.atan2(dy,dx);
      var vx=Math.cos(ang)*0.5,vy=Math.sin(ang)*0.5;
      projectiles.push({x:e.x,y:e.y,vx:vx,vy:vy,fromPlayer:false,timer:0,life:14});
      e.shootTimer=50;
      playSound('enemyhit');
    }
  }

  // Melee damage on contact
  if(dist<1.2&&e.dmgTimer<=0&&!player.shield){
    player.hp--;
    e.dmgTimer=30;
    spawnParticles(player.x,player.y,0xffff00,4);
    playSound('hit');
    if(player.hp<=0)endGame();
  }
  if(e.dmgTimer>0)e.dmgTimer--;
}

function updateProjectiles(){
  for(var i=projectiles.length-1;i>=0;i--){
    var p=projectiles[i];
    p.x+=p.vx;p.y+=p.vy;p.life--;
    if(p.life<=0||isWall(Math.round(p.x),Math.round(p.y))){projectiles.splice(i,1);continue;}
    if(p.fromPlayer){
      // Hit enemies
      for(var j=0;j<enemies.length;j++){
        var e=enemies[j];
        if(!e.alive)continue;
        var dx=p.x-e.x,dy=p.y-e.y;
        if(dx*dx+dy*dy<0.8){
          attackEnemy(e);projectiles.splice(i,1);break;
        }
      }
    } else {
      // Hit player
      var dx=p.x-player.x,dy=p.y-player.y;
      if(dx*dx+dy*dy<0.8&&!player.shield){
        player.hp--;
        spawnParticles(player.x,player.y,0xffff00,4);
        playSound('hit');
        projectiles.splice(i,1);
        if(player.hp<=0)endGame();
      }
    }
  }
}

function updateParticles(){
  for(var i=particles.length-1;i>=0;i--){
    var p=particles[i];
    p.ox+=p.vx;p.oy+=p.vy;p.oz+=p.vz;
    p.vy-=0.05;p.life--;
    if(p.life<=0)particles.splice(i,1);
  }
}

function checkItems(){
  for(var i=items.length-1;i>=0;i--){
    var it=items[i];
    if(!it.alive)continue;
    if(it.x===player.x&&it.y===player.y){
      it.alive=false;
      if(it.type==='heart'){
        player.hp=Math.min(player.maxHp,player.hp+3);
        showNotif('HP +3 회복!');playSound('pickup');
      } else if(it.type==='sword'){
        player.dmg++;
        showNotif('검 강화! 공격력 +1');playSound('pickup');
      } else {
        player.shield=true;player.shieldTimer=180;
        showNotif('방어막 활성화!');playSound('pickup');
      }
    }
  }
}

function checkStairs(){
  if(player.x===stairX&&player.y===stairY){
    floor++;playSound('stairs');score+=100*floor;
    genMap();buildSceneMeshes();
    showNotif(floor+'층 진입!');
  }
}

function endGame(){
  state='gameover';gameOver=true;
  var m=document.getElementById('msg');
  m.innerHTML='<h1>게임 오버</h1><p style="font-size:18px;color:#f90">최종 점수: '+score+'</p><p style="margin-top:12px;color:#888">[ Space / 클릭으로 재시작 ]</p>';
  m.style.display='block';
  playSound('die');
}

function startGame(){
  score=0;gameOver=false;floor=1;tick=0;
  player={x:2,y:2,hp:5,maxHp:5,dmg:1,shield:false,shieldTimer:0,moveTimer:0,facing:0,moving:false,tx:2,ty:2};
  document.getElementById('minimap-wrap').style.display='block';
  document.getElementById('msg').style.display='none';
  genMap();buildSceneMeshes();
  state='playing';
}

function restart(){
  startGame();
}

// Input — listen on both window and document for gameExtensions compatibility
function handleKeyDown(e){
  keys[e.key]=true;keys[e.code]=true;
  if(e.key===' '||e.code==='Space'){e.preventDefault();if(state==='playing')shootProjectile();}
  if(e.key==='ArrowLeft'||e.code==='ArrowLeft'||e.code==='KeyA')keys['left']=true;
  if(e.key==='ArrowRight'||e.code==='ArrowRight'||e.code==='KeyD')keys['right']=true;
  if(e.key==='ArrowUp'||e.code==='ArrowUp'||e.code==='KeyW')keys['up']=true;
  if(e.key==='ArrowDown'||e.code==='ArrowDown'||e.code==='KeyS')keys['down']=true;
}
function handleKeyUp(e){
  keys[e.key]=false;keys[e.code]=false;
  if(e.key==='ArrowLeft'||e.code==='ArrowLeft'||e.code==='KeyA')keys['left']=false;
  if(e.key==='ArrowRight'||e.code==='ArrowRight'||e.code==='KeyD')keys['right']=false;
  if(e.key==='ArrowUp'||e.code==='ArrowUp'||e.code==='KeyW')keys['up']=false;
  if(e.key==='ArrowDown'||e.code==='ArrowDown'||e.code==='KeyS')keys['down']=false;
}
window.addEventListener('keydown',handleKeyDown);
window.addEventListener('keyup',handleKeyUp);
document.addEventListener('keydown',handleKeyDown);
document.addEventListener('keyup',handleKeyUp);
window.addEventListener('click',function(){
  initAudio();
  if(state==='start'||state==='gameover'){startGame();}
});
document.addEventListener('keydown',function(e){
  if(e.code==='Space'){
    initAudio();
    if(state==='start'||state==='gameover'){startGame();}
  }
});

var moveInputTimer=0;
function handleInput(){
  if(state!=='playing')return;
  if(moveInputTimer>0){moveInputTimer--;return;}
  var l=keys['left']||keys['ArrowLeft'];
  var r=keys['right']||keys['ArrowRight'];
  var u=keys['up']||keys['ArrowUp'];
  var d=keys['down']||keys['ArrowDown'];
  if(l)       {tryMove(-1,0);moveInputTimer=8;}
  else if(r)  {tryMove(1,0);moveInputTimer=8;}
  else if(u)  {tryMove(0,-1);moveInputTimer=8;}
  else if(d)  {tryMove(0,1);moveInputTimer=8;}
}

window.addEventListener('resize',function(){
  camera.aspect=window.innerWidth/window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth,window.innerHeight);
});

// Global joystick hook (for gameExtensions.ts injection)
window._joystickMove=function(dx,dy){
  if(state!=='playing')return;
  if(Math.abs(dx)>Math.abs(dy)){if(dx<0)tryMove(-1,0);else tryMove(1,0);}
  else{if(dy<0)tryMove(0,-1);else tryMove(0,1);}
};

function gameLoop(){
  requestAnimationFrame(gameLoop);
  tick++;
  if(state==='playing'){
    handleInput();
    // Player move timer
    if(player.moveTimer>0){player.moveTimer--;if(player.moveTimer<=0)player.moving=false;}
    // Shield timer
    if(player.shield){player.shieldTimer--;if(player.shieldTimer<=0)player.shield=false;}
    // Enemy AI
    enemies.forEach(function(e){enemyAI(e);});
    updateProjectiles();
    updateParticles();
    checkItems();
    checkStairs();
    updateFogOfWar();
    updateMinimap();
    updateHUD();
  }
  if(state==='playing'||state==='start'){
    syncMeshes();
    renderer.render(scene,camera);
  }
}

initScene();
gameLoop();
</script>
</body>
</html>`;

const PHYSICS_PUZZLE_HTML = `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<title>새총 대작전</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{background:#1a0a2e;display:flex;justify-content:center;align-items:center;height:100vh;overflow:hidden}
canvas{border:2px solid #2a1a4e;border-radius:4px;cursor:crosshair}
</style>
</head>
<body>
<canvas id="gameCanvas" width="600" height="400"></canvas>
<script>
var canvas=document.getElementById('gameCanvas'),ctx=canvas.getContext('2d');
var score=0,gameOver=false,keys={};
var state='start',level=0,tick=0,bgStars=[];
var audioCtx=null;
function initAudio(){if(!audioCtx)audioCtx=new(window.AudioContext||window.webkitAudioContext)()}
function playSound(t){if(!audioCtx)return;try{var o=audioCtx.createOscillator(),g=audioCtx.createGain();o.connect(g);g.connect(audioCtx.destination);var n=audioCtx.currentTime;
if(t==='launch'){o.type='sawtooth';o.frequency.setValueAtTime(300,n);o.frequency.linearRampToValueAtTime(80,n+0.12);g.gain.setValueAtTime(0.18,n);g.gain.linearRampToValueAtTime(0,n+0.12);o.start(n);o.stop(n+0.12)}
else if(t==='hit'){o.type='sawtooth';o.frequency.setValueAtTime(250,n);o.frequency.linearRampToValueAtTime(60,n+0.1);g.gain.setValueAtTime(0.2,n);g.gain.linearRampToValueAtTime(0,n+0.1);o.start(n);o.stop(n+0.1)}
else if(t==='explode'){o.type='sawtooth';o.frequency.setValueAtTime(180,n);o.frequency.linearRampToValueAtTime(40,n+0.25);g.gain.setValueAtTime(0.28,n);g.gain.linearRampToValueAtTime(0,n+0.25);o.start(n);o.stop(n+0.25)}
else if(t==='pig'){o.type='triangle';o.frequency.setValueAtTime(600,n);o.frequency.linearRampToValueAtTime(200,n+0.18);g.gain.setValueAtTime(0.22,n);g.gain.linearRampToValueAtTime(0,n+0.18);o.start(n);o.stop(n+0.18)}
else if(t==='clear'){o.type='triangle';o.frequency.setValueAtTime(440,n);o.frequency.setValueAtTime(550,n+0.1);o.frequency.setValueAtTime(660,n+0.2);g.gain.setValueAtTime(0.18,n);g.gain.linearRampToValueAtTime(0,n+0.3);o.start(n);o.stop(n+0.3)}
else if(t==='split'){o.type='square';o.frequency.setValueAtTime(880,n);o.frequency.linearRampToValueAtTime(440,n+0.08);g.gain.setValueAtTime(0.12,n);g.gain.linearRampToValueAtTime(0,n+0.08);o.start(n);o.stop(n+0.08)}
}catch(e){}}
var GW=600,GH=400,GROUND=370,GRAV=0.28;
var SLING_X=100,SLING_Y=295,SLING_R=18;
var activeBirds=[],blocks=[],pigs=[],particles=[];
var mainBird=null,dragging=false,dragX=0,dragY=0,birdQueue=[],birdIdx=0;
var levelClearTimer=0,resultStars=0,totalBlocks=0;
var LEVELS=[
  {birds:[0,0,1],layout:[
    {x:380,y:GROUND-30,w:30,h:30,mat:0},{x:380,y:GROUND-60,w:30,h:30,mat:0},
    {x:420,y:GROUND-30,w:30,h:30,mat:0},{x:420,y:GROUND-60,w:30,h:30,mat:0},
    {x:400,y:GROUND-80,w:60,h:20,mat:2},
    {x:450,y:GROUND-30,w:20,h:30,mat:1},{x:450,y:GROUND-55,w:20,h:25,mat:1}],
   pigs:[{x:400,y:GROUND-100}]},
  {birds:[0,1,0,2],layout:[
    {x:360,y:GROUND-30,w:20,h:30,mat:1},{x:360,y:GROUND-58,w:20,h:24,mat:1},
    {x:400,y:GROUND-30,w:20,h:30,mat:0},{x:400,y:GROUND-60,w:20,h:28,mat:0},{x:400,y:GROUND-88,w:20,h:22,mat:0},
    {x:440,y:GROUND-30,w:20,h:30,mat:1},{x:440,y:GROUND-58,w:20,h:24,mat:1},
    {x:345,y:GROUND-30,w:16,h:30,mat:2},{x:462,y:GROUND-30,w:16,h:30,mat:2},
    {x:340,y:GROUND-60,w:144,h:18,mat:0}],
   pigs:[{x:370,y:GROUND-82},{x:450,y:GROUND-55}]},
  {birds:[2,1,0,0],layout:[
    {x:350,y:GROUND-30,w:24,h:30,mat:2},{x:350,y:GROUND-58,w:24,h:25,mat:2},{x:350,y:GROUND-82,w:24,h:22,mat:2},
    {x:388,y:GROUND-30,w:24,h:30,mat:0},{x:388,y:GROUND-58,w:24,h:25,mat:0},
    {x:426,y:GROUND-30,w:24,h:30,mat:2},{x:426,y:GROUND-58,w:24,h:25,mat:2},{x:426,y:GROUND-82,w:24,h:22,mat:2},
    {x:464,y:GROUND-30,w:24,h:30,mat:0},{x:340,y:GROUND-106,w:160,h:18,mat:1}],
   pigs:[{x:395,y:GROUND-80},{x:468,y:GROUND-55}]},
  {birds:[0,2,1,0,1],layout:[
    {x:328,y:GROUND-30,w:22,h:30,mat:0},{x:328,y:GROUND-60,w:22,h:25,mat:0},
    {x:356,y:GROUND-30,w:22,h:30,mat:2},{x:356,y:GROUND-60,w:22,h:28,mat:2},{x:356,y:GROUND-88,w:22,h:24,mat:2},
    {x:384,y:GROUND-30,w:22,h:30,mat:1},{x:384,y:GROUND-60,w:22,h:25,mat:1},{x:384,y:GROUND-83,w:22,h:20,mat:1},
    {x:412,y:GROUND-30,w:22,h:30,mat:0},{x:412,y:GROUND-60,w:22,h:28,mat:0},{x:412,y:GROUND-88,w:22,h:24,mat:0},
    {x:440,y:GROUND-30,w:22,h:30,mat:2},{x:440,y:GROUND-60,w:22,h:25,mat:2},
    {x:318,y:GROUND-112,w:172,h:18,mat:1}],
   pigs:[{x:362,y:GROUND-117},{x:440,y:GROUND-117},{x:390,y:GROUND-110}]},
  {birds:[2,0,1,1,0,2],layout:[
    {x:308,y:GROUND-30,w:20,h:30,mat:2},{x:308,y:GROUND-58,w:20,h:25,mat:2},{x:308,y:GROUND-80,w:20,h:20,mat:2},
    {x:334,y:GROUND-30,w:20,h:30,mat:0},{x:334,y:GROUND-58,w:20,h:25,mat:0},{x:334,y:GROUND-80,w:20,h:20,mat:0},
    {x:360,y:GROUND-30,w:20,h:30,mat:1},{x:360,y:GROUND-58,w:20,h:28,mat:1},{x:360,y:GROUND-84,w:20,h:24,mat:1},
    {x:386,y:GROUND-30,w:20,h:30,mat:2},{x:386,y:GROUND-58,w:20,h:28,mat:2},{x:386,y:GROUND-84,w:20,h:24,mat:2},
    {x:412,y:GROUND-30,w:20,h:30,mat:0},{x:412,y:GROUND-58,w:20,h:25,mat:0},{x:412,y:GROUND-80,w:20,h:20,mat:0},
    {x:438,y:GROUND-30,w:20,h:30,mat:1},{x:438,y:GROUND-58,w:20,h:25,mat:1},
    {x:298,y:GROUND-108,w:192,h:18,mat:1},{x:298,y:GROUND-128,w:192,h:18,mat:2}],
   pigs:[{x:318,y:GROUND-148},{x:368,y:GROUND-152},{x:418,y:GROUND-148},{x:448,y:GROUND-60}]}
];
function initLevel(lv){
  var ld=LEVELS[lv%LEVELS.length];
  blocks=[];pigs=[];particles=[];mainBird=null;dragging=false;birdIdx=0;levelClearTimer=0;activeBirds=[];
  birdQueue=ld.birds.slice();totalBlocks=ld.layout.length;
  for(var i=0;i<ld.layout.length;i++){var b=ld.layout[i];blocks.push({x:b.x,y:b.y,w:b.w,h:b.h,mat:b.mat,hp:b.mat===1?2:1,vx:0,vy:0,angle:0,av:0,alive:true})}
  for(var i=0;i<ld.pigs.length;i++){var p=ld.pigs[i];pigs.push({x:p.x,y:p.y,r:13,hp:2,vx:0,vy:0,alive:true})}
  spawnBird();
}
function spawnBird(){
  if(birdIdx>=birdQueue.length){mainBird=null;return}
  mainBird={x:SLING_X,y:SLING_Y,r:12,type:birdQueue[birdIdx],vx:0,vy:0,launched:false,alive:true,canSplit:birdQueue[birdIdx]===1,exploded:false};
  birdIdx++;
}
function burst(x,y,color,n){for(var i=0;i<(n||10);i++){var a=Math.random()*Math.PI*2,sp=2+Math.random()*5;particles.push({x:x,y:y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp-1.5,life:22+Math.random()*14,maxLife:36,color:color,size:2+Math.random()*3})}}
function explodeArea(ex,ey,er){
  burst(ex,ey,'#f80',18);burst(ex,ey,'#ff0',12);burst(ex,ey,'#f44',8);playSound('explode');
  for(var i=0;i<blocks.length;i++){var b=blocks[i];if(!b.alive)continue;var cx=b.x+b.w/2,cy=b.y+b.h/2,dx=cx-ex,dy=cy-ey,d=Math.sqrt(dx*dx+dy*dy);if(d<er){b.hp=0;b.alive=false;score+=10;burst(cx,cy,b.mat===2?'#8cf':b.mat===0?'#8a5c2e':'#888',6)}}
  for(var i=0;i<pigs.length;i++){var pg=pigs[i];if(!pg.alive)continue;var dx=pg.x-ex,dy=pg.y-ey,d=Math.sqrt(dx*dx+dy*dy);if(d<er+pg.r){pg.hp=0;pg.alive=false;score+=100;burst(pg.x,pg.y,'#4c8',12);playSound('pig')}}
}
function checkHit(bx,by,br,out){
  for(var i=0;i<blocks.length;i++){var b=blocks[i];if(!b.alive)continue;if(bx+br>b.x&&bx-br<b.x+b.w&&by+br>b.y&&by-br<b.y+b.h){out.push({type:'block',idx:i});return true}}
  for(var i=0;i<pigs.length;i++){var pg=pigs[i];if(!pg.alive)continue;var dx=bx-pg.x,dy=by-pg.y;if(Math.sqrt(dx*dx+dy*dy)<br+pg.r){out.push({type:'pig',idx:i});return true}}
  if(by+br>GROUND){out.push({type:'ground'});return true}
  return false;
}
function handleBirdHit(brd,hit){
  var h=hit[0];playSound('hit');
  if(h.type==='block'){var b=blocks[h.idx];burst(brd.x,brd.y,b.mat===2?'#8cf':b.mat===0?'#c87030':'#aaa',10);b.hp--;b.vx+=brd.vx*0.45;b.vy+=brd.vy*0.38;b.av+=(Math.random()-0.5)*0.3;if(b.hp<=0){b.alive=false;score+=10}}
  else if(h.type==='pig'){var pg=pigs[h.idx];burst(brd.x,brd.y,'#4c8',10);pg.hp--;if(pg.hp<=0){pg.alive=false;score+=100;playSound('pig')}}
  else{burst(brd.x,GROUND,'#a87',8)}
  if(brd.type===2&&!brd.exploded){brd.exploded=true;explodeArea(brd.x,brd.y,82)}
  brd.alive=false;
}
canvas.addEventListener('mousedown',function(e){
  initAudio();var rect=canvas.getBoundingClientRect();
  var mx=(e.clientX-rect.left)*(GW/rect.width),my=(e.clientY-rect.top)*(GH/rect.height);
  if(state==='start'){state='playing';initLevel(0);return}
  if(state==='levelClear'){if(tick-levelClearTimer>80){level++;if(level>=LEVELS.length){state='start';level=0}else{state='playing';initLevel(level)}};return}
  if(state==='gameover'){if(tick-levelClearTimer>80){state='playing';score=0;level=0;initLevel(0)};return}
  if(state!=='playing')return;
  if(mainBird&&mainBird.launched&&mainBird.alive&&mainBird.type===1&&mainBird.canSplit){
    mainBird.canSplit=false;playSound('split');
    for(var i=-1;i<=1;i+=2){activeBirds.push({x:mainBird.x,y:mainBird.y,r:9,type:1,vx:mainBird.vx+i*2.2,vy:mainBird.vy-1.8,launched:true,alive:true,canSplit:false,exploded:false})}
    mainBird.vy-=2.2;mainBird.vx*=0.65;return;
  }
  if(mainBird&&!mainBird.launched){var dx=mx-SLING_X,dy=my-SLING_Y;if(Math.sqrt(dx*dx+dy*dy)<SLING_R*2.8){dragging=true;dragX=mx;dragY=my}}
});
canvas.addEventListener('mousemove',function(e){if(!dragging)return;var rect=canvas.getBoundingClientRect();dragX=(e.clientX-rect.left)*(GW/rect.width);dragY=(e.clientY-rect.top)*(GH/rect.height);var dx=dragX-SLING_X,dy=dragY-SLING_Y,d=Math.sqrt(dx*dx+dy*dy);if(d>SLING_R){dragX=SLING_X+dx/d*SLING_R;dragY=SLING_Y+dy/d*SLING_R}});
canvas.addEventListener('mouseup',function(){
  if(!dragging||!mainBird)return;dragging=false;
  var dx=SLING_X-dragX,dy=SLING_Y-dragY,pwr=Math.sqrt(dx*dx+dy*dy)/SLING_R;
  mainBird.vx=dx*pwr*0.38;mainBird.vy=dy*pwr*0.38;mainBird.launched=true;playSound('launch');
});
document.addEventListener('keydown',function(e){keys[e.key]=true;
  if(e.key===' '){initAudio();
    if(state==='start'){state='playing';initLevel(level)}
    else if(state==='levelClear'){level++;if(level>=LEVELS.length){state='start';level=0}else{state='playing';initLevel(level)}}
    else if(state==='gameover'){state='playing';score=0;level=0;initLevel(0)}}
});
document.addEventListener('keyup',function(e){keys[e.key]=false});
for(var si=0;si<80;si++)bgStars.push({x:Math.random()*600,y:Math.random()*300,r:Math.random()*1.5,b:Math.random()});
function physicsStep(brd){brd.vy+=GRAV;brd.x+=brd.vx;brd.y+=brd.vy}
function update(){
  tick++;
  for(var i=particles.length-1;i>=0;i--){var p=particles[i];p.x+=p.vx;p.y+=p.vy;p.vy+=0.14;p.life--;if(p.life<=0)particles.splice(i,1)}
  if(state!=='playing')return;
  for(var i=0;i<blocks.length;i++){var b=blocks[i];if(!b.alive)continue;b.vy+=GRAV;b.x+=b.vx;b.y+=b.vy;b.angle+=b.av;b.vx*=0.96;b.av*=0.93;if(b.y+b.h>GROUND){b.y=GROUND-b.h;b.vy*=-0.32;b.vx*=0.78;if(Math.abs(b.vy)<0.8)b.vy=0}}
  for(var i=0;i<pigs.length;i++){var pg=pigs[i];if(!pg.alive)continue;pg.vy+=GRAV;pg.x+=pg.vx;pg.y+=pg.vy;pg.vx*=0.96;if(pg.y+pg.r>GROUND){pg.y=GROUND-pg.r;pg.vy*=-0.28;pg.vx*=0.78;if(Math.abs(pg.vy)<0.6)pg.vy=0}}
  if(mainBird&&mainBird.launched&&mainBird.alive){
    physicsStep(mainBird);
    if(mainBird.x>GW+40||mainBird.y>GH+40){mainBird.alive=false;setTimeout(function(){spawnBird()},650)}
    else{var hit=[];if(checkHit(mainBird.x,mainBird.y,mainBird.r,hit)){handleBirdHit(mainBird,hit);if(!mainBird.alive)setTimeout(function(){spawnBird()},650)}}
  }
  for(var si2=activeBirds.length-1;si2>=0;si2--){var sb=activeBirds[si2];if(!sb.alive){activeBirds.splice(si2,1);continue}
    physicsStep(sb);if(sb.x>GW+40||sb.y>GH+40){activeBirds.splice(si2,1);continue}
    var hit2=[];if(checkHit(sb.x,sb.y,sb.r,hit2)){handleBirdHit(sb,hit2);activeBirds.splice(si2,1)}}
  var pigsLeft=pigs.filter(function(p){return p.alive}).length;
  var shotsLeft=birdQueue.length-birdIdx+(mainBird?1:0)+activeBirds.length;
  if(pigsLeft===0&&levelClearTimer===0){playSound('clear');var destroyed=blocks.filter(function(b){return!b.alive}).length;var dRate=destroyed/Math.max(totalBlocks,1);score+=shotsLeft*50;resultStars=dRate>0.75&&shotsLeft>1?3:dRate>0.4||shotsLeft>0?2:1;state='levelClear';levelClearTimer=tick}
  if(pigsLeft>0&&shotsLeft===0&&(!mainBird||!mainBird.launched)&&activeBirds.length===0&&levelClearTimer===0){state='gameover';levelClearTimer=tick}
}
function drawBird(x,y,r,btype,alpha){
  ctx.globalAlpha=alpha||1;
  var clr=btype===0?'#e43':btype===1?'#4af':'#333';
  ctx.fillStyle=clr;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='rgba(255,255,255,0.22)';ctx.beginPath();ctx.arc(x-r*0.28,y-r*0.32,r*0.36,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(x+r*0.28,y-r*0.18,r*0.28,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#111';ctx.beginPath();ctx.arc(x+r*0.36,y-r*0.18,r*0.13,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#fa0';ctx.beginPath();ctx.moveTo(x+r*0.48,y+r*0.08);ctx.lineTo(x+r*1.05,y-r*0.02);ctx.lineTo(x+r*0.48,y+r*0.28);ctx.closePath();ctx.fill();
  if(btype===1){ctx.strokeStyle='#8cf';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(x,y,r+2.5,0,Math.PI*2);ctx.stroke()}
  if(btype===2){ctx.fillStyle='rgba(255,80,0,0.18)';ctx.beginPath();ctx.arc(x,y,r+4,0,Math.PI*2);ctx.fill()}
  ctx.globalAlpha=1;ctx.lineWidth=1;
}
function drawBlock(b){
  ctx.save();ctx.translate(b.x+b.w/2,b.y+b.h/2);ctx.rotate(b.angle);
  var clr=b.mat===0?'#8a5c2a':b.mat===1?'#888':'#7ab8e8';
  ctx.fillStyle=clr;ctx.fillRect(-b.w/2,-b.h/2,b.w,b.h);
  ctx.strokeStyle='rgba(0,0,0,0.35)';ctx.lineWidth=1.5;ctx.strokeRect(-b.w/2+0.5,-b.h/2+0.5,b.w-1,b.h-1);
  ctx.fillStyle='rgba(255,255,255,0.18)';ctx.fillRect(-b.w/2+2,-b.h/2+2,b.w-4,3);
  ctx.fillStyle='rgba(0,0,0,0.1)';ctx.fillRect(-b.w/2+2,b.h/2-4,b.w-4,3);
  if(b.mat===2&&b.hp<2){ctx.strokeStyle='rgba(0,0,100,0.45)';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(-b.w/2+4,b.h/2);ctx.lineTo(b.w/4,-b.h/2+3);ctx.moveTo(b.w/2-4,-b.h/4);ctx.lineTo(-b.w/4,b.h/2-2);ctx.stroke()}
  ctx.restore();
}
function drawPig(pg){
  ctx.fillStyle='#5cb85c';ctx.beginPath();ctx.arc(pg.x,pg.y,pg.r,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#4aaa4a';ctx.beginPath();ctx.arc(pg.x,pg.y,pg.r,Math.PI,Math.PI*2);ctx.fill();
  ctx.fillStyle='rgba(255,255,255,0.15)';ctx.beginPath();ctx.arc(pg.x-3,pg.y-4,5,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(pg.x-5,pg.y-3,3.5,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.arc(pg.x+5,pg.y-3,3.5,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#222';ctx.beginPath();ctx.arc(pg.x-5,pg.y-3,1.8,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.arc(pg.x+5,pg.y-3,1.8,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#f88';ctx.beginPath();ctx.ellipse(pg.x,pg.y+2,3.5,2.5,0,0,Math.PI*2);ctx.fill();
  if(pg.hp<2){ctx.strokeStyle='rgba(255,0,0,0.6)';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(pg.x-5,pg.y-7);ctx.lineTo(pg.x+3,pg.y-3);ctx.moveTo(pg.x-3,pg.y-7);ctx.lineTo(pg.x+5,pg.y-2);ctx.stroke()}
}
function draw(){
  var sky=ctx.createLinearGradient(0,0,0,GROUND);sky.addColorStop(0,'#0a1a4a');sky.addColorStop(1,'#2a5a9a');
  ctx.fillStyle=sky;ctx.fillRect(0,0,GW,GROUND);
  for(var i=0;i<bgStars.length;i++){var s=bgStars[i];ctx.globalAlpha=0.3+s.b*0.55*Math.abs(Math.sin(tick*0.018+i*1.3));ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(s.x,s.y,s.r,0,Math.PI*2);ctx.fill()}ctx.globalAlpha=1;
  ctx.fillStyle='rgba(255,255,255,0.09)';for(var ci=0;ci<3;ci++){var cx2=[120,290,460][ci],cy2=[60,88,52][ci];ctx.beginPath();ctx.ellipse(cx2,cy2,52,20,0,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.ellipse(cx2+25,cy2-10,36,15,0,0,Math.PI*2);ctx.fill()}
  var grd2=ctx.createLinearGradient(0,GROUND,0,GH);grd2.addColorStop(0,'#2d5a1b');grd2.addColorStop(0.2,'#4a7a2a');grd2.addColorStop(1,'#1a3a0a');
  ctx.fillStyle=grd2;ctx.fillRect(0,GROUND,GW,GH-GROUND);
  ctx.strokeStyle='#5a8a30';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(0,GROUND);ctx.lineTo(GW,GROUND);ctx.stroke();
  ctx.strokeStyle='#6B3410';ctx.lineWidth=6;ctx.lineCap='round';
  ctx.beginPath();ctx.moveTo(SLING_X-2,SLING_Y+32);ctx.quadraticCurveTo(SLING_X-14,SLING_Y+10,SLING_X-9,SLING_Y-8);ctx.stroke();
  ctx.beginPath();ctx.moveTo(SLING_X+2,SLING_Y+32);ctx.quadraticCurveTo(SLING_X+14,SLING_Y+10,SLING_X+9,SLING_Y-8);ctx.stroke();
  ctx.fillStyle='#6B3410';ctx.beginPath();ctx.ellipse(SLING_X,SLING_Y+32,7,5,0,0,Math.PI*2);ctx.fill();
  var bx2=dragging&&mainBird&&!mainBird.launched?dragX:SLING_X;
  var by2=dragging&&mainBird&&!mainBird.launched?dragY:SLING_Y;
  ctx.lineWidth=2;ctx.strokeStyle='#c8a060';
  ctx.beginPath();ctx.moveTo(SLING_X-9,SLING_Y-8);ctx.lineTo(bx2,by2);ctx.stroke();
  ctx.beginPath();ctx.moveTo(SLING_X+9,SLING_Y-8);ctx.lineTo(bx2,by2);ctx.stroke();
  if(dragging&&mainBird&&!mainBird.launched){
    var pdx=SLING_X-dragX,pdy=SLING_Y-dragY,pd=Math.sqrt(pdx*pdx+pdy*pdy),ppwr=pd/SLING_R;
    var pvx=pdx*ppwr*0.38,pvy=pdy*ppwr*0.38,ppx=dragX,ppy=dragY;
    ctx.setLineDash([5,7]);ctx.strokeStyle='rgba(255,255,255,0.3)';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(ppx,ppy);
    for(var ti=0;ti<26;ti++){ppx+=pvx;ppy+=pvy;pvy+=GRAV;if(ppx>GW||ppy>GH)break;ctx.lineTo(ppx,ppy)}ctx.stroke();ctx.setLineDash([]);
  }
  for(var i=0;i<blocks.length;i++){if(blocks[i].alive)drawBlock(blocks[i])}
  for(var i=0;i<pigs.length;i++){if(pigs[i].alive)drawPig(pigs[i])}
  for(var i=0;i<activeBirds.length;i++){if(activeBirds[i].alive)drawBird(activeBirds[i].x,activeBirds[i].y,activeBirds[i].r,activeBirds[i].type,1)}
  if(mainBird){drawBird(bx2,by2,mainBird.r,mainBird.type,mainBird.launched&&!mainBird.alive?0.4:1)}
  for(var i=0;i<particles.length;i++){var p=particles[i];ctx.globalAlpha=p.life/p.maxLife;ctx.fillStyle=p.color;ctx.fillRect(p.x-p.size/2,p.y-p.size/2,p.size,p.size)}ctx.globalAlpha=1;
  for(var i=0;i<Math.min(6,birdQueue.length-birdIdx);i++){drawBird(22+i*26,GH-18,8,birdQueue[birdIdx+i],0.75)}
  ctx.fillStyle='rgba(0,0,0,0.35)';ctx.fillRect(0,0,GW,30);
  ctx.fillStyle='#fff';ctx.font='bold 14px sans-serif';ctx.fillText('\\uC810\\uC218: '+score,180,20);
  ctx.fillStyle='#ffd700';ctx.textAlign='center';ctx.fillText('\\uB808\\uBCA8 '+(level+1)+' / '+LEVELS.length,300,20);ctx.textAlign='left';
  var pigsLeft=pigs.filter(function(p){return p.alive}).length;
  ctx.fillStyle='#f44';ctx.font='13px sans-serif';ctx.fillText('\\uB3FC\\uC9C0: '+pigsLeft,500,20);
  if(state==='start'){
    ctx.fillStyle='rgba(0,0,0,0.62)';ctx.fillRect(0,0,GW,GH);
    ctx.fillStyle='#ffd700';ctx.font='bold 36px sans-serif';ctx.textAlign='center';ctx.fillText('\\uC0C8\\uCD1D \\uB300\\uC791\\uC804',300,148);
    ctx.fillStyle='#fff';ctx.font='15px sans-serif';ctx.fillText('\\uC2AC\\uB9C1\\uC0F7 \\uC601\\uC5ED \\uB4DC\\uB798\\uADF8 - \\uC870\\uC900 \\u2192 \\uBC1C\\uC0AC!',300,192);
    ctx.fillStyle='#aaf';ctx.font='13px sans-serif';ctx.fillText('\\uBE68\\uAC15: \\uC77C\\uBC18  \\uD30C\\uB780: \\uBE44\\uD589\\uC911 \\uD074\\uB9AD=\\uBD84\\uC5F4  \\uAC80\\uC815: \\uD3ED\\uBC1C',300,218);
    ctx.globalAlpha=0.55+0.45*Math.abs(Math.sin(tick*0.05));ctx.fillStyle='#fff';ctx.font='bold 16px sans-serif';ctx.fillText('\\uC2A4\\uD398\\uC774\\uC2A4\\uBC14 \\uB610\\uB294 \\uD074\\uB9AD\\uC73C\\uB85C \\uC2DC\\uC791',300,268);ctx.globalAlpha=1;ctx.textAlign='left';
  }
  if(state==='levelClear'){
    ctx.fillStyle='rgba(0,0,0,0.58)';ctx.fillRect(0,0,GW,GH);
    ctx.fillStyle='#ffd700';ctx.font='bold 34px sans-serif';ctx.textAlign='center';ctx.fillText('\\uB808\\uBCA8 \\uD074\\uB9AC\\uC5B4!',300,148);
    ctx.fillStyle='#fff';ctx.font='20px sans-serif';ctx.fillText('\\uC810\\uC218: '+score,300,190);
    ctx.font='30px sans-serif';for(var ri=0;ri<3;ri++){ctx.fillStyle=ri<resultStars?'#ffd700':'#444';ctx.fillText('\\u2605',238+ri*42,238)}
    ctx.globalAlpha=0.55+0.45*Math.abs(Math.sin(tick*0.05));ctx.fillStyle='#fff';ctx.font='14px sans-serif';ctx.fillText('\\uC2A4\\uD398\\uC774\\uC2A4 \\uB610\\uB294 \\uD074\\uB9AD\\uC73C\\uB85C \\uB2E4\\uC74C \\uB808\\uBCA8',300,288);ctx.globalAlpha=1;ctx.textAlign='left';
  }
  if(state==='gameover'){
    ctx.fillStyle='rgba(0,0,0,0.7)';ctx.fillRect(0,0,GW,GH);
    ctx.fillStyle='#f44';ctx.font='bold 34px sans-serif';ctx.textAlign='center';ctx.fillText('\\uC2E4\\uD328!',300,148);
    ctx.fillStyle='#fff';ctx.font='20px sans-serif';ctx.fillText('\\uC810\\uC218: '+score,300,192);
    ctx.fillStyle='#aaa';ctx.font='14px sans-serif';ctx.fillText('\\uC0C8\\uCD1D \\uD0C4\\uD658\\uC744 \\uBAA8\\uB450 \\uC0AC\\uC6A9\\uD588\\uC2B5\\uB2C8\\uB2E4',300,228);
    ctx.globalAlpha=0.55+0.45*Math.abs(Math.sin(tick*0.05));ctx.fillStyle='#fff';ctx.font='14px sans-serif';ctx.fillText('\\uC2A4\\uD398\\uC774\\uC2A4 \\uB610\\uB294 \\uD074\\uB9AD\\uC73C\\uB85C \\uC7AC\\uC2DC\\uC791',300,270);ctx.globalAlpha=1;ctx.textAlign='left';
  }
}
function loop(){update();draw();requestAnimationFrame(loop)}
loop();
</script>
</body>
</html>`;

export const DEMO_GAMES: DemoGame[] = [
  {
    id: 'dungeon-crawler',
    title: '던전 크롤러',
    description: 'Three.js 3D 던전! BSP 생성, 안개 전쟁, 3종 적 AI, 파티클 전투 효과, 미니맵!',
    prompt: 'BSP 던전 생성, 안개 전쟁, 해골/슬라임/궁수, 체력포션/검업/방어막 아이템, 미니맵이 있는 던전 크롤러',
    icon: '⚔️',
    accentColor: '#C8A060',
    html: DUNGEON_CRAWLER_HTML,
  },
  {
    id: 'physics-puzzle',
    title: '새총 대작전',
    description: '새총으로 돼지를 쓰러트려라! 3종 새, 5레벨, 폭발·분열 특수 효과!',
    prompt: '새총 물리 퍼즐 게임, 분열/폭발 새, 나무/돌/유리 블록 구조물, 별점 시스템',
    icon: '🐦',
    accentColor: '#FF6B35',
    html: PHYSICS_PUZZLE_HTML,
  },
  {
    id: 'rhythm-game',
    title: '리듬 게임',
    description: 'BPM 동기화 음악, 4레인 노트, 콤보 & 판정 시스템이 있는 리듬 게임!',
    prompt: 'Web Audio API 절차적 음악, 4레인 노트 낙하, PERFECT/GREAT/MISS 판정, BPM 가속이 있는 리듬 게임',
    icon: '🎵',
    accentColor: '#BF5AF2',
    html: RHYTHM_GAME_HTML,
  },
];
