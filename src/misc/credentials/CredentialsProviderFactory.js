// @flow
import type {CredentialsEncryption, ICredentialsProvider, PersistentCredentials} from "./CredentialsProvider"
import {CredentialsProvider} from "./CredentialsProvider"
import {deviceConfig} from "../DeviceConfig"
import {isAdminClient, isAndroidApp, isApp, isDesktop} from "../../api/common/Env"
import type {DeviceEncryptionFacade} from "../../api/worker/facades/DeviceEncryptionFacade"
import {CredentialsKeyMigrator, CredentialsKeyMigratorStub} from "./CredentialsKeyMigrator"
import {CredentialsKeyProvider} from "./CredentialsKeyProvider"
import {NativeCredentialsEncryption} from "./NativeCredentialsEncryption"
import type {Credentials} from "./Credentials"

export async function usingKeychainAuthentication(): Promise<boolean> {
	if (isApp()) {
		const {nativeApp} = await import("../../native/common/NativeWrapper")
		await nativeApp.initialized()
		// We can only determine OS after native bridge is established
		return isAndroidApp()
	} else {
		return false
	}
}

/**
 * Factory method for credentials provider that will return an instance injected with the implementations appropriate for the platform.
 * @param deviceEncryptionFacade
 * @returns {Promise<CredentialsProvider>}
 */
export async function createCredentialsProvider(deviceEncryptionFacade: DeviceEncryptionFacade): Promise<ICredentialsProvider> {
	if (await usingKeychainAuthentication()) {
		const {nativeApp} = await import("../../native/common/NativeWrapper")
		const credentialsKeyProvider = new CredentialsKeyProvider(nativeApp, deviceConfig, deviceEncryptionFacade)
		const credentialsEncryption = new NativeCredentialsEncryption(credentialsKeyProvider, deviceEncryptionFacade, nativeApp)
		const credentialsKeyMigrator = new CredentialsKeyMigrator(nativeApp)
		return new CredentialsProvider(credentialsEncryption, deviceConfig, credentialsKeyMigrator)
	} else if (isAdminClient() || isDesktop()) {
		return new CredentialsProvider(new CredentialsEncryptionStub(), deviceConfig, new CredentialsKeyMigratorStub())
	} else {
		return new CredentialsProvider(new CredentialsEncryptionStub(), deviceConfig, new CredentialsKeyMigratorStub())
	}
}

/**
 * This is a temporary stub that we will replace soon by some mechanism that will be able to utilize fingerprint/pin on mobile devices
 * for encryption of login data. Using this implementation does not mean we do not encrypt credentials currently since there is an
 * additional mechanism for credentials encryption using an access key stored server side. This is done in LoginFacade.
 */
class CredentialsEncryptionStub implements CredentialsEncryption {
	async encrypt(credentials: Credentials): Promise<PersistentCredentials> {
		const {encryptedPassword} = credentials
		if (encryptedPassword == null) {
			throw new Error("Trying to encrypt non-persistent credentials")
		}
		return {
			credentialInfo: {
				login: credentials.login,
				userId: credentials.userId,
				type: credentials.type,
			},
			encryptedPassword,
			accessToken: credentials.accessToken,
		}
	}

	async decrypt(encryptedCredentials: PersistentCredentials): Promise<Credentials> {
		return {
			login: encryptedCredentials.credentialInfo.login,
			encryptedPassword: encryptedCredentials.encryptedPassword,
			accessToken: encryptedCredentials.accessToken,
			userId: encryptedCredentials.credentialInfo.userId,
			type: encryptedCredentials.credentialInfo.type,
		}
	}

	async getSupportedEncryptionModes() {
		return []
	}
}