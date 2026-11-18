import { sql } from "drizzle-orm";
import { TIPOS_DE_ESTUDO } from "@/dominio";
import { NOTAS } from "@/revisao";
import { boolean, integer, index, jsonb, pgEnum, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

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

// Domínio. Cada Matéria pertence a exatamente um Ciclo (ADR-0001) e aparece uma só vez nele; o Ciclo é uma
// sequência de Etapas, cada uma com a carga horária de uma visita à Matéria (ADR-0004).
export const ciclo = pgTable("ciclo", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  usuarioId: text("usuario_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  nome: text("nome").notNull(),
  // Faixas de acerto que viram a Nota da revisão e Mínimo de questões para sugeri-la (limites superiores exclusivos).
  faixaErreiAte: integer("faixa_errei_ate").notNull().default(60),
  faixaDificilAte: integer("faixa_dificil_ate").notNull().default(75),
  faixaBomAte: integer("faixa_bom_ate").notNull().default(90),
  minimoDeQuestoes: integer("minimo_de_questoes").notNull().default(5),
  // Arquivado = não nulo: sai da Hoje e das sugestões, e o histórico fica intacto.
  arquivadoEm: timestamp("arquivado_em", { withTimezone: true }),
  criadoEm: timestamp("criado_em").notNull().defaultNow(),
}, (t) => [index("ciclo_usuario").on(t.usuarioId)]);

export const materia = pgTable("materia", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  cicloId: text("ciclo_id").notNull().references(() => ciclo.id, { onDelete: "cascade" }),
  nome: text("nome").notNull(),
}, (t) => [uniqueIndex("materia_ciclo_nome").on(t.cicloId, sql`lower(${t.nome})`)]);

export const etapa = pgTable("etapa", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  cicloId: text("ciclo_id").notNull().references(() => ciclo.id, { onDelete: "cascade" }),
  materiaId: text("materia_id").notNull().references(() => materia.id, { onDelete: "cascade" }),
  cargaMinutos: integer("carga_minutos").notNull(),
  posicao: integer("posicao").notNull(),
}, (t) => [index("etapa_ciclo").on(t.cicloId, t.posicao), index("etapa_materia").on(t.materiaId)]);

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

// Item do conteúdo programático da Matéria, sem subtópicos. `posicao` é a ordem de criação/importação.
export const topico = pgTable("topico", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  materiaId: text("materia_id").notNull().references(() => materia.id, { onDelete: "cascade" }),
  nome: text("nome").notNull(),
  estudado: boolean("estudado").notNull().default(false),
  posicao: integer("posicao").notNull(),
}, (t) => [
  uniqueIndex("topico_materia_nome").on(t.materiaId, sql`lower(${t.nome})`),
  index("topico_materia_posicao").on(t.materiaId, t.posicao),
]);

export const tipoDeEstudo = pgEnum("tipo_de_estudo", TIPOS_DE_ESTUDO);
export const notaDaRevisao = pgEnum("nota_da_revisao", NOTAS);

export const registroDeEstudo = pgTable("registro_de_estudo", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  materiaId: text("materia_id").notNull().references(() => materia.id, { onDelete: "cascade" }),
  dataHora: timestamp("data_hora", { withTimezone: true }).notNull(),
  duracaoMinutos: integer("duracao_minutos").notNull(),
  tipo: tipoDeEstudo("tipo").notNull(),
  questoes: integer("questoes"),
  acertos: integer("acertos"),
  anotacao: text("anotacao"),
  nota: notaDaRevisao("nota"),
  conteudoLivre: text("conteudo_livre"),
  // Excluir o Tópico mantém o Registro, sem conteúdo (AD-009).
  topicoId: text("topico_id").references(() => topico.id, { onDelete: "set null" }),
  criadoEm: timestamp("criado_em").notNull().defaultNow(),
}, (t) => [index("registro_materia_data").on(t.materiaId, t.dataHora)]);

// Valor derivado dos Registros do Tópico com nota (ADR-0002): refeito do zero a cada mudança. Existe se o Tópico
// tem Registros; `proximaRevisao` nulo = ainda sem data.
export const cartaoDeRevisao = pgTable("cartao_de_revisao", {
  topicoId: text("topico_id").primaryKey().references(() => topico.id, { onDelete: "cascade" }),
  proximaRevisao: timestamp("proxima_revisao", { withTimezone: true }),
  estado: jsonb("estado"),
});

export const logDeRevisao = pgTable("log_de_revisao", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  topicoId: text("topico_id").notNull().references(() => topico.id, { onDelete: "cascade" }),
  registroId: text("registro_id").notNull(),
  nota: notaDaRevisao("nota").notNull(),
  revisadoEm: timestamp("revisado_em", { withTimezone: true }).notNull(),
  antes: jsonb("antes").notNull(),
  depois: jsonb("depois").notNull(),
}, (t) => [index("log_de_revisao_topico").on(t.topicoId, t.revisadoEm)]);

// Cronômetro do Usuário: no máximo um (a chave é o Usuário). O tempo decorrido é
// `acumuladoSegundos` + o intervalo desde `rodandoDesde`; nulo significa pausado.
export const cronometro = pgTable("cronometro", {
  usuarioId: text("usuario_id").primaryKey().references(() => user.id, { onDelete: "cascade" }),
  materiaId: text("materia_id").notNull().references(() => materia.id, { onDelete: "cascade" }),
  acumuladoSegundos: integer("acumulado_segundos").notNull().default(0),
  rodandoDesde: timestamp("rodando_desde", { withTimezone: true }),
});
