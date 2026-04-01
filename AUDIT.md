# Audit code fortunashop — 1er avril 2026

---

## 🔴 Critiques (a corriger avant le premier client)

### app/boutique/[slug]/commander/page.tsx
- **Ligne 105-106** : Apres la mise a jour du stock pour les variantes, le code fait `supabase.from('products').select('*').eq('id', item.id)` ou `item.id` est le cartId (ex: `"uuid-Rouge"`). Pour les variantes, `item.id` n'est PAS un UUID produit valide — la requete echoue silencieusement.
- **Impact** : L'alerte WhatsApp de stock bas ne se declenche JAMAIS pour les produits avec variantes. L'artisan ne sait pas que son stock est epuise.
- **Fix recommande** : Remplacer `item.id` par `realId` (deja calcule ligne 86) dans la requete `supabase.from('products').select('*').eq('id', realId)`.

- **Ligne 290** : Faute de frappe dans le bouton — `'Envoin cours...'` au lieu de `'Envoi en cours...'`.
- **Impact** : Bug visible par le client lors de la validation de commande.
- **Fix recommande** : Corriger en `'Envoi en cours...'`.

### app/admin/page.tsx
- **Ligne 75** : Le token de livraison est genere avec `Math.random()` — cryptographiquement faible et previsible.
- **Impact** : Un utilisateur malveillant pourrait deviner un token de livraison et confirmer une livraison non effectuee.
- **Fix recommande** : Utiliser `crypto.randomUUID()` qui est disponible dans les navigateurs modernes et Node.js.

### lib/cinetpay.ts
- **Lignes 6-7** : Les cles CinetPay utilisent le prefixe `NEXT_PUBLIC_` — elles sont donc exposees cote client dans le bundle JavaScript.
- **Impact** : N'importe qui peut recuperer les cles CinetPay depuis le code source du navigateur et potentiellement les utiliser.
- **Fix recommande** : Renommer en `CINETPAY_APIKEY` et `CINETPAY_SITE_ID` (sans NEXT_PUBLIC_) et deplacer la logique dans une route API.

- **Lignes 8-9** : `notify_url` et `return_url` sont des chaines vides. CinetPay ne peut pas notifier la boutique apres un paiement.
- **Impact** : Si CinetPay est active, le statut de paiement ne sera jamais mis a jour automatiquement.
- **Fix recommande** : Configurer `notify_url` vers une route API (`/api/webhooks/cinetpay`) et `return_url` vers la page de confirmation.

### app/layout.js (fichier doublon)
- **Fichier entier** : Ce fichier est un doublon compile de `app/layout.tsx`. Les deux coexistent, ce qui peut provoquer des conflits dans le build Next.js.
- **Impact** : Next.js peut charger le mauvais layout (celui sans favicon, sans OG tags). Le comportement est imprevisible.
- **Fix recommande** : Supprimer `app/layout.js` et ne garder que `app/layout.tsx`.

### next.config.js + next.config.ts (fichier doublon)
- **Fichiers** : Deux fichiers de configuration Next.js coexistent (`.js` et `.ts`).
- **Impact** : Conflit potentiel de configuration. Next.js choisira un seul fichier mais le comportement peut varier entre versions.
- **Fix recommande** : Supprimer `next.config.js` et ne garder que `next.config.ts`.

### app/api/leads/route.ts
- **Lignes 63-76** : L'email HTML Brevo injecte directement les donnees utilisateur (`body.nom`, `body.whatsapp`, etc.) sans echappement HTML.
- **Impact** : Injection HTML dans l'email. Un lead malveillant pourrait injecter du contenu HTML/JavaScript dans les emails recus par Frederick.
- **Fix recommande** : Echapper les valeurs avec une fonction `escapeHtml()` avant insertion dans le template HTML.

### app/admin/dashboard/page.tsx
- **Ligne 154** : Le dashboard est conditionne par `hasAddon('dashboard')`, mais selon CLAUDE.md, les KPIs de base (CA, commandes, top produit) sont disponibles pour TOUS les plans.
- **Impact** : Un artisan sur plan Starter sans l'addon 'dashboard' voit un ecran de vente pour le "Pack Pilotage" au lieu de son dashboard — meme si les donnees existent.
- **Fix recommande** : Retirer la condition `hasAddon('dashboard')` pour les KPIs de base. Gater uniquement les fonctionnalites avancees (analytics Pro, prevision Premium) derriere les checks de plan.

---

## 🟡 Importants (a corriger cette semaine)

