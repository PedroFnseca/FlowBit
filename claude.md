# CLAUDE.md — Telegram Finance Bot

## Project Overview

A Telegram bot backend for personal finance management. Users interact via Telegram; the API validates that every request originates from the authenticated Telegram user before touching their data.

**Stack:** Node.js · NestJS · PostgreSQL · Prisma ORM · class-validator · Telegraf (Telegram bot framework)

---

## Environment Variables

All secrets and credentials come exclusively from environment variables. Never hard-code them.

```env
# Telegram
TELEGRAM_BOT_TOKEN=          # Bot token from @BotFather

# Database
DATABASE_URL=                # postgresql://user:password@host:5432/dbname

# App
NODE_ENV=development         # development | test | production
PORT=3000
JWT_SECRET=                  # Secret for signing internal tokens (if needed)
```

Use a `.env` file locally (gitignored). In CI/CD inject variables via secrets manager.

---

## Project Structure

```
src/
├── app.module.ts                  # Root module
├── main.ts                        # Bootstrap + Telegraf setup
│
├── common/
│   ├── decorators/
│   │   └── telegram-user.decorator.ts   # Extracts Telegram user from request
│   ├── guards/
│   │   └── telegram-auth.guard.ts       # Validates request owner = telegram user
│   ├── filters/
│   │   └── http-exception.filter.ts     # Global error handler
│   ├── interceptors/
│   │   └── logging.interceptor.ts
│   └── pipes/
│       └── validation.pipe.ts           # Global class-validator pipe
│
├── prisma/
│   ├── prisma.module.ts
│   ├── prisma.service.ts
│   └── schema.prisma
│
├── modules/
│   ├── health/
│   │   ├── health.controller.ts
│   │   └── health.module.ts
│   │
│   ├── users/
│   │   ├── users.module.ts
│   │   ├── users.controller.ts
│   │   ├── users.service.ts
│   │   ├── dto/
│   │   │   └── create-user.dto.ts
│   │   └── __tests__/
│   │       ├── users.controller.spec.ts
│   │       └── users.service.spec.ts
│   │
│   ├── transactions/
│   │   ├── transactions.module.ts
│   │   ├── transactions.controller.ts
│   │   ├── transactions.service.ts
│   │   ├── dto/
│   │   │   └── create-transaction.dto.ts
│   │   └── __tests__/
│   │       ├── transactions.controller.spec.ts
│   │       └── transactions.service.spec.ts
│   │
│   └── finances/
│       ├── finances.module.ts
│       ├── finances.controller.ts
│       ├── finances.service.ts
│       └── __tests__/
│           ├── finances.controller.spec.ts
│           └── finances.service.spec.ts
│
└── telegram/
    ├── telegram.module.ts
    ├── telegram.service.ts         # Telegraf bot instance + command handlers
    └── __tests__/
        └── telegram.service.spec.ts
```

---

## Prisma Schema

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id           Int           @id @default(autoincrement())
  telegramId   String        @unique   // Telegram user ID (string to avoid bigint issues)
  username     String?
  firstName    String
  createdAt    DateTime      @default(now())
  transactions Transaction[]
}

model Transaction {
  id          Int               @id @default(autoincrement())
  userId      Int
  user        User              @relation(fields: [userId], references: [id])
  amount      Decimal           @db.Decimal(12, 2)
  type        TransactionType   @default(DEBIT)
  category    String
  description String?
  createdAt   DateTime          @default(now())

  @@index([userId, createdAt])
  @@index([userId, type])
  @@index([userId, category])
}

enum TransactionType {
  DEBIT
  CREDIT
}
```

---

## Authentication & Authorization

### How it works

Every HTTP request to protected routes must include the Telegram user's `telegramId` in the header:

```
X-Telegram-User-Id: <telegram_user_id>
```

The `TelegramAuthGuard` validates:
1. The header is present and non-empty.
2. A `User` with that `telegramId` exists in the database.
3. The resource being accessed (e.g., transaction) belongs to that user.

> **Important:** In production, always run the bot over HTTPS and validate that requests come from your own Telegram bot handler, not arbitrary clients. Consider adding webhook secret token validation (`X-Telegram-Bot-Api-Secret-Token`) when using webhooks.

### Guard implementation pattern

```typescript
// src/common/guards/telegram-auth.guard.ts
@Injectable()
export class TelegramAuthGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const telegramId = request.headers['x-telegram-user-id'];

    if (!telegramId) throw new UnauthorizedException('Missing Telegram user ID');

    const user = await this.prisma.user.findUnique({ where: { telegramId } });
    if (!user) throw new UnauthorizedException('User not found');

    request.telegramUser = user; // Attach to request for downstream use
    return true;
  }
}
```

Apply globally or per-controller (exclude `POST /users` and `GET /health`).

---

## Endpoints

### Health Check

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/health` | None | Returns service status |

