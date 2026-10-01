# Self-hosted sem serviços externos obrigatórios

O app é distribuído como Docker Compose (Next.js + Postgres) e não depende de nenhum serviço gerenciado. Por isso usamos Postgres puro com Drizzle e Better Auth (e-mail e senha), e não Supabase nem login social. O cadastro é aberto, mas pode ser desligado por variável de ambiente. O SMTP é opcional: sem ele, a recuperação de senha é feita pelo admin. O modo offline ficou fora para manter o app simples; o cronômetro sobrevive a fechar a aba porque guarda o horário de início.
