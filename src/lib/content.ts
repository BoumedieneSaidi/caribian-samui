// Chargement du contenu au moment du BUILD (pages statiques).
// Source de vérité : Supabase (édité via /admin). Repli : le JSON local historique,
// pour que le site puisse toujours se construire même si la base est injoignable.
import { supabase, photoUrl } from './supabase';
import local from '../data/vehicules.json';

export type CarContent = {
  slug: string;
  nom: string;
  famille: string;
  badge: string;
  badgeColor: string;
  places: string;
  transmission: string;
  extra: string | null;
  accroche: string | null;
  prixJour: number;
  prixJourEur: number | null;
  prixJour1a6: number | null;
  prixJour1a6Eur: number | null;
  image: string;
};

export type ScooterContent = {
  slug: string;
  nom: string;
  badge: string;
  accroche: string | null;
  prixJour: number;
  prixMois: number | null;
  caution: number;
  image: string;
};

export type GrilleContent = {
  nom: string;
  type: 'voiture' | 'scooter';
  caution: number;
  // prix[duree][saison] — null = non proposé
  prix: Record<string, Record<string, number | null>>;
};

const localCar = (v: (typeof local.voitures)[number]): CarContent => ({
  slug: v.slug, nom: v.nom, famille: v.famille, badge: v.badge, badgeColor: v.badgeColor,
  places: v.places, transmission: v.transmission, extra: v.extra ?? null,
  accroche: v.accroche ?? null, prixJour: v.prixJour, prixJourEur: v.prixJourEur,
  prixJour1a6: v.prixJour1a6 ?? null, prixJour1a6Eur: v.prixJour1a6Eur ?? null,
  image: `/img/${v.images[0]}.jpg`,
});

const localScooter = (s: (typeof local.scooters)[number]): ScooterContent => ({
  slug: s.slug, nom: s.nom, badge: s.badge, accroche: s.accroche ?? null,
  prixJour: s.prixJour, prixMois: s.prixMois, caution: s.caution,
  image: `/img/${s.images[0]}.jpg`,
});

export async function loadFlotte(): Promise<{ voitures: CarContent[]; scooters: ScooterContent[] }> {
  try {
    const [v, p, g] = await Promise.all([
      supabase.from('vehicules').select('*').eq('actif', true).order('ordre'),
      supabase.from('vehicule_photos').select('*').order('ordre'),
      supabase.from('groupes_tarifs').select('*'),
    ]);
    if (v.error || !v.data?.length) throw v.error ?? new Error('aucun véhicule');
    const photo = (vid: number) => {
      const ph = (p.data ?? []).find((x) => x.vehicule_id === vid);
      return ph ? photoUrl(ph.path) : '/img/hero-plage.jpg';
    };
    const caution = (gid: number | null) =>
      (g.data ?? []).find((x) => x.id === gid)?.caution ?? 0;

    return {
      voitures: v.data.filter((x) => x.categorie === 'voiture').map((x) => ({
        slug: x.slug, nom: x.nom, famille: x.famille, badge: x.badge ?? '',
        badgeColor: x.badge_color, places: x.places ?? '', transmission: x.transmission ?? '',
        extra: x.extra, accroche: x.accroche, prixJour: x.prix_jour,
        prixJourEur: x.prix_jour_eur, prixJour1a6: x.prix_jour_1a6,
        prixJour1a6Eur: x.prix_jour_1a6_eur, image: photo(x.id),
      })),
      scooters: v.data.filter((x) => x.categorie === 'scooter').map((x) => ({
        slug: x.slug, nom: x.nom, badge: x.badge ?? '', accroche: x.accroche,
        prixJour: x.prix_jour, prixMois: x.prix_mois, caution: caution(x.groupe_id),
        image: photo(x.id),
      })),
    };
  } catch (e) {
    console.warn('[build] Supabase injoignable, utilisation des données locales :', e);
    return {
      voitures: local.voitures.map(localCar),
      scooters: local.scooters.map(localScooter),
    };
  }
}

export async function loadGrilles(): Promise<GrilleContent[] | null> {
  try {
    const [g, t] = await Promise.all([
      supabase.from('groupes_tarifs').select('*').order('id'),
      supabase.from('tarifs').select('*'),
    ]);
    if (g.error || !g.data?.length) throw g.error ?? new Error('aucun groupe');
    return g.data.map((gr) => {
      const prix: GrilleContent['prix'] = {};
      for (const row of (t.data ?? []).filter((x) => x.groupe_id === gr.id)) {
        (prix[row.duree] ??= {})[row.saison] = row.prix;
      }
      return { nom: gr.nom, type: gr.type, caution: gr.caution, prix };
    });
  } catch (e) {
    console.warn('[build] Supabase injoignable pour les tarifs :', e);
    return null; // la page tarifs garde alors sa grille embarquée
  }
}