**Response:**
```json
{ "status": "ok", "timestamp": "2024-01-01T00:00:00.000Z" }
```

---

### Users

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/users` | None | Create a new user |

**POST /users — Body:**
```json
{
  "telegramId": "123456789",
  "firstName": "João",
  "username": "joaosilva"    // optional
}
```

**DTO:**
```typescript
export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  telegramId: string;

  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsOptional()
  username?: string;
}
```

**Response `201`:**
```json
{ "id": 1, "telegramId": "123456789", "firstName": "João", "createdAt": "..." }
```

---

### Transactions

All routes require `X-Telegram-User-Id` header.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/transactions` | ✅ | Create transaction |
| GET | `/transactions` | ✅ | List user's transactions |
| DELETE | `/transactions/:id` | ✅ | Delete a transaction |

**POST /transactions — Body:**
```json
{
  "amount": 150.00,
  "category": "Alimentação",
  "description": "Almoço",  // optional
  "type": "DEBIT"           // optional, default: DEBIT
}
```

**DTO:**
```typescript
export class CreateTransactionDto {
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  amount: number;

  @IsString()
  @IsNotEmpty()
  category: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(TransactionType)
  @IsOptional()
  type?: TransactionType = TransactionType.DEBIT;
}
```

**GET /transactions — Query params:**
- `page` (number, default 1)
- `limit` (number, default 20, max 100)
- `type` (`DEBIT` | `CREDIT`)
- `category` (string)
- `startDate` (ISO date string)
- `endDate` (ISO date string)

**Response `200`:**
```json
{
  "data": [
    { "id": 1, "amount": "150.00", "type": "DEBIT", "category": "Alimentação", "createdAt": "..." }
  ],
  "total": 42,
  "page": 1,
  "limit": 20
}
```

**DELETE /transactions/:id**
- Returns `204 No Content`
- Guard must confirm the transaction `userId` matches the requesting user before deleting.

---

### Finances

All routes require `X-Telegram-User-Id` header.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/finances/summary` | ✅ | Balance, expenses, income |
| GET | `/finances/by-category` | ✅ | Spending grouped by category |
| GET | `/finances/monthly` | ✅ | Current month spending |

**GET /finances/summary — Response:**
```json
{
  "totalCredit": "3500.00",
  "totalDebit": "2100.00",
  "balance": "1400.00"
}
```

**GET /finances/by-category — Response:**
```json
{
  "data": [
    { "category": "Alimentação", "total": "450.00", "count": 12 },
    { "category": "Transporte", "total": "200.00", "count": 8 }
  ]
}
```

**GET /finances/monthly — Query params:**
- `month` (1–12, default: current month)
- `year` (default: current year)

**Response:**
```json
{
  "month": 1,
  "year": 2024,
  "totalDebit": "1800.00",
  "totalCredit": "3500.00",
  "balance": "1700.00",
  "transactionCount": 24
}
```

---

## Module Architecture Principles

### Adding a New Feature

1. Create a new folder under `src/modules/<feature>/`
2. Create `<feature>.module.ts`, `<feature>.controller.ts`, `<feature>.service.ts`
3. Add DTOs under `<feature>/dto/`
4. Add tests under `<feature>/__tests__/`
5. Import the module in `app.module.ts`
6. Never import `PrismaService` directly into a controller — always via service

### Dependency Injection Pattern

```typescript
// ✅ Correct — service depends on PrismaService
@Injectable()
export class TransactionsService {
  constructor(private readonly prisma: PrismaService) {}
}

// ✅ Correct — controller depends only on service
@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}
}
```

### PrismaService

```typescript
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();
  }

  async enableShutdownHooks(app: INestApplication) {
    this.$on('beforeExit', async () => {
      await app.close();
    });
  }
}
```

Export `PrismaModule` as `global: true` so it doesn't need to be re-imported in every module.

---

## Testing Strategy

### Unit Tests (required for every service and controller)

Each module has its own `__tests__/` folder. Tests mock all external dependencies.

**Pattern — Service test:**

```typescript
// transactions.service.spec.ts
describe('TransactionsService', () => {
  let service: TransactionsService;
  let prisma: DeepMockProxy<PrismaClient>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        TransactionsService,
        { provide: PrismaService, useValue: mockDeep<PrismaClient>() },
      ],
    }).compile();

    service = module.get(TransactionsService);
    prisma = module.get(PrismaService);
  });

  it('should create a transaction', async () => {
    const dto: CreateTransactionDto = {
      amount: 100,
      category: 'Food',
      type: TransactionType.DEBIT,
    };
    prisma.transaction.create.mockResolvedValue({ id: 1, ...dto } as any);

    const result = await service.create(1, dto);
    expect(result.id).toBe(1);
    expect(prisma.transaction.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ userId: 1 }) }),
    );
  });
});
```

**Pattern — Guard test:**

```typescript
describe('TelegramAuthGuard', () => {
  it('should throw UnauthorizedException when header is missing', async () => {
    // mock ExecutionContext without header
    await expect(guard.canActivate(mockContext)).rejects.toThrow(UnauthorizedException);
  });
});
```

### Test commands

```bash
# Unit tests
npm run test

