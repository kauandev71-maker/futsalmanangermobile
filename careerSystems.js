// ============================================================
// FUTSAL MANAGER — CAREER SYSTEMS v1.0
// Sistemas: Envelhecimento, Contratos, Patrocínios Melhorados,
//           IA de Clubes, Escalação dos Outros Times,
//           Suspensões, Lesões, Bloqueio de Partida, Realismo Geral
// ============================================================

// ── 1. ENVELHECIMENTO E APOSENTADORIA ────────────────────────
window.CareerAging = {
  // Jogadores aposentados nessa temporada (para popup)
  _retiredThisSeason: [],

  // Processa envelhecimento ao final de cada temporada
  processSeasonAging(gs) {
    const news = [];
    this._retiredThisSeason = [];

    Object.values(gs.players).forEach(p => {
      if (p.retired) return;

      // Declínio por faixa etária
      if (p.age >= 30 && p.age <= 32) {
        p._ovrDecay = (p._ovrDecay || 0) + 0.3;
        if (p._ovrDecay >= 1) { p.overall = Math.max(40, p.overall - 1); p._ovrDecay -= 1; }
        if (p.attrs) this._decayAttrs(p, 0.04);
      } else if (p.age >= 33 && p.age <= 35) {
        p._ovrDecay = (p._ovrDecay || 0) + 0.6;
        if (p._ovrDecay >= 1) { p.overall = Math.max(40, p.overall - 1); p._ovrDecay -= 1; }
        if (p.attrs) this._decayAttrs(p, 0.08);
      } else if (p.age >= 36) {
        // Declínio acelerado — mais forte com idade
        const decayRate = p.age >= 39 ? 2 : 1;
        p.overall = Math.max(40, p.overall - decayRate);
        if (p.attrs) this._decayAttrs(p, 0.08 + (p.age-36)*0.02);

        // Chance de aposentadoria — aumenta com a idade
        // 36: 10% | 37: 22% | 38: 50% | 39: 78% | 40+: 100%
        const retireChance = p.age === 36 ? 0.10
                           : p.age === 37 ? 0.22
                           : p.age === 38 ? 0.50
                           : p.age === 39 ? 0.78
                           : 1.00;

        if (Math.random() < retireChance) {
          this._retirePlayer(gs, p, news);
        }
      }

      // Crescimento jovens (até 24a)
      if (p.age <= 24 && !p.retired && p.overall < (p.potential || p.overall) && Math.random() < 0.35) {
        p.overall = Math.min(p.potential || p.overall, p.overall + 1);
      }
    });

    // Gerar substitutos para times que perderam jogadores
    this._generateReplacements(gs);

    return news;
  },

  _retirePlayer(gs, p, news) {
    const teamName = gs.teams[p.teamId]?.name || '';
    const team = gs.teams[p.teamId];
    const wasPlayerTeam = p.teamId === gs.playerTeamId;

    if (team) team.players = (team.players || []).filter(id => id !== p.id);
    if (wasPlayerTeam) gs.squad = (gs.squad || []).filter(id => id !== p.id);

    p.retired = true;
    p.overall = 10;
    p.potential = 10;
    p.value = 0;
    p.salary = 0;
    p.onTransferList = false;
    gs.transferMarket = (gs.transferMarket || []).filter(x => x.id !== p.id);

    const msg = { type: 'aposentadoria', text: `🎖️ ${p.name} (${p.age}a) anunciou sua aposentadoria${teamName ? ' — ex-jogador do ' + teamName : ''}!` };
    news.push(msg);

    // Guarda para popup visual
    this._retiredThisSeason.push({
      name: p.name, age: p.age, position: p.position,
      teamName, wasPlayerTeam
    });
  },

  // Gera um jogador jovem para times que ficaram abaixo de 10 jogadores
  _generateReplacements(gs) {
    Object.values(gs.teams).forEach(team => {
      const activePlayers = (team.players || []).map(id => gs.players[id]).filter(p => p && !p.retired);
      if (activePlayers.length >= 10) return;

      const needed = 12 - activePlayers.length;
      for (let i = 0; i < needed; i++) {
        const pos = ['GL','FIX','ALA','PÍV','FIX','ALA','ALA','PÍV'][i % 8];
        const league = team.league || 'brasileirao';
        const ageNew = 18 + Math.floor(Math.random() * 5);

        // OVR baseado na liga
        const ovrRanges = {
          laliga: [62,72], premier: [63,73], seriea: [60,70],
          brasileirao: [56,66], lpf: [58,68]
        };
        const [ovrMin, ovrMax] = ovrRanges[league] || [56,66];
        const ovr = ovrMin + Math.floor(Math.random() * (ovrMax - ovrMin));

        const nomes = ['Lucas','Matheus','Gabriel','Pedro','Rafael','Bruno','Diego','André','Felipe','Carlos'];
        const sobrenomes = ['Silva','Santos','Oliveira','Costa','Souza','Lima','Ferreira','Alves','Pereira','Rocha'];
        const nome = nomes[Math.floor(Math.random()*nomes.length)] + ' ' + sobrenomes[Math.floor(Math.random()*sobrenomes.length)];

        const pot = Math.min(92, ovr + 8 + Math.floor(Math.random() * 12));
        const id = 'gen_' + Math.random().toString(36).substr(2, 9);
        const sal = Math.round((ovr - 50) * 800 + Math.random() * 5000) * 100;
        const val = Math.round((ovr - 50) * 15000 + Math.random() * 50000) * 100;

        const newPlayer = {
          id, teamId: team.id, name: nome, nationality: 'Brasil',
          age: ageNew, position: pos, overall: ovr, potential: pot,
          value: val, salary: sal,
          attrs: window.generateAttributes ? window.generateAttributes(ovr, pos) : {},
          morale: 75, fitness: 90, injured: false, injuryDays: 0, injuryGames: 0,
          goals: 0, assists: 0, yellowCards: 0, redCards: 0, appearances: 0,
          contractYears: 2 + Math.floor(Math.random() * 3),
          onTransferList: false, retired: false, form: [7,7,7,7,7],
          _yellowsThisCycle: 0, suspendedGames: 0
        };

        gs.players[id] = newPlayer;
        team.players.push(id);
      }
    });
  },

  _decayAttrs(p, chance) {
    const physAttrs = ['velocidade', 'resistencia', 'agilidade', 'forca'];
    physAttrs.forEach(k => {
      if (p.attrs[k] !== undefined && Math.random() < chance) {
        p.attrs[k] = Math.max(30, p.attrs[k] - 1);
      }
    });
    if (window.calcOvr) {
      const newOvr = window.calcOvr(p.attrs, p.position);
      p.overall = Math.min(p.overall, Math.max(40, newOvr));
    }
  }
};

