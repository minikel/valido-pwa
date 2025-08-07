// backend/server.js
require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const xlsx = require('xlsx');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Configuration de la connexion à la base de données
const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
};

async function getDbConnection() {
    return await mysql.createConnection(dbConfig);
}

// Fonction pour écrire dans le fichier Excel VALIDATION
async function writeValidationToExcel(commande, nom, date) {
    const filePath = './VALIDATION.xlsx';
    let workbook;
    let worksheet;

    try {
        workbook = xlsx.readFile(filePath);
        worksheet = workbook.Sheets['Validation'];
        if (!worksheet) {
            workbook = xlsx.utils.book_new();
            worksheet = xlsx.utils.json_to_sheet([
                { Commande: commande, 'Nom Complet': nom, 'Date et Heure': date }
            ]);
            xlsx.utils.book_append_sheet(workbook, worksheet, 'Validation');
        } else {
            const data = xlsx.utils.sheet_to_json(worksheet);
            data.push({ Commande: commande, 'Nom Complet': nom, 'Date et Heure': date });
            worksheet = xlsx.utils.aoa_to_sheet(data.map(row => Object.values(row))); // Convertir en tableau de tableaux pour aoa_to_sheet
            workbook.Sheets['Validation'] = worksheet;
        }
    } catch (error) {
        workbook = xlsx.utils.book_new();
        worksheet = xlsx.utils.json_to_sheet([
            { Commande: commande, 'Nom Complet': nom, 'Date et Heure': date }
        ]);
        xlsx.utils.book_append_sheet(workbook, worksheet, 'Validation');
    }

    xlsx.writeFile(workbook, filePath);
    console.log(`Validation enregistrée dans le fichier Excel : ${filePath}`);
}

// --- Routes API ---

app.get('/api/search/:orderCode', async (req, res) => {
    const { orderCode } = req.params;
    try {
        const connection = await getDbConnection();
        const [rows] = await connection.execute(
            'SELECT produit, description, quantite FROM orders_data WHERE commande = ?',
            [orderCode]
        );
        await connection.end();
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Commande non trouvée ou aucun produit associé.' });
        }
        res.json(rows);
    } catch (error) {
        console.error('Erreur lors de la recherche de commande :', error);
        res.status(500).json({ message: 'Erreur interne du serveur.' });
    }
});

app.post('/api/validate', async (req, res) => {
    const { numeroCommande, nomUtilisateur } = req.body;
    if (!numeroCommande || !nomUtilisateur) {
        return res.status(400).json({ message: 'Numéro de commande et nom d\'utilisateur sont requis.' });
    }

    try {
        const connection = await getDbConnection();
        const [result] = await connection.execute(
            'INSERT INTO scan_validations (numero_commande, nom_utilisateur) VALUES (?, ?)',
            [numeroCommande, nomUtilisateur]
        );
        await connection.end();

        const now = new Date();
        const dateString = now.toLocaleString('fr-FR', {
            year: 'numeric',
            month: 'numeric',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
        await writeValidationToExcel(numeroCommande, nomUtilisateur, dateString);

        res.status(201).json({ message: 'Validation enregistrée avec succès.' });
    } catch (error) {
        console.error('Erreur lors de l\'enregistrement de la validation :', error);
        res.status(500).json({ message: 'Erreur interne du serveur.' });
    }
});

// Nouvelle route pour récupérer toutes les validations avec filtres
app.get('/api/validations', async (req, res) => {
    const { dateRange, orderCode, userName } = req.query;
    let query = 'SELECT numero_commande, nom_utilisateur, date_validation FROM scan_validations WHERE 1=1';
    const params = [];

    // Filtrer par date
    if (dateRange) {
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Début de la journée

        if (dateRange === 'today') {
            query += ' AND DATE(date_validation) = CURDATE()';
        } else if (dateRange === 'yesterday') {
            query += ' AND DATE(date_validation) = CURDATE() - INTERVAL 1 DAY';
        } else if (dateRange === 'last_week') {
            query += ' AND date_validation >= CURDATE() - INTERVAL 7 DAY AND date_validation < CURDATE()';
        }
    }

    // Filtrer par code de commande
    if (orderCode) {
        query += ' AND numero_commande LIKE ?';
        params.push(`%${orderCode.trim()}%`);
    }

    // Filtrer par nom d'utilisateur
    if (userName) {
        query += ' AND nom_utilisateur LIKE ?';
        params.push(`%${userName.trim()}%`);
    }

    query += ' ORDER BY date_validation DESC';

    try {
        const connection = await getDbConnection();
        const [rows] = await connection.execute(query, params);
        await connection.end();
        res.json(rows);
    } catch (error) {
        console.error('Erreur lors de la récupération des validations :', error);
        res.status(500).json({ message: 'Erreur interne du serveur.' });
    }
});

app.listen(port, () => {
    console.log(`Serveur backend démarré sur http://localhost:${port}`);
});
