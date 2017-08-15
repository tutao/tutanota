// @flow
import {TutanotaError} from "./TutanotaError"

export class BadRequestError extends TutanotaError {
	constructor(msg: string) {
		super("BadRequestError", msg)
	}
}

export class NotAuthenticatedError extends TutanotaError {
	constructor(msg: string) {
		super("NotAuthenticatedError", msg)
	}
}

export class SessionExpiredError extends TutanotaError {
	constructor(msg: string) {
		super("SessionExpiredError", msg)
	}
}

export class NotAuthorizedError extends TutanotaError {
	constructor(msg: string) {
		super("NotAuthorizedError", msg)
	}
}

export class NotFoundError extends TutanotaError {
	constructor(msg: string) {
		super("NotFoundError", msg)
	}
}

export class MethodNotAllowedError extends TutanotaError {
	constructor(msg: string) {
		super("MethodNotAllowedError", msg)
	}
}

export class PreconditionFailedError extends TutanotaError {
	constructor(msg: string) {
		super("PreconditionFailedError", msg)
	}
}

export class TooManyRequestsError extends TutanotaError {
	constructor(msg: string) {
		super("TooManyRequestsError", msg)
	}
}

export class AccessDeactivatedError extends TutanotaError {
	constructor(msg: string) {
		super("AccessDeactivatedError", msg)
	}
}

export class AccessExpiredError extends TutanotaError {
	constructor(msg: string) {
		super("AccessExpiredError", msg)
	}
}

export class AccessBlockedError extends TutanotaError {
	constructor(msg: string) {
		super("AccessBlockedError", msg)
	}
}

export class InvalidDataError extends TutanotaError {
	constructor(msg: string) {
		super("InvalidDataError", msg)
	}
}

export class InvalidSoftwareVersionError extends TutanotaError {
	constructor(msg: string) {
		super("InvalidSoftwareVersionError", msg)
	}
}

export class InsufficientStorageError extends TutanotaError {
	constructor(msg: string) {
		super("InsufficientStorageError", msg)
	}
}

export class LimitReachedError extends TutanotaError {
	constructor(msg: string) {
		super("LimitReachedError", msg)
	}
}

export class BadGatewayError extends TutanotaError {
	constructor(msg: string) {
		super("BadGatewayError", msg)
	}
}

export class ResourceError extends TutanotaError {
	constructor(msg: string) {
		super("ResourceError", msg)
	}
}

export class ConnectionError extends TutanotaError {
	constructor(msg: string) {
		super("ConnectionError", msg)
	}
}

export class InternalServerError extends TutanotaError {
	constructor(msg: string) {
		super("InternalServerError", msg)
	}
}

export class RestConstraintError extends TutanotaError {
	constructor(msg: string) {
		super("RestConstraintError", msg)
	}
}

/**
 * Attention: When adding an Error also add it in WorkerProtocol.ErrorNameToType.
 */
export function handleRestError(errorCode: number, message: string) {
	message = `${errorCode}: ${message}`
	switch (errorCode) {
		case 0:
			return new ConnectionError(message);
		case 400:
			return new BadRequestError(message);
		case 401:
			return new NotAuthenticatedError(message);
		case 403:
			return new NotAuthorizedError(message);
		case 404:
			return new NotFoundError(message);
		case 405:
			return new MethodNotAllowedError(message);
		case 412:
			return new PreconditionFailedError(message);
		case 429:
			return new TooManyRequestsError(message);
		case 440:
			return new SessionExpiredError(message);
		case 470:
			return new AccessDeactivatedError(message);
		case 471:
			return new AccessExpiredError(message);
		case 472:
			return new AccessBlockedError(message);
		case 473:
			return new InvalidDataError(message);
		case 474:
			return new InvalidSoftwareVersionError(message);
		case 475:
			return new LimitReachedError(message);
		case 500:
			return new InternalServerError(message);
		case 502:
			return new BadGatewayError(message);
		case 507:
			return new InsufficientStorageError(message);
		default:
			return new ResourceError(message);
	}
}