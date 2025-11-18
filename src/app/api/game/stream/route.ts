import { createUIMessageStream, createUIMessageStreamResponse } from "ai";
import { z } from "zod";
import { auth } from "~/lib/auth";
import { getMatchPlayWorkflow } from "~/server/mastra";
import { matchConfigSchema } from "~/shared/match";
import {
	type MatchCompleteData,
	MatchEventType,
	type MatchInitData,
	type MatchTurnData,
	type MatchUIMessage,
	dataPartNames,
} from "~/shared/match";

// Type-safe request body schema matching what useChat sends
const chatRequestBodySchema = z.object({
	id: z.string(),
	messages: z.array(
		z.object({
			role: z.string(),
			parts: z.array(
				z.object({
					type: z.string(),
					text: z.string().optional(),
				}),
			),
			id: z.string(),
		}),
	),
	trigger: z.enum(["submit-message", "regenerate-message"]),
});

export async function POST(request: Request) {
	try {
		// Check for session
		const session = await auth.api.getSession({ headers: request.headers });
		if (!session?.user) {
			return new Response(JSON.stringify({ error: "Unauthorized" }), {
				status: 401,
				headers: { "Content-Type": "application/json" },
			});
		}

		const rawBody = await request.json();

		// Parse and validate the chat request body
		const chatRequest = chatRequestBodySchema.parse(rawBody);

		// Extract match config from the last message's text part
		const lastMessage = chatRequest.messages[chatRequest.messages.length - 1];
		const textPart = lastMessage?.parts.find((p) => p.type === "text");

		let matchConfig = matchConfigSchema.parse({});

		if (textPart?.text) {
			try {
				const parsed = JSON.parse(textPart.text);
				matchConfig = matchConfigSchema.parse(parsed);
			} catch {
				// If parsing fails, use default empty config
				matchConfig = matchConfigSchema.parse({});
			}
		}

		const stream = createUIMessageStream<MatchUIMessage>({
			async execute({ writer }) {
				const workflow = getMatchPlayWorkflow();
				const run = await workflow.createRunAsync();

				// Use streamVNext for better streaming support
				const workflowStream = run.streamVNext({
					inputData: {
						...matchConfig,
						userId: session.user.id,
					},
				});

				// Process workflow stream events
				for await (const chunk of workflowStream) {
					// Handle custom writer events from workflow steps
					// Mastra emits custom writes as "workflow-step-output" events
					if (chunk.type === "workflow-step-output") {
						const payload = chunk.payload;
						const eventData = payload.output;
						const eventType = eventData.type;

						if (eventType === MatchEventType.matchInit) {
							writer.write({
								type: dataPartNames.matchInit,
								data: eventData as unknown as MatchInitData,
							});
						} else if (eventType === MatchEventType.matchTurn) {
							writer.write({
								type: dataPartNames.matchTurn,
								data: eventData as unknown as MatchTurnData,
							});
						} else if (eventType === MatchEventType.matchComplete) {
							writer.write({
								type: dataPartNames.matchComplete,
								data: eventData as unknown as MatchCompleteData,
							});
						}
					}
				}
			},
		});
		return createUIMessageStreamResponse({ stream });
	} catch (error) {
		console.error("Game stream route error:", error);
		return new Response(
			JSON.stringify({
				error: error instanceof Error ? error.message : "Unknown error",
			}),
			{ status: 500, headers: { "Content-Type": "application/json" } },
		);
	}
}
