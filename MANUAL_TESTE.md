# Manual de Teste — IceNexus

**Ambiente:** http://localhost:3000  
**Data:** Abril 2026

---

## Credenciais de Acesso

| Perfil | Email | Senha |
|---|---|---|
| Super Admin | `admin@icenexus.com` | `admin123` |
| Gestor | `gestor@icenexus.com` | `gestor123` |
| Técnico | `tecnico@icenexus.com` | `tecnico123` |

---

## 1. Super Admin

### 1.1 Login
1. Acesse `/login`
2. Entre com `admin@icenexus.com` / `admin123`
3. **Esperado:** redirecionamento para `/admin`

### 1.2 Dashboard Global
- Verificar cards de KPI: Empresas, Técnicos, Equipamentos, Ordens de Serviço
- Verificar linha de status das OS: Pendentes / Em Execução / Concluídas
- Verificar tabela de empresas com stats por tenant (técnicos, clientes, equipamentos, OS)
- Verificar feed de últimas ordens de serviço

### 1.3 Gerenciamento de Usuários
1. Navegar para **Usuários** na sidebar
2. Verificar lista completa com busca por nome/email
3. Filtrar por papel: Todos / Gestor / Técnico / Super Admin
4. Filtrar por status: Ativo / Inativo
5. **Criar novo usuário:** botão "Novo Usuário" → preencher nome, email, senha, papel
6. **Editar usuário:** clicar no ícone de edição → alterar campos → salvar
7. **Desativar/ativar usuário:** toggle na coluna "Ativo"
8. **Alterar senha:** na edição, preencher o campo "Nova Senha" (deixar vazio mantém a senha atual)

---

## 2. Gestor

### 2.1 Login
1. Acesse `/login`
2. Entre com `gestor@icenexus.com` / `gestor123`
3. **Esperado:** redirecionamento para `/manager`

---

### 2.2 Clientes

#### Criar cliente
1. Menu → **Clientes** → **Novo Cliente**
2. Preencher: Nome*, Documento, Email, Telefone, Endereço
3. Salvar
4. **Esperado:** redirecionamento para lista de clientes com o novo item

#### Editar cliente
1. Na lista, clicar no cliente
2. Alterar campos → Salvar

#### Aviso de saída sem salvar
1. Iniciar cadastro de cliente, preencher algum campo
2. Clicar em qualquer item da sidebar ou botão "Cancelar"
3. **Esperado:** modal perguntando se deseja sair sem salvar

---

### 2.3 Equipamentos

#### Criar equipamento com componentes e arquivos
1. Menu → **Equipamentos** → **Novo Equipamento**
2. Preencher: Nome*, Tipo*, Cliente*, Marca, Modelo, Nº de Série, Data de Instalação
3. Em **Componentes**, clicar em "Adicionar Componente"
   - Dar nome ao componente (ex: "Compressor")
   - Adicionar peças (itens) pelo campo de texto + botão "+"
   - Clicar no ícone de clipe para **anexar arquivo** (PDF ou imagem)
4. Adicionar mais componentes se desejar
5. Salvar
6. **Esperado:** equipamento criado com componentes, peças e arquivos salvos

#### QR Code do equipamento
1. Abrir equipamento salvo
2. Clicar no botão **"QR Code"** no cabeçalho
3. **Esperado:** modal com QR Code gerado e URL do equipamento
4. Clicar em **"Baixar PNG"** → arquivo salvo com nome do equipamento e cliente

#### Página pública do equipamento
1. Copiar a URL exibida no modal de QR Code (formato `/equip/[id]`)
2. Acessar em modo anônimo ou outra aba
3. **Esperado:** histórico completo de ordens de serviço do equipamento

---

### 2.4 Checklists

#### Criar template de checklist
1. Menu → **Checklists** → **Novo Checklist**
2. Preencher: Nome*, Tipo de Equipamento, Descrição
3. Em **Componentes**, clicar em "Adicionar Componente"
   - Dar nome (ex: "Filtro")
   - Adicionar ações (ex: "Limpar filtro de ar")
   - Para cada ação, opcionalmente:
     - Selecionar tipo: Texto / Número / Booleano
     - Para Número: adicionar unidades (ex: "°C", "A")
     - Preencher campo **"Orientação"** (instrução técnica para o técnico)
     - Clicar no ícone de clipe para **anexar arquivo de referência**
4. Salvar
5. **Esperado:** template salvo com todos os dados

---

### 2.5 Ordens de Serviço

