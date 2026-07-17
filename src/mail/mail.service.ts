import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { Resend } from 'resend';
import * as dns from 'dns';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter | null = null;
  private resend: Resend | null = null;

  constructor() {
    if (process.env.MAIL_USER && process.env.MAIL_PASS) {
      this.logger.log('Inicializando servicio de correo con Gmail SMTP (Nodemailer)');
    } else if (process.env.RESEND_API_KEY) {
      this.logger.log('Inicializando servicio de correo con Resend (API HTTP)');
      this.resend = new Resend(process.env.RESEND_API_KEY);
    } else {
      this.logger.warn('⚠️ No se ha configurado ninguna credencial de correo (MAIL_USER/MAIL_PASS o RESEND_API_KEY)');
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
      // Forzar resolución DNS de smtp.gmail.com a IPv4 para evitar ENETUNREACH en Railway
      const ips = await dns.promises.resolve4('smtp.gmail.com');
      if (ips && ips.length > 0) {
        host = ips[0];
        this.logger.log(`[MailService] Host smtp.gmail.com resuelto dinámicamente a la IP IPv4: ${host}`);
      }
    } catch (dnsErr) {
      this.logger.warn(`[MailService] Error al resolver smtp.gmail.com a IPv4: ${dnsErr.message}. Se usará hostname por defecto.`);
    }

    this.transporter = nodemailer.createTransport({
      host: host,
      port: 587,
      secure: false,
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
      tls: {
        rejectUnauthorized: false,
        servername: 'smtp.gmail.com', // Crucial para la validación SSL/TLS
      },
    } as any);

    return this.transporter;
  }

  async sendBoxCode(toEmail: string, userName: string, code: string): Promise<void> {
    const subject = '🌱 Tu código de acceso GreenBox';
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
              <h1>🌱 GreenBox</h1>
              <p>Cultivo inteligente a tu alcance</p>
            </div>
            <div class="body">
              <div class="greeting">¡Bienvenido/a, ${userName}! 👋</div>
              <p class="text">
                Gracias por registrarte en GreenBox. A continuación encontrarás
                tu <strong>código de acceso personal</strong> para vincular tu
                dispositivo y comenzar a monitorear tu cultivo.
              </p>
              <div class="code-box">
                <div class="code">${code}</div>
                <div class="code-label">Código de acceso de tu GreenBox</div>
              </div>
              <p class="text">
                Ingresa este código en la pantalla de acceso de la aplicación
                para vincular tu dispositivo. Una vez vinculado, podrás ver
                los datos de tus sensores en tiempo real.
              </p>
              <div class="warning">
                ⚠️ <strong>Este código es personal e intransferible.</strong>
                No lo compartas con nadie — solo puede vincularse a una cuenta.
              </div>
            </div>
            <div class="footer">
              © ${new Date().getFullYear()} GreenBox · Si no creaste esta cuenta, ignora este correo.
            </div>
          </div>
        </body>
        </html>
      `;

    if (this.resend) {
      try {
        await this.resend.emails.send({
          from: 'GreenBox <onboarding@resend.dev>',
          to: toEmail,
          subject,
          html,
        });
        this.logger.log(`✅ Correo enviado a ${toEmail} con código ${code} usando Resend`);
      } catch (error) {
        this.logger.error(`❌ Error enviando correo a ${toEmail} con Resend: ${error.message}`);
        throw error;
      }
    } else {
      const transporter = await this.getTransporter();
      if (transporter) {
        const mailOptions = {
          from: `"GreenBox 🌱" <${process.env.MAIL_USER}>`,
          to: toEmail,
          subject,
          html,
        };
        try {
          await transporter.sendMail(mailOptions);
          this.logger.log(`✅ Correo enviado a ${toEmail} con código ${code} usando Gmail SMTP`);
        } catch (error) {
          this.logger.error(`❌ Error enviando correo a ${toEmail} con Gmail SMTP: ${error.message}`);
          throw error;
        }
      } else {
        this.logger.warn('⚠️ No se ha inicializado ningún servicio de correo válido.');
      }
    }
  }
}
