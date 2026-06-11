import { ImapMailbox } from "./ImapMailbox"
import { ImapError } from "./ImapError"

/**
 * Should either have a result or an error.
 */
export class ImapGetMailboxResult {
	result?: ReadonlyArray<ImapMailbox>
	error?: ImapError

	constructor(result?: ReadonlyArray<ImapMailbox>, error?: ImapError) {
		this.result = result
		this.error = error
	}
}
