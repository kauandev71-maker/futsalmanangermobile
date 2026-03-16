// ============================================================
// FUTSAL MANAGER — GAME STATE v6 (polido)
// Fixes: finanças balanceadas, geração de lesões, IA melhorada,
//        save/load robusto, histórico de temporada, QoL geral
// ============================================================

class GameState {
  constructor() {
    this.initialized  = false;
    this.playerTeamId = null;
    this.players      = {};
    this.teams        = {};
    this.leagues      = {};
    this.schedules    = {};
    this.currentWeek  = 1;
    this.totalWeeks   = 14;
    this.season       = 2025;
    this.transferMarket = [];
    this.news         = [];
    this.endOfSeason  = false;
    this.pendingOffers = [];
    this.coachingStaff = { assistente:null, preparadorFisico:null, analistaTatico:null, medico:null, olheiro:null, gestorContratos:null };
    this.history      = [];
    this.worldCup     = null;
    this.worldCupHistory = [];
    this.sponsorContracts = []; // contratos de patrocínio ativos
    this.availableSponsors = []; // ofertas disponíveis
    this.topTransfers = []; // histórico global de transferências
    this.globalTournament = null; // torneio global dos melhores clubes
    this.globalTournamentHistory = []; // histórico de torneios globais
    this.budget       = 0;
    this.income       = { bilheteria:0, patrocinio:0, transferencias:0 };
    this.expenses     = { salarios:0, infraestrutura:0 };
    this.tactics      = { formation:'1-2-1-1', style:'equilibrado', pressao:5, linhaDefensiva:5, largura:5, ritmo:5, goleirolinha:false, powerPlay:false };
    this.squad        = [];
    this.reserves     = [];
  }

  // ── INIT ─────────────────────────────────────────────────────
  init(dbData, playerTeamId) {
    const { players, teams, leagues } = dbData;
    this.players = {};
    players.forEach(p => {
      // Valores já calibrados em players.js — sem inflação adicional
      this.players[p.id] = p;
    });
    this.teams   = teams;
    this.leagues = leagues;
    this.playerTeamId = playerTeamId;

    const team = teams[playerTeamId];
    this.budget = team?.budget || 1_000_000;

    // Patrocínio base reduzido (era 12% do orçamento, agora 4%)
    this.income.patrocinio = Math.round(this.budget * 0.04);
    // Bilheteria estimada por jogo em casa
    const cap = team?.capacity || 5000;
    const rep = team?.reputation || 75;
    const ticketPrice = 15 + Math.round(rep * 0.5);
    this.income.bilheteria = 0; // acumula durante a temporada

    this.generateSchedules();
    this.generateTransferMarket();
    this.generateSponsors();
    this.generateNews(5);
    // Inicializa ranking global (reputação como base inicial)
    Object.values(this.teams).forEach(t => {
      if (t.clubRankingPoints === undefined) t.clubRankingPoints = Math.round((t.reputation || 50) * 1.2);
      if (t.clubTitles === undefined) t.clubTitles = 0;
    });
    this.initialized = true;
    console.log(`✅ GameState v10 — ${team?.name} | Budget: ${this.budget.toLocaleString()}`);
  }

  // ── GETTERS ──────────────────────────────────────────────────
  getTeamPlayers(teamId) {
    const t = this.teams[teamId];
    if (!t) return [];
    return (t.players || []).map(id => this.players[id]).filter(Boolean);
  }
  getPlayerTeam()    { return this.teams[this.playerTeamId]; }
  getPlayerPlayers() { return this.getTeamPlayers(this.playerTeamId); }

  // ── SCHEDULE ─────────────────────────────────────────────────
  generateSchedules() {
    let maxWeek = 1;
    Object.values(this.leagues).forEach(league => {
      const teamIds = [...(league.teams || [])];
      const n = teamIds.length;
      if (n < 2) { this.schedules[league.id] = []; return; }

      const list = n % 2 === 0 ? [...teamIds] : [...teamIds, null];
      const half = list.length / 2;
      const rounds = list.length - 1;
      const matches = [];
      const rotatable = list.slice(1);

      for (let r = 0; r < rounds; r++) {
        const week = r + 1;
        const current = [list[0], ...rotatable];
        for (let i = 0; i < half; i++) {
          const home = current[i], away = current[list.length - 1 - i];
          if (home && away) matches.push({ id:`${home}_${away}_w${week}`, home, away, played:false, result:null, week });
        }
        rotatable.unshift(rotatable.pop());
      }

      const firstLegs = matches.slice();
      firstLegs.forEach(m => matches.push({ id:`${m.away}_${m.home}_w${m.week+rounds}`, home:m.away, away:m.home, played:false, result:null, week:m.week+rounds }));

      this.schedules[league.id] = matches;
      maxWeek = Math.max(maxWeek, rounds * 2);
    });
    this.totalWeeks = maxWeek;
  }

  getWeekMatches(teamId, week) {
    const t = this.teams[teamId];
    if (!t) return [];
    return (this.schedules[t.league] || []).filter(m => m.week === week && (m.home === teamId || m.away === teamId));
  }

  getUpcomingMatches(count = 5) {
    const lid = this.teams[this.playerTeamId]?.league;
    if (!lid) return [];
    return (this.schedules[lid] || []).filter(m => !m.played && (m.home === this.playerTeamId || m.away === this.playerTeamId)).slice(0, count);
  }

  getPlayerWeekMatch() {
    const lid = this.teams[this.playerTeamId]?.league;
    return (this.schedules[lid] || []).find(m => m.week === this.currentWeek && !m.played && (m.home === this.playerTeamId || m.away === this.playerTeamId)) || null;
  }