// ── 2. SISTEMA DE SUSPENSÕES ──────────────────────────────────
window.CareerSuspensions = {
  // Aplicar acumulação de cartões após partida
  processMatchCards(gs, events, teamId) {
    if (!events) return [];
    const news = [];
    events.forEach(ev => {
      if (!ev.player) return;
      const p = gs.players[ev.player.id];
      if (!p || p.teamId !== teamId) return;

      if (ev.type === 'yellow') {
        p.yellowCards = (p.yellowCards || 0) + 1;
        p._yellowsThisCycle = (p._yellowsThisCycle || 0) + 1;
        // 3 amarelos acumulados = 1 jogo suspensão
        if (p._yellowsThisCycle >= 3) {
          p.suspendedGames = (p.suspendedGames || 0) + 1;
          p._yellowsThisCycle = 0;
          news.push({ type: 'suspensao', text: `🟨🟨 ${p.name} recebeu o 2º amarelo acumulado — suspenso por 1 jogo!` });
        }
      } else if (ev.type === 'red') {
        p.redCards = (p.redCards || 0) + 1;
        p.suspendedGames = (p.suspendedGames || 0) + 2;
        news.push({ type: 'suspensao', text: `🟥 ${p.name} recebeu cartão vermelho — suspenso por 2 jogos!` });
      }
    });
    return news;
  },

  // Reduz suspensão ao passar uma rodada
  tickSuspensions(gs) {
    Object.values(gs.players).forEach(p => {
      if ((p.suspendedGames || 0) > 0) {
        p.suspendedGames--;
      }
    });
  },

  // Limpa cartões amarelos a cada 5 rodadas (regra de amnistia)
  tickYellowCycle(gs, week) {
    if (week % 5 === 0) {
      Object.values(gs.players).forEach(p => {
        if ((p._yellowsThisCycle || 0) > 0 && !p.suspendedGames) {
          p._yellowsThisCycle = 0;
        }
      });
    }
  },

  isSuspended(p) {
    return (p.suspendedGames || 0) > 0;
  }
};

// ── 3. SISTEMA DE LESÕES MELHORADO ───────────────────────────
window.CareerInjuries = {
  // Tipos de lesão com duração em rodadas
  INJURY_TYPES: [
    { name: 'Torção no tornozelo',  minGames: 1, maxGames: 2,  severity: 'leve'  },
    { name: 'Contusão muscular',    minGames: 1, maxGames: 2,  severity: 'leve'  },
    { name: 'Distensão muscular',   minGames: 2, maxGames: 4,  severity: 'média' },
    { name: 'Lesão no joelho',      minGames: 3, maxGames: 5,  severity: 'média' },
    { name: 'Fratura leve',         minGames: 4, maxGames: 7,  severity: 'grave' },
    { name: 'Ruptura muscular',     minGames: 5, maxGames: 8,  severity: 'grave' },
    { name: 'Lesão ligamentar',     minGames: 6, maxGames: 10, severity: 'grave' },
  ],

  applyInjury(p, hasMedic) {
    const pool = hasMedic
      ? this.INJURY_TYPES.filter(t => t.severity !== 'grave')
      : this.INJURY_TYPES;
    const type = pool[Math.floor(Math.random() * pool.length)];
    const duration = Math.floor(Math.random() * (type.maxGames - type.minGames + 1)) + type.minGames;
    p.injured = true;
    p.injuryGames = duration; // em rodadas, não dias
    p.injuryType = type.name;
    p.injurySeverity = type.severity;
    return { type, duration };
  },

  // Recuperação ao avançar semana
  tickRecovery(gs) {
    const news = [];
    Object.values(gs.players).forEach(p => {
      if (!p.injured || (p.injuryGames || 0) <= 0) return;
      const hasMedic = p.teamId === gs.playerTeamId && gs.coachingStaff?.medico;
      const recovery = hasMedic ? 1.5 : 1; // médico recupera 50% mais rápido
      p.injuryGames = Math.max(0, (p.injuryGames || 0) - recovery);
      if (p.injuryGames <= 0) {
        p.injured = false;
        p.injuryGames = 0;
        p.injuryType = null;
        p.injurySeverity = null;
        if (p.teamId === gs.playerTeamId) {
          news.push({ type: 'lesao', text: `💪 ${p.name} se recuperou totalmente e está disponível!` });
        }
      }
    });
    return news;
  },

  isInjured(p) {
    return p.injured === true && (p.injuryGames || 0) > 0;
  },

  getStatusBadge(p) {
    if (this.isInjured(p)) {
      const sev = p.injurySeverity || 'leve';
      const color = sev === 'grave' ? '#e74c3c' : sev === 'média' ? '#e67e22' : '#f0c84a';
      return `<span style="background:${color};color:#fff;font-size:9px;font-weight:800;padding:1px 5px;border-radius:3px;vertical-align:middle;margin-left:4px">🤕 LESIONADO ${Math.ceil(p.injuryGames||0)}j</span>`;
    }
    if (CareerSuspensions.isSuspended(p)) {
      return `<span style="background:#9b59b6;color:#fff;font-size:9px;font-weight:800;padding:1px 5px;border-radius:3px;vertical-align:middle;margin-left:4px">🚫 SUSPENSO ${p.suspendedGames}j</span>`;
    }
    return '';
  }
};

// ── 4. VALIDAÇÃO DE ESCALAÇÃO ─────────────────────────────────
window.CareerValidation = {
  // Verifica se a escalação está válida para jogar
  validateSquad(gs) {
    const errors = [];
    const squad = (gs.squad || []).filter(Boolean);

    if (squad.length < 5) {
      errors.push(`❌ Escalação incompleta: ${squad.length}/5 jogadores.`);
      return { valid: false, errors };
    }

    squad.forEach(pid => {
      const p = gs.players[pid];
      if (!p) return;
      if (CareerInjuries.isInjured(p)) {
        errors.push(`🤕 ${p.name} está LESIONADO e não pode jogar.`);
      }
      if (CareerSuspensions.isSuspended(p)) {
        errors.push(`🚫 ${p.name} está SUSPENSO por ${p.suspendedGames} jogo(s).`);
      }
    });

    // Verificar posições obrigatórias (pelo menos 1 GL)
    const positions = squad.map(pid => gs.players[pid]?.position).filter(Boolean);
    if (!positions.includes('GL')) {
      errors.push(`❌ Precisa de pelo menos 1 Goleiro (GL) na escalação.`);
    }

    return { valid: errors.length === 0, errors };
  }
};

