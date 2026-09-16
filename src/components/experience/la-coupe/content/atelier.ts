import type { Distinction, Membre } from './types'

export const atelier = {
  titre: 'L’atelier',
  intro:
    "Fondé en 2011 par Mireille Vasseur, l'atelier réunit six architectes dans un ancien atelier de reliure du treizième arrondissement. Nous construisons des maisons, des écoles, des logements et des lieux publics, en France, pour des maîtres d'ouvrage publics et privés.",
  texte: [
    "Nous croyons que la qualité d'un bâtiment se juge à vingt ans, pas à la livraison. Cela oriente tout : des plans simples que l'on peut modifier, des matériaux qui vieillissent bien, des détails que les artisans savent faire, et un budget tenu pour qu'il reste de quoi entretenir.",
    "L'atelier travaille en maquette dès le premier jour. On comprend un volume avec les mains avant de le comprendre à l'écran, et un client comprend une maquette sans qu'on ait besoin de lui expliquer.",
  ],
  methode: [
    {
      id: 'ecouter',
      titre: 'Écouter',
      texte:
        "Le programme n'est jamais la commande telle qu'elle arrive. Nous passons du temps sur le site, avec ceux qui l'utiliseront, avant de dessiner quoi que ce soit.",
    },
    {
      id: 'dessiner',
      titre: 'Dessiner',
      texte:
        "Plans, coupes, maquettes, à toutes les échelles et dans tous les sens, jusqu'à ce que le projet tienne en une phrase et en un dessin.",
    },
    {
      id: 'construire',
      titre: 'Construire',
      texte:
        "Nous suivons les chantiers de près, chaque semaine, parce que c'est là que le projet devient vrai, et que la moitié des bonnes idées y naissent.",
    },
  ],
  equipe: [
    { nom: 'Mireille Vasseur', role: 'Architecte fondatrice', photo: 'equipe-01' },
    { nom: 'Karim Belkacem', role: 'Architecte associé, chantiers', photo: 'equipe-02' },
    { nom: 'Louise Ferrand', role: 'Architecte, chef de projet', photo: 'equipe-03' },
    { nom: 'Tomás Herrera', role: 'Architecte, maquettes et images', photo: 'equipe-04' },
    { nom: 'Anaïs Morel', role: 'Architecte HMONP', photo: 'equipe-05' },
    { nom: 'Jules Kéita', role: 'Économiste de la construction', photo: 'equipe-06' },
  ] satisfies Membre[],
  distinctions: [
    { annee: 2025, label: 'Prix national de la construction bois, catégorie équipement, Médiathèque des Tanneurs' },
    { annee: 2024, label: 'Équerre d’argent, mention logement, Les Terrasses du Canal' },
    { annee: 2023, label: 'Lauréat du prix Architecture & Réemploi, Halle Saint-Ouen' },
    { annee: 2021, label: 'Nommée aux AJAP' },
  ] satisfies Distinction[],
  publications: [
    { annee: 2025, label: 'AMC n° 322, « Terre crue porteuse : l’école des Hauts-Champs »' },
    { annee: 2024, label: 'Le Moniteur, « Quarante-huit logements sous le coût moyen »' },
    { annee: 2023, label: 'D’architectures n° 306, portfolio Maison des Vignes' },
    { annee: 2022, label: 'Exposition « Réparer la ville », Pavillon de l’Arsenal' },
  ] satisfies Distinction[],
}
