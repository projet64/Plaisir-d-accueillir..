// Menu du samedi 14 novembre 2026 — 10 convives, préparé avec Claude.
// La veille (vendredi 13) : agneau 7 h au four, velouté, poires, crumble, gougères pochées, sucettes de foie gras.
// Le jour même : four libre sauf gougères (19 h 40) puis réchauffage de l'agneau (≈ 20 h 25).
const S = (text, minutes, o = {}) => ({ text, minutes, passive: !!o.passive, veille: !!o.veille, watch: o.watch || '' });
const I = (name, qty, unit = '') => ({ name, qty, unit });
const POELE = 'À la poêle très chaude ou à la plancha, au choix.';

module.exports = {
  key: 'menu-2026-11-14-v1',
  date: '2026-11-14',
  notes: `Menu préparé avec Claude — « Plaisir d’accueillir », dîner d’automne pour 10.
Principe : presque tout se fait la veille (vendredi 13). Le soir même, seulement les gougères au four, les Saint-Jacques et les pélardons à la poêle ou à la plancha, et l’agneau qui réchauffe.
Four le samedi : gougères 19 h 40 → 20 h, puis agneau à 150 °C ≈ 20 h 25 → 21 h.
Vins : champagne à l’apéro · Costières blanc avec le velouté · Pic Saint-Loup ou Costières rouge avec l’agneau · muscat de Lunel avec les poires.`,
  recipes: [
    {
      course: 'apero', photo: ['gougeres', 'gougère cheese puffs'],
      name: 'Gougères au comté', category: 'apero', servings: 10, prep_minutes: 75, difficulty: 'Moyen',
      description: 'Le classique des Champenois avec leur vin. La pâte est pochée la veille, il ne reste que 20 minutes de four avant l’arrivée des invités. Environ 40 pièces.',
      ingredients: [I('Eau', 125, 'ml'), I('Lait entier', 125, 'ml'), I('Beurre', 100, 'g'), I('Farine', 150, 'g'), I('Œufs', 4), I('Comté râpé (affiné 18 mois)', 150, 'g'), I('Sel', 1, 'c. à c.'), I('Noix de muscade', null), I('Poivre', null)],
      steps: [
        S('Porter à ébullition l’eau, le lait, le beurre en morceaux et le sel.', 5, { veille: true }),
        S('Hors du feu, verser la farine d’un coup et mélanger vivement à la spatule. Remettre 2 minutes sur feu doux pour dessécher la pâte.', 4, { veille: true, watch: 'La pâte forme une boule lisse qui se décolle de la casserole.' }),
        S('Laisser tiédir 5 minutes, puis incorporer les œufs un par un en mélangeant bien entre chaque. Ajouter les 2/3 du comté, muscade et poivre.', 10, { veille: true, watch: 'La pâte est brillante et retombe en ruban épais de la spatule.' }),
        S('Pocher des noix de pâte (à la poche ou à deux cuillères) sur deux plaques couvertes de papier cuisson, bien espacées. Parsemer du reste de comté, filmer et mettre au frais.', 15, { veille: true }),
        S('Préchauffer le four à 190 °C.', 15, { passive: true }),
        S('Enfourner les deux plaques. Ne PAS ouvrir la porte pendant la cuisson.', 22, { passive: true, watch: 'Bien gonflées, dorées et sèches au toucher. Ouvrir trop tôt les fait retomber.' })
      ]
    },
    {
      course: 'apero', photo: ['foie gras lollipop', 'foie gras gingerbread'],
      name: 'Sucettes de foie gras au pain d’épices', category: 'apero', servings: 10, prep_minutes: 30, difficulty: 'Facile',
      description: 'L’effet waouh sans effort le jour J : tout se fait la veille. 20 sucettes, 2 par personne.',
      ingredients: [I('Foie gras de canard mi-cuit', 400, 'g'), I('Pain d’épices', 200, 'g'), I('Piques à sucettes (ou brochettes courtes)', 20), I('Fleur de sel', null), I('Poivre du moulin', null)],
      steps: [
        S('Mixer le pain d’épices en chapelure, puis le faire griller 3 minutes dans une poêle sèche. Laisser refroidir.', 8, { veille: true, watch: 'La chapelure sent le pain grillé et devient croustillante.' }),
        S('Avec les mains bien froides (passées sous l’eau froide), former 20 boules de foie gras d’environ 20 g. Une pointe de fleur de sel et de poivre au cœur.', 15, { veille: true }),
        S('Rouler chaque boule dans la chapelure, planter une pique, et réserver au frais sur une assiette filmée.', 10, { veille: true }),
        S('Sortir les sucettes du réfrigérateur 15 minutes avant de servir.', 15, { passive: true })
      ]
    },
    {
      course: 'apero', photo: ['brandade de morue', 'brandade'],
      name: 'Toasts de brandade de Nîmes', category: 'apero', servings: 10, prep_minutes: 20, difficulty: 'Facile',
      description: 'Le clin d’œil local. Brandade d’un bon traiteur nîmois (ou maison), tiède sur pain grillé, huile d’olive et ciboulette. Une trentaine de toasts.',
      ingredients: [I('Brandade de Nîmes', 500, 'g'), I('Baguette ou pain de campagne fin', 1), I('Huile d’olive', 4, 'c. à s.'), I('Ciboulette', 1), I('Poivre', null)],
      steps: [
        S('Couper le pain en tranches fines (environ 30). Les badigeonner d’huile d’olive.', 8),
        S(`Griller les tranches 1 à 2 minutes par face. ${POELE}`, 8, { watch: 'Dorées et croustillantes, pas sèches.' }),
        S('Réchauffer doucement la brandade dans une casserole, en remuant.', 8, { watch: 'Tiède et souple, elle ne doit pas bouillir.' }),
        S('Garnir les toasts, un filet d’huile d’olive, ciboulette ciselée et un tour de poivre.', 5)
      ]
    },
    {
      course: 'apero', photo: ['seared scallops', 'Saint-Jacques poêlées'],
      name: 'Saint-Jacques snackées, beurre noisette et citron vert', category: 'apero', servings: 10, prep_minutes: 25, difficulty: 'Moyen',
      description: `La surprise en direct, verre de champagne en main : 3 minutes devant tout le monde. 2 noix par personne, servies sur cuillère. ${POELE}`,
      ingredients: [I('Noix de Saint-Jacques sans corail', 20), I('Beurre', 60, 'g'), I('Citron vert', 1), I('Huile neutre', 1, 'c. à s.'), I('Fleur de sel', null), I('Piment d’Espelette', 1, 'pincée')],
      steps: [
        S('Sortir les noix du réfrigérateur 15 minutes avant et les sécher soigneusement sur du papier absorbant.', 15, { passive: true, watch: 'Des noix bien sèches = une belle croûte. Humides, elles bouillent.' }),
        S('Faire fondre le beurre dans une petite casserole jusqu’à ce qu’il devienne noisette, puis le réserver.', 4, { watch: 'Couleur noisette et odeur de biscuit grillé : stopper tout de suite.' }),
        S(`Chauffer fort avec un filet d’huile. Poser les noix et NE PAS y toucher 1 min 30, puis retourner 1 minute. ${POELE}`, 3, { watch: 'Croûte dorée dessus et dessous, cœur encore nacré.' }),
        S('Dresser sur cuillères, arroser de beurre noisette, zester le citron vert, fleur de sel et pointe d’Espelette. Servir immédiatement.', 3)
      ]
    },
    {
      course: 'entree', photo: ['chestnut soup', 'velouté de châtaignes'],
      name: 'Cappuccino de châtaignes, mousse aux cèpes et éclats de lard', category: 'entree', servings: 10, prep_minutes: 60, difficulty: 'Facile',
      description: 'Servi en tasses comme un cappuccino : velouté de châtaignes, mousse de lait infusée aux cèpes, lard grillé émietté. Le velouté et le lait aux cèpes se font la veille.',
      ingredients: [I('Châtaignes cuites (sous vide ou en bocal)', 600, 'g'), I('Oignon', 1), I('Beurre', 30, 'g'), I('Bouillon de volaille', 1, 'l'), I('Crème liquide entière', 20, 'cl'), I('Lait entier (pour la mousse)', 30, 'cl'), I('Cèpes séchés', 15, 'g'), I('Lard fumé en tranches fines', 6), I('Sel', null), I('Poivre', null)],
      steps: [
        S('Faire fondre l’oignon émincé dans le beurre, à feu doux, sans coloration.', 8, { veille: true, watch: 'L’oignon est translucide et fondant.' }),
        S('Ajouter les châtaignes et le bouillon, laisser frémir.', 25, { veille: true, passive: true }),
        S('Mixer longuement avec la crème jusqu’à un velouté très lisse. Saler, poivrer. Réserver au frais.', 6, { veille: true }),
        S('Chauffer le lait avec les cèpes séchés, couvrir et laisser infuser hors du feu. Filtrer, réserver le lait au frais.', 20, { veille: true, passive: true }),
        S('Griller les tranches de lard à sec dans une poêle, les égoutter et les émietter.', 6, { watch: 'Bien croustillant, il se casse net.' }),
        S('Réchauffer le velouté à feu doux. Le détendre d’un peu de bouillon ou d’eau s’il est trop épais.', 10),
        S('Chauffer le lait aux cèpes sans le faire bouillir et l’émulsionner au mixeur plongeant, la tête juste sous la surface.', 3, { watch: 'Une mousse épaisse qui tient à la cuillère.' }),
        S('Verser le velouté aux 2/3 des tasses, couvrir de mousse, parsemer d’éclats de lard. Servir.', 5)
      ]
    },
    {
      course: 'plat', photo: ['slow roasted lamb shoulder', 'épaule d’agneau confite'],
      name: 'Épaule d’agneau confite 7 heures aux épices douces, dattes et amandes', category: 'plat', servings: 10, prep_minutes: 480, difficulty: 'Facile',
      description: 'Cuite la veille au four (vendredi), elle repose une nuit dans son jus et se défait à la cuillère. Le samedi, 35 minutes de réchauffage pendant l’apéro. Sans pois chiches.',
      ingredients: [I('Épaules d’agneau avec os (≈ 2 kg chacune)', 2), I('Oignons', 3), I('Gousses d’ail', 6), I('Ras el hanout', 2, 'c. à s.'), I('Cannelle en bâton', 1), I('Miel', 3, 'c. à s.'), I('Citron confit', 1), I('Bouillon de volaille', 50, 'cl'), I('Huile d’olive', 4, 'c. à s.'), I('Dattes Medjool', 20), I('Amandes émondées', 100, 'g'), I('Coriandre fraîche', 1), I('Sel', null), I('Poivre', null)],
      steps: [
        S('Préchauffer le four à 140 °C. Frotter les épaules avec l’huile, le ras el hanout, le miel, sel et poivre.', 15, { veille: true }),
        S('Dans un grand plat (ou deux), étaler les oignons émincés, l’ail écrasé, la cannelle et le citron confit en quartiers. Poser les épaules dessus, verser le bouillon, couvrir hermétiquement de papier aluminium.', 15, { veille: true }),
        S('Cuire 7 heures à 140 °C. Arroser avec le jus toutes les 2 heures, et rajouter un peu d’eau si le fond accroche.', 420, { veille: true, passive: true, watch: 'La viande se détache de l’os à la cuillère.' }),
        S('Laisser refroidir dans le jus, couvrir et mettre au frais pour la nuit.', 30, { veille: true, passive: true }),
        S('Sortir le plat du réfrigérateur et disposer les dattes autour des épaules.', 5),
        S('Réchauffer au four à 150 °C, toujours couvert.', 35, { passive: true, watch: 'Le jus frémit sur les bords et la viande est chaude à cœur.' }),
        S('Pendant ce temps, torréfier les amandes à sec dans une poêle.', 4, { watch: 'Blondes et parfumées, à surveiller : elles brûlent vite.' }),
        S('Servir à la cuillère, nappé de jus, avec les dattes, les amandes et la coriandre ciselée.', 5)
      ]
    },
    {
      course: 'plat', photo: ['couscous semolina herbs', 'semoule'],
      name: 'Semoule aux herbes et citron', category: 'plat', servings: 10, prep_minutes: 15, difficulty: 'Facile',
      description: 'L’accompagnement de l’agneau, sans cuisson : du bouillon bouillant, 5 minutes de repos, des herbes fraîches.',
      ingredients: [I('Semoule moyenne', 600, 'g'), I('Bouillon de volaille', 75, 'cl'), I('Huile d’olive', 4, 'c. à s.'), I('Beurre', 40, 'g'), I('Menthe fraîche', 1), I('Persil plat', 1), I('Citron', 1), I('Sel', null)],
      steps: [
        S('Dans un grand saladier, mélanger la semoule et l’huile d’olive. Verser le bouillon bouillant, couvrir d’une assiette.', 7, { passive: true }),
        S('Égrainer à la fourchette en incorporant le beurre en morceaux.', 3, { watch: 'Grains bien séparés, pas de paquets.' }),
        S('Ajouter les herbes ciselées et le zeste du citron, rectifier le sel. Garder au chaud couvert.', 5)
      ]
    },
    {
      course: 'fromage', photo: ['pélardon', 'roasted goat cheese honey'],
      name: 'Pélardons rôtis au miel de châtaignier', category: 'fromage', servings: 10, prep_minutes: 15, difficulty: 'Facile',
      description: `On reste sur le terroir : pélardons des Cévennes rôtis sur pain grillé, miel de châtaignier, thym, salade de mâche aux noix. ${POELE} Ou 3 minutes sous le gril du four, libre à ce moment-là.`,
      ingredients: [I('Pélardons des Cévennes', 10), I('Pain de campagne (tranches)', 10), I('Miel de châtaignier', 4, 'c. à s.'), I('Thym frais', 1), I('Mâche', 300, 'g'), I('Cerneaux de noix', 60, 'g'), I('Huile de noix', 3, 'c. à s.'), I('Vinaigre de xérès', 1, 'c. à s.'), I('Fleur de sel', null)],
      steps: [
        S('Vinaigrette : huile de noix, vinaigre de xérès, fleur de sel. Concasser grossièrement les noix.', 3),
        S(`Griller les tranches de pain 1 minute par face. ${POELE}`, 3),
        S('Poser un pélardon sur chaque tranche et laisser chauffer 2 à 3 minutes (couvercle posé sur la poêle, ou sous le gril du four).', 3, { watch: 'Le pélardon commence à fondre sur les bords mais garde sa forme.' }),
        S('Filet de miel, quelques feuilles de thym. Servir avec la mâche assaisonnée et les noix.', 4)
      ]
    },
    {
      course: 'dessert', photo: ['poached pears red wine', 'poires au vin'],
      name: 'Poires pochées au vin chaud épicé, mascarpone vanille et crumble noisette', category: 'dessert', servings: 10, prep_minutes: 90, difficulty: 'Facile',
      description: 'Tout se prépare la veille : poires confites dans le vin épicé, crème mascarpone à la vanille, crumble noisette. Il ne reste qu’à réduire un peu de sirop et dresser.',
      ingredients: [I('Poires fermes (Williams ou Conférence)', 10), I('Vin rouge (Côtes-du-Rhône)', 1.5, 'l'), I('Sucre', 200, 'g'), I('Bâtons de cannelle', 2), I('Anis étoilé', 3), I('Clous de girofle', 3), I('Orange (zeste)', 1), I('Mascarpone', 250, 'g'), I('Crème liquide entière bien froide', 25, 'cl'), I('Sucre glace', 50, 'g'), I('Gousse de vanille', 1), I('Farine (crumble)', 80, 'g'), I('Poudre de noisette (crumble)', 60, 'g'), I('Beurre froid (crumble)', 70, 'g'), I('Cassonade (crumble)', 70, 'g')],
      steps: [
        S('Porter à ébullition le vin, le sucre, les épices et le zeste d’orange. Laisser bouillir 5 minutes.', 10, { veille: true }),
        S('Peler les poires en gardant la queue. Les plonger dans le vin et pocher à petit frémissement, en les retournant de temps en temps.', 25, { veille: true, passive: true, watch: 'La pointe d’un couteau entre sans résistance.' }),
        S('Laisser refroidir les poires dans le sirop, puis réserver au frais toute la nuit : elles prennent une belle couleur rubis.', 30, { veille: true, passive: true }),
        S('Crumble : préchauffer le four à 170 °C, sabler du bout des doigts farine, poudre de noisette, cassonade et beurre froid. Étaler sur une plaque et cuire 15 minutes. Laisser refroidir, conserver dans une boîte.', 25, { veille: true, watch: 'Doré et croustillant une fois refroidi.' }),
        S('Crème : fouetter le mascarpone, la crème froide, le sucre glace et les graines de vanille en chantilly ferme. Réserver au frais.', 6, { veille: true, watch: 'La crème forme un bec ferme au bout du fouet.' }),
        S('Prélever 50 cl de sirop et le faire réduire dans une casserole.', 15, { passive: true, watch: 'Il devient sirupeux et nappe la cuillère.' }),
        S('Dresser : une poire par assiette, nappage de sirop réduit, une quenelle de crème mascarpone, du crumble émietté.', 8)
      ]
    }
  ]
};
