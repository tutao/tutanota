import { ImapMailbox, ImapMailboxStatus } from "../../../api/common/utils/imapImportUtils/ImapMailbox.js"
import { ImapMail } from "../../../api/common/utils/imapImportUtils/ImapMail.js"
import { ImapError } from "../../../api/common/error/ImapError.js"
import { ImapSyncEventType } from "../../../../../entities/tutanota/Utils"

export interface ImapSyncEventListener {
	onMailbox(imapMailbox: ImapMailbox, eventType: ImapSyncEventType): Promise<void>

	onMailboxStatus(imapMailboxStatus: ImapMailboxStatus): Promise<void>

	onMultipleMails(imapMails: ImapMail[], eventType: ImapSyncEventType): Promise<void>

	onPostpone(postponedUntil: number): Promise<void>

	onFinish(): Promise<void>

	onError(imapError: ImapError): Promise<void>
}
