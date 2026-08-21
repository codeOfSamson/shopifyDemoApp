# Inventory Micro-Frontend Portfolio Pivot Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn this single-app Shopify Storefront practice repo into a pnpm-workspace monorepo with a genuine second, independently-deployable Next.js micro-frontend (`inventory-ops`, mounted via Next.js Multi-Zones) that reads real, live inventory data from the Shopify Admin API, built on a shared Tailwind-based design system and showcasing streaming Suspense + `useTransition`.

**Architecture:** `apps/web` (the existing storefront, relocated as-is) and `apps/inventory-ops` (new) are two separate Next.js apps sharing code only through `packages/ui` (design system) and `packages/utils` (logger + artificial-latency helper). `web` reverse-proxies `/inventory/*` to `inventory-ops` via Next.js Multi-Zones rewrites. All data is real Shopify data — Storefront API for `web` (already wired), Admin API for `inventory-ops` (new).

**Tech Stack:** Next.js 15 / React 19 / TypeScript, pnpm workspaces, Tailwind CSS v4, Jest + React Testing Library, Playwright, GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-08-21-inventory-micro-frontend-design.md`

## Global Constraints

- Package manager: pnpm 10 (`packageManager: "pnpm@10.34.5"` in root `package.json`). Never use npm/yarn commands in this repo going forward.
- Node 20 (matches `@types/node: 20.17.6`, already pinned).
- Internal shared packages are npm-scoped as `@repo/*` (`@repo/ui`, `@repo/utils`) and consumed via Next's `transpilePackages` — no build step for them.
- Shopify API version stays `2026-07` (matches the existing Storefront client) for both the Storefront and the new Admin API client.
- `apps/web` runs on port 3000, `apps/inventory-ops` on port 3001, mounted at `/inventory` in the browser via Multi-Zones.
- Accessibility, a real observability backend, and inventory write/mutate operations are explicitly out of scope for this pass (per spec).
- No mock data anywhere — every screen reads from the real Shopify dev store (`development-store-yaepbqzm.myshopify.com`).

---

## Task 1: Monorepo scaffold — relocate the existing app into `apps/web`

**Files:**
- Create: `pnpm-workspace.yaml`
- Create: `package.json` (root, replaces the current one)
- Move: `app/` → `apps/web/app/`
- Move: `lib/` → `apps/web/lib/`
- Move: `next-env.d.ts` → `apps/web/next-env.d.ts`
- Move: `tsconfig.json` → `apps/web/tsconfig.json`
- Move: `.env.local` → `apps/web/.env.local`
- Create: `apps/web/package.json`
- Delete: `package-lock.json`

**Interfaces:**
- Produces: a working `apps/web` Next.js app, runnable via `pnpm --filter web dev` / `pnpm --filter web build`, identical in behavior to the current app.

- [ ] **Step 1: Create the target directories and move files with git**

```bash
mkdir -p apps/web packages
git mv app apps/web/app
git mv lib apps/web/lib
git mv next-env.d.ts apps/web/next-env.d.ts
git mv tsconfig.json apps/web/tsconfig.json
git mv package.json apps/web/package.json
git rm package-lock.json
mv .env.local apps/web/.env.local
```

- [ ] **Step 2: Overwrite `apps/web/package.json` with the app-scoped version**

```json
{
  "name": "web",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "next": "^15.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "@types/node": "20.17.6",
    "@types/react": "19.2.18",
    "typescript": "5.8.2"
  }
}
```

- [ ] **Step 3: Create `pnpm-workspace.yaml` at the repo root**

```yaml
packages:
  - "apps/*"
  - "packages/*"
```

- [ ] **Step 4: Create the new root `package.json`**

```json
{
  "name": "hlth-trial-practice",
  "private": true,
  "packageManager": "pnpm@10.34.5",
  "scripts": {
    "lint": "pnpm -r lint",
    "typecheck": "pnpm -r typecheck",
    "test": "pnpm -r test",
    "build": "pnpm -r build"
  }
}
```

- [ ] **Step 5: Confirm `.gitignore` already covers the new layout**

Run: `cat .gitignore`
Expected: `.env.local`, `.env`, `node_modules`, `.next` — all unanchored (no leading `/`), so they already match `apps/web/.env.local`, `apps/web/node_modules`, `apps/web/.next`, etc. No edit needed. If any pattern is anchored with a leading `/`, remove the leading `/` so it matches at any depth.

- [ ] **Step 6: Install and verify the relocated app builds**

```bash
pnpm install
pnpm --filter web build
```

Expected: install succeeds and creates `pnpm-lock.yaml`; `next build` completes successfully (same as it did before the move — no source changes were made, only paths).

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "Move existing Shopify storefront app into apps/web (pnpm workspace)"
```

---

## Task 2: Shared tsconfig base + `apps/web` lint wiring

**Files:**
- Create: `packages/config/tsconfig.base.json`
- Modify: `apps/web/tsconfig.json`
- Create: `apps/web/eslint.config.mjs`
- Modify: `apps/web/package.json` (add eslint devDependencies)

**Interfaces:**
- Produces: `packages/config/tsconfig.base.json`, extended via relative path (`"extends": "../../packages/config/tsconfig.base.json"`) by every app/package tsconfig from here on.

- [ ] **Step 1: Create the shared base tsconfig**

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "incremental": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "isolatedModules": true
  }
}
```

- [ ] **Step 2: Rewrite `apps/web/tsconfig.json` to extend it**

```json
{
  "extends": "../../packages/config/tsconfig.base.json",
  "compilerOptions": {
    "jsx": "preserve",
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", ".next/types/**/*.ts", "**/*.ts", "**/*.tsx"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 3: Add ESLint (standard Next.js flat-config setup) to `apps/web`**

```js
// apps/web/eslint.config.mjs
import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [...compat.extends("next/core-web-vitals", "next/typescript")];

export default eslintConfig;
```

- [ ] **Step 4: Add the eslint devDependencies to `apps/web/package.json`**

Add to `devDependencies`:

```json
"eslint": "^9.17.0",
"eslint-config-next": "^15.0.0",
"@eslint/eslintrc": "^3.2.0"
```

- [ ] **Step 5: Install and verify lint + typecheck run**

```bash
pnpm install
pnpm --filter web lint
pnpm --filter web typecheck
```

Expected: both commands complete. `strict: true` may surface a small number of new type errors in the moved files (e.g. implicit `any` in destructured params) — fix them inline by adding explicit types; do not loosen `strict` back to `false`.

- [ ] **Step 6: Commit**

```bash
git add packages/config apps/web
git commit -m "Add shared tsconfig base and ESLint config for apps/web"
```

---

## Task 3: `packages/utils` — logger + artificial-latency helper

**Files:**
- Create: `packages/utils/package.json`
- Create: `packages/utils/tsconfig.json`
- Create: `packages/utils/eslint.config.mjs`
- Create: `packages/utils/babel.config.cjs`
- Create: `packages/utils/jest.config.cjs`
- Create: `packages/utils/src/logger.ts`
- Test: `packages/utils/src/logger.test.ts`
- Create: `packages/utils/src/withLatency.ts`
- Test: `packages/utils/src/withLatency.test.ts`
- Create: `packages/utils/src/index.ts`

**Interfaces:**
- Produces: `@repo/utils` exporting `logger: { debug, info, warn, error }`, `withLatency<Args, Result>(fn, options?) => wrapped fn`, and types `LogLevel`, `LogEvent`, `LatencyOptions`.

- [ ] **Step 1: Scaffold the package**

```json
// packages/utils/package.json
{
  "name": "@repo/utils",
  "version": "0.0.0",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "test": "jest",
    "lint": "eslint .",
    "typecheck": "tsc --noEmit"
  },
  "devDependencies": {
    "@babel/core": "^7.26.0",
    "@babel/preset-env": "^7.26.0",
    "@babel/preset-typescript": "^7.26.0",
    "@eslint/js": "^9.17.0",
    "@types/jest": "^29.5.14",
    "babel-jest": "^29.7.0",
    "eslint": "^9.17.0",
    "jest": "^29.7.0",
    "typescript": "5.8.2",
    "typescript-eslint": "^8.18.0"
  }
}
```

```json
// packages/utils/tsconfig.json
{
  "extends": "../config/tsconfig.base.json",
  "compilerOptions": {
    "outDir": "dist"
  },
  "include": ["src"]
}
```

```js
// packages/utils/eslint.config.mjs
import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(js.configs.recommended, ...tseslint.configs.recommended);
```

```js
// packages/utils/babel.config.cjs
module.exports = {
  presets: [["@babel/preset-env", { targets: { node: "current" } }], "@babel/preset-typescript"],
};
```

```js
// packages/utils/jest.config.cjs
module.exports = {
  testEnvironment: "node",
  transform: {
    "^.+\\.tsx?$": "babel-jest",
  },
};
```

- [ ] **Step 2: Write the failing tests**

```ts
// packages/utils/src/logger.test.ts
import { logger } from "./logger";

describe("logger", () => {
  it("emits a structured JSON line with level, message, and timestamp", () => {
    const spy = jest.spyOn(console, "log").mockImplementation(() => {});

    logger.warn("low stock", { sku: "ABC-123", quantity: 2 });

    expect(spy).toHaveBeenCalledTimes(1);
    const line = spy.mock.calls[0][0] as string;
    const parsed = JSON.parse(line);
    expect(parsed).toMatchObject({
      level: "warn",
      message: "low stock",
      context: { sku: "ABC-123", quantity: 2 },
    });
    expect(typeof parsed.timestamp).toBe("string");

    spy.mockRestore();
  });
});
```

