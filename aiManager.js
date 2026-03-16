// ============================================================
// FUTSAL MANAGER — AI MANAGER v4 (Gerenciamento Completo)
// Cada time da IA se gerencia como um clube real:
//   · Elenco: compra, vende, renova, dispensa
//   · Staff: simula benefícios de comissão técnica
//   · Jovens: contrata da academia interna
//   · Morale: ajusta após resultados
//   · Reputação: sobe/desce com desempenho
//   · Orçamento: receitas e despesas reais
//   · Táticas: adaptativas ao elenco e situação
// ============================================================

class AIManager {
  constructor(gs) { this.gs = gs; }

  _calcOvr(p) {
    if (window.calcOvr && p.attrs) return window.calcOvr(p.attrs, p.position);
    return p.overall || 65;
  }

  // ── TÁTICAS ADAPTATIVAS ────────────────────────────────────────
  chooseTactics(teamId) {
    const team    = this.gs.teams[teamId];
    const players = this.gs.getTeamPlayers(teamId).filter(p => !p.injured && !p.retired);
    const tac     = { tipo:'1-2-1-1', powerPlay:false, goleirolinha:false, style:'equilibrado', pressao:5, ritmo:5 };
    if (!team || players.length === 0) return tac;

    const s       = team.standing || {};
    const avgOvr  = players.reduce((a, p) => a + (p.overall || 65), 0) / players.length;
    const rep     = team.reputation || 75;
    const winRate = s.played > 0 ? s.w / s.played : 0.5;
    const hasPiv  = players.some(p => p.position === 'PÍV' && p.overall >= 74);
    const fastAlas= players.filter(p => p.position === 'ALA' && (p.attrs?.velocidade || 70) >= 76).length >= 2;

    if (rep >= 92 || avgOvr >= 83) tac.tipo = '1-2-2-0';
    else if (hasPiv && !fastAlas)  tac.tipo = '1-2-1-1';
    else if (fastAlas)             tac.tipo = '1-1-2-1';
    else if (winRate < 0.33)       tac.tipo = '1-3-1-0';

    if (winRate < 0.30 && s.played >= 2) tac.style = 'ofensivo';
    else if (winRate > 0.70 && avgOvr >= 78) tac.style = 'posse';
    else if (rep < 80) tac.style = 'defensivo';
    else tac.style = 'equilibrado';

    tac.pressao = tac.style === 'ofensivo' ? 8 : tac.style === 'defensivo' ? 3 : 5;
    tac.ritmo   = avgOvr >= 80 ? 7 : 5;
    return tac;
  }

  // ── MELHOR 5 (com fallback por posição) ───────────────────────
  pickSquad(teamId) {
    const players = this.gs.getTeamPlayers(teamId)
      .filter(p => !p.injured && !p.retired)
      .filter(p => !(p.suspendedGames > 0));
    if (players.length === 0) return this.gs.getTeamPlayers(teamId).filter(p=>!p.retired).slice(0, 5);

    const tac   = this.chooseTactics(teamId);
    const slots = {
      '1-2-1-1': ['GL','FIX','FIX','ALA','PÍV'],
      '1-1-2-1': ['GL','FIX','ALA','ALA','PÍV'],
      '1-2-2-0': ['GL','FIX','FIX','ALA','ALA'],
      '1-3-1-0': ['GL','FIX','FIX','FIX','ALA'],
      '1-0-3-1': ['GL','ALA','ALA','ALA','PÍV'],
    }[tac.tipo] || ['GL','FIX','ALA','ALA','PÍV'];

    const score = p => (p.overall||65) + ((p.fitness||85)-85)*0.1 + ((p.morale||75)-75)*0.05;
    const byPos = pos => players.filter(p=>p.position===pos).sort((a,b)=>score(b)-score(a));
    const pools = { GL:byPos('GL'), FIX:byPos('FIX'), ALA:byPos('ALA'), 'PÍV':byPos('PÍV') };

    const used = new Set(), squad = [];
    for (const role of slots) {
      const pick = (pools[role]||[]).find(p=>!used.has(p.id))
        ?? players.filter(p=>!used.has(p.id)).sort((a,b)=>score(b)-score(a))[0];
      if (pick) { squad.push(pick); used.add(pick.id); }
    }
    return squad.slice(0, 5);
  }

