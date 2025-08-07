VALIDO - Gestionnaire de Commandes PWADescription du ProjetVALIDO est une Progressive Web App (PWA) conçue pour optimiser le processus de validation des commandes dans un environnement de production. Elle permet aux opérateurs de rechercher des commandes, de scanner les codes produits (via saisie manuelle, scanner dédié ou caméra d'appareil mobile) et de valider les expéditions, tout en assurant une synchronisation continue des données avec la base de données.FonctionnalitésRecherche de Commandes : Recherchez des commandes par leur code.Scan de Produits : Scannez les codes produits pour vérifier leur correspondance avec la commande.Indicateurs visuels (vert/rouge) pour le statut du scan.Supporte la saisie manuelle, les scanners de codes-barres HID (qui émulent un clavier) et le scan par caméra via téléphone/tablette.Validation de Commande : Formulaire de validation avec signature (nom complet de l'opérateur), date et heure.Historique des Validations : Affiche la liste des commandes validées avec des options de filtre par date, code commande et nom d'utilisateur.Synchronisation des Données : Les données des commandes sont synchronisées depuis un fichier Excel source vers une base de données MySQL.Méthode de Synchronisation : Une macro VBA dans le fichier Excel source envoie le fichier mis à jour à une API backend, qui synchronise ensuite la base de données.Technologies UtiliséesBackend : Node.js (Express.js)Base de données : MySQLFrontend : React.js (avec Vite pour le build)Styling : Tailwind CSSScan de Codes-barres : QuaggaJS (pour le scan par caméra)Gestion des versions de Node.js : NVM (Node Version Manager)Serveur Web : NginxGestion des Processus : systemd (pour les services backend)ArchitectureLe projet est divisé en deux parties principales :Backend (Node.js) :Expose une API REST pour la recherche de commandes, l'enregistrement des validations et la récupération de l'historique des validations.Comprend une API dédiée (/api/upload-excel) pour recevoir le fichier Excel source et synchroniser la base de données MySQL.Frontend (React) :Application web progressive (PWA) offrant l'interface utilisateur.Communique avec le backend via des requêtes HTTP.PrérequisAvant de commencer, assurez-vous d'avoir les éléments suivants :MySQL Server : Installé et configuré sur votre serveur Ubuntu.Node.js & npm : Installés sur votre machine de développement et sur le serveur Ubuntu (via NVM sur le serveur).Git : Installé sur votre machine de développement.Un fichier Excel source (Data_order.xlsx) avec les colonnes #Commande, Produit, Description, Quantite dans une feuille nommée data.Installation et Configuration (Machine Locale)Ces étapes sont pour le développement local. Pour le déploiement sur serveur, référez-vous à la section "Déploiement sur Serveur Ubuntu".1. Cloner le Dépôtgit clone <URL_DE_VOTRE_DEPOT_GITHUB>
cd order-pwa
2. Configuration du Backendcd backend
npm install
Créez un fichier .env à la racine du dossier backend et configurez vos identifiants MySQL locaux :DB_HOST=localhost
DB_USER=votre_utilisateur_mysql
DB_PASSWORD=votre_mot_de_passe_mysql
DB_DATABASE=order_pwa
PORT=5000
3. Configuration de la Base de Données MySQL (Locale)Connectez-vous à votre serveur MySQL local et exécutez les requêtes SQL suivantes pour créer la base de données et les tables :CREATE DATABASE IF NOT EXISTS order_pwa;
USE order_pwa;

CREATE TABLE IF NOT EXISTS orders_data (
    id INT AUTO_INCREMENT PRIMARY KEY,
    commande VARCHAR(255) NOT NULL,
    produit VARCHAR(255) NOT NULL,
    description TEXT,
    quantite INT DEFAULT 0,
    UNIQUE KEY (commande, produit)
);

CREATE TABLE IF NOT EXISTS scan_validations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    numero_commande VARCHAR(255) NOT NULL,
    nom_utilisateur VARCHAR(255) NOT NULL,
    date_validation DATETIME DEFAULT CURRENT_TIMESTAMP
);
Créez un utilisateur MySQL dédié avec les permissions sur order_pwa et mettez à jour votre .env avec ces identifiants.4. Configuration du Frontendcd ../frontend
npm install
5. Configuration de Vite pour HTTPS (Développement Local)Modifiez frontend/vite.config.js pour activer HTTPS pour le développement local (nécessaire pour la caméra) :import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import mkcert from 'vite-plugin-mkcert';

