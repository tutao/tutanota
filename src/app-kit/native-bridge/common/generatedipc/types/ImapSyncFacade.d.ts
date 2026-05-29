/* generated file, don't edit. */

import { ImapMailbox } from "../types/ImapMailbox"
import { ImapSyncEventType } from "../types/ImapSyncEventType"
import { ImapMailboxStatus } from "../types/ImapMailboxStatus"
import { ImapMail } from "../types/ImapMail"
import { ImapError } from "../types/ImapError"
/**
 * Facade implemented by the web worker, receiving IMAP sync events.
 */
export interface ImapSyncFacade {
	/**
	 * onMailbox IMAP sync event.
	 */
	onMailbox(accountSyncId: IdTuple, imapMailbox: ImapMailbox, eventType: ImapSyncEventType): Promise<void>

	/**
	 * onMailboxStatus IMAP sync event.
	 */
	onMailboxStatus(accountSyncId: IdTuple, imapMailboxStatus: ImapMailboxStatus): Promise<void>

	/**
	 * onMultipleMails IMAP sync event.
	 */
	onMultipleMails(accountSyncId: IdTuple, imapMails: ReadonlyArray<ImapMail>, eventType: ImapSyncEventType): Promise<void>

	/**
	 * onPostpone IMAP sync event.
	 */
	onPostpone(accountSyncId: IdTuple, postponedUntil: number): Promise<void>

	/**
	 * onFinish IMAP sync event.
	 */
	onFinish(accountSyncId: IdTuple): Promise<void>

	/**
	 * onError IMAP sync event.
	 */
	onError(accountSyncId: IdTuple, imapError: ImapError): Promise<void>
}
