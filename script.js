const SUPABASE_URL = "https://glovvrsctvjwjtxiaaihu.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdsb3Z2c2N0dmp3anR4aWFpahuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA4NzAxNTUsImV4cCI6MjEwNjQ0NjE1NX0.CcPT-QFfF3mQrH9KxnOpU9Adu4ltCV5FrH4lWULR3Vk";

// Navigation onglets
document.querySelectorAll('.nav-tab').forEach(tab => {
    tab.addEventListener('click', (e) => {
        document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        
        const clickedTab = e.currentTarget;
        clickedTab.classList.add('active');
        const targetId = 'tab-' + clickedTab.id.replace('btn-', '');
        const targetEl = document.getElementById(targetId);
        if(targetEl) targetEl.classList.add('active');
        
        if(targetId === 'tab-setups') chargerSetupsPublics();
    });
});

// Profil
let pseudoActif = localStorage.getItem('vmv_pseudo') || '';
const btnToggleProfil = document.getElementById('btnToggleProfil');
const statutSession = document.getElementById('statutSession');
const auteurInput = document.getElementById('auteurInput');

function refreshProfilUI() {
    const pInput = document.getElementById('pseudoActifInput');
    if(!pInput || !btnToggleProfil || !statutSession) return;
    if(pseudoActif) {
        pInput.value = pseudoActif;
        if(auteurInput) auteurInput.value = pseudoActif;
        statutSession.innerText = "Statut : Connecté en tant que " + pseudoActif;
        btnToggleProfil.innerText = "Se déconnecter";
    } else {
        statutSession.innerText = "Statut : Déconnecté";
        btnToggleProfil.innerText = "Se connecter";
    }
}
refreshProfilUI();

if(btnToggleProfil) {
    btnToggleProfil.addEventListener('click', () => {
        if(pseudoActif) {
            if(confirm("Se déconnecter ?")) {
                pseudoActif = '';
                localStorage.removeItem('vmv_pseudo');
                refreshProfilUI();
            }
        } else {
            const val = document.getElementById('pseudoActifInput').value.trim();
            if(val) {
                pseudoActif = val;
                localStorage.setItem('vmv_pseudo', pseudoActif);
                refreshProfilUI();
                alert("Connecté !");
            } else {
                alert("Entre un pseudo valide.");
            }
        }
    });
}

// Soumission Setup complet
const formSetup = document.getElementById('formSetup');
if(formSetup) {
    formSetup.addEventListener('submit', async (e) => {
        e.preventDefault();
        if(!pseudoActif) {
            alert("Connecte-toi avec un pseudo dans l'onglet Profil avant de publier !");
            return;
        }

        const payload = {
            id: 'local_' + Date.now(),
            auteur: auteurInput.value,
            moto: document.getElementById('motoInput').value,
            circuit: document.getElementById('circuitNomInput').value,
            pneu_avant: document.getElementById('pneuAvant').value,
            pneu_arriere: document.getElementById('pneuArriere').value,
            susp_av_pre: parseInt(document.getElementById('suspAvPre').value) || 4,
            susp_av_hui: parseInt(document.getElementById('suspAvHui').value) || 4,
            susp_av_res: parseInt(document.getElementById('suspAvRes').value) || 4,
            susp_av_com: parseInt(document.getElementById('suspAvCom').value) || 4,
            susp_av_ext: parseInt(document.getElementById('suspAvExt').value) || 4,
            susp_ar_pre: parseInt(document.getElementById('suspArPre').value) || 4,
            susp_ar_res: parseInt(document.getElementById('suspArRes').value) || 4,
            susp_ar_cl: parseInt(document.getElementById('suspArCL').value) || 4,
            susp_ar_ext: parseInt(document.getElementById('suspArExt').value) || 4,
            bv_1: parseInt(document.getElementById('bv1').value) || 4,
            bv_2: parseInt(document.getElementById('bv2').value) || 4,
            bv_3: parseInt(document.getElementById('bv3').value) || 4,
            bv_4: parseInt(document.getElementById('bv4').value) || 4,
            bv_5: parseInt(document.getElementById('bv5').value) || 4,
            bv_6: parseInt(document.getElementById('bv6').value) || 4,
            bv_final: parseInt(document.getElementById('bvFinal').value) || 4,
            anti_dribble: parseInt(document.getElementById('antiDribble').value) || 4,
            frein_avant: document.getElementById('freinAvant').value,
            frein_arriere: document.getElementById('freinArriere').value,
            ecu_tcs: parseInt(document.getElementById('ecuTcs').value) || 3,
            ecu_aw: parseInt(document.getElementById('ecuAw').value) || 3,
            ecu_ebs: parseInt(document.getElementById('ecuEbs').value) || 3,
            geo_cha: parseInt(document.getElementById('geoCha').value) || 4,
            geo_dep: parseInt(document.getElementById('geoDep').value) || 4,
            geo_pla: parseInt(document.getElementById('geoPla').value) || 4,
            geo_bras_geo: parseInt(document.getElementById('geoBrasGeo').value) || 4
        };

        let localSetups = JSON.parse(localStorage.getItem('vmv_local_setups') || '[]');
        localSetups.unshift(payload);
        localStorage.setItem('vmv_local_setups', JSON.stringify(localSetups));

        try {
            const res = await fetch(`${SUPABASE_URL}/rest/v1/motogp_setups`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                    'Prefer': 'return=representation'
                },
                body: JSON.stringify(payload)
            });
            if(res.ok) {
                const data = await res.json();
                if(data && data[0] && data[0].id) {
                    payload.id = data[0].id;
                }
            }
        } catch (err) {
            console.warn("Mode local activé.");
        }

        alert("Setup publié avec succès !");
        document.getElementById('btn-setups').click();
    });
}

