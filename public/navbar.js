// 1. On vérifie immédiatement le cache local
const cachedAuth = localStorage.getItem("meva_auth_state") === "connected";
const cachedAdmin = localStorage.getItem("meva_is_admin") === "true";
const cachedMember = localStorage.getItem("meva_is_member") === "true";

// 2. HTML injecté avec l'état retenu par défaut (zéro flash)
const headerHTML = `
  <!-- Wrapper global de la navbar avec hauteur réelle et marge basse de respiration -->
  <header class="sticky top-0 z-50 w-full h-[104px] mb-8 md:mb-12 drop-shadow-[0_8px_16px_rgba(0,0,0,0.8)]">
    
    <!-- Ligne droite violette et fond qui font toute la largeur de l'écran -->
    <div class="absolute top-0 left-0 w-full h-[64px] bg-meva-bg/95 backdrop-blur-md border-b-2 border-meva-accent z-0"></div>

    <!-- Conteneur central aligné sur le reste de ton site -->
    <div class="max-w-7xl mx-auto h-[64px] relative z-40 flex items-center justify-between px-4 sm:px-6 lg:px-8">
      
      <!-- BLOC COCKPIT : Le décroché biseauté -->
      <div class="absolute top-0 left-4 sm:left-6 lg:left-8 h-[104px] w-[180px] sm:w-[260px] z-10">
        
        <!-- Fond qui masque la ligne droite arrière pour "creuser" le cockpit -->
        <div class="absolute inset-0 bg-meva-bg/95 backdrop-blur-md"
             style="clip-path: polygon(0 0, 100% 0, 100% 64px, calc(100% - 40px) 104px, 0 104px);"></div>
        
        <!-- Trait 100% Violet qui fait la forme du biseau (Mobile) -->
        <svg class="absolute top-0 left-0 w-[180px] h-[104px] pointer-events-none sm:hidden" viewBox="0 0 180 104" fill="none">
          <path d="M 0 63 L 0 103 L 140 103 L 180 63" stroke="#8B5CF6" stroke-width="2" />
        </svg>
        
        <!-- Trait 100% Violet qui fait la forme du biseau (Desktop) -->
        <svg class="absolute top-0 left-0 w-[260px] h-[104px] pointer-events-none hidden sm:block" viewBox="0 0 260 104" fill="none">
          <path d="M 0 63 L 0 103 L 220 103 L 260 63" stroke="#8B5CF6" stroke-width="2" />
        </svg>

        <!-- Le Logo parfaitement centré dans la cuvette du cockpit -->
        <a href="/index.html" class="absolute top-0 left-0 h-[104px] w-[140px] sm:w-[220px] flex items-center justify-center group pl-2">
          <img src="/assets/images/meva_initiative_logo_logo.png" 
               alt="MEVA Initiative" 
               class="h-20 sm:h-24 w-auto object-contain transition-transform group-hover:scale-105 drop-shadow-[0_6px_16px_rgba(0,0,0,0.9)] mt-1">
        </a>
      </div>

      <!-- Espaceur invisible pour pousser le reste du menu à droite du cockpit -->
      <div class="w-[180px] sm:w-[260px] h-full shrink-0"></div>

      <!-- Menu Bureau -->
      <nav class="hidden md:flex items-center gap-6 text-sm font-medium text-meva-textMuted">
        <a href="/index.html" class="hover:text-meva-textMain transition-colors">Accueil</a>
        <a href="/calendrier.html" class="hover:text-meva-textMain transition-colors">Tournois</a>
        <a href="/hall-of-fame.html" class="hover:text-meva-textMain transition-colors font-bold text-meva-accent">Hall of Fame 🏆</a>
        <a href="/boutiques.html" class="hover:text-meva-textMain transition-colors">Boutiques</a>
        <a href="/association.html" class="hover:text-meva-textMain transition-colors">Association</a>
        <a href="/actualites.html" class="hover:text-meva-textMain transition-colors">Actualités</a>
        <a href="/admin/dashboard.html" id="nav-admin-btn" class="${cachedAdmin ? '' : 'hidden'} text-meva-accent font-semibold px-2 py-0.5 rounded-sm bg-purple-900/30 border border-meva-accent/30 hover:bg-meva-accent hover:text-meva-bg transition-colors">Espace Orga ↗</a>
      </nav>

      <div class="flex items-center gap-3">
        <a href="${cachedAuth ? '/profil.html' : '/connexion.html'}" id="nav-auth-btn" class="hidden sm:flex items-center gap-2 text-xs font-medium text-meva-textMain hover:text-meva-accent transition-colors bg-meva-surface border border-meva-border px-3 py-1.5 rounded-lg">
          <span>${cachedAuth ? 'Profil' : 'Connexion'}</span>
          <span id="nav-member-badge" class="${cachedMember ? '' : 'hidden'} px-1.5 py-0.5 rounded-sm text-[10px] font-semibold bg-green-950/40 text-green-400 border border-green-800/40">Membre MEVA</span>
        </a>

        <button id="btn-mobile-menu" aria-label="Menu" class="md:hidden w-10 h-10 bg-meva-surface border border-meva-border rounded-lg flex items-center justify-center text-white hover:text-meva-accent focus:outline-hidden">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
          </svg>
        </button>
      </div>
    </div>

    <!-- Menu Déroulant Mobile -->
    <div id="mobile-menu" class="hidden md:hidden border-b border-meva-border bg-meva-bg px-6 pt-14 pb-6 absolute top-[64px] left-0 w-full z-20 shadow-2xl text-center space-y-4">
      
      <!-- Liens centrés -->
      <div class="flex flex-col items-center space-y-3 text-base font-bold">
        <a href="/index.html" class="block text-meva-textMuted hover:text-white transition-colors">Accueil</a>
        <a href="/calendrier.html" class="block text-meva-textMuted hover:text-white transition-colors">Tournois</a>
        <a href="/hall-of-fame.html" class="block text-meva-accent font-bold hover:text-white transition-colors">Hall of Fame 🏆</a>
        <a href="/boutiques.html" class="block text-meva-textMuted hover:text-white transition-colors">Boutiques</a>
        <a href="/association.html" class="block text-meva-textMuted hover:text-white transition-colors">Association</a>
        <a href="/actualites.html" class="block text-meva-textMuted hover:text-white transition-colors">Actualités</a>
        <a href="/admin/dashboard.html" id="mobile-admin-btn" class="${cachedAdmin ? '' : 'hidden'} block text-meva-accent">Espace Orga ↗</a>
      </div>
      
      <!-- Bouton Connexion / Profil : Violet, centré, avec le badge Adhérent si connecté -->
      <div class="pt-4 border-t border-meva-border/50 flex flex-col items-center gap-2">
        <span id="mobile-member-badge" class="${cachedMember ? '' : 'hidden'} px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-green-950/80 text-green-400 border border-green-500/30 uppercase tracking-wider">
          Adhérent
        </span>
        <a href="${cachedAuth ? '/profil.html' : '/connexion.html'}" id="mobile-auth-btn" class="flex items-center justify-center w-full py-3 rounded-xl bg-meva-accent text-meva-bg font-black text-base hover:bg-meva-accentHover transition-colors shadow-lg">
          <span>${cachedAuth ? 'Mon Profil' : 'Connexion'}</span>
        </a>
      </div>
    </div>
  </header>
`;

