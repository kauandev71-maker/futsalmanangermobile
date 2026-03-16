// ============================================================
// FUTSAL MANAGER — GLOBAL SYSTEMS v2.0
// 1. Ranking Global de Clubes (visível sempre)
// 2. Torneio dos 16 Melhores (a cada 3 temporadas)
// 3. Dashboard: Top Transferências + Ranking
// 4. Academia de Jovens Promessas
// ============================================================

const GS_PRIZE_CHAMPION  = 150_000_000;
const GS_PRIZE_RUNNER_UP =  80_000_000;
const GS_PRIZE_SEMI      =  50_000_000;
const GS_PRIZE_QUARTER   =  25_000_000;
const GS_PRIZE_ROUND16   =   8_750_000;

// ── 1. RANKING GLOBAL ─────────────────────────────────────────
window.GlobalRanking = {
  compute(gs) {
    if (!gs?.teams) return;
    Object.values(gs.teams).forEach(t => {
      if (t.clubRankingPoints === undefined) t.clubRankingPoints = 0; // começa zerado
      if (t.clubRankingPrevPoints === undefined) t.clubRankingPrevPoints = 0;
      if (t.clubTitles === undefined) t.clubTitles = 0;
    });

    // Pontua por cada liga — Liga Portugal (lpf) NÃO participa do ranking global
    const EXCLUDED_RANK = ['lpf'];
    Object.values(gs.leagues).forEach(league => {
      if (EXCLUDED_RANK.includes(league.id)) return;
      const standings = gs.getLeagueStandings(league.id);
      standings.forEach((team, idx) => {
        const t = gs.teams[team.id];
        if (!t) return;
        t.clubRankingPrevPoints = t.clubRankingPoints || 0;
        const posPoints = [100, 70, 50, 40, 30, 20, 15, 10][idx] || 5;
        t.clubRankingPoints = (t.clubRankingPoints || 0) + posPoints;
        const s = team.standing || {};
        t.clubRankingPoints += (s.w || 0) * 3;
        t.clubRankingPoints += (s.d || 0) * 1;
        t.clubRankingPoints += Math.max(0, (s.gd || 0)) * 0.5;
        if (idx === 0) {
          t.clubTitles = (t.clubTitles || 0) + 1;
          t.clubRankingPoints += 50;
        }
        t.clubRankingPoints += (t.clubTitles || 0) * 10;
      });
    });

    // Bônus por Copa do Mundo
    (gs.worldCupHistory || []).forEach(wc => {
      const t = gs.teams[wc.champion];
      if (t) t.clubRankingPoints += 80;
    });
    // Bônus por Torneio Global
    (gs.globalTournamentHistory || []).forEach(gt => {
      const c = gs.teams[gt.champion];  if (c) c.clubRankingPoints += 60;
      const r = gs.teams[gt.runnerUp];  if (r) r.clubRankingPoints += 25;
    });

    // Atribui posições
    const eligible = Object.values(gs.teams).filter(t => t.league !== 'lpf');
    const sorted = eligible.sort((a, b) => (b.clubRankingPoints || 0) - (a.clubRankingPoints || 0));
    sorted.forEach((t, idx) => {
      t.clubRankingPrevPosition = t.clubRankingPosition || (idx + 1);
      t.clubRankingPosition = idx + 1;
    });
    // Times portugueses não participam do ranking global
    Object.values(gs.teams).filter(t => t.league === 'lpf').forEach(t => { t.clubRankingPosition = null; });

    // Notícia de mudança
    const myT = gs.teams[gs.playerTeamId];
    if (myT) {
      const diff = (myT.clubRankingPrevPosition || myT.clubRankingPosition) - myT.clubRankingPosition;
      if (diff >= 5)
        gs.news.unshift({ date:`T${gs.season}`, type:'ranking', text:`📈 ${myT.name} sobe ${diff} posições no ranking global! Agora em #${myT.clubRankingPosition}.` });
      else if (diff <= -5)
        gs.news.unshift({ date:`T${gs.season}`, type:'ranking', text:`📉 ${myT.name} cai ${Math.abs(diff)} posições no ranking. Posição: #${myT.clubRankingPosition}.` });
      if (myT.clubRankingPosition === 1)
        gs.news.unshift({ date:`T${gs.season}`, type:'ranking', text:`🔥 ${myT.name} assume o TOPO do ranking mundial!` });
    }
    const leader = sorted[0];
    if (leader)
      gs.news.unshift({ date:`T${gs.season}`, type:'ranking', text:`🌍 Ranking atualizado! Líder: ${leader.name} (${Math.round(leader.clubRankingPoints)} pts)` });
  },

  getTop(gs, n = 50) {
    return Object.values(gs.teams)
      .filter(t => t.league !== 'lpf')
      .sort((a, b) => (b.clubRankingPoints || 0) - (a.clubRankingPoints || 0))
      .slice(0, n);
  }
};

// ── 2. TORNEIO DOS 16 MELHORES — A CADA 3 TEMPORADAS ──────────
window.GlobalTournament = {
  // Dispara nas temporadas 4, 7, 10, 13... (após completar a 3ª, 6ª, 9ª...)
  // Chamado DEPOIS do season++ em startNewSeason
  shouldStart(gs) {
    return gs.season > 2 && (gs.season - 1) % 3 === 0 && !gs.globalTournament;
  },

  init(gs) {
    // Liga Portugal não participa do Torneio Global
    const top = window.GlobalRanking.getTop(gs, 24)
      .filter(t => t.id && gs.teams[t.id] && gs.teams[t.id].league !== 'lpf');
    // Garante 16 times
    let pool = top.slice(0, 16);
    if (pool.length < 8) return null;
    while (pool.length < 16) {
      const used = new Set(pool.map(t => t.id));
      const extra = Object.values(gs.teams).find(t => !used.has(t.id) && t.league !== 'lpf');
      if (!extra) break;
      pool.push(extra);
    }

    const shuffled = this._draw(gs, pool);
    const r16 = [];
    for (let i = 0; i < 16; i += 2) {
      r16.push({ id:`gt_r16_${i/2}`, home:shuffled[i].id, away:shuffled[i+1].id,
        played:false, result:null, winner:null, loser:null });
    }

    gs.globalTournament = {
      season: gs.season - 1,
      phase: 'roundOf16',
      teams: pool.map(t => t.id),
      bracket: { roundOf16:r16, quarterfinals:[], semifinals:[], final:[] },
      champion:null, runnerUp:null,
      playerQualified: pool.some(t => t.id === gs.playerTeamId),
      playerEliminated: !pool.some(t => t.id === gs.playerTeamId),
      prize:{ winner:GS_PRIZE_CHAMPION, runnerUp:GS_PRIZE_RUNNER_UP, semi:GS_PRIZE_SEMI, quarter:GS_PRIZE_QUARTER, round16:GS_PRIZE_ROUND16 }
    };

    const playerIn = gs.globalTournament.playerQualified;
    const myName = gs.teams[gs.playerTeamId]?.name || '';
    gs.news.unshift({ date:`T${gs.season}`, type:'torneio',
      text:`🏆 TORNEIO GLOBAL começa! Os 16 melhores clubes do mundo se enfrentam!` });
    if (playerIn)
      gs.news.unshift({ date:`T${gs.season}`, type:'torneio',
        text:`⭐ ${myName} está entre os 16 melhores! Prêmio máximo: R$25M!` });
    else
      gs.news.unshift({ date:`T${gs.season}`, type:'torneio',
        text:`📋 ${myName} não se classificou. Melhore no ranking para a próxima edição!` });

    return gs.globalTournament;
  },

  _draw(gs, teams) {
    // Sorteio inteligente: evita confrontos da mesma liga nas oitavas
    const byLeague = {};
    teams.forEach(t => {
      const lid = gs.teams[t.id]?.league || 'other';
      (byLeague[lid] = byLeague[lid] || []).push(t);
    });
    const groups = Object.values(byLeague).map(g => g.sort(() => Math.random() - 0.5));
    const result = [];
    groups.forEach(g => { if (result.length < 16) result.push(g.shift()); });
    groups.flat().forEach(t => { if (result.length < 16) result.push(t); });
    return result.sort(() => Math.random() - 0.5);
  },

  processMatch(gs, matchId, phase, result) {
    const gt = gs.globalTournament;
    if (!gt) return null;
    const m = (gt.bracket[phase] || []).find(x => x.id === matchId);
    if (!m || m.played) return null;
    m.played = true;
    m.result = result;
    const hw = result.score.home, aw = result.score.away;
    m.winner = hw > aw ? m.home : aw > hw ? m.away : (Math.random() < .5 ? m.home : m.away);
    m.loser  = m.winner === m.home ? m.away : m.home;
    m.penalties = hw === aw;
    // Prêmio por eliminação (cada fase tem seu valor)
    const prizes = { roundOf16: gt.prize.round16||GS_PRIZE_ROUND16, quarterfinals:gt.prize.quarter, semifinals:gt.prize.semi };
    const loserPrize = prizes[phase] || 0;
    if (loserPrize > 0) {
      const lt = gs.teams[m.loser];
      if (lt) lt.budget = (lt.budget || 0) + loserPrize;
      if (m.loser === gs.playerTeamId) {
        gs.budget += loserPrize;
        if (gs.teams[gs.playerTeamId]) gs.teams[gs.playerTeamId].budget = gs.budget;
        gs.news.unshift({ date:`T${gt.season}`, type:'torneio',
          text:`💰 Torneio Global: ${gs.fmt(loserPrize)} de premiação pela participação!` });
      }
    }
    if (gt.playerQualified && !gt.playerEliminated &&
        (m.home === gs.playerTeamId || m.away === gs.playerTeamId) && m.loser === gs.playerTeamId)
      gt.playerEliminated = true;
    return m;
  },

  advancePhase(gs) {
    const gt = gs.globalTournament;
    if (!gt) return false;
    const matches = gt.bracket[gt.phase];
    if (!matches || !matches.every(m => m.played)) return false;
    const winners = matches.map(m => m.winner).filter(Boolean);
    const next = { roundOf16:'quarterfinals', quarterfinals:'semifinals', semifinals:'final' }[gt.phase];
    if (next) {
      const nm = [];
      for (let i = 0; i < winners.length; i += 2)
        nm.push({ id:`gt_${next}_${i/2}`, home:winners[i], away:winners[i+1]||winners[0],
          played:false, result:null, winner:null, loser:null });
      gt.bracket[next] = nm;
      gt.phase = next;
      return true;
    }
    if (gt.phase === 'final') {
      const fm = matches[0];
      gt.champion = fm.winner; gt.runnerUp = fm.loser; gt.phase = 'done';
      const ct = gs.teams[gt.champion]; const rt = gs.teams[gt.runnerUp];
      if (ct) { ct.budget = (ct.budget||0)+gt.prize.winner; if(gt.champion===gs.playerTeamId) gs.budget=ct.budget; ct.clubTitles=(ct.clubTitles||0)+1; }
      if (rt) { rt.budget = (rt.budget||0)+gt.prize.runnerUp; if(gt.runnerUp===gs.playerTeamId) gs.budget=rt.budget; }
      const cn = ct?.name||'?';
      gs.news.unshift({ date:`T${gt.season}`, type:'torneio', text:`🏆 ${cn} é CAMPEÃO DO TORNEIO GLOBAL!` });
      if (gt.champion === gs.playerTeamId)
        gs.news.unshift({ date:`T${gt.season}`, type:'torneio', text:`🥇🎉 SEU TIME É CAMPEÃO GLOBAL! +${gs.fmt(gt.prize.winner)}!` });
      if (!gs.globalTournamentHistory) gs.globalTournamentHistory = [];
      gs.globalTournamentHistory.push({ season:gt.season, champion:gt.champion, runnerUp:gt.runnerUp, championName:cn, playerWon:gt.champion===gs.playerTeamId });
      return true;
    }
    return false;
  },

  simPhase(gs) {
    const gt = gs.globalTournament;
    if (!gt) return;
    const ai = new AIManager(gs);
    (gt.bracket[gt.phase] || []).filter(m => !m.played).forEach(m => {
      if (m.home === gs.playerTeamId || m.away === gs.playerTeamId) return;
      const ht = gs.teams[m.home], at = gs.teams[m.away];
      if (!ht || !at) return;
      const engine = new MatchEngine(ht, at, ai.pickSquad(m.home), ai.pickSquad(m.away),
        ai.chooseTactics(m.home), ai.chooseTactics(m.away));
      this.processMatch(gs, m.id, gt.phase, engine.simulate());
    });
  }
};

