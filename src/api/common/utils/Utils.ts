//@bundleInto:common-min

import type { EntityUpdateData } from "../../main/EventController"
import type { Customer, CustomerInfo, DomainInfo, EntityUpdate } from "../../entities/sys/TypeRefs.js"
import type { Header, MailHeaders } from "../../entities/tutanota/TypeRefs.js"
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
} from "../error/RestError"
import { CryptoError } from "../error/CryptoError"
import { SessionKeyNotFoundError } from "../error/SessionKeyNotFoundError"
import { SseError } from "../error/SseError"
import { ProgrammingError } from "../error/ProgrammingError"
import { RecipientsNotFoundError } from "../error/RecipientsNotFoundError"
import { RecipientNotResolvedError } from "../error/RecipientNotResolvedError"
import { OutOfSyncError } from "../error/OutOfSyncError"
import { DbError } from "../error/DbError"
import { IndexingNotSupportedError } from "../error/IndexingNotSupportedError"
import { QuotaExceededError } from "../error/QuotaExceededError"
import { CancelledError } from "../error/CancelledError"
import { FileOpenError } from "../error/FileOpenError"
import { PermissionError } from "../error/PermissionError"
import { FileNotFoundError } from "../error/FileNotFoundError"
import { DeviceStorageUnavailableError } from "../error/DeviceStorageUnavailableError"
import { MailBodyTooLargeError } from "../error/MailBodyTooLargeError"
import { CredentialAuthenticationError } from "../error/CredentialAuthenticationError"
import { KeyPermanentlyInvalidatedError } from "../error/KeyPermanentlyInvalidatedError"
import type { FeatureType, OperationType } from "../TutanotaConstants"
import { ImportError } from "../error/ImportError"
import { WebauthnError } from "../error/WebauthnError"
import { SuspensionError } from "../error/SuspensionError.js"
import { LoginIncompleteError } from "../error/LoginIncompleteError.js"
import { OfflineDbClosedError } from "../error/OfflineDbClosedError.js"
import { ListElementEntity } from "../EntityTypes.js"
import { groupByAndMap, promiseMap, TypeRef } from "@tutao/tutanota-utils"
import { EntityClient } from "../EntityClient.js"
import { elementIdPart, listIdPart } from "./EntityUtils.js"

export function getWhitelabelDomain(customerInfo: CustomerInfo, domainName?: string): DomainInfo | null {
	return customerInfo.domainInfos.find((info) => info.whitelabelConfig != null && (domainName == null || info.domain === domainName)) ?? null
}

export function getCustomMailDomains(customerInfo: CustomerInfo): Array<DomainInfo> {
	return customerInfo.domainInfos.filter((di) => di.whitelabelConfig == null)
}

export function containsEventOfType(events: ReadonlyArray<EntityUpdateData>, type: OperationType, elementId: Id): boolean {
	return events.some((event) => event.operation === type && event.instanceId === elementId)
}

export function getEventOfType(events: ReadonlyArray<EntityUpdate>, type: OperationType, elementId: Id): EntityUpdate | null {
	return events.find((event) => event.operation === type && event.instanceId === elementId) ?? null
}

export function getLegacyMailHeaders(headers: MailHeaders): string {
	return headers.compressedHeaders ?? headers.headers ?? ""
}

export function getMailHeaders(headers: Header): string {
	return headers.compressedHeaders ?? headers.headers ?? ""
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
}

export function isCustomizationEnabledForCustomer(customer: Customer, feature: FeatureType): boolean {
	return customer.customizations.some((customization) => customization.feature === feature)
}

export function isSecurityError(e: any): boolean {
	return e instanceof DOMException && (e.name === "SecurityError" || e.code === e.SECURITY_ERR)
}

export function isNotSupportedError(e: any): boolean {
	return e instanceof DOMException && (e.name === "NotSupportedError" || e.code === e.NOT_SUPPORTED_ERR)
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

/**
 * load multiple instances of the same type concurrently from multiple lists using
 * one request per list if possible
 *
 * @returns an array of all the instances excluding the ones throwing NotFoundError or NotAuthorizedError, in arbitrary order.
 */
export async function loadMultipleFromLists<T extends ListElementEntity>(
	type: TypeRef<T>,
	entityClient: EntityClient,
	toLoad: Array<IdTuple>,
): Promise<Array<T>> {
	if (toLoad.length === 0) {
		return []
	}
	const indexedEventIds = groupByAndMap<IdTuple, Id, Id>(toLoad, listIdPart, elementIdPart)

	return (
		await promiseMap(
			indexedEventIds,
			async ([listId, elementIds]) => {
				try {
					return await entityClient.loadMultiple(type, listId, elementIds)
				} catch (e) {
					// these are thrown if the list itself is inaccessible. elements will just be missing
					// in the loadMultiple result.
					if (e instanceof NotFoundError || e instanceof NotAuthorizedError) {
						console.log(`could not load entities of type ${type} from list ${listId}: ${e.name}`)
						return []
					} else {
						throw e
					}
				}
			},
			{ concurrency: 3 },
		)
	).flat()
}