  // ── STAFF VIRTUAL DA IA ────────────────────────────────────────
  // Times de IA têm staff virtual baseado em reputação — não custa nada
  // mas afeta os bônus internos de desenvolvimento e recuperação
  _getAIStaffLevel(teamId) {
    const rep = this.gs.teams[teamId]?.reputation || 75;
    return {
      assistente:      rep >= 85 ? 3 : rep >= 75 ? 2 : 1,
      preparadorFisico:rep >= 90 ? 3 : rep >= 80 ? 2 : 1,
      analistaTatico:  rep >= 88 ? 3 : rep >= 78 ? 2 : 1,
      medico:          rep >= 82 ? 2 : 1,
      olheiro:         rep >= 80 ? 2 : 1,
    };
  }

  // ── RECEITA DA IA ─────────────────────────────────────────────
  // Simula receita semanal de cada time da IA (bilheteria + patrocínio proporcional)
  _processAIRevenue(teamId, week) {
    const team = this.gs.teams[teamId];
    if (!team) return;
    const rep = team.reputation || 75;
    const cap = team.capacity || 10000;
    const occ = 0.35 + (rep/100) * 0.45 + Math.random()*0.05;
    const ticket = 25 + (rep * 0.9);
    const ticketRev = Math.round(cap * occ * ticket / 2); // dividido pelas semanas da temporada

    // Patrocínio semanal proporcional à reputação
    const sponsorRev = Math.round((rep/100) * (team.budget||1000000) * 0.006);

    team.budget = Math.round((team.budget||0) + ticketRev + sponsorRev);
  }

  // ── DESPESAS DA IA ────────────────────────────────────────────
  _processAIExpenses(teamId, week) {
    if (week % 4 !== 0) return;
    const team = this.gs.teams[teamId];
    if (!team) return;
    const players = this.gs.getTeamPlayers(teamId).filter(p=>!p.retired);
    const totalSalary = players.reduce((a,p) => a+(p.salary||0), 0);
    // Staff virtual tem custo reduzido
    const staffCost = Math.round((team.reputation||75) * 1200);
    team.budget = Math.max(1_000_000, Math.round((team.budget||0) - totalSalary - staffCost));
  }

  // ── DESENVOLVIMENTO DE JOGADORES DA IA ───────────────────────
  developPlayers(teamId) {
    const players = this.gs.getTeamPlayers(teamId).filter(p=>!p.retired);
    const staff = this._getAIStaffLevel(teamId);
    const keyAttrs = {
      GL:  ['reflexos','defesaGK','posicionamento','decisoes','concentracao'],
      FIX: ['marcacao','interceptacao','desarme','posicionamento','passe'],
      ALA: ['velocidade','drible','finalizacao','passe','criatividade'],
    };
    keyAttrs['PÍV'] = ['finalizacao','forca','controle','posicionamento','decisoes'];

    players.forEach(p => {
      if (!p.attrs) return;
      // Crescimento jovens — melhorado com olheiro bom
      const growChance = p.age <= 24 ? (0.15 + staff.olheiro * 0.03) : 0;
      if (growChance > 0 && p.potential > p.overall && Math.random() < growChance) {
        const keys = keyAttrs[p.position] || keyAttrs['ALA'];
        const key  = keys[Math.floor(Math.random() * keys.length)];
        if (p.attrs[key] !== undefined) {
          p.attrs[key] = Math.min(99, p.attrs[key] + 1);
          const newOvr = this._calcOvr(p);
          p.overall = Math.min(p.potential, Math.max(p.overall, newOvr));
        }
      }
      // Declínio veteranos — reduzido com bom preparador físico
      if (p.age >= 33) {
        const declineChance = Math.max(0.01, 0.06 - staff.preparadorFisico * 0.01);
        if (Math.random() < declineChance) {
          const k = ['velocidade','resistencia','agilidade'][Math.floor(Math.random() * 3)];
          if (p.attrs[k] !== undefined) {
            p.attrs[k] = Math.max(30, p.attrs[k] - 1);
            p.overall = Math.min(p.overall, Math.max(40, this._calcOvr(p)));
          }
        }
      }
    });
  }

