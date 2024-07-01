import o from "@tutao/otest"
import {
	AccessBlockedError,
	AccessDeactivatedError,
	AccessExpiredError,
	BadGatewayError,
	BadRequestError,
	ConnectionError,
	handleRestError,
	InternalServerError,
	InvalidDataError,
	InvalidSoftwareVersionError,
	LimitReachedError,
	LockedError,
	MethodNotAllowedError,
	NotAuthenticatedError,
	NotAuthorizedError,
	NotFoundError,
	PreconditionFailedError,
	ResourceError,
	SessionExpiredError,
	TooManyRequestsError,
} from "../../../../../src/common/api/common/error/RestError.js"
import { TutanotaError } from "@tutao/tutanota-error"

o.spec("RestErrorTest", function () {
	o("handleRestError should create the correct error classes", () => {
		o(handleRestError(400) instanceof BadRequestError).equals(true)
		o(handleRestError(401) instanceof NotAuthenticatedError).equals(true)
		o(handleRestError(403) instanceof NotAuthorizedError).equals(true)
		o(handleRestError(404) instanceof NotFoundError).equals(true)
		o(handleRestError(405) instanceof MethodNotAllowedError).equals(true)
		o(handleRestError(412) instanceof PreconditionFailedError).equals(true)
		o(handleRestError(423) instanceof LockedError).equals(true)
		o(handleRestError(429) instanceof TooManyRequestsError).equals(true)
		o(handleRestError(440) instanceof SessionExpiredError).equals(true)
		o(handleRestError(470) instanceof AccessDeactivatedError).equals(true)
		o(handleRestError(471) instanceof AccessExpiredError).equals(true)
		o(handleRestError(472) instanceof AccessBlockedError).equals(true)
		o(handleRestError(473) instanceof InvalidDataError).equals(true)
		o(handleRestError(474) instanceof InvalidSoftwareVersionError).equals(true)
		o(handleRestError(475) instanceof LimitReachedError).equals(true)
		o(handleRestError(500) instanceof InternalServerError).equals(true)
		o(handleRestError(502) instanceof BadGatewayError).equals(true)
		let resourceError = handleRestError(123, "/path", "errorId")
		o(resourceError instanceof ResourceError).equals(true)
		o(resourceError.message).equals("123: errorId /path")
	})
	o("handleRestError should correctly initialize PreconditionFailedError class", () => {
		const preconditionFailedError = handleRestError(412, "/path", null, "reason") as PreconditionFailedError
		o(preconditionFailedError.data).equals("reason")
		o(preconditionFailedError.message).equals("412: reason /path")
	})

	function createErrorTest(type, name, message) {
		o(`error ${name} should have correct message and type`, () => {
			o(new type().name).equals(name)
			o(new type(message).message).equals(message)(`expected message '${message}' for ${name} but was '${new type().message}'`)
			o(new type() instanceof type).equals(true)
			o(new type() instanceof TutanotaError).equals(true)
			let thrown = false

			try {
				throw new type()
			} catch (e) {
				thrown = true
			}

			o(thrown).equals(true)(`throws ${type}`)
		})
	}

	createErrorTest(BadRequestError, "BadRequestError", 400)
	createErrorTest(NotAuthenticatedError, "NotAuthenticatedError", 401)
	createErrorTest(NotAuthorizedError, "NotAuthorizedError", 403)
	createErrorTest(MethodNotAllowedError, "MethodNotAllowedError", 405)
	createErrorTest(NotFoundError, "NotFoundError", 404)
	createErrorTest(PreconditionFailedError, "PreconditionFailedError", 412)
	createErrorTest(LockedError, "LockedError", 423)
	createErrorTest(TooManyRequestsError, "TooManyRequestsError", 429)
	createErrorTest(SessionExpiredError, "SessionExpiredError", 440)
	createErrorTest(AccessDeactivatedError, "AccessDeactivatedError", 470)
	createErrorTest(AccessExpiredError, "AccessExpiredError", 471)
	createErrorTest(AccessBlockedError, "AccessBlockedError", 472)
	createErrorTest(InvalidDataError, "InvalidDataError", 473)
	createErrorTest(InvalidSoftwareVersionError, "InvalidSoftwareVersionError", 474)
	createErrorTest(LimitReachedError, "LimitReachedError", 475)
	createErrorTest(InternalServerError, "InternalServerError", 500)
	createErrorTest(BadGatewayError, "BadGatewayError", 502)
	createErrorTest(ResourceError, "ResourceError", undefined)
	createErrorTest(ConnectionError, "ConnectionError", undefined)
})
