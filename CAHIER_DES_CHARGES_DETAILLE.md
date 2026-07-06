# Cahier des charges detaille - Location Auto Maroc

Version: 1.0

## 1. Contexte general

Le projet est une plateforme complete de location de voitures pour le marche marocain.

Il couvre:

- Un site public orientee SEO et conversion
- Un espace client pour suivre les demandes
- Un espace agent pour le traitement operationnel
- Un espace super admin pour la gestion globale
- Une API backend pour les regles metier, la securite et les donnees
- Une application mobile cliente / PWA

Le produit doit etre:

- 100% en francais
- adapte au Maroc
- mobile first
- rapide
- securise
- SEO friendly
- facile a personnaliser pour une autre agence

## 2. Objectif du produit

L'objectif principal est de permettre a une agence de location de voitures de:

- attirer des visiteurs via Google et les reseaux sociaux
- presenter sa flotte
- recevoir des demandes de location en ligne
- verifier les documents des clients
- confirmer les demandes par telephone
- encaisser uniquement au niveau de l'agence
- suivre les voitures, les clients, les agents et les revenus
- calculer la rentabilite
- publier du contenu SEO
- conserver un historique complet des actions

## 3. Perimetre fonctionnel

### 3.1 Inclus dans la version cible

- Site vitrine public
- Catalogue des voitures
- Fiche detaillee voiture
- Formulaire de demande de location
- Authentification client
- Tableau de bord client
- Upload de documents
- Notifications
- Historique des demandes
- Confirmations par telephone
- Confirmation de paiement a l'agence
- Reception PDF
- Dashboard admin
- Dashboard agent
- Gestion des voitures
- Gestion des demandes
- Gestion des clients
- Gestion des agents
- Gestion des agences et marques
- Gestion des charges
- Gestion du blog
- Pages SEO locales
- Logs d'audit
- Calendrier des reservations
- Statistiques de rentabilite
- Application mobile / PWA

### 3.2 Exclus de la V1

- Paiement en ligne
- Wallet client
- Facturation automatique complexe
- Signature electronique avancee
- Livraison geolocalisee
- Marketplace multi-agence ouverte au public

## 4. Acteurs

### 4.1 Visiteur public

- consulte le site
- recherche une voiture
- lit le blog et les pages SEO
- contacte l'agence
- cree un compte
- demarre une demande

### 4.2 Client

- se connecte
- complete son profil
- televerse ses documents
- cree des demandes
- suit les statuts
- voit le delai restant
- annule une demande si la regle le permet
- laisse une note apres une location terminee

### 4.3 Agent

- traite les demandes
- appelle les clients
- confirme les appels
- confirme les paiements a l'agence
- gere les voitures
- consulte les clients
- ajoute des charges
- suit le calendrier
- valide les documents

### 4.4 Super admin

- a acces complet
- gere les agents
- gere les parametres globaux
- gere les agences et les marques
- consulte les KPIs
- consulte les logs d'audit
- pilote la rentabilite

### 4.5 Systeme

- expire les holds arrives a echeance
- libere les voitures
- envoie les notifications
- maintient les compteurs de disponibilite
- genere les recu PDF
- synchronise les vues et les statuts

## 5. Experience utilisateur attendue

### 5.1 Parcours visiteur

1. Le visiteur arrive sur la page d'accueil.
2. Il voit une proposition de valeur claire.
3. Il peut rechercher une voiture par ville, dates et budget.
4. Il ouvre une fiche voiture.
5. Il voit les images, les prix, les caracteristiques et la disponibilite.
6. Il clique sur reserver ou contacter l'agence.
7. Il cree un compte si necessaire.

### 5.2 Parcours client

1. Le client se connecte.
2. Il complete son profil.
3. Il cree une demande de location.
4. Il upload ses documents.
5. Il suit l'avancement dans son tableau de bord.
6. Il recoit les notifications de changement de statut.
7. Il vient a l'agence payer physiquement.
8. Il suit la remise, le retour et la cloture.

### 5.3 Parcours agent

1. L'agent se connecte.
2. Il voit les demandes prioritaires.
3. Il appelle les clients.
4. Il confirme les demandes.
5. Il valide les paiements a l'agence.
6. Il suit les periodes bloquantes.
7. Il gere la remise et le retour des voitures.

