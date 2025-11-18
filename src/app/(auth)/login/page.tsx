"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
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
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { authClient } from "~/lib/auth-client";

type LoginFormValues = {
	email: string;
	password: string;
};

export default function LoginPage() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

	const form = useForm<LoginFormValues>({
		defaultValues: {
			email: "",
			password: "",
		},
	});

	const onSubmit = (data: LoginFormValues) => {
		authClient.signIn
			.email({
				email: data.email,
				password: data.password,
				callbackURL: callbackUrl,
			})
			.then((result) => {
				if (result.error) {
					toast.error(result.error.message || "Failed to sign in");
				} else {
					toast.success("Signed in successfully!");
					router.push(callbackUrl);
					router.refresh();
				}
			})
			.catch((error) => {
				console.error("Sign in error:", error);
				toast.error("An unexpected error occurred");
			});
	};

	return (
		<Card>
			<CardHeader className="py-4">
				<CardTitle>Welcome back</CardTitle>
				<CardDescription>Sign in to your account to continue</CardDescription>
			</CardHeader>
			<Form {...form}>
				<form onSubmit={form.handleSubmit(onSubmit)}>
					<CardContent className="space-y-4">
						<FormField
							control={form.control}
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
											disabled={form.formState.isSubmitting}
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="password"
							rules={{ required: "Password is required" }}
							render={({ field }) => (
								<FormItem>
									<div className="flex items-center justify-between">
										<FormLabel>Password</FormLabel>
										<Link
											href="/reset-password"
											className="text-muted-foreground text-sm hover:text-primary hover:underline"
										>
											Forgot password?
										</Link>
									</div>
									<FormControl>
										<Input
											type="password"
											autoComplete="current-password"
											disabled={form.formState.isSubmitting}
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
							disabled={form.formState.isSubmitting}
						>
							{form.formState.isSubmitting ? "Signing in..." : "Sign in"}
						</Button>
						<p className="py-4 text-center text-muted-foreground text-sm">
							Don't have an account?{" "}
							<Link
								href="/signup"
								className="font-medium text-primary underline-offset-4 hover:underline"
							>
								Sign up
							</Link>
						</p>
					</CardFooter>
				</form>
			</Form>
		</Card>
	);
}
