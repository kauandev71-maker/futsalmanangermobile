// FUTSAL MANAGER - DATABASE v4
// Elencos 2025-26 atualizados (fontes: Transfermarkt, Wikipedia, FBref — março 2026)
// Real Madrid (técnico Xabi Alonso), Liverpool (campeão PL), Napoli (campeão Serie A)
// Flamengo+Palmeiras (campeões Brasileirao+Libertadores), Liverpool (campeão PL 24-25)

function generateId() { return Math.random().toString(36).substr(2,9); }
function rand(min, max) { return Math.floor(Math.random()*(max-min+1))+min; }

function calcPotential(ovr, age) {
  if (age<=18) return Math.min(95, ovr+rand(12,20));
  if (age<=20) return Math.min(94, ovr+rand(8,16));
  if (age<=22) return Math.min(92, ovr+rand(5,12));
  if (age<=24) return Math.min(90, ovr+rand(2,8));
  if (age<=26) return Math.min(88, ovr+rand(0,5));
  if (age<=29) return Math.min(87, ovr+rand(0,2));
  return ovr;
}

function generateAttributes(ovr, position) {
  const sp = ovr>=85?7:ovr>=75?9:11;
  const v  = (b=0) => Math.max(30, Math.min(99, ovr+b+rand(-sp,sp)));
  const vh = (b=0) => Math.max(35, Math.min(99, ovr+b+rand(-sp+2,sp+4)));
  const vl = (b=0) => Math.max(28, Math.min(95, ovr+b+rand(-sp-4,sp-2)));
  const pos = position;
  return {
    finalizacao:  pos==='PÍV'?vh(5):pos==='ALA'?vh(2):vl(-8),
    passe:        pos==='ALA'?vh(3):pos==='FIX'?vh(2):v(0),
    drible:       pos==='ALA'?vh(4):pos==='PÍV'?v(1):vl(-6),
    criatividade: pos==='ALA'?vh(3):v(0),
    controle:     pos==='PÍV'?vh(3):pos==='ALA'?vh(1):v(0),
    marcacao:     pos==='FIX'?vh(5):pos==='GL'?v(0):vl(-7),
    interceptacao:pos==='FIX'?vh(4):vl(-5),
    posicionamento:vh(1),
    desarme:      pos==='FIX'?vh(4):vl(-5),
    velocidade:   pos==='ALA'?vh(5):v(0),
    resistencia:  v(0),
    forca:        pos==='PÍV'?vh(4):pos==='FIX'?v(1):vl(-2),
    agilidade:    pos==='ALA'?vh(3):v(0),
    lideranca:    v(0),
    visao:        pos==='ALA'?vh(3):pos==='FIX'?v(1):vl(-2),
    decisoes:     v(1),
    concentracao: v(0),
    reflexos:     pos==='GL'?vh(9):vl(-15),
    defesaGK:     pos==='GL'?vh(8):vl(-17),
  };
}

window.calcOvr = function(attrs, position) {
  const W = {
    GL:  {reflexos:3,defesaGK:3,posicionamento:2,decisoes:2,velocidade:1,concentracao:1,resistencia:1},
    FIX: {marcacao:3,interceptacao:2,posicionamento:2,desarme:2,passe:2,decisoes:1,resistencia:1,forca:1},
    ALA: {velocidade:3,drible:2,finalizacao:2,passe:2,criatividade:2,agilidade:1,resistencia:1,decisoes:1},
  };
  W['PÍV'] = {finalizacao:3,forca:2,controle:2,posicionamento:2,decisoes:2,resistencia:1,velocidade:1,drible:1};
  const w = W[position]||W['ALA'];
  let total=0,count=0;
  for(const[k,wt] of Object.entries(w)){total+=(attrs[k]||60)*wt;count+=wt;}
  return Math.round(total/count);
};

const LEAGUE_OVR_RANGE = {
  laliga:      {s:[76,89], a:[68,78], b:[59,71], young:[53,68]},
  premier:     {s:[77,90], a:[69,79], b:[60,72], young:[54,69]},
  seriea:      {s:[73,86], a:[65,75], b:[56,68], young:[50,65]},
  brasileirao: {s:[69,80], a:[61,71], b:[52,64], young:[46,61]},
  lpf:         {s:[71,83], a:[63,73], b:[54,66], young:[48,63]},
};

const TEAM_TIER = {
  es01:'s',es02:'s',en01:'s',en05:'s',it02:'s',br01:'s',br02:'s',
  es03:'a',en03:'a',en04:'a',en06:'a',en07:'a',en08:'a',en02:'a',
  it01:'a',it03:'a',it04:'a',pt01:'a',pt02:'a',pt03:'a',
  es04:'b',es05:'b',es06:'b',es07:'b',es08:'b',
  it05:'b',it06:'b',it07:'b',it08:'b',
  br03:'b',br04:'b',br05:'b',br06:'b',br07:'b',br08:'b',
};

const PNAMES = {
  Espanha:   {f:['Carlos','Miguel','David','Sergio','Pablo','Álvaro','Marcos','Adrián','Raúl','Óscar','Iván','Fernando','Borja'],l:['García','Martínez','López','Sánchez','González','Pérez','Díaz','Romero','Torres','Jiménez']},
  Inglaterra:{f:['James','Jack','Harry','Mason','Marcus','Declan','Phil','Callum','Jude','Luke','Jordan','Aaron','Ben'],l:['Smith','Johnson','Williams','Brown','Jones','Wilson','Moore','Taylor','Anderson','White']},
  Itália:    {f:['Francesco','Andrea','Marco','Alessandro','Luca','Nicolò','Federico','Matteo','Lorenzo','Davide'],l:['Rossi','Ferrari','Esposito','Bianchi','Romano','Ricci','Gallo','Conti','De Luca','Bruno']},
  Brasil:    {f:['Gabriel','Lucas','Matheus','Pedro','Thiago','Felipe','Rafael','Diego','Bruno','Rodrigo','Anderson','Leandro','Gustavo'],l:['Silva','Santos','Oliveira','Costa','Souza','Lima','Ferreira','Pereira','Carvalho','Alves']},
  Portugal:  {f:['Rui','João','Pedro','André','Nuno','Ricardo','Miguel','Tiago','Luís','Diogo'],l:['Silva','Santos','Ferreira','Pereira','Costa','Carvalho','Lopes','Marques','Gomes','Rodrigues']},
};
function randName(c){const s=PNAMES[c]||PNAMES['Brasil'];return s.f[rand(0,s.f.length-1)]+' '+s.l[rand(0,s.l.length-1)];}

function makePlayer(tid,ovrRange,country,pos,league){
  const position=pos||['GL','FIX','ALA','ALA','PÍV'][rand(0,4)];
  const ovr=rand(ovrRange[0],ovrRange[1]);
  const age=rand(18,33);
  const pot=calcPotential(ovr,age);
  const attrs=generateAttributes(ovr,position);
  // Salário mensal proporcional ao OVR e liga (escala milionária)
  const leagueMult = league==='laliga'||league==='premier'?1.8:league==='seriea'?1.4:league==='lpf'?1.1:1.0;
  const baseSal = Math.round((ovr * 12000 + rand(30000,150000)) * leagueMult / 1000) * 1000;
  // Valor de mercado — escala R$ 150M–300M para OVR 87+
  const ageMult = age<=22?12:age<=26?9:age<=30?6:3;
  const ovrFactor = Math.pow((ovr - 55) / 40, 2.2); // curva exponencial: OVR 87+ vale muito mais
  const val = Math.round(baseSal * ageMult * Math.max(0.5, ovrFactor) * rand(3,7) / 100) * 100000;
  return {id:generateId(),teamId:tid,name:randName(country),nationality:country,age,position,overall:ovr,potential:pot,value:val,salary:baseSal,attrs,morale:rand(55,92),fitness:rand(68,100),injured:false,injuryDays:0,goals:0,assists:0,yellowCards:0,redCards:0,appearances:0,history:[],contractYears:rand(1,4),onTransferList:false,form:[rand(5,9),rand(5,9),rand(4,9),rand(4,9),rand(4,9)]};
}