### 5.4 Parcours super admin

1. Le super admin consulte le tableau de bord.
2. Il suit les revenus, charges et profits.
3. Il gere la flotte.
4. Il controle les agents.
5. Il publie les articles SEO.
6. Il pilote les parametres de l'entreprise.

## 6. Fonctionnalites detaillees

### 6.1 Site public

#### Page d'accueil

- Hero avec slogan, proposition de valeur et CTA
- Barre de recherche rapide
- Voitures en vedette
- Marques disponibles
- Avantages de l'agence
- Etapes de reservation
- Avis clients
- FAQ
- Derniers articles de blog
- CTA WhatsApp
- Footer complet

#### Catalogue

- Recherche par mot cle
- Filtrage par marque
- Filtrage par modele
- Filtrage par categorie
- Filtrage par ville
- Filtrage par type de carburant
- Filtrage par transmission
- Filtrage par nombre de places
- Filtrage par prix
- Filtrage par disponibilite
- Tri par prix croissant
- Tri par prix decroissant
- Tri par nouveaute
- Tri par popularite
- Cartes voitures avec badge de statut
- Les cartes publiques n'affichent pas la caution
- Le prix affiche sur les cartes reste le prix de location, sans depot

#### Fiche voiture

- Titre SEO
- Image principale
- Galerie d'images
- Videos
- Media 360
- Prix journalier, hebdo et mensuel
- Caution / depot par voiture
- La caution peut etre activee ou masquee par l'admin
- La caution n'apparait pas sur la premiere page publique
- Elle devient visible dans le resume de reservation apres connexion
- Description en francais
- Caracteristiques techniques
- Documents requis
- Assurance incluse
- Disponibilite en temps reel
- Formulaire de demande
- Voitures similaires
- Bouton WhatsApp

#### Pages SEO et contenu

- Blog
- Detail article
- A propos
- Contact
- FAQ
- Mentions legales
- Politique de confidentialite
- Pages locales:
  - Location voiture Casablanca
  - Location voiture Marrakech
  - Location voiture Rabat
  - Location voiture Tanger
  - Location voiture Agadir
  - Location voiture Fes
  - Location voiture aeroport Mohammed V

### 6.2 Espace client

- Tableau de bord
- Profil personnel
- Edition des informations personnelles
- Upload des documents
- Liste des demandes
- Detail d'une demande
- Compte a rebours du delai
- Historique des locations
- Notifications
- Annulation d'une demande si autorisee
- Notes et avis apres completion
- Recu de reservation / paiement
- Resume complet de reservation avec prix de location et caution si activee

### 6.3 Espace agent

- Liste des demandes a traiter
- Detail d'une demande
- Appel tente
- Appel confirme
- Confirmation de paiement a l'agence
- Marquage abandonne
- Gestion des voitures
- Gestion des clients
- Gestion des charges
- Calendrier de planning
- Consultation des notifications
- Gestion des articles de blog si autorisee

### 6.4 Espace super admin

- KPI globaux
- Revenus
- Depenses
- Benefice net
- Revenus attendus
- Revenus en attente de paiement
- Demandes par statut
- Cars performance
- Clients
- Agents
- Agences
- Marques
- Blog
- Parametres entreprise
- Parametres de tarification
- Audit logs

### 6.5 Backend et API

- Authentification
- Role based access control
- Validation des entrees
- Gestion des documents
- Gestion des disponibilites
- Calcul de prix
- Confirmation des paiements
- Notification des utilisateurs
- Generation des recu
- Expiration automatique des holds
- Statistiques et KPIs

### 6.6 Application mobile / PWA

- Login
- Register
- Catalogue mobile
- Fiche voiture mobile
- Demande de location
- Suivi des demandes
- Profile
- Notifications
- Interface adaptative
- Mode installable si possible

### 6.7 Direction UI/UX du web app client

Le web app client doit ressembler a une experience premium, claire et rassurante, avec une forte orientation conversion pour le marche marocain.

Principes visuels:

