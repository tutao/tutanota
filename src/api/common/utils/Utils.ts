//@bundleInto:common-min

import type {EntityUpdateData} from "../../main/EventController"
import type {CustomerInfo} from "../../entities/sys/CustomerInfo"
import type {EntityUpdate} from "../../entities/sys/EntityUpdate"
import type {MailBody} from "../../entities/tutanota/MailBody"
import type {MailHeaders} from "../../entities/tutanota/MailHeaders"
import type {DomainInfo} from "../../entities/sys/DomainInfo"
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
	ResourceError,
	ServiceUnavailableError,
	SessionExpiredError,
	TooManyRequestsError,
} from "../error/RestError"
import {CryptoError} from "../error/CryptoError"
import {SessionKeyNotFoundError} from "../error/SessionKeyNotFoundError"
import {SseError} from "../error/SseError"
import {ProgrammingError} from "../error/ProgrammingError"
import {RecipientsNotFoundError} from "../error/RecipientsNotFoundError"
import {RecipientNotResolvedError} from "../error/RecipientNotResolvedError"
import {OutOfSyncError} from "../error/OutOfSyncError"
import {DbError} from "../error/DbError"
import {IndexingNotSupportedError} from "../error/IndexingNotSupportedError"
import {QuotaExceededError} from "../error/QuotaExceededError"
import {CancelledError} from "../error/CancelledError"
import {FileOpenError} from "../error/FileOpenError"
import {PermissionError} from "../error/PermissionError"
import {FileNotFoundError} from "../error/FileNotFoundError"
import type {Customer} from "../../entities/sys/Customer"
import {DeviceStorageUnavailableError} from "../error/DeviceStorageUnavailableError"
import {MailBodyTooLargeError} from "../error/MailBodyTooLargeError"
import {CredentialAuthenticationError} from "../error/CredentialAuthenticationError"
import {KeyPermanentlyInvalidatedError} from "../error/KeyPermanentlyInvalidatedError"
import type {FeatureType, OperationType} from "../TutanotaConstants"
import {ImportError} from "../error/ImportError"
import {WebauthnError} from "../error/WebauthnError"

export function getWhitelabelDomain(customerInfo: CustomerInfo, domainName?: string): DomainInfo | null {
	return customerInfo.domainInfos.find(info => info.whitelabelConfig != null && (domainName == null || info.domain === domainName)) ?? null
}

export function getCustomMailDomains(customerInfo: CustomerInfo): Array<DomainInfo> {
	return customerInfo.domainInfos.filter(di => di.whitelabelConfig == null)
}

export function containsEventOfType(events: ReadonlyArray<EntityUpdateData>, type: OperationType, elementId: Id): boolean {
	return events.find(event => event.operation === type && event.instanceId === elementId) != null
}

export function getEventOfType(events: ReadonlyArray<EntityUpdate>, type: OperationType, elementId: Id): EntityUpdate | null {
	return events.find(event => event.operation === type && event.instanceId === elementId) ?? null
}

export function getMailBodyText(body: MailBody): string {
	return body.compressedText || body.text || ""
}

export function getMailHeaders(headers: MailHeaders): string {
	return headers.compressedHeaders || headers.headers || ""
}

//If importing fails it is a good idea to bundle the error into common-min which can be achieved by annotating the module with "@bundleInto:common-min"
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
	InsufficientStorageError,
	CryptoError,
	SessionKeyNotFoundError,
	SseError,
	ProgrammingError,
	RecipientsNotFoundError,
	RecipientNotResolvedError,
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
	Error,
	"java.net.SocketTimeoutException": ConnectionError,
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
}

export function isCustomizationEnabledForCustomer(customer: Customer, feature: FeatureType): boolean {
	return !!customer.customizations.find(customization => customization.feature === feature)
}

export function isSecurityError(e: any): boolean {
	return e instanceof DOMException && (e.name === "SecurityError" || e.code === e.SECURITY_ERR)
}

export function objToError(o: Record<string, any>): Error {
	// @ts-ignore
	let errorType = ErrorNameToType[o.name]
	let e = (errorType != null ? new errorType(o.message) : new Error(o.message)) as any
	e.name = o.name
	e.stack = o.stack || e.stack
	e.data = o.data
	return e
}