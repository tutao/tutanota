/* generated file, don't edit. */

import { LocalImportMailState } from "./LocalImportMailState.js"
/**
 * Facade implemented by the web worker, receiving events for the mail import.
 */
export interface MailImportFacade {
	/**
	 * new localImportMailState event
	 */
	onNewLocalImportMailState(localImportMailState: LocalImportMailState): Promise<void>
}
