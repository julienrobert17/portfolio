/**
 * Détecteur de creux de mise en page (blocs 7.6 et 7.7), partagé par `g2g-verif.ts` et les scripts
 * de planches. Quatre cas, tous évalués dans la page elle-même :
 *   1. titre orphelin : un titre dont la section ne contient rien d'autre de visible ;
 *   2. section visible vide ;
 *   3. **grille trouée** : dans une grille ou une rangée, une cellule visible qui ne rend ni texte
 *      ni image alors que ses voisines en rendent — c'est le cas qui crève l'écran et que le
 *      détecteur de 7.6 ne voyait pas ;
 *   4. **vide de fin** : plus d'une hauteur d'écran entre le dernier contenu et le pied de page.
 * Exporté comme source JavaScript, à évaluer par le protocole DevTools.
 */
export interface Creux {
  titres: string[]
  sections: string[]
  cellules: string[]
  videDeFin: number
}

export const SCRIPT_CREUX = `(() => {
  const visible = (el) => el.getClientRects().length > 0 && getComputedStyle(el).visibility !== 'hidden';
  // innerText n'existe pas sur un SVG : on retombe sur textContent.
  const texte = (el) => ((el.innerText !== undefined ? el.innerText : el.textContent) || '').trim().length > 0;
  const image = (el) => el.querySelector('img, svg, canvas, picture, video') !== null;
  const rend = (el) => texte(el) || image(el);

  const titres = Array.from(document.querySelectorAll('main h1, main h2, main h3')).filter((h) => {
    const section = h.closest('section, article');
    if (!section || !visible(section)) return false;
    const reste = Array.from(section.children).filter((c) => c !== h && !c.contains(h));
    return reste.length === 0 || reste.every((c) => !rend(c));
  }).map((h) => h.textContent.trim().slice(0, 40));

  const sections = Array.from(document.querySelectorAll('main section, main article')).filter((s) => visible(s) && !rend(s)).map((s) => s.className || s.tagName);

  // Grille trouée : une cellule vide à côté de cellules pleines, dans un parent en grille ou en
  // ligne. On ne regarde que les parents à plusieurs enfants visibles, pour ne pas compter les
  // décors isolés.
  const cellules = [];
  for (const parent of Array.from(document.querySelectorAll('main *'))) {
    const style = getComputedStyle(parent);
    if (!/grid|flex/.test(style.display)) continue;
    if (style.flexDirection === 'column') continue;
    // Les champs de formulaire sont vides par nature : ils ne comptent pas comme des trous.
    const formulaire = (el) => /^(INPUT|TEXTAREA|SELECT|BUTTON|LABEL)$/.test(el.tagName) || el.querySelector('input, textarea, select') !== null;
    const enfants = Array.from(parent.children).filter((c) => visible(c) && !c.hasAttribute('aria-hidden') && getComputedStyle(c).position !== 'absolute' && !formulaire(c));
    if (enfants.length < 2) continue;
    const pleins = enfants.filter(rend);
    if (pleins.length === 0 || pleins.length === enfants.length) continue;
    for (const vide of enfants.filter((c) => !rend(c))) {
      const r = vide.getBoundingClientRect();
      const st = getComputedStyle(vide);
      const trait = parseFloat(st.borderTopWidth) + parseFloat(st.borderBottomWidth) > 0 || st.backgroundImage !== 'none' || (st.backgroundColor !== 'rgba(0, 0, 0, 0)' && st.backgroundColor !== 'transparent');
      // Une cellule vide compte dès qu'elle prend de la place dans la rangée (24 px dans un sens,
      // 8 dans l'autre) ou qu'elle peint un filet : c'est ce qui se voit à l'écran.
      const place = (r.width >= 24 && r.height >= 8) || (r.height >= 24 && r.width >= 8);
      if (!place && !(trait && (r.width >= 24 || r.height >= 24))) continue;
      cellules.push((parent.className || parent.tagName) + ' › ' + (vide.className || vide.tagName) + ' ' + Math.round(r.width) + '×' + Math.round(r.height) + (trait ? ' (filet)' : ''));
    }
  }

  // Vide de fin : entre le bas du dernier contenu du main et le haut du pied de page.
  let videDeFin = 0;
  const pied = document.querySelector('.g2g-fin');
  const principal = document.querySelector('main');
  if (pied && principal) {
    let bas = 0;
    for (const el of Array.from(principal.querySelectorAll('*'))) {
      if (!visible(el) || (!texte(el) && !image(el))) continue;
      const r = el.getBoundingClientRect();
      if (r.height && r.bottom + window.scrollY > bas) bas = r.bottom + window.scrollY;
    }
    const hautPied = pied.getBoundingClientRect().top + window.scrollY;
    videDeFin = Math.max(0, Math.round(hautPied - bas));
  }
  return { titres, sections, cellules, videDeFin };
})()`

/** Au-delà d'une hauteur d'écran entre le dernier contenu et le pied, c'est un trou. */
export const VIDE_DE_FIN_MAX = (hauteur: number) => hauteur
