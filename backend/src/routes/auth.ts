import { Router } from "express";
import { db, ensureUserSettings } from "../db.js";
import { signToken } from "../auth.js";

export const authRouter = Router();

authRouter.post("/register", async (req, res) => {
  if (process.env.DISABLE_REGISTRATION === "true") {
    return res.status(403).json({ error: "Registration is disabled" });
  }
  const username = String(req.body?.username ?? "").trim().toLowerCase();
  const displayName = String(req.body?.displayName ?? "").trim() || username;
  const password = String(req.body?.password ?? "");

  if (!username || !password) {
    return res.status(400).json({ error: "Username and password are required" });
  }

  const exists = db.prepare(`SELECT id FROM users WHERE username = ?`).get(username) as
    | { id: number }
    | undefined;
  if (exists) {
    return res.status(409).json({ error: "Username already exists" });
  }

  const userCountRow = db.prepare(`SELECT COUNT(*) as count FROM users`).get() as { count: number };
  const isAdmin = userCountRow.count === 0;

  const passwordHash = await Bun.password.hash(password, {
    algorithm: "bcrypt",
    cost: 10,
  });
  const insert = db
    .prepare(
      `INSERT INTO users (username, display_name, is_admin, password_hash) VALUES (?, ?, ?, ?)`,
    )
    .run(username, displayName, isAdmin ? 1 : 0, passwordHash);

  const userId = Number(insert.lastInsertRowid);
  ensureUserSettings(userId);
  const token = signToken({ userId, username });

  res.cookie("token", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    maxAge: 14 * 24 * 60 * 60 * 1000,
  });
  return res.json({ token, user: { id: userId, username, displayName, isAdmin } });
});

authRouter.post("/login", async (req, res) => {
  const username = String(req.body?.username ?? "").trim().toLowerCase();
  const password = String(req.body?.password ?? "");
  if (!username || !password) {
    return res.status(400).json({ error: "Username and password are required" });
  }

  const userCountRow = db.prepare(`SELECT COUNT(*) as count FROM users`).get() as { count: number };
  if (userCountRow.count === 0) {
    const passwordHash = await Bun.password.hash(password, {
      algorithm: "bcrypt",
      cost: 10,
    });
    const insert = db
      .prepare(
        `INSERT INTO users (username, display_name, is_admin, password_hash) VALUES (?, ?, ?, ?)`,
      )
      .run(username, username, 1, passwordHash);

    const userId = Number(insert.lastInsertRowid);
    ensureUserSettings(userId);
    const token = signToken({ userId, username });
    res.cookie("token", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: false,
      maxAge: 14 * 24 * 60 * 60 * 1000,
    });
    return res.json({
      token,
      user: {
        id: userId,
        username,
        displayName: username,
        isAdmin: true,
      },
    });
  }

  const user = db
    .prepare(`SELECT id, username, display_name, is_admin, password_hash FROM users WHERE username = ?`)
    .get(username) as
    | { id: number; username: string; display_name: string; is_admin: number; password_hash: string }
    | undefined;

  if (!user) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const isValid = await Bun.password.verify(password, user.password_hash);
  if (!isValid) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  ensureUserSettings(user.id);
  const token = signToken({ userId: user.id, username: user.username });
  res.cookie("token", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    maxAge: 14 * 24 * 60 * 60 * 1000,
  });
  return res.json({
    token,
    user: {
      id: user.id,
      username: user.username,
      displayName: user.display_name,
      isAdmin: user.is_admin === 1,
    },
  });
});

authRouter.post("/logout", (req, res) => {
  res.clearCookie("token");
  return res.json({ ok: true });
});