  // ── STANDINGS ────────────────────────────────────────────────
  getLeagueStandings(leagueId) {
    const league = this.leagues[leagueId];
    if (!league) return [];
    return (league.teams || []).map(id => this.teams[id]).filter(Boolean).sort((a, b) => {
      const sa = a.standing, sb = b.standing;
      if (sb.pts !== sa.pts) return sb.pts - sa.pts;
      if (sb.gd  !== sa.gd)  return sb.gd  - sa.gd;
      return sb.gf - sa.gf;
    });
  }

  // ── PROCESS MATCH RESULT ─────────────────────────────────────
  processMatchResult(matchId, leagueId, result) {
    const schedule = this.schedules[leagueId];
    if (!schedule) return;
    const match = schedule.find(m => m.id === matchId);
    if (!match || match.played) return;

    match.played = true;
    match.result = result;

    const { home, away } = match;
    const ht = this.teams[home], at = this.teams[away];
    if (!ht || !at) return;

    const hs = result.score?.home ?? 0;
    const as_ = result.score?.away ?? 0;

    const updateStanding = (t, gf, ga, outcome) => {
      t.standing.played++;
      t.standing.gf += gf;
      t.standing.ga += ga;
      t.standing.gd = t.standing.gf - t.standing.ga;
      if (outcome === 'w') { t.standing.w++; t.standing.pts += 3; t.form.unshift('W'); }
      else if (outcome === 'd') { t.standing.d++; t.standing.pts++; t.form.unshift('D'); }
      else { t.standing.l++; t.form.unshift('L'); }
      t.form = t.form.slice(0, 5);
    };

    if (hs > as_) { updateStanding(ht, hs, as_, 'w'); updateStanding(at, as_, hs, 'l'); }
    else if (as_ > hs) { updateStanding(ht, hs, as_, 'l'); updateStanding(at, as_, hs, 'w'); }
    else { updateStanding(ht, hs, as_, 'd'); updateStanding(at, as_, hs, 'd'); }

    // Morale swing
    const swing = 4;
    const moraleUpdate = (tid, delta) => this.getTeamPlayers(tid).forEach(p => { p.morale = Math.max(20, Math.min(99, (p.morale || 75) + delta)); });
    if (hs > as_) { moraleUpdate(home, swing); moraleUpdate(away, -swing); }
    else if (as_ > hs) { moraleUpdate(away, swing); moraleUpdate(home, -swing); }

    // Fitness decay from match
    [...(this.getTeamPlayers(home)), ...(this.getTeamPlayers(away))].forEach(p => {
      p.fitness = Math.max(55, (p.fitness || 85) - Math.floor(Math.random() * 8 + 4));
    });

    // Bilheteria: jogo em casa do player gera receita
    if (home === this.playerTeamId) {
      const team = this.teams[home];
      const cap = team?.capacity || 5000;
      const rep = (team?.reputation || 75) / 100;
      const occupancy = 0.35 + rep * 0.30 + Math.random() * 0.06; // 35–71% ocupação (era 50–100%)
      // Ingresso: R$25–R$120 por pessoa (era R$150–R$600 — redução de ~75%)
      const ticketPrice = Math.round(25 + rep * 95);
      const ticket = Math.round(cap * occupancy * ticketPrice);
      this.income.bilheteria = Math.round((this.income.bilheteria || 0) + ticket);
      this.budget = Math.round(this.budget + ticket);
      if (team) team.budget = this.budget;
    }

    // Notícia do resultado
    const myInMatch = match.home === this.playerTeamId || match.away === this.playerTeamId;
    if (myInMatch) {
      const isHome = match.home === this.playerTeamId;
      const myScore = isHome ? hs : as_;
      const theirScore = isHome ? as_ : hs;
      const oppTeam = this.teams[isHome ? match.away : match.home];
      if (myScore > theirScore)
        this.news.unshift({ date:`Rod. ${this.currentWeek}`, type:'resultado', text:`✅ Vitória! ${ht.name} ${hs}–${as_} ${at.name}` });
      else if (myScore === theirScore)
        this.news.unshift({ date:`Rod. ${this.currentWeek}`, type:'resultado', text:`🤝 Empate: ${ht.name} ${hs}–${as_} ${at.name}` });
      else
        this.news.unshift({ date:`Rod. ${this.currentWeek}`, type:'resultado', text:`❌ Derrota: ${ht.name} ${hs}–${as_} ${at.name}` });
    } else {
      this.news.unshift({ date:`Rod. ${this.currentWeek}`, type:'resultado', text:`${ht.name} ${hs}–${as_} ${at.name}` });
    }
    if (this.news.length > 50) this.news = this.news.slice(0, 50);
  }

  // ── SIMULATE AI ROUND ────────────────────────────────────────
  simulateAIRound(week) {
    const ai = new AIManager(this);
    const allNews = [];

    Object.values(this.leagues).forEach(league => {
      // Simular partidas da IA
      (this.schedules[league.id] || []).filter(m => m.week === week && !m.played).forEach(match => {
        if (match.home === this.playerTeamId || match.away === this.playerTeamId) return;
        const ht = this.teams[match.home], at = this.teams[match.away];
        if (!ht || !at) return;
        const hs = ai.pickSquad(match.home), as_ = ai.pickSquad(match.away);
        const engine = new MatchEngine(ht, at, hs, as_, ai.chooseTactics(match.home), ai.chooseTactics(match.away));
        const result = engine.simulate();
        this.processMatchResult(match.id, league.id, result);

        // Atualizar moral dos times após o resultado
        if (result?.score) {
          ai.applyMatchMorale(match.home, result.score.home, result.score.away, true);
          ai.applyMatchMorale(match.away, result.score.home, result.score.away, false);
        }
      });

      // Pipeline completo de gerenciamento da IA para cada time
      league.teams.forEach(tid => {
        if (tid === this.playerTeamId) return;
        const news = ai.processWeekly(tid, week);
        allNews.push(...news);
      });
    });

    return allNews;
  }