```ts
// packages/utils/src/withLatency.test.ts
import { withLatency } from "./withLatency";

describe("withLatency", () => {
  it("resolves with the wrapped function's result", async () => {
    const fast = async (x: number) => x * 2;
    const slow = withLatency(fast, { minMs: 5, maxMs: 10 });

    await expect(slow(21)).resolves.toBe(42);
  });

  it("waits at least minMs before resolving", async () => {
    const fast = async () => "done";
    const slow = withLatency(fast, { minMs: 50, maxMs: 60 });

    const start = Date.now();
    await slow();
    const elapsed = Date.now() - start;

    expect(elapsed).toBeGreaterThanOrEqual(45); // small tolerance for timer jitter
  });
});
```

- [ ] **Step 3: Run the tests to verify they fail**

Run: `pnpm install && pnpm --filter @repo/utils test`
Expected: FAIL — `Cannot find module './logger'` / `'./withLatency'`.

- [ ] **Step 4: Implement `logger.ts` and `withLatency.ts`**

```ts
// packages/utils/src/logger.ts
export type LogLevel = "debug" | "info" | "warn" | "error";

export type LogEvent = {
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
  timestamp: string;
};

function emit(level: LogLevel, message: string, context?: Record<string, unknown>) {
  const event: LogEvent = {
    level,
    message,
    context,
    timestamp: new Date().toISOString(),
  };
  // Stand-in for a real APM/RUM sink (Datadog, Sentry, etc.) — structured
  // JSON on one line is what those vendors' log drains expect.
  console.log(JSON.stringify(event));
  return event;
}

export const logger = {
  debug: (message: string, context?: Record<string, unknown>) => emit("debug", message, context),
  info: (message: string, context?: Record<string, unknown>) => emit("info", message, context),
  warn: (message: string, context?: Record<string, unknown>) => emit("warn", message, context),
  error: (message: string, context?: Record<string, unknown>) => emit("error", message, context),
};
```

```ts
// packages/utils/src/withLatency.ts
export type LatencyOptions = {
  minMs?: number;
  maxMs?: number;
};

// Wraps a promise-returning function with a randomized artificial delay.
// Real Shopify API calls are usually too fast to show loading UI — this
// makes Suspense fallbacks and useTransition pending states visible in
// the demo without lying about the underlying data.
export function withLatency<Args extends unknown[], Result>(
  fn: (...args: Args) => Promise<Result>,
  options: LatencyOptions = {},
): (...args: Args) => Promise<Result> {
  const { minMs = 300, maxMs = 900 } = options;

  return async (...args: Args) => {
    const delay = minMs + Math.random() * (maxMs - minMs);
    const [result] = await Promise.all([
      fn(...args),
      new Promise((resolve) => setTimeout(resolve, delay)),
    ]);
    return result;
  };
}
```

```ts
// packages/utils/src/index.ts
export { logger } from "./logger";
export type { LogLevel, LogEvent } from "./logger";
export { withLatency } from "./withLatency";
export type { LatencyOptions } from "./withLatency";
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `pnpm --filter @repo/utils test`
Expected: PASS (3 tests).

- [ ] **Step 6: Commit**

```bash
git add packages/utils
git commit -m "Add @repo/utils: structured logger and withLatency helper"
```

---

## Task 4: `packages/ui` — package scaffold, theme tokens, Button, Badge, Input

**Files:**
- Create: `packages/ui/package.json`
- Create: `packages/ui/tsconfig.json`
- Create: `packages/ui/eslint.config.mjs`
- Create: `packages/ui/babel.config.cjs`
- Create: `packages/ui/jest.config.cjs`
- Create: `packages/ui/jest.setup.ts`
- Create: `packages/ui/src/theme.css`
- Create: `packages/ui/src/Button.tsx`
- Test: `packages/ui/src/Button.test.tsx`
- Create: `packages/ui/src/Badge.tsx`
- Test: `packages/ui/src/Badge.test.tsx`
- Create: `packages/ui/src/Input.tsx`
- Test: `packages/ui/src/Input.test.tsx`
- Create: `packages/ui/src/index.ts`

**Interfaces:**
- Produces: `@repo/ui` exporting `Button`, `Badge`, `Input` (+ prop types) and `@repo/ui/theme.css`.

- [ ] **Step 1: Scaffold the package**

```json
// packages/ui/package.json
{
  "name": "@repo/ui",
  "version": "0.0.0",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": {
    ".": "./src/index.ts",
    "./theme.css": "./src/theme.css"
  },
  "scripts": {
    "test": "jest",
    "lint": "eslint .",
    "typecheck": "tsc --noEmit"
  },
  "peerDependencies": {
    "react": "^19.0.0"
  },
  "devDependencies": {
    "@babel/core": "^7.26.0",
    "@babel/preset-env": "^7.26.0",
    "@babel/preset-react": "^7.26.3",
    "@babel/preset-typescript": "^7.26.0",
    "@eslint/js": "^9.17.0",
    "@testing-library/jest-dom": "^6.6.3",
    "@testing-library/react": "^16.1.0",
    "@types/jest": "^29.5.14",
    "@types/react": "19.2.18",
    "babel-jest": "^29.7.0",
    "eslint": "^9.17.0",
    "jest": "^29.7.0",
    "jest-environment-jsdom": "^29.7.0",
    "react": "^19.0.0",
    "typescript": "5.8.2",
    "typescript-eslint": "^8.18.0"
  }
}
```

```json
// packages/ui/tsconfig.json
{
  "extends": "../config/tsconfig.base.json",
  "compilerOptions": {
    "jsx": "react-jsx",
    "outDir": "dist"
  },
  "include": ["src"]
}
```

```js
// packages/ui/eslint.config.mjs
import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(js.configs.recommended, ...tseslint.configs.recommended);
```

```js
// packages/ui/babel.config.cjs
module.exports = {
  presets: [
    ["@babel/preset-env", { targets: { node: "current" } }],
    ["@babel/preset-react", { runtime: "automatic" }],
    "@babel/preset-typescript",
  ],
};
```

```js
// packages/ui/jest.config.cjs
module.exports = {
  testEnvironment: "jsdom",
  transform: {
    "^.+\\.tsx?$": "babel-jest",
  },
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
};
```

```ts
// packages/ui/jest.setup.ts
import "@testing-library/jest-dom";
```

- [ ] **Step 2: Add the shared theme tokens**

```css
/* packages/ui/src/theme.css */
@theme {
  --color-brand-50: #eef2ff;
  --color-brand-100: #e0e7ff;
  --color-brand-600: #4f46e5;
  --color-brand-700: #4338ca;
  --font-sans: "Inter", ui-sans-serif, system-ui, sans-serif;
}
```

- [ ] **Step 3: Write the failing tests for Button, Badge, Input**

```tsx
// packages/ui/src/Button.test.tsx
import { render, screen } from "@testing-library/react";
import { Button } from "./Button";

describe("Button", () => {
  it("applies primary variant classes by default", () => {
    render(<Button>Save</Button>);
    expect(screen.getByRole("button", { name: "Save" })).toHaveClass("bg-brand-600");
  });

  it("applies danger variant classes when variant='danger'", () => {
    render(<Button variant="danger">Delete</Button>);
    expect(screen.getByRole("button", { name: "Delete" })).toHaveClass("bg-red-600");
  });
});
```

```tsx
// packages/ui/src/Badge.test.tsx
import { render, screen } from "@testing-library/react";
import { Badge } from "./Badge";

describe("Badge", () => {
  it("applies the neutral tone classes by default", () => {
    render(<Badge>In stock</Badge>);
    expect(screen.getByText("In stock")).toHaveClass("bg-slate-100", "text-slate-700");
  });

  it("applies the danger tone classes when tone='danger'", () => {
    render(<Badge tone="danger">Low stock</Badge>);
    expect(screen.getByText("Low stock")).toHaveClass("bg-red-50", "text-red-700");
  });
});
```

```tsx
// packages/ui/src/Input.test.tsx
import { render, screen } from "@testing-library/react";
import { Input } from "./Input";

describe("Input", () => {
  it("renders with the given placeholder and forwards value/onChange props", () => {
    render(<Input placeholder="Search inventory" value="shoe" onChange={() => {}} />);
    expect(screen.getByPlaceholderText("Search inventory")).toHaveValue("shoe");
  });
});
```

- [ ] **Step 4: Run tests to verify they fail**

Run: `pnpm install && pnpm --filter @repo/ui test`
Expected: FAIL — modules not found.

- [ ] **Step 5: Implement Button, Badge, Input**

```tsx
// packages/ui/src/Button.tsx
import type { ButtonHTMLAttributes } from "react";

type ButtonVariant = "primary" | "secondary" | "danger";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: "bg-brand-600 text-white hover:bg-brand-700",
  secondary: "bg-white text-slate-900 border border-slate-300 hover:bg-slate-50",
  danger: "bg-red-600 text-white hover:bg-red-700",
};