  // ── MORAL APÓS RESULTADO ──────────────────────────────────────
  _updateMorale(teamId, won, draw) {
    const players = this.gs.getTeamPlayers(teamId).filter(p=>!p.retired);
    players.forEach(p => {
      const change = won ? Math.floor(Math.random()*6+3) : draw ? Math.floor(Math.random()*3) : -(Math.floor(Math.random()*6+2));
      p.morale = Math.max(20, Math.min(99, (p.morale||75) + change));
    });
  }

  // ── REPUTAÇÃO DINÂMICA ────────────────────────────────────────
  _updateReputation(teamId) {
    const team = this.gs.teams[teamId];
    if (!team) return;
    const s = team.standing || {};
    const winRate = s.played > 0 ? s.w / s.played : 0.5;
    // Reputação oscila suavemente com o desempenho
    const target = 60 + winRate * 40;
    team.reputation = Math.round((team.reputation||75) * 0.97 + target * 0.03);
    team.reputation = Math.max(50, Math.min(99, team.reputation));
  }

  // ── GESTÃO DE CONTRATO ────────────────────────────────────────
  processContracts(teamId) {
    const team    = this.gs.teams[teamId];
    const news    = [];
    if (!team) return news;
    const staff   = this._getAIStaffLevel(teamId);
    const players = this.gs.getTeamPlayers(teamId).filter(p => !p.retired);
    const avgOvr  = players.length ? players.reduce((a,p)=>a+(p.overall||65),0)/players.length : 65;

    players.forEach(p => {
      p.contractYears = Math.max(0, (p.contractYears||1) - 0); // just read

      // Decidir por contrato expirando
      if ((p.contractYears||0) <= 1) {
        const isYoung     = p.age <= 24 && (p.potential||p.overall) >= 72;
        const isGood      = p.overall >= 68;
        const isVet       = p.age >= 34;
        const isSuperVet  = p.age >= 37;

        if (isSuperVet || (isVet && p.overall < avgOvr - 5)) {
          // Veterano fraco ou muito velho: liberar
          team.players = (team.players||[]).filter(id => id !== p.id);
          p.teamId = null;
          p.onTransferList = false;
          news.push(`${team.name} dispensa ${p.name} (${p.age}a)`);
        } else if (isGood || isYoung) {
          const dur   = isYoung ? 3 : isVet ? 1 : 2 + Math.floor(Math.random()*2);
          const raise = isYoung ? 1.18 : p.overall>=80 ? 1.15 : 1.08;
          p.contractYears = dur;
          p.salary = Math.round((p.salary||10000) * raise);
        } else {
          // Fraco — liberar ao mercado
          team.players = (team.players||[]).filter(id => id !== p.id);
          p.teamId = null;
          if (!this.gs.transferMarket.find(x=>x.id===p.id)) this.gs.transferMarket.push(p);
        }
      }

      // Contrato normal: checar se está velho demais e substituir proativamente
      if (p.age >= 35 && Math.random() < 0.08) {
        p.onTransferList = true;
        if (!this.gs.transferMarket.find(x=>x.id===p.id)) this.gs.transferMarket.push(p);
      }
    });

    // Após liberar, recompor o elenco se necessário
    const activeNow = this.gs.getTeamPlayers(teamId).filter(p=>!p.retired&&!p.injured).length;
    if (activeNow < 10) {
      const needed = 12 - activeNow;
      for (let i=0; i<needed; i++) this._generateYouthForTeam(teamId);
    }

    return news;
  }