  // ── TRANSFER MARKET ──────────────────────────────────────────
  generateTransferMarket() {
    const all = Object.values(this.players).filter(p => p && !p.retired);
    this.transferMarket = all.filter(p => {
      if (p.retired || p.teamId === null) return false;
      if (p.teamId === this.playerTeamId) return p.onTransferList;
      if (p.age >= 35) return Math.random() < 0.35;  // mais veteranos disponíveis
      if (p.age >= 32) return Math.random() < 0.20;
      if (p.overall < 63) return Math.random() < 0.15; // mais jogadores fracos
      if (p.overall >= 82) return Math.random() < 0.04; // tops muito difíceis de encontrar
      return Math.random() < 0.07; // mercado base mais rico
    });
  }

  executeTransfer(playerId, toTeamId, price) {
    const p = this.players[playerId];
    const toTeam = this.teams[toTeamId];
    if (!p || !toTeam) return false;
    const safePrice = Math.round(price) || 0;
    if (toTeamId === this.playerTeamId && this.budget < safePrice) return false;

    const prevTeamId = p.teamId;
    const fromTeam = this.teams[prevTeamId];
    if (fromTeam) {
      fromTeam.players = fromTeam.players.filter(id => id !== playerId);
      fromTeam.budget  = Math.round((fromTeam.budget || 0) + safePrice);
    }
    p.teamId = toTeamId;
    if (!toTeam.players.includes(playerId)) toTeam.players.push(playerId);
    toTeam.budget = Math.round((toTeam.budget || 0) - safePrice);

    // Atualizar this.budget: tanto ao comprar quanto ao VENDER
    if (toTeamId === this.playerTeamId) {
      this.budget = toTeam.budget; // comprou: subtrai
    } else if (prevTeamId === this.playerTeamId) {
      this.budget = fromTeam.budget; // vendeu: recebe o dinheiro
      if (this.teams[this.playerTeamId]) this.teams[this.playerTeamId].budget = this.budget;
    }

    p.onTransferList = false;
    this.transferMarket = this.transferMarket.filter(x => x.id !== playerId);
    if (prevTeamId === this.playerTeamId) {
      this.income.transferencias = Math.round((this.income.transferencias || 0) + safePrice);
    }

    // Registrar transferência no histórico
    const topTr = {
      playerName: p.name, position: p.position, overall: p.overall,
      fromTeamId: prevTeamId, fromTeamName: this.teams[prevTeamId]?.name || '?',
      toTeamId, toTeamName: toTeam.name,
      price: safePrice, season: this.season, week: this.currentWeek
    };
    if (!this.topTransfers) this.topTransfers = [];
    this.topTransfers.push(topTr);
    this.topTransfers = this.topTransfers.sort((a,b)=>b.price-a.price).slice(0,50);

    return true;
  }

  // ── TOP STATS ────────────────────────────────────────────────
  getTopScorers(leagueId = null, limit = 10) {
    let ps = Object.values(this.players).filter(p => (p.goals || 0) > 0);
    if (leagueId) { const lt = new Set(this.leagues[leagueId]?.teams || []); ps = ps.filter(p => lt.has(p.teamId)); }
    return ps.sort((a, b) => (b.goals || 0) - (a.goals || 0) || (b.assists || 0) - (a.assists || 0)).slice(0, limit);
  }
  getTopAssists(leagueId = null, limit = 10) {
    let ps = Object.values(this.players).filter(p => (p.assists || 0) > 0);
    if (leagueId) { const lt = new Set(this.leagues[leagueId]?.teams || []); ps = ps.filter(p => lt.has(p.teamId)); }
    return ps.sort((a, b) => (b.assists || 0) - (a.assists || 0)).slice(0, limit);
  }