export function Button({ variant = "primary", className = "", ...props }: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none ${VARIANT_CLASSES[variant]} ${className}`}
      {...props}
    />
  );
}
```

```tsx
// packages/ui/src/Badge.tsx
import type { HTMLAttributes } from "react";

export type BadgeTone = "neutral" | "success" | "warning" | "danger";

export type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: BadgeTone;
};

const TONE_CLASSES: Record<BadgeTone, string> = {
  neutral: "bg-slate-100 text-slate-700",
  success: "bg-green-50 text-green-700",
  warning: "bg-amber-50 text-amber-700",
  danger: "bg-red-50 text-red-700",
};

export function Badge({ tone = "neutral", className = "", ...props }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${TONE_CLASSES[tone]} ${className}`}
      {...props}
    />
  );
}
```

```tsx
// packages/ui/src/Input.tsx
import type { InputHTMLAttributes } from "react";

export type InputProps = InputHTMLAttributes<HTMLInputElement>;

export function Input({ className = "", ...props }: InputProps) {
  return (
    <input
      className={`w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600 ${className}`}
      {...props}
    />
  );
}
```

```ts
// packages/ui/src/index.ts
export { Button } from "./Button";
export type { ButtonProps } from "./Button";
export { Badge } from "./Badge";
export type { BadgeProps, BadgeTone } from "./Badge";
export { Input } from "./Input";
export type { InputProps } from "./Input";
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `pnpm --filter @repo/ui test`
Expected: PASS (4 tests).

- [ ] **Step 7: Commit**

```bash
git add packages/ui
git commit -m "Add @repo/ui: theme tokens, Button, Badge, Input"
```

---

## Task 5: `packages/ui` — Card, Table, Skeleton, AppShell

**Files:**
- Create: `packages/ui/src/Card.tsx`
- Create: `packages/ui/src/Table.tsx`
- Test: `packages/ui/src/Table.test.tsx`
- Create: `packages/ui/src/Skeleton.tsx`
- Create: `packages/ui/src/AppShell.tsx`
- Modify: `packages/ui/src/index.ts`

**Interfaces:**
- Consumes: nothing new.
- Produces: `Card`, `Table<Row>` (+ `TableColumn<Row>`, `TableProps<Row>`), `Skeleton`, `AppShell` (+ `NavLink`) added to `@repo/ui`'s exports.

- [ ] **Step 1: Write the failing test for `Table`**

```tsx
// packages/ui/src/Table.test.tsx
import { render, screen } from "@testing-library/react";
import { Table } from "./Table";

type Row = { id: string; name: string };
const columns = [{ key: "name", header: "Name", render: (row: Row) => row.name }];

describe("Table", () => {
  it("renders the empty message when there are no rows", () => {
    render(
      <Table<Row>
        columns={columns}
        rows={[]}
        getRowKey={(row) => row.id}
        emptyMessage="Nothing here yet."
      />,
    );
    expect(screen.getByText("Nothing here yet.")).toBeInTheDocument();
  });

  it("renders one row per item using each column's render function", () => {
    render(<Table<Row> columns={columns} rows={[{ id: "1", name: "Widget" }]} getRowKey={(row) => row.id} />);
    expect(screen.getByText("Widget")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm --filter @repo/ui test -- Table`
Expected: FAIL — `Cannot find module './Table'`.

- [ ] **Step 3: Implement Card, Table, Skeleton, AppShell**

```tsx
// packages/ui/src/Card.tsx
import type { HTMLAttributes } from "react";

export function Card({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`rounded-lg border border-slate-200 bg-white p-6 shadow-sm ${className}`} {...props} />
  );
}
```

```tsx
// packages/ui/src/Table.tsx
import type { ReactNode } from "react";

export type TableColumn<Row> = {
  key: string;
  header: string;
  render: (row: Row) => ReactNode;
};

export type TableProps<Row> = {
  columns: TableColumn<Row>[];
  rows: Row[];
  getRowKey: (row: Row) => string;
  emptyMessage?: string;
};

export function Table<Row>({ columns, rows, getRowKey, emptyMessage = "No results." }: TableProps<Row>) {
  if (rows.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
        {emptyMessage}
      </div>
    );
  }

  return (
    <table className="w-full border-collapse text-left text-sm">
      <thead>
        <tr className="border-b border-slate-200 text-slate-500">
          {columns.map((column) => (
            <th key={column.key} className="px-4 py-2 font-medium">
              {column.header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={getRowKey(row)} className="border-b border-slate-100 last:border-0">
            {columns.map((column) => (
              <td key={column.key} className="px-4 py-3 text-slate-900">
                {column.render(row)}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

```tsx
// packages/ui/src/Skeleton.tsx
import type { HTMLAttributes } from "react";

export function Skeleton({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={`animate-pulse rounded-md bg-slate-200 ${className}`} {...props} />;
}
```

```tsx
// packages/ui/src/AppShell.tsx
import type { ReactNode } from "react";

export type NavLink = {
  href: string;
  label: string;
};

export type AppShellProps = {
  title: string;
  navLinks: NavLink[];
  children: ReactNode;
};

// Plain <a> tags, deliberately not next/link: nav between the two
// micro-frontend zones must be a full page load, not client-side routing.
export function AppShell({ title, navLinks, children }: AppShellProps) {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="w-56 shrink-0 border-r border-slate-200 bg-white p-4">
        <div className="mb-6 px-2 text-lg font-semibold text-slate-900">{title}</div>
        <nav className="flex flex-col gap-1">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="rounded-md px-2 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            >
              {link.label}
            </a>
          ))}
        </nav>
      </aside>
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
```

```ts
// packages/ui/src/index.ts (full file, replaces Task 4's version)
export { Button } from "./Button";
export type { ButtonProps } from "./Button";
export { Badge } from "./Badge";
export type { BadgeProps, BadgeTone } from "./Badge";
export { Input } from "./Input";
export type { InputProps } from "./Input";
export { Card } from "./Card";
export { Table } from "./Table";
export type { TableColumn, TableProps } from "./Table";
export { Skeleton } from "./Skeleton";
export { AppShell } from "./AppShell";
export type { AppShellProps, NavLink } from "./AppShell";
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm --filter @repo/ui test`
Expected: PASS (6 tests total).

- [ ] **Step 5: Commit**

```bash
git add packages/ui
git commit -m "Add @repo/ui: Card, Table, Skeleton, AppShell"
```

---

## Task 6: `apps/web` — Tailwind wiring and restyle with `@repo/ui`

**Files:**
- Create: `apps/web/postcss.config.mjs`
- Create: `apps/web/app/globals.css`
- Create: `apps/web/next.config.ts`
- Modify: `apps/web/app/layout.tsx`
- Modify: `apps/web/app/products/[handle]/page.tsx`
- Modify: `apps/web/app/lp/[slug]/page.tsx`
- Modify: `apps/web/app/cart/page.tsx`
- Modify: `apps/web/app/cart/AddToCartButton.tsx`
- Modify: `apps/web/package.json` (add tailwind + `@repo/ui` deps)

**Interfaces:**
- Consumes: `@repo/ui`'s `Button`, `Badge`, `Card`, `theme.css`.
- Produces: a Tailwind-styled `apps/web`, restyled product/cart/landing-page routes.

- [ ] **Step 1: Add Tailwind + workspace deps to `apps/web/package.json`**

Add to `dependencies`:

```json
"@repo/ui": "workspace:*"
```

Add to `devDependencies`:

```json
"tailwindcss": "^4.0.0",
"@tailwindcss/postcss": "^4.0.0"
```

- [ ] **Step 2: Wire Tailwind and pull in the shared theme**

```js
// apps/web/postcss.config.mjs
export default {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};
```

```css
/* apps/web/app/globals.css */
@import "tailwindcss";
@import "@repo/ui/theme.css";
@source "../../../packages/ui/src/**/*.{ts,tsx}";
```

> If `@import "@repo/ui/theme.css"` doesn't resolve for your installed Tailwind v4 version, copy the contents of `packages/ui/src/theme.css` directly into this file as a fallback — functionally identical, just not shared across a single file.

```ts
// apps/web/next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@repo/ui", "@repo/utils"],
};

export default nextConfig;
```

- [ ] **Step 3: Restyle the root layout**

```tsx
// apps/web/app/layout.tsx
import "./globals.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-sans bg-slate-50 text-slate-900">{children}</body>
    </html>
  );
}
```

- [ ] **Step 4: Restyle `AddToCartButton` using `@repo/ui`'s `Button`**

```tsx
// apps/web/app/cart/AddToCartButton.tsx
"use client";

import { useTransition, useState } from "react";
import { Button } from "@repo/ui";
import { addToCart } from "./actions";

