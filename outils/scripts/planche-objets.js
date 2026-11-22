// Planche de contrôle : pour chaque objet, l'illustration ASCII (sac, fabricateur) à côté de sa tuile au sol, agrandie.
(() => {
  const d = document.createElement('div');
  d.style.cssText = 'position:fixed;inset:0;z-index:99999;background:#000;display:grid;grid-template-columns:repeat(6,1fr);gap:6px;padding:8px;font:11px monospace;color:#aaa';
  const sans = [];
  TOUT_CONNU = true;
  for (const k in ITEMS) {
    if (ITEMS[k].plan) continue;   // les plans partagent tous la même tuile
    const c = document.createElement('div');
    c.style.cssText = 'border:1px solid #333;padding:4px;display:flex;flex-direction:column;align-items:center;gap:4px';
    c.innerHTML = `<b style="color:#fff">${ITEMS[k].n}</b><pre class="iart" style="margin:0;font-size:11px;line-height:1.05">${ITEMS[k].art ? artHTML(ITEMS[k]) : ''}</pre>`;
    const t = document.createElement('canvas'); t.width = t.height = 80;
    const x = t.getContext('2d'); x.imageSmoothingEnabled = false; x.drawImage(itemTile(k), 0, 0, 80, 80);
    c.appendChild(t); d.appendChild(c);
    if (k !== 'cle' && !TL['o_' + k]) sans.push(k);
  }
  document.body.appendChild(d);
  return 'sans tuile propre : ' + (sans.join(', ') || 'aucun');
})()
