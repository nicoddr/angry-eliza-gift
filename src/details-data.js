export const PAINTING_ASPECT = 838 / 1024;
export const PAINTING_H = 2.0;
export const PAINTING_W = PAINTING_H * PAINTING_ASPECT; // ~1.6367
export const PAINTING_D = 0.092;

export const DETAIL_STOPS = [
  {
    id: 'right-eye',
    u: 0.368,
    v: 0.426,
    span: 0.36,
    side: 'front',
    en: {
      title: 'Right Eye',
      text: 'Even when you pretend to be angry at me, I still get completely lost in the way you look at me.',
    },
    fr: {
      title: 'Œil droit',
      text: "Ce regard si joli que tu as quand tu me regardes… même quand tu fais semblant d'être fâchée, je pourrais me perdre dans tes yeux.",
    },
  },
  {
    id: 'left-eye',
    u: 0.586,
    v: 0.422,
    span: 0.36,
    side: 'front',
    en: {
      title: 'Left Eye',
      text: 'That fierce little furrow in your brow — serious for half a second, until the warmth in your eyes gives you away.',
    },
    fr: {
      title: 'Œil gauche',
      text: 'Ce petit froncement de sourcil — sévère une demi-seconde, avant que toute la douceur de ton regard ne te trahisse.',
    },
  },
  {
    id: 'nose',
    u: 0.485,
    v: 0.495,
    span: 0.40,
    side: 'front',
    en: {
      title: 'Your Nose',
      text: 'That soft rosy blush right across your nose, like you just walked in from the winter snow.',
    },
    fr: {
      title: 'Ton nez',
      text: "Cette petite touche rosée sur le bout de ton nez, comme si tu venais juste de rentrer du froid de l'hiver.",
    },
  },
  {
    id: 'beauty-mark',
    u: 0.596,
    v: 0.505,
    span: 0.32,
    side: 'front',
    en: {
      title: 'That Little Beauty Mark',
      text: 'One tiny brushstroke right beneath your eye — the smallest detail on the canvas, and one of my absolute favorites.',
    },
    fr: {
      title: 'Ton grain de beauté',
      text: "Un tout petit coup de pinceau juste sous ton œil — le plus discret détail de la toile, et l'un de mes préférés.",
    },
  },
  {
    id: 'lips',
    u: 0.488,
    v: 0.590,
    span: 0.46,
    side: 'front',
    en: {
      title: 'Your Lips',
      text: 'A stubborn little crimson pout that tries so hard to stay angry, yet always melts into my favorite smile.',
    },
    fr: {
      title: 'Ta bouche',
      text: 'Cette petite moue rouge carmin qui essaie si fort de rester fâchée, mais qui finit toujours par fondre en mon sourire préféré.',
    },
  },
  {
    id: 'hair',
    u: 0.495,
    v: 0.235,
    span: 0.96,
    side: 'front',
    en: {
      title: 'Your Hair',
      text: 'Soft chestnut waves framing your face — every brushstroke trying to catch the way the light falls through it.',
    },
    fr: {
      title: 'Tes cheveux',
      text: "Tes ondulations châtains qui encadrent ton visage — chaque coup de pinceau essaie de capturer la façon dont la lumière s'y pose.",
    },
  },
  {
    id: 'ears',
    u: 0.220,
    v: 0.440,
    span: 0.40,
    side: 'front',
    en: {
      title: 'Your Ears',
      text: "Tucked gently behind your hair, made for every quiet secret, silly joke, and whispered 'je t'aime'.",
    },
    fr: {
      title: 'Tes oreilles',
      text: 'Glissées doucement derrière tes cheveux, faites pour tous mes secrets, mes blagues et les « je t’aime » murmurés tout près.',
    },
  },
  {
    id: 'earrings',
    u: 0.721,
    v: 0.562,
    span: 0.34,
    side: 'front',
    en: {
      title: 'Your Earrings',
      text: 'Those adorable red berry earrings with their tiny green leaves — impossible to miss, and so unmistakably you.',
    },
    fr: {
      title: "Tes boucles d'oreilles",
      text: "Ces adorables boucles d'oreilles rouges avec leurs petites feuilles vertes — impossibles à manquer, tellement toi.",
    },
  },
  {
    id: 'back',
    u: 0.5,
    v: 0.5,
    span: 1.95,
    side: 'back',
    en: {
      title: 'On the Back of the Canvas',
      text: 'Signed by hand on the reverse, just for you — 11.21.2026, and every winter after.',
    },
    fr: {
      title: 'Au dos de la toile',
      text: 'Signé à la main au dos, rien que pour toi — 11.21.2026, et tous les hivers qui suivront.',
    },
  },
];
