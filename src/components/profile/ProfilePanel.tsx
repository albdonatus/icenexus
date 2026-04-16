"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { X, Camera, Loader2, Eye, EyeOff, Check, ImagePlus, Trash2 } from "lucide-react";

interface ProfileData {
  name: string;
  email: string;
  phone: string;
  image: string | null;
  companyLogo: string | null;
}

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function ProfilePanel({ open, onClose }: Props) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const logoRef = useRef<HTMLInputElement>(null);

  const [data, setData] = useState<ProfileData>({ name: "", email: "", phone: "", image: null, companyLogo: null });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [removingLogo, setRemovingLogo] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setError("");
    setSuccess(false);
    fetch("/api/profile")
      .then((r) => r.json())
      .then((d) => setData({ name: d.name ?? "", email: d.email ?? "", phone: d.phone ?? "", image: d.image, companyLogo: d.companyLogo ?? null }))
      .finally(() => setLoading(false));
  }, [open]);

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Preview optimista
    const preview = URL.createObjectURL(file);
    setData((d) => ({ ...d, image: preview }));
    setUploadingAvatar(true);

    const form = new FormData();
    form.append("avatar", file);
    const res = await fetch("/api/profile/avatar", { method: "POST", body: form });
    const json = await res.json();
    setUploadingAvatar(false);

    if (res.ok) {
      setData((d) => ({ ...d, image: json.image }));
    } else {
      setError(json.error ?? "Erro ao enviar foto");
    }
  }

  async function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const preview = URL.createObjectURL(file);
    setData((d) => ({ ...d, companyLogo: preview }));
    setUploadingLogo(true);

    const form = new FormData();
    form.append("logo", file);
    const res = await fetch("/api/profile/logo", { method: "POST", body: form });
    const json = await res.json();
    setUploadingLogo(false);

    if (res.ok) {
      setData((d) => ({ ...d, companyLogo: json.companyLogo }));
    } else {
      setError(json.error ?? "Erro ao enviar logo");
      setData((d) => ({ ...d, companyLogo: null }));
    }
  }

  async function handleRemoveLogo() {
    setRemovingLogo(true);
    await fetch("/api/profile/logo", { method: "DELETE" });
    setRemovingLogo(false);
    setData((d) => ({ ...d, companyLogo: null }));
  }

  async function handleSave() {
    setError("");
    setSuccess(false);

    if (newPassword && newPassword !== confirmPassword) {
      setError("As senhas não coincidem");
      return;
    }
    if (newPassword && !currentPassword) {
      setError("Informe a senha atual para alterá-la");
      return;
    }

    setSaving(true);
    const body: Record<string, string> = { name: data.name, phone: data.phone };
    if (newPassword) {
      body.currentPassword = currentPassword;
      body.newPassword = newPassword;
    }

    const res = await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await res.json();
    setSaving(false);

    if (!res.ok) {
      setError(json.error ?? "Erro ao salvar");
      return;
    }

    setSuccess(true);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    router.refresh();
    setTimeout(() => setSuccess(false), 3000);
  }

  const initials = data.name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/40 z-40 transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-80 bg-white z-50 shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${open ? "translate-x-0" : "translate-x-full"}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-800">Meu Perfil</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-violet-500" />
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
            {/* Avatar */}
            <div className="flex flex-col items-center gap-3">
              <div className="relative">
                <div className="w-20 h-20 rounded-full overflow-hidden bg-violet-100 flex items-center justify-center border-2 border-violet-200">
                  {data.image ? (
                    <Image
                      src={data.image}
                      alt={data.name}
                      width={80}
                      height={80}
                      className="w-full h-full object-cover"
                      unoptimized
                    />
                  ) : (
                    <span className="text-2xl font-bold text-violet-600">{initials}</span>
                  )}
                </div>
                <button
                  onClick={() => fileRef.current?.click()}
                  disabled={uploadingAvatar}
                  className="absolute bottom-0 right-0 w-7 h-7 bg-violet-600 rounded-full flex items-center justify-center text-white shadow-md hover:bg-violet-700 transition-colors disabled:opacity-60"
                >
                  {uploadingAvatar ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Camera className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleAvatarChange}
              />
              <p className="text-[11px] text-gray-400">Clique na câmera para alterar a foto</p>
            </div>

            {/* Logo da empresa */}
            <div className="space-y-2">
              <h3 className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Logo da Empresa</h3>
              <p className="text-[11px] text-gray-400">Aparece no cabeçalho do relatório PDF das OS</p>

              <div
                className="relative w-full h-20 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden cursor-pointer hover:border-violet-300 hover:bg-violet-50/30 transition-colors group"
                onClick={() => logoRef.current?.click()}
              >
                {data.companyLogo ? (
                  <Image
                    src={data.companyLogo}
                    alt="Logo"
                    fill
                    className="object-contain p-2"
                    unoptimized
                  />
                ) : (
                  <div className="flex flex-col items-center gap-1 text-gray-400 group-hover:text-violet-400 transition-colors">
                    <ImagePlus className="w-5 h-5" />
                    <span className="text-[11px]">Clique para enviar</span>
                  </div>
                )}
                {uploadingLogo && (
                  <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                    <Loader2 className="w-5 h-5 animate-spin text-violet-500" />
                  </div>
                )}
              </div>

              <input
                ref={logoRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleLogoChange}
              />

              {data.companyLogo && (
                <button
                  type="button"
                  onClick={handleRemoveLogo}
                  disabled={removingLogo}
                  className="flex items-center gap-1.5 text-[11px] text-red-400 hover:text-red-600 transition-colors disabled:opacity-50"
                >
                  {removingLogo ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                  Remover logo
                </button>
              )}
            </div>

            {/* Dados pessoais */}
            <div className="space-y-3">
              <h3 className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Dados Pessoais</h3>

              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Nome</label>
                <input
                  value={data.name}
                  onChange={(e) => setData((d) => ({ ...d, name: e.target.value }))}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-400"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">E-mail</label>
                <input
                  value={data.email}
                  readOnly
                  className="w-full text-sm border border-gray-100 rounded-lg px-3 py-2 bg-gray-50 text-gray-400 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Telefone</label>
                <input
                  value={data.phone}
                  onChange={(e) => setData((d) => ({ ...d, phone: e.target.value }))}
                  placeholder="(00) 00000-0000"
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-400"
                />
              </div>
            </div>

            {/* Alterar senha */}
            <div className="space-y-3">
              <h3 className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Alterar Senha</h3>

              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Senha atual</label>
                <div className="relative">
                  <input
                    type={showPwd ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 pr-9 focus:outline-none focus:ring-2 focus:ring-violet-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd(!showPwd)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400"
                  >
                    {showPwd ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Nova senha</label>
                <div className="relative">
                  <input
                    type={showNewPwd ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 pr-9 focus:outline-none focus:ring-2 focus:ring-violet-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPwd(!showNewPwd)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400"
                  >
                    {showNewPwd ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Confirmar nova senha</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-400"
                />
              </div>
            </div>

            {/* Feedback */}
            {error && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
            )}
            {success && (
              <div className="flex items-center gap-2 text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                <Check className="w-3.5 h-3.5" />
                Perfil atualizado com sucesso!
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="px-5 py-4 border-t border-gray-100 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 text-sm py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors font-medium"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving || loading}
            className="flex-1 text-sm py-2 rounded-lg bg-violet-600 text-white hover:bg-violet-700 transition-colors font-medium disabled:opacity-60 flex items-center justify-center gap-1.5"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
            Salvar
          </button>
        </div>
      </div>
    </>
  );
}
