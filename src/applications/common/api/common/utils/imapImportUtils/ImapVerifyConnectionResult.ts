import { ImapError } from "../../error/ImapError"

/**
 * Should either have a result or an error.
 */
export type ImapVerifyConnectionResult = {
	result?: true
	error?: ImapError
}
