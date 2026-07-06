# Processus de reservation detaille - Location Auto Maroc

Ce document decrit uniquement le processus de reservation, du premier clic jusqua la cloture finale du dossier.

Il est fait pour etre soumis a GPT afin de verifier si le flux est coherent, complet et bien pense.

## 1. Objectif du processus

Permettre a un visiteur ou a un client de:

- trouver une voiture disponible
- lancer une demande de location
- faire verifier son dossier
- recevoir un appel de confirmation
- payer physiquement a lagence
- recuperer la voiture
- la rendre
- cloturer la reservation

Le processus doit aussi:

- bloquer correctement la voiture pendant les periodes utiles
- liberer automatiquement les demandes expirees
- notifier le client a chaque etape importante
- permettre au personnel de lagence de suivre et valider chaque action

## 2. Acteurs du processus

- Visiteur public
- Client
- Agent
- Super admin
- Systeme automatique

## 3. Vue globale du flux

1. Le visiteur cherche une voiture.
2. Il ouvre la fiche detaillee.
3. Il choisit les dates.
4. Il soumet une demande.
5. Le systeme cree un blocage temporaire.
6. Le client complete ou envoie ses documents.
7. Lagence verifie le dossier.
8. Lagence appelle le client.
9. Le client confirme par telephone.
10. Le delai de paiement commence.
11. Le client se presente physiquement a lagence.
12. Lagence confirme le paiement.
13. La reservation devient officielle.
14. La voiture est remise au client.
15. La voiture est retournee.
16. Le dossier est cloture.

## 4. Etape par etape

### 4.1 Recherche initiale

Le processus commence quand le visiteur:

- ouvre la page daccueil
- accede au catalogue
- filtre par ville, marque, modele, categorie, carburant, transmission, prix ou places
- consulte les voitures disponibles

Le but de cette etape est de faire entrer lutilisateur dans un parcours de reservation clair et rapide.

### 4.2 Consultation de la fiche voiture

Sur la fiche voiture, lutilisateur voit:

- le titre
- limage principale
- la galerie
- les videos
- les images 360
- le prix journalier
- le prix hebdomadaire
- le prix mensuel
- la description
- les caracteristiques
- les documents requis
- la disponibilite
- le bouton WhatsApp
- le formulaire de demande

La caution existe bien pour chaque voiture, mais:

- elle nest pas affichee sur les cartes de la premiere page publique
- elle peut etre activee ou masquee par ladmin
- elle devient visible dans le resume de reservation une fois le client connecte
- elle est toujours affichee comme depot separe du prix de location

Cette etape sert a rassurer le client avant la demande.

### 4.3 Choix des dates

Le client selectionne:

- la date de depart
- la date de retour
- parfois lheure de depart
- parfois lheure de retour

Le systeme doit verifier:

- que la date de retour est apres la date de depart
- que la voiture nest pas deja bloquee
- que la periode ne chevauche pas une autre reservation

Si les dates sont invalides, la demande doit etre refusee avant creation.

### 4.4 Calcul du prix estime

Avant envoi de la demande, le systeme calcule un prix estime.

Le calcul peut prendre en compte:

- le prix journalier
- le prix hebdomadaire
- le prix mensuel
- la duree de location
- la taxe ou la TVA si elle existe dans les parametres
- les remises eventuelles

Le resume de prix doit distinguer:

- le prix de location
- le depot de caution
- le total a regler a lagence

Important:

- la caution nest pas un revenu
- la caution doit rester separee du prix de location
- si ladmin desactive son affichage public, elle reste visible dans le parcours connecte de reservation

Le client doit voir:

- le prix estime
- la duree
- le resume de la selection

### 4.5 Connexion ou creation de compte

Si le client nest pas connecte:

- le site peut sauvegarder la demande en attente
- le site demande de creer un compte ou de se connecter

Si le client est deja connecte:

- ses coordonnees peuvent etre pre-remplies
- son profil peut etre reutilise

Le compte client sert a:

- suivre la demande
- televerser les documents
- recevoir les notifications
- consulter lhistoire des reservations

Quand le client se connecte pour reserver:

- le systeme peut afficher le prix complet
- le recap peut inclure le prix de location et la caution
- la caution doit etre clairement identifiee comme depot remboursable

### 4.6 Soumission de la demande

Le client envoie le formulaire avec:

- nom complet
- telephone
- email
- CIN ou passeport
- permis de conduire
- ville ou lieu de prise en charge
- lieu de retour
- dates de location
- notes eventuelles

Une fois envoye:

- la demande est creee en base
- le statut initial est defini
- la voiture recoit un blocage temporaire
- le client recoit une confirmation
- lagence est notifiee

### 4.7 Blocage temporaire de la voiture

Le systeme ne reserve pas encore la voiture de facon definitive.

Il cree plutot:

