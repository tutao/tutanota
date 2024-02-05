import { Indexer } from "../api/worker/search/Indexer.js"
import { CredentialsAndDatabaseKey } from "../misc/credentials/CredentialsProvider.js"
import { NativePushServiceApp } from "../native/main/NativePushServiceApp.js"
import { ConfigurationDatabase } from "../api/worker/facades/lazy/ConfigurationDatabase.js"
import { MobileSystemFacade } from "../native/common/generatedipc/MobileSystemFacade.js"
import { isApp } from "../api/common/Env.js"

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
		private readonly mobileSystemFacade: MobileSystemFacade | null,
	) {}

	async onCredentialsRemoved(credentialsAndDbKey: CredentialsAndDatabaseKey) {
		if (credentialsAndDbKey.databaseKey != null) {
			const { userId } = credentialsAndDbKey.credentials
			await this.indexer.deleteIndex(userId)
			await this.pushApp.invalidateAlarmsForUser(userId)
			await this.pushApp.removeUserFromNotifications(userId)
			await this.configFacade.delete(userId)
		}

		if (isApp() && this.mobileSystemFacade != null) {
			await this.mobileSystemFacade.deleteContacts(credentialsAndDbKey.credentials.login, null)
		}
	}
}
