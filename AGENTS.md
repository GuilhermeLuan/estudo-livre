## Agent skills

### Issue tracker

Issues live in GitHub Issues (`GuilhermeLuan/estudo-livre`), via the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

Default vocabulary: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: one `CONTEXT.md` + `docs/adr/` at the repo root. See `docs/agents/domain.md`.

### Interface (obrigatório)

Toda UI deve seguir o **design system** em `docs/design-system.md` e o **protótipo** em `prototype/index.html` (abra no navegador para ver o comportamento). Use os tokens do design system em vez de cores e tamanhos literais, reproduza os componentes e o layout do protótipo e mantenha os textos em pt-BR com o vocabulário do `CONTEXT.md`. Se precisar de algo que nenhum dos dois cobre, siga os princípios do design system e atualize o documento no mesmo PR. Se o protótipo e o documento divergirem, o protótipo vence e o documento deve ser corrigido.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
