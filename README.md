# Estudo Livre

Organizador de estudos para concursos, self-hosted. Veja `CONTEXT.md` e `docs/adr/`.

## Subir a instância

```bash
cp .env.example .env   # defina BETTER_AUTH_SECRET
docker compose up -d --build
```

As migrations são aplicadas na subida. O primeiro Usuário cadastrado vira Admin. `CADASTRO_ABERTO=false` fecha o cadastro (o primeiro Usuário ainda pode se cadastrar).

## Desenvolvimento

```bash
npm install
npm test        # sobe um Postgres descartável via Docker
npm run typecheck
```