// ============================================================
//  ELENCOS REAIS — TEMPORADA 2025-26 (dados até março 2026)
// ============================================================
// Campos: teamId, name, nat, age, pos, ovr, sal(€/semana), val(€)
// Posições no futsal: GL=goleiro FIX=fixo ALA=ala PÍV=pivô
const REAL_PLAYERS = [

  // ═══════════════════════════════════════
  // 🇪🇸 LA LIGA EA SPORTS
  // ═══════════════════════════════════════

  // REAL MADRID — Técnico: Xabi Alonso (desde junho 2025)
  // IN: Trent Alexander-Arnold (Liverpool, free), Dean Huijsen (Bournemouth €50m),
  //     Álvaro Carreras (Benfica €35m), Franco Mastantuono (River Plate €45m)
  // OUT: Luka Modrić (livre→AC Milan), Lucas Vázquez (livre→Leverkusen),
  //      Endrick (empréstimo→Lyon), Jesús Vallejo (livre)
  {teamId:'es01',name:'Thibaut Courtois',       nat:'Bélgica',    age:33,pos:'GL', ovr:90,sal:6100, val:500000},
  {teamId:'es01',name:'Andriy Lunin',            nat:'Ucrânia',    age:26,pos:'GL', ovr:80,sal:1900, val:450000},
  {teamId:'es01',name:'Fran González',           nat:'Espanha',    age:24,pos:'GL', ovr:72,sal:800, val:120000},
  {teamId:'es01',name:'Éder Militão',            nat:'Brasil',     age:27,pos:'FIX',ovr:84,sal:3500, val:1300000},
  {teamId:'es01',name:'Antonio Rüdiger',         nat:'Alemanha',   age:32,pos:'FIX',ovr:82,sal:4000, val:500000},
  {teamId:'es01',name:'Dean Huijsen',            nat:'Espanha',    age:20,pos:'FIX',ovr:78,sal:1600, val:1620000},
  {teamId:'es01',name:'Raúl Asencio',            nat:'Espanha',    age:21,pos:'FIX',ovr:76,sal:1200, val:700000},
  {teamId:'es01',name:'Trent Alexander-Arnold',  nat:'Inglaterra', age:27,pos:'ALA',ovr:87,sal:5300, val:1750000},
  {teamId:'es01',name:'Álvaro Carreras',         nat:'Espanha',    age:22,pos:'ALA',ovr:74,sal:1100, val:800000},
  {teamId:'es01',name:'Dani Carvajal',           nat:'Espanha',    age:33,pos:'ALA',ovr:79,sal:3100, val:200000},
  {teamId:'es01',name:'Ferland Mendy',           nat:'França',     age:30,pos:'ALA',ovr:78,sal:2700, val:450000},
  {teamId:'es01',name:'Fran García',             nat:'Espanha',    age:25,pos:'ALA',ovr:74,sal:1100, val:350000},
  {teamId:'es01',name:'Jude Bellingham',         nat:'Inglaterra', age:22,pos:'ALA',ovr:90,sal:5900, val:4500000},
  {teamId:'es01',name:'Federico Valverde',       nat:'Uruguai',    age:27,pos:'ALA',ovr:88,sal:4800, val:3120000},
  {teamId:'es01',name:'Eduardo Camavinga',       nat:'França',     age:23,pos:'ALA',ovr:83,sal:3700, val:2120000},
  {teamId:'es01',name:'Aurelién Tchouaméni',     nat:'França',     age:25,pos:'FIX',ovr:83,sal:3900, val:2050000},
  {teamId:'es01',name:'Arda Güler',              nat:'Turquia',    age:20,pos:'ALA',ovr:80,sal:1900, val:1800000},
  {teamId:'es01',name:'Brahim Díaz',             nat:'Espanha',    age:26,pos:'ALA',ovr:78,sal:2500, val:950000},
  {teamId:'es01',name:'Dani Ceballos',           nat:'Espanha',    age:29,pos:'ALA',ovr:73,sal:1900, val:250000},
  {teamId:'es01',name:'Gonzalo García',          nat:'Espanha',    age:21,pos:'PÍV',ovr:74,sal:900, val:450000},
  {teamId:'es01',name:'Kylian Mbappé',           nat:'França',     age:26,pos:'PÍV',ovr:93,sal:10700,val:5500000},
  {teamId:'es01',name:'Vinícius Júnior',         nat:'Brasil',     age:25,pos:'ALA',ovr:91,sal:8000,val:5500000},
  {teamId:'es01',name:'Rodrygo',                 nat:'Brasil',     age:24,pos:'ALA',ovr:82,sal:3600, val:2050000},
  {teamId:'es01',name:'Franco Mastantuono',      nat:'Argentina',  age:18,pos:'ALA',ovr:69,sal:700, val:1250000},

  // FC BARCELONA — Técnico: Hansi Flick (2ª temporada)
  // IN: Joan García (GK, Espanyol €28m), Marcus Rashford (empréstimo Man Utd),
  //     Roony Bardghji (Copenhagen €20m)
  // OUT: Gündoğan (rescisão), Iñigo Martínez (livre), Pablo Torre (livre→Villarreal),
  //      Ansu Fati (empréstimo→Monaco)
  {teamId:'es02',name:'Marc-André ter Stegen',   nat:'Alemanha',   age:33,pos:'GL', ovr:83,sal:3500, val:350000},
  {teamId:'es02',name:'Wojciech Szczęsny',       nat:'Polônia',    age:35,pos:'GL', ovr:81,sal:2500, val:80000},
  {teamId:'es02',name:'Joan García',             nat:'Espanha',    age:24,pos:'GL', ovr:80,sal:2000, val:700000},
  {teamId:'es02',name:'Ronald Araújo',           nat:'Uruguai',    age:27,pos:'FIX',ovr:85,sal:3900, val:2000000},
  {teamId:'es02',name:'Pau Cubarsí',             nat:'Espanha',    age:18,pos:'FIX',ovr:79,sal:1100, val:1500000},
  {teamId:'es02',name:'Jules Koundé',            nat:'França',     age:27,pos:'FIX',ovr:84,sal:3700, val:1700000},
  {teamId:'es02',name:'Andreas Christensen',     nat:'Dinamarca',  age:29,pos:'FIX',ovr:79,sal:2900, val:600000},
  {teamId:'es02',name:'Eric García',             nat:'Espanha',    age:24,pos:'FIX',ovr:75,sal:1900, val:350000},
  {teamId:'es02',name:'Alejandro Balde',         nat:'Espanha',    age:22,pos:'ALA',ovr:79,sal:2000, val:1300000},
  {teamId:'es02',name:'Joao Cancelo',            nat:'Portugal',   age:31,pos:'ALA',ovr:79,sal:2900, val:450000},
  {teamId:'es02',name:'Gerard Martín',           nat:'Espanha',    age:24,pos:'ALA',ovr:72,sal:800, val:300000},
  {teamId:'es02',name:'Pedri',                   nat:'Espanha',    age:23,pos:'ALA',ovr:88,sal:5200, val:4380000},
  {teamId:'es02',name:'Gavi',                    nat:'Espanha',    age:21,pos:'ALA',ovr:84,sal:4100, val:3500000},
  {teamId:'es02',name:'Frenkie de Jong',         nat:'Holanda',    age:28,pos:'ALA',ovr:83,sal:3600, val:1380000},
  {teamId:'es02',name:'Marc Casadó',             nat:'Espanha',    age:21,pos:'FIX',ovr:74,sal:1100, val:550000},
  {teamId:'es02',name:'Fermín López',            nat:'Espanha',    age:22,pos:'ALA',ovr:77,sal:1500, val:800000},
  {teamId:'es02',name:'Dani Olmo',               nat:'Espanha',    age:27,pos:'ALA',ovr:85,sal:4000, val:1700000},
  {teamId:'es02',name:'Marc Bernal',             nat:'Espanha',    age:19,pos:'FIX',ovr:72,sal:800, val:600000},
  {teamId:'es02',name:'Lamine Yamal',            nat:'Espanha',    age:18,pos:'ALA',ovr:88,sal:2300, val:5000000},
  {teamId:'es02',name:'Raphinha',                nat:'Brasil',     age:29,pos:'ALA',ovr:86,sal:4400, val:1880000},
  {teamId:'es02',name:'Robert Lewandowski',      nat:'Polônia',    age:37,pos:'PÍV',ovr:83,sal:4500, val:250000},
  {teamId:'es02',name:'Marcus Rashford',         nat:'Inglaterra', age:28,pos:'ALA',ovr:79,sal:3300, val:1120000},
  {teamId:'es02',name:'Ferran Torres',           nat:'Espanha',    age:25,pos:'ALA',ovr:75,sal:2300, val:700000},
  {teamId:'es02',name:'Roony Bardghji',          nat:'Suécia',     age:18,pos:'ALA',ovr:70,sal:800, val:700000},

  // ATLÉTICO MADRID
  // IN: Conor Gallagher (Chelsea £34m), Alexander Sørloth (Villarreal £32m), Julián Álvarez (Man City £80m+)
  // OUT: Morata (livre→AC Milan), Memphis (livre)
  {teamId:'es03',name:'Jan Oblak',               nat:'Eslovênia',  age:32,pos:'GL', ovr:88,sal:5600, val:550000},
  {teamId:'es03',name:'José María Giménez',      nat:'Uruguai',    age:30,pos:'FIX',ovr:82,sal:4000, val:700000},
  {teamId:'es03',name:'Robin Le Normand',        nat:'Espanha',    age:29,pos:'FIX',ovr:80,sal:2900, val:650000},
  {teamId:'es03',name:'César Azpilicueta',       nat:'Espanha',    age:36,pos:'FIX',ovr:73,sal:1900, val:80000},
  {teamId:'es03',name:'Antoine Griezmann',       nat:'França',     age:34,pos:'ALA',ovr:84,sal:4900, val:300000},
  {teamId:'es03',name:'Rodrigo de Paul',         nat:'Argentina',  age:31,pos:'ALA',ovr:80,sal:3500, val:500000},
  {teamId:'es03',name:'Marcos Llorente',         nat:'Espanha',    age:30,pos:'ALA',ovr:78,sal:3300, val:550000},
  {teamId:'es03',name:'Conor Gallagher',         nat:'Inglaterra', age:25,pos:'ALA',ovr:79,sal:3100, val:1000000},
  {teamId:'es03',name:'Pablo Barrios',           nat:'Espanha',    age:22,pos:'ALA',ovr:75,sal:1200, val:500000},
  {teamId:'es03',name:'Julián Álvarez',          nat:'Argentina',  age:25,pos:'PÍV',ovr:86,sal:5100, val:2620000},
  {teamId:'es03',name:'Alexander Sørloth',       nat:'Noruega',    age:29,pos:'PÍV',ovr:79,sal:2900, val:700000},
  {teamId:'es03',name:'Samuel Lino',             nat:'Brasil',     age:25,pos:'ALA',ovr:78,sal:2300, val:700000}, // antes de ir ao Flamengo

  // SEVILLA FC
  {teamId:'es04',name:'Álvaro Valles',           nat:'Espanha',    age:28,pos:'GL', ovr:79,sal:2100, val:300000},
  {teamId:'es04',name:'Badé',                    nat:'França',     age:24,pos:'FIX',ovr:76,sal:1700, val:400000},
  {teamId:'es04',name:'Marcos Acuña',            nat:'Argentina',  age:34,pos:'ALA',ovr:72,sal:1700, val:80000},
  {teamId:'es04',name:'Youssef En-Nesyri',       nat:'Marrocos',   age:28,pos:'PÍV',ovr:77,sal:2500, val:400000},
  {teamId:'es04',name:'Isaac Romero',            nat:'Espanha',    age:23,pos:'PÍV',ovr:74,sal:1100, val:350000},
  {teamId:'es04',name:'Kike Salas',              nat:'Espanha',    age:22,pos:'FIX',ovr:73,sal:900, val:300000},

  // REAL SOCIEDAD
  {teamId:'es05',name:'Álex Remiro',             nat:'Espanha',    age:30,pos:'GL', ovr:81,sal:2500, val:350000},
  {teamId:'es05',name:'Takefusa Kubo',           nat:'Japão',      age:24,pos:'ALA',ovr:80,sal:2400, val:800000},
  {teamId:'es05',name:'Mikel Oyarzabal',         nat:'Espanha',    age:28,pos:'ALA',ovr:80,sal:2900, val:750000},
  {teamId:'es05',name:'Brais Méndez',            nat:'Espanha',    age:28,pos:'ALA',ovr:77,sal:2100, val:450000},
  {teamId:'es05',name:'Arsen Zakharyan',         nat:'Rússia',     age:22,pos:'ALA',ovr:75,sal:1300, val:500000},
  {teamId:'es05',name:'Robin Le Normand',        nat:'Espanha',    age:29,pos:'FIX',ovr:80,sal:2900, val:650000},

  // ATHLETIC CLUB
  {teamId:'es06',name:'Unai Simón',              nat:'Espanha',    age:28,pos:'GL', ovr:83,sal:3100, val:600000},
  {teamId:'es06',name:'Nico Williams',           nat:'Espanha',    age:23,pos:'ALA',ovr:85,sal:2900, val:2750000},
  {teamId:'es06',name:'Oihan Sancet',            nat:'Espanha',    age:24,pos:'ALA',ovr:79,sal:2100, val:750000},
  {teamId:'es06',name:'Gorka Guruzeta',          nat:'Espanha',    age:28,pos:'PÍV',ovr:77,sal:1900, val:500000},
  {teamId:'es06',name:'Iñaki Williams',          nat:'Gana',       age:31,pos:'ALA',ovr:76,sal:2400, val:300000},
  {teamId:'es06',name:'Dani Vivian',             nat:'Espanha',    age:25,pos:'FIX',ovr:77,sal:1600, val:600000},
  {teamId:'es06',name:'Yeray Álvarez',           nat:'Espanha',    age:30,pos:'FIX',ovr:76,sal:1900, val:350000},

  // VILLARREAL CF
  {teamId:'es07',name:'Álex Baena',              nat:'Espanha',    age:24,pos:'ALA',ovr:80,sal:2300, val:800000},
  {teamId:'es07',name:'Yeremy Pino',             nat:'Espanha',    age:23,pos:'ALA',ovr:78,sal:2000, val:700000},
  {teamId:'es07',name:'Juan Foyth',              nat:'Argentina',  age:27,pos:'FIX',ovr:79,sal:2400, val:600000},
  {teamId:'es07',name:'Dani Parejo',             nat:'Espanha',    age:36,pos:'ALA',ovr:75,sal:1900, val:100000},
  {teamId:'es07',name:'Ilias Akhomach',          nat:'Espanha',    age:21,pos:'ALA',ovr:73,sal:900, val:350000},

  // VALENCIA CF
  {teamId:'es08',name:'Stole Dimitrievski',      nat:'Macedônia',  age:31,pos:'GL', ovr:77,sal:1900, val:200000},
  {teamId:'es08',name:'José Gayà',               nat:'Espanha',    age:30,pos:'ALA',ovr:76,sal:2100, val:200000},
  {teamId:'es08',name:'Hugo Duro',               nat:'Espanha',    age:25,pos:'PÍV',ovr:74,sal:1300, val:300000},
  {teamId:'es08',name:'Diego López',             nat:'Espanha',    age:22,pos:'ALA',ovr:72,sal:800, val:250000},
  {teamId:'es08',name:'Thierry Correia',         nat:'Portugal',   age:26,pos:'ALA',ovr:73,sal:1200, val:250000},

  // ═══════════════════════════════════════
  // 🏴󠁧󠁢󠁥󠁮󠁧󠁿 PREMIER LEAGUE
  // ═══════════════════════════════════════

  // MANCHESTER CITY — Técnico: Pep Guardiola
  // IN: Rayan Aït-Nouri (Wolves £36m), Tijjani Reijnders (Milan £46m), Rayan Cherki (Lyon £34m),
  //     Antoine Semenyo (Bournemouth £65m, jan), Marc Guehi (Crystal Palace £55m, jan)
  // OUT: Kevin De Bruyne (livre→Napoli), Kyle Walker (livre→AC Milan), Jack Grealish (empréstimo→Everton)
  {teamId:'en01',name:'Ederson',                 nat:'Brasil',     age:32,pos:'GL', ovr:89,sal:5900, val:900000},
  {teamId:'en01',name:'Stefan Ortega',           nat:'Alemanha',   age:32,pos:'GL', ovr:77,sal:1900, val:200000},
  {teamId:'en01',name:'Rúben Dias',              nat:'Portugal',   age:28,pos:'FIX',ovr:87,sal:4700, val:1800000},
  {teamId:'en01',name:'Josko Gvardiol',          nat:'Croácia',    age:23,pos:'FIX',ovr:85,sal:3700, val:1880000},
  {teamId:'en01',name:'Manuel Akanji',           nat:'Suíça',      age:30,pos:'FIX',ovr:82,sal:3500, val:950000},
  {teamId:'en01',name:'Marc Guehi',              nat:'Inglaterra', age:25,pos:'FIX',ovr:83,sal:3600, val:1380000},
  {teamId:'en01',name:'Rayan Aït-Nouri',         nat:'Argélia',    age:24,pos:'ALA',ovr:80,sal:2700, val:1120000},
  {teamId:'en01',name:'Rico Lewis',              nat:'Inglaterra', age:21,pos:'ALA',ovr:76,sal:1500, val:750000},
  {teamId:'en01',name:'Rodrigo',                 nat:'Espanha',    age:34,pos:'FIX',ovr:83,sal:5300, val:700000},
  {teamId:'en01',name:'Tijjani Reijnders',       nat:'Holanda',    age:27,pos:'ALA',ovr:85,sal:4300, val:1620000},
  {teamId:'en01',name:'Phil Foden',              nat:'Inglaterra', age:25,pos:'ALA',ovr:89,sal:5500, val:3880000},
  {teamId:'en01',name:'Bernardo Silva',          nat:'Portugal',   age:31,pos:'ALA',ovr:86,sal:4800, val:1550000},
  {teamId:'en01',name:'Rayan Cherki',            nat:'França',     age:22,pos:'ALA',ovr:79,sal:2500, val:1450000},
  {teamId:'en01',name:'Savinho',                 nat:'Brasil',     age:21,pos:'ALA',ovr:77,sal:1600, val:1000000},
  {teamId:'en01',name:'Antoine Semenyo',         nat:'Gana',       age:25,pos:'ALA',ovr:78,sal:2800, val:1450000},
  {teamId:'en01',name:'Omar Marmoush',           nat:'Egito',      age:26,pos:'PÍV',ovr:83,sal:3900, val:1500000},
  {teamId:'en01',name:'Erling Haaland',          nat:'Noruega',    age:25,pos:'PÍV',ovr:93,sal:8700,val:4750000},

  // MANCHESTER UNITED — Técnico: Ruben Amorim
  // IN: Manuel Ugarte (PSG £42m), Noussair Mazraoui (Bayern £15m), Patrick Dorgu (Lecce £25m)
  // OUT: Marcus Rashford (empréstimo→Barcelona), Casemiro (livre→Al-Nassr), Antony (empréstimo→Real Betis)
  {teamId:'en02',name:'André Onana',             nat:'Camarões',   age:29,pos:'GL', ovr:82,sal:3700, val:750000},
  {teamId:'en02',name:'Altay Bayındır',          nat:'Turquia',    age:27,pos:'GL', ovr:76,sal:1600, val:250000},
  {teamId:'en02',name:'Lisandro Martínez',       nat:'Argentina',  age:27,pos:'FIX',ovr:83,sal:4000, val:1450000},
  {teamId:'en02',name:'Matthijs de Ligt',        nat:'Holanda',    age:26,pos:'FIX',ovr:80,sal:3500, val:900000},
  {teamId:'en02',name:'Victor Lindelöf',         nat:'Suécia',     age:31,pos:'FIX',ovr:75,sal:2900, val:350000},
  {teamId:'en02',name:'Noussair Mazraoui',       nat:'Marrocos',   age:27,pos:'ALA',ovr:78,sal:2900, val:700000},
  {teamId:'en02',name:'Patrick Dorgu',           nat:'Dinamarca',  age:21,pos:'ALA',ovr:74,sal:1200, val:750000},
  {teamId:'en02',name:'Bruno Fernandes',         nat:'Portugal',   age:31,pos:'ALA',ovr:85,sal:4900, val:1620000},
  {teamId:'en02',name:'Kobbie Mainoo',           nat:'Inglaterra', age:20,pos:'ALA',ovr:79,sal:1600, val:1450000},
  {teamId:'en02',name:'Manuel Ugarte',           nat:'Uruguai',    age:24,pos:'FIX',ovr:80,sal:3200, val:1150000},
  {teamId:'en02',name:'Rasmus Højlund',          nat:'Dinamarca',  age:22,pos:'PÍV',ovr:76,sal:3100, val:1300000},
  {teamId:'en02',name:'Amad Diallo',             nat:'Costa do Marfim',age:23,pos:'ALA',ovr:78,sal:1700, val:880000},
  {teamId:'en02',name:'Alejandro Garnacho',      nat:'Argentina',  age:21,pos:'ALA',ovr:78,sal:2100, val:1380000},
  {teamId:'en02',name:'Joshua Zirkzee',          nat:'Holanda',    age:24,pos:'PÍV',ovr:76,sal:2700, val:950000},

  // ARSENAL — Técnico: Mikel Arteta (LÍDERES PL em março 2026)
  // IN: Kepa (livre Chelsea), Martín Zubimendi (Sociedad £51m), Noni Madueke (Chelsea £48m),
  //     Viktor Gyökeres (Sporting £63.5m), Eberechi Eze (Crystal Palace £60m),
  //     Piero Hincapié (empréstimo→Leverkusen), Christian Norgaard (Brentford £10m)
  // OUT: Thomas Partey (livre→Villarreal), Jorginho (livre→Napoli→Flamengo), Tomiyasu (rescisão), Nuno Tavares (Lazio £9m perm)
  {teamId:'en03',name:'David Raya',              nat:'Espanha',    age:30,pos:'GL', ovr:85,sal:4100, val:750000},
  {teamId:'en03',name:'Kepa Arrizabalaga',       nat:'Espanha',    age:31,pos:'GL', ovr:80,sal:2300, val:250000},
  {teamId:'en03',name:'William Saliba',          nat:'França',     age:24,pos:'FIX',ovr:87,sal:4400, val:2500000},
  {teamId:'en03',name:'Gabriel Magalhães',       nat:'Brasil',     age:27,pos:'FIX',ovr:85,sal:4000, val:1700000},
  {teamId:'en03',name:'Jakub Kiwior',            nat:'Polônia',    age:25,pos:'FIX',ovr:77,sal:2100, val:550000},
  {teamId:'en03',name:'Piero Hincapié',          nat:'Equador',    age:24,pos:'FIX',ovr:78,sal:2800, val:1000000},
  {teamId:'en03',name:'Declan Rice',             nat:'Inglaterra', age:26,pos:'FIX',ovr:87,sal:5100, val:2700000},
  {teamId:'en03',name:'Martín Zubimendi',        nat:'Espanha',    age:26,pos:'FIX',ovr:85,sal:4400, val:1700000},
  {teamId:'en03',name:'Christian Norgaard',      nat:'Dinamarca',  age:31,pos:'FIX',ovr:79,sal:2900, val:450000},
  {teamId:'en03',name:'Jurriën Timber',          nat:'Holanda',    age:24,pos:'FIX',ovr:80,sal:3100, val:1300000},
  {teamId:'en03',name:'Oleksandr Zinchenko',     nat:'Ucrânia',    age:28,pos:'ALA',ovr:77,sal:2700, val:550000},
  {teamId:'en03',name:'Ben White',               nat:'Inglaterra', age:27,pos:'ALA',ovr:81,sal:3500, val:1050000},
  {teamId:'en03',name:'Martin Ødegaard',         nat:'Noruega',    age:27,pos:'ALA',ovr:88,sal:5500, val:3000000},
  {teamId:'en03',name:'Bukayo Saka',             nat:'Inglaterra', age:24,pos:'ALA',ovr:89,sal:5600, val:3750000},
  {teamId:'en03',name:'Noni Madueke',            nat:'Inglaterra', age:23,pos:'ALA',ovr:79,sal:3100, val:1300000},
  {teamId:'en03',name:'Eberechi Eze',            nat:'Inglaterra', age:27,pos:'ALA',ovr:84,sal:4300, val:1880000},
  {teamId:'en03',name:'Gabriel Martinelli',      nat:'Brasil',     age:24,pos:'ALA',ovr:83,sal:4000, val:1950000},
  {teamId:'en03',name:'Leandro Trossard',        nat:'Bélgica',    age:31,pos:'ALA',ovr:79,sal:3100, val:650000},
  {teamId:'en03',name:'Myles Lewis-Skelly',      nat:'Inglaterra', age:19,pos:'ALA',ovr:75,sal:900, val:800000},
  {teamId:'en03',name:'Viktor Gyökeres',         nat:'Suécia',     age:27,pos:'PÍV',ovr:88,sal:5600, val:2380000},
  {teamId:'en03',name:'Kai Havertz',             nat:'Alemanha',   age:26,pos:'PÍV',ovr:81,sal:4000, val:1450000},

  // CHELSEA — Técnico: Enzo Maresca
  // IN: João Pedro (Brighton £60m), Jamie Gittens (Dortmund £51.5m)
  // OUT: Kepa (livre→Arsenal), Noni Madueke (→Arsenal £48m), Marcus Rashford (empréstimo→Barcelona)
  {teamId:'en04',name:'Filip Jörgensen',         nat:'Dinamarca',  age:23,pos:'GL', ovr:78,sal:2100, val:450000},
  {teamId:'en04',name:'Robert Sánchez',          nat:'Espanha',    age:28,pos:'GL', ovr:77,sal:2400, val:300000},
  {teamId:'en04',name:'Levi Colwill',            nat:'Inglaterra', age:22,pos:'FIX',ovr:79,sal:2500, val:1200000},
  {teamId:'en04',name:'Tosin Adarabioyo',        nat:'Inglaterra', age:27,pos:'FIX',ovr:78,sal:2900, val:700000},
  {teamId:'en04',name:'Moisés Caicedo',          nat:'Equador',    age:24,pos:'FIX',ovr:84,sal:4100, val:2000000},
  {teamId:'en04',name:'Enzo Fernández',          nat:'Argentina',  age:25,pos:'FIX',ovr:86,sal:3900, val:1550000},
  {teamId:'en04',name:'Reece James',             nat:'Inglaterra', age:25,pos:'ALA',ovr:83,sal:4100, val:1300000},
  {teamId:'en04',name:'Marc Cucurella',          nat:'Espanha',    age:27,pos:'ALA',ovr:78,sal:2900, val:700000},
  {teamId:'en04',name:'Cole Palmer',             nat:'Inglaterra', age:23,pos:'ALA',ovr:89,sal:5100, val:3500000},
  {teamId:'en04',name:'Jamie Gittens',           nat:'Inglaterra', age:21,pos:'ALA',ovr:79,sal:2700, val:1500000},
  {teamId:'en04',name:'Pedro Neto',              nat:'Portugal',   age:25,pos:'ALA',ovr:79,sal:2900, val:1250000},
  {teamId:'en04',name:'Christopher Nkunku',      nat:'França',     age:27,pos:'ALA',ovr:81,sal:3700, val:1150000},
  {teamId:'en04',name:'João Pedro',              nat:'Brasil',     age:23,pos:'PÍV',ovr:81,sal:3500, val:1550000},
  {teamId:'en04',name:'Nicolas Jackson',         nat:'Senegal',    age:24,pos:'PÍV',ovr:78,sal:3100, val:1250000},
  {teamId:'en04',name:'Marc Guiu',               nat:'Espanha',    age:19,pos:'PÍV',ovr:71,sal:900, val:450000},

  // LIVERPOOL — Técnico: Arne Slot — CAMPEÃO PREMIER LEAGUE 2024-25
  // IN: Florian Wirtz (Leverkusen £100m+), Milos Kerkez (Bournemouth £40m), Jeremie Frimpong (Leverkusen £29.5m),
  //     Giorgi Mamardashvili (Valencia £29m), Hugo Ekitike (Frankfurt £69m), Alexander Isak (Newcastle £125m — RECORDE britânico!)
  // OUT: Trent Alexander-Arnold (livre→Real Madrid), Diogo Jota (faleceu 3 jul 2025 — nº20 retirado),
  //      Luis Díaz (Bayern Munich), Darwin Núñez (Al-Hilal), Jarell Quansah (Leverkusen)
  {teamId:'en05',name:'Alisson Becker',          nat:'Brasil',     age:33,pos:'GL', ovr:89,sal:5600, val:800000},
  {teamId:'en05',name:'Giorgi Mamardashvili',    nat:'Geórgia',    age:25,pos:'GL', ovr:83,sal:2400, val:1000000},
  {teamId:'en05',name:'Virgil van Dijk',         nat:'Holanda',    age:34,pos:'FIX',ovr:85,sal:4800, val:500000},
  {teamId:'en05',name:'Ibrahima Konaté',         nat:'França',     age:26,pos:'FIX',ovr:84,sal:4000, val:1500000},
  {teamId:'en05',name:'Joe Gomez',               nat:'Inglaterra', age:28,pos:'FIX',ovr:79,sal:2900, val:600000},
  {teamId:'en05',name:'Milos Kerkez',            nat:'Hungria',    age:22,pos:'ALA',ovr:79,sal:2300, val:1150000},
  {teamId:'en05',name:'Andy Robertson',          nat:'Escócia',    age:31,pos:'ALA',ovr:80,sal:4000, val:550000},
  {teamId:'en05',name:'Conor Bradley',           nat:'Irlanda Norte',age:22,pos:'ALA',ovr:77,sal:1700, val:800000},
  {teamId:'en05',name:'Jeremie Frimpong',        nat:'Holanda',    age:25,pos:'ALA',ovr:80,sal:2800, val:1150000},
  {teamId:'en05',name:'Alexis Mac Allister',     nat:'Argentina',  age:27,pos:'ALA',ovr:84,sal:4300, val:1750000},
  {teamId:'en05',name:'Ryan Gravenberch',        nat:'Holanda',    age:23,pos:'FIX',ovr:83,sal:3700, val:1700000},
  {teamId:'en05',name:'Dominik Szoboszlai',      nat:'Hungria',    age:25,pos:'ALA',ovr:83,sal:4000, val:1700000},
  {teamId:'en05',name:'Curtis Jones',            nat:'Inglaterra', age:24,pos:'ALA',ovr:78,sal:2500, val:900000},
  {teamId:'en05',name:'Florian Wirtz',           nat:'Alemanha',   age:22,pos:'ALA',ovr:91,sal:7200,val:4380000},
  {teamId:'en05',name:'Mohamed Salah',           nat:'Egito',      age:33,pos:'ALA',ovr:88,sal:6000, val:1120000},
  {teamId:'en05',name:'Cody Gakpo',              nat:'Holanda',    age:26,pos:'ALA',ovr:79,sal:3500, val:1350000},
  {teamId:'en05',name:'Federico Chiesa',         nat:'Itália',     age:28,pos:'ALA',ovr:78,sal:3100, val:750000},
  {teamId:'en05',name:'Alexander Isak',          nat:'Suécia',     age:26,pos:'PÍV',ovr:89,sal:6400, val:3500000},
  {teamId:'en05',name:'Hugo Ekitike',            nat:'França',     age:23,pos:'PÍV',ovr:82,sal:4100, val:1950000},

  // TOTTENHAM — Técnico: Igor Tudor (interino desde fevereiro 2026)
  {teamId:'en06',name:'Guglielmo Vicario',       nat:'Itália',     age:29,pos:'GL', ovr:83,sal:3100, val:700000},
  {teamId:'en06',name:'Cristian Romero',         nat:'Argentina',  age:27,pos:'FIX',ovr:85,sal:4300, val:1550000},
  {teamId:'en06',name:'Micky van de Ven',        nat:'Holanda',    age:24,pos:'FIX',ovr:83,sal:3100, val:1350000},
  {teamId:'en06',name:'James Maddison',          nat:'Inglaterra', age:29,pos:'ALA',ovr:82,sal:3900, val:1000000},
  {teamId:'en06',name:'Dejan Kulusevski',        nat:'Suécia',     age:25,pos:'ALA',ovr:80,sal:3200, val:950000},
  {teamId:'en06',name:'Brennan Johnson',         nat:'País de Gales',age:24,pos:'ALA',ovr:78,sal:3100, val:1050000},
  {teamId:'en06',name:'Dominic Solanke',         nat:'Inglaterra', age:27,pos:'PÍV',ovr:80,sal:3500, val:1000000},
  {teamId:'en06',name:'Pedro Porro',             nat:'Espanha',    age:26,pos:'ALA',ovr:79,sal:2900, val:850000},
  {teamId:'en06',name:'Archie Gray',             nat:'Inglaterra', age:19,pos:'FIX',ovr:73,sal:1100, val:550000},

  // NEWCASTLE UNITED
  // OUT: Alexander Isak (Liverpool £125m — RECORDE britânico)
  // IN: Igor Jesus (Botafogo), Dan Ndoye (Bologna)
  {teamId:'en07',name:'Nick Pope',               nat:'Inglaterra', age:33,pos:'GL', ovr:80,sal:3500, val:400000},
  {teamId:'en07',name:'Sven Botman',             nat:'Holanda',    age:25,pos:'FIX',ovr:80,sal:3100, val:950000},
  {teamId:'en07',name:'Fabian Schär',            nat:'Suíça',      age:33,pos:'FIX',ovr:78,sal:2900, val:300000},
  {teamId:'en07',name:'Bruno Guimarães',         nat:'Brasil',     age:28,pos:'FIX',ovr:86,sal:4800, val:1950000},
  {teamId:'en07',name:'Anthony Gordon',          nat:'Inglaterra', age:24,pos:'ALA',ovr:80,sal:3200, val:1250000},
  {teamId:'en07',name:'Dan Ndoye',               nat:'Suíça',      age:24,pos:'ALA',ovr:79,sal:2800, val:1050000},
  {teamId:'en07',name:'Harvey Barnes',           nat:'Inglaterra', age:27,pos:'ALA',ovr:78,sal:2800, val:700000},
  {teamId:'en07',name:'Jacob Murphy',            nat:'Inglaterra', age:30,pos:'ALA',ovr:75,sal:2300, val:350000},
  {teamId:'en07',name:'Igor Jesus',              nat:'Brasil',     age:24,pos:'PÍV',ovr:77,sal:2000, val:550000},

  // ASTON VILLA
  {teamId:'en08',name:'Emiliano Martínez',       nat:'Argentina',  age:33,pos:'GL', ovr:86,sal:4500, val:700000},
  {teamId:'en08',name:'Pau Torres',              nat:'Espanha',    age:29,pos:'FIX',ovr:83,sal:3600, val:1000000},
  {teamId:'en08',name:'Ezri Konsa',              nat:'Inglaterra', age:27,pos:'FIX',ovr:80,sal:3100, val:950000},
  {teamId:'en08',name:'Youri Tielemans',         nat:'Bélgica',    age:28,pos:'ALA',ovr:79,sal:3200, val:550000},
  {teamId:'en08',name:'Morgan Rogers',           nat:'Inglaterra', age:23,pos:'ALA',ovr:77,sal:1600, val:650000},
  {teamId:'en08',name:'Leon Bailey',             nat:'Jamaica',    age:28,pos:'ALA',ovr:78,sal:2800, val:700000},
  {teamId:'en08',name:'Ollie Watkins',           nat:'Inglaterra', age:30,pos:'PÍV',ovr:85,sal:4400, val:1450000},
  {teamId:'en08',name:'Jhon Durán',              nat:'Colômbia',   age:21,pos:'PÍV',ovr:75,sal:1500, val:800000},

  // ═══════════════════════════════════════
  // 🇮🇹 SERIE A ENILIVE
  // ═══════════════════════════════════════

  // JUVENTUS
  // IN: Jonathan David (livre Lille!), Francisco Conceição (permanente), Nico González (Fiorentina)
  // OUT: Adrien Rabiot (livre→AC Milan), Danilo (rescisão→Flamengo→Botafogo),
  //      Arthur (livre), Alex Sandro (livre)
  {teamId:'it01',name:'Michele Di Gregorio',     nat:'Itália',     age:27,pos:'GL', ovr:81,sal:2500, val:550000},
  {teamId:'it01',name:'Gleison Bremer',          nat:'Brasil',     age:28,pos:'FIX',ovr:84,sal:3900, val:1380000},
  {teamId:'it01',name:'Federico Gatti',          nat:'Itália',     age:27,pos:'FIX',ovr:78,sal:2100, val:500000},
  {teamId:'it01',name:'Pierre Kalulu',           nat:'França',     age:25,pos:'FIX',ovr:78,sal:2100, val:700000},
  {teamId:'it01',name:'Andrea Cambiaso',         nat:'Itália',     age:25,pos:'ALA',ovr:80,sal:2000, val:1000000},
  {teamId:'it01',name:'Timothy Weah',            nat:'EUA',        age:25,pos:'ALA',ovr:75,sal:1500, val:400000},
  {teamId:'it01',name:'Khephren Thuram',         nat:'França',     age:24,pos:'FIX',ovr:79,sal:2500, val:1000000},
  {teamId:'it01',name:'Nicolò Fagioli',          nat:'Itália',     age:24,pos:'ALA',ovr:76,sal:1500, val:500000},
  {teamId:'it01',name:'Douglas Luiz',            nat:'Brasil',     age:27,pos:'FIX',ovr:79,sal:2700, val:950000},
  {teamId:'it01',name:'Kenan Yıldız',            nat:'Turquia',    age:20,pos:'ALA',ovr:76,sal:1200, val:950000},
  {teamId:'it01',name:'Francisco Conceição',     nat:'Portugal',   age:22,pos:'ALA',ovr:78,sal:1700, val:1000000},
  {teamId:'it01',name:'Nico González',           nat:'Argentina',  age:27,pos:'ALA',ovr:79,sal:2400, val:750000},
  {teamId:'it01',name:'Weston McKennie',         nat:'EUA',        age:27,pos:'ALA',ovr:76,sal:2000, val:450000},
  {teamId:'it01',name:'Jonathan David',          nat:'Canadá',     age:25,pos:'PÍV',ovr:85,sal:4100, val:1800000},
  {teamId:'it01',name:'Dušan Vlahović',          nat:'Sérvia',     age:25,pos:'PÍV',ovr:82,sal:3700, val:1500000},

  // INTER MILAN
  // IN: Petar Sučić (Dinamo Zagreb), Luis Henrique (Marseille), Ange-Yoan Bonny (Parma €23m)
  // OUT: Joaquín Correa (livre→Botafogo), Marko Arnautović (livre), Nicola Zalewski (→Atalanta €17m)
  {teamId:'it02',name:'Yann Sommer',             nat:'Suíça',      age:37,pos:'GL', ovr:82,sal:3300, val:100000},
  {teamId:'it02',name:'Josep Martínez',          nat:'Espanha',    age:27,pos:'GL', ovr:78,sal:1600, val:350000},
  {teamId:'it02',name:'Alessandro Bastoni',      nat:'Itália',     age:26,pos:'FIX',ovr:87,sal:4300, val:2000000},
  {teamId:'it02',name:'Francesco Acerbi',        nat:'Itália',     age:37,pos:'FIX',ovr:77,sal:2500, val:80000},
  {teamId:'it02',name:'Benjamin Pavard',         nat:'França',     age:29,pos:'FIX',ovr:80,sal:3100, val:700000},
  {teamId:'it02',name:'Carlos Augusto',          nat:'Brasil',     age:27,pos:'ALA',ovr:77,sal:1900, val:500000},
  {teamId:'it02',name:'Federico Dimarco',        nat:'Itália',     age:28,pos:'ALA',ovr:83,sal:3600, val:1250000},
  {teamId:'it02',name:'Denzel Dumfries',         nat:'Holanda',    age:29,pos:'ALA',ovr:79,sal:3100, val:700000},
  {teamId:'it02',name:'Hakan Çalhanoğlu',        nat:'Turquia',    age:31,pos:'FIX',ovr:85,sal:4300, val:1050000},
  {teamId:'it02',name:'Nicolò Barella',          nat:'Itália',     age:28,pos:'ALA',ovr:87,sal:4700, val:2120000},
  {teamId:'it02',name:'Piotr Zieliński',         nat:'Polônia',    age:31,pos:'ALA',ovr:79,sal:2800, val:450000},
  {teamId:'it02',name:'Petar Sučić',             nat:'Croácia',    age:23,pos:'ALA',ovr:74,sal:1200, val:450000},
  {teamId:'it02',name:'Luis Henrique',           nat:'Brasil',     age:23,pos:'ALA',ovr:77,sal:2000, val:700000},
  {teamId:'it02',name:'Mehdi Taremi',            nat:'Irã',        age:33,pos:'PÍV',ovr:78,sal:2500, val:300000},
  {teamId:'it02',name:'Lautaro Martínez',        nat:'Argentina',  age:28,pos:'PÍV',ovr:89,sal:6100, val:3000000},
  {teamId:'it02',name:'Marcus Thuram',           nat:'França',     age:28,pos:'PÍV',ovr:84,sal:4300, val:1700000},
  {teamId:'it02',name:'Ange-Yoan Bonny',         nat:'França',     age:22,pos:'PÍV',ovr:75,sal:1500, val:700000},
  {teamId:'it02',name:'Francesco Pio Esposito',  nat:'Itália',     age:20,pos:'PÍV',ovr:72,sal:800, val:500000},

  // AC MILAN — Técnico: Massimiliano Allegri (retornou)
  // IN: Luka Modrić (livre Real Madrid!), Kyle Walker (livre Man City), Samuele Ricci (Torino),
  //     Adrien Rabiot (livre Juventus), Tammy Abraham (perm. Roma)
  // OUT: Tijjani Reijnders (Man City £46m), Theo Hernandez (Al-Hilal), Rafael Leão (Barcelona?)
  {teamId:'it03',name:'Mike Maignan',            nat:'França',     age:30,pos:'GL', ovr:88,sal:4900, val:1050000},
  {teamId:'it03',name:'Marco Sportiello',        nat:'Itália',     age:33,pos:'GL', ovr:75,sal:1600, val:120000},
  {teamId:'it03',name:'Fikayo Tomori',           nat:'Inglaterra', age:28,pos:'FIX',ovr:81,sal:3200, val:850000},
  {teamId:'it03',name:'Strahinja Pavlović',      nat:'Sérvia',     age:24,pos:'FIX',ovr:78,sal:2000, val:700000},
  {teamId:'it03',name:'Samuele Ricci',           nat:'Itália',     age:24,pos:'FIX',ovr:80,sal:2500, val:850000},
  {teamId:'it03',name:'Emerson Royal',           nat:'Brasil',     age:26,pos:'ALA',ovr:75,sal:2000, val:400000},
  {teamId:'it03',name:'Kyle Walker',             nat:'Inglaterra', age:35,pos:'ALA',ovr:73,sal:2100, val:80000},
  {teamId:'it03',name:'Adrien Rabiot',           nat:'França',     age:30,pos:'ALA',ovr:79,sal:3100, val:450000},
  {teamId:'it03',name:'Luka Modrić',             nat:'Croácia',    age:40,pos:'ALA',ovr:76,sal:2300, val:50000},
  {teamId:'it03',name:'Youssouf Fofana',         nat:'França',     age:26,pos:'FIX',ovr:79,sal:2500, val:700000},
  {teamId:'it03',name:'Rafael Leão',             nat:'Portugal',   age:26,pos:'ALA',ovr:85,sal:4700, val:1950000},
  {teamId:'it03',name:'Christian Pulisic',       nat:'EUA',        age:27,pos:'ALA',ovr:80,sal:3600, val:950000},
  {teamId:'it03',name:'Samuel Chukwueze',        nat:'Nigéria',    age:26,pos:'ALA',ovr:76,sal:1900, val:550000},
  {teamId:'it03',name:'Tammy Abraham',           nat:'Inglaterra', age:27,pos:'PÍV',ovr:77,sal:2500, val:500000},
  {teamId:'it03',name:'Álvaro Morata',           nat:'Espanha',    age:32,pos:'PÍV',ovr:78,sal:2500, val:350000},

  // NAPOLI — CAMPEÃO SÉRIE A 2024-25 — Técnico: Antonio Conte
  // IN: Kevin De Bruyne (livre Man City!), Noa Lang (PSV £28m), Sam Beukema (Bologna £31m),
  //     Lorenzo Lucca (Udinese €26m), Giovane Santana (Verona permanente)
  // OUT: Victor Osimhen (→Galatasaray permanente), Khvicha Kvaratskhelia (→PSG jan 2025),
  //      Jorginho (livre→Arsenal→Flamengo)
  {teamId:'it04',name:'Alex Meret',              nat:'Itália',     age:28,pos:'GL', ovr:82,sal:2700, val:450000},
  {teamId:'it04',name:'Alessandro Buongiorno',   nat:'Itália',     age:26,pos:'FIX',ovr:83,sal:3100, val:1050000},
  {teamId:'it04',name:'Sam Beukema',             nat:'Holanda',    age:26,pos:'FIX',ovr:80,sal:3100, val:900000},
  {teamId:'it04',name:'Amir Rrahmani',           nat:'Kosovo',     age:31,pos:'FIX',ovr:78,sal:2400, val:350000},
  {teamId:'it04',name:'Giovanni Di Lorenzo',     nat:'Itália',     age:32,pos:'ALA',ovr:79,sal:2800, val:300000},
  {teamId:'it04',name:'Mathías Olivera',         nat:'Uruguai',    age:27,pos:'ALA',ovr:76,sal:1900, val:400000},
  {teamId:'it04',name:'Stanislav Lobotka',       nat:'Eslováquia', age:30,pos:'FIX',ovr:82,sal:3200, val:800000},
  {teamId:'it04',name:'Frank Anguissa',          nat:'Camarões',   age:30,pos:'FIX',ovr:81,sal:3300, val:750000},
  {teamId:'it04',name:'Kevin De Bruyne',         nat:'Bélgica',    age:34,pos:'ALA',ovr:87,sal:5600, val:450000},
  {teamId:'it04',name:'Noa Lang',                nat:'Holanda',    age:26,pos:'ALA',ovr:81,sal:3200, val:850000},
  {teamId:'it04',name:'Matteo Politano',         nat:'Itália',     age:32,pos:'ALA',ovr:77,sal:2400, val:250000},
  {teamId:'it04',name:'Romelu Lukaku',           nat:'Bélgica',    age:32,pos:'PÍV',ovr:82,sal:4700, val:450000},
  {teamId:'it04',name:'Lorenzo Lucca',           nat:'Itália',     age:25,pos:'PÍV',ovr:78,sal:2000, val:550000},
  {teamId:'it04',name:'Giovane Santana',         nat:'Brasil',     age:22,pos:'PÍV',ovr:72,sal:900, val:300000},

  // AS ROMA
  {teamId:'it05',name:'Mile Svilar',             nat:'Bélgica',    age:26,pos:'GL', ovr:80,sal:2300, val:450000},
  {teamId:'it05',name:'Gianluca Mancini',        nat:'Itália',     age:29,pos:'FIX',ovr:78,sal:2400, val:400000},
  {teamId:'it05',name:'Mats Hummels',            nat:'Alemanha',   age:37,pos:'FIX',ovr:75,sal:1900, val:50000},
  {teamId:'it05',name:'Lorenzo Pellegrini',      nat:'Itália',     age:29,pos:'ALA',ovr:79,sal:2900, val:550000},
  {teamId:'it05',name:'Paulo Dybala',            nat:'Argentina',  age:32,pos:'ALA',ovr:81,sal:3600, val:400000},
  {teamId:'it05',name:'Nicola Zalewski',         nat:'Polônia',    age:23,pos:'ALA',ovr:74,sal:1500, val:450000},
  {teamId:'it05',name:'Evan Ferguson',           nat:'Irlanda',    age:21,pos:'PÍV',ovr:75,sal:1600, val:650000},
  {teamId:'it05',name:'Artem Dovbyk',            nat:'Ucrânia',    age:28,pos:'PÍV',ovr:79,sal:2500, val:700000},

  // LAZIO
  {teamId:'it06',name:'Ivan Provedel',           nat:'Itália',     age:31,pos:'GL', ovr:79,sal:2100, val:250000},
  {teamId:'it06',name:'Mattia Zaccagni',         nat:'Itália',     age:30,pos:'ALA',ovr:79,sal:2500, val:550000},
  {teamId:'it06',name:'Boulaye Dia',             nat:'Senegal',    age:28,pos:'PÍV',ovr:78,sal:2300, val:600000},
  {teamId:'it06',name:'Nicolás González',        nat:'Argentina',  age:27,pos:'ALA',ovr:78,sal:2100, val:600000},
  {teamId:'it06',name:'Gustav Isaksen',          nat:'Dinamarca',  age:24,pos:'ALA',ovr:76,sal:1700, val:500000},
  {teamId:'it06',name:'Valentin Castellanos',    nat:'Argentina',  age:27,pos:'PÍV',ovr:75,sal:1700, val:400000},

  // ATALANTA
  // IN: Nicola Zalewski (Inter €17m), Giacomo Raspadori (Atletico Madrid €23m jan 2026)
  {teamId:'it07',name:'Marco Carnesecchi',       nat:'Itália',     age:24,pos:'GL', ovr:82,sal:2400, val:750000},
  {teamId:'it07',name:'Sead Kolašinac',          nat:'Bósnia',     age:32,pos:'FIX',ovr:73,sal:1600, val:100000},
  {teamId:'it07',name:'Odilon Kossounou',        nat:'Costa do Marfim',age:24,pos:'FIX',ovr:78,sal:2000, val:700000},
  {teamId:'it07',name:'Marten de Roon',          nat:'Holanda',    age:33,pos:'FIX',ovr:77,sal:2700, val:200000},
  {teamId:'it07',name:'Ademola Lookman',         nat:'Nigéria',    age:27,pos:'ALA',ovr:83,sal:3300, val:1100000},
  {teamId:'it07',name:'Charles De Ketelaere',    nat:'Bélgica',    age:24,pos:'ALA',ovr:80,sal:2500, val:850000},
  {teamId:'it07',name:'Mateo Retegui',           nat:'Itália',     age:26,pos:'PÍV',ovr:80,sal:2500, val:750000},
  {teamId:'it07',name:'Giacomo Raspadori',       nat:'Itália',     age:25,pos:'PÍV',ovr:79,sal:2500, val:800000},
  {teamId:'it07',name:'Nicola Zalewski',         nat:'Polônia',    age:23,pos:'ALA',ovr:74,sal:1600, val:500000},

  // FIORENTINA
  // OUT: Nico González (→Juventus), Albert Gudmundsson (→Napoli empréstimo)
  {teamId:'it08',name:'David de Gea',            nat:'Espanha',    age:35,pos:'GL', ovr:78,sal:2300, val:50000},
  {teamId:'it08',name:'Lucas Martínez Quarta',   nat:'Argentina',  age:28,pos:'FIX',ovr:78,sal:2300, val:500000},
  {teamId:'it08',name:'Robin Gosens',            nat:'Alemanha',   age:31,pos:'ALA',ovr:75,sal:1900, val:250000},
  {teamId:'it08',name:'Moise Kean',              nat:'Itália',     age:25,pos:'PÍV',ovr:82,sal:3200, val:1000000},
  {teamId:'it08',name:'Lucas Beltrán',           nat:'Argentina',  age:24,pos:'PÍV',ovr:73,sal:1500, val:350000},
  {teamId:'it08',name:'Yacine Adli',             nat:'França',     age:27,pos:'ALA',ovr:75,sal:1700, val:400000},

  // ═══════════════════════════════════════
  // 🇧🇷 BRASILEIRÃO SÉRIE A 2026
  // ═══════════════════════════════════════

  // FLAMENGO — CAMPEÃO Brasileirão + Libertadores 2025
  // IN: Lucas Paquetá (West Ham €42m — RECORDE histórico BR!), Samuel Lino (Atlético Madrid €22m),
  //     Vitão (Internacional €10.2m), Carlos Alcaraz (Southampton €18m)
  // OUT: Gerson (→Cruzeiro €30m), Jorginho (livre Arsenal→Flamengo FREE após), Danilo (rescisão)
  {teamId:'br01',name:'Rossi',                   nat:'Argentina',  age:29,pos:'GL', ovr:77,sal:2000, val:180000},
  {teamId:'br01',name:'Fabrício Bruno',          nat:'Brasil',     age:28,pos:'FIX',ovr:74,sal:1500, val:150000},
  {teamId:'br01',name:'Léo Ortiz',               nat:'Brasil',     age:30,pos:'FIX',ovr:73,sal:1300, val:120000},
  {teamId:'br01',name:'Vitão',                   nat:'Brasil',     age:26,pos:'FIX',ovr:74,sal:1300, val:180000},
  {teamId:'br01',name:'Everton Araújo',          nat:'Brasil',     age:28,pos:'ALA',ovr:73,sal:1300, val:150000},
  {teamId:'br01',name:'Carlos Alcaraz',          nat:'Argentina',  age:23,pos:'ALA',ovr:75,sal:1600, val:450000},
  {teamId:'br01',name:'Giorgian De Arrascaeta',  nat:'Uruguai',    age:30,pos:'ALA',ovr:82,sal:2800, val:450000},
  {teamId:'br01',name:'Lucas Paquetá',           nat:'Brasil',     age:28,pos:'ALA',ovr:84,sal:3900, val:1200000},
  {teamId:'br01',name:'Samuel Lino',             nat:'Brasil',     age:25,pos:'ALA',ovr:78,sal:2100, val:700000},
  {teamId:'br01',name:'Michael',                 nat:'Brasil',     age:27,pos:'ALA',ovr:73,sal:1100, val:120000},
  {teamId:'br01',name:'Pedro',                   nat:'Brasil',     age:28,pos:'PÍV',ovr:80,sal:2700, val:620000},
  {teamId:'br01',name:'Lorran',                  nat:'Brasil',     age:18,pos:'ALA',ovr:66,sal:500,  val:180000},
  {teamId:'br01',name:'Bruno Henrique',          nat:'Brasil',     age:34,pos:'ALA',ovr:71,sal:900, val:60000},

  // PALMEIRAS
  // IN: Vitor Roque (Barcelona €25.5m), Facundo Torres (Orlando City), Andreas Pereira (Fulham),
  //     Marlon Freitas (Botafogo €5.1m), Bruno Fuchs (Internacional)
  // OUT: Estêvão (→Chelsea verão 2025 — acordado), Richard Ríos (Fluminense?), Gustavo Gómez (aposentadoria)
  {teamId:'br02',name:'Carlos Miguel',                nat:'Brasil',     age:38,pos:'GL', ovr:78,sal:2100, val:60000},
  {teamId:'br02',name:'Murilo',                  nat:'Brasil',     age:26,pos:'FIX',ovr:76,sal:1500, val:150000},
  {teamId:'br02',name:'Gustavo Gómez',           nat:'Paraguai',   age:32,pos:'FIX',ovr:76,sal:1600, val:100000},
  {teamId:'br02',name:'Bruno Fuchs',             nat:'Brasil',     age:27,pos:'FIX',ovr:73,sal:900, val:100000},
  {teamId:'br02',name:'Mayke',                   nat:'Brasil',     age:32,pos:'ALA',ovr:71,sal:900, val:60000},
  {teamId:'br02',name:'Raphael Veiga',           nat:'Brasil',     age:30,pos:'ALA',ovr:79,sal:2300, val:220000},
  {teamId:'br02',name:'Marlon Freitas',          nat:'Brasil',     age:27,pos:'FIX',ovr:75,sal:1200, val:200000},
  {teamId:'br02',name:'Andreas Pereira',         nat:'Brasil',     age:29,pos:'ALA',ovr:77,sal:1900, val:350000},
  {teamId:'br02',name:'Facundo Torres',          nat:'Uruguai',    age:25,pos:'ALA',ovr:77,sal:1700, val:350000},
  {teamId:'br02',name:'Vitor Roque',             nat:'Brasil',     age:20,pos:'PÍV',ovr:78,sal:2000, val:880000},
  {teamId:'br02',name:'Flaco López',             nat:'Argentina',  age:26,pos:'PÍV',ovr:74,sal:1300, val:120000},

  // CORINTHIANS
  // IN: Memphis Depay (livre), Rodrigo Garro (contrato renovado)
  {teamId:'br03',name:'Hugo Souza',              nat:'Brasil',     age:25,pos:'GL', ovr:74,sal:1100, val:80000},
  {teamId:'br03',name:'Félix Torres',            nat:'Equador',    age:28,pos:'FIX',ovr:73,sal:1200, val:100000},
  {teamId:'br03',name:'André Ramalho',           nat:'Brasil',     age:31,pos:'FIX',ovr:72,sal:900, val:60000},
  {teamId:'br03',name:'Rodrigo Garro',           nat:'Argentina',  age:27,pos:'ALA',ovr:76,sal:1500, val:150000},
  {teamId:'br03',name:'Yuri Alberto',            nat:'Brasil',     age:24,pos:'PÍV',ovr:75,sal:1300, val:120000},
  {teamId:'br03',name:'Memphis Depay',           nat:'Holanda',    age:31,pos:'ALA',ovr:74,sal:1900, val:100000},
  {teamId:'br03',name:'Romero',                  nat:'Paraguai',   age:30,pos:'ALA',ovr:72,sal:1100, val:90000},

  // ATLÉTICO-MG
  // OUT: Samuel Lino (→Flamengo €22m), Paulinho (→Palmeiras)
  // IN: Alan Minda (Brugge €7m), Guilherme Arana voltou (empréstimo→Fluminense depois)
  {teamId:'br04',name:'Everson',                 nat:'Brasil',     age:35,pos:'GL', ovr:75,sal:1300, val:50000},
  {teamId:'br04',name:'Renan Lodi',              nat:'Brasil',     age:28,pos:'FIX',ovr:76,sal:1200, val:120000},
  {teamId:'br04',name:'Scarpa',                  nat:'Brasil',     age:31,pos:'ALA',ovr:74,sal:1300, val:90000},
  {teamId:'br04',name:'T. Cuello',                nat:'Argentina',  age:26,pos:'ALA',ovr:75,sal:1100, val:100000},
  {teamId:'br04',name:'Alan Minda',              nat:'Equador',    age:22,pos:'ALA',ovr:73,sal:900, val:200000},
  {teamId:'br04',name:'Hulk',                    nat:'Brasil',     age:39,pos:'PÍV',ovr:77,sal:23000, val:50000},
  {teamId:'br04',name:'Ruan',                    nat:'Brasil',     age:26,pos:'FIX',ovr:72,sal:900, val:50000},
  {teamId:'br04',name:'Lyanco',                   nat:'Brasil',     age:29,pos:'FIX',ovr:75,sal:1450, val:50000},
  {teamId:'br04',name:'M. Cassierra',             nat:'Brasil',     age:28,pos:'PÍV',ovr:74,sal:980, val:50000},

  // SÃO PAULO FC
  {teamId:'br05',name:'Rafael',                  nat:'Brasil',     age:35,pos:'GL', ovr:74,sal:1100, val:50000},
  {teamId:'br05',name:'Calleri',                 nat:'Argentina',  age:32,pos:'PÍV',ovr:75,sal:1200, val:60000},
  {teamId:'br05',name:'Lucas Moura',             nat:'Brasil',     age:33,pos:'ALA',ovr:72,sal:1100, val:50000},
  {teamId:'br05',name:'Pablo Maia',              nat:'Brasil',     age:24,pos:'FIX',ovr:73,sal:700, val:120000},
  {teamId:'br05',name:'Ferreira',                nat:'Brasil',     age:28,pos:'ALA',ovr:71,sal:700, val:60000},
  {teamId:'br05',name:'Wellington Rato',         nat:'Brasil',     age:30,pos:'ALA',ovr:72,sal:800, val:80000},

  // GRÊMIO
  // IN: Tetê (Panathinaikos €6.2m)
  {teamId:'br02',name:'Weverton',                nat:'Brasil',     age:38,pos:'GL', ovr:78,sal:2100, val:60000},
  {teamId:'br06',name:'Marchesín',               nat:'Argentina',  age:36,pos:'GL', ovr:75,sal:1200, val:50000},
  {teamId:'br06',name:'Cristaldo',               nat:'Argentina',  age:25,pos:'ALA',ovr:73,sal:900, val:90000},
  {teamId:'br06',name:'Tetê',                    nat:'Brasil',     age:25,pos:'ALA',ovr:74,sal:1100, val:180000},
  {teamId:'br06',name:'Villasanti',              nat:'Paraguai',   age:27,pos:'FIX',ovr:71,sal:800, val:80000},
  {teamId:'br06',name:'Dodi',                    nat:'Brasil',     age:28,pos:'FIX',ovr:70,sal:700, val:60000},

  // INTERNACIONAL
  // OUT: Vitão (→Flamengo €10.2m), Alexander Isak (foi para Newcastle antes — não era mais do Inter)
  {teamId:'br07',name:'Rochet',                  nat:'Uruguai',    age:30,pos:'GL', ovr:76,sal:1200, val:90000},
  {teamId:'br07',name:'Bruno Gomes',             nat:'Brasil',     age:26,pos:'FIX',ovr:73,sal:900, val:100000},
  {teamId:'br07',name:'Alan Patrick',            nat:'Brasil',     age:31,pos:'ALA',ovr:74,sal:1100, val:80000},
  {teamId:'br07',name:'Borré',                   nat:'Colômbia',   age:29,pos:'PÍV',ovr:74,sal:1100, val:100000},
  {teamId:'br07',name:'Bernabei',                nat:'Argentina',  age:24,pos:'ALA',ovr:72,sal:800, val:80000},
  {teamId:'br07',name:'Wanderson',               nat:'Brasil',     age:30,pos:'ALA',ovr:70,sal:700, val:50000},

  // CRUZEIRO
  // IN: Gerson (Zenit €27m — 2ª maior contratação BR 2026), Matheus Cunha (Wolverhampton)
  // Projeto Pedro Lourenço — meta encerrar duopólio Fla-Palmas
  {teamId:'br08',name:'Cássio',                  nat:'Brasil',     age:38,pos:'GL', ovr:75,sal:1300, val:50000},
  {teamId:'br08',name:'Zé Ivaldo',               nat:'Brasil',     age:27,pos:'FIX',ovr:72,sal:800, val:90000},
  {teamId:'br08',name:'Gerson',                  nat:'Brasil',     age:28,pos:'ALA',ovr:80,sal:2500, val:800000},
  {teamId:'br08',name:'Matheus Pereira',         nat:'Brasil',     age:29,pos:'ALA',ovr:77,sal:1600, val:120000},
  {teamId:'br08',name:'Matheus Cunha',           nat:'Brasil',     age:26,pos:'PÍV',ovr:78,sal:2100, val:620000},
  {teamId:'br08',name:'Kaio Jorge',              nat:'Brasil',     age:23,pos:'PÍV',ovr:72,sal:900, val:120000},
  {teamId:'br08',name:'Gabriel Verón',           nat:'Argentina',  age:22,pos:'ALA',ovr:71,sal:800, val:120000},

  // ═══════════════════════════════════════
  // 🇵🇹 LIGA PORTUGAL BETCLIC
  // ═══════════════════════════════════════

  // PORTO
  {teamId:'pt01',name:'Diogo Costa',             nat:'Portugal',   age:26,pos:'GL', ovr:85,sal:3600, val:1000000},
  {teamId:'pt01',name:'Nehuén Pérez',            nat:'Argentina',  age:25,pos:'FIX',ovr:77,sal:1700, val:400000},
  {teamId:'pt01',name:'David Carmo',             nat:'Portugal',   age:26,pos:'FIX',ovr:76,sal:1600, val:300000},
  {teamId:'pt01',name:'Galeno',                  nat:'Brasil',     age:27,pos:'ALA',ovr:81,sal:2500, val:550000},
  {teamId:'pt01',name:'Pepê',                    nat:'Brasil',     age:27,pos:'ALA',ovr:79,sal:2100, val:450000},
  {teamId:'pt01',name:'Alan Varela',             nat:'Argentina',  age:24,pos:'FIX',ovr:76,sal:1500, val:300000},
  {teamId:'pt01',name:'Evanilson',               nat:'Brasil',     age:26,pos:'PÍV',ovr:78,sal:2100, val:500000},
  {teamId:'pt01',name:'Rodrigo Mora',            nat:'Uruguai',    age:20,pos:'PÍV',ovr:73,sal:800, val:400000},

  // BENFICA
  // OUT: Álvaro Carreras (→Real Madrid €35m), Ángel Di María (contrato encerrou)
  {teamId:'pt02',name:'Anatoliy Trubin',         nat:'Ucrânia',    age:24,pos:'GL', ovr:83,sal:2800, val:700000},
  {teamId:'pt02',name:'António Silva',           nat:'Portugal',   age:22,pos:'FIX',ovr:83,sal:2400, val:1500000},
  {teamId:'pt02',name:'Tomás Araújo',            nat:'Portugal',   age:24,pos:'FIX',ovr:76,sal:1500, val:350000},
  {teamId:'pt02',name:'Orkun Kökcü',             nat:'Turquia',    age:25,pos:'ALA',ovr:78,sal:2300, val:600000},
  {teamId:'pt02',name:'Fredrik Aursnes',         nat:'Noruega',    age:29,pos:'FIX',ovr:77,sal:1900, val:300000},
  {teamId:'pt02',name:'Vangelis Pavlidis',       nat:'Grécia',     age:28,pos:'PÍV',ovr:80,sal:2300, val:550000},
  {teamId:'pt02',name:'Benjamin Rollheiser',     nat:'Argentina',  age:25,pos:'ALA',ovr:75,sal:1500, val:300000},

  // SPORTING CP
  // OUT: Viktor Gyökeres (Arsenal £63.5m — MAIOR venda da história do Sporting!)
  // IN: Conrad Harder (Nordsjælland), Nuno Santos (renovado)
  {teamId:'pt03',name:'Franco Israel',           nat:'Uruguai',    age:27,pos:'GL', ovr:77,sal:1500, val:150000},
  {teamId:'pt03',name:'Gonçalo Inácio',          nat:'Portugal',   age:24,pos:'FIX',ovr:81,sal:2000, val:900000},
  {teamId:'pt03',name:'Ousmane Diomandé',        nat:'Costa do Marfim',age:22,pos:'FIX',ovr:78,sal:1700, val:700000},
  {teamId:'pt03',name:'Morten Hjulmand',         nat:'Dinamarca',  age:26,pos:'FIX',ovr:79,sal:2000, val:700000},
  {teamId:'pt03',name:'Pedro Gonçalves',         nat:'Portugal',   age:27,pos:'ALA',ovr:81,sal:2700, val:700000},
  {teamId:'pt03',name:'Trincão',                 nat:'Portugal',   age:26,pos:'ALA',ovr:78,sal:2000, val:450000},
  {teamId:'pt03',name:'Geny Catamo',             nat:'Moçambique', age:24,pos:'ALA',ovr:73,sal:900, val:250000},
  {teamId:'pt03',name:'Conrad Harder',           nat:'Dinamarca',  age:20,pos:'PÍV',ovr:74,sal:900, val:550000},
];

