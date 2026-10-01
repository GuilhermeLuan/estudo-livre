CREATE TABLE "cronometro" (
	"usuario_id" text PRIMARY KEY NOT NULL,
	"materia_id" text NOT NULL,
	"acumulado_segundos" integer DEFAULT 0 NOT NULL,
	"rodando_desde" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "cronometro" ADD CONSTRAINT "cronometro_usuario_id_user_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cronometro" ADD CONSTRAINT "cronometro_materia_id_materia_id_fk" FOREIGN KEY ("materia_id") REFERENCES "public"."materia"("id") ON DELETE cascade ON UPDATE no action;