import express from "express";
import pg from "pg";
import path from "path";
import jwt from "jsonwebtoken";

const { Pool } = pg;

const app = express();
const PORT = 3000;

const JWT_SECRET = process.env.JWT_SECRET || "super-secret-key-for-dev";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";

app.use(express.json());

const postgresUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.STORAGE_URL;
const usePostgres = !!postgresUrl;

let sqliteDb: any;
let pgPool: any;

if (!usePostgres) {
  // Use dynamic import for better-sqlite3 so it doesn't crash Vercel if the binary is missing
  import("better-sqlite3").then(({ default: Database }) => {
    sqliteDb = new Database("referrals.db");
    sqliteDb.exec(`
      CREATE TABLE IF NOT EXISTS registrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        fullName TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        phone TEXT NOT NULL,
        gender TEXT NOT NULL,
        institution TEXT NOT NULL,
        courseOfStudy TEXT NOT NULL,
        yearOfStudy TEXT NOT NULL,
        hasGcbAccount TEXT NOT NULL DEFAULT 'No',
        gcbAccountNumber TEXT,
        osChoice TEXT NOT NULL DEFAULT 'Android'
      )
    `);

    try {
      sqliteDb.exec(`ALTER TABLE registrations ADD COLUMN hasGcbAccount TEXT NOT NULL DEFAULT 'No'`);
    } catch (e) {}
    try {
      sqliteDb.exec(`ALTER TABLE registrations ADD COLUMN gcbAccountNumber TEXT`);
    } catch (e) {}
    try {
      sqliteDb.exec(`ALTER TABLE registrations ADD COLUMN osChoice TEXT NOT NULL DEFAULT 'Android'`);
    } catch (e) {}
  }).catch(e => console.error("SQLite init error:", e));
} else {
  pgPool = new Pool({
    connectionString: postgresUrl,
    ssl: { rejectUnauthorized: false }
  });
  
  (async () => {
    try {
      await pgPool.query(`
        CREATE TABLE IF NOT EXISTS registrations (
          id SERIAL PRIMARY KEY,
          fullName VARCHAR(255) NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          phone VARCHAR(255) NOT NULL,
          gender VARCHAR(50) NOT NULL,
          institution VARCHAR(255) NOT NULL,
          courseOfStudy VARCHAR(255) NOT NULL,
          yearOfStudy VARCHAR(50) NOT NULL,
          hasGcbAccount VARCHAR(10) NOT NULL DEFAULT 'No',
          gcbAccountNumber VARCHAR(255),
          osChoice VARCHAR(50) NOT NULL DEFAULT 'Android'
        )
      `);

      // Add columns if they don't exist (for existing databases)
      try {
        await pgPool.query(`ALTER TABLE registrations ADD COLUMN hasGcbAccount VARCHAR(10) NOT NULL DEFAULT 'No'`);
      } catch (e) {}
      try {
        await pgPool.query(`ALTER TABLE registrations ADD COLUMN gcbAccountNumber VARCHAR(255)`);
      } catch (e) {}
      try {
        await pgPool.query(`ALTER TABLE registrations ADD COLUMN osChoice VARCHAR(50) NOT NULL DEFAULT 'Android'`);
      } catch (e) {}
    } catch (e) {
      console.error("Postgres init error:", e);
    }
  })();
}

app.post("/api/register", async (req, res) => {
  const { fullName, email, phone, gender, institution, courseOfStudy, yearOfStudy, hasGcbAccount, gcbAccountNumber, osChoice } = req.body;

  if (!fullName || !email || !phone || !gender || !institution || !courseOfStudy || !yearOfStudy || !hasGcbAccount || !osChoice) {
    return res.status(400).json({ error: "All required fields must be filled" });
  }

  const downloadLink = osChoice === 'iOS' 
    ? 'https://apps.apple.com/us/app/beyondthehustleapp/id6757446450'
    : 'https://play.google.com/store/apps/details?id=com.selasi_godfred.beyondTheHustleApp&pcampaignid=web_share';

  try {
    if (usePostgres) {
      const { rows: existingUsers } = await pgPool.query('SELECT * FROM registrations WHERE email = $1 OR phone = $2', [email, phone]);
      if (existingUsers.length > 0) {
        const existingOsChoice = existingUsers[0].osChoice || existingUsers[0].oschoice || 'Android';
        return res.json({ link: downloadLink, osChoice: existingOsChoice, message: "Welcome back! Here is your download link." });
      }

      await pgPool.query(
        'INSERT INTO registrations (fullName, email, phone, gender, institution, courseOfStudy, yearOfStudy, hasGcbAccount, gcbAccountNumber, osChoice) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)',
        [fullName, email, phone, gender, institution, courseOfStudy, yearOfStudy, hasGcbAccount, gcbAccountNumber || null, osChoice]
      );
      return res.json({ link: downloadLink, osChoice, message: "Registration successful!" });
    } else {
      if (!sqliteDb) {
        return res.status(500).json({ error: "Database not initialized. If you are on Vercel, please ensure you have connected a Postgres database." });
      }
      const existingUser = sqliteDb.prepare("SELECT * FROM registrations WHERE email = ? OR phone = ?").get(email, phone) as any;
      if (existingUser) {
        const existingOsChoice = existingUser.osChoice || existingUser.oschoice || 'Android';
        return res.json({ link: downloadLink, osChoice: existingOsChoice, message: "Welcome back! Here is your download link." });
      }

      const stmt = sqliteDb.prepare("INSERT INTO registrations (fullName, email, phone, gender, institution, courseOfStudy, yearOfStudy, hasGcbAccount, gcbAccountNumber, osChoice) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
      stmt.run(fullName, email, phone, gender, institution, courseOfStudy, yearOfStudy, hasGcbAccount, gcbAccountNumber || null, osChoice);

      return res.json({ link: downloadLink, osChoice, message: "Registration successful!" });
    }
  } catch (error: any) {
    if (usePostgres && error.code === '23505') { // Postgres unique violation
       return res.status(400).json({ error: "This email is already registered." });
    } else if (!usePostgres && error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
       return res.status(400).json({ error: "This email is already registered." });
    }
    console.error("Database error:", error);
    res.status(500).json({ error: "Internal server error: " + (error.message || String(error)) });
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
      const { rows: users } = await pgPool.query('SELECT id, fullName, email, phone, gender, institution, courseOfStudy, yearOfStudy, hasGcbAccount, gcbAccountNumber, osChoice FROM registrations ORDER BY id DESC');
      res.json(users);
    } else {
      const users = sqliteDb.prepare("SELECT * FROM registrations ORDER BY id DESC").all();
      res.json(users);
    }
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// Protected Admin Route to reset data
app.post("/api/admin/reset", authenticate, async (req, res) => {
  try {
    if (usePostgres) {
      await pgPool.query('TRUNCATE TABLE registrations RESTART IDENTITY');
    } else {
      sqliteDb.prepare("DELETE FROM registrations").run();
      // Reset sqlite autoincrement
      sqliteDb.prepare("DELETE FROM sqlite_sequence WHERE name='registrations'").run();
    }
    res.json({ message: "Data reset successfully" });
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ error: "Failed to reset data" });
  }
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(process.cwd(), "dist")));
    // SPA fallback for production
    app.get('*', (req, res) => {
      res.sendFile(path.join(process.cwd(), 'dist', 'index.html'));
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
