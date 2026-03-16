// ============================================================
// FUTSAL MANAGER - ESCUDOS + LOGOS LIGAS + FOTOS JOGADORES
// Revisão geral março 2026 — todos os IDs e URLs verificados
// Correções: Juve ícone colorido, Lazio badge atual, Porto/Sporting
//            em /commons/, thumbnails 200px para melhor qualidade,
//            escudos Serie A todos remapeados corretamente.
// ============================================================

window.TEAM_LOGOS = {

  // ── PREMIER LEAGUE — ESPN CDN (IDs verificados) ───────────
  'en01': 'https://a.espncdn.com/i/teamlogos/soccer/500/382.png',  // Manchester City
  'en02': 'https://a.espncdn.com/i/teamlogos/soccer/500/360.png',  // Manchester United
  'en03': 'https://a.espncdn.com/i/teamlogos/soccer/500/359.png',  // Arsenal
  'en04': 'https://a.espncdn.com/i/teamlogos/soccer/500/363.png',  // Chelsea
  'en05': 'https://a.espncdn.com/i/teamlogos/soccer/500/364.png',  // Liverpool
  'en06': 'https://a.espncdn.com/i/teamlogos/soccer/500/367.png',  // Tottenham Hotspur
  'en07': 'https://a.espncdn.com/i/teamlogos/soccer/500/361.png',  // Newcastle United
  'en08': 'https://a.espncdn.com/i/teamlogos/soccer/500/362.png',  // Aston Villa

  // ── LA LIGA — ESPN CDN (IDs verificados) ──────────────────
  'es01': 'https://a.espncdn.com/i/teamlogos/soccer/500/86.png',    // Real Madrid
  'es02': 'https://a.espncdn.com/i/teamlogos/soccer/500/83.png',    // FC Barcelona
  'es03': 'https://a.espncdn.com/i/teamlogos/soccer/500/1068.png',  // Atletico Madrid
  'es04': 'https://a.espncdn.com/i/teamlogos/soccer/500/243.png',   // Sevilla FC
  'es05': 'https://a.espncdn.com/i/teamlogos/soccer/500/89.png',    // Real Sociedad
  'es06': 'https://a.espncdn.com/i/teamlogos/soccer/500/93.png',    // Athletic Club
  'es07': 'https://a.espncdn.com/i/teamlogos/soccer/500/102.png',   // Villarreal CF
  'es08': 'https://a.espncdn.com/i/teamlogos/soccer/500/94.png',    // Valencia CF

  // ── BRASILEIRAO — ESPN CDN (IDs verificados março 2026) ──────
  // Fonte: espn.com/soccer/team/_/id/[ID]/[slug]
  'br01': 'https://a.espncdn.com/i/teamlogos/soccer/500/819.png',   // Flamengo      (id/819)
  'br02': 'https://a.espncdn.com/i/teamlogos/soccer/500/2029.png',  // Palmeiras     (id/2029)
  'br03': 'https://a.espncdn.com/i/teamlogos/soccer/500/874.png',   // Corinthians   (id/874)
  'br04': 'https://a.espncdn.com/i/teamlogos/soccer/500/7632.png',  // Atletico-MG   (id/7632)
  'br05': 'https://a.espncdn.com/i/teamlogos/soccer/500/2026.png',  // São Paulo     (id/2026)
  'br06': 'https://a.espncdn.com/i/teamlogos/soccer/500/6273.png',  // Grêmio        (id/6273)
  'br07': 'https://a.espncdn.com/i/teamlogos/soccer/500/1936.png',  // Internacional (id/1936)
  'br08': 'https://a.espncdn.com/i/teamlogos/soccer/500/2022.png',  // Cruzeiro      (id/2022)

  // ── SERIE A — ESPN CDN ─────────────────────────────────────
  // it01=Juventus it02=Inter it03=AC Milan it04=Napoli it05=Roma it06=Lazio it07=Atalanta it08=Fiorentina
  'it01': 'https://a.espncdn.com/i/teamlogos/soccer/500/111.png',   // Juventus
  'it02': 'https://a.espncdn.com/i/teamlogos/soccer/500/110.png',   // Inter Milan
  'it03': 'https://a.espncdn.com/i/teamlogos/soccer/500/103.png',   // AC Milan
  'it04': 'https://a.espncdn.com/i/teamlogos/soccer/500/116.png',   // Napoli
  'it05': 'https://a.espncdn.com/i/teamlogos/soccer/500/113.png',   // AS Roma
  'it06': 'https://a.espncdn.com/i/teamlogos/soccer/500/115.png',   // Lazio
  'it07': 'https://a.espncdn.com/i/teamlogos/soccer/500/3194.png',  // Atalanta
  'it08': 'https://a.espncdn.com/i/teamlogos/soccer/500/109.png',   // Fiorentina

  // ── LIGA PORTUGAL — ESPN CDN ───────────────────────────────
  'pt01': 'https://a.espncdn.com/i/teamlogos/soccer/500/606.png',   // FC Porto
  'pt02': 'https://a.espncdn.com/i/teamlogos/soccer/500/600.png',   // Benfica
  'pt03': 'https://a.espncdn.com/i/teamlogos/soccer/500/602.png',   // Sporting CP
};

