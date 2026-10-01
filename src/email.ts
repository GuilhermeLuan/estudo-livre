import nodemailer from "nodemailer";

/** O SMTP é opcional: só existe recuperação de senha por e-mail se SMTP_HOST estiver definido. */
export function smtpConfigurado() {
  return Boolean(process.env.SMTP_HOST);
}

export async function enviarEmail(para: string, assunto: string, texto: string) {
  const porta = Number(process.env.SMTP_PORT ?? 587);
  const transporte = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: porta,
    secure: porta === 465,
    auth: process.env.SMTP_USUARIO ? { user: process.env.SMTP_USUARIO, pass: process.env.SMTP_SENHA } : undefined,
  });
  await transporte.sendMail({ from: process.env.SMTP_REMETENTE ?? process.env.SMTP_USUARIO ?? `estudo-livre@${process.env.SMTP_HOST}`, to: para, subject: assunto, text: texto });
}
