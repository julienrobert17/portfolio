/**
 * Le mur en WebGL2 brut : un quad plein écran et ce fragment shader. Papier procédural (grain,
 * froissé dans l'esprit du flyer Marcounet, traces de colle) et lambeaux d'affiches en papier
 * déchiré : bords nets antialiasés sur un pixel, déchirure fibreuse à l'échelle de 2 à 4 px,
 * liseré de 1 px un peu plus sombre, aucun flou ; teintes pâles (poster, wall mêlé de red ou de
 * green à 35 % au plus, tokens lambeauRouge et lambeauVert) ; six lambeaux par écran, 30 % de la
 * largeur au plus chacun, un quart de l'écran couvert en tout, chacun portant une trace
 * d'impression abstraite (trame de points ou filets) à peine plus sombre. Jamais une pochette ni
 * un flyer du label : leurs œuvres ne sont ni déchirées ni texturées, aucune forme n'en est reprise.
 * Partagé par le composant client et le script du repli statique (scripts/g2g-mur-statique.ts),
 * qui rendent exactement la même image.
 *
 * Uniforms : u_resolution (px), u_temps (s, figé quand rien ne joue), u_graves (0 à 1, énergie
 * 40 à 160 Hz), u_coup (0 à 1, attaque de grosse caisse qui décroît), u_avance (0 à 1, avance
 * rapide de 400 ms : bandes de suivi horizontales et décalage chromatique, sur le papier
 * seulement), u_echelle (DPR), couleurs en RGB 0 à 1.
 *
 * Le grain le plus sombre du papier vaut wall × 0,93 × 0,94 × 0,92 × 0,97 − 0,035 ; les lambeaux
 * descendent à 0,98 × 0,9 − 0,021 (trame ou liseré). Ces facteurs sont repris dans tokens.ts
 * (PAPIER_SOMBRE, LAMBEAU) et vérifiés par tokens.test.ts (ink à 7:1 au moins).
 */
export const VERTEX = `#version 300 es
in vec2 a_pos;
void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }
`