  // ── NEWS ─────────────────────────────────────────────────────
  generateNews(count = 3) {
    const lid = this.teams[this.playerTeamId]?.league;
    const standings = this.getLeagueStandings(lid);
    const leader  = standings[0];
    const second  = standings[1];
    const myPos   = standings.findIndex(t => t.id === this.playerTeamId) + 1;
    const myTeam  = this.teams[this.playerTeamId];
    const dynamic = [];

    // Artilheiro da liga
    const topScorer = Object.values(this.players).filter(p => (p.goals||0) > 0 && this.leagues[lid]?.teams?.includes(p.teamId)).sort((a,b)=>b.goals-a.goals)[0];
    if (topScorer) {
      const t = this.teams[topScorer.teamId];
      dynamic.push({ type:'artilharia', text:`⚽ ${topScorer.name} lidera a artilharia com ${topScorer.goals} gol(s)${t?' pelo '+t.name:''}!` });
    }

    // Assistências
    const topAssist = Object.values(this.players).filter(p => (p.assists||0) > 0 && this.leagues[lid]?.teams?.includes(p.teamId)).sort((a,b)=>b.assists-a.assists)[0];
    if (topAssist && topAssist.id !== topScorer?.id) {
      const t = this.teams[topAssist.teamId];
      dynamic.push({ type:'artilharia', text:`🎯 ${topAssist.name} lidera em assistências com ${topAssist.assists} passe(s) decisivo(s) pelo ${t?.name||'—'}` });
    }

    if (leader && myTeam) {
      if (leader.id === this.playerTeamId)
        dynamic.push({ type:'posicao', text:`🏆 ${myTeam.name} na liderança com ${leader.standing.pts} pontos! Continua invicto.` });
      else if (myPos <= 3)
        dynamic.push({ type:'posicao', text:`📊 ${myTeam.name} em ${myPos}º — a ${leader.standing.pts-(myTeam.standing?.pts||0)} pontos do líder ${leader.name}.` });
      else if (myPos >= standings.length - 1)
        dynamic.push({ type:'alerta', text:`⚠️ ATENÇÃO! ${myTeam.name} em zona de rebaixamento. Reaja agora!` });

      // Disputa pelo título
      if (leader.id !== this.playerTeamId && second?.id === this.playerTeamId) {
        const gap = leader.standing.pts - (myTeam.standing?.pts||0);
        dynamic.push({ type:'posicao', text:`🔥 ${myTeam.name} está apenas ${gap} pont${gap!==1?'os':'o'} atrás do líder ${leader.name}!` });
      }
    }

    // Pool dinâmico com contexto do jogo
    const pool = [
      { type:'geral', text:`Rodada ${this.currentWeek}: Resultados surpreendentes agitam a ${this.leagues[lid]?.name||'liga'}` },
      { type:'geral', text:`Mercado aquecido — janela de transferências movimentadíssima` },
      { type:'geral', text:`${leader?.name||'Líder'} é favorito ao título segundo os analistas` },
      { type:'geral', text:`Preparadores físicos alertam para sobrecarga de jogos` },
      { type:'geral', text:`Jovem promessa de 17 anos chama atenção dos olheiros da liga` },
      { type:'geral', text:`Debate: goleiro-linha é o futuro do futsal moderno?` },
      { type:'geral', text:`Árbitros adotam nova postura para faltas acumuladas` },
      { type:'geral', text:`Times intensificam treinos: decisão do campeonato se aproxima` },
      { type:'geral', text:`Análise: times com boa forma têm 35% mais aproveitamento nas últimas rodadas` },
      { type:'geral', text:`Especialista destaca importância do moral alto na reta final` },
      { type:'geral', text:`Clássico da rodada promete ser o jogo mais aguardado da temporada` },
      { type:'geral', text:`Scouting revela: mercado tem talentos escondidos à espera de oportunidade` },
    ];
    const all = [...dynamic];
    while (all.length < count) {
      const n = pool[Math.floor(Math.random() * pool.length)];
      if (!all.find(x => x.text === n.text)) all.push(n);
    }
    all.slice(0, count).forEach(n => this.news.push({ date:`Semana ${this.currentWeek}`, type:n.type||'geral', text:n.text }));
  }

  // ── NEXT WEEK ────────────────────────────────────────────────
  nextWeek() {
    const prevWeek = this.currentWeek;
    const aiNews = this.simulateAIRound(prevWeek);
    aiNews.forEach(n => this.news.unshift({ date:`Rod. ${prevWeek}`, type:'transferencia', text:n }));

    this.currentWeek++;
    if (this.news.length > 50) this.news = this.news.slice(0, 50);

    // Recuperação de fitness do plantel do player
    this.getPlayerPlayers().forEach(p => {
      const hasPrep = this.coachingStaff?.preparadorFisico;
      const recovery = hasPrep ? Math.floor(Math.random() * 8 + 5) : Math.floor(Math.random() * 5 + 3);
      p.fitness = Math.min(100, (p.fitness || 85) + recovery);
      if (p.injured && p.injuryDays > 0) {
        const hasDoc = this.coachingStaff?.medico;
        p.injuryDays -= hasDoc ? 3 : 1;
        if (p.injuryDays <= 0) { p.injured = false; p.injuryDays = 0; }
      }
    });

    // Patrocínios por contrato a cada semana
    this._processSponsorPayments();

    // Patrocínio base (sem contrato) — removido: agora vem dos contratos
    // Verificar contratos encerrados
    this._processContractExpirations();

    // Salários mensais a cada 4 semanas
    if (this.currentWeek % 4 === 0) {
      const totalSalary = Math.round(this.getPlayerPlayers().reduce((a, p) => a + (p.salary || 0), 0));
      const staffBaseCosts = { assistente:150000, preparadorFisico:120000, analistaTatico:140000, medico:100000, olheiro:80000, gestorContratos:110000 };
      const staffTotal  = Math.round(Object.entries(this.coachingStaff).filter(([, v]) => v).reduce((a, [k, v]) => {
        const lv = v?.level || 1;
        return a + Math.round((staffBaseCosts[k] || 0) * (1 + (lv - 1) * 0.2)); // +20% custo por nível
      }, 0));
      const totalDesp   = totalSalary + staffTotal;
      this.expenses.salarios = Math.round((this.expenses.salarios || 0) + totalDesp);
      this.budget = Math.max(0, Math.round(this.budget - totalDesp));
      const team = this.teams[this.playerTeamId];
      if (team) team.budget = this.budget;
      const detail = staffTotal > 0 ? ` (jogadores: ${this.fmt(totalSalary)} + staff: ${this.fmt(staffTotal)})` : '';
      this.news.unshift({ date:`Semana ${this.currentWeek}`, type:'geral', text:`📉 Folha paga: ${this.fmt(totalDesp)}${detail}` });
      // Alerta se orçamento baixo
      if (this.budget < totalDesp * 1.5) {
        this.news.unshift({ date:`Semana ${this.currentWeek}`, type:'alerta', text:`⚠️ Atenção! Orçamento baixo (${this.fmt(this.budget)}). Considere vender jogadores ou buscar patrocinadores.` });
      }
    }

    this.generateNews(2);

    if (this.currentWeek > this.totalWeeks) this.endOfSeason = true;
    return aiNews;
  }

