// ============================================================
// FUTSAL MANAGER — UI CONTROLLER v5
// Integra: Áudio, Simulação Visual, Settings, Créditos novos
// Liga Portugal REMOVIDA
// ============================================================

class UI {
  constructor(gs) {
    this.gs = gs;
    this.currentScreen = 'menu';
    this.selectedPlayer = null;
    this.transferFilter = {position:'', minOvr:0, maxPrice:999999999};
    this.matchLog = [];
    this.matchPlaying = false;
    this.leagueTab = 'classif';
    this.finTab = 'resumo';
    this.trainingAssignments = {};
    this.matchViewMode = 'events'; // 'sim' | 'events'
    this._loadUISettings();
  }

  // ── UI SETTINGS ─────────────────────────────────────────────
  _loadUISettings() {
    try {
      const s = JSON.parse(localStorage.getItem('fm_ui') || '{}');
      this.uiScale = s.uiScale || 1;
    } catch(e) { this.uiScale = 1; }
    this._applyScale();
  }
  _saveUISettings() {
    try { localStorage.setItem('fm_ui', JSON.stringify({uiScale:this.uiScale})); } catch(e) {}
  }
  _applyScale() {
    document.documentElement.style.fontSize = (14 * this.uiScale) + 'px';
  }

  // ── MONEY FORMAT ────────────────────────────────────────────
  fmt(n) {
    if (!n || isNaN(n)) return 'R$0';
    const abs = Math.abs(n);
    if (abs >= 1000000) return 'R$' + (n/1000000).toFixed(abs>=10000000?0:1) + 'M';
    if (abs >= 1000)    return 'R$' + Math.round(n/1000) + 'K';
    return 'R$' + Math.round(n);
  }

  // ── TEAM LOGO ────────────────────────────────────────────────
  teamLogo(teamId, teamName, color, color2, size) {
    size = size || 40;
    const LOGOS = window.TEAM_LOGOS || {};
    const logo = LOGOS[teamId];
    const words = (teamName || '??').split(' ').filter(Boolean);
    const initials = words.length >= 2
      ? (words[0][0] + words[words.length-1][0]).toUpperCase()
      : (teamName || '??').substring(0,2).toUpperCase();
    const r = Math.max(4, Math.round(size * 0.18));
    const fs = Math.round(size * 0.32);
    const bg = color || '#1e3a55';
    const fg = color2 || '#fff';
    const fallbackStyle = `display:inline-flex;width:${size}px;height:${size}px;background:${bg};color:${fg};border-radius:${r}px;align-items:center;justify-content:center;font-family:'Barlow Condensed',sans-serif;font-weight:900;font-size:${fs}px;flex-shrink:0;letter-spacing:.02em`;
    if (logo) {
      return `<img src="${logo}" alt="${teamName||''}" class="team-logo-img"
        style="width:${size}px;height:${size}px;object-fit:contain;border-radius:${r}px;display:block;flex-shrink:0"
        onerror="this.style.display='none';if(this.nextElementSibling)this.nextElementSibling.style.display='inline-flex'">
        <span style="${fallbackStyle};display:none">${initials}</span>`;
    }
    return `<span style="${fallbackStyle}">${initials}</span>`;
  }

  // ── RENDER ───────────────────────────────────────────────────
  render(screen) {
    this.currentScreen = screen || this.currentScreen;
    const app = document.getElementById('app');
    if (!app) return;

    // Fade transition
    app.style.opacity = '0';
    app.style.transform = 'translateY(4px)';

    const doRender = () => {
      switch(this.currentScreen) {
        case 'menu':       app.innerHTML = this.renderMenu(); break;
        case 'newgame':    app.innerHTML = this.renderNewGame(); break;
        case 'dashboard':  app.innerHTML = this.renderDashboard(); break;
        case 'squad':      app.innerHTML = this.renderSquad(); break;
        case 'tactics':    app.innerHTML = this.renderTactics(); break;
        case 'match':      app.innerHTML = this.renderMatch(); break;
        case 'livematch':  app.innerHTML = this.renderLiveMatchScreen(); break;
        case 'transfers':  app.innerHTML = this.renderTransfers(); break;
        case 'league':     app.innerHTML = this.renderLeague(); break;
        case 'staff':      app.innerHTML = this.renderStaff(); break;
        case 'training':   app.innerHTML = this.renderTraining(); break;
        case 'finances':   app.innerHTML = this.renderFinances(); break;
        case 'credits':    app.innerHTML = this.renderCredits(); break;
        case 'settings':   app.innerHTML = this.renderSettings(); break;
        case 'calendar':   app.innerHTML = this.renderCalendar(); break;
        case 'trophy':     app.innerHTML = this.renderTrophy(); break;
        case 'worldcup':   app.innerHTML = this.renderWorldCup(); break;
      }
      this.attachEvents();
      // Animate in
      requestAnimationFrame(() => {
        app.style.transition = 'opacity .18s ease, transform .18s ease';
        app.style.opacity = '1';
        app.style.transform = 'translateY(0)';
      });
    };

    // Quick delay for transition
    setTimeout(doRender, 60);
  }

  // ── MENU ─────────────────────────────────────────────────────
  renderMenu() {
    // Music needs user gesture — start on first click
    // BGM já foi iniciada no clique do splash (gesto garantido).
    // Reconectar se usuário voltou ao menu e música parou.
    if (window.audio && window.BGM && !window.BGM.isPlaying() && window.audio._musicEnabled) {
      window.BGM.start();
    }
    const hasSave = localStorage.getItem('futsalmanager_save');
    const savedData = hasSave ? (() => { try { const d=JSON.parse(hasSave); return {team:d.teams?.[d.playerTeamId]?.name,season:d.season}; } catch(e){return null;} })() : null;

    return `<div class="screen-menu" style="min-height:100vh;display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden">

      <!-- Camadas de fundo animadas -->
      <div style="position:absolute;inset:0;background:radial-gradient(ellipse 120% 80% at 50% -20%,rgba(74,144,226,.1) 0%,transparent 60%),radial-gradient(ellipse 60% 60% at 80% 80%,rgba(40,200,86,.06) 0%,transparent 50%),radial-gradient(ellipse 40% 60% at 10% 70%,rgba(124,58,237,.05) 0%,transparent 50%);pointer-events:none"></div>
      <div class="menu-bg-grid" style="position:absolute;inset:0;pointer-events:none;opacity:.4"></div>

      <!-- Conteúdo central -->
      <div style="position:relative;z-index:1;width:100%;max-width:420px;padding:28px 20px;display:flex;flex-direction:column;gap:20px">

        <!-- Logo -->
        <div style="text-align:center;animation:fadeInDelay .5s ease both">
          <div style="position:relative;display:inline-flex;align-items:center;justify-content:center;width:80px;height:80px;margin-bottom:14px">
            <div style="position:absolute;inset:0;border-radius:50%;background:rgba(74,144,226,.12);border:2px solid rgba(74,144,226,.25);animation:pulse 3s infinite"></div>
            <span style="font-size:2.4rem;filter:drop-shadow(0 0 16px rgba(74,144,226,.5))">⚽</span>
          </div>
          <div style="font-family:'Barlow Condensed',sans-serif;font-size:3.2rem;font-weight:900;line-height:.85;letter-spacing:.04em">
            <span style="color:#f0f6ff">FUTSAL</span><br>
            <span style="color:var(--gold)">MANAGER</span>
          </div>
          <div style="font-size:10px;color:var(--text4);letter-spacing:.25em;text-transform:uppercase;margin-top:6px">Temporada 2026 · v11.0</div>
        </div>

        <!-- Botões principais -->
        <div style="display:flex;flex-direction:column;gap:10px;animation:fadeInDelay .6s .1s ease both">
          ${hasSave ? `
          <button data-action="loadgame" style="display:flex;align-items:center;gap:14px;padding:16px 20px;background:linear-gradient(135deg,rgba(40,200,86,.15),rgba(40,200,86,.06));border:1px solid rgba(40,200,86,.3);border-radius:14px;color:#e4edf6;cursor:pointer;transition:all .18s;text-align:left;width:100%" onmouseover="this.style.background='linear-gradient(135deg,rgba(40,200,86,.22),rgba(40,200,86,.1))'" onmouseout="this.style.background='linear-gradient(135deg,rgba(40,200,86,.15),rgba(40,200,86,.06))'">
            <div style="width:42px;height:42px;background:rgba(40,200,86,.2);border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:1.4rem;flex-shrink:0">▶</div>
            <div style="flex:1;min-width:0">
              <div style="font-family:'Barlow Condensed',sans-serif;font-size:1.1rem;font-weight:900;color:#28c856">Continuar</div>
              <div style="font-size:11px;color:var(--text3);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${savedData?.team||'Partida salva'}${savedData?.season?' · Temp. '+savedData.season:''}</div>
            </div>
            <div style="font-size:1.2rem;color:rgba(40,200,86,.5)">→</div>
          </button>` : ''}

          <button data-action="newgame" style="display:flex;align-items:center;gap:14px;padding:16px 20px;background:linear-gradient(135deg,rgba(74,144,226,.18),rgba(74,144,226,.07));border:1px solid rgba(74,144,226,.35);border-radius:14px;color:#e4edf6;cursor:pointer;transition:all .18s;text-align:left;width:100%" onmouseover="this.style.background='linear-gradient(135deg,rgba(74,144,226,.28),rgba(74,144,226,.12))'" onmouseout="this.style.background='linear-gradient(135deg,rgba(74,144,226,.18),rgba(74,144,226,.07))'">
            <div style="width:42px;height:42px;background:rgba(74,144,226,.2);border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:1.4rem;flex-shrink:0">🏆</div>
            <div style="flex:1">
              <div style="font-family:'Barlow Condensed',sans-serif;font-size:1.1rem;font-weight:900;color:#4a90e2">Novo Jogo</div>
              <div style="font-size:11px;color:var(--text3)">5 ligas · 35 clubes · 490+ jogadores reais</div>
            </div>
            <div style="font-size:1.2rem;color:rgba(74,144,226,.5)">→</div>
          </button>
        </div>

        <!-- Stats do jogo -->
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;animation:fadeInDelay .6s .2s ease both">
          ${[['⚽','Futsal real'],['📸','Fotos reais'],['🌍','Ranking'],['📅','Calendário']].map(([ic,lb])=>`
          <div style="background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.07);border-radius:10px;padding:10px 6px;text-align:center">
            <div style="font-size:1.3rem;margin-bottom:3px">${ic}</div>
            <div style="font-size:9px;color:var(--text4);letter-spacing:.04em;line-height:1.2">${lb}</div>
          </div>`).join('')}
        </div>

        <!-- Ligas -->
        <div style="display:flex;gap:6px;flex-wrap:wrap;justify-content:center;animation:fadeInDelay .6s .25s ease both">
          ${[['🇧🇷','BR'],['🇪🇸','ES'],['🏴󠁧󠁢󠁥󠁮󠁧󠁿','EN'],['🇮🇹','IT'],['🇵🇹','PT']].map(([f,n])=>`
          <div style="display:flex;align-items:center;gap:5px;padding:5px 10px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:20px;font-size:11px;color:var(--text3)">
            <span>${f}</span><span style="font-family:'Barlow Condensed',sans-serif;font-weight:700">${n}</span>
          </div>`).join('')}
        </div>

        <!-- Rodapé com botões secundários -->
        <div style="display:flex;gap:8px;animation:fadeInDelay .6s .3s ease both">
          <button data-action="settings" style="flex:1;padding:10px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:10px;color:var(--text3);font-size:12px;cursor:pointer;font-family:'Barlow Condensed',sans-serif;font-weight:700;letter-spacing:.05em;transition:all .15s" onmouseover="this.style.background='rgba(255,255,255,.08)'" onmouseout="this.style.background='rgba(255,255,255,.04)'">⚙️ Config</button>
          <button data-action="patchnotes" style="flex:1;padding:10px;background:rgba(240,200,74,.06);border:1px solid rgba(240,200,74,.2);border-radius:10px;color:var(--gold);font-size:12px;cursor:pointer;font-family:'Barlow Condensed',sans-serif;font-weight:700;letter-spacing:.05em;transition:all .15s" onmouseover="this.style.background='rgba(240,200,74,.12)'" onmouseout="this.style.background='rgba(240,200,74,.06)'">📋 v11.0</button>
          <button data-action="credits" style="flex:1;padding:10px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:10px;color:var(--text3);font-size:12px;cursor:pointer;font-family:'Barlow Condensed',sans-serif;font-weight:700;letter-spacing:.05em;transition:all .15s" onmouseover="this.style.background='rgba(255,255,255,.08)'" onmouseout="this.style.background='rgba(255,255,255,.04)'">ℹ️ Créditos</button>
        </div>

        <div style="text-align:center;font-size:9px;color:var(--text4);letter-spacing:.08em;animation:fadeInDelay .5s .4s ease both">
          Desenvolvido por <strong style="color:rgba(240,200,74,.6)">kauandev1</strong>
        </div>
      </div>
    </div>`;
  }
  // ── CREDITS ──────────────────────────────────────────────────
  renderCredits() {
    return `
    <div class="screen-credits">
      <div class="credits-wrap">
      <div class="credits-card">
        <div class="credits-hero">
          <span class="credits-ball">⚽</span>
          <div class="credits-title">Futsal Manager</div>
          <p class="credits-subtitle">Versão 6.0 · Temporada 2026</p>
        </div>
        <div class="credits-divider"></div>

        <div class="credits-section">
          <div class="credits-section-title">👨‍💻 Equipe</div>
          <div class="credits-row credits-row-dev">
            <span class="credits-row-icon">🏆</span>
            <div class="credits-row-info">
              <strong style="color:var(--gold);font-size:15px">kauandev1</strong>
              <span style="color:var(--text2)">Desenvolvedor Principal · Game Design · Visão do Produto</span>
              <span style="font-size:10px;color:var(--text3);margin-top:3px;display:block">Criador e diretor criativo do projeto</span>
            </div>
          </div>
          <div class="credits-row">
            <span class="credits-row-icon">🤖</span>
            <div class="credits-row-info">
              <strong style="color:var(--blue)">Claude — Anthropic</strong>
              <span style="color:var(--text3)">Menção especial · Assistência técnica de código</span>
              <span style="font-size:10px;color:var(--text4);margin-top:3px;display:block">IA utilizada como ferramenta de apoio ao desenvolvimento</span>
            </div>
          </div>
        </div>
        <div class="credits-divider"></div>

        <div class="credits-section">
          <div class="credits-section-title">🌍 Ligas Disponíveis</div>
          <div class="credits-leagues">
            <div class="credits-league-item"><span>🇧🇷</span><div><strong>Brasileirão</strong><div style="font-size:11px;color:var(--text3)">Série A · 8 clubes</div></div></div>
            <div class="credits-league-item"><span>🇪🇸</span><div><strong>LaLiga</strong><div style="font-size:11px;color:var(--text3)">EA Sports · 8 clubes</div></div></div>
            <div class="credits-league-item"><span>🏴󠁧󠁢󠁥󠁮󠁧󠁿</span><div><strong>Premier League</strong><div style="font-size:11px;color:var(--text3)">8 clubes</div></div></div>
            <div class="credits-league-item"><span>🇮🇹</span><div><strong>Serie A</strong><div style="font-size:11px;color:var(--text3)">Enilive · 8 clubes</div></div></div>
            <div class="credits-league-item"><span>🇵🇹</span><div><strong>Liga Portugal</strong><div style="font-size:11px;color:var(--text3)">Betclic · 3 clubes</div></div></div>
          </div>
        </div>

        <div class="credits-section">
          <div class="credits-section-title">🎮 Funcionalidades</div>
          <div class="credits-row"><span class="credits-row-icon">⚽</span><div class="credits-row-info"><strong>Motor de Partida Futsal</strong><span>Faltas acumuladas, goleiro-linha, 490+ jogadores reais</span></div></div>
          <div class="credits-row"><span class="credits-row-icon">🔄</span><div class="credits-row-info"><strong>Mercado de Transferências</strong><span>Compra, venda, negociação com IA</span></div></div>
          <div class="credits-row"><span class="credits-row-icon">🏋️</span><div class="credits-row-info"><strong>Centro de Treinamento</strong><span>Evolução semanal de atributos</span></div></div>
          <div class="credits-row"><span class="credits-row-icon">🤖</span><div class="credits-row-info"><strong>IA Adaptativa</strong><span>Táticas, compras e desenvolvimento automático</span></div></div>
          <div class="credits-row"><span class="credits-row-icon">💾</span><div class="credits-row-info"><strong>Auto-save</strong><span>Progresso salvo automaticamente toda semana</span></div></div>
        </div>

        <div class="credits-section">
          <div class="credits-section-title">⚙️ Tecnologia</div>
          <div class="credits-row"><span class="credits-row-icon">🔊</span><div class="credits-row-info"><strong>Áudio procedural + Spotify</strong><span>Web Audio API + trilha integrada</span></div></div>
          <div class="credits-row"><span class="credits-row-icon">🖥️</span><div class="credits-row-info"><strong>JavaScript puro</strong><span>Sem backend, sem dependências — roda direto no browser</span></div></div>
          <div class="credits-row"><span class="credits-row-icon">📸</span><div class="credits-row-info"><strong>Fotos via Sofascore · Escudos via ESPN CDN</strong><span>Dados atualizados 2026</span></div></div>
        </div>

        <div class="credits-divider"></div>
        <div class="credits-version">Futsal Manager v6.0 · by kauandev1 · 2026</div>
        <button class="btn btn-ghost" style="margin-top:18px;width:100%;justify-content:center" data-action="menu">← Voltar ao Menu</button>
      </div>
      </div>
    </div>`;
  }

  // ── SETTINGS ─────────────────────────────────────────────────
  renderCalendar() {
    const gs = this.gs;
    const team = gs.getPlayerTeam();
    const lid = team?.league;
    const schedule = gs.schedules?.[lid] || [];
    const weeks = {};
    schedule.forEach(m => { if (!weeks[m.week]) weeks[m.week] = []; weeks[m.week].push(m); });
    const current = gs.currentWeek;

    const weekRows = Object.keys(weeks).map(Number).sort((a,b)=>a-b).map(wk => {
      const matches = weeks[wk];
      const isPast = wk < current, isCurrent = wk === current, isFuture = wk > current;
      const canSkip = isFuture && wk > current && !gs.endOfSeason;

      const matchRows = matches.map(m => {
        const ht = gs.teams[m.home], at = gs.teams[m.away];
        const isP = m.home===gs.playerTeamId||m.away===gs.playerTeamId;
        const r = m.result?.score;
        const myS = m.home===gs.playerTeamId?r?.home:r?.away;
        const thS = m.home===gs.playerTeamId?r?.away:r?.home;
        const won = r&&m.played&&myS>thS, lost = r&&m.played&&myS<thS;
        return `<div style="display:flex;align-items:center;gap:8px;padding:5px 8px;border-radius:6px;background:${isP?'rgba(240,200,74,.06)':'rgba(255,255,255,.02)'};border:1px solid ${isP?'rgba(240,200,74,.15)':'transparent'};font-size:12px;margin-bottom:3px">
          <span style="flex:1;text-align:right;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;display:inline-flex;align-items:center;gap:5px;justify-content:flex-end">
            ${this.teamLogo(m.home,ht?.name,ht?.color,ht?.color2,14)}<span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${ht?.name||'?'}</span>
          </span>
          <span style="font-family:'Barlow Condensed',sans-serif;font-size:13px;font-weight:900;min-width:40px;text-align:center;padding:2px 5px;border-radius:5px;background:var(--bg4);color:${won?'var(--green)':lost?'var(--red)':r&&m.played?'var(--gold)':'var(--text4)'}">
            ${r&&m.played?r.home+'–'+r.away:'–'}
          </span>
          <span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;display:inline-flex;align-items:center;gap:5px">
            ${this.teamLogo(m.away,at?.name,at?.color,at?.color2,14)}<span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${at?.name||'?'}</span>
          </span>
          ${isP&&!m.played?`<button class="btn-sm btn-play" data-action="playmatch" data-matchid="${m.id}" data-leagueid="${lid}" style="flex-shrink:0;padding:4px 8px">▶</button>`:''}
        </div>`;
      }).join('');

      return `<div style="border:2px solid ${isCurrent?'rgba(240,200,74,.5)':isPast?'rgba(255,255,255,.05)':'rgba(255,255,255,.1)'};border-radius:12px;overflow:hidden;${isPast?'opacity:.6':''}">
        <div style="display:flex;align-items:center;gap:10px;padding:9px 14px;background:${isCurrent?'rgba(240,200,74,.07)':'rgba(255,255,255,.02)'}">
          <span style="font-family:'Barlow Condensed',sans-serif;font-weight:900;font-size:1rem;color:${isCurrent?'var(--gold)':'var(--text2)'}">
            Rod. ${wk} ${isCurrent?'<span style="font-size:9px;background:rgba(240,200,74,.18);color:var(--gold);padding:2px 7px;border-radius:4px;margin-left:4px">ATUAL</span>':''}
          </span>
          <span style="flex:1;font-size:10px;color:var(--text4)">${matches.length} jogo${matches.length!==1?'s':''}</span>
          ${canSkip?`<button class="btn-sm btn-ghost" data-action="skip-to-week" data-week="${wk}" style="font-size:11px">⏭ Ir para Rod. ${wk}</button>`:''}
          ${isPast&&!isCurrent?'<span style="font-size:10px;color:var(--text4)">✓</span>':''}
        </div>
        <div style="padding:6px 10px 8px">${matchRows}</div>
      </div>`;
    }).join('\n');

    return `
    <div class="screen-game">
      ${this.renderNavbar(team)}
      <div class="game-content">
        <div class="screen-header-inner">
          <h2>📅 Calendário T${gs.season}</h2>
          <p>Rod. ${current}/${gs.totalWeeks} · Clique em "Ir para Rod." para avançar direto</p>
        </div>
        <div style="display:grid;gap:8px;max-width:680px;margin:0 auto">
          ${weekRows||'<p class="empty-msg">Nenhum jogo agendado.</p>'}
        </div>
      </div>
    </div>`;
  }

  renderSettings() {
    const a = window.audio;
    const mv = a ? Math.round(a.musicVolume * 100) : 40;
    const sv = a ? Math.round(a.sfxVolume * 100) : 70;
    const musOn = a ? a.musicEnabled : true;
    const sfxOn = a ? a.sfxEnabled : true;
    const scales = [0.85, 1, 1.1, 1.2];
    const scaleLabels = ['Pequeno','Normal','Grande','Extra'];

    return `
    <div class="screen-settings">
      <div class="settings-header">
        <button class="btn-back" data-action="back-settings">← Voltar</button>
        <h2>⚙️ Configurações</h2>
        <button class="btn btn-ghost btn-sm" data-action="patchnotes" style="margin-left:auto">📋 Patch Notes</button>
      </div>

      <div class="settings-card">
        <h3>🔊 Áudio</h3>
        <div class="setting-row">
          <div class="setting-label">
            <strong>🎵 Música de fundo (Procedural)</strong>
            <span>BGM gerada em tempo real — Menu Theme + Copa Theme</span>
          </div>
          <div class="setting-control">
            <label class="toggle-wrap ${musOn?'on':''}" id="toggle-music-wrap">
              <input type="checkbox" class="toggle-input" id="toggle-music" ${musOn?'checked':''}>
              <div class="toggle-track"></div>
            </label>
          </div>
        </div>
        <div class="setting-row">
          <div class="setting-label">
            <strong>Efeitos sonoros</strong>
            <span>Sons de botões, gols, apitos, etc.</span>
          </div>
          <div class="setting-control">
            <label class="toggle-wrap ${sfxOn?'on':''}" id="toggle-sfx-wrap">
              <input type="checkbox" class="toggle-input" id="toggle-sfx" ${sfxOn?'checked':''}>
              <div class="toggle-track"></div>
            </label>
          </div>
        </div>
        <div class="setting-row">
          <div class="setting-label">
            <strong>Volume da música</strong>
            <span>${mv}%</span>
          </div>
          <div class="setting-control">
            <input type="range" class="vol-slider" id="vol-music" min="0" max="100" value="${mv}">
          </div>
        </div>
        <div class="setting-row">
          <div class="setting-label">
            <strong>Volume dos efeitos</strong>
            <span>${sv}%</span>
          </div>
          <div class="setting-control">
            <input type="range" class="vol-slider" id="vol-sfx" min="0" max="100" value="${sv}">
          </div>
        </div>
      </div>

      <div class="settings-card">
        <h3>🖥️ Interface</h3>
        <div class="setting-row">
          <div class="setting-label">
            <strong>Escala da interface</strong>
            <span>Ajusta o tamanho geral dos elementos</span>
          </div>
          <div class="setting-control">
            <div class="scale-btns">
              ${scales.map((s,i)=>`<button class="scale-btn ${Math.abs(this.uiScale-s)<0.05?'active':''}" data-action="setscale" data-val="${s}">${scaleLabels[i]}</button>`).join('')}
            </div>
          </div>
        </div>
        <div class="setting-row">
          <div class="setting-label">
            <strong>Tela cheia</strong>
            <span>Alterna modo fullscreen</span>
          </div>
          <div class="setting-control">
            <button class="btn btn-ghost btn-sm" data-action="togglefullscreen">⛶ Alternar</button>
          </div>
        </div>
      </div>

      <div class="settings-card">
        <h3>🎮 Jogo</h3>
        <div class="setting-row">
          <div class="setting-label">
            <strong>Remover música completamente</strong>
            <span>Desativa e remove músicas (efeitos continuam)</span>
          </div>
          <div class="setting-control">
            <button class="btn btn-danger btn-sm" data-action="killmusic">🔇 Remover</button>
          </div>
        </div>
        <div class="setting-row">
          <div class="setting-label"><strong>Auto-save</strong><span>Salva automaticamente ao avançar semana</span></div>
          <div class="setting-control">
            <label class="toggle-wrap ${this._getAutoSave()?'on':''}" id="toggle-autosave-wrap">
              <input type="checkbox" class="toggle-input" id="toggle-autosave" ${this._getAutoSave()?'checked':''}>
              <div class="toggle-track"></div>
            </label>
          </div>
        </div>
        <div class="setting-row">
          <div class="setting-label"><strong>Salvar agora</strong><span>Salvar progresso manualmente</span></div>
          <div class="setting-control"><button class="btn btn-primary btn-sm" data-action="save">💾 Salvar</button></div>
        </div>
        <div class="setting-row">
          <div class="setting-label">
            <strong>Apagar save</strong>
            <span>Reseta o progresso salvo</span>
          </div>
          <div class="setting-control">
            <button class="btn btn-danger btn-sm" data-action="deletesave">🗑️ Apagar</button>
          </div>
        </div>
      </div>

      <div class="settings-card">
        <h3>📋 Atualizações</h3>
        <div class="setting-row">
          <div class="setting-label"><strong>Patch Notes v6.0</strong><span>Ver o que há de novo</span></div>
          <div class="setting-control"><button class="btn btn-ghost btn-sm" data-action="patchnotes">📋 Ver</button></div>
        </div>
        <div class="setting-row">
          <div class="setting-label"><strong>Créditos</strong><span>Equipe e tecnologia</span></div>
          <div class="setting-control"><button class="btn btn-ghost btn-sm" data-action="credits">👥 Ver</button></div>
        </div>
      </div>
    </div>`;
  }

  // ── NEW GAME ─────────────────────────────────────────────────
  renderNewGame() {
    const leagueGroups = {};
    window.TEAMS_DATA.forEach(t => {
      if (!leagueGroups[t.league]) leagueGroups[t.league] = [];
      leagueGroups[t.league].push(t);
    });
    const leagueNames = {
      laliga:      `${this.leagueFlag('laliga',20)} LaLiga EA Sports`,
      premier:     `${this.leagueFlag('premier',20)} Premier League`,
      seriea:      `${this.leagueFlag('seriea',20)} Serie A Enilive`,
      brasileirao: `${this.leagueFlag('brasileirao',20)} Brasileirão Série A`,
      lpf:         `${this.leagueFlag('lpf',20)} Liga Portugal Betclic`,
    };
    return `
    <div class="screen-newgame">
      <div class="screen-header">
        <button class="btn-back" data-action="menu">← Voltar</button>
        <h2>⚽ Escolha seu Time</h2>
      </div>
      <div class="leagues-grid">
        ${Object.entries(leagueGroups).map(([lid, teams]) => `
          <div class="league-section">
            <div class="league-title">${leagueNames[lid]||lid}</div>
            <div class="teams-grid">
              ${teams.map(t => `
                <div class="team-card" data-action="selectteam" data-teamid="${t.id}" style="--team-color:${t.color}">
                  <div class="team-card-badge" style="background:${t.color}">${this.teamLogo(t.id, t.name, t.color, t.color2, 40)}</div>
                  <div class="team-info">
                    <div class="team-name">${t.name}</div>
                    <div class="team-city">${t.city} ${this.leagueFlag(t.league)}</div>
                    <div class="team-meta">
                      <span class="rep-stars">${'★'.repeat(Math.round(t.reputation/20))}${'☆'.repeat(5-Math.round(t.reputation/20))}</span>
                      <span class="team-budget-tag">${this.fmt(t.budget)}</span>
                    </div>
                  </div>
                </div>`).join('')}
            </div>
          </div>`).join('')}
      </div>
    </div>`;
  }

