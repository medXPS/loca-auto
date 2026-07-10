import { inArray } from "drizzle-orm";
import type { DatabaseContext } from "./database.js";

type DemoBlogPostSeed = {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage: string;
  category: string;
  tags: string;
  seoTitle: string;
  seoDescription: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
};

const demoBlogPosts: DemoBlogPostSeed[] = [
  {
    title: "Comment choisir une voiture de location au Maroc ?",
    slug: "comment-choisir-une-voiture-de-location-au-maroc",
    excerpt: "Les bons criteres pour choisir un modele adapte a votre trajet, votre budget et votre confort.",
    coverImage:
      "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&w=1400&q=80",
    category: "Conseils",
    tags: "location, Maroc, budget, confort",
    seoTitle: "Comment choisir une voiture de location au Maroc ?",
    seoDescription:
      "Un guide simple pour choisir la bonne voiture de location selon la ville, le nombre de passagers et la duree du trajet.",
    ogTitle: "Comment choisir une voiture de location au Maroc ?",
    ogDescription:
      "Decouvrez les criteres essentiels pour choisir une voiture de location au Maroc sans perdre de temps.",
    ogImage:
      "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&w=1400&q=80",
    content: `
      <p>Choisir une voiture de location au Maroc depend surtout de votre parcours, du nombre de passagers et du confort attendu sur la route. Un petit modele est souvent ideal pour la ville, alors qu'un SUV apporte plus d'espace pour les longs trajets et les familles.</p>
      <h2>Commencez par definir votre usage</h2>
      <ul>
        <li>Ville uniquement: citadine compacte et economique.</li>
        <li>Route et autoroute: berline confortable avec une bonne tenue de route.</li>
        <li>Famille ou valises nombreuses: SUV ou monospace.</li>
      </ul>
      <h2>Comparez aussi la boite de vitesse</h2>
      <p>Une boite automatique apporte du confort dans les villes tres denses, tandis qu'une boite manuelle peut etre plus interessante si vous cherchez un prix plus doux.</p>
      <p>Le plus important reste de reserver un vehicule adapte a votre trajet reel, pas seulement a son apparence.</p>
    `,
  },
  {
    title: "Location de voiture a Casablanca : guide complet",
    slug: "location-voiture-casablanca-guide-complet",
    excerpt: "Tout ce qu'il faut savoir pour louer facilement a Casablanca, du centre-ville a l'aeroport.",
    coverImage:
      "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1400&q=80",
    category: "Casablanca",
    tags: "Casablanca, aeroport, circulation, agence",
    seoTitle: "Location de voiture a Casablanca : guide complet",
    seoDescription:
      "Conseils pratiques pour louer une voiture a Casablanca, comparer les agences et gagner du temps a la reservation.",
    ogTitle: "Location de voiture a Casablanca : guide complet",
    ogDescription:
      "Un article pratique pour louer une voiture a Casablanca en toute serenite.",
    ogImage:
      "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1400&q=80",
    content: `
      <p>Casablanca est l'une des villes les plus actives du pays. Louer une voiture y est tres pratique pour passer du centre-ville a l'aeroport ou pour rejoindre Rabat, El Jadida ou Marrakech sans contrainte.</p>
      <h2>Pourquoi reserver a l'avance ?</h2>
      <p>En reservant avant votre arrivee, vous comparez plus facilement les prix, la categorie du vehicule et les conditions de depot. C'est aussi le meilleur moyen d'eviter les mauvaises surprises a l'arrivee.</p>
      <h2>Les points a verifier</h2>
      <ul>
        <li>Le lieu exact de remise du vehicule.</li>
        <li>Le montant de la caution.</li>
        <li>Les options incluses: assurance, climatisation, kilometrage.</li>
      </ul>
      <p>Pour la ville, une voiture compacte ou une berline reste souvent le meilleur compromis entre confort et facilite de stationnement.</p>
    `,
  },
  {
    title: "Les documents necessaires pour louer une voiture au Maroc",
    slug: "documents-necessaires-louer-voiture-maroc",
    excerpt: "Une checklist claire pour preparer votre dossier et accelerer la remise du vehicule.",
    coverImage:
      "https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=1400&q=80",
    category: "Documents",
    tags: "documents, permis, piece d'identite, reservation",
    seoTitle: "Les documents necessaires pour louer une voiture au Maroc",
    seoDescription:
      "Checklist des documents a preparer avant de recuperer votre voiture de location au Maroc.",
    ogTitle: "Les documents necessaires pour louer une voiture au Maroc",
    ogDescription:
      "Preparer les bons documents permet de gagner du temps au comptoir et de partir plus vite.",
    ogImage:
      "https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=1400&q=80",
    content: `
      <p>Pour recuperer un vehicule, il faut en general presenter une piece d'identite valide, un permis de conduire en cours de validite et les informations de reservation.</p>
      <h2>Preparer son dossier a l'avance</h2>
      <ul>
        <li>Carte d'identite ou passeport.</li>
        <li>Permis de conduire lisible et valide.</li>
        <li>Coordonnees de contact a jour.</li>
      </ul>
      <p>Si vous voyagez avec plusieurs conducteurs, verifiez aussi les conditions d'ajout d'un conducteur supplementaire. Cela evite de bloquer la remise du vehicule sur place.</p>
    `,
  },
  {
    title: "Location voiture automatique ou manuelle : que choisir ?",
    slug: "location-voiture-automatique-ou-manuelle",
    excerpt: "Un comparatif simple pour choisir entre confort de conduite et budget plus serré.",
    coverImage:
      "https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&w=1400&q=80",
    category: "Conduite",
    tags: "automatique, manuelle, conduite, comparaison",
    seoTitle: "Location voiture automatique ou manuelle : que choisir ?",
    seoDescription:
      "Comparaison pratique entre voiture automatique et manuelle pour la location au Maroc.",
    ogTitle: "Location voiture automatique ou manuelle : que choisir ?",
    ogDescription:
      "Choisir la bonne transmission peut faire une vraie difference sur votre confort de conduite.",
    ogImage:
      "https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&w=1400&q=80",
    content: `
      <p>Le choix entre automatique et manuelle depend surtout de votre habitude de conduite et du type de trajet prevu. En ville, la boite automatique est souvent plus reposante. Sur un long trajet, elle apporte aussi un vrai confort.</p>
      <h2>Quand choisir l'automatique ?</h2>
      <ul>
        <li>Conduite en ville dense.</li>
        <li>Premiere experience de conduite dans une ville inconnue.</li>
        <li>Recherche de confort maximal.</li>
      </ul>
      <h2>Quand choisir la manuelle ?</h2>
      <p>La boite manuelle reste une bonne option si vous voulez souvent un prix un peu plus doux et si vous conduisez deja regulierement ce type de vehicule.</p>
    `,
  },
  {
    title: "Conseils pour louer une voiture pas chere au Maroc",
    slug: "conseils-louer-voiture-pas-chere-maroc",
    excerpt: "Quelques reflexes simples pour economiser sans sacrifier la qualite du service.",
    coverImage:
      "https://images.unsplash.com/photo-1502877338535-766e1452684a?auto=format&fit=crop&w=1400&q=80",
    category: "Budget",
    tags: "budget, economie, astuces, promotion",
    seoTitle: "Conseils pour louer une voiture pas chere au Maroc",
    seoDescription:
      "Astuces pratiques pour trouver une location voiture pas chere au Maroc sans mauvaise surprise.",
    ogTitle: "Conseils pour louer une voiture pas chere au Maroc",
    ogDescription:
      "Economisez sur votre prochaine location en comparant le bon vehicule, le bon moment et les bonnes options.",
    ogImage:
      "https://images.unsplash.com/photo-1502877338535-766e1452684a?auto=format&fit=crop&w=1400&q=80",
    content: `
      <p>Pour louer moins cher, comparez toujours la categorie du vehicule, la duree de la location et les services inclus. Un prix affiche bas peut cacher une caution plus elevee ou des options facturees a part.</p>
      <h2>Les bonnes pratiques</h2>
      <ul>
        <li>Reserver plus tot quand c'est possible.</li>
        <li>Choisir la categorie vraiment adaptee a votre usage.</li>
        <li>Verifier le kilometrage et les conditions d'assurance.</li>
      </ul>
      <p>Un bon prix est celui qui reste clair du debut a la fin, sans frais cache ni mauvaise surprise au moment de la remise des cles.</p>
    `,
  },
  {
    title: "7 jours au Maroc en voiture : l'itinéraire idéal",
    slug: "7-jours-maroc-voiture-itineraire-ideal",
    excerpt: "Un parcours simple et réaliste pour découvrir plusieurs villes sans multiplier les allers-retours.",
    coverImage:
      "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1400&q=80",
    category: "Itinéraire",
    tags: "road trip, itinéraire, Maroc, voyage",
    seoTitle: "7 jours au Maroc en voiture : l'itinéraire idéal",
    seoDescription:
      "Découvrez un itinéraire de 7 jours au Maroc pour profiter d'une voiture de location sans perdre de temps sur la route.",
    ogTitle: "7 jours au Maroc en voiture : l'itinéraire idéal",
    ogDescription:
      "Un circuit simple pour combiner villes, paysages et confort de conduite.",
    ogImage:
      "https://images.unsplash.com/photo-1500393725011-b1f1a244c33f?auto=format&fit=crop&w=1400&q=80",
    content: `
      <p>Un road trip réussi commence par un itinéraire réaliste. L'idée n'est pas de tout voir, mais de profiter de chaque étape sans passer votre temps à conduire.</p>
      <h2>Exemple de circuit</h2>
      <ul>
        <li>Casablanca pour récupérer le véhicule.</li>
        <li>Marrakech pour l'énergie de la ville et les premières visites.</li>
        <li>Essaouira pour une pause plus calme au bord de l'océan.</li>
        <li>Rabat ou Fès selon votre point de départ et votre retour.</li>
      </ul>
      <p>Avec une voiture de location, vous gardez de la liberté tout en adaptant vos étapes à votre rythme réel. C'est le meilleur compromis pour un séjour agréable.</p>
    `,
  },
  {
    title: "Caution et franchise : ce qu'il faut vérifier avant de réserver",
    slug: "caution-franchise-verifier-avant-reserver",
    excerpt: "Deux notions souvent confondues, mais essentielles pour réserver en toute confiance.",
    coverImage:
      "https://images.unsplash.com/photo-1550355291-bbee04a92027?auto=format&fit=crop&w=1400&q=80",
    category: "Assurance",
    tags: "caution, franchise, assurance, location",
    seoTitle: "Caution et franchise : ce qu'il faut vérifier avant de réserver",
    seoDescription:
      "Comprenez la différence entre caution et franchise pour comparer les offres de location sans mauvaise surprise.",
    ogTitle: "Caution et franchise : ce qu'il faut vérifier avant de réserver",
    ogDescription:
      "Deux points techniques à lire avant de valider votre réservation.",
    ogImage:
      "https://images.unsplash.com/photo-1550355291-bbee04a92027?auto=format&fit=crop&w=1400&q=80",
    content: `
      <p>La caution est le montant bloqué temporairement pour couvrir d'éventuels frais. La franchise, elle, correspond à la part qui reste à votre charge en cas de sinistre prévu par le contrat.</p>
      <h2>Pourquoi c'est important ?</h2>
      <p>Une offre peut sembler plus attractive au premier regard, mais devenir plus coûteuse si la caution est élevée ou si la franchise est trop importante.</p>
      <p>Avant de réserver, prenez toujours le temps de lire ces deux lignes. C'est souvent là que se joue la vraie différence entre deux offres proches en prix.</p>
    `,
  },
  {
    title: "Conduire à Marrakech sans stress : nos conseils pratiques",
    slug: "conduire-marrakech-sans-stress-conseils-pratiques",
    excerpt: "Stationnement, circulation et horaires: les bons réflexes pour rouler sereinement.",
    coverImage:
      "https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&w=1400&q=80",
    category: "Ville",
    tags: "Marrakech, conduite, circulation, stationnement",
    seoTitle: "Conduire à Marrakech sans stress : nos conseils pratiques",
    seoDescription:
      "Conseils simples pour conduire à Marrakech avec plus de sérénité et mieux gérer le stationnement.",
    ogTitle: "Conduire à Marrakech sans stress : nos conseils pratiques",
    ogDescription:
      "Les meilleurs réflexes pour circuler dans la ville rouge avec votre voiture de location.",
    ogImage:
      "https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&w=1400&q=80",
    content: `
      <p>Marrakech est une ville agréable à découvrir en voiture, à condition d'anticiper un peu. Les heures de pointe et les zones très fréquentées demandent simplement plus d'attention.</p>
      <h2>Les bons réflexes</h2>
      <ul>
        <li>Évitez les déplacements aux heures les plus chargées si vous n'êtes pas pressé.</li>
        <li>Prévoyez un peu de marge pour le stationnement près des lieux touristiques.</li>
        <li>Choisissez une voiture compacte si vous restez beaucoup en centre-ville.</li>
      </ul>
      <p>Avec ces quelques habitudes, vous profitez de la ville sans stress inutile.</p>
    `,
  },
  {
    title: "Voyager en famille : quelle voiture choisir pour le Maroc ?",
    slug: "voyager-en-famille-quelle-voiture-choisir-maroc",
    excerpt: "Volume de coffre, places à bord et confort: les critères qui comptent vraiment pour une famille.",
    coverImage:
      "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1400&q=80",
    category: "Famille",
    tags: "famille, coffre, SUV, monospace",
    seoTitle: "Voyager en famille : quelle voiture choisir pour le Maroc ?",
    seoDescription:
      "Les critères essentiels pour choisir une voiture familiale adaptée à un séjour au Maroc.",
    ogTitle: "Voyager en famille : quelle voiture choisir pour le Maroc ?",
    ogDescription:
      "Un guide pratique pour trouver le bon véhicule familial sans surpayer.",
    ogImage:
      "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1400&q=80",
    content: `
      <p>Pour voyager en famille, il faut regarder au-delà du simple prix journalier. Le confort, le coffre et la facilité d'installation des bagages font souvent toute la différence.</p>
      <h2>Les catégories les plus adaptées</h2>
      <ul>
        <li>SUV si vous voulez du volume et une position de conduite plus haute.</li>
        <li>Berline spacieuse pour rester confortable sur autoroute.</li>
        <li>Monospace si vous voyagez avec plusieurs enfants ou beaucoup de bagages.</li>
      </ul>
      <p>Le bon choix est celui qui simplifie votre voyage du premier jour au dernier.</p>
    `,
  },
  {
    title: "Documents de location : la check-list avant de partir",
    slug: "documents-location-checklist-avant-de-partir",
    excerpt: "Une ultime vérification pour gagner du temps au comptoir et éviter les allers-retours inutiles.",
    coverImage:
      "https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=1400&q=80",
    category: "Documents",
    tags: "documents, contrôle, permis, identité",
    seoTitle: "Documents de location : la check-list avant de partir",
    seoDescription:
      "Préparez votre dossier de location avec une check-list simple et pratique.",
    ogTitle: "Documents de location : la check-list avant de partir",
    ogDescription:
      "La liste des documents à vérifier avant de récupérer votre voiture de location.",
    ogImage:
      "https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=1400&q=80",
    content: `
      <p>Avant de récupérer votre véhicule, assurez-vous que votre dossier est complet et lisible. Cela accélère la remise des clés et réduit les vérifications de dernière minute.</p>
      <h2>À préparer</h2>
      <ul>
        <li>Une pièce d'identité valide.</li>
        <li>Un permis de conduire en cours de validité.</li>
        <li>Votre confirmation de réservation et vos coordonnées à jour.</li>
      </ul>
      <p>Avec ces documents prêts, vous gagnez du temps et vous partez plus sereinement.</p>
    `,
  },
];

