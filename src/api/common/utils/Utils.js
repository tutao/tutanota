// @flow
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
	TooManyRequestsError
} from "../error/RestError"
import {CryptoError} from "../error/CryptoError"
import {SessionKeyNotFoundError} from "../error/SessionKeyNotFoundError"
import {SseError} from "../error/SseError"
import {ProgrammingError} from "../error/ProgrammingError"
import {RecipientsNotFoundError} from "../error/RecipientsNotFoundError"
import {RecipientNotResolvedError} from "../error/RecipientNotResolvedError"
import {OutOfSyncError} from "../error/OutOfSyncError"
import {SecondFactorPendingError} from "../error/SecondFactorPendingError"
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
import type {FeatureTypeEnum, OperationTypeEnum} from "../TutanotaConstants"

export function getWhitelabelDomain(customerInfo: CustomerInfo, domainName: ?string): ?DomainInfo {
	return customerInfo.domainInfos.find(info => info.whitelabelConfig != null && (domainName == null || info.domain === domainName))
}

export function getCustomMailDomains(customerInfo: CustomerInfo): Array<DomainInfo> {
	return customerInfo.domainInfos.filter(di => di.whitelabelConfig == null)
}

export function containsEventOfType(events: $ReadOnlyArray<EntityUpdateData>, type: OperationTypeEnum, elementId: Id): boolean {
	return events.find(event => event.operation === type && event.instanceId === elementId) != null
}

export function getEventOfType(events: $ReadOnlyArray<EntityUpdate>, type: OperationTypeEnum, elementId: Id): ?EntityUpdate {
	return events.find(event => event.operation === type && event.instanceId === elementId)
}

export function getMailBodyText(body: MailBody): string {
	return body.compressedText || body.text || ""
}

export function getMailHeaders(headers: MailHeaders): string {
	return headers.compressedHeaders || headers.headers || ""
}

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
	SecondFactorPendingError,
	ServiceUnavailableError,
	DbError,
	IndexingNotSupportedError,
	QuotaExceededError,
	CancelledError,
	FileOpenError,
	PayloadTooLargeError,
	DeviceStorageUnavailableError,
	MailBodyTooLargeError,
	Error,
	"java.net.SocketTimeoutException": ConnectionError,
	"java.net.ConnectException": ConnectionError,
	"javax.net.ssl.SSLException": ConnectionError,
	"javax.net.ssl.SSLHandshakeException": ConnectionError,
	"java.io.EOFException": ConnectionError,
	"java.net.UnknownHostException": ConnectionError,
	"java.lang.SecurityException": PermissionError,
	"java.io.FileNotFoundException": FileNotFoundError,
	"de.tutao.tutanota.CryptoError": CryptoError, // Android app exception class name
	"de.tutao.tutanota.TutCrypto": CryptoError, // iOS app crypto error domain
	"android.content.ActivityNotFoundException": FileOpenError,
	"de.tutao.tutanota.TutFileViewer": FileOpenError,
	"NSURLErrorDomain": ConnectionError,
	"de.tutao.tutanota.CredentialAuthenticationException": CredentialAuthenticationError,
	"android.security.keystore.KeyPermanentlyInvalidatedException": KeyPermanentlyInvalidatedError,
}

export function isCustomizationEnabledForCustomer(customer: Customer, feature: FeatureTypeEnum): boolean {
	return !!customer.customizations.find(customization => customization.feature === feature)
}

export function isSecurityError(e: any): boolean {
	return e instanceof DOMException && (e.name === "SecurityError" || e.code === e.SECURITY_ERR)
}

export function objToError(o: Object): Error {
	let errorType = ErrorNameToType[o.name]
	let e = (errorType != null ? new errorType(o.message) : new Error(o.message): any)
	e.name = o.name
	e.stack = o.stack || e.stack
	e.data = o.data
	return e
}