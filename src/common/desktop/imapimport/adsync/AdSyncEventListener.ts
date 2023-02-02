//@bundleInto:common

import { ImapMailbox, ImapMailboxStatus } from "../../../api/common/utils/imapImportUtils/ImapMailbox.js"
import { ImapMail } from "../../../api/common/utils/imapImportUtils/ImapMail.js"
import { ImapError } from "./imapmail/ImapError.js"

export enum AdSyncEventType {
	CREATE,
	UPDATE,
	DELETE,
}

export interface AdSyncEventListener {
	onMailbox(imapMailbox: ImapMailbox, eventType: AdSyncEventType): Promise<void>

	onMailboxStatus(imapMailboxStatus: ImapMailboxStatus): Promise<void>

	onMail(imapMail: ImapMail, eventType: AdSyncEventType): Promise<void>

	onMultipleMails(imapMails: ImapMail[], eventType: AdSyncEventType): Promise<void>

	onPostpone(postponedUntil: number): Promise<void>

	onFinish(downloadedQuota: number): Promise<void>

	onError(imapError: ImapError): Promise<void>
}