// --- Arrière-plan lumineux (Halos Cockpit) ---
const ambientGlowHTML = `
  <div class="fixed inset-0 pointer-events-none overflow-hidden -z-10" aria-hidden="true">
    <div class="absolute -top-32 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-purple-700/15 blur-[120px] rounded-full"></div>
    <div class="absolute top-[40%] -right-32 w-[500px] h-[500px] bg-blue-700/10 blur-[150px] rounded-full"></div>
  </div>
`;
document.body.insertAdjacentHTML("afterbegin", ambientGlowHTML);
document.body.insertAdjacentHTML("afterbegin", headerHTML);

// Gestion menu burger mobile
const btnMenu = document.getElementById("btn-mobile-menu");
const mobileMenu = document.getElementById("mobile-menu");
if (btnMenu && mobileMenu) {
  btnMenu.onclick = () => mobileMenu.classList.toggle("hidden");
}

// --- WIDGET EN LIGNE (DISCRET, MOBILE & DESKTOP) ---
function injectPresenceWidget() {
  if (document.getElementById("meva-presence-widget")) return;

  const widgetHTML = `
    <div id="meva-presence-widget" class="fixed bottom-6 right-6 z-50 select-none">
      <!-- Bulle des pseudos connectés -->
      <div id="meva-presence-popover" class="hidden mb-2 w-52 bg-[#12141D]/95 backdrop-blur-md border border-meva-border rounded-xl shadow-2xl p-3 text-xs space-y-2">
        <div class="flex items-center justify-between border-b border-meva-border/60 pb-1.5 text-meva-textMuted font-bold text-[10px] uppercase tracking-wider">
          <span>En ligne</span>
          <span id="presence-count-detail" class="text-meva-accent">0</span>
        </div>
        <ul id="presence-user-list" class="max-h-36 overflow-y-auto space-y-1 divide-y divide-meva-border/30">
          <li class="text-[11px] text-meva-textMuted py-1 italic">Personne d'autre</li>
        </ul>
      </div>

      <!-- Bouton pillule discret -->
        <button id="meva-presence-pill" class="flex items-center gap-2.5 bg-[#181B26] hover:bg-[#202534] border border-meva-accent/50 px-4 py-2 rounded-full shadow-[0_4px_20px_rgba(0,0,0,0.8)] transition-all text-xs text-white font-bold">        <span class="relative flex h-2 w-2">
          <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
          <span class="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
        </span>
        <span class="font-semibold text-[11px]" id="presence-badge-text">0 en ligne</span>
      </button>
    </div>
  `;

  document.body.insertAdjacentHTML("beforeend", widgetHTML);

  const pill = document.getElementById("meva-presence-pill");
  const popover = document.getElementById("meva-presence-popover");

  pill?.addEventListener("click", (e) => {
    e.stopPropagation();
    popover?.classList.toggle("hidden");
  });

  document.addEventListener("click", (e) => {
    if (!document.getElementById("meva-presence-widget")?.contains(e.target)) {
      popover?.classList.add("hidden");
    }
  });
}