  // ── END OF SEASON ────────────────────────────────────────────
  startNewSeason() {
    const lid = this.teams[this.playerTeamId]?.league;
    const standings = this.getLeagueStandings(lid);
    const myPos  = standings.findIndex(t => t.id === this.playerTeamId) + 1;
    const champion = standings[0];

    // Prêmios fixos por liga (máx 20M para campeão)
    const leaguePrizeTable = {
      // Premiações graduadas — cada colocação é recompensada
      premier:     [25_000_000, 15_000_000, 8_000_000, 4_500_000, 2_500_000, 1_500_000, 800_000, 400_000],
      laliga:      [18_000_000, 11_000_000, 6_000_000, 3_200_000, 1_800_000, 1_000_000, 550_000, 250_000],
      seriea:      [15_000_000,  9_000_000, 5_000_000, 2_800_000, 1_500_000,   800_000, 400_000, 180_000],
      brasileirao: [10_000_000,  6_000_000, 3_500_000, 1_800_000, 1_000_000,   550_000, 280_000, 120_000],
      lpf:         [ 4_000_000,  2_400_000, 1_300_000,   700_000,   380_000,   200_000, 100_000,  50_000],
    };
    const table = leaguePrizeTable[lid] || leaguePrizeTable['brasileirao'];
    const prize = table[Math.min(myPos - 1, table.length - 1)] || 50_000;
    this.budget += prize;
    const team = this.teams[this.playerTeamId];
    if (team) team.budget = this.budget;

    // Bônus de campeão: morale e reputação do clube
    if (myPos === 1) {
      const myTeam = this.teams[this.playerTeamId];
      if (myTeam) {
        myTeam.reputation = Math.min(99, (myTeam.reputation||75) + 2);
        this.getPlayerPlayers().forEach(p => { p.morale = Math.min(99, (p.morale||75) + 8); });
        this.budget += 2_000_000; // bônus especial de campeão
        if (myTeam) myTeam.budget = this.budget;
        this.news.unshift({ date:`T${this.season}`, type:'posicao', text:`🏆 CAMPEÕES! ${myTeam.name} conquista o título da temporada ${this.season}! +R$2M de bônus!` });
      }
    } else if (myPos <= 3) {
      this.getPlayerPlayers().forEach(p => { p.morale = Math.min(99, (p.morale||75) + 4); });
    }

    this.history.push({
      season: this.season,
      position: myPos,
      pts: standings.find(t => t.id === this.playerTeamId)?.standing?.pts || 0,
      champion: champion?.id === this.playerTeamId,
      prize,
      leagueId: lid,
      leagueName: this.leagues[lid]?.name || lid,
      topScorerPlayer: this.getTopScorers(lid, 1)[0]?.teamId === this.playerTeamId ? this.getTopScorers(lid, 1)[0]?.name : null,
      topAssistPlayer: this.getTopAssists(lid, 1)[0]?.teamId === this.playerTeamId ? this.getTopAssists(lid, 1)[0]?.name : null,
      goals: standings.find(t => t.id === this.playerTeamId)?.standing?.gf || 0,
      teamName: this.teams[this.playerTeamId]?.name || '',
    });

    // Reputação do clube: sobe/desce com o desempenho
    const myT = this.teams[this.playerTeamId];
    const totalTeams = Object.keys(this.leagues[myT?.league]?.teams || {}).length || 8;
    if (myT) {
      const repChange = myPos === 1 ? 3 : myPos <= 3 ? 1 : myPos >= totalTeams - 1 ? -2 : 0;
      myT.reputation = Math.max(40, Math.min(99, (myT.reputation||75) + repChange));
    }

    this.season++;
    this.currentWeek = 1;
    this.endOfSeason = false;
    this.pendingOffers = []; // limpar propostas entre temporadas
    this.income = { bilheteria:0, patrocinio: Math.round(this.budget * 0.04), transferencias:0 };
    this.expenses = { salarios:0, infraestrutura:0 };

    Object.values(this.teams).forEach(t => {
      t.standing = { pts:0, w:0, d:0, l:0, gf:0, ga:0, gd:0, played:0 };
      t.form = [];
    });

    Object.values(this.players).forEach(p => {
      if (p.retired) return; // aposentados não envelhecem nem evoluem
      p.age++;
      p.goals = 0; p.assists = 0; p.appearances = 0; p.yellowCards = 0; p.redCards = 0;
      p.injured = false; p.injuryDays = 0;
      if (p.contractYears > 0) p.contractYears--;
      // Declínio veteranos
      if (p.age >= 34 && Math.random() < 0.30 && p.attrs) {
        const k = ['velocidade','resistencia','agilidade'][Math.floor(Math.random() * 3)];
        if (p.attrs[k] !== undefined) p.attrs[k] = Math.max(30, p.attrs[k] - 1);
        if (window.calcOvr) p.overall = Math.max(p.overall - 1, Math.min(p.overall, window.calcOvr(p.attrs, p.position)));
      }
      // Crescimento jovens
      if (p.age <= 22 && p.overall < p.potential && Math.random() < 0.28 && p.attrs) {
        p.overall = Math.min(p.potential, p.overall + 1);
      }
    });

    // Aposentados: OVR vai a 10 (impossível de contratar)
    Object.values(this.players).forEach(p => {
      if (p.retired && p.overall > 10) {
        p.overall = 10;
        p.potential = 10;
        p.value = 0;
        p.salary = 0;
        p.onTransferList = false;
      }
    });

    this.generateSchedules();
    this.generateTransferMarket();
    this.generateSponsors();
    this.news = [];
    this.generateNews(5);

    return { myPos, prize, champion, season: this.season };
  }

