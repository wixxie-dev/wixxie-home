import { useEffect, useMemo, useState, type FormEvent } from "react";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth";
import type { ManagedUser } from "../types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type UserEditState = {
  displayName: string;
  isAdmin: boolean;
  password: string;
  confirmPassword: string;
};

export function UsersPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [edits, setEdits] = useState<Record<number, UserEditState>>({});
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");
  const [error, setError] = useState<string | null>(null);

  const [newUsername, setNewUsername] = useState("");
  const [newDisplayName, setNewDisplayName] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newConfirmPassword, setNewConfirmPassword] = useState("");
  const [newIsAdmin, setNewIsAdmin] = useState(false);
  const [creating, setCreating] = useState(false);

  async function loadUsers() {
    setLoading(true);
    setError(null);
    try {
      const list = await api.listUsers();
      setUsers(list);
      setEdits((prev) => {
        const next: Record<number, UserEditState> = {};
        for (const listedUser of list) {
          next[listedUser.id] = {
            displayName: listedUser.displayName,
            isAdmin: listedUser.isAdmin,
            password: prev[listedUser.id]?.password ?? "",
            confirmPassword: prev[listedUser.id]?.confirmPassword ?? "",
          };
        }
        return next;
      });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers().catch(() => {});
  }, []);

  const sortedUsers = useMemo(
    () => [...users].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)),
    [users],
  );

  async function onCreateUser(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("");
    setError(null);
    if (newPassword !== newConfirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setCreating(true);
    try {
      await api.createUser({
        username: newUsername,
        displayName: newDisplayName || newUsername,
        password: newPassword,
        isAdmin: newIsAdmin,
      });
      setNewUsername("");
      setNewDisplayName("");
      setNewPassword("");
      setNewConfirmPassword("");
      setNewIsAdmin(false);
      setStatus("User created");
      await loadUsers();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setCreating(false);
    }
  }

  async function onSaveUser(target: ManagedUser) {
    const edit = edits[target.id];
    if (!edit) {
      return;
    }

    setStatus("");
    setError(null);

    const payload: Partial<{ displayName: string; password: string; isAdmin: boolean }> = {};
    const trimmedDisplayName = edit.displayName.trim();
    if (trimmedDisplayName && trimmedDisplayName !== target.displayName) {
      payload.displayName = trimmedDisplayName;
    }
    if (edit.isAdmin !== target.isAdmin) {
      payload.isAdmin = edit.isAdmin;
    }
    if (edit.password.trim() && edit.password !== edit.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (edit.password.trim()) {
      payload.password = edit.password;
    }

    if (Object.keys(payload).length === 0) {
      setStatus("No changes to save");
      return;
    }

    try {
      await api.updateUser(target.id, payload);
      setStatus(`Updated ${target.username}`);
      setEdits((prev) => ({
        ...prev,
        [target.id]: {
          ...prev[target.id],
          password: "",
          confirmPassword: "",
        },
      }));
      await loadUsers();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function onDeleteUser(target: ManagedUser) {
    if (!confirm(`Delete user "${target.username}"? This cannot be undone.`)) {
      return;
    }
    setStatus("");
    setError(null);
    try {
      await api.deleteUser(target.id);
      setStatus(`Deleted ${target.username}`);
      await loadUsers();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  if (!user?.isAdmin) {
    return (
      <div className="mx-auto max-w-3xl">
        <Card className="rounded-2xl border-zinc-200/80 dark:border-zinc-700/80">
          <CardContent className="p-6">
            <h1 className="text-xl font-semibold">User management</h1>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
              Only admin accounts can manage users.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">User management</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-300">
          Create users, update roles, and reset passwords from one place.
        </p>
        {status && <p className="mt-1 text-sm text-emerald-600">{status}</p>}
        {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
      </div>

      <Card className="rounded-2xl border-zinc-200/80 bg-white/85 shadow-sm backdrop-blur dark:border-zinc-700/80 dark:bg-zinc-900/80">
        <CardContent className="p-5">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-zinc-500">
            Add user
          </h2>
          <form className="grid gap-3 sm:grid-cols-2" onSubmit={onCreateUser}>
            <div className="space-y-1.5">
              <Label htmlFor="new-username">Username</Label>
              <Input
                id="new-username"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="new-display-name">Display name</Label>
              <Input
                id="new-display-name"
                value={newDisplayName}
                onChange={(e) => setNewDisplayName(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="new-password">Password</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="new-confirm-password">Confirm password</Label>
              <Input
                id="new-confirm-password"
                type="password"
                value={newConfirmPassword}
                onChange={(e) => setNewConfirmPassword(e.target.value)}
                required
              />
            </div>
            <div className="flex items-center gap-2 self-end pb-2">
              <Checkbox
                id="new-is-admin"
                checked={newIsAdmin}
                onChange={(e) => setNewIsAdmin(e.target.checked)}
              />
              <Label htmlFor="new-is-admin">Grant admin access</Label>
            </div>
            <div className="sm:col-span-2">
              <Button
                type="submit"
                disabled={creating}
                className="bg-orange-600 text-white hover:bg-orange-700"
              >
                {creating ? "Creating..." : "Create user"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {loading ? (
          <Card className="rounded-2xl">
            <CardContent className="p-4 text-sm text-zinc-500">Loading users...</CardContent>
          </Card>
        ) : (
          sortedUsers.map((listedUser) => {
            const edit = edits[listedUser.id];
            if (!edit) {
              return null;
            }
            return (
              <Card
                key={listedUser.id}
                className="rounded-2xl border-zinc-200/80 bg-white/85 shadow-sm backdrop-blur dark:border-zinc-700/80 dark:bg-zinc-900/80"
              >
                <CardContent className="grid gap-3 p-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label>Username</Label>
                    <Input value={listedUser.username} disabled />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor={`display-${listedUser.id}`}>Display name</Label>
                    <Input
                      id={`display-${listedUser.id}`}
                      value={edit.displayName}
                      onChange={(e) =>
                        setEdits((prev) => ({
                          ...prev,
                          [listedUser.id]: { ...prev[listedUser.id], displayName: e.target.value },
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor={`password-${listedUser.id}`}>Reset password</Label>
                    <Input
                      id={`password-${listedUser.id}`}
                      type="password"
                      placeholder="Leave empty to keep current password"
                      value={edit.password}
                      onChange={(e) =>
                        setEdits((prev) => ({
                          ...prev,
                          [listedUser.id]: { ...prev[listedUser.id], password: e.target.value },
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor={`confirm-password-${listedUser.id}`}>Confirm new password</Label>
                    <Input
                      id={`confirm-password-${listedUser.id}`}
                      type="password"
                      placeholder="Repeat new password"
                      value={edit.confirmPassword}
                      onChange={(e) =>
                        setEdits((prev) => ({
                          ...prev,
                          [listedUser.id]: {
                            ...prev[listedUser.id],
                            confirmPassword: e.target.value,
                          },
                        }))
                      }
                    />
                  </div>
                  <div className="flex flex-col justify-end gap-2 pb-1">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id={`admin-${listedUser.id}`}
                        checked={edit.isAdmin}
                        onChange={(e) =>
                          setEdits((prev) => ({
                            ...prev,
                            [listedUser.id]: { ...prev[listedUser.id], isAdmin: e.target.checked },
                          }))
                        }
                      />
                      <Label htmlFor={`admin-${listedUser.id}`}>Admin</Label>
                      {user.id === listedUser.id && (
                        <span className="text-xs text-zinc-500">(you)</span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      Created {new Date(listedUser.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="sm:col-span-2 flex flex-wrap items-center gap-2">
                    <Button
                      type="button"
                      onClick={() => {
                        onSaveUser(listedUser).catch(() => {});
                      }}
                      className="bg-orange-600 text-white hover:bg-orange-700"
                    >
                      Save changes
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="border-red-300 text-red-600 hover:bg-red-50 dark:border-red-500/50 dark:text-red-300 dark:hover:bg-red-900/30"
                      disabled={user.id === listedUser.id}
                      onClick={() => {
                        onDeleteUser(listedUser).catch(() => {});
                      }}
                    >
                      Delete user
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
