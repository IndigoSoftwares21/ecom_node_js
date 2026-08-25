# Achievements, Badges and Cashback

Customers unlock achievements as they buy. Collecting achievements earns a badge. Every badge pays a
₦300 cashback to the customer's bank account through Paystack.

Express, PostgreSQL (Kysely), Redis (BullMQ), TypeScript.

## Running it

Requires Docker and Node. Everything runs in containers; the npm scripts drive them.

```bash
cp .env.example .env
npm install
npm run dev              # postgres, redis, api and worker — hot reloading
npm run migrate-up:all   # in a second terminal, first run only
```

- API: <http://localhost:7070>
- Docs: <http://localhost:7070/docs>
- OpenAPI spec: <http://localhost:7070/openapi.json>

The migrations also seed the reference data the feature needs — the currency, the achievement ladder,
the badge and its cashback amount — so there is nothing else to load.

`npm run dev` deliberately leaves migrations to you, because `migrate-up:all` also regenerates
`src/database/types.ts` from the live schema, and that has to land in your working tree rather than
inside a container that gets thrown away.

Postgres is published on **5434** rather than 5432 so it doesn't collide with a local instance.

Without `PAYSTACK_SECRET_KEY` set, the payment layer uses a fake provider that logs instead of moving
money, so the whole flow runs offline.

| Script | What it does |
|---|---|
| `npm run dev` | Postgres, Redis, API and worker with hot reload |
| `npm run fresh` | Same, after wiping the volumes |
| `npm run dev:down` | Stop it |
| `npm run migrate-up:all` | Apply migrations, regenerate database types |
| `npm run migrate:new -- name` | Scaffold a migration |
| `npm test` | Everything |
| `npm run lint` / `npm run build` | — |

There is also a no-npm path: `docker compose up --build` starts the same stack from the production
image and runs migrations for you as a one-shot service.

## Tests

```bash
npm test                            # everything
npx jest --selectProjects unit      # pure logic, no database
npx jest --selectProjects integration
```

Integration tests need Postgres running (`docker compose up -d postgres`). They create and migrate a
separate `database_test`, then truncate the mutable tables between cases while leaving the seeded
reference data alone.

Unit tests cover the rule engine, which is pure functions with no database. Integration tests cover
the engine against real Postgres, the outbox relay, the payout state machine, and every endpoint over
HTTP.

`maxWorkers: 1` is set deliberately: integration tests share one database and truncate between cases,
so parallel workers deadlock on `TRUNCATE` and delete each other's rows.

## How it works

```
POST /product-purchases
│
├─ BEGIN ───────────────────────────────────────────────┐
│  INSERT product_purchases                             │
│  dispatch ProductPurchased ──► listener:              │
│     count completed purchases                         │
│     INSERT app_user_achievements  ON CONFLICT DO NOTHING
│     count unlocked achievements                       │
│     INSERT app_user_badges        ON CONFLICT DO NOTHING
│     INSERT cashback_payouts (PENDING)                 │
│     INSERT outbox_events for rows that actually inserted
└─ COMMIT ──────────────────────────────────────────────┘
        │
        ▼  relay: SELECT ... WHERE status='PENDING' FOR UPDATE SKIP LOCKED
        │          enqueue to BullMQ, mark PUBLISHED
        ▼
   worker: BadgeUnlocked ──► claim payout ──► Paystack transfer ──► SUCCEEDED / FAILED
```

### Achievements are unlocked by recounting, not incrementing

On every purchase the engine counts completed purchases and inserts *every* achievement that count
entitles the customer to, relying on `ON CONFLICT DO NOTHING` to skip the ones already held.

This is the decision the rest of the correctness rests on:

- A replayed purchase event resolves the same set, inserts nothing, and emits no events.
- Two concurrent purchases crossing a threshold both try to insert; one wins, so exactly one unlock
  and one event exist.
- Adding a new achievement row applies retroactively, with no backfill.

Incrementing a counter gets all three wrong.

### Events are recorded, then published

The cashback needs an external HTTP call, which can be slow, fail, or succeed ambiguously. Calling
Paystack inside the badge-award transaction would mean holding locks during someone else's outage, and
a rollback after a successful transfer would pay for a badge nobody has.

So the award transaction writes a row to `outbox_events` instead. Both writes commit together — there
is no state where the badge exists and the notice is lost. A relay then moves pending rows onto
BullMQ, and a worker calls Paystack with its own retries.

If Redis is down, events accumulate in Postgres and drain when it recovers. If the process dies
mid-transaction, Postgres rolls back the purchase *and* the unlocks together.

### Where the transaction boundary sits, and why

Achievement state is derived state on the same aggregate as the purchase, so it must be consistent
with it — that's inside the transaction. The payout is an external call with independent failure, so
it's behind the queue. The rule is: **transaction boundaries follow consistency requirements, async
boundaries follow failure isolation.**

The listener runs sequentially and on the caller's transaction. Badges are counted from achievements
this transaction just wrote, so running them concurrently would race — and a Kysely transaction is
pinned to one connection anyway, so there would be no parallelism to gain.