### lib/utils.ts
- **Lignes 9-27** : `statusStyle()` et `statusLabel()` ne gerent que 4 statuts (`nouvelle`, `confirmee`, `en_livraison`, `livree`). Les statuts `en_preparation`, `prete` et `annulee` sont utilises dans le code mais tombent dans le fallback generique.
- **Impact** : Les commandes en preparation ou pretes affichent un badge gris sans texte significatif dans le dashboard et le suivi.
- **Fix recommande** : Ajouter les statuts manquants :
  ```javascript
  en_preparation: 'bg-[#FFF0E6] text-[#E8621A]',
  prete:          'bg-[#DBEAFE] text-[#2563EB]',
  annulee:        'bg-red-50 text-red-500',
  ```

### components/onboarding.tsx
- **Ligne 222** : Le lien WhatsApp du support utilise un numero placeholder `+2250700000000`.
- **Impact** : Un artisan qui clique sur "Contacter le support" pendant l'onboarding envoie un message a un numero inexistant.
- **Fix recommande** : Remplacer par le vrai numero de support `+33664765696` (utilise partout ailleurs).

### components/tracker.tsx
- **Ligne 21** : `console.log("TRACKER FIRED", shopId, page)` laisse en production.
- **Impact** : Pollution de la console du navigateur visible par les clients. Image non professionnelle.
- **Fix recommande** : Supprimer le `console.log`.

### app/admin/dashboard/page.tsx
- **Lignes 114, 140-141, 148** : Plusieurs `console.log` de debug laisses en production (`'DASHBOARD RENDER'`, `'RETURN ANTICIPE ICI'`, `'AVANT CHECK ONBOARDING'`).
- **Impact** : Pollution de la console, fuite d'informations sur la logique interne.
- **Fix recommande** : Supprimer tous les `console.log` de debug.

### app/api/leads/route.ts
- **Ligne 60** : Redeclaration de `var addonsText` (deja declare ligne 39). Avec `var` ca fonctionne (hoisting) mais c'est source de confusion.
- **Impact** : Pas de bug fonctionnel, mais maintenabilite reduite.
- **Fix recommande** : Renommer la seconde variable ou reutiliser la premiere.

- **Lignes 63-76** : L'envoi d'email Brevo ne verifie pas `response.ok`. Si BREVO_API_KEY est vide ou invalide, l'erreur est loguee mais le lead recoit quand meme un message de succes.
- **Impact** : Frederick peut ne pas recevoir de notification email pour certains leads, sans le savoir.
- **Fix recommande** : Logger un warning visible dans Vercel si l'envoi echoue.

### app/boutique/[slug]/paiement.tsx
- **Fichier entier** : Ce composant ne filtre les modes de paiement que par l'addon `cinetpay`. Il ignore completement la logique par plan (Pro = natif Orange/MTN, Premium = natif CB). Il n'est importe nulle part dans le code actuel.
- **Impact** : Code mort qui pourrait etre utilise par erreur a la place de la logique correcte dans `commander/page.tsx`.
- **Fix recommande** : Supprimer le fichier ou le mettre a jour avec la logique plan-aware.

### app/api/send-lead-email/route.ts
- **Fichier entier** : Cette route duplique exactement la logique d'envoi email qui est deja dans `/api/leads/route.ts` (lignes 59-79). Elle n'est appelee nulle part.
- **Impact** : Code mort, confusion sur quelle route utiliser.
- **Fix recommande** : Supprimer ce fichier.

### app/page.tsx
- **Ligne 159** : Definit une fonction locale `formatPrice()` qui retourne le prix SANS le suffixe "FCFA" — differente de `lib/utils.ts:formatPrice()` qui ajoute "FCFA".
- **Impact** : Incoherence d'affichage entre la landing page et les boutiques. Le prix sur la landing a "FCFA" ajoute dans le template, mais c'est fragile.
- **Fix recommande** : Supprimer la fonction locale et importer `formatPrice` depuis `lib/utils.ts`, puis ajuster le template.

### app/admin/layout.tsx
- **Ligne 13** : Utilise `supabase.auth.getSession()` qui est deprecie dans les versions recentes de Supabase. La methode recommandee est `getUser()`.
- **Impact** : Peut cesser de fonctionner lors d'une mise a jour du SDK Supabase. `getSession()` cote client peut aussi etre manipule par l'utilisateur.
- **Fix recommande** : Remplacer par `supabase.auth.getUser()`.

---

## ⚪ Mineurs (a corriger quand on a le temps)

### Fragilite — Noms de plans hardcodes partout
- **Fichiers concernes** : `commander/page.tsx`, `produits/page.tsx`, `livreurs/page.tsx`, `dashboard/page.tsx`, `create-shop.js`
- **Impact** : Ajouter un 4eme plan (ex: "enterprise") necessite de modifier 5+ fichiers manuellement. Risque d'oubli.
- **Fix recommande** : Creer un fichier `lib/plans.ts` centralisant les limites et features par plan.

