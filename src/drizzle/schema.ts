import { sql } from "drizzle-orm";
import {
	boolean,
	foreignKey,
	index,
	integer,
	pgEnum,
	pgTable,
	text,
	timestamp,
	uniqueIndex,
	uuid,
} from "drizzle-orm/pg-core";

export enum PlayerId {
	X = "X",
	O = "O",
}

export enum GameType {
	ticTacToe = "ticTacToe",
	connectFour = "connectFour",
	chess = "chess",
}

export enum MatchStatus {
	waiting = "waiting",
	playing = "playing",
	finished = "finished",
	abandoned = "abandoned",
}

export enum PlayerType {
	human = "human",
	agent = "agent",
}

export const gameType = pgEnum("GameType", [
	GameType.ticTacToe,
	GameType.connectFour,
	GameType.chess,
]);
export const matchStatus = pgEnum("MatchStatus", [
	MatchStatus.waiting,
	MatchStatus.playing,
	MatchStatus.finished,
	MatchStatus.abandoned,
]);
export const player = pgEnum("Player", [PlayerId.X, PlayerId.O]);
export const playerType = pgEnum("PlayerType", [
	PlayerType.human,
	PlayerType.agent,
]);
/**
 * Central API Provider enum - used across the application
 */
export enum ApiProvider {
	OpenAI = "openai",
	Anthropic = "anthropic",
}

export const apiProvider = pgEnum("ApiProvider", [
	ApiProvider.OpenAI,
	ApiProvider.Anthropic,
]);

export const verification = pgTable(
	"Verification",
	{
		id: uuid("id").primaryKey().notNull().default(sql`gen_random_uuid()`),
		identifier: text().notNull(),
		value: text().notNull(),
		expiresAt: timestamp({ precision: 3, mode: "string" }).notNull(),
		createdAt: timestamp({ precision: 3, mode: "string" })
			.default(sql`CURRENT_TIMESTAMP`)
			.notNull(),
		updatedAt: timestamp({ precision: 3, mode: "string" })
			.default(sql`CURRENT_TIMESTAMP`)
			.notNull(),
	},
	(table) => [
		uniqueIndex("Verification_identifier_value_key").using(
			"btree",
			table.identifier.asc().nullsLast().op("text_ops"),
			table.value.asc().nullsLast().op("text_ops"),
		),
	],
);

export const user = pgTable(
	"User",
	{
		id: uuid("id").primaryKey().notNull().default(sql`gen_random_uuid()`),
		name: text(),
		email: text().notNull(),
		emailVerified: boolean().default(false).notNull(),
		image: text(),
		createdAt: timestamp({ precision: 3, mode: "string" })
			.default(sql`CURRENT_TIMESTAMP`)
			.notNull(),
		updatedAt: timestamp({ precision: 3, mode: "string" })
			.default(sql`CURRENT_TIMESTAMP`)
			.notNull(),
	},
	(table) => [
		index("User_email_idx").using(
			"btree",
			table.email.asc().nullsLast().op("text_ops"),
		),
		uniqueIndex("User_email_key").using(
			"btree",
			table.email.asc().nullsLast().op("text_ops"),
		),
	],
);

export const account = pgTable(
	"Account",
	{
		id: uuid("id").primaryKey().notNull().default(sql`gen_random_uuid()`),
		userId: uuid().notNull(),
		accountId: text().notNull(),
		providerId: text().notNull(),
		accessToken: text(),
		refreshToken: text(),
		idToken: text(),
		expiresAt: timestamp({ precision: 3, mode: "string" }),
		password: text(),
		createdAt: timestamp({ precision: 3, mode: "string" })
			.default(sql`CURRENT_TIMESTAMP`)
			.notNull(),
		updatedAt: timestamp({ precision: 3, mode: "string" })
			.default(sql`CURRENT_TIMESTAMP`)
			.notNull(),
	},
	(table) => [
		uniqueIndex("Account_providerId_accountId_key").using(
			"btree",
			table.providerId.asc().nullsLast().op("text_ops"),
			table.accountId.asc().nullsLast().op("text_ops"),
		),
		index("Account_userId_idx").using(
			"btree",
			table.userId.asc().nullsLast().op("uuid_ops"),
		),
		foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "Account_userId_fkey",
		})
			.onUpdate("cascade")
			.onDelete("cascade"),
	],
);

export const session = pgTable(
	"Session",
	{
		id: uuid("id").primaryKey().notNull().default(sql`gen_random_uuid()`),
		userId: uuid().notNull(),
		expiresAt: timestamp({ precision: 3, mode: "string" }).notNull(),
		ipAddress: text(),
		userAgent: text(),
		createdAt: timestamp({ precision: 3, mode: "string" })
			.default(sql`CURRENT_TIMESTAMP`)
			.notNull(),
		updatedAt: timestamp({ precision: 3, mode: "string" })
			.default(sql`CURRENT_TIMESTAMP`)
			.notNull(),
		token: text().notNull(),
	},
	(table) => [
		uniqueIndex("Session_token_key").using(
			"btree",
			table.token.asc().nullsLast().op("text_ops"),
		),
		index("Session_userId_idx").using(
			"btree",
			table.userId.asc().nullsLast().op("uuid_ops"),
		),
		foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "Session_userId_fkey",
		})
			.onUpdate("cascade")
			.onDelete("cascade"),
	],
);