// ============================================================
window.TEAMS_DATA = [
  {id:'es01',name:'Real Madrid',       city:'Madrid',         country:'Espanha',   league:'laliga',      budget:150000000,reputation:99,color:'#FFFFFF',color2:'#000080',stadium:'Santiago Bernabéu',        capacity:81044},
  {id:'es02',name:'FC Barcelona',      city:'Barcelona',      country:'Espanha',   league:'laliga',      budget:130000000,reputation:98,color:'#004D98',color2:'#A50044',stadium:'Spotify Camp Nou',          capacity:105000},
  {id:'es03',name:'Atlético Madrid',   city:'Madrid',         country:'Espanha',   league:'laliga',      budget:90000000,reputation:95,color:'#CB3524',color2:'#FFFFFF',stadium:'Civitas Metropolitano',     capacity:68456},
  {id:'es04',name:'Sevilla FC',        city:'Sevilha',        country:'Espanha',   league:'laliga',      budget:40000000, reputation:86,color:'#D9000D',color2:'#FFFFFF',stadium:'Ramón Sánchez Pizjuán',     capacity:43883},
  {id:'es05',name:'Real Sociedad',     city:'San Sebastián',  country:'Espanha',   league:'laliga',      budget:35000000, reputation:84,color:'#004B8D',color2:'#FFFFFF',stadium:'Reale Arena',               capacity:39500},
  {id:'es06',name:'Athletic Club',     city:'Bilbao',         country:'Espanha',   league:'laliga',      budget:38000000, reputation:84,color:'#EE2523',color2:'#FFFFFF',stadium:'San Mamés',                 capacity:53289},
  {id:'es07',name:'Villarreal CF',     city:'Villarreal',     country:'Espanha',   league:'laliga',      budget:36000000, reputation:82,color:'#FFE135',color2:'#004B8D',stadium:'Estadio de la Cerámica',    capacity:23500},
  {id:'es08',name:'Valencia CF',       city:'Valência',       country:'Espanha',   league:'laliga',      budget:22000000, reputation:78,color:'#FF6600',color2:'#000000',stadium:'Mestalla',                  capacity:49430},
  {id:'en01',name:'Manchester City',   city:'Manchester',     country:'Inglaterra',league:'premier',     budget:145000000,reputation:98,color:'#6CADDF',color2:'#FFFFFF',stadium:'Etihad Stadium',            capacity:53400},
  {id:'en02',name:'Manchester United', city:'Manchester',     country:'Inglaterra',league:'premier',     budget:110000000,reputation:93,color:'#DA291C',color2:'#FFE500',stadium:'Old Trafford',              capacity:74140},
  {id:'en03',name:'Arsenal',           city:'Londres',        country:'Inglaterra',league:'premier',     budget:120000000,reputation:97,color:'#EF0107',color2:'#FFFFFF',stadium:'Emirates Stadium',          capacity:60704},
  {id:'en04',name:'Chelsea',           city:'Londres',        country:'Inglaterra',league:'premier',     budget:115000000,reputation:93,color:'#034694',color2:'#FFFFFF',stadium:'Stamford Bridge',           capacity:40853},
  {id:'en05',name:'Liverpool',         city:'Liverpool',      country:'Inglaterra',league:'premier',     budget:140000000,reputation:99,color:'#C8102E',color2:'#F6EB61',stadium:'Anfield',                   capacity:61276},
  {id:'en06',name:'Tottenham',         city:'Londres',        country:'Inglaterra',league:'premier',     budget:75000000,reputation:89,color:'#132257',color2:'#FFFFFF',stadium:'Tottenham Hotspur Stadium',  capacity:62850},
  {id:'en07',name:'Newcastle United',  city:'Newcastle',      country:'Inglaterra',league:'premier',     budget:80000000,reputation:88,color:'#000000',color2:'#FFFFFF',stadium:'St. James Park',            capacity:52305},
  {id:'en08',name:'Aston Villa',       city:'Birmingham',     country:'Inglaterra',league:'premier',     budget:65000000,reputation:88,color:'#95BFE5',color2:'#670E36',stadium:'Villa Park',               capacity:42895},
  {id:'it01',name:'Juventus',          city:'Turim',          country:'Itália',    league:'seriea',      budget:85000000,reputation:92,color:'#000000',color2:'#FFFFFF',stadium:'Allianz Stadium',           capacity:41507},
  {id:'it02',name:'Inter Milan',       city:'Milão',          country:'Itália',    league:'seriea',      budget:100000000,reputation:95,color:'#010E80',color2:'#000000',stadium:'San Siro',                  capacity:75923},
  {id:'it03',name:'AC Milan',          city:'Milão',          country:'Itália',    league:'seriea',      budget:75000000,reputation:92,color:'#FB090B',color2:'#000000',stadium:'San Siro',                  capacity:75923},
  {id:'it04',name:'Napoli',            city:'Nápoles',        country:'Itália',    league:'seriea',      budget:88000000,reputation:94,color:'#12A0C3',color2:'#FFFFFF',stadium:'Estadio Diego Maradona',    capacity:54726},
  {id:'it05',name:'AS Roma',           city:'Roma',           country:'Itália',    league:'seriea',      budget:55000000,reputation:87,color:'#8E1F2F',color2:'#FFD700',stadium:'Stadio Olimpico',           capacity:70634},
  {id:'it06',name:'Lazio',             city:'Roma',           country:'Itália',    league:'seriea',      budget:45000000,reputation:85,color:'#87CEEB',color2:'#FFFFFF',stadium:'Stadio Olimpico',           capacity:70634},
  {id:'it07',name:'Atalanta',          city:'Bérgamo',        country:'Itália',    league:'seriea',      budget:60000000,reputation:89,color:'#1E3799',color2:'#000000',stadium:'Gewiss Stadium',            capacity:21747},
  {id:'it08',name:'Fiorentina',        city:'Florença',       country:'Itália',    league:'seriea',      budget:40000000, reputation:84,color:'#4B0082',color2:'#FFFFFF',stadium:'Stadio Artemio Franchi',    capacity:43147},
  {id:'br01',name:'Flamengo',          city:'Rio de Janeiro', country:'Brasil',    league:'brasileirao', budget:65000000,reputation:93,color:'#E82B2B',color2:'#000000',stadium:'Maracanã',                  capacity:78838},
  {id:'br02',name:'Palmeiras',         city:'São Paulo',      country:'Brasil',    league:'brasileirao', budget:50000000, reputation:90,color:'#006437',color2:'#FFFFFF',stadium:'Allianz Parque',            capacity:43713},
  {id:'br03',name:'Corinthians',       city:'São Paulo',      country:'Brasil',    league:'brasileirao', budget:28000000, reputation:86,color:'#000000',color2:'#FFFFFF',stadium:'Neo Química Arena',          capacity:47605},
  {id:'br04',name:'Atlético-MG',       city:'Belo Horizonte', country:'Brasil',    league:'brasileirao', budget:38000000, reputation:88,color:'#000000',color2:'#FFFFFF',stadium:'Arena MRV',                 capacity:46000},
  {id:'br05',name:'São Paulo FC',      city:'São Paulo',      country:'Brasil',    league:'brasileirao', budget:22000000, reputation:85,color:'#E50000',color2:'#FFFFFF',stadium:'MorumBIS',                  capacity:67052},
  {id:'br06',name:'Grêmio',            city:'Porto Alegre',   country:'Brasil',    league:'brasileirao', budget:18000000, reputation:83,color:'#5B8DD9',color2:'#000000',stadium:'Arena do Grêmio',           capacity:60540},
  {id:'br07',name:'Internacional',     city:'Porto Alegre',   country:'Brasil',    league:'brasileirao', budget:18000000, reputation:83,color:'#CC0000',color2:'#FFFFFF',stadium:'Beira-Rio',                 capacity:51300},
  {id:'br08',name:'Cruzeiro',          city:'Belo Horizonte', country:'Brasil',    league:'brasileirao', budget:32000000, reputation:86,color:'#003087',color2:'#FFD700',stadium:'Mineirão',                  capacity:61846},
  {id:'pt01',name:'Porto',             city:'Porto',          country:'Portugal',  league:'lpf',         budget:42000000, reputation:87,color:'#003087',color2:'#FFFFFF',stadium:'Estádio do Dragão',         capacity:50033},
  {id:'pt02',name:'Benfica',           city:'Lisboa',         country:'Portugal',  league:'lpf',         budget:48000000, reputation:88,color:'#E30613',color2:'#FFFFFF',stadium:'Estádio da Luz',            capacity:64642},
  {id:'pt03',name:'Sporting CP',       city:'Lisboa',         country:'Portugal',  league:'lpf',         budget:40000000, reputation:87,color:'#006600',color2:'#FFFFFF',stadium:'Estádio de Alvalade',       capacity:50095},
];

