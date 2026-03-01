import { Router } from "express";
import { db, ensureUserSettings } from "../db.js";

export const usersRouter = Router();

type UserRow = {
  id: number;
  username: string;
  display_name: string;
  is_admin: number;
  created_at: string;
};

function getUserById(id: number) {
  return db
    .prepare(`SELECT id, username, display_name, is_admin, created_at FROM users WHERE id = ?`)
    .get(id) as UserRow | undefined;
}

function countAdmins() {
  const row = db.prepare(`SELECT COUNT(*) as count FROM users WHERE is_admin = 1`).get() as {
    count: number;
  };
  return row.count;
}

function requireAdmin(userId: number) {
  const row = db.prepare(`SELECT is_admin FROM users WHERE id = ?`).get(userId) as
    | { is_admin: number }
    | undefined;
  return row?.is_admin === 1;
}

usersRouter.use((req, res, next) => {
  const callerId = req.auth?.userId;
  if (!callerId || !requireAdmin(callerId)) {
    return res.status(403).json({ error: "Admin access required" });
  }
  return next();
});

usersRouter.get("/", (_req, res) => {
  const rows = db
    .prepare(
      `SELECT id, username, display_name, is_admin, created_at
       FROM users
       ORDER BY created_at DESC, id DESC`,
    )
    .all() as UserRow[];

  return res.json(
    rows.map((row) => ({
      id: row.id,
      username: row.username,
      displayName: row.display_name,
      isAdmin: row.is_admin === 1,
      createdAt: row.created_at,
    })),
  );
});

usersRouter.post("/", async (req, res) => {
  const username = String(req.body?.username ?? "").trim().toLowerCase();
  const displayName = String(req.body?.displayName ?? "").trim() || username;
  const password = String(req.body?.password ?? "");
  const isAdmin = Boolean(req.body?.isAdmin);

  if (!username || !password) {
    return res.status(400).json({ error: "Username and password are required" });
  }

  const exists = db.prepare(`SELECT id FROM users WHERE username = ?`).get(username) as
    | { id: number }
    | undefined;
  if (exists) {
    return res.status(409).json({ error: "Username already exists" });
  }

  const passwordHash = await Bun.password.hash(password, {
    algorithm: "bcrypt",
    cost: 10,
  });

  const insert = db
    .prepare(
      `INSERT INTO users (username, display_name, is_admin, password_hash)
       VALUES (?, ?, ?, ?)`,
    )
    .run(username, displayName, isAdmin ? 1 : 0, passwordHash);

  const userId = Number(insert.lastInsertRowid);
  ensureUserSettings(userId);
  const created = getUserById(userId);
  if (!created) {
    return res.status(500).json({ error: "Failed to create user" });
  }

  return res.status(201).json({
    id: created.id,
    username: created.username,
    displayName: created.display_name,
    isAdmin: created.is_admin === 1,
    createdAt: created.created_at,
  });
});

usersRouter.put("/:id", async (req, res) => {
  const userId = Number(req.params.id);
  if (!Number.isFinite(userId)) {
    return res.status(400).json({ error: "Invalid user id" });
  }

  const existing = getUserById(userId);
  if (!existing) {
    return res.status(404).json({ error: "User not found" });
  }

  const nextDisplayName =
    typeof req.body?.displayName === "string"
      ? String(req.body.displayName).trim() || existing.display_name
      : undefined;
  const nextPassword =
    typeof req.body?.password === "string" ? String(req.body.password) : undefined;
  const nextIsAdmin =
    typeof req.body?.isAdmin === "boolean" ? Boolean(req.body.isAdmin) : undefined;

  if (
    nextDisplayName === undefined &&
    nextPassword === undefined &&
    nextIsAdmin === undefined
  ) {
    return res.status(400).json({ error: "No updates provided" });
  }

  if (nextIsAdmin === false && existing.is_admin === 1 && countAdmins() <= 1) {
    return res.status(400).json({ error: "Cannot remove the last admin user" });
  }

  if (nextDisplayName !== undefined) {
    db.prepare(`UPDATE users SET display_name = ? WHERE id = ?`).run(nextDisplayName, userId);
  }

  if (nextPassword !== undefined) {
    if (!nextPassword) {
      return res.status(400).json({ error: "Password cannot be empty" });
    }
    const passwordHash = await Bun.password.hash(nextPassword, {
      algorithm: "bcrypt",
      cost: 10,
    });
    db.prepare(`UPDATE users SET password_hash = ? WHERE id = ?`).run(passwordHash, userId);
  }

  if (nextIsAdmin !== undefined) {
    db.prepare(`UPDATE users SET is_admin = ? WHERE id = ?`).run(nextIsAdmin ? 1 : 0, userId);
  }

  const updated = getUserById(userId);
  if (!updated) {
    return res.status(500).json({ error: "Failed to update user" });
  }

  return res.json({
    id: updated.id,
    username: updated.username,
    displayName: updated.display_name,
    isAdmin: updated.is_admin === 1,
    createdAt: updated.created_at,
  });
});

usersRouter.delete("/:id", (req, res) => {
  const userId = Number(req.params.id);
  if (!Number.isFinite(userId)) {
    return res.status(400).json({ error: "Invalid user id" });
  }

  if (req.auth?.userId === userId) {
    return res.status(400).json({ error: "You cannot delete your own account" });
  }

  const existing = getUserById(userId);
  if (!existing) {
    return res.status(404).json({ error: "User not found" });
  }

  if (existing.is_admin === 1 && countAdmins() <= 1) {
    return res.status(400).json({ error: "Cannot delete the last admin user" });
  }

  db.prepare(`DELETE FROM users WHERE id = ?`).run(userId);
  return res.status(204).send();
});