- Interface propre, lumineuse et moderne
- Design premium mais simple
- Identite locale marocaine subtile, jamais surchargee
- Couleurs de confiance pour les parcours principaux
- Couleur d'alerte uniquement pour les statuts urgents
- CTA visibles, courts et repetes
- Mise en avant des prix, de la disponibilite et du paiement a l'agence
- La caution ne doit pas etre visible sur les cartes publiques du catalogue
- La caution apparait uniquement dans le parcours connecte de reservation
- Le recap final doit distinguer clairement le prix de location et le depot de caution

Structure UX attendue:

- Une home orientee recherche et conversion
- Une barre de recherche rapide et visible
- Un catalogue avec filtres clairs et accessibles
- Une fiche voiture avec galerie, prix, disponibilite et bouton reserver
- Un parcours de reservation en etapes simples
- Un dashboard client avec statut, delai, documents et recu
- Une zone notifications distincte et facile a consulter
- Un acces WhatsApp toujours visible sur les pages commerciales

Comportement ecran:

- Sur desktop, les blocs d'information doivent etre espaces et lisibles
- Sur mobile, les contenus doivent se transformer en cartes empilees
- Les filtres du catalogue doivent devenir un panneau coulissant
- Le CTA principal doit rester toujours visible sans saturer l'ecran
- Le client doit comprendre en moins de 5 secondes la marche a suivre

Pages du web app client a soigner:

- Accueil
- Catalogue
- Fiche voiture
- Etape de reservation
- Tableau de bord client
- Detail d'une demande
- Profil
- Notifications
- Recu / confirmation

Composants UI clefs:

- Search bar de reservation
- Card voiture avec image et prix
- Status badge lisible
- Stepper de progression de dossier
- Countdown timer pour les deadlines
- Upload field pour documents
- Empty states rassurants
- Toasts de succes et d'erreur
- CTA WhatsApp flottant

### 6.8 Direction UI/UX de l'application mobile

L'application mobile doit sembler native, rapide et ultra pratique pour un client qui veut suivre sa reservation en quelques gestes.

Principes mobiles:

- Priorite a la rapidite d'acces
- Navigation par onglets en bas de l'ecran
- Boutons larges et faciles a toucher
- Formulaires courts, decoupes en etapes
- Resume visible du statut et de la prochaine action
- Affichage tres clair des documents et deadlines

Structure mobile recommandee:

- Onglet Accueil
- Onglet Voitures
- Onglet Reservations
- Onglet Notifications
- Onglet Profil

Ecrans a privilegier:

- Home avec recherche rapide
- Catalogue mobile avec cartes compactes
- Detail voiture avec swipe gallery
- Reservation stepper
- Liste des demandes
- Detail d'une demande avec timeline
- Upload documents
- Profil et identite
- Notifications

Regles UX mobiles:

- Le bouton "Demander" doit etre immediatement visible
- Le bouton WhatsApp doit rester accesible
- La deadline doit etre affichee dans un bloc dedie
- Les statuts doivent etre traduits en francais simple
- Le client doit pouvoir reprendre sa demande sans confusion
- Les erreurs reseau doivent etre expliquees clairement

Comportement mobile premium attendu:

- Cartes arrondies
- Espacements confortables
- Hierarchie typographique claire
- Visuels forts sur les vehicules
- Feedback instantane sur les actions
- Animation legere, jamais envahissante

### 6.9 UI/UX admin et agent

L'espace admin et l'espace agent doivent rester tres productifs.

Attendus:

- Sidebar claire
- Topbar avec recherche et notifications
- KPIs immediats
- Tables lisibles
- Filtres rapides
- Dialogs de validation
- Badges de statut uniformes
- Calendrier visuel
- Alertes sur les deadlines proches

Le design doit rester plus SaaS operationnel que marketing, tout en gardant une finition premium.

## 7. Regles de gestion

### 7.1 Regle de paiement

- Le paiement se fait a l'agence uniquement
- Aucun paiement en ligne en V1
- La demande est d'abord soumise en ligne
- Le client est contacte par telephone
- Si la demande est confirmee par appel, un delai de paiement commence
- Le client doit venir physiquement payer pour bloquer definitivement la voiture
- La caution est un depot separe du prix de location
- La caution peut etre activee ou masquee par l'admin dans l'interface publique
- La caution reste visible dans le resume de reservation connecte et dans le back-office
- La caution n'est jamais comptabilisee comme revenu

### 7.2 Regle de delai

