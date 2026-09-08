/* generated file, don't edit. */

import { MigrationMailbox } from "../types/MigrationMailbox"
import { MigrationSyncEventType } from "../types/MigrationSyncEventType"
import { MigrationMailboxStatus } from "../types/MigrationMailboxStatus"
import { MigrationMail } from "../types/MigrationMail"
import { MigrationError } from "../types/MigrationError"
/**
 * Facade implemented by the web worker, receiving Migration sync events.
 */
export interface MigrationSyncFacade {
	/**
	 * onMailbox Migration sync event.
	 */
	onMailbox(accountSyncId: IdTuple, migrationMailbox: MigrationMailbox, eventType: MigrationSyncEventType): Promise<void>

	/**
	 * onMailboxStatus Migration sync event.
	 */
	onMailboxStatus(accountSyncId: IdTuple, migrationMailboxStatus: MigrationMailboxStatus): Promise<void>

	/**
	 * onMultipleMails Migration sync event.
	 */
	onMultipleMails(accountSyncId: IdTuple, migrationMails: ReadonlyArray<MigrationMail>, eventType: MigrationSyncEventType): Promise<void>

	/**
	 * onPostpone Migration sync event.
	 */
	onPostpone(accountSyncId: IdTuple, postponedUntil: number): Promise<void>

	/**
	 * onFinish Migration sync event.
	 */
	onFinish(accountSyncId: IdTuple): Promise<void>

	/**
	 * onError Migration sync event.
	 */
	onError(accountSyncId: IdTuple, migrationError: MigrationError): Promise<void>
}
