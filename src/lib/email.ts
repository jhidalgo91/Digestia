import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.RESEND_FROM_EMAIL ?? "noreply@digestai.app";

export async function sendAdminApprovalRequest(opts: {
  userName: string;
  userEmail: string;
  specialty?: string | null;
}) {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) return;
  await resend.emails.send({
    from: FROM,
    to: adminEmail,
    subject: "Nueva solicitud de nutricionista pendiente de aprobación",
    html: `
      <h2>Solicitud de cuenta de nutricionista</h2>
      <p><strong>Nombre:</strong> ${opts.userName}</p>
      <p><strong>Email:</strong> ${opts.userEmail}</p>
      ${opts.specialty ? `<p><strong>Especialidad:</strong> ${opts.specialty}</p>` : ""}
      <p>Accede al <a href="${process.env.NEXTAUTH_URL}/admin/users">panel de administración</a> para aprobar o rechazar la solicitud.</p>
    `,
  });
}

export async function sendApprovalNotification(opts: {
  userName: string;
  userEmail: string;
  approved: boolean;
}) {
  await resend.emails.send({
    from: FROM,
    to: opts.userEmail,
    subject: opts.approved
      ? "Tu cuenta de nutricionista ha sido aprobada ✅"
      : "Tu solicitud de cuenta no ha sido aprobada",
    html: opts.approved
      ? `
        <h2>¡Cuenta aprobada!</h2>
        <p>Hola ${opts.userName}, tu cuenta de nutricionista en DigestAI ha sido aprobada.</p>
        <p>Ya puedes <a href="${process.env.NEXTAUTH_URL}/auth/login">iniciar sesión</a>.</p>
      `
      : `
        <h2>Solicitud no aprobada</h2>
        <p>Hola ${opts.userName}, lamentablemente tu solicitud de cuenta de nutricionista no ha sido aprobada.</p>
        <p>Contacta con el equipo de soporte si crees que es un error.</p>
      `,
  });
}
