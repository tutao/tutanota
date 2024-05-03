import { Indexer } from "../api/worker/search/Indexer.js"
import { CredentialsAndDatabaseKey } from "../misc/credentials/CredentialsProvider.js"
import { NativePushServiceApp } from "../native/main/NativePushServiceApp.js"
import { ConfigurationDatabase } from "../api/worker/facades/lazy/ConfigurationDatabase.js"
import { MobileContactsFacade } from "../native/common/generatedipc/MobileContactsFacade.js"
import { ofClass } from "@tutao/tutanota-utils"
import { PermissionError } from "../api/common/error/PermissionError.js"
import { DeviceConfig } from "../misc/DeviceConfig.js"

export interface CredentialRemovalHandler {
	onCredentialsRemoved(credentialsAndDbKey: CredentialsAndDatabaseKey): Promise<void>
}

export class NoopCredentialRemovalHandler implements CredentialRemovalHandler {
	async onCredentialsRemoved(credentialsAndDbKey: CredentialsAndDatabaseKey): Promise<void> {}
}

export class AppsCredentialRemovalHandler implements CredentialRemovalHandler {
	constructor(
		private readonly configs: DeviceConfig,
		private readonly indexer: Indexer,
		private readonly pushApp: NativePushServiceApp,
		private readonly configFacade: ConfigurationDatabase,
		private readonly mobileContactsFacade: MobileContactsFacade | null,
	) {}

	async onCredentialsRemoved(credentialsAndDbKey: CredentialsAndDatabaseKey) {
		if (credentialsAndDbKey.databaseKey != null) {
			const { userId } = credentialsAndDbKey.credentials
			await this.indexer.deleteIndex(userId)
			await this.pushApp.invalidateAlarmsForUser(userId)
			await this.pushApp.removeUserFromNotifications(userId)
			await this.configFacade.delete(userId)
		}

		if (this.configs.getUserSyncContactsWithPhonePreference(credentialsAndDbKey.credentials.userId)) {
			await this.mobileContactsFacade
				?.deleteContacts(credentialsAndDbKey.credentials.login, null)
				.catch(ofClass(PermissionError, (e) => console.log("No permission to clear contacts", e)))
		}
	}
}
