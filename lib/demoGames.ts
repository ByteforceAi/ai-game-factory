export interface DemoGame {
  id: string;
  title: string;
  description: string;
  prompt: string;
  icon: string;
  accentColor: string;
  html: string;
}

const SPACE_SHOOTER_HTML = `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<title>우주 슈터</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{background:#0a0a1a;display:flex;justify-content:center;align-items:center;height:100vh;overflow:hidden}
canvas{border:1px solid #222;border-radius:4px}
</style>
</head>
<body>
<canvas id="gameCanvas" width="600" height="400"></canvas>
<script>
var canvas=document.getElementById('gameCanvas'),ctx=canvas.getContext('2d');
var score=0,gameOver=false,keys={};
var state='start',wave=1,waveEnemies=0,waveTimer=0,spawnQueue=0,spawnTick=0;
var combo=0,comboTimer=0,lastKillTime=0,shakeAmt=0,tick=0;
var ship={x:300,y:355,speed:4,shield:false,shieldTime:0,multishot:false,multiTime:0,speedBoost:false,speedTime:0};
var bullets=[],enemies=[],particles=[],powerups=[],stars=[[],[],[]],floatTexts=[];
var audioCtx=null;
function initAudio(){if(!audioCtx)audioCtx=new(window.AudioContext||window.webkitAudioContext)()}
function playSound(type){
  if(!audioCtx)return;try{
  var o=audioCtx.createOscillator(),g=audioCtx.createGain();
  o.connect(g);g.connect(audioCtx.destination);var t=audioCtx.currentTime;
  if(type==='shoot'){o.type='square';o.frequency.setValueAtTime(880,t);o.frequency.linearRampToValueAtTime(220,t+0.08);g.gain.setValueAtTime(0.12,t);g.gain.linearRampToValueAtTime(0,t+0.08);o.start(t);o.stop(t+0.08)}
  else if(type==='explode'){o.type='sawtooth';o.frequency.setValueAtTime(200,t);o.frequency.linearRampToValueAtTime(50,t+0.15);g.gain.setValueAtTime(0.18,t);g.gain.linearRampToValueAtTime(0,t+0.15);o.start(t);o.stop(t+0.15)}
  else if(type==='powerup'){o.type='triangle';o.frequency.setValueAtTime(400,t);o.frequency.linearRampToValueAtTime(1200,t+0.2);g.gain.setValueAtTime(0.15,t);g.gain.linearRampToValueAtTime(0,t+0.2);o.start(t);o.stop(t+0.2)}
  else if(type==='die'){o.type='sawtooth';o.frequency.setValueAtTime(400,t);o.frequency.linearRampToValueAtTime(60,t+0.4);g.gain.setValueAtTime(0.25,t);g.gain.linearRampToValueAtTime(0,t+0.4);o.start(t);o.stop(t+0.4)}
  else if(type==='wave'){o.type='triangle';o.frequency.setValueAtTime(600,t);o.frequency.linearRampToValueAtTime(900,t+0.15);o.frequency.linearRampToValueAtTime(1200,t+0.3);g.gain.setValueAtTime(0.12,t);g.gain.linearRampToValueAtTime(0,t+0.3);o.start(t);o.stop(t+0.3)}
  }catch(e){}
}
// Stars init
for(var layer=0;layer<3;layer++){var count=[50,30,18][layer];for(var i=0;i<count;i++)stars[layer].push({x:Math.random()*600,y:Math.random()*400,speed:[0.3,0.8,1.8][layer],brightness:Math.random()*0.3+[0.15,0.35,0.65][layer]})}

// Pixel sprite helper
function drawPixelSprite(data,px,py,scale){
  for(var r=0;r<data.length;r++)for(var c=0;c<data[r].length;c++){if(data[r][c]){ctx.fillStyle=data[r][c];ctx.fillRect(px+c*scale,py+r*scale,scale,scale)}}
}
var shipSprite=[
  [0,0,0,0,0,0,'#4af',0,0,0,0,0,0],
  [0,0,0,0,0,'#4af','#8cf','#4af',0,0,0,0,0],
  [0,0,0,0,'#4af','#8cf','#fff','#8cf','#4af',0,0,0,0],
  [0,0,0,'#4af','#6bf','#8cf','#fff','#8cf','#6bf','#4af',0,0,0],
  [0,0,'#4af','#6bf','#8cf','#6bf','#8cf','#6bf','#8cf','#6bf','#4af',0,0],
  [0,'#4af','#6bf','#8cf','#6bf','#4af','#6bf','#4af','#6bf','#8cf','#6bf','#4af',0],
  ['#38e','#4af','#6bf','#4af','#38e','#28c','#4af','#28c','#38e','#4af','#6bf','#4af','#38e'],
  ['#28c','#38e','#4af','#28c',0,0,'#38e',0,0,'#28c','#4af','#38e','#28c'],
  [0,'#28c','#38e',0,0,0,0,0,0,0,'#38e','#28c',0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,'#f80',0,0,0,0,0,0,0,0,0,'#f80',0],
  [0,'#fa0','#f80',0,0,0,'#f80',0,0,0,'#f80','#fa0',0]
];
var enemyA=[[0,0,'#f55','#f55','#f55',0,0],[0,'#f55','#f88','#faa','#f88','#f55',0],['#c33','#f55','#fff','#f88','#fff','#f55','#c33'],['#c33','#f55','#f88','#f55','#f88','#f55','#c33'],[0,'#c33','#f55','#c33','#f55','#c33',0],[0,0,'#c33',0,'#c33',0,0]];
var enemyB=[[0,0,'#a5f','#a5f',0,0],[0,'#a5f','#c8f','#c8f','#a5f',0],['#a5f','#c8f','#fff','#fff','#c8f','#a5f'],['#82c','#a5f','#c8f','#c8f','#a5f','#82c'],['#82c','#a5f',0,0,'#a5f','#82c'],[0,'#82c','#a5f','#a5f','#82c',0]];
var enemyC=[[0,'#4c6','#4c6','#4c6','#4c6','#4c6',0],['#4c6','#6e8','#8fa','#8fa','#8fa','#6e8','#4c6'],['#4c6','#8fa','#fff','#8fa','#fff','#8fa','#4c6'],['#4c6','#6e8','#8fa','#6e8','#8fa','#6e8','#4c6'],['#3a5','#4c6','#6e8','#4c6','#6e8','#4c6','#3a5'],['#3a5','#4c6','#3a5','#3a5','#3a5','#4c6','#3a5'],[0,'#3a5','#3a5',0,'#3a5','#3a5',0]];

function burst(x,y,color,count){for(var i=0;i<(count||12);i++)particles.push({x:x,y:y,vx:(Math.random()-0.5)*6,vy:(Math.random()-0.5)*6,life:25+Math.random()*10,maxLife:35,color:color,size:2+Math.random()*2})}
function addFloat(x,y,text,color){floatTexts.push({x:x,y:y,text:text,color:color||'#ff0',life:40})}

function startWave(){
  waveTimer=90;spawnQueue=wave*3+2;spawnTick=0;
  if(wave>1)playSound('wave');
}

function spawnEnemy(){
  var type=0;
  if(wave>=3&&Math.random()<0.2)type=2;
  else if(wave>=2&&Math.random()<0.35)type=1;
  var sp=enemyA,hp=1,spd=1.2+wave*0.15+Math.random()*0.8,w=7,pts=10;
  if(type===1){sp=enemyB;spd=1+wave*0.1;w=6;pts=15;hp=1}
  if(type===2){sp=enemyC;hp=3;spd=0.7+wave*0.08;w=7;pts=25}
  enemies.push({x:40+Math.random()*520,y:-20,type:type,sprite:sp,hp:hp,maxHp:hp,speed:spd,w:w,pts:pts,tick:Math.random()*100|0});
}

document.addEventListener('keydown',function(e){keys[e.key]=true;e.preventDefault();
  initAudio();
  if(state==='start'){state='playing';startWave()}
  else if(state==='gameover'&&e.key===' '){score=0;gameOver=false;wave=1;combo=0;comboTimer=0;ship.x=300;ship.y=355;ship.shield=false;ship.multishot=false;ship.speedBoost=false;bullets=[];enemies=[];particles=[];powerups=[];floatTexts=[];state='playing';startWave()}
});
document.addEventListener('keyup',function(e){keys[e.key]=false});

function update(){
  tick++;
  // Stars
  for(var l=0;l<3;l++)for(var i=0;i<stars[l].length;i++){stars[l][i].y+=stars[l][i].speed;if(stars[l][i].y>400){stars[l][i].y=0;stars[l][i].x=Math.random()*600}}
  if(state!=='playing')return;
  // Ship movement
  var spd=ship.speedBoost?ship.speed+2.5:ship.speed;
  if(keys['ArrowLeft']||keys['a'])ship.x=Math.max(20,ship.x-spd);
  if(keys['ArrowRight']||keys['d'])ship.x=Math.min(580,ship.x+spd);
  if(keys['ArrowUp']||keys['w'])ship.y=Math.max(200,ship.y-spd);
  if(keys['ArrowDown']||keys['s'])ship.y=Math.min(380,ship.y+spd);
  // Shoot
  if(keys[' ']&&tick%6===0){
    playSound('shoot');
    bullets.push({x:ship.x,y:ship.y-18,speed:8});
    if(ship.multishot){bullets.push({x:ship.x-10,y:ship.y-12,speed:8,dx:-1.2});bullets.push({x:ship.x+10,y:ship.y-12,speed:8,dx:1.2})}
  }
  // Bullets
  for(var i=bullets.length-1;i>=0;i--){bullets[i].y-=bullets[i].speed;if(bullets[i].dx)bullets[i].x+=bullets[i].dx;if(bullets[i].y<-10||bullets[i].x<-10||bullets[i].x>610)bullets.splice(i,1)}
  // Wave management
  if(waveTimer>0){waveTimer--;if(waveTimer===0&&spawnQueue>0)spawnTick=0}
  if(spawnQueue>0&&waveTimer===0){spawnTick++;if(spawnTick%12===0){spawnEnemy();spawnQueue--}}
  if(spawnQueue===0&&enemies.length===0&&waveTimer===0){wave++;startWave()}
  // Enemies
  for(var ei=enemies.length-1;ei>=0;ei--){
    var e=enemies[ei];e.tick++;e.y+=e.speed;
    if(e.type===1)e.x+=Math.sin(e.tick*0.04)*2.5;
    if(e.y>420){enemies.splice(ei,1);continue}
    // Hit player?
    var dx=e.x-ship.x,dy=e.y-ship.y,dist=Math.sqrt(dx*dx+dy*dy);
    if(dist<22){
      if(ship.shield){ship.shield=false;burst(e.x,e.y,'#0f0',8);enemies.splice(ei,1);playSound('explode');continue}
      else{gameOver=true;state='gameover';shakeAmt=10;playSound('die');burst(ship.x,ship.y,'#4af',20);continue}
    }
    // Bullet collision
    for(var bi=bullets.length-1;bi>=0;bi--){
      var b=bullets[bi];if(Math.abs(b.x-e.x)<14&&Math.abs(b.y-e.y)<14){
        e.hp--;bullets.splice(bi,1);
        if(e.hp<=0){
          var now=tick;if(now-lastKillTime<90){combo++}else{combo=1}lastKillTime=now;comboTimer=90;
          var pts=e.pts*combo;score+=pts;
          addFloat(e.x,e.y-10,'+'+ pts+(combo>1?' x'+combo:''),combo>2?'#f80':combo>1?'#ff0':'#fff');
          burst(e.x,e.y,e.type===0?'#f55':e.type===1?'#a5f':'#4c6',15);
          playSound('explode');shakeAmt=Math.min(shakeAmt+3,8);
          // Drop powerup 10%
          if(Math.random()<0.1){var types=['speed','shield','multi'];powerups.push({x:e.x,y:e.y,type:types[Math.random()*3|0],speed:1.2})}
          enemies.splice(ei,1);
        }else{burst(e.x,e.y,'#fff',4)}
        break;
      }
    }
  }
  // Powerups
  for(var pi=powerups.length-1;pi>=0;pi--){
    var p=powerups[pi];p.y+=p.speed;
    if(p.y>410){powerups.splice(pi,1);continue}
    if(Math.abs(p.x-ship.x)<20&&Math.abs(p.y-ship.y)<20){
      playSound('powerup');
      if(p.type==='speed'){ship.speedBoost=true;ship.speedTime=480}
      if(p.type==='shield'){ship.shield=true;ship.shieldTime=600}
      if(p.type==='multi'){ship.multishot=true;ship.multiTime=600}
      addFloat(p.x,p.y-15,p.type==='speed'?'SPEED!':p.type==='shield'?'SHIELD!':'MULTI!','#0ff');
      powerups.splice(pi,1);
    }
  }
  // Powerup timers
  if(ship.speedBoost){ship.speedTime--;if(ship.speedTime<=0)ship.speedBoost=false}
  if(ship.shield){ship.shieldTime--;if(ship.shieldTime<=0)ship.shield=false}
  if(ship.multishot){ship.multiTime--;if(ship.multiTime<=0)ship.multishot=false}
  // Combo decay
  if(comboTimer>0)comboTimer--;
  if(comboTimer===0)combo=0;
  // Particles
  for(var i=particles.length-1;i>=0;i--){var p=particles[i];p.x+=p.vx;p.y+=p.vy;p.vx*=0.97;p.vy*=0.97;p.life--;if(p.life<=0)particles.splice(i,1)}
  // Float texts
  for(var i=floatTexts.length-1;i>=0;i--){floatTexts[i].y-=1;floatTexts[i].life--;if(floatTexts[i].life<=0)floatTexts.splice(i,1)}
  // Shake decay
  shakeAmt*=0.88;if(shakeAmt<0.3)shakeAmt=0;
}

function draw(){
  ctx.fillStyle='#0a0a1a';ctx.fillRect(0,0,600,400);
  // Stars
  for(var l=0;l<3;l++)for(var i=0;i<stars[l].length;i++){var s=stars[l][i];ctx.globalAlpha=s.brightness;ctx.fillStyle='#fff';ctx.fillRect(s.x|0,s.y|0,l===2?2:1,l===2?2:1)}
  ctx.globalAlpha=1;
  ctx.save();
  if(shakeAmt>0)ctx.translate((Math.random()-0.5)*shakeAmt*2,(Math.random()-0.5)*shakeAmt*2);

  if(state==='start'){
    ctx.fillStyle='#fff';ctx.font='bold 36px monospace';ctx.textAlign='center';
    ctx.fillText('우주 슈터',300,140);
    ctx.font='14px monospace';ctx.fillStyle='#89b4fa';
    ctx.fillText('방향키: 이동  |  스페이스: 발사',300,180);
    ctx.globalAlpha=0.5+Math.sin(tick*0.06)*0.5;
    ctx.font='16px monospace';ctx.fillStyle='#fff';
    ctx.fillText('SPACE 를 눌러 시작',300,240);
    ctx.globalAlpha=1;ctx.textAlign='left';
    // Draw ship preview
    drawPixelSprite(shipSprite,300-13*1.5,280,3);
    ctx.restore();return;
  }

  // Bullets
  ctx.fillStyle='#fbbf24';
  for(var i=0;i<bullets.length;i++){var b=bullets[i];ctx.fillRect(b.x-1,b.y-4,3,8);ctx.fillStyle='#fff';ctx.fillRect(b.x,b.y-2,1,4);ctx.fillStyle='#fbbf24'}
  // Enemies
  for(var i=0;i<enemies.length;i++){var e=enemies[i];drawPixelSprite(e.sprite,e.x-e.w*2,e.y-e.sprite.length*2,4);
    if(e.maxHp>1){var ratio=e.hp/e.maxHp;ctx.fillStyle='rgba(0,0,0,0.5)';ctx.fillRect(e.x-12,e.y+e.sprite.length*2+2,24,3);ctx.fillStyle=ratio>0.5?'#4c6':'#f80';ctx.fillRect(e.x-12,e.y+e.sprite.length*2+2,24*ratio,3)}
  }
  // Powerups
  for(var i=0;i<powerups.length;i++){var p=powerups[i];
    var colors={speed:'#4af',shield:'#4c6',multi:'#f80'};var labels={speed:'S',shield:'D',multi:'M'};
    ctx.fillStyle=colors[p.type];ctx.beginPath();ctx.arc(p.x,p.y,8,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#fff';ctx.font='bold 10px monospace';ctx.textAlign='center';ctx.fillText(labels[p.type],p.x,p.y+3.5);ctx.textAlign='left';
  }
  // Ship
  if(state==='playing'){
    drawPixelSprite(shipSprite,ship.x-13*1.5,ship.y-12*1.5,3);
    // Engine glow
    if(tick%4<2){ctx.fillStyle='#f80';ctx.fillRect(ship.x-3,ship.y+18,6,4+Math.random()*4);ctx.fillStyle='#ff0';ctx.fillRect(ship.x-1,ship.y+20,2,3+Math.random()*3)}
    if(ship.shield){ctx.strokeStyle='rgba(100,255,150,0.5)';ctx.lineWidth=2;ctx.beginPath();ctx.arc(ship.x,ship.y,26+Math.sin(tick*0.1)*2,0,Math.PI*2);ctx.stroke()}
  }
  // Particles
  for(var i=0;i<particles.length;i++){var p=particles[i];ctx.globalAlpha=p.life/p.maxLife;ctx.fillStyle=p.color;ctx.fillRect(p.x-p.size/2,p.y-p.size/2,p.size,p.size)}ctx.globalAlpha=1;
  // Float texts
  for(var i=0;i<floatTexts.length;i++){var f=floatTexts[i];ctx.globalAlpha=f.life/40;ctx.fillStyle=f.color;ctx.font='bold 14px monospace';ctx.textAlign='center';ctx.fillText(f.text,f.x,f.y);ctx.textAlign='left'}ctx.globalAlpha=1;
  // HUD
  ctx.fillStyle='#fff';ctx.font='bold 14px monospace';ctx.fillText('점수: '+score,12,22);
  ctx.fillStyle='#89b4fa';ctx.fillText('WAVE '+wave,12,40);
  if(combo>1){ctx.fillStyle='#f80';ctx.font='bold 16px monospace';ctx.fillText('COMBO x'+combo,520,22)}
  // Active powerup icons
  var iconX=560;
  if(ship.speedBoost){ctx.fillStyle='#4af';ctx.beginPath();ctx.arc(iconX,38,5,0,Math.PI*2);ctx.fill();iconX-=14}
  if(ship.shield){ctx.fillStyle='#4c6';ctx.beginPath();ctx.arc(iconX,38,5,0,Math.PI*2);ctx.fill();iconX-=14}
  if(ship.multishot){ctx.fillStyle='#f80';ctx.beginPath();ctx.arc(iconX,38,5,0,Math.PI*2);ctx.fill()}
  // Wave announcement
  if(waveTimer>60){ctx.globalAlpha=(waveTimer-60)/30;ctx.fillStyle='#fff';ctx.font='bold 28px monospace';ctx.textAlign='center';ctx.fillText('WAVE '+wave,300,200);ctx.textAlign='left';ctx.globalAlpha=1}

  if(state==='gameover'){
    ctx.fillStyle='rgba(0,0,0,0.75)';ctx.fillRect(0,0,600,400);
    ctx.fillStyle='#fff';ctx.font='bold 32px monospace';ctx.textAlign='center';ctx.fillText('게임 오버!',300,160);
    ctx.font='20px monospace';ctx.fillText('최종 점수: '+score,300,200);
    ctx.fillStyle='#89b4fa';ctx.font='14px monospace';ctx.fillText('도달 웨이브: '+wave,300,230);
    ctx.globalAlpha=0.5+Math.sin(tick*0.06)*0.5;ctx.fillStyle='#fff';ctx.font='16px monospace';ctx.fillText('SPACE 를 눌러 재시작',300,280);
    ctx.globalAlpha=1;ctx.textAlign='left';
  }
  ctx.restore();
}

function loop(){update();draw();requestAnimationFrame(loop)}
loop();
</script>
</body>
</html>`;

