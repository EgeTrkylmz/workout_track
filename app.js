// ---------- AYARLAR: hareketleri buradan da değiştirebilirsin ----------
const DEFAULTS = [
  {id:1, name:'Bench Press',  sets:4, rest:90,  done:0},
  {id:2, name:'Barfiks',      sets:3, rest:120, done:0},
  {id:3, name:'Şınav',        sets:3, rest:60,  done:0},
];
const REST_OPTIONS = [30,45,60,90,120,150,180,240,300]; // saniye
// ------------------------------------------------------------------------

const KEY = 'worktrack_v1';
let S = load() || {ex: DEFAULTS, cur: 0};
let page = 1, rest = null, timer = null, audioCtx = null;

function load(){ try{ return JSON.parse(localStorage.getItem(KEY)); }catch(e){ return null; } }
function save(){ try{ localStorage.setItem(KEY, JSON.stringify(S)); }catch(e){} }
const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const fmt = s => Math.floor(s/60) + ':' + String(s%60).padStart(2,'0');
const fmtRest = s => s >= 60 ? (s%60 ? fmt(s) : (s/60) + ' dk') : s + ' sn';

function tab(n){
  page = n;
  document.getElementById('t1').className = n===1 ? 'on' : '';
  document.getElementById('t2').className = n===2 ? 'on' : '';
  render();
}

function firstOpen(){ return S.ex.findIndex(e => e.done < e.sets); }

function render(){
  const v = document.getElementById('view');
  if (page === 1) v.innerHTML = workoutHTML(); else v.innerHTML = manageHTML();
}

function workoutHTML(){
  if (!S.ex.length) return '<div class="empty">Henüz hareket yok. "Hareketler" sekmesinden ekle.</div>';
  const open = firstOpen();
  if (open === -1) return '<div class="card done"><div class="big">✓</div><div class="name">Antrenman bitti</div><button class="btn" onclick="resetAll()">Yeni antrenman</button></div>';
  if (S.cur >= S.ex.length || S.ex[S.cur].done >= S.ex[S.cur].sets) S.cur = open;
  return S.ex.map((e,i) => {
    const fin = e.done >= e.sets, cur = i === S.cur && !fin;
    const dots = Array.from({length:e.sets}, (_,k) =>
      `<div class="dot ${k<e.done?'d':(cur&&k===e.done?'n':'')}">${k<e.done?'✓':k+1}</div>`).join('');
    let body = `<div class="dots">${dots}</div>`;
    if (cur) body = `<div class="big">${e.done+1}<small> / ${e.sets}</small></div><div class="meta">Dinlenme: ${fmtRest(e.rest)}</div>${body}
      <button class="btn" onclick="completeSet()">Seti tamamladım</button>
      ${e.done>0?'<button class="btn sec" onclick="undoSet()">Son seti geri al</button>':''}`;
    return `<div class="card ${cur?'cur':''} ${fin?'fin':''}" ${(!cur&&!fin)?`onclick="pick(${i})"`:''}>
      <div class="row"><div><div class="name">${esc(e.name)}</div><div class="meta">${e.done}/${e.sets} set${fin?' · bitti':''}</div></div></div>${body}</div>`;
  }).join('') + '<button class="btn sec" onclick="resetAll()">Antrenmanı sıfırla</button>';
}

function manageHTML(){
  const opts = REST_OPTIONS.map(r => `<option value="${r}" ${r===90?'selected':''}>${fmtRest(r)}</option>`).join('');
  const list = S.ex.map((e,i) => `<div class="card row"><div><div class="name">${esc(e.name)}</div>
    <div class="meta">${e.sets} set · dinlenme ${fmtRest(e.rest)}</div></div>
    <button class="x" onclick="delEx(${i})" aria-label="Sil">✕</button></div>`).join('');
  return `<div class="card"><div class="name">Hareket ekle</div>
    <label>Hareket adı</label><input id="fn" placeholder="Örn. Squat">
    <div class="two"><div><label>Set sayısı</label><input id="fs" type="number" min="1" max="20" value="3"></div>
    <div><label>Dinlenme</label><select id="fr">${opts}</select></div></div>
    <button class="btn" onclick="addEx()">Ekle</button></div>${list || '<div class="empty">Hareket yok.</div>'}`;
}

function addEx(){
  const name = document.getElementById('fn').value.trim();
  const sets = parseInt(document.getElementById('fs').value, 10);
  const r = parseInt(document.getElementById('fr').value, 10);
  if (!name || !(sets > 0)) return;
  S.ex.push({id: Date.now(), name, sets, rest: r, done: 0});
  save(); render();
}
function delEx(i){ S.ex.splice(i,1); S.cur = 0; save(); render(); }
function pick(i){ S.cur = i; render(); }
function resetAll(){ S.ex.forEach(e => e.done = 0); S.cur = 0; stopRest(); save(); render(); }
function undoSet(){ const e = S.ex[S.cur]; if (e && e.done > 0){ e.done--; save(); render(); } }

function completeSet(){
  unlockAudio();
  const e = S.ex[S.cur];
  e.done++;
  save();
  const open = firstOpen();
  if (open === -1){ render(); return; }           // her şey bitti, dinlenmeye gerek yok
  const nextEx = e.done >= e.sets ? S.ex[open] : e;
  const label = e.done >= e.sets ? 'Sıradaki hareket: ' + nextEx.name : 'Sıradaki: ' + e.name + ' · Set ' + (e.done+1);
  if (e.done >= e.sets) S.cur = open;
  startRest(e.rest, label);
  render();
}

// ---------- Dinlenme sayacı ----------
function startRest(sec, label){
  rest = {end: Date.now() + sec*1000, label};
  const el = document.getElementById('rest');
  el.className = 'show';
  document.getElementById('rl').textContent = 'Dinlenme';
  document.getElementById('rn').textContent = label;
  document.getElementById('rc').innerHTML =
    '<button class="btn sec" onclick="adj(-15)">−15 sn</button><button class="btn sec" onclick="adj(15)">+15 sn</button><button class="btn sec" onclick="stopRest()">Atla</button>';
  clearInterval(timer);
  timer = setInterval(tick, 250);
  tick();
}
function adj(d){ if (rest) rest.end += d*1000; tick(); }
function tick(){
  if (!rest) return;
  const left = Math.ceil((rest.end - Date.now())/1000);
  if (left <= 0){ finishRest(); return; }
  document.getElementById('rt').textContent = fmt(left);
  document.title = fmt(left) + ' · Work Track';
}
function finishRest(){
  clearInterval(timer); rest = null;
  const el = document.getElementById('rest');
  el.className = 'show end';
  document.getElementById('rl').textContent = 'Süre doldu';
  document.getElementById('rt').textContent = '0:00';
  document.getElementById('rc').innerHTML = '<button class="btn" onclick="stopRest()">Devam</button>';
  document.title = 'Work Track';
  alarm();
}
function stopRest(){
  clearInterval(timer); rest = null;
  document.getElementById('rest').className = '';
  document.title = 'Work Track';
}

// ---------- Ses + titreşim ----------
function unlockAudio(){
  try{
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
  }catch(e){}
}
function alarm(){
  if (navigator.vibrate) navigator.vibrate([400,150,400,150,700]);
  if (!audioCtx) return;
  for (let i=0;i<3;i++){
    const o = audioCtx.createOscillator(), g = audioCtx.createGain();
    const t = audioCtx.currentTime + i*0.45;
    o.type = 'square'; o.frequency.value = 880;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.35, t+0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t+0.3);
    o.connect(g); g.connect(audioCtx.destination);
    o.start(t); o.stop(t+0.32);
  }
}

render();
