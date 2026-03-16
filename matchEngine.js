// ============================================================
// FUTSAL MANAGER — MATCH ENGINE v5 (Motor Realista)
// ============================================================
class MatchEngine {
  constructor(homeTeam, awayTeam, homePlayers, awayPlayers, homeFormation, awayFormation) {
    this.home = homeTeam; this.away = awayTeam;
    this.homePlayers = (homePlayers||[]).filter(Boolean);
    this.awayPlayers = (awayPlayers||[]).filter(Boolean);
    this.homeFormation = homeFormation||{tipo:'1-2-1-1',powerPlay:false,goleirolinha:false,style:'equilibrado',pressao:5,ritmo:5};
    this.awayFormation = awayFormation||{tipo:'1-2-1-1',powerPlay:false,goleirolinha:false,style:'equilibrado',pressao:5,ritmo:5};
    this.score={home:0,away:0}; this.events=[]; this.minute=0;
    this.homeFouls=0; this.awayFouls=0; this.period=1;
    this.stats={
      home:{shots:0,shotsOnTarget:0,possession:50,fouls:0,corners:0,saves:0,attacks:0,yellowCards:0,redCards:0},
      away:{shots:0,shotsOnTarget:0,possession:50,fouls:0,corners:0,saves:0,attacks:0,yellowCards:0,redCards:0},
    };
    this._homeStamina=1.0; this._awayStamina=1.0;
    this._homeRed=0; this._awayRed=0;
  }

  teamStrength(players, formation, isHome, stamina=1.0) {
    if (!players||!players.length) return 60;
    const expulsions = isHome ? this._homeRed : this._awayRed;
    const active = players.slice(0, Math.max(3, 5-expulsions));
    const avg = active.reduce((a,p)=>a+(p.overall||70),0)/active.length;
    const morale  = active.reduce((a,p)=>a+(p.morale||75),0)/active.length;
    const fitness = active.reduce((a,p)=>a+(p.fitness||85),0)/active.length;
    // Forma recente
    const team = isHome ? this.home : this.away;
    const form = team?.form||[];
    const formPts = form.slice(0,5).reduce((a,f)=>a+(f==='W'?3:f==='D'?1:0),0);
    const formBonus = (formPts-7.5)*0.2;
    // Vantagem em casa
    const homeAdv = isHome ? 2.5 : 0;
    // Tática
    const tac = formation||{};
    let tacBonus = 0;
    if(tac.style==='ofensivo') tacBonus+=2;
    if(tac.style==='defensivo') tacBonus-=1;
    if(tac.goleirolinha) tacBonus+=6;
    tacBonus+=((tac.pressao||5)-5)*0.3;
    const moraleBonus=(morale-75)*0.12;
    const fitnessBonus=(fitness-85)*0.06;
    return Math.max(40,Math.round((avg+moraleBonus+fitnessBonus+homeAdv+tacBonus+formBonus)*(0.85+stamina*0.15)));
  }

  pickScorer(players) {
    const weighted=[];
    players.forEach(p=>{
      const w=p.position==='PÍV'?4:p.position==='ALA'?3:p.position==='FIX'?1:0.1;
      const ovr=Math.floor((p.overall||65)/15);
      for(let i=0;i<Math.round(w*ovr);i++) weighted.push(p);
    });
    return weighted.length?weighted[Math.floor(Math.random()*weighted.length)]:players[0];
  }

  pickAssister(players, scorerId) {
    const eligible=players.filter(p=>p.id!==scorerId);
    if(!eligible.length||Math.random()>0.65) return null;
    const weighted=[];
    eligible.forEach(p=>{
      const w=p.position==='ALA'?3:p.position==='FIX'?2:p.position==='PÍV'?2:p.position==='GL'?0.1:1;
      for(let i=0;i<Math.round(w*5);i++) weighted.push(p);
    });
    return weighted.length?weighted[Math.floor(Math.random()*weighted.length)]:null;
  }

  pickPlayer(players,position) {
    if(!players||!players.length) return null;
    if(position){const f=players.filter(p=>p.position===position);if(f.length)return f[Math.floor(Math.random()*f.length)];}
    return players[Math.floor(Math.random()*players.length)];
  }

  addEvent(type,minute,team,player,extra) {
    const ev={type,minute,team,player:player?{id:player.id,name:player.name,position:player.position}:null,extra,score:{...this.score}};
    this.events.push(ev); return ev;
  }

  rand(min,max){return Math.floor(Math.random()*(max-min+1))+min;}

  resolveAttack(attackingTeam, min, attackStr, defStr) {
    const atk=attackingTeam==='home'?this.homePlayers:this.awayPlayers;
    const def=attackingTeam==='home'?this.awayPlayers:this.homePlayers;
    const defSide=attackingTeam==='home'?'away':'home';
    if(!atk.length) return;
    const tac=attackingTeam==='home'?this.homeFormation:this.awayFormation;
    const styleBonus=tac.style==='ofensivo'?0.07:tac.style==='posse'?0.04:0;
    const ratio=attackStr/Math.max(1,attackStr+defStr);
    const shootChance=Math.min(0.68,0.25+ratio*0.52+styleBonus);
    if(Math.random()>shootChance) return;
    this.stats[attackingTeam].shots++;
    const onTargetChance=0.40+ratio*0.30;
    if(Math.random()>onTargetChance) return;
    this.stats[attackingTeam].shotsOnTarget++;
    const diff=attackStr-defStr;
    const goalChance=Math.max(0.08,Math.min(0.45,0.22+diff/160));
    if(Math.random()<goalChance){
      const scorer=this.pickScorer(atk);
      const assister=this.pickAssister(atk,scorer?.id);
      this.score[attackingTeam]++;
      if(scorer){scorer.goals=(scorer.goals||0)+1;scorer.appearances=(scorer.appearances||0)+1;}
      if(assister){assister.assists=(assister.assists||0)+1;}
      const methods=['chute_colocado','contra_ataque','passe_filtrado','bola_parada','gol_de_placa','finalização_classe'];
      this.addEvent('goal',min,attackingTeam,scorer,{assister:assister?{id:assister.id,name:assister.name}:null,method:methods[Math.floor(Math.random()*methods.length)]});
    } else {
      this.stats[defSide].saves++;
      const gk=def.find(p=>p.position==='GL')||def[0];
      if(gk&&Math.random()<0.35) this.addEvent('save',min,defSide,gk,null);
    }
  }

