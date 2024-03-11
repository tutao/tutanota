import { Indexer } from "../api/worker/search/Indexer.js"
import { NativePushServiceApp } from "../native/main/NativePushServiceApp.js"
import { ConfigurationDatabase } from "../api/worker/facades/lazy/ConfigurationDatabase.js"
import { NativeContactsSyncManager } from "../contacts/model/NativeContactsSyncManager.js"
import { UnencryptedCredentials } from "../native/common/generatedipc/UnencryptedCredentials.js"

export interface CredentialRemovalHandler {
	onCredentialsRemoved(credentials: UnencryptedCredentials): Promise<void>
}

export class NoopCredentialRemovalHandler implements CredentialRemovalHandler {
	async onCredentialsRemoved(_: UnencryptedCredentials): Promise<void> {}
}

export class AppsCredentialRemovalHandler implements CredentialRemovalHandler {
	constructor(
		private readonly indexer: Indexer,
		private readonly pushApp: NativePushServiceApp,
		private readonly configFacade: ConfigurationDatabase,
		private readonly mobileContactsManager: NativeContactsSyncManager | null,
	) {}

	async onCredentialsRemoved(credentials: UnencryptedCredentials) {
		if (credentials.databaseKey != null) {
			const { userId } = credentials.credentialInfo
			await this.indexer.deleteIndex(userId)
			await this.pushApp.invalidateAlarmsForUser(userId)
			await this.pushApp.removeUserFromNotifications(userId)
			await this.configFacade.delete(userId)
		}

		await this.mobileContactsManager?.disableSync(credentials.credentialInfo.userId, credentials.credentialInfo.login)
	}
}
