# WMS UI

React, TypeScript, and Vite frontend for warehouse operations. The UI calls the Django API with JWT bearer tokens; backend permissions remain authoritative.

## Install and run

```sh
npm install
npm start
```

Vite reads `HOST` and `PORT` from the process environment; defaults are `127.0.0.1` and `5173`. For example, in PowerShell:

```powershell
$env:HOST = "127.0.0.1"
$env:PORT = "5173"
$env:VITE_API_BASE_URL = "http://127.0.0.1:8000"
npm start
```

The API base URL can be set with `VITE_API_BASE_URL`, `REACT_APP_API_BASE_URL`, or `API_BASE_URL` (in that preference order). The default is `http://127.0.0.1:8000`. Put local overrides in `.env` (ignored by Git) or export them in the shell; do not commit credentials.

Create a production bundle with:

```sh
npm run build
```

## End-to-end checks

```sh
npm test
```

Playwright does not start either server. Start the backend and frontend externally before running the suite, matching the evaluation harness. The API should be reachable at the configured API base URL and the UI at `http://127.0.0.1:5173` unless `UI_BASE_URL` or `BASE_URL` is set. The Playwright config runs Chromium only, retains list and JSON reporters, and intentionally has no `webServer` block. Install the browser once with `npx playwright install chromium` if needed.

The E2E helpers read `EVAL_ADMIN_USERNAME`, `EVAL_ADMIN_PASSWORD`, `EVAL_AUDITOR_USERNAME`, `EVAL_AUDITOR_PASSWORD`, `EVAL_TECHNICIAN_USERNAME`, and `EVAL_TECHNICIAN_PASSWORD` from the environment of the `npm test` process. If unset, the helper uses local demo-only defaults; the values must match the accounts created by `python manage.py seed_demo`. For evaluation, provide the six matching values explicitly rather than relying on local defaults. Tests use unique names for temporary records and clean them up.

## Roles

| Role | Frontend capabilities |
|---|---|
| `ADMIN` | Warehouse map, shuttle status, auditor dashboard, and user administration; can load and unload pallets |
| `AUDITOR` | Warehouse map and shuttle status, plus read-only pallet inspection and occupancy/inventory reporting |
| `TECHNICIAN` | Warehouse map and shuttle status; can load and unload pallets |

Role-filtered navigation and route guards improve the user experience. The API independently enforces every protected operation.

See [DESIGN.md](./DESIGN.md) for the architecture, invariants, concurrency model, and trade-offs. See [../wms-api/README.md](../wms-api/README.md) for backend setup and endpoint details.
