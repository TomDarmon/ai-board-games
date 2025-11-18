import * as crypto from "crypto";
import { env } from "~/env";

const IV_LENGTH_BYTES = 12;
const SALT_LENGTH_BYTES = 16;

/**
 * Encrypt a secret using AES-256-GCM encryption with a unique salt per secret.
 */
export function encryptSecret(secret: string, encryptionKey: string): string {
	const salt = crypto.randomBytes(SALT_LENGTH_BYTES);
	const iv = crypto.randomBytes(IV_LENGTH_BYTES);
	const key = crypto.scryptSync(encryptionKey, salt, 32);
	const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);

	let encrypted = cipher.update(secret, "utf8", "hex");
	encrypted += cipher.final("hex");

	const authTag = cipher.getAuthTag();

	// Combine salt, IV, auth tag, and encrypted data
	return [
		salt.toString("hex"),
		iv.toString("hex"),
		authTag.toString("hex"),
		encrypted,
	].join(":");
}

/**
 * Decrypt a secret using AES-256-GCM decryption.
 * Expects the format salt:iv:authTag:ciphertext.
 */
export function decryptSecret(encryptedData: string): string {
	const parts = encryptedData.split(":");

	if (parts.length === 4) {
		const [saltHex, ivHex, authTagHex, encrypted] = parts as [
			string,
			string,
			string,
			string,
		];

		const salt = Buffer.from(saltHex, "hex");
		const iv = Buffer.from(ivHex, "hex");
		const authTag = Buffer.from(authTagHex, "hex");
		const key = crypto.scryptSync(env.ENCRYPTION_KEY, salt, 32);

		const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
		decipher.setAuthTag(authTag);

		let decrypted = decipher.update(encrypted, "hex", "utf8");
		decrypted += decipher.final("utf8");

		return decrypted;
	}
	throw new Error(
		"Encryption uses a legacy format. Please remove and add again your API key.",
	);
}

/**
 * Mask an API key by showing only the last 4 characters
 */
export function maskKey(apiKey: string): string {
	if (apiKey.length <= 4) {
		return "****";
	}
	return `****${apiKey.slice(-4)}`;
}