  // ── SAVE/LOAD ────────────────────────────────────────────────
  save() {
    try {
      const data = {
        v: 6,
        playerTeamId:  this.playerTeamId,
        players:       this.players,
        teams:         this.teams,
        leagues:       this.leagues,
        schedules:     this.schedules,
        currentWeek:   this.currentWeek,
        totalWeeks:    this.totalWeeks,
        season:        this.season,
        transferMarket: this.transferMarket.map(p => p.id),
        pendingOffers: this.pendingOffers || [],
        news:          this.news,
        budget:        this.budget,
        income:        this.income,
        expenses:      this.expenses,
        tactics:       this.tactics,
        squad:         this.squad,
        reserves:      this.reserves,
        coachingStaff: this.coachingStaff,
        history:       this.history,
        worldCup:      this.worldCup,
        worldCupHistory: this.worldCupHistory,
        sponsorContracts: this.sponsorContracts || [],
        availableSponsors: this.availableSponsors || [],
        topTransfers: this.topTransfers || [],
        globalTournament: this.globalTournament || null,
        globalTournamentHistory: this.globalTournamentHistory || [],
      };
      localStorage.setItem('futsalmanager_save', JSON.stringify(data));
      return true;
    } catch(e) { console.error('Erro ao salvar:', e); return false; }
  }

  load() {
    try {
      const raw = localStorage.getItem('futsalmanager_save');
      if (!raw) return false;
      const data = JSON.parse(raw);
      Object.assign(this, data);
      this.transferMarket = (data.transferMarket || []).map(id => this.players[id]).filter(Boolean);
      this.pendingOffers  = data.pendingOffers || [];
      this.worldCup       = data.worldCup || null;
      this.worldCupHistory = data.worldCupHistory || [];
      this.sponsorContracts = data.sponsorContracts || [];
      this.availableSponsors = data.availableSponsors || [];
      this.topTransfers = data.topTransfers || [];
      this.globalTournament = data.globalTournament || null;
      this.globalTournamentHistory = data.globalTournamentHistory || [];
      // Migrar times sem campos de ranking
      let needsRankingCompute = false;
      Object.values(this.teams || {}).forEach(t => {
        if (t.clubRankingPoints === undefined) { t.clubRankingPoints = Math.round((t.reputation || 50) * 1.2); needsRankingCompute = true; }
        if (t.clubTitles === undefined) t.clubTitles = 0;
        if (t.clubRankingPosition === undefined) needsRankingCompute = true;
      });
      // Forçar cálculo de ranking se não existia (saves antigos)
      if (needsRankingCompute && window.GlobalRanking) {
        try { window.GlobalRanking.compute(this); } catch(e) {}
      }
      // Corrigir aposentados com OVR alto (saves antigos com jogadores de 47+anos)
      Object.values(this.players || {}).forEach(p => {
        if (p.retired && p.overall > 10) {
          p.overall = 10; p.potential = 10; p.value = 0; p.salary = 0; p.onTransferList = false;
        }
      });
      // Compatibilidade saves antigos: garantir todos os slots de staff existem
      if (!this.coachingStaff) this.coachingStaff = {};
      ['assistente','preparadorFisico','analistaTatico','medico','olheiro','gestorContratos'].forEach(k => {
        if (!(k in this.coachingStaff)) this.coachingStaff[k] = null;
      });
      this.initialized = true;
      return true;
    } catch(e) { console.error('Erro ao carregar save:', e); return false; }
  }

  // ── PATROCÍNIOS ──────────────────────────────────────────────
  generateSponsors() {
    const team = this.teams[this.playerTeamId];
    if (!team) return;
    const rep = team?.reputation || 75;
    const st  = team?.standing || {};
    const pos = this.getLeagueStandings(team?.league).findIndex(t => t.id === this.playerTeamId) + 1 || 8;
    const totalTeams = this.leagues[team?.league]?.teams?.length || 8;

    // Relevância real: posição relativa na liga (1º = máx, último = mín) + reputação
    const posScore = Math.max(0, (totalTeams - pos)) / Math.max(1, totalTeams - 1); // 0-1
    const repScore = (rep - 60) / 40; // 0-1
    const winRate  = st.played > 0 ? st.w / st.played : 0;
    // Relevância: 1-10, fortemente atrelada ao desempenho atual
    const relevance = Math.max(1, Math.min(10, Math.round(
      posScore * 4 + repScore * 3 + winRate * 3
    )));

    // Valores BASE aumentados — patrocínio é renda complementar relevante
    const SPONSORS = [
      { id:'sp_kit',     name:'SportKit Pro',  type:'Equipamentos',  icon:'👕', baseValue:  50_000, minRel:1 },
      { id:'sp_energy',  name:'TurboEnergy',   type:'Bebidas',       icon:'⚡', baseValue:  90_000, minRel:2 },
      { id:'sp_bank',    name:'Banco Futuro',  type:'Financeiro',    icon:'🏦', baseValue: 150_000, minRel:3 },
      { id:'sp_tech',    name:'TechPlay',      type:'Tecnologia',    icon:'💻', baseValue: 220_000, minRel:4 },
      { id:'sp_auto',    name:'MotorFast',     type:'Automóveis',    icon:'🚗', baseValue: 320_000, minRel:5 },
      { id:'sp_airline', name:'AeroFutsal',    type:'Aviação',       icon:'✈️', baseValue: 480_000, minRel:6 },
      { id:'sp_media',   name:'FutsalTV',      type:'Mídia',         icon:'📺', baseValue: 700_000, minRel:7 },
      { id:'sp_global',  name:'GlobalSport',   type:'Internacional', icon:'🌍', baseValue:1_100_000, minRel:8 },
    ];

    const activeIds = new Set((this.sponsorContracts || []).map(c => c.sponsorId));
    const eligible  = SPONSORS.filter(s => s.minRel <= relevance && !activeIds.has(s.id));
    // 4 ofertas visíveis, máx 3 contratos ativos
    const picks = eligible.sort(() => Math.random() - 0.5).slice(0, 4);
    this.availableSponsors = picks.map(s => ({
      ...s,
      offeredValue: Math.round(s.baseValue * (0.85 + relevance * 0.05) * (0.9 + Math.random() * 0.2)),
      durationYears: Math.random() < 0.5 ? 1 : 2,
    }));
  }

