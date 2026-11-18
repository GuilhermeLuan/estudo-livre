CREATE TABLE "topico" (
	"id" text PRIMARY KEY NOT NULL,
	"materia_id" text NOT NULL,
	"nome" text NOT NULL,
	"estudado" boolean DEFAULT false NOT NULL,
	"posicao" integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE "registro_de_estudo" ADD COLUMN "topico_id" text;--> statement-breakpoint
ALTER TABLE "topico" ADD CONSTRAINT "topico_materia_id_materia_id_fk" FOREIGN KEY ("materia_id") REFERENCES "public"."materia"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "topico_materia_nome" ON "topico" USING btree ("materia_id",lower("nome"));--> statement-breakpoint
CREATE INDEX "topico_materia_posicao" ON "topico" USING btree ("materia_id","posicao");--> statement-breakpoint
ALTER TABLE "registro_de_estudo" ADD CONSTRAINT "registro_de_estudo_topico_id_topico_id_fk" FOREIGN KEY ("topico_id") REFERENCES "public"."topico"("id") ON DELETE set null ON UPDATE no action;