// Application d'administration Caribian Rental Samui.
// Tout passe par Supabase avec la clé publique : les droits réels sont appliqués par RLS.
import {
  supabase, photoUrl,
  type Vehicule, type Photo, type GroupeTarifs, type Tarif, type Reservation,
} from '../lib/supabase';

let root: HTMLElement;
let vehicules: Vehicule[] = [];
let groupes: GroupeTarifs[] = [];
let vue = 'reservations';

const fmtDate = (s: string) =>
  new Date(s + 'T00:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
const esc = (s: unknown) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

function toast(msg: string, err = false) {
  const t = document.getElementById('toast')!;
  t.textContent = msg;
  t.className = 'toast on' + (err ? ' err' : '');
  setTimeout(() => t.classList.remove('on'), 3200);
}

export async function mountAdmin(el: HTMLElement) {
  root = el;
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return renderLogin();
  await bootApp();
}

/* ============================== CONNEXION ============================== */

function renderLogin(msg = '') {
  root.innerHTML = `
    <div class="login">
      <div class="logo"><span></span>Caribian Admin</div>
      ${msg ? `<div class="note">${esc(msg)}</div>` : ''}
      <div class="card">
        <label>E-mail</label>
        <input id="email" type="email" autocomplete="username" placeholder="votre@email.com" />
        <label>Mot de passe</label>
        <input id="pwd" type="password" autocomplete="current-password" />
        <button class="btn n" id="go" style="width:100%; margin-top:18px; padding:13px">Se connecter</button>
      </div>
      <p class="muted" style="text-align:center">Accès réservé à l'équipe Caribian Rental Samui.</p>
    </div>`;
  const go = async () => {
    const email = (document.getElementById('email') as HTMLInputElement).value.trim();
    const password = (document.getElementById('pwd') as HTMLInputElement).value;
    (document.getElementById('go') as HTMLButtonElement).disabled = true;
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      renderLogin('E-mail ou mot de passe incorrect.');
      return;
    }
    await bootApp();
  };
  document.getElementById('go')!.addEventListener('click', go);
  document.getElementById('pwd')!.addEventListener('keydown', (e) => { if ((e as KeyboardEvent).key === 'Enter') go(); });
}

/* ============================== SQUELETTE ============================== */

async function bootApp() {
  const [v, g] = await Promise.all([
    supabase.from('vehicules').select('*').order('ordre'),
    supabase.from('groupes_tarifs').select('*').order('id'),
  ]);
  vehicules = v.data ?? [];
  groupes = g.data ?? [];

  root.innerHTML = `
    <header class="top">
      <b>🌴 Caribian Admin</b>
      <span>
        <button id="publier" title="Met le site public à jour avec vos dernières modifications">🚀 Publier le site</button>
        <button id="logout">Déconnexion</button>
      </span>
    </header>
    <nav class="tabs">
      <button data-v="reservations"><span class="i">📥</span>Demandes<span class="badge hidden" id="badge-resa"></span></button>
      <button data-v="calendrier"><span class="i">📅</span>Calendrier</button>
      <button data-v="vehicules"><span class="i">🚗</span>Véhicules</button>
      <button data-v="tarifs"><span class="i">💰</span>Tarifs</button>
    </nav>
    <main id="vue"></main>`;
  document.getElementById('logout')!.addEventListener('click', async () => {
    await supabase.auth.signOut();
    renderLogin();
  });
  document.getElementById('publier')!.addEventListener('click', async (e) => {
    const btn = e.currentTarget as HTMLButtonElement;
    btn.disabled = true;
    btn.textContent = '⏳ Publication…';
    const { data, error } = await supabase.functions.invoke('publier');
    btn.disabled = false;
    btn.textContent = '🚀 Publier le site';
    if (error || !data?.ok) {
      toast(`Publication impossible : ${error?.message ?? data?.error ?? 'erreur inconnue'}`, true);
      return;
    }
    toast('Publication lancée ✓ — le site sera à jour dans ~3 minutes.');
  });
  root.querySelectorAll('nav.tabs button').forEach((b) =>
    b.addEventListener('click', () => setVue((b as HTMLElement).dataset.v!)));
  refreshBadge();
  setVue('reservations');
}