export function AddToCartButton({
  merchandiseId,
  available,
}: {
  merchandiseId: string;
  available: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    setError(null);
    startTransition(async () => {
      const result = await addToCart(merchandiseId);
      if (!result.ok) setError(result.message ?? "Something went wrong.");
    });
  }

  if (!available) {
    return (
      <Button variant="secondary" disabled>
        Out of stock
      </Button>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <Button onClick={handleClick} disabled={isPending}>
        {isPending ? "Adding…" : "Add to cart"}
      </Button>
      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
```

- [ ] **Step 5: Restyle the product page**

```tsx
// apps/web/app/products/[handle]/page.tsx
import { getProductByHandle } from "@/lib/shopify";
import { AddToCartButton } from "@/app/cart/AddToCartButton";
import { Card } from "@repo/ui";
import { notFound } from "next/navigation";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  const product = await getProductByHandle(handle);
  if (!product) notFound();

  const firstVariant = product.variants.edges[0]?.node;

  return (
    <main className="mx-auto max-w-2xl p-8">
      <Card>
        <h1 className="text-2xl font-semibold">{product.title}</h1>
        <div
          className="prose prose-slate mt-4 max-w-none"
          dangerouslySetInnerHTML={{ __html: product.descriptionHtml }}
        />
        <p className="mt-4 text-lg font-medium">
          {firstVariant?.price.amount} {firstVariant?.price.currencyCode}
        </p>
        {firstVariant && (
          <div className="mt-4">
            <AddToCartButton merchandiseId={firstVariant.id} available={firstVariant.availableForSale} />
          </div>
        )}
      </Card>
    </main>
  );
}

export async function generateStaticParams() {
  return [];
}
```

- [ ] **Step 6: Restyle the landing page**

```tsx
// apps/web/app/lp/[slug]/page.tsx
import { getLandingPageBySlug } from "@/lib/landingPages";
import { getProductByHandle } from "@/lib/shopify";
import { AddToCartButton } from "@/app/cart/AddToCartButton";
import { Card, Badge } from "@repo/ui";
import { notFound } from "next/navigation";

export default async function CreativeLandingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const landingPage = await getLandingPageBySlug(slug);
  if (!landingPage) notFound();

  const product = await getProductByHandle(landingPage.productHandle);
  if (!product) notFound();

  const firstVariant = product.variants.edges[0]?.node;

  return (
    <main className="mx-auto max-w-2xl p-8">
      <Card>
        <h1 className="text-2xl font-semibold">{product.title}</h1>
        {landingPage.discountCode && (
          <Badge tone="success" className="mt-2">
            Use code {landingPage.discountCode} at checkout
          </Badge>
        )}
        <div
          className="prose prose-slate mt-4 max-w-none"
          dangerouslySetInnerHTML={{ __html: product.descriptionHtml }}
        />
        <p className="mt-4 text-lg font-medium">
          {firstVariant?.price.amount} {firstVariant?.price.currencyCode}
        </p>
        {firstVariant && (
          <div className="mt-4">
            <AddToCartButton merchandiseId={firstVariant.id} available={firstVariant.availableForSale} />
          </div>
        )}
      </Card>
    </main>
  );
}

export async function generateStaticParams() {
  return [];
}
```

- [ ] **Step 7: Restyle the cart page**

```tsx
// apps/web/app/cart/page.tsx
import { cookies } from "next/headers";
import { getCart } from "@/lib/shopify";
import { Card, Table, type TableColumn } from "@repo/ui";

type CartLine = {
  id: string;
  quantity: number;
  merchandise: {
    title: string;
    price: { amount: string; currencyCode: string };
    product: { title: string };
  };
};

const columns: TableColumn<CartLine>[] = [
  { key: "product", header: "Product", render: (line) => line.merchandise.product.title },
  { key: "variant", header: "Variant", render: (line) => line.merchandise.title },
  { key: "qty", header: "Qty", render: (line) => String(line.quantity) },
  {
    key: "price",
    header: "Price",
    render: (line) => `${line.merchandise.price.amount} ${line.merchandise.price.currencyCode}`,
  },
];

export default async function CartPage() {
  const cookieStore = await cookies();
  const cartId = cookieStore.get("cartId")?.value;

  if (!cartId) {
    return (
      <main className="mx-auto max-w-2xl p-8">
        <Card>
          <h1 className="text-2xl font-semibold">Your cart</h1>
          <p className="mt-2 text-sm text-slate-600">
            No cart cookie found yet — add something from a product page first.
          </p>
        </Card>
      </main>
    );
  }

  const cart = await getCart(cartId);

  if (!cart) {
    return (
      <main className="mx-auto max-w-2xl p-8">
        <Card>
          <h1 className="text-2xl font-semibold">Your cart</h1>
          <p className="mt-2 text-sm text-slate-600">
            Cookie has a cartId (<code>{cartId}</code>) but Shopify returned no cart for it — it may have
            expired or the ID is stale.
          </p>
        </Card>
      </main>
    );
  }

  const lines: CartLine[] = cart.lines.edges.map((edge: { node: CartLine }) => edge.node);

  return (
    <main className="mx-auto max-w-2xl p-8">
      <Card>
        <h1 className="text-2xl font-semibold">Your cart</h1>
        <div className="mt-4">
          <Table<CartLine> columns={columns} rows={lines} getRowKey={(line) => line.id} emptyMessage="Your cart is empty." />
        </div>
        <p className="mt-4 text-right text-lg font-medium">
          Total: {cart.cost.totalAmount.amount} {cart.cost.totalAmount.currencyCode}
        </p>
        <a href={cart.checkoutUrl} className="mt-4 inline-block text-brand-600 hover:underline">
          Checkout
        </a>
      </Card>
    </main>
  );
}
```

- [ ] **Step 8: Verify the app builds and run existing unit tests**

```bash
pnpm install
pnpm --filter web build
pnpm --filter @repo/ui test
pnpm --filter @repo/utils test
```

Expected: build succeeds; both test suites still pass.

- [ ] **Step 9: Commit**

```bash
git add apps/web
git commit -m "Wire Tailwind v4 into apps/web and restyle pages with @repo/ui"
```

---

## Task 7: `apps/inventory-ops` scaffold + Next.js Multi-Zones wiring

**Files:**
- Create: `apps/inventory-ops/package.json`
- Create: `apps/inventory-ops/tsconfig.json`
- Create: `apps/inventory-ops/next-env.d.ts`
- Create: `apps/inventory-ops/next.config.ts`
- Create: `apps/inventory-ops/eslint.config.mjs`
- Create: `apps/inventory-ops/jest.config.js`
- Create: `apps/inventory-ops/jest.setup.ts`
- Create: `apps/inventory-ops/postcss.config.mjs`
- Create: `apps/inventory-ops/app/globals.css`
- Create: `apps/inventory-ops/app/layout.tsx`
- Create: `apps/inventory-ops/app/page.tsx`
- Modify: `apps/web/next.config.ts` (add rewrites)
- Modify: `apps/web/app/layout.tsx` (add nav header)
- Modify: `package.json` (root — add `concurrently` + combined `dev` script)

**Interfaces:**
- Consumes: `@repo/ui`'s `AppShell`.
- Produces: a second Next.js app reachable in the browser at `http://localhost:3000/inventory` (via `web`'s rewrite), running its own dev server on port 3001.

- [ ] **Step 1: Scaffold `apps/inventory-ops`**

```json
// apps/inventory-ops/package.json
{
  "name": "inventory-ops",
  "private": true,
  "scripts": {
    "dev": "next dev -p 3001",
    "build": "next build",
    "start": "next start -p 3001",
    "lint": "next lint",
    "typecheck": "tsc --noEmit",
    "test": "jest"
  },
  "dependencies": {
    "next": "^15.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "@repo/ui": "workspace:*",
    "@repo/utils": "workspace:*"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.6.3",
    "@testing-library/react": "^16.1.0",
    "@types/node": "20.17.6",
    "@types/react": "19.2.18",
    "@eslint/eslintrc": "^3.2.0",
    "eslint": "^9.17.0",
    "eslint-config-next": "^15.0.0",
    "jest": "^29.7.0",
    "jest-environment-jsdom": "^29.7.0",
    "tailwindcss": "^4.0.0",
    "@tailwindcss/postcss": "^4.0.0",
    "typescript": "5.8.2"
  }
}
```

```json
// apps/inventory-ops/tsconfig.json
{
  "extends": "../../packages/config/tsconfig.base.json",
  "compilerOptions": {
    "jsx": "preserve",
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", ".next/types/**/*.ts", "**/*.ts", "**/*.tsx"],
  "exclude": ["node_modules"]
}
```

```ts
// apps/inventory-ops/next-env.d.ts
/// <reference types="next" />
/// <reference types="next/image-types/global" />
```

```ts
// apps/inventory-ops/next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  basePath: "/inventory",
  transpilePackages: ["@repo/ui", "@repo/utils"],
};

export default nextConfig;
```

```js
// apps/inventory-ops/eslint.config.mjs
import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({ baseDirectory: __dirname });

export default [...compat.extends("next/core-web-vitals", "next/typescript")];
```

```js
// apps/inventory-ops/jest.config.js
const nextJest = require("next/jest");

const createJestConfig = nextJest({ dir: "./" });

module.exports = createJestConfig({
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
});
```

```ts
// apps/inventory-ops/jest.setup.ts
import "@testing-library/jest-dom";
```

```js
// apps/inventory-ops/postcss.config.mjs
export default {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};
```

```css
/* apps/inventory-ops/app/globals.css */
@import "tailwindcss";
@import "@repo/ui/theme.css";
@source "../../../packages/ui/src/**/*.{ts,tsx}";
```

- [ ] **Step 2: Add the shell layout and a minimal home page**

```tsx
// apps/inventory-ops/app/layout.tsx
import "./globals.css";
import { AppShell } from "@repo/ui";

const navLinks = [
  { href: "/", label: "Storefront" },
  { href: "/inventory", label: "Inventory" },
];

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-sans">
        <AppShell title="Tech Inventory" navLinks={navLinks}>
          {children}
        </AppShell>
      </body>
    </html>
  );
}
```

```tsx
// apps/inventory-ops/app/page.tsx
export default function InventoryPage() {
  return <h1 className="text-2xl font-semibold text-slate-900">Inventory</h1>;
}
```

- [ ] **Step 3: Mount `inventory-ops` into `web` via Multi-Zones rewrites**

```ts
// apps/web/next.config.ts (full file, replaces Task 6's version)
import type { NextConfig } from "next";

const INVENTORY_OPS_ORIGIN = process.env.INVENTORY_OPS_ORIGIN ?? "http://localhost:3001";

const nextConfig: NextConfig = {
  transpilePackages: ["@repo/ui", "@repo/utils"],
  async rewrites() {
    return [
      { source: "/inventory", destination: `${INVENTORY_OPS_ORIGIN}/inventory` },
      { source: "/inventory/:path*", destination: `${INVENTORY_OPS_ORIGIN}/inventory/:path*` },
    ];
  },
};

export default nextConfig;
```

- [ ] **Step 4: Add a nav header to `web` linking into the inventory zone**

```tsx
// apps/web/app/layout.tsx (full file, replaces Task 6's version)
import "./globals.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-sans bg-slate-50 text-slate-900">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
          <a href="/" className="text-lg font-semibold">
            HLTH Shop
          </a>
          <nav className="flex gap-4 text-sm font-medium text-slate-600">
            <a href="/cart" className="hover:text-slate-900">
              Cart
            </a>
            <a href="/inventory" className="hover:text-slate-900">
              Inventory
            </a>
          </nav>
        </header>
        <div className="p-6">{children}</div>
      </body>
    </html>
  );
}
```

- [ ] **Step 5: Add a combined dev script at the root**

Add `concurrently` to root `package.json` `devDependencies`:

```json
"devDependencies": {
  "concurrently": "^9.1.0"
}
```

Add to root `package.json` `scripts`:

```json
"dev": "concurrently -n web,inventory \"pnpm --filter web dev\" \"pnpm --filter inventory-ops dev\""
```

- [ ] **Step 6: Verify both zones run and are reachable through the rewrite**

```bash
pnpm install
pnpm dev
```

In a second terminal, once both servers report ready:

```bash
curl -s http://localhost:3001/inventory | grep -o "<h1[^<]*</h1>"
curl -s http://localhost:3000/inventory | grep -o "<h1[^<]*</h1>"
```

Expected: both print the "Inventory" heading — the second command proves the rewrite from `web` (port 3000) into `inventory-ops` (port 3001) works. Stop the dev servers (Ctrl-C) before continuing.

- [ ] **Step 7: Commit**

```bash
git add apps/inventory-ops apps/web package.json pnpm-lock.yaml
git commit -m "Scaffold apps/inventory-ops and mount it into apps/web via Next.js Multi-Zones"
```

---

## Task 8: Shopify Admin API client (`apps/inventory-ops/lib/shopifyAdmin.ts`)

**Files:**
- Create: `apps/inventory-ops/lib/shopifyAdmin.ts`
- Create: `apps/inventory-ops/.env.local.example`

**Interfaces:**
- Produces: `hasAdminCredentials(): boolean`, `listInventoryProducts(options?: { first?: number; after?: string; searchQuery?: string }): Promise<{ products: InventoryProduct[]; hasNextPage: boolean; endCursor: string | null }>`, types `InventoryProduct`, `InventoryVariant`.

- [ ] **Step 1: Document the manual prerequisite**

```
# apps/inventory-ops/.env.local.example
# 1. In the Shopify dev store admin: Settings → Apps and sales channels →
#    Develop apps → Create an app.
# 2. Configuration → Admin API integration → enable scopes:
#    read_products, read_inventory, read_locations.
# 3. Install the app, copy the Admin API access token.
# 4. Copy this file to .env.local and fill in both values.

SHOPIFY_STORE_DOMAIN=your-store.myshopify.com
SHOPIFY_ADMIN_API_ACCESS_TOKEN=shpat_xxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

- [ ] **Step 2: Implement the Admin API client**

```ts
// apps/inventory-ops/lib/shopifyAdmin.ts
// Admin API client — separate from apps/web/lib/shopify.ts (Storefront
// API). Requires a private Admin API access token (server-only,
// read_products + read_inventory + read_locations scopes). See
// .env.local.example for how to create one.

const domain = process.env.SHOPIFY_STORE_DOMAIN;
const adminToken = process.env.SHOPIFY_ADMIN_API_ACCESS_TOKEN;
const apiVersion = "2026-07";

export function hasAdminCredentials(): boolean {
  return Boolean(domain && adminToken);
}

async function shopifyAdminFetch<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
  if (!hasAdminCredentials()) {
    throw new Error("Missing SHOPIFY_STORE_DOMAIN or SHOPIFY_ADMIN_API_ACCESS_TOKEN");
  }

  const res = await fetch(`https://${domain}/admin/api/${apiVersion}/graphql.json`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": adminToken!,
    },
    body: JSON.stringify({ query, variables }),
    cache: "no-store", // inventory levels change too often to cache
  });

  const json = await res.json();

  if (json.errors) {
    throw new Error(`Shopify Admin API error: ${json.errors.map((e: { message: string }) => e.message).join(", ")}`);
  }

  return json.data as T;
}