### Fragilite — Logique paiement non centralisee
- **Fichiers** : `commander/page.tsx` (logique correcte), `paiement.tsx` (logique incorrecte/morte)
- **Impact** : Si quelqu'un modifie le mauvais fichier, les modes de paiement regressent.
- **Fix recommande** : Centraliser dans un fichier `lib/payment-modes.ts`.

### Style inconsistant
- **Fichiers** : `app/admin/layout.tsx`, `app/admin/login/page.tsx`, `app/boutique/[slug]/catalogue.tsx`
- **Impact** : Ces fichiers utilisent `const`, `=>` au lieu de `var`, `function()` (convention du projet). Pas de bug, mais incoherence.
- **Fix recommande** : Migrer vers le style `var` + `function()` lors de la prochaine modification de ces fichiers.

### app/page.tsx
- **Lignes 167-182** : Import Google Fonts via `<style>@import</style>` au lieu de `next/font/google` (deja utilise dans `layout.tsx` pour Nunito et DM Sans). La landing page charge aussi Lato via l'import CSS.
- **Impact** : Double chargement de polices, performance degradee sur mobile. Non-utilisation des optimisations Next.js.
- **Fix recommande** : Ajouter Lato via `next/font/google` dans le layout et supprimer l'import CSS.

### app/sitemap.ts
- **Ligne 42** : Le filtre `eq('is_active', true)` est applique sur `shops` via le join, mais le filtre direct sur products ne verifie pas `shops.is_active`.
- **Impact** : Des produits de boutiques inactives pourraient apparaitre dans le sitemap.
- **Fix recommande** : Le join `shops!inner(slug, is_active)` filtre deja implicitement. Verifier que le RLS le gere aussi.

### components/cart.tsx
- **Ligne 12** : `JSON.parse(saved)` sans try-catch. Si le localStorage contient des donnees corrompues, le panier crash.
- **Impact** : Le catalogue ne charge plus si le localStorage est corrompu (edge case rare).
- **Fix recommande** : Wrapper dans un try-catch, vider le panier en cas d'erreur.

### app/boutique/[slug]/commander/page.tsx
- **Ligne 57** : `payment_status` est toujours `'en_attente'` quel que soit le mode. Le commentaire ternaire `paymentMode === 'especes' ? 'en_attente' : 'en_attente'` est mort.
- **Impact** : Aucun impact fonctionnel, mais code confus.
- **Fix recommande** : Simplifier en `payment_status: 'en_attente'` sans le ternaire.

### app/admin/page.tsx
- **Ligne 33** : L'audio de notification utilise un fichier WAV base64 tronque (quasiment silencieux). La notification sonore ne fonctionne probablement pas.
- **Impact** : L'artisan ne recoit pas d'alerte sonore pour les nouvelles commandes.
- **Fix recommande** : Utiliser un vrai fichier son dans `/public/` ou un son plus long.

---

## ✅ Points positifs

- **Architecture claire** : Le projet suit une structure App Router propre avec une separation nette entre pages, composants, et librairies.
- **Logique de plans bien implementee** : La logique de filtrage des modes de paiement dans `commander/page.tsx` est correcte et bien structuree (Wave natif partout, Orange/MTN natifs pour Pro+, CB pour Premium).
- **SEO bien gere** : `generateMetadata` est utilise pour les boutiques et les produits. Le sitemap dynamique liste boutiques et produits.
- **Onboarding artisan** : Le wizard d'onboarding en 4 etapes est bien pense et guide l'artisan pas a pas.
- **Gestion des variantes** : Le systeme de variantes (tailles, couleurs, pointures) est complet avec presets, stock par variante, et prix override.
- **Suivi commande temps reel** : La page `/suivi` avec auto-refresh toutes les 10 secondes et le workflow retrait vs domicile est une excellente UX.
- **Cache IA 24h** : Les recommandations Claude Haiku sont cachees 24h pour eviter les appels inutiles — bonne gestion des couts.
- **Script create-shop.js** : Script CLI robuste avec validation, rollback si erreur, et generation du message WhatsApp. Bien adapte au workflow du fondateur.
- **Gestion du stock tampon** : La distinction stock total / stock tampon physique / stock en ligne est bien pensee pour les artisans qui vendent aussi en boutique.
- **Pages legales completes** : Mentions legales, CGU et politique de confidentialite sont presentes et bien structurees.
- **Footer fortunashop** : Le lien de retour vers fortunashop.fr dans le footer des boutiques est bien implemente (boucle d'acquisition).