function setVue(v: string) {
  vue = v;
  root.querySelectorAll('nav.tabs button').forEach((b) =>
    b.classList.toggle('cur', (b as HTMLElement).dataset.v === v));
  const main = document.getElementById('vue')!;
  main.innerHTML = '<p class="muted">Chargement…</p>';
  if (v === 'reservations') vueReservations(main);
  if (v === 'calendrier') vueCalendrier(main);
  if (v === 'vehicules') vueVehicules(main);
  if (v === 'tarifs') vueTarifs(main);
}

async function refreshBadge() {
  const { count } = await supabase.from('reservations')
    .select('id', { count: 'exact', head: true }).eq('statut', 'en_attente');
  const b = document.getElementById('badge-resa');
  if (!b) return;
  b.classList.toggle('hidden', !count);
  b.textContent = String(count ?? '');
}

const vnom = (id: number) => vehicules.find((x) => x.id === id)?.nom ?? `Véhicule #${id}`;

/* ============================== RÉSERVATIONS ============================== */

async function vueReservations(main: HTMLElement, filtre = 'en_attente') {
  const { data, error } = await supabase.from('reservations').select('*')
    .order('created_at', { ascending: false }).limit(200);
  if (error) { main.innerHTML = `<p class="muted">Erreur : ${esc(error.message)}</p>`; return; }
  const resas = (data ?? []) as Reservation[];
  const filtres: [string, string][] = [
    ['en_attente', 'À traiter'], ['confirmee', 'Confirmées'], ['toutes', 'Toutes'],
  ];
  const liste = resas.filter((r) => filtre === 'toutes' || r.statut === filtre);

  main.innerHTML = `
    <h2>Demandes de réservation</h2>
    <div class="seg">${filtres.map(([k, l]) =>
      `<button data-f="${k}" class="${k === filtre ? 'cur' : ''}">${l}</button>`).join('')}</div>
    ${liste.length === 0 ? `<div class="empty">Rien ici pour l'instant 🌴</div>` : ''}
    ${liste.map((r) => `
      <div class="card" data-id="${r.id}">
        <div class="row">
          <div>
            <span class="pill ${r.statut}">${r.statut.replace('_', ' ')}</span>
            <b style="margin-left:8px">${esc(vnom(r.vehicule_id))}</b>
          </div>
          <span class="dates">${fmtDate(r.date_debut)} → ${fmtDate(r.date_fin)}</span>
        </div>
        <div style="margin:8px 0 4px">
          👤 <b>${esc(r.client_nom)}</b>${r.nb_personnes ? ` · ${r.nb_personnes} pers.` : ''}
          ${r.hotel ? `<br/>🏨 ${esc(r.hotel)}` : ''}
          <br/>📞 <a class="tel" href="tel:${esc(r.client_tel)}">${esc(r.client_tel)}</a>
          · <a class="tel" href="https://wa.me/${esc(r.client_tel.replace(/[^0-9]/g, ''))}" target="_blank">WhatsApp ↗</a>
          ${r.client_email ? `<br/>✉️ <a class="tel" href="mailto:${esc(r.client_email)}">${esc(r.client_email)}</a>` : ''}
          ${r.message ? `<br/>💬 <i>${esc(r.message)}</i>` : ''}
        </div>
        <div class="row" style="margin-top:10px">
          ${r.statut === 'en_attente' ? `
            <button class="btn p" data-act="confirmee">✓ Confirmer</button>
            <button class="btn d" data-act="refusee">✕ Refuser</button>` : ''}
          ${r.statut === 'confirmee' ? `
            <button class="btn g" data-act="terminee">Terminée</button>
            <button class="btn g" data-act="annulee">Annuler</button>` : ''}
        </div>
      </div>`).join('')}`;

  main.querySelectorAll('.seg button').forEach((b) =>
    b.addEventListener('click', () => vueReservations(main, (b as HTMLElement).dataset.f!)));
  main.querySelectorAll('[data-act]').forEach((b) =>
    b.addEventListener('click', async () => {
      const id = Number((b.closest('.card') as HTMLElement).dataset.id);
      const statut = (b as HTMLElement).dataset.act!;
      const { error } = await supabase.from('reservations').update({ statut }).eq('id', id);
      if (error) {
        // 23P01 = chevauchement avec une réservation déjà confirmée (contrainte d'exclusion)
        toast(error.code === '23P01'
          ? 'Impossible : ces dates chevauchent une réservation déjà confirmée.'
          : `Erreur : ${error.message}`, true);
        return;
      }
      toast(statut === 'confirmee' ? 'Réservation confirmée ✓' : 'Statut mis à jour');
      refreshBadge();
      vueReservations(main, filtre);
    }));
}

/* ============================== CALENDRIER ============================== */

async function vueCalendrier(main: HTMLElement, vid?: number) {
  const vehId = vid ?? vehicules[0]?.id;
  if (!vehId) { main.innerHTML = '<div class="empty">Aucun véhicule.</div>'; return; }
  const today = new Date().toISOString().slice(0, 10);
  const [resas, indispos] = await Promise.all([
    supabase.from('reservations').select('*').eq('vehicule_id', vehId)
      .in('statut', ['en_attente', 'confirmee']).gte('date_fin', today).order('date_debut'),
    supabase.from('indisponibilites').select('*').eq('vehicule_id', vehId)
      .gte('date_fin', today).order('date_debut'),
  ]);

  main.innerHTML = `
    <h2>Calendrier &amp; indisponibilités</h2>
    <div class="seg">${vehicules.map((v) =>
      `<button data-vid="${v.id}" class="${v.id === vehId ? 'cur' : ''}">${esc(v.nom)}</button>`).join('')}</div>

    <div class="card">
      <b>Occupations à venir</b>
      ${(resas.data ?? []).length === 0 && (indispos.data ?? []).length === 0
        ? '<p class="muted">Aucune occupation à venir : le véhicule est libre.</p>' : ''}
      ${(resas.data ?? []).map((r: Reservation) => `
        <div class="row" style="margin-top:8px">
          <span><span class="pill ${r.statut}">${r.statut.replace('_', ' ')}</span> ${esc(r.client_nom)}</span>
          <span class="dates">${fmtDate(r.date_debut)} → ${fmtDate(r.date_fin)}</span>
        </div>`).join('')}
      ${(indispos.data ?? []).map((i: any) => `
        <div class="row" style="margin-top:8px" data-ind="${i.id}">
          <span>🔧 ${esc(i.motif || 'Indisponible')}</span>
          <span class="dates">${fmtDate(i.date_debut)} → ${fmtDate(i.date_fin)}
            <button class="btn g" data-del="${i.id}" style="padding:4px 12px; margin-left:8px">✕</button></span>
        </div>`).join('')}
    </div>

    <div class="card">
      <b>Bloquer une période</b> <span class="muted">(entretien, usage perso…)</span>
      <div class="grid2">
        <div><label>Du</label><input type="date" id="ind-d1" min="${today}" /></div>
        <div><label>Au</label><input type="date" id="ind-d2" min="${today}" /></div>
      </div>
      <label>Motif (facultatif)</label>
      <input id="ind-motif" placeholder="Révision, prêt…" />
      <button class="btn n" id="ind-add" style="margin-top:14px">Bloquer ces dates</button>
    </div>`;

  main.querySelectorAll('[data-vid]').forEach((b) =>
    b.addEventListener('click', () => vueCalendrier(main, Number((b as HTMLElement).dataset.vid))));
  main.querySelectorAll('[data-del]').forEach((b) =>
    b.addEventListener('click', async () => {
      await supabase.from('indisponibilites').delete().eq('id', Number((b as HTMLElement).dataset.del));
      toast('Période débloquée');
      vueCalendrier(main, vehId);
    }));
  document.getElementById('ind-add')!.addEventListener('click', async () => {
    const d1 = (document.getElementById('ind-d1') as HTMLInputElement).value;
    const d2 = (document.getElementById('ind-d2') as HTMLInputElement).value;
    const motif = (document.getElementById('ind-motif') as HTMLInputElement).value.trim() || null;
    if (!d1 || !d2 || d2 < d1) { toast('Choisissez des dates valides.', true); return; }
    const { error } = await supabase.from('indisponibilites')
      .insert({ vehicule_id: vehId, date_debut: d1, date_fin: d2, motif });
    if (error) { toast(`Erreur : ${error.message}`, true); return; }
    toast('Période bloquée ✓');
    vueCalendrier(main, vehId);
  });
}

/* ============================== VÉHICULES ============================== */

async function vueVehicules(main: HTMLElement) {
  const { data } = await supabase.from('vehicules').select('*').order('ordre');
  vehicules = (data ?? []) as Vehicule[];
  const { data: photos } = await supabase.from('vehicule_photos').select('*').order('ordre');
  const premierePhoto = (vid: number) =>
    (photos ?? []).find((p: Photo) => p.vehicule_id === vid)?.path;

  main.innerHTML = `
    <h2>Véhicules</h2>
    <div class="note">Après vos modifications, appuyez sur <b>🚀 Publier le site</b> (en haut) :
      le site public est à jour ~3 minutes plus tard. Sinon, il se met à jour tout seul chaque nuit.</div>
    ${vehicules.map((v) => `
      <div class="card row" data-id="${v.id}" style="flex-wrap:nowrap">
        ${premierePhoto(v.id)
          ? `<img class="veh-thumb" src="${esc(photoUrl(premierePhoto(v.id)!))}" alt="" />`
          : '<div class="veh-thumb" style="background:#eee"></div>'}
        <div style="flex:1; min-width:0">
          <b>${esc(v.nom)}</b> ${v.actif ? '' : '<span class="pill refusee">masqué</span>'}
          <div class="muted">${esc(v.famille)} · ${v.prix_jour} ฿/j</div>
        </div>
        <button class="btn g" data-edit="${v.id}">Modifier</button>
      </div>`).join('')}
    <button class="btn n" id="add-veh" style="width:100%; padding:13px; margin-top:6px">+ Ajouter un véhicule</button>
    <div id="veh-form"></div>`;

  main.querySelectorAll('[data-edit]').forEach((b) =>
    b.addEventListener('click', () =>
      formVehicule(vehicules.find((v) => v.id === Number((b as HTMLElement).dataset.edit))!)));
  document.getElementById('add-veh')!.addEventListener('click', () => formVehicule(null));

  async function formVehicule(v: Vehicule | null) {
    const holder = document.getElementById('veh-form')!;
    const { data: vphotos } = v
      ? await supabase.from('vehicule_photos').select('*').eq('vehicule_id', v.id).order('ordre')
      : { data: [] as Photo[] };
    holder.innerHTML = `
      <div class="card" style="border-color:var(--turq)">
        <div class="row"><b>${v ? `Modifier — ${esc(v.nom)}` : 'Nouveau véhicule'}</b>
          <button class="btn g" id="f-close">Fermer</button></div>
        <div class="grid2">
          <div><label>Nom</label><input id="f-nom" value="${esc(v?.nom ?? '')}" /></div>
          <div><label>Famille</label><input id="f-famille" value="${esc(v?.famille ?? '')}" placeholder="Caribian, Ford Ecosport…" /></div>
          <div><label>Catégorie</label>
            <select id="f-cat">
              <option value="voiture" ${v?.categorie !== 'scooter' ? 'selected' : ''}>Voiture</option>
              <option value="scooter" ${v?.categorie === 'scooter' ? 'selected' : ''}>Scooter</option>
            </select></div>
          <div><label>Groupe tarifaire</label>
            <select id="f-groupe">${groupes.map((gr) =>
              `<option value="${gr.id}" ${v?.groupe_id === gr.id ? 'selected' : ''}>${esc(gr.nom)}</option>`).join('')}</select></div>
          <div><label>Badge</label><input id="f-badge" value="${esc(v?.badge ?? '')}" placeholder="La star, Iconique…" /></div>
          <div><label>Couleur badge</label>
            <select id="f-bc">${['lagoon', 'coral', 'palm', 'sun'].map((c) =>
              `<option ${v?.badge_color === c ? 'selected' : ''}>${c}</option>`).join('')}</select></div>
          <div><label>Prix affiché ฿/jour</label><input id="f-prix" type="number" value="${v?.prix_jour ?? ''}" /></div>
          <div><label>Équivalent €/jour</label><input id="f-eur" type="number" value="${v?.prix_jour_eur ?? ''}" /></div>
          <div><label>Prix 1-6 j ฿</label><input id="f-prix16" type="number" value="${v?.prix_jour_1a6 ?? ''}" /></div>
          <div><label>Prix mois ฿ (scooters)</label><input id="f-mois" type="number" value="${v?.prix_mois ?? ''}" /></div>
          <div><label>Places</label><input id="f-places" value="${esc(v?.places ?? '')}" placeholder="5 places" /></div>
          <div><label>Transmission</label><input id="f-trans" value="${esc(v?.transmission ?? '')}" placeholder="Boîte manuelle" /></div>
        </div>
        <label>Petit plus (affiché en étiquette)</label><input id="f-extra" value="${esc(v?.extra ?? '')}" />
        <label>Texte de présentation</label><textarea id="f-accroche" rows="3">${esc(v?.accroche ?? '')}</textarea>
        <label style="display:flex; align-items:center; gap:8px; text-transform:none; font-size:.9rem; margin-top:14px">
          <input type="checkbox" id="f-actif" style="width:auto" ${v?.actif !== false ? 'checked' : ''} />
          Visible sur le site
        </label>
        ${v ? `
        <label>Photos</label>
        <div class="photolist" id="f-photos">
          ${(vphotos ?? []).map((p: Photo) => `
            <div class="ph"><img src="${esc(photoUrl(p.path))}" alt="" /><button data-delph="${p.id}">✕</button></div>`).join('')}
        </div>
        <input type="file" id="f-upload" accept="image/*" multiple style="margin-top:8px" />
        <p class="muted">Depuis un téléphone : « Prendre une photo » fonctionne aussi.</p>` : ''}
        <div class="row" style="margin-top:16px">
          <button class="btn p" id="f-save" style="flex:1">Enregistrer</button>
          ${v ? '<button class="btn d" id="f-del">Supprimer</button>' : ''}
        </div>
      </div>`;
    holder.scrollIntoView({ behavior: 'smooth' });

    const val = (id: string) => (document.getElementById(id) as HTMLInputElement).value.trim();
    const num = (id: string) => { const x = val(id); return x === '' ? null : Number(x); };

    document.getElementById('f-close')!.addEventListener('click', () => { holder.innerHTML = ''; });
    document.getElementById('f-save')!.addEventListener('click', async () => {
      const patch: Record<string, unknown> = {
        nom: val('f-nom'), famille: val('f-famille'),
        categorie: (document.getElementById('f-cat') as HTMLSelectElement).value,
        groupe_id: Number((document.getElementById('f-groupe') as HTMLSelectElement).value),
        badge: val('f-badge') || null,
        badge_color: (document.getElementById('f-bc') as HTMLSelectElement).value,
        prix_jour: num('f-prix') ?? 0, prix_jour_eur: num('f-eur'),
        prix_jour_1a6: num('f-prix16'), prix_mois: num('f-mois'),
        places: val('f-places') || null, transmission: val('f-trans') || null,
        extra: val('f-extra') || null, accroche: val('f-accroche') || null,
        actif: (document.getElementById('f-actif') as HTMLInputElement).checked,
      };
      if (!patch.nom) { toast('Le nom est obligatoire.', true); return; }
      let error;
      if (v) ({ error } = await supabase.from('vehicules').update(patch).eq('id', v.id));
      else {
        patch.slug = String(patch.nom).toLowerCase().normalize('NFD')
          .replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        ({ error } = await supabase.from('vehicules').insert(patch));
      }
      if (error) { toast(`Erreur : ${error.message}`, true); return; }
      toast('Enregistré ✓');
      vueVehicules(main);
    });
    if (v) {
      document.getElementById('f-del')!.addEventListener('click', async () => {
        if (!confirm(`Supprimer définitivement « ${v.nom} » ?\n(Pour le masquer temporairement, décochez plutôt « Visible sur le site ».)`)) return;
        const { error } = await supabase.from('vehicules').delete().eq('id', v.id);
        if (error) { toast('Suppression impossible : des réservations y sont liées. Masquez-le plutôt.', true); return; }
        toast('Véhicule supprimé');
        vueVehicules(main);
      });
      holder.querySelectorAll('[data-delph]').forEach((b) =>
        b.addEventListener('click', async () => {
          await supabase.from('vehicule_photos').delete().eq('id', Number((b as HTMLElement).dataset.delph));
          toast('Photo retirée');
          formVehicule(v);
        }));
      document.getElementById('f-upload')!.addEventListener('change', async (e) => {
        const files = Array.from((e.target as HTMLInputElement).files ?? []);
        for (const f of files) {
          const ext = (f.name.split('.').pop() || 'jpg').toLowerCase();
          const path = `${v.slug}/${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${ext}`;
          const { error: upErr } = await supabase.storage.from('photos').upload(path, f, { contentType: f.type });
          if (upErr) { toast(`Envoi impossible : ${upErr.message}`, true); continue; }
          await supabase.from('vehicule_photos').insert({ vehicule_id: v.id, path });
        }
        toast('Photo(s) ajoutée(s) ✓');
        formVehicule(v);
      });
    }
  }
}

/* ============================== TARIFS ============================== */

const SAISONS_V = ['PIK', 'HAUTE', 'MOYENNE', 'BASSE'];
const SAISONS_S = ['PIK', 'HAUTE', 'BASSE'];
const DUREES: [string, string][] = [
  ['1-6', '1 à 6 j'], ['7-13', '7 à 13 j'], ['14-20', '14 à 20 j'], ['21-29', '21 à 29 j'], ['mois', '1 mois'],
];

async function vueTarifs(main: HTMLElement, gid?: number) {
  const groupeId = gid ?? groupes[0]?.id;
  const groupe = groupes.find((g) => g.id === groupeId)!;
  const saisons = groupe.type === 'scooter' ? SAISONS_S : SAISONS_V;
  const { data } = await supabase.from('tarifs').select('*').eq('groupe_id', groupeId);
  const tarifs = (data ?? []) as Tarif[];
  const get = (s: string, d: string) => tarifs.find((t) => t.saison === s && t.duree === d);

  main.innerHTML = `
    <h2>Grilles tarifaires</h2>
    <div class="seg">${groupes.map((g) =>
      `<button data-g="${g.id}" class="${g.id === groupeId ? 'cur' : ''}">${esc(g.nom)}</button>`).join('')}</div>
    <div class="card">
      <div class="row"><b>${esc(groupe.nom)}</b>
        <span class="muted">Caution : <input id="t-caution" type="number" value="${groupe.caution}"
          style="width:110px; display:inline-block; padding:6px 8px" /> ฿</span></div>
      <div class="twrap" style="margin-top:12px">
        <table class="grille">
          <thead><tr><th>Durée</th>${saisons.map((s) => `<th>${s}</th>`).join('')}</tr></thead>
          <tbody>
            ${DUREES.map(([d, dl]) => `
              <tr><td>${dl}</td>${saisons.map((s) => `
                <td><input type="number" data-s="${s}" data-d="${d}"
                  value="${get(s, d)?.prix ?? ''}" placeholder="—" /></td>`).join('')}</tr>`).join('')}
          </tbody>
        </table>
      </div>
      <p class="muted">Prix par jour en bahts (« 1 mois » = forfait mensuel). Case vide = non proposé.</p>
      <button class="btn p" id="t-save" style="width:100%; padding:13px">Enregistrer la grille</button>
    </div>`;

  main.querySelectorAll('[data-g]').forEach((b) =>
    b.addEventListener('click', () => vueTarifs(main, Number((b as HTMLElement).dataset.g))));
  document.getElementById('t-save')!.addEventListener('click', async () => {
    const caution = Number((document.getElementById('t-caution') as HTMLInputElement).value || 0);
    await supabase.from('groupes_tarifs').update({ caution }).eq('id', groupeId);
    const rows: { groupe_id: number; saison: string; duree: string; prix: number | null }[] = [];
    main.querySelectorAll('table.grille input').forEach((inp) => {
      const i = inp as HTMLInputElement;
      rows.push({
        groupe_id: groupeId, saison: i.dataset.s!, duree: i.dataset.d!,
        prix: i.value === '' ? null : Number(i.value),
      });
    });
    const { error } = await supabase.from('tarifs')
      .upsert(rows, { onConflict: 'groupe_id,saison,duree' });
    if (error) { toast(`Erreur : ${error.message}`, true); return; }
    const g = groupes.find((x) => x.id === groupeId); if (g) g.caution = caution;
    toast('Grille enregistrée ✓');
  });
}
