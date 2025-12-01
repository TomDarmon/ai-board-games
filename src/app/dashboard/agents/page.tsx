"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Bot, Edit, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { ModelSelector } from "~/components/ModelSelector";
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
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { useProviderModels } from "~/hooks/use-provider-models";
import {
	type AIModel,
	AnthropicModels,
	MistralModels,
	OpenAIModels,
	getModelDisplayName,
} from "~/shared/models";
import { getTRPCErrorMessage } from "~/trpc/error";
import { api } from "~/trpc/react";

const maxAgentNameLength = 100;
const maxAgentPromptLength = 1000;

// Create all possible model values for Zod enum
const allModelValues = [
	...Object.values(OpenAIModels),
	...Object.values(AnthropicModels),
	...Object.values(MistralModels),
] as const;

const agentFormSchema = z.object({
	name: z
		.string()
		.min(1, "Agent name is required")
		.max(
			maxAgentNameLength,
			`Name is too long. Please keep it under ${maxAgentNameLength} characters.`,
		),
	model: z.enum(allModelValues),
	prompt: z
		.string()
		.max(
			maxAgentPromptLength,
			`The prompt is too long. Please keep it under ${maxAgentPromptLength} characters.`,
		)
		.optional(),
});

type AgentFormData = z.infer<typeof agentFormSchema>;