// 3. Synchronisation Firebase (Auth + Présence Realtime Database)
async function initAuthAndPresence() {
  injectPresenceWidget();

  try {
    const { db, auth, rtdb } = await import("/firebase-config.js");
    const { onAuthStateChanged } = await import("/vendor/firebase/firebase-auth.js");
    const { doc, getDoc } = await import("/vendor/firebase/firebase-firestore.js");
    const { ref, onValue, set, onDisconnect, serverTimestamp } = await import("/vendor/firebase/firebase-database.js");

    const authBtn = document.getElementById("nav-auth-btn");
    const adminBtn = document.getElementById("nav-admin-btn");
    const mobileAuthBtn = document.getElementById("mobile-auth-btn");
    const mobileAdminBtn = document.getElementById("mobile-admin-btn");
    const memberBadge = document.getElementById("nav-member-badge");
    const mobileMemberBadge = document.getElementById("mobile-member-badge");

    // Écoute de l'ensemble des connectés (pour mettre à jour la pastille)
    if (rtdb) {
      const statusRef = ref(rtdb, "/status");
      onValue(statusRef, (snapshot) => {
        const data = snapshot.val() || {};
        const onlineUsers = [];

        Object.keys(data).forEach((uid) => {
          if (data[uid] && data[uid].online === true) {
            onlineUsers.push(data[uid].pseudo || "Joueur");
          }
        });

        const badgeText = document.getElementById("presence-badge-text");
        const countDetail = document.getElementById("presence-count-detail");
        const userList = document.getElementById("presence-user-list");

        const count = onlineUsers.length;
        if (badgeText) badgeText.textContent = `${count} en ligne`;
        if (countDetail) countDetail.textContent = `${count} actif${count > 1 ? "s" : ""}`;

        if (userList) {
          if (count === 0) {
            userList.innerHTML = `<li class="text-[11px] text-meva-textMuted py-1 italic">Aucun joueur connecté</li>`;
          } else {
            userList.innerHTML = onlineUsers.map((pseudo) => `
              <li class="text-[11px] text-white py-1 flex items-center gap-2">
                <span class="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                <span class="truncate">${pseudo}</span>
              </li>
            `).join("");
          }
        }
      });
    }

    onAuthStateChanged(auth, async (user) => {
      if (user) {
        localStorage.setItem("meva_auth_state", "connected");

        if (authBtn) { authBtn.querySelector('span').textContent = "Profil"; authBtn.href = "/profil.html"; }
        if (mobileAuthBtn) { mobileAuthBtn.querySelector('span').textContent = "Profil"; mobileAuthBtn.href = "/profil.html"; }

        let userPseudo = user.displayName || "Joueur";

        const snap = await getDoc(doc(db, "users", user.uid));
        if (snap.exists()) {
          const data = snap.data();
          const isMember = data.roles?.member === true;
          const isAdmin = data.roles?.admin === true;

          userPseudo = data.pseudo || data.displayName || userPseudo;

          localStorage.setItem("meva_is_member", isMember ? "true" : "false");
          localStorage.setItem("meva_is_admin", isAdmin ? "true" : "false");

          if (memberBadge) memberBadge.classList.toggle("hidden", !isMember);
          if (mobileMemberBadge) mobileMemberBadge.classList.toggle("hidden", !isMember);
          if (adminBtn) adminBtn.classList.toggle("hidden", !isAdmin);
          if (mobileAdminBtn) mobileAdminBtn.classList.toggle("hidden", !isAdmin);
        }

        // Brancher le statut de présence dans la Realtime Database
        if (rtdb) {
          const myStatusRef = ref(rtdb, `/status/${user.uid}`);
          const connectedRef = ref(rtdb, ".info/connected");

          onValue(connectedRef, (snapConnected) => {
            if (snapConnected.val() === true) {
              onDisconnect(myStatusRef).set({
                online: false,
                lastSeen: serverTimestamp()
              }).then(() => {
                set(myStatusRef, {
                  online: true,
                  pseudo: userPseudo,
                  lastSeen: serverTimestamp()
                });
              });
            }
          });
        }
      } else {
        localStorage.removeItem("meva_auth_state");
        localStorage.removeItem("meva_is_member");
        localStorage.removeItem("meva_is_admin");

        if (authBtn) { authBtn.querySelector('span').textContent = "Connexion"; authBtn.href = "/connexion.html"; }
        if (mobileAuthBtn) { mobileAuthBtn.querySelector('span').textContent = "Connexion"; mobileAuthBtn.href = "/connexion.html"; }
        if (memberBadge) memberBadge.classList.add("hidden");
        if (mobileMemberBadge) mobileMemberBadge.classList.add("hidden");
        if (adminBtn) adminBtn.classList.add("hidden");
        if (mobileAdminBtn) mobileAdminBtn.classList.add("hidden");
      }
    });
  } catch (err) {
    console.warn("Erreur chargement auth & présence :", err);
  }
}

initAuthAndPresence();