  signSponsor(sponsorId) {
    const offer = (this.availableSponsors || []).find(s => s.id === sponsorId);
    if (!offer) return false;
    if (!this.sponsorContracts) this.sponsorContracts = [];
    // Máximo 3 contratos ativos simultaneamente
    if (this.sponsorContracts.length >= 3) return false;
    this.sponsorContracts.push({
      sponsorId: offer.id,
      name:      offer.name,
      type:      offer.type,
      icon:      offer.icon,
      value:     offer.offeredValue,
      durationWeeks: offer.durationYears * 14,
      weeksLeft: offer.durationYears * 14,
    });
    this.availableSponsors = this.availableSponsors.filter(s => s.id !== sponsorId);
    this.news.unshift({ date:`Semana ${this.currentWeek}`, type:'patrocinio', text:`✍️ Patrocínio fechado com ${offer.name}! +${this.fmt(offer.offeredValue)}/sem` });
    return true;
  }

  cancelSponsor(sponsorId) {
    if (!this.sponsorContracts) return;
    this.sponsorContracts = this.sponsorContracts.filter(c => c.sponsorId !== sponsorId);
  }

  _processSponsorPayments() {
    if (!this.sponsorContracts) { this.sponsorContracts = []; return; }
    let total = 0;
    this.sponsorContracts = this.sponsorContracts.filter(c => {
      total += c.value;
      c.weeksLeft--;
      if (c.weeksLeft <= 0) {
        this.news.unshift({ date:`Semana ${this.currentWeek}`, type:'patrocinio', text:`📋 Contrato com ${c.name} encerrado.` });
        return false;
      }
      return true;
    });
    if (total > 0) {
      this.budget = Math.round(this.budget + total);
      const team = this.teams[this.playerTeamId];
      if (team) team.budget = this.budget;
      this.news.unshift({ date:`Semana ${this.currentWeek}`, type:'patrocinio', text:`💼 Patrocínios recebidos: ${this.fmt(total)}` });
    }
  }

  // ── RENOVAÇÃO E APOSENTADORIA ─────────────────────────────────
  renewContract(playerId, years) {
    const p = this.players[playerId];
    if (!p || p.teamId !== this.playerTeamId) return { ok:false, msg:'Jogador não encontrado' };
    if (p.age >= 36) return { ok:false, msg:`${p.name} está perto da aposentadoria` };
    const raise = p.age <= 26 ? 0.15 : p.age <= 30 ? 0.08 : 0.03;
    const newSalary = Math.round(p.salary * (1 + raise));
    const cost = Math.round(newSalary * 0.5); // bônus de assinatura
    if (this.budget < cost) return { ok:false, msg:`Orçamento insuficiente (bônus: ${this.fmt(cost)})` };
    p.contractYears = years || 2;
    p.salary = newSalary;
    this.budget -= cost;
    const team = this.teams[this.playerTeamId];
    if (team) team.budget = this.budget;
    this.news.unshift({ date:`Semana ${this.currentWeek}`, type:'transferencia', text:`✍️ ${p.name} renovou por ${p.contractYears} ano(s). Salário: ${this.fmt(newSalary)}/mês` });
    return { ok:true, msg:`Renovado! Novo salário: ${this.fmt(newSalary)}/mês` };
  }

  // Aposentadoria — chamada APENAS pelo sistema automático (careerSystems / _processContractExpirations)
  // O jogador decide se aposenta, não o técnico
  _retirePlayerInternal(playerId) {
    const p = this.players[playerId];
    if (!p) return false;
    const team = this.teams[p.teamId];
    if (team) team.players = team.players.filter(id => id !== playerId);
    if (p.teamId === this.playerTeamId) {
      this.squad = (this.squad || []).filter(id => id !== playerId);
    }
    p.retired = true;
    p.teamId = null;
    this.transferMarket = this.transferMarket.filter(x => x.id !== playerId);
    this.news.unshift({ date:`Semana ${this.currentWeek}`, type:'aposentadoria', text:`🎖️ ${p.name} anunciou sua aposentadoria do futsal profissional!` });
    return true;
  }

  // Mantido para compatibilidade com careerSystems mas não expõe para UI
  retirePlayer(playerId) { return this._retirePlayerInternal(playerId); }

  _processContractExpirations() {
    // Notifica o jogador e o coloca à disposição de dispensar
    this.getPlayerPlayers().forEach(p => {
      if (p.contractYears <= 0 && !p._contractExpiredNotified) {
        p._contractExpiredNotified = true;
        this.news.unshift({ date:`Semana ${this.currentWeek}`, type:'alerta', text:`⚠️ Contrato de ${p.name} encerrado — renove ou dispense!` });
      }
      // Aposentadoria automática de jogadores muito velhos
      if (p.age >= 38 && !p.retired && Math.random() < 0.4) {
        this.retirePlayer(p.id);
      }
    });
  }