  // ── DASHBOARD ────────────────────────────────────────────────
  renderDashboard() {
    const gs = this.gs;
    const team = gs.getPlayerTeam();
    if (!team) return '<p style="padding:40px;color:#888">Erro: time não encontrado</p>';
    const players   = gs.getPlayerPlayers().filter(p=>!p.retired);
    const avgOvr    = players.length > 0 ? Math.round(players.reduce((a,p)=>a+p.overall,0)/players.length) : 0;
    const standing  = team.standing;
    const leagueSt  = gs.getLeagueStandings(team.league);
    const myPos     = leagueSt.findIndex(t => t.id === gs.playerTeamId) + 1;
    const morale    = players.length > 0 ? Math.round(players.reduce((a,p)=>a+(p.morale||75),0)/players.length) : 75;
    const fitness   = players.length > 0 ? Math.round(players.reduce((a,p)=>a+(p.fitness||85),0)/players.length) : 85;
    const recentNews = gs.news.slice(0,5);
    const roundMatches  = this._getCurrentRoundMatches();
    const playerMatch   = roundMatches.find(m => m.home === gs.playerTeamId || m.away === gs.playerTeamId);
    const nextOpponent  = playerMatch&&!playerMatch.played ? gs.teams[playerMatch.home===gs.playerTeamId?playerMatch.away:playerMatch.home] : null;

    return `
    <div class="screen-game">
      ${this.renderNavbar(team)}
      <div class="game-content">
        <div class="dashboard-grid">

          <!-- Clube -->
          <div class="dash-card club-card">
            <div class="club-header" style="--team-color:${team.color}">
              <div class="club-badge-lg" style="background:${team.color};color:${team.color2}">${this.teamLogo(team.id, team.name, team.color, team.color2, 58)}</div>
              <div class="club-header-info">
                <h2>${team.name}</h2>
                <p>${team.city}, ${team.country}</p>
                <div class="stadium-info">🏟️ ${team.stadium} <span style="color:var(--text4)">(${team.capacity.toLocaleString()} lug.)</span></div>
              </div>
            </div>
            <div class="club-stats-row">
              <div class="cstat"><span class="cstat-val">${this.fmt(gs.budget)}</span><span class="cstat-lab">Orçamento</span></div>
              <div class="cstat"><span class="cstat-val">${myPos}º</span><span class="cstat-lab">Posição</span></div>
              <div class="cstat"><span class="cstat-val">${standing.pts}</span><span class="cstat-lab">Pontos</span></div>
              <div class="cstat"><span class="cstat-val">${standing.w}V ${standing.d}E ${standing.l}D</span><span class="cstat-lab">Campanha</span></div>
              <div class="cstat"><span class="cstat-val">${avgOvr}</span><span class="cstat-lab">Média OVR</span></div>
            </div>
            <div class="club-bars">
              <div class="bar-row"><span>Moral</span><div class="bar"><div class="bar-fill" style="width:${morale}%;background:${morale>70?'var(--green)':'var(--orange)'}"></div></div><span>${morale}</span></div>
              <div class="bar-row"><span>Físico</span><div class="bar"><div class="bar-fill" style="width:${fitness}%;background:${fitness>75?'var(--blue)':'var(--orange)'}"></div></div><span>${fitness}</span></div>
            </div>
            <div class="form-row">Forma: ${(team.form||[]).slice(0,5).map(f=>`<span class="form-badge form-${f.toLowerCase()}">${f}</span>`).join('') || '<span class="form-badge form-d">-</span>'}</div>
          </div>

          <!-- Rodada -->
          <div class="dash-card">
            ${this._renderRoundBox(roundMatches, playerMatch)}
          </div>

          <!-- Notícias -->
          <div class="dash-card">
            <div class="card-title">📰 Notícias</div>
            <div class="news-list">
              ${recentNews.map(n => {
                const icons = {transferencia:'🔄',resultado:'⚽',artilharia:'👟',posicao:'📊',alerta:'⚠️',proposta:'🔔',staff:'👔',geral:'📰',torneio:'🏆',ranking:'🌍',patrocinio:'🤝',lesao:'🤕',suspensao:'🚫',aposentadoria:'🎖️'};
                const clrs  = {transferencia:'var(--blue)',resultado:'var(--green)',artilharia:'var(--gold)',posicao:'var(--blue)',alerta:'var(--red)',proposta:'var(--gold)'};
                return `<div class="news-item" style="border-left-color:${clrs[n.type]||'var(--border)'}">
                  <div class="news-header"><span class="news-icon">${icons[n.type]||'📰'}</span><span class="news-date">${n.date}</span></div>
                  <span class="news-text">${n.text}</span>
                </div>`;
              }).join('')}
            </div>
          </div>

          <!-- Classificação -->
          <div class="dash-card">
            <div class="card-title">🏆 ${gs.leagues[team.league]?.name||'Liga'}</div>
            <div style="overflow-x:auto">
            <table class="standings-table">
              <thead><tr><th>#</th><th style="text-align:left">Time</th><th>J</th><th>V</th><th>D</th><th>GD</th><th>Pts</th><th></th></tr></thead>
              <tbody>
                ${leagueSt.map((t,i) => `
                  <tr class="${t.id===gs.playerTeamId?'my-team':''} ${i<2?'zone-champions':i===leagueSt.length-1?'zone-relegation':''}">
                    <td class="rank-cell">${i===0?'🥇':i===1?'🥈':i===2?'🥉':(i+1)}</td>
                    <td><span style="display:inline-flex;align-items:center;gap:5px;vertical-align:middle">${this.teamLogo(t.id,t.name,t.color,t.color2,18)}<span>${t.name}</span></span></td>
                    <td>${t.standing.played}</td>
                    <td class="col-win">${t.standing.w}</td>
                    <td class="col-loss">${t.standing.l}</td>
                    <td class="${t.standing.gd>0?'col-win':t.standing.gd<0?'col-loss':''}">${t.standing.gd>0?'+':''}${t.standing.gd}</td>
                    <td class="pts-cell"><strong>${t.standing.pts}</strong></td>
                    <td><button class="btn-sm btn-ghost" style="font-size:10px;padding:2px 5px" onclick="if(window.CareerTeamViewer&&window.gameState)window.CareerTeamViewer.renderTeamSquadModal(window.gameState,'${t.id}')">👥</button></td>
                  </tr>`).join('')}
              </tbody>
            </table>
            </div>
            <div style="font-size:10px;color:var(--text4);margin-top:6px;padding:4px 2px;display:flex;align-items:center;gap:4px">
              <span style="width:8px;height:8px;border-radius:2px;background:#1e5a2a;display:inline-block"></span> Top 2 → Copa do Mundo
            </div>
          </div>

          ${gs.worldCup ? `
          <!-- Copa do Mundo Widget -->
          <div class="dash-card" style="border-color:rgba(240,200,74,.25);background:linear-gradient(135deg,var(--bg2),rgba(240,200,74,.04))">
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">
              <span style="font-size:1.5rem">🌍</span>
              <div>
                <div style="font-family:'Barlow Condensed',sans-serif;font-size:.85rem;font-weight:800;color:#f0c84a;letter-spacing:.1em;text-transform:uppercase">Copa do Mundo ${gs.worldCup.season}</div>
                <div style="font-size:11px;color:var(--text3)">${{quarterfinals:'⚡ Quartas de Final',semifinals:'🔥 Semifinais',final:'🏆 Grande Final',done:'✅ Encerrada'}[gs.worldCup.phase]||''}</div>
              </div>
            </div>
            ${gs.worldCup.playerQualified && !gs.worldCup.playerEliminated && gs.worldCup.phase !== 'done' ?
              `<div style="font-size:12px;color:#28c856;font-weight:700;margin-bottom:8px">✓ Seu time está na copa!</div>` :
              gs.worldCup.champion === gs.playerTeamId ?
              `<div style="font-size:12px;color:#f0c84a;font-weight:700;margin-bottom:8px">🏆 CAMPEÃO MUNDIAL!</div>` : ''
            }
            <button class="btn btn-primary btn-sm" data-action="worldcup" style="width:100%;justify-content:center;background:linear-gradient(135deg,#c9890a,#f0c84a);color:#000;font-weight:900">Ver Copa →</button>
          </div>` : ''}
        </div>
      </div>
    </div>`;
  }

  // Round box
  _getCurrentRoundMatches() {
    const gs = this.gs;
    const team = gs.getPlayerTeam();
    if (!team) return [];
    return (gs.schedules[team.league] || []).filter(m => m.week === gs.currentWeek);
  }

  _renderMatchPreviewBadge(m, gs) {
    if (!m) return '';
    const ht = gs.teams[m.home], at = gs.teams[m.away];
    if (!ht || !at) return '';
    const hp = gs.getTeamPlayers(m.home).filter(p=>!p.injured&&!p.retired);
    const ap = gs.getTeamPlayers(m.away).filter(p=>!p.injured&&!p.retired);
    const hOvr = hp.length ? Math.round(hp.reduce((a,p)=>a+(p.overall||65),0)/hp.length) : 65;
    const aOvr = ap.length ? Math.round(ap.reduce((a,p)=>a+(p.overall||65),0)/ap.length) : 65;
    const hStr = hOvr + 3; // home advantage
    const tot = hStr + aOvr;
    const hWin = Math.round((hStr/tot)*70);
    const aWin = 70 - hWin;
    const hForm = (ht.form||[]).slice(0,3).map(f=>f==='W'?'🟢':f==='D'?'🟡':'🔴').join('');
    const aForm = (at.form||[]).slice(0,3).map(f=>f==='W'?'🟢':f==='D'?'🟡':'🔴').join('');
    const isPlayerHome = m.home === gs.playerTeamId;
    return `<div style="display:flex;align-items:center;gap:6px;margin-top:8px;padding:6px 8px;background:rgba(255,255,255,.03);border-radius:7px;font-size:11px;color:var(--text3)">
      <span style="color:${hOvr>=78?'#f0c84a':hOvr>=70?'#28c856':'var(--text3)'};">${hOvr}⭐ ${hForm}</span>
      <div style="flex:1;height:4px;background:var(--bg4);border-radius:4px;overflow:hidden;display:flex">
        <div style="width:${hWin}%;background:${isPlayerHome?'#28c856':'#4a90e2'};border-radius:4px 0 0 4px"></div>
        <div style="width:${aWin}%;background:${!isPlayerHome?'#28c856':'#4a90e2'};border-radius:0 4px 4px 0"></div>
      </div>
      <span style="color:${aOvr>=78?'#f0c84a':aOvr>=70?'#28c856':'var(--text3)'};">${aForm} ${aOvr}⭐</span>
    </div>`;
  }

  _renderRoundBox(roundMatches, playerMatch) {
    const gs = this.gs;
    const team = gs.getPlayerTeam();
    return `
    <div class="round-title">
      📅 Rodada ${gs.currentWeek}
      <span style="font-size:11px;color:var(--text3);font-weight:400;letter-spacing:0;font-family:'Inter Tight',sans-serif">${roundMatches.filter(m=>m.played).length}/${roundMatches.length} jogos</span>
    </div>
    <div class="round-matches">
      ${roundMatches.map(m => {
        const ht = gs.teams[m.home], at = gs.teams[m.away];
        const isMyMatch = m.home === gs.playerTeamId || m.away === gs.playerTeamId;
        const r = m.result?.score;
        const homeWon = r && r.home > r.away;
        const awayWon = r && r.away > r.home;
        return `<div class="round-match-row ${isMyMatch?'my-match':''} ${m.played?'played':''}">
          <span class="rmr-home ${homeWon?'winner-name':''}"><span style="display:inline-flex;align-items:center;gap:4px;justify-content:flex-end">${this.teamLogo(m.home,ht?.name,ht?.color,ht?.color2,15)}<span>${ht?.name||'?'}</span></span></span>
          <span class="rmr-score ${m.played?'':'tbd'}">${m.played?`${r.home}–${r.away}`:'vs'}</span>
          <span class="rmr-away ${awayWon?'winner-name':''}"><span style="display:inline-flex;align-items:center;gap:4px">${this.teamLogo(m.away,at?.name,at?.color,at?.color2,15)}<span>${at?.name||'?'}</span></span></span>
          <span>${isMyMatch && !m.played
            ? `<button class="btn-sm btn-play" data-action="playmatch" data-matchid="${m.id}" data-leagueid="${team.league}">▶ Jogar</button>`
            : !m.played ? `<span style="font-size:10px;color:var(--text3)">—</span>` : ''}</span>
        </div>`;
      }).join('')}
    </div>
    <div style="display:flex;gap:7px;margin-top:10px;flex-wrap:wrap">
      ${playerMatch && !playerMatch.played
        ? `<button class="btn btn-ghost btn-sm" data-action="simplayermatch">⚡ Simular meu jogo</button>` : ''}
      <button class="btn btn-secondary btn-sm" data-action="nextweek">⏭ Avançar Rodada</button>
    </div>`;
  }

  // ── SQUAD ────────────────────────────────────────────────────
  renderSquad() {
    const gs = this.gs;
    const team = gs.getPlayerTeam();
    const players = gs.getPlayerPlayers().filter(p=>!p.retired).sort((a,b) => b.overall - a.overall);
    const sqIds = new Set(gs.squad);
    const posColors = {GL:'#e67e22',FIX:'#2980b9',ALA:'#27ae60','PÍV':'#c0392b'};
    return `
    <div class="screen-game">
      ${this.renderNavbar(team)}
      <div class="game-content">
        <div class="screen-header-inner">
          <h2>👥 Elenco — ${team?.name}</h2>
          <p>${players.length} jogadores · Titulares: ${gs.squad.filter(Boolean).length}/5</p>
        </div>
        <div class="squad-layout">
          <div class="players-table-wrap">
            <table class="players-table">
              <thead>
                <tr><th>★</th><th colspan="2">Nome</th><th>Pos</th><th>Nac</th><th>Idade</th><th>OVR</th><th>POT</th><th>Valor</th><th>Salário</th><th>Físico</th><th>Ação</th></tr>
              </thead>
              <tbody>
                ${players.map(p => {
                  const isTitular = sqIds.has(p.id);
                  const photo = window.playerPhotoHTML ? window.playerPhotoHTML(p.name, 32, p.position, posColors[p.position]) : '';
                  return `<tr class="${isTitular?'row-titular':''} ${p.injured?'row-injured':''}" data-action="viewplayer" data-pid="${p.id}" style="cursor:pointer">
                    <td>${isTitular?'⭐':''}</td>
                    <td style="padding:4px 2px"><div class="player-photo-mini">${photo}</div></td>
                    <td><span style="display:inline-flex;align-items:center;gap:8px">${(()=>{const _pc={GL:'#e67e22',FIX:'#2980b9',ALA:'#27ae60','PÍV':'#c0392b'};return window.playerPhotoHTML?window.playerPhotoHTML(p.name,30,p.position,_pc[p.position]||'#555'):'';})()}<strong>${p.name}</strong>${p.injured?'<span class="badge-injured">🤕</span>':''}</span></td>
                    <td><span class="pos-badge" style="background:${posColors[p.position]||'#555'}">${p.position}</span></td>
                    <td title="${p.nationality}">${this.natFlag(p.nationality)}</td>
                    <td>${p.age}</td>
                    <td class="ovr-cell"><strong>${p.overall}</strong></td>
                    <td class="pot-cell">${p.potential}</td>
                    <td>${this.fmt(p.value)}</td>
                    <td class="text-muted">${this.fmt(p.salary)}/mês</td>
                    <td><div class="mini-bar"><div class="mini-bar-fill" style="width:${p.fitness||85}%;background:${(p.fitness||85)>75?'var(--blue)':'var(--orange)'}"></div></div></td>
                    <td>${isTitular
                      ? `<button class="btn-sm btn-danger" data-action="removetitular" data-pid="${p.id}">−</button>`
                      : `<button class="btn-sm btn-primary" data-action="addtitular" data-pid="${p.id}" ${gs.squad.filter(Boolean).length>=5?'disabled':''}>+ Titular</button>`}</td>
                  </tr>`;
                }).join('')}
              </tbody>
            </table>
          </div>
          ${this.selectedPlayer ? this.renderPlayerDetail(this.selectedPlayer) : `<div class="player-detail-placeholder"><div style="font-size:36px;margin-bottom:12px">👤</div><p>Clique em um jogador para ver detalhes</p></div>`}
        </div>
      </div>
    </div>`;
  }

  renderPlayerDetail(p) {
    const a = p.attrs || {};
    const bar = (label, val) => `<div class="attr-row"><span>${label}</span><div class="attr-bar"><div class="attr-fill" style="width:${val}%;background:${val>=80?'var(--green)':val>=65?'var(--gold)':'var(--red)'}"></div></div><span class="attr-val">${val}</span></div>`;
    const posColors = {GL:'#e67e22',FIX:'#2980b9',ALA:'#27ae60','PÍV':'#c0392b'};
    const photo = window.playerPhotoHTML ? window.playerPhotoHTML(p.name, 80, p.position, posColors[p.position]) : '';
    const gs = this.gs;
    const potGap = (p.potential||p.overall) - p.overall;
    const ageColor = p.age>=35?'var(--red)':p.age>=30?'var(--orange)':'var(--green)';
    const injStatus = window.CareerInjuries?.getStatusBadge?.(p)||'';
    const suspStatus = window.CareerSuspensions?.isSuspended?.(p)?'<span style="background:rgba(155,89,182,.2);color:#a855f7;font-size:10px;padding:2px 7px;border-radius:4px;font-weight:700">🚫 Suspenso</span>':'';
    return `
    <div class="player-detail">
      <div class="pd-header" style="display:flex;align-items:center;gap:14px;margin-bottom:14px">
        ${photo}
        <div style="flex:1;min-width:0">
          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:4px">
            <span class="pd-badge" style="background:${posColors[p.position]||'#555'};color:#fff;padding:3px 10px;border-radius:6px;font-size:12px;font-weight:800">${p.position}</span>
            ${injStatus}${suspStatus}
          </div>
          <h3 style="font-size:1rem;font-weight:800;margin:0 0 3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${p.name}</h3>
          <p style="font-size:11px;color:var(--text3);margin:0">${this.natFlag(p.nationality)} ${p.nationality} · <span style="color:${ageColor}">${p.age}a</span></p>
          ${p.value?`<p style="font-size:11px;color:var(--gold);margin:2px 0 0">💰 ${this.fmt(p.value)}</p>`:''}
        </div>
        <div style="text-align:center;flex-shrink:0">
          <div class="pd-ovr" style="font-size:1.8rem">${p.overall}</div>
          ${potGap>0?`<div style="font-size:10px;color:#28c856;font-weight:700">▲${potGap} POT</div>`:''}
        </div>
      </div>
      <!-- Barra de potencial -->
      ${p.potential&&p.potential>p.overall?`
      <div style="margin-bottom:12px">
        <div style="display:flex;justify-content:space-between;font-size:10px;color:var(--text4);margin-bottom:3px"><span>OVR ${p.overall}</span><span>POT ${p.potential}</span></div>
        <div style="background:rgba(255,255,255,.06);border-radius:20px;height:5px;overflow:hidden">
          <div style="height:100%;width:${Math.round((p.overall/p.potential)*100)}%;background:linear-gradient(90deg,#4a90e2,#28c856);border-radius:20px"></div>
        </div>
      </div>`:''}
      <div class="pd-stats">
        <div class="pd-stat"><span>Gols</span><strong>${p.goals||0}</strong></div>
        <div class="pd-stat"><span>Assist</span><strong>${p.assists||0}</strong></div>
        <div class="pd-stat"><span>Jogos</span><strong>${p.appearances||0}</strong></div>
        <div class="pd-stat"><span>🟨</span><strong>${p.yellowCards||0}</strong></div>
      </div>
      <div class="pd-tabs">
        <div class="attr-group"><h4>⚽ Técnico</h4>${bar('Final.',a.finalizacao||0)}${bar('Passe',a.passe||0)}${bar('Drible',a.drible||0)}${bar('Controle',a.controle||0)}</div>
        <div class="attr-group"><h4>🛡️ Defensivo</h4>${bar('Marcação',a.marcacao||0)}${bar('Intercept.',a.interceptacao||0)}${bar('Desarme',a.desarme||0)}${bar('Posic.',a.posicionamento||0)}</div>
        <div class="attr-group"><h4>💪 Físico</h4>${bar('Velocidade',a.velocidade||0)}${bar('Resistência',a.resistencia||0)}${bar('Força',a.forca||0)}${bar('Agilidade',a.agilidade||0)}</div>
        <div class="attr-group"><h4>🧠 Mental</h4>${bar('Decisões',a.decisoes||0)}${bar('Visão',a.visao||0)}${bar('Liderança',a.lideranca||0)}${bar('Conc.',a.concentracao||0)}</div>
        ${p.position==='GL'?`<div class="attr-group"><h4>🧤 Goleiro</h4>${bar('Reflexos',a.reflexos||0)}${bar('Defesa GK',a.defesaGK||0)}</div>`:''}
      </div>
      <div class="pd-morale" style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:10px">
        <div style="background:var(--bg3);border-radius:7px;padding:6px 10px;display:flex;align-items:center;justify-content:space-between">
          <span style="font-size:10px;color:var(--text4)">Moral</span>
          <strong style="color:${(p.morale||75)>=80?'var(--green)':(p.morale||75)>=60?'var(--gold)':'var(--red)'}">${p.morale||75}</strong>
        </div>
        <div style="background:var(--bg3);border-radius:7px;padding:6px 10px;display:flex;align-items:center;justify-content:space-between">
          <span style="font-size:10px;color:var(--text4)">Físico</span>
          <strong style="color:${(p.fitness||85)>=80?'var(--blue)':(p.fitness||85)>=65?'var(--gold)':'var(--red)'}">${p.fitness||85}</strong>
        </div>
        <div style="background:var(--bg3);border-radius:7px;padding:6px 10px;display:flex;align-items:center;justify-content:space-between">
          <span style="font-size:10px;color:var(--text4)">Contrato</span>
          <strong style="color:${(p.contractYears||0)<=1?'var(--red)':'var(--text2)'}">${p.contractYears||0}a</strong>
        </div>
        <div style="background:var(--bg3);border-radius:7px;padding:6px 10px;display:flex;align-items:center;justify-content:space-between">
          <span style="font-size:10px;color:var(--text4)">Salário</span>
          <strong style="font-size:10px;color:var(--gold)">${this.fmt(p.salary||0)}</strong>
        </div>
        ${p.onTransferList?'<div style="grid-column:1/-1;background:rgba(74,144,226,.1);border-radius:7px;padding:5px 10px;text-align:center;font-size:11px;color:#4a90e2;font-weight:700">📋 Na lista de transferências</div>':''}
      </div>
    </div>`;
  }

  // ── TACTICS ──────────────────────────────────────────────────
  renderTactics() {
    const gs = this.gs;
    const team = gs.getPlayerTeam();
    const t = gs.tactics;
    gs.squad = (gs.squad||[]).filter(id => id && gs.players[id]);
    const squadSet = new Set(gs.squad);
    const allPlayers = gs.getPlayerPlayers().sort((a,b) => b.overall - a.overall);
    const posColors = {GL:'#e67e22',FIX:'#2980b9',ALA:'#27ae60','PÍV':'#c0392b'};
    const formations = ['1-2-1-1','1-1-2-1','1-2-2-0','1-3-1-0','1-0-3-1'];
    const styles = [
      {id:'equilibrado',icon:'⚖️',label:'Equilibrado',desc:'Balanceado'},
      {id:'ofensivo',icon:'⚔️',label:'Ofensivo',desc:'Pressão alta'},
      {id:'defensivo',icon:'🛡️',label:'Defensivo',desc:'Bloco baixo'},
      {id:'contra_ataque',icon:'⚡',label:'Contra-Ataque',desc:'Transição rápida'},
      {id:'posse',icon:'🔵',label:'Posse de Bola',desc:'Controle'},
    ];
    const posMap = {
      '1-2-1-1': [{r:'GL',x:8,y:50},{r:'FIX',x:28,y:28},{r:'FIX',x:28,y:72},{r:'ALA',x:60,y:50},{r:'PÍV',x:82,y:50}],
      '1-1-2-1': [{r:'GL',x:8,y:50},{r:'FIX',x:26,y:50},{r:'ALA',x:54,y:22},{r:'ALA',x:54,y:78},{r:'PÍV',x:82,y:50}],
      '1-2-2-0': [{r:'GL',x:8,y:50},{r:'FIX',x:28,y:28},{r:'FIX',x:28,y:72},{r:'ALA',x:64,y:22},{r:'ALA',x:64,y:78}],
      '1-3-1-0': [{r:'GL',x:8,y:50},{r:'FIX',x:28,y:18},{r:'FIX',x:28,y:50},{r:'FIX',x:28,y:82},{r:'ALA',x:66,y:50}],
      '1-0-3-1': [{r:'GL',x:8,y:50},{r:'ALA',x:46,y:15},{r:'ALA',x:46,y:50},{r:'ALA',x:46,y:85},{r:'PÍV',x:84,y:50}],
    };
    const slots = posMap[t.formation] || posMap['1-2-1-1'];
    const squadArr = gs.squad.slice(0,5);
    while (squadArr.length < 5) squadArr.push(null);

    const courtHTML = slots.map((pos, i) => {
      const pid = squadArr[i];
      const p = pid ? gs.players[pid] : null;
      const clr = posColors[pos.r] || '#555';
      const clrDark = pos.r==='GL'?'#7a3a0a':pos.r==='FIX'?'#0a3a7a':pos.r==='ALA'?'#0a7a3a':'#7a0a1a';
      if (p) {
        const photoId = window.PLAYER_PHOTOS ? window.PLAYER_PHOTOS[p.name] : null;
        const photoURL = photoId ? `https://api.sofascore.app/api/v1/player/${photoId}/image` : null;
        const lastName = p.name.split(' ').slice(-1)[0].toUpperCase();
        const shortName = lastName.length > 9 ? lastName.substring(0,9) : lastName;
        const initials = p.name.split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase();
        return `<div class="court-slot-v2 filled" style="left:${pos.x}%;top:${pos.y}%" data-slot="${i}" data-action="tacremove" data-idx="${i}" data-pid="${p.id}">
          <div class="court-slot-inner">
            <div class="court-player-card" style="--slot-clr:${clr};--slot-clr-dark:${clrDark}">
              <button class="court-slot-remove" data-action="tacremove" data-idx="${i}" data-pid="${p.id}">×</button>
              <div class="court-player-num">${i+1}</div>
              <div class="court-player-photo" draggable="true" data-pid="${p.id}" data-fromslot="${i}">
                ${photoURL
                  ? `<img src="${photoURL}" alt="${p.name}" onerror="this.style.display='none'">`
                  : `<span class="court-player-initials">${initials}</span>`}
              </div>
              <div class="court-player-name">${shortName}</div>
              <div class="court-player-meta">
                <span class="court-player-pos">${p.position}</span>
                <span class="court-player-ovr">${p.overall}</span>
              </div>
            </div>
          </div>
        </div>`;
      } else {
        return `<div class="court-slot-v2 empty" style="left:${pos.x}%;top:${pos.y}%"
            data-slot="${i}" data-slot-role="${pos.r}" data-slot-idx="${i}">
          <div class="court-slot-inner">
            <div class="court-slot-circle" style="color:${clr};border-color:${clr}50">${pos.r}</div>
            <span class="court-slot-label" style="color:${clr}50">vazio</span>
          </div>
        </div>`;
      }
    }).join('');

    const canAdd = gs.squad.filter(Boolean).length < 5;
    return `
    <div class="screen-game">
      ${this.renderNavbar(team)}
      <div class="game-content">
        <div class="screen-header-inner">
          <h2>⚙️ Táticas & Escalação</h2>
          <p>${gs.squad.filter(Boolean).length}/5 titulares · ${t.formation} · ${t.style}</p>
          <button class="btn btn-primary btn-sm" style="margin-top:8px" data-action="autosquad">⚡ Escalar Automaticamente</button>
        </div>
        <div class="tactics-layout-v2">
          <div class="tac-panel">
            <div class="tac-block">
              <div class="tac-block-title">📐 Formação</div>
              <div class="tac-formation-row">
                ${formations.map(f=>`<button class="tac-form-btn ${t.formation===f?'active':''}" data-action="setformation" data-val="${f}">${f}</button>`).join('')}
              </div>
            </div>
            <div class="tac-block">
              <div class="tac-block-title">🎯 Estilo</div>
              <div class="tac-style-row">
                ${styles.map(s=>`<button class="tac-style-btn ${t.style===s.id?'active':''}" data-action="setstyle" data-val="${s.id}">${s.icon} ${s.label} <small>— ${s.desc}</small></button>`).join('')}
              </div>
            </div>
            <div class="tac-block">
              <div class="tac-block-title">🎚️ Intensidade</div>
              <div class="tac-sliders">
                <div class="tac-slider-row"><span>Pressão</span><input type="range" min="1" max="10" value="${t.pressao||5}" data-key="pressao"><span class="tac-slider-val">${t.pressao||5}</span></div>
                <div class="tac-slider-row"><span>Linha Def.</span><input type="range" min="1" max="10" value="${t.linhaDefensiva||5}" data-key="linhadefensiva"><span class="tac-slider-val">${t.linhaDefensiva||5}</span></div>
                <div class="tac-slider-row"><span>Ritmo</span><input type="range" min="1" max="10" value="${t.ritmo||5}" data-key="ritmo"><span class="tac-slider-val">${t.ritmo||5}</span></div>
              </div>
            </div>
            <div class="tac-block">
              <div class="tac-block-title">⚡ Especial</div>
              <label class="tac-toggle ${t.goleirolinha?'on':''}">
                <input type="checkbox" id="toggle-gl" ${t.goleirolinha?'checked':''}>
                <span class="tac-track"></span>
                <span>🧤 Goleiro-Linha</span>
              </label>
            </div>
          </div>
          <div class="tac-right">
            <div class="tac-court-wrap">
              <div class="tac-court-header">
                <span>🏟️ Quadra — ${t.formation}</span>
                <small>Clique no jogador para remover</small>
              </div>
              <div class="futsal-court-v2" id="futsal-court">
                <div class="court-lines"></div>
                <div class="court-goal left"></div>
                <div class="court-goal right"></div>
                <div class="court-players" id="court-players">${courtHTML}</div>
              </div>
            </div>
            <div class="tac-player-pool" id="tac-bench">
              <div class="tac-pool-title">👥 Elenco — arraste para a quadra ou clique</div>
              <div class="tac-player-list">
                ${allPlayers.map(p => {
                  const inSquad = squadSet.has(p.id);
                  const photo = window.playerPhotoHTML ? window.playerPhotoHTML(p.name, 28, p.position, posColors[p.position]) : '';
                  return `<div class="tac-player-row ${inSquad?'in-squad':''} ${p.injured?'injured':''}"
                      draggable="${inSquad?'false':'true'}" data-pid="${p.id}"
                      data-action="${inSquad?'tacremove':'tacadd'}" data-pid="${p.id}">
                    <span class="player-photo-mini">${photo}</span>
                    <span class="pos-badge-sm" style="background:${posColors[p.position]||'#555'}">${p.position}</span>
                    <span class="tac-p-name">${p.name}${p.injured?' 🤕':''}</span>
                    <span style="font-family:'Barlow Condensed',sans-serif;font-weight:700;color:var(--gold)">${p.overall}</span>
                    <span class="tac-p-action ${inSquad?'tac-in-badge':'tac-add-hint'}">${inSquad?'✓ Titular': canAdd?'+ Adicionar':'—'}</span>
                  </div>`;
                }).join('')}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>`;
  }

