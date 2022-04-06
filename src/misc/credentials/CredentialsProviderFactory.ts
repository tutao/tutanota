import type {CredentialsAndDatabaseKey, CredentialsEncryption, ICredentialsProvider, PersistentCredentials} from "./CredentialsProvider"
import {CredentialsProvider} from "./CredentialsProvider"
import {deviceConfig} from "../DeviceConfig"
import {isApp, isDesktop, isOfflineStorageAvailable} from "../../api/common/Env"
import type {DeviceEncryptionFacade} from "../../api/worker/facades/DeviceEncryptionFacade"
import {CredentialsKeyMigrator, CredentialsKeyMigratorStub} from "./CredentialsKeyMigrator"
import {CredentialsKeyProvider} from "./CredentialsKeyProvider"
import {NativeCredentialsEncryption} from "./NativeCredentialsEncryption"
import type {ExposedNativeInterface, NativeInterface} from "../../native/common/NativeInterface"
import {assertNotNull} from "@tutao/tutanota-utils"
import {DatabaseKeyFactory} from "./DatabaseKeyFactory"
import {exposeRemote} from "../../api/common/WorkerProxy"
import {OfflineDbFacade} from "../../desktop/db/OfflineDbFacade"
import {InterWindowEventBus} from "../../native/common/InterWindowEventBus"

export function usingKeychainAuthentication(): boolean {
	return isApp() || isDesktop()
}

export function hasKeychainAuthenticationOptions(): boolean {
	return isApp()
}

/**
 * Factory method for credentials provider that will return an instance injected with the implementations appropriate for the platform.
 * @param deviceEncryptionFacade
 * @param nativeApp: If {@code usingKeychainAuthentication} would return true, this _must not_ be null
 * @param eventBus
 */
export function createCredentialsProvider(
	deviceEncryptionFacade: DeviceEncryptionFacade,
	nativeApp: NativeInterface | null,
	eventBus: InterWindowEventBus | null,
): ICredentialsProvider {
	if (usingKeychainAuthentication()) {
		const nonNullNativeApp = assertNotNull(nativeApp)
		const credentialsKeyProvider = new CredentialsKeyProvider(nonNullNativeApp, deviceConfig, deviceEncryptionFacade)
		const credentialsEncryption = new NativeCredentialsEncryption(credentialsKeyProvider, deviceEncryptionFacade, nonNullNativeApp)
		const credentialsKeyMigrator = new CredentialsKeyMigrator(nonNullNativeApp)
		// TODO: check if using offline
		let offlineDbFacade: OfflineDbFacade | null
		if (isOfflineStorageAvailable()) {
			const remoteInterface = exposeRemote<ExposedNativeInterface>(
				(request) => nonNullNativeApp.invokeNative(request)
			)
			offlineDbFacade = remoteInterface.offlineDbFacade
		} else {
			offlineDbFacade = null
		}
		return new CredentialsProvider(
			credentialsEncryption,
			deviceConfig,
			credentialsKeyMigrator,
			new DatabaseKeyFactory(deviceEncryptionFacade),
			offlineDbFacade,
			isDesktop() ? eventBus : null,
		)
	} else {
		return new CredentialsProvider(
			new CredentialsEncryptionStub(),
			deviceConfig,
			new CredentialsKeyMigratorStub(),
			new DatabaseKeyFactory(deviceEncryptionFacade),
			null,
			null,
		)
	}
}

/**
 * This is a temporary stub that we will replace soon by some mechanism that will be able to utilize fingerprint/pin on mobile devices
 * for encryption of login data. Using this implementation does not mean we do not encrypt credentials currently since there is an
 * additional mechanism for credentials encryption using an access key stored server side. This is done in LoginFacade.
 */

class CredentialsEncryptionStub implements CredentialsEncryption {
	async encrypt({credentials, databaseKey}: CredentialsAndDatabaseKey): Promise<PersistentCredentials> {
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
			databaseKey: null
		}
	}

	async decrypt(encryptedCredentials: PersistentCredentials): Promise<CredentialsAndDatabaseKey> {
		return {
			credentials: {
				login: encryptedCredentials.credentialInfo.login,
				encryptedPassword: encryptedCredentials.encryptedPassword,
				accessToken: encryptedCredentials.accessToken,
				userId: encryptedCredentials.credentialInfo.userId,
				type: encryptedCredentials.credentialInfo.type,
			},
			databaseKey: null
		}
	}

	async getSupportedEncryptionModes() {
		return []
	}
}