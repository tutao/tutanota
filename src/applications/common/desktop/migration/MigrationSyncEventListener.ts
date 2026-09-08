import { MigrationMailbox, MigrationMailboxStatus } from "../../api/common/utils/migrationImportUtils/MigrationMailbox.js"
import { MigrationMail } from "../../api/common/utils/migrationImportUtils/MigrationMail.js"
import { MigrationError } from "../../api/common/error/MigrationError.js"
import { MigrationSyncEventType } from "../../../../entities/tutanota/Utils"

export interface MigrationSyncEventListener {
	onMailbox(mailbox: MigrationMailbox, eventType: MigrationSyncEventType): Promise<void>

	onMailboxStatus(mailboxStatus: MigrationMailboxStatus): Promise<void>

	onMultipleMails(mails: MigrationMail[], eventType: MigrationSyncEventType): Promise<void>

	onPostpone(postponedUntil: number): Promise<void>

	onFinish(): Promise<void>

	onError(error: MigrationError): Promise<void>
}