export const FRAGMENT = `#version 300 es
precision highp float;
out vec4 fragColor;
uniform vec2 u_resolution;
uniform float u_temps;
uniform float u_graves;
uniform float u_coup;
uniform float u_avance;
uniform float u_echelle;
uniform vec3 u_wall;
uniform vec3 u_poster;
uniform vec3 u_lambeauRouge;
uniform vec3 u_lambeauVert;

// Bruit de valeur et fbm, déterministes : la même image sur le canvas et dans la texture de repli.
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }
float bruit(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y);
}
float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int k = 0; k < 5; k++) { v += a * bruit(p); p = p * 2.03 + 17.1; a *= 0.5; }
  return v;
}
// Trois octaves suffisent aux déchirures : moins de travail par pixel sur mobile.
float fbm3(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int k = 0; k < 3; k++) { v += a * bruit(p); p = p * 2.03 + 17.1; a *= 0.5; }
  return v;
}

// Lambeau de papier déchiré : distance signée (px) à un rectangle tourné, déchirée par une
// ondulation large (fbm, ~80 px) et par des fibres de 2 à 4 px (bruit fin). 1 dedans, 0 dehors,
// antialiasé sur 1,2 px ; liser vaut 1 sur le pixel qui longe le bord, dedans ; trame vaut 1 sur
// la trace d'impression (trame de points de 8 px ou trois filets de 3 px selon la graine), toujours
// abstraite, dans le repère du lambeau, jamais sur le liseré.
float lambeau(vec2 px, vec2 centre, vec2 demi, float angle, float graine, out float liser, out float trame) {
  vec2 d = px - centre;
  float c = cos(angle), s = sin(angle);
  d = vec2(c * d.x - s * d.y, s * d.x + c * d.y);
  vec2 q = abs(d) - demi;
  float sd = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0);
  sd += (fbm3(d * 0.012 + graine) - 0.5) * 18.0;
  sd += (bruit(d * 0.38 + graine * 3.0) - 0.5) * 3.6;
  float dedans = 1.0 - smoothstep(-0.6, 0.6, sd);
  liser = dedans * smoothstep(-2.0, -0.8, sd);
  if (mod(graine, 2.0) < 1.0) {
    vec2 g = (fract(d / 8.0) - 0.5) * 8.0;
    trame = 1.0 - smoothstep(1.6, 2.6, length(g));
  } else {
    float ecart = demi.y * 0.5;
    float dy = abs(mod(d.y + ecart * 0.5, ecart) - ecart * 0.5);
    trame = (1.0 - smoothstep(1.0, 2.0, dy)) * step(abs(d.y), demi.y * 0.8) * step(abs(d.x), demi.x * 0.85);
  }
  trame *= dedans * (1.0 - liser);
  return dedans;
}

// Le papier en un point, en pixels CSS : couleur, lumière des plis et grain, réutilisés par les lambeaux.
vec3 papier(vec2 px, out float lumiere, out float grain) {
  vec2 uv = px / 900.0;
  grain = (bruit(px * 0.9) - 0.5) * 0.045 + (bruit(px * 2.7 + 5.0) - 0.5) * 0.025;
  float plis = fbm(uv * 3.2);
  float plisFin = fbm(uv * 11.0 + 3.0);
  vec2 g = vec2(fbm(uv * 3.2 + vec2(0.012, 0.0)) - plis, fbm(uv * 3.2 + vec2(0.0, 0.012)) - plis);
  lumiere = clamp(0.5 + dot(g, vec2(18.0, 12.0)), 0.0, 1.0);
  vec3 p = u_wall * (0.93 + 0.14 * lumiere) + grain;
  p *= 1.0 - 0.06 * smoothstep(0.55, 0.9, plisFin);
  // Traces de colle : taches translucides plus sombres et un peu brillantes.
  float colle = smoothstep(0.62, 0.75, fbm(uv * 1.7 + 40.0)) * 0.08;
  p *= 1.0 - colle;
  p += colle * 0.4 * lumiere;
  return p * (0.97 + 0.06 * lumiere);
}

// Les six lambeaux posés sur le papier : placés en fractions de l'écran (largeur 30 % au plus
// chacun, 24 % de la surface en tout), opaques, à peine modelés par la lumière, trame
// d'impression à 0,9, liseré sombre de 1 px à 0,9 (facteurs repris dans tokens.ts, LAMBEAU).
vec3 lambeaux(vec2 px, vec3 fond, float lumiere, float grain) {
  vec2 R = u_resolution / u_echelle;
  vec3 couleur = fond;
  float liser;
  float trame;
  float l;
  vec3 teinte;
  float relief = 0.98 + 0.04 * lumiere;
  l = lambeau(px, R * vec2(0.14, 0.80), R * vec2(0.14, 0.11), 0.08, 1.0, liser, trame);
  teinte = (u_poster * relief + grain * 0.6) * (1.0 - 0.1 * trame) * (1.0 - 0.1 * liser);
  couleur = mix(couleur, teinte, l);
  l = lambeau(px, R * vec2(0.80, 0.36), R * vec2(0.11, 0.15), -0.12, 2.0, liser, trame);
  teinte = (u_lambeauRouge * relief + grain * 0.6) * (1.0 - 0.1 * trame) * (1.0 - 0.1 * liser);
  couleur = mix(couleur, teinte, l);
  l = lambeau(px, R * vec2(0.46, 0.16), R * vec2(0.13, 0.07), 0.05, 3.0, liser, trame);
  teinte = (u_lambeauVert * relief + grain * 0.6) * (1.0 - 0.1 * trame) * (1.0 - 0.1 * liser);
  couleur = mix(couleur, teinte, l);
  l = lambeau(px, R * vec2(0.92, 0.88), R * vec2(0.09, 0.10), 0.2, 4.0, liser, trame);
  teinte = (u_poster * relief + grain * 0.6) * (1.0 - 0.1 * trame) * (1.0 - 0.1 * liser);
  couleur = mix(couleur, teinte, l);
  l = lambeau(px, R * vec2(0.05, 0.30), R * vec2(0.07, 0.05), -0.3, 5.0, liser, trame);
  teinte = (u_lambeauRouge * relief + grain * 0.6) * (1.0 - 0.1 * trame) * (1.0 - 0.1 * liser);
  couleur = mix(couleur, teinte, l);
  l = lambeau(px, R * vec2(0.62, 0.62), R * vec2(0.10, 0.06), 0.35, 6.0, liser, trame);
  teinte = (u_lambeauVert * relief + grain * 0.6) * (1.0 - 0.1 * trame) * (1.0 - 0.1 * liser);
  couleur = mix(couleur, teinte, l);
  return couleur;
}

void main() {
  // Coordonnées en pixels CSS, origine en bas à gauche, indépendantes du DPR.
  vec2 px = gl_FragCoord.xy / u_echelle;
  // Respiration : déplacement de 3 px au plus sur l'énergie des graves, tremblement sur l'attaque.
  float tremble = u_coup * sin(u_temps * 90.0) * 1.5;
  px.y += u_graves * 3.0 + tremble;

  // Avance rapide : enveloppe 0 → 1 → 0 sur les 400 ms, bandes de suivi horizontales qui défilent
  // (décalage de 14 px au plus) et décalage chromatique de 3 px, sur le papier seulement. Le papier
  // n'est calculé qu'une fois : seuls les lambeaux sont rééchantillonnés pour le rouge et le bleu.
  float env = u_avance > 0.0 ? sin(3.14159 * clamp(u_avance, 0.0, 1.0)) : 0.0;
  float lumiere;
  float grain;
  if (env > 0.0) {
    float y = px.y + u_temps * 900.0;
    float rangee = floor(y / 22.0);
    float bande = step(0.55, hash(vec2(rangee, 3.0))) * (hash(vec2(rangee, 9.0)) - 0.5) * 2.0;
    float large = (bruit(vec2(0.0, y / 140.0)) - 0.5) * 2.0;
    px.x += (bande * 14.0 + large * 5.0) * env;
    float dx = 3.0 * env;
    vec3 fond = papier(px, lumiere, grain);
    vec3 c = lambeaux(px, fond, lumiere, grain);
    c.r = lambeaux(px + vec2(dx, 0.0), fond, lumiere, grain).r;
    c.b = lambeaux(px - vec2(dx, 0.0), fond, lumiere, grain).b;
    // Lignes de bruit claires sur quelques bandes.
    c += step(0.9, hash(vec2(rangee, 5.0))) * bruit(vec2(px.x * 0.6, rangee)) * 0.08 * env;
    fragColor = vec4(c, 1.0);
    return;
  }
  vec3 fond = papier(px, lumiere, grain);
  fragColor = vec4(lambeaux(px, fond, lumiere, grain), 1.0);
}
`

