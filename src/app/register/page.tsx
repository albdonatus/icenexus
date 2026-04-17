"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  User,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  ArrowRight,
  Snowflake,
  Wrench,
  ClipboardList,
  Clock,
  Building2,
  CreditCard,
} from "lucide-react";

const features = [
  { icon: ClipboardList, text: "Checklists de manutenção personalizados" },
  { icon: Wrench, text: "Controle de equipamentos e ordens de serviço" },
  { icon: Snowflake, text: "Gestão completa de técnicos de campo" },
];

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: "8+ caracteres", ok: password.length >= 8 },
    { label: "Letra maiúscula", ok: /[A-Z]/.test(password) },
    { label: "Número", ok: /[0-9]/.test(password) },
  ];
  const score = checks.filter((c) => c.ok).length;
  const bar = ["bg-red-400", "bg-orange-400", "bg-yellow-400", "bg-green-500"][score] ?? "bg-gray-200";

  if (!password) return null;

  return (
    <div className="mt-1.5 space-y-1.5">
      <div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors ${i < score ? bar : "bg-gray-200"}`}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-0.5">
        {checks.map((c) => (
          <span key={c.label} className={`text-[10px] flex items-center gap-1 ${c.ok ? "text-green-600" : "text-gray-400"}`}>
            <CheckCircle2 className={`w-2.5 h-2.5 ${c.ok ? "text-green-500" : "text-gray-300"}`} />
            {c.label}
          </span>
        ))}
      </div>
    </div>
  );
}

function formatDocument(value: string, type: "CPF" | "CNPJ"): string {
  const digits = value.replace(/\D/g, "");
  if (type === "CPF") {
    return digits
      .slice(0, 11)
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/(\d{3})\.(\d{3})\.(\d{3})(\d{1,2})/, "$1.$2.$3-$4");
  }
  return digits
    .slice(0, 14)
    .replace(/(\d{2})(\d)/, "$1.$2")
    .replace(/(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/(\d{2})\.(\d{3})\.(\d{3})(\d)/, "$1.$2.$3/$4")
    .replace(/(\d{2})\.(\d{3})\.(\d{3})\/(\d{4})(\d{1,2})/, "$1.$2.$3/$4-$5");
}

export default function RegisterPage() {
  const [docType, setDocType] = useState<"CPF" | "CNPJ">("CNPJ");
  const [form, setForm] = useState({
    name: "",
    companyName: "",
    document: "",
    email: "",
    phone: "",
    password: "",
    confirm: "",
  });
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"form" | "success">("form");

  function set(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
  }

  function handleDocumentChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, document: formatDocument(e.target.value, docType) }));
  }

  function handleDocTypeChange(type: "CPF" | "CNPJ") {
    setDocType(type);
    setForm((prev) => ({ ...prev, document: "" }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirm) {
      setError("As senhas não coincidem.");
      return;
    }
    if (form.password.length < 8) {
      setError("A senha deve ter pelo menos 8 caracteres.");
      return;
    }

    setLoading(true);
    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        companyName: form.companyName || null,
        document: form.document || null,
        email: form.email,
        phone: form.phone,
        password: form.password,
      }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Erro ao criar conta.");
      return;
    }

    setStep("success");
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* ── Left panel (desktop only) ── */}
      <div className="hidden lg:flex lg:w-[45%] bg-gradient-to-br from-violet-700 via-violet-600 to-purple-800 flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-[-80px] left-[-80px] w-96 h-96 rounded-full bg-white" />
          <div className="absolute bottom-[-60px] right-[-60px] w-80 h-80 rounded-full bg-white" />
        </div>

        <div className="relative z-10">
          <Image src="/LOGO_COR.png" alt="Ice Nexus IAR" width={180} height={54} className="object-contain brightness-0 invert" priority />
        </div>

        <div className="relative z-10 space-y-8">
          <div>
            <h1 className="text-3xl font-bold text-white leading-tight">
              Gestão de refrigeração<br />na palma da mão
            </h1>
            <p className="text-violet-200 mt-3 text-sm leading-relaxed">
              Controle ordens de serviço, equipes e equipamentos com eficiência. Tudo em um só lugar.
            </p>
          </div>

          <div className="space-y-4">
            {features.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm text-violet-100">{text}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-violet-300 text-xs">© 2026 Ice Nexus IAR. Todos os direitos reservados.</p>
      </div>

      {/* ── Right panel / form ── */}
      <div className="flex-1 flex flex-col min-h-screen lg:min-h-0">
        {/* Mobile logo */}
        <div className="lg:hidden flex justify-center pt-8 pb-2 px-6">
          <Image src="/LOGO_COR.png" alt="Ice Nexus IAR" width={180} height={54} className="object-contain" priority />
        </div>

        <div className="flex-1 flex items-center justify-center px-5 sm:px-10 py-8">
          <div className="w-full max-w-md">
            {step === "success" ? (
              <div className="text-center space-y-5">
                <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto">
                  <Clock className="w-8 h-8 text-amber-500" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Cadastro recebido!</h2>
                  <p className="text-sm text-gray-500 mt-2 leading-relaxed">
                    Sua conta está aguardando aprovação do administrador.<br />
                    Você receberá um e-mail assim que o acesso for liberado.
                  </p>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-left">
                  <p className="text-xs font-semibold text-amber-700 mb-1">O que acontece agora?</p>
                  <ul className="text-xs text-amber-600 space-y-1 list-disc list-inside">
                    <li>O administrador foi notificado do seu cadastro</li>
                    <li>Após a aprovação, você receberá um e-mail</li>
                    <li>Depois é só entrar com seu e-mail e senha</li>
                  </ul>
                </div>
                <a href="/login" className="inline-block text-sm text-violet-600 font-semibold hover:underline">
                  Voltar para o login →
                </a>
              </div>
            ) : (
              <>
                <div className="mb-7">
                  <h2 className="text-2xl font-bold text-gray-900">Criar conta</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Preencha os dados da sua empresa para começar
                  </p>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-5">
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Gestor name */}
                  <div>
                    <label className="text-xs font-semibold text-gray-600 block mb-1.5">Nome do responsável *</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        value={form.name}
                        onChange={set("name")}
                        placeholder="Seu nome completo"
                        required
                        autoComplete="name"
                        className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent"
                      />
                    </div>
                  </div>

                  {/* Company name */}
                  <div>
                    <label className="text-xs font-semibold text-gray-600 block mb-1.5">
                      Nome da empresa <span className="text-gray-400 font-normal">(opcional)</span>
                    </label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        value={form.companyName}
                        onChange={set("companyName")}
                        placeholder="Razão social ou nome fantasia"
                        autoComplete="organization"
                        className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent"
                      />
                    </div>
                  </div>

                  {/* Document: CPF / CNPJ */}
                  <div>
                    <label className="text-xs font-semibold text-gray-600 block mb-1.5">
                      Documento <span className="text-gray-400 font-normal">(opcional)</span>
                    </label>
                    <div className="flex gap-2">
                      {/* Type toggle */}
                      <div className="flex border border-gray-200 rounded-xl overflow-hidden flex-shrink-0 text-xs font-semibold">
                        <button
                          type="button"
                          onClick={() => handleDocTypeChange("CNPJ")}
                          className={`px-3 py-2.5 transition-colors ${
                            docType === "CNPJ"
                              ? "bg-violet-600 text-white"
                              : "bg-white text-gray-500 hover:bg-gray-50"
                          }`}
                        >
                          CNPJ
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDocTypeChange("CPF")}
                          className={`px-3 py-2.5 transition-colors border-l border-gray-200 ${
                            docType === "CPF"
                              ? "bg-violet-600 text-white"
                              : "bg-white text-gray-500 hover:bg-gray-50"
                          }`}
                        >
                          CPF
                        </button>
                      </div>
                      {/* Document input */}
                      <div className="relative flex-1">
                        <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          value={form.document}
                          onChange={handleDocumentChange}
                          placeholder={docType === "CNPJ" ? "00.000.000/0000-00" : "000.000.000-00"}
                          inputMode="numeric"
                          className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label className="text-xs font-semibold text-gray-600 block mb-1.5">E-mail *</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="email"
                        value={form.email}
                        onChange={set("email")}
                        placeholder="empresa@email.com"
                        required
                        autoComplete="email"
                        className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent"
                      />
                    </div>
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="text-xs font-semibold text-gray-600 block mb-1.5">
                      Telefone <span className="text-gray-400 font-normal">(opcional)</span>
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="tel"
                        value={form.phone}
                        onChange={set("phone")}
                        placeholder="(00) 00000-0000"
                        autoComplete="tel"
                        className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent"
                      />
                    </div>
                  </div>

                  {/* Password row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-gray-600 block mb-1.5">Senha *</label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type={showPwd ? "text" : "password"}
                          value={form.password}
                          onChange={set("password")}
                          placeholder="••••••••"
                          required
                          autoComplete="new-password"
                          className="w-full pl-9 pr-9 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPwd(!showPwd)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                        >
                          {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      <PasswordStrength password={form.password} />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-gray-600 block mb-1.5">Confirmar senha *</label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type={showConfirm ? "text" : "password"}
                          value={form.confirm}
                          onChange={set("confirm")}
                          placeholder="••••••••"
                          required
                          autoComplete="new-password"
                          className={`w-full pl-9 pr-9 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:border-transparent ${
                            form.confirm && form.confirm !== form.password
                              ? "border-red-300 focus:ring-red-400"
                              : "border-gray-200 focus:ring-violet-400"
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirm(!showConfirm)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                        >
                          {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {form.confirm && form.confirm !== form.password && (
                        <p className="text-[11px] text-red-500 mt-1">As senhas não coincidem</p>
                      )}
                      {form.confirm && form.confirm === form.password && (
                        <p className="text-[11px] text-green-600 mt-1 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Senhas iguais
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full mt-2 bg-violet-600 hover:bg-violet-700 text-white font-semibold text-sm py-3 rounded-xl transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <span className="inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        Criar minha conta
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>

                <p className="text-center text-sm text-gray-500 mt-6">
                  Já tem uma conta?{" "}
                  <Link href="/login" className="text-violet-600 font-semibold hover:underline">
                    Entrar
                  </Link>
                </p>
              </>
            )}
          </div>
        </div>

        <p className="lg:hidden text-center text-xs text-gray-400 pb-6">
          © 2026 Ice Nexus IAR
        </p>
      </div>
    </div>
  );
}
