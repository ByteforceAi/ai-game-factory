export const TETRIS_HTML = `<!DOCTYPE html>
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
#popup{position:fixed;pointer-events:none;font-size:24px;font-weight:bold;color:#fff;text-shadow:0 0 12px #fff,0 0 24px currentColor;opacity:0;transition:all .5s}
#overlay{position:fixed;inset:0;display:none;justify-content:center;align-items:center;background:rgba(0,0,0,.75);flex-direction:column;gap:16px;z-index:10}
#overlay h1{font-size:36px;color:#ff0044;text-shadow:0 0 20px #ff0044;letter-spacing:3px}
#overlay p{font-size:18px;color:#aaa}
#overlay button{padding:12px 32px;font-size:18px;border:none;border-radius:8px;background:#0066ff;color:#fff;cursor:pointer;font-family:inherit;letter-spacing:1px}
#overlay button:hover{background:#0088ff}
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
'use strict';

/* ═══════════ PROCEDURAL AUDIO ═══════════ */
var AudioCtx = window.AudioContext || window.webkitAudioContext;
var actx = null;
function ensureAudio(){
  if(!actx){ try{ actx = new AudioCtx(); }catch(e){ actx=null; } }
  if(actx && actx.state==='suspended') actx.resume().catch(function(){});
}

function sfxMove(){
  if(!actx) return;
  try{
    var t=actx.currentTime;
    var osc=actx.createOscillator();
    var gain=actx.createGain();
    osc.type='sine';
    osc.frequency.setValueAtTime(200,t);
    gain.gain.setValueAtTime(0.03,t);
    gain.gain.exponentialRampToValueAtTime(0.001,t+0.04);
    osc.connect(gain);gain.connect(actx.destination);
    osc.start(t);osc.stop(t+0.05);
  }catch(e){}
}

function sfxRotate(){
  if(!actx) return;
  try{
    var t=actx.currentTime;
    var osc=actx.createOscillator();
    var gain=actx.createGain();
    osc.type='sine';
    osc.frequency.setValueAtTime(400,t);
    osc.frequency.exponentialRampToValueAtTime(600,t+0.06);
    gain.gain.setValueAtTime(0.05,t);
    gain.gain.exponentialRampToValueAtTime(0.001,t+0.07);
    osc.connect(gain);gain.connect(actx.destination);
    osc.start(t);osc.stop(t+0.08);
  }catch(e){}
}

function sfxDrop(){
  if(!actx) return;
  try{
    var t=actx.currentTime;
    var bufSize=Math.floor(actx.sampleRate*0.08);
    var buf=actx.createBuffer(1,bufSize,actx.sampleRate);
    var data=buf.getChannelData(0);
    for(var i=0;i<bufSize;i++) data[i]=(Math.random()*2-1)*Math.pow(1-i/bufSize,3);
    var src=actx.createBufferSource();src.buffer=buf;
    var filter=actx.createBiquadFilter();
    filter.type='lowpass';filter.frequency.value=400;
    var gain=actx.createGain();
    gain.gain.setValueAtTime(0.1,t);
    gain.gain.exponentialRampToValueAtTime(0.001,t+0.08);
    src.connect(filter);filter.connect(gain);gain.connect(actx.destination);
    src.start(t);
  }catch(e){}
}

function sfxClear(numLines){
  if(!actx) return;
  try{
    var t=actx.currentTime;
    var baseFreq=400+numLines*150;
    for(var n=0;n<numLines;n++){
      var osc=actx.createOscillator();
      var gain=actx.createGain();
      osc.type='sine';
      var st=t+n*0.08;
      osc.frequency.setValueAtTime(baseFreq+n*200,st);
      osc.frequency.exponentialRampToValueAtTime(baseFreq+n*200+400,st+0.15);
      gain.gain.setValueAtTime(0.08,st);
      gain.gain.exponentialRampToValueAtTime(0.001,st+0.2);
      osc.connect(gain);gain.connect(actx.destination);
      osc.start(st);osc.stop(st+0.21);
    }
  }catch(e){}
}

function sfxGameOver(){
  if(!actx) return;
  try{
    var t=actx.currentTime;
    var notes=[330,277,233,196];
    for(var i=0;i<notes.length;i++){
      var osc=actx.createOscillator();
      var gain=actx.createGain();
      osc.type='sine';
      var st=t+i*0.2;
      osc.frequency.setValueAtTime(notes[i],st);
      gain.gain.setValueAtTime(0.08,st);
      gain.gain.exponentialRampToValueAtTime(0.001,st+0.25);
      osc.connect(gain);gain.connect(actx.destination);
      osc.start(st);osc.stop(st+0.26);
    }
  }catch(e){}
}

/* ═══════════ GAME LOGIC ═══════════ */
var score=0,gameOver=false,keys={};
var COLS=10,ROWS=20,BS,grid=[],cur,nx,lockTimer=0,LOCK_DELAY=500;
var lines=0,level=1,dropInterval=1000,lastDrop=0,softDrop=false;
var shakeX=0,shakeY=0,clearing=[],clearAnim=0;
var gameOverSent=false;
var COLORS={I:'#00f5ff',O:'#fff700',T:'#b400ff',S:'#00ff88',Z:'#ff0044',J:'#0066ff',L:'#ff8800'};
var GLOW_COLORS={I:'#00f5ff',O:'#fff700',T:'#b400ff',S:'#00ff88',Z:'#ff0044',J:'#0066ff',L:'#ff8800'};
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
    if(cy<0){gameOver=true;sfxGameOver();return}
    grid[cy][cx]=cur.type;
  }
  checkLines();spawn();
}
function checkLines(){
  clearing=[];
  for(var r=0;r<ROWS;r++){var full=true;for(var c=0;c<COLS;c++)if(!grid[r][c]){full=false;break}if(full)clearing.push(r)}
  if(clearing.length){
    clearAnim=350;
    sfxClear(clearing.length);
    var pts=[0,100,300,500,800][clearing.length]||800;
    score+=pts*level;lines+=clearing.length;
    level=Math.floor(lines/10)+1;
    dropInterval=Math.max(100,1000-((level-1)*80));
    showPopup('+'+pts*level, clearing.length>=4);
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
function spawn(){
  cur=nx?{type:nx.type,cells:nx.cells.map(function(p){return[p[0],p[1]]}),x:Math.floor((COLS-4)/2),y:0}:newPiece(nextType());
  nx=newPiece(nextType());lockTimer=0;
  if(!fits(cur.cells,cur.x,cur.y)){gameOver=true;sfxGameOver();}
}

/* ═══════════ ENHANCED RENDERING ═══════════ */
function drawBlock(c,x,y,s,alpha){
  c.globalAlpha=alpha||1;
  var col=COLORS[s];
  // main fill
  c.fillStyle=col;
  c.fillRect(x+1,y+1,BS-2,BS-2);
  // top-left highlight
  c.fillStyle='rgba(255,255,255,0.3)';
  c.fillRect(x+1,y+1,BS-2,3);
  c.fillRect(x+1,y+1,3,BS-2);
  // bottom-right shadow
  c.fillStyle='rgba(0,0,0,0.3)';
  c.fillRect(x+1,y+BS-4,BS-2,3);
  c.fillRect(x+BS-4,y+1,3,BS-2);
  // inner glow
  c.fillStyle='rgba(255,255,255,0.1)';
  c.fillRect(x+4,y+4,BS-8,BS-8);
  c.globalAlpha=1;
}

function drawGrid(){
  // Background gradient
  var bgGrad=ctx.createLinearGradient(0,0,0,cv.height);
  bgGrad.addColorStop(0,'#0a0a12');
  bgGrad.addColorStop(1,'#0a0a0a');
  ctx.fillStyle=bgGrad;
  ctx.fillRect(0,0,cv.width,cv.height);
  // Grid lines
  ctx.strokeStyle='#1a1a22';ctx.lineWidth=0.5;
  for(var r=0;r<=ROWS;r++){ctx.beginPath();ctx.moveTo(0,r*BS);ctx.lineTo(cv.width,r*BS);ctx.stroke()}
  for(var c=0;c<=COLS;c++){ctx.beginPath();ctx.moveTo(c*BS,0);ctx.lineTo(c*BS,cv.height);ctx.stroke()}
}

function render(){
  ctx.save();
  ctx.translate(shakeX,shakeY);
  drawGrid();

  // Draw locked blocks
  for(var r=0;r<ROWS;r++)for(var c=0;c<COLS;c++){
    if(grid[r][c]){
      if(clearing.indexOf(r)!==-1){
        // Enhanced line clear animation: flash + dissolve
        var progress=clearAnim/350;
        ctx.globalAlpha=progress;
        ctx.fillStyle='#ffffff';
        ctx.fillRect(c*BS,r*BS,BS,BS);
        // glow
        ctx.shadowColor='#ffffff';
        ctx.shadowBlur=progress*15;
        ctx.fillRect(c*BS+2,r*BS+2,BS-4,BS-4);
        ctx.shadowBlur=0;
        ctx.globalAlpha=1;
      }else{
        drawBlock(ctx,c*BS,r*BS,grid[r][c]);
      }
    }
  }

  // Ghost + current piece
  if(cur&&!gameOver){
    var gy=ghostY();
    for(var i=0;i<cur.cells.length;i++){
      var gx=cur.cells[i][0]+cur.x,gcy=cur.cells[i][1]+gy;
      if(gcy>=0){
        ctx.globalAlpha=0.15;
        ctx.fillStyle=COLORS[cur.type];
        ctx.fillRect(gx*BS+1,gcy*BS+1,BS-2,BS-2);
        ctx.strokeStyle=COLORS[cur.type];
        ctx.lineWidth=1;
        ctx.strokeRect(gx*BS+1,gcy*BS+1,BS-2,BS-2);
        ctx.globalAlpha=1;
      }
    }
    for(var i=0;i<cur.cells.length;i++){
      var px=cur.cells[i][0]+cur.x,py=cur.cells[i][1]+cur.y;
      if(py>=0) drawBlock(ctx,px*BS,py*BS,cur.type);
    }
  }
  ctx.restore();

  // Next piece preview (enhanced)
  nctx.fillStyle='#0a0a0a';nctx.fillRect(0,0,80,80);
  if(nx){
    var ns=16;
    for(var i=0;i<nx.cells.length;i++){
      var px=nx.cells[i][0]*ns+10,py=nx.cells[i][1]*ns+20;
      nctx.fillStyle=COLORS[nx.type];
      nctx.fillRect(px+1,py+1,ns-2,ns-2);
      nctx.fillStyle='rgba(255,255,255,0.25)';
      nctx.fillRect(px+1,py+1,ns-2,2);
      nctx.fillRect(px+1,py+1,2,ns-2);
    }
  }
}

/* ═══════════ CONTROLS ═══════════ */
function mL(){
  if(cur&&fits(cur.cells,cur.x-1,cur.y)){cur.x--;lockTimer=0;sfxMove();}
}
function mR(){
  if(cur&&fits(cur.cells,cur.x+1,cur.y)){cur.x++;lockTimer=0;sfxMove();}
}
function rot(){
  if(!cur)return;
  var r=rotate(cur.cells);
  var offsets=[0,-1,1,-2,2];
  for(var i=0;i<offsets.length;i++){
    if(fits(r,cur.x+offsets[i],cur.y)){
      cur.cells=r;cur.x+=offsets[i];lockTimer=0;
      sfxRotate();
      return;
    }
  }
}
function sD(){if(cur&&fits(cur.cells,cur.x,cur.y+1)){cur.y++;sfxMove();}}
function hD(){
  if(!cur)return;
  while(fits(cur.cells,cur.x,cur.y+1))cur.y++;
  lock();
  sfxDrop();
  shakeX=(Math.random()-0.5)*6;shakeY=Math.random()*4;
  setTimeout(function(){shakeX=0;shakeY=0},80);
}

// Make functions global for touch buttons
window.mL=mL;window.mR=mR;window.rot=rot;window.sD=sD;window.hD=hD;

function showPopup(txt,isTetris){
  var el=document.getElementById('popup');
  el.textContent=txt;
  el.style.opacity=1;
  el.style.color=isTetris?'#ffff00':'#ffffff';
  el.style.top='40%';el.style.left='50%';el.style.transform='translate(-50%,-50%) scale(1)';
  el.style.fontSize=isTetris?'32px':'24px';
  setTimeout(function(){
    el.style.opacity=0;el.style.top='30%';
    el.style.transform='translate(-50%,-50%) scale(1.3)';
  },400);
}

/* ═══════════ GAME LOOP ═══════════ */
var lastTime=0;
function loop(ts){
  if(!lastTime)lastTime=ts;
  var dt=ts-lastTime;lastTime=ts;

  // Line clear animation
  if(clearAnim>0){
    clearAnim-=dt;
    if(clearAnim<=0)collapseLines();
    render();requestAnimationFrame(loop);
    return;
  }

  // Game logic
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

  // Game over (FIXED: only fire once)
  if(gameOver&&!gameOverSent){
    gameOverSent=true;
    document.getElementById('overlay').style.display='flex';
    document.getElementById('fs').textContent='Score: '+score+'  |  Level: '+level;
    try{
      window.parent.postMessage({type:'gameOver',score:score},'*');
    }catch(e){}
  }

  if(keys['ArrowLeft']){mL();keys['ArrowLeft']=false}
  if(keys['ArrowRight']){mR();keys['ArrowRight']=false}
  render();
  if(!gameOver) requestAnimationFrame(loop);
  else{render();}  // final render
}

document.addEventListener('keydown',function(e){
  ensureAudio();
  if(gameOver)return;
  keys[e.key]=true;
  if(e.key==='ArrowUp'){rot();e.preventDefault()}
  if(e.key===' '){hD();e.preventDefault()}
  if(e.key==='ArrowDown'){softDrop=true;e.preventDefault()}
  if(e.key==='ArrowLeft'||e.key==='ArrowRight')e.preventDefault();
});
document.addEventListener('keyup',function(e){keys[e.key]=false;if(e.key==='ArrowDown')softDrop=false});

function restart(){
  score=0;lines=0;level=1;gameOver=false;gameOverSent=false;
  dropInterval=1000;softDrop=false;lockTimer=0;clearing=[];clearAnim=0;lastDrop=0;lastTime=0;pBag=[];
  document.getElementById('sc').textContent='0';
  document.getElementById('lv').textContent='1';
  document.getElementById('ln').textContent='0';
  document.getElementById('lv').style.color='#fff';
  document.getElementById('overlay').style.display='none';
  initGrid();nx=null;spawn();requestAnimationFrame(loop);
}
window.restart=restart;

initGrid();spawn();requestAnimationFrame(loop);
</script>
</body>
</html>`;