// ── 3. RASTREADOR DE TRANSFERÊNCIAS ───────────────────────────
window.TransferTracker = {
  record(gs, playerId, fromTeamId, toTeamId, price) {
    if (!gs.topTransfers) gs.topTransfers = [];
    const p = gs.players[playerId];
    if (!p) return;
    const entry = {
      id:`tr_${Date.now()}_${Math.random().toString(36).substr(2,4)}`,
      playerName:p.name, playerId, fromTeamId, toTeamId,
      fromTeamName:gs.teams[fromTeamId]?.name||'Livre',
      toTeamName:gs.teams[toTeamId]?.name||'?',
      price, season:gs.season, week:gs.currentWeek,
      position:p.position, overall:p.overall
    };
    gs.topTransfers.unshift(entry);
    gs.topTransfers = gs.topTransfers.sort((a,b)=>b.price-a.price).slice(0,50);
    if (price >= 5_000_000) {
      const isRecord = gs.topTransfers[0]?.id === entry.id && gs.topTransfers.length > 1;
      gs.news.unshift({ date:`Rod. ${gs.currentWeek}`, type:'transferencia',
        text: isRecord
          ? `💣 RECORDE! ${p.name} por ${gs.fmt(price)} — ${entry.fromTeamName} → ${entry.toTeamName}`
          : `💰 ${p.name} (${p.overall} OVR) vai para ${entry.toTeamName} por ${gs.fmt(price)}!` });
    }
  },
  getRecent(gs, n=8) {
    return [...(gs.topTransfers||[])].sort((a,b)=>b.season!==a.season?b.season-a.season:b.week-a.week).slice(0,n);
  }
};

// ── 4. ACADEMIA DE JOVENS PROMESSAS ───────────────────────────
window.YouthAcademy = {
  _retiredThisSeason: [],

  // Custo de scouting por nível do olheiro (pago toda vez que faz novo scouting)
  SCOUT_COST: [0, 250_000, 180_000, 120_000, 80_000, 0], // nível 0=sem olheiro (caro), 1-4 pago, 5=grátis

  getScoutLevel(gs) {
    const olh = gs.coachingStaff?.olheiro;
    return olh ? (olh.level || 1) : 0;
  },

  getScoutCost(gs) {
    const lv = this.getScoutLevel(gs);
    // Sem olheiro: R$500k por scouting · Nível 1: R$250k · Nível 5: grátis
    const costs = [500_000, 250_000, 180_000, 120_000, 80_000, 0];
    return costs[lv] || 500_000;
  },

  generateProspects(gs, paid = false) {
    const scoutLv = this.getScoutLevel(gs);
    const cost    = this.getScoutCost(gs);

    // Cobrar pelo scouting manual (geração automática no início da temporada é grátis)
    if (paid) {
      if (gs.budget < cost) return { ok: false, msg: `Scouting custa ${gs.fmt?.(cost)||cost}. Orçamento insuficiente.` };
      gs.budget -= cost;
      const team = gs.teams[gs.playerTeamId];
      if (team) team.budget = gs.budget;
      gs.news.unshift({ date:`Rod. ${gs.currentWeek}`, type:'geral', text:`🔭 Scouting realizado · Custo: ${gs.fmt?.(cost)||cost}` });
    }

    const rep     = gs.teams[gs.playerTeamId]?.reputation || 75;
    const ovrBase = Math.round(52 + (rep - 60) * 0.3); // base mais baixa
    const positions = ['GL','FIX','ALA','PÍV','FIX','ALA','ALA','PÍV'];
    const fn = ['João','Pedro','Lucas','Gabriel','Matheus','Felipe','Bruno','André','Rafael','Carlos','Thiago','Eduardo','Victor','Diego','Gustavo','Kauan','Renan','Luís','Vitor','Rodrigo'];
    const ln = ['Silva','Santos','Oliveira','Costa','Souza','Lima','Ferreira','Alves','Pereira','Rocha','Gomes','Carvalho','Mendes','Barros','Ribeiro','Araújo','Nunes','Martins','Castro','Moreira'];

    // Número de prospects: mais com olheiro melhor (3 sem olheiro, até 5 com lv5)
    const numProspects = Math.min(5, 3 + Math.floor(scoutLv / 2));

    // Raridade afetada MUITO pelo nível do olheiro
    // Sem olheiro: chances péssimas. Nível 5: pode achar fenômenos
    const rarityTable = [
      // [minPot, maxPot, chance sem olheiro, chance lv1, lv2, lv3, lv4, lv5]
      { rarity:'🌱 Jovem',          minP:52, maxP:63, label:'Comum',         chances:[0.78, 0.70, 0.62, 0.55, 0.48, 0.40] },
      { rarity:'🔵 Promessa',       minP:64, maxP:71, label:'Incomum',       chances:[0.18, 0.22, 0.26, 0.28, 0.28, 0.28] },
      { rarity:'⭐ Talento',        minP:72, maxP:78, label:'Raro',          chances:[0.035,0.065,0.09, 0.12, 0.15, 0.18] },
      { rarity:'🌟 Grande Talento', minP:79, maxP:84, label:'Épico',         chances:[0.004,0.012,0.022,0.04, 0.06, 0.09] },
      { rarity:'💎 FENÔMENO',       minP:85, maxP:91, label:'Lendário',      chances:[0.001,0.003,0.008,0.01, 0.02, 0.04] },
    ];

    gs.youthProspects = [];
    for (let i = 0; i < numProspects; i++) {
      // Sortear raridade com base no nível do olheiro
      const roll = Math.random();
      let cum = 0;
      let chosen = rarityTable[0];
      for (const rt of rarityTable) {
        cum += rt.chances[Math.min(scoutLv, 5)];
        if (roll < cum) { chosen = rt; break; }
      }

      const pos  = positions[Math.floor(Math.random() * positions.length)];
      const age  = 15 + Math.floor(Math.random() * 6); // 15-20
      const pot  = chosen.minP + Math.floor(Math.random() * (chosen.maxP - chosen.minP + 1));
      const ovr  = Math.max(48, pot - 10 - Math.floor(Math.random() * 12)); // OVR bem abaixo do POT
      const name = fn[Math.floor(Math.random() * fn.length)] + ' ' + ln[Math.floor(Math.random() * ln.length)];

      // Custo proporcional ao potencial — fenômenos custam muito mais
      const costMult = pot >= 85 ? 25 : pot >= 79 ? 15 : pot >= 72 ? 8 : pot >= 64 ? 4 : 2;
      const cost2    = Math.round((pot - 55) * costMult * 1000 * (0.85 + Math.random() * 0.3) / 50000) * 50000;
      const sal      = Math.round(((ovr - 48) * 350 + Math.random() * 2000) / 100) * 100;

      gs.youthProspects.push({
        id: 'youth_' + Math.random().toString(36).substr(2, 9),
        name, age, position: pos, overall: ovr, potential: pot,
        cost: Math.max(50_000, cost2),
        salary: Math.max(3_000, sal),
        nationality: 'Brasil',
        rarity: chosen.rarity,
        rarityLabel: chosen.label,
        description: pot>=85?'💎 FENÔMENO — talento de geração, futuro astro mundial'
          : pot>=79?'🌟 Grande Talento — potencial top europeu'
          : pot>=72?'⭐ Talento real — pode chegar ao nível elite'
          : pot>=64?'🔵 Promessa — bom potencial para crescer'
          : '🌱 Jovem em formação — desenvolvimento incerto',
        attrs: window.generateAttributes ? window.generateAttributes(ovr, pos) : {},
        scoutLevel: scoutLv, // nível do olheiro que encontrou este jogador
      });
    }
    return { ok: true, prospects: gs.youthProspects };
  },

  signProspect(gs, id) {
    if (!gs.youthProspects) return {ok:false, msg:'Academia vazia'};
    const p = gs.youthProspects.find(y => y.id === id);
    if (!p) return {ok:false, msg:'Talento não encontrado'};
    if (gs.budget < p.cost) return {ok:false, msg:`Precisa de ${gs.fmt(p.cost)}`};
    const np = {
      id:p.id, teamId:gs.playerTeamId, name:p.name, nationality:p.nationality,
      age:p.age, position:p.position, overall:p.overall, potential:p.potential,
      value:Math.round(p.cost*.8), salary:p.salary, attrs:p.attrs,
      morale:85, fitness:95, injured:false, injuryDays:0, injuryGames:0,
      goals:0, assists:0, yellowCards:0, redCards:0, appearances:0,
      contractYears:3, onTransferList:false, retired:false,
      form:[7,7,7,7,7], _yellowsThisCycle:0, suspendedGames:0
    };
    gs.players[p.id] = np;
    const team = gs.teams[gs.playerTeamId];
    if (team) team.players.push(p.id);
    gs.budget -= p.cost;
    if (team) team.budget = gs.budget;
    gs.youthProspects = gs.youthProspects.filter(y => y.id !== id);
    gs.news.unshift({ date:`Rod. ${gs.currentWeek}`, type:'transferencia',
      text:`🌱 ${p.name} (${p.age}a, ${p.position}, POT ${p.potential}) contratado da academia!` });
    return {ok:true, msg:`${p.name} contratado! Potencial ${p.potential} OVR.`};
  }
};