  // ── WORLD CUP ────────────────────────────────────────────────
  initWorldCup() {
    const leagueIds = Object.keys(this.leagues).filter(id => id !== 'lpf');
    const qualified = [];
    leagueIds.forEach(lid => {
      const st = this.getLeagueStandings(lid);
      if (st.length >= 1) qualified.push(st[0].id);
      if (st.length >= 2) qualified.push(st[1].id);
    });
    while (qualified.length < 8 && qualified.length > 0) {
      qualified.push(qualified[Math.floor(Math.random() * qualified.length)]);
    }
    const shuffled = [...qualified].sort(() => Math.random() - 0.5);
    const qf = [];
    for (let i = 0; i < 8; i += 2) {
      qf.push({ id: `wc_qf_${i/2}`, home: shuffled[i], away: shuffled[i+1] || shuffled[0], played: false, result: null, winner: null, loser: null });
    }
    this.worldCup = {
      season: this.season,
      phase: 'quarterfinals',
      teams: [...qualified],
      bracket: { quarterfinals: qf, semifinals: [], final: [] },
      champion: null,
      playerQualified: qualified.includes(this.playerTeamId),
      playerEliminated: !qualified.includes(this.playerTeamId),
      prize: { winner: 10_000_000, runnerUp: 5_000_000, semi: 2_500_000, quarter: 1_000_000 },
    };
    return this.worldCup;
  }

  processWorldCupMatchResult(matchId, phase, result) {
    const wc = this.worldCup;
    if (!wc) return null;
    const matches = wc.bracket[phase];
    if (!matches) return null;
    const m = matches.find(x => x.id === matchId);
    if (!m || m.played) return null;
    m.played = true;
    m.result = result;
    const hw = result.score.home, aw = result.score.away;
    m.winner = hw > aw ? m.home : aw > hw ? m.away : (Math.random() < 0.5 ? m.home : m.away);
    m.loser  = m.winner === m.home ? m.away : m.home;
    m.penalties = hw === aw;
    if (wc.playerQualified && !wc.playerEliminated) {
      const involved = m.home === this.playerTeamId || m.away === this.playerTeamId;
      if (involved && m.loser === this.playerTeamId) {
        wc.playerEliminated = true;
        const exitPrize = { quarterfinals: wc.prize.quarter, semifinals: wc.prize.semi }[phase] || 0;
        if (exitPrize) { this.budget += exitPrize; if (this.teams[this.playerTeamId]) this.teams[this.playerTeamId].budget = this.budget; }
      }
    }
    return m;
  }

  advanceWorldCupPhase() {
    const wc = this.worldCup;
    if (!wc) return false;
    const matches = wc.bracket[wc.phase];
    if (!matches || !matches.every(m => m.played)) return false;
    const winners = matches.map(m => m.winner).filter(Boolean);
    if (wc.phase === 'quarterfinals') {
      const sf = [];
      for (let i = 0; i < winners.length; i += 2) {
        sf.push({ id: `wc_sf_${i/2}`, home: winners[i], away: winners[i+1] || winners[0], played: false, result: null, winner: null, loser: null });
      }
      wc.bracket.semifinals = sf;
      wc.phase = 'semifinals';
    } else if (wc.phase === 'semifinals') {
      wc.bracket.final = [{ id: 'wc_final', home: winners[0], away: winners[1] || winners[0], played: false, result: null, winner: null, loser: null }];
      wc.phase = 'final';
    } else if (wc.phase === 'final') {
      const fm = matches[0];
      wc.champion = fm.winner;
      wc.phase = 'done';
      if (fm.winner === this.playerTeamId) { this.budget += wc.prize.winner; if (this.teams[this.playerTeamId]) this.teams[this.playerTeamId].budget = this.budget; }
      else if (fm.loser === this.playerTeamId) { this.budget += wc.prize.runnerUp; if (this.teams[this.playerTeamId]) this.teams[this.playerTeamId].budget = this.budget; }
      this.worldCupHistory.push({ season: wc.season, champion: wc.champion, championName: this.teams[wc.champion]?.name || '-', isChampion: wc.champion === this.playerTeamId, qualified: wc.playerQualified });
    }
    return true;
  }

  simAllWorldCupPhase() {
    const ai = new AIManager(this);
    const wc = this.worldCup;
    if (!wc) return;
    const matches = wc.bracket[wc.phase] || [];
    matches.filter(m => !m.played).forEach(m => {
      const ht = this.teams[m.home], at = this.teams[m.away];
      if (!ht || !at) return;
      const hs = ai.pickSquad(m.home), as_ = ai.pickSquad(m.away);
      const engine = new MatchEngine(ht, at, hs, as_, ai.chooseTactics(m.home), ai.chooseTactics(m.away));
      this.processWorldCupMatchResult(m.id, wc.phase, engine.simulate());
    });
  }

  // ── UTIL ─────────────────────────────────────────────────────
  fmt(n) {
    if (!n || isNaN(n)) return 'R$0';
    const abs = Math.abs(n);
    if (abs >= 1_000_000) return 'R$' + (n / 1_000_000).toFixed(abs >= 10_000_000 ? 0 : 1) + 'M';
    if (abs >= 1_000)     return 'R$' + Math.round(n / 1_000) + 'K';
    return 'R$' + Math.round(n);
  }
}

window.GameState = GameState;
console.log('✅ gameState.js v10 — Finanças corrigidas, inflação removida, ranking/torneio global, save completo');