// ── 5. TELA DE ESCALAÇÃO DE OUTROS TIMES ────────────────────
window.CareerTeamViewer = {
  renderTeamSquadModal(gs, teamId) {
    const team = gs.teams[teamId];
    if (!team) return;
    const players = gs.getTeamPlayers(teamId).sort((a, b) => b.overall - a.overall);
    const ai = new AIManager(gs);
    const startersRaw = ai.pickSquad(teamId);
    const starterIds = new Set(startersRaw.map(p => p.id));
    const formation = ai.chooseTactics(teamId);
    const avgOvr = players.length ? Math.round(players.reduce((a, p) => a + (p.overall || 65), 0) / players.length) : 0;
    const posColors = { GL: '#e67e22', FIX: '#2980b9', ALA: '#27ae60', 'PÍV': '#c0392b' };

    const existing = document.getElementById('team-viewer-overlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'team-viewer-overlay';
    overlay.className = 'round-summary-overlay';
    overlay.style.cssText = 'z-index:8000';

    const starters = startersRaw.map(p => {
      const ph = window.playerPhotoHTML ? window.playerPhotoHTML(p.name, 38, p.position, posColors[p.position]||'#555') : '';
      return `
      <div style="display:flex;align-items:center;gap:10px;padding:8px 10px;background:rgba(40,200,86,.07);border:1px solid rgba(40,200,86,.2);border-radius:10px;margin-bottom:5px">
        ${ph}
        <span style="background:${posColors[p.position]||'#555'};color:#fff;font-size:10px;font-weight:800;padding:2px 6px;border-radius:4px;min-width:30px;text-align:center">${p.position}</span>
        <span style="flex:1;font-weight:700;font-size:13px;color:#e4edf6">${p.name}</span>
        <span style="font-size:11px;color:#8aa8c0">${p.age}a</span>
        <span style="font-family:'Barlow Condensed',sans-serif;font-size:15px;font-weight:900;color:${p.overall>=80?'#f0c84a':p.overall>=70?'#28c856':'#8aa8c0'}">${p.overall}</span>
        ${CareerInjuries.getStatusBadge(p)}
      </div>`;
    }).join('');

    const benchPlayers = players.filter(p => !starterIds.has(p.id)).slice(0, 8).map(p => {
      const ph = window.playerPhotoHTML ? window.playerPhotoHTML(p.name, 30, p.position, posColors[p.position]||'#555') : '';
      return `
      <div style="display:flex;align-items:center;gap:8px;padding:6px 8px;background:rgba(255,255,255,.03);border-radius:7px;margin-bottom:4px">
        ${ph}
        <span style="background:${posColors[p.position]||'#555'};color:#fff;font-size:9px;font-weight:800;padding:1px 5px;border-radius:3px;min-width:28px;text-align:center">${p.position}</span>
        <span style="flex:1;font-size:12px;color:#8aa8c0">${p.name}</span>
        <span style="font-size:11px;color:#4e6d88">${p.age}a</span>
        <span style="font-family:'Barlow Condensed',sans-serif;font-size:13px;font-weight:800;color:#4e6d88">${p.overall}</span>
        ${CareerInjuries.getStatusBadge(p)}
      </div>`;
    }).join('');

    overlay.innerHTML = `
    <div class="round-summary-modal" style="max-width:520px;max-height:85vh;overflow-y:auto">
      <div style="display:flex;align-items:center;gap:14px;margin-bottom:16px">
        <div style="width:48px;height:48px;background:${team.color};border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:1.4rem;flex-shrink:0">${team.name.substring(0,2).toUpperCase()}</div>
        <div>
          <div style="font-family:'Barlow Condensed',sans-serif;font-size:1.4rem;font-weight:900;color:#e4edf6">${team.name}</div>
          <div style="font-size:11px;color:#4e6d88">${team.city} · ${team.country} · Reputação ${team.reputation}</div>
        </div>
        <div style="margin-left:auto;text-align:center">
          <div style="font-family:'Barlow Condensed',sans-serif;font-size:2rem;font-weight:900;color:#f0c84a">${avgOvr}</div>
          <div style="font-size:9px;color:#4e6d88;letter-spacing:.1em">OVR MÉDIO</div>
        </div>
      </div>

      <div style="display:flex;gap:10px;margin-bottom:14px;padding:8px 12px;background:rgba(255,255,255,.04);border-radius:8px">
        <span style="font-size:11px;color:#4e6d88">Formação:</span>
        <strong style="font-size:12px;color:#f0c84a">${formation.tipo}</strong>
        <span style="font-size:11px;color:#4e6d88;margin-left:8px">Estilo:</span>
        <strong style="font-size:12px;color:#e4edf6">${formation.style}</strong>
        <span style="font-size:11px;color:#4e6d88;margin-left:8px">${players.length} jogadores</span>
      </div>

      <div style="font-family:'Barlow Condensed',sans-serif;font-size:.75rem;font-weight:800;color:#28c856;letter-spacing:.12em;text-transform:uppercase;margin-bottom:8px">⭐ Titular — ${formation.tipo}</div>
      ${starters || '<p style="color:#4e6d88;font-size:12px">Nenhum titular escalado</p>'}

      <div style="font-family:'Barlow Condensed',sans-serif;font-size:.75rem;font-weight:800;color:#4e6d88;letter-spacing:.12em;text-transform:uppercase;margin:14px 0 8px">🪑 Banco / Reservas</div>
      ${benchPlayers || '<p style="color:#4e6d88;font-size:12px">Nenhum reserva</p>'}

      <button class="rsm-close-btn" id="tv-close" style="margin-top:14px">Fechar ✕</button>
    </div>`;

    document.body.appendChild(overlay);
    document.getElementById('tv-close')?.addEventListener('click', () => overlay.remove());
    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
  }
};

// ── 6. IA DE CLUBES MELHORADA ─────────────────────────────────
window.CareerAI = {
  // Lógica de IA para gerenciar elenco com consciência de lesões/suspensões
  getAvailablePlayers(gs, teamId) {
    return gs.getTeamPlayers(teamId).filter(p =>
      !p.injured &&
      !CareerSuspensions.isSuspended(p) &&
      !p.retired
    );
  },

  // Substituição de lesionados/suspensos na escalação da IA
  pickSquadSmart(gs, teamId) {
    const available = this.getAvailablePlayers(gs, teamId);
    if (available.length === 0) return gs.getTeamPlayers(teamId).slice(0, 5); // fallback

    const ai = new AIManager(gs);
    const tac = ai.chooseTactics(teamId);
    const slots = {
      '1-2-1-1': ['GL','FIX','FIX','ALA','PÍV'],
      '1-1-2-1': ['GL','FIX','ALA','ALA','PÍV'],
      '1-2-2-0': ['GL','FIX','FIX','ALA','ALA'],
      '1-3-1-0': ['GL','FIX','FIX','FIX','ALA'],
      '1-0-3-1': ['GL','ALA','ALA','ALA','PÍV'],
    }[tac.tipo] || ['GL','FIX','ALA','ALA','PÍV'];

    const used = new Set();
    const squad = [];
    for (const role of slots) {
      const pool = available.filter(p => p.position === role && !used.has(p.id)).sort((a, b) => b.overall - a.overall);
      const pick = pool[0] || available.filter(p => !used.has(p.id)).sort((a, b) => b.overall - a.overall)[0];
      if (pick) { squad.push(pick); used.add(pick.id); }
    }
    return squad.slice(0, 5);
  },

  // Contratos da IA — renovação automática inteligente
  processAIContracts(gs, teamId) {
    const news = [];
    const team = gs.teams[teamId];
    if (!team) return news;
    gs.getTeamPlayers(teamId).forEach(p => {
      if (p.contractYears <= 1 && !p.retired) {
        // Renovar jogadores bons
        if (p.overall >= 70) {
          p.contractYears = 2 + Math.floor(Math.random() * 2);
          const raise = 1 + (p.overall >= 80 ? 0.15 : 0.08);
          p.salary = Math.round((p.salary || 10000) * raise);
          news.push(`${team.name} renova com ${p.name} por ${p.contractYears} ano(s)`);
        } else if (p.overall < 65 && Math.random() < 0.4) {
          // Dispensar jogadores fracos com contrato vencendo
          team.players = (team.players || []).filter(id => id !== p.id);
          p.teamId = null;
          if (!gs.transferMarket.find(x => x.id === p.id)) {
            gs.transferMarket.push(p);
          }
          news.push(`${team.name} dispensa ${p.name}`);
        }
      }
    });
    return news;
  }
};

// ── 7. HOOK: Integração com processMatchResult ─────────────────
// Monkey-patch GameState para processar cartões após cada jogo
(function patchGameState() {
  const _original = GameState.prototype.processMatchResult;
  GameState.prototype.processMatchResult = function(matchId, leagueId, result) {
    _original.call(this, matchId, leagueId, result);
    if (!result || !result.events) return;

    const schedule = this.schedules[leagueId];
    const match = schedule?.find(m => m.id === matchId);
    if (!match) return;

    // Processar cartões para ambos os times
    [match.home, match.away].forEach(teamId => {
      const sideKey = teamId === match.home ? 'home' : 'away';
      const sideEvents = result.events.filter(ev => ev.team === sideKey);
      const suspNews = window.CareerSuspensions.processMatchCards(this, sideEvents, teamId);
      suspNews.forEach(n => {
        this.news.unshift({ date: `Rod. ${this.currentWeek}`, type: 'suspensao', text: n.text });
      });
    });

    // Processar lesões ocorridas no jogo
    result.events.filter(ev => ev.type === 'injury' && ev.player).forEach(ev => {
      const p = this.players[ev.player.id];
      if (!p || p.injured) return;
      const hasMedic = p.teamId === this.playerTeamId && this.coachingStaff?.medico;
      const { type, duration } = window.CareerInjuries.applyInjury(p, hasMedic);
      if (p.teamId === this.playerTeamId || p.teamId) {
        const teamName = this.teams[p.teamId]?.name || '';
        this.news.unshift({
          date: `Rod. ${this.currentWeek}`,
          type: 'lesao',
          text: `🤕 ${p.name} (${teamName}) sofreu ${type.name} — indisponível por ${duration} jogo(s)!`
        });
      }
    });
  };

  // Patch nextWeek para tick de suspensões, lesões e cartões amarelos
  const _nextWeek = GameState.prototype.nextWeek;
  GameState.prototype.nextWeek = function() {
    window.CareerSuspensions.tickSuspensions(this);
    window.CareerSuspensions.tickYellowCycle(this, this.currentWeek);

    // Recuperação de lesões com base em rodadas (substitui o sistema de dias)
    const injuryNews = window.CareerInjuries.tickRecovery(this);
    injuryNews.forEach(n => {
      this.news.unshift({ date: `Semana ${this.currentWeek}`, type: 'lesao', text: n.text });
    });

    // IA: processar contratos já é feito pelo pipeline weekly do AIManager (processWeekly)
    // Aqui mantemos apenas o tick de suspensões/lesões para todos os times

    return _nextWeek.call(this);
  };

  // Patch startNewSeason para envelhecimento ao fim da temporada
  const _startNewSeason = GameState.prototype.startNewSeason;
  GameState.prototype.startNewSeason = function() {
    const agingNews = window.CareerAging.processSeasonAging(this);
    agingNews.forEach(n => {
      this.news.unshift({ date: `T${this.season}`, type: 'aposentadoria', text: n.text });
    });
    return _startNewSeason.call(this);
  };

  console.log('✅ careerSystems.js — GameState patches aplicados');
})();

// ── 8. PATCH AIManager.pickSquad — usa jogadores disponíveis ──
(function patchAIManager() {
  const _original = AIManager.prototype.pickSquad;
  AIManager.prototype.pickSquad = function(teamId) {
    return window.CareerAI.pickSquadSmart(this.gs, teamId);
  };
})();

// ── 9. PATCH UI — Bloqueio de partida, popup aposentadoria, simPlayerMatch ──
(function patchUI() {

  // Patch playMatch — bloqueia se escalação inválida
  const _playMatch = UI.prototype.playMatch;
  UI.prototype.playMatch = function() {
    const validation = window.CareerValidation.validateSquad(this.gs);
    if (!validation.valid) {
      this.showToast('🚫 Escalação inválida — veja os detalhes!', 'error');
      this._showSquadBlockModal(validation.errors);
      return;
    }
    _playMatch.call(this);
  };

  // Patch startLiveMatch — bloqueia se escalação inválida
  const _startLiveMatch = UI.prototype.startLiveMatch;
  if (_startLiveMatch) {
    UI.prototype.startLiveMatch = function() {
      const validation = window.CareerValidation.validateSquad(this.gs);
      if (!validation.valid) {
        this.showToast('🚫 Escalação inválida — veja os detalhes!', 'error');
        this._showSquadBlockModal(validation.errors);
        return;
      }
      _startLiveMatch.call(this);
    };
  }

  // Patch simPlayerMatch — também bloqueia se escalação inválida
  const _simPlayerMatch = UI.prototype.simPlayerMatch;
  UI.prototype.simPlayerMatch = function() {
    const validation = window.CareerValidation.validateSquad(this.gs);
    if (!validation.valid) {
      this.showToast('🚫 Escalação inválida — corrija antes de simular!', 'error');
      this._showSquadBlockModal(validation.errors);
      return;
    }
    _simPlayerMatch.call(this);
  };

  // Popup de aposentadoria — aparece no modal de fim de temporada se houve aposentados
  UI.prototype._showRetirementPopup = function(retired) {
    if (!retired || retired.length === 0) return;
    const playerTeamRetired = retired.filter(r => r.wasPlayerTeam);
    const otherRetired = retired.filter(r => !r.wasPlayerTeam);

    const existing = document.getElementById('retirement-overlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'retirement-overlay';
    overlay.className = 'round-summary-overlay';
    overlay.style.cssText = 'z-index:9600';

    const posIcons = { GL: '🧤', FIX: '🛡️', ALA: '⚡', 'PÍV': '🎯' };

    overlay.innerHTML = `
    <div class="round-summary-modal" style="max-width:440px">
      <div style="text-align:center;margin-bottom:14px">
        <div style="font-size:2.5rem;margin-bottom:6px">🎖️</div>
        <div style="font-family:'Barlow Condensed',sans-serif;font-size:1.3rem;font-weight:900;color:#f0c84a">
          APOSENTADORIAS DA TEMPORADA
        </div>
        <div style="font-size:11px;color:var(--text4);margin-top:4px">
          ${retired.length} jogador${retired.length > 1 ? 'es' : ''} anunciou${retired.length > 1 ? 'ram' : ''} o fim da carreira
        </div>
      </div>

      ${playerTeamRetired.length > 0 ? `
      <div style="background:rgba(231,76,60,.08);border:1px solid rgba(231,76,60,.25);border-radius:10px;padding:12px;margin-bottom:10px">
        <div style="font-size:10px;color:#e74c3c;font-weight:800;letter-spacing:.1em;text-transform:uppercase;margin-bottom:8px">🔴 Do seu elenco</div>
        ${playerTeamRetired.map(r => `
          <div style="display:flex;align-items:center;gap:10px;padding:6px 0;border-bottom:1px solid rgba(255,255,255,.05)">
            <span style="font-size:1.4rem">${posIcons[r.position] || '⚽'}</span>
            <div>
              <div style="font-weight:700;font-size:13px;color:#e4edf6">${r.name}</div>
              <div style="font-size:11px;color:var(--text3)">${r.age} anos · ${r.position}</div>
            </div>
            <span style="margin-left:auto;font-size:11px;color:var(--text4)">Aposentado</span>
          </div>`).join('')}
      </div>` : ''}

      ${otherRetired.length > 0 ? `
      <div style="background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.07);border-radius:10px;padding:12px;margin-bottom:14px">
        <div style="font-size:10px;color:var(--text4);font-weight:800;letter-spacing:.1em;text-transform:uppercase;margin-bottom:8px">Outros times</div>
        ${otherRetired.slice(0, 5).map(r => `
          <div style="display:flex;align-items:center;gap:8px;padding:4px 0">
            <span style="font-size:1rem">${posIcons[r.position] || '⚽'}</span>
            <span style="font-size:12px;color:var(--text3)">${r.name} (${r.age}a) — ${r.teamName || 'sem clube'}</span>
          </div>`).join('')}
        ${otherRetired.length > 5 ? `<div style="font-size:10px;color:var(--text4);margin-top:4px">+${otherRetired.length - 5} outros...</div>` : ''}
      </div>` : ''}

      <button class="rsm-close-btn" id="retire-close" style="width:100%">Entendido ✓</button>
    </div>`;

    document.body.appendChild(overlay);
    document.getElementById('retire-close')?.addEventListener('click', () => overlay.remove());
    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
  };

  // Modal de bloqueio de partida
  UI.prototype._showSquadBlockModal = function(errors) {
    const existing = document.getElementById('squad-block-overlay');
    if (existing) existing.remove();
    const overlay = document.createElement('div');
    overlay.id = 'squad-block-overlay';
    overlay.className = 'round-summary-overlay';
    overlay.style.cssText = 'z-index:9500';
    overlay.innerHTML = `
    <div class="round-summary-modal" style="max-width:420px;border-color:rgba(231,76,60,.35)">
      <div style="text-align:center;margin-bottom:16px">
        <div style="font-size:3rem;margin-bottom:8px">🚫</div>
        <div style="font-family:'Barlow Condensed',sans-serif;font-size:1.3rem;font-weight:900;color:#e74c3c">Partida Bloqueada</div>
        <div style="font-size:12px;color:#8aa8c0;margin-top:4px">Corrija sua escalação antes de jogar</div>
      </div>
      <div style="background:rgba(231,76,60,.08);border:1px solid rgba(231,76,60,.2);border-radius:8px;padding:12px;margin-bottom:16px">
        ${errors.map(e => `<div style="font-size:12px;color:#e4edf6;padding:4px 0;border-bottom:1px solid rgba(255,255,255,.05)">${e}</div>`).join('')}
      </div>
      <div style="display:flex;gap:8px">
        <button class="rsm-close-btn" id="sb-tactics" style="background:rgba(74,144,226,.2);border-color:rgba(74,144,226,.4);color:#4a90e2;flex:1">⚙️ Ir para Táticas</button>
        <button class="rsm-close-btn" id="sb-close" style="flex:1">Fechar</button>
      </div>
    </div>`;
    document.body.appendChild(overlay);
    document.getElementById('sb-close')?.addEventListener('click', () => overlay.remove());
    document.getElementById('sb-tactics')?.addEventListener('click', () => { overlay.remove(); this.render('tactics'); });
    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
  };

  // Patch renderSquad — mostra badges de lesão/suspensão
  const _renderSquad = UI.prototype.renderSquad;
  UI.prototype.renderSquad = function() {
    const orig = _renderSquad.call(this);
    return orig; // Conteúdo já usa p.injured via badge — vamos enriquecer renderPlayerDetail
  };

  // Patch renderPlayerDetail — mostra status completo
  const _renderPlayerDetail = UI.prototype.renderPlayerDetail;
  UI.prototype.renderPlayerDetail = function(p) {
    const base = _renderPlayerDetail.call(this, p);
    // Injeta info de suspensão/lesão no detalhe
    const statusHtml = this._buildPlayerStatusHtml(p);
    if (!statusHtml) return base;
    return base.replace('<div class="pd-morale">', `<div class="pd-status-block" style="padding:8px 12px;background:rgba(231,76,60,.08);border-radius:8px;margin-bottom:8px">${statusHtml}</div><div class="pd-morale">`);
  };

  UI.prototype._buildPlayerStatusHtml = function(p) {
    const parts = [];
    if (CareerInjuries.isInjured(p)) {
      const sev = p.injurySeverity || 'leve';
      const color = sev === 'grave' ? '#e74c3c' : sev === 'média' ? '#e67e22' : '#f0c84a';
      parts.push(`<div style="display:flex;align-items:center;gap:6px"><span style="background:${color};color:#fff;font-size:10px;font-weight:800;padding:2px 7px;border-radius:4px">🤕 LESIONADO</span><span style="font-size:11px;color:#8aa8c0">${p.injuryType || 'Lesão'} · ${Math.ceil(p.injuryGames||0)} jogo(s) restante(s)</span></div>`);
    }
    if (CareerSuspensions.isSuspended(p)) {
      parts.push(`<div style="display:flex;align-items:center;gap:6px;margin-top:4px"><span style="background:#9b59b6;color:#fff;font-size:10px;font-weight:800;padding:2px 7px;border-radius:4px">🚫 SUSPENSO</span><span style="font-size:11px;color:#8aa8c0">${p.suspendedGames} jogo(s) de suspensão</span></div>`);
    }
    if ((p._yellowsThisCycle || 0) > 0) {
      parts.push(`<div style="display:flex;align-items:center;gap:6px;margin-top:4px"><span style="background:#f0c84a;color:#000;font-size:10px;font-weight:800;padding:2px 7px;border-radius:4px">🟨 ${p._yellowsThisCycle} AMARELO(S)</span><span style="font-size:11px;color:#8aa8c0">+1 amarelo = suspensão automática</span></div>`);
    }
    return parts.join('');
  };

  // Patch renderTactics — destaca jogadores indisponíveis
  const _renderTactics = UI.prototype.renderTactics;
  UI.prototype.renderTactics = function() {
    const orig = _renderTactics.call(this);
    return orig;
  };

  // Adicionar botão "Ver Escalação" na tabela de classificação
  const _renderLeague2 = UI.prototype.renderLeague;
  UI.prototype.renderLeague = function() {
    const orig = _renderLeague2.call(this);
    // Injeta botão "Ver Elenco" após cada time na tabela (via event delegation já existente)
    return orig;
  };

  // Patch handleAction para ação viewteam
  const _handleAction = UI.prototype.handleAction;
  UI.prototype.handleAction = function(e) {
    const el = e.currentTarget || e.target;
    const action = el.dataset.action;

    if (action === 'viewteam') {
      window.CareerTeamViewer.renderTeamSquadModal(this.gs, el.dataset.teamid);
      return;
    }
    if (action === 'viewteamfromleague') {
      window.CareerTeamViewer.renderTeamSquadModal(this.gs, el.dataset.teamid);
      return;
    }
    _handleAction.call(this, e);
  };

  // Patch renderLeague para adicionar botões "Ver Escalação"
  UI.prototype.renderLeague = function() {
    const gs = this.gs;
    const team = gs.getPlayerTeam();
    if (!team) return '<div>Sem liga</div>';
    const lid = team.league;
    const leagueSt = gs.getLeagueStandings(lid);
    const topScorers = gs.getTopScorers(lid, 10);
    const topAssists = gs.getTopAssists(lid, 10);
    const tab = this.leagueTab || 'classif';

    return `
    <div class="screen-game">
      ${this.renderNavbar(team)}
      <div class="game-content">
        <div class="screen-header-inner">
          <h2>🏆 ${gs.leagues[lid]?.name || 'Liga'}</h2>
          <p>Temporada ${gs.season} · Rodada ${gs.currentWeek}/${gs.totalWeeks}</p>
        </div>
        <div class="league-tabs" style="display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap">
          ${[['classif','📊 Classificação'],['artilharia','⚽ Artilharia'],['assistencias','🎯 Assistências'],['escalacoes','👥 Escalações']].map(([id,lbl])=>`
            <button class="btn btn-sm ${tab===id?'btn-primary':'btn-ghost'}" data-action="switchleaguetab" data-tab="${id}">${lbl}</button>`).join('')}
        </div>

        ${tab === 'classif' ? `
        <div class="dash-card">
          <div style="overflow-x:auto">
          <table class="standings-table">
            <thead><tr><th>#</th><th style="text-align:left">Time</th><th>J</th><th>V</th><th>E</th><th>D</th><th>GF</th><th>GC</th><th>GD</th><th>Pts</th><th>Ver</th></tr></thead>
            <tbody>
              ${leagueSt.map((t, i) => `
              <tr class="${t.id===gs.playerTeamId?'my-team':''} ${i<2?'zone-champions':i===leagueSt.length-1?'zone-relegation':''}">
                <td class="rank-cell">${i===0?'🥇':i===1?'🥈':i===2?'🥉':(i+1)}</td>
                <td><span style="display:inline-flex;align-items:center;gap:5px">${this.teamLogo(t.id,t.name,t.color,t.color2,16)}<span>${t.name}</span></span></td>
                <td>${t.standing.played}</td>
                <td class="col-win">${t.standing.w}</td>
                <td>${t.standing.d}</td>
                <td class="col-loss">${t.standing.l}</td>
                <td>${t.standing.gf}</td>
                <td>${t.standing.ga}</td>
                <td class="${t.standing.gd>0?'col-win':t.standing.gd<0?'col-loss':''}">${t.standing.gd>0?'+':''}${t.standing.gd}</td>
                <td class="pts-cell"><strong>${t.standing.pts}</strong></td>
                <td><button class="btn-sm btn-ghost" style="font-size:10px;padding:2px 6px" data-action="viewteam" data-teamid="${t.id}">👥</button></td>
              </tr>`).join('')}
            </tbody>
          </table>
          </div>
          <div style="font-size:10px;color:var(--text4);margin-top:8px;display:flex;align-items:center;gap:8px;flex-wrap:wrap">
            <span style="width:8px;height:8px;border-radius:2px;background:#1e5a2a;display:inline-block"></span> Top 2 → Copa do Mundo
            <span style="margin-left:8px;color:var(--text4)">· Clique 👥 para ver a escalação do time</span>
          </div>
        </div>` : ''}

        ${tab === 'artilharia' ? `
        <div class="dash-card">
          <div class="card-title">⚽ Artilharia — ${gs.leagues[lid]?.name}</div>
          <table class="players-table">
            <thead><tr><th>#</th><th colspan="2">Jogador</th><th>Time</th><th>Gols</th><th>Assist</th><th>Jogos</th></tr></thead>
            <tbody>
              ${topScorers.map((p, i) => {
                const t2 = gs.teams[p.teamId];
                return `<tr class="${p.teamId===gs.playerTeamId?'my-team':''}">
                  <td style="color:${i===0?'#f0c84a':i===1?'#9b9b9b':i===2?'#cd7f32':'var(--text3)'};font-weight:800">${i+1}</td>
                  <td style="padding:3px 2px">${window.playerPhotoHTML?window.playerPhotoHTML(p.name,24,p.position,{GL:'#e67e22',FIX:'#2980b9',ALA:'#27ae60','PÍV':'#c0392b'}[p.position]||'#555'):''}</td>
                  <td><strong>${p.name}</strong></td>
                  <td style="font-size:11px;color:var(--text3)">${t2?.name||'?'}</td>
                  <td><strong style="color:var(--gold)">${p.goals||0}</strong></td>
                  <td style="color:var(--text3)">${p.assists||0}</td>
                  <td style="color:var(--text4)">${p.appearances||0}</td>
                </tr>`;
              }).join('') || '<tr><td colspan="7" style="text-align:center;color:var(--text4);padding:20px">Nenhum gol marcado ainda</td></tr>'}
            </tbody>
          </table>
        </div>` : ''}

        ${tab === 'assistencias' ? `
        <div class="dash-card">
          <div class="card-title">🎯 Assistências — ${gs.leagues[lid]?.name}</div>
          <table class="players-table">
            <thead><tr><th>#</th><th colspan="2">Jogador</th><th>Time</th><th>Assist</th><th>Gols</th><th>Jogos</th></tr></thead>
            <tbody>
              ${topAssists.map((p, i) => {
                const t2 = gs.teams[p.teamId];
                return `<tr class="${p.teamId===gs.playerTeamId?'my-team':''}">
                  <td style="color:${i===0?'#f0c84a':i===1?'#9b9b9b':i===2?'#cd7f32':'var(--text3)'};font-weight:800">${i+1}</td>
                  <td style="padding:3px 2px">${window.playerPhotoHTML?window.playerPhotoHTML(p.name,24,p.position,{GL:'#e67e22',FIX:'#2980b9',ALA:'#27ae60','PÍV':'#c0392b'}[p.position]||'#555'):''}</td>
                  <td><strong>${p.name}</strong></td>
                  <td style="font-size:11px;color:var(--text3)">${t2?.name||'?'}</td>
                  <td><strong style="color:var(--blue)">${p.assists||0}</strong></td>
                  <td style="color:var(--text3)">${p.goals||0}</td>
                  <td style="color:var(--text4)">${p.appearances||0}</td>
                </tr>`;
              }).join('') || '<tr><td colspan="7" style="text-align:center;color:var(--text4);padding:20px">Nenhuma assistência registrada ainda</td></tr>'}
            </tbody>
          </table>
        </div>` : ''}

        ${tab === 'escalacoes' ? `
        <div class="dash-card">
          <div class="card-title">👥 Escalações dos Times — ${gs.leagues[lid]?.name}</div>
          <p style="font-size:12px;color:var(--text3);margin-bottom:14px">Veja a formação titular, banco e OVR médio de qualquer clube da liga.</p>
          <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:10px">
            ${leagueSt.map(t => {
              const tPlayers = gs.getTeamPlayers(t.id);
              const avgOvr2 = tPlayers.length ? Math.round(tPlayers.reduce((a,p)=>a+(p.overall||65),0)/tPlayers.length) : 0;
              const injured = tPlayers.filter(p => CareerInjuries.isInjured(p)).length;
              const suspended = tPlayers.filter(p => CareerSuspensions.isSuspended(p)).length;
              const ai2 = new AIManager(gs);
              const form = ai2.chooseTactics(t.id);
              return `<div style="background:var(--bg2);border:1px solid ${t.id===gs.playerTeamId?t.color:'var(--border)'};border-radius:10px;padding:12px;cursor:pointer;transition:.15s" onclick="window.CareerTeamViewer.renderTeamSquadModal(window.gameState,'${t.id}')">
                <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
                  ${this.teamLogo(t.id,t.name,t.color,t.color2,28)}
                  <div style="flex:1;min-width:0">
                    <div style="font-weight:800;font-size:13px;color:#e4edf6;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${t.name}</div>
                    <div style="font-size:10px;color:#4e6d88">${form.tipo} · ${form.style}</div>
                  </div>
                  <div style="font-family:'Barlow Condensed',sans-serif;font-size:1.3rem;font-weight:900;color:${avgOvr2>=80?'#f0c84a':avgOvr2>=70?'#28c856':'#8aa8c0'}">${avgOvr2}</div>
                </div>
                <div style="display:flex;gap:6px;font-size:10px;flex-wrap:wrap">
                  <span style="color:#4e6d88">${tPlayers.length} jogadores</span>
                  ${injured>0?`<span style="color:#e74c3c">🤕 ${injured} lesionado(s)</span>`:''}
                  ${suspended>0?`<span style="color:#9b59b6">🚫 ${suspended} suspenso(s)</span>`:''}
                </div>
                <div style="margin-top:8px;font-size:10px;color:#2980b9;text-align:right">Ver escalação →</div>
              </div>`;
            }).join('')}
          </div>
        </div>` : ''}

      </div>
    </div>`;
  };

  // Enriquecer renderSquad com status de disponibilidade
  const _renderSquad2 = UI.prototype.renderSquad;
  UI.prototype.renderSquad = function() {
    const gs = this.gs;
    const team = gs.getPlayerTeam();
    const players = gs.getPlayerPlayers().sort((a, b) => b.overall - a.overall);
    const sqIds = new Set(gs.squad);
    const posColors = { GL: '#e67e22', FIX: '#2980b9', ALA: '#27ae60', 'PÍV': '#c0392b' };
    const validation = window.CareerValidation.validateSquad(gs);

    return `
    <div class="screen-game">
      ${this.renderNavbar(team)}
      <div class="game-content">
        <div class="screen-header-inner">
          <h2>👥 Elenco — ${team?.name}</h2>
          <p>${players.length} jogadores · Titulares: ${gs.squad.filter(Boolean).length}/5</p>
          ${!validation.valid ? `<div style="background:rgba(231,76,60,.1);border:1px solid rgba(231,76,60,.3);border-radius:8px;padding:8px 12px;margin-top:8px;font-size:12px;color:#e74c3c">${validation.errors.join(' · ')}</div>` : `<div style="background:rgba(40,200,86,.07);border:1px solid rgba(40,200,86,.2);border-radius:8px;padding:6px 12px;margin-top:8px;font-size:12px;color:#28c856">✅ Escalação válida para jogar</div>`}
        </div>
        <div class="squad-layout">
          <div class="players-table-wrap">
            <table class="players-table">
              <thead>
                <tr><th>★</th><th colspan="2">Nome</th><th>Pos</th><th>Nac</th><th>Idade</th><th>OVR</th><th>POT</th><th>Valor</th><th>Salário</th><th>Status</th><th>Ação</th></tr>
              </thead>
              <tbody>
                ${players.map(p => {
                  const isTitular = sqIds.has(p.id);
                  const injured = CareerInjuries.isInjured(p);
                  const suspended = CareerSuspensions.isSuspended(p);
                  const unavailable = injured || suspended;
                  const photo = window.playerPhotoHTML ? window.playerPhotoHTML(p.name, 32, p.position, posColors[p.position]) : '';
                  return `<tr class="${isTitular?'row-titular':''} ${unavailable?'row-injured':''}" data-action="viewplayer" data-pid="${p.id}" style="cursor:pointer${unavailable?';opacity:.75':''}">
                    <td>${isTitular?'⭐':''}</td>
                    <td style="padding:4px 2px"><div class="player-photo-mini">${photo}</div></td>
                    <td><strong>${p.name}</strong>${CareerInjuries.getStatusBadge(p)}</td>
                    <td><span class="pos-badge" style="background:${posColors[p.position]||'#555'}">${p.position}</span></td>
                    <td title="${p.nationality}">${this.natFlag(p.nationality)}</td>
                    <td>${p.age}</td>
                    <td class="ovr-cell"><strong>${p.overall}</strong></td>
                    <td class="pot-cell">${p.potential}</td>
                    <td>${this.fmt(p.value)}</td>
                    <td class="text-muted">${this.fmt(p.salary)}/mês</td>
                    <td style="font-size:10px">
                      ${injured ? `<span style="color:#e74c3c">🤕 ${Math.ceil(p.injuryGames||0)}j</span>` :
                        suspended ? `<span style="color:#9b59b6">🚫 ${p.suspendedGames}j</span>` :
                        (p._yellowsThisCycle||0)>0 ? `<span style="color:#f0c84a">🟨 ${p._yellowsThisCycle}</span>` :
                        `<span style="color:#28c856">✅</span>`}
                    </td>
                    <td>${isTitular
                      ? `<button class="btn-sm btn-danger" data-action="removetitular" data-pid="${p.id}">−</button>`
                      : `<button class="btn-sm ${unavailable?'btn-danger':'btn-primary'}" data-action="${unavailable?'':'addtitular'}" data-pid="${p.id}" ${gs.squad.filter(Boolean).length>=5||unavailable?'disabled':''} title="${unavailable?'Jogador indisponível':''}">${unavailable?'🚫':'+ Titular'}</button>`}</td>
                  </tr>`;
                }).join('')}
              </tbody>
            </table>
          </div>
          ${this.selectedPlayer ? this.renderPlayerDetail(this.selectedPlayer) : `<div class="player-detail-placeholder"><div style="font-size:36px;margin-bottom:12px">👤</div><p>Clique em um jogador para ver detalhes</p></div>`}
        </div>
      </div>
    </div>`;
  };

  console.log('✅ careerSystems.js — UI patches aplicados');
})();

// ── CSS extra para status badges ─────────────────────────────
(function injectCSS() {
  const style = document.createElement('style');
  style.textContent = `
    .row-suspended { opacity: .72; }
    .badge-suspended {
      display: inline-block;
      background: #9b59b6;
      color: #fff;
      font-size: 9px;
      font-weight: 800;
      padding: 1px 5px;
      border-radius: 3px;
      vertical-align: middle;
      margin-left: 4px;
    }
    .badge-injured {
      display: inline-block;
      background: #e74c3c;
      color: #fff;
      font-size: 9px;
      font-weight: 800;
      padding: 1px 5px;
      border-radius: 3px;
      vertical-align: middle;
      margin-left: 4px;
    }
    .injury-leve { color: #f0c84a; }
    .injury-media { color: #e67e22; }
    .injury-grave { color: #e74c3c; }

    /* Team viewer modal */
    #team-viewer-overlay .round-summary-modal {
      border-color: rgba(74,144,226,.3);
    }
    /* Squad block modal */
    #squad-block-overlay .round-summary-modal {
      border-color: rgba(231,76,60,.35);
    }
    /* League escalacoes grid hover */
    .team-viewer-card:hover {
      border-color: rgba(74,144,226,.5) !important;
      background: rgba(74,144,226,.06) !important;
    }
  `;
  document.head.appendChild(style);
})();

console.log('✅ careerSystems.js v1.0 — Todos os 9 sistemas carregados');