### Nothing is paid twice

Delivery is at-least-once, never exactly-once, so the queue is not the guarantee. Six layers are:

| Layer | Guard |
|---|---|
| Achievement unlock | `PRIMARY KEY (user_id, achievement_key)` + `ON CONFLICT DO NOTHING` |
| Unlock logic | derived from a count, so it is repeatable |
| Event emission | outbox rows written only for keys the insert actually `RETURNING`ed |
| Relay → queue | `jobId = outbox_event_id`, so BullMQ drops a duplicate |
| Payout claim | `UPDATE ... WHERE status IN ('PENDING','FAILED')` — one caller gets the row |
| Provider call | the payout id is sent as Paystack's reference, so it rejects a repeat |

The third is the subtle one. Emitting events for every *entitled* achievement rather than every
*newly inserted* one would re-fire `AchievementUnlocked` on any replay and re-trigger cashback.

### Money is stored in minor units, and converted server-side

`amount_in_minor_units BIGINT` — ₦300 is `30000` kobo — with an explicit `currency_code` beside it.
Integer arithmetic, no rounding drift, and no money value without a unit attached.

The API takes **major units as a decimal string** (`"300.50"`) and converts. Taking minor units from
the caller is a footgun: a client that forgets to multiply undercharges by a factor of a hundred,
silently and legally, and no server-side validation can spot it because 300 kobo is a legal amount.

The conversion never multiplies. `19.99 * 100` is `1998.9999999999998` in IEEE 754, so arithmetic on
the parsed float mis-charges ordinary prices. `convertAmountToMinorUnits` shifts the decimal point
with string arithmetic instead, reading the exponent from `currencies.minor_unit_exponent` — which is
why that column exists. An amount carrying more precision than the currency has is **rejected, not
rounded**: quietly discarding a fraction of someone's money is worse than refusing the request.

The string also matters. Accepting a JSON number would parse to a float before conversion could be
done exactly, so `amount: 300` is rejected in favour of `amount: "300"`.

`pg` returns `int8` as a string to protect precision, so `src/database/typeParsers.ts` registers a
parser that converts it to a number and throws rather than silently truncating past
`Number.MAX_SAFE_INTEGER`.

### Currency comes from what the customer spent

The payout currency is taken from the purchase that triggered the award, not from the customer's
country — someone abroad buying in naira should be paid in naira. Cashback amounts are configured per
badge per currency in `badge_cashback_amounts`, not converted at payout time: cashback figures are
marketing decisions that should be round numbers, not exchange-rate output that changes daily.

Adding a country is data: a `currencies` row and the matching `badge_cashback_amounts` rows.

### A customer is created with somewhere to be paid

`POST /users` accepts optional bank details and creates the payout account in the same transaction, so
a badge earned moments after signup has a destination. Omit them and placeholder defaults are used —
which is what lets the whole flow, cashback included, be exercised in one request.

That is a testing convenience, and it is only safe because the fake payment provider is the default.
With a real `PAYSTACK_SECRET_KEY`, placeholder details are rejected by the provider, which is the
correct outcome: the payout is recorded as failed rather than money going somewhere arbitrary. Real
deployments pass details explicitly, or through `POST /payout-recipients`.

### Unsettled cashback is swept up

A payout can fail for a reason the queue cannot recover from. If the customer has no bank details on
file, the transfer is impossible, the failure is recorded, and the job **completes successfully** —
nothing redelivers it, and its outbox event is already `PUBLISHED`.

So the worker also sweeps. Every 30 seconds, and once immediately on startup, it looks for payouts in
`PENDING` or `FAILED` and retries them. The database is the record of what is owed, so the sweep reads
from Postgres rather than Redis.

This is also what settles cashback for a customer who adds their bank details *after* earning a badge:
the next sweep pays them. `PROCESSING` payouts are skipped so an in-flight transfer is untouched, a
grace period keeps the sweep from racing the queue on a payout created moments ago, and an attempt cap
stops a permanently unsettleable payout retrying forever.

A missing precondition is deliberately **not** a spent attempt. A payout with no bank details on file
stays `PENDING` with the reason recorded, and its attempt count untouched, because the customer may
supply details at any point — counting each sweep against the retry budget would make anyone slow to
add their account forfeit the cashback they earned. Attempts are spent only on real transfer attempts.

### Provider failures are classified

A `4xx` from Paystack means it understood and refused — a bad account number, an unsupported currency.
Retrying cannot change that, so it raises `NonRetryablePaymentError`, the payout is marked `FAILED`
with the reason, and the job stops. Timeouts, network faults and `5xx` are left to BullMQ to retry
with backoff. `429` is excluded from the terminal case because rate limiting resolves itself.

### Achievements and badges are data

