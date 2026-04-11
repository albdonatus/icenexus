# Ice Nexus

Sistema de Gestão de Manutenção de Refrigeração — MVP

## Stack

- **Next.js 16** (App Router) + TypeScript
- **PostgreSQL** + **Prisma 6**
- **NextAuth.js v5** (autenticação JWT)
- **Tailwind CSS 4**
- **@react-pdf/renderer** (relatórios PDF)

## Como rodar

### 1. Pré-requisitos

- Node.js 20.x
- PostgreSQL rodando localmente

### 2. Configurar ambiente

```bash
cp .env.local .env.local   # já criado, edite se necessário
```

Edite `.env.local`:
```
DATABASE_URL="postgresql://postgres:sua_senha@localhost:5432/icenexus?schema=public"
AUTH_SECRET="troque-por-string-aleatoria-de-32-chars"
NEXTAUTH_URL="http://localhost:3000"
```

### 3. Criar banco e rodar migrations

```bash
npx prisma migrate dev --name init
```

### 4. Popular banco com dados de exemplo

```bash
npx prisma db seed
```

Credenciais criadas:
- **Gestor:** `gestor@icenexus.com` / `gestor123`
- **Técnico:** `tecnico@icenexus.com` / `tecnico123`

### 5. Rodar o servidor

```bash
npm run dev
```

Acesse: http://localhost:3000

## Scripts úteis

```bash
npm run db:migrate    # criar/aplicar migrations
npm run db:seed       # popular banco
npm run db:studio     # abrir Prisma Studio
```

## Estrutura do projeto

```
src/
├── app/
│   ├── login/              # Tela de login
│   ├── manager/            # Área do gestor
│   │   ├── clients/
│   │   ├── equipment/
│   │   ├── checklists/
│   │   ├── service-orders/
│   │   └── technicians/
│   ├── technician/         # Área do técnico (mobile-first)
│   │   └── orders/[id]/
│   └── api/                # Route handlers
├── components/
│   ├── ui/                 # Componentes base
│   ├── layout/             # Sidebar, MobileHeader
│   ├── forms/              # ChecklistTemplateBuilder
│   └── service-orders/     # ExecutionScreen
└── lib/
    ├── auth.ts             # NextAuth config
    ├── prisma.ts           # Prisma singleton
    ├── pdf.tsx             # Geração de PDF
    └── utils.ts            # Helpers
```
