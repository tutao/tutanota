import { NativePushServiceApp } from "../native/main/NativePushServiceApp.js"
import { ConfigurationDatabase } from "../api/worker/facades/lazy/ConfigurationDatabase.js"
import { CredentialsInfo } from "../native/common/generatedipc/CredentialsInfo.js"
import { DeviceStorageUnavailableError } from "../api/common/error/DeviceStorageUnavailableError"

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
		await this.configFacade.delete(userId)

		await this.appSpecificCredentialRemovalActions(login, userId)
	}
}
