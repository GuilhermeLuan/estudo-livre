CREATE TYPE "public"."tipo_de_estudo" AS ENUM('Teoria', 'Exercícios', 'Revisão', 'Videoaula', 'Leitura de lei');--> statement-breakpoint
CREATE TABLE "registro_de_estudo" (
	"id" text PRIMARY KEY NOT NULL,
	"materia_id" text NOT NULL,
	"data_hora" timestamp with time zone NOT NULL,
	"duracao_minutos" integer NOT NULL,
	"tipo" "tipo_de_estudo" NOT NULL,
	"questoes" integer,
	"acertos" integer,
	"anotacao" text,
	"conteudo_livre" text,
	"criado_em" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "volta" (
	"id" text PRIMARY KEY NOT NULL,
	"ciclo_id" text NOT NULL,
	"numero" integer NOT NULL,
	"inicio" timestamp with time zone,
	"fim" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "registro_de_estudo" ADD CONSTRAINT "registro_de_estudo_materia_id_materia_id_fk" FOREIGN KEY ("materia_id") REFERENCES "public"."materia"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "volta" ADD CONSTRAINT "volta_ciclo_id_ciclo_id_fk" FOREIGN KEY ("ciclo_id") REFERENCES "public"."ciclo"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "registro_materia_data" ON "registro_de_estudo" USING btree ("materia_id","data_hora");--> statement-breakpoint
CREATE UNIQUE INDEX "volta_ciclo_numero" ON "volta" USING btree ("ciclo_id","numero");--> statement-breakpoint
CREATE UNIQUE INDEX "volta_unica_aberta" ON "volta" USING btree ("ciclo_id") WHERE "volta"."fim" is null;--> statement-breakpoint
-- Os Ciclos que já existem começam na Volta 1.
INSERT INTO "volta" ("id", "ciclo_id", "numero") SELECT gen_random_uuid()::text, "id", 1 FROM "ciclo";
