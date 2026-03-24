import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? "DigestAI <noreply@digestai.app>";

interface AlertEmailPayload {
  toEmail: string;
  toName: string;
  alertType: string;
  message: string;
}

const ALERT_LABELS: Record<string, string> = {
  CARBS_AT_DINNER: "Carbohidratos en cena",
  LOW_ADHERENCE: "Baja adherencia al plan",
  BAD_DIGESTION: "Digestión deficiente",
  MISSING_LOGS: "Registros incompletos",
  EXTREME_HUNGER: "Hambre extrema",
  GAS_LEGUMES: "Gases / biofeedback de legumbres",
  SUPPLEMENT_MISSED: "Suplemento no registrado",
  CUSTOM: "Aviso de tu nutricionista",
};

/**
 * Sends a deviation alert email to the patient via Resend.
 * Returns silently if RESEND_API_KEY is not configured.
 */
export async function sendAlertEmail(payload: AlertEmailPayload): Promise<void> {
  if (!resend) return; // Not configured — skip silently

  const alertLabel = ALERT_LABELS[payload.alertType] ?? payload.alertType;

  await resend.emails.send({
    from: FROM_EMAIL,
    to: payload.toEmail,
    subject: `DigestAI: ${alertLabel}`,
    html: `
      <!DOCTYPE html>
      <html lang="es">
      <head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f9fafb; margin: 0; padding: 0;">
        <div style="max-width: 480px; margin: 40px auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e5e7eb;">
          <!-- Header -->
          <div style="background: #059669; padding: 24px; text-align: center;">
            <p style="color: white; font-size: 24px; margin: 0;">🥗 DigestAI</p>
          </div>

          <!-- Body -->
          <div style="padding: 28px 24px;">
            <p style="color: #374151; font-size: 16px; margin: 0 0 8px;">Hola, <strong>${payload.toName}</strong></p>
            <p style="color: #6b7280; font-size: 14px; margin: 0 0 20px;">Tienes una nueva alerta en tu plan nutricional:</p>

            <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
              <p style="color: #065f46; font-weight: 600; font-size: 13px; margin: 0 0 6px; text-transform: uppercase; letter-spacing: 0.05em;">${alertLabel}</p>
              <p style="color: #374151; font-size: 14px; margin: 0; line-height: 1.5;">${payload.message}</p>
            </div>

            <a href="${process.env.NEXTAUTH_URL ?? "https://digestai.app"}/dashboard/patient/alerts"
               style="display: inline-block; background: #059669; color: white; text-decoration: none; padding: 10px 20px; border-radius: 8px; font-size: 14px; font-weight: 500;">
              Ver mis alertas
            </a>
          </div>

          <!-- Footer -->
          <div style="padding: 16px 24px; border-top: 1px solid #f3f4f6; text-align: center;">
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">
              DigestAI · Nutrición inteligente · <a href="${process.env.NEXTAUTH_URL ?? "https://digestai.app"}/dashboard/patient/alerts" style="color: #9ca3af;">Gestionar alertas</a>
            </p>
          </div>
        </div>
      </body>
      </html>
    `,
  });
}