# Watch mode
npm run test:watch

# Coverage (target ≥ 80%)
npm run test:cov
```

### Mocking rules

- Mock `PrismaService` using `jest-mock-extended` (`mockDeep<PrismaClient>()`)
- Never use a real database in unit tests
- Guard tests must cover: missing header, unknown user, valid user
- Finance service tests must cover: empty data (zero balances), data with only debits, data with credits and debits

---

## NestJS Configuration

### Global pipes, filters, and guards

```typescript
// main.ts
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,           // Strip unknown properties
      forbidNonWhitelisted: true,
      transform: true,           // Auto-transform to DTO types
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Global exception filter
  app.useGlobalFilters(new HttpExceptionFilter());

  await app.listen(process.env.PORT ?? 3000);
}
```

Apply `TelegramAuthGuard` at the controller level, not globally, since `/health` and `POST /users` are public:

```typescript
@UseGuards(TelegramAuthGuard)
@Controller('transactions')
export class TransactionsController { ... }
```

---

## Telegram Bot Integration

The bot connects via Telegraf and maps commands to API service calls internally (not via HTTP — directly calling the NestJS services through DI).

```typescript
// telegram.service.ts
@Injectable()
export class TelegramService implements OnModuleInit {
  private bot: Telegraf;

  constructor(
    private readonly usersService: UsersService,
    private readonly transactionsService: TransactionsService,
    private readonly financesService: FinancesService,
  ) {
    this.bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN!);
  }

  onModuleInit() {
    this.bot.command('start', (ctx) => this.handleStart(ctx));
    this.bot.command('balance', (ctx) => this.handleBalance(ctx));
    this.bot.launch();
  }

  private async handleBalance(ctx: Context) {
    const telegramId = String(ctx.from!.id);
    const summary = await this.financesService.getSummary(telegramId);
    await ctx.reply(`💰 Saldo: R$ ${summary.balance}`);
  }
}
```

> The `TELEGRAM_BOT_TOKEN` must never appear in source code. Only `process.env.TELEGRAM_BOT_TOKEN`.

---

## Package Scripts

```json
{
  "scripts": {
    "build": "nest build",
    "start": "nest start",
    "start:dev": "nest start --watch",
    "start:prod": "node dist/main",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:cov": "jest --coverage",
    "lint": "eslint \"{src,apps,libs,test}/**/*.ts\"",
    "db:migrate": "prisma migrate dev",
    "db:migrate:prod": "prisma migrate deploy",
    "db:generate": "prisma generate",
    "db:studio": "prisma studio"
  }
}
```

---

## Key Dependencies

```json
{
  "dependencies": {
    "@nestjs/common": "^10",
    "@nestjs/core": "^10",
    "@nestjs/platform-express": "^10",
    "@nestjs/terminus": "^10",
    "@prisma/client": "^5",
    "class-validator": "^0.14",
    "class-transformer": "^0.5",
    "telegraf": "^4",
    "reflect-metadata": "^0.2",
    "rxjs": "^7"
  },
  "devDependencies": {
    "@nestjs/testing": "^10",
    "jest": "^29",
    "jest-mock-extended": "^3",
    "prisma": "^5",
    "ts-jest": "^29",
    "@types/jest": "^29"
  }
}
```

---

## Security Checklist

- [ ] `TELEGRAM_BOT_TOKEN` only from `process.env`
- [ ] `DATABASE_URL` only from `process.env`
- [ ] Every protected endpoint uses `TelegramAuthGuard`
- [ ] Delete/modify operations verify resource ownership before acting
- [ ] `ValidationPipe` with `whitelist: true` blocks unknown fields
- [ ] `.env` is in `.gitignore`
- [ ] In production, use webhook mode + validate `X-Telegram-Bot-Api-Secret-Token`

---

## Common Patterns to Follow

```typescript
// ✅ Always validate resource ownership before mutation
async deleteTransaction(telegramId: string, transactionId: number) {
  const user = await this.prisma.user.findUniqueOrThrow({ where: { telegramId } });
  const transaction = await this.prisma.transaction.findFirst({
    where: { id: transactionId, userId: user.id }, // Ownership check
  });
  if (!transaction) throw new NotFoundException('Transaction not found');
  return this.prisma.transaction.delete({ where: { id: transactionId } });
}

// ✅ Default type to DEBIT if not provided (handled by DTO default)
@IsEnum(TransactionType)
@IsOptional()
type?: TransactionType = TransactionType.DEBIT;

// ✅ Use Prisma's groupBy for category summaries
const grouped = await this.prisma.transaction.groupBy({
  by: ['category'],
  where: { userId, type: TransactionType.DEBIT },
  _sum: { amount: true },
  _count: { id: true },
});
```