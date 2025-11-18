"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "~/components/ui/card";
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { authClient } from "~/lib/auth-client";

type RequestResetFormValues = {
	email: string;
};

type ResetPasswordFormValues = {
	password: string;
	confirmPassword: string;
};

export default function ResetPasswordPage() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const token = searchParams.get("token");

	const [emailSent, setEmailSent] = useState(false);
	const [submittedEmail, setSubmittedEmail] = useState("");

	const requestForm = useForm<RequestResetFormValues>({
		defaultValues: {
			email: "",
		},
	});

	const resetForm = useForm<ResetPasswordFormValues>({
		defaultValues: {
			password: "",
			confirmPassword: "",
		},
	});

	const onRequestSubmit = (data: RequestResetFormValues) => {
		authClient
			.forgetPassword({
				email: data.email,
				redirectTo: "/reset-password",
			})
			.then(() => {
				setSubmittedEmail(data.email);
				setEmailSent(true);
				toast.success("Password reset email sent! Check your inbox.");
			})
			.catch((error) => {
				console.error("Forgot password error:", error);
				toast.error("Failed to send reset email. Please try again.");
			});
	};

	const onResetSubmit = (data: ResetPasswordFormValues) => {
		authClient
			.resetPassword({
				newPassword: data.password,
			})
			.then(() => {
				toast.success("Password reset successfully!");
				router.push("/login");
			})
			.catch((error) => {
				console.error("Reset password error:", error);
				toast.error("Failed to reset password. The link may have expired.");
			});
	};

	// If we have a token, show the password reset form
	if (token) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>Set new password</CardTitle>
					<CardDescription>Enter your new password below</CardDescription>
				</CardHeader>
				<Form {...resetForm}>
					<form onSubmit={resetForm.handleSubmit(onResetSubmit)}>
						<CardContent className="space-y-4">
							<FormField
								control={resetForm.control}
								name="password"
								rules={{
									required: "Password is required",
									minLength: {
										value: 8,
										message: "Password must be at least 8 characters",
									},
								}}
								render={({ field }) => (
									<FormItem>
										<FormLabel>New Password</FormLabel>
										<FormControl>
											<Input
												type="password"
												autoComplete="new-password"
												disabled={resetForm.formState.isSubmitting}
												{...field}
											/>
										</FormControl>
										<FormDescription>
											Must be at least 8 characters
										</FormDescription>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={resetForm.control}
								name="confirmPassword"
								rules={{
									required: "Please confirm your password",
									validate: (value) =>
										value === resetForm.getValues("password") ||
										"Passwords do not match",
								}}
								render={({ field }) => (
									<FormItem>
										<FormLabel>Confirm New Password</FormLabel>
										<FormControl>
											<Input
												type="password"
												autoComplete="new-password"
												disabled={resetForm.formState.isSubmitting}
												{...field}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</CardContent>
						<CardFooter className="flex flex-col space-y-4">
							<Button
								type="submit"
								className="w-full"
								disabled={resetForm.formState.isSubmitting}
							>
								{resetForm.formState.isSubmitting
									? "Resetting password..."
									: "Reset password"}
							</Button>
							<Link
								href="/login"
								className="text-center text-muted-foreground text-sm hover:text-primary hover:underline"
							>
								Back to sign in
							</Link>
						</CardFooter>
					</form>
				</Form>
			</Card>
		);
	}

	// Show email sent confirmation
	if (emailSent) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>Check your email</CardTitle>
					<CardDescription>
						We've sent a password reset link to your email address
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-950">
						<p className="text-green-800 text-sm dark:text-green-200">
							If an account exists for <strong>{submittedEmail}</strong>, you
							will receive a password reset email shortly.
						</p>
					</div>
					<p className="text-muted-foreground text-sm">
						The link will expire in 1 hour. If you don't see the email, check
						your spam folder.
					</p>
				</CardContent>
				<CardFooter className="flex flex-col space-y-4">
					<Button asChild variant="outline" className="w-full">
						<Link href="/login">Back to sign in</Link>
					</Button>
					<Button
						type="button"
						variant="ghost"
						onClick={() => {
							setEmailSent(false);
							requestForm.reset();
						}}
						className="text-muted-foreground text-sm"
					>
						Try a different email
					</Button>
				</CardFooter>
			</Card>
		);
	}

	// Show initial email request form
	return (
		<Card>
			<CardHeader>
				<CardTitle>Reset your password</CardTitle>
				<CardDescription>
					Enter your email address and we'll send you a link to reset your
					password
				</CardDescription>
			</CardHeader>
			<Form {...requestForm}>
				<form onSubmit={requestForm.handleSubmit(onRequestSubmit)}>
					<CardContent>
						<FormField
							control={requestForm.control}
							name="email"
							rules={{
								required: "Email is required",
								pattern: {
									value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
									message: "Invalid email address",
								},
							}}
							render={({ field }) => (
								<FormItem>
									<FormLabel>Email</FormLabel>
									<FormControl>
										<Input
											type="email"
											autoComplete="email"
											disabled={requestForm.formState.isSubmitting}
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
					</CardContent>
					<CardFooter className="flex flex-col space-y-4">
						<Button
							type="submit"
							className="w-full"
							disabled={requestForm.formState.isSubmitting}
						>
							{requestForm.formState.isSubmitting
								? "Sending..."
								: "Send reset link"}
						</Button>
						<Link
							href="/login"
							className="text-center text-muted-foreground text-sm hover:text-primary hover:underline"
						>
							Back to sign in
						</Link>
					</CardFooter>
				</form>
			</Form>
		</Card>
	);
}
