/* ============================================================================
   FICHIER : store.js
   RÔLE    : Gestion de la base de données Firestore et du cache local
   ============================================================================ */

import { 
  db, 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy,
  onSnapshot
} from "./firebase-config.js";

/* ============================================================================
   1. DONNÉES PAR DÉFAUT
   ============================================================================ */

export const DEFAULT_EVENTS = [
  {
    id: "evt-1",
    title: "Store Showdown – Secrets of Power",
    location: "Mondes Fantastiques",
    date: "Samedi 15 nov. 2026 • 14h00",
    format: "Premier",
    capacity: 16,
    count: 12,
    order: 1,
    isPrivate: false,
    imageUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80",
    meleeUrl: "https://melee.gg"
  },
  {
    id: "evt-2",
    title: "Ligue MEVA – Ronde 3",
    location: "Les Trésors d'Idunn",
    date: "Samedi 22 nov. 2026 • 14h00",
    format: "Premier",
    capacity: 24,
    count: 18,
    order: 2,
    isPrivate: false,
    imageUrl: "https://images.unsplash.com/photo-1578374173705-969cbe6f2d6b?auto=format&fit=crop&w=800&q=80",
    meleeUrl: ""
  },
  {
    id: "evt-3",
    title: "Draft – Secrets of Power",
    location: "SoukoGames",
    date: "Dimanche 30 nov. 2026 • 10h00",
    format: "Draft",
    capacity: 12,
    count: 8,
    order: 3,
    isPrivate: false,
    imageUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80",
    meleeUrl: ""
  }
];

export const DEFAULT_NEWS = [
  {
    id: "nw-1",
    title: "Lancement de la saison « Secrets of Power »",
    content: "La nouvelle saison de la ligue MEVA démarre en fanfare avec des rendez-vous compétitifs dans tout le 74. Préparez vos decks !",
    date: "2 nov. 2026",
    imageUrl: "https://images.unsplash.com/photo-1578374173705-969cbe6f2d6b?auto=format&fit=crop&w=800&q=80"
  }
];

// Boutiques pré-enregistrées avec leur vrai code couleur hexadécimal
export const DEFAULT_STORES = [
  {
    id: "st-1",
    name: "Mondes Fantastiques",
    city: "Annecy",
    hours: "Mar-Sam: 10h-19h",
    color: "#10B981", // Vert émeraude
    order: 1,
    imageUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80",
    websiteUrl: ""
  },
  {
    id: "st-2",
    name: "Les Trésors d'Idunn",
    city: "Annemasse",
    hours: "Mar-Sam: 10h-19h",
    color: "#F59E0B", // Ambre / Or
    order: 2,
    imageUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80",
    websiteUrl: ""
  },
  {
    id: "st-3",
    name: "SoukoGames",
    city: "Thonon-les-Bains",
    hours: "Mar-Sam: 10h-19h",
    color: "#8B5CF6", // Violet MEVA
    order: 3,
    imageUrl: "https://images.unsplash.com/photo-1578374173705-969cbe6f2d6b?auto=format&fit=crop&w=800&q=80",
    websiteUrl: ""
  }
];

/* ============================================================================
   2. CHARTE GRAPHIQUE DYNAMIQUE DES LIGUES
   ============================================================================ */