  // ── TRANSFERS ────────────────────────────────────────────────
  renderTransfers() {
    const gs = this.gs;
    const team = gs.getPlayerTeam();
    const posColors = {GL:'#e67e22',FIX:'#2980b9',ALA:'#27ae60','PÍV':'#c0392b'};
    if (!this.transferTab) this.transferTab = 'comprar';
    const tab = this.transferTab;

    const market = (gs.transferMarket||[]).filter(p => p && !p.retired && p.teamId !== gs.playerTeamId);
    const f = this.transferFilter || {position:'',minOvr:0,maxPrice:999_999_999};
    this.transferFilter = f;
    const filtered = market.filter(p =>
      (!f.position||p.position===f.position) &&
      (p.overall||0)>=(f.minOvr||0) &&
      (p.value||0)<=(f.maxPrice||999_999_999)
    ).sort((a,b)=>(b.overall||0)-(a.overall||0));

    const myListed = gs.getPlayerPlayers().filter(p=>p.onTransferList&&!p.retired);
    const myOffers = (gs.pendingOffers||[]).filter(o=>!!gs.players[o.playerId]);
    const allTimeTop = (gs.topTransfers||[]).slice().sort((a,b)=>b.price-a.price).slice(0,6);
    const seasonTops = (gs.topTransfers||[]).filter(t=>t.season===gs.season).sort((a,b)=>b.price-a.price).slice(0,5);

    const tabBtn = (id, label, badge='') =>
      `<button class="transfer-tab ${tab===id?'active':''}"
         onclick="if(window.ui){window.ui.transferTab='${id}';window.ui.render('transfers')}"
       >${label}${badge?`<span style="background:var(--red);color:#fff;border-radius:10px;padding:1px 6px;font-size:9px;font-weight:800;margin-left:4px">${badge}</span>`:''}</button>`;

    const buyTab = `
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px;align-items:flex-end">
        <div><div style="font-size:10px;color:var(--text4);margin-bottom:3px">Posição</div>
          <select onchange="if(window.ui){window.ui.transferFilter.position=this.value;window.ui.render('transfers')}" style="padding:7px 10px;font-size:12px">
            <option value="" ${!f.position?'selected':''}>Todas</option>
            ${['GL','FIX','ALA','PÍV'].map(p=>`<option value="${p}" ${f.position===p?'selected':''}>${p}</option>`).join('')}
          </select></div>
        <div><div style="font-size:10px;color:var(--text4);margin-bottom:3px">OVR mín.</div>
          <input type="number" min="0" max="99" value="${f.minOvr||0}"
            style="width:68px;padding:7px 8px;font-size:12px;background:var(--bg3);border:1px solid var(--border);border-radius:6px;color:var(--text)"
            onchange="if(window.ui){window.ui.transferFilter.minOvr=+this.value;window.ui.render('transfers')}"></div>
        <div><div style="font-size:10px;color:var(--text4);margin-bottom:3px">Preço máx (M)</div>
          <input type="number" value="${Math.round((f.maxPrice||999_999_999)/1_000_000)}"
            style="width:80px;padding:7px 8px;font-size:12px;background:var(--bg3);border:1px solid var(--border);border-radius:6px;color:var(--text)"
            onchange="if(window.ui){window.ui.transferFilter.maxPrice=this.value*1_000_000;window.ui.render('transfers')}"></div>
        <div style="margin-left:auto;font-size:11px;color:var(--text3)">${filtered.length} jogadores · Orç: <strong style="color:var(--gold)">${this.fmt(gs.budget)}</strong></div>
      </div>
      <div style="overflow-x:auto"><table class="players-table">
        <thead><tr><th colspan="2" style="text-align:left">Jogador</th><th>Pos</th><th>Idade</th><th>OVR</th><th>Clube</th><th>Valor</th><th>Sal./mês</th><th></th></tr></thead>
        <tbody>${filtered.length===0
          ?`<tr><td colspan="9" style="text-align:center;padding:28px;color:var(--text4)">Nenhum jogador com esses filtros.</td></tr>`
          :filtered.slice(0,50).map(p=>{
            const canBuy=gs.budget>=(p.value||0);
            const ft=gs.teams[p.teamId];
            const ph=window.playerPhotoHTML?window.playerPhotoHTML(p.name,26,p.position,posColors[p.position]||'#555'):'';
            return `<tr>
              <td style="padding:5px 4px;width:32px">${ph}</td>
              <td><strong style="font-size:12px">${p.name}</strong><div style="font-size:10px;color:var(--text4)">${this.natFlag(p.nationality)} ${p.nationality}</div></td>
              <td><span class="pos-badge" style="background:${posColors[p.position]||'#555'}">${p.position}</span></td>
              <td style="font-size:12px">${p.age}a</td>
              <td class="ovr-cell" style="color:${(p.overall||0)>=80?'var(--gold)':(p.overall||0)>=70?'var(--green)':'var(--text2)'}">${p.overall}</td>
              <td style="font-size:11px"><span style="display:inline-flex;align-items:center;gap:4px">${this.teamLogo(p.teamId,ft?.name,ft?.color,ft?.color2,14)}<span style="color:var(--text3)">${ft?.name||'?'}</span></span></td>
              <td style="font-family:'Barlow Condensed',sans-serif;font-weight:800;font-size:13px;color:${canBuy?'var(--text)':'var(--text4)'}">${this.fmt(p.value)}</td>
              <td style="font-size:11px;color:var(--text4)">${this.fmt(p.salary)}</td>
              <td><button class="btn-sm ${canBuy?'btn-primary':'btn-ghost'}" style="opacity:${canBuy?1:.4}"
                ${canBuy?`data-action="buytransfer" data-pid="${p.id}"`:'disabled'}>${canBuy?'Contratar':'Sem verba'}</button></td>
            </tr>`;
          }).join('')
        }</tbody>
      </table></div>`;

    const sellTab = `
      ${myOffers.length>0?`
      <div style="margin-bottom:18px">
        <div class="card-title"><span class="card-title-left">🔔 Propostas Recebidas (${myOffers.length})</span></div>
        ${myOffers.map(o=>{
          const p=gs.players[o.playerId]; if(!p) return '';
          const bt=gs.teams[o.buyerTeamId];
          const ph=window.playerPhotoHTML?window.playerPhotoHTML(p.name,34,p.position,posColors[p.position]||'#555'):'';
          const pct=p.value>0?Math.round(((o.offer/p.value)-1)*100):0;
          return `<div style="display:flex;align-items:center;gap:10px;padding:12px 14px;background:rgba(240,200,74,.05);border:1px solid rgba(240,200,74,.2);border-radius:10px;margin-bottom:8px">
            ${ph}
            <div style="flex:1;min-width:0">
              <div style="font-weight:800;font-size:13px">${p.name} <span style="color:var(--text4);font-size:10px;font-weight:400">${p.position} · ${p.overall} OVR</span></div>
              <div style="font-size:12px;margin-top:2px">
                <span style="color:var(--text3)">${bt?.name||o.buyerName} oferece </span>
                <strong style="color:var(--gold)">${this.fmt(o.offer)}</strong>
                ${pct>0?`<span style="color:var(--green);font-size:10px"> +${pct}%</span>`:pct<0?`<span style="color:var(--red);font-size:10px"> ${pct}%</span>`:''}
              </div>
              <div style="font-size:10px;color:var(--text4)">Valor: ${this.fmt(p.value)} · Rod. ${o.week}</div>
            </div>
            <div style="display:flex;flex-direction:column;gap:6px">
              <button class="btn-sm btn-primary" data-action="acceptoffer" data-oid="${o.id}">✅ Aceitar</button>
              <button class="btn-sm btn-danger" data-action="rejectoffer" data-oid="${o.id}">❌ Recusar</button>
            </div>
          </div>`;
        }).join('')}
      </div>`:`<div style="background:rgba(255,255,255,.02);border:1px solid rgba(255,255,255,.05);border-radius:9px;padding:14px;margin-bottom:16px;text-align:center;font-size:12px;color:var(--text4)">Nenhuma proposta. Liste jogadores abaixo para atrair times.</div>`}
      <div style="margin-bottom:14px">
        <div class="card-title"><span class="card-title-left">📋 Na Lista (${myListed.length})</span></div>
        ${myListed.length===0?`<p style="font-size:12px;color:var(--text4)">Nenhum jogador listado.</p>`:
          myListed.map(p=>{
            const ph=window.playerPhotoHTML?window.playerPhotoHTML(p.name,28,p.position,posColors[p.position]||'#555'):'';
            const hasOffer=myOffers.some(o=>o.playerId===p.id);
            return `<div style="display:flex;align-items:center;gap:10px;padding:9px 12px;background:var(--bg3);border:1px solid ${hasOffer?'rgba(240,200,74,.3)':'var(--border)'};border-radius:9px;margin-bottom:6px">
              ${ph}
              <div style="flex:1;min-width:0">
                <div style="font-weight:700;font-size:13px">${p.name}</div>
                <div style="font-size:11px;color:var(--text3)">${p.position} · ${p.age}a · OVR ${p.overall} · ${this.fmt(p.value)}</div>
                ${hasOffer?`<div style="font-size:10px;color:var(--gold)">⭐ Proposta recebida!</div>`:''}
              </div>
              <button class="btn-sm btn-ghost" style="font-size:11px" data-action="removefromlist" data-pid="${p.id}">Retirar</button>
            </div>`;
          }).join('')}
      </div>
      <div style="background:var(--bg3);border:1px solid var(--border);border-radius:10px;padding:14px">
        <div style="font-size:12px;font-weight:700;color:var(--text2);margin-bottom:8px">➕ Listar jogador para venda</div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:flex-end">
          <select id="sell-select" style="flex:1;min-width:180px;padding:8px 10px;font-size:12px;background:var(--bg2);border:1px solid var(--border);border-radius:7px;color:var(--text)">
            <option value="">Selecionar jogador...</option>
            ${gs.getPlayerPlayers().filter(p=>!p.onTransferList&&!p.retired).sort((a,b)=>b.overall-a.overall).map(p=>`<option value="${p.id}">${p.name} (${p.position}, ${p.overall} OVR, ${this.fmt(p.value)})</option>`).join('')}
          </select>
          <button class="btn-sm btn-primary" data-action="addtolist" style="padding:8px 16px">📋 Listar</button>
        </div>
        <p style="font-size:10px;color:var(--text4);margin-top:8px">💡 Listados têm ~45% chance de receber proposta por rodada.</p>
      </div>`;

    const histTab = `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">
        <div>
          <div class="card-title"><span class="card-title-left" style="color:#4a90e2">💸 T${gs.season}</span></div>
          ${seasonTops.length===0?`<p style="font-size:11px;color:var(--text4)">Nenhuma ainda.</p>`:
            seasonTops.map((tr,i)=>{const ft=gs.teams[tr.fromTeamId],tt=gs.teams[tr.toTeamId];return `<div style="display:flex;gap:8px;padding:7px 0;border-bottom:1px solid rgba(255,255,255,.04)">
              <span style="font-family:'Barlow Condensed',sans-serif;font-size:11px;font-weight:800;color:var(--text4);min-width:18px">${i+1}.</span>
              <div style="flex:1;min-width:0"><div style="font-size:12px;font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${tr.playerName}</div>
                <div style="font-size:10px;color:var(--text4)">${ft?.name||'?'} → ${tt?.name||'?'}</div></div>
              <div style="font-family:'Barlow Condensed',sans-serif;font-size:13px;font-weight:900;color:${tr.price>=10_000_000?'var(--gold)':'var(--text2)'};flex-shrink:0">${this.fmt(tr.price)}</div>
            </div>`;}).join('')}
        </div>
        <div>
          <div class="card-title"><span class="card-title-left">🏆 All-Time</span></div>
          ${allTimeTop.length===0?`<p style="font-size:11px;color:var(--text4)">Nenhuma ainda.</p>`:
            allTimeTop.map((tr,i)=>{const ft=gs.teams[tr.fromTeamId],tt=gs.teams[tr.toTeamId];return `<div style="display:flex;gap:8px;padding:7px 0;border-bottom:1px solid rgba(255,255,255,.04)">
              <span style="font-family:'Barlow Condensed',sans-serif;font-size:11px;font-weight:800;color:var(--text4);min-width:18px">${['🥇','🥈','🥉'][i]||(i+1)+'.'}</span>
              <div style="flex:1;min-width:0"><div style="font-size:12px;font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${tr.playerName}</div>
                <div style="font-size:10px;color:var(--text4)">${ft?.name||'?'} → ${tt?.name||'?'}</div></div>
              <div style="font-family:'Barlow Condensed',sans-serif;font-size:13px;font-weight:900;color:${tr.price>=20_000_000?'var(--gold)':'var(--text2)'};flex-shrink:0">${this.fmt(tr.price)}</div>
            </div>`;}).join('')}
        </div>
      </div>`;

    return `
    <div class="screen-game">
      ${this.renderNavbar(team)}
      <div class="game-content">
        <div class="screen-header-inner">
          <h2>🔄 Transferências</h2>
          <p>Rod. ${gs.currentWeek} · Orç: <strong style="color:var(--gold)">${this.fmt(gs.budget)}</strong></p>
        </div>
        <div class="transfer-tabs">
          ${tabBtn('comprar','🛒 Comprar')}
          ${tabBtn('vender','💰 Vender & Propostas', myOffers.length||'')}
          ${tabBtn('historico','📊 Histórico')}
        </div>
        <div class="dash-card" style="padding:14px;margin-top:10px">
          ${tab==='comprar'?buyTab:tab==='vender'?sellTab:histTab}
        </div>
      </div>
    </div>`;
  }

  renderLeague() {
    const gs = this.gs;
    const team = gs.getPlayerTeam();
    if (!this.leagueTab) this.leagueTab = 'classif';
    const tab = this.leagueTab;
    const standings = gs.getLeagueStandings(team.league);
    const league = gs.leagues[team.league];
    const posColors = {GL:'#e67e22',FIX:'#2980b9',ALA:'#27ae60','PÍV':'#c0392b'};

    const tabContent = () => {
      if (tab === 'classif') return `
        <div style="overflow-x:auto">
        <table class="standings-table" style="width:100%;min-width:520px">
          <thead><tr><th>#</th><th style="text-align:left">Time</th><th>J</th><th>V</th><th>E</th><th>D</th><th>GP</th><th>GC</th><th>GD</th><th>Pts</th><th>Forma</th><th></th></tr></thead>
          <tbody>
            ${standings.map((t,i) => `
              <tr class="${t.id===gs.playerTeamId?'my-team':''} ${i<2?'zone-champions':i===standings.length-1?'zone-relegation':''}" style="cursor:pointer" onclick="if(window.CareerTeamViewer&&window.gameState)window.CareerTeamViewer.renderTeamSquadModal(window.gameState,'${t.id}')">
                <td class="rank-cell">${i===0?'🥇':i===1?'🥈':i===2?'🥉':`<strong>${i+1}</strong>`}</td>
                <td><span style="display:inline-flex;align-items:center;gap:5px;vertical-align:middle">${this.teamLogo(t.id,t.name,t.color,t.color2,18)}<span>${t.name}${t.id===gs.playerTeamId?' <span style="font-size:9px;color:var(--gold);background:rgba(233,197,107,.15);padding:1px 5px;border-radius:3px">TU</span>':''}</span></span></td>
                <td>${t.standing.played}</td>
                <td class="col-win">${t.standing.w}</td>
                <td>${t.standing.d}</td>
                <td class="col-loss">${t.standing.l}</td>
                <td>${t.standing.gf}</td><td>${t.standing.ga}</td>
                <td class="${t.standing.gd>0?'col-win':t.standing.gd<0?'col-loss':''}">${t.standing.gd>0?'+':''}${t.standing.gd}</td>
                <td class="pts-cell"><strong>${t.standing.pts}</strong></td>
                <td>${(t.form||[]).slice(0,5).map(f=>`<span class="form-badge form-${f.toLowerCase()}">${f}</span>`).join('')}</td>
                <td><button class="btn-sm btn-ghost" style="font-size:10px;padding:2px 5px" onclick="event.stopPropagation();if(window.CareerTeamViewer&&window.gameState)window.CareerTeamViewer.renderTeamSquadModal(window.gameState,'${t.id}')">👥</button></td>
              </tr>`).join('')}
          </tbody>
        </table>
        </div>
        <div class="standings-legend"><span class="zone-champions-dot">■</span> Título &nbsp;<span class="zone-relegation-dot">■</span> Rebaixamento</div>`;

      if (tab === 'scorers') {
        const scorers = gs.getTopScorers(team.league, 15);
        return `<div style="overflow-x:auto"><table class="players-table">
          <thead><tr><th>#</th><th>Nome</th><th>Pos</th><th>Clube</th><th>Gols</th><th>Assist</th></tr></thead>
          <tbody>${scorers.map((p,i)=>{const _pc={GL:'#e67e22',FIX:'#2980b9',ALA:'#27ae60','PÍV':'#c0392b'};return `<tr class="${p.teamId===gs.playerTeamId?'my-team':''}">
            <td style="font-weight:700">${i+1}</td><td><span style="display:inline-flex;align-items:center;gap:7px">${window.playerPhotoHTML?window.playerPhotoHTML(p.name,28,p.position,_pc[p.position]||'#555'):''}<strong>${p.name}</strong></span></td>
            <td><span class="pos-badge" style="background:${posColors[p.position]||'#555'};font-size:10px;padding:1px 5px">${p.position}</span></td>
            <td style="font-size:11px"><span style="display:inline-flex;align-items:center;gap:4px">${this.teamLogo(p.teamId,gs.teams[p.teamId]?.name,gs.teams[p.teamId]?.color,gs.teams[p.teamId]?.color2,15)}<span>${gs.teams[p.teamId]?.name||'-'}</span></span></td>
            <td class="ovr-cell"><strong>${p.goals}</strong></td>
            <td class="text-muted">${p.assists||0}</td>
          </tr>`;}).join('')}</tbody>
        </table></div>`;
      }

      if (tab === 'assists') {
        const assisters = gs.getTopAssists(team.league, 15);
        if (!assisters.length) return '<p class="empty-msg" style="padding:20px">Nenhuma assistência registrada ainda.</p>';
        return `<div style="overflow-x:auto"><table class="players-table">
          <thead><tr><th>#</th><th>Nome</th><th>Pos</th><th>Clube</th><th>Assist</th><th>Gols</th></tr></thead>
          <tbody>${assisters.map((p,i)=>{const _pc={GL:'#e67e22',FIX:'#2980b9',ALA:'#27ae60','PÍV':'#c0392b'};return `<tr class="${p.teamId===gs.playerTeamId?'my-team':''}">
            <td style="font-weight:700">${i+1}</td><td><span style="display:inline-flex;align-items:center;gap:7px">${window.playerPhotoHTML?window.playerPhotoHTML(p.name,28,p.position,_pc[p.position]||'#555'):''}<strong>${p.name}</strong></span></td>
            <td><span class="pos-badge" style="background:${posColors[p.position]||'#555'};font-size:10px;padding:1px 5px">${p.position}</span></td>
            <td style="font-size:11px"><span style="display:inline-flex;align-items:center;gap:4px">${this.teamLogo(p.teamId,gs.teams[p.teamId]?.name,gs.teams[p.teamId]?.color,gs.teams[p.teamId]?.color2,15)}<span>${gs.teams[p.teamId]?.name||'-'}</span></span></td>
            <td class="ovr-cell"><strong>${p.assists||0}</strong></td>
            <td class="text-muted">${p.goals||0}</td>
          </tr>`;}).join('')}</tbody>
        </table></div>`;
      }

      if (tab === 'results') {
        const played   = (gs.schedules[team.league]||[]).filter(m=>m.played).reverse().slice(0,20);
        const upcoming = (gs.schedules[team.league]||[]).filter(m=>!m.played).slice(0,10);
        return `<div class="results-cols">
          <div>
            <h3 style="font-size:.95rem;margin-bottom:9px">Últimos Resultados</h3>
            ${played.length===0?'<p class="empty-msg">Nenhum jogo ainda</p>':
              played.map(m=>{
                const ht=gs.teams[m.home],at=gs.teams[m.away],r=m.result?.score;
                const myMatch=m.home===gs.playerTeamId||m.away===gs.playerTeamId;
                return `<div class="result-row ${myMatch?'my-match':''}">
                  <span class="${r&&r.home>r.away?'winner':''}"><span style="display:inline-flex;align-items:center;gap:4px;justify-content:flex-end">${this.teamLogo(m.home,ht?.name,ht?.color,ht?.color2,15)}<span>${ht?.name}</span></span></span>
                  <span class="score-box">${r?`${r.home}–${r.away}`:'-'}</span>
                  <span class="${r&&r.away>r.home?'winner':''}"><span style="display:inline-flex;align-items:center;gap:4px">${this.teamLogo(m.away,at?.name,at?.color,at?.color2,15)}<span>${at?.name}</span></span></span>
                </div>`;
              }).join('')}
          </div>
          <div>
            <h3 style="font-size:.95rem;margin-bottom:9px">Próximas Partidas</h3>
            ${upcoming.map(m=>{
              const ht=gs.teams[m.home],at=gs.teams[m.away];
              const myMatch=m.home===gs.playerTeamId||m.away===gs.playerTeamId;
              return `<div class="result-row ${myMatch?'my-match':''}">
                <span><span style="display:inline-flex;align-items:center;gap:4px;justify-content:flex-end">${this.teamLogo(m.home,ht?.name,ht?.color,ht?.color2,15)}<span>${ht?.name}</span></span></span>
                <span class="score-box score-upcoming">R${m.week}</span>
                <span><span style="display:inline-flex;align-items:center;gap:4px">${this.teamLogo(m.away,at?.name,at?.color,at?.color2,15)}<span>${at?.name}</span></span></span>
              </div>`;
            }).join('')}
          </div>
        </div>`;
      }
    };

    return `
    <div class="screen-game">
      ${this.renderNavbar(team)}
      <div class="game-content">
        <div class="screen-header-inner">
          <h2>🏆 ${league?.name||'Liga'}</h2>
          <p>Temporada ${gs.season} · Rodada ${gs.currentWeek}/${gs.totalWeeks}</p>
        </div>
        <div class="transfer-tabs">
          <button class="tab-btn ${tab==='classif'?'active':''}" data-action="switchleaguetab" data-tab="classif">📊 Classificação</button>
          <button class="tab-btn ${tab==='scorers'?'active':''}" data-action="switchleaguetab" data-tab="scorers">⚽ Artilharia</button>
          <button class="tab-btn ${tab==='assists'?'active':''}" data-action="switchleaguetab" data-tab="assists">🎯 Assistências</button>
          <button class="tab-btn ${tab==='results'?'active':''}" data-action="switchleaguetab" data-tab="results">📋 Jogos</button>
        </div>
        <div>${tabContent()}</div>
      </div>
    </div>`;
  }

  // ── STAFF ────────────────────────────────────────────────────
  renderStaff() {
    const gs = this.gs;
    const team = gs.getPlayerTeam();
    const staff = gs.coachingStaff;
    const roles = [
      {key:'assistente',     icon:'🎯',title:'Assistente Técnico', baseBonus:'Análise de adversários (+15% por nível)',    cost:15000, basePct:10},
      {key:'preparadorFisico',icon:'💪',title:'Preparador Físico', baseBonus:'Recuperação de lesões mais rápida',          cost:12000, basePct:15},
      {key:'analistaTatico', icon:'📊',title:'Analista Tático',    baseBonus:'Eficiência tática melhorada',                cost:14000, basePct:10},
      {key:'medico',         icon:'🏥',title:'Médico',             baseBonus:'Redução do tempo de lesão',                  cost:10000, basePct:20},
      {key:'olheiro',        icon:'🔭',title:'Olheiro',            baseBonus:'Talentos no mercado revelados',              cost:8000,  basePct:5},
    ];

    // Upgrade: custo = cost_contratação × 2 × 2.5^(level-1)
    // Bônus: basePct + 15% × (level - 1)
    // Melhoria geral do time: +5% por nível
    const upgradeCost  = (r, level) => Math.round(r.cost * 16 * Math.pow(5, level - 1) / 1000) * 1000;
    const bonusPct     = (r, level) => r.basePct + 15 * (level - 1);
    const levelStars   = (lv) => '★'.repeat(lv) + '☆'.repeat(Math.max(0, 5 - lv));
    const levelColor   = (lv) => lv >= 5 ? '#f0c84a' : lv >= 3 ? '#28c856' : lv >= 2 ? '#4a90e2' : 'rgba(255,255,255,.5)';

    return `
    <div class="screen-game">
      ${this.renderNavbar(team)}
      <div class="game-content">
        <div class="screen-header-inner">
          <h2>👔 Comissão Técnica</h2>
          <p>Orçamento: ${this.fmt(gs.budget)} · Cada membro pode ser evoluído até Nível 5</p>
        </div>
        <div class="staff-grid">
          ${roles.map(r => {
            const hired = staff[r.key];
            const level = hired?.level || 1;
            const upCost = upgradeCost(r, level);
            const bPct = bonusPct(r, level);
            const teamBonus = level > 1 ? `+${(level-1)*5}% time` : '';
            const canUpgrade = hired && level < 5 && gs.budget >= upCost;
            const maxLevel = hired && level >= 5;
            return `<div class="staff-card ${hired ? 'hired' : ''}">
              <div class="staff-icon">${r.icon}</div>
              <div class="staff-info" style="flex:1">
                <h3>${r.title}</h3>
                <p style="font-size:11px;color:var(--text3);margin-bottom:4px">${r.baseBonus}</p>
                ${hired ? `
                  <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
                    <span style="font-size:14px;color:${levelColor(level)};letter-spacing:1px">${levelStars(level)}</span>
                    <span style="font-family:'Barlow Condensed',sans-serif;font-size:13px;font-weight:800;color:${levelColor(level)}">NÍV. ${level}</span>
                  </div>
                  <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:6px">
                    <span class="hired-badge">✅ ${hired.name}</span>
                    <span style="background:rgba(240,200,74,.12);border:1px solid rgba(240,200,74,.25);color:#f0c84a;font-size:10px;font-weight:700;padding:2px 8px;border-radius:4px">+${bPct}% bônus${teamBonus?' · '+teamBonus:''}</span>
                  </div>
                  <p class="staff-cost">💸 ${this.fmt(Math.round(r.cost * (1 + (level-1) * 0.2)))}/mês</p>
                ` : `<p class="staff-cost">💸 ${this.fmt(r.cost)}/mês · Contratação: ${this.fmt(r.cost * 3)}</p>`}
              </div>
              <div style="display:flex;flex-direction:column;gap:6px;align-items:flex-end">
                ${hired ? `
                  ${maxLevel
                    ? `<span style="font-size:11px;color:#f0c84a;font-weight:800">★ MÁXIMO</span>`
                    : `<button class="btn-sm btn-primary${canUpgrade?'':' disabled'}" ${canUpgrade?`data-action="upgradestaff" data-role="${r.key}" data-cost="${upCost}"`:'disabled'}
                        title="${canUpgrade?'':'Orçamento insuficiente'}">
                         ⬆ Upgrade <span style="font-size:10px;opacity:.8">${this.fmt(upCost)}</span>
                       </button>`}
                  <button class="btn-sm btn-danger" data-action="firestaff" data-role="${r.key}" style="font-size:10px">Demitir</button>
                ` : `
                  <button class="btn-sm btn-primary" data-action="hirestaff" data-role="${r.key}" data-cost="${r.cost}">Contratar</button>
                `}
              </div>
            </div>`;
          }).join('')}
        </div>

        <!-- Efeitos ativos com progresso -->
        <div class="staff-effects">
          <h3 style="font-size:.95rem;margin-bottom:10px">📈 Efeitos Ativos</h3>
          ${Object.values(staff).filter(Boolean).length === 0
            ? '<p class="empty-msg">Nenhum membro contratado</p>'
            : Object.entries(staff).filter(([,v])=>v).map(([k,v]) => {
                const r = roles.find(r=>r.key===k);
                const lv = v.level||1;
                const pct = bonusPct(r||{basePct:5}, lv);
                const teamB = lv > 1 ? ` · +${(lv-1)*5}% melhoria geral` : '';
                return `<div class="effect-row" style="display:flex;align-items:center;gap:10px">
                  <span style="font-size:1.2rem">${r?.icon||'✅'}</span>
                  <div style="flex:1">
                    <span style="font-weight:700;color:var(--text)">${r?.title||k}</span>
                    <span style="color:var(--text3);font-size:11px"> · +${pct}% bônus${teamB}</span>
                  </div>
                  <span style="font-size:12px;color:${levelColor(lv)};font-weight:800">NÍV. ${lv}</span>
                </div>`;
              }).join('')}
        </div>
      </div>
    </div>`;
  }