// Chargement des setups publics
let allSetupsCache = [];
async function chargerSetupsPublics() {
    const container = document.getElementById('listeSetups');
    if(!container) return;
    container.innerHTML = "Chargement...";
    
    let cloudData = [];
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/motogp_setups?select=*&order=created_at.desc`, {
            headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` }
        });
        if(response.ok) cloudData = await response.json();
    } catch(e) {
        console.warn("Cloud injoignable");
    }

    let localData = JSON.parse(localStorage.getItem('vmv_local_setups') || '[]');
    const cloudIds = new Set(cloudData.map(item => item.id));
    const uniqueLocal = localData.filter(item => !cloudIds.has(item.id));
    
    allSetupsCache = [...uniqueLocal, ...cloudData];
    afficherSetupsFiltres();
}

function afficherSetupsFiltres() {
    const container = document.getElementById('listeSetups');
    if(!container) return;
    const filtreTexte = document.getElementById('filtreInput').value.toLowerCase();
    const filtreCircuit = document.getElementById('filtreCircuitSelect').value;

    const filtres = allSetupsCache.filter(item => {
        const matchTexte = (item.moto && item.moto.toLowerCase().includes(filtreTexte)) || 
                           (item.auteur && item.auteur.toLowerCase().includes(filtreTexte));
        const matchCircuit = !filtreCircuit || item.circuit === filtreCircuit;
        return matchTexte && matchCircuit;
    });

    if(filtres.length === 0) {
        container.innerHTML = "<p style='color:#777; font-size:11px; text-align:center;'>Aucun setup trouvé.</p>";
        return;
    }

    container.innerHTML = '';
    filtres.forEach(item => {
        const div = document.createElement('div');
        div.className = 'setup-item';
        div.innerHTML = `<strong>${item.moto}</strong> sur <strong>${item.circuit}</strong><br><span style="font-size:10px; color:#888;">Par ${item.auteur}</span>`;
        div.addEventListener('click', () => ouvrirModalSetup(item));
        container.appendChild(div);
    });
}

const filtreInput = document.getElementById('filtreInput');
const filtreCircuitSelect = document.getElementById('filtreCircuitSelect');
if(filtreInput) filtreInput.addEventListener('input', afficherSetupsFiltres);
if(filtreCircuitSelect) filtreCircuitSelect.addEventListener('change', afficherSetupsFiltres);

// Modale détaillée
const modal = document.getElementById('modalDetails');
const btnCloseModal = document.getElementById('btnCloseModal');
if(btnCloseModal && modal) btnCloseModal.addEventListener('click', () => modal.style.display = 'none');

