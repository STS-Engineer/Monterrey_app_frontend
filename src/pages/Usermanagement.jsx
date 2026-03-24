import { useEffect, useState } from "react";
import PageMeta from "../components/common/PageMeta";

const ROLES = ["ADMIN", "EXECUTOR", "MANAGER"];

const cardBase =
  "rounded-3xl border border-white/40 bg-white/80 backdrop-blur-md shadow-[0_10px_30px_rgba(0,0,0,0.06)]";

const ROLE_STYLES = {
  ADMIN: {
    bg: "bg-violet-100",
    text: "text-violet-700",
    dot: "bg-violet-400",
  },
  EXECUTOR: {
    bg: "bg-blue-100",
    text: "text-blue-700",
    dot: "bg-blue-400",
  },
  MANAGER: {
    bg: "bg-slate-100",
    text: "text-slate-600",
    dot: "bg-slate-400",
  },
};

function RoleBadge({ role }) {
  const style = ROLE_STYLES[role] ?? ROLE_STYLES["MANAGER"];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${style.bg} ${style.text}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
      {role}
    </span>
  );
}

function Modal({ open, onClose, children }) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className={`${cardBase} w-full max-w-md mx-4 p-8`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Add user form
  const [showAddModal, setShowAddModal] = useState(false);
  const [form, setForm] = useState({ email: "", password: "", role: "EXECUTOR" });
  const [formError, setFormError] = useState("");
  const [formLoading, setFormLoading] = useState(false);
  const [formSuccess, setFormSuccess] = useState("");

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState(null); // user object
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  // Search / filter
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await fetch("https://machine-backend.azurewebsites.net/ajouter/users");
      if (!res.ok) throw new Error("Failed to fetch users");
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      setError("Unable to load users.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleAddUser = async (e) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");

    if (!form.email || !form.password) {
      setFormError("Email and password are required.");
      return;
    }

    try {
      setFormLoading(true);
      const res = await fetch("https://machine-backend.azurewebsites.net/ajouter/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Registration failed");
      setFormSuccess("User created successfully!");
      setForm({ email: "", password: "", role: "EXECUTOR" });
      await fetchUsers();
      setTimeout(() => {
        setShowAddModal(false);
        setFormSuccess("");
      }, 1200);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    setDeleteError("");
    try {
      const res = await fetch(
        `https://machine-backend.azurewebsites.net/ajouter/users/${deleteTarget.user_id}`,
        { method: "DELETE" }
      );
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Delete failed");
      }
      setUsers((prev) => prev.filter((u) => u.user_id !== deleteTarget.user_id));
      setDeleteTarget(null);
    } catch (err) {
      setDeleteError(err.message);
    } finally {
      setDeleteLoading(false);
    }
  };

  const filtered = users.filter((u) => {
    const matchesSearch =
      u.email?.toLowerCase().includes(search.toLowerCase()) ||
      u.role?.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === "All" || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <>
      <PageMeta
        title="User Management"
        description="ADMINistrator panel for managing system users"
      />

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-orange-50 p-6">
        <div className="mx-auto max-w-7xl space-y-8">

          {/* Header */}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-800">
                User Management
              </h1>
              <p className="text-sm text-slate-500">
                Add, view, and remove system users
              </p>
            </div>

            <button
              onClick={() => {
                setShowAddModal(true);
                setFormError("");
                setFormSuccess("");
                setForm({ email: "", password: "", role: "EXECUTOR" });
              }}
              className="inline-flex items-center gap-2 rounded-2xl bg-slate-800 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-800/20 transition hover:bg-slate-700 active:scale-95"
            >
              <span className="text-base">＋</span>
              Add user
            </button>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {[
              {
                label: "Total users",
                value: users.length,
                icon: "👥",
                bg: "bg-blue-100",
              },
              {
                label: "ADMINs",
                value: users.filter((u) => u.role === "ADMIN").length,
                icon: "🛡️",
                bg: "bg-violet-100",
              },
              {
                label: "EXECUTORs",
                value: users.filter((u) => u.role === "EXECUTOR").length,
                icon: "🔧",
                bg: "bg-orange-100",
              },
            ].map((stat) => (
              <div key={stat.label} className={`${cardBase} flex items-center gap-5 p-5`}>
                <div
                  className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl ${stat.bg}`}
                >
                  <span className="text-xl">{stat.icon}</span>
                </div>
                <div>
                  <p className="text-sm text-slate-500">{stat.label}</p>
                  <p className="text-2xl font-bold text-slate-800">{stat.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Table card */}
          <div className={`${cardBase} overflow-hidden`}>
            {/* Toolbar */}
            <div className="flex flex-col gap-3 border-b border-slate-100 p-6 sm:flex-row sm:items-center sm:justify-between">
              {/* Search */}
              <div className="relative w-full max-w-xs">
                <span className="absolute inset-y-0 left-3 flex items-center text-slate-400">
                  🔍
                </span>
                <input
                  type="text"
                  placeholder="Search by email or role…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-4 text-sm text-slate-700 placeholder-slate-400 focus:border-slate-400 focus:outline-none"
                />
              </div>

              {/* Role filter pills */}
              <div className="flex gap-2">
                {["All", ...ROLES].map((r) => (
                  <button
                    key={r}
                    onClick={() => setRoleFilter(r)}
                    className={`rounded-xl px-4 py-1.5 text-xs font-medium transition ${
                      roleFilter === r
                        ? "bg-slate-800 text-white shadow"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {/* Table */}
            {loading ? (
              <div className="p-12 text-center text-slate-400">Loading users…</div>
            ) : error ? (
              <div className="p-12 text-center text-red-500">{error}</div>
            ) : filtered.length === 0 ? (
              <div className="p-12 text-center text-slate-400">No users found.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                      <th className="px-6 py-4">#</th>
                      <th className="px-6 py-4">Email</th>
                      <th className="px-6 py-4">Role</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filtered.map((user, idx) => (
                      <tr
                        key={user.user_id}
                        className="group transition hover:bg-slate-50/60"
                      >
                        <td className="px-6 py-4 text-slate-400">{idx + 1}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-600">
                              {user.email?.[0]?.toUpperCase() ?? "?"}
                            </div>
                            <span className="font-medium text-slate-700">
                              {user.email}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <RoleBadge role={user.role} />
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => {
                              setDeleteTarget(user);
                              setDeleteError("");
                            }}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-red-100 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-500 transition hover:bg-red-100 active:scale-95"
                          >
                            🗑 Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Add User Modal ── */}
      <Modal open={showAddModal} onClose={() => setShowAddModal(false)}>
        <h2 className="mb-1 text-xl font-bold text-slate-800">Add new user</h2>
        <p className="mb-6 text-sm text-slate-500">
          Fill in the details below to create a new account.
        </p>

        <form onSubmit={handleAddUser} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-600">
              Email
            </label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="user@example.com"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 placeholder-slate-400 focus:border-slate-400 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-600">
              Password
            </label>
            <input
              type="password"
              required
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="••••••••"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 placeholder-slate-400 focus:border-slate-400 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-600">
              Role
            </label>
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 focus:border-slate-400 focus:outline-none"
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          {formError && (
            <p className="rounded-xl bg-red-50 px-4 py-2.5 text-xs text-red-500">
              {formError}
            </p>
          )}
          {formSuccess && (
            <p className="rounded-xl bg-emerald-50 px-4 py-2.5 text-xs text-emerald-600">
              {formSuccess}
            </p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="flex-1 rounded-xl border border-slate-200 bg-white py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={formLoading}
              className="flex-1 rounded-xl bg-slate-800 py-2.5 text-sm font-semibold text-white shadow-lg shadow-slate-800/20 transition hover:bg-slate-700 disabled:opacity-60"
            >
              {formLoading ? "Creating…" : "Create user"}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── Delete Confirm Modal ── */}
      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)}>
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-100 text-2xl">
          🗑️
        </div>
        <h2 className="mb-1 text-xl font-bold text-slate-800">Delete user?</h2>
        <p className="mb-6 text-sm text-slate-500">
          This will permanently remove{" "}
          <span className="font-semibold text-slate-700">{deleteTarget?.email}</span>.
          This action cannot be undone.
        </p>

        {deleteError && (
          <p className="mb-4 rounded-xl bg-red-50 px-4 py-2.5 text-xs text-red-500">
            {deleteError}
          </p>
        )}

        <div className="flex gap-3">
          <button
            onClick={() => setDeleteTarget(null)}
            className="flex-1 rounded-xl border border-slate-200 bg-white py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={deleteLoading}
            className="flex-1 rounded-xl bg-red-500 py-2.5 text-sm font-semibold text-white shadow-lg shadow-red-500/20 transition hover:bg-red-600 disabled:opacity-60"
          >
            {deleteLoading ? "Deleting…" : "Yes, delete"}
          </button>
        </div>
      </Modal>
    </>
  );
}