export function getStoreStyle(locationName = "") {
  let stores = [];
  try {
    const local = localStorage.getItem("meva_stores");
    if (local) stores = JSON.parse(local);
  } catch (e) {
    stores = DEFAULT_STORES;
  }

  const loc = (locationName || "").toLowerCase().trim();
  const store = stores.find(s => (s.name || "").toLowerCase().trim() === loc);

  // Si la boutique existe et possède une couleur enregistrée
  if (store && store.color) {
    const hex = store.color;

    // Convertit en rgba pour les fonds semi-transparents
    const r = parseInt(hex.slice(1, 3), 16) || 139;
    const g = parseInt(hex.slice(3, 5), 16) || 92;
    const b = parseInt(hex.slice(5, 7), 16) || 246;

    return {
      name: store.name,
      color: hex,
      badge: `border border-current style="color: ${hex}; background-color: rgba(${r}, ${g}, ${b}, 0.15); border-color: rgba(${r}, ${g}, ${b}, 0.35);"`,
      dot: `style="background-color: ${hex};"`,
      border: `style="border-color: rgba(${r}, ${g}, ${b}, 0.4);"`,
      calendarBg: `style="color: ${hex}; background-color: rgba(${r}, ${g}, ${b}, 0.2); border: 1px solid rgba(${r}, ${g}, ${b}, 0.45);"`
    };
  }

  // Si c'est un nom d'une des 3 boutiques avec une légère variation de saisie
  if (loc.includes("mondes") || loc.includes("fantastiques")) {
    return {
      name: "Mondes Fantastiques",
      color: "#10B981",
      badge: `border border-current style="color: #10B981; background-color: rgba(16, 185, 129, 0.15); border-color: rgba(16, 185, 129, 0.35);"`,
      dot: `style="background-color: #10B981;"`,
      border: `style="border-color: rgba(16, 185, 129, 0.4);"`,
      calendarBg: `style="color: #10B981; background-color: rgba(16, 185, 129, 0.2); border: 1px solid rgba(16, 185, 129, 0.45);"`
    };
  }
  if (loc.includes("idunn") || loc.includes("trésors") || loc.includes("tresors")) {
    return {
      name: "Les Trésors d'Idunn",
      color: "#F59E0B",
      badge: `border border-current style="color: #F59E0B; background-color: rgba(245, 158, 11, 0.15); border-color: rgba(245, 158, 11, 0.35);"`,
      dot: `style="background-color: #F59E0B;"`,
      border: `style="border-color: rgba(245, 158, 11, 0.4);"`,
      calendarBg: `style="color: #F59E0B; background-color: rgba(245, 158, 11, 0.2); border: 1px solid rgba(245, 158, 11, 0.45);"`
    };
  }
  if (loc.includes("souko")) {
    return {
      name: "SoukoGames",
      color: "#8B5CF6",
      badge: `border border-current style="color: #8B5CF6; background-color: rgba(139, 92, 246, 0.15); border-color: rgba(139, 92, 246, 0.35);"`,
      dot: `style="background-color: #8B5CF6;"`,
      border: `style="border-color: rgba(139, 92, 246, 0.4);"`,
      calendarBg: `style="color: #8B5CF6; background-color: rgba(139, 92, 246, 0.2); border: 1px solid rgba(139, 92, 246, 0.45);"`
    };
  }

  // Par défaut (MEVA, Visio, Discord ou Autre)
  return { 
    name: locationName || "Événement MEVA",
    color: "#EC4899",
    badge: `border border-current style="color: #EC4899; background-color: rgba(236, 72, 153, 0.15); border-color: rgba(236, 72, 153, 0.35);"`,
    dot: `style="background-color: #EC4899;"`,
    border: `style="border-color: rgba(236, 72, 153, 0.4);"`,
    calendarBg: `style="color: #EC4899; background-color: rgba(236, 72, 153, 0.2); border: 1px solid rgba(236, 72, 153, 0.45);"`
  };
}

/* ============================================================================
   3. CONFIGURATION GLOBALE DU SITE
   ============================================================================ */

export const DEFAULT_HOME_CONFIG = {
  tagline: "MEVA Initiative",
  title: "La communauté <span class='text-meva-accent'>Star Wars: Unlimited</span>",
  subtitle: "Tournois • Ligues • Boutiques partenaires • Actualités locales en Haute-Savoie.",
  heroImageUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80"
};

export const DEFAULT_ASSO_CONFIG = {
  title: "L'association MEVA Initiative",
  subtitle: "Promouvoir, rassembler et animer la communauté Star Wars: Unlimited en Haute-Savoie et ses environs.",
  description: "MEVA Initiative est une association loi 1901 née de la passion commune de joueurs locaux. Notre objectif est de structurer le jeu organisé, d'accompagner les boutiques partenaires et d'offrir des événements réguliers et conviviaux pour tous les niveaux de jeu.",
  helloAssoUrl: "https://www.helloasso.com/associations/meva-initiative",
  imageUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80",
  missions: [
    "Organisation de ligues et tournois compétitifs ou amicaux",
    "Soutien actif aux boutiques de jeux partenaires",
    "Accueil et initiation des nouveaux joueurs",
    "Prêt de decks et matériel pour débuter en tournoi"
  ]
};

/* ============================================================================
   4. FONCTIONS CRUD FIRESTORE : ÉVÉNEMENTS (EVENTS)
   ============================================================================ */

// Lecture d'une collection depuis le serveur. Quand Firestore est injoignable (onglet rouvert sur mobile,
// réseau qui se réveille), getDocs ne rejette pas : il répond aussitôt depuis le cache mémoire, vide.
// On le traite comme une erreur pour que l'appelant retombe sur la copie localStorage au lieu de croire
// la collection vide.
async function getServerDocs(ref) {
  const snap = await getDocs(ref);
  if (snap.metadata.fromCache) {
    const err = new Error("Firestore injoignable (résultat issu du cache)");
    err.code = "unavailable";
    throw err;
  }
  return snap;
}

