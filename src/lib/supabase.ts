import { createClient } from '@supabase/supabase-js';

// Clé « publishable » : conçue pour être publique (la sécurité est assurée par RLS côté serveur).
export const SUPABASE_URL =
  import.meta.env.PUBLIC_SUPABASE_URL ?? 'https://whwpydnollvlkiwbpqrd.supabase.co';
export const SUPABASE_KEY =
  import.meta.env.PUBLIC_SUPABASE_KEY ?? 'sb_publishable_Xc0DLerB3Vwi9GZ5I9Xgzw_EHJihpEV';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

/** Résout le chemin d'une photo : URL complète (Storage) ou chemin du site (/img/…). */
export function photoUrl(path: string): string {
  if (path.startsWith('http')) return path;
  if (path.startsWith('/img/')) {
    // Côté navigateur, si le site est servi sous un sous-chemin (GitHub Pages),
    // on le préfixe — le HTML généré au build est, lui, réécrit au déploiement.
    if (typeof location !== 'undefined' && location.pathname.startsWith('/caribian-samui/')) {
      return '/caribian-samui' + path;
    }
    return path;
  }
  return `${SUPABASE_URL}/storage/v1/object/public/photos/${path}`;
}

export type Vehicule = {
  id: number;
  slug: string;
  nom: string;
  famille: string;
  categorie: 'voiture' | 'scooter';
  badge: string | null;
  badge_color: 'lagoon' | 'coral' | 'palm' | 'sun';
  places: string | null;
  transmission: string | null;
  carburant: string | null;
  extra: string | null;
  accroche: string | null;
  prix_jour: number;
  prix_jour_eur: number | null;
  prix_jour_1a6: number | null;
  prix_jour_1a6_eur: number | null;
  prix_mois: number | null;
  groupe_id: number | null;
  actif: boolean;
  ordre: number;
};

export type Photo = { id: number; vehicule_id: number; path: string; ordre: number };
export type GroupeTarifs = { id: number; nom: string; type: 'voiture' | 'scooter'; caution: number };
export type Tarif = { id: number; groupe_id: number; saison: string; duree: string; prix: number | null };
export type Reservation = {
  id: number;
  vehicule_id: number;
  date_debut: string;
  date_fin: string;
  client_nom: string;
  client_tel: string;
  client_email: string | null;
  hotel: string | null;
  nb_personnes: number | null;
  message: string | null;
  statut: 'en_attente' | 'confirmee' | 'refusee' | 'annulee' | 'terminee';
  note_admin: string | null;
  created_at: string;
};

/** Saison tarifaire selon la date et le type de véhicule (grilles 2026). */
export function saisonPour(date: Date, type: 'voiture' | 'scooter'): string {
  const m = date.getMonth() + 1;
  const d = date.getDate();
  const md = m * 100 + d;
  if (md >= 1221 || md <= 107) return 'PIK';
  if (type === 'voiture') {
    if ((md >= 108 && md <= 331) || (md >= 716 && md <= 831)) return 'HAUTE';
    if (md >= 516 && md <= 715) return 'BASSE';
    return 'MOYENNE';
  }
  // scooters : pas de saison MOYENNE
  if ((md >= 108 && md <= 415) || (md >= 716 && md <= 831)) return 'HAUTE';
  return 'BASSE';
}

/** Tranche de durée de la grille selon le nombre de jours. */
export function trancheDuree(jours: number): string {
  if (jours >= 30) return 'mois';
  if (jours >= 21) return '21-29';
  if (jours >= 14) return '14-20';
  if (jours >= 7) return '7-13';
  return '1-6';
}
