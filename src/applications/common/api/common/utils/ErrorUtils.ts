// @bundleInto:common

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
	LoginIncompleteError,
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
} from "@tutao/rest-client/error"
import { SuspensionError } from "../error/SuspensionError.js"
import { CryptoError, SessionKeyNotFoundError } from "@tutao/crypto/error"
import { SseError } from "../error/SseError.js"
import { CancelledError, InvalidModelError, ProgrammingError } from "@tutao/app-env"
import { RecipientsNotFoundError } from "../../../../../platform-kit/network/error/RecipientsNotFoundError.js"
import { RecipientNotResolvedError } from "../../../../../platform-kit/network/error/RecipientNotResolvedError.js"
import { OfflineDbClosedError } from "../error/OfflineDbClosedError.js"
import { OutOfSyncError } from "../../../../../platform-kit/app-env/OutOfSyncError.js"
import { DbError } from "../error/DbError.js"
import { IndexingNotSupportedError } from "../error/IndexingNotSupportedError.js"
import { QuotaExceededError } from "../error/QuotaExceededError.js"
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
import { KeyVerificationMismatchError } from "../../../../../platform-kit/network/error/KeyVerificationMismatchError"
import { ServerModelsUnavailableError } from "../../../../../platform-kit/instance-pipeline/ServerModelsUnavailableError"
import { AppLockAuthenticationError } from "../error/AppLockAuthenticationError"
import { MoveCycleError } from "../error/MoveCycleError"
import { MoveToTrashError } from "../error/MoveToTrashError"
import { MoveDestinationIsSourceError } from "../error/MoveDestinationIsSourceError"

// If importing fails it is a good idea to adjust the chunking to bundle the error into common

/**
 * This maps the errors from their names to their constructors.
 * This is needed generally when errors cross IPC boundaries and more specifically when we want to map native errors to
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
	ServerModelsUnavailableError,
	InvalidModelError,
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
	"java.net.SocketTimeoutException": ConnectionError,
	"java.net.SocketException": ConnectionError,
	"java.net.ConnectException": ConnectionError,
	"javax.net.ssl.SSLException": ConnectionError,
	"javax.net.ssl.SSLHandshakeException": ConnectionError,
	"java.io.EOFException": ConnectionError,
	"java.net.UnknownHostException": ConnectionError,
	"java.lang.SecurityException": PermissionError,
	"java.io.FileNotFoundException": FileNotFoundError,
	"de.tutao.tutashared.CryptoError": CryptoError,
	// Android app exception class name
	"de.tutao.tutashared.TutCrypto": CryptoError,
	// iOS app crypto error domain
	"android.content.ActivityNotFoundException": FileOpenError,
	"de.tutao.tutashared.TutFileViewer": FileOpenError,
	NSURLErrorDomain: ConnectionError,
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
