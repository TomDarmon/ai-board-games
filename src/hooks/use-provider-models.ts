import { useMemo } from "react";
import type { ApiProvider } from "~/drizzle/schema";
import type { AIModel } from "~/shared/models";
import { getProviderConfigs } from "~/shared/models";
import { api } from "~/trpc/react";

interface ProviderModelGroup {
	provider: ApiProvider;
	displayName: string;
	hasKey: boolean;
	models: AIModel[];
}

interface UseProviderModelsReturn {
	isLoading: boolean;
	hasAnyKey: boolean;
	providerGroups: ProviderModelGroup[];
	availableModels: AIModel[];
}

/**
 * Hook to get provider credentials and available models in a provider-agnostic way.
 * Makes it easy to add new providers without changing the UI code.
 */
export function useProviderModels(): UseProviderModelsReturn {
	const { data: credentials, isLoading } = api.ai.listCredentials.useQuery();

	const result = useMemo(() => {
		const providerConfigs = getProviderConfigs();
		const credentialSet = new Set(
			credentials?.map((cred) => cred.provider) ?? [],
		);

		const providerGroups: ProviderModelGroup[] = providerConfigs.map(
			(config) => {
				const hasKey = credentialSet.has(config.provider);
				return {
					provider: config.provider,
					displayName: config.displayName,
					hasKey,
					models: hasKey ? config.getModelsList() : [],
				};
			},
		);

		const hasAnyKey = providerGroups.some((group) => group.hasKey);
		const availableModels = providerGroups.flatMap((group) => group.models);

		return {
			isLoading,
			hasAnyKey,
			providerGroups,
			availableModels,
		};
	}, [credentials, isLoading]);

	return result;
}