export type InventoryVariant = {
  id: string;
  title: string;
  sku: string | null;
  price: string;
  available: number;
};

export type InventoryProduct = {
  id: string;
  title: string;
  handle: string;
  variants: InventoryVariant[];
};

const INVENTORY_PRODUCTS_QUERY = /* GraphQL */ `
  query InventoryProducts($first: Int!, $after: String, $query: String) {
    products(first: $first, after: $after, query: $query) {
      pageInfo {
        hasNextPage
        endCursor
      }
      edges {
        node {
          id
          title
          handle
          variants(first: 25) {
            edges {
              node {
                id
                title
                sku
                price
                inventoryItem {
                  inventoryLevels(first: 5) {
                    edges {
                      node {
                        quantities(names: ["available"]) {
                          name
                          quantity
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
`;

type RawInventoryLevelEdge = {
  node: { quantities: { name: string; quantity: number }[] };
};

function sumAvailable(levelEdges: RawInventoryLevelEdge[]): number {
  return levelEdges.reduce((total, levelEdge) => {
    const availableQty = levelEdge.node.quantities.find((q) => q.name === "available");
    return total + (availableQty?.quantity ?? 0);
  }, 0);
}

// Shopify's Admin API returns GraphQL nodes as loosely-typed JSON; `node`
// is typed `any` here deliberately, mirroring the same pattern already
// used in apps/web/lib/shopify.ts for the Storefront API responses.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toInventoryProduct(node: any): InventoryProduct {
  return {
    id: node.id,
    title: node.title,
    handle: node.handle,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    variants: node.variants.edges.map((edge: any) => ({
      id: edge.node.id,
      title: edge.node.title,
      sku: edge.node.sku || null,
      price: edge.node.price,
      available: sumAvailable(edge.node.inventoryItem.inventoryLevels.edges),
    })),
  };
}

export async function listInventoryProducts(
  options: { first?: number; after?: string; searchQuery?: string } = {},
): Promise<{ products: InventoryProduct[]; hasNextPage: boolean; endCursor: string | null }> {
  const { first = 50, after, searchQuery } = options;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = await shopifyAdminFetch<{ products: any }>(INVENTORY_PRODUCTS_QUERY, {
    first,
    after,
    query: searchQuery,
  });

  return {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    products: data.products.edges.map((edge: any) => toInventoryProduct(edge.node)),
    hasNextPage: data.products.pageInfo.hasNextPage,
    endCursor: data.products.pageInfo.endCursor,
  };
}
```

- [ ] **Step 3: Typecheck**

Run: `pnpm --filter inventory-ops typecheck`
Expected: PASS (no callers yet, but the file must compile standalone).

- [ ] **Step 4: Commit**

```bash
git add apps/inventory-ops/lib apps/inventory-ops/.env.local.example
git commit -m "Add Shopify Admin API client for inventory-ops"
```

---

## Task 9: Inventory list page — low-stock util + real data table

**Files:**
- Create: `apps/inventory-ops/lib/lowStock.ts`
- Test: `apps/inventory-ops/lib/lowStock.test.ts`
- Create: `apps/inventory-ops/lib/inventoryRow.ts`
- Modify: `apps/inventory-ops/app/page.tsx`

**Interfaces:**
- Consumes: `hasAdminCredentials`, `listInventoryProducts`, `InventoryProduct` from Task 8; `Card`, `Table`, `Badge` from `@repo/ui`.
- Produces: `stockStatus(available, threshold?): "out" | "low" | "in-stock"`, `LOW_STOCK_THRESHOLD`, `InventoryRow` type, `flattenRows(products): InventoryRow[]` — both consumed by Tasks 10 and 11.

- [ ] **Step 1: Write the failing test for `stockStatus`**

```ts
// apps/inventory-ops/lib/lowStock.test.ts
import { stockStatus, LOW_STOCK_THRESHOLD } from "./lowStock";

