import { MailboxMigrationFacade, MailboxMigrationInitializationParameters } from "../../../common/api/worker/facades/lazy/MailboxMigrationFacade"

export class CustomerMigrationController {
	constructor(private readonly mailboxMigrationFacade: MailboxMigrationFacade) {}

	async scheduleMigration(mailboxMigrationInitializationParameters: MailboxMigrationInitializationParameters): Promise<void> {
		return await this.mailboxMigrationFacade.scheduleMailboxMigration(mailboxMigrationInitializationParameters)
	}
}
