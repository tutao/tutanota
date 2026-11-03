import { TutanotaError } from "@tutao/app-env"
import { filterInt } from "@tutao/utils"
import { Nullable, TsInt, TutanotaErrorWithData } from "@tutao/lang-api"

export class HttpClientError extends TutanotaError implements TutanotaErrorWithData<Nullable<string>> {
	public constructor(
		name: Readonly<string>,
		msg: Readonly<string>,
		public readonly data: Readonly<Nullable<string>>,
	) {
		super(name, msg)
	}
}

export class ConnectionError extends HttpClientError {
	static CODE: number = 0

	constructor(msg: string) {
		super("ConnectionError", msg, null)
	}
}

export class BadRequestError extends HttpClientError {
	static CODE: number = 400

	constructor(msg: string) {
		super("BadRequestError", msg, null)
	}
}

export class NotAuthenticatedError extends HttpClientError {
	static CODE: number = 401

	constructor(msg: string) {
		super("NotAuthenticatedError", msg, null)
	}
}

export class NotAuthorizedError extends HttpClientError {
	static CODE: number = 403

	constructor(msg: string) {
		super("NotAuthorizedError", msg, null)
	}
}

export class NotFoundError extends HttpClientError {
	static CODE: number = 404

	constructor(msg: string) {
		super("NotFoundError", msg, null)
	}
}

export class MethodNotAllowedError extends HttpClientError {
	static CODE: number = 405

	constructor(msg: string) {
		super("MethodNotAllowedError", msg, null)
	}
}

export class RequestTimeoutError extends HttpClientError {
	static CODE: number = 408

	constructor(msg: string) {
		super("RequestTimeoutError", msg, null)
	}
}

export class PreconditionFailedError extends HttpClientError {
	static CODE: number = 412

	constructor(msg: string, reason: string | null) {
		super("PreconditionFailedError", msg, reason)
	}
}

export class TooManyRequestsError extends HttpClientError {
	static CODE: number = 429

	constructor(msg: string) {
		super("TooManyRequestsError", msg, null)
	}
}

export class LockedError extends HttpClientError {
	static CODE: number = 423

	constructor(msg: string) {
		super("LockedError", msg, null)
	}
}

export class SessionExpiredError extends HttpClientError {
	static CODE: number = 440

	constructor(msg: string) {
		super("SessionExpiredError", msg, null)
	}
}

export class AccessDeactivatedError extends HttpClientError {
	static CODE: number = 470

	constructor(msg: string) {
		super("AccessDeactivatedError", msg, null)
	}
}

/** External users only, related to password changes. */
export class AccessExpiredError extends HttpClientError {
	static CODE: number = 471

	constructor(msg: string) {
		super("AccessExpiredError", msg, null)
	}
}

export class AccessBlockedError extends HttpClientError {
	static CODE: number = 472

	constructor(msg: string) {
		super("AccessBlockedError", msg, null)
	}
}

export class InvalidDataError extends HttpClientError {
	static CODE: number = 473

	constructor(msg: string) {
		super("InvalidDataError", msg, null)
	}
}

export class InvalidSoftwareVersionError extends HttpClientError {
	static CODE: number = 474

	constructor(msg: string) {
		super("InvalidSoftwareVersionError", msg, null)
	}
}

export class LimitReachedError extends HttpClientError {
	static CODE: number = 475

	constructor(msg: string) {
		super("LimitReachedError", msg, null)
	}
}

export class InternalServerError extends HttpClientError {
	static CODE: number = 500

	constructor(msg: string) {
		super("InternalServerError", msg, null)
	}
}

export class BadGatewayError extends HttpClientError {
	static CODE: number = 502

	constructor(msg: string) {
		super("BadGatewayError", msg, null)
	}
}

export class ServiceUnavailableError extends HttpClientError {
	static CODE: number = 503

	constructor(msg: string) {
		super("ServiceUnavailableError", msg, null)
	}
}

export class InsufficientStorageError extends HttpClientError {
	static CODE: number = 507

	constructor(msg: string) {
		super("InsufficientStorageError", msg, null)
	}
}

export class ResourceError extends HttpClientError {
	constructor(msg: string) {
		super("ResourceError", msg, null)
	}
}

export class PayloadTooLargeError extends HttpClientError {
	static CODE: number = 413

	constructor(msg: string) {
		super("PayloadTooLargeError", msg, null)
	}
}

export class SuspensionError extends HttpClientError {
	constructor(
		message: string,
		// milliseconds to wait
		suspensionTime: string | null,
	) {
		super("SuspensionError", message, suspensionTime)

		if (suspensionTime != null && TsInt.isNaN(filterInt(suspensionTime))) {
			throw new Error("invalid suspension time value (NaN)")
		}
	}
}