const SNAKE_HTML = `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<title>스네이크</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{background:#0a1a0a;display:flex;justify-content:center;align-items:center;height:100vh;overflow:hidden}
canvas{border:2px solid #1a3a1a;border-radius:4px}
</style>
</head>
<body>
<canvas id="gameCanvas" width="600" height="400"></canvas>
<script>
var canvas=document.getElementById('gameCanvas'),ctx=canvas.getContext('2d');
var CELL=20,COLS=30,ROWS=20;
var score=0,gameOver=false,keys={};
var state='start',level=1,foodEaten=0,speed=130,tick=0,gameTick=0;
var snake=[],dir={x:1,y:0},nextDir={x:1,y:0};
var food=null,foodType='normal',foodBob=0;
var walls=[],particles=[],floatTexts=[];
var audioCtx=null;
function initAudio(){if(!audioCtx)audioCtx=new(window.AudioContext||window.webkitAudioContext)()}
function playSound(type){
  if(!audioCtx)return;try{
  var o=audioCtx.createOscillator(),g=audioCtx.createGain();o.connect(g);g.connect(audioCtx.destination);var t=audioCtx.currentTime;
  if(type==='eat'){o.type='triangle';o.frequency.setValueAtTime(600,t);o.frequency.linearRampToValueAtTime(900,t+0.06);g.gain.setValueAtTime(0.15,t);g.gain.linearRampToValueAtTime(0,t+0.06);o.start(t);o.stop(t+0.06)}
  else if(type==='gold'){o.type='triangle';o.frequency.setValueAtTime(600,t);o.frequency.linearRampToValueAtTime(1400,t+0.12);g.gain.setValueAtTime(0.18,t);g.gain.linearRampToValueAtTime(0,t+0.12);o.start(t);o.stop(t+0.12)}
  else if(type==='die'){o.type='sawtooth';o.frequency.setValueAtTime(400,t);o.frequency.linearRampToValueAtTime(60,t+0.35);g.gain.setValueAtTime(0.22,t);g.gain.linearRampToValueAtTime(0,t+0.35);o.start(t);o.stop(t+0.35)}
  else if(type==='levelup'){o.type='triangle';o.frequency.setValueAtTime(500,t);o.frequency.setValueAtTime(700,t+0.08);o.frequency.setValueAtTime(900,t+0.16);g.gain.setValueAtTime(0.15,t);g.gain.linearRampToValueAtTime(0,t+0.25);o.start(t);o.stop(t+0.25)}
  }catch(e){}
}

function initGame(){
  snake=[{x:15,y:10},{x:14,y:10},{x:13,y:10}];
  dir={x:1,y:0};nextDir={x:1,y:0};
  score=0;gameOver=false;level=1;foodEaten=0;speed=130;
  walls=[];particles=[];floatTexts=[];
  placeFood();
}

function isFree(x,y){
  if(x<0||x>=COLS||y<0||y>=ROWS)return false;
  if(snake.some(function(s){return s.x===x&&s.y===y}))return false;
  if(walls.some(function(w){return w.x===x&&w.y===y}))return false;
  return true;
}

function placeFood(){
  var r=Math.random();
  foodType=r<0.12?'gold':r<0.22?'speed':'normal';
  var tries=0;
  do{food={x:Math.floor(Math.random()*COLS),y:Math.floor(Math.random()*ROWS)};tries++}
  while(!isFree(food.x,food.y)&&tries<200);
}

function buildWalls(){
  walls=[];
  if(level<3)return;
  var patterns=[
    // Level 3: center blocks
    [{x:13,y:8},{x:14,y:8},{x:15,y:8},{x:16,y:8},{x:13,y:11},{x:14,y:11},{x:15,y:11},{x:16,y:11}],
    // Level 4+: L shapes
    [{x:7,y:5},{x:8,y:5},{x:9,y:5},{x:7,y:6},{x:7,y:7},{x:20,y:12},{x:21,y:12},{x:22,y:12},{x:22,y:13},{x:22,y:14},{x:13,y:9},{x:14,y:9},{x:15,y:9},{x:16,y:9}],
    // Level 5+: cross
    [{x:14,y:4},{x:15,y:4},{x:14,y:5},{x:15,y:5},{x:14,y:14},{x:15,y:14},{x:14,y:15},{x:15,y:15},{x:7,y:9},{x:7,y:10},{x:8,y:9},{x:8,y:10},{x:21,y:9},{x:21,y:10},{x:22,y:9},{x:22,y:10}]
  ];
  var idx=Math.min(level-3,patterns.length-1);
  walls=patterns[idx].slice();
}

function burst(x,y,color,count){for(var i=0;i<(count||10);i++)particles.push({x:x*CELL+CELL/2,y:y*CELL+CELL/2,vx:(Math.random()-0.5)*5,vy:(Math.random()-0.5)*5,life:20+Math.random()*10,maxLife:30,color:color,size:3+Math.random()*2})}
function addFloat(x,y,text,color){floatTexts.push({x:x*CELL+CELL/2,y:y*CELL,text:text,color:color,life:35})}

document.addEventListener('keydown',function(e){
  keys[e.key]=true;e.preventDefault();initAudio();
  if(state==='start'){state='playing';initGame()}
  else if(state==='gameover'&&e.key===' '){state='playing';initGame()}
  else if(state==='playing'){
    if((e.key==='ArrowUp'||e.key==='w')&&dir.y===0)nextDir={x:0,y:-1};
    if((e.key==='ArrowDown'||e.key==='s')&&dir.y===0)nextDir={x:0,y:1};
    if((e.key==='ArrowLeft'||e.key==='a')&&dir.x===0)nextDir={x:-1,y:0};
    if((e.key==='ArrowRight'||e.key==='d')&&dir.x===0)nextDir={x:1,y:0};
  }
});
document.addEventListener('keyup',function(e){keys[e.key]=false});

var lastMove=0;
function update(now){
  tick++;
  // Particles
  for(var i=particles.length-1;i>=0;i--){var p=particles[i];p.x+=p.vx;p.y+=p.vy;p.vy+=0.08;p.life--;if(p.life<=0)particles.splice(i,1)}
  for(var i=floatTexts.length-1;i>=0;i--){floatTexts[i].y-=0.8;floatTexts[i].life--;if(floatTexts[i].life<=0)floatTexts.splice(i,1)}
  foodBob=Math.sin(tick*0.08)*2;

  if(state!=='playing')return;
  if(now-lastMove<speed)return;
  lastMove=now;gameTick++;

  dir=nextDir;
  var head={x:snake[0].x+dir.x,y:snake[0].y+dir.y};

  // Collision check
  if(head.x<0||head.x>=COLS||head.y<0||head.y>=ROWS||snake.some(function(s){return s.x===head.x&&s.y===head.y})||walls.some(function(w){return w.x===head.x&&w.y===head.y})){
    gameOver=true;state='gameover';playSound('die');burst(snake[0].x,snake[0].y,'#f44',20);return;
  }

  snake.unshift(head);

  if(head.x===food.x&&head.y===food.y){
    var pts=foodType==='gold'?30:10;
    score+=pts;foodEaten++;
    addFloat(food.x,food.y,'+'+pts,foodType==='gold'?'#ffd700':foodType==='speed'?'#4af':'#fff');
    burst(food.x,food.y,foodType==='gold'?'#ffd700':foodType==='speed'?'#4af':'#f44',12);
    playSound(foodType==='gold'?'gold':'eat');

    // Level up every 5 food
    if(foodEaten%5===0){level++;speed=Math.max(55,speed-10);playSound('levelup');buildWalls();addFloat(15,10,'LEVEL '+level+'!','#a6e3a1')}
    placeFood();
  }else{snake.pop()}
}

function draw(){
  ctx.fillStyle='#0a1a0a';ctx.fillRect(0,0,600,400);
  // Checkerboard
  for(var i=0;i<COLS;i++)for(var j=0;j<ROWS;j++){ctx.fillStyle=(i+j)%2===0?'rgba(166,227,161,0.02)':'rgba(166,227,161,0.04)';ctx.fillRect(i*CELL,j*CELL,CELL,CELL)}
  // Border glow
  ctx.strokeStyle='rgba(166,227,161,0.15)';ctx.lineWidth=1;ctx.strokeRect(0.5,0.5,599,399);

  // Walls
  for(var i=0;i<walls.length;i++){var w=walls[i];
    ctx.fillStyle='#3a2a1a';ctx.fillRect(w.x*CELL,w.y*CELL,CELL,CELL);
    ctx.fillStyle='#5a3a2a';ctx.fillRect(w.x*CELL+1,w.y*CELL+1,CELL/2-1,CELL/2-1);
    ctx.fillRect(w.x*CELL+CELL/2,w.y*CELL+CELL/2,CELL/2-1,CELL/2-1);
    ctx.fillStyle='#4a3020';ctx.fillRect(w.x*CELL+CELL/2,w.y*CELL+1,CELL/2-1,CELL/2-1);
    ctx.fillRect(w.x*CELL+1,w.y*CELL+CELL/2,CELL/2-1,CELL/2-1);
  }

  // Food
  if(food){
    var fx=food.x*CELL+CELL/2,fy=food.y*CELL+CELL/2+foodBob;
    if(foodType==='gold'){
      // Gold sparkles
      ctx.fillStyle='#ffd700';ctx.beginPath();ctx.arc(fx,fy,7,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(fx-2,fy-2,2,0,Math.PI*2);ctx.fill();
      // Sparkle particles
      for(var s=0;s<3;s++){var angle=tick*0.05+s*2.1;var sr=10+Math.sin(tick*0.1+s)*3;ctx.globalAlpha=0.5+Math.sin(tick*0.1+s)*0.3;ctx.fillStyle='#ffd700';ctx.fillRect(fx+Math.cos(angle)*sr-1,fy+Math.sin(angle)*sr-1,2,2)}ctx.globalAlpha=1;
    }else if(foodType==='speed'){
      ctx.fillStyle='#4af';ctx.beginPath();ctx.arc(fx,fy,7,0,Math.PI*2);ctx.fill();
      // Lightning bolt
      ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(fx-2,fy-5);ctx.lineTo(fx+1,fy-1);ctx.lineTo(fx-1,fy+1);ctx.lineTo(fx+2,fy+5);ctx.stroke();
    }else{
      // Apple
      ctx.fillStyle='#f44';ctx.beginPath();ctx.arc(fx,fy,7,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#d33';ctx.beginPath();ctx.arc(fx+2,fy+2,4,0,Math.PI*2);ctx.fill();
      // Leaf
      ctx.fillStyle='#4a2';ctx.fillRect(fx-1,fy-9,3,4);ctx.fillStyle='#5b3';ctx.fillRect(fx+1,fy-8,4,2);
    }
  }

  // Snake
  for(var i=snake.length-1;i>=0;i--){
    var s=snake[i];
    var alpha=1-i/snake.length*0.45;
    var r=Math.floor(100+66*alpha),g_=Math.floor(180+47*alpha),b=Math.floor(100+61*alpha);
    ctx.fillStyle='rgb('+r+','+g_+','+b+')';
    if(i===0){
      // Head: rounded + eyes
      ctx.beginPath();ctx.roundRect(s.x*CELL+1,s.y*CELL+1,CELL-2,CELL-2,6);ctx.fill();
      // Eyes based on direction
      ctx.fillStyle='#fff';
      var ex1=s.x*CELL+6,ey1=s.y*CELL+6,ex2=s.x*CELL+12,ey2=s.y*CELL+6;
      if(dir.x===0&&dir.y===-1){ex1=s.x*CELL+5;ey1=s.y*CELL+4;ex2=s.x*CELL+13;ey2=s.y*CELL+4}
      if(dir.x===0&&dir.y===1){ey1=s.y*CELL+13;ey2=s.y*CELL+13}
      if(dir.x===-1){ex1=s.x*CELL+3;ex2=s.x*CELL+3;ey2=s.y*CELL+12}
      if(dir.x===1){ex1=s.x*CELL+15;ex2=s.x*CELL+15;ey2=s.y*CELL+12}
      ctx.beginPath();ctx.arc(ex1,ey1,2.5,0,Math.PI*2);ctx.fill();
      ctx.beginPath();ctx.arc(ex2,ey2,2.5,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#111';
      ctx.beginPath();ctx.arc(ex1+dir.x,ey1+dir.y,1,0,Math.PI*2);ctx.fill();
      ctx.beginPath();ctx.arc(ex2+dir.x,ey2+dir.y,1,0,Math.PI*2);ctx.fill();
    }else{
      // Body
      ctx.beginPath();ctx.roundRect(s.x*CELL+2,s.y*CELL+2,CELL-4,CELL-4,4);ctx.fill();
      // Highlight
      ctx.fillStyle='rgba(255,255,255,0.1)';ctx.fillRect(s.x*CELL+3,s.y*CELL+2,CELL-6,3);
    }
  }

  // Particles
  for(var i=0;i<particles.length;i++){var p=particles[i];ctx.globalAlpha=p.life/p.maxLife;ctx.fillStyle=p.color;ctx.fillRect(p.x-p.size/2,p.y-p.size/2,p.size,p.size)}ctx.globalAlpha=1;
  // Float texts
  for(var i=0;i<floatTexts.length;i++){var f=floatTexts[i];ctx.globalAlpha=f.life/35;ctx.fillStyle=f.color;ctx.font='bold 14px monospace';ctx.textAlign='center';ctx.fillText(f.text,f.x,f.y);ctx.textAlign='left'}ctx.globalAlpha=1;

  // HUD
  ctx.fillStyle='#a6e3a1';ctx.font='bold 14px monospace';ctx.fillText('점수: '+score,12,22);
  ctx.fillStyle='#6b8';ctx.fillText('레벨: '+level,530,22);

  // Start screen
  if(state==='start'){
    ctx.fillStyle='rgba(0,0,0,0.6)';ctx.fillRect(0,0,600,400);
    ctx.fillStyle='#a6e3a1';ctx.font='bold 36px monospace';ctx.textAlign='center';ctx.fillText('스네이크',300,140);
    ctx.font='14px monospace';ctx.fillStyle='#6b8';ctx.fillText('방향키: 이동  |  사과를 먹어 성장하세요',300,180);
    ctx.globalAlpha=0.5+Math.sin(tick*0.06)*0.5;ctx.fillStyle='#fff';ctx.font='16px monospace';ctx.fillText('SPACE 를 눌러 시작',300,240);
    ctx.globalAlpha=1;ctx.textAlign='left';
  }

  // Game over
  if(state==='gameover'){
    ctx.fillStyle='rgba(0,0,0,0.75)';ctx.fillRect(0,0,600,400);
    ctx.fillStyle='#fff';ctx.font='bold 32px monospace';ctx.textAlign='center';ctx.fillText('게임 오버!',300,150);
    ctx.font='20px monospace';ctx.fillText('최종 점수: '+score,300,190);
    ctx.fillStyle='#a6e3a1';ctx.font='14px monospace';ctx.fillText('도달 레벨: '+level+'  |  길이: '+snake.length,300,220);
    ctx.globalAlpha=0.5+Math.sin(tick*0.06)*0.5;ctx.fillStyle='#fff';ctx.font='16px monospace';ctx.fillText('SPACE 를 눌러 재시작',300,270);
    ctx.globalAlpha=1;ctx.textAlign='left';
  }
}

function loop(now){update(now||0);draw();requestAnimationFrame(loop)}
loop();
</script>
</body>
</html>`;