describe("stockStatus", () => {
  it("returns 'out' when available is 0 or less", () => {
    expect(stockStatus(0)).toBe("out");
    expect(stockStatus(-1)).toBe("out");
  });

  it("returns 'low' when available is at or below the threshold", () => {
    expect(stockStatus(LOW_STOCK_THRESHOLD)).toBe("low");
    expect(stockStatus(1)).toBe("low");
  });

  it("returns 'in-stock' when available is above the threshold", () => {
    expect(stockStatus(LOW_STOCK_THRESHOLD + 1)).toBe("in-stock");
  });

  it("respects a custom threshold", () => {
    expect(stockStatus(5, 2)).toBe("in-stock");
    expect(stockStatus(2, 2)).toBe("low");
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm --filter inventory-ops test`
Expected: FAIL — `Cannot find module './lowStock'`.

- [ ] **Step 3: Implement `lowStock.ts` and `inventoryRow.ts`**

```ts
// apps/inventory-ops/lib/lowStock.ts
export const LOW_STOCK_THRESHOLD = 10;

export type StockStatus = "out" | "low" | "in-stock";

export function stockStatus(available: number, threshold: number = LOW_STOCK_THRESHOLD): StockStatus {
  if (available <= 0) return "out";
  if (available <= threshold) return "low";
  return "in-stock";
}
```

```ts
// apps/inventory-ops/lib/inventoryRow.ts
import type { InventoryProduct } from "./shopifyAdmin";

export type InventoryRow = {
  key: string;
  productTitle: string;
  variantTitle: string;
  sku: string | null;
  price: string;
  available: number;
};

export function flattenRows(products: InventoryProduct[]): InventoryRow[] {
  return products.flatMap((product) =>
    product.variants.map((variant) => ({
      key: variant.id,
      productTitle: product.title,
      variantTitle: variant.title,
      sku: variant.sku,
      price: variant.price,
      available: variant.available,
    })),
  );
}
```

- [ ] **Step 4: Run to verify tests pass**

Run: `pnpm --filter inventory-ops test`
Expected: PASS (4 tests).

- [ ] **Step 5: Build the real data table page**

```tsx
// apps/inventory-ops/app/page.tsx (full file, replaces Task 7's placeholder)
import { Card, Table, Badge, type TableColumn } from "@repo/ui";
import { hasAdminCredentials, listInventoryProducts } from "@/lib/shopifyAdmin";
import { flattenRows, type InventoryRow } from "@/lib/inventoryRow";
import { stockStatus } from "@/lib/lowStock";

const columns: TableColumn<InventoryRow>[] = [
  { key: "product", header: "Product", render: (row) => row.productTitle },
  { key: "variant", header: "Variant", render: (row) => row.variantTitle },
  { key: "sku", header: "SKU", render: (row) => row.sku ?? "—" },
  { key: "price", header: "Price", render: (row) => `$${row.price}` },
  {
    key: "stock",
    header: "Stock",
    render: (row) => {
      const status = stockStatus(row.available);
      const tone = status === "out" ? "danger" : status === "low" ? "warning" : "success";
      const label =
        status === "out" ? "Out of stock" : status === "low" ? `Low (${row.available})` : `${row.available} in stock`;
      return <Badge tone={tone}>{label}</Badge>;
    },
  },
];

export default async function InventoryPage() {
  if (!hasAdminCredentials()) {
    return (
      <Card>
        <h1 className="text-lg font-semibold">Connect your Shopify Admin API token</h1>
        <p className="mt-2 text-sm text-slate-600">
          Set <code>SHOPIFY_ADMIN_API_ACCESS_TOKEN</code> and <code>SHOPIFY_STORE_DOMAIN</code> in{" "}
          <code>apps/inventory-ops/.env.local</code> to see live inventory data here.
        </p>
      </Card>
    );
  }

  const { products } = await listInventoryProducts({ first: 50 });
  const rows = flattenRows(products);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-slate-900">Inventory</h1>
      <Table<InventoryRow> columns={columns} rows={rows} getRowKey={(row) => row.key} emptyMessage="No products found." />
    </div>
  );
}
```

- [ ] **Step 6: Verify manually against the real dev store**

Copy `apps/inventory-ops/.env.local.example` to `apps/inventory-ops/.env.local`, fill in a real Admin API token (see Task 8's prerequisite), add at least one product with variants in the Shopify dev store admin, then:

```bash
pnpm --filter inventory-ops dev
```

Visit `http://localhost:3001/inventory`. Expected: the real product/variant/stock data from the dev store renders in the table (or the "connect your token" card if the env vars are unset).

- [ ] **Step 7: Commit**

```bash
git add apps/inventory-ops
git commit -m "Add inventory list page backed by real Shopify Admin API data"
```

---

## Task 10: Streaming Suspense — reorder recommendations panel

**Files:**
- Create: `apps/inventory-ops/app/ReorderRecommendations.tsx`
- Modify: `apps/inventory-ops/app/page.tsx`

**Interfaces:**
- Consumes: `withLatency` from `@repo/utils`; `stockStatus` from Task 9; `InventoryProduct` from Task 8; `Card`, `Skeleton` from `@repo/ui`.
- Produces: `ReorderRecommendations` component, rendered inside a `<Suspense>` boundary so it streams in after the main table.

- [ ] **Step 1: Implement the panel**

```tsx
// apps/inventory-ops/app/ReorderRecommendations.tsx
import { Card } from "@repo/ui";
import { withLatency } from "@repo/utils";
import { stockStatus } from "@/lib/lowStock";
import type { InventoryProduct } from "@/lib/shopifyAdmin";

type Recommendation = {
  id: string;
  label: string;
  available: number;
};

async function computeRecommendations(products: InventoryProduct[]): Promise<Recommendation[]> {
  return products
    .flatMap((product) =>
      product.variants
        .filter((variant) => stockStatus(variant.available) !== "in-stock")
        .map((variant) => ({
          id: variant.id,
          label: `${product.title} — ${variant.title}`,
          available: variant.available,
        })),
    )
    .slice(0, 5);
}

// Deliberately slower than the main product query — this is what makes
// the Suspense boundary in app/page.tsx visibly stream in after the rest
// of the page, rather than resolving too fast to notice.
const computeRecommendationsSlowly = withLatency(computeRecommendations, { minMs: 800, maxMs: 1600 });

export async function ReorderRecommendations({ products }: { products: InventoryProduct[] }) {
  const recommendations = await computeRecommendationsSlowly(products);

  return (
    <Card>
      <h2 className="text-base font-semibold text-slate-900">Reorder recommendations</h2>
      {recommendations.length === 0 ? (
        <p className="mt-2 text-sm text-slate-600">Nothing low on stock right now.</p>
      ) : (
        <ul className="mt-3 flex flex-col gap-2 text-sm text-slate-700">
          {recommendations.map((rec) => (
            <li key={rec.id} className="flex justify-between">
              <span>{rec.label}</span>
              <span className="text-slate-500">{rec.available} left</span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
```

- [ ] **Step 2: Wrap it in a Suspense boundary on the page**

```tsx
// apps/inventory-ops/app/page.tsx (full file, replaces Task 9's version)
import { Suspense } from "react";
import { Card, Table, Badge, Skeleton, type TableColumn } from "@repo/ui";
import { hasAdminCredentials, listInventoryProducts } from "@/lib/shopifyAdmin";
import { flattenRows, type InventoryRow } from "@/lib/inventoryRow";
import { stockStatus } from "@/lib/lowStock";
import { ReorderRecommendations } from "./ReorderRecommendations";

const columns: TableColumn<InventoryRow>[] = [
  { key: "product", header: "Product", render: (row) => row.productTitle },
  { key: "variant", header: "Variant", render: (row) => row.variantTitle },
  { key: "sku", header: "SKU", render: (row) => row.sku ?? "—" },
  { key: "price", header: "Price", render: (row) => `$${row.price}` },
  {
    key: "stock",
    header: "Stock",
    render: (row) => {
      const status = stockStatus(row.available);
      const tone = status === "out" ? "danger" : status === "low" ? "warning" : "success";
      const label =
        status === "out" ? "Out of stock" : status === "low" ? `Low (${row.available})` : `${row.available} in stock`;
      return <Badge tone={tone}>{label}</Badge>;
    },
  },
];

export default async function InventoryPage() {
  if (!hasAdminCredentials()) {
    return (
      <Card>
        <h1 className="text-lg font-semibold">Connect your Shopify Admin API token</h1>
        <p className="mt-2 text-sm text-slate-600">
          Set <code>SHOPIFY_ADMIN_API_ACCESS_TOKEN</code> and <code>SHOPIFY_STORE_DOMAIN</code> in{" "}
          <code>apps/inventory-ops/.env.local</code> to see live inventory data here.
        </p>
      </Card>
    );
  }

  const { products } = await listInventoryProducts({ first: 50 });
  const rows = flattenRows(products);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-slate-900">Inventory</h1>
      <Table<InventoryRow> columns={columns} rows={rows} getRowKey={(row) => row.key} emptyMessage="No products found." />
      <Suspense
        fallback={
          <Card>
            <Skeleton className="h-24 w-full" />
          </Card>
        }
      >
        <ReorderRecommendations products={products} />
      </Suspense>
    </div>
  );
}
```

- [ ] **Step 3: Verify the streaming behavior manually**

```bash
pnpm --filter inventory-ops dev
```

Visit `http://localhost:3001/inventory` with your browser devtools Network tab open (throttle to "Slow 3G" if you want it obvious). Expected: the product table and heading render first; the "Reorder recommendations" card shows the skeleton pulse for roughly 0.8–1.6s, then streams in with its content — proof the `<Suspense>` boundary is independently resolving.

- [ ] **Step 4: Commit**

```bash
git add apps/inventory-ops
git commit -m "Add streaming Suspense reorder-recommendations panel"
```

---

## Task 11: `useTransition` search/filter against the real Admin API

**Files:**
- Create: `apps/inventory-ops/app/actions.ts`
- Create: `apps/inventory-ops/app/SearchFilter.tsx`
- Modify: `apps/inventory-ops/app/page.tsx`

**Interfaces:**
- Consumes: `listInventoryProducts` from Task 8, `withLatency` from `@repo/utils`, `stockStatus` from Task 9, `InventoryRow`/`flattenRows` from Task 9, `Input`/`Table`/`Badge` from `@repo/ui`.
- Produces: `searchInventory(query: string): Promise<InventoryProduct[]>` (Server Action), `SearchFilter` client component that owns the table + search input.

- [ ] **Step 1: Add the search Server Action**

```ts
// apps/inventory-ops/app/actions.ts
"use server";

import { listInventoryProducts, type InventoryProduct } from "@/lib/shopifyAdmin";
import { withLatency } from "@repo/utils";

const searchInventorySlowly = withLatency(
  async (query: string): Promise<InventoryProduct[]> => {
    const { products } = await listInventoryProducts({
      first: 50,
      searchQuery: query ? `title:*${query}*` : undefined,
    });
    return products;
  },
  { minMs: 400, maxMs: 1000 },
);

export async function searchInventory(query: string): Promise<InventoryProduct[]> {
  return searchInventorySlowly(query);
}
```

- [ ] **Step 2: Build the client-side search + table component**

`columns` moves here (out of `page.tsx`) because a Server Component cannot pass functions — like `TableColumn.render`— as props to a Client Component; only plain serializable data can cross that boundary.

```tsx
// apps/inventory-ops/app/SearchFilter.tsx
"use client";

import { useState, useTransition } from "react";
import { Badge, Input, Table, type TableColumn } from "@repo/ui";
import { stockStatus } from "@/lib/lowStock";
import { flattenRows, type InventoryRow } from "@/lib/inventoryRow";
import { searchInventory } from "./actions";

const columns: TableColumn<InventoryRow>[] = [
  { key: "product", header: "Product", render: (row) => row.productTitle },
  { key: "variant", header: "Variant", render: (row) => row.variantTitle },
  { key: "sku", header: "SKU", render: (row) => row.sku ?? "—" },
  { key: "price", header: "Price", render: (row) => `$${row.price}` },
  {
    key: "stock",
    header: "Stock",
    render: (row) => {
      const status = stockStatus(row.available);
      const tone = status === "out" ? "danger" : status === "low" ? "warning" : "success";
      const label =
        status === "out" ? "Out of stock" : status === "low" ? `Low (${row.available})` : `${row.available} in stock`;
      return <Badge tone={tone}>{label}</Badge>;
    },
  },
];

export function SearchFilter({ initialRows }: { initialRows: InventoryRow[] }) {
  const [rows, setRows] = useState(initialRows);
  const [query, setQuery] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleChange(value: string) {
    setQuery(value);
    startTransition(async () => {
      const products = await searchInventory(value);
      setRows(flattenRows(products));
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <Input
        value={query}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="Search inventory by product title…"
        aria-label="Search inventory"
      />
      <div className={isPending ? "opacity-50 transition-opacity" : "transition-opacity"}>
        <Table<InventoryRow>
          columns={columns}
          rows={rows}
          getRowKey={(row) => row.key}
          emptyMessage="No matching products."
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Swap the static table on the page for `SearchFilter`**

```tsx
// apps/inventory-ops/app/page.tsx (full file, replaces Task 10's version)
import { Suspense } from "react";
import { Card, Skeleton } from "@repo/ui";
import { hasAdminCredentials, listInventoryProducts } from "@/lib/shopifyAdmin";
import { flattenRows } from "@/lib/inventoryRow";
import { SearchFilter } from "./SearchFilter";
import { ReorderRecommendations } from "./ReorderRecommendations";

export default async function InventoryPage() {
  if (!hasAdminCredentials()) {
    return (
      <Card>
        <h1 className="text-lg font-semibold">Connect your Shopify Admin API token</h1>
        <p className="mt-2 text-sm text-slate-600">
          Set <code>SHOPIFY_ADMIN_API_ACCESS_TOKEN</code> and <code>SHOPIFY_STORE_DOMAIN</code> in{" "}
          <code>apps/inventory-ops/.env.local</code> to see live inventory data here.
        </p>
      </Card>
    );
  }

  const { products } = await listInventoryProducts({ first: 50 });
  const rows = flattenRows(products);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-slate-900">Inventory</h1>
      <SearchFilter initialRows={rows} />
      <Suspense
        fallback={
          <Card>
            <Skeleton className="h-24 w-full" />
          </Card>
        }
      >
        <ReorderRecommendations products={products} />
      </Suspense>
    </div>
  );
}
```

- [ ] **Step 4: Verify manually**

```bash
pnpm --filter inventory-ops dev
```

Visit `http://localhost:3001/inventory`, type into the search box. Expected: the input stays responsive to typing while the table dims (`opacity-50`) during each search, then updates with filtered results once `searchInventory` resolves — proving `isPending` from `useTransition` is driving the UI without blocking the input.

- [ ] **Step 5: Commit**

```bash
git add apps/inventory-ops
git commit -m "Add useTransition-driven inventory search against live Shopify data"
```

---

## Task 12: Observability — structured Web Vitals logging

**Files:**
- Create: `apps/web/app/api/observability/route.ts`
- Create: `apps/web/app/ReportWebVitals.tsx`
- Modify: `apps/web/app/layout.tsx`
- Modify: `apps/web/package.json` (add `@repo/utils` dependency)

**Interfaces:**
- Consumes: `logger` from `@repo/utils`.
- Produces: `POST /api/observability` route handler; `<ReportWebVitals />` mounted in the root layout.

- [ ] **Step 1: Add the workspace dependency**

Add to `apps/web/package.json` `dependencies`:

```json
"@repo/utils": "workspace:*"
```

- [ ] **Step 2: Add the route handler**

```ts
// apps/web/app/api/observability/route.ts
import { NextRequest, NextResponse } from "next/server";
import { logger } from "@repo/utils";

export async function POST(req: NextRequest) {
  const body = await req.json();
  logger.info("web-vital", body);
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 3: Add the client hook**

```tsx
// apps/web/app/ReportWebVitals.tsx
"use client";

import { useReportWebVitals } from "next/web-vitals";

export function ReportWebVitals() {
  useReportWebVitals((metric) => {
    fetch("/api/observability", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ metricName: metric.name, value: metric.value, id: metric.id }),
      keepalive: true,
    }).catch(() => {
      // Best-effort telemetry — a failed beacon shouldn't affect the page.
    });
  });

  return null;
}
```

- [ ] **Step 4: Mount it in the root layout**

```tsx
// apps/web/app/layout.tsx (full file, replaces Task 7's version)
import "./globals.css";
import { ReportWebVitals } from "./ReportWebVitals";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-sans bg-slate-50 text-slate-900">
        <ReportWebVitals />
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
          <a href="/" className="text-lg font-semibold">
            HLTH Shop
          </a>
          <nav className="flex gap-4 text-sm font-medium text-slate-600">
            <a href="/cart" className="hover:text-slate-900">
              Cart
            </a>
            <a href="/inventory" className="hover:text-slate-900">
              Inventory
            </a>
          </nav>
        </header>
        <div className="p-6">{children}</div>
      </body>
    </html>
  );
}
```

- [ ] **Step 5: Verify manually**

This is thin wiring around the already-tested `logger` (Task 3), so verification is manual rather than a new automated test.

```bash
pnpm install
pnpm --filter web dev
```

Visit `http://localhost:3000/products/shoes` (or any product page), then check the terminal running `pnpm --filter web dev`. Expected: one or more JSON lines like `{"level":"info","message":"web-vital","context":{"metricName":"FCP",...},"timestamp":"..."}` appear as the page reports its vitals.