function ouvrirModalSetup(item) {
    document.getElementById('modalTitre').innerText = `${item.moto} (${item.circuit})`;
    document.getElementById('modalCorps').innerHTML = `
        <p style="margin-bottom:10px; color:#aaa;"><strong>Auteur :</strong> ${item.auteur}</p>
        <div class="section-title">Pneumatiques</div>
        Avant : ${item.pneu_avant} | Arrière : ${item.pneu_arriere}
        <div class="section-title">Suspension Avant</div>
        Précharge avant: ${item.susp_av_pre} | Quantité d'huile: ${item.susp_av_hui} | Dureté du ressort avant: ${item.susp_av_res}<br>
        Compression de la fourche avant: ${item.susp_av_com} | Extension de la fourche avant: ${item.susp_av_ext}
        <div class="section-title">Suspension Arrière</div>
        Précharge arrière: ${item.susp_ar_pre} | Connecteur du bras oscillant: ${item.geo_bras_geo ?? 4} | Dureté du ressort arrière: ${item.susp_ar_res}<br>
        Compression du monoamortisseur: ${item.susp_ar_cl} | Extension du monoamortisseur: ${item.susp_ar_ext}
        <div class="section-title">Boîte de Vitesse</div>
        1ère: ${item.bv_1} | 2ème: ${item.bv_2} | 3ème: ${item.bv_3}<br>
        4ème: ${item.bv_4} | 5ème: ${item.bv_5} | 6ème: ${item.bv_6}<br>
        <strong>Rapport Final:</strong> ${item.bv_final} | <strong>Anti-dribble:</strong> ${item.anti_dribble}
        <div class="section-title">Freins & Électronique</div>
        Disques Av: ${item.frein_avant} | Ar: ${item.frein_arriere}<br>
        TCS: ${item.ecu_tcs} | Anti-Wheeling: ${item.ecu_aw} | EBS: ${item.ecu_ebs}
        <div class="section-title">Géométrie</div>
        Chasse: ${item.geo_cha} | Déport: ${item.geo_dep} | Plaque de direction: ${item.geo_pla}
    `;

    const actionsDiv = document.getElementById('modalActions');
    actionsDiv.innerHTML = '';
    
    if(pseudoActif && item.auteur.toLowerCase() === pseudoActif.toLowerCase()) {
        const btnSupprimer = document.createElement('button');
        btnSupprimer.innerText = "Supprimer ce setup";
        btnSupprimer.style.background = "#dc3545";
        btnSupprimer.style.width = "100%";
        btnSupprimer.addEventListener('click', async () => {
            if(confirm("Veux-tu vraiment supprimer ce setup ?")) {
                let localSetups = JSON.parse(localStorage.getItem('vmv_local_setups') || '[]');
                localSetups = localSetups.filter(s => s.id !== item.id);
                localStorage.setItem('vmv_local_setups', JSON.stringify(localSetups));

                if(item.id && !item.id.toString().startsWith('local_')) {
                    try {
                        await fetch(`${SUPABASE_URL}/rest/v1/motogp_setups?id=eq.${item.id}`, {
                            method: 'DELETE',
                            headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` }
                        });
                    } catch(e) {}
                }

                modal.style.display = 'none';
                alert("Setup supprimé.");
                chargerSetupsPublics();
            }
        });
        actionsDiv.appendChild(btnSupprimer);
    }
    modal.style.display = 'flex';
}

// ==========================================
// COACH IA (RAPIDE & EXPERT AVEC FEEDBACK)
// ==========================================

document.getElementById('btnCoachRapide')?.addEventListener('click', () => {
    document.getElementById('btnCoachRapide').classList.add('active');
    document.getElementById('btnCoachComplet').classList.remove('active');
    document.getElementById('viewCoachRapide').style.display = 'block';
    document.getElementById('viewCoachComplet').style.display = 'none';
});
document.getElementById('btnCoachComplet')?.addEventListener('click', () => {
    document.getElementById('btnCoachComplet').classList.add('active');
    document.getElementById('btnCoachRapide').classList.remove('active');
    document.getElementById('viewCoachComplet').style.display = 'block';
    document.getElementById('viewCoachRapide').style.display = 'none';
});

const problemesParPhase = {
    "Entree": [
        { id: "guidonnage_frein", label: "Guidonnage violent au freinage", conseil: "Augmente la précharge avant (+2) et durcis la compression." },
        { id: "avant_lourd", label: "La moto refuse de tourner à l'insertion", conseil: "Diminue la chasse (-2) ou augmente le connecteur du bras oscillant (+2)." },
        { id: "perte_avant", label: "Goutte d'eau / Sensation de perdre l'avant", conseil: "Augmente la quantité d'huile de fourche (+2) et assouplis l'extension avant." }
    ],
    "Milieu": [
        { id: "sous_virage", label: "Élargit trop en milieu de courbe (Sous-virage)", conseil: "Augmente le déport de fourche (+2) et réduis la précharge arrière." },
        { id: "train_instable", label: "Train arrière flou / bouge sur l'angle", conseil: "Augmente la compression du monoamortisseur (+2) et durcis le ressort arrière." }
    ],
    "Sortie": [
        { id: "patinage_accel", label: "Gros patinage de l'arrière en réaccélération", conseil: "Augmente le TCS (+2) et assouplis la compression du monoamortisseur (-2)." },
        { id: "cabrage", label: "La moto se lève trop (Wheeling)", conseil: "Augmente l'anti-wheeling (+2) et allonge le rapport final." },
        { id: "guidonnage_sortie", label: "Guidonnage à l'accélération sur les bosses", conseil: "Augmente l'amortisseur de direction et la précharge arrière." }
    ],
    "Freinage": [
        { id: "arriere_decolle", label: "La roue arrière se soulève trop (Stoppie)", conseil: "Augmente le frein moteur EBS (+2) et assouplis la fourche avant." },
        { id: "blocage_roue", label: "Blocage fréquent de la roue avant", conseil: "Augmente l'anti-dribble (+2) et l'huile de fourche." }
    ]
};

const phaseSelect = document.getElementById('phaseSelect');
const problemeSelect = document.getElementById('problemeSelect');
const conseilBox = document.getElementById('conseilBox');

function mettreAJourProblemes() {
    if(!phaseSelect || !problemeSelect) return;
    const phase = phaseSelect.value;
    const liste = problemesParPhase[phase] || [];
    problemeSelect.innerHTML = '';
    liste.forEach(p => {
        const opt = document.createElement('option');
        opt.value = p.id;
        opt.innerText = p.label;
        problemeSelect.appendChild(opt);
    });
    afficherConseilRapide();
}

function afficherConseilRapide() {
    const phase = phaseSelect.value;
    const probId = problemeSelect.value;
    const liste = problemesParPhase[phase] || [];
    const trouve = liste.find(p => p.id === probId);
    if(trouve) {
        conseilBox.innerHTML = `<strong>Diagnostic Piste :</strong><br>${trouve.conseil}`;
    } else {
        conseilBox.innerHTML = "Sélectionne un problème valide.";
    }
}

if(phaseSelect) phaseSelect.addEventListener('change', mettreAJourProblemes);
if(problemeSelect) problemeSelect.addEventListener('change', afficherConseilRapide);
mettreAJourProblemes();

// --- Moteur de génération Expert ultra-puissant avec variations franches et Feedback ---
let dernierSetupGenere = null;
let niveauAgressiviteIA = 0; // S'incrémente si l'utilisateur n'est pas satisfait pour forcer de plus gros changements

document.getElementById('btnGenererSetupAI')?.addEventListener('click', () => {
    executerGenerationExpert(0);
});

function executerGenerationExpert(bonusAgressivite) {
    const circuit = document.getElementById('aiCircuitNom').value;
    const meteo = document.getElementById('aiMeteo').value;
    const texteRessenti = document.getElementById('aiRessentiLibre').value.toLowerCase();
    const box = document.getElementById('setupCompletBox');

    // Valeurs de base nettes et modulées
    let pneuAv = meteo.includes("Pluie") ? "Soft Pluie" : (meteo.includes("Chaud") ? "Hard" : "Medium");
    let pneuAr = meteo.includes("Pluie") ? "Soft Pluie" : (meteo.includes("Chaud") ? "Medium" : "Soft");

    // Valeurs initiales contrastées
    let avPre = 3 + bonusAgressivite, avHui = 4, avRes = 4, avCom = 4, avExt = 4;
    let arPre = 4, arRes = 4, arCL = 4, arExt = 4;
    let bv1 = 4, bv2 = 4, bv3 = 4, bv4 = 4, bv5 = 4, bv6 = 4, bvFinal = 4, antiDribble = 4;
    let tcs = 3, aw = 3, ebs = 3;
    let geoCha = 4, geoDep = 4, geoPla = 4, geoBras = 4;

    // Analyse approfondie et modifications franches du texte libre
    if(texteRessenti.includes("frein") || texteRessenti.includes("stabilité") || texteRessenti.includes("instabl")) {
        avCom = Math.min(7, 5 + bonusAgressivite);
        avHui = Math.min(7, 6 + bonusAgressivite);
        ebs = Math.min(5, 4 + bonusAgressivite);
        arPre = 5;
    }
    if(texteRessenti.includes("patin") || texteRessenti.includes("accélér") || texteRessenti.includes("gliss")) {
        tcs = Math.min(5, 4 + bonusAgressivite);
        arCL = Math.max(1, 3 - bonusAgressivite);
        antiDribble = 5;
    }
    if(texteRessenti.includes("tourne pas") || texteRessenti.includes("insertion") || texteRessenti.includes("sous-virage") || texteRessenti.includes("élarg")) {
        geoDep = Math.min(7, 6 + bonusAgressivite);
        geoCha = Math.max(1, 2 - bonusAgressivite);
        geoBras = Math.min(7, 6 + bonusAgressivite);
    }
    if(texteRessenti.includes("guidonn") || texteRessenti.includes("secousse")) {
        avPre = Math.min(7, 6 + bonusAgressivite);
        arRes = Math.min(7, 5 + bonusAgressivite);
    }

    // Adaptation majeure selon le circuit
    if(circuit.includes("Mugello") || circuit.includes("Silverstone") || circuit.includes("Austin")) {
        bvFinal = Math.min(7, 6 + bonusAgressivite); // Allonge maximale
        bv5 = 5; bv6 = 5;
    } else if(circuit.includes("Jerez") || circuit.includes("Le Mans") || circuit.includes("Misano")) {
        bvFinal = Math.max(1, 2 - bonusAgressivite); // Punch et relance serrée
        bv1 = 3; bv2 = 3;
    }

    dernierSetupGenere = { avPre, avHui, avCom, arPre, geoBras, bvFinal, tcs, geoDep, avRes, arRes, arCL, arExt, antiDribble, ebs };

    box.style.display = 'block';
    box.innerHTML = `
        <strong style="color:#e10600;">Setup Expert Généré sur-mesure (100%) :</strong><br>
        <em>Circuit : ${circuit} | Météo : ${meteo}</em><br>
        ${texteRessenti ? `<br><span style="color:#ffc107; font-size:11px;">Ressenti analysé : "${document.getElementById('aiRessentiLibre').value}"</span><br>` : ''}
        <br>
        - <strong>Pneumatiques :</strong> Avant : ${pneuAv} | Arrière : ${pneuAr}<br>
        - <strong>Suspension Avant :</strong> Précharge avant: ${avPre} | Quantité d'huile: ${avHui} | Dureté ressort avant: ${avRes} | Compression: ${avCom} | Extension: ${avExt}<br>
        - <strong>Suspension Arrière :</strong> Précharge arrière: ${arPre} | Connecteur bras oscillant: ${geoBras} | Dureté ressort arrière: ${arRes} | Compression mono: ${arCL} | Extension mono: ${arExt}<br>
        - <strong>Boîte de Vitesse :</strong> 1ère: ${bv1} | 2ème: ${bv2} | 3ème: ${bv3} | 4ème: ${bv4} | 5ème: ${bv5} | 6ème: ${bv6}<br>
        - <strong>Transmission :</strong> Rapport Final: ${bvFinal} | Anti-dribble: ${antiDribble}<br>
        - <strong>Freins & Électronique :</strong> TCS: ${tcs} | Anti-Wheeling: ${aw} | EBS: ${ebs}<br>
        - <strong>Géométrie :</strong> Chasse: ${geoCha} | Déport: ${geoDep} | Plaque de direction: ${geoPla}<br><br>
        
        <div style="background:#222; padding:10px; border-radius:4px; margin-top:10px; text-align:center;">
            <p style="font-size:12px; margin-bottom:8px; color:#fff;">Ce setup vous convient-il sur la piste ?</p>
            <div style="display:flex; gap:5px;">
                <button onclick="validerSetupExpert()" style="background:#28a745; flex:1; padding:8px; font-size:12px;">👍 Oui, parfait !</button>
                <button onclick="affinerSetupExpert()" style="background:#dc3545; flex:1; padding:8px; font-size:12px;">👎 Non, ça ne va pas</button>
            </div>
        </div>
    `;
}

function validerSetupExpert() {
    if(!dernierSetupGenere) return;
    document.getElementById('suspAvPre').value = dernierSetupGenere.avPre;
    document.getElementById('suspAvHui').value = dernierSetupGenere.avHui;
    document.getElementById('suspAvCom').value = dernierSetupGenere.avCom;
    document.getElementById('suspArPre').value = dernierSetupGenere.arPre;
    document.getElementById('geoBrasGeo').value = dernierSetupGenere.geoBras;
    document.getElementById('bvFinal').value = dernierSetupGenere.bvFinal;
    document.getElementById('ecuTcs').value = dernierSetupGenere.tcs;
    document.getElementById('geoDep').value = dernierSetupGenere.geoDep;
    
    document.getElementById('btn-accueil').click();
    alert("Setup validé et injecté dans le formulaire de saisie !");
}

function affinerSetupExpert() {
    niveauAgressiviteIA += 1;
    alert("L'IA a pris en compte votre retour négatif et va modifier plus radicalement les valeurs (Tentative " + (niveauAgressiviteIA + 1) + ") !");
    executerGenerationExpert(niveauAgressiviteIA);
}