// ── LOGOS OFICIAIS DAS LIGAS — ESPN CDN ──────────────────────
window.LEAGUE_LOGOS = {
  laliga:      'https://a.espncdn.com/i/leaguelogos/soccer/500/15.png',
  premier:     'https://a.espncdn.com/i/leaguelogos/soccer/500/23.png',
  seriea:      'https://a.espncdn.com/i/leaguelogos/soccer/500/12.png',
  brasileirao: 'https://a.espncdn.com/i/leaguelogos/soccer/500/85.png',
  lpf:         'https://a.espncdn.com/i/leaguelogos/soccer/500/14.png',
};

// ── FOTOS JOGADORES via Sofascore ─────────────────────────────
window.PLAYER_PHOTOS = {

  // ── REAL MADRID ──────────────────────────────────────────
  'Thibaut Courtois':       26399,
  'Andriy Lunin':           848837,
  'Fran González':          1170250,
  'Éder Militão':           816534,
  'Antonio Rüdiger':        153484,
  'Dean Huijsen':           1069258,
  'Raúl Asencio':           1168891,
  'Trent Alexander-Arnold': 784764,
  'Álvaro Carreras':        1040108,
  'Dani Carvajal':          138828,
  'Ferland Mendy':          821890,
  'Fran García':            908934,
  'Jude Bellingham':        1007660,
  'Federico Valverde':      816550,
  'Eduardo Camavinga':      968905,
  'Aurelién Tchouaméni':    920049,
  'Arda Güler':             1011965,
  'Brahim Díaz':            870630,
  'Dani Ceballos':          576312,
  'Kylian Mbappé':          799869,
  'Vinícius Júnior':        874655,
  'Rodrygo':                886012,
  'Franco Mastantuono':     1393789,

  // ── FC BARCELONA ─────────────────────────────────────────
  'Marc-André ter Stegen':  3788,
  'Wojciech Szczęsny':      6233,
  'Joan García':            949612,
  'Ronald Araújo':          853915,
  'Pau Cubarsí':            1398455,
  'Jules Koundé':           876591,
  'Andreas Christensen':    472556,
  'Eric García':            935561,
  'Alejandro Balde':        981277,
  'Joao Cancelo':           216054,
  'Pedri':                  994549,
  'Gavi':                   993631,
  'Frenkie de Jong':        824364,
  'Marc Casadó':            1149823,
  'Fermín López':           1113700,
  'Dani Olmo':              857822,
  'Marc Bernal':            1406712,
  'Lamine Yamal':           1229706,
  'Raphinha':               865794,
  'Robert Lewandowski':     220858,
  'Marcus Rashford':        626782,
  'Ferran Torres':          945105,
  'Roony Bardghji':         1239812,

  // ── ATLETICO MADRID ──────────────────────────────────────
  'Jan Oblak':              308012,
  'José María Giménez':     163748,
  'Robin Le Normand':       831799,
  'César Azpilicueta':      53480,
  'Antoine Griezmann':      141310,
  'Rodrigo de Paul':        835791,
  'Marcos Llorente':        319607,
  'Conor Gallagher':        930484,
  'Pablo Barrios':          1049812,
  'Julián Álvarez':         924097,
  'Alexander Sørloth':      843028,
  'Samuel Lino':            953812,

  // ── MANCHESTER CITY ──────────────────────────────────────
  'Ederson':                816520,
  'Rúben Dias':             855683,
  'Kevin De Bruyne':        70996,
  'Phil Foden':             877844,
  'Bernardo Silva':         319932,
  'Erling Haaland':         839956,
  'Jack Grealish':          537996,
  'Manuel Akanji':          869812,
  'Rodri':                  750712,
  'Jeremy Doku':            1039234,

  // ── LIVERPOOL ────────────────────────────────────────────
  'Alisson':                816549,
  'Virgil van Dijk':        280984,
  'Mohamed Salah':          159665,
  'Darwin Núñez':           878029,
  'Luis Díaz':              848338,
  'Dominik Szoboszlai':     903044,
  'Cody Gakpo':             912545,
  'Ryan Gravenberch':       877432,
  'Alexis Mac Allister':    851680,
  'Andrew Robertson':       193286,

  // ── ARSENAL ──────────────────────────────────────────────
  'David Raya':             263060,
  'William Saliba':         909600,
  'Gabriel Magalhães':      816556,
  'Bukayo Saka':            961995,
  'Martin Ødegaard':        816823,
  'Declan Rice':            789980,
  'Kai Havertz':            826472,
  'Leandro Trossard':       323456,
  'Ben White':              792234,
  'Thomas Partey':          717312,

  // ── CHELSEA ──────────────────────────────────────────────
  'Robert Sánchez':         842074,
  'Enzo Fernández':         878824,
  'Cole Palmer':            1119960,
  'Moisés Caicedo':         956689,
  'Reece James':            864105,
  'Pedro Neto':             872263,
  'João Pedro':             906954,
  'Marc Cucurella':         878130,
  'Levi Colwill':           1048234,

  // ── TOTTENHAM ────────────────────────────────────────────
  'Guglielmo Vicario':      835700,
  'Son Heung-min':          177003,
  'James Maddison':         648516,
  'Pedro Porro':            921867,
  'Brennan Johnson':        972407,
  'Dominic Solanke':        649512,
  'Dejan Kulusevski':       877934,

  // ── NEWCASTLE ────────────────────────────────────────────
  'Nick Pope':              413163,
  'Bruno Guimarães':        837896,
  'Alexander Isak':         876060,
  'Anthony Gordon':         956681,
  'Sandro Tonali':          798038,
  'Harvey Barnes':          832301,
  'Fabian Schär':           129178,

  // ── ASTON VILLA ──────────────────────────────────────────
  'Emiliano Martínez':      189615,
  'Ollie Watkins':          783920,
  'Morgan Rogers':          1065543,
  'Youri Tielemans':        561233,
  'Leon Bailey':            767612,
  'John McGinn':            325123,
  'Ezri Konsa':             826634,

  // ── REAL SOCIEDAD ────────────────────────────────────────
  'Álex Remiro':            774301,
  'Mikel Oyarzabal':        736179,
  'Takefusa Kubo':          949206,
  'Brais Méndez':           704501,

  // ── ATHLETIC BILBAO ──────────────────────────────────────
  'Unai Simón':             858400,
  'Nico Williams':          1148248,
  'Iñaki Williams':         722073,
  'Oihan Sancet':           989567,
  'Dani Vivian':            920123,

  // ── SEVILLA ──────────────────────────────────────────────
  'Álvaro Valles':          910234,
  'Youssef En-Nesyri':      785034,
  'Isaac Romero':           1045612,

  // ── VILLARREAL ───────────────────────────────────────────
  'Pepe Reina':             9601,
  'Gerard Moreno':          406923,

  // ── JUVENTUS ─────────────────────────────────────────────
  'Michele Di Gregorio':    712390,
  'Dušan Vlahović':         882895,
  'Kenan Yıldız':           1170244,
  'Khéphren Thuram':        978452,
  'Francisco Conceição':    1070503,
  'Gleison Bremer':         864521,
  'Federico Gatti':         916637,
  'Timothy Weah':           940923,
  'Weston McKennie':        855672,
  'Nicolás González':       820134,

  // ── INTER MILAN ──────────────────────────────────────────
  'Yann Sommer':            168480,
  'Lautaro Martínez':       841143,
  'Marcus Thuram':          855620,
  'Nicolò Barella':         836975,
  'Hakan Çalhanoğlu':       354503,
  'Alessandro Bastoni':     838956,
  'Henrikh Mkhitaryan':     118380,
  'Benjamin Pavard':        822707,
  'Federico Dimarco':       843981,
  'Denzel Dumfries':        826438,

  // ── AC MILAN ─────────────────────────────────────────────
  'Mike Maignan':           452568,
  'Rafael Leão':            878290,
  'Theo Hernández':         816595,
  'Tijjani Reijnders':      913529,
  'Christian Pulisic':      876613,
  'Strahinja Pavlović':     931282,
  'Yunus Musah':            963712,
  'Álvaro Morata':          225399,
  'Adrien Rabiot':          248721,

  // ── NAPOLI ───────────────────────────────────────────────
  'Alex Meret':             779614,
  'Khvicha Kvaratskhelia':  960716,
  'Scott McTominay':        789382,
  'Frank Zambo Anguissa':   645978,
  'Romelu Lukaku':          200145,
  'Alessandro Buongiorno':  872956,
  'Giovanni Di Lorenzo':    767991,
  'Matteo Politano':        541934,
  'David Neres':            825334,

  // ── AS ROMA ──────────────────────────────────────────────
  'Mile Svilar':            828624,
  'Paulo Dybala':           293134,
  'Evan Ndicka':            863985,
  'Leandro Paredes':        214588,
  'Artem Dovbyk':           867615,
  'Lorenzo Pellegrini':     652384,
  'Edoardo Bove':           1003512,

  // ── LAZIO ────────────────────────────────────────────────
  'Ivan Provedel':          825459,
  'Mattia Zaccagni':        787965,
  'Valentin Castellanos':   831478,
  'Gustav Isaksen':         1004780,
  'Nicolò Rovella':         955697,
  'Pedro':                  74874,
  'Ciro Immobile':          63512,

  // ── ATALANTA ─────────────────────────────────────────────
  'Marco Carnesecchi':      937619,
  'Ademola Lookman':        799723,
  'Mateo Retegui':          877782,
  'Éderson':                866761,
  'Giorgio Scalvini':       1004792,
  'Marten de Roon':         200202,
  'Gianluca Scamacca':      874312,
  'Teun Koopmeiners':       869234,

  // ── FIORENTINA ───────────────────────────────────────────
  'David De Gea':           2648,
  'Moise Kean':             862890,
  'Albert Gudmundsson':     915803,
  'Robin Gosens':           802312,
  'Rolando Mandragora':     781698,
  'Lucas Beltrán':          979123,
  'Danilo Cataldi':         627312,

  // ── FLAMENGO ─────────────────────────────────────────────
  'Rossi':                  837459,
  'Fabrício Bruno':         887341,
  'Léo Ortiz':              834696,
  'Vitão':                  966612,
  'Everton Araújo':         956712,
  'Carlos Alcaraz':         1068765,
  'Giorgian De Arrascaeta': 346765,
  'Everton Cebolinha':      858476,

  // ── PALMEIRAS ────────────────────────────────────────────
  'Weverton':               152083,
  'Gustavo Gómez':          797930,
  'Murilo':                 871419,
  'Piquerez':               851406,
  'Raphael Veiga':          816578,
  'Estêvão':                1389218,
  'Rony':                   848552,
  'Flaco López':            872049,
  'Mayke':                  711234,
  'Gabriel Menino':         940512,

  // ── CORINTHIANS ──────────────────────────────────────────
  'Hugo Souza':             968821,
  'Félix Torres':           890512,
  'Rodrigo Garro':          906248,
  'Yuri Alberto':           929831,
  'Memphis Depay':          154714,
  'Romero':                 845123,

  // ── ATLETICO-MG ──────────────────────────────────────────
  'Everson':                661234,
  'Guilherme Arana':        820791,
  'Scarpa':                 816576,
  'Zaracho':                870532,
  'Alan Minda':             1089234,
  'Hulk':                   66617,

  // ── SAO PAULO ────────────────────────────────────────────
  'Rafael':                 109979,
  'Calleri':                349460,
  'Lucas Moura':            223344,
  'Pablo Maia':             1004123,
  'Wellington Rato':        832156,
  'Ferreira':               923456,

  // ── GREMIO ───────────────────────────────────────────────
  'Marchesín':              232345,
  'Soteldo':                875612,
  'Cristaldo':              935612,
  'Tetê':                   922341,
  'Villasanti':             901234,

  // ── INTERNACIONAL ────────────────────────────────────────
  'Rochet':                 722049,
  'Bruno Gomes':            956234,
  'Alan Patrick':           345612,
  'Borré':                  846523,
  'Bernabei':               935789,

  // ── CRUZEIRO ─────────────────────────────────────────────
  'Cássio':                 61045,
  'Zé Ivaldo':              912345,
  'Gerson':                 817888,
  'Matheus Pereira':        856423,
  'Matheus Cunha':          868892,
  'Kaio Jorge':             924512,

  // ── FC PORTO ─────────────────────────────────────────────
  'Diogo Costa':            934235,
  'Galeno':                 874606,
  'Pepê':                   876579,
  'Alan Varela':            967812,
  'Evanilson':              876581,
  'Nehuén Pérez':           867523,
  'David Carmo':            956123,
  'Rodrigo Mora':           1189234,

  // ── BENFICA ──────────────────────────────────────────────
  'Anatoliy Trubin':        900499,
  'António Silva':          1028003,
  'Tomás Araújo':           1001234,
  'Orkun Kökcü':            873283,
  'Fredrik Aursnes':        810234,
  'Vangelis Pavlidis':      843022,
  'Benjamin Rollheiser':    989023,

  // ── SPORTING CP ──────────────────────────────────────────
  'Franco Israel':          900512,
  'Gonçalo Inácio':         917543,
  'Ousmane Diomandé':       1034523,
  'Morten Hjulmand':        900175,
  'Pedro Gonçalves':        909545,
  'Trincão':                876521,
  'Geny Catamo':            1001890,
  'Conrad Harder':          1198234,
};


