//@bundleInto:common-min

// Similar to PreparationError for File Imports
import { TutanotaError } from "@tutao/app-env"

export enum MigrationErrorCause {
	/** The cause was somewhere not set, we do not have much information on it */
	UNKNOWN,
	INITIAL_CONNECT_FAILED,
	/** The server returned us a response code of AUTHENTICATIONFAILED */
	AUTH_FAILED,
	POSTPONE,
	PERMANENT_ERROR,
	HOST_NOT_FOUND,
	CERT_ERROR,
	HOST_NOT_REACHABLE,
	GMAIL_ALL_MAILS_IMAP_DISABLED,
	GREETING_TIMEOUT,
}

export type MigrationErrorData = {
	cause: MigrationErrorCause
	code: string
}

export class MigrationError extends TutanotaError<MigrationErrorData> {
	data: MigrationErrorData

	constructor(message: string, cause: MigrationErrorCause = MigrationErrorCause.UNKNOWN, code: string = "") {
		super("MigrationError", message)
		this.data = { cause, code }
	}
}