export default defineConfig({
  plugins: [react(), mkcert()],
  server: {
    https: true,
  },
  base: './', // Important pour les chemins relatifs
});
6. Lancement des Applications (Locale)Lancer le Backend :cd backend
node server.js
Lancer le Frontend :cd ../frontend
npm run dev
Déploiement sur Serveur Ubuntu1. Préparation du Serveur UbuntuConnectez-vous via SSH : ssh sga@192.168.100.77Mettez à jour le système : sudo apt update && sudo apt upgrade -yInstallez Nginx : sudo apt install -y nginxDésinstallez toute version globale de Node.js/npm/PM2 pour éviter les conflits.Installez NVM : curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bashFermez et rouvrez votre session SSH.Installez Node.js LTS via NVM : nvm install --ltsNotez le chemin exact de l'exécutable Node.js (nvm which current).2. Déploiement du BackendCopiez le dossier backend depuis votre machine locale vers /var/www/order-pwa-backend sur le serveur :scp -r "C:\Users\nmichel\Documents\RÉALISATIONS\NIKELSON MICHEL\LEMNISCATE SERVICE-CONSEIL\CREATION DE LOGICIEL\order-pwa\backend\." sga@192.168.100.77:/var/www/order-pwa-backend
Sur le serveur, naviguez vers /var/www/order-pwa-backend et installez les dépendances : npm install.Configurez le fichier .env sur le serveur avec les identifiants MySQL du serveur.Créez les services systemd (order-pwa-api.service et order-pwa-sync.service) dans /etc/systemd/system/.Utilisez le chemin NVM Node.js noté précédemment dans ExecStart.Exemple pour order-pwa-api.service:[Unit]
Description=Node.js API for Order PWA
After=network.target mysql.service

[Service]
ExecStart=/bin/bash -lc 'source /home/sga/.nvm/nvm.sh && node /var/www/order-pwa-backend/server.js'
WorkingDirectory=/var/www/order-pwa-backend
Restart=always
User=sga

[Install]
WantedBy=multi-user.target
Faites de même pour order-pwa-sync.service en remplaçant server.js par syncData.js.Activez et démarrez les services systemd :sudo systemctl daemon-reload
sudo systemctl enable order-pwa-api.service order-pwa-sync.service
sudo systemctl start order-pwa-api.service order-pwa-sync.service
Vérifiez le statut : sudo systemctl status order-pwa-api.service order-pwa-sync.service3. Déploiement du FrontendSur votre machine locale, modifiez frontend/src/App.jsx pour que API_BASE_URL pointe vers http://192.168.100.77:5000/api.Re-construisez le frontend sur votre machine locale : cd frontend && npm run build.Copiez le contenu du dossier dist vers /var/www/order-pwa-frontend sur le serveur :scp -r "C:\Users\nmichel\Documents\RÉALISATIONS\NIKELSON MICHEL\LEMNISCATE SERVICE-CONSEIL\CREATION DE LOGICIEL\order-pwa\frontend\dist\." sga@192.168.100.77:/var/www/order-pwa-frontend
Configurez Nginx sur le serveur (/etc/nginx/sites-available/order-pwa) :server {
    listen 80;
    server_name 192.168.100.77;

    root /var/www/order-pwa-frontend;
    index index.html index.htm;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
Activez et redémarrez Nginx :sudo ln -s /etc/nginx/sites-available/order-pwa /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default # Si présent
sudo nginx -t && sudo systemctl restart nginx
4. Configuration de la Macro Excel (VBA)Ouvrez Data_order.xlsm sur votre machine Windows.Appuyez sur Alt + F11 pour l'éditeur VBA.Dans ThisWorkbook, collez le code VBA fourni précédemment (qui utilise ADODB.Stream et envoie le fichier à http://192.168.100.77:5000/api/upload-excel).Activez la référence "Microsoft ActiveX Data Objects X.X Library" (Outils > Références...).Enregistrez le fichier au format .xlsm.UtilisationAccédez à VALIDO : Ouvrez votre navigateur et allez à http://192.168.100.77.Synchronisez les données : Ouvrez et fermez votre fichier Data_order.xlsm (ou exécutez la macro LancerSynchronisationManuellement via Développeur > Macros).Testez les fonctionnalités : Recherchez des commandes, scannez des produits et validez des expéditions.DépannagePage blanche / Erreur 403/500 : Vérifiez les logs Nginx (sudo tail -f /var/log/nginx/error.log).Backend ne démarre pas : Vérifiez les logs des services systemd (sudo journalctl -u <nom_service>.service --no-pager).Données non synchronisées : Vérifiez les logs de order-pwa-sync.service et le contenu de votre base de données MySQL.Macro Excel échoue : Vérifiez les messages d'erreur de la macro et assurez-vous que l'URL du backend est correcte et accessible depuis la machine Windows.