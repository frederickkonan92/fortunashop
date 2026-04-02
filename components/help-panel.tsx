'use client'

// Panneau d'aide contextuel pour l'admin
// S'ouvre à droite en overlay quand l'artisan clique sur "?"
// Chaque section de l'admin a son propre contenu d'aide

import { useState } from 'react'

// Contenu d'aide par section
// Chaque clé correspond à un onglet/section de l'admin
var HELP_CONTENT: Record<string, { title: string; sections: Array<{ subtitle: string; text: string }> }> = {

  dashboard: {
    title: 'Dashboard',
    sections: [
      {
        subtitle: 'Commandes en attente',
        text: 'Nombre de commandes que tu n\'as pas encore confirmées. Quand un client commande, le chiffre augmente. Il redescend quand tu confirmes.'
      },
      {
        subtitle: 'CA du mois',
        text: 'Le total de tes ventes ce mois-ci en FCFA. Calculé sur les commandes livrées uniquement.'
      },
      {
        subtitle: 'Top produit',
        text: 'Ton produit le plus vendu ce mois. Ça te dit ce que tes clients préfèrent.'
      },
      {
        subtitle: 'Graphique 30 jours',
        text: 'L\'évolution de tes ventes jour par jour. Tu vois les pics et les creux.'
      },
      {
        subtitle: 'Astuce',
        text: 'Les données se mettent à jour en temps réel. Pas besoin de recharger la page.'
      }
    ]
  },

  commandes: {
    title: 'Commandes',
    sections: [
      {
        subtitle: 'Les statuts',
        text: 'Nouvelle = le client vient de commander, tu dois confirmer. Confirmée = tu as validé, le client est notifié. En livraison = envoyée au livreur. Livrée = le client a reçu. Annulée = commande annulée.'
      },
      {
        subtitle: 'Comment confirmer une commande',
        text: '1. Clique sur la commande. 2. Vérifie les détails (produits, montant, adresse). 3. Clique "Confirmer". Le client reçoit automatiquement un message.'
      },
      {
        subtitle: 'Comment envoyer au livreur',
        text: '1. Clique "Envoyer au livreur". 2. Choisis le livreur dans la liste. 3. Un message WhatsApp pré-rempli s\'ouvre avec l\'adresse et les détails.'
      },
      {
        subtitle: 'Astuce',
        text: 'Traite tes commandes dans les 30 minutes. Un client qui attend trop longtemps risque d\'annuler.'
      }
    ]
  },

  produits: {
    title: 'Produits',
    sections: [
      {
        subtitle: 'Ajouter un produit',
        text: 'Clique "Ajouter un produit". Ajoute une photo (bonne qualité, fond clair). Nom court et clair (ex: "Collier cauris doré"). Prix en FCFA. Description optionnelle mais recommandée.'
      },
      {
        subtitle: 'Gérer les variantes',
        text: 'Active "Variantes" sur un produit. Choisis le type : taille, couleur, pointure ou personnalisé. Ajoute chaque option (ex: S, M, L, XL). Pour chaque option tu peux mettre un prix différent et un stock.'
      },
      {
        subtitle: 'Limites par plan',
        text: 'Starter : 30 produits max, 10 modifications/mois. Pro : 50 produits max, 25 modifications/mois. Premium : illimité.'
      },
      {
        subtitle: 'Astuce',
        text: 'Tes photos sont la première chose que le client voit. Prends-les en lumière naturelle, sur un fond uni.'
      }
    ]
  },

  livreurs: {
    title: 'Livreurs',
    sections: [
      {
        subtitle: 'Ajouter un livreur',
        text: 'Clique "Ajouter un livreur". Renseigne le nom, le numéro de téléphone (WhatsApp) et la zone de livraison.'
      },
      {
        subtitle: 'Limites par plan',
        text: 'Starter : 1 livreur. Pro : 3 livreurs. Premium : illimité.'
      },
      {
        subtitle: 'Comment ça marche',
        text: 'Quand tu cliques "Envoyer au livreur" sur une commande, tu choisis dans ta liste de livreurs. Un message WhatsApp pré-rempli s\'ouvre avec l\'adresse du client et les détails de la commande.'
      }
    ]
  },

  previsions: {
    title: 'Prévision IA',
    sections: [
      {
        subtitle: 'Comment ça marche',
        text: 'Clique "Actualiser" pour générer de nouvelles recommandations. L\'IA analyse tes ventes des 30 derniers jours et te donne 3-5 conseils concrets.'
      },
      {
        subtitle: 'Limites',
        text: '1 actualisation par 24h. Plus tu as de ventes, plus les recommandations sont précises. Disponible uniquement sur le plan Premium.'
      }
    ]
  },

  faq: {
    title: 'Questions fréquentes',
    sections: [
      {
        subtitle: 'Mon client a payé mais la commande est toujours "en attente"',
        text: 'Le paiement se fait hors de la boutique (Wave, Orange Money). Quand tu reçois le paiement, confirme la commande manuellement.'
      },
      {
        subtitle: 'Je veux ajouter plus de produits mais j\'ai atteint la limite',
        text: 'Tu peux passer au plan supérieur. Contacte-nous sur WhatsApp.'
      },
      {
        subtitle: 'Un client veut annuler sa commande',
        text: 'Va dans la commande et clique "Annuler". Le stock est automatiquement restitué.'
      },
      {
        subtitle: 'Mes photos ne s\'affichent pas',
        text: 'Vérifie que tes fichiers n\'ont pas d\'espaces ni d\'accents dans le nom. Renomme-les si nécessaire (ex: collier-dore.jpg au lieu de Collier Doré.jpg).'
      }
      ,
      {
        subtitle: 'Je ne vois pas le dashboard',
        text: 'Le dashboard est accessible à tous les plans. Si tu ne le vois pas, recharge la page ou contactez-nous sur WhatsApp.'
      }
    ]
  }
  ,

  guide: {
    title: 'Guide utilisateur',
    sections: [
      {
        subtitle: 'Dashboard',
        text: `Ce que tu vois : tes chiffres clés en un coup d'oeil.

- Commandes en attente : nombre de commandes que tu n'as pas encore confirmées. Quand un client commande, le chiffre augmente. Il redescend quand tu confirmes.
- CA du mois : le total de tes ventes ce mois-ci en FCFA. Calculé sur les commandes livrées uniquement.
- Top produit : ton produit le plus vendu ce mois. Ça te dit ce que tes clients préfèrent.
- Graphique 30 jours : l'évolution de tes ventes jour par jour. Tu vois les pics et les creux.

Astuce : les données se mettent à jour en temps réel. Pas besoin de recharger la page.`
      },
      {
        subtitle: 'Commandes',
        text: `Ce que tu vois : la liste de toutes les commandes de tes clients.

Les statuts :
- Nouvelle : le client vient de commander. Tu dois confirmer.
- Confirmée : tu as validé la commande. Le client est notifié.
- En livraison : tu as envoyé la commande au livreur.
- Livrée : le client a reçu sa commande.
- Annulée : la commande a été annulée.

Comment confirmer une commande :
1. Clique sur la commande
2. Vérifie les détails (produits, montant, adresse)
3. Clique "Confirmer"
4. Le client reçoit automatiquement un message

Comment envoyer au livreur :
1. Clique "Envoyer au livreur"
2. Choisis le livreur dans la liste
3. Un message WhatsApp pré-rempli s'ouvre avec l'adresse et les détails
4. Envoie le message à ton livreur

Astuce : traite tes commandes dans les 30 minutes. Un client qui attend trop longtemps risque d'annuler.`
      },
      {
        subtitle: 'Produits',
        text: `Ce que tu vois : ton catalogue complet avec photos et prix.

Ajouter un produit :
1. Clique "Ajouter un produit"
2. Ajoute une photo (bonne qualité, fond clair de préférence)
3. Nom du produit (court et clair, ex: "Collier cauris doré")
4. Prix en FCFA
5. Description (optionnel mais recommandé : décris les matériaux, la taille, etc.)
6. Clique "Enregistrer"

Modifier un produit :
- Clique sur le produit dans la liste
- Modifie les champs que tu veux
- Clique "Enregistrer"

Gérer les variantes (tailles, couleurs) :
1. Active "Variantes" sur un produit
2. Choisis le type : taille, couleur, pointure ou personnalisé
3. Ajoute chaque option (ex: S, M, L, XL)
4. Pour chaque option tu peux mettre un prix différent et un stock

Limites par plan :
- Starter : 30 produits max, 10 modifications/mois
- Pro : 50 produits max, 25 modifications/mois
- Premium : illimité

Astuce : tes photos sont la première chose que le client voit. Prends-les en lumière naturelle, sur un fond uni.`
      },
      {
        subtitle: 'Livreurs',
        text: `Ce que tu vois : la liste de tes livreurs enregistrés.

Ajouter un livreur :
1. Clique "Ajouter un livreur"
2. Nom du livreur
3. Numéro de téléphone (WhatsApp)
4. Zone de livraison (optionnel)

Limites par plan :
- Starter : 1 livreur
- Pro : 3 livreurs
- Premium : illimité

Comment ça marche :
Quand tu cliques "Envoyer au livreur" sur une commande, tu choisis dans cette liste. Un message WhatsApp pré-rempli s'ouvre avec l'adresse du client et les détails de la commande.`
      },
      {
        subtitle: 'Prévision IA (Premium uniquement)',
        text: `Ce que tu vois : des recommandations personnalisées basées sur tes données de vente.

Comment ça marche :
1. Clique "Actualiser" pour générer de nouvelles recommandations
2. L'IA analyse tes ventes des 30 derniers jours
3. Elle te donne des conseils concrets (ex: ton produit se vend mieux le weekend)

Limites :
- 1 actualisation par 24h (pour éviter les coûts)
- Plus tu as de ventes, plus les recommandations sont précises
- Disponible uniquement sur le plan Premium`
      },
      {
        subtitle: 'Paramètres',
        text: `Informations de la boutique :
- Nom de la boutique
- Numéros de paiement (Wave, Orange Money, MTN MoMo)
- Téléphone de livraison

Changer mon mot de passe :
1. Déconnecte-toi
2. Sur la page de connexion, clique "Mot de passe oublié"
3. Tu recevras un lien de réinitialisation par email`
      },
      {
        subtitle: 'Questions fréquentes',
        text: `Mon client a payé mais la commande est toujours "en attente" :
Le paiement se fait hors de la boutique (Wave, Orange Money). Quand tu reçois le paiement, confirme la commande manuellement.

Je veux ajouter plus de produits mais j'ai atteint la limite :
Tu peux passer au plan supérieur. Contacte-nous sur WhatsApp.

Un client veut annuler sa commande :
Va dans la commande et clique "Annuler". Le stock est automatiquement restitué.

Mes photos ne s'affichent pas :
Vérifie que tes fichiers n'ont pas d'espaces ni d'accents dans le nom. Renomme-les si nécessaire (ex: collier-dore.jpg au lieu de Collier Doré.jpg).

Je ne vois pas le dashboard :
Le dashboard est accessible à tous les plans. Si tu ne le vois pas, recharge la page ou contacte-nous.`
      },
    ]
  }
}

