/**
 * StayEase Simple Dev Server
 * Run with: node server/simple-server.js
 * Works without MongoDB - uses db.json for all data
 */

import express from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { createServer } from "http";
import dotenv from "dotenv";
dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_FILE = path.join(__dirname, "data/db.json");

const JWT_SECRET = process.env.JWT_SECRET || "stayease_dev_secret_2024";
const PORT = process.env.PORT || 5000;

const app = express();
app.use(cors({ origin: "*", credentials: true }));
app.use(express.json());

// ── DB helpers ──────────────────────────────────────────────
async function readDb() {
  const raw = await fs.readFile(DB_FILE, "utf-8");
  return JSON.parse(raw);
}

async function writeDb(data) {
  await fs.writeFile(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
}

function makeId(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

function makeToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

function auth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, message: "No token provided." });
  }
  try {
    req.user = jwt.verify(header.split(" ")[1], JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ success: false, message: "Invalid or expired token." });
  }
}

// ── Health ───────────────────────────────────────────────────
app.get("/", (_, res) => res.json({ status: "StayEase API running", db: "json-file" }));
app.get("/api/health", (_, res) => res.json({ status: "OK", db: "json-file" }));

// ── REGISTER ─────────────────────────────────────────────────
app.post("/api/auth/register", async (req, res) => {
  try {
    const { username, name, email, password, phone } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required." });
    }

    const data = await readDb();
    const users = data.users || [];

    const cleanEmail = email.trim().toLowerCase();
    const cleanUsername = (username || name || cleanEmail.split("@")[0]).trim().toLowerCase();

    if (users.find(u => u.email === cleanEmail)) {
      return res.status(409).json({ success: false, message: "An account with this email already exists." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = {
      id: makeId("usr"),
      username: cleanUsername,
      name: (name || username || cleanUsername).trim(),
      email: cleanEmail,
      password: hashedPassword,
      phone: phone || "",
      role: "user",
      tier: "Silver Explorer",
      loyaltyPoints: 100,
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    data.users = [...users, newUser];
    await writeDb(data);

    const token = makeToken({ id: newUser.id, email: newUser.email, role: newUser.role });
    const { password: _, ...safeUser } = newUser;

    return res.status(201).json({ success: true, message: "Registration successful!", token, user: safeUser });
  } catch (err) {
    console.error("Register error:", err);
    return res.status(500).json({ success: false, message: "Server error during registration." });
  }
});

// ── LOGIN ─────────────────────────────────────────────────────
app.post("/api/auth/login", async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const identifier = (email || username || "").trim().toLowerCase();

    if (!identifier || !password) {
      return res.status(400).json({ success: false, message: "Username/email and password are required." });
    }

    const data = await readDb();
    const users = data.users || [];

    const user = users.find(
      u => u.email?.toLowerCase() === identifier || u.username?.toLowerCase() === identifier
    );

    if (!user) {
      return res.status(401).json({ success: false, message: "No account found with that username or email." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Incorrect password. Please try again." });
    }

    const token = makeToken({ id: user.id, email: user.email, role: user.role || "user" });
    const { password: _, ...safeUser } = user;

    return res.status(200).json({ success: true, message: "Login successful.", token, user: safeUser });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ success: false, message: "Server error during login." });
  }
});

// ── GET ME ───────────────────────────────────────────────────
app.get("/api/auth/me", auth, async (req, res) => {
  try {
    const data = await readDb();
    const user = (data.users || []).find(u => u.id === req.user.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found." });
    const { password: _, ...safeUser } = user;
    return res.json({ success: true, user: safeUser });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Server error." });
  }
});

// ── HOTELS ───────────────────────────────────────────────────
app.get("/api/hotels", async (req, res) => {
  try {
    const data = await readDb();
    return res.json({ success: true, hotels: data.hotels || [] });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Server error." });
  }
});

app.get("/api/hotels/:id", async (req, res) => {
  try {
    const data = await readDb();
    const hotel = (data.hotels || []).find(h => String(h.id) === String(req.params.id));
    if (!hotel) return res.status(404).json({ success: false, message: "Hotel not found." });
    return res.json({ success: true, hotel });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Server error." });
  }
});

// ── BOOKINGS ─────────────────────────────────────────────────
app.get("/api/bookings/my", auth, async (req, res) => {
  try {
    const data = await readDb();
    const bookings = (data.bookings || []).filter(b => b.userId === req.user.id);
    return res.json({ success: true, bookings });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Server error." });
  }
});

app.post("/api/bookings", auth, async (req, res) => {
  try {
    const data = await readDb();
    const booking = {
      id: makeId("bkg"),
      userId: req.user.id,
      ...req.body,
      status: "Confirmed",
      createdAt: new Date().toISOString(),
    };
    data.bookings = [...(data.bookings || []), booking];
    await writeDb(data);
    return res.status(201).json({ success: true, booking });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Server error." });
  }
});

// ── USER PROFILE ─────────────────────────────────────────────
app.get("/api/users/profile", auth, async (req, res) => {
  try {
    const data = await readDb();
    const user = (data.users || []).find(u => u.id === req.user.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found." });
    const { password: _, ...safeUser } = user;
    return res.json({ success: true, user: safeUser });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Server error." });
  }
});

app.put("/api/users/profile", auth, async (req, res) => {
  try {
    const data = await readDb();
    const idx = (data.users || []).findIndex(u => u.id === req.user.id);
    if (idx === -1) return res.status(404).json({ success: false, message: "User not found." });
    const { password: _, id: __, ...updates } = req.body;
    data.users[idx] = { ...data.users[idx], ...updates, updatedAt: new Date().toISOString() };
    await writeDb(data);
    const { password: _pw, ...safeUser } = data.users[idx];
    return res.json({ success: true, user: safeUser });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Server error." });
  }
});

app.put("/api/users/change-password", auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: "Both current and new password are required." });
    }
    const data = await readDb();
    const idx = (data.users || []).findIndex(u => u.id === req.user.id);
    if (idx === -1) return res.status(404).json({ success: false, message: "User not found." });
    const isMatch = await bcrypt.compare(currentPassword, data.users[idx].password);
    if (!isMatch) return res.status(401).json({ success: false, message: "Current password is incorrect." });
    data.users[idx].password = await bcrypt.hash(newPassword, 10);
    data.users[idx].updatedAt = new Date().toISOString();
    await writeDb(data);
    return res.json({ success: true, message: "Password changed successfully." });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Server error." });
  }
});

// ── 404 fallback ─────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.path} not found.` });
});

// ── START ─────────────────────────────────────────────────────
const server = createServer(app);

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(`\n❌ Port ${PORT} is already in use!`);
    console.error(`   Fix: Run  "npx kill-port ${PORT}"  then try again.\n`);
  } else {
    console.error("Server error:", err);
  }
  process.exit(1);
});

server.listen(PORT, () => {
  console.log("\n========================================");
  console.log(`✅ StayEase Dev Server running!`);
  console.log(`📡 http://localhost:${PORT}`);
  console.log(`🔐 Login:  POST /api/auth/login`);
  console.log(`📝 Register: POST /api/auth/register`);
  console.log(`🏨 Hotels: GET  /api/hotels`);
  console.log("========================================\n");
});
