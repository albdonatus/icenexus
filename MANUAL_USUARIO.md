# Manual do Usuário — Ciclo de Manutenção Preventiva
### IceNexus — Sistema de Gestão de Refrigeração

---

## Visão Geral do Ciclo

```
GESTOR                          TÉCNICO
  │                                │
  ├─ 1. Cadastrar Cliente          │
  ├─ 2. Cadastrar Equipamento      │
  ├─ 3. Criar Checklist            │
  ├─ 4. Abrir Ordem de Serviço ───►│
  │                                ├─ 5. Iniciar OS
  │                                ├─ 6. Executar Checklist
  │                                └─ 7. Concluir OS
  │                                         │
  ├─ 8. Revisar OS Concluída ◄──────────────┘
  └─ 9. Gerar Laudo em PDF
```

---

## PARTE 1 — Configuração Inicial (feita uma vez)

> Esta parte é necessária apenas na primeira vez ou ao cadastrar um novo cliente/equipamento.

---

### Passo 1 — Cadastrar o Cliente

1. No menu lateral, clique em **Clientes**
2. Clique no botão **"Novo Cliente"**
3. Preencha os dados:
   - **Nome** *(obrigatório)* — razão social ou nome do cliente
   - **Documento** — CNPJ ou CPF
   - **Telefone** — para contato
   - **Email** — para comunicação
   - **Endereço** — local onde o equipamento está instalado
4. Clique em **"Salvar"**

---

### Passo 2 — Cadastrar o Equipamento

1. No menu lateral, clique em **Equipamentos**
2. Clique em **"Novo Equipamento"**
3. Preencha os dados principais:
   - **Nome** *(obrigatório)* — ex: "Split Sala de Reuniões"
   - **Tipo** *(obrigatório)* — ex: "Split", "Chiller", "Fan Coil"
   - **Cliente** *(obrigatório)* — selecione o cliente cadastrado
   - **Marca / Modelo / Nº de Série** — para rastreabilidade
   - **Data de Instalação** — para histórico

4. Em **Componentes**, registre as peças do equipamento:
   - Clique em **"Adicionar Componente"**
   - Dê um nome (ex: "Compressor", "Filtro de Ar", "Condensador")
   - Adicione as peças do componente no campo de texto e clique em **"+"**
   - Para anexar um manual técnico ou foto da peça, clique no ícone de **clipe 📎**

5. Clique em **"Salvar"**

> **Dica:** Quanto mais detalhado o cadastro do equipamento, mais informação o técnico terá em campo.

---

### Passo 3 — Criar o Checklist de Manutenção

O checklist define **o que deve ser verificado e como** em cada manutenção.

1. No menu lateral, clique em **Checklists**
2. Clique em **"Novo Checklist"**
3. Preencha:
   - **Nome** — ex: "Manutenção Preventiva Mensal — Split"
   - **Tipo de Equipamento** — ex: "Split" (para filtrar depois)
   - **Descrição** — resumo do que o checklist cobre

4. Adicione os **Componentes do Checklist**:
   - Clique em **"Adicionar Componente"**
   - Nomeie o componente (ex: "Filtro de Ar", "Sistema Elétrico")

5. Para cada componente, adicione as **Ações**:
   - Digite a descrição da ação (ex: "Verificar corrente elétrica")
   - Escolha o **tipo de resposta**:
     - **Booleano** — Sim / Não / N/A (para verificações simples)
     - **Número** — para medições (adicione a unidade: °C, A, V, etc.)
     - **Texto** — para observações descritivas
   - **Orientação** *(opcional)* — instrução técnica que aparece para o técnico em campo (ex: "Corrente máxima permitida: 12A")
   - **Arquivo de referência** *(opcional)* — clique em 📎 para anexar diagrama, tabela ou foto de referência

6. Clique em **"Salvar"**

---

## PARTE 2 — Abertura da Ordem de Serviço

---

### Passo 4 — Criar a Ordem de Serviço

