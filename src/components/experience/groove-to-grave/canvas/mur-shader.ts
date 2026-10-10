/**
 * Le mur en WebGL2 brut : un quad plein écran et ce fragment shader. Papier procédural (grain,
 * froissé dans l'esprit du flyer Marcounet, traces de colle), lambeaux d'affiches abstraits en
 * aplats crème, rouge et vert. Jamais une pochette ni un flyer du label : leurs œuvres ne sont
 * ni déchirées ni texturées. Partagé par le composant client et le script du repli statique
 * (scripts/g2g-mur-statique.ts), qui rendent exactement la même image.
 *
 * Uniforms : u_resolution (px), u_temps (s, figé quand rien ne joue), u_graves (0 à 1, énergie
 * 40 à 160 Hz), u_coup (0 à 1, attaque de grosse caisse qui décroît), u_couleurs (wall, poster,
 * red, green en RGB 0 à 1), u_echelle (DPR).
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
uniform float u_echelle;
uniform vec3 u_wall;
uniform vec3 u_poster;
uniform vec3 u_red;
uniform vec3 u_green;

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

// Lambeau d'affiche : polygone doux aux bords déchirés par du bruit, 1 dedans, 0 dehors.
float lambeau(vec2 p, vec2 centre, vec2 taille, float angle, float graine) {
  vec2 d = p - centre;
  float c = cos(angle), s = sin(angle);
  d = vec2(c * d.x - s * d.y, s * d.x + c * d.y) / taille;
  float bord = max(abs(d.x), abs(d.y));
  float dechirure = (fbm(d * 6.0 + graine) - 0.5) * 0.35;
  return 1.0 - smoothstep(0.78 + dechirure, 0.86 + dechirure, bord);
}

void main() {
  // Coordonnées en pixels CSS, origine en bas à gauche, indépendantes du DPR.
  vec2 px = gl_FragCoord.xy / u_echelle;
  vec2 uv = px / 900.0;
  // Respiration : déplacement de 3 px au plus sur l'énergie des graves, tremblement sur l'attaque.
  float tremble = u_coup * sin(u_temps * 90.0) * 1.5;
  vec2 depl = vec2(0.0, u_graves * 3.0 + tremble) / 900.0;
  uv += depl;

  // Papier : teinte wall, grain fin, froissé à deux échelles éclairé en biais.
  float grain = (bruit(px * 0.9) - 0.5) * 0.045 + (bruit(px * 2.7 + 5.0) - 0.5) * 0.025;
  float plis = fbm(uv * 3.2) ;
  float plisFin = fbm(uv * 11.0 + 3.0);
  vec2 g = vec2(fbm(uv * 3.2 + vec2(0.012, 0.0)) - plis, fbm(uv * 3.2 + vec2(0.0, 0.012)) - plis);
  float lumiere = clamp(0.5 + dot(g, vec2(18.0, 12.0)), 0.0, 1.0);
  vec3 papier = u_wall * (0.93 + 0.14 * lumiere) + grain;
  papier *= 1.0 - 0.06 * smoothstep(0.55, 0.9, plisFin);

  // Traces de colle : taches translucides plus sombres et un peu brillantes.
  float colle = smoothstep(0.62, 0.75, fbm(uv * 1.7 + 40.0)) * 0.08;
  papier *= 1.0 - colle;
  papier += colle * 0.4 * lumiere;

  // Lambeaux d'affiches abstraits, trois couches, couleurs du label en aplats.
  vec3 couleur = papier;
  float l1 = lambeau(uv, vec2(0.22, 0.78), vec2(0.34, 0.22), 0.08, 1.0);
  couleur = mix(couleur, u_poster * (0.96 + 0.08 * lumiere) + grain, l1 * 0.85);
  float l2 = lambeau(uv, vec2(1.25, 0.35), vec2(0.28, 0.4), -0.12, 2.0);
  couleur = mix(couleur, u_red * (0.9 + 0.14 * lumiere) + grain, l2 * 0.62);
  float l3 = lambeau(uv, vec2(0.72, 0.18), vec2(0.42, 0.14), 0.05, 3.0);
  couleur = mix(couleur, u_green * (0.9 + 0.14 * lumiere) + grain, l3 * 0.6);
  float l4 = lambeau(uv, vec2(1.55, 0.92), vec2(0.22, 0.18), 0.2, 4.0);
  couleur = mix(couleur, u_poster * (0.94 + 0.08 * lumiere) + grain, l4 * 0.9);
  float l5 = lambeau(uv, vec2(0.05, 0.3), vec2(0.18, 0.3), -0.3, 5.0);
  couleur = mix(couleur, u_red * (0.86 + 0.14 * lumiere) + grain, l5 * 0.4);
  float l6 = lambeau(uv, vec2(0.95, 0.62), vec2(0.12, 0.09), 0.35, 6.0);
  couleur = mix(couleur, u_green * (0.9 + 0.14 * lumiere) + grain, l6 * 0.55);
  float l7 = lambeau(uv, vec2(1.42, 0.08), vec2(0.16, 0.07), -0.08, 7.0);
  couleur = mix(couleur, u_poster * (0.94 + 0.08 * lumiere) + grain, l7 * 0.8);

  // Les lambeaux restent sous les plis du papier.
  couleur *= 0.97 + 0.06 * lumiere;
  fragColor = vec4(couleur, 1.0);
}
`

/** Couleurs du shader depuis les tokens, en RGB 0 à 1. */
export function rgb01(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16)
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]
}

