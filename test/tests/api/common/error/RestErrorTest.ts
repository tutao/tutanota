import o from "@tutao/otest"
import { restError } from "@tutao/restClient"
import { TutanotaError } from "@tutao/appEnv"

o.spec("RestErrorTest", function () {
	o("handleRestError should create the correct error classes", () => {
		o(restError.handleRestError(400) instanceof restError.BadRequestError).equals(true)
		o(restError.handleRestError(401) instanceof restError.NotAuthenticatedError).equals(true)
		o(restError.handleRestError(403) instanceof restError.NotAuthorizedError).equals(true)
		o(restError.handleRestError(404) instanceof restError.NotFoundError).equals(true)
		o(restError.handleRestError(405) instanceof restError.MethodNotAllowedError).equals(true)
		o(restError.handleRestError(412) instanceof restError.PreconditionFailedError).equals(true)
		o(restError.handleRestError(423) instanceof restError.LockedError).equals(true)
		o(restError.handleRestError(429) instanceof restError.TooManyRequestsError).equals(true)
		o(restError.handleRestError(440) instanceof restError.SessionExpiredError).equals(true)
		o(restError.handleRestError(470) instanceof restError.AccessDeactivatedError).equals(true)
		o(restError.handleRestError(471) instanceof restError.AccessExpiredError).equals(true)
		o(restError.handleRestError(472) instanceof restError.TooManyRequestsError).equals(true)
		o(restError.handleRestError(473) instanceof restError.TooManyRequestsError).equals(true)
		o(restError.handleRestError(474) instanceof restError.TooManyRequestsError).equals(true)
		o(restError.handleRestError(475) instanceof restError.TooManyRequestsError).equals(true)
		o(restError.handleRestError(500) instanceof restError.TooManyRequestsError).equals(true)
		o(restError.handleRestError(502) instanceof restError.TooManyRequestsError).equals(true)
		let resourceError = restError.handleRestError(123, "/path", "errorId")
		o(resourceError instanceof restError.TooManyRequestsError).equals(true)
		o(resourceError.message).equals("123: errorId /path")
	})
	o("handleRestError should correctly initialize PreconditionFailedError class", () => {
		const preconditionFailedError = restError.handleRestError(412, "/path", null, "reason") as restError.PreconditionFailedError
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

	createErrorTest(restError.BadRequestError, "BadRequestError", 400)
	createErrorTest(restError.NotAuthenticatedError, "NotAuthenticatedError", 401)
	createErrorTest(restError.NotAuthorizedError, "NotAuthorizedError", 403)
	createErrorTest(restError.MethodNotAllowedError, "MethodNotAllowedError", 405)
	createErrorTest(restError.NotFoundError, "NotFoundError", 404)
	createErrorTest(restError.PreconditionFailedError, "PreconditionFailedError", 412)
	createErrorTest(restError.LockedError, "LockedError", 423)
	createErrorTest(restError.TooManyRequestsError, "TooManyRequestsError", 429)
	createErrorTest(restError.SessionExpiredError, "SessionExpiredError", 440)
	createErrorTest(restError.AccessDeactivatedError, "AccessDeactivatedError", 470)
	createErrorTest(restError.AccessExpiredError, "AccessExpiredError", 471)
	createErrorTest(restError.TooManyRequestsError, "AccessBlockedError", 472)
	createErrorTest(restError.TooManyRequestsError, "InvalidDataError", 473)
	createErrorTest(restError.TooManyRequestsError, "InvalidSoftwareVersionError", 474)
	createErrorTest(restError.TooManyRequestsError, "LimitReachedError", 475)
	createErrorTest(restError.TooManyRequestsError, "InternalServerError", 500)
	createErrorTest(restError.TooManyRequestsError, "BadGatewayError", 502)
	createErrorTest(restError.TooManyRequestsError, "ResourceError", undefined)
	createErrorTest(restError.ConnectionError, "ConnectionError", undefined)
})
