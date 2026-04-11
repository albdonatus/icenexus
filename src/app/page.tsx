"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Menu,
  X,
  CheckCircle,
  ClipboardList,
  Users,
  Wrench,
  FileText,
  CalendarDays,
  BarChart3,
  ArrowRight,
  ChevronRight,
  Zap,
  ShieldCheck,
  Smartphone,
} from "lucide-react";

// ─── NAV ────────────────────────────────────────────────────────────────────

function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const links = [
    { label: "Funcionalidades", href: "#features" },
    { label: "Como funciona", href: "#how" },
    { label: "Para quem é", href: "#audience" },
  ];

  return (
    <nav
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-white/95 backdrop-blur shadow-sm border-b border-gray-100" : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-5 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5">
          <Image src="/LOGO_COR.png" alt="Ice Nexus" width={36} height={36} className="object-contain" />
          <span className={`font-bold text-xl tracking-tight ${scrolled ? "text-gray-900" : "text-white"}`}>
            IceNexus
          </span>
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-8">
          {links.map((l) => (
            <a
              key={l.label}
              href={l.href}
              className={`text-sm font-medium transition-colors ${
                scrolled ? "text-gray-600 hover:text-violet-600" : "text-white/80 hover:text-white"
              }`}
            >
              {l.label}
            </a>
          ))}
        </div>

        {/* CTAs */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/login"
            className={`text-sm font-medium px-4 py-2 rounded-lg transition-colors ${
              scrolled ? "text-gray-700 hover:text-violet-600" : "text-white/90 hover:text-white"
            }`}
          >
            Entrar
          </Link>
          <Link
            href="/register"
            className="text-sm font-semibold px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors"
          >
            Começar grátis
          </Link>
        </div>

        {/* Mobile toggle */}
        <button
          onClick={() => setOpen(!open)}
          className={`md:hidden p-2 rounded-lg ${scrolled ? "text-gray-700" : "text-white"}`}
        >
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden bg-white border-t border-gray-100 px-5 py-4 space-y-1 shadow-lg">
          {links.map((l) => (
            <a
              key={l.label}
              href={l.href}
              onClick={() => setOpen(false)}
              className="block py-2 text-sm font-medium text-gray-700 hover:text-violet-600"
            >
              {l.label}
            </a>
          ))}
          <div className="pt-3 flex flex-col gap-2 border-t border-gray-100 mt-2">
            <Link href="/login" className="block text-center py-2 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:border-violet-300">
              Entrar
            </Link>
            <Link href="/register" className="block text-center py-2 text-sm font-semibold text-white bg-violet-600 rounded-lg hover:bg-violet-700">
              Começar grátis
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}

// ─── HERO ───────────────────────────────────────────────────────────────────

function Hero() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-[#0d0920]">
      {/* Background gradient blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-violet-700/20 blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full bg-violet-500/10 blur-[100px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] rounded-full bg-violet-900/20 blur-[80px]" />
        {/* Subtle grid */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      <div className="relative max-w-7xl mx-auto px-5 py-32 grid lg:grid-cols-2 gap-16 items-center">
        {/* Text */}
        <div>
          <div className="inline-flex items-center gap-2 bg-violet-500/10 border border-violet-500/20 text-violet-300 text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
            <Zap className="w-3.5 h-3.5" />
            Gestão de manutenção de refrigeração
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-[1.1] tracking-tight">
            Fim do caos na{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-violet-200">
              manutenção
            </span>{" "}
            de refrigeração
          </h1>

          <p className="mt-6 text-lg text-white/60 leading-relaxed max-w-lg">
            Do agendamento ao laudo técnico, tudo digital. Gerencie ordens de serviço, checklists
            inteligentes e sua equipe de técnicos em um só lugar.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-violet-600 hover:bg-violet-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-violet-500/20 hover:shadow-violet-500/40"
            >
              Criar conta grátis
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium rounded-xl transition-all"
            >
              Já tenho conta
            </Link>
          </div>

          <div className="mt-10 flex items-center gap-6">
            {["Sem cartão de crédito", "Setup em minutos", "Dados isolados por empresa"].map((t) => (
              <div key={t} className="flex items-center gap-1.5 text-white/50 text-xs">
                <CheckCircle className="w-3.5 h-3.5 text-violet-400 flex-shrink-0" />
                {t}
              </div>
            ))}
          </div>
        </div>

        {/* App mockup */}
        <div className="relative hidden lg:block">
          <div className="relative bg-[#1a1030] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
            {/* Mockup header bar */}
            <div className="flex items-center gap-1.5 px-4 py-3 border-b border-white/10 bg-white/5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
              <span className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
              <span className="ml-2 text-xs text-white/30 font-mono">icenexus — Dashboard</span>
            </div>

            {/* Mockup content */}
            <div className="p-5 space-y-4">
              {/* Stats row */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "OS em aberto", value: "12", color: "text-violet-400" },
                  { label: "Concluídas hoje", value: "4", color: "text-emerald-400" },
                  { label: "Técnicos ativos", value: "6", color: "text-cyan-400" },
                ].map((s) => (
                  <div key={s.label} className="bg-white/5 rounded-xl p-3">
                    <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                    <p className="text-xs text-white/40 mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Orders list */}
              <div className="bg-white/5 rounded-xl overflow-hidden">
                <div className="px-4 py-2.5 border-b border-white/5">
                  <p className="text-xs font-semibold text-white/50 uppercase tracking-wider">Ordens recentes</p>
                </div>
                {[
                  { client: "Atacadão Norte", tech: "Carlos M.", status: "Em andamento", badge: "bg-amber-500/20 text-amber-300" },
                  { client: "Supermercado BH", tech: "Rafael S.", status: "Concluída", badge: "bg-emerald-500/20 text-emerald-300" },
                  { client: "Frigorífico Delta", tech: "Lucas T.", status: "Agendada", badge: "bg-violet-500/20 text-violet-300" },
                ].map((o) => (
                  <div key={o.client} className="flex items-center justify-between px-4 py-2.5 border-b border-white/5 last:border-0">
                    <div>
                      <p className="text-xs font-medium text-white/80">{o.client}</p>
                      <p className="text-xs text-white/30">{o.tech}</p>
                    </div>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${o.badge}`}>{o.status}</span>
                  </div>
                ))}
              </div>

              {/* Checklist preview */}
              <div className="bg-white/5 rounded-xl p-4">
                <p className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">Checklist — Split Hi-wall</p>
                {[
                  { label: "Filtro de ar limpo", done: true },
                  { label: "Serpentina evaporadora", done: true },
                  { label: "Pressão do compressor", done: false },
                  { label: "Sistema elétrico", done: false },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-2.5 py-1">
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0 ${item.done ? "bg-emerald-500/30 border-emerald-500/50" : "border-white/20"}`}>
                      {item.done && <CheckCircle className="w-3 h-3 text-emerald-400" />}
                    </div>
                    <p className={`text-xs ${item.done ? "text-white/40 line-through" : "text-white/70"}`}>{item.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Floating badge */}
          <div className="absolute -bottom-4 -left-6 bg-white rounded-xl shadow-xl px-4 py-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center">
              <FileText className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-800">Laudo gerado</p>
              <p className="text-[10px] text-gray-400">PDF em 1 clique</p>
            </div>
          </div>

          <div className="absolute -top-4 -right-4 bg-white rounded-xl shadow-xl px-4 py-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-violet-100 flex items-center justify-center">
              <Users className="w-4 h-4 text-violet-600" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-800">Multi-empresa</p>
              <p className="text-[10px] text-gray-400">Dados 100% isolados</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom wave */}
      <div className="absolute bottom-0 inset-x-0 h-24 bg-gradient-to-t from-white to-transparent" />
    </section>
  );
}

// ─── STATS BAR ──────────────────────────────────────────────────────────────

function StatsBar() {
  const stats = [
    { value: "100%", label: "Digital, zero papel" },
    { value: "< 1 min", label: "Para gerar um laudo PDF" },
    { value: "Multi-empresa", label: "Dados isolados por conta" },
    { value: "Web + Mobile", label: "Acesso em qualquer dispositivo" },
  ];

  return (
    <section className="bg-violet-700 py-10">
      <div className="max-w-7xl mx-auto px-5">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-2xl font-bold text-white">{s.value}</p>
              <p className="text-sm text-violet-200 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── FEATURES ───────────────────────────────────────────────────────────────

const features = [
  {
    icon: ClipboardList,
    color: "bg-violet-100 text-violet-600",
    title: "Checklists por componente",
    desc: "Cada equipamento carrega seus próprios componentes. O técnico vê exatamente o que inspecionar — sem improvisar.",
  },
  {
    icon: FileText,
    color: "bg-emerald-100 text-emerald-600",
    title: "Laudo técnico em PDF",
    desc: "Ao concluir a ordem de serviço, o laudo é gerado automaticamente, profissional e pronto para enviar ao cliente.",
  },
  {
    icon: CalendarDays,
    color: "bg-sky-100 text-sky-600",
    title: "Calendário de agendamentos",
    desc: "Visualize todas as OS no calendário. Identifique conflitos de agenda antes que virem problema no campo.",
  },
  {
    icon: Users,
    color: "bg-amber-100 text-amber-600",
    title: "Gestão de técnicos",
    desc: "Cadastre técnicos, atribua ordens e acompanhe quem está fazendo o quê — tudo em tempo real.",
  },
  {
    icon: Wrench,
    color: "bg-rose-100 text-rose-600",
    title: "Cadastro de equipamentos",
    desc: "Registre cada ativo com seus componentes, marca, modelo e histórico completo de manutenções realizadas.",
  },
  {
    icon: BarChart3,
    color: "bg-indigo-100 text-indigo-600",
    title: "Indicadores de desempenho",
    desc: "Acompanhe OS abertas, concluídas e pendentes no dashboard. Tome decisões baseadas em dados reais.",
  },
];

function Features() {
  return (
    <section id="features" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-5">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-violet-600 text-sm font-semibold uppercase tracking-wider">Funcionalidades</span>
          <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-gray-900 leading-tight">
            Tudo que sua empresa de refrigeração precisa
          </h2>
          <p className="mt-4 text-gray-500 text-lg">
            Desenvolvido para o fluxo real de trabalho de equipes de manutenção de refrigeração.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f) => (
            <div
              key={f.title}
              className="group p-6 rounded-2xl border border-gray-100 hover:border-violet-200 hover:shadow-lg hover:shadow-violet-500/5 transition-all duration-300 bg-white"
            >
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 ${f.color}`}>
                <f.icon className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">{f.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── HOW IT WORKS ───────────────────────────────────────────────────────────

function HowItWorks() {
  const steps = [
    {
      num: "01",
      title: "Cadastre clientes e equipamentos",
      desc: "Registre cada equipamento com seus grupos de componentes (Evaporadora, Condensadora, Sistema Elétrico…). Esse cadastro alimenta todos os checklists automaticamente.",
      highlight: "Sem planilha, sem papel",
    },
    {
      num: "02",
      title: "Crie a ordem de serviço",
      desc: "Selecione cliente, equipamento e técnico. O sistema monta o checklist com base nos componentes do equipamento escolhido. Agende e pronto.",
      highlight: "Checklist automático por equipamento",
    },
    {
      num: "03",
      title: "O técnico executa no campo",
      desc: "O técnico acessa a OS pelo celular, preenche as verificações, medições e trocas. Tudo registrado em tempo real, com foto e observações.",
      highlight: "100% pelo celular",
    },
    {
      num: "04",
      title: "Laudo gerado, cliente atendido",
      desc: "Ao concluir, o gestor aprova e o laudo técnico em PDF é gerado automaticamente. Profissional, completo e pronto para enviar.",
      highlight: "PDF em 1 clique",
    },
  ];

  return (
    <section id="how" className="py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-5">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-violet-600 text-sm font-semibold uppercase tracking-wider">Como funciona</span>
          <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-gray-900 leading-tight">
            Do zero ao laudo em 4 passos
          </h2>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, i) => (
            <div key={step.num} className="relative">
              {i < steps.length - 1 && (
                <div className="hidden lg:block absolute top-8 left-full w-full h-px bg-violet-200 z-0 -translate-y-px" style={{ width: "calc(100% - 2rem)", left: "calc(100% - 1rem)" }} />
              )}
              <div className="relative z-10 bg-white rounded-2xl p-6 border border-gray-100 h-full">
                <div className="text-4xl font-black text-violet-100 mb-4">{step.num}</div>
                <h3 className="font-semibold text-gray-900 mb-2 text-sm leading-snug">{step.title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed mb-4">{step.desc}</p>
                <div className="inline-flex items-center gap-1 bg-violet-50 text-violet-600 text-xs font-medium px-2.5 py-1 rounded-full">
                  <CheckCircle className="w-3 h-3" />
                  {step.highlight}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── AUDIENCE ────────────────────────────────────────────────────────────────

function Audience() {
  const pains = [
    "OS em papéis avulsos ou WhatsApp",
    "Checklists diferentes por técnico",
    "Perda de histórico de equipamentos",
    "Laudos feitos à mão ou no Word",
    "Gestor sem visibilidade do campo",
    "Agendamentos por memória ou caderno",
  ];

  const gains = [
    "OS digitais com rastreio completo",
    "Checklist padrão por equipamento",
    "Histórico de cada ativo em segundos",
    "Laudo PDF gerado automaticamente",
    "Dashboard em tempo real",
    "Calendário visual de agendamentos",
  ];

  return (
    <section id="audience" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-5">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-violet-600 text-sm font-semibold uppercase tracking-wider">Para quem é</span>
          <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-gray-900">
            Empresas de manutenção que cansaram de improvisar
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Before */}
          <div className="rounded-2xl border border-red-100 bg-red-50/50 p-6">
            <div className="flex items-center gap-2 mb-5">
              <span className="text-2xl">😩</span>
              <h3 className="font-semibold text-gray-800">Antes do IceNexus</h3>
            </div>
            <ul className="space-y-3">
              {pains.map((p) => (
                <li key={p} className="flex items-start gap-2.5 text-sm text-gray-600">
                  <X className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                  {p}
                </li>
              ))}
            </ul>
          </div>

          {/* After */}
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-6">
            <div className="flex items-center gap-2 mb-5">
              <span className="text-2xl">😎</span>
              <h3 className="font-semibold text-gray-800">Com o IceNexus</h3>
            </div>
            <ul className="space-y-3">
              {gains.map((g) => (
                <li key={g} className="flex items-start gap-2.5 text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                  {g}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Badges */}
        <div className="mt-14 flex flex-wrap justify-center gap-4">
          {[
            { icon: ShieldCheck, label: "Dados por empresa isolados" },
            { icon: Smartphone, label: "Responsivo para celular" },
            { icon: Zap, label: "Setup em menos de 1 hora" },
          ].map((b) => (
            <div key={b.label} className="flex items-center gap-2.5 bg-gray-50 border border-gray-200 px-5 py-3 rounded-full">
              <b.icon className="w-4 h-4 text-violet-600" />
              <span className="text-sm font-medium text-gray-700">{b.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── CTA SECTION ────────────────────────────────────────────────────────────

function CTASection() {
  return (
    <section className="py-24 bg-gradient-to-br from-violet-700 via-violet-600 to-violet-800">
      <div className="max-w-3xl mx-auto px-5 text-center">
        <h2 className="text-3xl sm:text-4xl font-bold text-white leading-tight">
          Pronto para digitalizar sua operação?
        </h2>
        <p className="mt-4 text-violet-200 text-lg max-w-xl mx-auto">
          Crie sua conta em segundos, cadastre seus equipamentos e emita seu primeiro laudo hoje.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/register"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-violet-700 font-bold rounded-xl hover:bg-violet-50 transition-colors shadow-lg shadow-violet-900/20 text-base"
          >
            Criar conta grátis
            <ChevronRight className="w-4 h-4" />
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/10 border border-white/20 text-white font-medium rounded-xl hover:bg-white/20 transition-colors text-base"
          >
            Já tenho conta
          </Link>
        </div>
        <p className="mt-6 text-violet-300 text-sm">Sem cartão de crédito · Sem prazo mínimo</p>
      </div>
    </section>
  );
}

// ─── FOOTER ─────────────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer className="bg-[#0d0920] py-12 border-t border-white/5">
      <div className="max-w-7xl mx-auto px-5">
        <div className="flex flex-col md:flex-row justify-between items-start gap-8">
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <Image src="/LOGO_COR.png" alt="Ice Nexus" width={30} height={30} className="object-contain" />
              <span className="font-bold text-lg text-white">IceNexus</span>
            </div>
            <p className="text-sm text-white/40 max-w-xs leading-relaxed">
              Sistema de gestão de manutenção de refrigeração. Do campo ao laudo, tudo em um lugar.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 text-sm">
            <div>
              <p className="text-white/60 font-semibold mb-3">Produto</p>
              <ul className="space-y-2">
                {["Funcionalidades", "Como funciona", "Para quem é"].map((l) => (
                  <li key={l}>
                    <a href="#" className="text-white/30 hover:text-white/60 transition-colors">{l}</a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-white/60 font-semibold mb-3">Acesso</p>
              <ul className="space-y-2">
                {[
                  { label: "Entrar", href: "/login" },
                  { label: "Criar conta", href: "/register" },
                ].map((l) => (
                  <li key={l.label}>
                    <Link href={l.href} className="text-white/30 hover:text-white/60 transition-colors">{l.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-white/20">© {new Date().getFullYear()} IceNexus. Todos os direitos reservados.</p>
          <p className="text-xs text-white/20">Gestão de refrigeração inteligente</p>
        </div>
      </div>
    </footer>
  );
}

// ─── PAGE ────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <Hero />
      <StatsBar />
      <Features />
      <HowItWorks />
      <Audience />
      <CTASection />
      <Footer />
    </div>
  );
}