export async function ensureDemoBlogPosts(context: Pick<DatabaseContext, "db" | "schema">) {
  const slugs = demoBlogPosts.map((post) => post.slug);
  const existingPosts =
    slugs.length > 0
      ? await context.db
          .select({ slug: context.schema.blogPostsTable.slug })
          .from(context.schema.blogPostsTable)
          .where(inArray(context.schema.blogPostsTable.slug, slugs))
      : [];

  const existingSlugs = new Set(existingPosts.map((post) => post.slug));
  let inserted = 0;

  for (const post of demoBlogPosts) {
    if (!existingSlugs.has(post.slug)) {
      inserted += 1;
    }

    await context.db
      .insert(context.schema.blogPostsTable)
      .values({
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt,
        content: post.content,
        coverImage: post.coverImage,
        category: post.category,
        tags: post.tags,
        seoTitle: post.seoTitle,
        seoDescription: post.seoDescription,
        ogTitle: post.ogTitle,
        ogDescription: post.ogDescription,
        ogImage: post.ogImage,
        status: "PUBLISHED",
        updatedAt: new Date(),
      } as any)
      .onConflictDoUpdate({
        target: context.schema.blogPostsTable.slug,
        set: {
          title: post.title,
          excerpt: post.excerpt,
          content: post.content,
          coverImage: post.coverImage,
          category: post.category,
          tags: post.tags,
          seoTitle: post.seoTitle,
          seoDescription: post.seoDescription,
          ogTitle: post.ogTitle,
          ogDescription: post.ogDescription,
          ogImage: post.ogImage,
          status: "PUBLISHED",
          updatedAt: new Date(),
        },
      });
  }

  return { inserted, expected: demoBlogPosts.length };
}
