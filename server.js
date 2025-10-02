
const express = require('express');
const jwt = require('jsonwebtoken');
const mysql = require('mysql2');

// ===============================
// Setup Express
// ===============================
const app = express();
const port = 3000;
app.use(express.json());

// ===============================
// Setup MySQL (ganti sesuai konfigurasi kamu)
// ===============================
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',  // ganti kalau pakai password
  database: 'testdb' // ganti sesuai DB kamu
});

// ===============================
// JWT Setup
// ===============================
const SECRET_KEY = "rahasia-super-aman"; // sebaiknya simpan di .env

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Format: Bearer <token>

  if (!token) return res.status(401).json({ message: 'Access Denied: No token provided' });

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) return res.status(403).json({ message: 'Invalid Token' });
    req.user = user;
    next();
  });
}

// ===============================
// ROUTES
// ===============================

// Root
app.get('/', (req, res) =>
  res.send(`Congratualations! Your Express server is running. ${port}`)
);

// Login (dummy user)
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  // Dummy login → username: admin, password: 12345
  if (username === "admin" && password === "12345") {
    const user = { username };
    const token = jwt.sign(user, SECRET_KEY, { expiresIn: '1h' });
    res.json({ token });
  } else {
    res.status(401).json({ message: "Username/password salah!" });
  }
});

// GET Dummy (Protected)
app.get('/dummy-get', authenticateToken, (req, res) =>
  res.json({ message: 'This is a protected dummy GET API', user: req.user })
);

// POST Dummy (Protected + contoh SQL Injection safe insert)
app.post('/dummy-post', authenticateToken, (req, res) => {
  const { name, email } = req.body;

  // Simpan ke database dengan prepared statement → aman dari SQL Injection
  const query = "INSERT INTO users (name, email) VALUES (?, ?)";
  db.execute(query, [name, email], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({
      message: "This is a protected dummy POST API",
      inserted: { name, email }
    });
  });
});

// DELETE Dummy (Protected)
app.delete('/dummy-delete/:id', authenticateToken, (req, res) => {
  const { id } = req.params;

  // Hapus dari database dengan prepared statement
  const query = "DELETE FROM users WHERE id = ?";
  db.execute(query, [id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });

    res.json({
      message: `This is a protected dummy DELETE API, user dengan id ${id} berhasil dihapus`
    });
  });
});

// ===============================
// Run Server
// ===============================
app.listen(port, () => console.log(`Example app listening on port ${port}!`));