const BRICK_BREAKER_HTML = `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<title>벽돌깨기</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{background:#1a0f0a;display:flex;justify-content:center;align-items:center;height:100vh;overflow:hidden}
canvas{border:2px solid #2a1a0f;border-radius:4px}
</style>
</head>
<body>
<canvas id="gameCanvas" width="600" height="400"></canvas>
<script>
var canvas=document.getElementById('gameCanvas'),ctx=canvas.getContext('2d');
var score=0,gameOver=false,keys={};
var state='start',level=1,lives=3,tick=0,combo=0;
var paddle={x:260,y:370,w:80,h:10,speed:6};
var balls=[],bricks=[],particles=[],powerups=[],floatTexts=[],trail=[];
var bgOffset=0;
var audioCtx=null;
function initAudio(){if(!audioCtx)audioCtx=new(window.AudioContext||window.webkitAudioContext)()}
function playSound(type){
  if(!audioCtx)return;try{
  var o=audioCtx.createOscillator(),g=audioCtx.createGain();o.connect(g);g.connect(audioCtx.destination);var t=audioCtx.currentTime;
  if(type==='bounce'){o.type='square';o.frequency.setValueAtTime(220,t);g.gain.setValueAtTime(0.08,t);g.gain.linearRampToValueAtTime(0,t+0.04);o.start(t);o.stop(t+0.04)}
  else if(type==='paddle'){o.type='square';o.frequency.setValueAtTime(440,t);g.gain.setValueAtTime(0.1,t);g.gain.linearRampToValueAtTime(0,t+0.05);o.start(t);o.stop(t+0.05)}
  else if(type==='break'){o.type='triangle';o.frequency.setValueAtTime(800,t);o.frequency.linearRampToValueAtTime(200,t+0.06);g.gain.setValueAtTime(0.12,t);g.gain.linearRampToValueAtTime(0,t+0.06);o.start(t);o.stop(t+0.06)}
  else if(type==='powerup'){o.type='triangle';o.frequency.setValueAtTime(400,t);o.frequency.linearRampToValueAtTime(1200,t+0.15);g.gain.setValueAtTime(0.15,t);g.gain.linearRampToValueAtTime(0,t+0.15);o.start(t);o.stop(t+0.15)}
  else if(type==='die'){o.type='sawtooth';o.frequency.setValueAtTime(500,t);o.frequency.linearRampToValueAtTime(80,t+0.25);g.gain.setValueAtTime(0.2,t);g.gain.linearRampToValueAtTime(0,t+0.25);o.start(t);o.stop(t+0.25)}
  else if(type==='levelup'){o.type='triangle';o.frequency.setValueAtTime(500,t);o.frequency.setValueAtTime(700,t+0.1);o.frequency.setValueAtTime(1000,t+0.2);g.gain.setValueAtTime(0.15,t);g.gain.linearRampToValueAtTime(0,t+0.3);o.start(t);o.stop(t+0.3)}
  }catch(e){}
}

var ROWS=5,COLS=10,BW=54,BH=16,BP=2,BOX=15,BOY=40;
var colors=['#f9a03f','#f7c948','#5fba7d','#5b9bd5','#a77dc2'];
var layouts=[
  // Level 1: full grid
  function(){var b=[];for(var r=0;r<ROWS;r++)for(var c=0;c<COLS;c++)b.push({r:r,c:c,hp:r<2?2:1});return b},
  // Level 2: diamond
  function(){var b=[];var cx=4.5,cy=2;for(var r=0;r<ROWS;r++)for(var c=0;c<COLS;c++){var d=Math.abs(c-cx)+Math.abs(r-cy);if(d<=3.5)b.push({r:r,c:c,hp:d<2?3:d<3?2:1})}return b},
  // Level 3: invader pattern
  function(){var b=[];var pat=[[0,0,1,0,0,0,0,1,0,0],[0,0,0,1,0,0,1,0,0,0],[0,0,1,1,1,1,1,1,0,0],[0,1,1,0,1,1,0,1,1,0],[1,1,1,1,1,1,1,1,1,1]];for(var r=0;r<5;r++)for(var c=0;c<10;c++)if(pat[r][c])b.push({r:r,c:c,hp:r<2?2:1});return b},
  // Level 4: stripes
  function(){var b=[];for(var r=0;r<ROWS;r++)for(var c=0;c<COLS;c++)if((c+r)%2===0)b.push({r:r,c:c,hp:r<1?3:2});return b},
  // Level 5: fortress
  function(){var b=[];for(var r=0;r<ROWS;r++)for(var c=0;c<COLS;c++){if(r===0||r===ROWS-1||c===0||c===COLS-1||((c===4||c===5)&&(r===2||r===3)))b.push({r:r,c:c,hp:r===0?3:2})}return b}
];

function buildLevel(){
  bricks=[];
  var idx=(level-1)%layouts.length;
  var data=layouts[idx]();
  for(var i=0;i<data.length;i++){
    var d=data[i];
    bricks.push({x:BOX+d.c*(BW+BP),y:BOY+d.r*(BH+BP),w:BW,h:BH,hp:d.hp,maxHp:d.hp,color:colors[d.r%5]});
  }
}

function resetBall(){
  balls=[{x:paddle.x+paddle.w/2,y:paddle.y-8,r:5,dx:2.5*(Math.random()>0.5?1:-1),dy:-3.5,fire:false,fireTime:0}];
  combo=0;trail=[];
}

function initGame(){
  score=0;gameOver=false;level=1;lives=3;combo=0;
  paddle.x=260;paddle.w=80;
  particles=[];powerups=[];floatTexts=[];trail=[];
  buildLevel();resetBall();
}

function burst(x,y,color,count){for(var i=0;i<(count||10);i++)particles.push({x:x,y:y,vx:(Math.random()-0.5)*5,vy:(Math.random()-0.5)*5-1,life:20+Math.random()*10,maxLife:30,color:color,size:2+Math.random()*3})}
function addFloat(x,y,text,color){floatTexts.push({x:x,y:y,text:text,color:color||'#ff0',life:35})}

document.addEventListener('keydown',function(e){keys[e.key]=true;e.preventDefault();initAudio();
  if(state==='start'){state='playing';initGame()}
  else if(state==='gameover'&&e.key===' '){state='playing';initGame()}
});
document.addEventListener('keyup',function(e){keys[e.key]=false});
canvas.addEventListener('mousemove',function(e){if(state==='playing'){var r=canvas.getBoundingClientRect();paddle.x=Math.max(0,Math.min(600-paddle.w,(e.clientX-r.left)*(600/r.width)-paddle.w/2))}});

function update(){
  tick++;bgOffset=(bgOffset+0.3)%56;
  // Particles
  for(var i=particles.length-1;i>=0;i--){var p=particles[i];p.x+=p.vx;p.y+=p.vy;p.vy+=0.06;p.life--;if(p.life<=0)particles.splice(i,1)}
  for(var i=floatTexts.length-1;i>=0;i--){floatTexts[i].y-=0.8;floatTexts[i].life--;if(floatTexts[i].life<=0)floatTexts.splice(i,1)}

  if(state!=='playing')return;

  // Paddle
  if(keys['ArrowLeft']||keys['a'])paddle.x=Math.max(0,paddle.x-paddle.speed);
  if(keys['ArrowRight']||keys['d'])paddle.x=Math.min(600-paddle.w,paddle.x+paddle.speed);

  // Powerups
  for(var i=powerups.length-1;i>=0;i--){
    var p=powerups[i];p.y+=1.5;p.angle=(p.angle||0)+0.05;
    if(p.y>400){powerups.splice(i,1);continue}
    if(p.y+8>paddle.y&&p.x>paddle.x-8&&p.x<paddle.x+paddle.w+8){
      playSound('powerup');
      if(p.type==='wide'){paddle.w=Math.min(140,paddle.w+30);addFloat(p.x,p.y-10,'WIDE!','#5b9bd5')}
      else if(p.type==='multi'){for(var b=0;b<2;b++)balls.push({x:balls[0]?balls[0].x:300,y:balls[0]?balls[0].y:300,r:5,dx:(Math.random()-0.5)*5,dy:-3,fire:false,fireTime:0});addFloat(p.x,p.y-10,'MULTI!','#5fba7d')}
      else if(p.type==='fire'){for(var b=0;b<balls.length;b++){balls[b].fire=true;balls[b].fireTime=480}addFloat(p.x,p.y-10,'FIRE!','#f44')}
      else if(p.type==='slow'){for(var b=0;b<balls.length;b++){balls[b].dx*=0.6;balls[b].dy*=0.6}addFloat(p.x,p.y-10,'SLOW!','#f7c948')}
      powerups.splice(i,1);
    }
  }

  // Balls
  for(var bi=balls.length-1;bi>=0;bi--){
    var ball=balls[bi];
    // Trail
    if(bi===0)trail.push({x:ball.x,y:ball.y,fire:ball.fire});
    if(trail.length>12)trail.shift();

    ball.x+=ball.dx;ball.y+=ball.dy;
    if(ball.fire){ball.fireTime--;if(ball.fireTime<=0)ball.fire=false}

    // Wall bounce
    if(ball.x<ball.r){ball.x=ball.r;ball.dx=Math.abs(ball.dx);playSound('bounce')}
    if(ball.x>600-ball.r){ball.x=600-ball.r;ball.dx=-Math.abs(ball.dx);playSound('bounce')}
    if(ball.y<ball.r){ball.y=ball.r;ball.dy=Math.abs(ball.dy);playSound('bounce')}

    // Fall out
    if(ball.y>410){
      balls.splice(bi,1);
      if(balls.length===0){
        lives--;combo=0;trail=[];paddle.w=80;
        if(lives<=0){gameOver=true;state='gameover';playSound('die');burst(300,380,'#f44',20)}
        else{playSound('die');resetBall()}
      }
      continue;
    }

    // Paddle bounce
    if(ball.dy>0&&ball.y+ball.r>paddle.y&&ball.y+ball.r<paddle.y+paddle.h+4&&ball.x>paddle.x-4&&ball.x<paddle.x+paddle.w+4){
      ball.dy=-Math.abs(ball.dy);
      var offset=(ball.x-(paddle.x+paddle.w/2))/(paddle.w/2);
      ball.dx=offset*4.5;
      // Ensure minimum vertical speed
      if(Math.abs(ball.dy)<2)ball.dy=ball.dy>0?2:-2;
      combo=0;playSound('paddle');
    }

    // Brick collision
    for(var i=bricks.length-1;i>=0;i--){
      var br=bricks[i];
      if(ball.x+ball.r>br.x&&ball.x-ball.r<br.x+br.w&&ball.y+ball.r>br.y&&ball.y-ball.r<br.y+br.h){
        if(!ball.fire)ball.dy*=-1;
        br.hp--;
        if(br.hp<=0){
          combo++;var pts=10*combo;score+=pts;
          addFloat(br.x+br.w/2,br.y,'+'+pts+(combo>1?' x'+combo:''),combo>3?'#f44':combo>1?'#f80':'#fff');
          burst(br.x+br.w/2,br.y+br.h/2,br.color,10);
          playSound('break');
          // Drop powerup 12%
          if(Math.random()<0.12){var types=['wide','multi','fire','slow'];powerups.push({x:br.x+br.w/2,y:br.y,type:types[Math.random()*4|0],angle:0})}
          bricks.splice(i,1);
        }else{playSound('bounce');burst(ball.x,ball.y,'#fff',3)}
        if(!ball.fire)break;
      }
    }
  }

  // Level clear
  if(bricks.length===0&&balls.length>0){
    level++;playSound('levelup');
    addFloat(300,200,'레벨 '+level+'!','#f7c948');
    paddle.w=80;
    buildLevel();resetBall();
  }
}

function draw(){
  ctx.fillStyle='#1a0f0a';ctx.fillRect(0,0,600,400);
  // Animated bg grid
  ctx.strokeStyle='rgba(255,180,120,0.03)';ctx.lineWidth=1;
  for(var i=-56;i<660;i+=56){var off=bgOffset;ctx.beginPath();ctx.moveTo(i+off,0);ctx.lineTo(i+off-400*0.7,400);ctx.stroke();ctx.beginPath();ctx.moveTo(i-off+600,0);ctx.lineTo(i-off+600+400*0.7,400);ctx.stroke()}

  // Bricks
  for(var i=0;i<bricks.length;i++){
    var b=bricks[i];
    var alpha=0.4+0.6*(b.hp/b.maxHp);
    ctx.globalAlpha=alpha;ctx.fillStyle=b.color;
    ctx.beginPath();ctx.roundRect(b.x,b.y,b.w,b.h,3);ctx.fill();
    // 3D highlight
    ctx.fillStyle='rgba(255,255,255,0.2)';ctx.fillRect(b.x+2,b.y+1,b.w-4,3);
    // Shadow
    ctx.fillStyle='rgba(0,0,0,0.2)';ctx.fillRect(b.x+2,b.y+b.h-3,b.w-4,2);
    ctx.globalAlpha=1;
    // Cracks for damaged bricks
    if(b.hp<b.maxHp){
      ctx.strokeStyle='rgba(0,0,0,0.4)';ctx.lineWidth=1;
      ctx.beginPath();ctx.moveTo(b.x+b.w*0.3,b.y);ctx.lineTo(b.x+b.w*0.5,b.y+b.h*0.6);ctx.lineTo(b.x+b.w*0.7,b.y+b.h);ctx.stroke();
      if(b.hp===1&&b.maxHp===3){ctx.beginPath();ctx.moveTo(b.x+b.w*0.6,b.y);ctx.lineTo(b.x+b.w*0.4,b.y+b.h);ctx.stroke()}
    }
  }

  // Powerups
  for(var i=0;i<powerups.length;i++){
    var p=powerups[i];
    var pwColors={wide:'#5b9bd5',multi:'#5fba7d',fire:'#f44',slow:'#f7c948'};
    var pwLabels={wide:'W',multi:'M',fire:'F',slow:'S'};
    ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.angle||0);
    ctx.fillStyle=pwColors[p.type];ctx.fillRect(-8,-8,16,16);
    ctx.fillStyle='#fff';ctx.font='bold 10px monospace';ctx.textAlign='center';ctx.fillText(pwLabels[p.type],0,4);
    ctx.restore();ctx.textAlign='left';
  }

  // Ball trail
  for(var i=0;i<trail.length;i++){
    var t=trail[i];ctx.globalAlpha=(i/trail.length)*0.3;
    ctx.fillStyle=t.fire?'#f80':'#fff';
    ctx.beginPath();ctx.arc(t.x,t.y,3*(i/trail.length),0,Math.PI*2);ctx.fill();
  }ctx.globalAlpha=1;

  // Balls
  for(var i=0;i<balls.length;i++){
    var ball=balls[i];
    if(ball.fire){ctx.fillStyle='#f44';ctx.shadowBlur=8;ctx.shadowColor='#f80'}else{ctx.fillStyle='#fff';ctx.shadowBlur=4;ctx.shadowColor='#fff'}
    ctx.beginPath();ctx.arc(ball.x,ball.y,ball.r,0,Math.PI*2);ctx.fill();
    ctx.shadowBlur=0;
    // Highlight
    ctx.fillStyle='rgba(255,255,255,0.6)';ctx.beginPath();ctx.arc(ball.x-1.5,ball.y-1.5,2,0,Math.PI*2);ctx.fill();
  }

  // Paddle
  var grd=ctx.createLinearGradient(paddle.x,paddle.y,paddle.x,paddle.y+paddle.h);
  grd.addColorStop(0,'#fab387');grd.addColorStop(1,'#e08a60');
  ctx.fillStyle=grd;ctx.beginPath();ctx.roundRect(paddle.x,paddle.y,paddle.w,paddle.h,5);ctx.fill();
  // Paddle shine
  ctx.fillStyle='rgba(255,255,255,0.25)';ctx.fillRect(paddle.x+4,paddle.y+1,paddle.w-8,4);

  // Particles
  for(var i=0;i<particles.length;i++){var p=particles[i];ctx.globalAlpha=p.life/p.maxLife;ctx.fillStyle=p.color;ctx.fillRect(p.x-p.size/2,p.y-p.size/2,p.size,p.size)}ctx.globalAlpha=1;
  // Float texts
  for(var i=0;i<floatTexts.length;i++){var f=floatTexts[i];ctx.globalAlpha=f.life/35;ctx.fillStyle=f.color;ctx.font='bold 13px monospace';ctx.textAlign='center';ctx.fillText(f.text,f.x,f.y);ctx.textAlign='left'}ctx.globalAlpha=1;

  // HUD
  ctx.fillStyle='#fab387';ctx.font='bold 14px monospace';ctx.fillText('점수: '+score,12,22);
  ctx.fillStyle='#e08a60';ctx.textAlign='center';ctx.fillText('레벨 '+level,300,22);ctx.textAlign='left';
  // Lives as hearts
  for(var i=0;i<lives;i++){ctx.fillStyle='#f44';ctx.font='14px sans-serif';ctx.fillText('\\u2764',555+i*18,22)}
  // Combo
  if(combo>1){ctx.fillStyle='#f80';ctx.font='bold 14px monospace';ctx.fillText('COMBO x'+combo,12,396)}

  // Start screen
  if(state==='start'){
    ctx.fillStyle='rgba(0,0,0,0.6)';ctx.fillRect(0,0,600,400);
    ctx.fillStyle='#fab387';ctx.font='bold 36px monospace';ctx.textAlign='center';ctx.fillText('벽돌깨기',300,140);
    ctx.font='14px monospace';ctx.fillStyle='#e08a60';ctx.fillText('마우스/방향키: 이동  |  벽돌을 모두 깨세요',300,180);
    ctx.globalAlpha=0.5+Math.sin(tick*0.06)*0.5;ctx.fillStyle='#fff';ctx.font='16px monospace';ctx.fillText('SPACE 를 눌러 시작',300,240);
    ctx.globalAlpha=1;ctx.textAlign='left';
  }

  // Game over
  if(state==='gameover'){
    ctx.fillStyle='rgba(0,0,0,0.75)';ctx.fillRect(0,0,600,400);
    ctx.fillStyle='#fff';ctx.font='bold 32px monospace';ctx.textAlign='center';ctx.fillText('게임 오버!',300,155);
    ctx.font='20px monospace';ctx.fillText('최종 점수: '+score,300,195);
    ctx.fillStyle='#fab387';ctx.font='14px monospace';ctx.fillText('도달 레벨: '+level,300,225);
    ctx.globalAlpha=0.5+Math.sin(tick*0.06)*0.5;ctx.fillStyle='#fff';ctx.font='16px monospace';ctx.fillText('SPACE 를 눌러 재시작',300,275);
    ctx.globalAlpha=1;ctx.textAlign='left';
  }
}

function loop(){update();draw();requestAnimationFrame(loop)}
loop();
</script>
</body>
</html>`;