  // ── TRAINING ─────────────────────────────────────────────────
  renderTraining() {
    const gs = this.gs;
    const team = gs.getPlayerTeam();
    const players = gs.getPlayerPlayers().sort((a,b)=>b.overall-a.overall);
    const posColors = {GL:'#e67e22',FIX:'#2980b9',ALA:'#27ae60','PÍV':'#c0392b'};
    const ta = this.trainingAssignments;
    const trainTypes = [
      {id:'fisico',name:'Físico',icon:'💪',color:'#e91e63',desc:'Vel, Resistência, Força'},
      {id:'tecnico',name:'Técnico',icon:'⚽',color:'#00bcd4',desc:'Finalização, Drible, Passe'},
      {id:'defensivo',name:'Defensivo',icon:'🛡️',color:'#2196f3',desc:'Marcação, Interceptação'},
      {id:'mental',name:'Mental',icon:'🧠',color:'#9c27b0',desc:'Decisões, Visão, Liderança'},
    ];
    return `
    <div class="screen-game">
      ${this.renderNavbar(team)}
      <div class="game-content">
        <div class="screen-header-inner"><h2>🏋️ Centro de Treinamento</h2><p>Atribua focos. Processados ao avançar semana.</p>
          <button class="btn btn-primary btn-sm" style="margin-top:8px;gap:6px" data-action="autotrain">⚡ Escalar Treino Automático</button>
        </div>
        <div class="training-layout-new">
          <div>
            <div class="train-focus-grid">
              ${trainTypes.map(tt => {
                const assigned = Object.entries(ta).filter(([pid,tid])=>tid===tt.id).map(([pid])=>gs.players[pid]).filter(Boolean);
                return `<div class="train-focus-card" style="border-left-color:${tt.color}">
                  <div class="tfc-header">
                    <span class="tfc-icon">${tt.icon}</span>
                    <div><strong>${tt.name}</strong><div class="tfc-desc">${tt.desc}</div></div>
                  </div>
                  <div class="tfc-assigned">
                    ${assigned.length===0?'<span class="empty-msg">Nenhum</span>':
                      assigned.map(p=>`<div class="tfc-player">
                        <span class="pos-badge-sm" style="background:${posColors[p.position]||'#555'}">${p.position}</span>
                        <span>${p.name.split(' ').slice(-1)[0]}</span>
                        <span style="margin-left:auto;color:var(--gold);font-weight:700">${p.overall}</span>
                        <button class="btn-sm btn-danger" style="padding:1px 5px" data-action="unassigntrain" data-pid="${p.id}">×</button>
                      </div>`).join('')}
                  </div>
                </div>`;
              }).join('')}
            </div>
            <div class="train-tip">💡 Jovens (&lt;23) evoluem mais rápido. Preparador Físico potencializa treino físico.</div>
          </div>
          <div>
            <div class="train-player-list">
              <h3 style="font-size:.95rem;margin-bottom:9px">Atribuir Foco</h3>
              <div style="overflow-x:auto">
              <table class="players-table">
                <thead><tr><th>Nome</th><th>Pos</th><th>OVR</th><th>Pot</th><th>Idade</th><th>Foco</th><th>Mudar</th></tr></thead>
                <tbody>
                  ${players.map(p => {
                    const cur = ta[p.id];
                    const fi = trainTypes.find(tt=>tt.id===cur);
                    return `<tr>
                      <td><span style="display:inline-flex;align-items:center;gap:7px">${(()=>{const _pc={GL:'#e67e22',FIX:'#2980b9',ALA:'#27ae60','PÍV':'#c0392b'};return window.playerPhotoHTML?window.playerPhotoHTML(p.name,26,p.position,_pc[p.position]||'#555'):'';})()}<strong>${p.name}</strong>${p.injured?'<span style="color:var(--red)"> 🤕</span>':''}</span></td>
                      <td><span class="pos-badge" style="background:${posColors[p.position]||'#555'}">${p.position}</span></td>
                      <td class="ovr-cell">${p.overall}</td><td class="pot-cell">${p.potential}</td><td>${p.age}</td>
                      <td>${fi?`<span style="color:${fi.color}">${fi.icon} ${fi.name}</span>`:'<span class="text-muted">—</span>'}</td>
                      <td><select data-action="assigntrain" data-pid="${p.id}" style="padding:3px;background:var(--bg3);border:1px solid var(--border);color:var(--text);border-radius:4px;font-size:11px">
                        <option value="">—</option>
                        ${trainTypes.map(tt=>`<option value="${tt.id}" ${cur===tt.id?'selected':''} ${p.injured?'disabled':''}>${tt.icon} ${tt.name}</option>`).join('')}
                      </select></td>
                    </tr>`;
                  }).join('')}
                </tbody>
              </table>
              </div>
            </div>
            <div class="young-talents">
              <h3 style="font-size:.95rem;margin-bottom:9px">🌱 Jovens Talentos (sub-23)</h3>
              <div style="overflow-x:auto">
              <table class="players-table">
                <thead><tr><th>Nome</th><th>Pos</th><th>Idade</th><th>OVR</th><th>POT</th><th>Gap</th></tr></thead>
                <tbody>
                  ${players.filter(p=>p.age<=23).sort((a,b)=>b.potential-a.potential).slice(0,8).map(p=>{
                    const gap=p.potential-p.overall;
                    return `<tr><td><strong>${p.name}</strong></td>
                      <td><span class="pos-badge" style="background:${posColors[p.position]||'#555'};font-size:10px;padding:1px 5px">${p.position}</span></td>
                      <td>${p.age}</td><td class="ovr-cell">${p.overall}</td><td class="pot-cell">${p.potential}</td>
                      <td class="${gap>8?'gap-high':gap>3?'gap-mid':'gap-low'}">+${gap}</td>
                    </tr>`;
                  }).join('')}
                </tbody>
              </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>`;
  }

  // ── FINANCES ─────────────────────────────────────────────────
  renderFinances() {
    const gs = this.gs;
    const team = gs.getPlayerTeam();
    if (!team) return `<div class="screen-game">${this.renderNavbar(null)}<div class="game-content"><p class="empty-msg">Erro: time não encontrado.</p></div></div>`;

    const players       = gs.getPlayerPlayers();
    const totalSalaries = players.reduce((a,p)=>a+(p.salary||0),0);
    const staffCosts    = {assistente:195000,preparadorFisico:156000,analistaTatico:182000,medico:130000,olheiro:104000,gestorContratos:143000};
    const staffTotal    = Object.entries(gs.coachingStaff||{}).filter(([,v])=>v).reduce((a,[k,v])=>{
      const lv=v?.level||1; return a+Math.round((staffCosts[k]||0)*(1+(lv-1)*0.2));
    },0);
    const totalMonthly  = totalSalaries + staffTotal;
    const activeSponsor = gs.sponsorContracts || [];
    const sponsorWeekly = activeSponsor.reduce((a,c)=>a+c.value,0);
    const sponsorMonthly= sponsorWeekly * 4;
    const weeksLeft     = Math.max(0,gs.totalWeeks-gs.currentWeek);
    const projBalance   = gs.budget - (totalMonthly * Math.ceil(weeksLeft/4)) + (sponsorMonthly * Math.ceil(weeksLeft/4));
    const isDeficit     = totalMonthly > sponsorMonthly * 1.2;
    const tab           = this.finTab || 'resumo';

    const leaguePos  = gs.getLeagueStandings(team?.league).findIndex(t=>t.id===gs.playerTeamId)+1||8;
    const rep        = team?.reputation||75;
    const relevance  = Math.max(1,Math.min(10,Math.round((rep/10)+Math.max(0,8-leaguePos))));
    if (!gs.availableSponsors || gs.availableSponsors.length === 0) gs.generateSponsors?.();
    const availSponsors = gs.availableSponsors || [];

    const tabBtn = (id,label) => `<button class="btn btn-sm ${tab===id?'btn-primary':'btn-ghost'}" data-action="fintab" data-tab="${id}">${label}</button>`;

    // ── ABA RESUMO ────────────────────────────────────────────
    let body = '';
    if (tab === 'resumo') {
      body = `
      ${isDeficit?`<div class="finance-alert">⚠️ Despesas mensais superam receitas de patrocínios — monitore o saldo!</div>`:''}
      <div class="finances-layout">
        <div class="finance-card">
          <h3>📈 Receitas</h3>
          <div class="finance-row"><span>Patrocínios/semana</span><span class="pos-val">${this.fmt(sponsorWeekly)}</span></div>
          <div class="finance-row"><span>Patrocínios/mês (×4)</span><span class="pos-val">${this.fmt(sponsorMonthly)}</span></div>
          <div class="finance-row"><span>Bilheteria acumulada</span><span class="pos-val">${this.fmt(gs.income?.bilheteria||0)}</span></div>
          <div class="finance-row total"><span>Transferências</span><span class="pos-val">${this.fmt(gs.income?.transferencias||0)}</span></div>
        </div>
        <div class="finance-card">
          <h3>📉 Despesas/mês</h3>
          <div class="finance-row"><span>Folha (${players.length} jog.)</span><span class="neg-val">${this.fmt(totalSalaries)}</span></div>
          <div class="finance-row"><span>Comissão técnica</span><span class="neg-val">${this.fmt(staffTotal)}</span></div>
          <div class="finance-row total"><span>Total/mês</span><span class="neg-val">${this.fmt(totalMonthly)}</span></div>
        </div>
        <div class="finance-card">
          <h3>💼 Saldo & Projeção</h3>
          <div class="big-budget">${this.fmt(gs.budget)}</div>
          <div class="finance-row"><span>Projeção fim da temp.</span>
            <span class="${projBalance>=0?'pos-val':'neg-val'}">${this.fmt(Math.round(projBalance))}</span></div>
          <div class="finance-row"><span>Relevância do time</span><span style="color:var(--gold)">${'⭐'.repeat(relevance)}${'☆'.repeat(10-relevance)}</span></div>
        </div>
      </div>`;

    // ── ABA SALÁRIOS ──────────────────────────────────────────
    } else if (tab === 'salarios') {
      body = `
      <div class="player-salaries">
        <div style="overflow-x:auto">
        <table class="players-table">
          <thead><tr><th>Nome</th><th>Pos</th><th>OVR</th><th>Salário/mês</th><th>Contrato</th><th>Idade</th><th>Ação</th></tr></thead>
          <tbody>${players.sort((a,b)=>b.salary-a.salary).map(p=>{
            const expired   = p.contractYears <= 0;
            const nearExpiry= p.contractYears === 1;
            const canRenew  = !p.retired && p.age < 36;
            const posColors = {GL:'#e67e22',FIX:'#2980b9',ALA:'#27ae60','PÍV':'#c0392b'};
            return `<tr class="${expired?'row-injured':''}">
              <td><span style="display:inline-flex;align-items:center;gap:8px">${window.playerPhotoHTML?window.playerPhotoHTML(p.name,28,p.position,posColors[p.position]||'#555'):''}<strong>${p.name}</strong></span></td>
              <td><span class="pos-badge" style="background:${posColors[p.position]||'#555'};font-size:10px;padding:1px 5px">${p.position}</span></td>
              <td class="ovr-cell">${p.overall}</td>
              <td><strong>${this.fmt(p.salary)}</strong></td>
              <td style="color:${expired?'var(--red)':nearExpiry?'var(--orange)':'var(--text2)'}">${expired?'❌ Encerrado':p.contractYears+'a'}</td>
              <td style="font-size:11px;color:var(--text3)">${p.age}a ${p.age>=35?'🔴':p.age>=30?'🟡':'🟢'}</td>
              <td>
                ${canRenew?`<button class="btn-sm btn-primary" data-action="renewcontract" data-pid="${p.id}" title="Renovar por 2 anos">✍️ Renovar</button>`:'<span style="font-size:10px;color:var(--text4)">—</span>'}
              </td>
            </tr>`;
          }).join('')}</tbody>
        </table>
        </div>
        <div style="font-size:11px;color:var(--text3);margin-top:8px;padding:8px;background:var(--bg2);border-radius:8px">
          💡 Renovar cobra bônus de assinatura (50% do novo salário). Aumento: ~15% jovens, ~8% adultos, ~3% veteranos.<br>
          🎖️ Aposentadorias são decididas pelos próprios jogadores — veteranos acima de 36 anos podem se aposentar espontaneamente ao fim de cada temporada.
        </div>
      </div>`;

    // ── ABA PATROCÍNIOS ───────────────────────────────────────
    } else if (tab === 'patrocinios') {
      body = `
      <div style="margin-bottom:18px">
        <div style="font-family:'Barlow Condensed',sans-serif;font-size:.85rem;font-weight:800;color:var(--text3);letter-spacing:.1em;text-transform:uppercase;margin-bottom:10px">
          ✅ Contratos Ativos (${activeSponsor.length}) · ${this.fmt(sponsorWeekly)}/semana
        </div>
        ${activeSponsor.length===0
          ? `<div style="color:var(--text3);font-size:12px;padding:12px;text-align:center;background:var(--bg2);border-radius:8px">Nenhum patrocinador ativo. Feche contratos abaixo!</div>`
          : activeSponsor.map(c=>`
            <div style="display:flex;align-items:center;gap:12px;background:rgba(40,200,86,.06);border:1px solid rgba(40,200,86,.2);border-radius:10px;padding:10px 14px;margin-bottom:8px">
              <span style="font-size:1.6rem">${c.icon||'🤝'}</span>
              <div style="flex:1">
                <div style="font-weight:800;color:var(--text)">${c.name} <span style="font-size:10px;color:var(--text3);font-weight:400">${c.type||''}</span></div>
                <div style="font-size:12px;color:#28c856;font-weight:700">${this.fmt(c.value)}/semana</div>
              </div>
              <div style="text-align:right;font-size:11px;color:var(--text3)">
                <div>${c.weeksLeft} semanas</div>
                <div style="color:var(--text4)">${Math.ceil((c.weeksLeft||0)/14)} temp.</div>
              </div>
              <button class="btn-sm btn-danger" data-action="cancelsponsor" data-sid="${c.sponsorId}">✕</button>
            </div>`).join('')}
      </div>
      <div>
        <div style="font-family:'Barlow Condensed',sans-serif;font-size:.85rem;font-weight:800;color:var(--text3);letter-spacing:.1em;text-transform:uppercase;margin-bottom:10px">
          📋 Ofertas Disponíveis (relevância: ${relevance}/10)
        </div>
        ${availSponsors.length===0
          ? `<div style="color:var(--text3);font-size:12px;padding:12px;text-align:center;background:var(--bg2);border-radius:8px">Sem novas ofertas. Melhore a posição na liga!</div>`
          : availSponsors.map(s=>`
            <div style="display:flex;align-items:center;gap:12px;background:var(--bg2);border:1px solid var(--border);border-radius:10px;padding:10px 14px;margin-bottom:8px">
              <span style="font-size:1.6rem">${s.icon||'🤝'}</span>
              <div style="flex:1">
                <div style="font-weight:800;color:var(--text)">${s.name} <span style="font-size:10px;color:var(--text3);font-weight:400">${s.type||''}</span></div>
                <div style="font-size:12px;color:#28c856;font-weight:700">${this.fmt(s.offeredValue)}/semana</div>
                <div style="font-size:10px;color:var(--text3)">${s.durationYears} temp. · total est. ${this.fmt((s.offeredValue||0)*s.durationYears*14)}</div>
              </div>
              <button class="btn-sm btn-primary" data-action="signsponsor" data-sid="${s.id}">✍️ Fechar</button>
            </div>`).join('')}
      </div>`;
    }

    return `
    <div class="screen-game">
      ${this.renderNavbar(team)}
      <div class="game-content">
        <div class="screen-header-inner">
          <h2>💰 Finanças do Clube</h2>
          <p>Temporada ${gs.season} · Rodada ${gs.currentWeek}/${gs.totalWeeks}</p>
        </div>
        <div style="display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap">
          ${tabBtn('resumo','📊 Resumo')}
          ${tabBtn('salarios','💵 Salários')}
          ${tabBtn('patrocinios',`🤝 Patrocínios${activeSponsor.length>0?' <span style="background:var(--green);border-radius:10px;padding:1px 6px;font-size:10px">'+activeSponsor.length+'</span>':''}`)}
        </div>
        ${body}
      </div>
    </div>`;
  }

  // ── MATCH ────────────────────────────────────────────────────
  renderMatch() {
    if (!this.pendingMatch) {
      return `<div class="screen-game">${this.renderNavbar(this.gs.getPlayerTeam())}
        <div class="game-content"><p class="empty-msg">Nenhum jogo selecionado.</p>
        <button class="btn btn-ghost" style="margin-top:12px" data-action="dashboard">← Voltar</button></div></div>`;
    }
    const gs = this.gs;
    const m = this.pendingMatch;
    const homeT = gs.teams[m.home], awayT = gs.teams[m.away];
    const isHome = m.home === gs.playerTeamId;
    const squad = gs.squad.map(id=>gs.players[id]).filter(Boolean);

    if (this.matchResult) {
      // Show result with simulator or events based on mode
      return this.renderMatchResult(m, homeT, awayT);
    }

    return `
    <div class="screen-game">
      ${this.renderNavbar(gs.getPlayerTeam())}
      <div class="game-content">
        <div class="match-preview">
          <div class="match-teams-header">
            <div class="match-team-card" style="border-top-color:${homeT.color}">
              <div class="match-badge" style="background:${homeT.color};color:${homeT.color2}">${this.teamLogo(homeT.id, homeT.name, homeT.color, homeT.color2, 46)}</div>
              <h2>${homeT.name}</h2><p>${homeT.city}</p>
            </div>
            <div class="vs-badge">VS</div>
            <div class="match-team-card" style="border-top-color:${awayT.color}">
              <div class="match-badge" style="background:${awayT.color};color:${awayT.color2}">${this.teamLogo(awayT.id, awayT.name, awayT.color, awayT.color2, 46)}</div>
              <h2>${awayT.name}</h2><p>${awayT.city}</p>
            </div>
          </div>
          <div class="match-info-bar">
            <span>🏟️ ${homeT.stadium}</span>
            <span>📅 Rodada ${m.week}</span>
            <span>${isHome?'🏠 Casa':'✈️ Fora'}</span>
          </div>

          <!-- Análise pré-jogo: força e probabilidades -->
          ${(() => {
            const ai = new AIManager(gs);
            const hPlayers = gs.getTeamPlayers(m.home).filter(p=>!p.injured&&!p.retired);
            const aPlayers = gs.getTeamPlayers(m.away).filter(p=>!p.injured&&!p.retired);
            const hOvr = hPlayers.length ? Math.round(hPlayers.reduce((a,p)=>a+(p.overall||65),0)/hPlayers.length) : 65;
            const aOvr = aPlayers.length ? Math.round(aPlayers.reduce((a,p)=>a+(p.overall||65),0)/aPlayers.length) : 65;
            const homeAdv = m.home === gs.playerTeamId ? 3 : (m.home !== gs.playerTeamId ? 3 : 0);
            const hStr = hOvr + homeAdv;
            const aStr = aOvr;
            const total = hStr + aStr;
            const hWin = Math.round((hStr/total)*100);
            const aWin = 100 - Math.round((hStr/total)*100) - 15;
            const draw = 100 - hWin - Math.max(0,aWin);
            const fav = hStr > aStr+3 ? homeT.name : aStr > hStr+3 ? awayT.name : 'Equilíbrio';
            const hForm = (homeT.form||[]).slice(0,5).map(f=>f==='W'?'🟢':f==='D'?'🟡':'🔴').join('');
            const aForm = (awayT.form||[]).slice(0,5).map(f=>f==='W'?'🟢':f==='D'?'🟡':'🔴').join('');
            return `<div style="background:var(--bg3);border:1px solid var(--border);border-radius:10px;padding:14px;margin-bottom:14px">
              <div style="font-family:'Barlow Condensed',sans-serif;font-size:.75rem;font-weight:800;color:var(--text3);letter-spacing:.12em;text-transform:uppercase;margin-bottom:10px">📊 Análise Pré-Jogo</div>
              <div style="display:grid;grid-template-columns:1fr auto 1fr;gap:10px;align-items:center;margin-bottom:10px">
                <div style="text-align:center">
                  <div style="font-family:'Barlow Condensed',sans-serif;font-size:1.8rem;font-weight:900;color:${hOvr>=78?'#f0c84a':hOvr>=70?'#28c856':'var(--text2)'};${isHome?'':'opacity:.8'}">${hOvr}</div>
                  <div style="font-size:9px;color:var(--text4);text-transform:uppercase">OVR Médio</div>
                  <div style="font-size:10px;margin-top:3px">${hForm||'—'}</div>
                  ${m.home===gs.playerTeamId?'<div style="font-size:9px;color:#f0c84a;margin-top:2px">🏠 Casa</div>':''}
                </div>
                <div style="text-align:center;padding:0 8px">
                  <div style="font-size:10px;color:var(--text4);margin-bottom:4px">Favorito</div>
                  <div style="font-family:'Barlow Condensed',sans-serif;font-size:13px;font-weight:800;color:${fav==='Equilíbrio'?'var(--gold)':'var(--text)'}">${fav==='Equilíbrio'?'⚖️ Equilíbrio':fav}</div>
                </div>
                <div style="text-align:center">
                  <div style="font-family:'Barlow Condensed',sans-serif;font-size:1.8rem;font-weight:900;color:${aOvr>=78?'#f0c84a':aOvr>=70?'#28c856':'var(--text2)'};${!isHome?'':'opacity:.8'}">${aOvr}</div>
                  <div style="font-size:9px;color:var(--text4);text-transform:uppercase">OVR Médio</div>
                  <div style="font-size:10px;margin-top:3px">${aForm||'—'}</div>
                  ${m.away===gs.playerTeamId?'<div style="font-size:9px;color:#f0c84a;margin-top:2px">🏠 Casa</div>':''}
                </div>
              </div>
              <div style="background:var(--bg4);border-radius:6px;overflow:hidden;height:6px;display:flex;margin-bottom:6px">
                <div style="width:${hWin}%;background:#28c856;border-radius:6px 0 0 6px"></div>
                <div style="width:${draw}%;background:#f0c84a"></div>
                <div style="width:${Math.max(0,aWin)}%;background:#e74c3c;border-radius:0 6px 6px 0"></div>
              </div>
              <div style="display:flex;justify-content:space-between;font-size:10px;color:var(--text4)">
                <span>${hWin}% vitória</span><span>${draw}% empate</span><span>${Math.max(0,aWin)}% vitória</span>
              </div>
            </div>`;
          })()}
          <div class="match-squad-check">
            <h3 style="margin-bottom:8px">Sua escalação (${squad.length}/5):</h3>
            ${squad.length < 5 ? '<p class="warn">⚠️ Escale 5 jogadores em Táticas antes de jogar!</p>' :
              `<div class="squad-preview">${squad.map(p=>`<div class="sp-row"><span class="pos-badge-sm" style="background:${{GL:'#e67e22',FIX:'#2980b9',ALA:'#27ae60','PÍV':'#c0392b'}[p.position]||'#555'}">${p.position}</span><span>${p.name}</span><span>${p.overall}</span></div>`).join('')}</div>`}
          </div>
          <div class="match-tactics-summary">Formação: <strong>${gs.tactics.formation}</strong> · Estilo: <strong>${gs.tactics.style}</strong></div>

          <div class="match-opt-tabs" style="margin-top:16px">
            <button class="match-opt-btn ${this.matchViewMode==='sim'?'active':''}" data-action="setmatchview" data-val="sim">🎮 Simulação Visual</button>
            <button class="match-opt-btn ${this.matchViewMode==='events'?'active':''}" data-action="setmatchview" data-val="events">📋 Apenas Eventos</button>
            <button class="match-opt-btn match-opt-locked" disabled title="Em manutenção — próxima atualização">🔒 Ao Vivo <span class="locked-badge">EM BREVE</span></button>
          </div>

          ${squad.length >= 5
            ? `<button class="btn-kickoff" data-action="kickoff">⚡ INICIAR PARTIDA</button>`
            : `<button class="btn btn-secondary" style="width:100%;justify-content:center;margin-top:14px" data-action="tactics">⚙️ Ir para Táticas</button>`}
        </div>
      </div>
    </div>`;
  }

  renderMatchResult(match, homeT, awayT) {
    const r = this.matchResult;
    const isHome = match.home === this.gs.playerTeamId;
    const myScore = isHome ? r.score.home : r.score.away;
    const theirScore = isHome ? r.score.away : r.score.home;
    const won = myScore > theirScore, drew = myScore === theirScore;
    const resultClass = won?'result-win':drew?'result-draw':'result-loss';
    const resultText = won?'⚡ VITÓRIA!':drew?'EMPATE':'😔 DERROTA';

    const _pcEvt = {GL:'#e67e22',FIX:'#2980b9',ALA:'#27ae60','PÍV':'#c0392b'};
    const eventsHTML = r.events.filter(e=>['goal','yellow','red','injury','period_end','powerplay','save'].includes(e.type)).map(e => {
      const icon = {goal:'⚽',yellow:'🟨',red:'🟥',injury:'🤕',period_end:'🏁',powerplay:'🔥',save:'🧤'}[e.type]||'•';
      const evPhoto = (e.player && window.playerPhotoHTML) ? window.playerPhotoHTML(e.player.name,22,e.player.position,_pcEvt[e.player.position]||'#555') : '';
      const teamName = e.team==='home'?homeT.name:e.team==='away'?awayT.name:'';
      let text = '';
      if(e.type==='goal') text=`${e.player?.name||'?'} (${teamName})${e.extra?.assister?' · Assist: '+e.extra.assister.name:''}`;
      if(e.type==='yellow') text=`Amarelo: ${e.player?.name||'?'} (${teamName})`;
      if(e.type==='injury') text=`Lesão: ${e.player?.name||'?'} — ${e.player?.injuryDays||0} dias`;
      if(e.type==='period_end') text=`Fim do ${e.extra?.period===1?'1º':'2º'} tempo: ${e.extra?.score?.home||0}–${e.extra?.score?.away||0}`;
      if(e.type==='powerplay') text=`Goleiro-linha ativado (${teamName})`;
      return `<div class="event-row event-${e.type}">
        <span class="ev-min">${e.minute}'</span>
        <span class="ev-icon">${icon}</span>
        <span class="ev-text">${text}</span>
      </div>`;
    }).join('');

    return `
    <div class="screen-game">
      ${this.renderNavbar(this.gs.getPlayerTeam())}
      <div class="game-content">
        <div class="match-result-screen">
          <div class="result-banner ${resultClass}">${resultText}</div>
          <div class="final-score">
            <div class="score-team" style="display:flex;flex-direction:column;align-items:center;gap:6px">
              ${this.teamLogo(homeT.id,homeT.name,homeT.color,homeT.color2,32)}
              <span>${homeT.name}</span>
            </div>
            <div class="score-numbers">${r.score.home} – ${r.score.away}</div>
            <div class="score-team" style="display:flex;flex-direction:column;align-items:center;gap:6px">
              ${this.teamLogo(awayT.id,awayT.name,awayT.color,awayT.color2,32)}
              <span>${awayT.name}</span>
            </div>
          </div>
          <div class="match-stats-grid">
            <div class="mstat"><span>${r.stats.home.shots}</span><span>Chutes</span><span>${r.stats.away.shots}</span></div>
            <div class="mstat"><span>${r.stats.home.shotsOnTarget}</span><span>No Alvo</span><span>${r.stats.away.shotsOnTarget}</span></div>
            <div class="mstat"><span>${r.stats.home.possession}%</span><span>Posse</span><span>${r.stats.away.possession}%</span></div>
            <div class="mstat"><span>${r.stats.home.fouls}</span><span>Faltas</span><span>${r.stats.away.fouls}</span></div>
            <div class="mstat"><span>${r.stats.home.saves}</span><span>Defesas</span><span>${r.stats.away.saves}</span></div>
            <div class="mstat"><span>${r.homeFouls||0}</span><span>F.Acum.</span><span>${r.awayFouls||0}</span></div>
          </div>

          ${this.matchViewMode === 'sim' ? `<div id="match-sim-container" style="margin-bottom:16px"></div>` : ''}

          <div class="match-events">
            <h3 style="margin-bottom:10px">Eventos da Partida</h3>
            <div class="events-log">${eventsHTML}</div>
          </div>
          <button class="btn btn-primary" style="margin-top:16px;width:100%;justify-content:center" data-action="nextweek">⏭ Avançar Rodada</button>
        </div>
      </div>
    </div>`;
  }

  // ── NAVBAR ───────────────────────────────────────────────────
  renderNavbar(team) {
    const gs = this.gs;
    const t = team || {};
    const nav = [
      {id:'dashboard',icon:'🏠',label:'Home'},
      {id:'squad',icon:'👥',label:'Elenco'},
      {id:'tactics',icon:'⚙️',label:'Táticas'},
      {id:'transfers',icon:'🔄',label:'Mercado'},
      {id:'league',icon:'🏆',label:'Liga'},
      {id:'staff',icon:'👔',label:'Staff'},
      {id:'training',icon:'🏋️',label:'Treino'},
      {id:'finances',icon:'💰',label:'Finanças'},
      {id:'trophy',icon:'🏆',label:'Troféus'},
    ];
    return `
    <nav class="game-navbar">
      <div class="nav-brand">
        <div class="nav-badge" style="background:${t.color||'#333'};color:${t.color2||'#fff'}">${this.teamLogo(t.id, t.name, t.color, t.color2, 28)}</div>
        <span class="nav-brand-name">${t.name||'FM'}</span>
      </div>
      <div class="nav-links">
        ${nav.map(n=>`<button class="nav-btn ${this.currentScreen===n.id?'active':''}" data-action="${n.id}">
          <span class="nav-icon">${n.icon}</span><span>${n.label}</span>
        </button>`).join('')}
      </div>
      <div class="nav-right">
        <span class="nav-week">Rod. ${gs.currentWeek}</span>
        <span class="nav-budget">${this.fmt(gs.budget)}</span>
        <button class="nav-patchbtn" data-action="patchnotes" title="Patch Notes v10.0">📋 v10.0</button>
        <button class="nav-btn ${this.currentScreen==='trophy'?'active':''}" data-action="trophy" title="Sala de Troféus" style="gap:4px"><span class="nav-icon">🏆</span><span>Troféus</span></button>
        ${this.gs.worldCup ? `<button class="nav-btn ${this.currentScreen==='worldcup'?'active':''}" data-action="worldcup" title="Copa do Mundo" style="gap:4px;color:#f0c84a"><span>🌍</span><span>Copa</span></button>` : ''}
        <button class="nav-settings-btn" data-action="settings-ingame" title="Configurações">⚙️</button>
        <button class="btn-save" data-action="save" title="Salvar">💾</button>
      </div>
    </nav>`;
  }

  // ── EVENTS ───────────────────────────────────────────────────
  attachEvents() {
    document.querySelectorAll('[data-action]').forEach(el => {
      el.addEventListener('click', e => {
        if (window.audio) window.audio.click();
        this.handleAction(e);
      });
    });
    document.querySelectorAll('input[type=range]').forEach(el => {
      el.addEventListener('input', e => this.handleSlider(e));
    });
    document.querySelectorAll('select[data-action]').forEach(el => {
      el.addEventListener('change', e => this.handleAction(e));
    });
    document.querySelectorAll('input[data-action]').forEach(el => {
      el.addEventListener('change', e => this.handleAction(e));
    });
    document.querySelectorAll('select[data-action=assigntrain]').forEach(el => {
      el.addEventListener('change', () => this.assignTrain(el.dataset.pid, el.value));
    });

    // Tactic toggles
    const glToggle = document.getElementById('toggle-gl');
    if (glToggle) glToggle.addEventListener('change', e => {
      this.gs.tactics.goleirolinha = e.target.checked;
      glToggle.closest('.tac-toggle')?.classList.toggle('on', e.target.checked);
    });

    // Settings toggles
    const tmWrap = document.getElementById('toggle-music-wrap');
    const tmInput = document.getElementById('toggle-music');
    if (tmInput) tmInput.addEventListener('change', e => {
      if (window.audio) window.audio.toggleMusic(e.target.checked);
      tmWrap?.classList.toggle('on', e.target.checked);
    });
    const tsWrap = document.getElementById('toggle-sfx-wrap');
    const tsInput = document.getElementById('toggle-sfx');
    if (tsInput) tsInput.addEventListener('change', e => {
      if (window.audio) window.audio.toggleSFX(e.target.checked);
      tsWrap?.classList.toggle('on', e.target.checked);
    });
    const volMus = document.getElementById('vol-music');
    if (volMus) volMus.addEventListener('input', e => {
      const v = parseInt(e.target.value)/100;
      if (window.audio) window.audio.setMusicVolume(v);
      const lab = e.target.closest('.setting-row')?.querySelector('.setting-label span');
      if (lab) lab.textContent = e.target.value + '%';
    });
    const volSfx = document.getElementById('vol-sfx');
    if (volSfx) volSfx.addEventListener('input', e => {
      const v = parseInt(e.target.value)/100;
      if (window.audio) window.audio.setSFXVolume(v);
      const lab = e.target.closest('.setting-row')?.querySelector('.setting-label span');
      if (lab) lab.textContent = e.target.value + '%';
    });

    // Auto-save toggle
    const asWrap = document.getElementById('toggle-autosave-wrap');
    const asInput = document.getElementById('toggle-autosave');
    if (asInput) asInput.addEventListener('change', e => {
      this._setAutoSave(e.target.checked);
      asWrap?.classList.toggle('on', e.target.checked);
      this.showToast(e.target.checked ? '💾 Auto-save ativado' : '💾 Auto-save desativado', 'info');
    });

    // Match sim init after render
    if (this.currentScreen === 'match' && this.matchResult && this.matchViewMode === 'sim') {
      this._initMatchSim();
    }
    // Drag & drop na tela de táticas
    if (this.currentScreen === 'tactics' && window.initDragDrop) {
      setTimeout(() => initDragDrop(this.gs, this), 50);
    }
  }