// Rafraîchissement au retour du réseau. Après un repli sur la copie localStorage, les pages enregistrées
// via refreshOnReconnect sont relancées dès que Firestore répond de nouveau : un écouteur onSnapshot suit
// la reconnexion que le SDK gère lui-même (nouvelles tentatives, événement `online`). Seules les erreurs
// "unavailable" déclenchent cette surveillance, pour ne pas boucler sur une erreur durable (droits refusés).
const refreshCallbacks = new Set();
let stopReconnectWatch = null;

export function refreshOnReconnect(callback) {
  refreshCallbacks.add(callback);
}

function runRefreshCallbacks() {
  refreshCallbacks.forEach(callback => {
    Promise.resolve()
      .then(callback)
      .catch(err => console.error("Rafraîchissement de la page impossible :", err));
  });
}

function stopWatchingReconnect() {
  if (stopReconnectWatch) stopReconnectWatch();
  stopReconnectWatch = null;
}

function watchForReconnect(ref, err) {
  if (err?.code !== "unavailable" || stopReconnectWatch) return;
  stopReconnectWatch = onSnapshot(
    ref,
    { includeMetadataChanges: true },
    snap => {
      if (snap.metadata.fromCache) return;
      stopWatchingReconnect();
      runRefreshCallbacks();
    },
    watchErr => {
      console.warn("Surveillance de la reconnexion Firestore interrompue :", watchErr);
      stopReconnectWatch = null;
    }
  );
}

// Page restaurée depuis le cache de navigation (onglet rouvert, retour arrière) : son contenu date du moment
// où elle a été quittée, on recharge les données.
window.addEventListener("pageshow", event => {
  if (event.persisted) runRefreshCallbacks();
});

// Initialise une collection vide avec les données par défaut, sans bloquer l'affichage : les écritures
// sont réservées aux admins et, hors ligne, elles restent en file d'attente jusqu'au retour du réseau.
function seedDefaults(collectionName, items) {
  Promise.all(items.map(item => setDoc(doc(db, collectionName, item.id), item)))
    .catch(err => console.warn(`Initialisation de "${collectionName}" impossible :`, err));
}

export async function getEvents() {
  try {
    const snap = await getServerDocs(collection(db, "events"));
    if (!snap.empty) {
      const list = snap.docs.map(d => ({
        ...d.data(),
        id: d.id
      }));
      list.sort((a, b) => (a.order || 9999) - (b.order || 9999));
      localStorage.setItem("meva_events", JSON.stringify(list));
      return list;
    }
    return [];
  } catch (err) {
    console.warn("Firestore offline ou erreur, fallback sur le cache local:", err);
    watchForReconnect(collection(db, "events"), err);
    const local = localStorage.getItem("meva_events");
    return local ? JSON.parse(local) : [];
  }
}

export async function saveEvent(event) {
  const docId = event.id || "evt-" + Date.now();
  const newEvt = { ...event, id: docId, order: event.order || Date.now() };
  try {
    await setDoc(doc(db, "events", docId), newEvt);
  } catch (err) {
    console.error("Erreur lors de la sauvegarde de l'événement (Firestore):", err);
  }
  const list = JSON.parse(localStorage.getItem("meva_events") || "[]");
  list.unshift(newEvt);
  localStorage.setItem("meva_events", JSON.stringify(list));
  return newEvt;
}

export async function deleteEvent(id) {
  try {
    await deleteDoc(doc(db, "events", id));
  } catch (err) {
    console.error("Erreur lors de la suppression de l'événement (Firestore):", err);
  }
  const list = JSON.parse(localStorage.getItem("meva_events") || "[]").filter(e => e.id !== id);
  localStorage.setItem("meva_events", JSON.stringify(list));
}

export async function updateEvent(id, updatedData) {
  try {
    await updateDoc(doc(db, "events", id), updatedData);
  } catch (err) {
    console.error("Erreur lors de la mise à jour de l'événement (Firestore):", err);
  }
  updateLocalEvent(id, updatedData);
}

// Met à jour un événement dans la copie locale seulement (repli hors ligne de getEvents), après une écriture
// Firestore faite ailleurs. Ne jamais effacer cette copie : getEvents la remplace à chaque lecture réussie.
export function updateLocalEvent(id, updatedData) {
  const list = JSON.parse(localStorage.getItem("meva_events") || "[]");
  const idx = list.findIndex(e => e.id === id);
  if (idx !== -1) {
    list[idx] = { ...list[idx], ...updatedData };
    localStorage.setItem("meva_events", JSON.stringify(list));
  }
}

