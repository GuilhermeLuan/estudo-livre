import { getSessionCookie } from "better-auth/cookies";
import { NextResponse, type NextRequest } from "next/server";

// Checagem otimista: sem cookie de sessão, rotas autenticadas vão para o login.
// A validação real da sessão acontece em exigirUsuario().
export function proxy(req: NextRequest) {
  if (!getSessionCookie(req)) return NextResponse.redirect(new URL("/entrar", req.url));
  return NextResponse.next();
}

export const config = { matcher: ["/((?!(?:entrar|cadastrar|esqueci-senha|redefinir-senha)$|api/auth/|_next/|.*\\..*).*)"] };
