// @flow
import type {CredentialsEncryption} from "./CredentialsProvider"
import {CredentialsProvider} from "./CredentialsProvider"
import {deviceConfig} from "../DeviceConfig"

export function createCredentialsProvider(): CredentialsProvider {
	return new CredentialsProvider(new CredentialsEncryptionStub(), deviceConfig)
}

/**
 * This is a temporary stub that we will replace soon by some mechanism that will be able to utilize fingerprint/pin on mobile devices
 * for encryption of login data.
 */
class CredentialsEncryptionStub implements CredentialsEncryption {
	async encrypt(credentials: Credentials): Promise<Base64> {
		return JSON.stringify(credentials)
	}

	async decrypt(encryptedCredentials: Base64): Promise<Credentials> {
		return JSON.parse(encryptedCredentials)
	}
}