// ── PATCHES GAMESTATE ─────────────────────────────────────────
(function patchGameState() {

  // init
  const _init = GameState.prototype.init;
  GameState.prototype.init = function(dbData, pid) {
    _init.call(this, dbData, pid);
    if (!this.topTransfers) this.topTransfers = [];
    if (!this.globalTournamentHistory) this.globalTournamentHistory = [];
    if (!this.globalTournament) this.globalTournament = null;
    if (!this.youthProspects) window.YouthAcademy.generateProspects(this);
    Object.values(this.teams).forEach(t => {
      if (t.clubRankingPoints === undefined) t.clubRankingPoints = 0; // começa zerado
      if (t.clubTitles === undefined) t.clubTitles = 0;
    });
    // Compute initial ranking so it shows from game start
    window.GlobalRanking.compute(this);
  };

  // load — sempre recomputa ranking para saves antigos
  const _load = GameState.prototype.load;
  GameState.prototype.load = function() {
    const ok = _load.call(this);
    if (ok) {
      if (!this.topTransfers) this.topTransfers = [];
      if (!this.globalTournamentHistory) this.globalTournamentHistory = [];
      if (!this.globalTournament) this.globalTournament = null;
      if (!this.youthProspects) window.YouthAcademy.generateProspects(this);
      let needsRanking = false;
      Object.values(this.teams||{}).forEach(t => {
        if (t.clubRankingPoints === undefined) { t.clubRankingPoints = Math.round((t.reputation||50)*1.2); needsRanking = true; }
        if (t.clubTitles === undefined) t.clubTitles = 0;
        if (t.clubRankingPosition === undefined) needsRanking = true;
      });
      // Sempre recomputa — garante que saves de qualquer versão mostram ranking
      try { window.GlobalRanking.compute(this); } catch(e) {}
      // Corrige aposentados com OVR alto
      Object.values(this.players||{}).forEach(p => {
        if (p.retired && p.overall > 10) { p.overall=10; p.potential=10; p.value=0; p.salary=0; p.onTransferList=false; }
      });
    }
    return ok;
  };

  // save
  const _save = GameState.prototype.save;
  GameState.prototype.save = function() {
    if (!this.topTransfers) this.topTransfers = [];
    if (!this.globalTournamentHistory) this.globalTournamentHistory = [];
    if (!this.youthProspects) this.youthProspects = [];
    return _save.call(this);
  };

  // executeTransfer — registra no TransferTracker
  const _exec = GameState.prototype.executeTransfer;
  GameState.prototype.executeTransfer = function(playerId, toTeamId, price) {
    const p = this.players[playerId];
    const from = p?.teamId || null;
    const ok = _exec.call(this, playerId, toTeamId, price);
    if (ok && price > 0) window.TransferTracker.record(this, playerId, from, toTeamId, price);
    return ok;
  };

  // startNewSeason — ranking + torneio (APÓS season++)
  const _sns = GameState.prototype.startNewSeason;
  GameState.prototype.startNewSeason = function() {
    // Ranking antes do reset de standings
    window.GlobalRanking.compute(this);
    // Limpa torneio finalizado
    if (this.globalTournament?.phase === 'done') this.globalTournament = null;
    // Chama original (incrementa season, reseta standings)
    const result = _sns.call(this);
    // Verifica torneio DEPOIS do season++ (a cada 3 temporadas)
    if (window.GlobalTournament.shouldStart(this)) {
      window.GlobalTournament.init(this);
      // Notificação popup igual à da Copa do Mundo
      const myInGT = this.globalTournament?.playerQualified;
      const myName = this.teams[this.playerTeamId]?.name || '';
      setTimeout(() => {
        const n = document.createElement('div');
        n.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,.75);z-index:9999;display:flex;align-items:center;justify-content:center;';
        n.innerHTML = `<div style="background:linear-gradient(135deg,#06080f,#0d0a1f);border:2px solid rgba(124,58,237,.5);border-radius:20px;padding:28px 32px;max-width:400px;text-align:center;box-shadow:0 0 60px rgba(124,58,237,.3)">
          <svg viewBox="0 0 72 80" width="56" height="62" style="margin:0 auto 12px;display:block" xmlns="http://www.w3.org/2000/svg">
            <path d="M22 10 L50 10 L47 35 Q36 46 25 35 Z" fill="#7c3aed" opacity=".9"/>
            <path d="M22 10 Q10 10 10 22 Q10 32 24 36 L25 35 Q13 31 13 22 L22 22 Z" fill="#a855f7"/>
            <path d="M50 10 Q62 10 62 22 Q62 32 48 36 L47 35 Q59 31 59 22 L50 22 Z" fill="#a855f7"/>
            <rect x="33" y="46" width="6" height="10" rx="1.5" fill="#9333ea"/>
            <rect x="28" y="56" width="16" height="4" rx="2" fill="#a855f7"/>
            <rect x="25" y="60" width="22" height="5" rx="2.5" fill="#7c3aed"/>
            <text x="36" y="76" text-anchor="middle" font-size="8" fill="#c084fc" font-family="Arial">★★★</text>
          </svg>
          <div style="font-family:'Barlow Condensed',sans-serif;font-size:.65rem;font-weight:700;color:rgba(192,132,252,.5);letter-spacing:.2em;text-transform:uppercase;margin-bottom:4px">Começou!</div>
          <div style="font-family:'Barlow Condensed',sans-serif;font-size:1.8rem;font-weight:900;color:#c084fc;line-height:1;margin-bottom:6px">TORNEIO GLOBAL</div>
          <div style="font-size:13px;color:rgba(167,139,250,.7);margin-bottom:14px">${myInGT ? `<span style="color:#28c856">✓ ${myName} está entre os 16 melhores!</span><br><span style="font-size:11px;color:rgba(192,132,252,.5)">Prêmio campeão: R$150M</span>` : `<span style="color:rgba(255,255,255,.5)">Top 16 clubes do mundo se enfrentam</span><br><span style="font-size:11px;color:rgba(192,132,252,.5)">Campeão leva R$150M</span>`}</div>
          <div style="display:flex;gap:8px;justify-content:center">
            ${myInGT ? `<button onclick="document.body.removeChild(this.closest('[style*=position]'));if(window.ui)window.ui.render('gtournament')" style="padding:10px 20px;background:linear-gradient(135deg,#7c3aed,#a855f7);border:none;border-radius:8px;color:#fff;font-family:'Barlow Condensed',sans-serif;font-weight:900;font-size:14px;cursor:pointer">Ver Torneio →</button>` : ''}
            <button onclick="document.body.removeChild(this.closest('[style*=position]'))" style="padding:10px 20px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.1);border-radius:8px;color:rgba(255,255,255,.6);font-family:'Barlow Condensed',sans-serif;font-weight:700;font-size:13px;cursor:pointer">${myInGT ? 'Depois' : 'OK, entendi'}</button>
          </div>
        </div>`;
        document.body.appendChild(n);
      }, 800);
    }
    // Novos prospects da academia
    window.YouthAcademy.generateProspects(this);
    return result;
  };

  console.log('✅ globalSystems.js — GameState patches OK');
})();

