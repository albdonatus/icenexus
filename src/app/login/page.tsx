"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);

    if (result?.error) {
      // Check if the account exists but is pending approval
      try {
        const check = await fetch(`/api/auth/check-pending?email=${encodeURIComponent(email)}`);
        const data = await check.json();
        if (data.pending) {
          setError("Sua conta ainda não foi aprovada. Você receberá um e-mail quando o acesso for liberado.");
          return;
        }
      } catch { /* ignore */ }
      setError("Email ou senha incorretos");
      return;
    }

    router.push("/auth/redirect");
    router.refresh();
  }

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Left decorative panel — visible on lg+ */}
      <div className="hidden lg:flex lg:w-[420px] xl:w-[480px] bg-gradient-to-br from-violet-700 via-violet-600 to-purple-800 flex-col justify-between p-12 relative overflow-hidden flex-shrink-0">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-24 -left-24 w-80 h-80 rounded-full bg-white/5" />
          <div className="absolute bottom-16 -right-16 w-64 h-64 rounded-full bg-white/5" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-white/5" />
        </div>

        <div className="relative z-10">
          <Image src="/LOGO_COR.png" alt="Ice Nexus" width={140} height={42} className="object-contain brightness-0 invert" priority />
        </div>

        <div className="relative z-10 space-y-5">
          <h2 className="text-2xl font-bold text-white leading-snug">
            Gestão de manutenção<br />de refrigeração
          </h2>
          <p className="text-violet-200 text-sm leading-relaxed">
            Ordens de serviço, checklists inteligentes e laudos PDF — tudo em um sistema.
          </p>
          <div className="grid grid-cols-2 gap-3 pt-2">
            {["Checklists automáticos", "Laudo em PDF", "Gestão de equipes", "Multi-empresa"].map((f) => (
              <div key={f} className="flex items-center gap-2 text-xs text-violet-200">
                <span className="w-1.5 h-1.5 rounded-full bg-violet-300 flex-shrink-0" />
                {f}
              </div>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-violet-400 text-xs">© {new Date().getFullYear()} IceNexus</p>
      </div>

      {/* Right: form */}
      <div className="flex-1 flex items-center justify-center px-5 py-12">
        <div className="w-full max-w-sm">
          {/* Logo (mobile only) */}
          <div className="flex justify-center mb-10 lg:hidden">
            <Image src="/LOGO_COR.png" alt="Ice Nexus" width={180} height={54} className="object-contain" priority />
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Bem-vindo de volta</h1>
            <p className="text-sm text-gray-500 mt-1">Entre na sua conta para continuar</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-5">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-600">E-mail</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  required
                  autoComplete="email"
                  className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-400/30 focus:border-violet-400 transition-colors"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-600">Senha</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  type={showPwd ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  className="w-full pl-9 pr-10 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-400/30 focus:border-violet-400 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  tabIndex={-1}
                >
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-violet-600 hover:bg-violet-700 active:bg-violet-800 text-white font-semibold text-sm py-2.5 rounded-xl transition-all shadow-sm shadow-violet-200 disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                "Entrar"
              )}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-7">
            Não tem conta?{" "}
            <Link href="/register" className="text-violet-600 font-semibold hover:text-violet-700 transition-colors">
              Criar conta grátis
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