#### Criar OS
1. Menu → **Ordens de Serviço** → **Nova OS**
2. Preencher:
   - **Cliente** (busca pelo nome)
   - **Equipamento** (filtrado pelo cliente selecionado)
   - **Técnico** (lista de técnicos ativos)
   - **Checklist** (template de manutenção)
   - **Data Agendada**
   - Observações (opcional)
3. Salvar
4. **Esperado:** OS criada com status "Pendente"

#### Acompanhar OS
1. Na lista, verificar status (Pendente / Em Execução / Concluída)
2. Clicar na OS para ver detalhes
3. Quando concluída, clicar em **"Baixar PDF"** para gerar laudo

---

## 3. Técnico

### 3.1 Login
1. Acesse `/login`
2. Entre com `tecnico@icenexus.com` / `tecnico123`
3. **Esperado:** redirecionamento para `/technician`

---

### 3.2 Executar Ordem de Serviço

#### Iniciar OS
1. Na lista de OS, selecionar uma OS com status "Pendente"
2. Revisar dados: cliente, equipamento, data
3. Verificar seção **"Referência do Equipamento"** (collapsible):
   - Lista de componentes com peças
   - Arquivos anexados (clicar para abrir)
4. Clicar em **"Iniciar OS"**
5. **Esperado:** status muda para "Em Execução", formulário de execução habilitado

#### Preencher checklist
Para cada componente/ação:
1. Verificar indicadores visuais no cabeçalho do componente:
   - **Ponto âmbar** = alguma ação tem orientação técnica
   - **Ponto violeta** = alguma ação tem arquivo de referência
2. Expandir uma ação
3. Se tiver orientação: clicar no botão **âmbar "Orientação"** → ler o texto
4. Se tiver arquivo: clicar na **pílula violeta** com nome do arquivo → abre em nova aba
5. Preencher o valor da ação:
   - **Booleano:** Sim / Não / N/A
   - **Número:** digitar valor e selecionar unidade
   - **Texto:** campo livre
6. Adicionar **observação** (opcional)
7. Clicar em **"Adicionar foto"** → selecionar imagem da câmera ou galeria
8. **Esperado:** foto exibida como thumbnail após upload

#### Concluir OS
1. Preencher todas as ações necessárias
2. Clicar em **"Concluir OS"**
3. **Esperado:** status muda para "Concluída", OS não editável

---

## 4. Cenário de Teste Completo (ponta a ponta)

Execute nesta ordem para testar o fluxo completo:

```
1. [Admin]   Criar um Gestor novo em /admin/users/new
2. [Gestor]  Criar um Cliente
3. [Gestor]  Criar um Equipamento com 2 componentes, peças e 1 PDF por componente
4. [Gestor]  Criar um Checklist com orientações e arquivos por ação
5. [Gestor]  Criar uma OS atribuída ao Técnico
6. [Técnico] Abrir a OS, verificar referência do equipamento e orientações
7. [Técnico] Iniciar, preencher todas as ações com foto
8. [Técnico] Concluir a OS
9. [Gestor]  Baixar o PDF da OS concluída
10.[Gestor]  Acessar o QR Code do equipamento e verificar histórico
```

---

## 5. Checklist de Verificação Rápida

| Funcionalidade | Testado | OK |
|---|---|---|
| Login Gestor | ☐ | ☐ |
| Login Técnico | ☐ | ☐ |
| Login Super Admin | ☐ | ☐ |
| Aviso ao sair sem salvar (sidebar) | ☐ | ☐ |
| Criar cliente | ☐ | ☐ |
| Criar equipamento com componentes | ☐ | ☐ |
| Anexar arquivo ao componente | ☐ | ☐ |
| QR Code — gerar e baixar | ☐ | ☐ |
| Página pública `/equip/[id]` | ☐ | ☐ |
| Criar checklist com orientações | ☐ | ☐ |
| Anexar arquivo a ação do checklist | ☐ | ☐ |
| Criar OS | ☐ | ☐ |
| Técnico vê referência do equipamento | ☐ | ☐ |
| Técnico vê orientações por ação | ☐ | ☐ |
| Técnico vê arquivos da ação | ☐ | ☐ |
| Upload de foto por ação | ☐ | ☐ |
| Concluir OS | ☐ | ☐ |
| Gerar PDF da OS | ☐ | ☐ |
| Dashboard Super Admin | ☐ | ☐ |
| Criar/editar/desativar usuário (Admin) | ☐ | ☐ |