/**
 * Compile le programme et rend sur un contexte WebGL2. Retourne la fonction de rendu, ou null si
 * le contexte ou la compilation échoue (repli statique).
 */
export function creerMur(gl: WebGL2RenderingContext, couleurs: { wall: string; poster: string; red: string; green: string }): ((largeur: number, hauteur: number, echelle: number, temps: number, graves: number, coup: number) => void) | null {
  const compiler = (type: number, source: string) => {
    const sh = gl.createShader(type)
    if (!sh) return null
    gl.shaderSource(sh, source)
    gl.compileShader(sh)
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) return null
    return sh
  }
  const vs = compiler(gl.VERTEX_SHADER, VERTEX)
  const fs = compiler(gl.FRAGMENT_SHADER, FRAGMENT)
  const prog = gl.createProgram()
  if (!vs || !fs || !prog) return null
  gl.attachShader(prog, vs)
  gl.attachShader(prog, fs)
  gl.linkProgram(prog)
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null
  const buf = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, buf)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
  const pos = gl.getAttribLocation(prog, 'a_pos')
  gl.enableVertexAttribArray(pos)
  gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0)
  gl.useProgram(prog)
  const u = (nom: string) => gl.getUniformLocation(prog, nom)
  gl.uniform3fv(u('u_wall'), rgb01(couleurs.wall))
  gl.uniform3fv(u('u_poster'), rgb01(couleurs.poster))
  gl.uniform3fv(u('u_red'), rgb01(couleurs.red))
  gl.uniform3fv(u('u_green'), rgb01(couleurs.green))
  const uRes = u('u_resolution')
  const uTemps = u('u_temps')
  const uGraves = u('u_graves')
  const uCoup = u('u_coup')
  const uEchelle = u('u_echelle')
  return (largeur, hauteur, echelle, temps, graves, coup) => {
    gl.viewport(0, 0, largeur, hauteur)
    gl.uniform2f(uRes, largeur, hauteur)
    gl.uniform1f(uTemps, temps)
    gl.uniform1f(uGraves, graves)
    gl.uniform1f(uCoup, coup)
    gl.uniform1f(uEchelle, echelle)
    gl.drawArrays(gl.TRIANGLES, 0, 3)
  }
}
