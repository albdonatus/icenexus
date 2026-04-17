"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search, UserPlus, Pencil, ToggleLeft, ToggleRight, Building2, Clock, CheckCircle2, Loader2 } from "lucide-react";
import { cn, formatDate } from "@/lib/utils";

type UserRow = {
  id: string;
  name: string;
  email: string;
  role: string;
  active: boolean;
  pendingApproval: boolean;
  companyId: string | null;
  companyName: string;
  document: string;
  phone: string | null;
  createdAt: string;
};

const ROLE_LABEL: Record<string, string> = {
  MANAGER: "Gestor",
  TECHNICIAN: "Técnico",
  SUPERADMIN: "Super Admin",
};

const ROLE_COLOR: Record<string, string> = {
  MANAGER: "bg-violet-100 text-violet-700",
  TECHNICIAN: "bg-blue-100 text-blue-700",
  SUPERADMIN: "bg-gray-900 text-white",
};

export default function AdminUsersClient({ users }: { users: UserRow[] }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [toggling, setToggling] = useState<string | null>(null);
  const [approving, setApproving] = useState<string | null>(null);

  const pending = useMemo(() => users.filter((u) => u.pendingApproval && !u.active), [users]);

  const filtered = useMemo(() => {
    return users.filter((u) => {
      if (u.pendingApproval && !u.active) return false; // shown separately above
      const matchSearch =
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase()) ||
        u.companyName.toLowerCase().includes(search.toLowerCase());
      const matchRole = roleFilter === "ALL" || u.role === roleFilter;
      const matchStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" ? u.active : !u.active);
      return matchSearch && matchRole && matchStatus;
    });
  }, [users, search, roleFilter, statusFilter]);

  async function toggleActive(userId: string, current: boolean) {
    setToggling(userId);
    await fetch(`/api/admin/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !current }),
    });
    setToggling(null);
    router.refresh();
  }

  async function approveUser(userId: string) {
    setApproving(userId);
    await fetch(`/api/admin/users/${userId}/approve`, { method: "POST" });
    setApproving(null);
    router.refresh();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Usuários</h1>
          <p className="text-sm text-gray-500">{users.length} usuário(s) no sistema</p>
        </div>
        <Link
          href="/admin/users/new"
          className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          Novo usuário
        </Link>
      </div>

      {/* ── Pending approvals ── */}
      {pending.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4 text-amber-500" />
            <h2 className="text-sm font-semibold text-gray-700">Aguardando aprovação</h2>
            <span className="text-xs font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">{pending.length}</span>
          </div>
          <div className="space-y-2">
            {pending.map((user) => (
              <div
                key={user.id}
                className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center justify-between gap-4"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm">{user.name}</p>
                  {user.companyName && (
                    <p className="text-xs text-gray-700 font-medium flex items-center gap-1 mt-0.5">
                      <Building2 className="w-3 h-3 text-gray-400" />
                      {user.companyName}
                      {user.document && <span className="text-gray-400 font-normal">· {user.document}</span>}
                    </p>
                  )}
                  <p className="text-xs text-gray-500">{user.email}</p>
                  {user.phone && <p className="text-xs text-gray-400">{user.phone}</p>}
                  <p className="text-[11px] text-gray-400 mt-0.5">Cadastrou em {formatDate(new Date(user.createdAt))}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => approveUser(user.id)}
                    disabled={approving === user.id}
                    className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-60"
                  >
                    {approving === user.id
                      ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      : <CheckCircle2 className="w-3.5 h-3.5" />}
                    Aprovar
                  </button>
                  <Link
                    href={`/admin/users/${user.id}`}
                    className="text-gray-400 hover:text-violet-600 transition-colors p-1"
                  >
                    <Pencil className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nome, email ou empresa..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-violet-400 bg-white"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:border-violet-400"
        >
          <option value="ALL">Todos os papéis</option>
          <option value="MANAGER">Gestor</option>
          <option value="TECHNICIAN">Técnico</option>
          <option value="SUPERADMIN">Super Admin</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:border-violet-400"
        >
          <option value="ALL">Todos os status</option>
          <option value="ACTIVE">Ativos</option>
          <option value="INACTIVE">Inativos</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Usuário</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Empresa</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Papel</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Cadastro</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-sm text-gray-400">
                    Nenhum usuário encontrado
                  </td>
                </tr>
              )}
              {filtered.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{user.name}</p>
                    <p className="text-xs text-gray-400">{user.email}</p>
                    {user.phone && <p className="text-xs text-gray-400">{user.phone}</p>}
                  </td>
                  <td className="px-4 py-3">
                    {user.role === "MANAGER" ? (
                      user.companyName ? (
                        <div>
                          <span className="flex items-center gap-1 text-xs text-gray-700 font-medium">
                            <Building2 className="w-3 h-3 text-gray-400 flex-shrink-0" />
                            {user.companyName}
                          </span>
                          {user.document && (
                            <p className="text-[10px] text-gray-400 mt-0.5 pl-4">{user.document}</p>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs font-semibold text-violet-600">Gestor</span>
                      )
                    ) : (
                      <span className="flex items-center gap-1 text-xs text-gray-600">
                        <Building2 className="w-3 h-3 text-gray-400" />
                        {user.companyName}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-full", ROLE_COLOR[user.role] ?? "bg-gray-100 text-gray-600")}>
                      {ROLE_LABEL[user.role] ?? user.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400">
                    {formatDate(new Date(user.createdAt))}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleActive(user.id, user.active)}
                      disabled={toggling === user.id}
                      className="flex items-center gap-1.5 text-xs font-medium transition-colors"
                      title={user.active ? "Desativar" : "Ativar"}
                    >
                      {user.active
                        ? <><ToggleRight className="w-5 h-5 text-green-500" /><span className="text-green-600">Ativo</span></>
                        : <><ToggleLeft className="w-5 h-5 text-gray-400" /><span className="text-gray-400">Inativo</span></>}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/users/${user.id}`}
                      className="text-gray-400 hover:text-violet-600 transition-colors"
                    >
                      <Pencil className="w-4 h-4" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-gray-400 mt-3">{filtered.length} de {users.length - pending.length} usuários</p>
    </div>
  );
}
