import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import { sql } from "@vercel/postgres";
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

const usePostgres = !!process.env.POSTGRES_URL;
let db: any;

if (!usePostgres) {
  db = new Database("referrals.db");
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
} else {
  (async () => {
    try {
      await sql`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          firstName VARCHAR(255) NOT NULL,
          lastName VARCHAR(255) NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          phone VARCHAR(255) NOT NULL,
          code VARCHAR(255) UNIQUE NOT NULL
        )
      `;
    } catch (e) {
      console.error("Postgres init error:", e);
    }
  })();
}

// Generate available codes KSB00 to KSB25
const ALL_CODES = Array.from({ length: 26 }, (_, i) => `KSB${i.toString().padStart(2, '0')}`);

app.post("/api/register", async (req, res) => {
  const { firstName, lastName, email, phone } = req.body;

  if (!firstName || !lastName || !email || !phone) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    if (usePostgres) {
      const { rows: existingUsers } = await sql`SELECT code FROM users WHERE email = ${email}`;
      if (existingUsers.length > 0) {
        return res.json({ code: existingUsers[0].code, message: "Welcome back! Here is your existing code." });
      }

      const { rows: assignedCodes } = await sql`SELECT code FROM users`;
      const assignedCodeSet = new Set(assignedCodes.map(c => c.code));
      const availableCode = ALL_CODES.find(code => !assignedCodeSet.has(code));

      if (!availableCode) {
        return res.status(400).json({ error: "Sorry, all referral codes have been claimed." });
      }

      await sql`
        INSERT INTO users (firstName, lastName, email, phone, code) 
        VALUES (${firstName}, ${lastName}, ${email}, ${phone}, ${availableCode})
      `;
      return res.json({ code: availableCode, message: "Registration successful!" });
    } else {
      const existingUser = db.prepare("SELECT code FROM users WHERE email = ?").get(email) as { code: string } | undefined;
      if (existingUser) {
        return res.json({ code: existingUser.code, message: "Welcome back! Here is your existing code." });
      }

      const assignedCodes = db.prepare("SELECT code FROM users").all() as { code: string }[];
      const assignedCodeSet = new Set(assignedCodes.map(c => c.code));
      const availableCode = ALL_CODES.find(code => !assignedCodeSet.has(code));

      if (!availableCode) {
        return res.status(400).json({ error: "Sorry, all referral codes have been claimed." });
      }

      const stmt = db.prepare("INSERT INTO users (firstName, lastName, email, phone, code) VALUES (?, ?, ?, ?, ?)");
      stmt.run(firstName, lastName, email, phone, availableCode);

      return res.json({ code: availableCode, message: "Registration successful!" });
    }
  } catch (error: any) {
    if (usePostgres && error.message && error.message.includes('unique constraint')) {
       return res.status(400).json({ error: "This email is already registered." });
    } else if (!usePostgres && error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
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
app.get("/api/admin/users", authenticate, async (req, res) => {
  try {
    if (usePostgres) {
      const { rows: users } = await sql`SELECT * FROM users ORDER BY id DESC`;
      res.json(users);
    } else {
      const users = db.prepare("SELECT * FROM users ORDER BY id DESC").all();
      res.json(users);
    }
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

  // Only listen if we are not running on Vercel
  if (!process.env.VERCEL) {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  }
}

startServer();

// Export the app for Vercel serverless functions
export default app;
