import nodemailer from "nodemailer";

function parseHostAndPort(rawHost: string | undefined, rawPort: string | undefined) {
  const fallbackPort = Number(rawPort ?? 587);
  if (!rawHost) {
    return { host: null as string | null, port: fallbackPort };
  }

  const match = rawHost.match(/^(.+):(\d+)$/);
  if (!match) {
    return { host: rawHost, port: fallbackPort };
  }

  return {
    host: match[1],
    port: Number(match[2]) || fallbackPort,
  };
}

const rawSmtpHost = process.env.SMTP_HOST ?? process.env.SMTP_SMARTHOST;
const { host: smtpHost, port: smtpPort } = parseHostAndPort(rawSmtpHost, process.env.SMTP_PORT);
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;

const transporter =
  smtpHost && smtpUser && smtpPass
    ? nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      })
    : null;

async function sendCodeEmail(email: string, code: string, subject: string, text: string) {
  if (!transporter) {
    console.info({ email, code }, "Verification email skipped; SMTP is not configured");
    return;
  }

  try {
    await transporter.sendMail({
      from: smtpUser,
      to: email,
      subject,
      text,
    });
  } catch (error) {
    console.error({ error, email }, "MFA email failed");
    console.info({ email, code }, "MFA fallback code");
  }
}

export async function sendMfaCode(email: string, code: string) {
  await sendCodeEmail(
    email,
    code,
    "Votre code de connexion Location Auto Maroc",
    `Votre code de connexion est ${code}. Il expire dans 10 minutes.`,
  );
}

export async function sendVerificationCode(email: string, code: string) {
  await sendCodeEmail(
    email,
    code,
    "Vérifiez votre adresse e-mail Location Auto Maroc",
    `Votre code de vérification est ${code}. Il expire dans 15 minutes.`,
  );
}