- un hold temporaire
- un blocage de disponibilite
- une limite de temps pour completer certaines etapes

Le but est de:

- eviter les doubles reservations
- laisser le temps a lagence de verifier le dossier
- eviter de bloquer la voiture definitivement trop tot

### 4.8 Televersement des documents

Le client doit fournir les pieces demandees.

Documents possibles:

- CIN
- passeport
- permis de conduire

Les documents peuvent etre:

- envoyes depuis le profil client
- envoyes depuis la demande de reservation

Le systeme doit:

- valider le type de fichier
- verifier la taille
- stocker le lien du fichier
- garder une trace du document

Si les documents sont complets, la demande peut avancer dans le flux.

### 4.9 Verification des documents

Lagent ou le super admin consulte la demande et les documents.

Il peut:

- approuver les documents
- demander des complements
- refuser le dossier

Si les documents sont acceptes:

- la demande passe a letape de verification ou de confirmation

Si les documents sont incomplets:

- la demande attend des documents supplementaires
- le client est notifie

### 4.10 Appel telephonique

Lagent contacte le client par telephone.

Deux cas principaux:

- appel tente
- appel confirme

Si lappel echoue:

- le dossier peut rester en attente
- le dossier peut etre reprogramme

Si le client confirme par telephone:

- la demande passe a letape de confirmation
- le delai de paiement commence
- la voiture reste bloquee temporairement

### 4.11 Debut du delai de paiement

Une fois lappel confirme:

- un compte a rebours commence
- le client doit venir a lagence
- le client doit payer physiquement
- la voiture reste reservee de maniere temporaire

Important:

- la specification initiale parle de 12 heures
- le code actuel applique un minimum de 24 heures

Cette difference doit etre clarifiee avant livraison finale.

### 4.12 Visite physique a lagence

Le client se presente a lagence avec:

- sa piece didentite
- son permis
- tout document complementaire demande

Lagent verifie:

- lidentite
- les documents
- la disponibilite du vehicule
- le montant a payer
- le depot de caution si la voiture en exige un

Lagent peut aussi expliquer au client:

- que la caution est un depot distinct du prix de location
- que la caution peut etre activee ou masquee par ladmin dans le parcours public
- que la caution sera visible dans le resume de reservation connecte

### 4.13 Confirmation du paiement

Le paiement se fait sur place.

Le systeme doit enregistrer:

- le montant
- le mode de paiement
- la date de paiement
- lutilisateur qui confirme
- les notes eventuelles
- le montant de caution, separe du prix de location
- le statut du depot de caution si applicable

Une fois le paiement confirme:

- la demande devient une reservation officielle
- la voiture passe a letat reserve
- un recu peut etre genere
- une notification peut etre envoyee au client

### 4.14 Reservation officielle

Apres paiement:

- la voiture est bloquee pour les dates confirmees
- la reservation est consideree comme valide
- le client peut voir le dossier comme confirme
- lagence peut preparer la remise du vehicule
- le recap affiche le prix de location et la caution comme deux lignes distinctes

Le systeme peut aussi distinguer:

- revenu attendu
- revenu final

Seule une location terminee doit compter comme revenu final.

### 4.15 Remise de la voiture

Le jour du depart:

- lagent marque la voiture comme livree
- ou comme location en cours
- le client recoit le vehicule
- le dossier passe en location active

Le systeme doit garder:

- le statut de la demande
- le statut de la voiture
- lhistorique des actions

### 4.16 Retour de la voiture

Quand le client rend la voiture:

- lagent marque le retour
- lagent peut ajouter des notes
- le dossier entre dans la phase de cloture

Si un probleme existe:

- retard
- carburant manquant
- dommage
- nettoyage
- entretien

une charge peut etre ajoutee.

### 4.17 Cloture finale

Quand tout est termine:

- le dossier est cloture
- la demande devient terminee
- les revenus peuvent etre comptabilises
- la voiture peut redevenir disponible si elle nest pas en maintenance
- la caution est restituee si aucun frais nest retenu
- si des frais existent, la caution peut etre partiellement ou totalement retenue

## 5. Statuts importants

### 5.1 Statuts de demande

- `PENDING`
- `UNDER_REVIEW`
- `CALL_ATTEMPTED`
- `DOCUMENT_SUBMISSION_WINDOW`
- `WAITING_DOCUMENTS`
- `PENDING_CALL_CONFIRMATION`
- `CALL_CONFIRMED`
- `EXTENDED_PAYMENT_DEADLINE`
- `WAITING_AGENCY_PAYMENT`
- `PAID`
- `RESERVED`
- `ACTIVE_RENTAL`
- `CAR_DELIVERED`
- `RENTED`
- `CAR_RETURNED`
- `RETURNED`
- `COMPLETED`
- `REJECTED`
- `CANCELLED`
- `ABANDONED`

### 5.2 Statuts de voiture

