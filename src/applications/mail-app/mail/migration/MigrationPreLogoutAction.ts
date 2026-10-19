import { PreLogoutAction } from "../../../../app-kit/native-bridge/common/PreLogoutAction"
import { MailboxMigrationController } from "../../settings/migration/MailboxMigrationController"

export class MigrationPreLogoutAction implements PreLogoutAction {
	constructor(private readonly mailboxMigrationController: MailboxMigrationController) {}

	async onBeforeLogout(): Promise<void> {
		const activeMigrationSessionIds = this.mailboxMigrationController.activeMigrationUiSessions.map((session) => session.mailboxMigrationSyncStateId)
		for (const activeMigrationSessionId of activeMigrationSessionIds) {
			await this.mailboxMigrationController.stopLocalImport(activeMigrationSessionId)
		}
	}
}