export const gameTurn = pgTable(
	"GameTurn",
	{
		id: uuid("id").primaryKey().notNull().default(sql`gen_random_uuid()`),
		createdAt: timestamp({ precision: 3, mode: "string" })
			.default(sql`CURRENT_TIMESTAMP`)
			.notNull(),
		matchId: uuid().notNull(),
		player: player().notNull(),
		moveNumber: integer().notNull(),
		moveData: text().notNull(),
		stateAfterMove: text(),
	},
	(table) => [
		index("GameTurn_matchId_moveNumber_idx").using(
			"btree",
			table.matchId.asc().nullsLast().op("uuid_ops"),
			table.moveNumber.asc().nullsLast().op("int4_ops"),
		),
		uniqueIndex("GameTurn_matchId_moveNumber_key").using(
			"btree",
			table.matchId.asc().nullsLast().op("uuid_ops"),
			table.moveNumber.asc().nullsLast().op("int4_ops"),
		),
		foreignKey({
			columns: [table.matchId],
			foreignColumns: [gameMatch.id],
			name: "GameTurn_matchId_fkey",
		})
			.onUpdate("cascade")
			.onDelete("cascade"),
	],
);

export const gameMatch = pgTable(
	"GameMatch",
	{
		id: uuid("id").primaryKey().notNull().default(sql`gen_random_uuid()`),
		createdAt: timestamp({ precision: 3, mode: "string" })
			.default(sql`CURRENT_TIMESTAMP`)
			.notNull(),
		updatedAt: timestamp({ precision: 3, mode: "string" })
			.default(sql`CURRENT_TIMESTAMP`)
			.notNull(),
		userId: uuid("userId").notNull(),
		gameType: gameType().notNull(),
		playerXtype: playerType().notNull(),
		playerXagentId: uuid(),
		playerOtype: playerType().notNull(),
		playerOagentId: uuid(),
		state: text().notNull(),
		currentPlayer: player().notNull(),
		status: matchStatus().notNull(),
		winner: text(),
		illegalMovesO: integer().default(0).notNull(),
		illegalMovesX: integer().default(0).notNull(),
	},
	(table) => [
		index("GameMatch_createdAt_idx").using(
			"btree",
			table.createdAt.asc().nullsLast().op("timestamp_ops"),
		),
		index("GameMatch_gameType_status_idx").using(
			"btree",
			table.gameType.asc().nullsLast().op("enum_ops"),
			table.status.asc().nullsLast().op("enum_ops"),
		),
		index("GameMatch_playerOAgentId_idx").using(
			"btree",
			table.playerOagentId.asc().nullsLast().op("uuid_ops"),
		),
		index("GameMatch_playerXAgentId_idx").using(
			"btree",
			table.playerXagentId.asc().nullsLast().op("uuid_ops"),
		),
		index("GameMatch_userId_idx").using(
			"btree",
			table.userId.asc().nullsLast().op("uuid_ops"),
		),
		foreignKey({
			columns: [table.playerXagentId],
			foreignColumns: [agentProfile.id],
			name: "GameMatch_playerXAgentId_fkey",
		})
			.onUpdate("cascade")
			.onDelete("set null"),
		foreignKey({
			columns: [table.playerOagentId],
			foreignColumns: [agentProfile.id],
			name: "GameMatch_playerOAgentId_fkey",
		})
			.onUpdate("cascade")
			.onDelete("set null"),
		foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "GameMatch_userId_fkey",
		})
			.onUpdate("cascade")
			.onDelete("cascade"),
	],
);

export const agentProfile = pgTable(
	"AgentProfile",
	{
		id: uuid("id").primaryKey().notNull().default(sql`gen_random_uuid()`),
		createdAt: timestamp({ precision: 3, mode: "string" })
			.default(sql`CURRENT_TIMESTAMP`)
			.notNull(),
		updatedAt: timestamp({ precision: 3, mode: "string" })
			.default(sql`CURRENT_TIMESTAMP`)
			.notNull(),
		userId: uuid("userId").notNull(),
		name: text().notNull(),
		model: text(),
		prompt: text(),
	},
	(table) => [
		index("AgentProfile_model_idx").using(
			"btree",
			table.model.asc().nullsLast().op("text_ops"),
		),
		index("AgentProfile_name_idx").using(
			"btree",
			table.name.asc().nullsLast().op("text_ops"),
		),
		index("AgentProfile_userId_idx").using(
			"btree",
			table.userId.asc().nullsLast().op("uuid_ops"),
		),
		uniqueIndex("AgentProfile_name_key").using(
			"btree",
			table.name.asc().nullsLast().op("text_ops"),
		),
		foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "AgentProfile_userId_fkey",
		})
			.onUpdate("cascade")
			.onDelete("cascade"),
	],
);

export const userApiCredential = pgTable(
	"UserApiCredential",
	{
		id: uuid("id").primaryKey().notNull().default(sql`gen_random_uuid()`),
		userId: uuid("userId").notNull(),
		provider: apiProvider().notNull(),
		encryptedApiKey: text().notNull(),
		apiKeyLast4: text().notNull(),
		validatedAt: timestamp({ precision: 3, mode: "string" }),
		createdAt: timestamp({ precision: 3, mode: "string" })
			.default(sql`CURRENT_TIMESTAMP`)
			.notNull(),
		updatedAt: timestamp({ precision: 3, mode: "string" })
			.default(sql`CURRENT_TIMESTAMP`)
			.notNull(),
	},
	(table) => [
		uniqueIndex("UserApiCredential_user_provider_key").using(
			"btree",
			table.userId.asc().nullsLast().op("uuid_ops"),
			table.provider.asc().nullsLast().op("enum_ops"),
		),
		index("UserApiCredential_userId_idx").using(
			"btree",
			table.userId.asc().nullsLast().op("uuid_ops"),
		),
		index("UserApiCredential_validatedAt_idx").using(
			"btree",
			table.validatedAt.asc().nullsLast().op("timestamp_ops"),
		),
		foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "UserApiCredential_userId_fkey",
		})
			.onUpdate("cascade")
			.onDelete("cascade"),
	],
);