- La specification initiale demande 12 heures
- Le code actuel applique un minimum de 24 heures
- Le document doit signaler cette difference
- Toute evolution future doit harmoniser la regle dans:
  - backend
  - frontend
  - emails
  - textes UI
  - notifications

### 7.3 Regle de documents

- Une demande peut demander CIN ou passeport
- Le permis de conduire est obligatoire
- Les documents peuvent etre recus au niveau du profil client ou de la demande
- Une fois les documents recus, le systeme peut faire avancer la demande
- Les documents peuvent etre valides par un agent ou un admin

### 7.4 Regle de disponibilite

- Une voiture ne peut pas etre reservee deux fois sur des periodes qui se chevauchent
- Les holds temporaires bloquent la voiture
- Les reservations confirmees bloquent la voiture
- Les locations actives bloquent la voiture
- L'entretien bloque la voiture
- Les demandes abandonnees, annulees ou refusees liberent la voiture

### 7.5 Regle de revenu

- Seules les locations terminees comptent comme revenu final
- Les reservations confirmees peuvent compter comme revenu attendu
- Les demandes en attente peuvent compter comme pipeline
- Les demandes abandonnees, annulees et refusees ne comptent pas comme revenu
- La caution n'entre pas dans le revenu, meme si elle est encaissee ou bloquee a l'agence

### 7.6 Regle de rentabilite

- Benefice voiture = revenus termines de la voiture - charges de la voiture
- Benefice global = revenus termines de toutes les voitures - charges totales
- Les charges doivent etre rattachees a une voiture
- Les frais doivent pouvoir etre filtres par type et date

### 7.7 Regle de status

- Le systeme doit garder un historique lisible
- Les changements de statut doivent etre traces
- Les notifications doivent suivre les changements importants
- Le calendrier doit rester coherent avec les statuts visibles

## 8. Cycle de vie d'une demande

### 8.1 Creation

- Le client selectionne une voiture et des dates
- Le systeme verifie la disponibilite
- Le systeme calcule le prix estime
- La demande est creee
- Une disponibilite temporaire est creee

### 8.2 Phase document

- Le client ajoute ses documents
- Le dossier passe en attente de verif
- Le vehicule reste bloque pendant la duree autorisee

### 8.3 Appel de confirmation

- L'agent appelle le client
- L'agent note l'appel tente ou confirme
- Si l'appel est confirme, un delai de paiement commence

### 8.4 Paiement a l'agence

- Le client se presente a l'agence
- L'agent confirme le paiement
- Le status devient reserve
- Le contrat peut etre imprime sous forme de recu

### 8.5 Livraison et retour

- L'agence remet la voiture
- Le dossier passe en location active
- Le vehicule est retourne a la date de fin
- Le dossier est cloture

### 8.6 Echec ou abandon

- Si le client ne vient pas a temps
- Si les documents ne sont pas envoyes
- Si la validation echoue
- Si le delai expire
- Alors la demande devient abandonnee ou refusee
- La voiture redevient disponible

## 9. Donnees principales

### 9.1 Entites metier

- users
- customers
- agents
- agencies
- brands
- cars
- car_images
- car_videos
- car_360_images
- rental_requests
- rentals
- payments
- car_availability_blocks
- car_expenses
- documents
- notifications
- audit_logs
- blog_posts
- seo_pages
- company_settings
- theme_settings

### 9.2 Relations importantes

- Un user peut etre customer ou agent
- Un customer a un profil metier et des documents
- Une voiture peut avoir plusieurs medias
- Une demande appartient a un client et a une voiture
- Une demande peut avoir plusieurs documents
- Une demande peut produire un paiement
- Une demande peut produire une location
- Une voiture peut avoir plusieurs charges
- Une voiture peut avoir plusieurs blocs de disponibilite
- Un utilisateur peut recevoir plusieurs notifications
- Un utilisateur peut produire plusieurs logs d'audit

## 10. Exigences non fonctionnelles

### 10.1 Performance

- Pages publiques rapides
- Catalogue fluide
- Requetes serveur optimises
- Images optimises
- Pagination sur les listes longues
- Cache ou revalidation si necessaire

### 10.2 Securite