  // ── TRANSFERÊNCIAS COMPLETAS ──────────────────────────────────
  processTransfers(teamId) {
    const team   = this.gs.teams[teamId];
    const news   = [];
    if (!team) return news;
    const budget  = team.budget || 0;
    const staff   = this._getAIStaffLevel(teamId);
    const players = this.gs.getTeamPlayers(teamId).filter(p=>!p.retired);

    // 1. LISTAR PARA VENDA: excesso por posição, veteranos, fracos
    const byPos = {};
    players.forEach(p => { (byPos[p.position]=byPos[p.position]||[]).push(p); });
    Object.entries(byPos).forEach(([pos, posPlayers]) => {
      posPlayers.sort((a,b)=>b.overall-a.overall);
      // Excesso de jogadores na posição
      if (posPlayers.length > 3) {
        const weakest = posPlayers[posPlayers.length-1];
        if (!weakest.onTransferList && Math.random() < 0.4 && weakest.overall < 74) {
          weakest.onTransferList = true;
          if (!this.gs.transferMarket.find(p=>p.id===weakest.id)) this.gs.transferMarket.push(weakest);
          news.push(`${team.name} lista ${weakest.name} (${weakest.position}) à venda`);
        }
      }
    });
    // Veteranos 35+ fracos
    players.filter(p => p.age >= 35 && p.overall < 74 && !p.onTransferList).forEach(p => {
      if (Math.random() < 0.25) {
        p.onTransferList = true;
        if (!this.gs.transferMarket.find(x=>x.id===p.id)) this.gs.transferMarket.push(p);
        news.push(`${team.name} libera veterano ${p.name} (${p.age}a)`);
      }
    });

    // 2. COMPRAR: preencher posições deficientes E substituir velhos
    if (budget > 200_000) {
      const avgOvr  = players.length ? players.reduce((a,p)=>a+(p.overall||65),0)/players.length : 65;
      const oldCount = players.filter(p=>p.age>=33).length;
      const youngCount = players.filter(p=>p.age<=22).length;

      // Posições carentes
      const posNeeded = ['GL','FIX','ALA','PÍV'].filter(pos => {
        const av = players.filter(p=>p.position===pos&&!p.injured&&!p.retired);
        return av.length < 2 || (av[0]?.overall||0) < avgOvr - 8;
      });

      // Também tenta buscar jovens se o elenco está envelhecido
      const wantsYouth = oldCount >= 4 && youngCount < 2;

      for (const pos of [...posNeeded, ...(wantsYouth?['ALA','PÍV']:[])].slice(0,3)) {
        const maxSpend = Math.round(budget * 0.22);
        const candidates = this.gs.transferMarket.filter(p =>
          p.position===pos && p.teamId!==teamId && !p.retired &&
          (p.value||0)<=maxSpend &&
          (p.overall||0)>=Math.max(55, avgOvr-6)
        ).sort((a,b)=>b.overall-a.overall);

        if (candidates.length>0 && Math.random()<0.55) {
          const target = candidates[0];
          if (this.gs.executeTransfer(target.id, teamId, target.value||0)) {
            news.push(`${team.name} contrata ${target.name} (${target.position}, ${target.overall}⭐)`);
          }
        }
      }
    }

    // 3. Repor elenco com jovens da base se muito curto
    const activeCount = players.filter(p=>!p.injured&&!p.retired).length;
    if (activeCount < 10) {
      const needed = Math.min(3, 12-activeCount);
      for (let i=0;i<needed;i++) this._generateYouthForTeam(teamId);
    }

    return news;
  }

