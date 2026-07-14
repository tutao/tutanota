//@bundleInto:common-min

// Similar to PreparationError for File Imports
import { TutanotaError } from "@tutao/app-env"

export enum ImapErrorCause {
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
}

export class ImapError extends TutanotaError {
	// uses data and stack as variable name because otherwise objToError fails to properly create error instance with promise reject
	data: ImapErrorCause
	stack: string

	constructor(message: string, cause: ImapErrorCause = ImapErrorCause.UNKNOWN, code: string = "") {
		super("ImapError", message)
		this.data = cause
		this.stack = code
	}
}

export function fromImapFlowError(imapFlowError: any) {
	const code: string = (imapFlowError.code ?? imapFlowError.serverResponseCode ?? "").trim()
	let cause
	switch (code) {
		case "UIDNOTSTICKY":
			cause = ImapErrorCause.PERMANENT_ERROR
			break
		case "UNAVAILABLE":
		case "SERVERBUG":
		case "OVERQUOTA":
		case "INUSE":
		case "LIMIT":
			cause = ImapErrorCause.POSTPONE
			break
		case "AUTHORIZATIONFAILED":
		case "CONTACTADMIN":
		case "NOPERM":
			cause = ImapErrorCause.AUTH_FAILED
			break
		case "AUTHENTICATIONFAILED":
			cause = ImapErrorCause.AUTH_FAILED
			break
		case "PRIVACYREQUIRED":
			cause = ImapErrorCause.INITIAL_CONNECT_FAILED
			break
		case "ERR_TLS_CERT_ALTNAME_INVALID":
		case "DEPTH_ZERO_SELF_SIGNED_CERT":
		case "UNABLE_TO_VERIFY_LEAF_SIGNATURE":
			cause = ImapErrorCause.CERT_ERROR
			break
		case "ENOTFOUND":
			cause = ImapErrorCause.HOST_NOT_FOUND
			break
		case "EHOSTUNREACH":
			cause = ImapErrorCause.HOST_NOT_REACHABLE
			break
		default:
			cause = ImapErrorCause.UNKNOWN
			console.warn("Unknown IMAP error code: " + code)
			break
	}
	return new ImapError(imapFlowError.message, cause, code)
}