window.LEAGUES_DATA = {
  laliga:      {id:'laliga',      name:'LaLiga EA Sports',      country:'Espanha',   flag:'🇪🇸', season:'2025-26'},
  premier:     {id:'premier',     name:'Premier League',         country:'Inglaterra',flag:'🏴󠁧󠁢󠁥󠁮󠁧󠁿', season:'2025-26'},
  seriea:      {id:'seriea',      name:'Serie A Enilive',        country:'Itália',    flag:'🇮🇹', season:'2025-26'},
  brasileirao: {id:'brasileirao', name:'Brasileirão Série A',    country:'Brasil',    flag:'🇧🇷', season:'2026'},
  lpf:         {id:'lpf',         name:'Liga Portugal Betclic',  country:'Portugal',  flag:'🇵🇹', season:'2025-26'},
};

window.generateDatabase = function() {
  const players = [];
  const teams   = {};
  const leagues = JSON.parse(JSON.stringify(window.LEAGUES_DATA));
  Object.keys(leagues).forEach(k => leagues[k].teams = []);

  window.TEAMS_DATA.forEach(t => {
    teams[t.id] = {...t, players:[], standing:{pts:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,played:0}, form:[]};
    leagues[t.league].teams.push(t.id);
  });

  // Jogadores reais — normalizar salário para escala mensal (orçamento em R$/mês equivalente)
  REAL_PLAYERS.forEach(sp => {
    const pot   = calcPotential(sp.ovr, sp.age);
    const attrs = generateAttributes(sp.ovr, sp.pos);
    // sal está em €/semana → converter para escala do jogo (×4 semanas, ajuste de escala)
    // sal em €/semana → salário mensal do jogo (×4 semanas, ×20 escala para R$ realista)
    const monthlySal = Math.round(sp.sal * 4 * 20 / 1000) * 1000;
    // val em € → valor de transferência no jogo (×60 — mercado inflacionado R$ 150M–300M para craques)
    const scaledVal = Math.round(sp.val * 60 / 100000) * 100000;
    const p = {
      id:generateId(), teamId:sp.teamId, name:sp.name,
      nationality:sp.nat, age:sp.age, position:sp.pos,
      overall:sp.ovr, potential:pot, value:scaledVal, salary:monthlySal, attrs,
      morale:rand(70,96), fitness:rand(80,100), injured:false, injuryDays:0,
      goals:0, assists:0, yellowCards:0, redCards:0, appearances:0,
      history:[], contractYears:rand(1,4), onTransferList:false,
      form:[rand(6,10),rand(6,10),rand(6,10),rand(5,10),rand(5,10)],
    };
    players.push(p);
    if (teams[sp.teamId]) teams[sp.teamId].players.push(p.id);
  });

  // Completar elencos com jogadores procedurais até 14 por time
  // Distribuição: 2 GL, 3 FIX, 4 ALA, 3 PÍV + 2 curinga = 14
  const posDistrib = ['GL','FIX','ALA','PÍV','FIX','ALA','ALA','PÍV','FIX','ALA','PÍV','GL','ALA','FIX'];
  window.TEAMS_DATA.forEach(t => {
    const tier   = TEAM_TIER[t.id] || 'b';
    const ranges = LEAGUE_OVR_RANGE[t.league] || LEAGUE_OVR_RANGE['brasileirao'];
    const range  = ranges[tier] || ranges['b'];
    // Use young range for filler depth
    const youngRange = ranges['young'] || [46, 62];
    const existing = players.filter(p => p.teamId === t.id).length;
    const needed   = Math.max(0, 14 - existing);
    for (let i = 0; i < needed; i++) {
      // Last 2 slots are young players
      const useRange = (existing + i >= 12) ? youngRange : range;
      const pos = posDistrib[(existing + i) % posDistrib.length];
      const p   = makePlayer(t.id, useRange, t.country, pos, t.league);
      players.push(p);
      teams[t.id].players.push(p.id);
    }
  });

  const stats = window.TEAMS_DATA.map(t=>`${t.name}: ${players.filter(p=>p.teamId===t.id).length}`).join(', ');
  console.log(`✅ DB v4 (2025-26): ${players.length} jogadores | ${Object.keys(teams).length} times`);
  console.log('📋 Por time:', stats);
  return { players, teams, leagues };
};

console.log('✅ players.js v4 (2025-26) carregado — fontes: TM + Wikipedia + FBref');