- `AVAILABLE`
- `TEMPORARILY_HELD`
- `RESERVED`
- `RENTED`
- `MAINTENANCE`
- `INACTIVE`

## 6. Cas alternatifs

### 6.1 Le client nest pas authentifie

- la demande peut etre sauvegardee temporairement
- le systeme demande la creation du compte
- le client reprend le parcours apres inscription

### 6.2 La voiture est deja bloquee

- le systeme refuse la demande
- un message explique que la voiture nest pas disponible
- le client peut choisir un autre vehicule ou une autre periode

### 6.3 Les documents sont incomplets

- la demande reste en attente
- le client recoit une notification
- lagence peut demander des documents supplementaires

### 6.4 Lappel naboutit pas

- la demande peut rester en attente
- lagent peut reessayer
- le statut peut rester sur appel tente ou en cours de traitement

### 6.5 Le client ne vient pas payer

- le delai expire
- la demande devient abandonnee
- le vehicule est libere

### 6.6 Le client annule avant validation

- la demande peut etre annulee si le statut le permet
- la voiture est liberee
- une notification peut etre envoyee

### 6.7 Le dossier est refuse

- lagent ou le super admin rejette la demande
- la voiture est liberee
- le client est notifie

### 6.8 La voiture passe en maintenance

- la voiture ne doit plus etre reservable
- les nouvelles demandes doivent etre bloquees
- le calendrier doit afficher lindisponibilite

## 7. Notifications attendues

Le client doit etre notifie pour:

- demande enregistree
- documents recus
- documents approuves ou refuses
- appel confirme
- delai de paiement commence
- paiement confirme
- reservation validee
- demande abandonnee
- demande annulee
- vehicule livre
- vehicule retourne
- dossier cloture

Lagence doit etre notifiee pour:

- nouvelle demande
- documents recents
- demande proche de lexpiration
- paiement confirme
- demande abandonnee
- retour du vehicule

## 8. Donnees a enregistrer

### 8.1 Donnees de la demande

- identifiant client
- identifiant voiture
- nom complet
- telephone
- email
- CIN ou passeport
- numero de permis
- date de debut
- date de retour
- lieu de prise en charge
- lieu de retour
- prix estime
- prix final
- notes
- statut
- statut paiement
- delai de paiement
- date de confirmation dappel
- utilisateur qui confirme lappel
- date de paiement agence
- utilisateur qui confirme le paiement
- date dabandon
- dates de creation et mise a jour

### 8.2 Donnees de paiement

- montant
- methode
- statut
- notes
- date de paiement
- date limite

### 8.3 Donnees de blocage

- voiture concernee
- demande concernee
- debut
- fin
- type de blocage
- statut
- date dexpiration

## 9. Regles de disponibilite

- Une voiture ne doit pas pouvoir etre reservee deux fois sur une periode identique ou cheveauchante
- Un hold temporaire bloque la voiture
- Une reservation confirmee bloque la voiture
- Une location active bloque la voiture
- Une voiture en maintenance est indisponible
- Une demande abandonnee ou annulee doit liberer le blocage

## 10. Regles de business

- Pas de paiement en ligne en V1
- Paiement uniquement a lagence
- Confirmer le client par telephone avant le paiement
- Appliquer un delai limite apres confirmation par telephone
- Liberer automatiquement les demandes expirees
- Compter uniquement les locations terminees comme revenu final

## 11. Ce que le client voit

Le client doit voir clairement:

- le statut de sa demande
- le temps restant avant expiration
- les documents attendus
- les instructions pour venir a lagence
- le montant a payer
- le recu telechargeable
- lhistorique des etapes du dossier

## 12. Ce que lagent voit

Lagent doit voir:

- les demandes recentes
- les demandes urgentes
- les demandes proches de lexpiration
- le calendrier
- les documents televerses
- les actions disponibles sur chaque statut
- le moyen de confirmer appel, paiement, livraison et retour

## 13. Points critiques a verifier

- le delai de paiement doit etre aligne entre le cahier des charges et le code
- le statut de demande doit rester coherent dans tous les ecrans
- les statuts visibles au client doivent etre simples et comprensibles
- les statuts internes peuvent etre plus nombreux, mais ils doivent etre bien maps
- les blocs de disponibilite doivent etre liberes automatiquement
- les notifications doivent etre envoyees au bon moment

## 14. Critere de bon fonctionnement

Le process est bon si:

- le client peut chercher et soumettre une demande facilement
- lagent peut traiter la demande sans ambiguite
- la voiture nest jamais reservee deux fois
- les expirations sont automatiques
- les recus sont generes correctement
- le client sait toujours quoi faire ensuite
- le revenu final est fiable

## 15. Conclusion

Le vrai coeur du produit, cest la reservation.

Si ce processus est clair, stable et bien synchronise entre le site, la base de donnees, les notifications et le calendrier, alors toute la plateforme devient solide.