export async function participate(id, user = null) {
  const ref = doc(db, "events", id);
  try {
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const data = snap.data();
      const count = data.count || 0;
      const cap = data.capacity || 16;
      
      if (count >= cap) return false;

      const participants = data.participants || [];
      if (user) {
        const already = participants.some(p => p.uid === user.uid);
        if (already) return false;
        participants.push({
          uid: user.uid,
          email: user.email || "",
          displayName: user.displayName || user.email.split("@")[0]
        });
      }

      await updateDoc(ref, {
        count: count + 1,
        participants: participants
      });
      return true;
    }
  } catch (err) {
    console.error("Erreur d'inscription (Firestore):", err);
  }

  const list = JSON.parse(localStorage.getItem("meva_events") || "[]");
  const event = list.find(e => e.id === id);
  if (!event) return false;
  const count = event.count || 0;
  if (count >= (event.capacity || 16)) return false;
  event.count = count + 1;
  localStorage.setItem("meva_events", JSON.stringify(list));
  return true;
}

export async function moveEventOrder(id, direction) {
  const list = await getEvents();
  const index = list.findIndex(e => e.id === id);
  if (index === -1) return;
  const targetIndex = direction === "up" ? index - 1 : index + 1;
  if (targetIndex < 0 || targetIndex >= list.length) return;

  const currentOrder = list[index].order || index;
  const targetOrder = list[targetIndex].order || targetIndex;

  list[index].order = targetOrder;
  list[targetIndex].order = currentOrder;

  try {
    await updateDoc(doc(db, "events", list[index].id), { order: targetOrder });
    await updateDoc(doc(db, "events", list[targetIndex].id), { order: currentOrder });
  } catch (err) {
    console.error("Erreur de réorganisation (Firestore):", err);
  }
  localStorage.setItem("meva_events", JSON.stringify(list));
}

/* ============================================================================
   5. FONCTIONS CRUD FIRESTORE : ACTUALITÉS (NEWS)
   ============================================================================ */

export async function getNews() {
  try {
    const snap = await getServerDocs(collection(db, "news"));
    if (!snap.empty) {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      localStorage.setItem("meva_news", JSON.stringify(list));
      return list;
    }
    seedDefaults("news", DEFAULT_NEWS);
    localStorage.setItem("meva_news", JSON.stringify(DEFAULT_NEWS));
    return DEFAULT_NEWS;
  } catch (err) {
    console.warn("Firestore offline news fallback:", err);
    watchForReconnect(collection(db, "news"), err);
    const local = localStorage.getItem("meva_news");
    return local ? JSON.parse(local) : DEFAULT_NEWS;
  }
}

export async function saveNews(newsItem) {
  const docId = newsItem.id || "nw-" + Date.now();
  const newItem = { ...newsItem, id: docId };
  try {
    await setDoc(doc(db, "news", docId), newItem);
  } catch (err) {
    console.error("Erreur saveNews Firestore:", err);
  }
  const list = JSON.parse(localStorage.getItem("meva_news") || "[]");
  list.unshift(newItem);
  localStorage.setItem("meva_news", JSON.stringify(list));
}

export async function deleteNews(id) {
  try {
    await deleteDoc(doc(db, "news", id));
  } catch (err) {
    console.error("Erreur deleteNews Firestore:", err);
  }
  const list = JSON.parse(localStorage.getItem("meva_news") || "[]").filter(n => n.id !== id);
  localStorage.setItem("meva_news", JSON.stringify(list));
}

export async function updateNews(id, updatedData) {
  try {
    await updateDoc(doc(db, "news", id), updatedData);
  } catch (err) {
    console.error("Erreur updateNews Firestore:", err);
  }
  const list = JSON.parse(localStorage.getItem("meva_news") || "[]");
  const idx = list.findIndex(n => n.id === id);
  if (idx !== -1) {
    list[idx] = { ...list[idx], ...updatedData };
    localStorage.setItem("meva_news", JSON.stringify(list));
  }
}

/* ============================================================================
   6. FONCTIONS CRUD FIRESTORE : BOUTIQUES PARTENAIRES (STORES)
   ============================================================================ */

export async function getStores() {
  const q = query(collection(db, "stores"), orderBy("order", "asc"));
  try {
    const snap = await getServerDocs(q);
    if (!snap.empty) {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      localStorage.setItem("meva_stores", JSON.stringify(list));
      return list;
    }
    seedDefaults("stores", DEFAULT_STORES);
    localStorage.setItem("meva_stores", JSON.stringify(DEFAULT_STORES));
    return DEFAULT_STORES;
  } catch (err) {
    console.warn("Firestore offline stores fallback:", err);
    watchForReconnect(q, err);
    const local = localStorage.getItem("meva_stores");
    return local ? JSON.parse(local) : DEFAULT_STORES;
  }
}

