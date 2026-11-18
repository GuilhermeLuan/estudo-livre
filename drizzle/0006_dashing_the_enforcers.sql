CREATE TYPE "public"."nota_da_revisao" AS ENUM('Errei', 'Difícil', 'Bom', 'Fácil');--> statement-breakpoint
CREATE TABLE "cartao_de_revisao" (
	"topico_id" text PRIMARY KEY NOT NULL,
	"proxima_revisao" timestamp with time zone,
	"estado" jsonb
);
--> statement-breakpoint
CREATE TABLE "log_de_revisao" (
	"id" text PRIMARY KEY NOT NULL,
	"topico_id" text NOT NULL,
	"registro_id" text NOT NULL,
	"nota" "nota_da_revisao" NOT NULL,
	"revisado_em" timestamp with time zone NOT NULL,
	"antes" jsonb NOT NULL,
	"depois" jsonb NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ciclo" ADD COLUMN "faixa_errei_ate" integer DEFAULT 60 NOT NULL;--> statement-breakpoint
ALTER TABLE "ciclo" ADD COLUMN "faixa_dificil_ate" integer DEFAULT 75 NOT NULL;--> statement-breakpoint
ALTER TABLE "ciclo" ADD COLUMN "faixa_bom_ate" integer DEFAULT 90 NOT NULL;--> statement-breakpoint
ALTER TABLE "ciclo" ADD COLUMN "minimo_de_questoes" integer DEFAULT 5 NOT NULL;--> statement-breakpoint
ALTER TABLE "registro_de_estudo" ADD COLUMN "nota" "nota_da_revisao";--> statement-breakpoint
ALTER TABLE "cartao_de_revisao" ADD CONSTRAINT "cartao_de_revisao_topico_id_topico_id_fk" FOREIGN KEY ("topico_id") REFERENCES "public"."topico"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "log_de_revisao" ADD CONSTRAINT "log_de_revisao_topico_id_topico_id_fk" FOREIGN KEY ("topico_id") REFERENCES "public"."topico"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "log_de_revisao_topico" ON "log_de_revisao" USING btree ("topico_id","revisado_em");
--> statement-breakpoint
UPDATE "registro_de_estudo" SET "nota" = CASE
	WHEN round(coalesce("acertos", 0) * 100.0 / "questoes") < 60 THEN 'Errei'::"nota_da_revisao"
	WHEN round(coalesce("acertos", 0) * 100.0 / "questoes") < 75 THEN 'Difícil'::"nota_da_revisao"
	WHEN round(coalesce("acertos", 0) * 100.0 / "questoes") < 90 THEN 'Bom'::"nota_da_revisao"
	ELSE 'Fácil'::"nota_da_revisao" END
WHERE "topico_id" IS NOT NULL AND "questoes" >= 5;
