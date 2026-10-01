## Agent skills

### Issue tracker

Issues live in GitHub Issues (`GuilhermeLuan/estudo-livre`), via the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

Default vocabulary: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: one `CONTEXT.md` + `docs/adr/` at the repo root. See `docs/agents/domain.md`.

### Interface (obrigatório)

Toda UI deve seguir o **design system** em `docs/design-system.md` e o **protótipo** em `prototype/index.html` (abra no navegador para ver o comportamento). Use os tokens do design system em vez de cores e tamanhos literais, reproduza os componentes e o layout do protótipo e mantenha os textos em pt-BR com o vocabulário do `CONTEXT.md`. Se precisar de algo que nenhum dos dois cobre, siga os princípios do design system e atualize o documento no mesmo PR. Se o protótipo e o documento divergirem, o protótipo vence e o documento deve ser corrigido.

## 1. Commit Message Format

All commit messages **must** follow the [Conventional Commits](https://www.conventionalcommits.org/) specification.

### Syntax
```text
<type>(<scope>): <short description>

[optional body]

[optional footer(s)]
