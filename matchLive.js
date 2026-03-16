// ============================================================
// FUTSAL MANAGER — LIVE MATCH ENGINE v3
// Canvas HD · Partícula de gol · Narração · Bandeiras · Subs
// ============================================================

class LiveMatch {
  constructor(container, homeTeam, awayTeam, homePlayers, awayPlayers, homeTactics, awayTactics, gs, onFinish) {
    this.container   = container;
    this.homeTeam    = homeTeam;
    this.awayTeam    = awayTeam;
    this.homePlayers = homePlayers.slice(0,5);
    this.awayPlayers = awayPlayers.slice(0,5);
    this.homeTactics = { ...homeTactics };
    this.awayTactics = { ...awayTactics };
    this.gs          = gs;
    this.onFinish    = onFinish;

    this.minute      = 0;
    this.second      = 0;
    this.score       = { home: 0, away: 0 };
    this.period      = 1;
    this.paused      = false;
    this.speed       = 1;
    this.finished    = false;
    this.events      = [];
    this.stats       = {
      home:{ shots:0, shotsOnTarget:0, possession:50, fouls:0, corners:0, saves:0 },
      away:{ shots:0, shotsOnTarget:0, possession:50, fouls:0, corners:0, saves:0 }
    };
    this.ball        = { x:0.5, y:0.5, vx:0, vy:0, owner:null };
    this.players     = [];
    this._ballFly    = false;
    this._passTarget = null;
    this._passTimer  = 0;
    this._shootTimer = 0;
    this._particles  = [];  // partículas de gol
    this._fmtTick    = 0;
    this._possTimer  = 0;
    this._possHome   = 0;
    this._lastGoalFlash = 0;
    this._goalParticles = [];
    this._commentary = ''; // narração atual
    this._commentaryTimer = 0;
    this._subsUsed   = { home: 0, away: 0 };
    this._pendingSub = null;

    this._build();
    this._initPlayers();
  }

