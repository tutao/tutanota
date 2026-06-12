import { ImapMailbox } from "./ImapMailbox"
import { ImapError } from "../../error/ImapError"

/**
 * Should either have a result or an error.
 */
export type ImapGetMailboxResult = {
	result?: ReadonlyArray<ImapMailbox>
	error?: ImapError
}