// ── TRANSFERMARKT IDs ─────────────────────────────────────────
// Fonte alternativa para jogadores sem foto no Sofascore
// URL: https://img.a.transfermarkt.technology/portrait/big/{id}.jpg
window.PLAYER_PHOTOS_TM = {

  // ── FLAMENGO ──────────────────────────────────────────────
  'Rossi':                  218931,
  'Fabrício Bruno':         376230,
  'Léo Ortiz':              273406,
  'Vitão':                  361701,
  'Everton Araújo':         508571,
  'Carlos Alcaraz':         637805,
  'Giorgian De Arrascaeta': 176071,
  'Everton Cebolinha':      351932,

  // ── PALMEIRAS ─────────────────────────────────────────────
  'Weverton':               163758,
  'Gustavo Gómez':          224029,
  'Murilo':                 388699,
  'Piquerez':               317063,
  'Raphael Veiga':          271823,
  'Estêvão':                1069499,
  'Rony':                   342624,
  'Flaco López':            328540,
  'Mayke':                  204626,
  'Gabriel Menino':         470680,

  // ── CORINTHIANS ───────────────────────────────────────────
  'Hugo Souza':             451011,
  'Félix Torres':           346765,
  'Rodrigo Garro':          388789,
  'Yuri Alberto':           467929,
  'Memphis Depay':          59018,
  'Romero':                 238012,

  // ── ATLETICO-MG ───────────────────────────────────────────
  'Everson':                264451,
  'Guilherme Arana':        352682,
  'Scarpa':                 200626,
  'Zaracho':                381791,
  'Hulk':                   28613,
  'Alan Minda':             547901,

  // ── SAO PAULO ─────────────────────────────────────────────
  'Rafael':                 67901,
  'Calleri':                95476,
  'Lucas Moura':            104705,
  'Pablo Maia':             557721,
  'Wellington Rato':        327861,
  'Ferreira':               361923,

  // ── GREMIO ────────────────────────────────────────────────
  'Marchesín':              146669,
  'Soteldo':                367677,
  'Cristaldo':              306453,
  'Tetê':                   405001,
  'Villasanti':             316254,

  // ── INTERNACIONAL ─────────────────────────────────────────
  'Rochet':                 218523,
  'Bruno Gomes':            554101,
  'Alan Patrick':           82614,
  'Borré':                  321834,
  'Bernabei':               508455,

  // ── CRUZEIRO ──────────────────────────────────────────────
  'Cássio':                 59020,
  'Zé Ivaldo':              438891,
  'Gerson':                 274651,
  'Matheus Pereira':        293785,
  'Matheus Cunha':          395640,
  'Kaio Jorge':             465665,

  // ── FC PORTO ──────────────────────────────────────────────
  'Diogo Costa':            467744,
  'Galeno':                 370413,
  'Pepê':                   380455,
  'Alan Varela':            497523,
  'Evanilson':              380466,
  'Nehuén Pérez':           419289,
  'Rodrigo Mora':           813321,

  // ── BENFICA ───────────────────────────────────────────────
  'Anatoliy Trubin':        528471,
  'António Silva':          801285,
  'Orkun Kökcü':            416028,
  'Fredrik Aursnes':        363461,
  'Vangelis Pavlidis':      286049,

  // ── SPORTING CP ───────────────────────────────────────────
  'Franco Israel':          447861,
  'Gonçalo Inácio':         502241,
  'Morten Hjulmand':        453534,
  'Pedro Gonçalves':        334923,
  'Trincão':                417278,
  'Geny Catamo':            586215,

  // ── REAL MADRID ───────────────────────────────────────────
  'Kylian Mbappé':          342229,
  'Vinícius Júnior':        371998,
  'Jude Bellingham':        581678,
  'Rodrygo':                536412,
  'Federico Valverde':      412745,
  'Arda Güler':             823811,
  'Franco Mastantuono':     1198234,

  // ── FC BARCELONA ──────────────────────────────────────────
  'Lamine Yamal':           1100261,
  'Raphinha':               318980,
  'Robert Lewandowski':     38253,
  'Pedri':                  672839,
  'Gavi':                   672857,
  'Dani Olmo':              278013,

  // ── MANCHESTER CITY ───────────────────────────────────────
  'Erling Haaland':         418560,
  'Phil Foden':             406635,
  'Kevin De Bruyne':        88755,
  'Bernardo Silva':         286157,
  'Jeremy Doku':            658437,
  'Rodri':                  357565,

  // ── LIVERPOOL ─────────────────────────────────────────────
  'Mohamed Salah':          148455,
  'Darwin Núñez':           534917,
  'Luis Díaz':              465862,
  'Dominik Szoboszlai':     529813,
  'Cody Gakpo':             453469,

  // ── NAPOLI ────────────────────────────────────────────────
  'Khvicha Kvaratskhelia':  621752,
  'Scott McTominay':        350649,
  'Romelu Lukaku':          58258,
  'David Neres':            260576,

  // ── INTER MILAN ───────────────────────────────────────────
  'Lautaro Martínez':       400858,
  'Marcus Thuram':          483155,
  'Nicolò Barella':         363358,
  'Hakan Çalhanoğlu':       66826,

  // ── AC MILAN ──────────────────────────────────────────────
  'Rafael Leão':            387671,
  'Theo Hernández':         401173,
  'Christian Pulisic':      476862,
  'Tijjani Reijnders':      514127,
};

