CREATE TABLE "ciclo" (
	"id" text PRIMARY KEY NOT NULL,
	"usuario_id" text NOT NULL,
	"nome" text NOT NULL,
	"criado_em" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "materia" (
	"id" text PRIMARY KEY NOT NULL,
	"ciclo_id" text NOT NULL,
	"nome" text NOT NULL,
	"carga_minutos" integer NOT NULL,
	"posicao" integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ciclo" ADD CONSTRAINT "ciclo_usuario_id_user_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "materia" ADD CONSTRAINT "materia_ciclo_id_ciclo_id_fk" FOREIGN KEY ("ciclo_id") REFERENCES "public"."ciclo"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ciclo_usuario" ON "ciclo" USING btree ("usuario_id");--> statement-breakpoint
CREATE INDEX "materia_ciclo" ON "materia" USING btree ("ciclo_id","posicao");