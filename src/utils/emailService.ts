import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
}

const defaultFrom = process.env.EMAIL_FROM || 'no-reply@easytomanage.xyz';
const sesRegion = process.env.AWS_REGION || 'ap-south-1';

const sesClient = new SESClient({ region: sesRegion });

export async function sendEmail(options: SendEmailOptions): Promise<void> {
  const { to, subject, html, text, from = defaultFrom } = options;

  try {
    const params = new SendEmailCommand({
      Destination: { ToAddresses: [to] },
      Message: {
        Body: {
          Html: { Charset: 'UTF-8', Data: html },
          Text: text ? { Charset: 'UTF-8', Data: text } : undefined,
        },
        Subject: { Charset: 'UTF-8', Data: subject },
      },
      Source: from,
    });

    await sesClient.send(params);
    console.info('[sendEmail] Email sent', { to, subject });
  } catch (error: any) {
    console.error('[sendEmail] Failed to send email', {
      to,
      subject,
      message: error?.message,
    });
    throw new Error('Failed to send email');
  }
}
