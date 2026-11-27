# Estudo Livre

Organizador de estudos para concursos, self-hosted. Veja `CONTEXT.md` e `docs/adr/`.

## Subir a instância

```bash
cp .env.example .env   # defina BETTER_AUTH_SECRET
docker compose up -d --build
```

Em produção não é preciso buildar no servidor: cada push na `main` com o CI verde publica a imagem em `ghcr.io/guilhermeluan/estudo-livre` (tags `main` e `sha-<commit>`). Para usá-la, some o arquivo de produção:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

As migrations são aplicadas na subida. O primeiro Usuário cadastrado vira Admin. `CADASTRO_ABERTO=false` fecha o cadastro (o primeiro Usuário ainda pode se cadastrar).

O Admin redefine a senha de qualquer Usuário em **Usuários**. Para o Usuário recuperar a senha por e-mail, defina `SMTP_HOST` (e, se preciso, `SMTP_PORT`, `SMTP_USUARIO`, `SMTP_SENHA`, `SMTP_REMETENTE`); sem `SMTP_HOST`, a opção "Esqueci minha senha" não aparece.

## Desenvolvimento

```bash
npm install
npm test        # sobe um Postgres descartável via Docker
npm run typecheck
```
