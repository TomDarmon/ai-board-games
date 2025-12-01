import Link from "next/link";
import { Button } from "~/components/ui/button";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectTrigger,
	SelectValue,
} from "~/components/ui/select";
import { useProviderModels } from "~/hooks/use-provider-models";
import { getModelDisplayName } from "~/shared/models";

interface ModelSelectorProps {
	value: string;
	onValueChange: (value: string) => void;
	disabled?: boolean;
}

/**
 * Provider-agnostic model selector component.
 * Automatically shows available models based on configured API keys.
 * Displays helpful messages for providers without keys.
 */
export function ModelSelector({
	value,
	onValueChange,
	disabled,
}: ModelSelectorProps) {
	const { hasAnyKey, providerGroups } = useProviderModels();

	// If no API keys are configured at all
	if (!hasAnyKey) {
		return (
			<div className="rounded-lg border border-muted bg-muted/50 p-4 text-sm">
				<p className="mb-2 text-muted-foreground">
					No API keys configured. You need to add an API key to select a model.
				</p>
				<Link href="/dashboard/settings/api-keys">
					<Button variant="outline" size="sm" type="button">
						Add API Key
					</Button>
				</Link>
			</div>
		);
	}

	// Show select with available providers
	return (
		<Select value={value} onValueChange={onValueChange} disabled={disabled}>
			<SelectTrigger>
				<SelectValue />
			</SelectTrigger>
			<SelectContent className="grid w-auto min-w-lg grid-cols-3 gap-0">
				{providerGroups.map((group) => (
					<SelectGroup key={group.provider}>
						{group.hasKey ? (
							<>
								<SelectLabel className="font-semibold">
									{group.displayName}
								</SelectLabel>
								{group.models.map((model) => (
									<SelectItem key={model} value={model}>
										{getModelDisplayName(model)}
									</SelectItem>
								))}
							</>
						) : (
							<>
								<SelectLabel className="text-muted-foreground text-xs">
									{group.displayName} (No key)
								</SelectLabel>
								<div className="px-2 py-1.5 text-muted-foreground text-xs">
									<Link href="/dashboard/settings/api-keys">
										Add key to unlock
									</Link>
								</div>
							</>
						)}
					</SelectGroup>
				))}
			</SelectContent>
		</Select>
	);
}