// ── PATCHES UI ────────────────────────────────────────────────
(function patchUI() {

  // Extend render() para ranking, gtournament, academy
  const _render = UI.prototype.render;
  UI.prototype.render = function(screen) {
    const extra = { ranking:()=>this.renderRanking(), gtournament:()=>this.renderGlobalTournament(), academy:()=>this.renderAcademy() };
    if (extra[screen]) {
      this.currentScreen = screen;
      const app = document.getElementById('app');
      if (!app) return;
      app.style.opacity = '0'; app.style.transform = 'translateY(4px)';
      setTimeout(() => {
        app.innerHTML = extra[screen]();
        this.attachEvents();
        requestAnimationFrame(() => { app.style.transition='opacity .18s ease,transform .18s ease'; app.style.opacity='1'; app.style.transform='translateY(0)'; });
      }, 60);
      return;
    }
    _render.call(this, screen);
  };

  // handleAction — ranking, gtournament, academy, tournament match actions
  const _handle = UI.prototype.handleAction;
  UI.prototype.handleAction = function(e) {
    const el = e.currentTarget || e.target;
    const action = el.dataset.action;
    switch(action) {
      case 'ranking':      if(window.audio)window.audio.navigate(); this.render('ranking'); return;
      case 'gtournament':  if(window.audio)window.audio.navigate(); this.render('gtournament'); return;
      case 'academy':      if(window.audio)window.audio.navigate(); this.render('academy'); return;
      case 'sign-prospect': {
        const res = window.YouthAcademy.signProspect(this.gs, el.dataset.pid);
        if(res.ok){this.showToast(res.msg,'success');if(window.SFX)window.SFX.transfer();}
        else this.showToast(res.msg,'error');
        this.render('academy'); return;
      }
      case 'refresh-academy': {
        const scoutResult = window.YouthAcademy.generateProspects(this.gs, true);
        if (scoutResult && !scoutResult.ok) {
          this.showToast(scoutResult.msg || 'Scouting falhou.', 'error'); return;
        }
        const cost2 = window.YouthAcademy.getScoutCost(this.gs);
        this.showToast(`🔭 Novo scouting realizado! ${cost2>0?'Custo: '+this.fmt(cost2):'Grátis (Olheiro Nv.5)'}`, 'info');
        this.render('academy'); return;
      }
      case 'gt-play':   this._gtPlayMatch(el.dataset.matchId, el.dataset.phase); return;
      case 'gt-sim':    this._gtSimMatch(el.dataset.matchId, el.dataset.phase); return;
      case 'gt-sim-all': window.GlobalTournament.simPhase(this.gs); this.render('gtournament'); return;
      case 'gt-advance': {
        const ok = window.GlobalTournament.advancePhase(this.gs);
        if(ok && this.gs.globalTournament?.phase==='done'){
          window.SFX?.win();
          const ch = this.gs.teams[this.gs.globalTournament.champion];
          this.showToast(this.gs.globalTournament.champion===this.gs.playerTeamId?'🏆🌍 CAMPEÃO GLOBAL!':`🏆 ${ch?.name} é Campeão Global!`,'success');
        }
        this.render('gtournament'); return;
      }
    }
    _handle.call(this, e);
  };

  // renderNavbar — versão definitiva com Ranking e Academia
  UI.prototype.renderNavbar = function(team) {
    const gs = this.gs;
    const t = team || {};
    const nav = [
      {id:'dashboard', icon:'🏠', label:'Home'},
      {id:'squad',     icon:'👥', label:'Elenco'},
      {id:'tactics',   icon:'⚙️', label:'Táticas'},
      {id:'transfers', icon:'🔄', label:'Mercado'},
      {id:'academy',   icon:'🌱', label:'Academia'},
      {id:'league',    icon:'🏆', label:'Liga'},
      {id:'ranking',   icon:'🌍', label:'Ranking'},
      {id:'staff',     icon:'👔', label:'Staff'},
      {id:'training',  icon:'🏋️',label:'Treino'},
      {id:'finances',  icon:'💰', label:'Finanças'},
      {id:'calendar',  icon:'📅', label:'Calendário'},
      {id:'trophy',    icon:'🥇', label:'Troféus'},
    ];
    const myTeam = gs.teams[gs.playerTeamId];
    const rankPos = myTeam?.clubRankingPosition;
    const nextT = gs.season + (3 - ((gs.season - 1) % 3)) % 3;
    return `
    <nav class="game-navbar">
      <div class="nav-brand">
        <div class="nav-badge" style="background:${t.color||'#333'};color:${t.color2||'#fff'}">${this.teamLogo(t.id,t.name,t.color,t.color2,28)}</div>
        <span class="nav-brand-name">${t.name||'FM'}</span>
      </div>
      <div class="nav-links">
        ${nav.map(n=>`<button class="nav-btn ${this.currentScreen===n.id?'active':''}" data-action="${n.id}">
          <span class="nav-icon">${n.icon}</span><span>${n.label}</span>
        </button>`).join('')}
      </div>
      <div class="nav-right">
        <span class="nav-week nav-hide-sm">Sem. ${gs.currentWeek}</span>
        <span class="nav-budget">${this.fmt(gs.budget)}</span>
        ${rankPos?`<span class="nav-rank-badge nav-hide-md" data-action="ranking" title="Ranking Global">🌍 #${rankPos}</span>`:''}
        ${gs.worldCup&&gs.worldCup.phase!=='done'?`<button class="nav-btn nav-hot ${this.currentScreen==='worldcup'?'active':''}" data-action="worldcup" title="Copa do Mundo"><span class="nav-icon">🌍</span><span class="nav-hide-sm">Copa</span></button>`:''}
        ${gs.globalTournament&&gs.globalTournament.phase!=='done'?`<button class="nav-btn nav-hot ${this.currentScreen==='gtournament'?'active':''}" data-action="gtournament" title="Torneio Global"><span class="nav-icon">🏆</span><span class="nav-hide-sm">Global</span></button>`:''}
        <button class="nav-settings-btn" data-action="settings-ingame" title="Configurações">⚙️</button>
        <button class="btn-save nav-hide-xs" data-action="save" title="Salvar">💾</button>
      </div>
    </nav>
    <!-- BOTTOM NAV MOBILE -->
    <nav class="bottom-nav" id="bottom-nav">
      <button class="bnav-btn ${this.currentScreen==='dashboard'?'active':''}" onclick="if(window.audio)window.audio.navigate();if(window.ui)window.ui.render('dashboard')">
        <span class="bni">🏠</span><span>Home</span>
      </button>
      <button class="bnav-btn ${this.currentScreen==='squad'?'active':''}" onclick="if(window.audio)window.audio.navigate();if(window.ui)window.ui.render('squad')">
        <span class="bni">👥</span><span>Elenco</span>
      </button>
      <button class="bnav-btn ${this.currentScreen==='league'?'active':''}" onclick="if(window.audio)window.audio.navigate();if(window.ui)window.ui.render('league')">
        <span class="bni">🏆</span><span>Liga</span>
      </button>
      <button class="bnav-btn ${this.currentScreen==='transfers'?'active':''}" onclick="if(window.audio)window.audio.navigate();if(window.ui)window.ui.render('transfers')">
        <span class="bni">🔄</span><span>Mercado</span>
      </button>
      ${gs.worldCup&&gs.worldCup.phase!=='done'?`<button class="bnav-btn bnav-copa ${this.currentScreen==='worldcup'?'active':''}" onclick="if(window.ui)window.ui.render('worldcup')"><span class="bni">🌍</span><span>Copa</span></button>`:
        gs.globalTournament&&gs.globalTournament.phase!=='done'?`<button class="bnav-btn bnav-torneio ${this.currentScreen==='gtournament'?'active':''}" onclick="if(window.ui)window.ui.render('gtournament')"><span class="bni">🏆</span><span>Global</span></button>`:
        `<button class="bnav-btn ${['tactics','training','staff','finances','ranking','academy','trophy'].includes(this.currentScreen)?'active':''}" onclick="window._openMobileDrawer?.()">
          <span class="bni">☰</span><span>Mais</span>
        </button>`}
    </nav>
    <!-- DRAWER "MAIS" -->
    <div class="mobile-drawer-overlay" id="mobile-drawer-overlay" onclick="window._closeMobileDrawer?.()"></div>
    <div class="mobile-drawer" id="mobile-drawer">
      <div class="mobile-drawer-handle"></div>
      <div class="mobile-drawer-grid">
        <button class="drawer-btn ${this.currentScreen==='tactics'?'active':''}" onclick="window._closeMobileDrawer?.();if(window.ui)window.ui.render('tactics')"><span class="dbi">⚙️</span>Táticas</button>
        <button class="drawer-btn ${this.currentScreen==='training'?'active':''}" onclick="window._closeMobileDrawer?.();if(window.ui)window.ui.render('training')"><span class="dbi">🏋️</span>Treino</button>
        <button class="drawer-btn ${this.currentScreen==='staff'?'active':''}" onclick="window._closeMobileDrawer?.();if(window.ui)window.ui.render('staff')"><span class="dbi">👔</span>Staff</button>
        <button class="drawer-btn ${this.currentScreen==='finances'?'active':''}" onclick="window._closeMobileDrawer?.();if(window.ui)window.ui.render('finances')"><span class="dbi">💰</span>Finanças</button>
        <button class="drawer-btn ${this.currentScreen==='ranking'?'active':''}" onclick="window._closeMobileDrawer?.();if(window.ui)window.ui.render('ranking')"><span class="dbi">🌍</span>Ranking</button>
        <button class="drawer-btn ${this.currentScreen==='academy'?'active':''}" onclick="window._closeMobileDrawer?.();if(window.ui)window.ui.render('academy')"><span class="dbi">🌱</span>Academia</button>
        <button class="drawer-btn ${this.currentScreen==='trophy'?'active':''}" onclick="window._closeMobileDrawer?.();if(window.ui)window.ui.render('trophy')"><span class="dbi">🥇</span>Troféus</button>
        <button class="drawer-btn" onclick="window._closeMobileDrawer?.();if(window.ui)window.ui.render('settings')"><span class="dbi">⚙️</span>Config.</button>
      </div>
      <div style="margin-top:10px;padding:8px 4px;display:flex;gap:8px">
        <button class="drawer-btn" style="flex:1" onclick="window._closeMobileDrawer?.();if(window.ui)window.ui._showPatchNotes?.()"><span class="dbi">📋</span>Patch Notes</button>
        <button class="drawer-btn" style="flex:1" onclick="window._closeMobileDrawer?.();if(window.gameState)window.gameState.save();if(window.ui)window.ui.showToast?.('💾 Salvo!','success')"><span class="dbi">💾</span>Salvar</button>
      </div>
    </div>`;
  };

  // renderDashboard — ranking + transferências + torneio widget
  const _renderDashboard = UI.prototype.renderDashboard;
  UI.prototype.renderDashboard = function() {
    const gs = this.gs;
    const team = gs.getPlayerTeam();
    if (!team) return '<p style="padding:40px;color:#888">Erro: time não encontrado</p>';
    const players    = gs.getPlayerPlayers();
    const avgOvr     = players.length ? Math.round(players.reduce((a,p)=>a+p.overall,0)/players.length) : 0;
    const standing   = team.standing;
    const leagueSt   = gs.getLeagueStandings(team.league);
    const myPos      = leagueSt.findIndex(t=>t.id===gs.playerTeamId)+1;
    const morale     = players.length ? Math.round(players.reduce((a,p)=>a+(p.morale||75),0)/players.length) : 75;
    const fitness    = players.length ? Math.round(players.reduce((a,p)=>a+(p.fitness||85),0)/players.length) : 85;
    const recentNews = gs.news.slice(0,5);
    const roundMatches = this._getCurrentRoundMatches();
    const playerMatch  = roundMatches.find(m=>m.home===gs.playerTeamId||m.away===gs.playerTeamId);
    const recentTR  = window.TransferTracker.getRecent(gs, 5);
    const rankTop5  = window.GlobalRanking.getTop(gs, 5);
    const myTeam    = gs.teams[gs.playerTeamId];
    const myRankPos = myTeam?.clubRankingPosition;
    const nextT     = gs.season + (3 - ((gs.season-1) % 3)) % 3;

    const newsIcons = {transferencia:'🔄',resultado:'⚽',artilharia:'👟',posicao:'📊',alerta:'⚠️',proposta:'🔔',staff:'👔',geral:'📰',torneio:'🏆',ranking:'🌍',patrocinio:'🤝',lesao:'🤕',suspensao:'🚫',aposentadoria:'🎖️'};
    const newsClrs  = {transferencia:'var(--blue)',resultado:'var(--green)',artilharia:'var(--gold)',posicao:'var(--blue)',alerta:'var(--red)',proposta:'var(--gold)',ranking:'#f0c84a',torneio:'#f0c84a',patrocinio:'#28c856'};

    return `
    <div class="screen-game">
      ${this.renderNavbar(team)}
      <div class="game-content">
        <div class="dashboard-grid">

          <!-- Clube -->
          <div class="dash-card club-card">
            <div class="club-header" style="--team-color:${team.color}">
              <div class="club-badge-lg" style="background:${team.color};color:${team.color2}">${this.teamLogo(team.id,team.name,team.color,team.color2,58)}</div>
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
              ${myRankPos?`<div class="cstat"><span class="cstat-val" style="color:#f0c84a">#${myRankPos}</span><span class="cstat-lab">Ranking Global</span></div>`:''}
            </div>
            <div class="club-bars">
              <div class="bar-row"><span>Moral</span><div class="bar"><div class="bar-fill" style="width:${morale}%;background:${morale>70?'var(--green)':'var(--orange)'}"></div></div><span>${morale}</span></div>
              <div class="bar-row"><span>Físico</span><div class="bar"><div class="bar-fill" style="width:${fitness}%;background:${fitness>75?'var(--blue)':'var(--orange)'}"></div></div><span>${fitness}</span></div>
            </div>
            <div class="form-row">Forma: ${(team.form||[]).slice(0,5).map(f=>`<span class="form-badge form-${f.toLowerCase()}">${f}</span>`).join('')||'<span class="form-badge form-d">-</span>'}</div>
          </div>

          <!-- Rodada -->
          <div class="dash-card">${this._renderRoundBox(roundMatches,playerMatch)}</div>

          <!-- Notícias -->
          <div class="dash-card">
            <div class="card-title">📰 Notícias</div>
            <div class="news-list">
              ${recentNews.map(n=>`<div class="news-item" style="border-left-color:${newsClrs[n.type]||'var(--border)'}">
                <div class="news-header"><span class="news-icon">${newsIcons[n.type]||'📰'}</span><span class="news-date">${n.date}</span></div>
                <span class="news-text">${n.text}</span>
              </div>`).join('')}
            </div>
          </div>

          <!-- Classificação da Liga -->
          <div class="dash-card">
            <div class="card-title">🏆 ${gs.leagues[team.league]?.name||'Liga'}</div>
            <div style="overflow-x:auto">
            <table class="standings-table">
              <thead><tr><th>#</th><th style="text-align:left">Time</th><th>J</th><th>V</th><th>D</th><th>GD</th><th>Pts</th></tr></thead>
              <tbody>
                ${leagueSt.map((t,i)=>`
                <tr class="${t.id===gs.playerTeamId?'my-team':''} ${i<2?'zone-champions':i===leagueSt.length-1?'zone-relegation':''}">
                  <td class="rank-cell">${i===0?'🥇':i===1?'🥈':i===2?'🥉':(i+1)}</td>
                  <td><span style="display:inline-flex;align-items:center;gap:5px">${this.teamLogo(t.id,t.name,t.color,t.color2,18)}<span>${t.name}</span></span></td>
                  <td>${t.standing.played}</td><td class="col-win">${t.standing.w}</td>
                  <td class="col-loss">${t.standing.l}</td>
                  <td class="${t.standing.gd>0?'col-win':t.standing.gd<0?'col-loss':''}">${t.standing.gd>0?'+':''}${t.standing.gd}</td>
                  <td class="pts-cell"><strong>${t.standing.pts}</strong></td>
                </tr>`).join('')}
              </tbody>
            </table>
            </div>
            <div style="font-size:10px;color:var(--text4);margin-top:6px">
              <span style="width:8px;height:8px;border-radius:2px;background:#1e5a2a;display:inline-block;margin-right:4px"></span>Top 2 → Copa do Mundo
            </div>
          </div>

          <!-- RANKING GLOBAL TOP 5 -->
          <div class="dash-card" style="border-color:rgba(240,200,74,.22);background:linear-gradient(135deg,var(--bg2),rgba(240,200,74,.03))">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
              <div>
                <div style="font-family:'Barlow Condensed',sans-serif;font-size:.95rem;font-weight:900;color:#f0c84a;text-transform:uppercase;letter-spacing:.06em">🌍 Ranking Global</div>
                <div style="font-size:10px;color:var(--text4)">Próx. torneio: T${nextT}</div>
              </div>
              ${myRankPos?`<div style="background:rgba(240,200,74,.15);border-radius:8px;padding:4px 10px;text-align:center">
                <div style="font-family:'Barlow Condensed',sans-serif;font-size:1.4rem;font-weight:900;color:#f0c84a;line-height:1">#${myRankPos}</div>
                <div style="font-size:9px;color:rgba(240,200,74,.6)">SEU TIME</div>
              </div>`:''}
            </div>
            ${rankTop5.length===0
              ? `<div style="text-align:center;padding:14px;color:var(--text4);font-size:12px">Disponível após 1ª temporada</div>`
              : rankTop5.map((t,i)=>{
                  const isMe = t.id===gs.playerTeamId;
                  const diff = (t.clubRankingPrevPosition||i+1)-(i+1);
                  const arr = diff>0?`<span style="color:#28c856;font-size:10px;font-weight:700">▲${diff}</span>`:diff<0?`<span style="color:#e74c3c;font-size:10px;font-weight:700">▼${Math.abs(diff)}</span>`:`<span style="color:var(--text4);font-size:10px">—</span>`;
                  return `<div style="display:flex;align-items:center;gap:8px;padding:5px 0;border-bottom:1px solid rgba(255,255,255,.04);${isMe?'background:rgba(240,200,74,.07);margin:0 -4px;padding:5px 6px;border-radius:6px':''}">
                    <span style="font-size:${i<3?'1rem':'12px'};font-weight:900;color:${i===0?'#f0c84a':i===1?'#9b9b9b':i===2?'#cd7f32':'var(--text4)'};min-width:22px;text-align:center">${['🥇','🥈','🥉'][i]||i+1}</span>
                    ${this.teamLogo(t.id,t.name,t.color,t.color2,18)}
                    <span style="flex:1;font-size:12px;font-weight:${isMe?'800':'500'};color:${isMe?'var(--text)':'var(--text2)'};overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${t.name}</span>
                    ${arr}
                    <span style="font-family:'Barlow Condensed',sans-serif;font-size:12px;font-weight:700;color:var(--text3);flex-shrink:0">${Math.round(t.clubRankingPoints||0)}</span>
                  </div>`;
                }).join('')}
            <button class="btn btn-ghost btn-sm" style="width:100%;justify-content:center;margin-top:10px" data-action="ranking">Ver ranking completo →</button>
          </div>

          <!-- TOP TRANSFERÊNCIAS -->
          <div class="dash-card" style="border-color:rgba(74,144,226,.2);background:linear-gradient(135deg,var(--bg2),rgba(74,144,226,.03))">
            <div style="font-family:'Barlow Condensed',sans-serif;font-size:.95rem;font-weight:900;color:#4a90e2;text-transform:uppercase;letter-spacing:.06em;margin-bottom:10px">💸 Top Transferências</div>
            ${recentTR.length===0
              ? `<div style="text-align:center;padding:14px;color:var(--text4);font-size:12px">Nenhuma transferência registrada.</div>`
              : recentTR.map((tr,i)=>{
                  const ft=gs.teams[tr.fromTeamId], tt=gs.teams[tr.toTeamId];
                  const isMe=tr.toTeamId===gs.playerTeamId||tr.fromTeamId===gs.playerTeamId;
                  return `<div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid rgba(255,255,255,.04);${isMe?'background:rgba(74,144,226,.06);margin:0 -4px;padding:6px 4px;border-radius:6px':''}">
                    <span style="font-size:12px;font-weight:800;color:var(--text4);min-width:18px">${i+1}</span>
                    <div style="flex:1;min-width:0">
                      <div style="font-size:12px;font-weight:700;color:var(--text);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${tr.playerName}</div>
                      <div style="font-size:10px;color:var(--text4);overflow:hidden;text-overflow:ellipsis;white-space:nowrap"><span style="color:${ft?.color||'var(--text3)'}">${tr.fromTeamName}</span> → <span style="color:${tt?.color||'#28c856'}">${tr.toTeamName}</span></div>
                    </div>
                    <div style="text-align:right;flex-shrink:0">
                      <div style="font-family:'Barlow Condensed',sans-serif;font-size:13px;font-weight:900;color:${tr.price>=20000000?'#f0c84a':tr.price>=5000000?'#4a90e2':'var(--text2)'}">${this.fmt(tr.price)}</div>
                      <div style="font-size:9px;color:var(--text4)">T${tr.season}</div>
                    </div>
                  </div>`;
                }).join('')}
            <button class="btn btn-ghost btn-sm" style="width:100%;justify-content:center;margin-top:10px" data-action="transfers">Ver mercado →</button>
          </div>

          <!-- Torneio Global Widget (se ativo) -->
          ${gs.globalTournament&&gs.globalTournament.phase!=='done'?`
          <div class="dash-card" style="border-color:rgba(240,200,74,.3);background:linear-gradient(135deg,var(--bg2),rgba(240,200,74,.05))">
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">
              <span style="font-size:1.5rem">🏆</span>
              <div>
                <div style="font-family:'Barlow Condensed',sans-serif;font-size:.9rem;font-weight:900;color:#f0c84a;text-transform:uppercase">Torneio Global T${gs.globalTournament.season}</div>
                <div style="font-size:11px;color:var(--text3)">${{roundOf16:'⚡ Oitavas',quarterfinals:'🔥 Quartas',semifinals:'🔥 Semis',final:'🏆 Final'}[gs.globalTournament.phase]||''} · ${gs.globalTournament.teams.length} clubes</div>
              </div>
            </div>
            ${gs.globalTournament.playerQualified&&!gs.globalTournament.playerEliminated?`<div style="font-size:12px;color:#28c856;font-weight:700;margin-bottom:8px">✓ Seu time está no torneio!</div>`:``}
            <button class="btn btn-primary btn-sm" data-action="gtournament" style="width:100%;justify-content:center;background:linear-gradient(135deg,#c9890a,#f0c84a);color:#000;font-weight:900">Ver Torneio →</button>
          </div>`:``}

          <!-- Copa do Mundo Widget -->
          ${gs.worldCup?`
          <div class="dash-card" style="border-color:rgba(40,200,86,.2);background:linear-gradient(135deg,var(--bg2),rgba(40,200,86,.03))">
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">
              <span style="font-size:1.5rem">🌍</span>
              <div>
                <div style="font-family:'Barlow Condensed',sans-serif;font-size:.85rem;font-weight:900;color:#28c856;text-transform:uppercase">Copa do Mundo ${gs.worldCup.season}</div>
                <div style="font-size:11px;color:var(--text3)">${{quarterfinals:'Quartas',semifinals:'Semis',final:'Final',done:'Encerrada'}[gs.worldCup.phase]||''}</div>
              </div>
            </div>
            ${gs.worldCup.playerQualified&&!gs.worldCup.playerEliminated&&gs.worldCup.phase!=='done'?`<div style="font-size:12px;color:#28c856;font-weight:700;margin-bottom:8px">✓ Classificado!</div>`:`${gs.worldCup.champion===gs.playerTeamId?`<div style="font-size:12px;color:#f0c84a;font-weight:700;margin-bottom:8px">🏆 CAMPEÃO MUNDIAL!</div>`:``}`}
            <button class="btn btn-primary btn-sm" data-action="worldcup" style="width:100%;justify-content:center;background:linear-gradient(135deg,#0a6e28,#28c856);color:#fff;font-weight:900">Ver Copa →</button>
          </div>`:``}

        </div>
      </div>
    </div>`;
  };

  // ── TELA RANKING GLOBAL ──────────────────────────────────────
  UI.prototype.renderRanking = function() {
    const gs = this.gs;
    const team = gs.getPlayerTeam();
    const top50 = window.GlobalRanking.getTop(gs, 50);
    const myTeam = gs.teams[gs.playerTeamId];
    const myRankPos = myTeam?.clubRankingPosition;
    const nextT = gs.season + (3 - ((gs.season-1)%3))%3;
    return `
    <div class="screen-game">
      ${this.renderNavbar(team)}
      <div class="game-content">
        <div class="screen-header-inner">
          <h2>🌍 Ranking Global de Clubes</h2>
          <p>Baseado em vitórias, posição na liga, títulos e saldo de gols · Temporada ${gs.season}</p>
        </div>

        ${myRankPos?`
        <div style="background:linear-gradient(135deg,rgba(240,200,74,.12),rgba(40,160,255,.06));border:1px solid rgba(240,200,74,.3);border-radius:14px;padding:14px 18px;margin-bottom:16px;display:flex;align-items:center;gap:16px">
          ${this.teamLogo(myTeam.id,myTeam.name,myTeam.color,myTeam.color2,48)}
          <div style="flex:1">
            <div style="font-family:'Barlow Condensed',sans-serif;font-size:.7rem;font-weight:800;color:#f0c84a;letter-spacing:.2em;text-transform:uppercase">Seu Clube</div>
            <div style="font-family:'Barlow Condensed',sans-serif;font-size:1.1rem;font-weight:900;color:var(--text)">${myTeam.name}</div>
            <div style="font-size:11px;color:var(--text3)">${Math.round(myTeam.clubRankingPoints||0)} pts · ${myTeam.clubTitles||0} título(s) · ${gs.leagues[myTeam.league]?.name||''}</div>
          </div>
          <div style="background:rgba(240,200,74,.15);border-radius:10px;padding:8px 16px;text-align:center">
            <div style="font-family:'Barlow Condensed',sans-serif;font-size:2.2rem;font-weight:900;color:#f0c84a;line-height:1">#${myRankPos}</div>
            <div style="font-size:9px;color:rgba(240,200,74,.6);letter-spacing:.1em">MUNDIAL</div>
          </div>
        </div>`:`
        <div style="background:rgba(255,255,255,.04);border-radius:10px;padding:12px;margin-bottom:16px;color:var(--text3);font-size:12px">
          O ranking é calculado ao fim de cada temporada. Jogue sua primeira temporada completa para aparecer no ranking.
        </div>`}

        <div style="background:rgba(240,200,74,.07);border:1px solid rgba(240,200,74,.2);border-radius:10px;padding:12px 16px;margin-bottom:16px;display:flex;align-items:center;gap:12px">
          <span style="font-size:1.4rem">🏆</span>
          <div>
            <div style="font-family:'Barlow Condensed',sans-serif;font-size:.85rem;font-weight:800;color:#f0c84a">Torneio Global dos 16 Melhores</div>
            <div style="font-size:11px;color:var(--text3)">
              ${gs.globalTournament&&gs.globalTournament.phase!=='done'
                ?`🔴 Em andamento — T${gs.globalTournament.season}`
                :`Próxima edição: Temporada ${nextT} · Ocorre a cada 3 temporadas`}
            </div>
            <div style="font-size:10px;color:var(--text4)">Prêmio campeão: ${this.fmt(GS_PRIZE_CHAMPION)}</div>
          </div>
          ${gs.globalTournament&&gs.globalTournament.phase!=='done'?`<button class="btn btn-primary btn-sm" style="margin-left:auto;flex-shrink:0" data-action="gtournament">Ver →</button>`:''}
        </div>

        <div class="dash-card" style="padding:0;overflow:hidden">
          <div style="overflow-x:auto">
          <table class="standings-table" style="min-width:580px">
            <thead><tr style="background:rgba(255,255,255,.04)">
              <th style="width:40px">#</th><th style="text-align:left">Clube</th>
              <th>Liga</th><th>Títulos</th><th>Pts</th><th>Evolução</th><th>OVR</th><th></th>
            </tr></thead>
            <tbody>
              ${top50.length===0?`<tr><td colspan="8" style="text-align:center;padding:30px;color:var(--text4)">Jogue uma temporada para ver o ranking.</td></tr>`
                :top50.map((t,i)=>{
                  const isMe=t.id===gs.playerTeamId;
                  const diff=(t.clubRankingPrevPosition||i+1)-(i+1);
                  const pl=gs.getTeamPlayers(t.id).filter(p=>!p.retired);
                  const avgOvr2=pl.length?Math.round(pl.reduce((a,p)=>a+(p.overall||65),0)/pl.length):0;
                  const medal=['🥇','🥈','🥉'][i]||i+1;
                  const lname=gs.leagues[t.league]?.name||t.league||'?';
                  return `<tr class="${isMe?'my-team':''}" style="${isMe?'background:rgba(240,200,74,.06)':''}cursor:pointer" onclick="if(window.CareerTeamViewer&&window.gameState)window.CareerTeamViewer.renderTeamSquadModal(window.gameState,'${t.id}')">
                    <td class="rank-cell" style="font-size:${i<3?'1rem':'0.9rem'}">${medal}</td>
                    <td><span style="display:inline-flex;align-items:center;gap:8px">${this.teamLogo(t.id,t.name,t.color,t.color2,20)}<span style="font-weight:${isMe?800:500}">${t.name}</span>${isMe?'<span style="font-size:9px;background:rgba(240,200,74,.2);color:#f0c84a;padding:1px 5px;border-radius:3px">SEU TIME</span>':''}</span></td>
                    <td style="font-size:11px;color:var(--text3)">${lname}</td>
                    <td style="color:#f0c84a;font-weight:700">${t.clubTitles||0}</td>
                    <td class="pts-cell"><strong>${Math.round(t.clubRankingPoints||0)}</strong></td>
                    <td>${diff>0?`<span style="color:#28c856;font-size:11px;font-weight:700">▲${diff}</span>`:diff<0?`<span style="color:#e74c3c;font-size:11px;font-weight:700">▼${Math.abs(diff)}</span>`:'<span style="color:var(--text4);font-size:11px">—</span>'}</td>
                    <td style="color:${avgOvr2>=80?'#f0c84a':avgOvr2>=70?'#28c856':'var(--text3)'};font-weight:700">${avgOvr2||'—'}</td>
                    <td><button class="btn-sm btn-ghost" style="font-size:10px;padding:2px 5px" onclick="event.stopPropagation();if(window.CareerTeamViewer&&window.gameState)window.CareerTeamViewer.renderTeamSquadModal(window.gameState,'${t.id}')">👥</button></td>
                  </tr>`;
                }).join('')}
            </tbody>
          </table>
          </div>
        </div>

        ${(gs.globalTournamentHistory||[]).length>0?`
        <div class="dash-card" style="margin-top:16px">
          <div class="card-title">🏅 Histórico do Torneio Global</div>
          <table class="standings-table">
            <thead><tr><th>Temporada</th><th>Campeão</th><th>Vice</th><th>Resultado</th></tr></thead>
            <tbody>${[...(gs.globalTournamentHistory||[])].reverse().map(gt=>`
              <tr class="${gt.champion===gs.playerTeamId||gt.runnerUp===gs.playerTeamId?'my-team':''}">
                <td>T${gt.season}</td>
                <td><span style="display:inline-flex;align-items:center;gap:5px">${this.teamLogo(gt.champion,gs.teams[gt.champion]?.name,gs.teams[gt.champion]?.color,gs.teams[gt.champion]?.color2,16)}<span>${gt.championName||'?'}</span></span></td>
                <td style="color:var(--text3)">${gs.teams[gt.runnerUp]?.name||'?'}</td>
                <td>${gt.playerWon?'🥇 Campeão!':gt.runnerUp===gs.playerTeamId?'🥈 Vice':'—'}</td>
              </tr>`).join('')}
            </tbody>
          </table>
        </div>`:''}
      </div>
    </div>`;
  };

  // ── TELA TORNEIO GLOBAL ──────────────────────────────────────
  UI.prototype.renderGlobalTournament = function() {
    const gs = this.gs;
    const team = gs.getPlayerTeam();
    const gt = gs.globalTournament;
    const nextT = gs.season + (3-((gs.season-1)%3))%3;
    if (!gt) {
      return `<div class="screen-game">${this.renderNavbar(team)}<div class="game-content">
        <div class="screen-header-inner"><h2>🏆 Torneio Global</h2></div>
        <div class="dash-card" style="text-align:center;padding:40px">
          <div style="font-size:3rem;margin-bottom:12px">🏆</div>
          <div style="font-family:'Barlow Condensed',sans-serif;font-size:1.3rem;font-weight:900;color:#f0c84a;margin-bottom:8px">Próximo Torneio Global — T${nextT}</div>
          <div style="font-size:13px;color:var(--text3);margin-bottom:12px">Top 16 clubes do ranking mundial · Ocorre a cada 3 temporadas</div>
          <div style="font-size:12px;color:var(--text4)">Prêmio campeão: <strong style="color:#f0c84a">${this.fmt(GS_PRIZE_CHAMPION)}</strong></div>
          <button class="btn btn-ghost btn-sm" style="margin-top:16px" data-action="ranking">Ver Ranking →</button>
        </div></div></div>`;
    }
    const phaseNames={roundOf16:'Oitavas de Final',quarterfinals:'Quartas de Final',semifinals:'Semifinais',final:'Grande Final',done:'Encerrado'};
    const allPlayed=(gt.bracket[gt.phase]||[]).every(m=>m.played);
    const isDone=gt.phase==='done';
    const renderPhase=(phase)=>{
      const matches=gt.bracket[phase]||[];
      if(!matches.length) return '';
      return `<div style="margin-bottom:18px">
        <div style="font-family:'Barlow Condensed',sans-serif;font-size:.75rem;font-weight:800;color:${phase===gt.phase?'#f0c84a':'var(--text3)'};letter-spacing:.12em;text-transform:uppercase;margin-bottom:8px">${phase===gt.phase?'🔴 ':''}${phaseNames[phase]}</div>
        <div style="display:flex;flex-direction:column;gap:6px">
          ${matches.map(m=>{
            const ht=gs.teams[m.home],at=gs.teams[m.away];
            const isMyMatch=m.home===gs.playerTeamId||m.away===gs.playerTeamId;
            const r=m.result?.score;
            const hw=m.played&&m.winner===m.home,aw=m.played&&m.winner===m.away;
            return `<div style="display:flex;align-items:center;gap:8px;padding:8px 12px;background:${isMyMatch?'rgba(240,200,74,.07)':'rgba(255,255,255,.03)'};border:1px solid ${isMyMatch?'rgba(240,200,74,.25)':'rgba(255,255,255,.06)'};border-radius:10px">
              <div style="flex:1;display:flex;align-items:center;gap:6px;justify-content:flex-end;opacity:${hw?1:.7}">
                ${this.teamLogo(m.home,ht?.name,ht?.color,ht?.color2,18)}
                <span style="font-size:12px;font-weight:${hw?800:400};color:${hw?'var(--text)':'var(--text3)'}">${ht?.name||'?'}</span>
              </div>
              <div style="text-align:center;min-width:60px">
                ${m.played
                  ?`<span style="font-family:'Barlow Condensed',sans-serif;font-size:16px;font-weight:900;color:var(--text)">${r.home}–${r.away}</span>${m.penalties?'<div style="font-size:9px;color:var(--text4)">pen.</div>':''}`
                  :phase===gt.phase
                    ?isMyMatch
                      ?`<div style="display:flex;gap:4px;flex-direction:column;align-items:center"><button class="btn-sm btn-primary" data-action="gt-play" data-match-id="${m.id}" data-phase="${phase}" style="font-size:10px">▶ Jogar</button><button class="btn-sm btn-ghost" data-action="gt-sim" data-match-id="${m.id}" data-phase="${phase}" style="font-size:10px">⚡ Sim</button></div>`
                      :`<span style="font-size:11px;color:var(--text4)">vs</span>`
                    :`<span style="font-size:11px;color:var(--text4)">—</span>`}
              </div>
              <div style="flex:1;display:flex;align-items:center;gap:6px;opacity:${aw?1:.7}">
                <span style="font-size:12px;font-weight:${aw?800:400};color:${aw?'var(--text)':'var(--text3)'}">${at?.name||'?'}</span>
                ${this.teamLogo(m.away,at?.name,at?.color,at?.color2,18)}
              </div>
            </div>`;
          }).join('')}
        </div>
      </div>`;
    };
    const phases=['roundOf16','quarterfinals','semifinals','final'];
    const donePh=phases.filter(p=>(gt.bracket[p]||[]).length>0);
    return `
    <div class="screen-game">
      ${this.renderNavbar(team)}
      <div class="game-content">
        <div class="screen-header-inner">
          <h2>🏆 Torneio Global — T${gt.season}</h2>
          <p>${gt.teams.length} clubes · ${phaseNames[gt.phase]||''}${gt.playerQualified&&!gt.playerEliminated?' · <span style="color:#28c856">✓ Seu time no torneio!</span>':''}</p>
        </div>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:8px;margin-bottom:18px">
          ${[['🥇',GS_PRIZE_CHAMPION,'Campeão'],['🥈',GS_PRIZE_RUNNER_UP,'Vice'],['🥉',GS_PRIZE_SEMI,'Semifinal'],['🏅',GS_PRIZE_QUARTER,'Quartas']].map(([ic,pr,lb])=>`
          <div style="background:rgba(255,255,255,.04);border-radius:8px;padding:10px;text-align:center">
            <div style="font-size:1.3rem">${ic}</div>
            <div style="font-family:'Barlow Condensed',sans-serif;font-size:.85rem;font-weight:900;color:#f0c84a">${this.fmt(pr)}</div>
            <div style="font-size:10px;color:var(--text4)">${lb}</div>
          </div>`).join('')}
        </div>
        <div class="dash-card">
          ${donePh.map(p=>renderPhase(p)).join('')}
          ${isDone
            ?`<div style="text-align:center;padding:20px"><div style="font-size:2rem;margin-bottom:8px">🏆</div>
               <div style="font-family:'Barlow Condensed',sans-serif;font-size:1.3rem;font-weight:900;color:#f0c84a">Campeão: ${gs.teams[gt.champion]?.name||'?'}</div>
               <div style="font-size:12px;color:var(--text3);margin-top:4px">Vice: ${gs.teams[gt.runnerUp]?.name||'?'}</div></div>`
            :`<div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap">
               ${!allPlayed?`<button class="btn btn-ghost btn-sm" data-action="gt-sim-all">⚡ Simular todos (IA)</button>`:''}
               ${allPlayed?`<button class="btn btn-primary btn-sm" data-action="gt-advance">Avançar fase →</button>`:''}
             </div>`}
        </div>
        <div class="dash-card" style="margin-top:14px">
          <div class="card-title">👥 Participantes (${gt.teams.length})</div>
          <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(155px,1fr));gap:6px;margin-top:8px">
            ${gt.teams.map(tid=>{
              const t=gs.teams[tid];if(!t)return'';
              const isMe=tid===gs.playerTeamId,isChamp=gt.champion===tid;
              const pls=gs.getTeamPlayers(tid).filter(p=>!p.retired);
              const ov=pls.length?Math.round(pls.reduce((a,p)=>a+(p.overall||65),0)/pls.length):0;
              return `<div style="display:flex;align-items:center;gap:7px;padding:7px 10px;background:${isMe?'rgba(240,200,74,.08)':'rgba(255,255,255,.03)'};border:1px solid ${isMe?'rgba(240,200,74,.3)':isChamp?'rgba(240,200,74,.4)':'rgba(255,255,255,.06)'};border-radius:8px">
                ${this.teamLogo(tid,t.name,t.color,t.color2,22)}
                <div style="flex:1;min-width:0">
                  <div style="font-size:11px;font-weight:${isMe?800:500};color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${t.name}${isChamp?' 🏆':''}</div>
                  <div style="font-size:10px;color:var(--text4)">${gs.leagues[t.league]?.name||''}</div>
                </div>
                <span style="font-family:'Barlow Condensed',sans-serif;font-size:13px;font-weight:700;color:${ov>=80?'#f0c84a':ov>=70?'#28c856':'var(--text4)'}">${ov}</span>
              </div>`;
            }).join('')}
          </div>
        </div>
      </div>
    </div>`;
  };

  // ── TELA ACADEMIA ────────────────────────────────────────────
  UI.prototype.renderAcademy = function() {
    const gs = this.gs;
    const team = gs.getPlayerTeam();
    if (!gs.youthProspects||!gs.youthProspects.length) window.YouthAcademy.generateProspects(gs);
    const prospects = gs.youthProspects||[];
    const pc = {GL:'#e67e22',FIX:'#2980b9',ALA:'#27ae60','PÍV':'#c0392b'};
    const myYouth = gs.getPlayerPlayers().filter(p=>p.age<=21&&!p.retired).sort((a,b)=>b.potential-a.potential).slice(0,8);
    return `
    <div class="screen-game">
      ${this.renderNavbar(team)}
      <div class="game-content">
        <div class="screen-header-inner">
          <h2>🌱 Academia de Jovens Promessas</h2>
          <p>Contrate jovens talentos e desenvolva-os · Renova a cada temporada · Orçamento: <strong style="color:#f0c84a">${this.fmt(gs.budget)}</strong></p>
        </div>
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
          <div style="font-family:'Barlow Condensed',sans-serif;font-size:.9rem;font-weight:900;color:#28c856;text-transform:uppercase;letter-spacing:.06em">🔍 Talentos Disponíveis — T${gs.season}</div>
          <button class="btn btn-ghost btn-sm" data-action="refresh-academy" title="Custo: varia com nível do Olheiro">🔭 Novo Scouting · ${this.fmt(window.YouthAcademy.getScoutCost(gs))}</button>
        </div>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:12px;margin-bottom:20px">
          ${prospects.map(p=>{
            const canBuy=gs.budget>=p.cost;
            const potC=p.potential>=88?'#f0c84a':p.potential>=82?'#28c856':p.potential>=76?'#4a90e2':'var(--text2)';
            return `<div style="background:var(--bg2);border:1px solid ${canBuy?'rgba(40,200,86,.25)':'var(--border)'};border-radius:14px;padding:16px">
              <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">
                <span style="background:${pc[p.position]||'#555'};color:#fff;font-size:11px;font-weight:800;padding:3px 8px;border-radius:6px">${p.position}</span>
                <div style="flex:1"><div style="font-weight:800;font-size:14px;color:var(--text)">${p.name}</div><div style="font-size:11px;color:var(--text3)">${p.age}a · Brasil</div></div>
                <div style="text-align:center"><div style="font-family:'Barlow Condensed',sans-serif;font-size:1.4rem;font-weight:900;color:var(--text2);line-height:1">${p.overall}</div><div style="font-size:9px;color:var(--text4)">OVR</div></div>
              </div>
              <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
                <div style="flex:1;background:rgba(255,255,255,.05);border-radius:20px;height:5px;overflow:hidden">
                  <div style="height:100%;width:${p.potential}%;background:${potC};border-radius:20px"></div>
                </div>
                <span style="font-family:'Barlow Condensed',sans-serif;font-size:13px;font-weight:900;color:${potC}">POT ${p.potential}</span>
              </div>
              <div style="font-size:11px;color:var(--text3);margin-bottom:12px">${p.description}</div>
              <div style="display:flex;align-items:center;justify-content:space-between">
                <div>
                  <div style="font-family:'Barlow Condensed',sans-serif;font-size:13px;font-weight:900;color:${canBuy?'#f0c84a':'var(--red)'}">${this.fmt(p.cost)}</div>
                  <div style="font-size:10px;color:var(--text4)">${this.fmt(p.salary)}/mês · 3a contrato</div>
                </div>
                <button class="btn btn-sm ${canBuy?'btn-primary':'btn-disabled'}" ${canBuy?`data-action="sign-prospect" data-pid="${p.id}"`:'disabled'}>
                  ${canBuy?'✍️ Contratar':'Sem verba'}
                </button>
              </div>
            </div>`;
          }).join('')}
          ${!prospects.length?`<div style="text-align:center;padding:30px;color:var(--text4);grid-column:1/-1">Nenhum talento. Clique em "Novo scouting".</div>`:''}
        </div>
        <div style="font-family:'Barlow Condensed',sans-serif;font-size:.85rem;font-weight:900;color:#4a90e2;text-transform:uppercase;letter-spacing:.06em;margin-bottom:10px">🌟 Jovens no Elenco (sub-22)</div>
        ${myYouth.length===0
          ?`<div style="text-align:center;padding:16px;color:var(--text4);font-size:12px;background:var(--bg2);border-radius:10px">Nenhum jogador sub-22 no elenco.</div>`
          :`<div style="overflow-x:auto"><table class="players-table">
            <thead><tr><th>Nome</th><th>Pos</th><th>Idade</th><th>OVR</th><th>POT</th><th>GAP</th><th>Contrato</th></tr></thead>
            <tbody>${myYouth.map(p=>{const gap=(p.potential||0)-p.overall;return`<tr>
              <td><strong>${p.name}</strong></td>
              <td><span class="pos-badge" style="background:${pc[p.position]||'#555'}">${p.position}</span></td>
              <td>${p.age}</td><td class="ovr-cell"><strong>${p.overall}</strong></td>
              <td style="color:#f0c84a;font-weight:700">${p.potential}</td>
              <td><span style="color:${gap>=15?'#28c856':gap>=8?'#f0c84a':'var(--text3)'}">+${gap}</span></td>
              <td style="color:var(--text3)">${p.contractYears}a</td>
            </tr>`;}).join('')}</tbody>
          </table></div>`}
        <div style="font-size:11px;color:var(--text3);margin-top:8px;padding:8px 12px;background:var(--bg2);border-radius:8px">
          💡 Jovens com GAP alto crescem mais rápido. Use o Centro de Treinamento para acelerar o desenvolvimento.
        </div>
      </div>
    </div>`;
  };

  // Helpers para partidas do torneio
  UI.prototype._gtPlayMatch = function(matchId, phase) {
    const gs=this.gs,gt=gs.globalTournament;if(!gt)return;
    const m=(gt.bracket[phase]||[]).find(x=>x.id===matchId);if(!m||m.played)return;
    const isHome=m.home===gs.playerTeamId;
    const sq=gs.squad.map(id=>gs.players[id]).filter(Boolean).slice(0,5);
    if(sq.length<5){this.showToast('⚠️ Escale 5 jogadores em Táticas!','warn');return;}
    const ai=new AIManager(gs),oppId=isHome?m.away:m.home;
    const opp=ai.pickSquad(oppId);
    const hs=isHome?sq:opp,as=isHome?opp:sq;
    const ht=gs.teams[m.home],at=gs.teams[m.away];
    const engine=new MatchEngine(ht,at,hs,as,isHome?gs.tactics:ai.chooseTactics(m.home),isHome?ai.chooseTactics(m.away):gs.tactics);
    const result=engine.simulate();
    window.GlobalTournament.processMatch(gs,matchId,phase,result);
    const myS=isHome?result.score.home:result.score.away,thS=isHome?result.score.away:result.score.home;
    if(window.SFX){if(myS>thS)SFX.win();else if(myS<thS)SFX.loss();else SFX.draw();}
    this.showToast(`${ht.name} ${result.score.home}–${result.score.away} ${at.name}`,myS>thS?'success':myS<thS?'warn':'info');
    this.render('gtournament');
  };
  UI.prototype._gtSimMatch = function(matchId, phase) {
    const gs=this.gs,gt=gs.globalTournament;if(!gt)return;
    const m=(gt.bracket[phase]||[]).find(x=>x.id===matchId);if(!m||m.played)return;
    const ai=new AIManager(gs),ht=gs.teams[m.home],at=gs.teams[m.away];if(!ht||!at)return;
    const engine=new MatchEngine(ht,at,ai.pickSquad(m.home),ai.pickSquad(m.away),ai.chooseTactics(m.home),ai.chooseTactics(m.away));
    window.GlobalTournament.processMatch(gs,matchId,phase,engine.simulate());
    this.render('gtournament');
  };

  console.log('✅ globalSystems.js v2.0 — UI patches OK');
})();

// ── CSS ───────────────────────────────────────────────────────
(function(){
  const s=document.createElement('style');
  s.textContent=`
    .standings-table tr.my-team td{background:rgba(240,200,74,.06);}
    .standings-table tr:hover td{background:rgba(255,255,255,.025);}
  `;
  document.head.appendChild(s);
})();

console.log('✅ globalSystems.js v2.0 carregado — Ranking, Torneio (3 temporadas), Academia, Transferências');

// ── MOBILE DRAWER HELPERS ─────────────────────────────────────
window._openMobileDrawer = function() {
  document.getElementById('mobile-drawer')?.classList.add('open');
  document.getElementById('mobile-drawer-overlay')?.classList.add('open');
};
window._closeMobileDrawer = function() {
  document.getElementById('mobile-drawer')?.classList.remove('open');
  document.getElementById('mobile-drawer-overlay')?.classList.remove('open');
};
// Fechar drawer com swipe para baixo
(function() {
  let startY = 0;
  document.addEventListener('touchstart', e => {
    const drawer = document.getElementById('mobile-drawer');
    if (drawer?.classList.contains('open')) startY = e.touches[0].clientY;
  }, { passive: true });
  document.addEventListener('touchend', e => {
    const drawer = document.getElementById('mobile-drawer');
    if (drawer?.classList.contains('open')) {
      const dy = e.changedTouches[0].clientY - startY;
      if (dy > 60) window._closeMobileDrawer?.();
    }
  }, { passive: true });
})();
