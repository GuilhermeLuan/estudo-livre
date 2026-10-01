import { toNextJsHandler } from "better-auth/next-js";
import { obterAuth } from "@/auth";

export const { GET, POST } = toNextJsHandler((req) => obterAuth().handler(req));
