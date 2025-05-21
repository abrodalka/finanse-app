const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const fs = require('fs');

const app = express();
const PORT = 4000;
const logFile = './log.json';

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Połączenie z bazą danych SQLite
const db = new sqlite3.Database('./baza.db', (err) => {
  if (err) {
    console.error('Błąd połączenia z bazą danych:', err.message);
  } else {
    console.log('Połączono z bazą danych SQLite.');
  }
});

// Tworzenie tabeli, jeśli nie istnieje
db.run(`
  CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT,
    category TEXT,
    amount REAL,
    date TEXT
  )
`);

// Tymczasowe dane testowe — do usunięcia po pierwszym uruchomieniu
const insertSampleData = () => {
  const sample = [
    ['Wydatek', 'Jedzenie', 80.00, '2025-05-01'],
    ['Wydatek', 'Transport', 50.00, '2025-05-02'],
    ['Wydatek', 'Rozrywka', 120.00, '2025-05-03'],
    ['Przychód', 'Wynagrodzenie', 4500.00, '2025-05-01'],
    ['Wydatek', 'Zakupy', 230.00, '2025-05-05'],
    ['Wydatek', 'Zdrowie', 90.00, '2025-05-06']
  ];

  const sql = 'INSERT INTO transactions (type, category, amount, date) VALUES (?, ?, ?, ?)';
  sample.forEach(row => {
    db.run(sql, row);
  });
};

// insertSampleData(); // Odkomentuj tylko przy pierwszym uruchomieniu

// Pobieranie wszystkich transakcji
app.get('/transactions', (req, res) => {
  db.all('SELECT * FROM transactions', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// Dodawanie nowej transakcji
app.post('/transactions', (req, res) => {
  const { type, category, amount, date } = req.body;

  if (!type || !category || !amount || !date) {
    return res.status(400).json({ error: 'Brakuje wymaganych pól.' });
  }

  const sql = 'INSERT INTO transactions (type, category, amount, date) VALUES (?, ?, ?, ?)';
  const params = [type, category, amount, date];

  db.run(sql, params, function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    // Zapisz log do pliku JSON
    const logEntry = {
      timestamp: new Date().toISOString(),
      action: 'Dodano transakcję',
      data: { id: this.lastID, type, category, amount, date }
    };

    fs.appendFile(logFile, JSON.stringify(logEntry) + ',\n', (err) => {
      if (err) console.error('Błąd zapisu logu:', err);
    });

    res.status(201).json({ id: this.lastID, type, category, amount, date });
  });
});

// Start serwera
app.listen(PORT, () => {
  console.log(`Serwer działa na porcie ${PORT}`);
});
