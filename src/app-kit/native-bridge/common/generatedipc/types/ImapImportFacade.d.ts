/* generated file, don't edit. */

import { ImapMailbox } from "../types/ImapMailbox"
import { ImapSyncEventType } from "../types/AdSyncEventType"
import { ImapMailboxStatus } from "../types/ImapMailboxStatus"
import { ImapMail } from "../types/ImapMail"
import { ImapError } from "../types/ImapError"
/**
 * Facade implemented by the web worker, receiving IMAP import events.
 */
export interface ImapSyncFacade {
	/**
	 * onMailbox IMAP import event.
	 */
	onMailbox(accountSyncId: IdTuple, imapMailbox: ImapMailbox, eventType: ImapSyncEventType): Promise<void>

	/**
	 * onMailboxStatus IMAP import event.
	 */
	onMailboxStatus(accountSyncId: IdTuple, imapMailboxStatus: ImapMailboxStatus): Promise<void>

	/**
	 * onMultipleMails IMAP import event.
	 */
	onMultipleMails(accountSyncId: IdTuple, imapMails: ReadonlyArray<ImapMail>, eventType: ImapSyncEventType): Promise<void>

	/**
	 * onPostpone IMAP import event.
	 */
	onPostpone(accountSyncId: IdTuple, postponedUntil: number): Promise<void>

	/**
	 * onFinish IMAP import event.
	 */
	onFinish(accountSyncId: IdTuple, downloadedQuota: number): Promise<void>

	/**
	 * onError IMAP import event.
	 */
	onError(accountSyncId: IdTuple, imapError: ImapError): Promise<void>
}