- [ ] **Step 6: Commit**

```bash
git add apps/web
git commit -m "Add lightweight Web Vitals observability via structured logger"
```

---

## Task 13: Playwright end-to-end tests

**Files:**
- Create: `playwright.config.ts` (root)
- Create: `e2e/cart.spec.ts`
- Create: `e2e/inventory.spec.ts`
- Modify: `package.json` (root — add Playwright devDependency)

**Interfaces:**
- Consumes: the running `web` (port 3000) and `inventory-ops` (port 3001) dev servers, started automatically by Playwright's `webServer` config.

- [ ] **Step 1: Add the Playwright dependency**

Add to root `package.json` `devDependencies`:

```json
"@playwright/test": "^1.49.0"
```

- [ ] **Step 2: Configure Playwright to boot both zones**

```ts
// playwright.config.ts
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  webServer: [
    {
      command: "pnpm --filter web dev",
      url: "http://localhost:3000",
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
    },
    {
      command: "pnpm --filter inventory-ops dev",
      url: "http://localhost:3001/inventory",
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
    },
  ],
  use: {
    baseURL: "http://localhost:3000",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
```

- [ ] **Step 3: Write the e2e specs**

```ts
// e2e/cart.spec.ts
import { test, expect } from "@playwright/test";

// Assumes a product with handle "shoes" exists in the connected Shopify
// dev store (referenced by apps/web/lib/landingPages.ts's mock CMS entry
// too) — adjust the handle below if your catalog uses a different one.
test("adding a product to the cart updates the cart page", async ({ page }) => {
  await page.goto("/products/shoes");
  await page.getByRole("button", { name: "Add to cart" }).click();
  await page.goto("/cart");
  await expect(page.getByText(/Total:/)).toBeVisible();
});
```