1. No menu lateral, clique em **Ordens de Serviço**
2. Clique em **"Nova OS"**
3. Preencha:
   - **Cliente** — busque pelo nome
   - **Equipamento** — a lista filtra automaticamente pelo cliente selecionado
   - **Técnico** — selecione o técnico responsável pela visita
   - **Checklist** — selecione o template criado no Passo 3
   - **Data Agendada** — data prevista para a manutenção
   - **Observações** *(opcional)* — instruções especiais para o técnico

4. Clique em **"Salvar"**

> A OS é criada com status **Pendente** e fica visível na lista do técnico.

---

## PARTE 3 — Execução em Campo (Técnico)

---

### Passo 5 — Acessar e Iniciar a OS

1. Faça login com suas credenciais de técnico
2. Na lista de OS, localize a OS com status **"Pendente"**
3. Clique na OS para abrir os detalhes
4. Revise as informações: cliente, equipamento, data e observações do gestor
5. Expanda a seção **"Referência do Equipamento"** para consultar:
   - Componentes e peças cadastrados
   - Arquivos técnicos anexados
6. Clique em **"Iniciar OS"**

> Status muda para **Em Execução** e o formulário de checklist é liberado.

---

### Passo 6 — Executar o Checklist

Para cada componente listado:

1. **Verifique os indicadores no cabeçalho do componente:**
   - 🟡 Ponto âmbar = há orientações técnicas nas ações
   - 🟣 Ponto violeta = há arquivos de referência nas ações

2. **Para cada ação:**
   - Se houver orientação, clique no botão âmbar **"Orientação"** para ler a instrução
   - Se houver arquivo, clique na pílula roxa com o nome do arquivo para abri-lo
   - Preencha o resultado:
     - **Booleano:** selecione Sim, Não ou N/A
     - **Número:** digite o valor medido e selecione a unidade
     - **Texto:** descreva o que foi observado
   - Adicione uma **observação** se necessário
   - Clique em **"Adicionar foto"** para registrar imagens do serviço

3. Repita para todos os componentes do checklist

> **Dica:** Fotografe tudo — antes, durante e depois. O laudo final inclui as fotos.

---

### Passo 7 — Concluir a OS

1. Após preencher todas as ações, clique em **"Concluir OS"**
2. Confirme a conclusão
3. **Esperado:** status muda para **Concluída** e a OS é bloqueada para edição

---

## PARTE 4 — Encerramento (Gestor)

---

### Passo 8 — Revisar a OS Concluída

1. No menu lateral, clique em **Ordens de Serviço**
2. Localize a OS com status **"Concluída"**
3. Abra para revisar:
   - Todas as respostas do checklist
   - Fotos tiradas pelo técnico
   - Observações por ação
   - Horário de início e conclusão

---

### Passo 9 — Gerar o Laudo em PDF

1. Com a OS aberta, clique no botão **"Baixar PDF"**
2. O laudo é gerado com:
   - Dados do cliente e equipamento
   - Data e técnico responsável
   - Resultado de cada ação do checklist
   - Fotos registradas
   - Observações
3. Salve ou envie ao cliente

---

## PARTE 5 — Recursos Extras

---

### QR Code do Equipamento

Cada equipamento possui um QR Code único que dá acesso ao **histórico completo de manutenções**.

**Como gerar:**
1. Abra o equipamento
2. Clique no botão **"QR Code"** no cabeçalho
3. Clique em **"Baixar PNG"** para salvar a imagem

**Como usar:**
- Cole o QR Code na plaqueta física do equipamento
- Qualquer pessoa com o app de câmera pode escanear e ver o histórico
- A página é pública — não requer login

---

## Resumo do Ciclo

| # | Quem | O que fazer |
|---|---|---|
| 1 | Gestor | Cadastrar o cliente |
| 2 | Gestor | Cadastrar o equipamento com componentes |
| 3 | Gestor | Criar o checklist com ações e orientações |
| 4 | Gestor | Abrir a Ordem de Serviço |
| 5 | Técnico | Iniciar a OS em campo |
| 6 | Técnico | Preencher o checklist com medições e fotos |
| 7 | Técnico | Concluir a OS |
| 8 | Gestor | Revisar os resultados |
| 9 | Gestor | Gerar e entregar o laudo em PDF |

---

*IceNexus — Gestão de manutenção de refrigeração*
