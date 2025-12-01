"use client";

import { AlertCircle, CheckCircle2, Loader2, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "~/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "~/components/ui/dialog";
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
import type { ApiProvider } from "~/drizzle/schema";
import { getAllProviders, getProviderDisplayName } from "~/shared/models";
import { getTRPCErrorMessage } from "~/trpc/error";
import { api } from "~/trpc/react";

interface ApiCredential {
	id: string;
	provider: ApiProvider;
	apiKeyLast4: string;
	validatedAt: string | null;
	createdAt: string;
	updatedAt: string;
}

interface AddCredentialFormData {
	provider: ApiProvider;
	apiKey: string;
}

// Provider-agnostic configuration
const PROVIDERS = getAllProviders();

interface ProviderMetadata {
	url: string;
	placeholder: string;
	consoleName: string;
}

// Easy to extend with new providers
const PROVIDER_METADATA: Record<ApiProvider, ProviderMetadata> = {
	openai: {
		url: "https://platform.openai.com/api-keys",
		placeholder: "sk-...",
		consoleName: "OpenAI Platform",
	},
	anthropic: {
		url: "https://console.anthropic.com/",
		placeholder: "sk-ant-...",
		consoleName: "Anthropic Console",
	},
	mistral: {
		url: "https://console.mistral.ai/home?workspace_dialog=apiKeys",
		placeholder: "...",
		consoleName: "Mistral Console",
	},
};

export default function ApiKeysPage() {
	const [credentials, setCredentials] = useState<ApiCredential[]>([]);
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const [deleteProvider, setDeleteProvider] = useState<ApiProvider | null>(
		null,
	);

	// Calculate which providers don't have credentials yet
	const existingProviders = new Set(credentials.map((c) => c.provider));
	const availableProviders = PROVIDERS.filter((p) => !existingProviders.has(p));
	const hasAllProviders = availableProviders.length === 0;

	const form = useForm<AddCredentialFormData>({
		defaultValues: {
			provider: availableProviders[0] ?? PROVIDERS[0],
			apiKey: "",
		},
	});

	const listCredentials = api.ai.listCredentials.useQuery();

	const saveCredentialMutation = api.ai.saveCredential.useMutation({
		onSuccess: (_, variables) => {
			toast.success(
				`${getProviderDisplayName(variables.provider)} API key saved and validated successfully!`,
			);
			form.reset();
			setIsDialogOpen(false);
			listCredentials.refetch();
		},
		onError: (error) => {
			toast.error(getTRPCErrorMessage(error));
		},
	});

	const deleteCredentialMutation = api.ai.deleteCredential.useMutation({
		onSuccess: (_, variables) => {
			toast.success(
				`${getProviderDisplayName(variables.provider)} API key deleted successfully`,
			);
			setDeleteProvider(null);
			listCredentials.refetch();
		},
		onError: (error) => {
			toast.error(getTRPCErrorMessage(error));
		},
	});

	useEffect(() => {
		if (listCredentials.data) {
			setCredentials(
				listCredentials.data.map((cred) => ({
					...cred,
					provider: cred.provider as ApiProvider,
				})),
			);
		}
	}, [listCredentials.data]);

	// Update form default provider when available providers change
	useEffect(() => {
		if (availableProviders[0] !== undefined) {
			const currentProvider = form.getValues("provider");
			// If current provider is not available, reset to first available
			if (!availableProviders.includes(currentProvider)) {
				form.setValue("provider", availableProviders[0]);
			}
		}
	}, [availableProviders, form]);

	const formatDate = (dateString: string | null) =>
		!dateString
			? "Not validated"
			: new Date(dateString).toLocaleDateString("en-US", {
					year: "numeric",
					month: "short",
					day: "numeric",
					hour: "2-digit",
					minute: "2-digit",
				});

	return (
		<div className="space-y-8 p-8">
			<div>
				<h1 className="font-bold text-3xl tracking-tight">API Keys</h1>
			</div>
			<div className="grid gap-6">
				{credentials.length === 0 ? (
					<Card>
						<CardHeader>
							<CardTitle>No API Keys Configured</CardTitle>
							<CardDescription>
								Add your OpenAI, Anthropic, or Mistral API key to enable agents
								to play games
							</CardDescription>
						</CardHeader>
						<CardContent>
							<Button
								onClick={() => setIsDialogOpen(true)}
								disabled={hasAllProviders}
							>
								Add API Key
							</Button>
						</CardContent>
					</Card>
				) : (
					credentials.map((credential) => (
						<Card key={credential.id}>
							<CardHeader>
								<div className="flex items-center justify-between">
									<div>
										<CardTitle className="text-lg">
											{getProviderDisplayName(credential.provider)}
										</CardTitle>
										<CardDescription>
											Key ending in {credential.apiKeyLast4}
										</CardDescription>
									</div>
									<Button
										variant="ghost"
										size="sm"
										onClick={() => setDeleteProvider(credential.provider)}
										disabled={deleteCredentialMutation.isPending}
									>
										<Trash2 className="h-4 w-4" />
									</Button>
								</div>
							</CardHeader>
							<CardContent>
								<div className="space-y-2">
									<div className="flex items-center">
										{credential.validatedAt ? (
											<>
												<CheckCircle2 className="h-4 w-4 text-green-600" />
												<span className="text-muted-foreground text-sm">
													Last used: {formatDate(credential.validatedAt)}
												</span>
											</>
										) : (
											<>
												<AlertCircle className="h-4 w-4 text-yellow-600" />
												<span className="text-muted-foreground text-sm">
													Not validated
												</span>
											</>
										)}
									</div>
								</div>
							</CardContent>
						</Card>
					))
				)}
			</div>

			{credentials.length > 0 && !hasAllProviders && (
				<Button onClick={() => setIsDialogOpen(true)}>
					Add Another API Key
				</Button>
			)}

			{/* Add Key Dialog */}
			<Dialog
				open={isDialogOpen}
				onOpenChange={(open) => {
					setIsDialogOpen(open);
					if (open) {
						// Reset form with the first available provider when dialog opens
						form.reset({
							provider: availableProviders[0] ?? PROVIDERS[0],
							apiKey: "",
						});
					}
				}}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Add API Key</DialogTitle>
						<DialogDescription>
							Paste your API key from OpenAI, Anthropic, or Mistral. Your key
							will be encrypted and stored securely.
						</DialogDescription>
					</DialogHeader>

					<Form {...form}>
						<form
							onSubmit={form.handleSubmit((data) =>
								saveCredentialMutation.mutate(data),
							)}
							className="space-y-4"
						>
							<FormField
								control={form.control}
								name="provider"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Provider</FormLabel>
										<div className="mt-2 flex gap-3">
											{availableProviders.map((provider) => (
												<Button
													key={provider}
													type="button"
													variant={
														field.value === provider ? "default" : "outline"
													}
													onClick={() => field.onChange(provider)}
													disabled={form.formState.isSubmitting}
													className="flex-1"
												>
													{getProviderDisplayName(provider)}
												</Button>
											))}
										</div>
										{availableProviders.length === 0 && (
											<p className="text-muted-foreground text-sm">
												All providers already have API keys configured
											</p>
										)}
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="apiKey"
								render={({ field }) => {
									const provider = form.watch("provider");
									return (
										<FormItem>
											<FormLabel>
												{getProviderDisplayName(provider)} API Key
											</FormLabel>
											<FormControl>
												<Input
													type="password"
													placeholder={PROVIDER_METADATA[provider].placeholder}
													disabled={form.formState.isSubmitting}
													{...field}
												/>
											</FormControl>
											<FormDescription>
												Get your key from{" "}
												<a
													href={PROVIDER_METADATA[provider].url}
													target="_blank"
													rel="noopener noreferrer"
													className="underline hover:text-foreground"
												>
													{PROVIDER_METADATA[provider].consoleName}
												</a>
											</FormDescription>
											<FormMessage />
										</FormItem>
									);
								}}
							/>

							<DialogFooter>
								<Button
									type="button"
									variant="outline"
									onClick={() => setIsDialogOpen(false)}
									disabled={form.formState.isSubmitting}
								>
									Cancel
								</Button>
								<Button type="submit" disabled={form.formState.isSubmitting}>
									{form.formState.isSubmitting ? (
										<>
											<Loader2 className="mr-2 h-4 w-4 animate-spin" />
											Validating...
										</>
									) : (
										"Save & Validate"
									)}
								</Button>
							</DialogFooter>
						</form>
					</Form>
				</DialogContent>
			</Dialog>

			{/* Delete Confirmation Dialog */}
			<Dialog
				open={!!deleteProvider}
				onOpenChange={(open) => !open && setDeleteProvider(null)}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Delete API Key</DialogTitle>
						<DialogDescription>
							Are you sure you want to remove your{" "}
							{deleteProvider && getProviderDisplayName(deleteProvider)} API
							key? Agents using this provider will no longer be able to play.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setDeleteProvider(null)}
							disabled={deleteCredentialMutation.isPending}
						>
							Cancel
						</Button>
						<Button
							onClick={() => {
								if (deleteProvider) {
									deleteCredentialMutation.mutate({ provider: deleteProvider });
								}
							}}
							disabled={deleteCredentialMutation.isPending}
							variant="destructive"
						>
							{deleteCredentialMutation.isPending ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									Deleting...
								</>
							) : (
								"Delete"
							)}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
