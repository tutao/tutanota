// @bundleInto:common

import { downcast } from "@tutao/tutanota-utils"
import { Entity } from "../EntityTypes"
import {
	AccessBlockedError,
	AccessDeactivatedError,
	AccessExpiredError,
	BadGatewayError,
	BadRequestError,
	ConnectionError,
	InsufficientStorageError,
	InternalServerError,
	InvalidDataError,
	InvalidSoftwareVersionError,
	LimitReachedError,
	LockedError,
	MethodNotAllowedError,
	NotAuthenticatedError,
	NotAuthorizedError,
	NotFoundError,
	PayloadTooLargeError,
	PreconditionFailedError,
	RequestTimeoutError,
	ResourceError,
	ServiceUnavailableError,
	SessionExpiredError,
	TooManyRequestsError,
} from "../error/RestError.js"
import { SuspensionError } from "../error/SuspensionError.js"
import { LoginIncompleteError } from "../error/LoginIncompleteError.js"
import { CryptoError } from "@tutao/tutanota-crypto/error.js"
import { SessionKeyNotFoundError } from "../error/SessionKeyNotFoundError.js"
import { SseError } from "../error/SseError.js"
import { ProgrammingError } from "../error/ProgrammingError.js"
import { RecipientsNotFoundError } from "../error/RecipientsNotFoundError.js"
import { RecipientNotResolvedError } from "../error/RecipientNotResolvedError.js"
import { OfflineDbClosedError } from "../error/OfflineDbClosedError.js"
import { OutOfSyncError } from "../error/OutOfSyncError.js"
import { DbError } from "../error/DbError.js"
import { IndexingNotSupportedError } from "../error/IndexingNotSupportedError.js"
import { QuotaExceededError } from "../error/QuotaExceededError.js"
import { CancelledError } from "../error/CancelledError.js"
import { FileOpenError } from "../error/FileOpenError.js"
import { DeviceStorageUnavailableError } from "../error/DeviceStorageUnavailableError.js"
import { MailBodyTooLargeError } from "../error/MailBodyTooLargeError.js"
import { ImportError } from "../error/ImportError.js"
import { WebauthnError } from "../error/WebauthnError.js"
import { PermissionError } from "../error/PermissionError.js"
import { FileNotFoundError } from "../error/FileNotFoundError.js"
import { CredentialAuthenticationError } from "../error/CredentialAuthenticationError.js"
import { KeyPermanentlyInvalidatedError } from "../error/KeyPermanentlyInvalidatedError.js"
import { ParserError } from "../../../misc/parsing/ParserCombinator.js"
import { ContactStoreError } from "../error/ContactStoreError.js"
import { MobilePaymentError } from "../error/MobilePaymentError"

/**
 * Checks if the given instance has an error in the _errors property which is usually written
 * if decryption fails for some reason in InstanceMapper.
 * @param instance the instance to check for errors.
 * @param key only returns true if there is an error for this key. Other errors will be ignored if the key is defined.
 * @returns {boolean} true if error was found (for the given key).
 */
export function hasError<K>(instance: Entity, key?: K): boolean {
	const downCastedInstance = downcast(instance)
	return !instance || (!!downCastedInstance._errors && (!key || !!downCastedInstance._errors.key))
}

//If importing fails it is a good idea to bundle the error into common-min which can be achieved by annotating the module with "<at>bundleInto:common-min"
/**
 * Checks whether {@param e} is an error that can error before we are fully logged in and connected.
 */
export function isOfflineError(e: Error) {
	return e instanceof ConnectionError || e instanceof LoginIncompleteError
}

// If importing fails it is a good idea to adjust the chunking to bundle the error into common

/**
 * This maps the errors from their names to their constructors.
 * This is needed generally when errros cross IPC boundaries and more specifically when we want to map native errors to
 * our error classes.
 *
 * All errors that cross IPC boundaries should be added here.
 */
const ErrorNameToType = {
	ConnectionError,
	BadRequestError,
	NotAuthenticatedError,
	SessionExpiredError,
	NotAuthorizedError,
	NotFoundError,
	MethodNotAllowedError,
	PreconditionFailedError,
	LockedError,
	TooManyRequestsError,
	AccessDeactivatedError,
	AccessExpiredError,
	AccessBlockedError,
	InvalidDataError,
	InvalidSoftwareVersionError,
	LimitReachedError,
	InternalServerError,
	BadGatewayError,
	ResourceError,
	RequestTimeoutError,
	InsufficientStorageError,
	CryptoError,
	SessionKeyNotFoundError,
	SseError,
	ProgrammingError,
	RecipientsNotFoundError,
	RecipientNotResolvedError,
	OfflineDbClosedError,
	OutOfSyncError,
	ServiceUnavailableError,
	DbError,
	IndexingNotSupportedError,
	QuotaExceededError,
	CancelledError,
	FileOpenError,
	PayloadTooLargeError,
	DeviceStorageUnavailableError,
	MailBodyTooLargeError,
	ImportError,
	WebauthnError,
	SuspensionError,
	LoginIncompleteError,
	ParserError,
	KeyPermanentlyInvalidatedError,
	Error,
	"java.net.SocketTimeoutException": ConnectionError,
	"java.net.SocketException": ConnectionError,
	"java.net.ConnectException": ConnectionError,
	"javax.net.ssl.SSLException": ConnectionError,
	"javax.net.ssl.SSLHandshakeException": ConnectionError,
	"java.io.EOFException": ConnectionError,
	"java.net.UnknownHostException": ConnectionError,
	"java.lang.SecurityException": PermissionError,
	"java.io.FileNotFoundException": FileNotFoundError,
	"de.tutao.tutanota.CryptoError": CryptoError,
	// Android app exception class name
	"de.tutao.tutanota.TutCrypto": CryptoError,
	// iOS app crypto error domain
	"android.content.ActivityNotFoundException": FileOpenError,
	"de.tutao.tutanota.TutFileViewer": FileOpenError,
	NSURLErrorDomain: ConnectionError,
	"de.tutao.tutanota.CredentialAuthenticationException": CredentialAuthenticationError,
	"android.security.keystore.KeyPermanentlyInvalidatedException": KeyPermanentlyInvalidatedError,
	"de.tutao.tutanota.KeyPermanentlyInvalidatedError": KeyPermanentlyInvalidatedError,
	"de.tutao.tutanota.CredentialAuthenticationError": CredentialAuthenticationError,
	"de.tutao.tutanota.offline.OfflineDbClosedError": OfflineDbClosedError,
	"de.tutao.tutanota.CancelledError": CancelledError,
	"de.tutao.tutanota.webauthn.WebauthnError": WebauthnError,
	"de.tutao.tutanota.Webauthn": WebauthnError,
	"de.tutao.tutanota.PermissionError": PermissionError,
	"de.tutao.ContactStoreError": ContactStoreError,
	"de.tutao.tutanota.MobilePayment": MobilePaymentError,
}

export function isSecurityError(e: any): boolean {
	return e instanceof DOMException && (e.name === "SecurityError" || e.code === e.SECURITY_ERR)
}

export function isNotSupportedError(e: any): boolean {
	return e instanceof DOMException && (e.name === "NotSupportedError" || e.code === e.NOT_SUPPORTED_ERR)
}

/**
 * Convert a plain object to a class matching it's {@code name} field.
 */
export function objToError(o: Record<string, any>): Error {
	// @ts-ignore
	let errorType = ErrorNameToType[o.name]
	let e = (errorType != null ? new errorType(o.message) : new Error(o.message)) as any
	e.name = o.name
	e.stack = o.stack || e.stack
	e.data = o.data
	return e
}
