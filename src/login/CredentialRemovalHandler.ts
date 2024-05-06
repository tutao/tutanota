import { Indexer } from "../api/worker/search/Indexer.js"
import { CredentialsAndDatabaseKey } from "../misc/credentials/CredentialsProvider.js"
import { NativePushServiceApp } from "../native/main/NativePushServiceApp.js"
import { ConfigurationDatabase } from "../api/worker/facades/lazy/ConfigurationDatabase.js"
import { NativeContactsSyncManager } from "../contacts/model/NativeContactsSyncManager.js"

export interface CredentialRemovalHandler {
	onCredentialsRemoved(credentialsAndDbKey: CredentialsAndDatabaseKey): Promise<void>
}

export class NoopCredentialRemovalHandler implements CredentialRemovalHandler {
	async onCredentialsRemoved(credentialsAndDbKey: CredentialsAndDatabaseKey): Promise<void> {}
}

export class AppsCredentialRemovalHandler implements CredentialRemovalHandler {
	constructor(
		private readonly indexer: Indexer,
		private readonly pushApp: NativePushServiceApp,
		private readonly configFacade: ConfigurationDatabase,
		private readonly mobileContactsManager: NativeContactsSyncManager | null,
	) {}

	async onCredentialsRemoved(credentialsAndDbKey: CredentialsAndDatabaseKey) {
		if (credentialsAndDbKey.databaseKey != null) {
			const { userId } = credentialsAndDbKey.credentials
			await this.indexer.deleteIndex(userId)
			await this.pushApp.invalidateAlarmsForUser(userId)
			await this.pushApp.removeUserFromNotifications(userId)
			await this.configFacade.delete(userId)
		}

		await this.mobileContactsManager?.disableSync(credentialsAndDbKey.credentials.userId, credentialsAndDbKey.credentials.login)
	}
}