Nothing in the code branches on a specific achievement or badge. Adding one is an `INSERT` into
`achievements` or `badges` (plus `badge_cashback_amounts` for a badge's payout), and it takes effect
immediately, including retroactively.

Groups exist so the endpoint can return only the *next* achievement per group rather than every
remaining one.

## API

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/api/v1/users` | Create a customer |
| `POST` | `/api/v1/product-purchases` | Record a purchase — drives the whole flow |
| `GET` | `/api/v1/users/:userId/achievements` | Progress, per the specification |
| `POST` | `/api/v1/payout-recipients` | Bank account the cashback is sent to |

Only the `GET` is required by the specification. The others exist so the flow can be driven and
inspected end to end.

The `GET` response uses snake_case because those field names are fixed by the specification. Every
other payload uses camelCase, matching the codebase.

```json
{
  "unlocked_achievements": ["First Purchase", "2 Purchases"],
  "next_available_achievements": ["3 Purchases"],
  "current_badge": null,
  "next_badge": "Advanced",
  "remaining_to_unlock_next_badge": 6
}
```

### Trying it

```bash
API=http://localhost:7070/api/v1

# Creates the customer and a placeholder payout account in one call.
USER=$(curl -s -X POST $API/users -H 'Content-Type: application/json' \
  -d '{"emailAddress":"ada@example.com","firstName":"Ada","lastName":"Obi"}' \
  | sed -n 's/.*"userId":"\([^"]*\)".*/\1/p')

for i in $(seq 1 8); do
  curl -s -X POST $API/product-purchases -H 'Content-Type: application/json' \
    -d "{\"userId\":\"$USER\",\"amount\":\"5000.00\",\"currencyCode\":\"NGN\"}" > /dev/null
done

curl -s $API/users/$USER/achievements
```

Eight purchases earns every achievement, which earns the Advanced badge, which queues the ₦300
cashback. `docker compose logs worker` shows the transfer.

## Layout

```
src/
  actions/{scope}/{domain}/{verb}{Scope}{Domain}/   business operations + their queries
  controllers/{scope}/{domain}/{operation}/         request handling + Zod schemas
  events/                                           dispatcher, listeners, outbox, relay
  queue/                                            BullMQ queue, worker, job handlers
  services/                                         Redis and payment provider clients
  utils/                                            pure helpers, tests beside them
  schemaHelpers/                                    async validation predicates
  constants/                                        no magic strings
  docs/                                             OpenAPI spec, one file per resource
migrations/
  queries/     the SQL
  scripts/     thin knex wrappers that read it
jest/          test bootstrap and fixtures
```

Controller → action → query, with validation in the schema layer so actions can assume valid input.
Queries are Kysely only, with explicit column lists.

Database identifiers are snake_case; TypeScript is camelCase. Kysely's `CamelCasePlugin` converts
between them, and `scripts/generate-db-types.ts` generates `src/database/types.ts` from the live
schema to match.

One consequence worth knowing: `CamelCasePlugin` recurses into `jsonb` *values*, so reading
`outbox_events.payload` directly would rewrite `achievement_name` to `achievementName` and break the
published event contract. The relay reads `payload::text` and parses it instead.

## Assumptions

The specification leaves some things open. Each of these is a decision, not an oversight:

- **The achievement ladder.** It names `First Purchase` (1 purchase) and `5 Purchases` (5), and its
  own example puts the `Advanced` badge at 8 *achievements*. Two achievements can never reach eight,
  so the ladder is extended to 8 milestones following the same naming. A sparser ladder would put the
  only badge — and the entire cashback path — hundreds of purchases out of reach.
- **Badge tiers.** Only `Advanced` is seeded, because it is the only badge the specification names.
  Further tiers are one row each.
- **`current_badge` / `next_badge` are typed `string`** but a customer with no achievements has no
  badge, and one holding the top badge has nothing next. Both return `null`.
- **Refunds don't revoke achievements.** Only `COMPLETED` purchases count, so a refund lowers the
  count and withholds *new* unlocks, but nothing already earned is taken away — the cashback has
  already left for the customer's bank.
- **A badge with no configured cashback amount** for the customer's currency is still awarded, with a
  warning logged and no payout created. Incomplete payout configuration shouldn't undo something the
  customer earned.
- **Purchases are recorded as `COMPLETED`** by the endpoint. The specification treats a purchase as
  the event itself; `PENDING`, `REFUNDED` and `CANCELLED` exist for lifecycles outside this scope.

## Known limitations

- **`payout_recipients` allows two customers to register the same bank account.** For a cashback
  feature that's the real abuse path, more so than duplicate email addresses. A partial unique index
  on `(provider, bank_account_number)` would close it; left open because fraud is outside the brief.
- **The relay must be running** or events sit `PENDING` indefinitely — visible and recoverable, but
  stalled. Production would want an alert on oldest-pending age.
- **A payout that exhausts its attempt cap stays `FAILED`** with no further automatic retry. It is
  visible in the table with the reason, but clearing it is a manual step.
- **No authentication.** Every endpoint is open, which is fine for an assessment and not for
  anything else.
- **A single achievement group is seeded.** The one-per-group rule is exercised in the unit tests
  with two groups; a second real group needs a second criterion column.
- **The docs routes are mounted ahead of the security headers**, because Scalar loads its bundle from
  a CDN that `default-src 'self'` blocks. Self-hosting the bundle would remove the exception.
