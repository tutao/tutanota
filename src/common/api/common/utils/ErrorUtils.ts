// @bundleInto:common

import { restError } from "@tutao/rest-client"
import { SuspensionError } from "../error/SuspensionError.js"
import { LoginIncompleteError } from "../error/LoginIncompleteError.js"
import { CryptoError, SessionKeyNotFoundError } from "@tutao/crypto/error"
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
import { MailImportError } from "../error/MailImportError.js"
import { ExportError } from "../error/ExportError"
import { KeyVerificationMismatchError } from "../error/KeyVerificationMismatchError"
import { ServerModelsUnavailableError } from "../error/ServerModelsUnavailableError"
import { AppLockAuthenticationError } from "../error/AppLockAuthenticationError"
import { InvalidModelError } from "@tutao/app-env"
import { MoveCycleError } from "../error/MoveCycleError"
import { MoveToTrashError } from "../error/MoveToTrashError"
import { MoveDestinationIsSourceError } from "../error/MoveDestinationIsSourceError"

//If importing fails it is a good idea to bundle the error into common-min which can be achieved by annotating the module with "<at>bundleInto:common-min"
/**
 * Checks whether {@param e} is an error that can error before we are fully logged in and connected.
 */
export function isOfflineError(e: Error): boolean {
	return e instanceof restError.ConnectionError || e instanceof LoginIncompleteError
}

// If importing fails it is a good idea to adjust the chunking to bundle the error into common

/**
 * This maps the errors from their names to their constructors.
 * This is needed generally when errors cross IPC boundaries and more specifically when we want to map native errors to
 * our error classes.
 *
 * All errors that cross IPC boundaries should be added here.
 */
const ErrorNameToType = {
	ConnectionError: restError.ConnectionError,
	BadRequestError: restError.BadRequestError,
	NotAuthenticatedError: restError.NotAuthenticatedError,
	SessionExpiredError: restError.SessionExpiredError,
	NotAuthorizedError: restError.NotAuthorizedError,
	NotFoundError: restError.NotFoundError,
	MethodNotAllowedError: restError.MethodNotAllowedError,
	PreconditionFailedError: restError.PreconditionFailedError,
	LockedError: restError.LockedError,
	TooManyRequestsError: restError.TooManyRequestsError,
	AccessDeactivatedError: restError.AccessDeactivatedError,
	AccessExpiredError: restError.AccessExpiredError,
	AccessBlockedError: restError.TooManyRequestsError,
	InvalidDataError: restError.TooManyRequestsError,
	InvalidSoftwareVersionError: restError.TooManyRequestsError,
	LimitReachedError: restError.TooManyRequestsError,
	InternalServerError: restError.TooManyRequestsError,
	BadGatewayError: restError.TooManyRequestsError,
	ResourceError: restError.TooManyRequestsError,
	RequestTimeoutError: restError.RequestTimeoutError,
	InsufficientStorageError: restError.TooManyRequestsError,
	CryptoError,
	SessionKeyNotFoundError,
	SseError,
	ProgrammingError,
	RecipientsNotFoundError,
	RecipientNotResolvedError,
	OfflineDbClosedError,
	ServerModelsUnavailableError,
	InvalidModelError,
	OutOfSyncError,
	ServiceUnavailableError: restError.TooManyRequestsError,
	DbError,
	IndexingNotSupportedError,
	QuotaExceededError,
	CancelledError,
	FileOpenError,
	PayloadTooLargeError: restError.TooManyRequestsError,
	DeviceStorageUnavailableError,
	MailBodyTooLargeError,
	ImportError,
	ExportError,
	WebauthnError,
	SuspensionError,
	LoginIncompleteError,
	ParserError,
	KeyPermanentlyInvalidatedError,
	MailImportError,
	KeyVerificationMismatchError,
	MoveCycleError,
	MoveToTrashError,
	MoveDestinationIsSourceError,
	Error,
	"java.net.SocketTimeoutException": restError.ConnectionError,
	"java.net.SocketException": restError.ConnectionError,
	"java.net.ConnectException": restError.ConnectionError,
	"javax.net.ssl.SSLException": restError.ConnectionError,
	"javax.net.ssl.SSLHandshakeException": restError.ConnectionError,
	"java.io.EOFException": restError.ConnectionError,
	"java.net.UnknownHostException": restError.ConnectionError,
	"java.lang.SecurityException": PermissionError,
	"java.io.FileNotFoundException": FileNotFoundError,
	"de.tutao.tutashared.CryptoError": CryptoError,
	// Android app exception class name
	"de.tutao.tutashared.TutCrypto": CryptoError,
	// iOS app crypto error domain
	"android.content.ActivityNotFoundException": FileOpenError,
	"de.tutao.tutashared.TutFileViewer": FileOpenError,
	NSURLErrorDomain: restError.ConnectionError,
	NSCocoaErrorDomain: Error,
	"de.tutao.tutashared.CredentialAuthenticationException": CredentialAuthenticationError,
	"de.tutao.tutashared.AppLockAuthenticationException": AppLockAuthenticationError,
	"android.security.keystore.KeyPermanentlyInvalidatedException": KeyPermanentlyInvalidatedError,
	"de.tutao.tutashared.KeyPermanentlyInvalidatedError": KeyPermanentlyInvalidatedError,
	"de.tutao.tutashared.CredentialAuthenticationError": CredentialAuthenticationError,
	"de.tutao.tutashared.offline.OfflineDbClosedError": OfflineDbClosedError,
	"de.tutao.tutashared.CancelledError": CancelledError,
	"de.tutao.tutanota.webauthn.WebauthnError": WebauthnError,
	"de.tutao.tutanota.Webauthn": WebauthnError,
	"de.tutao.tutashared.PermissionError": PermissionError,
	"de.tutao.tutashared.ContactStoreError": ContactStoreError,
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

/**
 * Returns whether the error is expected for the cases where our local state might not be up-to-date with the server yet. E.g. we might be processing an update
 * for the instance that was already deleted. Normally this would be optimized away, but it might still happen due to timing.
 */
export function isExpectedErrorForSynchronization(e: Error): boolean {
	return e instanceof restError.NotFoundError || e instanceof restError.NotAuthorizedError
}