  // ── DOM ────────────────────────────────────────────────────
  _build() {
    this.container.innerHTML = '';
    this.container.className = 'live-match-wrap';

    const homeBadge = window.teamBadgeHTML ? window.teamBadgeHTML(this.homeTeam.id, this.homeTeam.name, this.homeTeam.color, this.homeTeam.color2, 40) : '⚽';
    const awayBadge = window.teamBadgeHTML ? window.teamBadgeHTML(this.awayTeam.id, this.awayTeam.name, this.awayTeam.color, this.awayTeam.color2, 40) : '⚽';

    this.container.innerHTML = `
    <div class="lm-layout">
      <div class="lm-scoreboard">
        <div class="lm-team lm-team-home">
          <div class="lm-team-badge">${homeBadge}</div>
          <div class="lm-team-info">
            <span class="lm-team-name">${this.homeTeam.name}</span>
            <span class="lm-team-side">CASA</span>
          </div>
        </div>
        <div class="lm-score-center">
          <div class="lm-score" id="lm-score">
            <span id="lm-score-home" class="lm-score-num">0</span>
            <span class="lm-score-sep">–</span>
            <span id="lm-score-away" class="lm-score-num">0</span>
          </div>
          <div class="lm-time-wrap">
            <div class="lm-time" id="lm-time">0'</div>
            <div class="lm-period" id="lm-period">1º TEMPO</div>
          </div>
          <div class="lm-timebar-wrap">
            <div class="lm-timebar"><div class="lm-timebar-fill" id="lm-timebar-fill"></div></div>
          </div>
        </div>
        <div class="lm-team lm-team-away">
          <div class="lm-team-info" style="text-align:right">
            <span class="lm-team-name">${this.awayTeam.name}</span>
            <span class="lm-team-side">FORA</span>
          </div>
          <div class="lm-team-badge">${awayBadge}</div>
        </div>
      </div>

      <div class="lm-commentary" id="lm-commentary" style="display:none"></div>

      <div class="lm-main">
        <div class="lm-field-wrap">
          <canvas id="lm-canvas" class="lm-canvas"></canvas>
          <div class="lm-controls">
            <button class="lm-ctrl-btn" id="lm-btn-pause" title="Pausar">⏸</button>
            <button class="lm-ctrl-btn active" id="lm-btn-1x" data-speed="1">1×</button>
            <button class="lm-ctrl-btn" id="lm-btn-2x" data-speed="2">2×</button>
            <button class="lm-ctrl-btn" id="lm-btn-3x" data-speed="3">3×</button>
            <button class="lm-ctrl-btn" id="lm-btn-4x" data-speed="4">4×</button>
          </div>
        </div>

        <div class="lm-panel">
          <div class="lm-tabs">
            <button class="lm-tab active" data-tab="events">📋 Narração</button>
            <button class="lm-tab" data-tab="stats">📊 Stats</button>
            <button class="lm-tab" data-tab="subs">🔄 Subs</button>
          </div>
          <div class="lm-tab-content active" id="lm-tab-events">
            <div class="lm-events-log" id="lm-events-log">
              <div class="lm-event-placeholder" style="color:rgba(255,255,255,.3);font-size:12px;padding:20px;text-align:center">⚽ Aguardando início...</div>
            </div>
          </div>
          <div class="lm-tab-content" id="lm-tab-stats">
            <div class="lm-stats-list" id="lm-stats-list"></div>
          </div>
          <div class="lm-tab-content" id="lm-tab-subs">
            <div class="lm-subs-wrap" id="lm-subs-wrap"></div>
          </div>
        </div>
      </div>
    </div>`;

    this.canvas  = document.getElementById('lm-canvas');
    this.ctx     = this.canvas.getContext('2d');
    this._resizeCanvas();
    window.addEventListener('resize', () => this._resizeCanvas());

    document.getElementById('lm-btn-pause')?.addEventListener('click', () => this.togglePause());
    this.container.querySelectorAll('[data-speed]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.container.querySelectorAll('[data-speed]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.setSpeed(parseInt(btn.dataset.speed));
      });
    });
    this.container.querySelectorAll('.lm-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        this.container.querySelectorAll('.lm-tab').forEach(t => t.classList.remove('active'));
        this.container.querySelectorAll('.lm-tab-content').forEach(c => c.classList.remove('active'));
        tab.classList.add('active');
        document.getElementById(`lm-tab-${tab.dataset.tab}`)?.classList.add('active');
      });
    });

    this._renderSubsPanel();
    this._renderStats();
  }

  _resizeCanvas() {
    if (!this.canvas) return;
    const wrap = this.canvas.parentElement;
    if (!wrap) return;
    const w = wrap.clientWidth;
    const h = Math.max(200, Math.round(w * 0.55));
    this.canvas.width  = w * (window.devicePixelRatio || 1);
    this.canvas.height = h * (window.devicePixelRatio || 1);
    this.canvas.style.width  = w + 'px';
    this.canvas.style.height = h + 'px';
    if (this.ctx) this.ctx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);
    this.cW = w; this.cH = h;
  }

  // ── PLAYERS ───────────────────────────────────────────────
  _initPlayers() {
    this.players = [];
    const pH = this._getFormationPositions(this.homeTactics.formation || '1-2-1-1', 'home');
    const pA = this._getFormationPositions(this.awayTactics.formation || '1-2-1-1', 'away');

    this.homePlayers.forEach((p, i) => {
      const base = pH[i] || {x:0.15, y:0.5};
      this.players.push({ ...base, tx:base.x, ty:base.y, baseX:base.x, baseY:base.y,
        vx:0, vy:0, hasBall:false, tired:0, slotIdx:i, team:'home',
        id:p.id, name:p.name, position:p.position, overall:p.overall||75,
        morale:p.morale||75, fit:p.fitness||85, data:p,
        _jx:(Math.random()-0.5)*0.04, _jy:(Math.random()-0.5)*0.05 });
    });
    this.awayPlayers.forEach((p, i) => {
      const base = pA[i] || {x:0.85, y:0.5};
      this.players.push({ ...base, tx:base.x, ty:base.y, baseX:base.x, baseY:base.y,
        vx:0, vy:0, hasBall:false, tired:0, slotIdx:i, team:'away',
        id:p.id, name:p.name, position:p.position, overall:p.overall||75,
        morale:p.morale||75, fit:p.fitness||85, data:p,
        _jx:(Math.random()-0.5)*0.04, _jy:(Math.random()-0.5)*0.05 });
    });

    // GK fica parado perto do gol
    this.players.forEach(p => { if (p.position==='GL') { p._jx=0; p._jy=0; } });
    this._loadPlayerPhotos();
  }

  _loadPlayerPhotos() {
    this._playerImgs = {};
    const PHOTOS = window.PLAYER_PHOTOS || {};
    this.players.forEach(p => {
      const pid = PHOTOS[p.name];
      if (pid) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = `https://api.sofascore.app/api/v1/player/${pid}/image`;
        this._playerImgs[p.id] = img;
      }
    });
  }

  _getFormationPositions(formation, side) {
    const h = side === 'home';
    const defs = {
      '1-2-1-1': h
        ? [{x:.08,y:.5},{x:.28,y:.28},{x:.28,y:.72},{x:.55,y:.5},{x:.80,y:.5}]
        : [{x:.92,y:.5},{x:.72,y:.28},{x:.72,y:.72},{x:.45,y:.5},{x:.20,y:.5}],
      '1-1-2-1': h
        ? [{x:.08,y:.5},{x:.28,y:.5},{x:.52,y:.22},{x:.52,y:.78},{x:.80,y:.5}]
        : [{x:.92,y:.5},{x:.72,y:.5},{x:.48,y:.22},{x:.48,y:.78},{x:.20,y:.5}],
      '1-2-2-0': h
        ? [{x:.08,y:.5},{x:.28,y:.28},{x:.28,y:.72},{x:.60,y:.22},{x:.60,y:.78}]
        : [{x:.92,y:.5},{x:.72,y:.28},{x:.72,y:.72},{x:.40,y:.22},{x:.40,y:.78}],
      '1-3-1-0': h
        ? [{x:.08,y:.5},{x:.28,y:.2},{x:.28,y:.5},{x:.28,y:.8},{x:.60,y:.5}]
        : [{x:.92,y:.5},{x:.72,y:.2},{x:.72,y:.5},{x:.72,y:.8},{x:.40,y:.5}],
      '1-0-3-1': h
        ? [{x:.08,y:.5},{x:.45,y:.18},{x:.45,y:.5},{x:.45,y:.82},{x:.80,y:.5}]
        : [{x:.92,y:.5},{x:.55,y:.18},{x:.55,y:.5},{x:.55,y:.82},{x:.20,y:.5}],
    };
    return defs[formation] || defs['1-2-1-1'];
  }

  // ── LOOP ──────────────────────────────────────────────────
  start() {
    this._scheduleEvents();
    this._tick();
    this._draw();
    if (window.SFX) window.SFX.kickoff?.();
  }

  stop() {
    clearTimeout(this._tickTimer);
    cancelAnimationFrame(this._animFrame);
  }

  togglePause() {
    this.paused = !this.paused;
    const btn = document.getElementById('lm-btn-pause');
    if (btn) btn.textContent = this.paused ? '▶' : '⏸';
  }

  setSpeed(s) { this.speed = Math.max(1, Math.min(4, s)); }

  _tick() {
    if (this.finished) return;
    if (this.paused) { this._tickTimer = setTimeout(() => this._tick(), 200); return; }

    const speedMs = [null, 55, 22, 7, 2][this.speed] || 55;

    this.second++;
    if (this.second >= 60) { this.second = 0; this.minute++; }

    this._processEvents();
    this._updatePhysics();
    this._updatePossession();
    this._updateUI();

    if (this.minute >= 20 && this.period === 1) {
      this._endPeriod(1);
      this._tickTimer = setTimeout(() => this._tick(), speedMs);
      return;
    }
    if (this.minute >= 40) { this._endMatch(); return; }

    this._tickTimer = setTimeout(() => this._tick(), speedMs);
  }

  // ── DRAW ──────────────────────────────────────────────────
  _draw() {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const W = this.cW, H = this.cH;

    ctx.clearRect(0, 0, W, H);
    this._drawField(ctx, W, H);
    this._drawPassLine(ctx, W, H);
    this._drawBall(ctx, W, H);
    this._drawPlayers(ctx, W, H);
    this._drawParticles(ctx, W, H);
    this._drawCommentaryOverlay(ctx, W, H);

    if (!this.finished) this._animFrame = requestAnimationFrame(() => this._draw());
  }

  _drawField(ctx, W, H) {
    // Campo verde com gradiente
    const grd = ctx.createLinearGradient(0, 0, W, H);
    grd.addColorStop(0,   '#1a4f2a');
    grd.addColorStop(0.3, '#1f5e30');
    grd.addColorStop(0.7, '#1f5e30');
    grd.addColorStop(1,   '#1a4f2a');
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, W, H);

    // Listras de gramado
    ctx.save();
    ctx.globalAlpha = 0.07;
    ctx.fillStyle = '#fff';
    const sw = W / 10;
    for (let i = 0; i < 10; i += 2) ctx.fillRect(i * sw, 0, sw, H);
    ctx.restore();

    const pad = 10;
    ctx.strokeStyle = 'rgba(255,255,255,0.82)';
    ctx.lineWidth = 1.8;
    ctx.lineCap = 'round';

    // Borda
    this._roundRect(ctx, pad, pad, W - pad*2, H - pad*2, 4, false, true);

    // Linha do meio
    ctx.beginPath(); ctx.moveTo(W/2, pad); ctx.lineTo(W/2, H-pad); ctx.stroke();

    // Círculo central
    ctx.beginPath();
    ctx.arc(W/2, H/2, Math.min(W,H)*0.095, 0, Math.PI*2);
    ctx.stroke();
    ctx.beginPath(); ctx.arc(W/2, H/2, 2.5, 0, Math.PI*2);
    ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.fill();

    // Gols (net com efeito)
    const gw = H * 0.20, gd = W * 0.028;
    const gy = (H - gw) / 2;

    // Net pattern (lado esquerdo)
    ctx.save();
    ctx.globalAlpha = 0.15;
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 0.6;
    for (let y = gy; y <= gy+gw; y += gw/5) {
      ctx.beginPath(); ctx.moveTo(pad, y); ctx.lineTo(pad+gd, y); ctx.stroke();
    }
    for (let x = pad; x <= pad+gd; x += gd/4) {
      ctx.beginPath(); ctx.moveTo(x, gy); ctx.lineTo(x, gy+gw); ctx.stroke();
    }
    ctx.restore();

    // Goal box esquerdo
    ctx.fillStyle = 'rgba(255,255,255,0.04)';
    ctx.fillRect(pad, gy, gd, gw);
    ctx.strokeStyle = 'rgba(255,255,255,0.85)';
    ctx.strokeRect(pad, gy, gd, gw);

    // Net pattern (lado direito)
    ctx.save();
    ctx.globalAlpha = 0.15;
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 0.6;
    for (let y = gy; y <= gy+gw; y += gw/5) {
      ctx.beginPath(); ctx.moveTo(W-pad-gd, y); ctx.lineTo(W-pad, y); ctx.stroke();
    }
    for (let x = W-pad-gd; x <= W-pad; x += gd/4) {
      ctx.beginPath(); ctx.moveTo(x, gy); ctx.lineTo(x, gy+gw); ctx.stroke();
    }
    ctx.restore();

    ctx.fillRect(W-pad-gd, gy, gd, gw);
    ctx.strokeRect(W-pad-gd, gy, gd, gw);

    // Áreas de penalidade
    const paW = W * 0.14, paH = H * 0.52;
    const paY = (H - paH) / 2;
    ctx.strokeRect(pad, paY, paW, paH);
    ctx.strokeRect(W-pad-paW, paY, paW, paH);

    // Pontos de penalidade
    [[pad + paW*0.55, H/2], [W-pad-paW*0.55, H/2]].forEach(([px,py]) => {
      ctx.beginPath(); ctx.arc(px, py, 2.5, 0, Math.PI*2);
      ctx.fillStyle = 'rgba(255,255,255,0.75)'; ctx.fill();
    });

    // Logo da liga no centro (semi-transparente)
    const leagueKey = this.homeTeam.league;
    if (leagueKey && window.LEAGUE_LOGOS?.[leagueKey]) {
      const logoURL = window.LEAGUE_LOGOS[leagueKey];
      if (!this._leagueImg) {
        this._leagueImg = new Image();
        this._leagueImg.src = logoURL;
      }
      if (this._leagueImg.complete && this._leagueImg.naturalWidth > 0) {
        ctx.save();
        ctx.globalAlpha = 0.07;
        const ls = Math.min(W, H) * 0.28;
        ctx.drawImage(this._leagueImg, W/2 - ls/2, H/2 - ls/2, ls, ls);
        ctx.restore();
      }
    }
  }

  _roundRect(ctx, x, y, w, h, r, fill, stroke) {
    ctx.beginPath();
    ctx.moveTo(x+r, y); ctx.lineTo(x+w-r, y);
    ctx.arcTo(x+w, y, x+w, y+r, r); ctx.lineTo(x+w, y+h-r);
    ctx.arcTo(x+w, y+h, x+w-r, y+h, r); ctx.lineTo(x+r, y+h);
    ctx.arcTo(x, y+h, x, y+h-r, r); ctx.lineTo(x, y+r);
    ctx.arcTo(x, y, x+r, y, r);
    ctx.closePath();
    if (fill) ctx.fill();
    if (stroke) ctx.stroke();
  }

  _drawBall(ctx, W, H) {
    const bx = this.ball.x * W, by = this.ball.y * H;
    const r  = Math.max(6, W * 0.015);

    // Trail
    if (!this._ballTrail) this._ballTrail = [];
    this._ballTrail.push({x:bx, y:by});
    if (this._ballTrail.length > 10) this._ballTrail.shift();
    this._ballTrail.forEach((pt, i) => {
      const a = (i / this._ballTrail.length) * 0.25;
      const tr = r * (i / this._ballTrail.length) * 0.6;
      ctx.beginPath(); ctx.arc(pt.x, pt.y, Math.max(1,tr), 0, Math.PI*2);
      ctx.fillStyle = `rgba(255,255,255,${a})`; ctx.fill();
    });

    // Sombra
    ctx.beginPath();
    ctx.ellipse(bx, by+r*0.65, r*1.15, r*0.38, 0, 0, Math.PI*2);
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fill();

    // Bola
    const bg = ctx.createRadialGradient(bx-r*0.3, by-r*0.35, 0, bx, by, r);
    bg.addColorStop(0, '#ffffff');
    bg.addColorStop(0.55, '#eeeeee');
    bg.addColorStop(1, '#999999');
    ctx.beginPath(); ctx.arc(bx, by, r, 0, Math.PI*2);
    ctx.fillStyle = bg; ctx.fill();

    // Padrão futebol
    ctx.save(); ctx.globalAlpha = 0.28; ctx.strokeStyle='#333'; ctx.lineWidth=0.8;
    ctx.beginPath();
    for (let i=0;i<5;i++) {
      const a = (i/5)*Math.PI*2-Math.PI/2;
      i===0?ctx.moveTo(bx+r*0.5*Math.cos(a),by+r*0.5*Math.sin(a)):ctx.lineTo(bx+r*0.5*Math.cos(a),by+r*0.5*Math.sin(a));
    }
    ctx.closePath(); ctx.stroke(); ctx.restore();
    ctx.beginPath(); ctx.arc(bx, by, r, 0, Math.PI*2);
    ctx.strokeStyle='rgba(80,80,80,0.4)'; ctx.lineWidth=0.8; ctx.stroke();
  }

  _drawPlayers(ctx, W, H) {
    this.players.forEach(p => {
      const px = p.x * W, py = p.y * H;
      const r  = Math.max(11, W * 0.026);
      const isHome   = p.team === 'home';
      const col = isHome ? (this.homeTeam.color||'#2980b9') : (this.awayTeam.color||'#e74c3c');
      const hasBall  = p.hasBall;

      // Sombra
      ctx.beginPath();
      ctx.ellipse(px, py+r+2, r*0.78, r*0.26, 0, 0, Math.PI*2);
      ctx.fillStyle = 'rgba(0,0,0,0.32)'; ctx.fill();

      // Stamina ring
      const stam = Math.max(0, 1 - p.tired/100);
      const stamColor = stam>0.5 ? '#28c856' : stam>0.25 ? '#f0c84a' : '#e74c3c';
      ctx.beginPath();
      ctx.arc(px, py, r+4, -Math.PI/2, -Math.PI/2 + Math.PI*2*stam);
      ctx.strokeStyle = stamColor; ctx.lineWidth = 2.2; ctx.stroke();

      // Anel externo (cor time ou ouro se tem bola)
      ctx.beginPath(); ctx.arc(px, py, r+2, 0, Math.PI*2);
      ctx.fillStyle = hasBall ? '#f0c84a' : col; ctx.fill();

      // Avatar
      const img = (this._playerImgs||{})[p.id];
      ctx.save();
      ctx.beginPath(); ctx.arc(px, py, r, 0, Math.PI*2); ctx.clip();
      if (img && img.complete && img.naturalWidth>0) {
        try {
          const ratio = img.naturalWidth/img.naturalHeight;
          const d = r*2;
          let sw=img.naturalHeight,sh=img.naturalHeight,sx=(img.naturalWidth-sw)/2,sy=0;
          ctx.drawImage(img,sx,sy,sw,sh, px-r, py-r, d, d);
          const fade = ctx.createLinearGradient(0,py,0,py+r);
          fade.addColorStop(0,'rgba(0,0,0,0)'); fade.addColorStop(1,'rgba(0,0,0,0.65)');
          ctx.fillStyle=fade; ctx.fillRect(px-r,py,r*2,r);
        } catch(e) {
          this._drawPlayerCircle(ctx, px, py, r, col, p);
        }
      } else {
        this._drawPlayerCircle(ctx, px, py, r, col, p);
      }
      ctx.restore();

      // Borda
      ctx.beginPath(); ctx.arc(px, py, r, 0, Math.PI*2);
      ctx.strokeStyle = hasBall ? '#f0c84a' : 'rgba(255,255,255,0.3)';
      ctx.lineWidth = hasBall ? 2.5 : 1.2; ctx.stroke();

      // Nome tag
      const lastName = p.name.split(' ').slice(-1)[0];
      const fs = Math.max(8, Math.round(r*0.5));
      ctx.font = `bold ${fs}px 'Barlow Condensed',sans-serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      const tw = ctx.measureText(lastName).width + 8;
      const tagY = py + r + 5;
      ctx.fillStyle = hasBall ? 'rgba(240,200,74,0.9)' : 'rgba(0,0,0,0.75)';
      ctx.beginPath(); ctx.roundRect?.(px-tw/2, tagY, tw, fs+4, 3); ctx.fill();
      ctx.fillStyle = hasBall ? '#000' : '#fff';
      ctx.fillText(lastName, px, tagY+2);

      if (hasBall) {
        ctx.font = `${Math.round(r*0.6)}px serif`;
        ctx.textBaseline='bottom';
        ctx.fillText('⚽', px+r*0.65, py-r*0.55);
      }
    });
  }

  _drawPlayerCircle(ctx, px, py, r, col, p) {
    const g = ctx.createRadialGradient(px-r*0.3, py-r*0.3, 0, px, py, r);
    g.addColorStop(0, this._lighten(col, 60));
    g.addColorStop(1, col);
    ctx.fillStyle = g;
    ctx.fillRect(px-r, py-r, r*2, r*2);
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.font = `bold ${Math.round(r*0.65)}px 'Barlow Condensed',sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const abbr = p.position==='PÍV'?'P':p.position.charAt(0);
    ctx.fillText(abbr, px, py);
  }

  _lighten(hex, amt) {
    try {
      const n = parseInt(hex.replace('#',''),16);
      const r = Math.min(255,((n>>16)&0xff)+amt);
      const g = Math.min(255,((n>>8)&0xff)+amt);
      const b = Math.min(255,(n&0xff)+amt);
      return `rgb(${r},${g},${b})`;
    } catch(e) { return hex; }
  }

  _drawPassLine(ctx, W, H) {
    if (!this._ballFly || !this._passTarget) return;
    const tx = this._passTarget.x*W, ty = this._passTarget.y*H;
    const bx = this.ball.x*W, by = this.ball.y*H;
    ctx.save();
    ctx.setLineDash([5,7]);
    ctx.strokeStyle = 'rgba(255,255,255,0.18)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(bx,by); ctx.lineTo(tx,ty); ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }

  // ── PARTÍCULAS DE GOL ─────────────────────────────────────
  _spawnGoalParticles(gx, gy) {
    const colors = ['#f0c84a','#28c856','#fff','#ff6b35','#4a90e2','#e74c3c'];
    for (let i = 0; i < 60; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.02 + Math.random() * 0.05;
      this._goalParticles.push({
        x: gx, y: gy,
        vx: Math.cos(angle)*speed, vy: Math.sin(angle)*speed - 0.02,
        life: 1.0, decay: 0.018 + Math.random()*0.015,
        r: 2 + Math.random() * 5,
        color: colors[Math.floor(Math.random()*colors.length)],
        gravity: 0.001,
      });
    }
  }

  _drawParticles(ctx, W, H) {
    this._goalParticles = this._goalParticles.filter(p => p.life > 0);
    this._goalParticles.forEach(p => {
      p.x += p.vx; p.y += p.vy; p.vy += p.gravity; p.life -= p.decay;
      ctx.beginPath(); ctx.arc(p.x*W, p.y*H, p.r, 0, Math.PI*2);
      ctx.fillStyle = p.color + Math.round(p.life*255).toString(16).padStart(2,'0');
      ctx.fill();
    });
  }

  _drawCommentaryOverlay(ctx, W, H) {
    if (!this._commentaryText || this._commentaryAlpha <= 0) return;
    this._commentaryAlpha -= 0.005;
    if (this._commentaryAlpha < 0) { this._commentaryAlpha = 0; this._commentaryText = ''; return; }
    ctx.save();
    ctx.globalAlpha = Math.min(1, this._commentaryAlpha);
    const fontSize = Math.max(14, W * 0.032);
    ctx.font = `bold ${fontSize}px 'Barlow Condensed',sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    const text = this._commentaryText;
    const tw = ctx.measureText(text).width + 24;
    const bx = W/2-tw/2, by=8, bh=fontSize+12;
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    if (ctx.roundRect) ctx.roundRect(bx,by,tw,bh,bh/2); else ctx.rect(bx,by,tw,bh);
    ctx.fill();
    ctx.fillStyle = '#f0c84a';
    ctx.fillText(text, W/2, by+6);
    ctx.restore();
  }

  _showCommentary(text, duration=4) {
    this._commentaryText = text;
    this._commentaryAlpha = 1.0;
    // Também atualizar o painel
    const el = document.getElementById('lm-commentary');
    if (el) { el.style.display='block'; el.textContent = text; clearTimeout(this._comTimer); this._comTimer=setTimeout(()=>{el.style.display='none';},duration*1000); }
  }

  // ── FÍSICA ────────────────────────────────────────────────
  _updatePhysics() {
    if (!this.cW) return;
    if (!this._passTimer) this._passTimer=0;
    if (!this._shootTimer) this._shootTimer=0;
    this._passTimer--; this._shootTimer--;

    this.players.forEach(p => {
      const dx = p.tx-p.x, dy = p.ty-p.y;
      const dist = Math.hypot(dx,dy);
      const spd = (p.hasBall ? 0.028 : 0.018) * Math.max(0.5, 1-p.tired*0.003);
      if (dist > 0.005) { p.x += (dx/dist)*Math.min(dist,spd); p.y += (dy/dist)*Math.min(dist,spd); }
      p.x = Math.max(0.03,Math.min(0.97,p.x));
      p.y = Math.max(0.05,Math.min(0.95,p.y));
      p.tired = Math.min(100, p.tired + 0.012);
    });

    const owner = this.ball.owner;
    if (owner) {
      this.ball.x += (owner.x-this.ball.x)*0.45;
      this.ball.y += (owner.y-this.ball.y)*0.45;

      if (this._passTimer<=0 && !this._ballFly) {
        const mates = this.players.filter(p=>p.team===owner.team && p!==owner);
        if (mates.length>0 && Math.random()<0.72) {
          const recv = this._pickPassTarget(owner, mates);
          if (recv) this._startPass(owner, recv);
        }
        this._passTimer = 80 + Math.floor(Math.random()*100);
      }

      if (this._shootTimer<=0 && !this._ballFly) {
        const near = (owner.team==='home'&&owner.x>0.70)||(owner.team==='away'&&owner.x<0.30);
        if (near && owner.position!=='GL' && Math.random()<0.12) {
          this._startShot(owner);
          this._shootTimer = 180 + Math.floor(Math.random()*80);
        }
      }
    } else if (this._ballFly) {
      this.ball.x += this.ball.vx;
      this.ball.y += this.ball.vy;
      this.ball.vx *= 0.965; this.ball.vy *= 0.965;

      if (this.ball.y<0.05||this.ball.y>0.95) { this.ball.vy*=-0.7; this.ball.y=Math.max(0.05,Math.min(0.95,this.ball.y)); }
      if (this.ball.x<0.02) { this.ball.vx=Math.abs(this.ball.vx)*0.5; this.ball.x=0.03; }
      if (this.ball.x>0.98) { this.ball.vx=-Math.abs(this.ball.vx)*0.5; this.ball.x=0.97; }

      if (this._passTarget) {
        const d = Math.hypot(this.ball.x-this._passTarget.x, this.ball.y-this._passTarget.y);
        if (d<0.09 || (Math.abs(this.ball.vx)<0.005 && Math.abs(this.ball.vy)<0.005)) {
          const opp = this.players.filter(p=>p.team!==this._passTarget.team);
          const near = opp.reduce((b,p)=>{const dd=Math.hypot(p.x-this.ball.x,p.y-this.ball.y);return(!b||dd<b.d)?{p,d:dd}:b;},null);
          if (near && near.d<0.09 && Math.random()<0.22) {
            this._ballFly=false; this.ball.owner=near.p; near.p.hasBall=true; this._passTarget=null; this._passTimer=60;
          } else {
            this._ballFly=false; this.ball.owner=this._passTarget; this._passTarget.hasBall=true;
            this.ball.vx=0; this.ball.vy=0; this._passTarget=null; this._passTimer=70+Math.floor(Math.random()*90);
          }
        }
      } else if (Math.abs(this.ball.vx)<0.004 && Math.abs(this.ball.vy)<0.004) {
        this._ballFly=false;
        let near=null, nd=0.14;
        this.players.forEach(p=>{const d=Math.hypot(p.x-this.ball.x,p.y-this.ball.y);if(d<nd){near=p;nd=d;}});
        if (near) { this.ball.owner=near; near.hasBall=true; this.ball.vx=0; this.ball.vy=0; }
        else { this._ballFly=true; this.ball.vx=(0.5-this.ball.x)*0.02; this.ball.vy=(0.5-this.ball.y)*0.02; }
      }
    } else {
      this._ballFly=true; this.ball.vx=(Math.random()-0.5)*0.04; this.ball.vy=(Math.random()-0.5)*0.04;
    }
    this._updateFormationTargets();
  }

  _pickPassTarget(owner, mates) {
    const dir = owner.team==='home'?1:-1;
    return mates.map(p=>({p,s:p.x*dir*3+(1-Math.hypot(p.x-owner.x,p.y-owner.y))+Math.random()}))
                .sort((a,b)=>b.s-a.s)[0]?.p || mates[0];
  }

  _startPass(from, to) {
    from.hasBall=false; this.ball.owner=null; this._ballFly=true; this._passTarget=to;
    const dx=to.x-this.ball.x, dy=to.y-this.ball.y, dist=Math.hypot(dx,dy)||0.1;
    const spd=Math.min(0.06,Math.max(0.026,dist*0.5));
    this.ball.vx=(dx/dist)*spd; this.ball.vy=(dy/dist)*spd;
    to.tx=to.x+dx*0.3; to.ty=to.y+dy*0.3;
  }

  _startShot(shooter) {
    shooter.hasBall=false; this.ball.owner=null; this._ballFly=true; this._passTarget=null;
    const gx=shooter.team==='home'?0.99:0.01, gy=0.40+Math.random()*0.20;
    const dx=gx-this.ball.x, dy=gy-this.ball.y, dist=Math.hypot(dx,dy)||0.1;
    this.ball.vx=(dx/dist)*0.072; this.ball.vy=(dy/dist)*0.072;
  }

  _updateFormationTargets() {
    this._fmtTick++;
    if (this._fmtTick % 28 !== 0) return;
    const stylePush = {ofensivo:0.12,equilibrado:0,defensivo:-0.1,contra_ataque:-0.06,posse:0.04};
    const baseH = this._getFormationPositions(this.homeTactics.formation||'1-2-1-1','home');
    const baseA = this._getFormationPositions(this.awayTactics.formation||'1-2-1-1','away');
    const owner = this.ball.owner;

    this.players.forEach(p => {
      if (p.hasBall) return;
      const isHome=p.team==='home';
      const base=(isHome?baseH:baseA)[p.slotIdx]||(isHome?baseH:baseA)[0];
      const push=(stylePush[(isHome?this.homeTactics:this.awayTactics).style||'equilibrado']||0)*(isHome?1:-1);
      const ab=(owner&&owner.team===p.team&&p.position!=='GL')?0.06*(isHome?1:-1):0;
      p._jx=p._jx*0.72+(Math.random()-0.5)*0.04*0.28;
      p._jy=p._jy*0.72+(Math.random()-0.5)*0.05*0.28;
      p.tx=Math.max(0.04,Math.min(0.96,base.x+push+ab+(p.position!=='GL'?p._jx:0)));
      p.ty=Math.max(0.07,Math.min(0.93,base.y+(p.position!=='GL'?p._jy:0)));
    });
  }

  // ── EVENTOS ───────────────────────────────────────────────
  _scheduleEvents() {
    this._eventQueue = [];
    const hStr = this._teamStrength('home'), aStr = this._teamStrength('away');
    const total = hStr+aStr;
    const totalGoals = 4+Math.floor(Math.random()*7);
    const hGoals = Math.round(totalGoals*(hStr/total+(Math.random()-0.5)*0.14));
    const aGoals = totalGoals-hGoals;

    const used=new Set();
    const placeGoal=team=>{let m,tries=0;do{m=1+Math.floor(Math.random()*39);tries++;}while(used.has(m)&&tries<25);used.add(m);this._eventQueue.push({minute:m,type:'goal',team});};
    for(let i=0;i<Math.max(0,hGoals);i++)placeGoal('home');
    for(let i=0;i<Math.max(0,aGoals);i++)placeGoal('away');

    for(let m=1;m<=40;m++){
      const r=Math.random(), side=Math.random()<hStr/total?'home':'away', opp=side==='home'?'away':'home';
      if(r<0.18){if(Math.random()<0.44)this._eventQueue.push({minute:m,type:'save',team:opp});else this._eventQueue.push({minute:m,type:'shot',team:side});}
      else if(r<0.28){this._eventQueue.push({minute:m,type:'foul',team:side});if(Math.random()<0.26)this._eventQueue.push({minute:m+0.1,type:'yellow',team:side});}
      else if(r<0.33)this._eventQueue.push({minute:m,type:'corner',team:side});
      else if(r<0.345&&m>=10)this._eventQueue.push({minute:m,type:'injury',team:side});
      else if(r<0.37&&m>=12&&Math.random()<0.3)this._eventQueue.push({minute:m,type:'powerplay',team:side});
      else if(r<0.40)this._eventQueue.push({minute:m,type:'attack',team:side});
    }
    this._eventQueue.sort((a,b)=>a.minute-b.minute);
    this._eventIdx=0;
  }

  _processEvents() {
    if(!this._eventQueue)return;
    while(this._eventIdx<this._eventQueue.length){
      const ev=this._eventQueue[this._eventIdx];
      if(ev.minute>this.minute+this.second/60)break;
      this._fireEvent(ev); this._eventIdx++;
    }
  }

  _fireEvent(ev) {
    const {type,team}=ev, min=this.minute;
    const hp=this.players.filter(p=>p.team==='home');
    const ap=this.players.filter(p=>p.team==='away');
    const players=team==='home'?hp:ap;
    const opp=team==='home'?ap:hp;
    const attacker=this._pickWeighted(players.filter(p=>p.position!=='GL'))||players[0];
    const gk=opp.find(p=>p.position==='GL')||opp[0];

    if(attacker&&['goal','shot','save','attack'].includes(type)){
      this.players.forEach(p=>{p.hasBall=false;});
      this.ball.owner=attacker; attacker.hasBall=true;
      attacker.tx=team==='home'?0.87+Math.random()*0.06:0.07+Math.random()*0.06;
      attacker.ty=0.33+Math.random()*0.34;
    }

    // Narrações por tipo
    const NARR = {
      goal:    ['⚽ GOOOOOL!','🔥 GOLAÇO!','💥 É GOOOOL!'],
      save:    ['🧤 Defesa incrível!','🙌 Que intervenção!','Defendeu!'],
      shot:    ['💥 Chute forte!','🎯 Finalizou!','Tentou o gol!'],
      foul:    ['🚨 Falta!','Parou o contra-ataque!','Falta cometida!'],
      yellow:  ['🟨 Cartão Amarelo!','Advertido pelo árbitro!'],
      corner:  ['🚩 Escanteio!','Bola na área!'],
      injury:  ['🤕 Jogador lesionado!','Queda no campo!'],
      attack:  ['⚡ Chegada perigosa!','Bom ataque!'],
      powerplay:['🔥 Pressão total!','Marcação alta!'],
    };

    switch(type) {
      case 'goal': {
        this.score[team]++;
        const assister=players.find(p=>p!==attacker&&(p.position==='ALA'||p.position==='FIX'));
        if(attacker?.data){attacker.data.goals=(attacker.data.goals||0)+1;}
        if(assister?.data){assister.data.assists=(assister.data.assists||0)+1;}
        this.stats[team].shots++; this.stats[team].shotsOnTarget++;
        this._addEvent(min,'goal',team,attacker,assister?`Assist: ${assister.name}`:'');
        if(window.SFX)window.SFX.goal();
        this._flashScore(team);
        this._showCommentary(NARR.goal[Math.floor(Math.random()*NARR.goal.length)]+` ${attacker.name}!`, 5);

        // Partículas no gol
        const gx=team==='home'?0.99:0.01;
        this._spawnGoalParticles(gx, 0.5);

        attacker.hasBall=false; this.ball.owner=null; this._ballFly=true;
        const goalX=team==='home'?0.99:0.01, goalY=0.45+Math.random()*0.1;
        const gdx=goalX-this.ball.x, gdy=goalY-this.ball.y, gd=Math.hypot(gdx,gdy)||0.1;
        this.ball.vx=(gdx/gd)*0.09; this.ball.vy=(gdy/gd)*0.09;

        setTimeout(()=>{
          this.ball.x=0.5; this.ball.y=0.5; this.ball.vx=0; this.ball.vy=0;
          this._ballFly=false; this._passTarget=null;
          this.players.forEach(p=>{p.hasBall=false;});
          const ko=this.players.find(p=>p.team!==team&&p.position!=='GL')||this.players.find(p=>p.team!==team);
          if(ko){ko.hasBall=true;this.ball.owner=ko;}
          this._passTimer=120; this._updateFormationTargets();
        },1800);
        break;
      }
      case 'save': {
        this.stats[opp[0]?.team==='home'?'home':'away'].saves++;
        this._addEvent(min,'save',gk?.team||team,gk,`Contra ${attacker.name}`);
        if(window.SFX)window.SFX.save();
        this._showCommentary(NARR.save[Math.floor(Math.random()*NARR.save.length)]+` ${gk?.name||'GL'}!`);
        attacker.hasBall=false; this.ball.owner=gk; if(gk)gk.hasBall=true; this._passTimer=80;
        break;
      }
      case 'shot': {
        this.stats[team].shots++;
        this._addEvent(min,'shot',team,attacker,'Fora do alvo');
        this._showCommentary(NARR.shot[Math.floor(Math.random()*NARR.shot.length)]);
        attacker.hasBall=false; this.ball.owner=gk; if(gk)gk.hasBall=true; this._passTimer=70;
        break;
      }
      case 'foul': {
        this.stats[team].fouls++;
        this._addEvent(min,'foul',team,attacker);
        if(window.SFX)window.SFX.whistle();
        this._showCommentary(NARR.foul[Math.floor(Math.random()*NARR.foul.length)]);
        break;
      }
      case 'yellow': {
        if(attacker?.data)attacker.data.yellowCards=(attacker.data.yellowCards||0)+1;
        this._addEvent(min,'yellow',team,attacker);
        if(window.SFX)window.SFX.yellow();
        this._showCommentary(`🟨 ${attacker?.name||'Jogador'} advertido!`);
        break;
      }
      case 'corner':
        this.stats[team].corners++;
        this._addEvent(min,'corner',team,attacker);
        this._showCommentary(NARR.corner[Math.floor(Math.random()*NARR.corner.length)]);
        break;
      case 'injury': {
        this._addEvent(min,'injury',team,attacker);
        if(window.SFX)window.SFX.injury();
        this._showCommentary(`🤕 ${attacker?.name||'Jogador'} lesionado!`);
        break;
      }
      case 'powerplay':
        this._addEvent(min,'powerplay',team,attacker);
        if(window.SFX)window.SFX.powerplay?.();
        this._showCommentary(NARR.powerplay[Math.floor(Math.random()*NARR.powerplay.length)]);
        break;
      case 'attack':
        this._addEvent(min,'attack',team,attacker);
        this._showCommentary(NARR.attack[Math.floor(Math.random()*NARR.attack.length)]);
        break;
    }
  }

  _pickWeighted(arr) {
    if(!arr||!arr.length)return null;
    let tot=arr.reduce((s,p)=>s+(p.overall||70),0), r=Math.random()*tot;
    for(const p of arr){r-=(p.overall||70);if(r<=0)return p;}
    return arr[arr.length-1];
  }

  _teamStrength(side) {
    const pl=this.players.filter(p=>p.team===side);
    if(!pl.length)return 60;
    const avg=pl.reduce((a,p)=>a+p.overall,0)/pl.length;
    const tac=side==='home'?this.homeTactics:this.awayTactics;
    return avg+({ofensivo:3,equilibrado:0,defensivo:-2,contra_ataque:1,posse:2}[tac.style||'equilibrado']||0);
  }

  _updatePossession() {
    const owner=this.ball.owner;
    if(owner){this._possTimer++;if(owner.team==='home')this._possHome++;}
    if(this._possTimer>10){
      this.stats.home.possession=Math.round((this._possHome/this._possTimer)*100);
      this.stats.away.possession=100-this.stats.home.possession;
    }
  }

  // ── PERIOD / MATCH END ────────────────────────────────────
  _endPeriod(n) {
    this._addEvent(20,'period_end',null,null,`Fim do ${n}º tempo: ${this.score.home}–${this.score.away}`);
    if(window.SFX)window.SFX.whistleLong();
    this.period=2; this.minute=20; this.second=0;
    this.ball.x=0.5; this.ball.y=0.5;
    const ko=this.players.find(p=>p.team!==(this.score.home>this.score.away?'home':'away'))||this.players[0];
    this.players.forEach(p=>{p.hasBall=false;}); if(ko){ko.hasBall=true;this.ball.owner=ko;}
    const el=document.getElementById('lm-period'); if(el)el.textContent='2º TEMPO';
  }

  _endMatch() {
    this.finished=true;
    clearTimeout(this._tickTimer); cancelAnimationFrame(this._animFrame);
    this._addEvent(40,'match_end',null,null,`${this.homeTeam.name} ${this.score.home}–${this.score.away} ${this.awayTeam.name}`);
    if(window.SFX)window.SFX.whistleLong();
    this._updateUI(); this._draw();
    setTimeout(()=>{ this._showFinishOverlay(); if(this.onFinish)this.onFinish({score:{...this.score},events:this.events,stats:this.stats,homeFouls:this.stats.home.fouls,awayFouls:this.stats.away.fouls}); },900);
  }

  _showFinishOverlay() {
    const isHome=this.homeTeam.id===this.gs?.playerTeamId;
    const my=isHome?this.score.home:this.score.away, opp=isHome?this.score.away:this.score.home;
    const res=my>opp?'win':my===opp?'draw':'loss';
    const labels={win:'⚡ VITÓRIA!',draw:'🤝 EMPATE',loss:'😔 DERROTA'};

    const goalHTML=this.events.filter(e=>e.type==='goal').map(e=>{
      const tn=e.team==='home'?this.homeTeam.name:this.awayTeam.name;
      return `<div style="font-size:12px;color:rgba(255,255,255,.8);margin:3px 0">⚽ ${e.minute}' <b>${e.player?.name||'?'}</b> <span style="color:rgba(255,255,255,.4);font-size:10px">${tn}${e.extra?` · ${e.extra}`:''}</span></div>`;
    }).join('');

    const ov=document.createElement('div');
    ov.className='lm-finish-overlay';
    ov.innerHTML=`<div class="lm-finish-card lm-result-${res}">
      <div class="lm-finish-result">${labels[res]}</div>
      <div class="lm-finish-score">${this.score.home} – ${this.score.away}</div>
      <div class="lm-finish-teams">${this.homeTeam.name} × ${this.awayTeam.name}</div>
      ${goalHTML?`<div style="margin:10px 0;padding:8px;background:rgba(0,0,0,.3);border-radius:8px;text-align:left;max-height:130px;overflow-y:auto">${goalHTML}</div>`:''}
      <div style="display:flex;gap:8px;margin-top:14px;flex-wrap:wrap;justify-content:center">
        <button class="lm-finish-btn" id="lm-fok">📊 Ver Resultado</button>
        <button class="lm-finish-btn" id="lm-fdash" style="background:rgba(255,255,255,.08)">🏠 Dashboard</button>
      </div>
    </div>`;
    this.container.appendChild(ov);
    document.getElementById('lm-fok')?.addEventListener('click',()=>{ov.remove();if(window.ui)window.ui.render('match');});
    document.getElementById('lm-fdash')?.addEventListener('click',()=>{ov.remove();if(window.ui)window.ui.render('dashboard');});
    if(res==='win'&&window.SFX)setTimeout(()=>window.SFX.win(),300);
    else if(res==='loss'&&window.SFX)setTimeout(()=>window.SFX.loss(),300);
    else if(window.SFX)setTimeout(()=>window.SFX.draw(),300);
  }

  // ── UI ────────────────────────────────────────────────────
  _updateUI() {
    const te=document.getElementById('lm-time'), sh=document.getElementById('lm-score-home');
    const sa=document.getElementById('lm-score-away'), fi=document.getElementById('lm-timebar-fill');
    if(te) te.textContent=`${this.minute}'`;
    if(sh) sh.textContent=this.score.home;
    if(sa) sa.textContent=this.score.away;
    if(fi) fi.style.width=`${Math.min(100,(this.minute/40)*100)}%`;
    this._renderStats();
  }

  _flashScore(scoringTeam) {
    const el=document.getElementById('lm-score'); if(!el)return;
    el.classList.add('lm-goal-flash');
    setTimeout(()=>el.classList.remove('lm-goal-flash'),1200);
    // Shake scoreboard
    const sb=this.container.querySelector('.lm-scoreboard'); if(!sb)return;
    sb.style.transform='scale(1.04)';
    setTimeout(()=>{sb.style.transform='';},400);
  }

  _addEvent(minute, type, team, player, extra) {
    const ev={minute,type,team,player:player?{name:player.name,position:player.position}:null,extra};
    this.events.push(ev); this._renderEvent(ev);
  }

  _renderEvent(ev) {
    const log=document.getElementById('lm-events-log'); if(!log)return;
    const ph=log.querySelector('.lm-event-placeholder'); if(ph)ph.remove();

    const icons={goal:'⚽',save:'🧤',shot:'💥',foul:'🚨',yellow:'🟨',red:'🟥',corner:'🚩',injury:'🤕',period_end:'🏁',powerplay:'🔥',attack:'⚡',match_end:'🎉'};
    const cols={goal:'#f0c84a',save:'#4a90e2',foul:'#e74c3c',yellow:'#f0c84a',red:'#e74c3c',injury:'#e74c3c',period_end:'#28c856',match_end:'#f0c84a',powerplay:'#ff6b35',attack:'#7c4dff'};

    const teamN=ev.team==='home'?this.homeTeam.name:ev.team==='away'?this.awayTeam.name:'';
    const _fe = window.flagEmoji || function(){return '';};
    const flag = ev.team==='home' ? _fe(this.homeTeam.country||'') : ev.team==='away' ? _fe(this.awayTeam.country||'') : '';

    const typeLabels={goal:'GOL',save:'DEFESA',shot:'CHUTE',foul:'FALTA',yellow:'AMARELO',red:'VERMELHO',corner:'ESCANTEIO',injury:'LESÃO',period_end:'INTERVALO',powerplay:'POWER PLAY',attack:'ATAQUE',match_end:'FIM'};
    const label=typeLabels[ev.type]||ev.type.toUpperCase();

    const div=document.createElement('div');
    div.className='lm-event-item';
    div.style.cssText=`display:flex;align-items:flex-start;gap:8px;padding:8px 10px;border-bottom:1px solid rgba(255,255,255,.05);animation:lmEventIn .3s ease;border-left:3px solid ${cols[ev.type]||'#555'}`;
    div.innerHTML=`
      <span style="font-size:16px;flex-shrink:0;margin-top:1px">${icons[ev.type]||'●'}</span>
      <div style="flex:1;min-width:0">
        <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">
          <span style="color:rgba(255,255,255,.45);font-size:10px;font-weight:700">${ev.minute}'</span>
          <span style="background:${cols[ev.type]||'#555'}22;color:${cols[ev.type]||'#aaa'};font-size:9px;font-weight:800;padding:1px 5px;border-radius:3px;letter-spacing:.06em">${label}</span>
          ${teamN?`<span style="color:rgba(255,255,255,.35);font-size:10px">${flag}${teamN}</span>`:''}
        </div>
        ${ev.player?`<div style="color:#e4edf6;font-size:12px;font-weight:700;margin-top:2px">${ev.player.name} <span style="color:rgba(255,255,255,.3);font-size:10px;font-weight:400">${ev.player.position}</span></div>`:''}
        ${ev.extra?`<div style="color:rgba(255,255,255,.4);font-size:10px;margin-top:1px">${ev.extra}</div>`:''}
      </div>`;
    log.insertBefore(div, log.firstChild);
    if(log.children.length>40) log.removeChild(log.lastChild);
  }

  _renderStats() {
    const el=document.getElementById('lm-stats-list'); if(!el)return;
    const S=this.stats;
    const rows=[
      ['Posse de Bola', S.home.possession+'%', S.away.possession+'%', S.home.possession],
      ['Finalizações', S.home.shots, S.away.shots, S.home.shots/(S.home.shots+S.away.shots+0.01)*100],
      ['No Alvo', S.home.shotsOnTarget, S.away.shotsOnTarget, S.home.shotsOnTarget/(S.home.shotsOnTarget+S.away.shotsOnTarget+0.01)*100],
      ['Defesas', S.home.saves, S.away.saves, (1-S.home.saves/(S.home.saves+S.away.saves+0.01))*100],
      ['Faltas', S.home.fouls, S.away.fouls, (1-S.home.fouls/(S.home.fouls+S.away.fouls+0.01))*100],
      ['Escanteios', S.home.corners, S.away.corners, S.home.corners/(S.home.corners+S.away.corners+0.01)*100],
    ];
    el.innerHTML=rows.map(([label,hv,av,pct])=>`
      <div style="padding:8px 10px;border-bottom:1px solid rgba(255,255,255,.05)">
        <div style="display:flex;justify-content:space-between;margin-bottom:5px">
          <span style="color:#e4edf6;font-weight:700;font-size:13px">${hv}</span>
          <span style="color:rgba(255,255,255,.45);font-size:11px;font-weight:600">${label}</span>
          <span style="color:#e4edf6;font-weight:700;font-size:13px">${av}</span>
        </div>
        <div style="height:4px;background:rgba(255,255,255,.08);border-radius:2px;overflow:hidden">
          <div style="height:100%;background:linear-gradient(90deg,#4a90e2,#28c856);width:${pct}%;border-radius:2px;transition:width .5s ease"></div>
        </div>
      </div>`).join('');
  }

  _renderSubsPanel() {
    const el=document.getElementById('lm-subs-wrap'); if(!el)return;
    const isPlayer=(tid)=>tid===this.gs?.playerTeamId;
    const myTeam=isPlayer(this.homeTeam.id)?'home':isPlayer(this.awayTeam.id)?'away':null;
    if(!myTeam){el.innerHTML=`<p style="color:rgba(255,255,255,.4);font-size:12px;padding:16px;text-align:center">Substituições disponíveis apenas para o seu time.</p>`;return;}
    const onField=this.players.filter(p=>p.team===myTeam);
    const bench=myTeam==='home'?this.homePlayers.slice(5):this.awayPlayers.slice(5);
    const subsLeft=3-(this._subsUsed[myTeam]||0);
    el.innerHTML=`<div style="padding:10px">
      <div style="color:rgba(255,255,255,.5);font-size:11px;margin-bottom:10px">Substituições restantes: <b style="color:#f0c84a">${subsLeft}</b></div>
      <div style="color:rgba(255,255,255,.7);font-size:11px;font-weight:700;margin-bottom:6px;text-transform:uppercase;letter-spacing:.06em">Em campo</div>
      ${onField.map(p=>`<div class="lm-sub-row" data-player="${p.id}" style="display:flex;align-items:center;gap:8px;padding:6px 8px;border-radius:6px;cursor:${subsLeft>0&&bench.length>0?'pointer':'default'};margin-bottom:4px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.06)" ${subsLeft>0&&bench.length>0?`onmouseover="this.style.background='rgba(255,255,255,.09)'" onmouseout="this.style.background='rgba(255,255,255,.04)'"`:''}>
        <span style="font-size:12px;font-weight:800;color:rgba(255,255,255,.5);width:28px">${p.position}</span>
        <span style="flex:1;font-size:13px;color:#e4edf6;font-weight:600">${p.name}</span>
        <span style="font-size:11px;color:rgba(255,255,255,.35)">${Math.round(100-p.tired)}% 💪</span>
      </div>`).join('')}
      ${bench.length>0?`<div style="color:rgba(255,255,255,.7);font-size:11px;font-weight:700;margin:10px 0 6px;text-transform:uppercase;letter-spacing:.06em">Banco</div>
      ${bench.map(p=>`<div style="display:flex;align-items:center;gap:8px;padding:5px 8px;border-radius:6px;background:rgba(255,255,255,.02);margin-bottom:3px">
        <span style="font-size:12px;font-weight:800;color:rgba(255,255,255,.4);width:28px">${p.position}</span>
        <span style="flex:1;font-size:12px;color:rgba(255,255,255,.65)">${p.name}</span>
        <span style="font-size:11px;color:rgba(255,255,255,.3)">${p.overall} OVR</span>
      </div>`).join('')}`:'<p style="color:rgba(255,255,255,.3);font-size:11px;margin-top:12px">Sem jogadores no banco.</p>'}
    </div>`;
  }
}

// Helper global
function lightenColor(hex, amt) {
  try { const n=parseInt(hex.replace('#',''),16); return `rgb(${Math.min(255,((n>>16)&0xff)+amt)},${Math.min(255,((n>>8)&0xff)+amt)},${Math.min(255,(n&0xff)+amt)})`; } catch(e){return hex;}
}

console.log('✅ matchLive.js v3 — engine ao vivo melhorada');