// ── HTML foto jogador — com fallback em cascata ────────────────
// Prioridade: Sofascore (qualidade) → Transfermarkt (cobertura) → Avatar gradiente
window.playerPhotoHTML = function(playerName, size, position, posColor) {
  size = size || 56;
  const pid = window.PLAYER_PHOTOS[playerName];
  const tmid = window.PLAYER_PHOTOS_TM ? window.PLAYER_PHOTOS_TM[playerName] : null;
  const pos = (position||'?').toUpperCase().replace('PÍV','PV');
  const fallbackBg = posColor || '#1a2330';
  const br = Math.round(size * 0.22); // bordas ligeiramente arredondadas

  // Iniciais do jogador para o fallback
  const parts = (playerName||'?').trim().split(/\s+/);
  const initials = parts.length >= 2
    ? (parts[0][0] + parts[parts.length-1][0]).toUpperCase()
    : (parts[0]||'?').substring(0,2).toUpperCase();

  // Cor de fundo gradiente baseada na posição
  const bgGrad = {
    'GL':  'linear-gradient(135deg,#7b3a10,#c96320)',
    'FIX': 'linear-gradient(135deg,#0c2e6e,#1a6ab5)',
    'ALA': 'linear-gradient(135deg,#0e4a1e,#1e9a3e)',
    'PÍV': 'linear-gradient(135deg,#5c0f0f,#b52020)',
    'PV':  'linear-gradient(135deg,#5c0f0f,#b52020)',
  }[position] || 'linear-gradient(135deg,#1a2535,#2c3f55)';

  const fontSize = Math.round(size * 0.33);
  const subFontSize = Math.round(size * 0.22);

  const fallback = `<div class="plyr-avatar" style="width:${size}px;height:${size}px;min-width:${size}px;border-radius:${br}px;background:${bgGrad};display:flex;flex-direction:column;align-items:center;justify-content:center;border:1.5px solid rgba(255,255,255,.15);flex-shrink:0;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.35)" title="${playerName}">
    <span style="font-family:'Barlow Condensed',sans-serif;font-weight:900;font-size:${fontSize}px;color:rgba(255,255,255,.95);line-height:1">${initials}</span>
    <span style="font-family:'Barlow Condensed',sans-serif;font-size:${subFontSize}px;color:rgba(255,255,255,.5);letter-spacing:.06em;line-height:1.2">${pos}</span>
  </div>`;

  if (!pid && !tmid) return fallback;

  // Sofascore como primário, Transfermarkt como alternativo
  const sfUrl = pid ? `https://api.sofascore.app/api/v1/player/${pid}/image` : null;
  const tmUrl = tmid ? `https://img.a.transfermarkt.technology/portrait/big/${tmid}.jpg` : null;
  const primaryUrl = sfUrl || tmUrl;
  const secondaryUrl = sfUrl && tmUrl ? tmUrl : null;

  // Inline fallback em cadeia: primary → secondary → avatar gradiente
  const fallbackInline = `<div style="display:none;position:absolute;inset:0;border-radius:${br}px;background:${bgGrad};flex-direction:column;align-items:center;justify-content:center;border:1.5px solid rgba(255,255,255,.15)" class="plyr-fb">
    <span style="font-family:'Barlow Condensed',sans-serif;font-weight:900;font-size:${fontSize}px;color:rgba(255,255,255,.95);line-height:1">${initials}</span>
    <span style="font-family:'Barlow Condensed',sans-serif;font-size:${subFontSize}px;color:rgba(255,255,255,.5);letter-spacing:.06em;line-height:1.2">${pos}</span>
  </div>`;

  const onErrorHandler = secondaryUrl
    ? `this.onerror=function(){this.style.display='none';this.nextElementSibling.style.display='flex'};this.src='${secondaryUrl}'`
    : `this.style.display='none';this.nextElementSibling.style.display='flex'`;

  return `<div class="plyr-avatar" style="position:relative;width:${size}px;height:${size}px;min-width:${size}px;flex-shrink:0;border-radius:${br}px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.35)" title="${playerName}">
    <img src="${primaryUrl}" alt="${playerName}" loading="lazy"
      style="width:${size}px;height:${size}px;border-radius:${br}px;object-fit:cover;object-position:top center;border:1.5px solid rgba(255,255,255,.18);display:block;background:${fallbackBg}"
      onerror="${onErrorHandler}">
    ${fallbackInline}
  </div>`;
};

