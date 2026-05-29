//@bundleInto:common-min

// Similar to PreparationError for File Imports
import { TutanotaError } from "@tutao/app-env"

export enum ImapErrorCause {
	/** The cause was somewhere not set, we do not have much information on it */
	UNKNOWN,
	/** The server returned us a response code of AUTHENTICATIONFAILED */
	AUTH_FAILED,
	LIST_MAILBOX_FAILED,
	POSTPONE,
}

export class ImapError extends TutanotaError {
	//Uses data as variable name because otherwise objToError fails to properly create error instance with promise reject
	data: ImapErrorCause

	constructor(message: string, cause: ImapErrorCause = ImapErrorCause.UNKNOWN) {
		super("ImapError", message)
		this.data = cause
	}
}