  _initMatchSim() {
    const container = document.getElementById('match-sim-container');
    if (!container || !this.matchResult || !this.pendingMatch) return;
    const gs = this.gs;
    const m = this.pendingMatch;
    const homeT = gs.teams[m.home], awayT = gs.teams[m.away];
    try {
      const sim = new MatchSimulator(container, homeT, awayT, this.matchResult.events, this.matchResult.stats, this.matchResult.score, gs);
      setTimeout(() => sim.start(), 300);
    } catch(e) {
      console.warn('MatchSim error:', e);
    }
  }

  handleSlider(e) {
    const key = e.target.dataset.key;
    const val = parseInt(e.target.value);
    const sib = e.target.nextElementSibling;
    if (sib) sib.textContent = val;
    if (key && this.gs.tactics) {
      const map = {pressao:'pressao',linhadefensiva:'linhaDefensiva',largura:'largura',ritmo:'ritmo'};
      if (map[key]) this.gs.tactics[map[key]] = val;
    }
  }

  handleAction(e) {
    const el = e.currentTarget || e.target;
    const action = el.dataset.action;
    if (!action) return;
    e.stopPropagation();

    switch(action) {
      case 'menu':       if (window.audio) window.audio.navigate(); this.render('menu'); break;
      case 'newgame':    if (window.audio) window.audio.navigate(); this.render('newgame'); break;
      case 'dashboard':  this.matchResult = null; if (window.audio) window.audio.navigate(); this.render('dashboard'); break;
      case 'squad':      if (window.audio) window.audio.navigate(); this.render('squad'); break;
      case 'tactics':    if (window.audio) window.audio.navigate(); this.render('tactics'); break;
      case 'transfers':  if (window.audio) window.audio.navigate(); this.render('transfers'); break;
      case 'league':     if (window.audio) window.audio.navigate(); this.render('league'); break;
      case 'staff':      if (window.audio) window.audio.navigate(); this.render('staff'); break;
      case 'training':   if (window.audio) window.audio.navigate(); this.render('training'); break;
      case 'finances':   if (window.audio) window.audio.navigate(); this.render('finances'); break;

      case 'fintab':        this.finTab = el.dataset.tab; this.render('finances'); break;
      case 'signsponsor': {
        const ok = this.gs.signSponsor?.(el.dataset.sid);
        if (ok) { if(window.SFX) window.SFX.transfer?.(); this.showToast('✍️ Contrato de patrocínio fechado!'); }
        else this.showToast('Não foi possível fechar o contrato.','error');
        this.render('finances'); break;
      }
      case 'cancelsponsor':
        if (confirm('Cancelar contrato com este patrocinador?')) {
          this.gs.cancelSponsor?.(el.dataset.sid);
          this.showToast('Contrato cancelado.','warn');
          this.render('finances');
        }
        break;
      case 'renewcontract': {
        const result = this.gs.renewContract?.(el.dataset.pid, 2);
        if (result?.ok) { if(window.SFX) window.SFX.success?.(); this.showToast(result.msg); }
        else this.showToast(result?.msg || 'Erro ao renovar.','error');
        this.render('finances'); break;
      }
      case 'patchnotes':   this._showPatchNotes(); break;
      case 'trophy':       if (window.audio) window.audio.navigate(); this.render('trophy'); break;
      case 'gtournament':  if (window.audio) window.audio.navigate(); this.render('gtournament'); break;
      case 'ranking':      if (window.audio) window.audio.navigate(); this.render('ranking'); break;
      case 'academy':      if (window.audio) window.audio.navigate(); this.render('academy'); break;
      case 'worldcup':     if (window.audio) window.audio.navigate(); this.render('worldcup'); break;
      case 'credits':    if (window.audio) window.audio.navigate(); this.render('credits'); break;
      case 'settings':   if (window.audio) window.audio.navigate(); this.render('settings'); break;
      case 'settings-ingame': if (window.audio) window.audio.navigate(); this._prevScreen = this.currentScreen; this.render('settings'); break;
      case 'calendar':   if (window.audio) window.audio.navigate(); this.render('calendar'); break;
      case 'skip-to-week': {
        const targetW = parseInt(el.dataset.week);
        if (!isNaN(targetW) && targetW > this.gs.currentWeek && !this.gs.endOfSeason) {
          let skipped = 0;
          while (this.gs.currentWeek < targetW && !this.gs.endOfSeason) {
            const pm = this.gs.getPlayerWeekMatch?.();
            if (pm && !pm.played) {
              const ht = this.gs.teams[pm.home], at = this.gs.teams[pm.away];
              const ai2 = new AIManager(this.gs);
              const hs2 = ai2.pickSquad(pm.home), as2 = ai2.pickSquad(pm.away);
              const res = new MatchEngine(ht,at,hs2,as2,ai2.chooseTactics(pm.home),ai2.chooseTactics(pm.away)).simulate();
              this.gs.processMatchResult(pm.id, ht?.league||this.gs.teams[this.gs.playerTeamId]?.league, res);
            }
            this.gs.simulateAIRound(this.gs.currentWeek);
            this.gs._processSponsorPayments?.();
            this.gs._processContractExpirations?.();
            this.gs.currentWeek++; skipped++;
            if (this.gs.currentWeek > this.gs.totalWeeks) { this.gs.endOfSeason = true; break; }
          }
          if (this.gs.endOfSeason) { this._showEndOfSeasonModal?.(); return; }
          this.showToast(`⏭ Avançou ${skipped} rodada${skipped!==1?'s':''} → Rod. ${this.gs.currentWeek}`, 'info');
          if (this._getAutoSave?.() && this.gs.initialized) try{this.gs.save();}catch(e){}
          this.render('calendar');
        }
        break;
      }
      case 'back-settings':
        if (window.audio) window.audio.navigate();
        if (this._prevScreen && this._prevScreen !== 'settings') this.render(this._prevScreen);
        else if (this.gs.initialized) this.render('dashboard');
        else this.render('menu');
        break;

      case 'selectteam': this.startNewGame(el.dataset.teamid); break;
      case 'loadgame':
        if (this.gs.load()) { if (window.audio) window.audio.playGameMusic(); this.render('dashboard'); }
        else alert('Nenhum save encontrado!');
        break;
      case 'save':
        if (this.gs.save()) this.showToast('Jogo salvo! 💾');
        else this.showToast('Erro ao salvar!', 'error');
        break;

      case 'addtitular':    this.addTitular(el.dataset.pid); break;
      case 'removetitular': this.removeTitular(el.dataset.pid); break;
      case 'viewplayer':    this.viewPlayer(el.dataset.pid); break;

      case 'tacadd':       this.tacAdd(el.dataset.pid); break;
      case 'tacremove':    this.tacRemove(el.dataset.pid, el.dataset.idx); break;
      case 'setformation': this.gs.tactics.formation = el.dataset.val; this.render('tactics'); break;
      case 'setstyle':     this.gs.tactics.style = el.dataset.val; this.render('tactics'); break;

      case 'buytransfer':     this.buyPlayer(el.dataset.pid); break;
      case 'switchleaguetab': this.leagueTab = el.dataset.tab; this.render('league'); break;
      case 'addtolist':       this.addToTransferList(); break;
      case 'removefromlist':  this.removeFromTransferList(el.dataset.pid); break;
      case 'filterpos':       this.transferFilter.position = el.value; this.render('transfers'); break;
      case 'filterovr':       this.transferFilter.minOvr = parseInt(el.value)||0; this.render('transfers'); break;
      case 'filterprice':     this.transferFilter.maxPrice = (parseFloat(el.value)||999999)*1000; this.render('transfers'); break;

      case 'setmatchview': this.matchViewMode = el.dataset.val; this.render('match'); break;
      case 'playmatch':    this.preparMatch(el.dataset.matchid, el.dataset.leagueid); break;
      case 'simplayermatch': this.simPlayerMatch(); break;
      case 'kickoff':
        if (this.matchViewMode === 'sim') this.startSimVisual();
        else this.playMatch();
        break;
      case 'livematch':    this.showToast('🔒 Modo Ao Vivo em manutenção — disponível na próxima atualização!', 'warn'); break;
      case 'nextweek':     this.nextWeek(); break;

      case 'hirestaff':    this.hireStaff(el.dataset.role, parseInt(el.dataset.cost)); break;
      case 'firestaff':    this.fireStaff(el.dataset.role); break;
      case 'upgradestaff': this.upgradeStaff(el.dataset.role, parseInt(el.dataset.cost)); break;

      case 'autosquad':     this.autoPickSquad(); break;
      case 'autotrain':     this.autoAssignTraining(); break;
      case 'unassigntrain': this.unassignTrain(el.dataset.pid); break;

      // World Cup actions
      case 'wc-play':
        this.playWorldCupMatch(el.dataset.matchId, el.dataset.phase);
        break;
      case 'wc-sim':
        this.simWorldCupMatch(el.dataset.matchId, el.dataset.phase);
        break;
      case 'wc-sim-all':
        this.gs.simAllWorldCupPhase();
        this.render('worldcup');
        break;
      case 'wc-advance':
        this.gs.advanceWorldCupPhase();
        if (this.gs.worldCup?.phase === 'done') {
          if (window.SFX) window.SFX.win?.();
          const champ = this.gs.teams[this.gs.worldCup.champion];
          if (this.gs.worldCup.champion === this.gs.playerTeamId) {
            this.showToast('🌍🏆 VOCÊ É O CAMPEÃO MUNDIAL! 🏆🌍', 'success');
          } else {
            this.showToast(`🏆 ${champ?.name || 'Time'} é o Campeão Mundial!`, 'info');
          }
        }
        this.render('worldcup');
        break;

      // Settings actions
      case 'setscale':
        this.uiScale = parseFloat(el.dataset.val);
        this._applyScale(); this._saveUISettings();
        this.render('settings');
        break;
      case 'togglefullscreen':
        if (!document.fullscreenElement) document.documentElement.requestFullscreen?.();
        else document.exitFullscreen?.();
        break;
      case 'killmusic':
        if (window.audio) { window.audio.toggleMusic(false); window.audio.musicEnabled = false; window.audio.saveSettings(); }
        this.showToast('Música removida 🔇');
        this.render('settings');
        break;
      case 'deletesave':
        if (confirm('Apagar todo o progresso salvo?')) {
          localStorage.removeItem('futsalmanager_save');
          this.showToast('Save apagado.', 'warn');
        }
        break;
    }
  }

  // ── GAME ACTIONS ─────────────────────────────────────────────

  // ── LIVE MATCH SCREEN ────────────────────────────────────────
  renderLiveMatchScreen() {
    const team = this.gs.getPlayerTeam();
    return `
    <div class="screen-live-match">
      ${this.renderNavbar(team)}
      <div class="live-match-container">
        <div id="live-match-root" class="live-match-wrap" style="min-height:500px;position:relative">
          <div style="display:flex;align-items:center;justify-content:center;min-height:400px;color:#4e6d88;font-family:'Barlow Condensed',sans-serif;letter-spacing:.1em;text-transform:uppercase;font-size:13px">
            Inicializando simulação ao vivo...
          </div>
        </div>
      </div>
    </div>`;
  }

  startLiveMatch() {
    const m = this.pendingMatch;
    if (!m) return;
    const gs = this.gs;

    // Guard: need 5 players
    const playerSquad = gs.squad.map(id => gs.players[id]).filter(Boolean).slice(0, 5);
    if (playerSquad.length < 5) {
      this.showToast('⚠️ Escale 5 jogadores em Táticas antes de jogar!', 'warn');
      return;
    }

    const homeT   = gs.teams[m.home];
    const awayT   = gs.teams[m.away];
    const isHome  = m.home === gs.playerTeamId;
    const ai      = new AIManager(gs);
    const oppId   = isHome ? m.away : m.home;
    const oppSquad  = ai.pickSquad(oppId);
    const homeSquad = isHome ? playerSquad : oppSquad;
    const awaySquad = isHome ? oppSquad : playerSquad;
    const homeTac   = isHome ? gs.tactics : ai.chooseTactics(m.home);
    const awayTac   = isHome ? ai.chooseTactics(m.away) : gs.tactics;

    if (window.SFX) window.SFX.kickoff?.();
    this.render('livematch');

    const leagueId = this.pendingLeague;
    const self = this;
    setTimeout(() => {
      const root = document.getElementById('live-match-root');
      if (!root) return;
      try {
        const lm = new LiveMatch(root, homeT, awayT, homeSquad, awaySquad, homeTac, awayTac, gs, (result) => {
          self.matchResult = result;
          lm.matchResult = result; // store ref on LiveMatch too for overlay
          gs.processMatchResult(m.id, leagueId, result);
          // Sound result
          const isHomeP = m.home === gs.playerTeamId;
          const myS = isHomeP ? result.score.home : result.score.away;
          const theirS = isHomeP ? result.score.away : result.score.home;
          if (window.audio) {
            if (myS > theirS) setTimeout(() => window.audio.win(), 1200);
            else if (myS < theirS) setTimeout(() => window.audio.lose(), 1200);
          }
        });
        window._currentLiveMatch = lm;
        lm.start();
      } catch(err) {
        console.error('LiveMatch error:', err);
        root.innerHTML = `<div style="color:#ff5c5c;padding:24px;font-family:monospace;font-size:12px">
          <strong>Erro na simulação:</strong><br>${err.message}<br><br><pre style="overflow:auto;max-height:200px">${err.stack}</pre>
          <button style="margin-top:12px;padding:8px 16px;background:#1d4a6e;border:1px solid #4a90e2;color:#fff;border-radius:5px;cursor:pointer" onclick="window.ui?.render('match')">← Voltar</button>
        </div>`;
      }
    }, 150);
  }

  startNewGame(teamId) {
    if (!teamId) return;
    const db = window.generateDatabase();
    this.gs.init(db, teamId);
    if (window.audio) window.audio.playGameMusic();
    this.render('dashboard');
    this.showToast(`Bem-vindo ao ${this.gs.teams[teamId]?.name}! 🏆`);
  }

  addTitular(pid) {
    this.gs.squad = (this.gs.squad||[]).filter(id => id && this.gs.players[id]);
    if (this.gs.squad.length >= 5) { this.showToast('Já tem 5 titulares!', 'warn'); return; }
    if (!this.gs.squad.includes(pid)) this.gs.squad.push(pid);
    this.render('squad');
  }
  removeTitular(pid) {
    this.gs.squad = (this.gs.squad||[]).filter(id => id !== pid && id && this.gs.players[id]);
    this.render('squad');
  }
  viewPlayer(pid) {
    this.selectedPlayer = this.gs.players[pid];
    this.render('squad');
  }
  tacAdd(pid) {
    const gs = this.gs;
    gs.squad = (gs.squad||[]).filter(id => id && gs.players[id]);
    if (gs.squad.length >= 5) { this.showToast('Já tem 5 titulares!', 'warn'); return; }
    if (!gs.squad.includes(pid)) gs.squad.push(pid);
    this.render('tactics');
  }
  tacRemove(pid) {
    this.gs.squad = (this.gs.squad||[]).filter(id => id !== pid && id && this.gs.players[id]);
    this.render('tactics');
  }

  // Drag & drop: coloca jogador em slot específico da quadra
  tacPlaceInSlot(pid, slotIdx) {
    const gs = this.gs;
    // Garantir array de 5 slots (preserva posições/índices)
    if (!Array.isArray(gs.squad)) gs.squad = [null,null,null,null,null];
    while (gs.squad.length < 5) gs.squad.push(null);
    gs.squad = gs.squad.slice(0, 5);
    // Valida jogador
    if (!pid || !gs.players[pid]) return;
    if (slotIdx < 0 || slotIdx > 4) return;
    // Remove de slot anterior se já estava na quadra
    const oldIdx = gs.squad.indexOf(pid);
    const existing = gs.squad[slotIdx];
    if (oldIdx !== -1) gs.squad[oldIdx] = null;
    // Troca: se slot já tem alguém E o pid veio de outro slot, swap
    if (existing && existing !== pid && oldIdx !== -1) {
      gs.squad[oldIdx] = existing;
    }
    // Coloca no slot destino
    gs.squad[slotIdx] = pid;
    if (window.audio) window.audio.click();
    this.render('tactics');
  }

  // Drag & drop: remove jogador do slot
  tacRemoveSlot(slotIdx) {
    const gs = this.gs;
    gs.squad = (gs.squad||[]).filter(id => id && gs.players[id]);
    while (gs.squad.length < 5) gs.squad.push(null);
    gs.squad[slotIdx] = null;
    gs.squad = gs.squad.slice(0,5);
    this.render('tactics');
  }

