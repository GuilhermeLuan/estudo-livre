import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { APIError } from "better-auth/api";
import { nextCookies } from "better-auth/next-js";
import { CadastroFechadoError, prepararCadastro } from "@/casos-de-uso";
import { obterDb, type Db } from "@/db";
import * as schema from "@/db/schema";
import { enviarEmail, smtpConfigurado } from "@/email";

export type EnviarRecuperacao = (dados: { email: string; nome: string; url: string }) => Promise<void>;

export function criarAuth(db: Db, opcoes: { cadastroAberto: boolean; segredo?: string; enviarRecuperacao?: EnviarRecuperacao }) {
  return betterAuth({
    secret: opcoes.segredo,
    database: drizzleAdapter(db, { provider: "pg", schema }),
    emailAndPassword: {
      enabled: true,
      autoSignIn: true,
      // Sem a função, o Better Auth não expõe a recuperação por e-mail.
      ...(opcoes.enviarRecuperacao && {
        sendResetPassword: ({ user, url }) => opcoes.enviarRecuperacao!({ email: user.email, nome: user.name, url }),
        revokeSessionsOnPasswordReset: true,
      }),
    },
    user: { additionalFields: { admin: { type: "boolean", defaultValue: false, input: false } } },
    databaseHooks: {
      user: {
        create: {
          before: async (novo) => {
            try {
              const { admin } = await prepararCadastro(db, opcoes);
              return { data: { ...novo, admin } };
            } catch (erro) {
              if (erro instanceof CadastroFechadoError) throw new APIError("FORBIDDEN", { message: erro.message });
              throw erro;
            }
          },
        },
      },
    },
    plugins: [nextCookies()],
  });
}

export function cadastroAberto() {
  return process.env.CADASTRO_ABERTO !== "false";
}

let auth: ReturnType<typeof criarAuth> | undefined;

export function obterAuth() {
  auth ??= criarAuth(obterDb(), {
    cadastroAberto: cadastroAberto(),
    enviarRecuperacao: smtpConfigurado()
      ? ({ email, nome, url }) =>
          enviarEmail(email, "Redefinir sua senha — Estudo Livre", `Olá, ${nome}.\n\nPara escolher uma nova senha, acesse:\n${url}\n\nSe não foi você, ignore este e-mail.`)
      : undefined,
  });
  return auth;
}
