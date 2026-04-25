# 🌿 FlowBit

> Backend em NestJS para um bot Telegram de gestão de finanças pessoais com segurança por ownership em cada operação.

![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=flat&logo=nestjs&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=flat&logo=postgresql&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=flat&logo=prisma&logoColor=white)
![Telegram](https://img.shields.io/badge/Telegram_Bot-26A5E4?style=flat&logo=telegram&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white)
![Jest](https://img.shields.io/badge/Jest-C21325?style=flat&logo=jest&logoColor=white)

---

> 🤖 **Curiosidade:** Este projeto está sendo desenvolvido inteiramente por um agente de IA. Em resumo um agente criando outro agente, de finanças.

---

## Visão Geral

FlowBit permite que cada usuário registre transações e consulte resumos financeiros com segurança via **ownership**: toda operação protegida valida se os dados realmente pertencem ao usuário do Telegram autenticado.

---

## Objetivos

| | Funcionalidade |
|--|--|
| 📥 | Registrar receitas e despesas com categorias e descrição opcional |
| 🔍 | Consultar histórico com filtros e paginação |
| 📊 | Obter visão financeira consolidada (saldo, entradas e saídas) |
| 🤖 | Expor API robusta para comandos do bot Telegram via Telegraf |

---

## Stack Técnica

- **Runtime:** Node.js
- **Framework:** NestJS
- **Banco de dados:** PostgreSQL + Prisma ORM
- **Validação:** class-validator, class-transformer
- **Bot:** Telegraf
- **Testes:** Jest

---

## Arquitetura

A aplicação segue a arquitetura modular do NestJS com separação clara de responsabilidades:

```
Usuário no Telegram → TelegramAuthGuard → Services → PostgreSQL → Resposta
```

**Camadas:**

- **Controllers (HTTP)** — recebe requests, valida entrada e delega para services
- **Services (negócio)** — aplica regras de domínio e validação de ownership
- **PrismaService (dados)** — acesso ao PostgreSQL via Prisma Client
- **Telegram Service** — conecta comandos do bot via DI, sem HTTP interno

---

## Estrutura do Projeto

```
src/
├── app.module.ts
├── main.ts
├── common/
│   ├── decorators/
│   ├── filters/
│   ├── guards/
│   ├── interceptors/
│   └── pipes/
├── prisma/
│   ├── prisma.module.ts
│   └── prisma.service.ts
├── modules/
│   ├── health/          # status da aplicação
│   ├── users/           # cadastro do usuário Telegram
│   ├── transactions/    # CRUD de transações do próprio usuário
│   └── finances/        # resumos e agregações financeiras
└── telegram/
    ├── telegram.module.ts
    └── telegram.service.ts  # handlers e orquestração
```

---

## Segurança e Validação

- Rotas protegidas exigem o cabeçalho `X-Telegram-User-Id`
- `TelegramAuthGuard` valida existência do usuário e ownership de cada recurso
- `ValidationPipe` global com `whitelist` para bloquear campos desconhecidos
- Segredos e credenciais apenas via variáveis de ambiente — nunca no código

---

## Banco de Dados

**Modelos principais:**

- `User` — identifica o usuário do Telegram
- `Transaction` — movimentações financeiras vinculadas ao usuário

Índices aplicados para consultas frequentes por usuário, data, tipo e categoria.

---

## Testes

- Testes unitários por módulo (controllers e services)
- Mocks de `PrismaService` para isolar regras de negócio
- Cobertura para cenários de sucesso, erro e guards de autenticação

---

## Como Rodar Localmente

**1. Instale as dependências**

```bash
npm install
```

**2. Configure o `.env`** com base no `.env.example`

```env
TELEGRAM_BOT_TOKEN=
DATABASE_URL=
NODE_ENV=development
PORT=3000
JWT_SECRET=
```

**3. Prepare o banco de dados**

```bash
npm run db:generate
npm run db:migrate
```

**4. Inicie em modo desenvolvimento**

```bash
npm run start:dev
```

---

## Scripts

| Script | Descrição |
|--------|-----------|
| `npm run start:dev` | Inicia em modo watch |
| `npm run build` | Compila o projeto |
| `npm run test` | Roda os testes unitários |
| `npm run test:watch` | Testes em modo watch |
| `npm run test:cov` | Relatório de cobertura |
| `npm run db:migrate` | Executa as migrações |
| `npm run db:generate` | Gera o Prisma Client |

---

## Coleção Postman

Para validar os endpoints localmente, importe o arquivo:

```
postman/FlowBit.local.postman_collection.json
```