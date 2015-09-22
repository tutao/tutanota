"use strict";

tutao.provide('tutao.util.ErrorFactory');

tutao.provide('tutao.AccessBlockedError');
tutao.provide('tutao.AccessDeactivatedError');
tutao.provide('tutao.AccessExpiredError');
tutao.provide('tutao.BadRequestError');
tutao.provide('tutao.InvalidDataError');
tutao.provide('tutao.InvalidSoftwareVersionError');
tutao.provide('tutao.LimitReachedError');
tutao.provide('tutao.MethodNotAllowedError');
tutao.provide('tutao.NotAuthenticatedError');
tutao.provide('tutao.NotAuthorizedError');
tutao.provide('tutao.NotFoundError');
tutao.provide('tutao.ResourceError');
tutao.provide('tutao.TechnicalError');
tutao.provide('tutao.TooManyRequestsError');
tutao.provide('tutao.ConnectionError');

tutao.util.ErrorFactory = function () {
};

/**
 * @param errorCode
 * @param {string=} message
 * @returns {*}
 */
tutao.util.ErrorFactory.prototype.handleRestError = function (errorCode, message) {
    switch (errorCode) {
        case 0:
            return new tutao.ConnectionError();
        case 472:
            return new tutao.AccessBlockedError();
        case 470:
            return new tutao.AccessDeactivatedError();
        case 471:
            return new tutao.AccessExpiredError();
        case 400:
            return new tutao.BadRequestError();
        case 473:
            return new tutao.InvalidDataError();
        case 474:
            return new tutao.InvalidSoftwareVersionError();
        case 475:
            return new tutao.LimitReachedError();
        case 405:
            return new tutao.MethodNotAllowedError();
        case 401:
            return new tutao.NotAuthenticatedError();
        case 403:
            return new tutao.NotAuthorizedError();
        case 404:
            return new tutao.NotFoundError();
        case 412:
            return new tutao.PreconditionFailedError();
        case 429:
            return new tutao.TooManyRequestsError();
        case 500:
            return new tutao.InternalServerError();
        case 502:
            return new tutao.BadGatewayError();
        default:
            return new tutao.ResourceError(errorCode + ":" + (typeof message == "string" ? message : ""));
    }
};


(function () {
    function createCustomError(message, name) {
        function RestError(param) {
            if (typeof param == "string") {
                this.message = param;
            } else {
                this.message = message;
            }
            this.name = name;
            if (Error.captureStackTrace) {
                Error.captureStackTrace(this, RestError);
            } else {
                var error = new Error();
                if (!error.stack){
                    // fill the stack trace on ios devices
                    try {
                        throw error;
                    } catch (e) {
                    }
                }
                this.stack = this.name + ". " + this.message;
                if (error.stack) { // not existing in IE9
                    this.stack += "\n" + error.stack.split("\n").slice(1).join("\n"); // removes first line from stack
                }
            }
        }
        RestError.prototype = Object.create(Error.prototype);
        RestError.prototype.constructor = RestError;
        return RestError;
    }

    tutao.BadGatewayError = createCustomError(502, "BadGatewayError");
    tutao.PreconditionFailedError = createCustomError(412, "PreconditionFailedError");
    tutao.AccessBlockedError = createCustomError(472, "AccessBlockedError");
    tutao.AccessDeactivatedError = createCustomError(470, "AccessDeactivatedError");
    tutao.AccessExpiredError = createCustomError(471, "AccessExpiredError");
    tutao.BadRequestError = createCustomError(400, "BadRequestError");
    tutao.InvalidDataError = createCustomError(473, "InvalidDataError");
    tutao.InvalidSoftwareVersionError = createCustomError(474, "InvalidSoftwareVersionError");
    tutao.LimitReachedError = createCustomError(475, "LimitReachedError");
    tutao.MethodNotAllowedError = createCustomError(405, "MethodNotAllowedError");
    tutao.NotAuthenticatedError = createCustomError(401, "NotAuthenticatedError");
    tutao.NotAuthorizedError = createCustomError(403, "NotAuthorizedError");
    tutao.NotFoundError = createCustomError(404, "NotFoundError");
    tutao.TooManyRequestsError = createCustomError(429, "TooManyRequestsError");
    tutao.ResourceError = createCustomError("", "ResourceError");
    tutao.ConnectionError = createCustomError("", "ConnectionError");
    tutao.InternalServerError = createCustomError("", "InternalServerError");
})();
