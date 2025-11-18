"use client";

import { Bot, Plus } from "lucide-react";
import Link from "next/link";
import { Button } from "~/components/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "~/components/ui/select";
import { getModelDisplayName } from "~/shared/models";
import { api } from "~/trpc/react";
import { Label } from "./ui/label";

type AgentSelectorProps = {
	value: string | null;
	onChange: (value: string | null) => void;
	label: string;
	onCreateNew?: () => void;
};

export function AgentSelector({
	value,
	onChange,
	label,
	onCreateNew,
}: AgentSelectorProps) {
	const { data: agents, isLoading } = api.agent.list.useQuery();

	if (isLoading) {
		return (
			<div className="flex flex-col gap-2">
				<Label className="font-medium text-sm">{label}</Label>
				<div className="flex items-center gap-2 rounded-md border border-dashed p-4">
					<Bot className="h-4 w-4 animate-pulse text-muted-foreground" />
					<span className="text-muted-foreground text-sm">
						Loading agents...
					</span>
				</div>
			</div>
		);
	}

	if (!agents || agents.length === 0) {
		return (
			<div className="flex flex-col gap-2">
				<Label className="font-medium text-sm">{label}</Label>
				<div className="flex items-center justify-between gap-3 rounded-md border border-dashed p-4">
					<div className="flex items-center gap-2">
						<Bot className="h-4 w-4 text-muted-foreground" />
						<span className="text-muted-foreground text-sm">
							No agents found. Create one to get started.
						</span>
					</div>
					<Link href="/dashboard/agents">
						<Button size="sm">
							<Plus className="mr-2 h-4 w-4" />
							Create agent
						</Button>
					</Link>
				</div>
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-2">
			<Label className="font-medium text-sm">{label}</Label>
			<div className="flex gap-2">
				<Select
					value={value ?? undefined}
					onValueChange={(val) => onChange(val)}
				>
					<SelectTrigger className="flex-1">
						<SelectValue placeholder="Select an agent" />
					</SelectTrigger>
					<SelectContent>
						{agents.map((agent) => (
							<SelectItem key={agent.id} value={agent.id}>
								<div className="flex flex-col">
									<div className="flex items-center gap-2">
										<Bot className="h-4 w-4" />
										<span className="font-medium">{agent.name}</span>
									</div>
									<span className="text-muted-foreground text-xs">
										{getModelDisplayName(agent.model)}
									</span>
								</div>
							</SelectItem>
						))}
					</SelectContent>
				</Select>
				{onCreateNew && (
					<Button variant="outline" size="icon" onClick={onCreateNew}>
						<Plus className="h-4 w-4" />
					</Button>
				)}
			</div>
		</div>
	);
}