  // ── GERAÇÃO DE JOVEM INTERNO ──────────────────────────────────
  // Times geram jovens da base quando o elenco fica curto
  _generateYouthForTeam(teamId) {
    const team = this.gs.teams[teamId];
    if (!team) return;
    const staff = this._getAIStaffLevel(teamId);
    const rep   = team.reputation || 75;
    const positions = ['GL','FIX','ALA','PÍV','FIX','ALA','ALA','PÍV'];
    const pos = positions[Math.floor(Math.random()*positions.length)];
    const age = 17 + Math.floor(Math.random()*5);
    // Qualidade da base proporcional à reputação e olheiro
    const ovrMin = Math.round(52 + (rep-60)*0.3 + staff.olheiro*1.2);
    const ovr    = Math.max(48, ovrMin + Math.floor(Math.random()*10));
    // Chance de 8% de surgir um talento excepcional (pot > 85)
    const talentRoll = Math.random();
    const potBonus = talentRoll < 0.08 ? 22+Math.floor(Math.random()*8) : 8+Math.floor(Math.random()*16);
    const pot    = Math.min(95, ovr + potBonus);
    const names  = [['Lucas','Pedro','Gabriel','Matheus','Felipe'],['Silva','Santos','Costa','Lima','Pereira']];
    const name   = names[0][Math.floor(Math.random()*5)]+' '+names[1][Math.floor(Math.random()*5)];
    const sal    = Math.round(Math.max(3000,(ovr-50)*450+Math.random()*3000));
    const val    = Math.round(Math.max(50000,(pot-60)*12000+Math.random()*60000));
    const id     = `base_${teamId}_${Date.now()}_${Math.random().toString(36).substr(2,5)}`;

    this.gs.players[id] = {
      id, teamId, name, nationality:'Brasil', age, position:pos,
      overall:ovr, potential:pot, value:val, salary:sal,
      attrs: window.generateAttributes ? window.generateAttributes(ovr,pos) : {},
      morale:80, fitness:95, injured:false, injuryDays:0, injuryGames:0,
      goals:0, assists:0, yellowCards:0, redCards:0, appearances:0,
      contractYears:3+Math.floor(Math.random()*2), onTransferList:false, retired:false,
      form:[7,7,7,7,7], _yellowsThisCycle:0, suspendedGames:0
    };
    team.players.push(id);
  }

  // ── RECUPERAÇÃO DE FITNESS ────────────────────────────────────
  recoverFitness(teamId) {
    const staff   = this._getAIStaffLevel(teamId);
    const base    = 3 + staff.preparadorFisico * 1.5; // 4.5-7.5 por semana
    this.gs.getTeamPlayers(teamId).forEach(p => {
      if (p.retired) return;
      p.fitness = Math.min(100, (p.fitness||85) + Math.round(base + Math.random()*3));
      // Recuperação de lesão
      if (p.injured && p.injuryDays > 0) {
        const healBonus = staff.medico;
        p.injuryDays -= healBonus;
        if (p.injuryDays <= 0) { p.injured = false; p.injuryDays = 0; p.injuryGames = 0; }
      }
    });
  }

  // ── PIPELINE SEMANAL COMPLETO ─────────────────────────────────
  // Substitui o antigo simulateAIRound — agora muito mais rico
  processWeekly(teamId, week) {
    const news = [];
    // Receita e despesas toda semana
    this._processAIRevenue(teamId, week);
    this._processAIExpenses(teamId, week);
    // Desenvolvimento a cada semana
    this.developPlayers(teamId);
    // Recuperação de fitness
    this.recoverFitness(teamId);
    // Transferências a cada 3 semanas
    if (week % 2 === 0) news.push(...(this.processTransfers(teamId)||[])); // a cada 2 semanas
    // Contratos a cada 4 semanas
    if (week % 3 === 0) news.push(...(this.processContracts(teamId)||[])); // a cada 3 semanas
    // Reputação a cada semana (leve ajuste)
    this._updateReputation(teamId);
    return news;
  }

  // ── ATUALIZAR MORAL APÓS PARTIDA ──────────────────────────────
  applyMatchMorale(teamId, scoreHome, scoreAway, isHome) {
    const myScore  = isHome ? scoreHome : scoreAway;
    const oppScore = isHome ? scoreAway : scoreHome;
    this._updateMorale(teamId, myScore > oppScore, myScore === oppScore);
  }
}

window.AIManager = AIManager;
console.log('✅ aiManager.js v4 — Gerenciamento completo de times IA');
