import { sql } from "drizzle-orm";
import { boolean, integer, index, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

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
