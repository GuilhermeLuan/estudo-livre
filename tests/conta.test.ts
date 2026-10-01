import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { obterHome } from "@/casos-de-uso";
import { bancoDeTeste, cadastrar, limparBanco } from "./apoio";

const db = bancoDeTeste();
beforeEach(() => limparBanco(db));
afterAll(() => db.$client.end());

describe("conta e instância", () => {
  it("o primeiro Usuário cadastrado é Admin; os seguintes não", async () => {
    const primeiro = await cadastrar(db, "ana@exemplo.com");
    const segundo = await cadastrar(db, "bia@exemplo.com");

    expect((await obterHome(db, primeiro)).usuario.admin).toBe(true);
    expect((await obterHome(db, segundo)).usuario.admin).toBe(false);
  });

  it("um Usuário novo vê a tela inicial sem ciclos", async () => {
    const usuario = await cadastrar(db, "ana@exemplo.com");

    expect((await obterHome(db, usuario)).ciclos).toEqual([]);
  });

  it("com o cadastro desligado, não é possível criar conta", async () => {
    await cadastrar(db, "ana@exemplo.com");

    await expect(cadastrar(db, "bia@exemplo.com", { cadastroAberto: false })).rejects.toThrow(/cadastro/i);
  });

  it("com o cadastro desligado, o primeiro Usuário ainda pode se cadastrar", async () => {
    const admin = await cadastrar(db, "ana@exemplo.com", { cadastroAberto: false });

    expect((await obterHome(db, admin)).usuario.admin).toBe(true);
  });
});
