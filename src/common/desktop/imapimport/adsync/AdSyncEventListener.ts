//@bundleInto:common

import { ImapMailbox, ImapMailboxStatus } from "./imapmail/ImapMailbox.js"
import { ImapMail } from "./imapmail/ImapMail.js"
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

	onPostpone(postponedUntil: Date): Promise<void>

	onFinish(downloadedQuota: number): Promise<void>

	onError(imapError: ImapError): Promise<void>
}
