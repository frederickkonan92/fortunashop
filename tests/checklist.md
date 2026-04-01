# Checklist de non-regression fortunashop

## Instructions
Avant chaque deploiement majeur, tester chaque parcours ci-dessous.
Cocher ✅ quand OK, ❌ quand KO avec description du bug.

---

## 1. Landing page (fortunashop.fr)
- [ ] La page charge sans erreur console
- [ ] Le toggle mensuel/annuel fonctionne et met a jour les 3 cartes
- [ ] Les 3 cartes pricing affichent les bons prix (Starter 35 000, Pro 55 000, Premium 85 000)
- [ ] En mode annuel : Starter 29 167, Pro 45 833, Premium 70 833
- [ ] Les economies annuelles s'affichent (Starter 70 000, Pro 110 000, Premium 170 000)
- [ ] Le bandeau "Setup unique : 100 000 FCFA" est visible
- [ ] Les addons sont cliquables et se cochent/decochent
- [ ] Le recapitulatif addons apparait en bas si addons selectionnes
- [ ] Le bouton "Choisir [plan]" scrolle vers le formulaire et pre-remplit le plan
- [ ] Le formulaire valide les champs requis (nom, WhatsApp, activite)
- [ ] Le formulaire s'envoie et le message de succes apparait
- [ ] Le lead apparait dans Supabase (table leads) avec le bon plan et addons
- [ ] Le message WhatsApp s'ouvre avec les bonnes infos (nom, tel, plan, addons)
- [ ] L'email arrive a contact@fortunashop.fr via Brevo
- [ ] Le bouton "Voir la demo" mene a /boutique/kente-fashion-test
- [ ] Les liens footer (mentions legales, CGU, confidentialite) fonctionnent
- [ ] La FAQ s'ouvre et se ferme correctement
- [ ] Le lien "Contact" dans la nav scrolle vers le formulaire

## 2. Boutique client (fortunashop.fr/boutique/[slug])
- [ ] Le catalogue charge et affiche tous les produits actifs avec images
- [ ] Les prix sont affiches en FCFA avec separateur de milliers
- [ ] Le badge variantes apparait sur les produits avec variantes
- [ ] Le badge "En ligne" vert pulse s'affiche dans le header
- [ ] Cliquer sur un produit ouvre la fiche produit (/produit/[id])
- [ ] La fiche produit affiche les images (galerie si multi-photos), le prix, la description
- [ ] Le selecteur de variantes fonctionne (si applicable)
- [ ] Les variantes epuisees sont barrees et non cliquables
- [ ] Le bouton "Ajouter" ajoute au panier
- [ ] Pour les produits avec variantes, le popup de selection s'ouvre
- [ ] La barre panier en bas affiche le bon total et le nombre d'articles
- [ ] Le bouton "Commander" dans la barre panier mene a /commander
- [ ] Le footer "Propulse par fortunashop" est cliquable et mene a fortunashop.fr
- [ ] Les boutons +/- dans le catalogue respectent le stock maximum
- [ ] Le tracker de page s'execute (verifier dans page_views)

## 3. Parcours commande (/boutique/[slug]/commander)
- [ ] La page commande affiche les articles du panier avec images
- [ ] Les boutons +/- modifient la quantite
- [ ] Le bouton poubelle supprime l'article
- [ ] Le total se met a jour en temps reel
- [ ] Le formulaire nom/telephone/livraison fonctionne
- [ ] Le champ adresse apparait si livraison "domicile"
- [ ] Le champ adresse disparait si on repasse en "retrait"
- [ ] Le bouton "Choisir le mode de paiement" passe a l'ecran paiement
- [ ] Si panier vide : message "Votre panier est vide" avec lien retour

## 4. Modes de paiement (par plan)

### Plan Starter
- [ ] Wave apparait toujours
- [ ] Especes apparait si livraison = retrait
- [ ] Orange Money et MTN MoMo N'apparaissent PAS (sans addon cinetpay)
- [ ] CB N'apparait PAS (sans addon stripe)

### Starter + addon cinetpay
- [ ] Wave + Orange Money + MTN MoMo apparaissent
- [ ] CB N'apparait PAS

### Starter + addon stripe
- [ ] Wave + CB apparaissent
- [ ] Orange Money et MTN MoMo N'apparaissent PAS (sans addon cinetpay)

