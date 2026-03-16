// ============================================================
// FUTSAL MANAGER — AUDIO ENGINE v10
// BGM: Spotify IFrame API — playlist oficial
//      https://open.spotify.com/playlist/37i9dQZF1DXdxcBWuJkbcy
//      Autoplay, loop, replay — iniciado no clique do usuário
// SFX: Web Audio API
// ============================================================
(function () {
  'use strict';

  // ── AudioContext único para SFX ────────────────────────────
  let _ctx = null;
  function getCtx() {
    if (!_ctx) {
      try { _ctx = new (window.AudioContext || window.webkitAudioContext)(); }
      catch (e) { return null; }
    }
    if (_ctx.state === 'suspended') _ctx.resume();
    return _ctx;
  }
  window._fmGetCtx = getCtx;

  let _sfxVol = 0.55;
  let _bgmVol = 0.65;

  try {
    const s = JSON.parse(localStorage.getItem('fm_audio') || '{}');
    if (s.sfxVolume != null) _sfxVol = +s.sfxVolume;
    if (s.bgmVolume != null && s.bgmVolume >= 0.05) _bgmVol = +s.bgmVolume;
    if (s.sfxEnabled === false) _sfxVol = 0;
  } catch (_) {}

  // ── SFX primitivos ────────────────────────────────────────
  function sfx(freq, dur, type, gain, delay) {
    if (!window.SFX._on) return;
    const c = getCtx(); if (!c) return;
    const t = c.currentTime + (delay || 0);
    const g = c.createGain();
    g.gain.setValueAtTime(gain * _sfxVol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    g.connect(c.destination);
    const o = c.createOscillator();
    o.type = type || 'sine'; o.frequency.value = freq;
    o.connect(g); o.start(t); o.stop(t + dur + 0.05);
  }
  function sfxN(dur, gain, delay, fq) {
    if (!window.SFX._on) return;
    const c = getCtx(); if (!c) return;
    const t   = c.currentTime + (delay || 0);
    const len = Math.ceil(c.sampleRate * dur);
    const buf = c.createBuffer(1, len, c.sampleRate);
    const d   = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    const src = c.createBufferSource(); src.buffer = buf;
    const flt = c.createBiquadFilter(); flt.type = 'bandpass'; flt.frequency.value = fq || 800;
    const g = c.createGain(); g.gain.setValueAtTime(gain * _sfxVol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(flt); flt.connect(g); g.connect(c.destination); src.start(t); src.stop(t + dur + 0.05);
  }

  window.SFX = {
    _on: true,
    goal()       { sfxN(2.5,.7,0,600);sfxN(2,.5,.1,1200);sfx(1800,.12,'square',.5);sfx(1600,.1,'square',.4,.15);[523,659,784,988,1047,1319].forEach((f,i)=>sfx(f,.15,'sawtooth',.4,.5+i*.12));sfx(523,.6,'sawtooth',.5,1.4); },
    whistle()    { sfx(1900,.07,'square',.45);sfx(1700,.05,'square',.35,.09); },
    whistleLong(){ sfx(1950,.15,'square',.5);sfx(1750,.12,'square',.4,.17);sfx(1550,.1,'square',.3,.31);sfxN(.6,.25,0,900); },
    kickoff()    { [0,.14,.3].forEach(d=>sfx(1800,.08,'square',.5,d));sfxN(1.2,.3,.45,700); },
    click()      { sfx(720,.04,'square',.2); },
    nav()        { sfx(523,.05,'sine',.18);sfx(659,.05,'sine',.16,.06); },
    success()    { [523,659,784].forEach((f,i)=>sfx(f,.2,'sine',.3,i*.12)); },
    error()      { sfx(220,.1,'sawtooth',.3);sfx(185,.14,'sawtooth',.28,.12); },
    win()        { sfxN(2,.5,0,700);let t=.1;[523,523,523,415,523,622,523].forEach((f,i)=>{sfx(f,[.15,.15,.15,.12,.3,.3,.5][i],'sawtooth',.45,t);t+=[.15,.15,.15,.12,.3,.3,.5][i];}); },
    loss()       { sfx(415,.22,'sawtooth',.3);sfx(370,.22,'sawtooth',.28,.24);sfx(311,.35,'sawtooth',.25,.48); },
    draw()       { sfx(523,.12,'sine',.28);sfx(494,.12,'sine',.24,.18); },
    yellow()     { sfx(1047,.06,'square',.28);sfx(784,.09,'square',.25,.08); },
    red()        { sfx(880,.08,'sawtooth',.3);sfx(698,.1,'sawtooth',.28,.1);sfx(587,.14,'sawtooth',.25,.22); },
    injury()     { sfx(330,.18,'sawtooth',.22);sfx(277,.22,'sawtooth',.18,.2); },
    save()       { sfxN(.12,.3,0,1200);sfx(587,.06,'square',.25,.02); },
    transfer()   { sfx(784,.07,'sine',.28);sfx(988,.07,'sine',.28,.09);sfx(1175,.12,'sine',.32,.18); },
    newWeek()    { sfx(523,.08,'sine',.22);sfx(659,.1,'sine',.22,.1); },
    powerplay()  { sfxN(.25,.25,0,400);sfx(220,.35,'sawtooth',.28,.05); },
    toggle()     { this._on = !this._on; return this._on; },
    setVolume(v) { _sfxVol = Math.max(0, Math.min(1, v)); },
    isEnabled()  { return this._on; },
    matchEvent(t){ ({goal:()=>this.goal(),yellow:()=>this.yellow(),red:()=>this.red(),injury:()=>this.injury(),save:()=>this.save(),period_end:()=>this.whistleLong(),powerplay:()=>this.powerplay(),kickoff:()=>this.kickoff()})[t]?.(); },
    result(w,d)  { w?this.win():d?this.draw():this.loss(); }
  };


  // ============================================================
  // BGM — Motor Procedural v2 (harmônico, Fá maior / Dó maior)
  // Menu: Funk-Pop 120BPM  |  Copa: Épico 100BPM
  // Notas estritamente dentro da escala — sem dissonâncias
  // ============================================================
  window.BGM = (function () {
    let _ctx = null, _vol = _bgmVol, playing = false, _theme = 'menu', _stopFn = null;

    function ac() {
      if (!_ctx) _ctx = new (window.AudioContext || window.webkitAudioContext)();
      if (_ctx.state === 'suspended') _ctx.resume();
      return _ctx;
    }
    function mkGain(val) {
      const g = ac().createGain(); g.gain.value = Math.max(0, val * _vol); g.connect(ac().destination); return g;
    }
    function tone(f, type, t0, dur, amp, dest) {
      if (!f || f <= 0) return;
      const o = ac().createOscillator(), g = ac().createGain();
      o.type = type; o.frequency.value = f;
      const att = Math.min(0.02, dur * 0.1);
      g.gain.setValueAtTime(0, t0);
      g.gain.linearRampToValueAtTime(amp, t0 + att);
      g.gain.setValueAtTime(amp, t0 + dur * 0.65);
      g.gain.linearRampToValueAtTime(0, t0 + dur);
      o.connect(g); g.connect(dest); o.start(t0); o.stop(t0 + dur + 0.01);
    }
    function kick(t0, dest) {
      tone(65, 'sine', t0, 0.22, 0.32 * _vol, dest);
      const o = ac().createOscillator(), g = ac().createGain();
      o.type = 'sine'; o.frequency.setValueAtTime(120, t0); o.frequency.exponentialRampToValueAtTime(40, t0 + 0.18);
      g.gain.setValueAtTime(0.3 * _vol, t0); g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.22);
      o.connect(g); g.connect(dest); o.start(t0); o.stop(t0 + 0.23);
    }
    function snare(t0, dest) {
      const sr = ac().sampleRate, len = Math.ceil(sr * 0.15);
      const buf = ac().createBuffer(1, len, sr); const d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
      const src = ac().createBufferSource(); src.buffer = buf;
      const f = ac().createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 1800; f.Q.value = 1.5;
      const g = ac().createGain(); g.gain.setValueAtTime(0.22 * _vol, t0); g.gain.linearRampToValueAtTime(0, t0 + 0.15);
      src.connect(f); f.connect(g); g.connect(dest); src.start(t0); src.stop(t0 + 0.16);
    }
    function hihat(t0, dest, amp) {
      const sr = ac().sampleRate, len = Math.ceil(sr * 0.05);
      const buf = ac().createBuffer(1, len, sr); const d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
      const src = ac().createBufferSource(); src.buffer = buf;
      const f = ac().createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 8000;
      const g = ac().createGain(); g.gain.setValueAtTime((amp||0.07) * _vol, t0); g.gain.linearRampToValueAtTime(0, t0 + 0.05);
      src.connect(f); f.connect(g); g.connect(dest); src.start(t0); src.stop(t0 + 0.06);
    }
    function bigdrum(t0, dest) {
      const o = ac().createOscillator(), g = ac().createGain();
      o.type = 'sine'; o.frequency.setValueAtTime(90, t0); o.frequency.exponentialRampToValueAtTime(35, t0 + 0.4);
      g.gain.setValueAtTime(0.4 * _vol, t0); g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.42);
      o.connect(g); g.connect(dest); o.start(t0); o.stop(t0 + 0.45);
    }

    // ── MENU: Funk-Pop em Fá maior (120 BPM) ──────────────────
    function menuTheme() {
      const B = 60/120, now = ac().currentTime + 0.05;
      const dest = mkGain(0.48);
      // Fá maior: F G A Bb C D E
      const F3=174.61,A3=220,C4=261.63,D4=293.66,F4=349.23,G4=392,A4=440,
            Bb4=466.16,C5=523.25,D5=587.33,F5=698.46,Bb3=233.08,G3=196;

      // Melodia (sine suave) - exclusivamente notas de Fá maior
      [C5,0,D5,C5, A4,0,Bb4,A4, G4,A4,C5,A4, G4,F4,G4,0,
       A4,0,C5,D5, F5,D5,C5,A4, G4,F4,G4,A4, C5,0,0,0,
      ].forEach((f,i) => { if(f) tone(f,'sine',now+i*B,B*.8,0.20,dest); });

      // Baixo (sawtooth com filtro mental - será suave pois amp é baixa)
      [F3,0,C4,0,F3,0,C4,0, Bb3,0,F3,0,C4,0,C4,0,
       F3,0,A3,0,C4,0,A3,0, F3,0,C4,0,F3,0,0,0,
      ].forEach((f,i) => { if(f) tone(f,'triangle',now+i*B,B*.7,0.15,dest); });

      // Acordes pad (triangle - bem suave)
      [[F3,A3,C4],[F3,A3,C4],[Bb3,D4,F4],[Bb3,D4,F4],
       [C4,E4=329.63,G4],[C4,329.63,G4],[F3,A3,C4],[F3,A3,C4],
       [F3,A3,C4],[F3,A3,C4],[Bb3,D4,F4],[Bb3,D4,F4],
       [C4,329.63,G4],[Bb3,D4,F4],[F3,A3,C4],[F3,A3,C4],
      ].forEach((ch,i) => ch.forEach(f => { if(f) tone(f,'triangle',now+i*B*2,B*1.85,0.045,dest); }));

      // Percussão
      for(let i=0;i<32;i++){
        const t=now+i*B;
        hihat(t,dest,0.055);
        if(i%4===0||i%4===2) kick(t,dest);
        if(i%4===1||i%4===3) snare(t,dest);
      }
      return 32*B;
    }

    // ── COPA: Épico em Dó maior (100 BPM) ────────────────────
    function wcTheme() {
      const B = 60/100, now = ac().currentTime + 0.05;
      const dest = mkGain(0.46);
      // Dó maior: C D E F G A B
      const C3=130.81,E3=164.81,G3=196,A3=220,B3=246.94,
            C4=261.63,D4=293.66,E4=329.63,F4=349.23,G4=392,A4=440,B4=493.88,
            C5=523.25,D5=587.33,E5=659.25,G5=783.99,F3=174.61;

      // Fanfarra heróica (sawtooth com amp moderada)
      [C4,0,E4,G4, C5,B4,A4,G4, E4,F4,G4,0, E4,D4,C4,0,
       E4,G4,C5,D5, E5,D5,C5,B4, A4,C5,E5,G5, C5,0,0,0,
      ].forEach((f,i) => { if(f) tone(f,'sawtooth',now+i*B,B*.72,0.13,dest); });

      // Cordas (triangle, suave)
      [[C3,E3,G3],[C3,E3,G3],[A3,C4,E4],[A3,C4,E4],
       [F3,A3,C4],[F3,A3,C4],[G3,B3,D4],[G3,B3,D4],
       [C3,E3,G3],[C3,E3,G3],[A3,C4,E4],[A3,C4,E4],
       [F3,A3,C4],[G3,B3,D4],[C4,E4,G4],[C3,E3,G3],
      ].forEach((ch,i) => ch.forEach(f => { if(f) tone(f,'triangle',now+i*B*2,B*1.92,0.052,dest); }));

      // Baixo (triangle, grave e encorpado)
      [C3,C3,G3,G3, A3,A3,F3,G3, C3,C3,E3,E3, F3,G3,C3,C3,
       C3,C3,G3,G3, A3,A3,F3,G3, C3,C3,A3,A3, G3,G3,C3,0,
      ].forEach((f,i) => { if(f) tone(f,'triangle',now+i*B,B*.82,0.18,dest); });

      // Percussão orquestral
      for(let i=0;i<32;i++){
        const t=now+i*B;
        if(i%4===0) bigdrum(t,dest);
        if(i%4===2) { const o=ac().createOscillator(),g=ac().createGain(); o.type='sine';o.frequency.value=75;g.gain.setValueAtTime(0.18*_vol,t);g.gain.linearRampToValueAtTime(0,t+0.28);o.connect(g);g.connect(dest);o.start(t);o.stop(t+0.3); }
        if(i%2===0) hihat(t,dest,0.04);
      }
      return 32*B;
    }

    function runLoop(fn) {
      let alive=true,tid=null;
      function loop(){ if(!alive)return; const dur=fn(); tid=setTimeout(loop,(dur-0.1)*1000); }
      loop();
      _stopFn=()=>{ alive=false; clearTimeout(tid); };
    }

    return {
      start(theme){
        if(_stopFn){_stopFn();_stopFn=null;}
        _theme=theme||_theme; playing=true;
        // Garantir que contexto está ativo antes de tocar
        try { if(!_ctx) ac(); if(_ctx && _ctx.state==='suspended') _ctx.resume(); } catch(e) {}
        try{runLoop(_theme==='wc'?wcTheme:menuTheme);}catch(e){console.warn('[BGM]',e);}
      },
      stop(){
        playing=false;
        if(_stopFn){_stopFn();_stopFn=null;}
        // Suspender contexto para silêncio imediato
        try { if(_ctx && _ctx.state==='running') _ctx.suspend(); } catch(e) {}
      },
      toggle(){ if(playing){this.stop();return false;} else {try{if(_ctx&&_ctx.state==='suspended')_ctx.resume();}catch(e){}this.start();return true;} },
      playWC(){ this.start('wc'); },
      playMenu(){ this.start('menu'); },
      isPlaying(){ return playing; },
      setVolume(v){ _vol=Math.max(0.05,Math.min(1,v)); _bgmVol=_vol; try{localStorage.setItem('fm_bgm_vol',String(_vol));}catch(_){} },
      getVolume(){ return _vol; },
    };
  })();

  console.log('✅ sounds.js v12 — BGM harmônico Fá/Dó maior, envelope ADSR, sem dissonâncias');
})();
