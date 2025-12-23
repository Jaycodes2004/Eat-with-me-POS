import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import type { Request, Response } from 'express';
import { getPrismClientForRestaurant } from '../lib/getPrismClientForRestaurant';
import { loadTenantDbCredentials } from '../utils/awsSecrets';
import { sendEmail } from '../utils/emailService';

const MASKED_SUCCESS_MESSAGE =
  'If this email and Restaurant ID match, you will receive a reset link shortly.';

function buildTenantPrisma(restaurantId: string) {
  return loadTenantDbCredentials().then(({ dbHost, dbPort, dbUser, dbPassword }) =>
    getPrismClientForRestaurant(
      restaurantId,
      dbHost,
      dbPort,
      dbUser,
      dbPassword,
      `tenant_${restaurantId}`
    )
  );
}

export async function requestPasswordReset(req: Request, res: Response) {
  const { email, restaurantId } = req.body as {
    email?: string;
    restaurantId?: string;
  };

  if (!email || !email.includes('@')) {
    return res.status(400).json({ success: false, message: 'Valid email is required' });
  }

  if (!restaurantId || restaurantId.trim() === '') {
    return res.status(400).json({ success: false, message: 'Restaurant ID is required' });
  }

  const trimmedEmail = email.trim().toLowerCase();
  const trimmedRestaurantId = restaurantId.trim();

  try {
    // Cast to any to allow accessing PasswordResetToken even if the generated Prisma types are out of date
    const prisma = (await buildTenantPrisma(trimmedRestaurantId)) as any;

    const staff = await prisma.staff.findUnique({ where: { email: trimmedEmail } });

    if (!staff) {
      console.warn('[requestPasswordReset] Staff not found, returning masked success', {
        email: trimmedEmail,
        restaurantId: trimmedRestaurantId,
      });

      return res.json({ success: true, message: MASKED_SUCCESS_MESSAGE });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 20 * 60 * 1000);

    await prisma.passwordResetToken.create({
      data: {
        email: trimmedEmail,
        restaurantId: trimmedRestaurantId,
        token,
        expiresAt,
      },
    });

    const baseUrl = process.env.FRONTEND_BASE_URL || 'https://pos.easytomanage.xyz';
    const resetUrl = `${baseUrl}/reset-password?token=${token}&email=${encodeURIComponent(
      trimmedEmail
    )}&restaurantId=${encodeURIComponent(trimmedRestaurantId)}`;

    const subject = 'Reset your Eat with Me POS Password';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Password Reset Request</h2>
        <p>Hello,</p>
        <p>We received a request to reset the password for your Eat with Me POS account.</p>
        <p style="color: #666;">
          <strong>Email:</strong> ${trimmedEmail}
        </p>
        <p>Click the link below to reset your password. This link is valid for 20 minutes.</p>
        <div style="margin: 30px 0; text-align: center;">
          <a href="${resetUrl}" style="background-color: #2c3e50; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; display: inline-block;">
            Reset Password
          </a>
        </div>
        <p style="color: #999; font-size: 12px;">
          Or copy this link in your browser:<br/>
          ${resetUrl}
        </p>
        <p style="color: #666; margin-top: 30px;">
          If you did not request this, you can safely ignore this email.
        </p>
        <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
        <p style="color: #999; font-size: 12px;">
          Eat with Me POS Team<br/>
          support@easytomanage.xyz
        </p>
      </div>
    `;

    const text = `Reset your password: ${resetUrl}\n\nThis link expires in 20 minutes.`;

    await sendEmail({ to: trimmedEmail, subject, html, text });

    console.info('[requestPasswordReset] Reset email sent', {
      email: trimmedEmail,
      restaurantId: trimmedRestaurantId,
    });

    return res.json({ success: true, message: MASKED_SUCCESS_MESSAGE });
  } catch (error: any) {
    console.error('[requestPasswordReset] Error', {
      email: trimmedEmail,
      restaurantId: trimmedRestaurantId,
      message: error?.message,
    });

    // Masked response to avoid email enumeration
    return res.json({ success: true, message: MASKED_SUCCESS_MESSAGE });
  }
}

export async function verifyAndResetPassword(req: Request, res: Response) {
  const { email, restaurantId, token, newPassword } = req.body as {
    email?: string;
    restaurantId?: string;
    token?: string;
    newPassword?: string;
  };

  if (!email || !email.includes('@')) {
    return res.status(400).json({ success: false, message: 'Valid email is required' });
  }

  if (!restaurantId || restaurantId.trim() === '') {
    return res.status(400).json({ success: false, message: 'Restaurant ID is required' });
  }

  if (!token || token.length < 10) {
    return res.status(400).json({ success: false, message: 'Invalid reset token' });
  }

  if (!newPassword || newPassword.length < 6) {
    return res
      .status(400)
      .json({ success: false, message: 'Password must be at least 6 characters long' });
  }

  const trimmedEmail = email.trim().toLowerCase();
  const trimmedRestaurantId = restaurantId.trim();

  try {
    const prisma = (await buildTenantPrisma(trimmedRestaurantId)) as any;

    const resetToken = await prisma.passwordResetToken.findUnique({ where: { token } });

    if (!resetToken) {
      return res.status(400).json({ success: false, message: 'Invalid reset token' });
    }

    if (resetToken.expiresAt < new Date()) {
      await prisma.passwordResetToken.delete({ where: { token } });
      return res
        .status(400)
        .json({ success: false, message: 'Reset token has expired. Please request a new one.' });
    }

    if (
      resetToken.email !== trimmedEmail ||
      resetToken.restaurantId !== trimmedRestaurantId
    ) {
      return res.status(400).json({ success: false, message: 'Invalid email or Restaurant ID' });
    }

    const staff = await prisma.staff.findUnique({ where: { email: trimmedEmail } });

    if (!staff) {
      return res.status(404).json({ success: false, message: 'User account not found' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.staff.update({
      where: { email: trimmedEmail },
      data: { password: hashedPassword },
    });

    await prisma.passwordResetToken.delete({ where: { token } });

    const subject = 'Your Eat with Me POS Password Has Been Reset';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Password Reset Successful</h2>
        <p>Hello,</p>
        <p>Your password for Eat with Me POS has been successfully reset.</p>
        <p style="color: #666;">
          <strong>Email:</strong> ${trimmedEmail}
        </p>
        <p style="color: #333; margin-top: 30px;">
          You can now log in with your new password.
        </p>
        <p style="color: #999; font-size: 12px; margin-top: 30px;">
          If you did not make this change, please contact support immediately at support@easytomanage.xyz
        </p>
        <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
        <p style="color: #999; font-size: 12px;">
          Eat with Me POS Team<br/>
          support@easytomanage.xyz
        </p>
      </div>
    `;

    await sendEmail({ to: trimmedEmail, subject, html });

    console.info('[verifyAndResetPassword] Password reset complete', {
      email: trimmedEmail,
      restaurantId: trimmedRestaurantId,
    });

    return res.json({
      success: true,
      message: 'Password has been reset successfully. You can now log in.',
    });
  } catch (error: any) {
    console.error('[verifyAndResetPassword] Error', {
      email: trimmedEmail,
      restaurantId: trimmedRestaurantId,
      message: error?.message,
    });

    return res.status(500).json({
      success: false,
      message: 'Failed to reset password. Please try again later.',
    });
  }
}