export default function AgentsPage() {
	const [isCreateOpen, setIsCreateOpen] = useState(false);
	const [isEditOpen, setIsEditOpen] = useState(false);
	const [isDeleteOpen, setIsDeleteOpen] = useState(false);
	const [selectedAgent, setSelectedAgent] = useState<string | null>(null);

	// Create form
	const createForm = useForm<AgentFormData>({
		resolver: zodResolver(agentFormSchema),
		defaultValues: {
			name: "",
			model: OpenAIModels.GPT4oMini,
			prompt: "",
		},
	});

	// Edit form
	const editForm = useForm<AgentFormData>({
		resolver: zodResolver(agentFormSchema),
		defaultValues: {
			name: "",
			model: OpenAIModels.GPT4oMini,
			prompt: "",
		},
	});

	const { data: agents, isLoading, refetch } = api.agent.list.useQuery();
	const { hasAnyKey, availableModels } = useProviderModels();

	const createAgent = api.agent.create.useMutation({
		onSuccess: () => {
			toast.success("Agent created successfully!");
			setIsCreateOpen(false);
			createForm.reset();
			void refetch();
		},
		onError: (error) => {
			toast.error(getTRPCErrorMessage(error));
		},
	});

	const updateAgent = api.agent.update.useMutation({
		onSuccess: () => {
			toast.success("Agent updated successfully!");
			setIsEditOpen(false);
			setSelectedAgent(null);
			editForm.reset();
			void refetch();
		},
		onError: (error) => {
			toast.error(getTRPCErrorMessage(error));
		},
	});

	const deleteAgent = api.agent.delete.useMutation({
		onSuccess: () => {
			toast.success("Agent deleted successfully!");
			setIsDeleteOpen(false);
			setSelectedAgent(null);
			void refetch();
		},
		onError: (error) => {
			toast.error(getTRPCErrorMessage(error));
		},
	});

	const handleCreate = (data: AgentFormData) => {
		createAgent.mutate({
			name: data.name,
			model: data.model,
			prompt: data.prompt || undefined,
		});
	};

	const handleEdit = (data: AgentFormData) => {
		if (!selectedAgent) return;

		updateAgent.mutate({
			id: selectedAgent,
			name: data.name,
			model: data.model,
			prompt: data.prompt || undefined,
		});
	};

	const handleDelete = () => {
		if (selectedAgent) {
			deleteAgent.mutate({ id: selectedAgent });
		}
	};

	const openEditDialog = (agentId: string) => {
		const agent = agents?.find((a) => a.id === agentId);
		if (agent) {
			setSelectedAgent(agentId);
			editForm.reset({
				name: agent.name,
				model: (agent.model as AIModel) ?? OpenAIModels.GPT4oMini,
				prompt: agent.prompt ?? "",
			});
			setIsEditOpen(true);
		}
	};

	const openDeleteDialog = (agentId: string) => {
		setSelectedAgent(agentId);
		setIsDeleteOpen(true);
	};

	if (isLoading) {
		return (
			<div className="container mx-auto max-w-4xl px-4 py-8">
				<div className="mb-8">
					<h1 className="font-bold text-3xl">AI Agents</h1>
					<p className="mt-1 text-muted-foreground">
						Create and manage your AI agents
					</p>
				</div>
				<Card>
					<CardContent className="px-4 py-12 text-center sm:px-6">
						<Bot className="mx-auto mb-4 h-12 w-12 animate-pulse text-muted-foreground" />
						<p className="text-muted-foreground text-sm">Loading agents...</p>
					</CardContent>
				</Card>
			</div>
		);
	}

	return (
		<div className="container mx-auto max-w-4xl px-4 py-8">
			<div className="mb-8 flex items-center justify-between">
				<div>
					<h1 className="font-bold text-3xl">AI Agents</h1>
					<p className="mt-1 text-muted-foreground">
						Create and manage your AI agents
					</p>
				</div>
				<Button onClick={() => setIsCreateOpen(true)}>
					<Plus className="mr-2 h-4 w-4" />
					New Agent
				</Button>
			</div>

			{!agents || agents.length === 0 ? (
				<Card>
					<CardContent className="px-4 py-12 text-center sm:px-6">
						<Bot className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
						<h3 className="mb-2 font-semibold text-lg">No agents yet</h3>
						<p className="mb-4 text-muted-foreground text-sm">
							Create your first AI agent to start battling!
						</p>
						<Button onClick={() => setIsCreateOpen(true)}>
							<Plus className="mr-2 h-4 w-4" />
							Create Agent
						</Button>
					</CardContent>
				</Card>
			) : (
				<div className="grid gap-4">
					{agents.map((agent) => (
						<Card key={agent.id}>
							<CardHeader>
								<div className="flex items-start justify-between">
									<div className="flex items-start gap-3">
										<Bot className="mt-1 h-5 w-5 text-primary" />
										<div>
											<CardTitle className="text-lg">{agent.name}</CardTitle>
											<div className="mt-2 flex flex-wrap items-center gap-2">
												<span className="rounded bg-primary/10 px-2 py-1 font-medium text-primary text-xs">
													{getModelDisplayName(agent.model)}
												</span>
												<span className="text-muted-foreground text-xs">
													{agent._count.matchesAsX + agent._count.matchesAsO}{" "}
													matches
												</span>
											</div>
											{agent.prompt && (
												<CardDescription className="mt-2 line-clamp-2">
													{agent.prompt}
												</CardDescription>
											)}
										</div>
									</div>
									<div className="flex gap-2">
										<Button
											variant="ghost"
											size="icon"
											onClick={() => openEditDialog(agent.id)}
										>
											<Edit className="h-4 w-4" />
										</Button>
										<Button
											variant="ghost"
											size="icon"
											onClick={() => openDeleteDialog(agent.id)}
										>
											<Trash2 className="h-4 w-4 text-destructive" />
										</Button>
									</div>
								</div>
							</CardHeader>
						</Card>
					))}
				</div>
			)}

			{/* Create Agent Dialog */}
			<Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Create New Agent</DialogTitle>
						<DialogDescription>
							Configure your AI agent with a name, model, and parameters.
						</DialogDescription>
					</DialogHeader>
					<Form {...createForm}>
						<form
							onSubmit={createForm.handleSubmit(handleCreate)}
							className="space-y-4 py-4"
						>
							<FormField
								control={createForm.control}
								name="name"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Agent Name</FormLabel>
										<FormControl>
											<Input placeholder="e.g., Strategic Master" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={createForm.control}
								name="model"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Model</FormLabel>
										<FormControl>
											<ModelSelector
												value={field.value}
												onValueChange={field.onChange}
												disabled={createForm.formState.isSubmitting}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={createForm.control}
								name="prompt"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Strategy Prompt</FormLabel>
										<FormControl>
											<Textarea
												placeholder="e.g., Play defensively and prioritize board control..."
												className="min-h-24"
												{...field}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<DialogFooter>
								<Button
									type="button"
									variant="outline"
									onClick={() => setIsCreateOpen(false)}
									disabled={createAgent.isPending}
								>
									Cancel
								</Button>
								<Button
									type="submit"
									disabled={createAgent.isPending || !hasAnyKey}
								>
									{createAgent.isPending ? "Creating..." : "Create Agent"}
								</Button>
							</DialogFooter>
						</form>
					</Form>
				</DialogContent>
			</Dialog>

			{/* Edit Agent Dialog */}
			<Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Edit Agent</DialogTitle>
						<DialogDescription>
							Update your AI agent configuration.
						</DialogDescription>
					</DialogHeader>
					<Form {...editForm}>
						<form
							onSubmit={editForm.handleSubmit(handleEdit)}
							className="space-y-4 py-4"
						>
							<FormField
								control={editForm.control}
								name="name"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Agent Name</FormLabel>
										<FormControl>
											<Input placeholder="e.g., Strategic Master" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={editForm.control}
								name="model"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Model</FormLabel>
										<FormControl>
											<ModelSelector
												value={field.value}
												onValueChange={field.onChange}
												disabled={editForm.formState.isSubmitting}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={editForm.control}
								name="prompt"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Strategy Prompt</FormLabel>
										<FormControl>
											<Textarea
												placeholder="e.g., Play defensively and prioritize board control..."
												className="min-h-24"
												{...field}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<DialogFooter>
								<Button
									type="button"
									variant="outline"
									onClick={() => setIsEditOpen(false)}
									disabled={updateAgent.isPending}
								>
									Cancel
								</Button>
								<Button
									type="submit"
									disabled={updateAgent.isPending || !hasAnyKey}
								>
									{updateAgent.isPending ? "Saving..." : "Save Changes"}
								</Button>
							</DialogFooter>
						</form>
					</Form>
				</DialogContent>
			</Dialog>

			{/* Delete Confirmation Dialog */}
			<Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Delete Agent</DialogTitle>
						<DialogDescription>
							Are you sure you want to delete this agent? This action cannot be
							undone.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setIsDeleteOpen(false)}
							disabled={deleteAgent.isPending}
						>
							Cancel
						</Button>
						<Button
							variant="destructive"
							onClick={handleDelete}
							disabled={deleteAgent.isPending}
						>
							{deleteAgent.isPending ? "Deleting..." : "Delete"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
