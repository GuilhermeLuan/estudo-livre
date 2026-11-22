CREATE TYPE "public"."dificuldade_da_materia" AS ENUM('facil', 'media', 'dificil');--> statement-breakpoint
ALTER TABLE "materia" ADD COLUMN "dificuldade" "dificuldade_da_materia";--> statement-breakpoint
ALTER TABLE "materia" ADD COLUMN "questoes_da_prova" integer;