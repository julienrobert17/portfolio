/** Import de fichiers texte bruts par Vite (`?raw`), utilisé pour le guide du label. */
declare module '*.md?raw' {
  const contenu: string
  export default contenu
}
