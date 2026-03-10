import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import jwt from "jsonwebtoken";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

const JWT_SECRET = process.env.JWT_SECRET || "super-secret-key-for-dev";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";

app.use(express.json());

// Initialize SQLite Database
const db = new Database("referrals.db");

// Create table if it doesn't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    firstName TEXT NOT NULL,
    lastName TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT NOT NULL,
    code TEXT UNIQUE NOT NULL
  )
`);

// Generate available codes KSB00 to KSB25
const ALL_CODES = Array.from({ length: 26 }, (_, i) => `KSB${i.toString().padStart(2, '0')}`);

app.post("/api/register", (req, res) => {
  const { firstName, lastName, email, phone } = req.body;

  if (!firstName || !lastName || !email || !phone) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    // Check if user already exists
    const existingUser = db.prepare("SELECT code FROM users WHERE email = ?").get(email) as { code: string } | undefined;
    if (existingUser) {
      return res.json({ code: existingUser.code, message: "Welcome back! Here is your existing code." });
    }

    // Get assigned codes
    const assignedCodes = db.prepare("SELECT code FROM users").all() as { code: string }[];
    const assignedCodeSet = new Set(assignedCodes.map(c => c.code));

    // Find first available code
    const availableCode = ALL_CODES.find(code => !assignedCodeSet.has(code));

    if (!availableCode) {
      return res.status(400).json({ error: "Sorry, all referral codes have been claimed." });
    }

    // Insert new user
    const stmt = db.prepare("INSERT INTO users (firstName, lastName, email, phone, code) VALUES (?, ?, ?, ?, ?)");
    stmt.run(firstName, lastName, email, phone, availableCode);

    res.json({ code: availableCode, message: "Registration successful!" });
  } catch (error: any) {
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
       return res.status(400).json({ error: "This email is already registered." });
    }
    console.error("Database error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Admin Login Route
app.post("/api/admin/login", (req, res) => {
  const { password } = req.body;
  
  if (password === ADMIN_PASSWORD) {
    const token = jwt.sign({ admin: true }, JWT_SECRET, { expiresIn: '1d' });
    res.json({ token });
  } else {
    res.status(401).json({ error: "Invalid password" });
  }
});

// Middleware to protect admin routes
const authenticate = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const token = req.headers.authorization?.split(" ")[1];
  
  if (!token) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  
  try {
    jwt.verify(token, JWT_SECRET);
    next();
  } catch (err) {
    res.status(401).json({ error: "Invalid token" });
  }
};

// Protected Admin Route to get all users
app.get("/api/admin/users", authenticate, (req, res) => {
  try {
    const users = db.prepare("SELECT * FROM users ORDER BY id DESC").all();
    res.json(users);
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    // SPA fallback for production
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