- Mot de passe hache
- Controle d'acces par role
- Validation serveur et client
- Limitation de debit sur login et formulaires
- Protection des routes privees
- Protection des fichiers televerses
- Journalisation des actions sensibles
- Secrets uniquement en variables d'environnement

### 10.3 SEO

- Meta titles dynamiques
- Meta descriptions dynamiques
- URLs lisibles
- Open Graph
- Twitter cards
- JSON-LD
- Sitemap
- Robots.txt
- Maillage interne
- Contenu localise pour le Maroc

### 10.4 Accessibilite

- Formulaires avec labels
- Couleurs contrastees
- Navigation clavier
- Etats de chargement
- Etats vides
- Messages d'erreur clairs

### 10.5 Mobile

- Design responsive
- Navigation adaptee au mobile
- Boutons tactiles lisibles
- Calendrier utilisable sur petit ecran
- PWA si possible

### 10.6 Fiabilite

- Job d'expiration regulier
- Reprise apres panne
- Logs applicatifs
- Gestion des erreurs API
- Sauvegarde des donnees

## 11. Role matrix simplifiee

### Public

- Voir le site
- Rechercher les voitures
- Lire le blog
- Contacter l'agence
- Creer un compte

### Client

- Tout ce qui precede
- Creer et suivre une demande
- Upload de documents
- Voir ses notifications
- Consulter ses recus
- Ajouter un avis apres completion

### Agent

- Tout ce qui precede pour la partie operationnelle
- Traiter les demandes
- Appeler le client
- Confirmer le paiement
- Gerer les charges
- Consulter le calendrier

### Super admin

- Tous les droits agent
- Gestion des parametres globaux
- Gestion des agents
- Gestion des agences
- Gestion des marques
- KPI et rentabilite
- Logs d'audit

## 12. KPIs attendus

- Nombre total de demandes
- Nombre de demandes en attente
- Nombre de demandes confirmees
- Nombre de demandes abandonnees
- Nombre de reservations actives
- Nombre de voitures disponibles
- Nombre de voitures reservees
- Nombre de voitures en entretien
- Revenus termines
- Revenus attendus
- Revenus en attente
- Depenses totales
- Benefice net
- Benefice par voiture
- Nombre de clients
- Nombre d'agents

## 13. Points a ameliorer dans le projet actuel

- Aligner le delai de paiement avec le besoin metier cible
- Harmoniser tous les statuts et leurs labels
- Verifier les droits reels de l'agent dans l'UI et dans l'API
- Clarifier les pages theme et SEO si elles doivent etre administrees depuis l'interface
- Ajouter davantage de tests sur:
  - disponibilite
  - expiration des holds
  - confirmations de paiement
  - droits par role
- S'assurer que les messages UI, emails et PDF restent coherents
- Confirmer que le mobile couvre vraiment les parcours prioritaires

## 14. Critieres d'acceptation

La solution peut etre consideree comme bonne si:

- un visiteur peut chercher une voiture et lancer une demande
- un client peut completer son profil et uploader ses documents
- un agent peut confirmer un appel et un paiement
- une demande expire automatiquement si elle n'est pas traitee a temps
- une voiture liberee redevient visible dans le catalogue
- le dashboard admin montre les revenus, depenses et profits
- le blog et les pages SEO sont exploitables
- les notifications informent bien les utilisateurs
- les logs d'audit permettent de retracer les actions sensibles
- l'interface reste utilisable sur mobile

## 15. Grille de relecture pour GPT

Quand tu soumets ce cahier des charges a GPT, demande-lui de verifier:

- la coherence business globale
- la completude des modules
- les contradictions entre les regles
- les zones floues du parcours client
- les problemes de securite
- les manques SEO
- les manques de tests
- les ecarts entre la spec cible et l'implementation actuelle
- les priorites MVP vs evolutions futures

## 16. Conclusion

Ce cahier des charges decrit une plateforme de location de voitures complete, orientee conversion, operation et rentabilite.

Le projet a une base solide, mais il doit encore etre aligne sur quelques points metier, surtout:

- le delai de paiement
- la coherence des statuts
- la couverture des permissions
- la clarification des fonctions de theme et de SEO

Si tu veux, je peux maintenant te faire une version encore plus propre et plus "professionnelle agence", ou une version plus courte specialement optimisee pour GPT.