function HelpButton({ section, label, variant }: { section: string; label?: string; variant?: 'icon' | 'floating' }) {
  var [isOpen, setIsOpen] = useState(false)
  var content = HELP_CONTENT[section]

  if (!content) return null

  return (
    <>
      {variant === 'floating' ? (
        <button
          type="button"
          data-help-section={section}
          onClick={function() { setIsOpen(true) }}
          style={{
            background: '#DC5014',
            border: 'none',
            borderRadius: '50%',
            width: 48,
            height: 48,
            color: 'white',
            fontSize: 20,
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(220, 80, 20, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          title={label || 'Aide et FAQ'}
        >
          ?
        </button>
      ) : (
        <button
          type="button"
          data-help-section={section}
          onClick={function() { setIsOpen(true) }}
          style={{
            background: 'rgba(220, 80, 20, 0.1)',
            border: '1px solid rgba(220, 80, 20, 0.3)',
            borderRadius: '50%',
            width: 28,
            height: 28,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            fontSize: 14,
            fontWeight: 700,
            color: '#DC5014',
            marginLeft: 8,
            flexShrink: 0,
          }}
          title={'Aide : ' + (label || content.title)}
        >
          ?
        </button>
      )}

      {isOpen && (
        <>
          {/* Overlay sombre */}
          <div
            onClick={function() { setIsOpen(false) }}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.4)',
              zIndex: 9998,
            }}
          />

          {/* Panneau latéral droit */}
          <div
            style={{
              position: 'fixed',
              top: 0,
              right: 0,
              bottom: 0,
              width: 340,
              maxWidth: '85vw',
              background: '#FDF8F3',
              zIndex: 9999,
              overflowY: 'auto',
              boxShadow: '-4px 0 20px rgba(0,0,0,0.15)',
            }}
          >
            {/* Header */}
            <div style={{
              background: '#DC5014',
              padding: '20px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <h3 style={{ color: 'white', margin: 0, fontSize: 16, fontWeight: 700 }}>
                {content.title}
              </h3>
              <button
                type="button"
                onClick={function() { setIsOpen(false) }}
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  border: 'none',
                  borderRadius: '50%',
                  width: 32,
                  height: 32,
                  color: 'white',
                  fontSize: 18,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                X
              </button>
            </div>

            {/* Contenu */}
            <div style={{ padding: 16 }}>
              {content.sections.map(function(s: any, index: number) {
                return (
                  <div key={index} style={{
                    marginBottom: 16,
                    background: s.subtitle === 'Astuce' ? '#FFF0E6' : 'white',
                    borderRadius: 12,
                    padding: 14,
                    border: '1px solid #E8DDD0',
                  }}>
                    <p style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: s.subtitle === 'Astuce' ? '#DC5014' : '#2C1A0E',
                      marginBottom: 6,
                      margin: 0,
                    }}>
                      {s.subtitle}
                    </p>
                    <p style={{
                      fontSize: 13,
                      color: '#5C4A3A',
                      lineHeight: 1.5,
                      margin: '6px 0 0 0',
                    }}>
                      {String(s.text || '').split('\n').map(function(line: string, idx: number) {
                        return (
                          <span key={idx}>
                            {idx > 0 && <br />}
                            {line}
                          </span>
                        )
                      })}
                    </p>
                  </div>
                )
              })}

              {/* Lien FAQ en bas */}
              {section !== 'faq' && section !== 'guide' && (
                <button
                  type="button"
                  onClick={function() {
                    setIsOpen(false)
                    setTimeout(function() {
                      var faqBtn = document.querySelector('[data-help-section="faq"]') as HTMLButtonElement
                      if (faqBtn) faqBtn.click()
                    }, 300)
                  }}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    background: 'white',
                    border: '1px solid #E8DDD0',
                    borderRadius: 12,
                    color: '#DC5014',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                    marginTop: 8,
                  }}
                >
                  Voir les questions frequentes
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </>
  )
}

export { HelpButton, HELP_CONTENT }
