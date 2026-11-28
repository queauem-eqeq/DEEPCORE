/* Mesure du travail des ferrailleuses au niveau 1 (28 novembre 2026, bloc F). window.MO = {n: 6, bat: 2000, defaut: false}.
   Réglages du joueur simulés (groupes de reglages/courant, lus le 28 novembre 2026) sauf defaut: true. La foreuse reste au vaisseau.
   Pour chaque groupe de ferrailleuses : part des battements passés contre la coque de son épave (membre au contact d'une plaque,
   pendant la halte de découpe), trajet (pas × lenteur), découpe réglée, cycles faits, quai de repli (sas injoignable).
   Au départ : ferrailleuses en vue depuis le vaisseau, et combien sont au travail contre une coque. Rend un JSON. */
(() => {
  const REG = {"budget":80,"liste":[{"cout":3,"f":2,"lieux":[],"m":[{"k":"crabos","max":2,"min":1}],"n":"Crabots","on":1,"pats":["voyage","ronde","navette","sentinelle"]},{"cout":7,"f":2,"lieux":[],"m":[{"k":"crabos","max":6,"min":4}],"n":"Large crabot groupe","on":1,"pats":["voyage","navette","ronde"]},{"cout":5,"f":2,"lieux":[],"m":[{"k":"cafar","max":4,"min":3}],"n":"Bande de relais","on":1,"pats":["voyage","errance","ronde"]},{"cout":7,"f":0,"lieux":[],"m":[{"k":"paralyzor","max":1,"min":1},{"k":"crabos","max":1,"min":1},{"k":"cafar","max":1,"min":1},{"k":"mine","max":1,"min":1},{"k":"puce","max":1,"min":1}],"n":"Family","on":1,"pats":["territoire","ronde"]},{"cout":8,"f":0,"lieux":[],"m":[{"k":"puce","max":5,"min":3},{"k":"paralyzor","max":1,"min":1}],"n":"3-5 puces + sentinelles","on":1,"pats":["voyage"]},{"cout":3,"f":1,"lieux":[],"m":[{"k":"mine","max":2,"min":1}],"n":"1-2 Mines","on":1,"pats":["errance"]},{"cout":6,"f":1,"lieux":[],"m":[{"k":"mine","max":3,"min":3},{"k":"paralyzor","max":2,"min":2}],"n":"Mines & Sentinelles","on":1,"pats":["navette","ronde"]},{"cout":3,"f":1,"lieux":[],"m":[{"k":"paralyzor","max":3,"min":2}],"n":"2-3 sentinelles","on":1,"pats":["territoire","ronde","navette"]},{"cout":3,"f":0,"lieux":["ext"],"m":[{"k":"brochon","max":2,"min":1}],"n":"Banc de torpilles","on":1,"pats":["errance"]},{"cout":11,"f":1,"lieux":[],"m":[{"k":"mastok","max":1,"min":1}],"n":"Broyeur solitaire","on":1,"pats":["territoire","garde","sentinelle"]},{"cout":10,"f":0,"lieux":[],"m":[{"k":"puce","max":8,"min":6},{"k":"mine","max":1,"min":0}],"n":"Puces en groupes","on":1,"pats":["voyage"]},{"cout":10,"f":1,"lieux":[],"m":[{"k":"gardien","max":1,"min":1},{"k":"paralyzor","max":2,"min":1}],"n":"Poste de garde","on":1,"pats":["garde"]},{"cout":13,"f":1,"lieux":[],"m":[{"k":"artilleur","max":2,"min":2},{"k":"gardien","max":1,"min":0}],"n":"Batterie","on":1,"pats":["garde","sentinelle"]},{"cout":3,"f":1,"lieux":["bati","ext"],"m":[{"k":"drone","max":5,"min":3}],"n":"Essaim de drones","on":1,"pats":["voyage","navette","ronde"]},{"cout":6,"f":1,"lieux":[],"m":[{"k":"crabos","max":2,"min":2},{"k":"soudeur","max":1,"min":1}],"n":"Escouade de réparation","on":1,"pats":["ronde","navette"]},{"cout":4,"f":1,"lieux":[],"m":[{"k":"englueur","max":2,"min":1},{"k":"mine","max":2,"min":1}],"n":"Embuscade gluante","on":1,"pats":["affut"]},{"cout":7,"f":1,"lieux":["ext"],"m":[{"k":"englueur","max":1,"min":1},{"k":"cafar","max":4,"min":3}],"n":"Chasse à courre","on":1,"pats":["voyage","navette"]},{"cout":11,"f":1,"lieux":[],"m":[{"k":"gardien","max":1,"min":1},{"k":"soudeur","max":1,"min":1},{"k":"drone","max":2,"min":2}],"n":"Convoi","on":1,"pats":["navette"]},{"cout":5,"f":1,"lieux":[],"m":[{"k":"artilleur","max":2,"min":1}],"n":"Tireurs embusqués","on":1,"pats":["affut","sentinelle"]},{"cout":2,"f":1,"lieux":[],"m":[{"k":"drone","max":2,"min":2},{"k":"paralyzor","max":1,"min":1}],"n":"Ronde de drones","on":1,"pats":["ronde"]}],"niv":{"1":{"budget":80,"gr":["Crabots","Bande de relais","1-2 Mines","Banc de torpilles","Puces en groupes"],"part":{"bati":20,"ext":75,"tunnel":5}},"2":{"budget":96,"gr":["Crabots","Large crabot groupe","Bande de relais","Family","3-5 puces + sentinelles","1-2 Mines","Mines & Sentinelles","2-3 sentinelles","Banc de torpilles","Broyeur solitaire","Puces en groupes","Batterie","Essaim de drones","Tireurs embusqués","Ronde de drones"],"part":{"bati":18,"ext":80,"tunnel":2}},"3":{"budget":112,"gr":["Crabots","Large crabot groupe","Bande de relais","Family","3-5 puces + sentinelles","1-2 Mines","Mines & Sentinelles","2-3 sentinelles","Banc de torpilles","Broyeur solitaire","Puces en groupes","Poste de garde","Batterie","Essaim de drones","Escouade de réparation","Embuscade gluante","Chasse à courre","Convoi","Tireurs embusqués","Ronde de drones"],"part":{"bati":60,"ext":35,"tunnel":5}}},"pente":20,"v":2};
  const C = Object.assign({n: 6, bat: 2000, defaut: false, g0: 1}, window.MO || {});
  const raf = window.requestAnimationFrame; window.requestAnimationFrame = () => 0;
  const vrai = Math.random, sauveGen = JSON.parse(JSON.stringify(GEN));
  const graine = s => {let a = s >>> 0; Math.random = () => {a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296;};};
  if (!C.defaut && REG) {APPLYING = true; try {applySaved({enregistreLe: new Date(0).toISOString(), groupes: JSON.parse(JSON.stringify(REG))});} finally {APPLYING = false;}}
  const R = {cartes: []};
  try {
    for (let s = C.g0; s < C.g0 + C.n; s++) {
      graine(s); recRange(); recPrend('atterrissage'); hasardReglages(); enJeu(newGame, 1);
      fog = true; started = true; $('overlay').hidden = true; G.st.vie = G.st.vieMax = 100000; computeFOV();
      const tous = () => (G.beasts || []).concat(G.animals || []);
      const fer = () => tous().filter(o => o.role === 'ferraille' && G.patr[o.gi]);
      const contre = o => {const P = G.patr[o.gi]; return P && P.k === 0 && P.pause > 0 && !P.ouv && !!ouvrCoque(P.epave, o.x, o.y);};
      const c = {graine: s, groupes: {}, depart: {vues: 0, auTravail: 0, ferrailleuses: fer().length}, hostilesChantierDehors: 0};
      for (const o of fer()) if (vis[idx(o.x, o.y)]) {c.depart.vues++; if (contre(o)) c.depart.auTravail++;}
      c.hcd = []; for (const o of G.beasts) if (!o.role && OUVR_CHANTIER.includes(BEASTS[o.sp].key) && lieuDe(idx(o.x, o.y)) === 'ext') {c.hostilesChantierDehors++; c.hcd.push((GROUPES.liste[o.gr] || {}).n + '@' + [o.x, o.y] + ' gi' + o.gi + ' lieux ' + G.beasts.concat(G.animals).filter(x => x.gi === o.gi).map(x => lieuDe(idx(x.x, x.y))).join('/'));}
      const ids = [...new Set(fer().map(o => o.gi))];
      for (const id of ids) {const P = G.patr[id], m = fer().filter(o => o.gi === id), e = ouvrEpave(P);
        c.groupes[id] = {nom: GROUPES.liste[m[0].gr] ? GROUPES.liste[m[0].gr].n : '?', n: m.length, sp: m.map(o => G.beasts.includes(o) ? BEASTS[o.sp].key : 'puce').join(','),
          trajet: P.trajet, decoupe: P.decoupe, quaiSas: P.pts && P.pts[1] && G.sas != null && idx(P.pts[1][0], P.pts[1][1]) === G.sas,
          etat: e ? e.etat : '-', halte: 0, poste: 0, contre: 0, mb: 0, cycles: 0, kPrec: P.k, dedans: 0, memeCase: 0};}
      for (let b = 0; b < C.bat && !G.over; b++) {pass(100, true);
        const occ = {};
        for (const id of ids) {const P = G.patr[id], g = c.groupes[id]; if (!P) continue; const m = fer().filter(o => o.gi === id);
          if (P.k === 0 && P.pause > 0 && !P.ouv) g.halte++;
          for (const o of m) {g.mb++; if (P.k === 0 && P.pause > 0 && o.poste >= 0 && idx(o.x, o.y) === o.poste) g.poste++; if (contre(o)) {g.contre++; const e = ouvrEpave(P); if (ouvrDist(e, o.x, o.y) === 0) g.dedans++;}}
          if (P.k !== g.kPrec) {if (P.k === 0) g.cycles++; g.kPrec = P.k;}}}
      for (const id of ids) {const g = c.groupes[id]; g.part = g.mb ? +(g.contre / g.mb * 100).toFixed(1) : null; g.halte = +(g.halte / C.bat * 100).toFixed(1); g.poste = g.mb ? +(g.poste / g.mb * 100).toFixed(1) : null; delete g.kPrec;}
      R.cartes.push(c);}
  } finally {Math.random = vrai; window.requestAnimationFrame = raf; genRemet(sauveGen);}
  return JSON.stringify(R);
})()
