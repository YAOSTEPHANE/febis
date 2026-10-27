# Guide utilisateur FEBiS (admin)

## Connexion

1. Ouvrir `/admin`
2. Se connecter avec un compte (rôles : Admin, Direction, Compta, Opérationnels)

## Parcours clés

### Résidences

1. Créer / éditer les logements (photos, tarifs, acompte %)
2. Suivre les demandes dans **Réservations**
3. Avancer le pipeline : demande → réservation → acompte → check-in → check-out → état des lieux
4. Bouton **Confirmer acompte** : crée l’intent et valide le paiement
5. Annulation : applique la politique (≥48h / 24–48h / &lt;24h)

### Événementiel

1. Catalogue matériel + stocks
2. Devis publics arrivent dans la liste
3. Accepter / refuser ; gérer sorties, retours, dommages

### Boutique

1. Produits & variantes (SKU, stock)
2. Commandes : passer en **confirmée** après paiement (ou confirmer l’intent dans **Paiements**)

### BTP

1. Prospects créés depuis `/btp` (site public)
2. Faire évoluer : prospect → devis → contrat → chantier → livraison

### Paiements

1. Onglet **Intents en attente** : Confirmer / Échec
2. Enregistrement manuel possible (Wave, Orange, MTN, virement, espèces)

### Direction

Tableau de bord CA, occupation, stocks, projets. La sauvegarde quotidienne et les alertes peuvent aussi être déclenchées via `/api/cron/daily`.
