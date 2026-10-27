import { NativePushServiceApp } from "../native/NativePushServiceApp.js"
import { ConfigurationDatabase } from "../api/worker/facades/lazy/ConfigurationDatabase.js"
import { CredentialsInfo } from "@tutao/native-bridge/generatedIpc/types"
import { DeviceStorageUnavailableError } from "../api/common/error/DeviceStorageUnavailableError"
import { IndexedDbConfigurationDatabase } from "../api/worker/facades/lazy/IndexedDbConfigurationDatabase"
import { EnvProvider } from "@tutao/app-env"
import { ClientDetector } from "../../../platform-kit/app-env/boot/ClientDetector"

export interface CredentialRemovalHandler {
	onCredentialsRemoved(credentialInfo: CredentialsInfo): Promise<void>
}

export class NoopCredentialRemovalHandler implements CredentialRemovalHandler {
	async onCredentialsRemoved(_: CredentialsInfo): Promise<void> {}
}

export class AppsCredentialRemovalHandler implements CredentialRemovalHandler {
	constructor(
		private readonly pushApp: NativePushServiceApp,
		private readonly configFacade: ConfigurationDatabase,
		private readonly appSpecificCredentialRemovalActions: (login: string, userId: string) => Promise<void>,
	) {}

	async onCredentialsRemoved({ login, userId }: CredentialsInfo) {
		await this.pushApp.invalidateAlarmsForUser(userId)
		try {
			await this.pushApp.removeUserFromNotifications(userId)
		} catch (e) {
			if (e instanceof DeviceStorageUnavailableError) {
				console.warn("Could not remove SSE data: ", e)
			} else {
				throw e
			}
		}

		// We can't just make delete a no-op as it will still instantiate it (which will fail if it is stored in offline
		// db as that's not instantiated yet)
		if (!EnvProvider.get().isDesktop() && !ClientDetector.get().isMailApp()) {
			await (this.configFacade as IndexedDbConfigurationDatabase).delete(userId)
		}

		await this.appSpecificCredentialRemovalActions(login, userId)
	}
}