### Plan Pro
- [ ] Wave + Orange Money + MTN MoMo apparaissent (natifs)
- [ ] CB N'apparait PAS (sans addon stripe)
- [ ] Especes apparait si retrait

### Plan Premium
- [ ] Wave + Orange Money + MTN MoMo + CB apparaissent (natifs)
- [ ] Especes apparait si retrait

### Validation commande (tous plans)
- [ ] Le bouton "Valider ma commande" cree la commande dans Supabase
- [ ] Le stock est decremente correctement
- [ ] L'ecran de confirmation affiche le numero de commande
- [ ] Les instructions de paiement s'affichent correctement pour chaque mode :
  - [ ] Wave : numero Wave + etapes
  - [ ] Orange Money : numero Orange + etapes (#144#)
  - [ ] MTN MoMo : numero MTN + etapes (*133#)
  - [ ] Especes : message "Payez au retrait"
  - [ ] CB : message "prochainement"
- [ ] Le bouton WhatsApp de confirmation s'ouvre avec les bonnes infos
- [ ] Le lien "Suivre ma commande" mene a /suivi avec le bon numero

## 5. Suivi commande (/suivi?cmd=XXX)
- [ ] La page charge avec le bon numero de commande
- [ ] La timeline affiche le bon workflow selon le mode de livraison :
  - [ ] Retrait : Recue → Confirmee → En preparation → Prete a retirer
  - [ ] Domicile : Recue → Confirmee → En livraison → Livree
- [ ] L'indicateur "En cours" pulse sur l'etape actuelle
- [ ] Le detail de la commande (client, produits, livraison, total) est correct
- [ ] La page se rafraichit automatiquement toutes les 10 secondes
- [ ] Commande inexistante : message "Commande introuvable"

## 6. Admin artisan (/admin)

### Login
- [ ] Login avec email/mot de passe fonctionne
- [ ] Mauvais identifiants : message d'erreur
- [ ] Redirection vers /admin apres login reussi
- [ ] Redirection vers /admin/login si non connecte

### Onboarding
- [ ] S'affiche si onboarding_completed = false
- [ ] Les 4 etapes sont cliquables et se cochent
- [ ] Le bouton "Copier le lien" copie le lien boutique
- [ ] Le bouton "Partager sur WhatsApp" ouvre WhatsApp avec le bon message
- [ ] Le lien "Voir ma boutique" ouvre la boutique dans un nouvel onglet
- [ ] L'etape 4 se coche automatiquement si une commande existe
- [ ] Le bouton "Passer" permet d'acceder au dashboard
- [ ] Le bouton "Acceder a mon tableau de bord" (4/4 cochees) fonctionne

### Commandes (/admin)
- [ ] Les KPIs en haut affichent : en attente, aujourd'hui, CA livre
- [ ] Les onglets de filtre fonctionnent (Toutes, Nouvelles, Confirmees, etc.)
- [ ] Le badge de compteur par statut est correct
- [ ] Le bouton de statut suivant fonctionne :
  - [ ] Nouvelle → Confirmee (+ paiement confirme)
  - [ ] Confirmee → En livraison (domicile) ou En preparation (retrait)
  - [ ] En livraison → Livree / En preparation → Prete
- [ ] Le bouton "Preparer lien livreur" apparait pour les commandes domicile
- [ ] Le lien livreur s'ouvre sur WhatsApp avec les bonnes infos
- [ ] Le bouton "Notifier le client" s'affiche et ouvre WhatsApp
- [ ] L'activation des notifications navigateur fonctionne
- [ ] Le son de notification joue quand une nouvelle commande arrive (polling 30s)
- [ ] Le bouton "Deconnexion" fonctionne

### Produits (/admin/produits)
- [ ] Le compteur produits/max et modifications/max s'affiche
- [ ] Le bouton "+ Ajouter" ouvre le formulaire
- [ ] Le formulaire permet de saisir nom, prix, description
- [ ] L'upload de 3 photos fonctionne (avec apercu)
- [ ] La gestion de stock s'affiche si addon 'stock' actif
- [ ] Le stock tampon se calcule en temps reel
- [ ] Les variantes peuvent etre activees et configurees
- [ ] Les presets (vetements, chaussures, couleurs) fonctionnent
- [ ] Les variantes custom peuvent etre ajoutees
- [ ] Un produit peut etre modifie, active/desactive, supprime
- [ ] La limite de produits par plan est respectee (20/50/illimite)
- [ ] La limite de modifications par mois est respectee (10/25/illimite)
- [ ] La modification du stock seul ne compte pas comme une modification

### Livreurs (/admin/livreurs)
- [ ] Le compteur livreurs/max s'affiche
- [ ] Un livreur peut etre ajoute (nom, telephone, zone)
- [ ] Un livreur peut etre modifie et supprime
- [ ] La limite par plan est respectee (1/3/illimite)

### Ventes physiques (/admin/ventes)
- [ ] Le bouton "+ Nouvelle vente" ouvre le formulaire
- [ ] Les produits actifs s'affichent avec boutons +/-
- [ ] Le total se calcule en temps reel
- [ ] Les 4 modes de paiement sont selectionables
- [ ] Le bouton "Enregistrer la vente" sauvegarde dans physical_sales
- [ ] Le stock est decremente apres la vente
- [ ] Le popup alerte stock apparait si stock bas ou rupture
- [ ] L'historique des ventes s'affiche avec les details

### Dashboard (/admin/dashboard)
- [ ] Le dashboard affiche les KPIs (CA, commandes, top produit)
- [ ] Le filtre 7j/30j fonctionne
- [ ] Le graphique CA 30 jours s'affiche
- [ ] Le CA par mode de paiement s'affiche avec barres
- [ ] Le top produits s'affiche avec distinction en ligne/physique
- [ ] Le bouton "Export CSV" genere un fichier correct
- [ ] **Plan Pro** : l'onglet Analytics affiche visiteurs, taux conversion, sources
- [ ] **Plan Pro** : le graphique visiteurs 30 jours s'affiche
- [ ] **Plan Premium** : l'onglet Prevision affiche la projection CA
- [ ] **Plan Premium** : les recommandations IA s'affichent (cache 24h)
- [ ] **Plan Starter** : l'upsell vers Pro s'affiche

### Livraison livreur (/livraison?token=XXX)
- [ ] La page charge avec les details de la commande
- [ ] Le bouton "Confirmer la livraison" met a jour le statut en "livree"
- [ ] Le token est marque comme utilise
- [ ] Le bouton "Notifier le client sur WhatsApp" apparait apres confirmation
- [ ] Un token deja utilise affiche "Deja confirmee"
- [ ] Un token invalide affiche "Lien invalide"

## 7. Pages legales
- [ ] /mentions-legales charge et affiche le contenu
- [ ] /cgu charge et affiche le contenu
- [ ] /confidentialite charge et affiche le contenu
- [ ] Les liens de navigation entre pages legales fonctionnent
- [ ] Le lien retour vers la landing fonctionne

## 8. SEO et partage
- [ ] Le titre de la page boutique est dynamique (nom boutique)
- [ ] Le titre de la fiche produit est dynamique (nom produit — nom boutique)
- [ ] Le partage d'un lien boutique sur WhatsApp affiche un apercu riche (OG tags)
- [ ] Le partage d'un lien produit sur WhatsApp affiche un apercu avec image
- [ ] /sitemap.xml est accessible et liste les boutiques et produits actifs
- [ ] Le favicon s'affiche correctement

## 9. Script CLI
- [ ] `node scripts/create-shop.js` se lance sans erreur
- [ ] Le script pose les 11 questions interactives
- [ ] Le slug est auto-genere si laisse vide
- [ ] Le mot de passe est auto-genere si laisse vide
- [ ] La verification du slug unique fonctionne
- [ ] Le compte Auth est cree dans Supabase
- [ ] La boutique est creee dans la table shops
- [ ] Le rollback fonctionne si la creation boutique echoue (suppression du compte Auth)
- [ ] Le recapitulatif affiche toutes les infos (URL, email, MDP)
- [ ] Le message WhatsApp est genere correctement

## 10. Verifications transverses
- [ ] `npm run build` passe sans erreur
- [ ] Aucune erreur 500 dans les logs Vercel
- [ ] Le site est responsive sur mobile (iPhone, Android)
- [ ] Le panier persiste entre les pages (localStorage)
- [ ] Le panier se vide apres une commande validee
- [ ] Les images se chargent correctement (Supabase Storage)
- [ ] Le bouton support WhatsApp flottant est visible sur toutes les pages admin
