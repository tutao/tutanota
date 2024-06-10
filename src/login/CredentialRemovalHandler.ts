import { Indexer } from "../api/worker/search/Indexer.js"
import { NativePushServiceApp } from "../native/main/NativePushServiceApp.js"
import { ConfigurationDatabase } from "../api/worker/facades/lazy/ConfigurationDatabase.js"
import { NativeContactsSyncManager } from "../contacts/model/NativeContactsSyncManager.js"
import { CredentialsInfo } from "../native/common/generatedipc/CredentialsInfo.js"

export interface CredentialRemovalHandler {
	onCredentialsRemoved(credentialInfo: CredentialsInfo): Promise<void>
}

export class NoopCredentialRemovalHandler implements CredentialRemovalHandler {
	async onCredentialsRemoved(_: CredentialsInfo): Promise<void> {}
}

export class AppsCredentialRemovalHandler implements CredentialRemovalHandler {
	constructor(
		private readonly indexer: Indexer,
		private readonly pushApp: NativePushServiceApp,
		private readonly configFacade: ConfigurationDatabase,
		private readonly mobileContactsManager: NativeContactsSyncManager | null,
	) {}

	async onCredentialsRemoved({ login, userId }: CredentialsInfo) {
		await this.indexer.deleteIndex(userId)
		await this.pushApp.invalidateAlarmsForUser(userId)
		await this.pushApp.removeUserFromNotifications(userId)
		await this.configFacade.delete(userId)

		await this.mobileContactsManager?.disableSync(userId, login)
	}
}
