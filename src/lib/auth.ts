import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { Resend } from "resend";
import * as schema from "~/drizzle/schema";
import { env } from "~/env";
import { db } from "~/server/db";

const resend = new Resend(env.RESEND_API_KEY);

export const auth = betterAuth({
	database: drizzleAdapter(db, {
		provider: "pg",
		schema,
	}),
	emailAndPassword: {
		enabled: true,
		minPasswordLength: 8,
		maxPasswordLength: 128,
		requireEmailVerification: false, // Set to true when email is configured
		sendResetPassword: async ({ user, url }) => {
			try {
				await resend.emails.send({
					from: "onboarding@resend.dev", // Resend's default testing domain
					to: user.email,
					subject: "Reset Your Password",
					html: `
						<!DOCTYPE html>
						<html>
							<head>
								<meta charset="utf-8">
								<meta name="viewport" content="width=device-width, initial-scale=1.0">
							</head>
							<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
								<div style="background: linear-gradient(to right, #4f46e5, #7c3aed); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
									<h1 style="color: white; margin: 0; font-size: 28px;">Password Reset Request</h1>
								</div>
								<div style="background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb;">
									<p style="font-size: 16px; margin-bottom: 20px;">Hi ${user.name || "there"},</p>
									<p style="font-size: 16px; margin-bottom: 20px;">We received a request to reset your password. Click the button below to create a new password:</p>
									<div style="text-align: center; margin: 30px 0;">
										<a href="${url}" style="background: #4f46e5; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block; font-size: 16px;">Reset Password</a>
									</div>
									<p style="font-size: 14px; color: #6b7280; margin-top: 20px;">Or copy and paste this link into your browser:</p>
									<p style="font-size: 14px; color: #4f46e5; word-break: break-all; background: white; padding: 12px; border-radius: 4px; border: 1px solid #e5e7eb;">${url}</p>
									<p style="font-size: 14px; color: #6b7280; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">If you didn't request this password reset, you can safely ignore this email. Your password will remain unchanged.</p>
									<p style="font-size: 14px; color: #6b7280; margin-top: 10px;">This link will expire in 1 hour for security reasons.</p>
								</div>
								<div style="text-align: center; margin-top: 20px; color: #9ca3af; font-size: 12px;">
									<p>&copy; ${new Date().getFullYear()} AI Game Leaderboard. All rights reserved.</p>
								</div>
							</body>
						</html>
					`,
				});
				console.log(`Password reset email sent to ${user.email}`);
			} catch (error) {
				console.error("Failed to send password reset email:", error);
				throw new Error("Failed to send password reset email");
			}
		},
		onPasswordReset: async ({ user }) => {
			console.log(`Password successfully reset for user: ${user.email}`);
			// You can add additional logic here, such as:
			// - Logging the password reset event
			// - Sending a confirmation email
			// - Revoking other sessions
			// - Notifying security team for suspicious activity
		},
	},
	secret: env.BETTER_AUTH_SECRET,
	baseURL: env.BETTER_AUTH_URL || "http://localhost:3000",
	session: {
		expiresIn: 60 * 60 * 24 * 7, // 7 days
		updateAge: 60 * 60 * 24, // 1 day (session will be updated if it's older than this)
		cookieCache: {
			enabled: true,
			maxAge: 60 * 60 * 2, // 2 hours
		},
	},
	advanced: {
		cookiePrefix: "better-auth",
		useSecureCookies: env.NODE_ENV === "production",
		database: {
			generateId: false, // Let the database generate UUIDs automatically
		},
	},
});

export type Session = typeof auth.$Infer.Session.session;
export type User = typeof auth.$Infer.Session.user;