/** Couleurs du shader depuis les tokens, en RGB 0 à 1. */
export function rgb01(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16)
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]
}

export interface CouleursMur {
  wall: string
  poster: string
  lambeauRouge: string
  lambeauVert: string
}

export type RenduMur = (largeur: number, hauteur: number, echelle: number, temps: number, graves: number, coup: number, avance: number) => void

/**
 * Compile et lie le programme sans attendre le résultat. Avec l'extension
 * KHR_parallel_shader_compile, l'appelant attend `pretAEtreLie()` avant d'appeler `creerMur` :
 * la compilation ne bloque jamais le fil principal. Null si le contexte refuse.
 */
export function compilerMur(gl: WebGL2RenderingContext): { programme: WebGLProgram; pretAEtreLie: () => boolean } | null {
  const compiler = (type: number, source: string) => {
    const sh = gl.createShader(type)
    if (!sh) return null
    gl.shaderSource(sh, source)
    gl.compileShader(sh)
    return sh
  }
  const vs = compiler(gl.VERTEX_SHADER, VERTEX)
  const fs = compiler(gl.FRAGMENT_SHADER, FRAGMENT)
  const programme = gl.createProgram()
  if (!vs || !fs || !programme) return null
  gl.attachShader(programme, vs)
  gl.attachShader(programme, fs)
  gl.linkProgram(programme)
  const ext = gl.getExtension('KHR_parallel_shader_compile') as { COMPLETION_STATUS_KHR: number } | null
  return { programme, pretAEtreLie: () => (ext ? Boolean(gl.getProgramParameter(programme, ext.COMPLETION_STATUS_KHR)) : true) }
}

/**
 * Vérifie l'édition de liens, pose le quad, les couleurs et l'effacement en wall, et retourne la
 * fonction de rendu ; null si la compilation a échoué (repli statique). Sans programme fourni,
 * compile d'abord (script du repli statique).
 */
export function creerMur(gl: WebGL2RenderingContext, couleurs: CouleursMur, programme?: WebGLProgram): RenduMur | null {
  const prog = programme ?? compilerMur(gl)?.programme
  if (!prog || !gl.getProgramParameter(prog, gl.LINK_STATUS)) return null
  const buf = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, buf)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
  const pos = gl.getAttribLocation(prog, 'a_pos')
  gl.enableVertexAttribArray(pos)
  gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0)
  gl.useProgram(prog)
  const [r, g, b] = rgb01(couleurs.wall)
  gl.clearColor(r, g, b, 1)
  const u = (nom: string) => gl.getUniformLocation(prog, nom)
  gl.uniform3fv(u('u_wall'), rgb01(couleurs.wall))
  gl.uniform3fv(u('u_poster'), rgb01(couleurs.poster))
  gl.uniform3fv(u('u_lambeauRouge'), rgb01(couleurs.lambeauRouge))
  gl.uniform3fv(u('u_lambeauVert'), rgb01(couleurs.lambeauVert))
  const uRes = u('u_resolution')
  const uTemps = u('u_temps')
  const uGraves = u('u_graves')
  const uCoup = u('u_coup')
  const uAvance = u('u_avance')
  const uEchelle = u('u_echelle')
  return (largeur, hauteur, echelle, temps, graves, coup, avance) => {
    gl.viewport(0, 0, largeur, hauteur)
    gl.clear(gl.COLOR_BUFFER_BIT)
    gl.uniform2f(uRes, largeur, hauteur)
    gl.uniform1f(uTemps, temps)
    gl.uniform1f(uGraves, graves)
    gl.uniform1f(uCoup, coup)
    gl.uniform1f(uAvance, avance)
    gl.uniform1f(uEchelle, echelle)
    gl.drawArrays(gl.TRIANGLES, 0, 3)
  }
}
