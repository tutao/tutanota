/* generated file, don't edit. */

import { ImapMailbox } from "./ImapMailbox.js"
import { AdSyncEventType } from "./AdSyncEventType.js"
import { ImapMailboxStatus } from "./ImapMailboxStatus.js"
import { ImapMail } from "./ImapMail.js"
import { ImapError } from "./ImapError.js"
/**
 * Facade implemented by the web worker, receiving IMAP import events.
 */
export interface ImapImportFacade {
	/**
	 * onMailbox IMAP import event.
	 */
	onMailbox(imapMailbox: ImapMailbox, eventType: AdSyncEventType): Promise<void>

	/**
	 * onMailboxStatus IMAP import event.
	 */
	onMailboxStatus(imapMailboxStatus: ImapMailboxStatus): Promise<void>

	/**
	 * onMail IMAP import event.
	 */
	onMail(imapMail: ImapMail, eventType: AdSyncEventType): Promise<void>

	/**
	 * onPostpone IMAP import event.
	 */
	onPostpone(postponedUntil: Date): Promise<void>

	/**
	 * onFinish IMAP import event.
	 */
	onFinish(downloadedQuota: number): Promise<void>

	/**
	 * onError IMAP import event.
	 */
	onError(imapError: ImapError): Promise<void>
}