```ts
// e2e/inventory.spec.ts
import { test, expect } from "@playwright/test";

test("inventory page renders the product table with real Shopify data", async ({ page }) => {
  await page.goto("/inventory");
  await expect(page.getByRole("heading", { name: "Inventory" })).toBeVisible();
  await expect(page.locator("table")).toBeVisible();
});

test("searching filters the inventory table", async ({ page }) => {
  await page.goto("/inventory");
  await page.getByLabel("Search inventory").fill("zzzznonexistentproduct");
  await expect(page.getByText("No matching products.")).toBeVisible();
});
```

- [ ] **Step 4: Install browsers and run against the real dev store**

Both `.env.local` files (Storefront token in `apps/web`, Admin token in `apps/inventory-ops`) must be populated, and the store must have at least one product with handle `shoes` for `cart.spec.ts` to pass.

```bash
pnpm install
pnpm exec playwright install --with-deps chromium
pnpm exec playwright test
```

Expected: 3 tests pass.

- [ ] **Step 5: Commit**

```bash
git add playwright.config.ts e2e package.json pnpm-lock.yaml
git commit -m "Add Playwright e2e coverage for cart and inventory flows"
```

---

## Task 14: CI — GitHub Actions

**Files:**
- Create: `.github/workflows/ci.yml`
- Create: `.github/workflows/e2e.yml`

**Interfaces:**
- Consumes: `lint`, `typecheck`, `test`, `build` scripts defined across every workspace in Tasks 1–13.

- [ ] **Step 1: Add the main CI workflow**

Every page in this repo is fully dynamic (`generateStaticParams` returns `[]`, and all data fetches use `cache: "no-store"` or tag-based revalidation, never build-time static generation), so `next build` succeeds even without real Shopify secrets configured — they're passed through as a realistic touch, not a hard requirement.

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main]
  pull_request:

jobs:
  build-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with:
          version: 10

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm

      - run: pnpm install --frozen-lockfile

      - run: pnpm -r lint

      - run: pnpm -r typecheck

      - run: pnpm -r test

      - run: pnpm --filter web build
        env:
          SHOPIFY_STORE_DOMAIN: ${{ secrets.SHOPIFY_STORE_DOMAIN }}
          SHOPIFY_STOREFRONT_ACCESS_TOKEN: ${{ secrets.SHOPIFY_STOREFRONT_ACCESS_TOKEN }}
          SHOPIFY_WEBHOOK_SECRET: ${{ secrets.SHOPIFY_WEBHOOK_SECRET }}

      - run: pnpm --filter inventory-ops build
        env:
          SHOPIFY_STORE_DOMAIN: ${{ secrets.SHOPIFY_STORE_DOMAIN }}
          SHOPIFY_ADMIN_API_ACCESS_TOKEN: ${{ secrets.SHOPIFY_ADMIN_API_ACCESS_TOKEN }}
```

- [ ] **Step 2: Add a separate, manually-triggered e2e workflow**

Playwright's specs hit a real, external Shopify store — that's valuable for local confidence but too flaky/slow a dependency to gate every push on, so it's `workflow_dispatch`-only rather than part of the main CI gate. This is a deliberate engineering call, not an oversight — worth calling out if asked about it.

```yaml
# .github/workflows/e2e.yml
name: E2E (manual)

on:
  workflow_dispatch:

jobs:
  playwright:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with:
          version: 10

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm

      - run: pnpm install --frozen-lockfile

      - run: pnpm exec playwright install --with-deps chromium

      - run: pnpm exec playwright test
        env:
          SHOPIFY_STORE_DOMAIN: ${{ secrets.SHOPIFY_STORE_DOMAIN }}
          SHOPIFY_STOREFRONT_ACCESS_TOKEN: ${{ secrets.SHOPIFY_STOREFRONT_ACCESS_TOKEN }}
          SHOPIFY_ADMIN_API_ACCESS_TOKEN: ${{ secrets.SHOPIFY_ADMIN_API_ACCESS_TOKEN }}
          SHOPIFY_WEBHOOK_SECRET: ${{ secrets.SHOPIFY_WEBHOOK_SECRET }}
```

- [ ] **Step 3: Verify locally**

```bash
pnpm install --frozen-lockfile
pnpm -r lint
pnpm -r typecheck
pnpm -r test
pnpm --filter web build
pnpm --filter inventory-ops build
```

Expected: every command exits 0 — this is exactly what `ci.yml` runs.

- [ ] **Step 4: Commit**

```bash
git add .github
git commit -m "Add CI workflow (lint/typecheck/test/build) and manual e2e workflow"
```

---

## Task 15: README overhaul

**Files:**
- Modify: `README.md`

**Interfaces:**
- None — documentation only.

- [ ] **Step 1: Rewrite the root README**

```markdown
# Tech Inventory — Shopify-backed micro-frontend demo

A two-zone Next.js portfolio project: a real Shopify Storefront-API shop
(`apps/web`) and a real Shopify Admin-API inventory dashboard
(`apps/inventory-ops`), independently built/deployed and mounted together
via **Next.js Multi-Zones**, sharing a design system (`packages/ui`) and
a couple of small cross-cutting utilities (`packages/utils`). All data is
live — there is no mock dataset anywhere in this repo.

## Architecture

\`\`\`
apps/
  web/             storefront: PDP, cart, CMS-style landing pages,
                    Shopify webhook receiver. Talks to the Storefront API.
  inventory-ops/    inventory dashboard: stock levels, low-stock flags,
                    live search, a streamed "reorder recommendations"
                    panel. Talks to the Admin API. Mounted at /inventory.
packages/
  ui/               shared Tailwind-based design system (Button, Badge,
                    Input, Card, Table, Skeleton, AppShell).
  utils/            structured logger + an artificial-latency wrapper
                    used to make Suspense/useTransition loading states
                    visible against Shopify's normally-fast responses.
  config/           shared tsconfig base.
\`\`\`

`apps/web` reverse-proxies `/inventory/*` to `apps/inventory-ops` (Next.js
Multi-Zones) — the two apps have independent `package.json`s and build
pipelines, sharing code only through the `packages/*` workspace packages.

## React patterns on display

- **Streaming Suspense**: the inventory page's "Reorder recommendations"
  panel is a separately-awaited async Server Component in its own
  `<Suspense>` boundary, so it visibly streams in after the main table.
- **`useTransition`**: the inventory search box calls a Server Action
  wrapped in `startTransition`, keeping the input responsive while
  `isPending` drives a "stale while refreshing" table treatment.

## Setup

### 1. Shopify dev store (free, ~10 min)

1. Create a free store at https://www.shopify.com/partners → Stores →
   Add store → "Development store".
2. Add a few products with variants and stock quantities.
3. **Storefront API** (for `apps/web`): Settings → Apps and sales
   channels → Develop apps → Create an app → enable Storefront API
   scopes → install → copy the token into `apps/web/.env.local`
   (`SHOPIFY_STORE_DOMAIN`, `SHOPIFY_STOREFRONT_ACCESS_TOKEN`).
4. **Admin API** (for `apps/inventory-ops`): same app (or a new one) →
   Admin API integration → enable `read_products`, `read_inventory`,
   `read_locations` → install → copy the token into
   `apps/inventory-ops/.env.local` (`SHOPIFY_STORE_DOMAIN`,
   `SHOPIFY_ADMIN_API_ACCESS_TOKEN`). See
   `apps/inventory-ops/.env.local.example`.

### 2. Install & run

\`\`\`bash
pnpm install
pnpm dev   # runs both apps concurrently: web on :3000, inventory-ops on :3001
\`\`\`

Visit `http://localhost:3000` for the shop, `http://localhost:3000/inventory`
for the dashboard (proxied from :3001 through the Multi-Zones rewrite).

### 3. Tests

\`\`\`bash
pnpm -r test              # Jest unit/component tests (packages/ui, packages/utils, inventory-ops)
pnpm exec playwright test # e2e — requires both .env.local files populated with real tokens
\`\`\`

### 4. CI

`.github/workflows/ci.yml` runs lint/typecheck/test/build on every push.
`.github/workflows/e2e.yml` is manually triggered (`workflow_dispatch`) —
Playwright hits the real external Shopify store, which is a deliberately
excluded dependency from the main push-gated pipeline.
```

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "Rewrite README for the micro-frontend architecture"
```
