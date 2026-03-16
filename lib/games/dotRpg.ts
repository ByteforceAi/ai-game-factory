export const DOT_RPG_HTML = `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0,user-scalable=no,maximum-scale=1.0">
<title>Dot RPG — 잊혀진 마을</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:100%;height:100%;overflow:hidden;background:#1a0e2e;touch-action:none}
canvas{display:block;image-rendering:pixelated;image-rendering:crisp-edges}
#ui{position:absolute;top:0;left:0;width:100%;pointer-events:none;font-family:'Courier New',monospace}
#dialog{position:absolute;bottom:12px;left:12px;right:12px;background:rgba(10,5,30,0.92);border:2px solid #8b6fff;border-radius:8px;padding:12px 16px;color:#e8deff;font-size:14px;line-height:1.6;display:none;pointer-events:auto;cursor:pointer}
#dialog .name{color:#ffd700;font-weight:bold;margin-bottom:4px;font-size:12px}
#hud{position:absolute;top:8px;left:8px;right:8px;display:flex;justify-content:space-between;font-size:11px;color:#c8b8ff}
#hud .stat{background:rgba(10,5,30,0.8);border:1px solid rgba(139,111,255,0.3);border-radius:4px;padding:3px 8px}
#battle{position:absolute;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.85);display:none;flex-direction:column;align-items:center;justify-content:center;pointer-events:auto}
#battle .enemy-area{text-align:center;margin-bottom:20px}
#battle .enemy-sprite{font-size:48px;animation:battleBounce 0.6s ease-in-out infinite alternate}
#battle .enemy-name{color:#ff6b6b;font-family:'Courier New',monospace;font-size:14px;margin-top:4px}
#battle .enemy-hp-bar{width:120px;height:8px;background:#2a1545;border:1px solid #8b6fff;border-radius:4px;margin:8px auto;overflow:hidden}
#battle .enemy-hp-fill{height:100%;background:linear-gradient(90deg,#ff4444,#ff6b6b);border-radius:3px;transition:width 0.3s}
#battle .actions{display:flex;gap:8px;flex-wrap:wrap;justify-content:center}
#battle .actions button{background:rgba(139,111,255,0.2);border:2px solid #8b6fff;color:#e8deff;padding:8px 16px;border-radius:6px;font-family:'Courier New',monospace;font-size:13px;cursor:pointer;pointer-events:auto;transition:all 0.2s}
#battle .actions button:hover{background:rgba(139,111,255,0.5);transform:scale(1.05)}
#battle .battle-msg{color:#ffd700;font-family:'Courier New',monospace;font-size:12px;margin:12px 0;min-height:16px;text-align:center}
#dpad{position:absolute;bottom:16px;left:16px;pointer-events:auto;display:none}
#dpad button{position:absolute;width:44px;height:44px;border-radius:8px;background:rgba(139,111,255,0.25);border:1px solid rgba(139,111,255,0.4);color:#c8b8ff;font-size:18px;display:flex;align-items:center;justify-content:center;cursor:pointer;-webkit-tap-highlight-color:transparent}
#dpad button:active{background:rgba(139,111,255,0.6)}
#dpad .up{left:44px;top:0}
#dpad .down{left:44px;top:88px}
#dpad .left{left:0;top:44px}
#dpad .right{left:88px;top:44px}
@keyframes battleBounce{0%{transform:translateY(0)}100%{transform:translateY(-8px)}}
</style>
</head>
<body>
<canvas id="c"></canvas>
<div id="ui">
  <div id="hud">
    <span class="stat" id="hud-hp">HP 30/30</span>
    <span class="stat" id="hud-lv">LV 1</span>
    <span class="stat" id="hud-gold">Gold 0</span>
  </div>
  <div id="dialog" onclick="advanceDialog()"><div class="name" id="dlg-name"></div><div id="dlg-text"></div></div>
  <div id="battle">
    <div class="enemy-area">
      <div class="enemy-sprite" id="b-sprite"></div>
      <div class="enemy-name" id="b-name"></div>
      <div class="enemy-hp-bar"><div class="enemy-hp-fill" id="b-hp"></div></div>
    </div>
    <div class="battle-msg" id="b-msg"></div>
    <div class="actions" id="b-actions"></div>
  </div>
  <div id="dpad">
    <button class="up" ontouchstart="dpadDown('up')" ontouchend="dpadUp('up')" onmousedown="dpadDown('up')" onmouseup="dpadUp('up')">▲</button>
    <button class="down" ontouchstart="dpadDown('down')" ontouchend="dpadUp('down')" onmousedown="dpadDown('down')" onmouseup="dpadUp('down')">▼</button>
    <button class="left" ontouchstart="dpadDown('left')" ontouchend="dpadUp('left')" onmousedown="dpadDown('left')" onmouseup="dpadUp('left')">◀</button>
    <button class="right" ontouchstart="dpadDown('right')" ontouchend="dpadUp('right')" onmousedown="dpadDown('right')" onmouseup="dpadUp('right')">▶</button>
  </div>
</div>
<script>
'use strict';
(function(){

window.score = 0;
window.gameOver = false;

var canvas = document.getElementById('c');
var ctx = canvas.getContext('2d');
var W, H, TILE = 32, COLS, ROWS;
var camX = 0, camY = 0;

function resize(){
  W = window.innerWidth; H = window.innerHeight;
  canvas.width = W; canvas.height = H;
  COLS = Math.ceil(W/TILE)+2; ROWS = Math.ceil(H/TILE)+2;
  if('ontouchstart' in window) document.getElementById('dpad').style.display = 'block';
}
window.addEventListener('resize', resize);
resize();

/* ═══ Tile Map ═══ */
var MAP_W = 40, MAP_H = 30;
var tiles = []; // 0=grass, 1=path, 2=water, 3=tree, 4=house, 5=flower, 6=rock, 7=bridge
var tileColors = {
  0: ['#2d5a1e','#347a22','#2a6e1c'], // grass variations
  1: ['#c4a96a','#b8975a','#d4b97a'], // path
  2: ['#1a4a7a','#1e5a8e','#226aa2'], // water
  3: ['#1a4a20','#1e5a24','#226a28'], // tree trunk area
  5: ['#2d5a1e'], // flower (on grass)
  6: ['#5a5a6a','#6a6a7a'], // rock
  7: ['#8a7050','#9a8060'], // bridge
};

// Generate map procedurally
function generateMap(){
  for(var y=0;y<MAP_H;y++){
    tiles[y]=[];
    for(var x=0;x<MAP_W;x++){
      tiles[y][x] = 0; // default grass
    }
  }
  // River
  var rx = 20;
  for(var y=0;y<MAP_H;y++){
    rx += Math.floor(Math.random()*3)-1;
    rx = Math.max(15,Math.min(25,rx));
    for(var dx=-1;dx<=1;dx++) if(rx+dx>=0&&rx+dx<MAP_W) tiles[y][rx+dx]=2;
  }
  // Bridge
  tiles[15][rx-1]=7; tiles[15][rx]=7; tiles[15][rx+1]=7;

  // Paths
  for(var x=5;x<rx-1;x++) tiles[15][x]=1;
  for(var y=8;y<22;y++) tiles[y][8]=1;
  for(var x=3;x<14;x++) tiles[12][x]=1;

  // Houses
  var houses = [[5,10],[10,10],[5,18],[12,18]];
  houses.forEach(function(h){ tiles[h[1]][h[0]]=4; tiles[h[1]][h[0]+1]=4; tiles[h[1]-1][h[0]]=4; tiles[h[1]-1][h[0]+1]=4; });

  // Trees (scattered)
  for(var i=0;i<60;i++){
    var tx=Math.floor(Math.random()*MAP_W), ty=Math.floor(Math.random()*MAP_H);
    if(tiles[ty][tx]===0) tiles[ty][tx]=3;
  }
  // Flowers
  for(var i=0;i<30;i++){
    var fx=Math.floor(Math.random()*MAP_W), fy=Math.floor(Math.random()*MAP_H);
    if(tiles[fy][fx]===0) tiles[fy][fx]=5;
  }
  // Rocks
  for(var i=0;i<15;i++){
    var rx2=Math.floor(Math.random()*MAP_W), ry=Math.floor(Math.random()*MAP_H);
    if(tiles[ry][rx2]===0) tiles[ry][rx2]=6;
  }
}
generateMap();

/* ═══ Player ═══ */
var player = {
  x: 8, y: 15, dir: 0, // tile coords
  hp: 30, maxHp: 30, atk: 8, def: 3,
  lv: 1, exp: 0, nextExp: 20, gold: 0,
  moving: false, moveProgress: 0, moveDir: {x:0,y:0},
  stepTimer: 0
};

/* ═══ NPCs ═══ */
var npcs = [
  { x:6,y:10,sprite:'👴',name:'마을 장로',lines:['어서오거라, 젊은 모험가여.','이 마을 동쪽에 강이 흐르고...','다리를 건너면 몬스터가 나온다.','조심하거라!'], color:'#ffd700' },
  { x:11,y:10,sprite:'👩',name:'포션 상인',lines:['포션 하나 10골드!','...근데 아직 상점은 준비 중이야 😅'], color:'#ff69b4' },
  { x:6,y:18,sprite:'🧙',name:'마법사 루나',lines:['나는 마법사 루나.','레벨 5가 되면 마법을 가르쳐 줄게!'], color:'#8b6fff' },
  { x:13,y:18,sprite:'🐱',name:'고양이',lines:['냐옹~','...','냐냐옹! (머리를 쓰다듬어 달라는 것 같다)'], color:'#ffaa44' },
];

/* ═══ Monsters (east of river) ═══ */
var monsters = [
  { name:'슬라임', sprite:'🟢', hp:15, maxHp:15, atk:5, def:1, exp:8, gold:5 },
  { name:'박쥐', sprite:'🦇', hp:12, maxHp:12, atk:7, def:0, exp:6, gold:3 },
  { name:'버섯독', sprite:'🍄', hp:20, maxHp:20, atk:6, def:3, exp:12, gold:8 },
  { name:'해골병사', sprite:'💀', hp:30, maxHp:30, atk:10, def:5, exp:20, gold:15 },
];

/* ═══ Dialog System ═══ */
var dialogQueue = [];
var dialogActive = false;

function showDialog(name, lines, color){
  dialogQueue = lines.slice();
  document.getElementById('dlg-name').textContent = name;
  document.getElementById('dlg-name').style.color = color || '#ffd700';
  document.getElementById('dlg-text').textContent = dialogQueue.shift();
  document.getElementById('dialog').style.display = 'block';
  dialogActive = true;
}

window.advanceDialog = function(){
  if(dialogQueue.length > 0){
    document.getElementById('dlg-text').textContent = dialogQueue.shift();
  } else {
    document.getElementById('dialog').style.display = 'none';
    dialogActive = false;
  }
};

/* ═══ Battle System ═══ */
var battleActive = false;
var battleEnemy = null;
var battleTurn = 'player';

function startBattle(){
  var idx = player.lv >= 3 ? Math.floor(Math.random()*monsters.length) : Math.floor(Math.random()*2);
  battleEnemy = JSON.parse(JSON.stringify(monsters[idx]));
  battleActive = true;
  battleTurn = 'player';
  var bEl = document.getElementById('battle');
  bEl.style.display = 'flex';
  document.getElementById('b-sprite').textContent = battleEnemy.sprite;
  document.getElementById('b-name').textContent = battleEnemy.name + ' 출현!';
  updateBattleHP();
  showBattleActions();
  setBattleMsg(battleEnemy.name + '이(가) 나타났다!');
}

function updateBattleHP(){
  var pct = Math.max(0, battleEnemy.hp / battleEnemy.maxHp * 100);
  document.getElementById('b-hp').style.width = pct + '%';
}

function setBattleMsg(msg){
  document.getElementById('b-msg').textContent = msg;
}

function showBattleActions(){
  var el = document.getElementById('b-actions');
  el.innerHTML = '';
  var actions = [
    {label:'⚔️ 공격', fn: doAttack},
    {label:'🛡️ 방어', fn: doDefend},
    {label:'🏃 도망', fn: doRun},
  ];
  actions.forEach(function(a){
    var btn = document.createElement('button');
    btn.textContent = a.label;
    btn.onclick = a.fn;
    el.appendChild(btn);
  });
}

function clearBattleActions(){
  document.getElementById('b-actions').innerHTML = '';
}

function doAttack(){
  if(battleTurn !== 'player') return;
  clearBattleActions();
  var dmg = Math.max(1, player.atk + Math.floor(Math.random()*4) - battleEnemy.def);
  battleEnemy.hp -= dmg;
  updateBattleHP();
  setBattleMsg(dmg + ' 데미지를 입혔다!');
  if(battleEnemy.hp <= 0){
    setTimeout(function(){ endBattle(true); }, 800);
    return;
  }
  battleTurn = 'enemy';
  setTimeout(enemyTurn, 1000);
}

function doDefend(){
  if(battleTurn !== 'player') return;
  clearBattleActions();
  setBattleMsg('방어 자세를 취했다!');
  battleTurn = 'enemy';
  setTimeout(function(){ enemyTurn(true); }, 800);
}

function doRun(){
  if(battleTurn !== 'player') return;
  if(Math.random() < 0.6){
    setBattleMsg('도망쳤다!');
    setTimeout(function(){ endBattle(false); }, 600);
  } else {
    clearBattleActions();
    setBattleMsg('도망치지 못했다!');
    battleTurn = 'enemy';
    setTimeout(enemyTurn, 800);
  }
}

function enemyTurn(defended){
  var def = defended ? player.def * 2 : player.def;
  var dmg = Math.max(1, battleEnemy.atk + Math.floor(Math.random()*3) - def);
  player.hp -= dmg;
  if(player.hp < 0) player.hp = 0;
  setBattleMsg(battleEnemy.name + '의 공격! ' + dmg + ' 데미지!');
  updateHUD();
  if(player.hp <= 0){
    setTimeout(function(){
      setBattleMsg('쓰러졌다... 마을로 돌아갑니다.');
      setTimeout(function(){
        player.hp = player.maxHp;
        player.x = 8; player.y = 15;
        endBattle(false);
        updateHUD();
      }, 1500);
    }, 800);
    return;
  }
  battleTurn = 'player';
  setTimeout(showBattleActions, 600);
}

function endBattle(won){
  battleActive = false;
  document.getElementById('battle').style.display = 'none';
  if(won){
    player.exp += battleEnemy.exp;
    player.gold += battleEnemy.gold;
    window.score = player.gold;
    // Level up check
    while(player.exp >= player.nextExp){
      player.lv++;
      player.exp -= player.nextExp;
      player.nextExp = Math.floor(player.nextExp * 1.5);
      player.maxHp += 5;
      player.hp = player.maxHp;
      player.atk += 2;
      player.def += 1;
      showDialog('시스템','[레벨 업!] LV ' + player.lv + '\\n공격력 +2, 방어력 +1, HP +5','#ffd700');
    }
    updateHUD();
  }
}

function updateHUD(){
  document.getElementById('hud-hp').textContent = 'HP ' + player.hp + '/' + player.maxHp;
  document.getElementById('hud-lv').textContent = 'LV ' + player.lv;
  document.getElementById('hud-gold').textContent = 'Gold ' + player.gold;
}

/* ═══ Input ═══ */
var keys = {};
window.addEventListener('keydown', function(e){ keys[e.key]=true; e.preventDefault(); });
window.addEventListener('keyup', function(e){ keys[e.key]=false; });

var dpadState = {};
window.dpadDown = function(dir){ dpadState[dir]=true; };
window.dpadUp = function(dir){ dpadState[dir]=false; };

function getInput(){
  var dx=0, dy=0;
  if(keys['ArrowUp']||keys['w']||keys['W']||dpadState['up']){ dy=-1; }
  else if(keys['ArrowDown']||keys['s']||keys['S']||dpadState['down']){ dy=1; }
  else if(keys['ArrowLeft']||keys['a']||keys['A']||dpadState['left']){ dx=-1; }
  else if(keys['ArrowRight']||keys['d']||keys['D']||dpadState['right']){ dx=1; }
  return {x:dx,y:dy};
}

/* ═══ Drawing ═══ */
function drawTile(x, y, type){
  var px = x*TILE - camX, py = y*TILE - camY;
  if(px < -TILE || px > W || py < -TILE || py > H) return;

  // Base grass under everything
  ctx.fillStyle = '#2d5a1e';
  ctx.fillRect(px, py, TILE, TILE);

  switch(type){
    case 0: // grass with subtle variation
      if((x+y)%3===0){ ctx.fillStyle='#347a22'; ctx.fillRect(px+4,py+4,TILE-8,TILE-8); }
      break;
    case 1: // path
      ctx.fillStyle = tileColors[1][(x+y)%3];
      ctx.fillRect(px, py, TILE, TILE);
      ctx.fillStyle = 'rgba(0,0,0,0.05)';
      ctx.fillRect(px, py, TILE, 1);
      break;
    case 2: // water
      var wt = Date.now()/1000;
      ctx.fillStyle = tileColors[2][Math.floor((x+y+wt)%3)];
      ctx.fillRect(px, py, TILE, TILE);
      // Wave highlights
      ctx.fillStyle = 'rgba(100,200,255,0.15)';
      ctx.fillRect(px + Math.sin(wt+x)*4+12, py + Math.cos(wt+y)*3+8, 8, 2);
      break;
    case 3: // tree
      ctx.fillStyle = '#3a2a1a'; ctx.fillRect(px+12, py+16, 8, 16); // trunk
      ctx.fillStyle = '#1a6a24'; ctx.beginPath(); ctx.arc(px+16,py+12,12,0,Math.PI*2); ctx.fill();
      ctx.fillStyle = '#24aa30'; ctx.beginPath(); ctx.arc(px+14,py+10,8,0,Math.PI*2); ctx.fill();
      break;
    case 4: // house
      ctx.fillStyle = '#8a6a4a'; ctx.fillRect(px+2, py+10, TILE-4, TILE-10); // wall
      ctx.fillStyle = '#cc4444'; // roof
      ctx.beginPath(); ctx.moveTo(px,py+12); ctx.lineTo(px+16,py+2); ctx.lineTo(px+32,py+12); ctx.fill();
      ctx.fillStyle = '#4a3a2a'; ctx.fillRect(px+12, py+18, 8, 14); // door
      ctx.fillStyle = '#88ccff'; ctx.fillRect(px+5, py+14, 6, 6); // window
      break;
    case 5: // flower on grass
      var fc = ['#ff6b9d','#ffaa44','#44aaff','#ff4444','#aa44ff'];
      ctx.fillStyle = fc[(x*7+y*13)%fc.length];
      ctx.beginPath(); ctx.arc(px+16,py+16,3,0,Math.PI*2); ctx.fill();
      ctx.fillStyle = '#44aa22';
      ctx.fillRect(px+15, py+19, 2, 6);
      break;
    case 6: // rock
      ctx.fillStyle = '#6a6a7a';
      ctx.beginPath(); ctx.arc(px+16,py+18,10,0,Math.PI*2); ctx.fill();
      ctx.fillStyle = '#8a8a9a';
      ctx.beginPath(); ctx.arc(px+14,py+16,7,0,Math.PI*2); ctx.fill();
      break;
    case 7: // bridge
      ctx.fillStyle = '#8a7050'; ctx.fillRect(px, py, TILE, TILE);
      ctx.fillStyle = '#6a5040'; ctx.fillRect(px, py, TILE, 3); ctx.fillRect(px, py+TILE-3, TILE, 3);
      break;
  }
}

function drawPlayer(){
  var px, py;
  if(player.moving){
    var p = player.moveProgress;
    var ox = player.x - player.moveDir.x;
    var oy = player.y - player.moveDir.y;
    px = (ox + player.moveDir.x * p) * TILE - camX;
    py = (oy + player.moveDir.y * p) * TILE - camY;
  } else {
    px = player.x * TILE - camX;
    py = player.y * TILE - camY;
  }

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.beginPath(); ctx.ellipse(px+16, py+30, 10, 4, 0, 0, Math.PI*2); ctx.fill();

  // Body
  ctx.fillStyle = '#4488ff';
  ctx.fillRect(px+10, py+14, 12, 12);
  // Head
  ctx.fillStyle = '#ffcc88';
  ctx.beginPath(); ctx.arc(px+16, py+10, 8, 0, Math.PI*2); ctx.fill();
  // Hair
  ctx.fillStyle = '#5a3a1a';
  ctx.beginPath(); ctx.arc(px+16, py+7, 8, Math.PI, 0); ctx.fill();
  // Eyes
  ctx.fillStyle = '#222';
  ctx.fillRect(px+13, py+9, 2, 2);
  ctx.fillRect(px+18, py+9, 2, 2);
  // Legs (animated)
  var legAnim = Math.sin(Date.now()/100) * (player.moving ? 3 : 0);
  ctx.fillStyle = '#3366cc';
  ctx.fillRect(px+11, py+26, 4, 6 + legAnim);
  ctx.fillRect(px+17, py+26, 4, 6 - legAnim);
}

function drawNPCs(){
  npcs.forEach(function(npc){
    var px = npc.x * TILE - camX;
    var py = npc.y * TILE - camY;
    if(px < -TILE*2 || px > W+TILE || py < -TILE*2 || py > H+TILE) return;
    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    ctx.beginPath(); ctx.ellipse(px+16, py+30, 10, 3, 0, 0, Math.PI*2); ctx.fill();
    // Emoji sprite
    ctx.font = '24px serif';
    ctx.textAlign = 'center';
    ctx.fillText(npc.sprite, px+16, py+22);
    // Name tag
    ctx.font = '9px Courier New';
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.textAlign = 'center';
    ctx.fillText(npc.name, px+16, py-2);
  });
}

/* ═══ Game Logic ═══ */
function canMove(tx, ty){
  if(tx<0||ty<0||tx>=MAP_W||ty>=MAP_H) return false;
  var t = tiles[ty][tx];
  if(t===2||t===3||t===4||t===6) return false; // water, tree, house, rock
  // NPCs block
  for(var i=0;i<npcs.length;i++){
    if(npcs[i].x===tx && npcs[i].y===ty) return false;
  }
  return true;
}

function tryInteract(){
  var dirs = [{x:0,y:-1},{x:0,y:1},{x:-1,y:0},{x:1,y:0}];
  for(var i=0;i<dirs.length;i++){
    var tx = player.x+dirs[i].x, ty = player.y+dirs[i].y;
    for(var j=0;j<npcs.length;j++){
      if(npcs[j].x===tx && npcs[j].y===ty){
        showDialog(npcs[j].name, npcs[j].lines, npcs[j].color);
        return;
      }
    }
  }
}

var stepCount = 0;
var moveCD = 0;

function update(dt){
  if(dialogActive || battleActive) return;

  moveCD -= dt;
  if(moveCD > 0) return;

  if(!player.moving){
    var inp = getInput();
    if(inp.x !== 0 || inp.y !== 0){
      var nx = player.x + inp.x;
      var ny = player.y + inp.y;
      if(canMove(nx, ny)){
        player.moveDir = inp;
        player.moving = true;
        player.moveProgress = 0;
      }
      moveCD = 0.05;
    }
    // Interact with space/enter
    if(keys[' '] || keys['Enter']){
      tryInteract();
      keys[' '] = false; keys['Enter'] = false;
    }
  }

  if(player.moving){
    player.moveProgress += dt * 5; // movement speed
    if(player.moveProgress >= 1){
      player.x += player.moveDir.x;
      player.y += player.moveDir.y;
      player.moving = false;
      player.moveProgress = 0;
      stepCount++;

      // Random encounter east of river (tile x > 22)
      if(player.x > 22 && tiles[player.y][player.x] !== 7){
        if(Math.random() < 0.18) startBattle();
      }
    }
  }

  // Camera smooth follow
  var targetCX = player.x * TILE - W/2 + TILE/2;
  var targetCY = player.y * TILE - H/2 + TILE/2;
  camX += (targetCX - camX) * 0.1;
  camY += (targetCY - camY) * 0.1;
  camX = Math.max(0, Math.min(MAP_W*TILE - W, camX));
  camY = Math.max(0, Math.min(MAP_H*TILE - H, camY));
}

function render(){
  ctx.fillStyle = '#1a0e2e';
  ctx.fillRect(0, 0, W, H);

  // Draw visible tiles
  var startCol = Math.max(0, Math.floor(camX/TILE));
  var startRow = Math.max(0, Math.floor(camY/TILE));
  var endCol = Math.min(MAP_W, startCol + COLS);
  var endRow = Math.min(MAP_H, startRow + ROWS);

  for(var y=startRow; y<endRow; y++){
    for(var x=startCol; x<endCol; x++){
      drawTile(x, y, tiles[y][x]);
    }
  }

  drawNPCs();
  drawPlayer();

  // Vignette overlay
  var vg = ctx.createRadialGradient(W/2,H/2,W*0.3,W/2,H/2,W*0.7);
  vg.addColorStop(0,'rgba(0,0,0,0)');
  vg.addColorStop(1,'rgba(0,0,0,0.3)');
  ctx.fillStyle = vg;
  ctx.fillRect(0,0,W,H);
}

/* ═══ Game Loop ═══ */
var lastTime = 0;
function loop(time){
  var dt = Math.min(0.05, (time - lastTime) / 1000);
  lastTime = time;
  update(dt);
  render();
  requestAnimationFrame(loop);
}

// Initial dialog
setTimeout(function(){
  showDialog('시스템', ['잊혀진 마을에 오신 것을 환영합니다!','방향키로 이동, 스페이스바로 NPC와 대화하세요.','강 동쪽으로 가면 몬스터와 전투할 수 있어요!'], '#8b6fff');
}, 500);

requestAnimationFrame(loop);

})();
</script>
</body>
</html>`;
