"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
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

type SignupFormValues = {
	name: string;
	email: string;
	password: string;
	confirmPassword: string;
};

export default function SignupPage() {
	const router = useRouter();

	const form = useForm<SignupFormValues>({
		defaultValues: {
			name: "",
			email: "",
			password: "",
			confirmPassword: "",
		},
	});

	const onSubmit = (data: SignupFormValues) => {
		authClient.signUp
			.email({
				email: data.email,
				password: data.password,
				name: data.name,
				callbackURL: "/dashboard",
			})
			.then((result) => {
				if (result.error) {
					toast.error(result.error.message || "Failed to create account");
				} else {
					toast.success("Account created successfully!");
					router.push("/dashboard");
					router.refresh();
				}
			})
			.catch((error) => {
				console.error("Sign up error:", error);
				toast.error("An unexpected error occurred");
			});
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle>Create an account</CardTitle>
				<CardDescription>Enter your details to get started</CardDescription>
			</CardHeader>
			<Form {...form}>
				<form onSubmit={form.handleSubmit(onSubmit)}>
					<CardContent className="space-y-4">
						<FormField
							control={form.control}
							name="name"
							rules={{ required: "Name is required" }}
							render={({ field }) => (
								<FormItem>
									<FormLabel>Name</FormLabel>
									<FormControl>
										<Input
											type="text"
											placeholder="John Doe"
											autoComplete="name"
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
							rules={{
								required: "Password is required",
								minLength: {
									value: 8,
									message: "Password must be at least 8 characters",
								},
							}}
							render={({ field }) => (
								<FormItem>
									<FormLabel>Password</FormLabel>
									<FormControl>
										<Input
											type="password"
											autoComplete="new-password"
											disabled={form.formState.isSubmitting}
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
							control={form.control}
							name="confirmPassword"
							rules={{
								required: "Please confirm your password",
								validate: (value) =>
									value === form.getValues("password") ||
									"Passwords do not match",
							}}
							render={({ field }) => (
								<FormItem>
									<FormLabel>Confirm Password</FormLabel>
									<FormControl>
										<Input
											type="password"
											autoComplete="new-password"
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
							{form.formState.isSubmitting
								? "Creating account..."
								: "Create account"}
						</Button>
						<p className="text-center text-muted-foreground text-sm">
							Already have an account?{" "}
							<Link
								href="/login"
								className="font-medium text-primary underline-offset-4 hover:underline"
							>
								Sign in
							</Link>
						</p>
					</CardFooter>
				</form>
			</Form>
		</Card>
	);
}