  simulatePeriod(periodNum) {
    const startMin=periodNum===1?1:21;
    const endMin=periodNum===1?20:40;
    for(let min=startMin;min<=endMin;min++){
      this.minute=min;
      const staminaDrop=periodNum===2?0.012:0.006;
      this._homeStamina=Math.max(0.7,this._homeStamina-staminaDrop);
      this._awayStamina=Math.max(0.7,this._awayStamina-staminaDrop);
      const homeStr=this.teamStrength(this.homePlayers,this.homeFormation,true,this._homeStamina);
      const awayStr=this.teamStrength(this.awayPlayers,this.awayFormation,false,this._awayStamina);
      const totalStr=homeStr+awayStr;
      const homePoss=Math.round((homeStr/Math.max(1,totalStr))*100);
      this.stats.home.possession=Math.round((this.stats.home.possession+homePoss)/2);
      this.stats.away.possession=100-this.stats.home.possession;
      const hp=(this.homeFormation.pressao||5)/10;
      const ap=(this.awayFormation.pressao||5)/10;
      const homeAtk=(homeStr/Math.max(1,totalStr))*0.50+hp*0.12+Math.random()*0.22;
      const awayAtk=(awayStr/Math.max(1,totalStr))*0.50+ap*0.12+Math.random()*0.22;
      if(homeAtk>0.38){this.stats.home.attacks++;this.resolveAttack('home',min,homeStr,awayStr);}
      if(awayAtk>0.38){this.stats.away.attacks++;this.resolveAttack('away',min,awayStr,homeStr);}
      // Faltas
      if(Math.random()<0.09){
        const isHome=Math.random()<0.5;
        const side=isHome?'home':'away';
        const other=isHome?'away':'home';
        const foulers=isHome?this.homePlayers:this.awayPlayers;
        const p=this.pickPlayer(foulers,'FIX')||this.pickPlayer(foulers);
        if(isHome)this.homeFouls++;else this.awayFouls++;
        this.stats[side].fouls++;
        if(Math.random()<0.18&&p){
          p.yellowCards=(p.yellowCards||0)+1;
          this.stats[side].yellowCards++;
          this.addEvent('yellow',min,side,p,null);
        } else if(Math.random()<0.02&&p){
          p.redCards=(p.redCards||0)+1;
          this.stats[side].redCards++;
          if(isHome)this._homeRed++;else this._awayRed++;
          this.addEvent('red',min,side,p,{reason:'falta_grave'});
        } else {
          this.addEvent('foul',min,side,p,null);
        }
        const fouls=isHome?this.homeFouls:this.awayFouls;
        if(fouls>=5&&Math.random()<0.20){
          const scorers=isHome?this.awayPlayers:this.homePlayers;
          const scorer=this.pickScorer(scorers);
          if(scorer){this.score[other]++;scorer.goals=(scorer.goals||0)+1;this.addEvent('goal',min,other,scorer,{method:'10_metros',penaltyKick:true});}
        }
      }
      // Lesão
      if(Math.random()<0.012){
        const isHome=Math.random()<0.5;
        const players=isHome?this.homePlayers:this.awayPlayers;
        const p=this.pickPlayer(players);
        if(p){p.injured=true;p.injuryDays=this.rand(2,14);this.addEvent('injury',min,isHome?'home':'away',p,null);}
      }
      // Goleiro-linha no 2º período
      if(periodNum===2&&min>=30){
        if(this.score.home<this.score.away&&!this.homeFormation.goleirolinha&&Math.random()<0.08){
          this.homeFormation.goleirolinha=true;this.addEvent('powerplay',min,'home',null,{team:'home'});
          if(Math.random()<0.35)this.resolveAttack('home',min,homeStr*1.25,awayStr*0.85);
          if(Math.random()<0.28)this.resolveAttack('away',min,awayStr*1.30,homeStr*0.75);
        }
      }
    }
    this.addEvent('period_end',endMin,null,null,{period:periodNum,score:{...this.score}});
  }

  simulate() {
    this.addEvent('kickoff',0,null,null,{home:this.home?.name,away:this.away?.name});
    this.simulatePeriod(1);
    this.simulatePeriod(2);
    [...this.homePlayers,...this.awayPlayers].forEach(p=>{if(p)p.appearances=(p.appearances||0)+1;});
    const updateForm=(team,won,draw)=>{if(!team)return;team.form=[won?'W':draw?'D':'L',...(team.form||[])].slice(0,5);};
    const homeWon=this.score.home>this.score.away;
    const draw=this.score.home===this.score.away;
    updateForm(this.home,homeWon,draw);
    updateForm(this.away,!homeWon&&!draw,draw);
    return {score:this.score,events:this.events,stats:this.stats,homeFouls:this.homeFouls,awayFouls:this.awayFouls};
  }
}
window.MatchEngine=MatchEngine;
console.log('✅ matchEngine.js v5 — Stamina, vantagem em casa, vermelho, forma recente');
