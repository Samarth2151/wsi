# WMS — Interview Design Review

## System architecture

```text
┌──────────────────────────────┐
│ Operator / Playwright client │
└──────────────┬───────────────┘
               │ HTTPS + JSON, JWT bearer token
               ▼
┌──────────────────────────────┐
│ wms-ui                       │
│ React + TypeScript + Vite    │
│ Route guards, map, dashboards│
└──────────────┬───────────────┘
               │ REST API
               ▼
┌──────────────────────────────┐
│ wms-api                      │
│ Django + DRF                 │
│ Permissions + domain services│
└──────────────┬───────────────┘
               │ Django ORM / transactions
       ┌───────┴────────┐
       ▼                ▼
┌──────────────┐  ┌──────────────────┐
│ SQLite       │  │ PostgreSQL       │
│ SQLITE_PATH  │  │ DATABASE_URL     │
│ local/eval   │  │ deployed service │
└──────────────┘  └──────────────────┘
```

The browser is a client, not a trust boundary. It stores JWT tokens in local storage for authenticated API calls and uses role-aware routes for navigation. DRF permissions and domain services validate every protected request. SQLite supports local development and evaluation; PostgreSQL is the intended shared production database.

## Data model and invariants

- **User** extends Django's `AbstractUser` and adds the `ADMIN`, `AUDITOR`, or `TECHNICIAN` role. A database check constraint restricts role values. The `is_demo` marker lets seeding distinguish evaluation accounts from operator-created accounts.
- **StorageLocation** represents a floor coordinate with a unique code. A unique constraint on `(column, row)`, checks on the allowed columns and rows, a code-to-coordinate check, and an A1/type check keep stored coordinates consistent. `clean()` enforces the same coordinate/type rule during model validation. The migration and seed command materialize the 25 allowed cells: A1 is the transfer point and the other 24 are storage slots.
- **Pallet** represents active stock. Its `OneToOneField` to `StorageLocation` enforces at most one active pallet per location in the database. Pallet number and barcode are unique, and a check constraint enforces `quantity >= 1`. `clean()` rejects a transfer-point location; the load service calls `full_clean()` before insertion. Unloading deletes the active pallet record, so a dedicated movement audit table is a future addition.
- **Shuttle** stores the identifier, status, battery percentage, and update time. Unique identifier and database checks protect status and the 0–100 battery range.
- **OccupancyHistory** stores one snapshot per date. A unique date, range checks, and a database check requiring `occupied_count + free_count = 24` keep each snapshot internally complete. Today's row is synchronized from live pallets.

Database constraints are the final invariant boundary, including for writes that do not call model validation. `clean()` provides earlier, field-specific feedback for application paths that explicitly validate models. The fixed grid's existence is created by migration/seeding; a relational constraint alone cannot require that every one of 25 rows always exists.

## Concurrency and atomicity

`load_pallet` and `unload_pallet` wrap the location decision and mutation in `transaction.atomic()`. They lock the target `StorageLocation` with `select_for_update()` before checking occupancy, so on databases with row-level locks two concurrent operators serialize their decisions for the same slot. The load path also validates pallet identity and runs model validation; the `OneToOneField` and unique indexes remain the final protection if concurrent requests pass an earlier preflight check.

Unload locks the location and active pallet, deletes the pallet, and updates today's occupancy snapshot in the same transaction. This prevents a dashboard snapshot from being committed independently of the corresponding stock movement. PostgreSQL provides row-level `SELECT FOR UPDATE`; SQLite does not provide equivalent row locks, so its locking is coarser and it is suited to local/evaluation use rather than concurrent production workloads.

## RBAC security model

The DRF permission classes require an authenticated, active user and the listed role. `AllowAny` on token endpoints means the route accepts unauthenticated requests; login still requires valid credentials and refresh requires a valid refresh token.

| Endpoint | Methods | ADMIN | AUDITOR | TECHNICIAN | Anonymous |
|---|---|:---:|:---:|:---:|:---:|
| `/health/` | `GET` | ✓ | ✓ | ✓ | ✓ |
| `/api/auth/login/`, `/api/auth/refresh/` | `POST` | ✓ | ✓ | ✓ | ✓ |
| `/api/auth/me/` | `GET` | ✓ | ✓ | ✓ | — |
| `/api/warehouse/` | `GET` | ✓ | ✓ | ✓ | — |
| `/api/warehouse/load/`, `/api/warehouse/unload/` | `POST` | ✓ | — | ✓ | — |
| `/api/shuttle/` | `GET` | ✓ | ✓ | ✓ | — |
| `/api/auditor/dashboard/` | `GET` | ✓ | ✓ | — | — |
| `/api/users/` | `GET`, `POST` | ✓ | — | — | — |
| `/api/users/<id>/` | `PATCH`, `DELETE` | ✓* | — | — | — |

`*` The backend rejects an administrator's attempt to demote, deactivate, or delete their own account. The UI also disables self-demotion and self-deletion controls and labels the current account, but those controls are usability safeguards only. Backend permissions and self-lockout checks are the source of truth; unauthorized authenticated users receive `403`, while unauthenticated requests require authentication.

## Multi-session live sync

The map polls the warehouse endpoint every three seconds. Under a healthy connection and normal browser scheduling, another session's load or unload is visible on the next successful poll, targeting a five-second-or-better update. Polls use `AbortController`; a pending poll is canceled when the page unmounts or a local mutation starts, and request versions prevent an older snapshot from overwriting post-mutation state. The UI also fetches immediately after each load/unload and preserves the last good snapshot during a transient failure.

Polling keeps the API stateless and avoids a WebSocket broker, Redis, or Channels deployment. It is easy to operate on a small or free-tier deployment and tolerates reconnects naturally. The trade-off is repeated reads proportional to the number of open clients. If update frequency or client count grows, SSE can carry one-way state changes; WebSockets are appropriate if the system needs bidirectional, low-latency coordination.

## Idempotent seeding and evaluation reproducibility

`seed_demo` reads all `EVAL_*_USERNAME` and `EVAL_*_PASSWORD` variables. Usernames have local demo-name defaults, but missing passwords cause a clear command error; no real password is embedded in the command. The seeder upserts the fixed grid and demo users, refuses to take over a matching non-demo account, and creates the shuttle only if absent. It creates synthetic sample pallets only when the pallet table is empty, so existing operator stock is preserved. Historical rows use `get_or_create`; today's occupancy is upserted from the live pallet count.

`wms-api/evaluation.json` supplies the evaluation environment template, runs `python manage.py seed_demo`, and probes `/health/`. Supplying the same EVAL credentials and setup command makes the demo identities repeatable while the seeder avoids duplicate locations, shuttle, or history rows. Playwright adds unique suffixes to temporary users and pallets and removes those records after each lifecycle test.

## Assumptions and next steps

- The product models one warehouse floor with a fixed 5×5 layout and one registered shuttle; it is not multi-tenant.
- A pallet row describes current stock, not movement history. Add an append-only load/unload audit table with actor, location, timestamp, and request correlation ID.
- Simple JWT is configured with an eight-hour access token and seven-day refresh token. Add refresh-token rotation/revocation and a logout blacklist if the threat model requires rapid session invalidation.
- Keep polling for the current scale; measure request volume and freshness before moving to SSE or WebSockets.
- Run production workloads on PostgreSQL, set a private `DJANGO_SECRET_KEY`, keep `DJANGO_DEBUG=false`, restrict allowed hosts and CORS origins, and provide credentials through the platform's secret manager.
