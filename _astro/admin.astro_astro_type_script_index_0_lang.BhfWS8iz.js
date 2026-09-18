import{r as e,t}from"./supabase.D5aBsyy3.js";var n,r=[],i=[],a=e=>new Date(e+`T00:00:00`).toLocaleDateString(`fr-FR`,{day:`numeric`,month:`short`,year:`numeric`}),o=e=>String(e??``).replace(/[&<>"']/g,e=>({"&":`&amp;`,"<":`&lt;`,">":`&gt;`,'"':`&quot;`,"'":`&#39;`})[e]);function s(e,t=!1){let n=document.getElementById(`toast`);n.textContent=e,n.className=`toast on`+(t?` err`:``),setTimeout(()=>n.classList.remove(`on`),3200)}async function c(t){n=t;let{data:{session:r}}=await e.auth.getSession();if(!r)return l();await u()}function l(t=``){n.innerHTML=`
    <div class="login">
      <div class="logo"><span></span>Caribian Admin</div>
      ${t?`<div class="note">${o(t)}</div>`:``}
      <div class="card">
        <label>E-mail</label>
        <input id="email" type="email" autocomplete="username" placeholder="votre@email.com" />
        <label>Mot de passe</label>
        <input id="pwd" type="password" autocomplete="current-password" />
        <button class="btn n" id="go" style="width:100%; margin-top:18px; padding:13px">Se connecter</button>
      </div>
      <p class="muted" style="text-align:center">Accès réservé à l'équipe Caribian Rental Samui.</p>
    </div>`;let r=async()=>{let t=document.getElementById(`email`).value.trim(),n=document.getElementById(`pwd`).value;document.getElementById(`go`).disabled=!0;let{error:r}=await e.auth.signInWithPassword({email:t,password:n});if(r){l(`E-mail ou mot de passe incorrect.`);return}await u()};document.getElementById(`go`).addEventListener(`click`,r),document.getElementById(`pwd`).addEventListener(`keydown`,e=>{e.key===`Enter`&&r()})}async function u(){let[t,a]=await Promise.all([e.from(`vehicules`).select(`*`).order(`ordre`),e.from(`groupes_tarifs`).select(`*`).order(`id`)]);r=t.data??[],i=a.data??[],n.innerHTML=`
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
    <main id="vue"></main>`,document.getElementById(`logout`).addEventListener(`click`,async()=>{await e.auth.signOut(),l()}),document.getElementById(`publier`).addEventListener(`click`,async t=>{let n=t.currentTarget;n.disabled=!0,n.textContent=`⏳ Publication…`;let{data:r,error:i}=await e.functions.invoke(`publier`);if(n.disabled=!1,n.textContent=`🚀 Publier le site`,i||!r?.ok){s(`Publication impossible : ${i?.message??r?.error??`erreur inconnue`}`,!0);return}s(`Publication lancée ✓ — le site sera à jour dans ~3 minutes.`)}),n.querySelectorAll(`nav.tabs button`).forEach(e=>e.addEventListener(`click`,()=>d(e.dataset.v))),f(),d(`reservations`)}function d(e){n.querySelectorAll(`nav.tabs button`).forEach(t=>t.classList.toggle(`cur`,t.dataset.v===e));let t=document.getElementById(`vue`);t.innerHTML=`<p class="muted">Chargement…</p>`,e===`reservations`&&m(t),e===`calendrier`&&h(t),e===`vehicules`&&g(t),e===`tarifs`&&b(t)}async function f(){let{count:t}=await e.from(`reservations`).select(`id`,{count:`exact`,head:!0}).eq(`statut`,`en_attente`),n=document.getElementById(`badge-resa`);n&&(n.classList.toggle(`hidden`,!t),n.textContent=String(t??``))}var p=e=>r.find(t=>t.id===e)?.nom??`Véhicule #${e}`;async function m(t,n=`en_attente`){let{data:r,error:i}=await e.from(`reservations`).select(`*`).order(`created_at`,{ascending:!1}).limit(200);if(i){t.innerHTML=`<p class="muted">Erreur : ${o(i.message)}</p>`;return}let c=r??[],l=[[`en_attente`,`À traiter`],[`confirmee`,`Confirmées`],[`toutes`,`Toutes`]],u=c.filter(e=>n===`toutes`||e.statut===n);t.innerHTML=`
    <h2>Demandes de réservation</h2>
    <div class="seg">${l.map(([e,t])=>`<button data-f="${e}" class="${e===n?`cur`:``}">${t}</button>`).join(``)}</div>
    ${u.length===0?`<div class="empty">Rien ici pour l'instant 🌴</div>`:``}
    ${u.map(e=>`
      <div class="card" data-id="${e.id}">
        <div class="row">
          <div>
            <span class="pill ${e.statut}">${e.statut.replace(`_`,` `)}</span>
            <b style="margin-left:8px">${o(p(e.vehicule_id))}</b>
          </div>
          <span class="dates">${a(e.date_debut)} → ${a(e.date_fin)}</span>
        </div>
        <div style="margin:8px 0 4px">
          👤 <b>${o(e.client_nom)}</b>${e.nb_personnes?` · ${e.nb_personnes} pers.`:``}
          ${e.hotel?`<br/>🏨 ${o(e.hotel)}`:``}
          <br/>📞 <a class="tel" href="tel:${o(e.client_tel)}">${o(e.client_tel)}</a>
          · <a class="tel" href="https://wa.me/${o(e.client_tel.replace(/[^0-9]/g,``))}" target="_blank">WhatsApp ↗</a>
          ${e.client_email?`<br/>✉️ <a class="tel" href="mailto:${o(e.client_email)}">${o(e.client_email)}</a>`:``}
          ${e.message?`<br/>💬 <i>${o(e.message)}</i>`:``}
        </div>
        <div class="row" style="margin-top:10px">
          ${e.statut===`en_attente`?`
            <button class="btn p" data-act="confirmee">✓ Confirmer</button>
            <button class="btn d" data-act="refusee">✕ Refuser</button>`:``}
          ${e.statut===`confirmee`?`
            <button class="btn g" data-act="terminee">Terminée</button>
            <button class="btn g" data-act="annulee">Annuler</button>`:``}
        </div>
      </div>`).join(``)}`,t.querySelectorAll(`.seg button`).forEach(e=>e.addEventListener(`click`,()=>m(t,e.dataset.f))),t.querySelectorAll(`[data-act]`).forEach(r=>r.addEventListener(`click`,async()=>{let i=Number(r.closest(`.card`).dataset.id),a=r.dataset.act,{error:o}=await e.from(`reservations`).update({statut:a}).eq(`id`,i);if(o){s(o.code===`23P01`?`Impossible : ces dates chevauchent une réservation déjà confirmée.`:`Erreur : ${o.message}`,!0);return}s(a===`confirmee`?`Réservation confirmée ✓`:`Statut mis à jour`),f(),m(t,n)}))}async function h(t,n){let i=n??r[0]?.id;if(!i){t.innerHTML=`<div class="empty">Aucun véhicule.</div>`;return}let c=new Date().toISOString().slice(0,10),[l,u]=await Promise.all([e.from(`reservations`).select(`*`).eq(`vehicule_id`,i).in(`statut`,[`en_attente`,`confirmee`]).gte(`date_fin`,c).order(`date_debut`),e.from(`indisponibilites`).select(`*`).eq(`vehicule_id`,i).gte(`date_fin`,c).order(`date_debut`)]);t.innerHTML=`
    <h2>Calendrier &amp; indisponibilités</h2>
    <div class="seg">${r.map(e=>`<button data-vid="${e.id}" class="${e.id===i?`cur`:``}">${o(e.nom)}</button>`).join(``)}</div>

    <div class="card">
      <b>Occupations à venir</b>
      ${(l.data??[]).length===0&&(u.data??[]).length===0?`<p class="muted">Aucune occupation à venir : le véhicule est libre.</p>`:``}
      ${(l.data??[]).map(e=>`
        <div class="row" style="margin-top:8px">
          <span><span class="pill ${e.statut}">${e.statut.replace(`_`,` `)}</span> ${o(e.client_nom)}</span>
          <span class="dates">${a(e.date_debut)} → ${a(e.date_fin)}</span>
        </div>`).join(``)}
      ${(u.data??[]).map(e=>`
        <div class="row" style="margin-top:8px" data-ind="${e.id}">
          <span>🔧 ${o(e.motif||`Indisponible`)}</span>
          <span class="dates">${a(e.date_debut)} → ${a(e.date_fin)}
            <button class="btn g" data-del="${e.id}" style="padding:4px 12px; margin-left:8px">✕</button></span>
        </div>`).join(``)}
    </div>

    <div class="card">
      <b>Bloquer une période</b> <span class="muted">(entretien, usage perso…)</span>
      <div class="grid2">
        <div><label>Du</label><input type="date" id="ind-d1" min="${c}" /></div>
        <div><label>Au</label><input type="date" id="ind-d2" min="${c}" /></div>
      </div>
      <label>Motif (facultatif)</label>
      <input id="ind-motif" placeholder="Révision, prêt…" />
      <button class="btn n" id="ind-add" style="margin-top:14px">Bloquer ces dates</button>
    </div>`,t.querySelectorAll(`[data-vid]`).forEach(e=>e.addEventListener(`click`,()=>h(t,Number(e.dataset.vid)))),t.querySelectorAll(`[data-del]`).forEach(n=>n.addEventListener(`click`,async()=>{await e.from(`indisponibilites`).delete().eq(`id`,Number(n.dataset.del)),s(`Période débloquée`),h(t,i)})),document.getElementById(`ind-add`).addEventListener(`click`,async()=>{let n=document.getElementById(`ind-d1`).value,r=document.getElementById(`ind-d2`).value,a=document.getElementById(`ind-motif`).value.trim()||null;if(!n||!r||r<n){s(`Choisissez des dates valides.`,!0);return}let{error:o}=await e.from(`indisponibilites`).insert({vehicule_id:i,date_debut:n,date_fin:r,motif:a});if(o){s(`Erreur : ${o.message}`,!0);return}s(`Période bloquée ✓`),h(t,i)})}async function g(n){let{data:a}=await e.from(`vehicules`).select(`*`).order(`ordre`);r=a??[];let{data:c}=await e.from(`vehicule_photos`).select(`*`).order(`ordre`),l=e=>(c??[]).find(t=>t.vehicule_id===e)?.path;n.innerHTML=`
    <h2>Véhicules</h2>
    <div class="note">Après vos modifications, appuyez sur <b>🚀 Publier le site</b> (en haut) :
      le site public est à jour ~3 minutes plus tard. Sinon, il se met à jour tout seul chaque nuit.</div>
    ${r.map(e=>`
      <div class="card row" data-id="${e.id}" style="flex-wrap:nowrap">
        ${l(e.id)?`<img class="veh-thumb" src="${o(t(l(e.id)))}" alt="" />`:`<div class="veh-thumb" style="background:#eee"></div>`}
        <div style="flex:1; min-width:0">
          <b>${o(e.nom)}</b> ${e.actif?``:`<span class="pill refusee">masqué</span>`}
          <div class="muted">${o(e.famille)} · ${e.prix_jour} ฿/j</div>
        </div>
        <button class="btn g" data-edit="${e.id}">Modifier</button>
      </div>`).join(``)}
    <button class="btn n" id="add-veh" style="width:100%; padding:13px; margin-top:6px">+ Ajouter un véhicule</button>
    <div id="veh-form"></div>`,n.querySelectorAll(`[data-edit]`).forEach(e=>e.addEventListener(`click`,()=>u(r.find(t=>t.id===Number(e.dataset.edit))))),document.getElementById(`add-veh`).addEventListener(`click`,()=>u(null));async function u(r){let a=document.getElementById(`veh-form`),{data:c}=r?await e.from(`vehicule_photos`).select(`*`).eq(`vehicule_id`,r.id).order(`ordre`):{data:[]};a.innerHTML=`
      <div class="card" style="border-color:var(--turq)">
        <div class="row"><b>${r?`Modifier — ${o(r.nom)}`:`Nouveau véhicule`}</b>
          <button class="btn g" id="f-close">Fermer</button></div>
        <div class="grid2">
          <div><label>Nom</label><input id="f-nom" value="${o(r?.nom??``)}" /></div>
          <div><label>Famille</label><input id="f-famille" value="${o(r?.famille??``)}" placeholder="Caribian, Ford Ecosport…" /></div>
          <div><label>Catégorie</label>
            <select id="f-cat">
              <option value="voiture" ${r?.categorie===`scooter`?``:`selected`}>Voiture</option>
              <option value="scooter" ${r?.categorie===`scooter`?`selected`:``}>Scooter</option>
            </select></div>
          <div><label>Groupe tarifaire</label>
            <select id="f-groupe">${i.map(e=>`<option value="${e.id}" ${r?.groupe_id===e.id?`selected`:``}>${o(e.nom)}</option>`).join(``)}</select></div>
          <div><label>Badge</label><input id="f-badge" value="${o(r?.badge??``)}" placeholder="La star, Iconique…" /></div>
          <div><label>Couleur badge</label>
            <select id="f-bc">${[`lagoon`,`coral`,`palm`,`sun`].map(e=>`<option ${r?.badge_color===e?`selected`:``}>${e}</option>`).join(``)}</select></div>
          <div><label>Prix affiché ฿/jour</label><input id="f-prix" type="number" value="${r?.prix_jour??``}" /></div>
          <div><label>Équivalent €/jour</label><input id="f-eur" type="number" value="${r?.prix_jour_eur??``}" /></div>
          <div><label>Prix 1-6 j ฿</label><input id="f-prix16" type="number" value="${r?.prix_jour_1a6??``}" /></div>
          <div><label>Prix mois ฿ (scooters)</label><input id="f-mois" type="number" value="${r?.prix_mois??``}" /></div>
          <div><label>Places</label><input id="f-places" value="${o(r?.places??``)}" placeholder="5 places" /></div>
          <div><label>Transmission</label><input id="f-trans" value="${o(r?.transmission??``)}" placeholder="Boîte manuelle" /></div>
        </div>
        <label>Petit plus (affiché en étiquette)</label><input id="f-extra" value="${o(r?.extra??``)}" />
        <label>Texte de présentation</label><textarea id="f-accroche" rows="3">${o(r?.accroche??``)}</textarea>
        <label style="display:flex; align-items:center; gap:8px; text-transform:none; font-size:.9rem; margin-top:14px">
          <input type="checkbox" id="f-actif" style="width:auto" ${r?.actif===!1?``:`checked`} />
          Visible sur le site
        </label>
        ${r?`
        <label>Photos</label>
        <div class="photolist" id="f-photos">
          ${(c??[]).map(e=>`
            <div class="ph"><img src="${o(t(e.path))}" alt="" /><button data-delph="${e.id}">✕</button></div>`).join(``)}
        </div>
        <input type="file" id="f-upload" accept="image/*" multiple style="margin-top:8px" />
        <p class="muted">Depuis un téléphone : « Prendre une photo » fonctionne aussi.</p>`:``}
        <div class="row" style="margin-top:16px">
          <button class="btn p" id="f-save" style="flex:1">Enregistrer</button>
          ${r?`<button class="btn d" id="f-del">Supprimer</button>`:``}
        </div>
      </div>`,a.scrollIntoView({behavior:`smooth`});let l=e=>document.getElementById(e).value.trim(),d=e=>{let t=l(e);return t===``?null:Number(t)};document.getElementById(`f-close`).addEventListener(`click`,()=>{a.innerHTML=``}),document.getElementById(`f-save`).addEventListener(`click`,async()=>{let t={nom:l(`f-nom`),famille:l(`f-famille`),categorie:document.getElementById(`f-cat`).value,groupe_id:Number(document.getElementById(`f-groupe`).value),badge:l(`f-badge`)||null,badge_color:document.getElementById(`f-bc`).value,prix_jour:d(`f-prix`)??0,prix_jour_eur:d(`f-eur`),prix_jour_1a6:d(`f-prix16`),prix_mois:d(`f-mois`),places:l(`f-places`)||null,transmission:l(`f-trans`)||null,extra:l(`f-extra`)||null,accroche:l(`f-accroche`)||null,actif:document.getElementById(`f-actif`).checked};if(!t.nom){s(`Le nom est obligatoire.`,!0);return}let i;if(r?{error:i}=await e.from(`vehicules`).update(t).eq(`id`,r.id):(t.slug=String(t.nom).toLowerCase().normalize(`NFD`).replace(/[̀-ͯ]/g,``).replace(/[^a-z0-9]+/g,`-`).replace(/^-|-$/g,``),{error:i}=await e.from(`vehicules`).insert(t)),i){s(`Erreur : ${i.message}`,!0);return}s(`Enregistré ✓`),g(n)}),r&&(document.getElementById(`f-del`).addEventListener(`click`,async()=>{if(!confirm(`Supprimer définitivement « ${r.nom} » ?\n(Pour le masquer temporairement, décochez plutôt « Visible sur le site ».)`))return;let{error:t}=await e.from(`vehicules`).delete().eq(`id`,r.id);if(t){s(`Suppression impossible : des réservations y sont liées. Masquez-le plutôt.`,!0);return}s(`Véhicule supprimé`),g(n)}),a.querySelectorAll(`[data-delph]`).forEach(t=>t.addEventListener(`click`,async()=>{await e.from(`vehicule_photos`).delete().eq(`id`,Number(t.dataset.delph)),s(`Photo retirée`),u(r)})),document.getElementById(`f-upload`).addEventListener(`change`,async t=>{let n=Array.from(t.target.files??[]);for(let t of n){let n=(t.name.split(`.`).pop()||`jpg`).toLowerCase(),i=`${r.slug}/${Date.now()}-${Math.random().toString(36).slice(2,7)}.${n}`,{error:a}=await e.storage.from(`photos`).upload(i,t,{contentType:t.type});if(a){s(`Envoi impossible : ${a.message}`,!0);continue}await e.from(`vehicule_photos`).insert({vehicule_id:r.id,path:i})}s(`Photo(s) ajoutée(s) ✓`),u(r)}))}}var _=[`PIK`,`HAUTE`,`MOYENNE`,`BASSE`],v=[`PIK`,`HAUTE`,`BASSE`],y=[[`1-6`,`1 à 6 j`],[`7-13`,`7 à 13 j`],[`14-20`,`14 à 20 j`],[`21-29`,`21 à 29 j`],[`mois`,`1 mois`]];async function b(t,n){let r=n??i[0]?.id,a=i.find(e=>e.id===r),c=a.type===`scooter`?v:_,{data:l}=await e.from(`tarifs`).select(`*`).eq(`groupe_id`,r),u=l??[],d=(e,t)=>u.find(n=>n.saison===e&&n.duree===t);t.innerHTML=`
    <h2>Grilles tarifaires</h2>
    <div class="seg">${i.map(e=>`<button data-g="${e.id}" class="${e.id===r?`cur`:``}">${o(e.nom)}</button>`).join(``)}</div>
    <div class="card">
      <div class="row"><b>${o(a.nom)}</b>
        <span class="muted">Caution : <input id="t-caution" type="number" value="${a.caution}"
          style="width:110px; display:inline-block; padding:6px 8px" /> ฿</span></div>
      <div class="twrap" style="margin-top:12px">
        <table class="grille">
          <thead><tr><th>Durée</th>${c.map(e=>`<th>${e}</th>`).join(``)}</tr></thead>
          <tbody>
            ${y.map(([e,t])=>`
              <tr><td>${t}</td>${c.map(t=>`
                <td><input type="number" data-s="${t}" data-d="${e}"
                  value="${d(t,e)?.prix??``}" placeholder="—" /></td>`).join(``)}</tr>`).join(``)}
          </tbody>
        </table>
      </div>
      <p class="muted">Prix par jour en bahts (« 1 mois » = forfait mensuel). Case vide = non proposé.</p>
      <button class="btn p" id="t-save" style="width:100%; padding:13px">Enregistrer la grille</button>
    </div>`,t.querySelectorAll(`[data-g]`).forEach(e=>e.addEventListener(`click`,()=>b(t,Number(e.dataset.g)))),document.getElementById(`t-save`).addEventListener(`click`,async()=>{let n=Number(document.getElementById(`t-caution`).value||0);await e.from(`groupes_tarifs`).update({caution:n}).eq(`id`,r);let a=[];t.querySelectorAll(`table.grille input`).forEach(e=>{let t=e;a.push({groupe_id:r,saison:t.dataset.s,duree:t.dataset.d,prix:t.value===``?null:Number(t.value)})});let{error:o}=await e.from(`tarifs`).upsert(a,{onConflict:`groupe_id,saison,duree`});if(o){s(`Erreur : ${o.message}`,!0);return}let c=i.find(e=>e.id===r);c&&(c.caution=n),s(`Grille enregistrée ✓`)})}c(document.getElementById(`app`));