export const DEMO_GAMES: DemoGame[] = [
  {
    id: 'space-shooter',
    title: '우주 슈터',
    description: '웨이브 시스템, 파워업, 콤보 점수가 있는 아케이드 슈팅!',
    prompt: '픽셀아트 우주선, 3종 적기, 파워업, 웨이브 시스템, 사운드가 있는 슈팅 게임',
    icon: '🚀',
    accentColor: '#007AFF',
    html: SPACE_SHOOTER_HTML,
  },
  {
    id: 'snake',
    title: '스네이크',
    description: '레벨업, 다양한 음식, 장애물이 있는 진화형 스네이크!',
    prompt: '레벨 시스템, 황금사과, 장애물, 파티클 이펙트가 있는 스네이크 게임',
    icon: '🐍',
    accentColor: '#34C759',
    html: SNAKE_HTML,
  },
  {
    id: 'brick-breaker',
    title: '벽돌깨기',
    description: '5단계 레벨, 파워업, 콤보 시스템이 있는 벽돌깨기!',
    prompt: '멀티볼, 파이어볼 파워업, 5가지 레벨 패턴, 콤보 점수가 있는 벽돌깨기',
    icon: '🧱',
    accentColor: '#FF9500',
    html: BRICK_BREAKER_HTML,
  },
];
