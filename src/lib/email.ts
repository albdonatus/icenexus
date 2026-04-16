import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

const FROM = process.env.RESEND_FROM ?? "Ice Nexus <onboarding@resend.dev>";
const APP_URL = process.env.NEXTAUTH_URL ?? process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000";

function warn(msg: string) {
  console.warn(`[email] ${msg}`);
}

/** Notifica os admins sobre novo cadastro aguardando aprovação */
export async function sendPendingApprovalToAdmins(adminEmails: string[], newUser: { name: string; email: string }) {
  if (!resend) { warn("RESEND_API_KEY não configurado — email não enviado"); return; }
  if (!adminEmails.length) { warn("Nenhum admin encontrado para notificar"); return; }

  await resend.emails.send({
    from: FROM,
    to: adminEmails,
    subject: `[Ice Nexus] Novo cadastro aguardando aprovação: ${newUser.name}`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#1a1a1a">
        <div style="background:#7c3aed;padding:24px 32px;border-radius:12px 12px 0 0">
          <h1 style="color:white;margin:0;font-size:20px">Ice Nexus</h1>
        </div>
        <div style="background:#f9fafb;padding:32px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px">
          <h2 style="margin:0 0 16px;font-size:18px">Novo cadastro aguardando aprovação</h2>
          <p style="color:#6b7280;margin:0 0 24px">Um novo usuário se cadastrou e está aguardando liberação de acesso:</p>
          <table style="background:white;border:1px solid #e5e7eb;border-radius:8px;padding:16px 20px;width:100%;border-collapse:collapse">
            <tr><td style="padding:6px 0;color:#6b7280;font-size:13px">Nome</td><td style="padding:6px 0;font-weight:600">${newUser.name}</td></tr>
            <tr><td style="padding:6px 0;color:#6b7280;font-size:13px">Email</td><td style="padding:6px 0">${newUser.email}</td></tr>
          </table>
          <div style="margin-top:24px">
            <a href="${APP_URL}/admin/users" style="background:#7c3aed;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;display:inline-block">
              Aprovar no painel admin →
            </a>
          </div>
          <p style="color:#9ca3af;font-size:12px;margin-top:24px">Ice Nexus · Sistema de Gestão de Manutenção</p>
        </div>
      </div>
    `,
  });
}

/** Notifica o usuário que sua conta foi aprovada */
export async function sendAccountApproved(userEmail: string, userName: string) {
  if (!resend) { warn("RESEND_API_KEY não configurado — email não enviado"); return; }

  await resend.emails.send({
    from: FROM,
    to: [userEmail],
    subject: "[Ice Nexus] Sua conta foi aprovada! ✓",
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#1a1a1a">
        <div style="background:#7c3aed;padding:24px 32px;border-radius:12px 12px 0 0">
          <h1 style="color:white;margin:0;font-size:20px">Ice Nexus</h1>
        </div>
        <div style="background:#f9fafb;padding:32px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px">
          <div style="text-align:center;margin-bottom:24px">
            <div style="width:56px;height:56px;background:#dcfce7;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:28px">✓</div>
          </div>
          <h2 style="margin:0 0 12px;font-size:20px;text-align:center">Conta aprovada, ${userName.split(" ")[0]}!</h2>
          <p style="color:#6b7280;text-align:center;margin:0 0 28px">Seu acesso ao Ice Nexus foi liberado. Você já pode entrar no sistema.</p>
          <div style="text-align:center">
            <a href="${APP_URL}/login" style="background:#7c3aed;color:white;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;display:inline-block">
              Acessar o sistema →
            </a>
          </div>
          <p style="color:#9ca3af;font-size:12px;margin-top:32px;text-align:center">Ice Nexus · Sistema de Gestão de Manutenção</p>
        </div>
      </div>
    `,
  });
}
