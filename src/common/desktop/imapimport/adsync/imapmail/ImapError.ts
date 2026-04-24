// Similar to PreparationError for File Imports
export enum ImapErrorCause {
	/** The cause was somewhere not set, we do not have much information on it */
	UNKNOWN,
	/** The server returned us a response code of AUTHENTICATIONFAILED */
	AUTH_FAILED,
}

export class ImapError {
	error: any
	cause: ImapErrorCause

	constructor(error: any, cause: ImapErrorCause = ImapErrorCause.UNKNOWN) {
		this.error = error
		this.cause = cause
	}
}