export async function saveStore(store) {
  const docId = store.id || "st-" + Date.now();
  const newStore = { ...store, id: docId, order: store.order || Date.now() };
  try {
    await setDoc(doc(db, "stores", docId), newStore);
  } catch (err) {
    console.error("Erreur saveStore Firestore:", err);
  }
  const list = JSON.parse(localStorage.getItem("meva_stores") || "[]");
  list.push(newStore);
  localStorage.setItem("meva_stores", JSON.stringify(list));
}

export async function deleteStore(id) {
  try {
    await deleteDoc(doc(db, "stores", id));
  } catch (err) {
    console.error("Erreur deleteStore Firestore:", err);
  }
  const list = JSON.parse(localStorage.getItem("meva_stores") || "[]").filter(s => s.id !== id);
  localStorage.setItem("meva_stores", JSON.stringify(list));
}

export async function updateStore(id, updatedData) {
  try {
    await updateDoc(doc(db, "stores", id), updatedData);
  } catch (err) {
    console.error("Erreur updateStore Firestore:", err);
  }
  const list = JSON.parse(localStorage.getItem("meva_stores") || "[]");
  const idx = list.findIndex(s => s.id === id);
  if (idx !== -1) {
    list[idx] = { ...list[idx], ...updatedData };
    localStorage.setItem("meva_stores", JSON.stringify(list));
  }
}

export async function moveStoreOrder(id, direction) {
  const list = await getStores();
  const index = list.findIndex(s => s.id === id);
  if (index === -1) return;
  const targetIndex = direction === "up" ? index - 1 : index + 1;
  if (targetIndex < 0 || targetIndex >= list.length) return;

  const currentOrder = list[index].order || index;
  const targetOrder = list[targetIndex].order || targetIndex;

  list[index].order = targetOrder;
  list[targetIndex].order = currentOrder;

  try {
    await updateDoc(doc(db, "stores", list[index].id), { order: targetOrder });
    await updateDoc(doc(db, "stores", list[targetIndex].id), { order: currentOrder });
  } catch (err) {
    console.error("Erreur moveStoreOrder Firestore:", err);
  }
  localStorage.setItem("meva_stores", JSON.stringify(list));
}

/* ============================================================================
   7. FONCTIONS CRUD FIRESTORE : CONFIGURATION GLOBALE
   ============================================================================ */

// Chaque configuration est un document unique de sa propre collection, comme le prévoient firestore.rules.
const HOME_CONFIG = { collection: "config_home", id: "home", cacheKey: "meva_home_config", defaults: DEFAULT_HOME_CONFIG };
const ASSO_CONFIG = { collection: "config_asso", id: "asso", cacheKey: "meva_asso_config", defaults: DEFAULT_ASSO_CONFIG };

async function getConfig({ collection: collectionName, id, cacheKey, defaults }) {
  const ref = doc(db, collectionName, id);
  try {
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const data = snap.data();
      localStorage.setItem(cacheKey, JSON.stringify(data));
      return data;
    }
    // Document absent : on l'initialise sans bloquer l'affichage (écriture réservée aux admins).
    setDoc(ref, defaults)
      .catch(err => console.warn(`Initialisation de "${collectionName}/${id}" impossible :`, err));
    localStorage.setItem(cacheKey, JSON.stringify(defaults));
    return defaults;
  } catch (err) {
    console.warn(`Firestore offline ${collectionName} fallback:`, err);
    watchForReconnect(ref, err);
    const local = localStorage.getItem(cacheKey);
    return local ? JSON.parse(local) : defaults;
  }
}

// L'enregistrement rejette si Firestore le refuse : la copie localStorage n'est mise à jour qu'après
// un succès, pour que l'admin ne croie pas enregistrée une modification qui ne l'est pas.
async function saveConfig(target, config) {
  const current = await getConfig(target);
  const updated = { ...current, ...config };
  await setDoc(doc(db, target.collection, target.id), updated, { merge: true });
  localStorage.setItem(target.cacheKey, JSON.stringify(updated));
  return updated;
}

export function getHomeConfig() {
  return getConfig(HOME_CONFIG);
}

export function saveHomeConfig(config) {
  return saveConfig(HOME_CONFIG, config);
}

export function getAssoConfig() {
  return getConfig(ASSO_CONFIG);
}

export function saveAssoConfig(config) {
  return saveConfig(ASSO_CONFIG, config);
}
