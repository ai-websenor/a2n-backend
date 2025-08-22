import { AuthError } from '../types/auth.types';

// Email service interface
export interface EmailServiceInterface {
  sendVerificationEmail(email: string, token: string, name?: string): Promise<void>;
  sendPasswordResetEmail(email: string, token: string, name?: string): Promise<void>;
  sendWelcomeEmail(email: string, name: string): Promise<void>;
  sendTwoFactorEmail(email: string, code: string, name?: string): Promise<void>;
  sendLoginNotificationEmail(email: string, metadata: { ipAddress?: string; userAgent?: string; timestamp: Date }, name?: string): Promise<void>;
  sendAccountDeactivationEmail(email: string, name?: string): Promise<void>;
  sendPasswordChangedEmail(email: string, name?: string): Promise<void>;
  sendBackupCodesEmail(email: string, backupCodes: string[], name?: string): Promise<void>;
}

// Email template types
interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

export class EmailService implements EmailServiceInterface {
  private readonly fromEmail: string;
  private readonly baseUrl: string;
  private readonly appName: string;

  constructor() {
    this.fromEmail = process.env.FROM_EMAIL || 'noreply@a2n.app';
    this.baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    this.appName = process.env.APP_NAME || 'A2N Workflow Automation';
  }

  /**
   * Send email verification email
   */
  async sendVerificationEmail(email: string, token: string, name?: string): Promise<void> {
    const verificationUrl = `${this.baseUrl}/auth/verify-email?token=${token}`;
    const displayName = name || email.split('@')[0];

    const template = this.getVerificationEmailTemplate(displayName, verificationUrl);
    
    await this.sendEmail(email, template);
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(email: string, token: string, name?: string): Promise<void> {
    const resetUrl = `${this.baseUrl}/auth/reset-password?token=${token}`;
    const displayName = name || email.split('@')[0];

    const template = this.getPasswordResetEmailTemplate(displayName, resetUrl);
    
    await this.sendEmail(email, template);
  }

  /**
   * Send welcome email
   */
  async sendWelcomeEmail(email: string, name: string): Promise<void> {
    const dashboardUrl = `${this.baseUrl}/dashboard`;
    const template = this.getWelcomeEmailTemplate(name, dashboardUrl);
    
    await this.sendEmail(email, template);
  }

  /**
   * Send two-factor authentication code email
   */
  async sendTwoFactorEmail(email: string, code: string, name?: string): Promise<void> {
    const displayName = name || email.split('@')[0];
    const template = this.getTwoFactorEmailTemplate(displayName, code);
    
    await this.sendEmail(email, template);
  }

  /**
   * Send login notification email
   */
  async sendLoginNotificationEmail(
    email: string, 
    metadata: { ipAddress?: string; userAgent?: string; timestamp: Date }, 
    name?: string
  ): Promise<void> {
    const displayName = name || email.split('@')[0];
    const template = this.getLoginNotificationEmailTemplate(displayName, metadata);
    
    await this.sendEmail(email, template);
  }

  /**
   * Send account deactivation email
   */
  async sendAccountDeactivationEmail(email: string, name?: string): Promise<void> {
    const displayName = name || email.split('@')[0];
    const supportUrl = `${this.baseUrl}/support`;
    const template = this.getAccountDeactivationEmailTemplate(displayName, supportUrl);
    
    await this.sendEmail(email, template);
  }

  /**
   * Send password changed notification email
   */
  async sendPasswordChangedEmail(email: string, name?: string): Promise<void> {
    const displayName = name || email.split('@')[0];
    const supportUrl = `${this.baseUrl}/support`;
    const template = this.getPasswordChangedEmailTemplate(displayName, supportUrl);
    
    await this.sendEmail(email, template);
  }

  /**
   * Send backup codes email
   */
  async sendBackupCodesEmail(email: string, backupCodes: string[], name?: string): Promise<void> {
    const displayName = name || email.split('@')[0];
    const template = this.getBackupCodesEmailTemplate(displayName, backupCodes);
    
    await this.sendEmail(email, template);
  }

  /**
   * Send email using the configured email provider
   * In production, this would integrate with services like SendGrid, AWS SES, etc.
   */
  private async sendEmail(to: string, template: EmailTemplate): Promise<void> {
    try {
      // For development, we'll just log the email
      if (process.env.NODE_ENV === 'development') {
        console.log('📧 Email would be sent to:', to);
        console.log('📧 Subject:', template.subject);
        console.log('📧 HTML Content:');
        console.log(template.html);
        console.log('📧 Text Content:');
        console.log(template.text);
        console.log('---');
        return;
      }

      // In production, implement actual email sending
      // Example with a hypothetical email service:
      /*
      await emailProvider.send({
        from: this.fromEmail,
        to,
        subject: template.subject,
        html: template.html,
        text: template.text,
      });
      */

      throw new AuthError('Email service not configured for production', 'EMAIL_SERVICE_ERROR', 500);
    } catch (error) {
      if (error instanceof AuthError) {
        throw error;
      }
      throw new AuthError('Failed to send email', 'EMAIL_SEND_ERROR', 500);
    }
  }

  // Email template methods

  private getVerificationEmailTemplate(name: string, verificationUrl: string): EmailTemplate {
    const subject = `Verify your email address - ${this.appName}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>${subject}</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: white; padding: 30px; border: 1px solid #dee2e6; }
            .footer { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; font-size: 14px; color: #6c757d; }
            .button { display: inline-block; padding: 12px 24px; background: #007bff; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0; }
            .button:hover { background: #0056b3; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${this.appName}</h1>
            </div>
            <div class="content">
              <h2>Welcome, ${name}!</h2>
              <p>Thank you for signing up for ${this.appName}. To complete your registration, please verify your email address by clicking the button below:</p>
              <div style="text-align: center;">
                <a href="${verificationUrl}" class="button">Verify Email Address</a>
              </div>
              <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
              <p><a href="${verificationUrl}">${verificationUrl}</a></p>
              <p>This verification link will expire in 24 hours for security reasons.</p>
              <p>If you didn't create an account, you can safely ignore this email.</p>
            </div>
            <div class="footer">
              <p>&copy; 2024 ${this.appName}. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const text = `
Welcome to ${this.appName}, ${name}!

Thank you for signing up. Please verify your email address by visiting this link:
${verificationUrl}

This verification link will expire in 24 hours for security reasons.

If you didn't create an account, you can safely ignore this email.

---
${this.appName}
    `;

    return { subject, html, text };
  }

  private getPasswordResetEmailTemplate(name: string, resetUrl: string): EmailTemplate {
    const subject = `Reset your password - ${this.appName}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>${subject}</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: white; padding: 30px; border: 1px solid #dee2e6; }
            .footer { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; font-size: 14px; color: #6c757d; }
            .button { display: inline-block; padding: 12px 24px; background: #dc3545; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0; }
            .button:hover { background: #c82333; }
            .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 4px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${this.appName}</h1>
            </div>
            <div class="content">
              <h2>Password Reset Request</h2>
              <p>Hello ${name},</p>
              <p>We received a request to reset your password for your ${this.appName} account. Click the button below to create a new password:</p>
              <div style="text-align: center;">
                <a href="${resetUrl}" class="button">Reset Password</a>
              </div>
              <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
              <p><a href="${resetUrl}">${resetUrl}</a></p>
              <div class="warning">
                <strong>Security Notice:</strong> This password reset link will expire in 1 hour for security reasons. If you didn't request this password reset, please ignore this email and your password will remain unchanged.
              </div>
            </div>
            <div class="footer">
              <p>&copy; 2024 ${this.appName}. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const text = `
Password Reset Request - ${this.appName}

Hello ${name},

We received a request to reset your password. Click this link to create a new password:
${resetUrl}

This password reset link will expire in 1 hour for security reasons.

If you didn't request this password reset, please ignore this email and your password will remain unchanged.

---
${this.appName}
    `;

    return { subject, html, text };
  }

  private getWelcomeEmailTemplate(name: string, dashboardUrl: string): EmailTemplate {
    const subject = `Welcome to ${this.appName}!`;
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>${subject}</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #28a745; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: white; padding: 30px; border: 1px solid #dee2e6; }
            .footer { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; font-size: 14px; color: #6c757d; }
            .button { display: inline-block; padding: 12px 24px; background: #28a745; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0; }
            .button:hover { background: #218838; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Welcome to ${this.appName}!</h1>
            </div>
            <div class="content">
              <h2>Hello ${name},</h2>
              <p>Congratulations! Your account has been successfully verified and you're now ready to start automating your workflows.</p>
              <p>Here's what you can do with ${this.appName}:</p>
              <ul>
                <li>Create and manage automated workflows</li>
                <li>Connect with various services and APIs</li>
                <li>Monitor workflow executions and performance</li>
                <li>Collaborate with your team</li>
              </ul>
              <div style="text-align: center;">
                <a href="${dashboardUrl}" class="button">Go to Dashboard</a>
              </div>
              <p>If you have any questions or need help getting started, don't hesitate to reach out to our support team.</p>
              <p>Happy automating!</p>
            </div>
            <div class="footer">
              <p>&copy; 2024 ${this.appName}. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const text = `
Welcome to ${this.appName}!

Hello ${name},

Congratulations! Your account has been successfully verified and you're now ready to start automating your workflows.

Visit your dashboard: ${dashboardUrl}

Here's what you can do with ${this.appName}:
- Create and manage automated workflows
- Connect with various services and APIs
- Monitor workflow executions and performance
- Collaborate with your team

If you have any questions or need help getting started, don't hesitate to reach out to our support team.

Happy automating!

---
${this.appName}
    `;

    return { subject, html, text };
  }

  private getTwoFactorEmailTemplate(name: string, code: string): EmailTemplate {
    const subject = `Your verification code - ${this.appName}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>${subject}</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: white; padding: 30px; border: 1px solid #dee2e6; text-align: center; }
            .footer { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; font-size: 14px; color: #6c757d; }
            .code { font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #007bff; margin: 20px 0; padding: 20px; background: #f8f9fa; border-radius: 8px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${this.appName}</h1>
            </div>
            <div class="content">
              <h2>Verification Code</h2>
              <p>Hello ${name},</p>
              <p>Your verification code is:</p>
              <div class="code">${code}</div>
              <p>This code will expire in 5 minutes for security reasons.</p>
              <p>If you didn't request this code, please ignore this email.</p>
            </div>
            <div class="footer">
              <p>&copy; 2024 ${this.appName}. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const text = `
Verification Code - ${this.appName}

Hello ${name},

Your verification code is: ${code}

This code will expire in 5 minutes for security reasons.

If you didn't request this code, please ignore this email.

---
${this.appName}
    `;

    return { subject, html, text };
  }

  private getLoginNotificationEmailTemplate(
    name: string, 
    metadata: { ipAddress?: string; userAgent?: string; timestamp: Date }
  ): EmailTemplate {
    const subject = `New login to your account - ${this.appName}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>${subject}</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: white; padding: 30px; border: 1px solid #dee2e6; }
            .footer { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; font-size: 14px; color: #6c757d; }
            .info { background: #d4edda; border: 1px solid #c3e6cb; padding: 15px; border-radius: 4px; margin: 20px 0; }
            .details { background: #f8f9fa; padding: 15px; border-radius: 4px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${this.appName}</h1>
            </div>
            <div class="content">
              <h2>New Login Detected</h2>
              <p>Hello ${name},</p>
              <div class="info">
                <strong>Your account was accessed successfully.</strong>
              </div>
              <p>We wanted to let you know that someone just signed in to your ${this.appName} account.</p>
              <div class="details">
                <h3>Login Details:</h3>
                <ul>
                  <li><strong>Time:</strong> ${metadata.timestamp.toLocaleString()}</li>
                  ${metadata.ipAddress ? `<li><strong>IP Address:</strong> ${metadata.ipAddress}</li>` : ''}
                  ${metadata.userAgent ? `<li><strong>Device/Browser:</strong> ${metadata.userAgent}</li>` : ''}
                </ul>
              </div>
              <p>If this was you, you can safely ignore this email. If you don't recognize this login, please secure your account immediately by changing your password.</p>
            </div>
            <div class="footer">
              <p>&copy; 2024 ${this.appName}. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const text = `
New Login Detected - ${this.appName}

Hello ${name},

Your account was accessed successfully.

Login Details:
- Time: ${metadata.timestamp.toLocaleString()}
${metadata.ipAddress ? `- IP Address: ${metadata.ipAddress}` : ''}
${metadata.userAgent ? `- Device/Browser: ${metadata.userAgent}` : ''}

If this was you, you can safely ignore this email. If you don't recognize this login, please secure your account immediately by changing your password.

---
${this.appName}
    `;

    return { subject, html, text };
  }

  private getAccountDeactivationEmailTemplate(name: string, supportUrl: string): EmailTemplate {
    const subject = `Account deactivated - ${this.appName}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>${subject}</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #dc3545; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: white; padding: 30px; border: 1px solid #dee2e6; }
            .footer { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; font-size: 14px; color: #6c757d; }
            .button { display: inline-block; padding: 12px 24px; background: #007bff; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${this.appName}</h1>
            </div>
            <div class="content">
              <h2>Account Deactivated</h2>
              <p>Hello ${name},</p>
              <p>Your ${this.appName} account has been deactivated. You will no longer be able to access your workflows and data.</p>
              <p>If you believe this was done in error or if you have any questions, please contact our support team.</p>
              <div style="text-align: center;">
                <a href="${supportUrl}" class="button">Contact Support</a>
              </div>
            </div>
            <div class="footer">
              <p>&copy; 2024 ${this.appName}. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const text = `
Account Deactivated - ${this.appName}

Hello ${name},

Your ${this.appName} account has been deactivated. You will no longer be able to access your workflows and data.

If you believe this was done in error or if you have any questions, please contact our support team: ${supportUrl}

---
${this.appName}
    `;

    return { subject, html, text };
  }

  private getPasswordChangedEmailTemplate(name: string, supportUrl: string): EmailTemplate {
    const subject = `Password changed - ${this.appName}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>${subject}</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #28a745; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: white; padding: 30px; border: 1px solid #dee2e6; }
            .footer { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; font-size: 14px; color: #6c757d; }
            .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 4px; margin: 20px 0; }
            .button { display: inline-block; padding: 12px 24px; background: #dc3545; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${this.appName}</h1>
            </div>
            <div class="content">
              <h2>Password Changed Successfully</h2>
              <p>Hello ${name},</p>
              <p>Your password for your ${this.appName} account has been successfully changed.</p>
              <div class="warning">
                <strong>Security Notice:</strong> If you did not make this change, your account may have been compromised. Please contact our support team immediately.
              </div>
              <div style="text-align: center;">
                <a href="${supportUrl}" class="button">Contact Support</a>
              </div>
            </div>
            <div class="footer">
              <p>&copy; 2024 ${this.appName}. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const text = `
Password Changed Successfully - ${this.appName}

Hello ${name},

Your password for your ${this.appName} account has been successfully changed.

Security Notice: If you did not make this change, your account may have been compromised. Please contact our support team immediately: ${supportUrl}

---
${this.appName}
    `;

    return { subject, html, text };
  }

  private getBackupCodesEmailTemplate(name: string, backupCodes: string[]): EmailTemplate {
    const subject = `Your backup codes - ${this.appName}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>${subject}</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: white; padding: 30px; border: 1px solid #dee2e6; }
            .footer { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; font-size: 14px; color: #6c757d; }
            .codes { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; font-family: monospace; }
            .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 4px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${this.appName}</h1>
            </div>
            <div class="content">
              <h2>Your Two-Factor Authentication Backup Codes</h2>
              <p>Hello ${name},</p>
              <p>You have enabled two-factor authentication for your account. Here are your backup codes:</p>
              <div class="codes">
                ${backupCodes.map(code => `<div>${code}</div>`).join('')}
              </div>
              <div class="warning">
                <strong>Important:</strong> Save these backup codes in a secure location. Each code can only be used once. If you lose access to your authenticator app, you can use these codes to regain access to your account.
              </div>
            </div>
            <div class="footer">
              <p>&copy; 2024 ${this.appName}. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const text = `
Your Two-Factor Authentication Backup Codes - ${this.appName}

Hello ${name},

You have enabled two-factor authentication for your account. Here are your backup codes:

${backupCodes.join('\n')}

Important: Save these backup codes in a secure location. Each code can only be used once. If you lose access to your authenticator app, you can use these codes to regain access to your account.

---
${this.appName}
    `;

    return { subject, html, text };
  }
}