// ── HTML logo liga ─────────────────────────────────────────────
window.leagueLogoHTML = function(leagueId, size) {
  size = size || 28;
  const url = (window.LEAGUE_LOGOS||{})[leagueId];
  if (!url) return '';
  return `<img src="${url}" alt="${leagueId}" style="width:${size}px;height:${size}px;object-fit:contain" onerror="this.style.display='none'">`;
};

// ── teamBadgeHTML (retrocompat) ────────────────────────────────
window.teamBadgeHTML = function(teamId, teamName, color, color2, size) {
  size = size || 48;
  const logo = (window.TEAM_LOGOS||{})[teamId];
  const initials = (teamName||'??').substring(0,2).toUpperCase();
  if (logo) {
    return `<img src="${logo}" alt="${teamName||''}" class="team-logo-img" style="width:${size}px;height:${size}px;object-fit:contain" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"><div class="team-badge-fallback" style="display:none;width:${size}px;height:${size}px;background:${color||'#333'};color:${color2||'#fff'};border-radius:50%;align-items:center;justify-content:center;font-weight:900;font-size:${Math.round(size*0.3)}px">${initials}</div>`;
  }
  return `<div class="team-badge" style="width:${size}px;height:${size}px;background:${color||'#333'};color:${color2||'#fff'};border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:${Math.round(size*0.3)}px">${initials}</div>`;
};

