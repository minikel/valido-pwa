// backend/syncData.js

const mysql = require('mysql2/promise');
const xlsx = require('xlsx');
const cron = require('node-cron');
require('dotenv').config();

const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
};

const excelFilePath = './Data_order.xlsx';

async function syncDataWithDatabase() {
    let connection;
    try {
        console.log(`[${new Date().toLocaleString()}] Début de la synchronisation...`);
        connection = await mysql.createConnection(dbConfig);
        const workbook = xlsx.readFile(excelFilePath);
        const sheetName = workbook.SheetNames.find(name => name.toLowerCase() === 'data');
        if (!sheetName) {
            throw new Error('La feuille de calcul "data" est introuvable.');
        }

        const worksheet = workbook.Sheets[sheetName];
        const rows = xlsx.utils.sheet_to_json(worksheet, { header: 1 });

        const headers = rows[0];
        const commandeIndex = headers.indexOf('# commande');
        const produitsIndex = headers.indexOf('Produit');
        const descriptionIndex = headers.indexOf('Description');
        const quantityIndex = headers.indexOf('Quantite');

        if (commandeIndex === -1 || produitsIndex === -1) {
            throw new Error('Colonnes "# commande" ou "Produit" introuvables.');
        }

        const dataToInsert = [];
        const uniqueEntries = new Set();
        
        for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            const commande = row[commandeIndex]?.toString().trim() || ''; // NETTOYAGE DES ESPACES
            const produit = row[produitsIndex]?.toString().trim() || '';   // NETTOYAGE DES ESPACES
            const description = row[descriptionIndex];
            const quantity = row[quantityIndex];
            
            if (commande && produit) {
                const uniqueKey = `${commande}-${produit}`;
                if (!uniqueEntries.has(uniqueKey)) {
                    dataToInsert.push([commande, produit, description || null, quantity || 0]);
                    uniqueEntries.add(uniqueKey);
                }
            }
        }
        
        await connection.beginTransaction();
        await connection.execute('TRUNCATE TABLE orders_data');
        
        if (dataToInsert.length > 0) {
            const query = 'INSERT INTO orders_data (commande, produit, description, quantite) VALUES (?, ?, ?, ?)';
            for (const record of dataToInsert) {
                await connection.execute(query, record);
            }
        }
        
        await connection.commit();
        
        console.log(`[${new Date().toLocaleString()}] Synchronisation terminée. ${dataToInsert.length} enregistrements importés.`);
    } catch (error) {
        console.error(`[${new Date().toLocaleString()}] Erreur de synchronisation :`, error);
        if (connection) {
            await connection.rollback();
        }
    } finally {
        if (connection) {
            connection.end();
        }
    }
}

cron.schedule('* * * * *', syncDataWithDatabase);
console.log('Le script de synchronisation est démarré et s\'exécutera toutes les minutes.');

syncDataWithDatabase();