  buyPlayer(pid) {
    const p = this.gs.players[pid];
    if (!p) return;
    if (this.gs.budget < p.value) { this.showToast('Orçamento insuficiente!', 'error'); return; }
    const existing = document.getElementById('buy-confirm-overlay');
    if (existing) existing.remove();
    const ov = document.createElement('div');
    ov.id = 'buy-confirm-overlay';
    ov.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.65);z-index:9500;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(4px)';
    const posC = {GL:'#e67e22',FIX:'#2980b9',ALA:'#27ae60','PÍV':'#c0392b'};
    const ph = window.playerPhotoHTML ? window.playerPhotoHTML(p.name,56,p.position,posC[p.position]||'#555') : '';
    ov.innerHTML = `<div style="background:var(--bg2);border:1px solid var(--border);border-radius:16px;padding:24px 28px;max-width:360px;width:90vw;text-align:center;box-shadow:0 24px 64px rgba(0,0,0,.7)">
      <div style="display:flex;justify-content:center;margin-bottom:12px">${ph}</div>
      <div style="font-family:'Barlow Condensed',sans-serif;font-size:1.3rem;font-weight:900;color:var(--text);margin-bottom:4px">${p.name}</div>
      <div style="font-size:12px;color:var(--text3);margin-bottom:14px">${p.position} · ${p.age}a · OVR ${p.overall}</div>
      <div style="font-size:13px;color:var(--text2);margin-bottom:18px">Contratar por <strong style="color:var(--gold)">${this.fmt(p.value)}</strong>?<br>
        <span style="font-size:11px;color:var(--text4)">Salário: ${this.fmt(p.salary)}/mês · Saldo restante: ${this.fmt(this.gs.budget-p.value)}</span></div>
      <div style="display:flex;gap:10px;justify-content:center">
        <button id="buy-yes" class="btn btn-primary" style="flex:1">✅ Contratar</button>
        <button id="buy-no" class="btn btn-ghost" style="flex:1">Cancelar</button>
      </div></div>`;
    document.body.appendChild(ov);
    document.getElementById('buy-yes').onclick = () => {
      ov.remove();
      if (this.gs.executeTransfer(pid, this.gs.playerTeamId, p.value)) {
        if (window.audio) window.audio.transfer();
        this.showToast(`🎉 ${p.name} contratado!`, 'success');
        this.gs.news.unshift({date:`Rod. ${this.gs.currentWeek}`,type:'transferencia',text:`✅ Contratou ${p.name} por ${this.fmt(p.value)}`});
        this.render('transfers');
      } else { this.showToast('Erro ao contratar.', 'error'); }
    };
    document.getElementById('buy-no').onclick = () => ov.remove();
    ov.onclick = e => { if (e.target===ov) ov.remove(); };
  }
  addToTransferList() {
    const sel = document.getElementById('sell-select');
    if (!sel || !sel.value) return;
    const p = this.gs.players[sel.value];
    if (!p) return;
    p.onTransferList = true;
    if (!this.gs.transferMarket.find(tm=>tm.id===p.id)) this.gs.transferMarket.push(p);
    this.showToast(`${p.name} listado no mercado! 📋`);
    this.render('transfers');
  }
  removeFromTransferList(pid) {
    const p = this.gs.players[pid];
    if (p) { p.onTransferList = false; this.gs.transferMarket = this.gs.transferMarket.filter(tm=>tm.id!==pid); }
    this.render('transfers');
  }
  acceptOffer(offerId) {
    const gs = this.gs;
    gs.pendingOffers = gs.pendingOffers || [];
    const offer = gs.pendingOffers.find(o => o.id === offerId);
    if (!offer) { this.showToast('Proposta não encontrada.', 'error'); return; }
    const p = gs.players[offer.playerId];
    if (!p) { this.showToast('Jogador não encontrado.', 'error'); return; }
    if (gs.executeTransfer(offer.playerId, offer.buyerTeamId, offer.offer)) {
      gs.pendingOffers = gs.pendingOffers.filter(o => o.id !== offerId);
      if (window.audio) window.audio.transfer();
      this.showToast(`💰 ${p.name} vendido por ${this.fmt(offer.offer)}!`, 'success');
      gs.news.unshift({date:`Rod. ${gs.currentWeek}`,type:'transferencia',text:`💸 ${p.name} → ${offer.buyerName} por ${this.fmt(offer.offer)}`});
      this.render('transfers');
    } else { this.showToast('Erro ao processar venda.', 'error'); }
  }
  rejectOffer(offerId) {
    const gs = this.gs;
    gs.pendingOffers = gs.pendingOffers || [];
    const offer = gs.pendingOffers.find(o => o.id === offerId);
    if (!offer) return;
    gs.pendingOffers = gs.pendingOffers.filter(o => o.id !== offerId);
    this.showToast('Proposta recusada.', 'info');
    gs.news.unshift({date:`Rod. ${gs.currentWeek}`,type:'geral',text:`❌ Recusou proposta de ${offer.buyerName} por ${offer.playerName}`});
    this.render('transfers');
  }

  preparMatch(matchId, leagueId) {
    this.pendingMatch  = (this.gs.schedules[leagueId] || []).find(m => m.id === matchId) || null;
    this.pendingLeague = leagueId;
    this.matchResult   = null;
    if (window.audio) window.audio.navigate?.();
    this.render('match');
  }

  playMatch() {
    const m = this.pendingMatch;
    if (!m) return;
    if (window.audio) window.audio.kickoff();
    const gs = this.gs;
    const homeT = gs.teams[m.home], awayT = gs.teams[m.away];
    const isHome = m.home === gs.playerTeamId;
    const playerSquad = gs.squad.map(id=>gs.players[id]).filter(Boolean).slice(0,5);
    const ai = new AIManager(gs);
    const oppId = isHome ? m.away : m.home;
    const oppSquad = ai.pickSquad(oppId);
    const homeSquad = isHome ? playerSquad : oppSquad;
    const awaySquad = isHome ? oppSquad : playerSquad;
    const playerTacRaw = { ...gs.tactics };
    // Staff bônus sobre táticas — assistente melhora análise de adversário (+pressão)
    const staff = gs.coachingStaff || {};
    const assistLv  = (staff.assistente?.level||0);
    const analistLv = (staff.analistaTatico?.level||0);
    const prepLv    = (staff.preparadorFisico?.level||0);
    if (assistLv  > 0) playerTacRaw.pressao  = Math.min(10,(playerTacRaw.pressao||5)+Math.floor(assistLv/2));
    if (analistLv > 0) playerTacRaw.ritmo    = Math.min(10,(playerTacRaw.ritmo||5)+Math.floor(analistLv/2));
    // Preparador melhora fitness dos jogadores (boost temporário antes da partida)
    if (prepLv > 0) {
      const boost = prepLv; // +1 a +5 de fitness
      playerSquad.forEach(p => { p._fitnessBoosted = (p.fitness||85); p.fitness = Math.min(100,(p.fitness||85)+boost); });
    }

    const homeTac = isHome ? playerTacRaw : ai.chooseTactics(m.home);
    const awayTac = isHome ? ai.chooseTactics(m.away) : playerTacRaw;
    const engine = new MatchEngine(homeT, awayT, homeSquad, awaySquad, homeTac, awayTac);
    this.matchResult = engine.simulate();

    // Restaurar fitness após a partida
    if (prepLv > 0) playerSquad.forEach(p => { if (p._fitnessBoosted !== undefined) { p.fitness = p._fitnessBoosted; delete p._fitnessBoosted; } });
    gs.processMatchResult(m.id, this.pendingLeague, this.matchResult);

    // Sound result
    const isHomePlayer = m.home === gs.playerTeamId;
    const myScore = isHomePlayer ? this.matchResult.score.home : this.matchResult.score.away;
    const theirScore = isHomePlayer ? this.matchResult.score.away : this.matchResult.score.home;
    if (window.audio) {
      if (myScore > theirScore) setTimeout(() => window.audio.win(), 500);
      else if (myScore < theirScore) setTimeout(() => window.audio.lose(), 500);
      else setTimeout(() => window.audio.whistle(), 500);
    }

    this.render('match');
  }

  simPlayerMatch() {
    const team = this.gs.getPlayerTeam();
    const leagueId = team?.league;
    const m = this.gs.getPlayerWeekMatch();
    if (!m) { this.showToast('Nenhum jogo para simular','warn'); return; }
    const gs = this.gs;
    const homeT = gs.teams[m.home], awayT = gs.teams[m.away];
    const ai = new AIManager(gs);
    const homeSquad = ai.pickSquad(m.home);
    const awaySquad = ai.pickSquad(m.away);
    const engine = new MatchEngine(homeT, awayT, homeSquad, awaySquad, ai.chooseTactics(m.home), ai.chooseTactics(m.away));
    const result = engine.simulate();
    gs.processMatchResult(m.id, leagueId, result);
    this.showToast(`Simulado: ${homeT.name} ${result.score.home}–${result.score.away} ${awayT.name}`);
    this.render('dashboard');
  }

  nextWeek() {
    const gs = this.gs;
    const week = gs.currentWeek;
    const team = gs.getPlayerTeam();

    // Gestor de Contratos — renovação automática
    if (week % 4 === 0 && gs.coachingStaff?.gestorContratos) {
      const lv = gs.coachingStaff.gestorContratos.level || 1;
      const thr = lv>=5?2:lv>=3?1:0;
      gs.getPlayerPlayers().filter(p=>!p.retired&&(p.contractYears||0)<=thr).forEach(p=>{
        const bonus = Math.round((p.salary||0)*0.5);
        if (gs.budget>=bonus) {
          p.contractYears = 2+Math.floor(lv/2);
          p.salary = Math.round((p.salary||0)*(lv>=4?1.06:lv>=2?1.10:1.15));
          gs.budget-=bonus; const t=gs.teams[gs.playerTeamId]; if(t)t.budget=gs.budget;
          gs.news.unshift({date:`Rod. ${week}`,type:'geral',text:`📋 Gestor renovou ${p.name} por +${p.contractYears} anos (bônus: ${gs.fmt(bonus)})`});
        }
      });
    }

    // Block if player match not played
    if (team) {
      const myMatch = (gs.schedules[team.league] || []).find(
        m => m.week === week && !m.played && (m.home === gs.playerTeamId || m.away === gs.playerTeamId)
      );
      if (myMatch) {
        this.showToast('⚠️ Jogue sua partida antes de avançar!', 'warn');
        if (window.audio) window.audio.error?.();
        return;
      }
    }

    const trainResults = this.processTraining();
    const roundResults = this._buildRoundSummary(week);
    this.generateAIOffers();
    const aiNews = gs.nextWeek();

    if (trainResults && trainResults.length > 0) {
      setTimeout(() => this.showToast(trainResults[0]), 700);
    }

    if (gs.endOfSeason) {
      // Verificar Copa do Mundo em andamento (qualificado = jogue; não qualificado = sim automático)
      if (gs.worldCup && gs.worldCup.phase !== 'done') {
        if (gs.worldCup.playerQualified && !gs.worldCup.playerEliminated) {
          this.showToast('🌍 Jogue a Copa do Mundo antes de avançar!', 'warn');
          this.render('worldcup');
          return;
        } else if (!gs.worldCup.playerQualified || gs.worldCup.playerEliminated) {
          // Player não está: sim automático antes de mostrar resultado
          try {
            let safety = 0;
            while (gs.worldCup.phase !== 'done' && safety++ < 10) {
              gs.simAllWorldCupPhase?.(); const ok = gs.advanceWorldCupPhase?.(); if (!ok) break;
            }
          } catch(e) {}
        }
      }
      // Verificar Torneio Global em andamento
      if (gs.globalTournament && gs.globalTournament.phase !== 'done') {
        if (gs.globalTournament.playerQualified && !gs.globalTournament.playerEliminated) {
          this.showToast('🏆 Jogue o Torneio Global antes de avançar!', 'warn');
          this.render('gtournament');
          return;
        } else if (!gs.globalTournament.playerQualified || gs.globalTournament.playerEliminated) {
          try {
            let safety = 0;
            while (gs.globalTournament.phase !== 'done' && safety++ < 10) {
              window.GlobalTournament?.simPhase(gs);
              if (!window.GlobalTournament?.advancePhase(gs)) break;
            }
          } catch(e) {}
        }
      }
      this._showEndOfSeasonModal();
      // Auto-save antes de mostrar o modal (startNewSeason já foi chamado dentro do modal)
      if (this._getAutoSave() && this.gs.initialized) { try { this.gs.save(); } catch(e) {} }
      return; // NÃO renderizar dashboard — o modal cuida da navegação
    } else {
      this._showRoundSummary(week, roundResults);
    }
    // Auto-save
    if (this._getAutoSave() && this.gs.initialized) {
      this.gs.save();
      setTimeout(() => this.showToast('💾 Auto-save realizado', 'info'), 1200);
    }
    this.render('dashboard');
  }

  _showEndOfSeasonModal() {
    const gs = this.gs;

    // Capturar destaques ANTES de resetar a temporada
    const lid         = gs.teams[gs.playerTeamId]?.league;
    const standingsBefore = gs.getLeagueStandings(lid);
    const myPosBefore = standingsBefore.findIndex(t => t.id === gs.playerTeamId) + 1;
    const myStatsBefore = standingsBefore.find(t => t.id === gs.playerTeamId)?.standing || {};
    const topScorerBefore = gs.getTopScorers(lid, 1)[0];
    const topAssistBefore = gs.getTopAssists(lid, 1)[0];
    const topTransferBefore = (gs.topTransfers||[]).filter(t=>t.season===gs.season).sort((a,b)=>b.price-a.price)[0];
    const seasonNum   = gs.season;

    // initWorldCup ANTES do startNewSeason (que reseta standings)
    const wc = gs.initWorldCup();

    // Se o player não se classificou: simula toda a copa automaticamente
    let wcAutoChampion = null;
    if (wc && !wc.playerQualified && wc.teams.length >= 2) {
      gs.simAllWorldCupPhase(); gs.advanceWorldCupPhase();
      if (gs.worldCup?.phase === 'semifinals' || gs.worldCup?.phase === 'final') { gs.simAllWorldCupPhase(); gs.advanceWorldCupPhase(); }
      if (gs.worldCup?.phase === 'final') { gs.simAllWorldCupPhase(); gs.advanceWorldCupPhase(); }
      wcAutoChampion = gs.worldCup?.champion ? gs.teams[gs.worldCup.champion] : null;
    }

    // startNewSeason — incrementa season, recalcula ranking, pode criar torneio global
    const data = gs.startNewSeason();

    const gt        = gs.globalTournament;
    const gtQualified = gt && gt.phase !== 'done' && gt.playerQualified;
    // Se player não está no torneio, simula automaticamente
    if (gt && !gt.playerQualified) {
      try {
        let safety = 0;
        while (gt.phase !== 'done' && safety++ < 10) {
          window.GlobalTournament?.simPhase(gs);
          if (!window.GlobalTournament?.advancePhase(gs)) break;
        }
      } catch(e) { console.warn('GT auto-sim:', e); }
    }
    const gtChamp   = gt?.champion ? gs.teams[gt.champion] : null;
    const wcQualified = wc && wc.playerQualified;
    const medals    = ['🥇','🥈','🥉'];
    const myTeam    = gs.teams[gs.playerTeamId];

    // Mostrar popup de aposentadoria (antes do modal principal)
    const retiredThisSeason = window.CareerAging?._retiredThisSeason || [];
    if (retiredThisSeason.length > 0) {
      setTimeout(() => {
        if (this._showRetirementPopup) this._showRetirementPopup(retiredThisSeason);
      }, 400);
    }

    // Próximo destino: Copa (se classificado) → Torneio Global (se classificado) → Dashboard
    const goNext = () => {
      if (wcQualified && gs.worldCup && gs.worldCup.phase !== 'done') { this.render('worldcup'); return; }
      if (gtQualified && gs.globalTournament && gs.globalTournament.phase !== 'done') { this.render('gtournament'); return; }
      this.render('dashboard');
    };

    const overlay = document.createElement('div');
    overlay.className = 'round-summary-overlay';
    overlay.innerHTML = `
    <div class="round-summary-modal" style="max-width:560px;max-height:92vh;overflow-y:auto;padding:20px 24px">

      <!-- Cabeçalho da temporada -->
      <div style="text-align:center;margin-bottom:18px">
        <div style="font-size:2.4rem;margin-bottom:4px">${myPosBefore===1?'🏆':myPosBefore<=3?'🥈':'⚽'}</div>
        <div style="font-family:'Barlow Condensed',sans-serif;font-size:1.6rem;font-weight:900;color:#f0c84a">TEMPORADA ${seasonNum} ENCERRADA</div>
        <div style="font-size:13px;color:var(--text3);margin-top:4px">${myTeam?.name||''}</div>
      </div>

      <!-- Resultado na liga -->
      <div style="background:linear-gradient(135deg,rgba(255,255,255,.05),rgba(255,255,255,.02));border:1px solid rgba(255,255,255,.1);border-radius:12px;padding:14px 18px;margin-bottom:14px">
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;text-align:center">
          <div>
            <div style="font-family:'Barlow Condensed',sans-serif;font-size:2rem;font-weight:900;color:${myPosBefore===1?'#f0c84a':myPosBefore<=3?'#4a90e2':'var(--text2)'}">${medals[myPosBefore-1]||myPosBefore+'º'}</div>
            <div style="font-size:10px;color:var(--text4);letter-spacing:.08em">POSIÇÃO NA LIGA</div>
          </div>
          <div>
            <div style="font-family:'Barlow Condensed',sans-serif;font-size:2rem;font-weight:900;color:#28c856">${myStatsBefore.pts||0}</div>
            <div style="font-size:10px;color:var(--text4);letter-spacing:.08em">PONTOS</div>
          </div>
          <div>
            <div style="font-family:'Barlow Condensed',sans-serif;font-size:2rem;font-weight:900;color:var(--gold)">${gs.fmt(data.prize)}</div>
            <div style="font-size:10px;color:var(--text4);letter-spacing:.08em">PRÊMIO</div>
          </div>
        </div>
        <div style="display:flex;justify-content:center;gap:16px;margin-top:10px;font-size:12px;color:var(--text3)">
          <span>${myStatsBefore.w||0}V</span><span>${myStatsBefore.d||0}E</span><span>${myStatsBefore.l||0}D</span>
          <span>${myStatsBefore.gf||0}×${myStatsBefore.ga||0}</span>
        </div>
        <div style="text-align:center;font-size:11px;color:var(--text4);margin-top:6px">Campeão: <strong style="color:#f0c84a">${data.champion?.name||'-'}</strong></div>
      </div>

      <!-- Destaques da temporada -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px">
        ${topScorerBefore ? `<div style="background:rgba(240,200,74,.07);border:1px solid rgba(240,200,74,.2);border-radius:10px;padding:10px 12px">
          <div style="font-size:10px;color:#f0c84a;font-weight:800;letter-spacing:.1em;text-transform:uppercase;margin-bottom:4px">⚽ Artilheiro</div>
          <div style="font-weight:700;font-size:13px;color:#e4edf6">${topScorerBefore.name}</div>
          <div style="font-size:11px;color:var(--text3)">${topScorerBefore.goals} gols · ${gs.teams[topScorerBefore.teamId]?.name||'?'}</div>
        </div>` : ''}
        ${topAssistBefore ? `<div style="background:rgba(74,144,226,.07);border:1px solid rgba(74,144,226,.2);border-radius:10px;padding:10px 12px">
          <div style="font-size:10px;color:#4a90e2;font-weight:800;letter-spacing:.1em;text-transform:uppercase;margin-bottom:4px">🎯 Assistências</div>
          <div style="font-weight:700;font-size:13px;color:#e4edf6">${topAssistBefore.name}</div>
          <div style="font-size:11px;color:var(--text3)">${topAssistBefore.assists} assist. · ${gs.teams[topAssistBefore.teamId]?.name||'?'}</div>
        </div>` : ''}
        ${topTransferBefore ? `<div style="background:rgba(40,200,86,.07);border:1px solid rgba(40,200,86,.2);border-radius:10px;padding:10px 12px">
          <div style="font-size:10px;color:#28c856;font-weight:800;letter-spacing:.1em;text-transform:uppercase;margin-bottom:4px">💸 Maior Transf.</div>
          <div style="font-weight:700;font-size:13px;color:#e4edf6">${topTransferBefore.playerName}</div>
          <div style="font-size:11px;color:var(--text3)">${gs.fmt(topTransferBefore.price)} · ${topTransferBefore.toTeamName}</div>
        </div>` : ''}
        <div style="background:rgba(155,89,182,.07);border:1px solid rgba(155,89,182,.2);border-radius:10px;padding:10px 12px">
          <div style="font-size:10px;color:#9b59b6;font-weight:800;letter-spacing:.1em;text-transform:uppercase;margin-bottom:4px">🌍 Ranking Global</div>
          <div style="font-weight:700;font-size:13px;color:#e4edf6">${myTeam?.name||''}</div>
          <div style="font-size:11px;color:var(--text3)">#${myTeam?.clubRankingPosition||'?'} mundial · ${Math.round(myTeam?.clubRankingPoints||0)} pts</div>
        </div>
      </div>

      <!-- Copa do Mundo -->
      ${wcQualified ? `
      <div style="background:linear-gradient(135deg,rgba(240,200,74,.12),rgba(40,160,255,.08));border:1px solid rgba(240,200,74,.35);border-radius:12px;padding:12px 16px;margin-bottom:10px;display:flex;align-items:center;gap:12px">
        <span style="font-size:1.8rem">🌍</span>
        <div>
          <div style="font-family:'Barlow Condensed',sans-serif;font-size:1rem;font-weight:900;color:#f0c84a">CLASSIFICADO PARA A COPA DO MUNDO!</div>
          <div style="font-size:11px;color:var(--text2)">Prêmio máximo: R$10M · Jogar agora →</div>
        </div>
      </div>` : wcAutoChampion ? `
      <div style="background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.08);border-radius:10px;padding:10px;margin-bottom:10px;font-size:12px;color:rgba(255,255,255,.4);text-align:center">
        🌍 Copa do Mundo simulada · Campeão: <strong style="color:#f0c84a">${wcAutoChampion.name}</strong>
      </div>` : ''}

      <!-- Torneio Global -->
      ${gt ? (gtQualified ? `
      <div style="background:linear-gradient(135deg,rgba(240,200,74,.15),rgba(240,200,74,.05));border:1px solid rgba(240,200,74,.45);border-radius:12px;padding:12px 16px;margin-bottom:10px;display:flex;align-items:center;gap:12px">
        <span style="font-size:1.8rem">🏆</span>
        <div>
          <div style="font-family:'Barlow Condensed',sans-serif;font-size:1rem;font-weight:900;color:#f0c84a">TORNEIO GLOBAL — TOP 16 DO MUNDO!</div>
          <div style="font-size:11px;color:var(--text2)">Prêmio máximo: ${this.fmt(25000000)} · Jogar agora →</div>
        </div>
      </div>` : `
      <div style="background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.08);border-radius:10px;padding:10px;margin-bottom:10px;font-size:12px;color:rgba(255,255,255,.4);text-align:center">
        🏆 Torneio Global T${gt.season} simulado${gtChamp?' · Campeão: <strong style="color:#f0c84a">'+gtChamp.name+'</strong>':''}
      </div>`) : ''}

      <!-- Histórico -->
      ${gs.history.length > 1 ? `<div style="font-size:11px;color:var(--text4);text-align:center;margin-bottom:12px">
        Histórico: ${gs.history.slice(-4).map(h=>`T${h.season}: ${medals[h.position-1]||h.position+'º'}`).join(' · ')}
      </div>` : ''}

      <!-- Botão único de ação -->
      <button class="rsm-close-btn" id="eos-next-btn" style="width:100%;background:${wcQualified?'linear-gradient(135deg,#c9890a,#f0c84a);color:#000':gtQualified?'linear-gradient(135deg,#8b5e00,#f0c84a);color:#000':'rgba(74,144,226,.25);color:#4a90e2'};font-size:1rem;font-weight:900;letter-spacing:.05em">
        ${wcQualified?'🌍 Ir para a Copa do Mundo →':gtQualified?'🏆 Ir para o Torneio Global →':'▶ Iniciar Temporada ' + gs.season}
      </button>
    </div>`;

    document.body.appendChild(overlay);
    if (window.SFX) window.SFX.win?.();
    document.getElementById('eos-next-btn')?.addEventListener('click', () => { overlay.remove(); goNext(); });
    // Clique fora fecha e vai para próximo destino
    overlay.addEventListener('click', e => { if (e.target === overlay) { overlay.remove(); goNext(); } });
  }

  _buildRoundSummary(week) {
    const gs = this.gs;
    const team = gs.getPlayerTeam();
    if (!team) return [];
    return (gs.schedules[team.league] || []).filter(m => m.week === week);
  }

  _showRoundSummary(week, matches) {
    const gs = this.gs;
    const overlay = document.createElement('div');
    overlay.className = 'round-summary-overlay';
    const myTeamId = gs.playerTeamId;
    const rows = matches.map(m => {
      const ht = gs.teams[m.home], at = gs.teams[m.away];
      const r = m.result?.score;
      const isMyMatch = m.home === myTeamId || m.away === myTeamId;
      return `<div class="rsm-result-row ${isMyMatch?'my-match':''}">
        <span class="rsm-home ${r&&r.home>r.away?'winner-name':''}">
          <span style="display:inline-flex;align-items:center;gap:5px;justify-content:flex-end">${this.teamLogo(m.home,ht?.name,ht?.color,ht?.color2,18)}<span>${ht?.name||'?'}</span></span>
        </span>
        <span class="rsm-score">${r?`${r.home}–${r.away}`:'—'}</span>
        <span class="rsm-away ${r&&r.away>r.home?'winner-name':''}">
          <span style="display:inline-flex;align-items:center;gap:5px">${this.teamLogo(m.away,at?.name,at?.color,at?.color2,18)}<span>${at?.name||'?'}</span></span>
        </span>
      </div>`;
    }).join('');
    overlay.innerHTML = `
    <div class="round-summary-modal">
      <div class="rsm-title">📋 Rodada ${week} — Resultados</div>
      <div class="rsm-section-title">${gs.leagues[gs.getPlayerTeam()?.league]?.name||'Liga'}</div>
      ${rows||'<p class="empty-msg">Nenhum jogo nessa rodada</p>'}
      <button class="rsm-close-btn" id="rsm-close">Continuar →</button>
    </div>`;
    document.body.appendChild(overlay);
    document.getElementById('rsm-close')?.addEventListener('click', () => { if (window.audio) window.audio.click(); overlay.remove(); });
    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
  }

  generateAIOffers() {
    const gs = this.gs;
    gs.pendingOffers = gs.pendingOffers || [];
    gs.pendingOffers = gs.pendingOffers.filter(o => o.week >= gs.currentWeek - 3);
    const myAll = gs.getPlayerPlayers().filter(p => !p.retired);
    // Listados: 45% chance por rodada
    myAll.filter(p => p.onTransferList).forEach(p => {
      if (gs.pendingOffers.some(o => o.playerId === p.id)) return;
      if (Math.random() > 0.45) return;
      const offerVal = Math.round((p.value||100000)*(0.90+Math.random()*0.65)/10000)*10000;
      const buyers = Object.values(gs.teams).filter(t=>t.id!==gs.playerTeamId&&(t.budget||0)>=offerVal*0.6);
      if (!buyers.length) return;
      const buyer = buyers[Math.floor(Math.random()*buyers.length)];
      const id = 'of_'+Math.random().toString(36).substr(2,8);
      gs.pendingOffers.push({id,playerId:p.id,playerName:p.name,position:p.position,overall:p.overall,buyerTeamId:buyer.id,buyerName:buyer.name,offer:offerVal,week:gs.currentWeek});
      gs.news.unshift({date:`Rod. ${gs.currentWeek}`,type:'proposta',text:`🔔 ${buyer.name} quer comprar ${p.name} — ${gs.fmt(offerVal)}`});
    });
    // Não listados: 4% chance
    myAll.filter(p => !p.onTransferList).forEach(p => {
      if (Math.random() > 0.04) return;
      if (gs.pendingOffers.some(o => o.playerId === p.id)) return;
      const offerVal = Math.round((p.value||100000)*(1.15+Math.random()*0.85)/50000)*50000;
      const buyers = Object.values(gs.teams).filter(t=>t.id!==gs.playerTeamId&&t.league!==gs.teams[gs.playerTeamId]?.league&&(t.budget||0)>=offerVal*0.8);
      if (!buyers.length) return;
      const buyer = buyers[Math.floor(Math.random()*buyers.length)];
      const id = 'of_'+Math.random().toString(36).substr(2,8);
      gs.pendingOffers.push({id,playerId:p.id,playerName:p.name,position:p.position,overall:p.overall,buyerTeamId:buyer.id,buyerName:buyer.name,offer:offerVal,week:gs.currentWeek});
      gs.news.unshift({date:`Rod. ${gs.currentWeek}`,type:'proposta',text:`🔔 Proposta de ${buyer.name}: ${gs.fmt(offerVal)} por ${p.name}`});
    });
  }

  hireStaff(role, cost) {
    if (this.gs.budget < cost * 3) { this.showToast('Orçamento insuficiente!','error'); return; }
    if (this.gs.coachingStaff[role]) { this.showToast('Já há alguém nessa função!','warn'); return; }
    const names = {assistente:'Carlos Vitor',preparadorFisico:'Rafael Diniz',analistaTatico:'André Simões',medico:'Dr. Roberto Faria',olheiro:'Fernando Braga',gestorContratos:'Fábio Assunção'};
    this.gs.coachingStaff[role] = {name: names[role]||'Staff', cost};
    this.gs.budget -= cost * 3;
    if (this.gs.teams[this.gs.playerTeamId]) this.gs.teams[this.gs.playerTeamId].budget = this.gs.budget;
    this.showToast(`${names[role]||'Staff'} contratado! 👔`);
    this.render('staff');
  }
  fireStaff(role) { this.gs.coachingStaff[role] = null; this.showToast('Membro demitido.'); this.render('staff'); }

  upgradeStaff(role, cost) {
    const gs = this.gs;
    const member = gs.coachingStaff[role];
    if (!member) { this.showToast('Membro não encontrado!', 'error'); return; }
    const level = member.level || 1;
    if (level >= 5) { this.showToast('Nível máximo atingido!', 'warn'); return; }
    if (gs.budget < cost) { this.showToast('Orçamento insuficiente!', 'error'); return; }

    member.level = level + 1;
    gs.budget -= cost;
    if (gs.teams[gs.playerTeamId]) gs.teams[gs.playerTeamId].budget = gs.budget;

    // +5% de melhoria geral no time a cada upgrade
    const players = gs.getPlayerPlayers();
    const improveCount = Math.max(1, Math.floor(players.length * 0.05)); // 5% dos jogadores
    players.sort(() => Math.random() - 0.5).slice(0, improveCount).forEach(p => {
      if (p.attrs) {
        // Atributos relevantes por cargo
        const attrMap = {
          assistente:      ['decisoes','criatividade','visao'],
          preparadorFisico:['resistencia','velocidade','agilidade','forca'],
          analistaTatico:  ['posicionamento','marcacao','interceptacao'],
          medico:          ['resistencia','forca'],
          olheiro:         ['decisoes','criatividade'],
          gestorContratos: ['lideranca','decisoes'],
        };
        const attrs = attrMap[role] || ['resistencia'];
        const key = attrs[Math.floor(Math.random() * attrs.length)];
        if (p.attrs[key] !== undefined) p.attrs[key] = Math.min(99, p.attrs[key] + 1);
      }
      p.morale = Math.min(99, (p.morale || 75) + 2);
    });

    const levelNames = ['','I','II','III','IV','V'];
    const roleNames = {assistente:'Assistente Técnico',preparadorFisico:'Preparador Físico',analistaTatico:'Analista Tático',medico:'Médico',olheiro:'Olheiro',gestorContratos:'Gestor de Contratos'};
    if (window.SFX) window.SFX.success();
    this.showToast(`⬆ ${roleNames[role]} evoluído para Nível ${levelNames[member.level]}! +5% time`);
    this.render('staff');
  }

  autoPickSquad() {
    const gs = this.gs;
    const formation = gs.tactics?.formation || '1-2-1-1';
    const slotRoles = {
      '1-2-1-1': ['GL','FIX','FIX','ALA','PÍV'],
      '1-1-2-1': ['GL','FIX','ALA','ALA','PÍV'],
      '1-2-2-0': ['GL','FIX','FIX','ALA','ALA'],
      '1-3-1-0': ['GL','FIX','FIX','FIX','ALA'],
      '1-0-3-1': ['GL','ALA','ALA','ALA','PÍV'],
    };
    const roles = slotRoles[formation] || slotRoles['1-2-1-1'];
    const available = gs.getPlayerPlayers().filter(p => !p.injured);
    if (available.length === 0) { this.showToast('Sem jogadores disponíveis!', 'warn'); return; }

    // Score composto: OVR + bônus fitness e moral
    const score = p => (p.overall || 65) + ((p.fitness || 85) - 85) * 0.15 + ((p.morale || 75) - 75) * 0.08;

    // Agrupa por posição, ordenado por score desc
    const byPos = {};
    available.forEach(p => {
      if (!byPos[p.position]) byPos[p.position] = [];
      byPos[p.position].push(p);
    });
    Object.values(byPos).forEach(arr => arr.sort((a,b) => score(b) - score(a)));

    const used = new Set();
    const squad = [null,null,null,null,null];

    // Primeira passagem: pega melhor por posição exata
    for (let i = 0; i < 5; i++) {
      const role = roles[i];
      const pool = (byPos[role] || []).filter(p => !used.has(p.id));
      if (pool.length > 0) { squad[i] = pool[0].id; used.add(pool[0].id); }
    }
    // Segunda passagem: preenche slots vazios com melhor disponível (qualquer posição)
    const remaining = available.filter(p => !used.has(p.id)).sort((a,b) => score(b) - score(a));
    for (let i = 0; i < 5; i++) {
      if (!squad[i] && remaining.length > 0) {
        const p = remaining.shift();
        squad[i] = p.id; used.add(p.id);
      }
    }

    gs.squad = squad;
    const filled = squad.filter(Boolean).map(id => gs.players[id]?.position).filter(Boolean);
    if (window.audio) window.audio.success?.();
    this.showToast(`Escalação: ${filled.join(' · ')} ⚡`);
    this.render('tactics');
  }

  autoAssignTraining() {
    const gs = this.gs;
    const players = gs.getPlayerPlayers().filter(p => !p.injured);

    // Atributos-chave por foco de treino
    const attrGroups = {
      fisico:    ['velocidade','resistencia','forca','agilidade'],
      tecnico:   ['finalizacao','drible','passe','controle','criatividade'],
      defensivo: ['marcacao','interceptacao','desarme','posicionamento'],
      mental:    ['decisoes','visao','lideranca','concentracao'],
    };
    // Atributos mais importantes por posição
    const keyAttrsByPos = {
      GL:    ['reflexos','defesaGK','posicionamento','decisoes','concentracao'],
      FIX:   ['marcacao','interceptacao','desarme','posicionamento','passe'],
      ALA:   ['velocidade','drible','finalizacao','passe','criatividade'],
      'PÍV': ['finalizacao','forca','controle','posicionamento','decisoes'],
    };

    players.forEach(p => {
      if (!p.attrs) {
        // Sem attrs: usa fallback por posição/idade
        if (p.age <= 22) this.trainingAssignments[p.id] = 'tecnico';
        else if (p.age >= 30) this.trainingAssignments[p.id] = 'fisico';
        else this.trainingAssignments[p.id] = p.position === 'GL' || p.position === 'FIX' ? 'defensivo' : 'tecnico';
        return;
      }

      const keyAttrs = keyAttrsByPos[p.position] || keyAttrsByPos['ALA'];
      // Calcula média de cada grupo de treino para os atributos-chave do jogador
      const groupScores = {};
      for (const [group, groupAttrs] of Object.entries(attrGroups)) {
        const relevant = groupAttrs.filter(a => keyAttrs.includes(a));
        if (relevant.length === 0) continue;
        const avg = relevant.reduce((sum, a) => sum + (p.attrs[a] || 60), 0) / relevant.length;
        groupScores[group] = avg;
      }

      // Escolhe o grupo com MENOR média (mais fraco = mais benefício de treinar)
      // Exceto: GL nunca recebe 'tecnico' ofensivo como prioridade
      let best = 'tecnico';
      let lowestAvg = 999;
      for (const [group, avg] of Object.entries(groupScores)) {
        // GL não faz treino técnico ofensivo
        if (p.position === 'GL' && group === 'tecnico') continue;
        // Jovens: penaliza mental para não desperdiçar potencial de crescimento físico/técnico
        if (p.age <= 21 && group === 'mental') continue;
        if (avg < lowestAvg) { lowestAvg = avg; best = group; }
      }

      // Veteranos (32+): prioriza físico independente do score, para manter forma
      if (p.age >= 32 && (p.attrs.velocidade || 99) < 70) best = 'fisico';

      this.trainingAssignments[p.id] = best;
    });

    const summary = {};
    Object.values(this.trainingAssignments).forEach(t => { summary[t] = (summary[t]||0)+1; });
    const parts = Object.entries(summary).map(([k,v])=>`${v}×${k}`).join(', ');
    this.showToast(`Treinos auto: ${parts} ⚡`);
    this.render('training');
  }

  assignTrain(pid, trainType) {
    if (!trainType) delete this.trainingAssignments[pid];
    else this.trainingAssignments[pid] = trainType;
    if (this.currentScreen === 'training') this.render('training');
  }
  unassignTrain(pid) { delete this.trainingAssignments[pid]; this.render('training'); }

  processTraining() {
    const gs = this.gs;
    const staff = gs.coachingStaff || {};
    const hasPrep    = staff.preparadorFisico;
    const hasAnalyst = staff.analistaTatico;
    const hasAssist  = staff.assistente;
    const prepLevel  = hasPrep?.level    || 0;
    const analLevel  = hasAnalyst?.level || 0;
    const assistLevel= hasAssist?.level  || 0;

    const results = [];
    const attrGroups = {
      fisico:    ['velocidade','resistencia','forca','agilidade'],
      tecnico:   ['finalizacao','drible','passe','controle','criatividade'],
      defensivo: ['marcacao','interceptacao','desarme','posicionamento'],
      mental:    ['decisoes','visao','lideranca','concentracao'],
    };

    for (const [pid, trainType] of Object.entries(this.trainingAssignments)) {
      const p = gs.players[pid];
      if (!p || p.injured || p.retired) continue;

      const attrs = attrGroups[trainType] || [];
      let totalGain = 0;
      let ovrBefore = p.overall;

      // Base chance por tipo de treino — cresce com level do staff relevante
      const baseChance = trainType==='fisico'    ? 0.40 + prepLevel*0.05
                       : trainType==='mental'    ? 0.35 + analLevel*0.05
                       : trainType==='tecnico'   ? 0.38 + assistLevel*0.04
                       : trainType==='defensivo' ? 0.36 + assistLevel*0.04
                       : 0.35;

      // Bônus por idade: jovens crescem mais
      const ageBonus = p.age<=19 ? 0.25 : p.age<=21 ? 0.18 : p.age<=23 ? 0.10 : p.age<=26 ? 0.04 : 0;
      // Penalidade para veteranos em treino técnico
      const agePenalty = p.age>=33 && trainType!=='fisico' ? -0.10 : 0;
      const finalChance = Math.min(0.75, baseChance + ageBonus + agePenalty);

      attrs.forEach(a => {
        if (!p.attrs || p.attrs[a]===undefined) return;
        if (p.attrs[a] >= 99) return; // já no máximo
        if (Math.random() < finalChance) {
          // Staff de alto nível pode dar +2 em vez de +1
          const bonus = (prepLevel >= 3 && trainType==='fisico') || (analLevel >= 3 && trainType==='mental') ? (Math.random()<0.35?2:1) : 1;
          p.attrs[a] = Math.min(99, p.attrs[a] + bonus);
          totalGain += bonus;
        }
      });

      // Fitness sempre sobe com treino físico
      if (trainType==='fisico') {
        const fitnessGain = 2 + (prepLevel >= 2 ? 2 : 0);
        p.fitness = Math.min(100, (p.fitness||85) + fitnessGain);
      }

      // Recalcular OVR se houve ganho
      if (totalGain > 0 && p.overall < (p.potential||99)) {
        if (window.calcOvr) {
          const newOvr = window.calcOvr(p.attrs, p.position);
          if (newOvr > p.overall) {
            p.overall = Math.min(p.potential||99, newOvr);
            if (p.overall > ovrBefore) results.push(`📈 ${p.name} subiu para OVR ${p.overall}!`);
          }
        }
      }

      // Morale: treino melhora moral levemente
      p.morale = Math.min(99, (p.morale||75) + 1);
    }
    return results;
  }

  // ── HELPERS ──────────────────────────────────────────────────
  leagueFlag(leagueId, size) {
    size = size || 18;
    const logos = window.LEAGUE_LOGOS || {};
    const url = logos[leagueId];
    if (url) return `<img src="${url}" alt="${leagueId}" style="width:${size}px;height:${size}px;object-fit:contain;vertical-align:middle;display:inline-block" onerror="this.style.display='none'">`;
    // fallback bandeiras
    const flags = {laliga:'🇪🇸',premier:'🏴󠁧󠁢󠁥󠁮󠁧󠁿',seriea:'🇮🇹',brasileirao:'🇧🇷',bundesliga:'🇩🇪',ligue1:'🇫🇷',lpf:'🇵🇹'};
    return flags[leagueId] || '🌍';
  }

  natFlag(nat) {
    // Usar tabela global de logos.js se disponível
    if (window.flagEmoji) return window.flagEmoji(nat);
    const flags = {
      'Brasil':'🇧🇷','Argentina':'🇦🇷','Uruguai':'🇺🇾','Colômbia':'🇨🇴','Venezuela':'🇻🇪',
      'Paraguai':'🇵🇾','Equador':'🇪🇨','Chile':'🇨🇱','Peru':'🇵🇪','Bolívia':'🇧🇴',
      'México':'🇲🇽','Estados Unidos':'🇺🇸','EUA':'🇺🇸','Canadá':'🇨🇦','Costa Rica':'🇨🇷','Jamaica':'🇯🇲',
      'Espanha':'🇪🇸','Portugal':'🇵🇹','França':'🇫🇷','Itália':'🇮🇹','Alemanha':'🇩🇪',
      'Holanda':'🇳🇱','Países Baixos':'🇳🇱','Bélgica':'🇧🇪','Inglaterra':'🏴󠁧󠁢󠁥󠁮󠁧󠁿','Escócia':'🏴󠁧󠁢󠁳󠁣󠁴󠁿',
      'País de Gales':'🏴󠁧󠁢󠁷󠁬󠁳󠁿','Irlanda':'🇮🇪','Suíça':'🇨🇭','Áustria':'🇦🇹',
      'Suécia':'🇸🇪','Noruega':'🇳🇴','Dinamarca':'🇩🇰','Finlândia':'🇫🇮',
      'Polônia':'🇵🇱','Croácia':'🇭🇷','Sérvia':'🇷🇸','Ucrânia':'🇺🇦','Romênia':'🇷🇴',
      'Bulgária':'🇧🇬','Turquia':'🇹🇷','Grécia':'🇬🇷','Kosovo':'🇽🇰','Geórgia':'🇬🇪',
      'Eslováquia':'🇸🇰','República Tcheca':'🇨🇿','República Checa':'🇨🇿','Hungria':'🇭🇺',
      'Irã':'🇮🇷','Japão':'🇯🇵','Coreia do Sul':'🇰🇷','China':'🇨🇳','Austrália':'🇦🇺',
      'Arábia Saudita':'🇸🇦','Armênia':'🇦🇲','Azerbaijão':'🇦🇿',
      'Marrocos':'🇲🇦','Senegal':'🇸🇳','Costa do Marfim':'🇨🇮','Gana':'🇬🇭',
      'Nigéria':'🇳🇬','Camarões':'🇨🇲','Angola':'🇦🇴','Argélia':'🇩🇿','Egito':'🇪🇬',
      'Mali':'🇲🇱','Guiné':'🇬🇳','Congo':'🇨🇩','Tunísia':'🇹🇳','Burkina Faso':'🇧🇫',
    };
    return flags[nat] || '🌍';
  }

  // ── AUTO-SAVE HELPERS ────────────────────────────────────────
  _getAutoSave() {
    try { return JSON.parse(localStorage.getItem('fm_autosave') ?? 'true'); } catch(e) { return true; }
  }
  _setAutoSave(v) {
    try { localStorage.setItem('fm_autosave', JSON.stringify(v)); } catch(e) {}
  }

  // ── SALA DE TROFÉUS ──────────────────────────────────────────
  renderTrophy() {
    const gs = this.gs;
    const team = gs.getPlayerTeam();
    const history = gs.history || [];
    const players = gs.getPlayerPlayers();

    // Calcular troféus conquistados
    const titles    = history.filter(h => h.champion).length;
    const top3      = history.filter(h => h.position <= 3).length;
    const seasons   = history.length;
    const totalGoals= history.reduce((a,h) => a + (h.goals||0), 0);

    // Melhor artilheiro e assistente atual
    const league = team?.league;
    const topScorer  = gs.getTopScorers(league, 1)[0];
    const topAssist  = gs.getTopAssists(league, 1)[0];
    const myTopScorer= gs.getTopScorers(league, 20).find(p => gs.teams[p.teamId]?.id === gs.playerTeamId || p.teamId === gs.playerTeamId);
    const myTopAssist= gs.getTopAssists(league, 20).find(p => p.teamId === gs.playerTeamId);

    const wcHistory  = gs.worldCupHistory || [];
    const wcTitles   = wcHistory.filter(h => h.isChampion).length;
    const gtHistory  = gs.globalTournamentHistory || [];
    const gtTitles   = gtHistory.filter(h => h.playerWon).length;

    // Conquistas (achievements)
    const achievements = [
      { id:'first_win',   icon:'⚽', name:'Primeira Vitória',   desc:'Vença sua primeira partida',             done: history.some(h=>h.position<=8) || (team?.standing?.w||0)>0 },
      { id:'top3',        icon:'🥉', name:'Pódio',              desc:'Termine a temporada no top 3',            done: top3 > 0 },
      { id:'champion',    icon:'🏆', name:'Campeão!',           desc:'Vença o campeonato de liga',              done: titles > 0 },
      { id:'wc_qual',     icon:'✈️', name:'Mundial',            desc:'Classifique-se para a Copa do Mundo',     done: wcHistory.some(h=>h.qualified) },
      { id:'wc_winner',   icon:'🌍', name:'Campeão Mundial!',   desc:'Vença a Copa do Mundo de Futsal',         done: wcTitles >= 1 },
      { id:'back2back',   icon:'👑', name:'Bicampeão',          desc:'Vença 2 temporadas consecutivas',         done: history.length>=2 && history.slice(-2).every(h=>h.champion) },
      { id:'dynasty',     icon:'🌟', name:'Dinastia',           desc:'Vença 3+ campeonatos de liga',            done: titles >= 3 },
      { id:'golden_boot', icon:'🥇', name:'Bota de Ouro',       desc:'Tenha o artilheiro da liga',              done: history.some(h=>h.topScorerPlayer) },
      { id:'golden_glove',icon:'🧤', name:'Luva de Ouro',       desc:'Tenha o assistente da liga',              done: history.some(h=>h.topAssistPlayer) },
      { id:'rich',        icon:'💰', name:'Magnata',            desc:'Acumule R$20M em orçamento',              done: gs.budget >= 20_000_000 },
      { id:'squad',       icon:'👥', name:'Elenco Completo',    desc:'Tenha 16+ jogadores',                     done: players.length >= 16 },
      { id:'veteran',     icon:'🎖️', name:'Veterano',           desc:'Complete 3 temporadas',                   done: seasons >= 3 },
      { id:'global_champ',icon:'🏅', name:'Campeão Global',     desc:'Vença o Torneio Global dos 16 melhores',  done: (gs.globalTournamentHistory||[]).some(h=>h.playerWon) },
      { id:'rich2',       icon:'💎', name:'Bilionário',         desc:'Acumule R$100M em orçamento',             done: gs.budget >= 100_000_000 },
      { id:'unbeaten',    icon:'🔥', name:'Invicto',            desc:'Termine uma temporada sem perder',        done: history.some(h=>h.champion && (h.losses||0)===0) },
    ];

    const trophyHTML = titles === 0
      ? `<div style="text-align:center;padding:32px 0;color:rgba(255,255,255,.3)">
           <div style="font-size:4rem;margin-bottom:12px">🏆</div>
           <div style="font-family:'Barlow Condensed',sans-serif;font-size:1rem;letter-spacing:.1em;text-transform:uppercase">Nenhum título ainda</div>
           <div style="font-size:12px;margin-top:6px;color:rgba(255,255,255,.2)">Vença o campeonato para ver seu troféu aqui!</div>
         </div>`
      : `<div style="display:flex;flex-wrap:wrap;gap:16px;justify-content:center;padding:8px 0">
           ${history.filter(h=>h.champion).map(h=>`
             <div style="background:linear-gradient(145deg,#1a3a12,#0f2a0a);border:2px solid rgba(240,200,74,.5);border-radius:14px;padding:20px 24px;text-align:center;min-width:140px;box-shadow:0 4px 24px rgba(240,200,74,.18)">
               <div style="font-size:3rem;margin-bottom:6px">🏆</div>
               <div style="font-family:'Barlow Condensed',sans-serif;font-size:1.1rem;font-weight:900;color:#f0c84a;letter-spacing:.06em">${h.leagueName||h.leagueId||'Liga'}</div>
               <div style="font-size:11px;color:rgba(255,255,255,.5);margin-top:4px">Temporada ${h.season}</div>
               <div style="font-size:12px;color:#28c856;margin-top:2px;font-weight:700">${h.pts} pts</div>
             </div>`).join('')}
         </div>`;

    const wcTrophyHTML = wcTitles === 0
      ? `<div style="text-align:center;padding:20px 0;color:rgba(255,255,255,.25);font-size:12px">
           <div style="font-size:2.5rem">🌍</div>
           <div style="margin-top:6px">Classifique-se para a Copa do Mundo e ganhe o título mundial!</div>
         </div>`
      : `<div style="display:flex;flex-wrap:wrap;gap:14px;justify-content:center;padding:6px 0">
           ${wcHistory.filter(h=>h.isChampion).map(h=>`
             <div style="background:linear-gradient(145deg,#1a1200,#2a1f00);border:2px solid rgba(240,200,74,.7);border-radius:14px;padding:20px 24px;text-align:center;min-width:150px;box-shadow:0 4px 32px rgba(240,200,74,.3)">
               <svg viewBox="0 0 48 48" width="44" height="44" style="margin-bottom:4px" xmlns="http://www.w3.org/2000/svg"><circle cx="24" cy="24" r="20" fill="none" stroke="rgba(240,200,74,.5)" stroke-width="1.5"/><circle cx="24" cy="24" r="15" fill="rgba(40,120,200,.2)" stroke="rgba(74,144,226,.5)" stroke-width="1"/><ellipse cx="24" cy="24" rx="6" ry="15" fill="none" stroke="rgba(74,144,226,.4)" stroke-width=".8"/><line x1="9" y1="24" x2="39" y2="24" stroke="rgba(74,144,226,.35)" stroke-width=".8"/><rect x="21" y="13" width="6" height="9" rx="1.5" fill="#f0c84a"/><path d="M18 13 Q13 13 13 18 Q13 22 21 24" fill="none" stroke="#f0c84a" stroke-width="2" stroke-linecap="round"/><path d="M30 13 Q35 13 35 18 Q35 22 27 24" fill="none" stroke="#f0c84a" stroke-width="2" stroke-linecap="round"/><rect x="20" y="24" width="8" height="2" rx="1" fill="#f0c84a"/><rect x="18" y="26" width="12" height="2" rx="1" fill="#f0c84a" opacity=".85"/><text x="24" y="39" text-anchor="middle" font-size="7" fill="#f0c84a">★★★</text></svg>
               <div style="font-family:'Barlow Condensed',sans-serif;font-size:1rem;font-weight:900;color:#f0c84a">COPA DO MUNDO</div>
               <div style="font-size:11px;color:rgba(255,255,255,.5);margin-top:3px">Temporada ${h.season}</div>
               <div style="font-size:10px;color:#28c856;margin-top:2px">CAMPEÃO MUNDIAL 🌟</div>
             </div>`).join('')}
         </div>`;

    const wcHistoryHTML = wcHistory.length === 0
      ? `<p class="empty-msg" style="font-size:12px;text-align:center;color:rgba(255,255,255,.3)">Nenhuma copa disputada ainda.</p>`
      : `<div style="overflow-x:auto"><table class="players-table">
           <thead><tr><th>Temp.</th><th>🏆 Campeão</th><th>Seu time</th><th>Resultado</th></tr></thead>
           <tbody>${[...wcHistory].reverse().map(h=>`
             <tr class="${h.isChampion?'my-team':''}">
               <td><strong>${h.season}</strong></td>
               <td style="font-weight:800;color:${h.isChampion?'#f0c84a':'var(--text)'}">${h.championName}</td>
               <td style="font-size:11px;color:${h.isChampion?'#f0c84a':h.qualified?'#28c856':'rgba(255,255,255,.3)'}">
                 ${h.isChampion?'🏆 CAMPEÃO MUNDIAL':h.qualified?'✅ Participou':'❌ Não classificado'}
               </td>
               <td>${h.isChampion?'🌟':h.qualified?'⚽':'-'}</td>
             </tr>`).join('')}
           </tbody>
         </table></div>`;

    const historyHTML = history.length === 0
      ? `<p class="empty-msg">Nenhuma temporada finalizada.</p>`
      : `<div style="overflow-x:auto"><table class="players-table">
           <thead><tr><th>Temp.</th><th>Liga</th><th>Time</th><th>Pos.</th><th>Pts</th><th>Gols</th><th>Bônus</th><th>🏅</th></tr></thead>
           <tbody>${[...history].reverse().map(h=>`<tr class="${h.champion?'my-team':''}">
             <td><strong>${h.season}</strong></td>
             <td style="font-size:11px">${h.leagueName||'-'}</td>
             <td style="font-size:11px">${h.teamName||'-'}</td>
             <td><span style="font-weight:800;color:${h.position===1?'#f0c84a':h.position<=3?'#28c856':'inherit'}">${h.position}º</span></td>
             <td>${h.pts}</td>
             <td>${h.goals||0}</td>
             <td style="color:#28c856;font-size:11px">${h.prize?'+'+this.fmt(h.prize):'-'}</td>
             <td>${h.champion?'🏆':''}${h.topScorerPlayer?'⚽':''}${h.topAssistPlayer?'🎯':''}&nbsp;</td>
           </tr>`).join('')}</tbody>
         </table></div>`;

    return `
    <div class="screen-game">
      ${this.renderNavbar(team)}
      <div class="game-content">
        <div class="screen-header-inner">
          <h2>🏆 Sala de Troféus</h2>
          <p>${team?.name||'Seu time'} · ${seasons} temporada${seasons!==1?'s':''} · ${titles} título${titles!==1?'s':''}</p>
        </div>

        <!-- Resumo rápido -->
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(110px,1fr));gap:10px;margin-bottom:20px">
          ${[
            {icon:'🏆',val:titles,lab:'Títulos'},
            {icon:'🥉',val:top3,lab:'Top 3'},
            {icon:'📅',val:seasons,lab:'Temporadas'},
            {icon:'💰',val:this.fmt(gs.budget),lab:'Orçamento'},
          ].map(s=>`<div style="background:var(--bg2);border:1px solid var(--border);border-radius:10px;padding:14px;text-align:center">
            <div style="font-size:1.5rem">${s.icon}</div>
            <div style="font-family:'Barlow Condensed',sans-serif;font-size:1.5rem;font-weight:900;color:var(--gold)">${s.val}</div>
            <div style="font-size:10px;color:var(--text3);text-transform:uppercase;letter-spacing:.1em">${s.lab}</div>
          </div>`).join('')}
        </div>

        <!-- Destaques da temporada atual -->
        ${(topScorer||myTopScorer||topAssist||myTopAssist)?`
        <div style="background:var(--bg2);border:1px solid var(--border);border-radius:10px;padding:16px;margin-bottom:20px">
          <div style="font-family:'Barlow Condensed',sans-serif;font-size:.85rem;font-weight:800;color:var(--text3);letter-spacing:.1em;text-transform:uppercase;margin-bottom:12px">🌟 Destaques da Temporada Atual</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
            ${topScorer?`<div style="display:flex;align-items:center;gap:10px;background:rgba(240,200,74,.06);border:1px solid rgba(240,200,74,.15);border-radius:8px;padding:10px">
              <span style="font-size:1.8rem">⚽</span>
              <div><div style="font-size:10px;color:var(--text3);text-transform:uppercase;letter-spacing:.08em">Artilheiro da Liga</div>
                <div style="font-weight:800;color:${topScorer.teamId===gs.playerTeamId?'#f0c84a':'var(--text)'}">${topScorer.name}</div>
                <div style="font-size:11px;color:var(--text3)">${topScorer.goals} gol${topScorer.goals!==1?'s':''} · ${gs.teams[topScorer.teamId]?.name||'-'}</div></div>
            </div>`:''}
            ${topAssist?`<div style="display:flex;align-items:center;gap:10px;background:rgba(74,144,226,.06);border:1px solid rgba(74,144,226,.15);border-radius:8px;padding:10px">
              <span style="font-size:1.8rem">🎯</span>
              <div><div style="font-size:10px;color:var(--text3);text-transform:uppercase;letter-spacing:.08em">Líder em Assistências</div>
                <div style="font-weight:800;color:${topAssist.teamId===gs.playerTeamId?'#4a90e2':'var(--text)'}">${topAssist.name}</div>
                <div style="font-size:11px;color:var(--text3)">${topAssist.assists} assist. · ${gs.teams[topAssist.teamId]?.name||'-'}</div></div>
            </div>`:''}
          </div>
        </div>`:''}

        <!-- Troféus de Liga -->
        <div style="background:var(--bg2);border:1px solid var(--border);border-radius:10px;padding:16px;margin-bottom:20px">
          <div style="font-family:'Barlow Condensed',sans-serif;font-size:.85rem;font-weight:800;color:var(--text3);letter-spacing:.1em;text-transform:uppercase;margin-bottom:12px">🏆 Troféus de Liga</div>
          ${trophyHTML}
        </div>

        <!-- Troféus Copa do Mundo -->
        <div style="background:var(--bg2);border:1px solid ${wcTitles>0?'rgba(240,200,74,.25)':'var(--border)'};border-radius:10px;padding:16px;margin-bottom:20px">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
            <div style="font-family:'Barlow Condensed',sans-serif;font-size:.85rem;font-weight:800;color:${wcTitles>0?'#f0c84a':'var(--text3)'};letter-spacing:.1em;text-transform:uppercase">🌍 Copa do Mundo de Futsal</div>
            ${gs.worldCup ? `<button class="btn btn-ghost btn-sm" data-action="worldcup">Ver Copa →</button>` : ''}
          </div>
          ${wcTrophyHTML}
        </div>

        <!-- Conquistas -->
        <div style="background:var(--bg2);border:1px solid var(--border);border-radius:10px;padding:16px;margin-bottom:20px">
          <div style="font-family:'Barlow Condensed',sans-serif;font-size:.85rem;font-weight:800;color:var(--text3);letter-spacing:.1em;text-transform:uppercase;margin-bottom:12px">🎖️ Conquistas</div>
          <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:10px">
            ${achievements.map(a=>`<div style="display:flex;align-items:center;gap:10px;padding:10px;border-radius:8px;border:1px solid ${a.done?'rgba(240,200,74,.25)':'rgba(255,255,255,.05)'};background:${a.done?'rgba(240,200,74,.06)':'rgba(0,0,0,.2)'};opacity:${a.done?'1':'.45'}">
              <span style="font-size:1.6rem;flex-shrink:0">${a.icon}</span>
              <div><div style="font-weight:800;font-size:12px;color:${a.done?'#f0c84a':'var(--text2)'}">${a.name}</div>
                <div style="font-size:10px;color:var(--text3)">${a.desc}</div>
                ${a.done?'<div style="font-size:9px;color:#28c856;margin-top:2px;font-weight:700">✔ CONQUISTADO</div>':''}
              </div>
            </div>`).join('')}
          </div>
        </div>

        <!-- Histórico de Ligas -->
        <div style="background:var(--bg2);border:1px solid var(--border);border-radius:10px;padding:16px;margin-bottom:20px">
          <div style="font-family:'Barlow Condensed',sans-serif;font-size:.85rem;font-weight:800;color:var(--text3);letter-spacing:.1em;text-transform:uppercase;margin-bottom:12px">📅 Histórico de Ligas</div>
          ${historyHTML}
        </div>

        <!-- Histórico da Copa do Mundo -->
        <div style="background:var(--bg2);border:1px solid ${wcHistory.length>0?'rgba(240,200,74,.15)':'var(--border)'};border-radius:10px;padding:16px">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
            <div style="font-family:'Barlow Condensed',sans-serif;font-size:.85rem;font-weight:800;color:${wcTitles>0?'#f0c84a':'var(--text3)'};letter-spacing:.1em;text-transform:uppercase">🌍 Histórico — Copa do Mundo de Clubes</div>
            ${gs.worldCup?`<button class="btn btn-ghost btn-sm" data-action="worldcup">Ver Copa →</button>`:''}
          </div>
          ${wcHistoryHTML}
        </div>
      </div>
    </div>`;
  }

  // ── COPA DO MUNDO ─────────────────────────────────────────────
  renderWorldCup() {
    const gs = this.gs;
    const wc = gs.worldCup;
    const team = gs.getPlayerTeam();
    if (!wc) return `
    <div class="screen-game">${this.renderNavbar(team)}
      <div class="game-content">
        <div style="text-align:center;padding:60px 20px;color:var(--text3)">
          <div style="font-size:4rem">🌍</div>
          <h2 style="color:var(--gold);font-family:'Barlow Condensed',sans-serif;margin:12px 0">Copa do Mundo de Futsal</h2>
          <p>Conclua uma temporada para disputar a Copa!</p>
          <button class="btn btn-primary" style="margin-top:20px" data-action="dashboard">← Voltar</button>
        </div>
      </div>
    </div>`;

    const phaseNames = { quarterfinals:'⚡ Quartas de Final', semifinals:'🔥 Semifinais', final:'🏆 GRANDE FINAL', done:'✅ Encerrada' };
    const phaseOrder = ['quarterfinals','semifinals','final'];
    const currentPhaseIdx = phaseOrder.indexOf(wc.phase);

    const renderMatch = (m, phase) => {
      const ht = gs.teams[m.home], at = gs.teams[m.away];
      if (!ht || !at) return '';
      const isMyMatch = m.home === gs.playerTeamId || m.away === gs.playerTeamId;
      const isActive  = phase === wc.phase;
      const played    = m.played;
      const scoreStr  = played ? `${m.result?.score?.home ?? 0}–${m.result?.score?.away ?? 0}${m.penalties?' (pen.)':''}` : 'vs';
      const winnerBg  = (tid) => played && m.winner === tid ? 'rgba(240,200,74,.15)' : 'transparent';
      const winnerBd  = (tid) => played && m.winner === tid ? '2px solid rgba(240,200,74,.5)' : '2px solid transparent';
      return `
      <div style="background:${played?'rgba(0,0,0,.3)':'rgba(255,255,255,.04)'};border:1px solid ${isMyMatch&&isActive?'rgba(240,200,74,.4)':'rgba(255,255,255,.08)'};border-radius:12px;padding:12px 14px;margin:6px 0;${isMyMatch&&isActive?'box-shadow:0 0 20px rgba(240,200,74,.15)':''}">
        <div style="display:flex;align-items:center;gap:8px">
          <div style="flex:1;text-align:right;background:${winnerBg(m.home)};border:${winnerBd(m.home)};border-radius:8px;padding:6px 10px">
            <div style="display:flex;align-items:center;justify-content:flex-end;gap:6px">
              ${this.teamLogo(m.home,ht.name,ht.color,ht.color2,24)}
              <span style="font-size:13px;font-weight:700;color:${played&&m.winner===m.home?'#f0c84a':'var(--text)'}">${ht.name}</span>
            </div>
            ${isMyMatch&&m.home===gs.playerTeamId?'<div style="font-size:9px;color:#f0c84a;margin-top:2px;text-align:right">SEU TIME</div>':''}
          </div>
          <div style="font-family:'Barlow Condensed',sans-serif;font-size:${played?'1.4rem':'1rem'};font-weight:900;color:${played?'#e4edf6':'rgba(255,255,255,.35)'};text-align:center;min-width:60px">${scoreStr}</div>
          <div style="flex:1;background:${winnerBg(m.away)};border:${winnerBd(m.away)};border-radius:8px;padding:6px 10px">
            <div style="display:flex;align-items:center;gap:6px">
              ${this.teamLogo(m.away,at.name,at.color,at.color2,24)}
              <span style="font-size:13px;font-weight:700;color:${played&&m.winner===m.away?'#f0c84a':'var(--text)'}">${at.name}</span>
            </div>
            ${isMyMatch&&m.away===gs.playerTeamId?'<div style="font-size:9px;color:#f0c84a;margin-top:2px">SEU TIME</div>':''}
          </div>
        </div>
        ${played?`<div style="text-align:center;font-size:11px;color:#f0c84a;margin-top:4px">🏅 Classificado: <strong>${gs.teams[m.winner]?.name||'-'}</strong></div>`:''}
        ${isActive && !played ? `
        <div style="display:flex;gap:8px;margin-top:10px;justify-content:center">
          ${isMyMatch && !wc.playerEliminated ? `<button class="btn btn-primary btn-sm" data-action="wc-play" data-match-id="${m.id}" data-phase="${phase}">⚽ Jogar Partida</button>` : ''}
          <button class="btn btn-ghost btn-sm" data-action="wc-sim" data-match-id="${m.id}" data-phase="${phase}">⏩ Simular</button>
        </div>` : ''}
      </div>`;
    };

    const allCurrentPlayed = (wc.bracket[wc.phase] || []).every(m => m.played);
    const isDone = wc.phase === 'done';
    const champion = wc.champion ? gs.teams[wc.champion] : null;

    // Prêmios
    const prizeTable = [
      { label:'🥇 Campeão',      val: gs.fmt(wc.prize.winner) },
      { label:'🥈 Vice',         val: gs.fmt(wc.prize.runnerUp) },
      { label:'🥉 Semifinal',    val: gs.fmt(wc.prize.semi) },
      { label:'⚽ Quartas',      val: gs.fmt(wc.prize.quarter) },
    ];

    return `
    <div class="screen-game">
      ${this.renderNavbar(team)}
      <div class="game-content">

        <!-- Header Copa do Mundo -->
        <div style="background:linear-gradient(135deg,#080d12 0%,#0d1f12 40%,#0a1520 100%);border:1px solid rgba(240,200,74,.2);border-radius:16px;padding:20px 24px;margin-bottom:18px;position:relative;overflow:hidden">
          <div style="position:absolute;inset:0;background:radial-gradient(ellipse at 30% 50%,rgba(240,200,74,.06) 0%,transparent 60%);pointer-events:none"></div>
          <div style="display:flex;align-items:center;gap:18px;flex-wrap:wrap">
            <div style="text-align:center;flex-shrink:0">
              <!-- Logo Copa do Mundo de Clubes -->
              <div style="position:relative;width:72px;height:72px;margin:0 auto">
                <svg viewBox="0 0 72 72" width="72" height="72" xmlns="http://www.w3.org/2000/svg">
                  <!-- Globo terrestre -->
                  <circle cx="36" cy="36" r="28" fill="none" stroke="rgba(240,200,74,.6)" stroke-width="1.5"/>
                  <circle cx="36" cy="36" r="22" fill="rgba(40,120,200,.25)" stroke="rgba(74,144,226,.5)" stroke-width="1"/>
                  <!-- Meridianos -->
                  <ellipse cx="36" cy="36" rx="10" ry="22" fill="none" stroke="rgba(74,144,226,.4)" stroke-width="1"/>
                  <line x1="14" y1="36" x2="58" y2="36" stroke="rgba(74,144,226,.4)" stroke-width="1"/>
                  <line x1="18" y1="24" x2="54" y2="24" stroke="rgba(74,144,226,.3)" stroke-width=".8"/>
                  <line x1="18" y1="48" x2="54" y2="48" stroke="rgba(74,144,226,.3)" stroke-width=".8"/>
                  <!-- Troféu central -->
                  <rect x="32" y="20" width="8" height="14" rx="2" fill="#f0c84a" opacity=".9"/>
                  <path d="M28 20 Q22 20 22 28 Q22 34 32 36" fill="none" stroke="#f0c84a" stroke-width="2.5" stroke-linecap="round"/>
                  <path d="M44 20 Q50 20 50 28 Q50 34 40 36" fill="none" stroke="#f0c84a" stroke-width="2.5" stroke-linecap="round"/>
                  <rect x="30" y="34" width="12" height="3" rx="1.5" fill="#f0c84a"/>
                  <rect x="27" y="37" width="18" height="3" rx="1.5" fill="#f0c84a" opacity=".85"/>
                  <!-- Estrelas -->
                  <text x="36" y="58" text-anchor="middle" font-size="9" fill="#f0c84a" opacity=".9">★ ★ ★</text>
                  <!-- Anel externo dourado -->
                  <circle cx="36" cy="36" r="33" fill="none" stroke="rgba(240,200,74,.2)" stroke-width=".8" stroke-dasharray="4,3"/>
                </svg>
              </div>
            </div>
            <div style="flex:1">
              <div style="font-family:'Barlow Condensed',sans-serif;font-size:.75rem;font-weight:700;color:#f0c84a;letter-spacing:.2em;text-transform:uppercase;opacity:.7">Futsal Manager Presenta</div>
              <div style="font-family:'Barlow Condensed',sans-serif;font-size:2rem;font-weight:900;color:#f0c84a;line-height:1;letter-spacing:.04em">COPA DO MUNDO</div>
              <div style="font-family:'Barlow Condensed',sans-serif;font-size:1.1rem;font-weight:700;color:#e4edf6;letter-spacing:.08em">DE FUTSAL ${wc.season}</div>
              <div style="font-size:11px;color:rgba(255,255,255,.4);margin-top:4px">Top 2 de 4 Ligas · 8 Times · Mata-mata</div>
            </div>
            <div style="text-align:center;background:rgba(240,200,74,.08);border:1px solid rgba(240,200,74,.2);border-radius:10px;padding:12px 18px">
              <div style="font-size:10px;color:rgba(255,255,255,.4);text-transform:uppercase;letter-spacing:.1em">Fase Atual</div>
              <div style="font-family:'Barlow Condensed',sans-serif;font-size:1.1rem;font-weight:900;color:#f0c84a">${phaseNames[wc.phase]||wc.phase}</div>
              ${wc.playerQualified && !wc.playerEliminated && !isDone ? `<div style="font-size:10px;color:#28c856;margin-top:2px">✓ Você está na Copa</div>` : ''}
              ${wc.playerEliminated ? `<div style="font-size:10px;color:rgba(255,100,100,.7);margin-top:2px">Eliminado</div>` : ''}
            </div>
          </div>

          <!-- Música tema da copa -->
          <div style="margin-top:14px;background:rgba(0,0,0,.3);border-radius:10px;padding:10px 14px;border:1px solid rgba(255,255,255,.06);display:flex;align-items:center;gap:12px">
            <div style="font-size:1.4rem">🎵</div>
            <div style="flex:1">
              <div style="font-size:10px;color:rgba(255,255,255,.35);text-transform:uppercase;letter-spacing:.1em">Tema da Copa</div>
              <div style="font-size:13px;font-weight:700;color:#f0c84a">🌍 Copa Theme — Épico Orquestral</div>
            </div>
            <button onclick="if(window.BGM)window.BGM.playWC?.()" style="padding:7px 14px;background:linear-gradient(135deg,#c9890a,#f0c84a);border:none;border-radius:8px;color:#000;font-family:'Barlow Condensed',sans-serif;font-weight:900;font-size:13px;cursor:pointer">▶ Tocar</button>
          </div>
        </div>

        <!-- Campeão (se já decidido) -->
        ${isDone && champion ? `
        <div style="background:linear-gradient(135deg,rgba(240,200,74,.15),rgba(40,200,86,.08));border:2px solid rgba(240,200,74,.5);border-radius:16px;padding:24px;text-align:center;margin-bottom:18px;box-shadow:0 0 40px rgba(240,200,74,.2)">
          <div style="font-size:3.5rem;margin-bottom:8px">🏆</div>
          <div style="font-family:'Barlow Condensed',sans-serif;font-size:1rem;font-weight:700;color:rgba(255,255,255,.4);letter-spacing:.15em;text-transform:uppercase">Campeão Mundial ${wc.season}</div>
          <div style="display:flex;align-items:center;justify-content:center;gap:14px;margin:10px 0">
            ${this.teamLogo(wc.champion, champion.name, champion.color, champion.color2, 52)}
            <div style="font-family:'Barlow Condensed',sans-serif;font-size:2rem;font-weight:900;color:#f0c84a">${champion.name}</div>
          </div>
          ${wc.champion === gs.playerTeamId ? `<div style="color:#f0c84a;font-weight:700;margin-top:6px">🎉 PARABÉNS! SEU TIME É O CAMPEÃO MUNDIAL! 🎉</div><div style="color:#28c856;font-size:14px">+${gs.fmt(wc.prize.winner)} adicionado ao orçamento!</div>` : ''}
          <button class="btn btn-primary" style="margin-top:16px" data-action="dashboard">Continuar para o Dashboard →</button>
        </div>` : ''}

        <div style="display:grid;grid-template-columns:1fr auto;gap:18px;align-items:start;flex-wrap:wrap">
          <!-- Bracket -->
          <div>
            ${phaseOrder.map((ph, idx) => {
              const matches = wc.bracket[ph] || [];
              if (matches.length === 0 && idx > 0 && ph !== wc.phase) return '';
              const isCurrentPhase = ph === wc.phase;
              const isFuture = idx > currentPhaseIdx && !isDone;
              if (isFuture && matches.length === 0) return `
              <div style="margin-bottom:14px">
                <div style="font-family:'Barlow Condensed',sans-serif;font-size:.8rem;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:rgba(255,255,255,.25);margin-bottom:8px;padding-bottom:6px;border-bottom:1px solid rgba(255,255,255,.06)">${phaseNames[ph]||ph}</div>
                <div style="color:rgba(255,255,255,.2);font-size:12px;padding:10px;text-align:center;font-style:italic">Aguardando fase anterior...</div>
              </div>`;
              return `
              <div style="margin-bottom:18px">
                <div style="font-family:'Barlow Condensed',sans-serif;font-size:.8rem;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:${isCurrentPhase?'#f0c84a':'rgba(255,255,255,.4)'};margin-bottom:8px;padding-bottom:6px;border-bottom:1px solid ${isCurrentPhase?'rgba(240,200,74,.3)':'rgba(255,255,255,.08)'}">${phaseNames[ph]||ph}</div>
                ${matches.map(m => renderMatch(m, ph)).join('')}
                ${isCurrentPhase && allCurrentPlayed && !isDone ? `
                <div style="text-align:center;margin-top:12px">
                  <button class="btn btn-primary" data-action="wc-advance" style="background:linear-gradient(135deg,#c9890a,#f0c84a);color:#000;font-weight:900">
                    ${wc.phase === 'final' ? '🏆 Encerrar Copa' : '⚡ Avançar para Próxima Fase →'}
                  </button>
                </div>` : ''}
                ${isCurrentPhase && !allCurrentPlayed && !isDone ? `
                <div style="text-align:center;margin-top:10px">
                  <button class="btn btn-ghost btn-sm" data-action="wc-sim-all">⏩ Simular Todos os Jogos</button>
                </div>` : ''}
              </div>`;
            }).join('')}
          </div>

          <!-- Sidebar: premiações + times -->
          <div style="min-width:190px">
            <div style="background:var(--bg2);border:1px solid var(--border);border-radius:12px;padding:14px;margin-bottom:12px">
              <div style="font-family:'Barlow Condensed',sans-serif;font-size:.75rem;font-weight:800;color:var(--text3);letter-spacing:.1em;text-transform:uppercase;margin-bottom:10px">💰 Premiações</div>
              ${prizeTable.map(p=>`
              <div style="display:flex;justify-content:space-between;align-items:center;padding:5px 0;border-bottom:1px solid rgba(255,255,255,.05)">
                <span style="font-size:12px;color:var(--text2)">${p.label}</span>
                <span style="font-size:12px;font-weight:700;color:#28c856">${p.val}</span>
              </div>`).join('')}
            </div>
            <div style="background:var(--bg2);border:1px solid var(--border);border-radius:12px;padding:14px">
              <div style="font-family:'Barlow Condensed',sans-serif;font-size:.75rem;font-weight:800;color:var(--text3);letter-spacing:.1em;text-transform:uppercase;margin-bottom:10px">🌍 Participantes</div>
              ${wc.teams.filter((id,i,a)=>a.indexOf(id)===i).map(tid => {
                const t = gs.teams[tid];
                if (!t) return '';
                const isElim = wc.bracket.quarterfinals.some(m=>m.played&&m.loser===tid) || wc.bracket.semifinals?.some(m=>m.played&&m.loser===tid);
                const isChamp = wc.champion === tid;
                return `<div style="display:flex;align-items:center;gap:8px;padding:4px 0;opacity:${isElim&&!isChamp?'.4':'1'}">
                  ${this.teamLogo(tid,t.name,t.color,t.color2,20)}
                  <span style="font-size:12px;color:${tid===gs.playerTeamId?'#f0c84a':isChamp?'#28c856':'var(--text2)'}">${t.name}${tid===gs.playerTeamId?' ⭐':''}${isChamp?' 🏆':''}</span>
                </div>`;
              }).join('')}
            </div>
          </div>
        </div>

        ${!isDone ? `<div style="text-align:center;margin-top:12px">
          <button class="btn btn-ghost btn-sm" data-action="dashboard">← Voltar ao Dashboard</button>
        </div>` : ''}
      </div>
    </div>`;
  }

  playWorldCupMatch(matchId, phase) {
    const gs = this.gs;
    const wc = gs.worldCup;
    if (!wc) return;
    const m = (wc.bracket[phase] || []).find(x => x.id === matchId);
    if (!m || m.played) return;
    const homeT = gs.teams[m.home], awayT = gs.teams[m.away];
    if (!homeT || !awayT) return;
    const isHome = m.home === gs.playerTeamId;
    const ai = new AIManager(gs);
    const playerSquad = gs.squad.map(id=>gs.players[id]).filter(Boolean).slice(0,5);
    const oppId = isHome ? m.away : m.home;
    const oppSquad = ai.pickSquad(oppId);
    const homeSquad = isHome ? playerSquad : oppSquad;
    const awaySquad = isHome ? oppSquad : playerSquad;
    if (homeSquad.length === 0 || awaySquad.length === 0) { this.showToast('Escale seu time nas Táticas antes de jogar!','warn'); return; }
    const engine = new MatchEngine(homeT, awayT, homeSquad, awaySquad, gs.tactics, ai.chooseTactics(oppId));
    const result = engine.simulate();
    gs.processWorldCupMatchResult(matchId, phase, result);
    const myS = isHome ? result.score.home : result.score.away;
    const thS = isHome ? result.score.away : result.score.home;
    if (window.SFX) { myS > thS ? window.SFX.win?.() : myS < thS ? window.SFX.loss?.() : window.SFX.draw?.(); }
    const processedM = (wc.bracket[phase] || []).find(x => x.id === matchId);
    const won = processedM?.winner === gs.playerTeamId;
    this.showToast(won ? `✅ Classificado! ${homeT.name} ${result.score.home}–${result.score.away} ${awayT.name}` : `❌ Eliminado. ${homeT.name} ${result.score.home}–${result.score.away} ${awayT.name}`, won?'success':'error');
    this.render('worldcup');
  }

  simWorldCupMatch(matchId, phase) {
    const gs = this.gs;
    const wc = gs.worldCup;
    if (!wc) return;
    const m = (wc.bracket[phase] || []).find(x => x.id === matchId);
    if (!m || m.played) return;
    const ai = new AIManager(gs);
    const ht = gs.teams[m.home], at = gs.teams[m.away];
    if (!ht || !at) return;
    const engine = new MatchEngine(ht, at, ai.pickSquad(m.home), ai.pickSquad(m.away), ai.chooseTactics(m.home), ai.chooseTactics(m.away));
    gs.processWorldCupMatchResult(matchId, phase, engine.simulate());
    this.render('worldcup');
  }

  // ── SIMULAÇÃO VISUAL (tempo passando) ─────────────────────────
  renderSimVisual() {
    const gs = this.gs;
    const m  = this.pendingMatch;
    const team = gs.getPlayerTeam();
    if (!m || !this._simResult) return this.renderDashboard();

    const r  = this._simResult;
    const homeT = gs.teams[m.home], awayT = gs.teams[m.away];
    const isHome = m.home === gs.playerTeamId;
    const myScore = isHome ? r.score.home : r.score.away;
    const theirScore = isHome ? r.score.away : r.score.home;
    const won = myScore > theirScore, drew = myScore === theirScore;

    return `
    <div class="screen-game">
      ${this.renderNavbar(team)}
      <div class="game-content">
        <div id="simvis-root" style="max-width:700px;margin:0 auto"></div>
      </div>
    </div>`;
  }

  startSimVisual() {
    const gs = this.gs;
    const m  = this.pendingMatch;
    if (!m) return;

    const playerSquad = gs.squad.map(id=>gs.players[id]).filter(Boolean).slice(0,5);
    if (playerSquad.length < 5) { this.showToast('⚠️ Escale 5 jogadores em Táticas!','warn'); return; }

    const ai = new AIManager(gs);
    const oppId = m.home === gs.playerTeamId ? m.away : m.home;
    const oppSquad = ai.pickSquad(oppId);
    const homeSquad = m.home === gs.playerTeamId ? playerSquad : oppSquad;
    const awaySquad = m.home === gs.playerTeamId ? oppSquad : playerSquad;
    const homeTac = m.home === gs.playerTeamId ? gs.tactics : ai.chooseTactics(m.home);
    const awayTac = m.home === gs.playerTeamId ? ai.chooseTactics(m.away) : gs.tactics;
    const engine = new MatchEngine(gs.teams[m.home], gs.teams[m.away], homeSquad, awaySquad, homeTac, awayTac);
    this._simResult = engine.simulate();

    // Render the visual sim screen
    const app = document.getElementById('app');
    app.innerHTML = this.renderSimVisual();
    this.attachEvents();

    const root = document.getElementById('simvis-root');
    if (!root) return;

    this._runSimVisual(root, m, this._simResult, gs);
  }

  _runSimVisual(root, match, result, gs) {
    const homeT = gs.teams[match.home], awayT = gs.teams[match.away];
    const isHome = match.home === gs.playerTeamId;
    const events = result.events.filter(e => e.type !== 'kickoff');
    const totalTime = 40; // minutos totais

    let currentMinute = 0;
    let score = {home:0, away:0};
    let eventIdx = 0;
    let paused = false;
    let speed = 1;
    let interval = null;
    let substitutions = [{used:false},{used:false},{used:false}]; // 3 subs disponíveis
    const mySquadFull = gs.squad.map(id=>gs.players[id]).filter(Boolean);
    const myBench = mySquadFull.slice(5);

    const teamColor = c => `background:${c.color||'#333'};color:${c.color2||'#fff'}`;

    const render = () => {
      const pct = (currentMinute / totalTime) * 100;
      const myS = isHome ? score.home : score.away;
      const thS = isHome ? score.away : score.home;
      const resultColor = myS > thS ? '#28c856' : myS === thS ? '#4a90e2' : '#e74c3c';
      const period = currentMinute <= 20 ? '1º TEMPO' : '2º TEMPO';

      root.innerHTML = `
      <!-- PLACAR -->
      <div style="background:linear-gradient(135deg,#0d1822,#141f2e);border:1px solid rgba(255,255,255,.08);border-radius:14px;padding:20px 24px;margin-bottom:16px">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:16px">
          <div style="flex:1;text-align:center">
            <div style="display:inline-flex;align-items:center;justify-content:center;width:48px;height:48px;border-radius:50%;${teamColor(homeT)};margin-bottom:6px;font-size:11px;font-weight:900">${this.teamLogo(homeT.id,homeT.name,homeT.color,homeT.color2,30)}</div>
            <div style="font-family:'Barlow Condensed',sans-serif;font-size:.95rem;font-weight:800;color:var(--text)">${homeT.name}</div>
            <div style="font-size:10px;color:var(--text3)">CASA</div>
          </div>
          <div style="text-align:center;flex-shrink:0">
            <div style="font-family:'Barlow Condensed',sans-serif;font-size:3.2rem;font-weight:900;color:var(--text);line-height:1;letter-spacing:.04em" id="simvis-score">${score.home}<span style="color:rgba(255,255,255,.35);margin:0 6px">–</span>${score.away}</div>
            <div style="font-size:11px;color:var(--gold);font-weight:700;letter-spacing:.08em;margin-top:4px">${currentMinute}'&nbsp;·&nbsp;${period}</div>
            <div style="margin-top:8px;height:4px;background:rgba(255,255,255,.06);border-radius:2px;overflow:hidden;width:160px">
              <div style="height:100%;width:${pct}%;background:linear-gradient(90deg,#4a90e2,#28c856);border-radius:2px;transition:width .3s"></div>
            </div>
          </div>
          <div style="flex:1;text-align:center">
            <div style="display:inline-flex;align-items:center;justify-content:center;width:48px;height:48px;border-radius:50%;${teamColor(awayT)};margin-bottom:6px;font-size:11px;font-weight:900">${this.teamLogo(awayT.id,awayT.name,awayT.color,awayT.color2,30)}</div>
            <div style="font-family:'Barlow Condensed',sans-serif;font-size:.95rem;font-weight:800;color:var(--text)">${awayT.name}</div>
            <div style="font-size:10px;color:var(--text3)">FORA</div>
          </div>
        </div>
      </div>

      <!-- CONTROLES -->
      <div style="display:flex;gap:8px;align-items:center;margin-bottom:16px;flex-wrap:wrap">
        <button id="svpause" style="background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.12);color:#fff;padding:8px 18px;border-radius:8px;font-family:'Barlow Condensed',sans-serif;font-size:14px;font-weight:700;cursor:pointer;letter-spacing:.04em">${paused?'▶ Continuar':'⏸ Pausar'}</button>
        ${[1,2,3,4].map(s=>`<button class="sv-speed${speed===s?' sv-speed-active':''}" data-spd="${s}" style="background:${speed===s?'#f0c84a':'rgba(255,255,255,.06)'};color:${speed===s?'#000':'rgba(255,255,255,.7)'};border:1px solid ${speed===s?'#f0c84a':'rgba(255,255,255,.1)'};padding:6px 14px;border-radius:8px;font-family:'Barlow Condensed',sans-serif;font-size:13px;font-weight:800;cursor:pointer">${s}×</button>`).join('')}
        ${currentMinute >= 40 ? `<button id="svfinish" style="background:#28c856;border:none;color:#000;padding:8px 18px;border-radius:8px;font-family:'Barlow Condensed',sans-serif;font-size:14px;font-weight:800;cursor:pointer;margin-left:auto">Ver Resultado →</button>` : ''}
      </div>

      <!-- CONTEÚDO: Eventos + Subs -->
      <div style="display:grid;grid-template-columns:1fr 280px;gap:14px">
        <!-- Eventos -->
        <div style="background:var(--bg2);border:1px solid var(--border);border-radius:10px;overflow:hidden">
          <div style="padding:10px 14px;border-bottom:1px solid var(--border);font-family:'Barlow Condensed',sans-serif;font-size:.82rem;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:var(--text3)">📋 Acontecimentos</div>
          <div id="simvis-events" style="max-height:320px;overflow-y:auto;padding:8px 0">
            <div style="padding:20px;text-align:center;color:rgba(255,255,255,.25);font-size:12px">⚽ Aquecendo os jogadores...</div>
          </div>
        </div>
        <!-- Substituições -->
        <div style="background:var(--bg2);border:1px solid var(--border);border-radius:10px;overflow:hidden">
          <div style="padding:10px 14px;border-bottom:1px solid var(--border);font-family:'Barlow Condensed',sans-serif;font-size:.82rem;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:var(--text3)">🔄 Substituições <span style="color:#f0c84a">(${substitutions.filter(s=>!s.used).length} restantes)</span></div>
          <div style="padding:10px">
            ${myBench.length > 0 ? myBench.slice(0,3).map((p,i)=>`
              <div style="display:flex;align-items:center;gap:8px;padding:7px;background:rgba(255,255,255,.03);border-radius:7px;margin-bottom:6px;border:1px solid rgba(255,255,255,.05)">
                <span style="font-size:10px;font-weight:800;color:rgba(255,255,255,.4);width:26px">${p.position}</span>
                <span style="flex:1;font-size:12px;font-weight:600;color:var(--text)">${p.name}</span>
                <span style="font-size:10px;color:rgba(255,255,255,.3)">${p.overall}</span>
                ${!substitutions[i]?.used && currentMinute >= 5 ? `<button class="sv-sub-btn" data-idx="${i}" style="background:#1d4a6e;border:1px solid #4a90e2;color:#4a90e2;padding:3px 8px;border-radius:5px;font-size:10px;font-weight:700;cursor:pointer">SUB</button>` : (substitutions[i]?.used?'<span style="font-size:10px;color:#28c856">✔ Entrou</span>':'')}
              </div>`).join('') : '<p style="font-size:11px;color:rgba(255,255,255,.3);padding:8px">Sem jogadores no banco.</p>'}
          </div>
        </div>
      </div>`;

      // Botão pausar
      document.getElementById('svpause')?.addEventListener('click', () => {
        paused = !paused;
        if (paused) clearInterval(interval);
        else startTick();
        render();
      });

      // Botões velocidade
      root.querySelectorAll('.sv-speed').forEach(btn => {
        btn.addEventListener('click', () => {
          speed = parseInt(btn.dataset.spd);
          if (!paused) { clearInterval(interval); startTick(); }
          render();
        });
      });

      // Botão substituição
      root.querySelectorAll('.sv-sub-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const idx = parseInt(btn.dataset.idx);
          if (substitutions[idx] && !substitutions[idx].used) {
            substitutions[idx].used = true;
            const p = myBench[idx];
            if (window.SFX) window.SFX.whistle?.();
            addEventToLog(currentMinute, 'sub', isHome?'home':'away', `🔄 Substituição: ${p.name} (${p.position}) entra em campo`);
            render();
          }
        });
      });

      // Botão finalizar
      document.getElementById('svfinish')?.addEventListener('click', () => {
        clearInterval(interval);
        finalize();
      });
    };

    const eventColors = {goal:'#f0c84a',yellow:'#f0c84a',injury:'#e74c3c',period_end:'#4a90e2',powerplay:'#ff6b35',save:'#28c856',foul:'rgba(255,255,255,.4)',sub:'#28c856'};
    const eventIcons  = {goal:'⚽',yellow:'🟨',injury:'🤕',period_end:'🏁',powerplay:'🔥',save:'🧤',foul:'🚨',sub:'🔄'};
    const logItems = [];

    const addEventToLog = (min, type, team, text) => {
      const teamN = team==='home'?homeT.name:team==='away'?awayT.name:'';
      logItems.unshift({min, type, team, text, teamN});
      const log = document.getElementById('simvis-events');
      if (!log) return;
      const div = document.createElement('div');
      div.style.cssText = `display:flex;align-items:flex-start;gap:8px;padding:8px 12px;border-bottom:1px solid rgba(255,255,255,.04);border-left:3px solid ${eventColors[type]||'#555'};animation:lmEventIn .25s ease`;
      div.innerHTML = `<span style="font-size:14px;flex-shrink:0">${eventIcons[type]||'●'}</span>
        <div style="flex:1"><div style="display:flex;gap:6px;align-items:center"><span style="color:rgba(255,255,255,.4);font-size:10px;font-weight:700">${min}'</span>${teamN?`<span style="font-size:10px;color:rgba(255,255,255,.3)">${teamN}</span>`:''}</div>
        <div style="color:#e4edf6;font-size:12px;margin-top:1px">${text}</div></div>`;
      log.insertBefore(div, log.firstChild);
    };

    const processEvent = (ev) => {
      const teamN = ev.team==='home'?homeT.name:ev.team==='away'?awayT.name:'';
      let text = '';
      if (ev.type==='goal') {
        score[ev.team]++;
        const _pcRs={GL:'#e67e22',FIX:'#2980b9',ALA:'#27ae60','PÍV':'#c0392b'};
        const rsPhoto = ev.player&&window.playerPhotoHTML ? window.playerPhotoHTML(ev.player.name,20,ev.player.position,_pcRs[ev.player.position]||'#555') : '';
        text = `<span style="display:inline-flex;align-items:center;gap:5px;vertical-align:middle">${rsPhoto}<strong>${ev.player?.name||'?'}</strong></span> ${ev.extra?.assister?'· Assist: <em>'+ev.extra.assister.name+'</em>':''}`;
        if (window.SFX) window.SFX.goal?.();
        // Flash score
        const sc = document.getElementById('simvis-score');
        if (sc) { sc.style.color='#f0c84a'; sc.style.textShadow='0 0 24px rgba(240,200,74,.8)'; setTimeout(()=>{sc.style.color='';sc.style.textShadow='';},1200); }
      } else if (ev.type==='yellow') { text=`🟨 Cartão amarelo — ${ev.player?.name||'?'}`; if(window.SFX)window.SFX.yellow?.(); }
      else if (ev.type==='injury')   { text=`🤕 Lesão: ${ev.player?.name||'?'}`; if(window.SFX)window.SFX.injury?.(); }
      else if (ev.type==='period_end') { text=`Fim do ${ev.extra?.period===1?'1º':'2º'} tempo: ${score.home}–${score.away}`; if(window.SFX)window.SFX.whistleLong?.(); }
      else if (ev.type==='powerplay') { text=`Goleiro-linha ativado!`; }
      else if (ev.type==='save')      { text=`🧤 Defesa: ${ev.player?.name||'?'}`; if(window.SFX)window.SFX.save?.(); }
      else if (ev.type==='foul')      { text=`Falta: ${ev.player?.name||'?'}`; if(window.SFX)window.SFX.whistle?.(); }
      else return;
      addEventToLog(ev.minute, ev.type, ev.team, text);
      render();
    };

    const finalize = () => {
      clearInterval(interval);
      this.matchResult = result;
      gs.processMatchResult(match.id, this.pendingLeague, result);
      const myS = isHome ? result.score.home : result.score.away;
      const thS = isHome ? result.score.away : result.score.home;
      if (window.audio) {
        if (myS > thS) setTimeout(() => window.audio.win(), 400);
        else if (myS < thS) setTimeout(() => window.audio.lose(), 400);
        else setTimeout(() => window.audio.whistle(), 400);
      }
      this.render('match');
    };

    const startTick = () => {
      const msPerMin = [null, 800, 380, 160, 60][speed] || 800;
      interval = setInterval(() => {
        if (paused) return;
        currentMinute++;

        // Processar eventos deste minuto
        while (eventIdx < events.length && events[eventIdx].minute <= currentMinute) {
          processEvent(events[eventIdx]);
          eventIdx++;
        }

        // Fim da partida
        if (currentMinute >= totalTime) {
          clearInterval(interval);
          addEventToLog(40, 'period_end', null, `⏱ Fim de jogo! ${homeT.name} ${result.score.home}–${result.score.away} ${awayT.name}`);
          render();
          setTimeout(finalize, 2000);
          return;
        }

        render();
      }, msPerMin);
    };

    render();
    if (window.SFX) window.SFX.kickoff?.();
    startTick();
  }

  // ── PATCH NOTES ──────────────────────────────────────────────
  _showPatchNotes() {
    if (document.getElementById('pn-overlay')) { document.getElementById('pn-overlay').remove(); return; }
    const ov = document.createElement('div');
    ov.id = 'pn-overlay';
    ov.className = 'round-summary-overlay';
    ov.innerHTML = `
    <div class="patchnotes-modal">
      <div class="pn-header">
        <div class="pn-logo">📋</div>
        <div><div class="pn-title">FUTSAL MANAGER</div><div class="pn-version">v11.0 — The Full Career Update</div></div>
      </div>
      <div class="pn-welcome">⚡ <strong>Futsal Manager v11.0</strong> — A maior atualização. Cada sistema foi melhorado ou reescrito.</div>

      <div class="pn-section">
        <div class="pn-section-title">🆕 v11.0 — Novidades desta atualização</div>
        <div class="pn-item pn-new">📸 <strong>Fotos de Jogadores</strong> — Sofascore + Transfermarkt como fallback · 300+ mapeados · Avatar com iniciais por posição para gerados</div>
        <div class="pn-item pn-new">📅 <strong>Calendário</strong> — Nova tela com todas as rodadas · Botão "Ir para Rod. X" avança simulando tudo automaticamente</div>
        <div class="pn-item pn-new">📋 <strong>Gestor de Contratos</strong> — 6º membro do staff · Renova contratos expirando automaticamente · Nível 5 protege por até 2 anos de antecedência</div>
        <div class="pn-item pn-new">🔭 <strong>Academia Rebalanceada</strong> — Scouting tem custo (R$500k sem olheiro, grátis no nível 5) · Raridades afetadas pelo nível do Olheiro</div>
        <div class="pn-item pn-new">💰 <strong>Transferências Reescritas</strong> — 3 abas: Comprar / Vender & Propostas / Histórico · Aceitar/Recusar propostas · Listados têm 45% de proposta por rodada</div>
        <div class="pn-item pn-new">👔 <strong>Staff com Efeito Real nos Jogos</strong> — Assistente aumenta pressão tática · Analista melhora ritmo · Preparador dá boost de fitness antes de cada partida</div>
        <div class="pn-item pn-new">🤖 <strong>IA dos Times Melhorada</strong> — Times dispensam 37+ · Detectam elenco envelhecido · Contratos 40% mais frequentes · Reposição automática</div>
        <div class="pn-item pn-new">🏆 <strong>Troféu Torneio Global</strong> — Seção dedicada na Sala de Troféus com troféu roxo SVG + histórico de todas as edições</div>
        <div class="pn-item pn-new">📊 <strong>Análise Pré-Jogo</strong> — OVR dos times, forma recente e barra de probabilidade antes de cada partida</div>
        <div class="pn-item pn-new">📱 <strong>Mobile Completo</strong> — Bottom navigation, drawer "Mais", navbar adaptativa por breakpoint · Botões nunca somem</div>
        <div class="pn-item pn-new">⚽ <strong>Motor v5</strong> — Stamina por minuto · Vantagem em casa · Cartão vermelho real · Forma recente influencia força</div>
        <div class="pn-item pn-new">💸 <strong>Finanças</strong> — Bilheteria por taxa de vitórias · Bônus R$2M ao ser campeão · Bug de venda corrigido · Alerta de orçamento baixo</div>
        <div class="pn-item pn-new">🎨 <strong>UI Rework</strong> — Navbar com fade · Cards refinados · Tabelas com hover · Dashboard compacto com próximo adversário</div>
      </div>

      <div class="pn-section">
        <div class="pn-section-title">🌟 TUDO QUE EXISTE NO JOGO HOJE</div>

        <div class="pn-item pn-new">⚽ <strong>Motor Futsal Completo</strong> — 5×5, 2 tempos de 20min, faltas acumuladas, goleiro-linha, regras reais</div>
        <div class="pn-item pn-new">🏟️ <strong>5 Ligas</strong> — Brasileirão, LaLiga, Premier League, Serie A, Liga Portugal · 35 times · 490+ jogadores reais</div>
        <div class="pn-item pn-new">🎮 <strong>Simulação Visual</strong> — jogo em tempo real, substituições táticas, pause e velocidade 1×/2×/3×/4×</div>

        <div class="pn-item pn-new">🌍 <strong>Ranking Global de Clubes</strong> — pontuação por vitórias, posição, títulos e saldo · Top 50 na aba Ranking</div>
        <div class="pn-item pn-new">🏆 <strong>Torneio Global</strong> — Top 16 do ranking se enfrentam a cada 3 temporadas · Prêmio: R$25M · Oitavas → Final</div>
        <div class="pn-item pn-new">🌍 <strong>Copa do Mundo</strong> — Top 2 de cada liga ao fim de cada temporada · Prêmio máximo: R$10M</div>

        <div class="pn-item pn-new">🌱 <strong>Academia de Jovens</strong> — 4 talentos de 16–20 anos por temporada para contratar · Potencial até 96</div>
        <div class="pn-item pn-new">🤕 <strong>Lesões Realistas</strong> — 7 tipos (leve/média/grave), duração em rodadas, médico acelera recuperação</div>
        <div class="pn-item pn-new">🚫 <strong>Suspensões</strong> — 2 amarelos acumulados = 1 jogo; vermelho direto = 2 jogos · Não pode jogar suspenso</div>
        <div class="pn-item pn-new">🎖️ <strong>Aposentadoria Automática</strong> — jogadores decidem se aposentar (40+ anos obrigatório) · Substitutos gerados</div>

        <div class="pn-item pn-new">💸 <strong>Top Transferências</strong> — na tela Mercado: maiores da temporada e de todos os tempos com logos</div>
        <div class="pn-item pn-new">🤝 <strong>Patrocínios</strong> — máx 3 contratos · 4 ofertas · valores baseados em desempenho na liga</div>
        <div class="pn-item pn-new">💰 <strong>Finanças Equilibradas</strong> — bilheteria calibrada, sem inflação de valores, economia progressiva</div>

        <div class="pn-item pn-new">📊 <strong>Resumo de Temporada</strong> — artilheiro, assistências, maior transferência, ranking global, histórico</div>
        <div class="pn-item pn-new">👥 <strong>Escalação dos Times</strong> — veja formação, OVR e status de qualquer clube na tela Liga</div>
        <div class="pn-item pn-new">🔒 <strong>Bloqueios</strong> — não avança sem jogar Copa / Torneio · Não inicia com lesionado/suspenso na escalação</div>

        <div class="pn-item pn-new">🏋️ <strong>Treinamento</strong> — 4 focos · jovens crescem mais rápido · preparador físico potencializa</div>
        <div class="pn-item pn-new">👔 <strong>Comissão Técnica</strong> — 5 membros com bônus reais, até nível 5 cada</div>
        <div class="pn-item pn-new">🥇 <strong>Sala de Troféus</strong> — histórico completo de títulos, Copa do Mundo e Torneio Global</div>
        <div class="pn-item pn-new">🎵 <strong>BGM + SFX</strong> — trilha sonora procedural Fá/Dó maior, efeitos sonoros completos para cada evento</div>
      </div>

      <div class="pn-footer">Desenvolvido com ❤️ por <strong style="color:var(--gold)">kauandev1</strong> · 2026 · v10.0</div>
      <button class="rsm-close-btn" id="pn-close">Fechar ✕</button>
    </div>`;
    document.body.appendChild(ov);
    document.getElementById('pn-close')?.addEventListener('click', () => ov.remove());
    ov.addEventListener('click', e => { if (e.target === ov) ov.remove(); });
  }

  // ── TOAST SYSTEM ─────────────────────────────────────────────
  showToast(msg, type='success') {
    const existing = document.querySelectorAll('.toast');
    if (existing.length >= 4) existing[0].remove();
    const icons = {success:'✅',error:'❌',warn:'⚠️',info:'ℹ️'};
    const t = document.createElement('div');
    t.className = `toast toast-${type}`;
    t.innerHTML = `<span class="toast-icon">${icons[type]||'✅'}</span><span class="toast-msg">${msg}</span>`;
    let box = document.getElementById('toast-container');
    if (!box) {
      box = document.createElement('div');
      box.id = 'toast-container';
      box.style.cssText = 'position:fixed;top:70px;right:16px;z-index:9999;display:flex;flex-direction:column;gap:8px;pointer-events:none;max-width:320px';
      document.body.appendChild(box);
    }
    box.appendChild(t);
    requestAnimationFrame(() => requestAnimationFrame(() => t.classList.add('show')));
    setTimeout(() => { t.classList.add('hide'); setTimeout(() => t.remove(), 400); }, 3400);
  }
}

window.UI = UI;
console.log('✅ ui.js v11.0 — Build final');
