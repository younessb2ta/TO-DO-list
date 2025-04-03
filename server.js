// Importation des modules nécessaires
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const path = require('path');

// Initialisation de l'application Express
const app = express();

// Configuration des middlewares
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Configuration de la connexion à la base de données MySQL
const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'todo_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Route pour récupérer toutes les tâches
app.get('/api/tasks', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM tasks ORDER BY due_date ASC');
        res.json(rows);
    } catch (error) {
        console.error('Error fetching tasks:', error);
        res.status(500).json({ error: 'Failed to fetch tasks' });
    }
});

// Route pour ajouter une nouvelle tâche
app.post('/api/tasks', async (req, res) => {
    const { text, dueDate } = req.body;
    
    if (!text || !dueDate) {
        return res.status(400).json({ error: 'Task text and due date are required' });
    }
    
    try {
        const [result] = await pool.query(
            'INSERT INTO tasks (task_text, due_date) VALUES (?, ?)',
            [text, dueDate]
        );
        
        res.status(201).json({
            id: result.insertId,
            task_text: text,
            due_date: dueDate
        });
    } catch (error) {
        console.error('Error adding task:', error);
        res.status(500).json({ error: 'Failed to add task' });
    }
});

// Route pour supprimer une tâche
app.delete('/api/tasks/:id', async (req, res) => {
    const { id } = req.params;
    
    try {
        await pool.query('DELETE FROM tasks WHERE id = ?', [id]);
        res.status(200).json({ message: 'Task deleted successfully' });
    } catch (error) {
        console.error('Error deleting task:', error);
        res.status(500).json({ error: 'Failed to delete task' });
    }
});

// Route pour mettre à jour le statut d'une tâche (complétée/non complétée)
app.put('/api/tasks/:id/status', async (req, res) => {
    const { id } = req.params;
    const { completed } = req.body;
    
    try {
        await pool.query(
            'UPDATE tasks SET completed = ? WHERE id = ?',
            [completed, id]
        );
        
        res.status(200).json({
            message: 'Task status updated successfully',
            id,
            completed
        });
    } catch (error) {
        console.error('Error updating task status:', error);
        res.status(500).json({ error: 'Failed to update task status' });
    }
});

// Route pour mettre à jour le texte et la date d'une tâche
app.put('/api/tasks/:id', async (req, res) => {
    const { text, dueDate } = req.body;
    
    try {
        await pool.query(
            'UPDATE tasks SET task_text = ?, due_date = ? WHERE id = ?',
            [text, dueDate, req.params.id]
        );
        res.json({ message: 'Task updated successfully' });
    } catch (error) {
        console.error('Error updating task:', error);
        res.status(500).json({ error: 'Failed to update task' });
    }
});

// Gestion du routage côté client pour les applications monopages
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Démarrage du serveur sur le port 5000
const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));