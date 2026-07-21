# AGENTS.md

## Project Shape
- Single NestJS 11 service; `src/main.ts` bootstraps `AppModule`, enables CORS, global `ValidationPipe`, Firebase Admin, and listens on `0.0.0.0:${PORT:-3000}`.
- Runtime modules are wired in `src/app.module.ts`; shared Prisma access is a global `PrismaModule` at `src/shared/prisma`.
- `README.md` is still the stock NestJS starter text; trust `package.json`, `prisma.config.ts`, and source over README prose.

## Commands
- Use Node 22 (`.nvmrc`, Railway `NIXPACKS_NODE_VERSION`).
- Install with `npm install`; `package-lock.json` is present and should stay in sync.
- Dev server: `npm run start:dev`; production start expects an existing `dist`: `npm run start:prod`.
- Build/typecheck: `npm run build` runs `npx prisma generate && nest build`; there is no separate `typecheck` script.
- Lint/format: `npm run lint` runs ESLint with `--fix`; `npm run format` writes Prettier changes for `src/**/*.ts` and `test/**/*.ts`.
- Unit tests: `npm test`; focused unit test example verified: `npm test -- app.controller.spec.ts`.
- E2E tests: `npm run test:e2e` currently fails because `test/jest-e2e.json` does not map the `src/*` TypeScript path alias used by app imports.

## Prisma And Data
- Prisma 7 config lives in `prisma.config.ts`; `DATABASE_URL` is loaded there via `dotenv/config`, while `prisma/schema.prisma` intentionally has no datasource URL.
- The Prisma client is generated into `node_modules/@prisma/client`; do not commit generated clients or `dist` output.
- Railway deploy runs `npx prisma migrate deploy && npm run start:prod`; schema changes should include a migration under `prisma/migrations`.

## Environment Gotchas
- Startup requires `FIREBASE_CONFIG_BASE64` containing a base64-encoded Firebase service-account JSON; `main.ts` decodes it before `admin.initializeApp`.
- Database access uses `@prisma/adapter-pg` with `process.env.DATABASE_URL` in `PrismaService`, not the default Prisma datasource URL in schema.
- Optional integrations are env-driven: Cloudinary (`CLOUDINARY_*`), Firebase web API (`FIREBASE_API_KEY`), and mail providers (`APPS_SCRIPT_URL`, `BREVO_API_KEY`, `MAIL_USER`/`MAIL_PASS`, `RESEND_API_KEY`).
- `main.ts` forces DNS `ipv4first` for Railway IPv6 issues; preserve that unless replacing the deployment networking approach.
