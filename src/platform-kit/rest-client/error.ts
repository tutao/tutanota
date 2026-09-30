//@bundleInto:common-min

import { TutanotaError } from "@tutao/app-env"
import { isNotNull, Nullable } from "@tutao/utils"
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
} from "@tutao/http-client/error"

export {
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
	SuspensionError,
} from "@tutao/http-client/error"

/**
 * Attention: When adding an Error also add it in WorkerProtocol.ErrorNameToType.
 */
export function handleRestError(
	errorCode: number,
	path: Nullable<string> = null,
	errorId: Nullable<string> = null,
	precondition: Nullable<string> = null,
): TutanotaError<string | null> {
	const message = `${errorCode}: ${isNotNull(errorId) ? errorId + " " : ""}${isNotNull(precondition) ? precondition + " " : ""}${path}`

	switch (errorCode) {
		case ConnectionError.CODE:
			return new ConnectionError(message)

		case BadRequestError.CODE:
			return new BadRequestError(message)

		case NotAuthenticatedError.CODE:
			return new NotAuthenticatedError(message)

		case NotAuthorizedError.CODE:
			return new NotAuthorizedError(message)

		case NotFoundError.CODE:
			return new NotFoundError(message)

		case MethodNotAllowedError.CODE:
			return new MethodNotAllowedError(message)

		case PreconditionFailedError.CODE:
			return new PreconditionFailedError(message, precondition ?? null)

		case LockedError.CODE:
			return new LockedError(message)

		case TooManyRequestsError.CODE:
			return new TooManyRequestsError(message)

		case SessionExpiredError.CODE:
			return new SessionExpiredError(message)

		case AccessDeactivatedError.CODE:
			return new AccessDeactivatedError(message)

		case AccessExpiredError.CODE:
			return new AccessExpiredError(message)

		case AccessBlockedError.CODE:
			return new AccessBlockedError(message)

		case InvalidDataError.CODE:
			return new InvalidDataError(message)

		case InvalidSoftwareVersionError.CODE:
			return new InvalidSoftwareVersionError(message)

		case LimitReachedError.CODE:
			return new LimitReachedError(message)

		case InternalServerError.CODE:
			return new InternalServerError(message)

		case BadGatewayError.CODE:
			return new BadGatewayError(message)

		case ServiceUnavailableError.CODE:
			return new ServiceUnavailableError(message)

		case InsufficientStorageError.CODE:
			return new InsufficientStorageError(message)

		case PayloadTooLargeError.CODE:
			return new PayloadTooLargeError(message)

		case RequestTimeoutError.CODE:
			return new RequestTimeoutError(message)

		default:
			return new ResourceError(message)
	}
}

export class LoginIncompleteError extends TutanotaError {
	constructor(message: string) {
		super("LoginIncompleteError", message)
	}
}

/**
 * Checks whether {@param e} is an error that can error before we are fully logged in and connected.
 */
export function isOfflineError(e: Error): boolean {
	return e instanceof ConnectionError || e instanceof LoginIncompleteError
}

/**
 * Returns whether the error is expected for the cases where our local state might not be up-to-date with the server yet. E.g. we might be processing an update
 * for the instance that was already deleted. Normally this would be optimized away, but it might still happen due to timing.
 */
export function isExpectedErrorForSynchronization(e: Error): boolean {
	return e instanceof NotFoundError || e instanceof NotAuthorizedError
}