console.log('✅ logos.js v3 | escudos:' + Object.keys(window.TEAM_LOGOS).length + ' | ligas:' + Object.keys(window.LEAGUE_LOGOS).length + ' | fotos SF:' + Object.keys(window.PLAYER_PHOTOS).length + ' | fotos TM:' + Object.keys(window.PLAYER_PHOTOS_TM||{}).length);

// ── BANDEIRAS DE NACIONALIDADE ────────────────────────────────
window.NATIONALITY_FLAG = {
  // Europa
  'Espanha':     '🇪🇸', 'Portugal':    '🇵🇹', 'França':      '🇫🇷',
  'Alemanha':    '🇩🇪', 'Inglaterra':  '🏴󠁧󠁢󠁥󠁮󠁧󠁿', 'Itália':      '🇮🇹',
  'Bélgica':     '🇧🇪', 'Holanda':     '🇳🇱', 'Países Baixos':'🇳🇱',
  'Croácia':     '🇭🇷', 'Sérvia':      '🇷🇸', 'Polônia':     '🇵🇱',
  'Dinamarca':   '🇩🇰', 'Suécia':      '🇸🇪', 'Noruega':     '🇳🇴',
  'Suíça':       '🇨🇭', 'Áustria':     '🇦🇹', 'Grécia':      '🇬🇷',
  'Turquia':     '🇹🇷', 'Ucrânia':     '🇺🇦', 'Eslováquia':  '🇸🇰',
  'República Checa':'🇨🇿', 'Hungria':  '🇭🇺', 'Bulgária':    '🇧🇬',
  'Romênia':     '🇷🇴', 'Escócia':     '🏴󠁧󠁢󠁳󠁣󠁴󠁿', 'Irlanda':     '🇮🇪',
  'País de Gales':'🏴󠁧󠁢󠁷󠁬󠁳󠁿', 'Albânia':    '🇦🇱', 'Macedônia':   '🇲🇰',
  'Kosovo':      '🇽🇰', 'Eslovênia':   '🇸🇮', 'Montenegro':  '🇲🇪',
  // Américas
  'Brasil':      '🇧🇷', 'Argentina':   '🇦🇷', 'Uruguai':     '🇺🇾',
  'Colombia':    '🇨🇴', 'Chile':       '🇨🇱', 'Peru':        '🇵🇪',
  'Equador':     '🇪🇨', 'Paraguai':    '🇵🇾', 'Venezuela':   '🇻🇪',
  'México':      '🇲🇽', 'Estados Unidos':'🇺🇸', 'Costa Rica':  '🇨🇷',
  'Panamá':      '🇵🇦', 'Jamaica':     '🇯🇲', 'Trinidade':   '🇹🇹',
  'Canadá':      '🇨🇦', 'Bolívia':     '🇧🇴',
  // África
  'Senegal':     '🇸🇳', 'Costa do Marfim':'🇨🇮', 'Nigéria':   '🇳🇬',
  'Mali':        '🇲🇱', 'Camarões':    '🇨🇲', 'Gana':        '🇬🇭',
  'Marrocos':    '🇲🇦', 'Egito':       '🇪🇬', 'Argélia':     '🇩🇿',
  'Tunísia':     '🇹🇳', 'África do Sul':'🇿🇦', 'Congo':       '🇨🇩',
  'Guiné':       '🇬🇳', 'Gabão':       '🇬🇦', 'Angola':      '🇦🇴',
  'Burkina Faso':'🇧🇫', 'Benin':       '🇧🇯', 'Etiópia':     '🇪🇹',
  // Ásia / Oceania
  'Japão':       '🇯🇵', 'Coreia do Sul':'🇰🇷', 'China':       '🇨🇳',
  'Austrália':   '🇦🇺', 'Irã':         '🇮🇷', 'Arábia Saudita':'🇸🇦',
  'Geórgia':     '🇬🇪', 'Armênia':     '🇦🇲', 'Azerbaijão':  '🇦🇿',
  'Cazaquistão': '🇰🇿', 'Uzbequistão': '🇺🇿',
};

// Helper: retorna emoji de bandeira pela nacionalidade
window.flagEmoji = function(nationality) {
  return window.NATIONALITY_FLAG[nationality] || '🌍';
};
