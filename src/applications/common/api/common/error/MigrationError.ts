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

export function fromImapFlowError(imapFlowError: any) {
	const code: string = (imapFlowError.code ?? imapFlowError.serverResponseCode ?? "").trim()
	let cause
	switch (code) {
		case "UIDNOTSTICKY":
			cause = MigrationErrorCause.PERMANENT_ERROR
			break
		case "UNAVAILABLE":
		case "SERVERBUG":
		case "OVERQUOTA":
		case "INUSE":
		case "LIMIT":
			cause = MigrationErrorCause.POSTPONE
			break
		case "AUTHORIZATIONFAILED":
		case "CONTACTADMIN":
		case "NOPERM":
			cause = MigrationErrorCause.AUTH_FAILED
			break
		case "AUTHENTICATIONFAILED":
			cause = MigrationErrorCause.AUTH_FAILED
			break
		case "PRIVACYREQUIRED":
			cause = MigrationErrorCause.INITIAL_CONNECT_FAILED
			break
		case "ERR_TLS_CERT_ALTNAME_INVALID":
		case "DEPTH_ZERO_SELF_SIGNED_CERT":
		case "UNABLE_TO_VERIFY_LEAF_SIGNATURE":
			cause = MigrationErrorCause.CERT_ERROR
			break
		case "ENOTFOUND":
			cause = MigrationErrorCause.HOST_NOT_FOUND
			break
		case "EHOSTUNREACH":
			cause = MigrationErrorCause.HOST_NOT_REACHABLE
			break
		case "GREETING_TIMEOUT":
			cause = MigrationErrorCause.GREETING_TIMEOUT
			break
		default:
			if (imapFlowError.authenticationFailed) {
				cause = MigrationErrorCause.AUTH_FAILED
				return new MigrationError(imapFlowError.message, cause, "AUTHENTICATIONFAILED")
			} else {
				cause = MigrationErrorCause.UNKNOWN
				console.warn("Unknown IMAP error code: " + code)
			}
			break
	}
	return new MigrationError(imapFlowError.message, cause, code)
}
