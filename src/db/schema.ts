import { sql } from "drizzle-orm";
import { TIPOS_DE_ESTUDO } from "@/dominio";
import { boolean, integer, index, pgEnum, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

// Tabelas do Better Auth. "user" é o Usuário do domínio.
export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  admin: boolean("admin").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [
  // Garante um único Admin mesmo com dois cadastros simultâneos numa instância vazia.
  uniqueIndex("user_unico_admin").on(t.admin).where(sql`${t.admin}`),
]);

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Domínio. Cada Matéria pertence a exatamente um Ciclo (ADR-0001).
export const ciclo = pgTable("ciclo", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  usuarioId: text("usuario_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  nome: text("nome").notNull(),
  criadoEm: timestamp("criado_em").notNull().defaultNow(),
}, (t) => [index("ciclo_usuario").on(t.usuarioId)]);

export const materia = pgTable("materia", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  cicloId: text("ciclo_id").notNull().references(() => ciclo.id, { onDelete: "cascade" }),
  nome: text("nome").notNull(),
  cargaMinutos: integer("carga_minutos").notNull(),
  posicao: integer("posicao").notNull(),
}, (t) => [index("materia_ciclo").on(t.cicloId, t.posicao)]);

// Uma Volta cobre o intervalo (inicio, fim] do Ciclo; inicio nulo = sem limite inferior (Volta 1)
// e fim nulo = Volta aberta. Todo Ciclo tem exatamente uma Volta aberta.
export const volta = pgTable("volta", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  cicloId: text("ciclo_id").notNull().references(() => ciclo.id, { onDelete: "cascade" }),
  numero: integer("numero").notNull(),
  inicio: timestamp("inicio", { withTimezone: true }),
  fim: timestamp("fim", { withTimezone: true }),
}, (t) => [
  uniqueIndex("volta_ciclo_numero").on(t.cicloId, t.numero),
  uniqueIndex("volta_unica_aberta").on(t.cicloId).where(sql`${t.fim} is null`),
]);

export const tipoDeEstudo = pgEnum("tipo_de_estudo", TIPOS_DE_ESTUDO);

export const registroDeEstudo = pgTable("registro_de_estudo", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  materiaId: text("materia_id").notNull().references(() => materia.id, { onDelete: "cascade" }),
  dataHora: timestamp("data_hora", { withTimezone: true }).notNull(),
  duracaoMinutos: integer("duracao_minutos").notNull(),
  tipo: tipoDeEstudo("tipo").notNull(),
  questoes: integer("questoes"),
  acertos: integer("acertos"),
  anotacao: text("anotacao"),
  conteudoLivre: text("conteudo_livre"),
  criadoEm: timestamp("criado_em").notNull().defaultNow(),
}, (t) => [index("registro_materia_data").on(t.materiaId, t.dataHora)]);

// Cronômetro do Usuário: no máximo um (a chave é o Usuário). O tempo decorrido é
// `acumuladoSegundos` + o intervalo desde `rodandoDesde`; nulo significa pausado.
export const cronometro = pgTable("cronometro", {
  usuarioId: text("usuario_id").primaryKey().references(() => user.id, { onDelete: "cascade" }),
  materiaId: text("materia_id").notNull().references(() => materia.id, { onDelete: "cascade" }),
  acumuladoSegundos: integer("acumulado_segundos").notNull().default(0),
  rodandoDesde: timestamp("rodando_desde", { withTimezone: true }),
});
