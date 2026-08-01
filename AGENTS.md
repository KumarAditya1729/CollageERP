# CampusOS Agent Guidelines

This project uses Antigravity for AI-assisted development.

## Conventions

- File-based routing via TanStack Router — run `npx @tanstack/router-cli generate` after adding route files
- All integrations (audit, timeline, search, notifications) go through `src/lib/integrationService.ts`
- Use existing hooks from `src/hooks/` — do not duplicate data-fetching logic
- StatCard icon prop accepts a `LucideIcon` component reference (not JSX)
- DataTable requires `key`, `header`, `getRowId` — see `src/components/common/data-table.tsx`

## Dev Server

```bash
npm run dev        # Vite dev server with HMR
npm run build      # Production build
npm start          # Serve production build
```
