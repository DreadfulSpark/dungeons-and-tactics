// Dungeons & Tactics — synthesized sound effects
window.DT = window.DT || {};
(() => {
let AC = null;
const A = DT.audio = { muted: false };
try { A.muted = localStorage.getItem('dt_muted') === '1'; } catch (e) {}
A.init = () => { if (!AC) { try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {} } if (AC && AC.state === 'suspended') AC.resume(); };
A.toggle = () => { A.muted = !A.muted; try { localStorage.setItem('dt_muted', A.muted ? '1' : '0'); } catch (e) {} return A.muted; };
function tone(f, dur, type = 'square', vol = .06, f2 = null, delay = 0) {
  const t = AC.currentTime + delay; const o = AC.createOscillator(), g = AC.createGain();
  o.type = type; o.frequency.setValueAtTime(f, t); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + dur);
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
  o.connect(g).connect(AC.destination); o.start(t); o.stop(t + dur + .02);
}
function noise(dur, vol = .08, hp = 800, delay = 0) {
  const t = AC.currentTime + delay; const len = Math.max(1, Math.floor(AC.sampleRate * dur));
  const b = AC.createBuffer(1, len, AC.sampleRate), d = b.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const s = AC.createBufferSource(); s.buffer = b; const f = AC.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = hp;
  const g = AC.createGain(); g.gain.value = vol; s.connect(f).connect(g).connect(AC.destination); s.start(t);
}
A.sfx = k => {
  if (!AC || A.muted) return;
  try {
    switch (k) {
      case 'click': tone(700, .05, 'square', .035); break;
      case 'hover': tone(1200, .02, 'square', .015); break;
      case 'select': tone(520, .06, 'square', .04); tone(780, .08, 'square', .04, null, .05); break;
      case 'dice': for (let i = 0; i < 6; i++) noise(.03, .07, 2500, i * .07 + Math.random() * .03); break;
      case 'assign': tone(400, .06, 'triangle', .07, 800); break;
      case 'step': tone(140, .05, 'sine', .08, 80); break;
      case 'hit': noise(.12, .14, 300); tone(110, .15, 'sine', .14, 50); break;
      case 'crit': noise(.2, .18, 200); tone(90, .3, 'sawtooth', .1, 40); tone(880, .15, 'square', .05, 1760, .05); break;
      case 'miss': noise(.18, .05, 3000); break;
      case 'riposte': tone(1500, .06, 'square', .05); tone(1000, .1, 'square', .05, null, .06); break;
      case 'heal': [660, 880, 1100].forEach((f, i) => tone(f, .18, 'sine', .07, null, i * .07)); break;
      case 'chest': [523, 659, 784, 1046].forEach((f, i) => tone(f, .14, 'square', .045, null, i * .08)); break;
      case 'coin': tone(988, .06, 'square', .04); tone(1318, .12, 'square', .04, null, .06); break;
      case 'phase': tone(220, .25, 'triangle', .08); tone(330, .3, 'triangle', .08, null, .15); break;
      case 'ephase': tone(196, .3, 'sawtooth', .05); tone(147, .4, 'sawtooth', .05, null, .2); break;
      case 'death': tone(300, .4, 'sawtooth', .06, 60); break;
      case 'trap': noise(.15, .12, 1500); tone(1200, .1, 'square', .04, 300); break;
      case 'door': noise(.4, .06, 150); tone(80, .4, 'sawtooth', .04, 60); break;
      case 'roll': noise(.02, .04, 4000); break;
      case 'win': [523, 659, 784, 1046, 1318].forEach((f, i) => tone(f, .22, 'square', .05, null, i * .12)); break;
      case 'lose': [392, 330, 262, 196].forEach((f, i) => tone(f, .3, 'triangle', .07, null, i * .2)); break;
      case 'shoot': noise(.08, .05, 1800); tone(900, .08, 'triangle', .03, 400); break;
      case 'cast': tone(300, .25, 'sine', .06, 1200); break;
      case 'blink': tone(1600, .15, 'sine', .05, 200); break;
      case 'boom': noise(.4, .2, 80); tone(70, .4, 'sawtooth', .1, 30); break;
      case 'levelup': [523, 784, 1046, 1568].forEach((f, i) => tone(f, .16, 'triangle', .07, null, i * .09)); break;
      case 'buy': tone(660, .06, 'square', .04); tone(990, .1, 'square', .04, null, .07); break;
      case 'error': tone(160, .15, 'square', .05); break;
    }
  } catch (e) {}
};
})();
