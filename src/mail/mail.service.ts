import { Injectable, Logger } from '@nestjs/common';
import * as dns from 'dns';
import * as nodemailer from 'nodemailer';
import { Resend } from 'resend';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly resendFromEmail =
    process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
  private transporter: nodemailer.Transporter | null = null;
  private resend: Resend | null = null;

  constructor() {
    if (process.env.APPS_SCRIPT_URL) {
      this.logger.log(
        'Inicializando servicio de correo con Google Apps Script HTTP API',
      );
    } else if (process.env.BREVO_API_KEY) {
      this.logger.log('Inicializando servicio de correo con Brevo HTTP API');
    } else if (process.env.MAIL_USER && process.env.MAIL_PASS) {
      this.logger.log('Inicializando servicio de correo con Gmail SMTP');
    } else if (process.env.RESEND_API_KEY) {
      this.logger.log('Inicializando servicio de correo con Resend');
      this.resend = new Resend(process.env.RESEND_API_KEY);
    } else {
      this.logger.warn(
        'No se ha configurado ninguna credencial de correo valida.',
      );
    }
  }

  private async getTransporter(): Promise<nodemailer.Transporter | null> {
    if (this.transporter) {
      return this.transporter;
    }

    if (!process.env.MAIL_USER || !process.env.MAIL_PASS) {
      return null;
    }

    let host = 'smtp.gmail.com';
    try {
      const ips = await dns.promises.resolve4('smtp.gmail.com');
      if (ips.length > 0) {
        host = ips[0];
        this.logger.log(
          `[MailService] Host smtp.gmail.com resuelto a IPv4: ${host}`,
        );
      }
    } catch (dnsErr: any) {
      this.logger.warn(
        `[MailService] No se pudo resolver smtp.gmail.com a IPv4: ${dnsErr.message}`,
      );
    }

    this.transporter = nodemailer.createTransport({
      host,
      port: 587,
      secure: false,
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
      tls: {
        rejectUnauthorized: false,
        servername: 'smtp.gmail.com',
      },
    } as any);

    return this.transporter;
  }

  async sendBoxCode(
    toEmail: string,
    userName: string,
    code: string,
  ): Promise<void> {
    const subject = 'Tu codigo de acceso GreenBox';
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; background: #f4f9f4; margin: 0; padding: 0; }
          .container { max-width: 520px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.10); }
          .header { background: linear-gradient(135deg, #2d7a3a, #4caf6e); padding: 36px 32px 24px; text-align: center; }
          .header h1 { color: #fff; margin: 0; font-size: 26px; letter-spacing: 1px; }
          .header p { color: #c8f5d5; margin: 6px 0 0; font-size: 14px; }
          .body { padding: 32px; }
          .greeting { color: #2d7a3a; font-size: 18px; font-weight: 600; margin-bottom: 12px; }
          .text { color: #444; font-size: 15px; line-height: 1.6; margin-bottom: 24px; }
          .code-box { background: #f0faf2; border: 2px dashed #4caf6e; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0; }
          .code { font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #2d7a3a; font-family: monospace; }
          .code-label { color: #888; font-size: 12px; margin-top: 6px; }
          .warning { background: #fffbea; border-left: 4px solid #f5a623; border-radius: 6px; padding: 12px 16px; color: #7a5c00; font-size: 13px; margin-top: 20px; }
          .footer { background: #f4f9f4; padding: 20px 32px; text-align: center; color: #aaa; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>GreenBox</h1>
            <p>Cultivo inteligente a tu alcance</p>
          </div>
          <div class="body">
            <div class="greeting">Bienvenido/a, ${userName}</div>
            <p class="text">
              Gracias por registrarte en GreenBox. Aqui encontraras tu
              <strong>codigo de acceso personal</strong> para vincular tu
              dispositivo y comenzar a monitorear tu cultivo.
            </p>
            <div class="code-box">
              <div class="code">${code}</div>
              <div class="code-label">Codigo de acceso de tu GreenBox</div>
            </div>
            <p class="text">
              Ingresa este codigo en la pantalla de acceso de la aplicacion
              para vincular tu dispositivo. Una vez vinculado, podras ver
              los datos de tus sensores en tiempo real.
            </p>
            <div class="warning">
              <strong>Este codigo es personal e intransferible.</strong>
              No lo compartas con nadie.
            </div>
          </div>
          <div class="footer">
            &copy; ${new Date().getFullYear()} GreenBox. Si no creaste esta cuenta, ignora este correo.
          </div>
        </div>
      </body>
      </html>
    `;

    if (process.env.APPS_SCRIPT_URL) {
      const response = await fetch(process.env.APPS_SCRIPT_URL, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          token: 'greenbox-secure-token-12345',
          to: toEmail,
          subject,
          html,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(
          `HTTP ${response.status}: ${response.statusText} - ${errText}`,
        );
      }

      const resData: any = await response.json();
      if (resData?.error) {
        throw new Error(resData.error);
      }

      this.logger.log(
        `Correo enviado a ${toEmail} con codigo ${code} usando Google Apps Script`,
      );
      return;
    }

    if (process.env.BREVO_API_KEY) {
      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          accept: 'application/json',
          'api-key': process.env.BREVO_API_KEY,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          sender: {
            name: 'GreenBox',
            email: process.env.MAIL_USER || 'no-reply@greenbox.local',
          },
          to: [{ email: toEmail }],
          subject,
          htmlContent: html,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(
          `HTTP ${response.status}: ${response.statusText} - ${errText}`,
        );
      }

      this.logger.log(
        `Correo enviado a ${toEmail} con codigo ${code} usando Brevo HTTP API`,
      );
      return;
    }

    if (this.resend) {
      const response = await this.resend.emails.send({
        from: `GreenBox <${this.resendFromEmail}>`,
        to: toEmail,
        subject,
        html,
      });

      if (response.error) {
        throw new Error(
          response.error.message || 'Resend no pudo enviar el correo',
        );
      }

      this.logger.log(
        `Correo enviado a ${toEmail} con codigo ${code} usando Resend`,
      );
      return;
    }

    const transporter = await this.getTransporter();
    if (transporter) {
      await transporter.sendMail({
        from: `"GreenBox" <${process.env.MAIL_USER}>`,
        to: toEmail,
        subject,
        html,
      });

      this.logger.log(
        `Correo enviado a ${toEmail} con codigo ${code} usando Gmail SMTP`,
      );
      return;
    }

    throw new Error(
      'No se ha inicializado ningun servicio de correo valido en el backend.',
    );
  }
}
