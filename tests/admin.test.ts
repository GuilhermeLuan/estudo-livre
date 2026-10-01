import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { listarUsuarios, redefinirSenha } from "@/casos-de-uso";
import { authDeTeste, bancoDeTeste, cadastrar, limparBanco } from "./apoio";

const db = bancoDeTeste();
beforeEach(() => limparBanco(db));
afterAll(() => db.$client.end());

const entrar = (email: string, password: string) => authDeTeste(db).api.signInEmail({ body: { email, password } });

describe("Admin", () => {
  it("lista os Usuários e redefine a senha de qualquer um", async () => {
    const admin = await cadastrar(db, "ana@exemplo.com");
    const bia = await cadastrar(db, "bia@exemplo.com");

    expect((await listarUsuarios(db, admin)).map((u) => u.email)).toEqual(["ana@exemplo.com", "bia@exemplo.com"]);

    await redefinirSenha(db, admin, bia.id, "nova-senha-456");

    await expect(entrar("bia@exemplo.com", "senha-de-teste-123")).rejects.toThrow();
    await expect(entrar("bia@exemplo.com", "nova-senha-456")).resolves.toBeDefined();
  });

  it("Usuário comum não lista nem redefine senhas", async () => {
    const admin = await cadastrar(db, "ana@exemplo.com");
    const bia = await cadastrar(db, "bia@exemplo.com");

    await expect(listarUsuarios(db, bia)).rejects.toThrow(/admin/i);
    await expect(redefinirSenha(db, bia, admin.id, "nova-senha-456")).rejects.toThrow(/admin/i);
    await expect(entrar("ana@exemplo.com", "senha-de-teste-123")).resolves.toBeDefined();
  });

  it("rejeita senha curta", async () => {
    const admin = await cadastrar(db, "ana@exemplo.com");
    await expect(redefinirSenha(db, admin, admin.id, "curta")).rejects.toThrow(/8 caracteres/);
  });
});

describe("recuperação de senha por e-mail", () => {
  it("com SMTP, envia o link e permite redefinir", async () => {
    await cadastrar(db, "ana@exemplo.com");
    const enviados: { email: string; url: string }[] = [];
    const auth = authDeTeste(db, { enviarRecuperacao: async (d) => void enviados.push(d) });

    await auth.api.requestPasswordReset({ body: { email: "ana@exemplo.com", redirectTo: "/redefinir-senha" } });

    expect(enviados).toHaveLength(1);
    const token = new URL(enviados[0].url, "http://localhost").pathname.split("/").pop()!;
    await auth.api.resetPassword({ body: { newPassword: "outra-senha-789", token } });
    await expect(entrar("ana@exemplo.com", "outra-senha-789")).resolves.toBeDefined();
  });

  it("sem SMTP, a recuperação por e-mail não existe", async () => {
    await cadastrar(db, "ana@exemplo.com");
    await expect(
      authDeTeste(db).api.requestPasswordReset({ body: { email: "ana@exemplo.com", redirectTo: "/redefinir-senha" } }),
    ).rejects.toThrow();
  });
});
