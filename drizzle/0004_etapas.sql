CREATE TABLE "etapa" (
	"id" text PRIMARY KEY NOT NULL,
	"ciclo_id" text NOT NULL,
	"materia_id" text NOT NULL,
	"carga_minutos" integer NOT NULL,
	"posicao" integer NOT NULL
);
--> statement-breakpoint
DROP INDEX "materia_ciclo";--> statement-breakpoint
ALTER TABLE "etapa" ADD CONSTRAINT "etapa_ciclo_id_ciclo_id_fk" FOREIGN KEY ("ciclo_id") REFERENCES "public"."ciclo"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "etapa" ADD CONSTRAINT "etapa_materia_id_materia_id_fk" FOREIGN KEY ("materia_id") REFERENCES "public"."materia"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "etapa_ciclo" ON "etapa" USING btree ("ciclo_id","posicao");--> statement-breakpoint
CREATE INDEX "etapa_materia" ON "etapa" USING btree ("materia_id");--> statement-breakpoint
-- Migração de dados: cada Matéria antiga vira uma Etapa (com a carga e a posição que tinha); Matérias de mesmo
-- nome no mesmo Ciclo são fundidas na primeira delas, e o histórico (registros e cronômetro) vai para ela.
INSERT INTO "etapa" ("id", "ciclo_id", "materia_id", "carga_minutos", "posicao")
SELECT gen_random_uuid()::text, "ciclo_id", "id", "carga_minutos", "posicao" FROM "materia";--> statement-breakpoint
CREATE TEMP TABLE "materia_canonica" AS
SELECT "id", first_value("id") OVER (PARTITION BY "ciclo_id", lower("nome") ORDER BY "posicao", "id") AS "canonica_id" FROM "materia";--> statement-breakpoint
UPDATE "etapa" SET "materia_id" = c."canonica_id" FROM "materia_canonica" c WHERE "etapa"."materia_id" = c."id";--> statement-breakpoint
UPDATE "registro_de_estudo" SET "materia_id" = c."canonica_id" FROM "materia_canonica" c WHERE "registro_de_estudo"."materia_id" = c."id";--> statement-breakpoint
UPDATE "cronometro" SET "materia_id" = c."canonica_id" FROM "materia_canonica" c WHERE "cronometro"."materia_id" = c."id";--> statement-breakpoint
DELETE FROM "materia" USING "materia_canonica" c WHERE "materia"."id" = c."id" AND c."id" <> c."canonica_id";--> statement-breakpoint
DROP TABLE "materia_canonica";--> statement-breakpoint
CREATE UNIQUE INDEX "materia_ciclo_nome" ON "materia" USING btree ("ciclo_id",lower("nome"));--> statement-breakpoint
ALTER TABLE "materia" DROP COLUMN "carga_minutos";--> statement-breakpoint
ALTER TABLE "materia" DROP COLUMN "posicao";